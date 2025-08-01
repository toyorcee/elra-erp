import Document from "../models/Document.js";
import User from "../models/User.js";
import {
  upload,
  formatFileSize,
  getFileExtension,
} from "../utils/fileUtils.js";
import {
  createDocumentMetadata,
  getDocumentType,
  generateDocRef,
} from "../utils/documentUtils.js";
import { hasPermission } from "../utils/permissionUtils.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";
import OCRService from "../services/ocrService.js";
import SearchService from "../services/searchService.js";
import ApprovalLevel from "../models/ApprovalLevel.js";

// Smart function to determine document status
const determineDocumentStatus = async (currentUser, category, department) => {
  try {
    // Check if any approval workflows are configured for this company
    const approvalWorkflows = await ApprovalLevel.find({
      company: currentUser.company?._id || currentUser.company,
      isActive: true,
    });

    // If no approval workflows exist, auto-approve the document
    if (!approvalWorkflows || approvalWorkflows.length === 0) {
      console.log(
        "✅ [documentController] No approval workflows found - auto-approving document"
      );
      return "APPROVED";
    }

    // Check if there's a specific workflow for this category/department
    const relevantWorkflow = approvalWorkflows.find(
      (workflow) =>
        (workflow.category === category || workflow.category === "ALL") &&
        (workflow.department === department || workflow.department === "ALL")
    );

    // If no specific workflow found, check for default workflow
    const defaultWorkflow = approvalWorkflows.find(
      (workflow) => workflow.category === "ALL" && workflow.department === "ALL"
    );

    const workflowToUse = relevantWorkflow || defaultWorkflow;

    if (workflowToUse) {
      console.log(
        `📋 [documentController] Found approval workflow: ${workflowToUse.name} - setting status to PENDING_APPROVAL`
      );
      return "PENDING_APPROVAL";
    } else {
      console.log(
        "✅ [documentController] No matching approval workflow found - auto-approving document"
      );
      return "APPROVED";
    }
  } catch (error) {
    console.error(
      "❌ [documentController] Error determining document status:",
      error
    );
    // Default to APPROVED if there's an error (safer than losing documents)
    return "APPROVED";
  }
};

