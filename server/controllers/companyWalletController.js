import mongoose from "mongoose";
import ELRAWallet from "../models/ELRAWallet.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import { protect, checkFinanceAccess } from "../middleware/auth.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";
import TransactionReportService from "../services/transactionReportService.js";
import { generateReference } from "../utils/referenceGenerator.js";

const notificationService = new NotificationService();

/**
 * ELRA Wallet Controller
 * Handles all ELRA wallet management operations
 * Access: Finance & Accounting HOD and Super Admin only
 */

// @desc    Get ELRA wallet overview
// @route   GET /api/elra-wallet
// @access  Private (Finance HOD, Super Admin)
export const getELRAWallet = async (req, res) => {
  try {
    const userId = req.user._id;

    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    // Calculate financial summary
    const financialSummary = {
      totalFunds: wallet.totalFunds,
      allocatedFunds: wallet.allocatedFunds,
      availableFunds: wallet.availableFunds,
      reservedFunds: wallet.reservedFunds,
      currency: wallet.currency,
      utilizationPercentage:
        wallet.totalFunds > 0
          ? ((wallet.allocatedFunds + wallet.reservedFunds) /
              wallet.totalFunds) *
            100
          : 0,
      budgetCategories: wallet.budgetCategories || {
        payroll: {
          allocated: 0,
          used: 0,
          available: 0,
          reserved: 0,
          monthlyLimit: 0,
        },
        projects: { allocated: 0, used: 0, available: 0, reserved: 0 },
        operational: { allocated: 0, used: 0, available: 0 },
      },
    };

    // Get recent transactions (last 10)
    const recentTransactions = wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Get pending allocations
    const pendingAllocations = wallet.allocations.filter(
      (alloc) => alloc.status === "pending"
    );

    res.status(200).json({
      success: true,
      data: {
        wallet: {
          _id: wallet._id,
          elraInstance: wallet.elraInstance,
          managedBy: wallet.managedBy,
          status: wallet.status,
          metadata: wallet.metadata,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        },
        financialSummary,
        recentTransactions,
        pendingAllocations,
      },
    });
  } catch (error) {
    console.error("Get ELRA Wallet Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get ELRA wallet",
      error: error.message,
    });
  }
};

