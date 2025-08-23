import Finance from "../models/Finance.js";
import User from "../models/User.js";

// ============================================================================
// FINANCE CONTROLLERS
// ============================================================================

// @desc    Get all finance transactions (with role-based filtering)
// @route   GET /api/finance
// @access  Private (HOD+)
export const getAllFinance = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // SUPER_ADMIN (1000) - see all finance across all departments
    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [FINANCE] Super Admin - showing all finance across all departments"
      );
    }
    // HOD (700) - see finance in their department
    else if (currentUser.role.level >= 700) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view finance",
        });
      }

      query.company = currentUser.company;
      console.log(
        "🔍 [FINANCE] HOD - showing finance for department:",
        currentUser.department.name
      );
    }
    // STAFF (300) - see finance they created
    else if (currentUser.role.level >= 300) {
      query.createdBy = currentUser._id;
      console.log("🔍 [FINANCE] Staff - showing created finance only");
    }
    // Others - no access
    else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions to view finance.",
      });
    }

    const finance = await Finance.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("relatedProject", "name code")
      .populate("relatedInventory", "name code")
      .populate("relatedProcurement", "poNumber title")
      .sort({ transactionDate: -1 });

    res.status(200).json({
      success: true,
      data: finance,
      total: finance.length,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Get all finance error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching finance",
      error: error.message,
    });
  }
};

// @desc    Get finance transaction by ID
// @route   GET /api/finance/:id
// @access  Private (HOD+)
export const getFinanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const finance = await Finance.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("relatedProject", "name code")
      .populate("relatedInventory", "name code")
      .populate("relatedProcurement", "poNumber title")
      .populate("notes.author", "firstName lastName");

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: "Finance transaction not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkFinanceAccess(currentUser, finance);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to view this finance transaction.",
      });
    }

    res.status(200).json({
      success: true,
      data: finance,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Get finance by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching finance transaction",
      error: error.message,
    });
  }
};

// @desc    Create new finance transaction
// @route   POST /api/finance
// @access  Private (HOD+)
export const createFinance = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user can create finance transactions
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HOD and above can create finance transactions.",
      });
    }

    const financeData = {
      ...req.body,
      createdBy: currentUser._id,
      company: currentUser.company,
    };

    const finance = new Finance(financeData);
    await finance.save();

    // Populate the created finance
    await finance.populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Finance transaction created successfully",
      data: finance,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Create finance error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating finance transaction",
      error: error.message,
    });
  }
};

// @desc    Update finance transaction
// @route   PUT /api/finance/:id
// @access  Private (HOD+)
export const updateFinance = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const finance = await Finance.findById(id);
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: "Finance transaction not found",
      });
    }

    // Check access permissions
    const canEdit = await checkFinanceEditAccess(currentUser, finance);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to edit this finance transaction.",
      });
    }

    const updatedFinance = await Finance.findByIdAndUpdate(
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
      message: "Finance transaction updated successfully",
      data: updatedFinance,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Update finance error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating finance transaction",
      error: error.message,
    });
  }
};

// @desc    Delete finance transaction
// @route   DELETE /api/finance/:id
// @access  Private (HOD+)
export const deleteFinance = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const finance = await Finance.findById(id);
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: "Finance transaction not found",
      });
    }

    // Check access permissions
    const canDelete = await checkFinanceDeleteAccess(currentUser, finance);
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to delete this finance transaction.",
      });
    }

    // Soft delete
    finance.isActive = false;
    finance.updatedBy = currentUser._id;
    await finance.save();

    res.status(200).json({
      success: true,
      message: "Finance transaction deleted successfully",
    });
  } catch (error) {
    console.error("❌ [FINANCE] Delete finance error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting finance transaction",
      error: error.message,
    });
  }
};

// @desc    Get financial statistics
// @route   GET /api/finance/stats
// @access  Private (HOD+)
export const getFinancialStats = async (req, res) => {
  try {
    const currentUser = req.user;
    const { startDate, endDate } = req.query;

    const stats = await Finance.getFinancialStats(
      currentUser.company,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching financial statistics",
      error: error.message,
    });
  }
};

// @desc    Get revenue statistics
// @route   GET /api/finance/revenue-stats
// @access  Private (HOD+)
export const getRevenueStats = async (req, res) => {
  try {
    const currentUser = req.user;
    const { startDate, endDate } = req.query;

    const stats = await Finance.getRevenueStats(
      currentUser.company,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Get revenue stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue statistics",
      error: error.message,
    });
  }
};