// Upload document
export const uploadDocument = async (req, res) => {
  console.log("🚀 [documentController] Starting document upload process");
  console.log("👤 [documentController] User:", {
    id: req.user._id,
    username: req.user.username,
    role: req.user.role?.name,
    permissions: req.user.role?.permissions,
  });

  try {
    const currentUser = req.user;

    // Check if user has permission to upload documents
    if (!hasPermission(currentUser, "document.upload")) {
      console.log(
        "❌ [documentController] Permission denied for document upload"
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to upload documents",
      });
    }

    console.log("✅ [documentController] User has upload permission");

    // Use multer upload middleware
    upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const {
        title,
        description,
        category,
        documentType,
        priority,
        tags,
        department,
      } = req.body;

      console.log("[documentController] Incoming req.body:", req.body);
      console.log(
        "[documentController] Department value received:",
        department
      );

      console.log("📄 [documentController] File received:", {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        path: req.file.path,
      });

      // Process document with OCR for enhanced metadata
      let ocrMetadata = {};
      let extractedText = "";

      console.log("🔍 [documentController] Starting OCR processing...");
      try {
        const ocrResult = await OCRService.processDocument(
          req.file.path,
          req.file.mimetype,
          { language: "eng" }
        );

        console.log("📊 [documentController] OCR result:", {
          success: ocrResult.success,
          confidence: ocrResult.metadata?.confidence,
          documentType: ocrResult.metadata?.documentType,
          keywordsCount: ocrResult.metadata?.keywords?.length || 0,
        });

        if (ocrResult.success) {
          ocrMetadata = ocrResult.metadata;
          extractedText = ocrResult.extractedText;

          // Auto-classify document type if not provided
          if (!documentType && ocrMetadata.documentType) {
            documentType = ocrMetadata.documentType;
            console.log(
              "🏷️ [documentController] Auto-classified document type:",
              documentType
            );
          }

          // Auto-extract tags from keywords
          if (!tags && ocrMetadata.keywords) {
            tags = ocrMetadata.keywords.slice(0, 5).join(",");
            console.log("🏷️ [documentController] Auto-extracted tags:", tags);
          }
        }
      } catch (ocrError) {
        console.warn(
          "❌ [documentController] OCR processing failed, continuing with basic upload:",
          ocrError.message
        );
      }

      // Generate company-specific reference number
      const companyCode = currentUser.company?.code || "COMP";
      const reference = await generateDocRef(companyCode, currentUser._id);

      console.log(
        `[documentController] Generated reference: ${reference} for company: ${companyCode}`
      );

      const metadata = createDocumentMetadata(
        req.file,
        currentUser._id,
        category
      );

      // Create document with enhanced metadata
      const docData = {
        title,
        description,
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        documentType: documentType || "Other",
        category,
        priority: priority || "Medium",
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        uploadedBy: currentUser._id,
        company: currentUser.company?._id || currentUser.company,
        reference: reference,
        // Smart status determination based on approval workflow
        status: await determineDocumentStatus(
          currentUser,
          category,
          department
        ),
        // Enhanced metadata from OCR
        ocrData: {
          extractedText,
          confidence: ocrMetadata.confidence || 0,
          documentType: ocrMetadata.documentType,
          keywords: ocrMetadata.keywords || [],
          dateReferences: ocrMetadata.dateReferences || [],
          organizationReferences: ocrMetadata.organizationReferences || [],
          monetaryValues: ocrMetadata.monetaryValues || [],
          processingDate: new Date(),
          language: ocrMetadata.language || "eng",
        },
        // Document classification based on OCR
        classification: {
          autoClassified: !!ocrMetadata.documentType,
          confidence: ocrMetadata.confidence || 0,
          suggestedCategory: ocrMetadata.suggestedCategory,
          suggestedTags: ocrMetadata.keywords || [],
        },
      };
      if (department && department.trim() !== "") {
        docData.department = department;
      }
      const document = new Document(docData);

      // Add audit entry
      document.addAuditEntry(
        "UPLOADED",
        currentUser._id,
        "Document uploaded",
        req.ip
      );

      console.log("💾 [documentController] Saving document to database:", {
        title: document.title,
        reference: document.reference,
        category: document.category,
        documentType: document.documentType,
        priority: document.priority,
        status: document.status,
        fileSize: document.fileSize,
      });

      await document.save();

      console.log("✅ [documentController] Document saved successfully:", {
        documentId: document._id,
        reference: document.reference,
      });

      // Log document creation
      if (currentUser && currentUser._id) {
        console.log("📝 [documentController] Creating audit log entry");
        await AuditService.logDocumentAction(
          currentUser._id,
          "DOCUMENT_CREATED",
          document._id,
          {
            documentTitle: document.title,
            documentType: document.documentType,
            category: document.category,
            priority: document.priority,
            status: document.status,
            fileSize: document.fileSize,
            fileName: document.filename,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          }
        );
        console.log("✅ [documentController] Audit log created successfully");
      } else {
        console.error("❌ [documentController] No valid userId for audit log");
      }

      try {
        console.log(
          "📧 [documentController] Sending notification to document creator"
        );
        await NotificationService.sendDocumentUploadSuccessNotification(
          document._id,
          currentUser._id,
          document.title,
          document.documentType,
          document.category
        );
        console.log(
          "✅ [documentController] Creator notification sent successfully"
        );

        // Send appropriate notification based on document status
        if (document.status === "APPROVED") {
          console.log(
            "📧 [documentController] Sending auto-approval notification"
          );
          await NotificationService.sendDocumentAutoApprovalNotification(
            document._id,
            currentUser._id,
            document.title,
            document.documentType,
            document.category
          );
          console.log(
            "✅ [documentController] Auto-approval notification sent successfully"
          );
        } else if (document.status === "PENDING_APPROVAL") {
          console.log(
            "📧 [documentController] Sending approval request notification"
          );
          await NotificationService.sendDocumentApprovalRequestNotification(
            document._id,
            currentUser._id,
            document.title,
            document.documentType,
            document.category
          );
          console.log(
            "✅ [documentController] Approval request notification sent successfully"
          );
        }

        // Send OCR processing notification if OCR was successful
        if (ocrMetadata && ocrMetadata.confidence) {
          console.log(
            "📧 [documentController] Sending OCR processing notification"
          );
          await NotificationService.sendDocumentOCRProcessingNotification(
            document._id,
            currentUser._id,
            document.title,
            ocrMetadata.confidence,
            ocrMetadata.keywords || []
          );
          console.log(
            "✅ [documentController] OCR notification sent successfully"
          );
        }

        // Notify department members (if department is specified)
        if (document.department) {
          console.log(
            "📧 [documentController] Sending department notifications"
          );
          try {
            await NotificationService.sendDocumentUploadDepartmentNotification(
              document._id,
              document.department,
              document.title,
              document.documentType,
              document.category,
              currentUser.name || currentUser.username
            );
            console.log(
              "✅ [documentController] Department notifications sent successfully"
            );
          } catch (deptError) {
            console.warn(
              "⚠️ [documentController] Department notification failed:",
              deptError.message
            );
          }
        }

        // Notify admins and super admins (existing logic with updated service)
        let adminsToNotify = [];
        if (document.department) {
          adminsToNotify = await User.find({
            department: document.department,
            "role.level": { $gte: 80 },
            _id: { $ne: currentUser._id },
          });
        } else {
          adminsToNotify = await User.find({
            "role.level": { $gte: 80 },
            _id: { $ne: currentUser._id },
          });
        }

        if (adminsToNotify && adminsToNotify.length > 0) {
          console.log("📧 [documentController] Sending admin notifications");
          for (const admin of adminsToNotify) {
            const departmentInfo = document.department
              ? `in ${admin.department} department`
              : "across all departments";
            await NotificationService.createNotification({
              recipient: admin._id,
              type: "DOCUMENT_SUBMITTED",
              title: "New Document Uploaded",
              message: `${
                currentUser.name || currentUser.username
              } has uploaded "${document.title}" ${departmentInfo}.`,
              data: {
                documentId: document._id,
                actionUrl: `/documents/${document._id}`,
                priority: document.priority.toLowerCase(),
                senderId: currentUser._id,
                department: document.department || "General",
              },
            });
          }
          console.log(
            "✅ [documentController] Admin notifications sent successfully"
          );
        } else {
          console.warn(
            "[documentController] No admins to notify for this document upload."
          );
        }

        // If document is confidential, notify super admins
        if (document.isConfidential) {
          console.log(
            "📧 [documentController] Sending confidential document notifications"
          );
          const superAdmins = await User.find({
            "role.level": { $gte: 100 },
            _id: { $ne: currentUser._id },
          });

          for (const superAdmin of superAdmins) {
            await NotificationService.createNotification({
              recipient: superAdmin._id,
              type: "SYSTEM_ALERT",
              title: "Confidential Document Uploaded",
              message: `A confidential document "${
                document.title
              }" has been uploaded by ${
                currentUser.name || currentUser.username
              }.`,
              data: {
                documentId: document._id,
                actionUrl: `/documents/${document._id}`,
                priority: "high",
                senderId: currentUser._id,
              },
            });
          }
          console.log(
            "✅ [documentController] Confidential document notifications sent successfully"
          );
        }

        // Note: Creator notification is already sent above via NotificationService.sendDocumentUploadSuccessNotification
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Don't fail the upload if notifications fail
      }

      // Populate user info
      await document.populate("uploadedBy", "name email");
      const normalizedFilePath = document.filePath.replace(/\\/g, "/");
      const fileUrl = `${
        process.env.BASE_URL || "http://localhost:5000"
      }/${normalizedFilePath}`;

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: {
          id: document._id,
          title: document.title,
          reference: document.reference,
          filename: document.filename,
          fileSize: formatFileSize(document.fileSize),
          status: document.status,
          uploadedBy: document.uploadedBy.name,
          uploadDate: document.createdAt,
          fileUrl,
        },
      });
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};