// @desc    Add funds to ELRA wallet
// @route   POST /api/elra-wallet/add-funds
// @access  Private (Super Admin, Executive Office only)
// @desc    Set budget allocation for categories
// @route   POST /api/elra-wallet/set-budget
// @access  Private (Super Admin, Executive Office only)
export const setBudgetAllocation = async (req, res) => {
  try {
    const { category, amount } = req.body;
    const userId = req.user._id;

    // Validate category
    const validCategories = ["payroll", "projects", "operational"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid budget category. Must be one of: payroll, projects, operational",
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Budget amount cannot be negative",
      });
    }

    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    // Check if we have enough available funds
    if (wallet.availableFunds < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available funds. Available: ₦${wallet.availableFunds.toLocaleString()}, Required: ₦${amount.toLocaleString()}`,
      });
    }

    // Allocate funds to the specified category
    await wallet.allocateToCategory(
      category,
      amount,
      `Budget allocation for ${category}`,
      `BUDGET_${category.toUpperCase()}`,
      null,
      "budget_allocation",
      userId
    );

    // Simple allocation - no frequency limits needed

    console.log(
      `💰 [BUDGET ALLOCATION] Allocated ₦${amount.toLocaleString()} to ${category} budget`
    );

    // Check for low balance after allocation and notify if needed
    const lowBalanceThreshold = 10000000;
    const newBalance = wallet.availableFunds;
    if (newBalance < lowBalanceThreshold) {
      console.log(
        `⚠️ [LOW_BALANCE_ALERT] Main wallet balance (₦${newBalance.toLocaleString()}) is below threshold (₦${lowBalanceThreshold.toLocaleString()}) after budget allocation`
      );

      // Get user info for notification
      const user = await User.findById(userId)
        .populate("role", "name level")
        .populate("department", "name");

      const addedByUserName = `${user?.firstName} ${user?.lastName}`;
      const formattedAmount = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);

      const formattedBalance = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(newBalance);

      await notifyLowBalance(
        addedByUserName,
        formattedAmount,
        formattedBalance,
        lowBalanceThreshold
      );
    }

    res.status(200).json({
      success: true,
      message: `Budget allocation set successfully for ${category}`,
      data: {
        category,
        allocatedAmount: amount,
        budgetCategories: wallet.budgetCategories,
      },
    });
  } catch (error) {
    console.error("Set Budget Allocation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set budget allocation",
      error: error.message,
    });
  }
};

export const addFunds = async (req, res) => {
  try {
    const {
      amount,
      description,
      reference,
      // Simple direct budget allocation
      allocateToBudget = false,
      budgetCategory = null,
      flexibleAllocation = false,
      allocations = [],
    } = req.body;
    const userId = req.user._id;

    console.log("🚀 [FUND_ADDITION] Starting fund addition process:", {
      amount,
      description,
      reference,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Populate user with role and department for proper notification handling
    const user = await User.findById(userId)
      .populate("role", "name level")
      .populate("department", "name");

    const userDepartment = user?.department?.name;
    const isSuperAdmin = user?.role?.level === 1000;
    const isExecutive =
      user?.role?.level === 700 && userDepartment === "Executive Office";

    console.log("👤 [FUND_ADDITION] User permission check:", {
      userName: `${user?.firstName} ${user?.lastName}`,
      userEmail: user?.email,
      userDepartment,
      userRole: user?.role?.name,
      userRoleLevel: user?.role?.level,
      isSuperAdmin,
      isExecutive,
    });

    if (!isSuperAdmin && !isExecutive) {
      console.log(
        "❌ [FUND_ADDITION] Access denied - insufficient permissions"
      );
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Super Admin or Executive Office can add funds to the wallet.",
      });
    }

    // Validate input
    if (!amount || amount <= 0) {
      console.log(
        "❌ [FUND_ADDITION] Validation failed - invalid amount:",
        amount
      );
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (!description) {
      console.log("❌ [FUND_ADDITION] Validation failed - missing description");
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    console.log(
      "✅ [FUND_ADDITION] Validation passed, proceeding with wallet operations"
    );

    // Auto-generate sequential reference code if not provided
    let finalReference = reference;
    if (!reference) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingFundTransactions = await ELRAWallet.aggregate([
        { $match: { elraInstance: "ELRA_MAIN", status: "active" } },
        { $unwind: "$transactions" },
        {
          $match: {
            "transactions.date": { $gte: today, $lt: tomorrow },
            "transactions.reference": { $regex: /^FUND-/ },
          },
        },
        { $count: "total" },
      ]);

      const currentCount = existingFundTransactions[0]?.total || 0;
      const nextSequence = currentCount + 1;
      finalReference = generateReference("FUND", nextSequence);

      console.log(
        "🔢 [FUND_ADDITION] Auto-generated sequential reference code:",
        {
          reference: finalReference,
          currentCount,
          nextSequence,
          date: today.toISOString().split("T")[0],
        }
      );
    } else {
      console.log(
        "🔢 [FUND_ADDITION] Using provided reference code:",
        finalReference
      );
    }

    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);
    console.log("💰 [FUND_ADDITION] Wallet retrieved:", {
      walletId: wallet._id,
      currentBalance: wallet.availableFunds,
      totalFunds: wallet.totalFunds,
    });

    // If direct budget allocation is requested
    if (allocateToBudget && budgetCategory) {
      // Validate budget category
      const validCategories = ["payroll", "projects", "operational"];
      if (!validCategories.includes(budgetCategory)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid budget category. Must be one of: payroll, projects, operational",
        });
      }

      // For direct allocation, add funds directly to the budget category (skip main pool)
      await wallet.addFundsDirectToCategory(
        budgetCategory,
        amount,
        description,
        finalReference,
        userId
      );

      // Simple allocation - no frequency limits needed

      console.log(
        `✅ [FUND_ADDITION] Funds added and allocated to ${budgetCategory} budget:`,
        {
          amountAdded: amount,
          budgetCategory,
          newBalance: wallet.availableFunds,
          reference: finalReference,
        }
      );
    } else if (flexibleAllocation && allocations.length > 0) {
      // New flexible allocation system
      console.log("🔄 [FUND_ADDITION] Using flexible allocation system:", {
        totalAmount: amount,
        allocations,
      });

      await wallet.addFundsWithAllocation(
        amount,
        allocations,
        description,
        finalReference,
        userId
      );

      console.log("✅ [FUND_ADDITION] Funds added with flexible allocation:", {
        totalAmount: amount,
        allocations,
        remainingInGeneralPool: wallet.availableFunds,
        reference: finalReference,
      });
    } else {
      // Traditional fund addition (to general pool)
      await wallet.addFunds(
        amount,
        description,
        finalReference,
        null,
        "general",
        userId
      );

      console.log("✅ [FUND_ADDITION] Funds added to general pool:", {
        amountAdded: amount,
        newBalance: wallet.availableFunds,
        reference: finalReference,
      });
    }

    // Audit log
    console.log("📝 [FUND_ADDITION] Creating audit log entry");
    await AuditService.logActivity({
      userId,
      action: "ADD_FUNDS",
      resourceType: "ELRAWallet",
      resourceId: wallet._id,
      details: {
        amount,
        description,
        reference: finalReference,
        newBalance: wallet.availableFunds,
      },
    });
    console.log("✅ [FUND_ADDITION] Audit log created successfully");

    // Send notifications to relevant HODs
    console.log("📧 [FUND_ADDITION] Starting notification process");
    await sendFundAdditionNotifications(
      user,
      amount,
      description,
      finalReference,
      wallet.availableFunds,
      flexibleAllocation,
      allocations
    );
    console.log("✅ [FUND_ADDITION] Notification process completed");

    const responseData = {
      amount,
      newBalance: wallet.availableFunds,
      transaction: wallet.transactions[wallet.transactions.length - 1],
    };

    // Include budget allocation info if direct allocation was used
    if (allocateToBudget && budgetCategory) {
      responseData.budgetAllocation = {
        category: budgetCategory,
        allocatedAmount: amount,
        // Simple allocation - no complex limits
      };
    }

    res.status(200).json({
      success: true,
      message:
        allocateToBudget && budgetCategory
          ? `Funds added and allocated to ${budgetCategory} budget successfully`
          : "Funds added successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Add Funds Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add funds",
      error: error.message,
    });
  }
};

// @desc    Get wallet transaction history
// @route   GET /api/company-wallet/transactions
// @access  Private (Finance HOD, Super Admin)
export const getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const userId = req.user._id;
    const companyId = req.user.company || "default";

    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    let transactions = wallet.transactions;

    // Filter by type
    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }

    // Filter by date range
    if (startDate || endDate) {
      transactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        if (startDate && transactionDate < new Date(startDate)) return false;
        if (endDate && transactionDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(transactions.length / limit),
          totalTransactions: transactions.length,
          hasNext: endIndex < transactions.length,
          hasPrev: startIndex > 0,
        },
      },
    });
  } catch (error) {
    console.error("Get Transaction History Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction history",
      error: error.message,
    });
  }
};

// @desc    Get wallet allocations
// @route   GET /api/company-wallet/allocations
// @access  Private (Finance HOD, Super Admin)
export const getAllocations = async (req, res) => {
  try {
    const { status, type } = req.query;
    const userId = req.user._id;
    const companyId = req.user.company || "default";

    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    let allocations = wallet.allocations;

    // Filter by status
    if (status) {
      allocations = allocations.filter((a) => a.status === status);
    }

    // Filter by type
    if (type) {
      allocations = allocations.filter((a) => a.allocationType === type);
    }

    // Sort by date (newest first)
    allocations.sort(
      (a, b) => new Date(b.allocatedAt) - new Date(a.allocatedAt)
    );

    res.status(200).json({
      success: true,
      data: {
        allocations,
        summary: {
          total: allocations.length,
          pending: allocations.filter((a) => a.status === "pending").length,
          approved: allocations.filter((a) => a.status === "approved").length,
          rejected: allocations.filter((a) => a.status === "rejected").length,
        },
      },
    });
  } catch (error) {
    console.error("Get Allocations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get allocations",
      error: error.message,
    });
  }
};

// @desc    Get financial reports
// @route   GET /api/company-wallet/reports
// @access  Private (Finance HOD, Super Admin)
export const getFinancialReports = async (req, res) => {
  try {
    const { period = "month" } = req.query; // month, quarter, year
    const userId = req.user._id;
    const companyId = req.user.company || "default";

    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    // Calculate period-based reports
    const now = new Date();
    let startDate;

    switch (period) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter transactions by period
    const periodTransactions = wallet.transactions.filter(
      (t) => new Date(t.date) >= startDate
    );

    // Calculate period statistics
    const periodStats = {
      totalDeposits: periodTransactions
        .filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: Math.abs(
        periodTransactions
          .filter((t) => t.type === "withdrawal")
          .reduce((sum, t) => sum + t.amount, 0)
      ),
      totalAllocations: Math.abs(
        periodTransactions
          .filter((t) => t.type === "allocation")
          .reduce((sum, t) => sum + t.amount, 0)
      ),
      totalApprovals: periodTransactions
        .filter((t) => t.type === "approval")
        .reduce((sum, t) => sum + t.amount, 0),
      transactionCount: periodTransactions.length,
    };

    // Allocation breakdown by type
    const allocationBreakdown = wallet.allocations.reduce((acc, alloc) => {
      if (!acc[alloc.allocationType]) {
        acc[alloc.allocationType] = {
          count: 0,
          totalAmount: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        };
      }
      acc[alloc.allocationType].count++;
      acc[alloc.allocationType].totalAmount += alloc.amount;
      acc[alloc.allocationType][alloc.status]++;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        currentBalance: {
          totalFunds: wallet.totalFunds,
          allocatedFunds: wallet.allocatedFunds,
          availableFunds: wallet.availableFunds,
          reservedFunds: wallet.reservedFunds,
        },
        periodStats,
        allocationBreakdown,
      },
    });
  } catch (error) {
    console.error("Get Financial Reports Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get financial reports",
      error: error.message,
    });
  }
};

// @desc    Update wallet settings
// @route   PUT /api/company-wallet/settings
// @access  Private (Finance HOD, Super Admin)
export const updateWalletSettings = async (req, res) => {
  try {
    const { notes } = req.body;
    const userId = req.user._id;
    const companyId = req.user.company || "default";

    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    // Update metadata
    wallet.metadata.notes = notes;
    wallet.metadata.lastUpdated = new Date();
    wallet.metadata.lastUpdatedBy = userId;

    await wallet.save();

    // Audit log
    await AuditService.logActivity({
      userId,
      action: "UPDATE_WALLET_SETTINGS",
      resource: "ELRAWallet",
      resourceType: "ELRAWallet",
      resourceId: wallet._id,
      details: { notes },
    });

    res.status(200).json({
      success: true,
      message: "Wallet settings updated successfully",
      data: {
        wallet: {
          _id: wallet._id,
          metadata: wallet.metadata,
        },
      },
    });
  } catch (error) {
    console.error("Update Wallet Settings Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update wallet settings",
      error: error.message,
    });
  }
};

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Send notifications for fund addition to relevant HODs
 */
const sendFundAdditionNotifications = async (
  addedByUser,
  amount,
  description,
  reference,
  newBalance,
  flexibleAllocation = false,
  allocations = []
) => {
  try {
    console.log(
      `📧 [FUND_ADDITION] Sending notifications for fund addition: ₦${amount}`
    );

    const addedByUserName = `${addedByUser.firstName} ${addedByUser.lastName}`;
    const addedByDepartment =
      addedByUser.department?.name || "Unknown Department";

    console.log("👤 [FUND_ADDITION] Notification details:", {
      addedByUserName,
      addedByDepartment,
      addedByRole: addedByUser.role?.name,
      addedByRoleLevel: addedByUser.role?.level,
      amount,
      description,
      reference,
      newBalance,
    });

    // Format amount for display
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    const formattedBalance = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(newBalance);

    console.log("💰 [FUND_ADDITION] Formatted amounts:", {
      formattedAmount,
      formattedBalance,
    });

    // Always notify Finance HOD when funds are added
    console.log("📧 [FUND_ADDITION] Notifying Finance HOD about fund addition");
    await notifyFinanceHOD(
      addedByUserName,
      addedByDepartment,
      formattedAmount,
      description,
      reference,
      formattedBalance,
      flexibleAllocation,
      allocations
    );

    // If Super Admin added funds, notify Executive HOD
    if (addedByUser.role?.level === 1000) {
      console.log(
        "📧 [FUND_ADDITION] Super Admin detected - notifying Executive HOD"
      );
      await notifyExecutiveHOD(
        addedByUserName,
        formattedAmount,
        description,
        reference,
        formattedBalance,
        flexibleAllocation ? allocations : null
      );
    } else {
      console.log(
        "ℹ️ [FUND_ADDITION] Not Super Admin - skipping Executive HOD notification"
      );
    }

    // If Executive added funds, notify Super Admin
    if (
      addedByUser.role?.level === 700 &&
      addedByDepartment === "Executive Office"
    ) {
      console.log(
        "📧 [FUND_ADDITION] Executive HOD detected - notifying Super Admin"
      );
      await notifySuperAdmin(
        addedByUserName,
        formattedAmount,
        description,
        reference,
        formattedBalance,
        flexibleAllocation ? allocations : null
      );
    } else {
      console.log(
        "ℹ️ [FUND_ADDITION] Not Executive HOD - skipping Super Admin notification"
      );
    }

    // Check for low balance and notify all three parties if needed
    const lowBalanceThreshold = 10000000; // 10M NGN
    if (newBalance < lowBalanceThreshold) {
      console.log(
        `⚠️ [LOW_BALANCE_ALERT] Main wallet balance (₦${formattedBalance}) is below threshold (₦${lowBalanceThreshold.toLocaleString()})`
      );
      await notifyLowBalance(
        addedByUserName,
        formattedAmount,
        formattedBalance,
        lowBalanceThreshold
      );
    }

    console.log("✅ [FUND_ADDITION] All notifications processed successfully");

    console.log(`✅ [FUND_ADDITION] Notifications sent successfully`);
  } catch (error) {
    console.error("❌ [FUND_ADDITION] Error sending notifications:", error);
    // Don't throw error - notifications are not critical for the main operation
  }
};

/**
 * Notify Finance HOD about fund addition
 */
const notifyFinanceHOD = async (
  addedByUserName,
  addedByDepartment,
  formattedAmount,
  description,
  reference,
  formattedBalance,
  flexibleAllocation = false,
  allocations = []
) => {
  try {
    console.log("🔍 [FUND_ADDITION] Finding Finance & Accounting department");
    // Find Finance & Accounting department
    const financeDept = await Department.findOne({
      name: "Finance & Accounting",
    });

    if (!financeDept) {
      console.error(
        "❌ [FUND_ADDITION] Finance & Accounting department not found"
      );
      return;
    }

    console.log("✅ [FUND_ADDITION] Finance department found:", {
      departmentId: financeDept._id,
      departmentName: financeDept.name,
    });

    // Find Finance HOD
    console.log("🔍 [FUND_ADDITION] Finding Finance HOD");
    const financeUsers = await User.find({
      department: financeDept._id,
      isActive: true,
    })
      .populate("role", "name level description")
      .populate("department", "name description");

    // Find HOD or user with level >= 700
    let financeHOD = financeUsers.find(
      (user) =>
        user.role && (user.role.name === "HOD" || user.role.level >= 700)
    );

    if (!financeHOD) {
      console.error("❌ [FUND_ADDITION] Finance HOD not found");
      return;
    }

    console.log(
      `📧 [FUND_ADDITION] Notifying Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName}`
    );

    let allocationMessage = "";
    if (flexibleAllocation && allocations.length > 0) {
      const allocationDetails = allocations
        .map((alloc) => {
          const formattedAmount = new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(alloc.amount);
          return `${formattedAmount} to ${alloc.category}`;
        })
        .join(", ");
      allocationMessage = ` Allocated: ${allocationDetails}.`;
    }

    // Create notification directly like other controllers
    const notification = new Notification({
      recipient: financeHOD._id,
      type: "FUND_ADDITION",
      title: "Funds Added to ELRA Wallet",
      message: `${addedByUserName} (${addedByDepartment}) added ${formattedAmount} to the ELRA wallet.${allocationMessage} New balance: ${formattedBalance}`,
      priority: "high",
      data: {
        addedBy: addedByUserName,
        addedByDepartment,
        amount: formattedAmount,
        allocations: allocations,
        description,
        reference,
        newBalance: formattedBalance,
        actionUrl: "/dashboard/modules/finance/elra-wallet",
      },
    });

    await notification.save();
    console.log(
      `✅ [FUND_ADDITION] Finance HOD notification sent to: ${financeHOD.email}`
    );
  } catch (error) {
    console.error("❌ [FUND_ADDITION] Error notifying Finance HOD:", error);
  }
};

/**
 * Notify Executive HOD about fund addition (only when Super Admin adds funds)
 */
const notifyExecutiveHOD = async (
  addedByUserName,
  formattedAmount,
  description,
  reference,
  formattedBalance,
  allocations = null
) => {
  try {
    // Find Executive Office department
    const executiveDept = await Department.findOne({
      name: "Executive Office",
    });

    if (!executiveDept) {
      console.error("❌ [FUND_ADDITION] Executive Office department not found");
      return;
    }

    // Find Executive HOD
    const executiveUsers = await User.find({
      department: executiveDept._id,
      isActive: true,
    })
      .populate("role", "name level description")
      .populate("department", "name description");

    // Find HOD or user with level >= 700
    let executiveHOD = executiveUsers.find(
      (user) =>
        user.role && (user.role.name === "HOD" || user.role.level >= 700)
    );

    if (!executiveHOD) {
      console.error("❌ [FUND_ADDITION] Executive HOD not found");
      return;
    }

    console.log(
      `📧 [FUND_ADDITION] Notifying Executive HOD: ${executiveHOD.firstName} ${executiveHOD.lastName}`
    );

    // Build allocation details message
    let allocationMessage = "";
    if (allocations && allocations.length > 0) {
      const allocationDetails = allocations
        .map((alloc) => {
          const formattedAmount = new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(alloc.amount);
          return `${formattedAmount} to ${alloc.category}`;
        })
        .join(", ");
      allocationMessage = ` Allocated: ${allocationDetails}.`;
    }

    const notification = new Notification({
      recipient: executiveHOD._id,
      type: "FUND_ADDITION",
      title: "Funds Added to ELRA Wallet (Super Admin)",
      message: `Super Admin (${addedByUserName}) added ${formattedAmount} to the ELRA wallet.${allocationMessage} New balance: ${formattedBalance}`,
      priority: "high",
      data: {
        addedBy: addedByUserName,
        addedByRole: "Super Admin",
        amount: formattedAmount,
        allocations: allocations,
        description,
        reference,
        newBalance: formattedBalance,
        actionUrl: "/dashboard/modules/finance/elra-wallet",
      },
    });

    await notification.save();
    console.log(
      `✅ [FUND_ADDITION] Executive HOD notification sent to: ${executiveHOD.email}`
    );
  } catch (error) {
    console.error("❌ [FUND_ADDITION] Error notifying Executive HOD:", error);
  }
};

/**
 * Notify Super Admin about fund addition (only when Executive HOD adds funds)
 */
const notifySuperAdmin = async (
  addedByUserName,
  formattedAmount,
  description,
  reference,
  formattedBalance,
  allocations = null
) => {
  try {
    // Find Super Admin user
    const superAdmin = await User.findOne({
      $or: [{ "role.level": 1000 }, { isSuperadmin: true }],
      isActive: true,
    })
      .populate("role", "name level description")
      .populate("department", "name description");

    if (!superAdmin) {
      console.error("❌ [FUND_ADDITION] Super Admin not found");
      return;
    }

    console.log(
      `📧 [FUND_ADDITION] Notifying Super Admin: ${superAdmin.firstName} ${superAdmin.lastName}`
    );

    // Build allocation details message
    let allocationMessage = "";
    if (allocations && allocations.length > 0) {
      const allocationDetails = allocations
        .map((alloc) => {
          const formattedAmount = new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(alloc.amount);
          return `${formattedAmount} to ${alloc.category}`;
        })
        .join(", ");
      allocationMessage = ` Allocated: ${allocationDetails}.`;
    }

    const notification = new Notification({
      recipient: superAdmin._id,
      type: "FUND_ADDITION",
      title: "Funds Added to ELRA Wallet (Executive HOD)",
      message: `Executive HOD (${addedByUserName}) added ${formattedAmount} to the ELRA wallet.${allocationMessage} New balance: ${formattedBalance}`,
      priority: "high",
      data: {
        addedBy: addedByUserName,
        addedByRole: "Executive HOD",
        amount: formattedAmount,
        allocations: allocations,
        description,
        reference,
        newBalance: formattedBalance,
        actionUrl: "/dashboard/modules/finance/elra-wallet",
      },
    });

    await notification.save();
    console.log(
      `✅ [FUND_ADDITION] Super Admin notification sent to: ${superAdmin.email}`
    );
  } catch (error) {
    console.error("❌ [FUND_ADDITION] Error notifying Super Admin:", error);
  }
};

/**
 * Notify all three parties (Executive HOD, Super Admin, Finance HOD) about low balance
 */
const notifyLowBalance = async (
  addedByUserName,
  formattedAmount,
  formattedBalance,
  threshold
) => {
  try {
    console.log(
      "🚨 [LOW_BALANCE_ALERT] Starting low balance notifications to all parties"
    );

    // Find all three parties
    const [executiveHOD, superAdmin, financeHOD] = await Promise.all([
      User.findOne({
        $or: [
          { "role.name": "Executive" },
          { "department.name": "Executive Office" },
          { "role.level": 700 },
        ],
        isActive: true,
      })
        .populate("role", "name level description")
        .populate("department", "name description"),

      // Super Admin
      User.findOne({
        $or: [{ "role.level": 1000 }, { isSuperadmin: true }],
        isActive: true,
      })
        .populate("role", "name level description")
        .populate("department", "name description"),

      // Finance HOD
      User.find({
        "department.name": "Finance & Accounting",
        isActive: true,
      })
        .populate("role", "name level description")
        .populate("department", "name description")
        .then((users) =>
          users.find(
            (user) =>
              user.role && (user.role.name === "HOD" || user.role.level >= 700)
          )
        ),
    ]);

    // Debug logging to see what users were found
    console.log(`🔍 [LOW_BALANCE_ALERT] Found users:`);
    console.log(
      `   Executive HOD: ${
        executiveHOD
          ? `${executiveHOD.firstName} ${executiveHOD.lastName} (${executiveHOD.role?.name})`
          : "Not found"
      }`
    );
    console.log(
      `   Super Admin: ${
        superAdmin
          ? `${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.role?.name})`
          : "Not found"
      }`
    );
    console.log(
      `   Finance HOD: ${
        financeHOD
          ? `${financeHOD.firstName} ${financeHOD.lastName} (${financeHOD.role?.name})`
          : "Not found"
      }`
    );

    const notifications = [];

    // Notify Executive HOD
    if (executiveHOD) {
      console.log(
        `📧 [LOW_BALANCE_ALERT] Notifying Executive HOD: ${executiveHOD.firstName} ${executiveHOD.lastName}`
      );
      notifications.push(
        new Notification({
          recipient: executiveHOD._id,
          type: "LOW_BALANCE_ALERT",
          title: "⚠️ Low Balance Alert - ELRA Wallet",
          message: `ELRA wallet balance (${formattedBalance}) is below the threshold (₦${threshold.toLocaleString()}). Action required.`,
          priority: "urgent",
          data: {
            currentBalance: formattedBalance,
            threshold: `₦${threshold.toLocaleString()}`,
            addedBy: addedByUserName,
            amount: formattedAmount,
            actionUrl: "/dashboard/modules/finance/elra-wallet",
          },
        })
      );
    }

    // Notify Super Admin
    if (superAdmin) {
      console.log(
        `📧 [LOW_BALANCE_ALERT] Notifying Super Admin: ${superAdmin.firstName} ${superAdmin.lastName}`
      );
      notifications.push(
        new Notification({
          recipient: superAdmin._id,
          type: "LOW_BALANCE_ALERT",
          title: "⚠️ Low Balance Alert - ELRA Wallet",
          message: `ELRA wallet balance (${formattedBalance}) is below the threshold (₦${threshold.toLocaleString()}). Action required.`,
          priority: "urgent",
          data: {
            currentBalance: formattedBalance,
            threshold: `₦${threshold.toLocaleString()}`,
            addedBy: addedByUserName,
            amount: formattedAmount,
            actionUrl: "/dashboard/modules/finance/elra-wallet",
          },
        })
      );
    }

    // Notify Finance HOD
    if (financeHOD) {
      console.log(
        `📧 [LOW_BALANCE_ALERT] Notifying Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName}`
      );
      notifications.push(
        new Notification({
          recipient: financeHOD._id,
          type: "LOW_BALANCE_ALERT",
          title: "⚠️ Low Balance Alert - ELRA Wallet",
          message: `ELRA wallet balance (${formattedBalance}) is below the threshold (₦${threshold.toLocaleString()}). Please review and add funds if needed.`,
          priority: "urgent",
          data: {
            currentBalance: formattedBalance,
            threshold: `₦${threshold.toLocaleString()}`,
            addedBy: addedByUserName,
            amount: formattedAmount,
            actionUrl: "/dashboard/modules/finance/elra-wallet",
          },
        })
      );
    }

    // Save all notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(
        `✅ [LOW_BALANCE_ALERT] Sent ${notifications.length} low balance notifications`
      );
    } else {
      console.log(
        "⚠️ [LOW_BALANCE_ALERT] No eligible recipients found for low balance notification"
      );
    }
  } catch (error) {
    console.error(
      "❌ [LOW_BALANCE_ALERT] Error sending low balance notifications:",
      error
    );
  }
};

// ============================================================================
// REPORT GENERATION ENDPOINTS
// ============================================================================

// @desc    Generate PDF report for transaction history
// @route   POST /api/elra-wallet/transactions/export/pdf
// @access  Private (Finance HOD, Executive HOD, Super Admin)
export const exportTransactionHistoryPDF = async (req, res) => {
  try {
    const { filters = {} } = req.body;
    const userId = req.user._id;

    // Populate user with role and department for report metadata
    const user = await User.findById(userId)
      .populate("role", "name level")
      .populate("department", "name");

    const userDepartment = user?.department?.name;
    const isSuperAdmin = user?.role?.level === 1000;
    const isExecutive =
      user?.role?.level === 700 && userDepartment === "Executive Office";
    const isFinanceHOD =
      user?.role?.level === 700 && userDepartment === "Finance & Accounting";

    if (!isSuperAdmin && !isExecutive && !isFinanceHOD) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Finance HOD, Executive HOD, or Super Admin can export transaction reports.",
      });
    }

    // Get wallet and transactions
    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    // Apply filters to transactions
    let filteredTransactions = wallet.transactions || [];

    if (filters.type) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === filters.type
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) <= endDate
      );
    }

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate PDF report
    const reportService = new TransactionReportService();
    const reportData = await reportService.generateTransactionReport(
      filteredTransactions,
      filters,
      {
        name: `${user.firstName} ${user.lastName}`,
        department: user.department?.name,
        role: user.role?.name,
      }
    );

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${reportData.fileName}"`
    );
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Send the PDF file
    res.sendFile(reportData.filePath);

    // Log the export activity
    await AuditService.logActivity({
      userId,
      action: "EXPORT_TRANSACTION_HISTORY_PDF",
      resource: "ELRAWallet",
      resourceType: "ELRAWallet",
      resourceId: wallet._id,
      details: {
        filters,
        transactionCount: filteredTransactions.length,
        reportFileName: reportData.fileName,
      },
    });
  } catch (error) {
    console.error("Export Transaction History PDF Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export transaction history PDF",
      error: error.message,
    });
  }
};

