import Procurement from "../models/Procurement.js";
import User from "../models/User.js";

// ============================================================================
// PROCUREMENT CONTROLLERS
// ============================================================================

// @desc    Get all procurement (with role-based filtering)
// @route   GET /api/procurement
// @access  Private (HOD+)
export const getAllProcurement = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // SUPER_ADMIN (1000) - see all procurement across all departments
    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [PROCUREMENT] Super Admin - showing all procurement across all departments"
      );
    }
    // HOD (700) - see procurement in their department
    else if (currentUser.role.level >= 700) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view procurement",
        });
      }

      // Note: company field is commented out in Procurement model, so we show all procurement for HODs
      console.log(
        "🔍 [PROCUREMENT] HOD - showing all procurement (company field not implemented)"
      );
    }
    // STAFF (300) - see procurement they created
    else if (currentUser.role.level >= 300) {
      query.createdBy = currentUser._id;
      console.log("🔍 [PROCUREMENT] Staff - showing created procurement only");
    }
    // Others - no access
    else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions to view procurement.",
      });
    }

    const procurement = await Procurement.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("relatedProject", "name code")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: procurement,
      total: procurement.length,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get all procurement error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching procurement",
      error: error.message,
    });
  }
};

// @desc    Get procurement by ID
// @route   GET /api/procurement/:id
// @access  Private (HOD+)
export const getProcurementById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const procurement = await Procurement.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("relatedProject", "name code")
      .populate("notes.author", "firstName lastName");

    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkProcurementAccess(currentUser, procurement);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to view this procurement.",
      });
    }

    res.status(200).json({
      success: true,
      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get procurement by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching procurement",
      error: error.message,
    });
  }
};

// @desc    Create new procurement
// @route   POST /api/procurement
// @access  Private (HOD+)
export const createProcurement = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user can create procurement
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and above can create procurement.",
      });
    }

    const procurementData = {
      ...req.body,
      createdBy: currentUser._id,
    };

    const procurement = new Procurement(procurementData);
    await procurement.save();

    // Populate the created procurement
    await procurement.populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Procurement created successfully",
      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Create procurement error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating procurement",
      error: error.message,
    });
  }
};

// @desc    Update procurement
// @route   PUT /api/procurement/:id
// @access  Private (HOD+)
export const updateProcurement = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const procurement = await Procurement.findById(id);
    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement not found",
      });
    }

    // Check access permissions
    const canEdit = await checkProcurementEditAccess(currentUser, procurement);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to edit this procurement.",
      });
    }

    const updatedProcurement = await Procurement.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: currentUser._id,
      },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Procurement updated successfully",
      data: updatedProcurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Update procurement error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating procurement",
      error: error.message,
    });
  }
};

// @desc    Delete procurement
// @route   DELETE /api/procurement/:id
// @access  Private (HOD+)
export const deleteProcurement = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const procurement = await Procurement.findById(id);
    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement not found",
      });
    }

    // Check access permissions
    const canDelete = await checkProcurementDeleteAccess(
      currentUser,
      procurement
    );
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to delete this procurement.",
      });
    }

    // Soft delete
    procurement.isActive = false;
    procurement.updatedBy = currentUser._id;
    await procurement.save();

    res.status(200).json({
      success: true,
      message: "Procurement deleted successfully",
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Delete procurement error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting procurement",
      error: error.message,
    });
  }
};

// @desc    Get procurement statistics
// @route   GET /api/procurement/stats
// @access  Private (HOD+)
export const getProcurementStats = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD can see all procurement (no company filtering since it's ELRA system)
        console.log("🔍 [PROCUREMENT] HOD - showing all procurement");
      } else {
        query.createdBy = currentUser._id;
      }
    }

    const stats = await Procurement.getProcurementStats();
    const totalProcurement = await Procurement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        stats,
        totalProcurement,
      },
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching procurement statistics",
      error: error.message,
    });
  }
};

