import Inventory from "../models/Inventory.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Procurement from "../models/Procurement.js";
import mongoose from "mongoose";
import { generateInventoryCompletionPDF } from "../utils/pdfUtils.js";
import NotificationService from "../services/notificationService.js";
import { sendInventoryCompletionEmail } from "../services/emailService.js";
import { upload } from "../utils/fileUtils.js";
import { uploadMultipleDocuments } from "../middleware/upload.js";
import { UNIFIED_CATEGORIES } from "../constants/unifiedCategories.js";

// ============================================================================
// INVENTORY CONTROLLERS
// ============================================================================

// Note: Document uploads are now handled via the centralized /api/documents/upload endpoint

// @desc    Create inventory items from delivered procurement (standalone)
// @route   Internal function called by procurement controller
// @access  Internal
export const createInventoryFromProcurement = async (
  procurement,
  currentUser
) => {
  try {
    console.log(
      `📦 [INVENTORY] Creating inventory from standalone procurement: ${procurement.poNumber}`
    );

    const inventoryItems = [];

    // Create inventory items from procurement items
    for (const procurementItem of procurement.items) {
      const inventoryCount = await Inventory.countDocuments();
      const inventoryCode = `INV${String(inventoryCount + 1).padStart(4, "0")}`;

      // Map procurement category to valid inventory category using UNIFIED_CATEGORIES
      const getInventoryCategory = (procurementCategory) => {
        const categoryMap = {
          equipment_lease: "industrial_equipment",
          vehicle_lease: "passenger_vehicle",
          property_lease: "office_equipment", // Changed from office_space to valid category
          financial_lease: "office_equipment",
          training_equipment_lease: "office_equipment",
          compliance_lease: "office_equipment",
          service_equipment_lease: "industrial_equipment",
          strategic_lease: "industrial_equipment",
          software_development: "software_development",
          system_maintenance: "it_equipment",
          consulting: "office_equipment",
          training: "office_equipment",
          other: "other",
        };

        const mappedCategory =
          categoryMap[procurementCategory] || "office_equipment";

        // Ensure the mapped category exists in UNIFIED_CATEGORIES
        if (UNIFIED_CATEGORIES.includes(mappedCategory)) {
          return mappedCategory;
        }

        // Fallback to a valid category
        return "office_equipment";
      };

      const inventoryItem = {
        name: procurementItem.name,
        description: procurementItem.description,
        code: inventoryCode,
        type: "equipment",
        category: getInventoryCategory(procurement.category || "other"),
        status: "available",
        specifications: {
          brand: procurementItem.specifications?.brand || "TBD",
          model: procurementItem.specifications?.model || "TBD",
          year:
            procurementItem.specifications?.year || new Date().getFullYear(),
          deliveryTimeline:
            procurementItem.specifications?.deliveryTimeline || "TBD",
          procurementOrder: procurement.poNumber,
        },
        purchasePrice: procurementItem.totalPrice,
        currentValue: procurementItem.totalPrice,
        location: "TBD",
        procurementId: procurement._id,
        createdBy: currentUser._id,
        quantity: procurementItem.quantity,
        unitPrice: procurementItem.unitPrice,
        completionStatus: "pending", // Operations HOD needs to complete
      };

      inventoryItems.push(inventoryItem);
    }

    const createdItems = await Inventory.insertMany(inventoryItems);

    // Update procurement with created inventory items
    procurement.createdInventoryItems = createdItems.map((item) => item._id);
    await procurement.save();

    console.log(
      `✅ [INVENTORY] Created ${createdItems.length} inventory items from standalone procurement ${procurement.poNumber}`
    );

    // Send notifications to Project Management HOD, Creator, and Super Admin
    await notifyStakeholdersOfStandaloneInventoryCreation(
      procurement,
      createdItems,
      currentUser
    );

    return createdItems;
  } catch (error) {
    console.error(
      "❌ [INVENTORY] Error creating inventory from standalone procurement:",
      error
    );
    throw error;
  }
};

// Helper function to notify stakeholders of standalone inventory creation
const notifyStakeholdersOfStandaloneInventoryCreation = async (
  procurement,
  inventoryItems,
  triggeredBy
) => {
  try {
    console.log(
      `📢 [NOTIFICATION] Sending standalone inventory creation notifications for PO: ${procurement.poNumber}`
    );

    // Get Project Management HOD, Creator, and Super Admin
    const projectManagementHOD = await User.findOne({
      "role.name": "Project Management HOD",
      isActive: true,
    });

    const superAdmin = await User.findOne({
      "role.level": 1000,
      isActive: true,
    });

    const recipients = new Set();

    if (procurement.createdBy) {
      recipients.add(procurement.createdBy.toString());
    }

    // Add Project Management HOD
    if (projectManagementHOD) {
      recipients.add(projectManagementHOD._id.toString());
    }

    // Add Super Admin
    if (superAdmin) {
      recipients.add(superAdmin._id.toString());
    }

    // Create notification for each recipient
    for (const recipientId of recipients) {
      await NotificationService.createNotification({
        recipient: recipientId,
        type: "inventory_created",
        title: "New Inventory Items Created",
        message: `${inventoryItems.length} inventory items have been created from standalone procurement order ${procurement.poNumber}. Operations HOD needs to complete the inventory setup.`,
        relatedEntity: {
          type: "procurement",
          id: procurement._id,
        },
        createdBy: triggeredBy._id,
      });
    }

    console.log(
      `✅ [NOTIFICATION] Sent standalone inventory creation notifications to ${recipients.size} recipients`
    );
  } catch (error) {
    console.error(
      "❌ [NOTIFICATION] Error sending standalone inventory creation notifications:",
      error
    );
  }
};