// @desc    Generate CSV report for transaction history
// @route   POST /api/elra-wallet/transactions/export/csv
// @access  Private (Finance HOD, Executive HOD, Super Admin)
export const exportTransactionHistoryCSV = async (req, res) => {
  try {
    const { filters = {} } = req.body;
    const userId = req.user._id;

    // Populate user with role and department for report metadata
    const user = await User.findById(userId)
      .populate("role", "name level")
      .populate("department", "name");

    const userDepartment = user?.department?.name;
    const isSuperAdmin = user?.role?.level === 1000;
    const isExecutive =
      user?.role?.level === 700 && userDepartment === "Executive Office";
    const isFinanceHOD =
      user?.role?.level === 700 && userDepartment === "Finance & Accounting";

    if (!isSuperAdmin && !isExecutive && !isFinanceHOD) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Finance HOD, Executive HOD, or Super Admin can export transaction reports.",
      });
    }

    // Get wallet and transactions
    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    // Apply filters to transactions
    let filteredTransactions = wallet.transactions || [];

    if (filters.type) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === filters.type
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) <= endDate
      );
    }

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate CSV report
    const reportService = new TransactionReportService();
    const result = await reportService.generateTransactionCSVReport(
      filteredTransactions,
      filters,
      {
        name: `${user.firstName} ${user.lastName}`,
        department: userDepartment,
        role: user.role?.name,
      }
    );

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"`
    );

    res.status(200).send(result.csvContent);
  } catch (error) {
    console.error("Export Transaction History CSV Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export transaction history CSV",
      error: error.message,
    });
  }
};

