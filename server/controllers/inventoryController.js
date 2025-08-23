import Inventory from "../models/Inventory.js";
import User from "../models/User.js";

// ============================================================================
// INVENTORY CONTROLLERS
// ============================================================================

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
      .populate("notes.author", "firstName lastName");

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
          "Access denied. You don't have permission to edit this inventory item.",
      });
    }

    const updatedInventory = await Inventory.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: currentUser._id,
      },
      { new: true, runValidators: true }
    )
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName");

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: updatedInventory,
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

  // HOD can access inventory in their company
  if (user.role.level >= 700) {
    return inventory.company.toString() === user.company.toString();
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
  // SUPER_ADMIN can edit everything
  if (user.role.level >= 1000) return true;

  // HOD can edit inventory in their company
  if (user.role.level >= 700) {
    return inventory.company.toString() === user.company.toString();
  }

  // STAFF can only edit inventory they're assigned to
  if (user.role.level >= 300) {
    return (
      inventory.assignedTo &&
      inventory.assignedTo.toString() === user._id.toString()
    );
  }

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
      inventory.company.toString() === user.company.toString()
    );
  }

  return false;
};
