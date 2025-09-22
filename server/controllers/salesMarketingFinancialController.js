import SalesMarketingFinancialService from "../services/salesMarketingFinancialService.js";
import ELRAWallet from "../models/ELRAWallet.js";

// ===== DASHBOARD =====
export const getSalesMarketingDashboard = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.getDashboardData();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== TRANSACTIONS =====
export const getSalesMarketingTransactions = async (req, res) => {
  try {
    const { module, status } = req.query;
    const result = await SalesMarketingFinancialService.getTransactions(
      module,
      status
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting transactions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createSalesMarketingTransaction = async (req, res) => {
  try {
    console.log("🚀 [SALES_MARKETING_CONTROLLER] Creating transaction:", {
      type: req.body.type,
      amount: req.body.amount,
      module: req.body.module,
      title: req.body.title,
      category: req.body.category,
      budgetCategory: req.body.budgetCategory,
      userId: req.user.id,
      userEmail: req.user.email,
    });

    const result = await SalesMarketingFinancialService.createTransaction(
      req.body,
      req.user.id
    );

    if (result.success) {
      console.log(
        "✅ [SALES_MARKETING_CONTROLLER] Transaction created successfully:",
        {
          transactionId: result.data.transaction._id,
          status: result.data.transaction.status,
          amount: req.body.amount,
        }
      );

      res.status(201).json({
        success: true,
        data: result.data,
        message: "Transaction created successfully",
      });
    } else {
      console.log(
        "❌ [SALES_MARKETING_CONTROLLER] Transaction creation failed:",
        result.message
      );
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error(
      "❌ [SALES_MARKETING_CONTROLLER] Error creating transaction:",
      error.message
    );
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create transaction",
    });
  }
};

// ===== APPROVALS =====
export const getSalesMarketingApprovals = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.getPendingApprovals();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting approvals:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Sales & Marketing approval history
export const getSalesMarketingApprovalHistory = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.getApprovalHistory();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting approval history:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const approveSalesMarketingTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const result = await SalesMarketingFinancialService.approveTransaction(
      id,
      req.user.id,
      comments
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Transaction approved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error approving transaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const rejectSalesMarketingTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const result = await SalesMarketingFinancialService.rejectTransaction(
      id,
      req.user.id,
      comments
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Transaction rejected successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error rejecting transaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== REPORTS =====
export const getSalesMarketingReports = async (req, res) => {
  try {
    const { dateRange = "30d", departmentFilter = "all" } = req.query;
    const result = await SalesMarketingFinancialService.getReportsData(
      dateRange,
      departmentFilter
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== CATEGORIES =====
export const getSalesCategories = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.getSalesCategories();

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error getting sales categories:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMarketingCategories = async (req, res) => {
  try {
    const result =
      await SalesMarketingFinancialService.getMarketingCategories();

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error getting marketing categories:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== BUDGET INFORMATION =====
export const getOperationalBudget = async (req, res) => {
  try {
    const wallet = await ELRAWallet.findOne();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "ELRA wallet not found",
      });
    }

    const operationalBudget = wallet.budgetCategories.operational;

    res.status(200).json({
      success: true,
      data: {
        available: operationalBudget.available,
        allocated: operationalBudget.allocated,
        used: operationalBudget.used,
        reserved: operationalBudget.reserved || 0,
        total: operationalBudget.allocated,
        isLow: operationalBudget.available < 5000000,
        isVeryLow: operationalBudget.available < 1000000,
        threshold: 5000000,
      },
    });
  } catch (error) {
    console.error("Error getting operational budget:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