// @desc    Get pending approvals
// @route   GET /api/procurement/pending-approvals
// @access  Private (HOD+)
export const getPendingApprovals = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true, status: "pending" };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD can see all procurement (no company filtering since it's ELRA system)
        console.log("🔍 [PROCUREMENT] HOD - showing all pending approvals");
      } else {
        query.createdBy = currentUser._id;
      }
    }

    const pendingApprovals = await Procurement.getPendingApprovals();

    res.status(200).json({
      success: true,
      data: pendingApprovals,
      total: pendingApprovals.length,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending approvals",
      error: error.message,
    });
  }
};

// @desc    Get overdue deliveries
// @route   GET /api/procurement/overdue-deliveries
// @access  Private (HOD+)
export const getOverdueDeliveries = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD can see all procurement (no company filtering since it's ELRA system)
        console.log("🔍 [PROCUREMENT] HOD - showing all overdue deliveries");
      } else {
        query.createdBy = currentUser._id;
      }
    }

    const overdueDeliveries = await Procurement.getOverdueDeliveries();

    res.status(200).json({
      success: true,
      data: overdueDeliveries,
      total: overdueDeliveries.length,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get overdue deliveries error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching overdue deliveries",
      error: error.message,
    });
  }
};

// @desc    Approve procurement
// @route   POST /api/procurement/:id/approve
// @access  Private (HOD+)
export const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const currentUser = req.user;

    const procurement = await Procurement.findById(id);
    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement not found",
      });
    }

    // Check access permissions
    const canApprove = await checkProcurementEditAccess(
      currentUser,
      procurement
    );
    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to approve this procurement.",
      });
    }

    await procurement.approve(currentUser._id, approvalNotes);

    res.status(200).json({
      success: true,
      message: "Procurement approved successfully",
      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Approve procurement error:", error);
    res.status(500).json({
      success: false,
      message: "Error approving procurement",
      error: error.message,
    });
  }
};

// @desc    Receive items
// @route   POST /api/procurement/:id/receive
// @access  Private (HOD+)
export const receiveItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems, receiptNotes } = req.body;
    const currentUser = req.user;

    const procurement = await Procurement.findById(id);
    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement not found",
      });
    }

    // Check access permissions
    const canReceive = await checkProcurementEditAccess(
      currentUser,
      procurement
    );
    if (!canReceive) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to receive items for this procurement.",
      });
    }

    await procurement.receiveItems(
      receivedItems,
      receiptNotes,
      currentUser._id
    );

    res.status(200).json({
      success: true,
      message: "Items received successfully",
      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Receive items error:", error);
    res.status(500).json({
      success: false,
      message: "Error receiving items",
      error: error.message,
    });
  }
};

// @desc    Add note to procurement
// @route   POST /api/procurement/:id/notes
// @access  Private (HOD+)
export const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isPrivate = false } = req.body;
    const currentUser = req.user;

    const procurement = await Procurement.findById(id);
    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkProcurementAccess(currentUser, procurement);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to access this procurement.",
      });
    }

    await procurement.addNote(content, currentUser._id, isPrivate);

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Add note error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding note",
      error: error.message,
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Check if user has access to view procurement
const checkProcurementAccess = async (user, procurement) => {
  // SUPER_ADMIN can access everything
  if (user.role.level >= 1000) return true;

  // HOD can access all procurement (ELRA system)
  if (user.role.level >= 700) {
    return true;
  }

  // STAFF can access procurement they created
  if (user.role.level >= 300) {
    return procurement.createdBy.toString() === user._id.toString();
  }

  return false;
};

// Check if user can edit procurement
const checkProcurementEditAccess = async (user, procurement) => {
  // SUPER_ADMIN can edit everything
  if (user.role.level >= 1000) return true;

  // HOD can edit all procurement (ELRA system)
  if (user.role.level >= 700) {
    return true;
  }

  // STAFF can only edit procurement they created
  if (user.role.level >= 300) {
    return procurement.createdBy.toString() === user._id.toString();
  }

  return false;
};

// Check if user can delete procurement
const checkProcurementDeleteAccess = async (user, procurement) => {
  // SUPER_ADMIN can delete everything
  if (user.role.level >= 1000) return true;

  // HOD can delete any procurement (ELRA system)
  if (user.role.level >= 700) {
    return true;
  }

  return false;
};