// @desc    Get expense statistics
// @route   GET /api/finance/expense-stats
// @access  Private (HOD+)
export const getExpenseStats = async (req, res) => {
  try {
    const currentUser = req.user;
    const { startDate, endDate } = req.query;

    const stats = await Finance.getExpenseStats(
      currentUser.company,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Get expense stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expense statistics",
      error: error.message,
    });
  }
};

// @desc    Get overdue transactions
// @route   GET /api/finance/overdue
// @access  Private (HOD+)
export const getOverdueTransactions = async (req, res) => {
  try {
    const currentUser = req.user;

    const overdueTransactions = await Finance.getOverdueTransactions(
      currentUser.company
    );

    res.status(200).json({
      success: true,
      data: overdueTransactions,
      total: overdueTransactions.length,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Get overdue transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching overdue transactions",
      error: error.message,
    });
  }
};

// @desc    Get pending approvals
// @route   GET /api/finance/pending-approvals
// @access  Private (HOD+)
export const getPendingApprovals = async (req, res) => {
  try {
    const currentUser = req.user;

    const pendingApprovals = await Finance.getPendingApprovals(
      currentUser.company
    );

    res.status(200).json({
      success: true,
      data: pendingApprovals,
      total: pendingApprovals.length,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending approvals",
      error: error.message,
    });
  }
};

// @desc    Approve finance transaction
// @route   POST /api/finance/:id/approve
// @access  Private (HOD+)
export const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const currentUser = req.user;

    const finance = await Finance.findById(id);
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: "Finance transaction not found",
      });
    }

    // Check access permissions
    const canApprove = await checkFinanceEditAccess(currentUser, finance);
    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to approve this finance transaction.",
      });
    }

    await finance.approve(currentUser._id, approvalNotes);

    res.status(200).json({
      success: true,
      message: "Finance transaction approved successfully",
      data: finance,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Approve finance error:", error);
    res.status(500).json({
      success: false,
      message: "Error approving finance transaction",
      error: error.message,
    });
  }
};

// @desc    Add payment to finance transaction
// @route   POST /api/finance/:id/payments
// @access  Private (HOD+)
export const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, reference, notes } = req.body;
    const currentUser = req.user;

    const finance = await Finance.findById(id);
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: "Finance transaction not found",
      });
    }

    // Check access permissions
    const canAddPayment = await checkFinanceEditAccess(currentUser, finance);
    if (!canAddPayment) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to add payments to this finance transaction.",
      });
    }

    await finance.addPayment(
      amount,
      paymentMethod,
      reference,
      notes,
      currentUser._id
    );

    res.status(200).json({
      success: true,
      message: "Payment added successfully",
      data: finance,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Add payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding payment",
      error: error.message,
    });
  }
};

// @desc    Add note to finance transaction
// @route   POST /api/finance/:id/notes
// @access  Private (HOD+)
export const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isPrivate = false } = req.body;
    const currentUser = req.user;

    const finance = await Finance.findById(id);
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: "Finance transaction not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkFinanceAccess(currentUser, finance);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to access this finance transaction.",
      });
    }

    await finance.addNote(content, currentUser._id, isPrivate);

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: finance,
    });
  } catch (error) {
    console.error("❌ [FINANCE] Add note error:", error);
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

// Check if user has access to view finance
const checkFinanceAccess = async (user, finance) => {
  // SUPER_ADMIN can access everything
  if (user.role.level >= 1000) return true;

  // HOD can access finance in their company
  if (user.role.level >= 700) {
    return finance.company.toString() === user.company.toString();
  }

  // STAFF can access finance they created
  if (user.role.level >= 300) {
    return finance.createdBy.toString() === user._id.toString();
  }

  return false;
};

// Check if user can edit finance
const checkFinanceEditAccess = async (user, finance) => {
  // SUPER_ADMIN can edit everything
  if (user.role.level >= 1000) return true;

  // HOD can edit finance in their company
  if (user.role.level >= 700) {
    return finance.company.toString() === user.company.toString();
  }

  // STAFF can only edit finance they created
  if (user.role.level >= 300) {
    return finance.createdBy.toString() === user._id.toString();
  }

  return false;
};

// Check if user can delete finance
const checkFinanceDeleteAccess = async (user, finance) => {
  // SUPER_ADMIN can delete everything
  if (user.role.level >= 1000) return true;

  // HOD can delete finance they created or manage
  if (user.role.level >= 700) {
    return (
      finance.createdBy.toString() === user._id.toString() ||
      finance.company.toString() === user.company.toString()
    );
  }

  return false;
};