// @desc    Get all inventory (with role-based filtering)
// @route   GET /api/inventory
// @access  Private (HOD+)
export const getAllInventory = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // SUPER_ADMIN (1000) - see all inventory across all departments
    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [INVENTORY] Super Admin - showing all inventory across all departments"
      );
    }
    // HOD (700) - see inventory in their department
    else if (currentUser.role.level >= 700) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view inventory",
        });
      }

      query.company = currentUser.company;
      console.log(
        "🔍 [INVENTORY] HOD - showing inventory for department:",
        currentUser.department.name
      );
    }
    // STAFF (300) - see inventory they manage
    else if (currentUser.role.level >= 300) {
      query.assignedTo = currentUser._id;
      console.log("🔍 [INVENTORY] Staff - showing assigned inventory only");
    }
    // Others - no access
    else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions to view inventory.",
      });
    }

    const inventory = await Inventory.find(query)
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName")
      .populate("project", "name category")
      .populate("documents", "title filename mimeType size type uploadedAt")
      .populate({
        path: "procurementId",
        select: "poNumber deliveryAddress supplier",
        populate: {
          path: "relatedProject",
          select: "name code category",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: inventory,
      total: inventory.length,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Get all inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory",
      error: error.message,
    });
  }
};

// @desc    Get inventory by ID
// @route   GET /api/inventory/:id
// @access  Private (HOD+)
export const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const inventory = await Inventory.findById(id)
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName")
      .populate("project", "name category")
      .populate("documents", "title filename mimeType size type uploadedAt")
      .populate({
        path: "procurementId",
        select: "poNumber deliveryAddress supplier",
        populate: {
          path: "relatedProject",
          select: "name code category",
        },
      })
      .populate("notes.addedBy", "firstName lastName");

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkInventoryAccess(currentUser, inventory);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to view this inventory item.",
      });
    }

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Get inventory by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory item",
      error: error.message,
    });
  }
};

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private (HOD+)
export const createInventory = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user can create inventory
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HOD and above can create inventory items.",
      });
    }

    const inventoryData = {
      ...req.body,
      createdBy: currentUser._id,
      company: currentUser.company,
    };

    const inventory = new Inventory(inventoryData);
    await inventory.save();

    // Populate the created inventory
    await inventory.populate("createdBy", "firstName lastName");
    await inventory.populate("project", "name category");

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: inventory,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Create inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating inventory item",
      error: error.message,
    });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (HOD+)