// Get all documents (with role-based filtering)
export const getAllDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status, category, department, page = 1, limit = 10 } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view documents",
      });
    }

    let query = { isActive: true };

    // Filter by department if user is not admin/manager
    if (currentUser.role.level < 80) {
      query.department = currentUser.department;
    }

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (department && currentUser.role.level >= 80)
      query.department = department;

    const skip = (page - 1) * limit;

    const documents = await Document.find(query)
      .populate("uploadedBy", "name email")
      .populate("currentApprover", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};

// Get document by ID
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const document = await Document.findById(id)
      .populate("uploadedBy", "name email department")
      .populate("currentApprover", "name email")
      .populate("approvalChain.approver", "name email role");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user can access this document
    if (!document.canAccess(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this document",
      });
    }

    // Add view audit entry
    document.addAuditEntry(
      "VIEWED",
      currentUser._id,
      "Document viewed",
      req.ip
    );
    await document.save();

    // Log document view
    await AuditService.logDocumentAction(
      currentUser._id,
      "DOCUMENT_VIEWED",
      document._id,
      {
        documentTitle: document.title,
        documentType: document.documentType,
        category: document.category,
        priority: document.priority,
        status: document.status,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    const normalizedFilePath = document.filePath.replace(/\\/g, "/");
    const fileUrl = `${
      process.env.BASE_URL || "http://localhost:5000"
    }/${normalizedFilePath}`;

    res.json({
      success: true,
      data: {
        ...document.toObject(),
        fileUrl,
      },
    });
  } catch (error) {
    console.error("Get document by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch document",
    });
  }
};

