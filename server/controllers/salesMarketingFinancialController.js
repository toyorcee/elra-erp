import asyncHandler from "../utils/asyncHandler.js";
import SalesFinancialTransaction from "../models/SalesFinancialTransaction.js";
import MarketingFinancialTransaction from "../models/MarketingFinancialTransaction.js";
import SalesMarketingFinancialService from "../services/SalesMarketingFinancialService.js";

// ===== CORE SALES & MARKETING CONTROLLERS =====

// Dashboard - Get combined analytics
export const getSalesMarketingDashboard = asyncHandler(async (req, res) => {
  const analytics = await SalesMarketingFinancialService.getCombinedAnalytics();

  res.json({
    success: true,
    data: analytics,
  });
});

// Get combined transactions (sales + marketing)
export const getSalesMarketingTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, status } = req.query;

  const salesQuery = { ...(type && { type }), ...(status && { status }) };
  const marketingQuery = { ...(type && { type }), ...(status && { status }) };

  const [salesTransactions, marketingTransactions] = await Promise.all([
    SalesFinancialTransaction.find(salesQuery)
      .populate("requestedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit),
    MarketingFinancialTransaction.find(marketingQuery)
      .populate("requestedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit),
  ]);

  const allTransactions = [...salesTransactions, ...marketingTransactions].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({
    success: true,
    data: {
      transactions: allTransactions,
      pagination: {
        current: page,
        pages: Math.ceil(allTransactions.length / limit),
        total: allTransactions.length,
      },
    },
  });
});

// Create transaction (determines if sales or marketing)
export const createSalesMarketingTransaction = asyncHandler(
  async (req, res) => {
    const { module } = req.body;

    const transactionData = {
      ...req.body,
      requestedBy: req.user._id,
      department: "Sales & Marketing",
      module: module || "sales", // Default to sales if not specified
    };

    const result = await SalesMarketingFinancialService.createTransaction(
      transactionData,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: `${
        module === "marketing" ? "Marketing" : "Sales"
      } transaction created successfully`,
      data: result,
    });
  }
);

// Get pending approvals
export const getSalesMarketingApprovals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // Get pending transactions from both sales and marketing
  const [salesPending, marketingPending] = await Promise.all([
    SalesFinancialTransaction.find({ status: "pending" })
      .populate("requestedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit),
    MarketingFinancialTransaction.find({ status: "pending" })
      .populate("requestedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit),
  ]);

  const allApprovals = [...salesPending, ...marketingPending].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({
    success: true,
    data: {
      approvals: allApprovals,
      pagination: {
        current: page,
        pages: Math.ceil(allApprovals.length / limit),
        total: allApprovals.length,
      },
    },
  });
});

// Approve transaction (works for both sales and marketing)
export const approveSalesMarketingTransaction = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    // Try to find in both sales and marketing
    const [salesTransaction, marketingTransaction] = await Promise.all([
      SalesFinancialTransaction.findById(id),
      MarketingFinancialTransaction.findById(id),
    ]);

    let result;
    if (salesTransaction) {
      result = await SalesMarketingFinancialService.approveTransaction(
        "sales",
        id,
        req.user._id,
        req.body.comments
      );
    } else if (marketingTransaction) {
      result = await SalesMarketingFinancialService.approveTransaction(
        "marketing",
        id,
        req.user._id,
        req.body.comments
      );
    } else {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      message: "Transaction approved successfully",
      data: result,
    });
  }
);

// Reject transaction (works for both sales and marketing)
export const rejectSalesMarketingTransaction = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    // Try to find in both sales and marketing
    const [salesTransaction, marketingTransaction] = await Promise.all([
      SalesFinancialTransaction.findById(id),
      MarketingFinancialTransaction.findById(id),
    ]);

    let result;
    if (salesTransaction) {
      result = await SalesMarketingFinancialService.rejectTransaction(
        "sales",
        id,
        req.user._id,
        req.body.reason
      );
    } else if (marketingTransaction) {
      result = await SalesMarketingFinancialService.rejectTransaction(
        "marketing",
        id,
        req.user._id,
        req.body.reason
      );
    } else {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      message: "Transaction rejected successfully",
      data: result,
    });
  }
);

// Reports (same as dashboard for now)
export const getSalesMarketingReports = asyncHandler(async (req, res) => {
  const analytics = await SalesMarketingFinancialService.getCombinedAnalytics();

  res.json({
    success: true,
    data: analytics,
  });
});

// Get sales categories
export const getSalesCategories = asyncHandler(async (req, res) => {
  const categories = [
    "Client Acquisition",
    "Sales Training",
    "Sales Tools",
    "Commission Payments",
    "Sales Events",
    "Lead Generation",
    "Sales Materials",
    "Sales Software",
    "Travel & Entertainment",
    "Other Sales Expenses",
  ];

  res.json({
    success: true,
    data: categories,
  });
});

// Get marketing categories
export const getMarketingCategories = asyncHandler(async (req, res) => {
  const categories = [
    "Digital Advertising",
    "Social Media Marketing",
    "Content Creation",
    "Email Marketing",
    "SEO/SEM",
    "Print Advertising",
    "Event Marketing",
    "Influencer Marketing",
    "Marketing Tools",
    "Brand Development",
    "Market Research",
    "Other Marketing Expenses",
  ];

  res.json({
    success: true,
    data: categories,
  });
});