export const updateInventory = async (req, res) => {
  try {
    // Essential log: Form data received
    console.log("📝 [FORM DATA] Received from frontend:", {
      itemCode: req.body.code || "N/A",
      isCompletion: req.body.isCompletion,
      isEdit: req.body.isEdit,
      documentCount: req.body.documents?.length || 0,
      hasSpecifications: !!req.body.specifications,
      hasDeliveryInfo: !!req.body.deliveryInfo,
      hasReceivedBy: !!req.body.receivedBy,
      hasReceivedDate: !!req.body.receivedDate,
    });

    // DETAILED DOCUMENT LOGGING
    console.log("📄 [DOCUMENTS] Raw documents from frontend:", {
      documents: req.body.documents,
      documentsType: typeof req.body.documents,
      documentsLength: req.body.documents?.length,
      documentsArray: Array.isArray(req.body.documents),
    });

    if (req.body.documents && req.body.documents.length > 0) {
      console.log("📄 [DOCUMENTS] Document details:");
      req.body.documents.forEach((doc, index) => {
        console.log(`📄 [DOCUMENT ${index + 1}]:`, {
          type: typeof doc,
          hasId: !!doc._id,
          hasFile: !!doc.file,
          id: doc._id,
          name: doc.name,
          file: doc.file
            ? {
                name: doc.file.name,
                size: doc.file.size,
                type: doc.file.type,
              }
            : null,
          fullDoc: doc,
        });
      });
    }

    const { id } = req.params;
    const currentUser = req.user;
    const updateData = req.body;

    const inventory = await Inventory.findById(id)
      .populate(
        "project",
        "name code category budget projectManager createdBy projectScope"
      )
      .populate(
        "procurementId",
        "poNumber supplier deliveryAddress totalAmount"
      );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Check if this is a completion update (has required completion fields)
    const isCompletion =
      updateData.specifications?.brand &&
      updateData.specifications?.model &&
      (updateData.deliveryCondition || updateData.deliveryInfo?.condition) &&
      updateData.receivedBy &&
      updateData.receivedDate;

    const isEdit = inventory.completionStatus === "completed" && isCompletion;

    // Check access permissions
    console.log("🔐 [INVENTORY UPDATE] Checking access permissions...");
    let canEdit;

    if (isCompletion) {
      canEdit = currentUser.role.level >= 700;
      console.log("🔐 [INVENTORY UPDATE] Completion access check:", {
        isCompletion: true,
        userRole: currentUser.role?.name,
        userLevel: currentUser.role?.level,
        canEdit,
      });
    } else {
      // For regular edits, use the normal access check
      canEdit = await checkInventoryEditAccess(currentUser, inventory);
      console.log("🔐 [INVENTORY UPDATE] Regular edit access check:", {
        isCompletion: false,
        canEdit,
        userRole: currentUser.role?.name,
        userLevel: currentUser.role?.level,
        userDepartment: currentUser.department?._id,
        inventoryDepartment: inventory.department,
        inventoryAssignedTo: inventory.assignedTo,
        inventoryCreatedBy: inventory.createdBy,
      });
    }

    if (!canEdit) {
      console.log(
        "❌ [INVENTORY UPDATE] Access denied for user:",
        currentUser._id
      );
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to edit this inventory item.",
      });
    }

    let pdfBuffer = null;
    let pdfDocument = null;

    if (isCompletion) {
      console.log(
        `📄 [INVENTORY] ${
          isEdit ? "Regenerating" : "Generating"
        } completion PDF for: ${inventory.code}...`
      );
      console.log(`📄 [INVENTORY] PDF Generation Details:`, {
        inventoryCode: inventory.code,
        inventoryName: inventory.name,
        projectId: inventory.project,
        procurementId: inventory.procurementId,
        completedBy: currentUser.username,
        completedAt: new Date().toISOString(),
        specifications: updateData.specifications,
        deliveryInfo: {
          condition: updateData.deliveryCondition,
          receivedBy: updateData.receivedBy,
          receivedDate: updateData.receivedDate,
        },
        maintenanceInfo: updateData.maintenance,
        documentCount: updateData.documents?.length || 0,
      });

      try {
        // Generate PDF
        pdfBuffer = await generateInventoryCompletionPDF(
          { ...inventory.toObject(), ...updateData },
          inventory.project,
          inventory.procurementId,
          currentUser
        );

        const timestamp = new Date().toISOString().split("T")[0];
        const filename = isEdit
          ? `Inventory_Completion_${inventory.code}_${timestamp}_Updated.pdf`
          : `Inventory_Completion_${inventory.code}_${timestamp}.pdf`;

        const fs = await import("fs");
        const path = await import("path");
        const uploadsDir = path.join(process.cwd(), "uploads", "documents");

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, pdfBuffer);

        // Create Document record for the PDF
        const Document = mongoose.model("Document");
        const pdfDocumentRecord = new Document({
          title: `Inventory Completion Certificate - ${inventory.code}`,
          description: `Completion certificate for inventory item ${inventory.code}`,
          fileName: filename,
          originalFileName: filename,
          fileUrl: filePath.replace(/\\/g, "/"),
          fileSize: pdfBuffer.length,
          mimeType: "application/pdf",
          documentType: "report",
          category: "administrative",
          status: "approved",
          createdBy: currentUser._id,
          uploadedBy: currentUser._id,
          isActive: true,
          metadata: {
            inventoryCode: inventory.code,
            inventoryName: inventory.name,
            generatedAt: new Date(),
            type: "completion_certificate",
          },
        });

        const savedPdfDocument = await pdfDocumentRecord.save();
        console.log(
          `✅ [INVENTORY] PDF Document saved to database: ${savedPdfDocument._id}`
        );

        pdfDocument = {
          _id: savedPdfDocument._id,
          name: filename,
          type: "completion_certificate",
          filename: filename,
          path: `/uploads/${filename}`,
          uploadedAt: new Date(),
          uploadedBy: currentUser._id,
          size: pdfBuffer.length,
          contentType: "application/pdf",
        };

        console.log(
          `✅ [INVENTORY] PDF generated successfully for: ${inventory.code}`
        );
        console.log(
          `   - PDF Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`
        );
        console.log(`   - PDF Filename: ${pdfDocument.name}`);
        console.log(`   - PDF Type: ${pdfDocument.type}`);
        console.log(
          `   - Generated At: ${pdfDocument.uploadedAt.toISOString()}`
        );
      } catch (pdfError) {
        console.error(
          `❌ [INVENTORY] PDF generation failed for: ${inventory.code}:`,
          pdfError
        );
        console.error(`❌ [INVENTORY] PDF Error Details:`, {
          error: pdfError.message,
          stack: pdfError.stack,
          inventoryCode: inventory.code,
        });
      }
    }

    // Essential log: What's being saved
    console.log("💾 [SAVING] Data being saved to database:", {
      specifications: updateData.specifications ? "✅" : "❌",
      location: updateData.location ? "✅" : "❌",
      deliveryInfo:
        updateData.deliveryCondition || updateData.receivedBy ? "✅" : "❌",
      notes: updateData.notes?.length > 0 ? "✅" : "❌",
      documents: updateData.documents?.length || 0,
      maintenance: updateData.maintenance ? "✅" : "❌",
    });

    // Prepare update data - only include fields that should be updated
    const updateFields = {
      updatedBy: currentUser._id,
    };

    // Handle completion/update fields consistently
    if (isCompletion) {
      // Only set completion status for new completions, not edits
      if (inventory.completionStatus !== "completed") {
        updateFields.completionStatus = "completed";
        updateFields.completedAt = new Date();
        updateFields.completedBy = currentUser._id;
      }
    }

    // Update all fields according to the model structure
    if (updateData.specifications) {
      updateFields.specifications = {
        ...inventory.specifications,
        ...updateData.specifications,
      };
    }
    if (updateData.location !== undefined) {
      updateFields.location = updateData.location;
    }
    if (updateData.deliveryCondition !== undefined) {
      updateFields.deliveryCondition = updateData.deliveryCondition;
    }
    if (updateData.receivedBy !== undefined) {
      updateFields.receivedBy = updateData.receivedBy;
    }
    if (updateData.receivedDate !== undefined) {
      updateFields.receivedDate = updateData.receivedDate;
    }
    if (updateData.notes !== undefined) {
      updateFields.notes = updateData.notes.map((note) => ({
        ...note,
        addedBy: note.addedBy || currentUser._id,
      }));
    }
    if (updateData.documents !== undefined) {
      console.log("📄 [DOCUMENTS] Processing documents for database update:");
      console.log("📄 [DOCUMENTS] Input documents:", updateData.documents);

      const documentIds = [];

      for (const doc of updateData.documents) {
        console.log("📄 [DOCUMENT] Processing individual document:", {
          doc,
          type: typeof doc,
          hasId: !!doc._id,
          isString: typeof doc === "string",
        });

        if (typeof doc === "string") {
          documentIds.push(doc);
          console.log("📄 [DOCUMENT] Added string ID:", doc);
        } else if (doc._id) {
          documentIds.push(doc._id);
          console.log("📄 [DOCUMENT] Added object ID:", doc._id);
        } else {
          console.log("📄 [DOCUMENT] Skipped document (no valid ID):", doc);
        }
      }

      if (pdfDocument && pdfDocument._id) {
        documentIds.push(pdfDocument._id);
        console.log(
          `✅ [INVENTORY] Added PDF document to inventory: ${pdfDocument._id}`
        );
      }

      console.log(
        "📄 [DOCUMENTS] Final document IDs for database:",
        documentIds
      );
      updateFields.documents = documentIds;
    } else if (pdfDocument && pdfDocument._id) {
      updateFields.documents = [pdfDocument._id];
      console.log(
        `✅ [INVENTORY] Added PDF document to inventory (no other docs): ${pdfDocument._id}`
      );
    }
    if (updateData.maintenance) {
      updateFields.maintenance = {
        ...(inventory.maintenance || {}),
        ...updateData.maintenance,
      };
    }

    const updatedInventory = await Inventory.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName")
      .populate("documents", "title filename mimeType size type uploadedAt")
      .populate(
        "project",
        "name code category budget projectManager createdBy projectScope"
      )
      .populate(
        "procurementId",
        "poNumber supplier deliveryAddress totalAmount"
      );

    console.log("✅ [SAVED] Inventory data saved successfully:", {
      itemCode: updatedInventory.code,
      completionStatus: updatedInventory.completionStatus,
      documentsCount: updatedInventory.documents?.length || 0,
    });

    if (isCompletion) {
      if (pdfBuffer) {
        console.log("📄 [PDF] Generated successfully:", {
          size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
          filename: `Inventory_Completion_${updatedInventory.code}_${
            new Date().toISOString().split("T")[0]
          }.pdf`,
        });
      }

      console.log("📧 [NOTIFICATIONS] Sending completion notifications...");

      await sendInventoryCompletionNotifications(
        updatedInventory,
        currentUser,
        pdfBuffer,
        isEdit
      );

      if (updatedInventory.project?.requiresBudgetAllocation) {
        console.log(
          "🚀 [IMPLEMENTATION] Setting project to implementation status:",
          {
            projectCode: updatedInventory.project.code,
            projectName: updatedInventory.project.name,
            status: "implementation",
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: isEdit
        ? "Inventory item updated successfully"
        : isCompletion
        ? "Inventory item completed successfully"
        : "Inventory item updated successfully",
      data: updatedInventory,
      pdfGenerated: !!pdfBuffer,
      pdfSize: pdfBuffer ? pdfBuffer.length : 0,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Update inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating inventory item",
      error: error.message,
    });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (HOD+)
export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Check access permissions
    const canDelete = await checkInventoryDeleteAccess(currentUser, inventory);
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to delete this inventory item.",
      });
    }

    // Soft delete
    inventory.isActive = false;
    inventory.updatedBy = currentUser._id;
    await inventory.save();

    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Delete inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting inventory item",
      error: error.message,
    });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private (HOD+)