// Submit document for approval
export const submitForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { approvers } = req.body; // Array of user IDs for approval chain

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user owns the document
    if (!document.uploadedBy.equals(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only submit your own documents for approval",
      });
    }

    // Validate approvers
    if (!approvers || approvers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one approver is required",
      });
    }

    // Build approval chain
    const approvalChain = [];
    for (let i = 0; i < approvers.length; i++) {
      const approver = await User.findById(approvers[i]);
      if (!approver) {
        return res.status(400).json({
          success: false,
          message: `Approver ${approvers[i]} not found`,
        });
      }

      approvalChain.push({
        level: i + 1,
        approver: approver._id,
        status: "PENDING",
        deadline: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // 24 hours per level
      });
    }

    document.approvalChain = approvalChain;
    document.currentApprover = approvers[0];
    document.status = "SUBMITTED";

    // Add audit entry
    document.addAuditEntry(
      "SUBMITTED",
      currentUser._id,
      "Document submitted for approval",
      req.ip
    );

    await document.save();

    // Log document submission for approval
    await AuditService.logDocumentAction(
      currentUser._id,
      "DOCUMENT_UPDATED",
      document._id,
      {
        documentTitle: document.title,
        documentType: document.documentType,
        category: document.category,
        priority: document.priority,
        previousStatus: "DRAFT",
        newStatus: document.status,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    await document.populate("currentApprover", "name email");

    res.json({
      success: true,
      message: "Document submitted for approval",
      data: {
        id: document._id,
        status: document.status,
        currentApprover: document.currentApprover.name,
        approvalChain: document.approvalChain.length,
      },
    });
  } catch (error) {
    console.error("Submit for approval error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit document for approval",
    });
  }
};

// Approve document
export const approveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { comments } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user is the current approver
    if (!document.currentApprover.equals(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not the current approver for this document",
      });
    }

    // Check if user has permission to approve
    if (!hasPermission(currentUser, "document.approve")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to approve documents",
      });
    }

    // Approve the document
    document.approve(currentUser._id, comments);

    // Check if there are more approvals needed
    const nextApprover = document.getNextApprover();
    if (nextApprover) {
      document.currentApprover = nextApprover;
      document.status = "UNDER_REVIEW";
    } else {
      document.status = "APPROVED";
      document.currentApprover = null;
    }

    await document.save();

    // Log document approval
    await AuditService.logDocumentAction(
      currentUser._id,
      "DOCUMENT_APPROVED",
      document._id,
      {
        documentTitle: document.title,
        documentType: document.documentType,
        category: document.category,
        priority: document.priority,
        previousStatus: "UNDER_REVIEW",
        newStatus: document.status,
        approvalComment: comments || "Approved",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    await document.populate("currentApprover", "name email");

    res.json({
      success: true,
      message: "Document approved successfully",
      data: {
        id: document._id,
        status: document.status,
        currentApprover: document.currentApprover
          ? document.currentApprover.name
          : null,
      },
    });
  } catch (error) {
    console.error("Approve document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve document",
    });
  }
};