// @desc    Generate Word/HTML report for transaction history
// @route   POST /api/elra-wallet/transactions/export/word
// @access  Private (Finance HOD, Executive HOD, Super Admin)
export const exportTransactionHistoryWord = async (req, res) => {
  try {
    const { filters = {} } = req.body;
    const userId = req.user._id;

    // Populate user with role and department for report metadata
    const user = await User.findById(userId)
      .populate("role", "name level")
      .populate("department", "name");

    const userDepartment = user?.department?.name;
    const isSuperAdmin = user?.role?.level === 1000;
    const isExecutive =
      user?.role?.level === 700 && userDepartment === "Executive Office";
    const isFinanceHOD =
      user?.role?.level === 700 && userDepartment === "Finance & Accounting";

    if (!isSuperAdmin && !isExecutive && !isFinanceHOD) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Finance HOD, Executive HOD, or Super Admin can export transaction reports.",
      });
    }

    // Get wallet and transactions
    const wallet = await ELRAWallet.getOrCreateWallet("ELRA_MAIN", userId);

    // Apply filters to transactions
    let filteredTransactions = wallet.transactions || [];

    if (filters.type) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === filters.type
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) <= endDate
      );
    }

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate Word/HTML report
    const reportService = new TransactionReportService();
    const reportData = await reportService.generateTransactionWordReport(
      filteredTransactions,
      filters,
      {
        name: `${user.firstName} ${user.lastName}`,
        department: user.department?.name,
        role: user.role?.name,
      }
    );

    // Set response headers for HTML download (can be opened in Word)
    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${reportData.fileName}"`
    );
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Send the HTML content
    res.send(reportData.htmlContent);

    // Log the export activity
    await AuditService.logActivity({
      userId,
      action: "EXPORT_TRANSACTION_HISTORY_WORD",
      resource: "ELRAWallet",
      resourceType: "ELRAWallet",
      resourceId: wallet._id,
      details: {
        filters,
        transactionCount: filteredTransactions.length,
        reportFileName: reportData.fileName,
      },
    });
  } catch (error) {
    console.error("Export Transaction History Word Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export transaction history Word report",
      error: error.message,
    });
  }
};