export const getInventoryStats = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        query.company = currentUser.company;
      } else {
        query.assignedTo = currentUser._id;
      }
    }

    const stats = await Inventory.getInventoryStats(currentUser.company);
    const totalItems = await Inventory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        stats,
        totalItems,
      },
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory statistics",
      error: error.message,
    });
  }
};

// @desc    Get available items
// @route   GET /api/inventory/available
// @access  Private (HOD+)
export const getAvailableItems = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true, status: "available" };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        query.company = currentUser.company;
      } else {
        query.assignedTo = currentUser._id;
      }
    }

    const availableItems = await Inventory.getAvailableItems(
      currentUser.company
    );

    res.status(200).json({
      success: true,
      data: availableItems,
      total: availableItems.length,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Get available items error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available items",
      error: error.message,
    });
  }
};

// @desc    Get items by type
// @route   GET /api/inventory/type/:type
// @access  Private (HOD+)
export const getByType = async (req, res) => {
  try {
    const { type } = req.params;
    const currentUser = req.user;
    let query = { isActive: true, type };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        query.company = currentUser.company;
      } else {
        query.assignedTo = currentUser._id;
      }
    }

    const items = await Inventory.getByType(currentUser.company, type);

    res.status(200).json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Get by type error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching items by type",
      error: error.message,
    });
  }
};

// @desc    Get maintenance due items
// @route   GET /api/inventory/maintenance-due
// @access  Private (HOD+)
export const getMaintenanceDue = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        query.company = currentUser.company;
      } else {
        query.assignedTo = currentUser._id;
      }
    }

    const maintenanceDueItems = await Inventory.getMaintenanceDue(
      currentUser.company
    );

    res.status(200).json({
      success: true,
      data: maintenanceDueItems,
      total: maintenanceDueItems.length,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Get maintenance due error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching maintenance due items",
      error: error.message,
    });
  }
};