// Reject document
export const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { comments } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user is the current approver
    if (!document.currentApprover.equals(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not the current approver for this document",
      });
    }

    // Check if user has permission to reject
    if (!hasPermission(currentUser, "document.reject")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reject documents",
      });
    }

    // Reject the document
    document.reject(currentUser._id, comments);

    await document.save();

    // Log document rejection
    await AuditService.logDocumentAction(
      currentUser._id,
      "DOCUMENT_REJECTED",
      document._id,
      {
        documentTitle: document.title,
        documentType: document.documentType,
        category: document.category,
        priority: document.priority,
        previousStatus: "UNDER_REVIEW",
        newStatus: document.status,
        approvalComment: comments || "Rejected",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      success: true,
      message: "Document rejected successfully",
      data: {
        id: document._id,
        status: document.status,
      },
    });
  } catch (error) {
    console.error("Reject document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject document",
    });
  }
};

// Get documents pending approval
export const getPendingApprovals = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to approve documents
    if (!hasPermission(currentUser, "document.approve")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to approve documents",
      });
    }

    const documents = await Document.find({
      currentApprover: currentUser._id,
      status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
      isActive: true,
    })
      .populate("uploadedBy", "name email department")
      .populate("approvalChain.approver", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending approvals",
    });
  }
};

// Delete document (soft delete)
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user can delete this document
    if (
      !document.uploadedBy.equals(currentUser._id) &&
      !hasPermission(currentUser, "document.delete")
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this document",
      });
    }

    // Soft delete
    document.isActive = false;
    document.addAuditEntry(
      "DELETED",
      currentUser._id,
      "Document deleted",
      req.ip
    );
    await document.save();

    // Log document deletion
    await AuditService.logDocumentAction(
      currentUser._id,
      "DOCUMENT_DELETED",
      document._id,
      {
        documentTitle: document.title,
        documentType: document.documentType,
        category: document.category,
        priority: document.priority,
        status: document.status,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};

// Enhanced search documents with OCR capabilities
export const searchDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const searchParams = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    const result = await SearchService.advancedSearch(
      searchParams,
      currentUser
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Search documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search documents",
    });
  }
};

// Full-text search within OCR extracted text
export const fullTextSearch = async (req, res) => {
  try {
    const currentUser = req.user;
    const { query, page = 1, limit = 20, minConfidence = 50 } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await SearchService.fullTextSearch(query, currentUser, {
      page: parseInt(page),
      limit: parseInt(limit),
      minConfidence: parseInt(minConfidence),
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Full-text search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform full-text search",
    });
  }
};

// Search by metadata (dates, organizations, monetary values)
export const metadataSearch = async (req, res) => {
  try {
    const currentUser = req.user;
    const searchParams = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    const result = await SearchService.metadataSearch(
      searchParams,
      currentUser
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Metadata search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform metadata search",
    });
  }
};

// Find similar documents
export const findSimilarDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { documentId } = req.params;
    const { limit = 10 } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    const result = await SearchService.findSimilarDocuments(
      documentId,
      currentUser,
      {
        limit: parseInt(limit),
      }
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Similar documents search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to find similar documents",
    });
  }
};

// Get search suggestions
export const getSearchSuggestions = async (req, res) => {
  try {
    const currentUser = req.user;
    const { query } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await SearchService.getSearchSuggestions(query, currentUser);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Search suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get search suggestions",
    });
  }
};