// @desc    Add maintenance record
// @route   POST /api/inventory/:id/maintenance
// @access  Private (HOD+)
export const addMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Check access permissions
    const canEdit = await checkInventoryEditAccess(currentUser, inventory);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to manage this inventory item.",
      });
    }

    await inventory.addMaintenanceRecord(req.body);

    res.status(200).json({
      success: true,
      message: "Maintenance record added successfully",
      data: inventory,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Add maintenance record error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding maintenance record",
      error: error.message,
    });
  }
};

// @desc    Add note to inventory
// @route   POST /api/inventory/:id/notes
// @access  Private (HOD+)
export const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isPrivate = false } = req.body;
    const currentUser = req.user;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkInventoryAccess(currentUser, inventory);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to access this inventory item.",
      });
    }

    await inventory.addNote(content, currentUser._id, isPrivate);

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: inventory,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Add note error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding note",
      error: error.message,
    });
  }
};

// @desc    Update inventory status
// @route   PATCH /api/inventory/:id/status
// @access  Private (HOD+)
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUser = req.user;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Check access permissions
    const canEdit = await checkInventoryEditAccess(currentUser, inventory);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to update this inventory item.",
      });
    }

    await inventory.updateStatus(status, currentUser._id);

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: inventory,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Check if user has access to view inventory
const checkInventoryAccess = async (user, inventory) => {
  // SUPER_ADMIN can access everything
  if (user.role.level >= 1000) return true;

  // HOD can access all inventory (Operations HOD specifically)
  if (user.role.level >= 700) {
    return true;
  }

  // STAFF can access inventory they're assigned to
  if (user.role.level >= 300) {
    return (
      inventory.assignedTo &&
      inventory.assignedTo.toString() === user._id.toString()
    );
  }

  return false;
};

// Check if user can edit inventory
const checkInventoryEditAccess = async (user, inventory) => {
  console.log("🔍 [ACCESS CHECK] Starting access check:", {
    userRole: user.role?.name,
    userLevel: user.role?.level,
    userDepartment: user.department?._id,
    inventoryDepartment: inventory.department,
    inventoryAssignedTo: inventory.assignedTo,
    inventoryCreatedBy: inventory.createdBy,
  });

  if (user.role.level >= 1000) {
    console.log("✅ [ACCESS CHECK] SUPER_ADMIN access granted");
    return true;
  }

  if (user.role.level >= 700) {
    const sameDepartment =
      inventory.department &&
      user.department &&
      inventory.department.toString() === user.department.toString();

    const isAssigned =
      inventory.assignedTo &&
      inventory.assignedTo.toString() === user._id.toString();

    const isCreator = inventory.createdBy.toString() === user._id.toString();

    console.log("🔍 [ACCESS CHECK] HOD level checks:", {
      sameDepartment,
      isAssigned,
      isCreator,
      result: sameDepartment || isAssigned || isCreator,
    });

    return sameDepartment || isAssigned || isCreator;
  }

  // STAFF can only edit inventory they're assigned to
  if (user.role.level >= 300) {
    const isAssigned =
      inventory.assignedTo &&
      inventory.assignedTo.toString() === user._id.toString();

    console.log("🔍 [ACCESS CHECK] STAFF level check:", {
      isAssigned,
      result: isAssigned,
    });

    return isAssigned;
  }

  console.log("❌ [ACCESS CHECK] No access granted - insufficient role level");
  return false;
};

// Check if user can delete inventory
const checkInventoryDeleteAccess = async (user, inventory) => {
  // SUPER_ADMIN can delete everything
  if (user.role.level >= 1000) return true;

  // HOD can delete inventory they created or manage
  if (user.role.level >= 700) {
    return (
      inventory.createdBy.toString() === user._id.toString() ||
      (inventory.department &&
        user.department &&
        inventory.department.toString() === user.department.toString())
    );
  }

  return false;
};

// ============================================================================
// PROJECT-SPECIFIC INVENTORY WORKFLOW CONTROLLERS
// ============================================================================

// @desc    Get project inventory workflow data
// @route   GET /api/inventory/project/:projectId/workflow
// @access  Private (Operations HOD+)
export const getProjectInventoryWorkflow = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Verify user is Operations HOD
    if (
      currentUser.department?.name !== "Operations" ||
      currentUser.role.level < 700
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Operations HOD can access project inventory workflow.",
      });
    }

    // Get project details
    const Project = await import("../models/Project.js");
    const project = await Project.default
      .findById(projectId)
      .populate("createdBy", "firstName lastName email")
      .populate("department", "name");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const projectInventory = await Inventory.find({
      project: projectId,
      isActive: true,
    }).populate("assignedTo", "firstName lastName");

    const totalAllocated = projectInventory.reduce(
      (sum, item) => sum + (item.purchasePrice || 0),
      0
    );
    const remainingBudget = project.budget - totalAllocated;

    const workflowData = {
      project: {
        _id: project._id,
        code: project.code,
        name: project.name,
        budget: project.budget,
        category: project.category,
        progress: project.progress,
        status: project.status,
        createdBy: project.createdBy,
        department: project.department,
      },
      inventory: {
        items: projectInventory,
        totalItems: projectInventory.length,
        totalAllocated: totalAllocated,
        remainingBudget: remainingBudget,
        budgetUtilization:
          project.budget > 0 ? (totalAllocated / project.budget) * 100 : 0,
      },
      workflow: {
        inventoryCreated: project.workflowTriggers?.inventoryCreated || false,
        inventoryCompleted:
          project.workflowTriggers?.inventoryCompleted || false,
        canComplete:
          project.workflowTriggers?.inventoryCreated &&
          !project.workflowTriggers?.inventoryCompleted,
        nextPhase: "procurement",
      },
    };

    res.status(200).json({
      success: true,
      data: workflowData,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Get project workflow error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project inventory workflow",
      error: error.message,
    });
  }
};

// @desc    Create equipment for specific project
// @route   POST /api/inventory/project/:projectId/equipment
// @access  Private (Operations HOD+)
export const createProjectEquipment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const equipmentData = req.body;

    // Verify user is Operations HOD
    if (
      currentUser.department?.name !== "Operations" ||
      currentUser.role.level < 700
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Operations HOD can create project equipment.",
      });
    }

    // Verify project exists and is in correct phase
    const Project = await import("../models/Project.js");
    const project = await Project.default.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.workflowTriggers?.inventoryCreated) {
      return res.status(400).json({
        success: false,
        message: "Project inventory phase has not been initiated yet.",
      });
    }

    // Create inventory item linked to project
    const inventoryItem = new Inventory({
      ...equipmentData,
      project: projectId,
      createdBy: currentUser._id,
      isActive: true,
    });

    await inventoryItem.save();

    res.status(201).json({
      success: true,
      message: "Equipment created successfully for project",
      data: inventoryItem,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Create project equipment error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating project equipment",
      error: error.message,
    });
  }
};

// @desc    Allocate budget for project equipment
// @route   POST /api/inventory/project/:projectId/budget
// @access  Private (Operations HOD+)
export const allocateProjectBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const { equipmentId, allocatedAmount } = req.body;

    // Verify user is Operations HOD
    if (
      currentUser.department?.name !== "Operations" ||
      currentUser.role.level < 700
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Operations HOD can allocate project budget.",
      });
    }

    // Update equipment with allocated budget
    const inventoryItem = await Inventory.findById(equipmentId);
    if (!inventoryItem || inventoryItem.project.toString() !== projectId) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found for this project",
      });
    }

    inventoryItem.purchasePrice = allocatedAmount;
    inventoryItem.currentValue = allocatedAmount;
    await inventoryItem.save();

    res.status(200).json({
      success: true,
      message: "Budget allocated successfully",
      data: inventoryItem,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Allocate budget error:", error);
    res.status(500).json({
      success: false,
      message: "Error allocating budget",
      error: error.message,
    });
  }
};

// @desc    Assign locations for project equipment
// @route   POST /api/inventory/project/:projectId/locations
// @access  Private (Operations HOD+)
export const assignProjectLocations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const { equipmentId, location, specifications } = req.body;

    // Verify user is Operations HOD
    if (
      currentUser.department?.name !== "Operations" ||
      currentUser.role.level < 700
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Operations HOD can assign project locations.",
      });
    }

    // Update equipment with location and specifications
    const inventoryItem = await Inventory.findById(equipmentId);
    if (!inventoryItem || inventoryItem.project.toString() !== projectId) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found for this project",
      });
    }

    inventoryItem.location = location;
    inventoryItem.specifications = specifications;
    await inventoryItem.save();

    res.status(200).json({
      success: true,
      message: "Location assigned successfully",
      data: inventoryItem,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Assign location error:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning location",
      error: error.message,
    });
  }
};

// @desc    Complete project inventory phase
// @route   POST /api/inventory/project/:projectId/complete
// @access  Private (Operations HOD+)
export const completeProjectInventory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Verify user is Operations HOD
    if (
      currentUser.department?.name !== "Operations" ||
      currentUser.role.level < 700
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Operations HOD can complete project inventory.",
      });
    }

    // Use the existing completeInventory method from Project model
    const Project = await import("../models/Project.js");
    const project = await Project.default.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.completeInventory(currentUser._id);

    res.status(200).json({
      success: true,
      message: "Project inventory phase completed successfully",
      data: {
        projectId: project._id,
        projectCode: project.code,
        projectName: project.name,
        inventoryCompleted: true,
        completedAt: project.workflowTriggers.inventoryCompletedAt,
        completedBy: currentUser._id,
        currentProgress: project.progress,
      },
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Complete project inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error completing project inventory",
      error: error.message,
    });
  }
};

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Send notifications for inventory completion
 * @param {Object} inventory - Completed inventory item
 * @param {Object} currentUser - User who completed the inventory
 * @param {Buffer} pdfBuffer - Generated PDF buffer
 */