// Update document (edit)
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const updates = req.body;

    // Find document
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Only allow edit if not approved
    if (document.status === "APPROVED" || document.status === "FINALIZED") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit an approved or finalized document",
      });
    }

    // Check if user can edit (uploader, admin, or has permission)
    if (
      !document.uploadedBy.equals(currentUser._id) &&
      !hasPermission(currentUser, "document.edit")
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this document",
      });
    }

    // Allowed fields to update
    const allowedFields = [
      "title",
      "description",
      "category",
      "priority",
      "tags",
      "department",
    ];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        document[field] = updates[field];
      }
    });

    // Add audit entry
    document.addAuditEntry(
      "EDITED",
      currentUser._id,
      "Document edited",
      req.ip
    );
    await document.save();

    // Log document edit
    await AuditService.logDocumentAction(
      currentUser._id,
      "DOCUMENT_EDITED",
      document._id,
      {
        documentTitle: document.title,
        documentType: document.documentType,
        category: document.category,
        priority: document.priority,
        status: document.status,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      success: true,
      message: "Document updated successfully",
      data: document,
    });
  } catch (error) {
    console.error("Update document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update document",
    });
  }
};

// Process OCR for a document
export const processOCR = async (req, res) => {
  console.log("🔍 [documentController] Starting OCR processing");

  try {
    const currentUser = req.user;

    if (!hasPermission(currentUser, "document.upload")) {
      console.log(
        "❌ [documentController] Permission denied for OCR processing"
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to process documents",
      });
    }

    // Use multer upload middleware for OCR
    upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded for OCR processing",
        });
      }

      console.log("📄 [documentController] File received for OCR:", {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      try {
        const ocrResult = await OCRService.processDocument(
          req.file.path,
          req.file.mimetype,
          { language: "eng" }
        );

        console.log("📊 [documentController] OCR result:", {
          success: ocrResult.success,
          confidence: ocrResult.metadata?.confidence,
          documentType: ocrResult.metadata?.documentType,
          keywordsCount: ocrResult.metadata?.keywords?.length || 0,
        });

        if (ocrResult.success) {
          res.json({
            success: true,
            data: {
              extractedText: ocrResult.extractedText,
              confidence: ocrResult.metadata?.confidence || 0,
              documentType: ocrResult.metadata?.documentType || "Other",
              suggestedCategory:
                ocrResult.metadata?.suggestedCategory || "General",
              keywords: ocrResult.metadata?.keywords || [],
              dateReferences: ocrResult.metadata?.dateReferences || [],
              organizationReferences:
                ocrResult.metadata?.organizationReferences || [],
              monetaryValues: ocrResult.metadata?.monetaryValues || [],
              processingTime: ocrResult.metadata?.processingTime || "Unknown",
            },
          });
        } else {
          res.status(400).json({
            success: false,
            message: "OCR processing failed",
            error: ocrResult.error,
          });
        }
      } catch (ocrError) {
        console.error(
          "❌ [documentController] OCR processing error:",
          ocrError
        );
        res.status(500).json({
          success: false,
          message: "OCR processing failed",
          error: ocrError.message,
        });
      }
    });
  } catch (error) {
    console.error("❌ [documentController] OCR controller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process OCR",
      error: error.message,
    });
  }
};

// Get document metadata (classifications, categories, etc.)
export const getDocumentMetadata = async (req, res) => {
  try {
    console.log("📋 [documentController] Getting document metadata");

    // Import the classifications here to avoid circular dependencies
    const {
      default: documentClassifications,
      categories,
      documentTypes,
      documentSections,
      priorityLevels,
      documentStatuses,
    } = await import("../constants/documentClassifications.js");

    // Get department options from the Document model
    const departmentOptions = [
      "Finance",
      "HR",
      "Legal",
      "IT",
      "Operations",
      "Marketing",
      "Sales",
      "Executive",
      "External",
    ];

    const metadata = {
      success: true,
      data: {
        classifications: documentClassifications,
        categories,
        documentTypes,
        documentSections,
        priorityLevels,
        documentStatuses,
        departmentOptions,
        supportedFileTypes: [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/tiff",
          "image/bmp",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "text/csv",
        ],
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFileSizeMB: 50,
      },
    };

    console.log(
      "✅ [documentController] Document metadata retrieved successfully"
    );
    res.json(metadata);
  } catch (error) {
    console.error(
      "❌ [documentController] Error getting document metadata:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get document metadata",
      error: error.message,
    });
  }
};