const sendInventoryCompletionNotifications = async (
  inventory,
  currentUser,
  pdfBuffer,
  isEdit = false
) => {
  try {
    console.log(
      `📧 [INVENTORY] Sending completion notifications for: ${inventory.code}...`
    );
    console.log(`📧 [INVENTORY] Notification Details:`, {
      inventoryCode: inventory.code,
      inventoryName: inventory.name,
      completedBy: currentUser.username,
      completedAt: new Date().toISOString(),
      hasPDF: !!pdfBuffer,
      pdfSize: pdfBuffer ? `${(pdfBuffer.length / 1024).toFixed(2)} KB` : "N/A",
    });

    // Get project data
    const project = inventory.project;
    if (!project) {
      console.log("⚠️ [INVENTORY] No project found for inventory item");
      return;
    }

    const usersToNotify = [];

    // 1. Super Admin (role level 1000)
    const superAdmins = await User.find({
      "role.level": 1000,
      isActive: true,
    })
      .populate("role", "name level")
      .populate("department", "name code");

    // Essential log: Super Admin check
    console.log("👑 [SUPER ADMIN] Found users:", {
      count: superAdmins.length,
      users: superAdmins.map((u) => ({
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        roleLevel: u.role?.level,
      })),
    });

    // 2. Project Manager (the person assigned as projectManager in the project)
    let projectManager = null;
    if (project.projectManager) {
      projectManager = await User.findById(project.projectManager)
        .populate("role")
        .populate("department");
    }

    // 3. Project Owner (createdBy)
    const projectOwner = await User.findById(project.createdBy)
      .populate("role")
      .populate("department");

    // 4. Project Management HOD (always notify for inventory completion)
    let projectManagementHOD = null;
    const projectMgmtDept = await mongoose.model("Department").findOne({
      name: "Project Management",
    });

    if (projectMgmtDept) {
      projectManagementHOD = await User.findOne({
        department: projectMgmtDept._id,
        "role.level": 700,
        isActive: true,
      })
        .populate("role", "name level")
        .populate("department", "name code");

      // Essential log: Project Management HOD check
      console.log("📋 [PROJECT MANAGEMENT HOD] Found user:", {
        found: !!projectManagementHOD,
        user: projectManagementHOD
          ? {
              name: `${projectManagementHOD.firstName} ${projectManagementHOD.lastName}`,
              email: projectManagementHOD.email,
              roleLevel: projectManagementHOD.role?.level,
              department: projectManagementHOD.department?.name,
            }
          : null,
      });
    } else {
      console.log("❌ [PROJECT MANAGEMENT HOD] Department not found!");
    }

    // Add users to notification list (avoiding duplicates)
    const userIds = new Set();

    // Add Super Admins
    if (superAdmins.length > 0) {
      superAdmins.forEach((admin) => {
        if (!userIds.has(admin._id.toString())) {
          usersToNotify.push(admin);
          userIds.add(admin._id.toString());
        }
      });
    }

    // Add Project Manager (if not already added)
    if (projectManager && !userIds.has(projectManager._id.toString())) {
      usersToNotify.push(projectManager);
      userIds.add(projectManager._id.toString());
    }

    // Add Project Owner (if not already added)
    if (projectOwner && !userIds.has(projectOwner._id.toString())) {
      usersToNotify.push(projectOwner);
      userIds.add(projectOwner._id.toString());
    }

    // Add Project Management HOD (if not already added)
    if (
      projectManagementHOD &&
      !userIds.has(projectManagementHOD._id.toString())
    ) {
      usersToNotify.push(projectManagementHOD);
      userIds.add(projectManagementHOD._id.toString());
    }

    const uniqueUsers = usersToNotify;

    console.log(
      `📧 [INVENTORY] Found ${uniqueUsers.length} unique users to notify`
    );
    console.log(`📧 [INVENTORY] Project scope: ${project.projectScope}`);

    console.log(`📧 [INVENTORY] Role assignments:`);
    console.log(
      `   - Project manager: ${
        projectManager
          ? `${projectManager.firstName} ${projectManager.lastName}`
          : "None"
      }`
    );
    console.log(
      `   - Project owner: ${
        projectOwner
          ? `${projectOwner.firstName} ${projectOwner.lastName}`
          : "None"
      }`
    );
    console.log(
      `   - Project Management HOD: ${
        projectManagementHOD
          ? `${projectManagementHOD.firstName} ${projectManagementHOD.lastName}`
          : "None found"
      }`
    );
    console.log(`   - Super Admins: ${superAdmins.length} found`);

    // Log final notification list with roles
    console.log(`📧 [INVENTORY] Final notification list:`);
    uniqueUsers.forEach((user, index) => {
      const roles = [];
      if (
        superAdmins.some(
          (admin) => admin._id.toString() === user._id.toString()
        )
      )
        roles.push("Super Admin");
      if (
        projectManager &&
        projectManager._id.toString() === user._id.toString()
      )
        roles.push("Project Manager");
      if (projectOwner && projectOwner._id.toString() === user._id.toString())
        roles.push("Project Owner");
      if (
        projectManagementHOD &&
        projectManagementHOD._id.toString() === user._id.toString()
      )
        roles.push("Project Management HOD");

      console.log(
        `   ${index + 1}. ${user.firstName} ${user.lastName} (${
          user.email
        }) - Roles: ${roles.join(", ")}`
      );
    });

    const notificationService = new NotificationService();
    const notificationPromises = uniqueUsers.map(async (user) => {
      try {
        const isUpdate = inventory.completionStatus === "completed";
        await notificationService.createNotification({
          recipient: user._id,
          type: "INVENTORY_COMPLETION",
          title: isUpdate
            ? "Inventory Item Updated"
            : "Inventory Item Completed",
          message: isUpdate
            ? `Inventory item "${inventory.name}" (${inventory.code}) has been updated for project "${project.name}" (${project.code}). Updated specifications and delivery details have been recorded.`
            : `Inventory item "${inventory.name}" (${inventory.code}) has been completed for project "${project.name}" (${project.code}). All specifications and delivery details have been recorded.`,
          priority: "high",
          data: {
            inventoryId: inventory._id,
            inventoryCode: inventory.code,
            inventoryName: inventory.name,
            projectId: project._id,
            projectName: project.name,
            projectCode: project.code,
            projectScope: project.projectScope,
            completedBy: currentUser._id,
            completedByName: `${currentUser.firstName} ${currentUser.lastName}`,
            completionDate: new Date(),
            hasPDF: !!pdfBuffer,
            actionUrl: "/dashboard/modules/inventory",
            workflowPhase: "inventory_completed",
          },
        });

        // Essential log: Notification sent
        console.log("📧 [NOTIFICATION] Sent to:", {
          recipient: `${user.firstName} ${user.lastName}`,
          email: user.email,
          type: "INVENTORY_COMPLETION",
          hasPDF: !!pdfBuffer,
        });

        // Send email notification with PDF attachment
        if (pdfBuffer) {
          try {
            const emailResult = await sendInventoryCompletionEmail(
              user.email,
              `${user.firstName} ${user.lastName}`,
              inventory,
              project,
              pdfBuffer,
              isEdit
            );

            if (emailResult.success) {
              // Essential log: Email sent
              console.log("📧 [EMAIL] Sent successfully:", {
                recipient: user.email,
                messageId: emailResult.messageId,
                hasPDF: true,
              });
            } else {
              console.error(
                `❌ [EMAIL] Failed to send to ${user.email}:`,
                emailResult.error
              );
            }
          } catch (emailError) {
            console.error(
              `❌ [INVENTORY] Email sending error for ${user.email}:`,
              emailError
            );
          }
        }
      } catch (notifError) {
        console.error(
          `❌ [INVENTORY] Failed to send notification to ${user.email}:`,
          notifError
        );
      }
    });

    await Promise.all(notificationPromises);

    console.log(
      `✅ [INVENTORY] All completion notifications sent successfully`
    );
    console.log(`✅ [INVENTORY] Notification Summary:`, {
      totalRecipients: uniqueUsers.length,
      inventoryCode: inventory.code,
      pdfAttached: !!pdfBuffer,
      pdfSize: pdfBuffer ? `${(pdfBuffer.length / 1024).toFixed(2)} KB` : "N/A",
      completedBy: currentUser.username,
      completionTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ [INVENTORY] Error sending completion notifications:",
      error
    );
  }
};

// @desc    Resend inventory completion notifications
// @route   POST /api/inventory/:id/resend-notifications
// @access  Private (HOD+)
export const resendInventoryNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    console.log(`📧 [RESEND] Resending notifications for inventory: ${id}`);

    // Get the completed inventory item
    const inventory = await Inventory.findById(id)
      .populate(
        "project",
        "name code category budget projectManager createdBy projectScope"
      )
      .populate(
        "procurementId",
        "poNumber supplier deliveryAddress totalAmount"
      );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Check if inventory is completed
    if (inventory.completionStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Inventory item is not completed yet",
      });
    }

    // Check access permissions (HOD+ can resend)
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and above can resend notifications.",
      });
    }

    // Find the completion PDF document
    const completionPDF = inventory.documents?.find(
      (doc) => doc.type === "completion_certificate"
    );

    if (!completionPDF) {
      return res.status(404).json({
        success: false,
        message: "Completion PDF not found. Cannot resend notifications.",
      });
    }

    console.log(`📧 [RESEND] Found completion PDF: ${completionPDF.name}`);

    // Get the PDF buffer (simulate reading the file)
    // In a real implementation, you'd read the actual file from storage
    const pdfBuffer = Buffer.from("PDF_CONTENT_PLACEHOLDER"); // This would be the actual PDF content

    // Send notifications using the existing function
    await sendInventoryCompletionNotifications(
      inventory,
      currentUser,
      pdfBuffer
    );

    console.log(
      `✅ [RESEND] Notifications resent successfully for: ${inventory.code}`
    );

    res.status(200).json({
      success: true,
      message: "Inventory completion notifications resent successfully",
      data: {
        inventoryCode: inventory.code,
        inventoryName: inventory.name,
        projectName: inventory.project?.name,
        projectCode: inventory.project?.code,
        pdfFound: !!completionPDF,
        pdfName: completionPDF?.name,
        resentBy: `${currentUser.firstName} ${currentUser.lastName}`,
        resentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [RESEND] Resend notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Error resending notifications",
      error: error.message,
    });
  }
};

// @desc    Get equipment categories for dropdowns
// @route   GET /api/inventory/categories
// @access  Private
export const getEquipmentCategories = async (req, res) => {
  try {
    const categories = [
      // Equipment categories
      { value: "construction_equipment", label: "Construction Equipment" },
      { value: "office_equipment", label: "Office Equipment" },
      { value: "medical_equipment", label: "Medical Equipment" },
      { value: "agricultural_equipment", label: "Agricultural Equipment" },
      { value: "industrial_equipment", label: "Industrial Equipment" },

      // Vehicle categories
      { value: "passenger_vehicle", label: "Passenger Vehicle" },
      { value: "commercial_vehicle", label: "Commercial Vehicle" },
      { value: "construction_vehicle", label: "Construction Vehicle" },
      { value: "agricultural_vehicle", label: "Agricultural Vehicle" },

      // Property categories
      { value: "office_space", label: "Office Space" },
      { value: "warehouse", label: "Warehouse" },
      { value: "residential", label: "Residential" },
      { value: "commercial_space", label: "Commercial Space" },

      // Other categories
      { value: "furniture", label: "Furniture" },
      { value: "electronics", label: "Electronics" },
      { value: "tools", label: "Tools" },
      { value: "other", label: "Other" },
    ];

    res.status(200).json({
      success: true,
      message: "Equipment categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.error("❌ [INVENTORY] Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving equipment categories",
      error: error.message,
    });
  }
};
