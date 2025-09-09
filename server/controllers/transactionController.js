import Transaction from "../models/Transaction.js";
import * as transactionService from "../services/transactionService.js";

// @desc    Get all procurement payment transactions
// @route   GET /api/transactions
// @access  Private (HOD+)
export const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const filters = {};

    if (status) filters.paymentStatus = status;
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Transaction.find(filters)
      .populate("procurementOrder", "poNumber title status")
      .populate("processedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
    });
  } catch (error) {
    console.error("Get all transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transactions",
      error: error.message,
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private (HOD+)
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate("procurementOrder", "poNumber title status items supplier")
      .populate("processedBy", "firstName lastName email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Get transaction by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction",
      error: error.message,
    });
  }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private (HOD+)
export const createTransaction = async (req, res) => {
  try {
    const {
      procurementOrder,
      amount,
      currency,
      description,
      paymentMethod,
      supplier,
      notes,
    } = req.body;

    const currentUser = req.user;

    // Validate required fields
    if (!procurementOrder || !amount || !supplier) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: procurementOrder, amount, supplier",
      });
    }

    const paymentData = {
      procurementOrder,
      amount,
      currency: currency || "NGN",
      description: description || `Payment for Procurement Order`,
      paymentMethod: paymentMethod || "manual",
      supplier,
      processedBy: currentUser._id,
      notes: notes || "Payment marked as completed",
    };

    const transaction = await Transaction.createProcurementPayment(paymentData);

    // Populate the transaction with related data
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate("procurementOrder", "poNumber title status")
      .populate("processedBy", "firstName lastName email");

    console.log(
      `✅ [TRANSACTION] Procurement payment created: ${transaction.transactionId}`
    );

    res.status(201).json({
      success: true,
      message: "Procurement payment transaction created successfully",
      data: populatedTransaction,
    });
  } catch (error) {
    console.error("❌ [TRANSACTION] Create procurement payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create procurement payment transaction",
      error: error.message,
    });
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private (HOD+)
export const getTransactionStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filters = {};
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const stats = await Transaction.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0] },
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "failed"] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get transaction statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction statistics",
      error: error.message,
    });
  }
};

// @desc    Get pending transactions
// @route   GET /api/transactions/pending
// @access  Private (Platform Admin)
export const getPendingTransactions = async (req, res) => {
  try {
    const result = await transactionService.getPendingTransactions();

    if (!result.success) {
      return res.status(400).json({
        success: false,

        message: result.error,
      });
    }

    res.status(200).json({
      success: true,

      data: result.data,
    });
  } catch (error) {
    console.error("Get pending transactions error:", error);

    res.status(500).json({
      success: false,

      message: "Failed to get pending transactions",
    });
  }
};

// @desc    Get failed transactions

// @route   GET /api/transactions/failed

// @access  Private (Platform Admin)

export const getFailedTransactions = async (req, res) => {
  try {
    const result = await transactionService.getFailedTransactions();

    if (!result.success) {
      return res.status(400).json({
        success: false,

        message: result.error,
      });
    }

    res.status(200).json({
      success: true,

      data: result.data,
    });
  } catch (error) {
    console.error("Get failed transactions error:", error);

    res.status(500).json({
      success: false,

      message: "Failed to get failed transactions",
    });
  }
};

// @desc    Retry failed transaction

// @route   POST /api/transactions/:id/retry

// @access  Private (Platform Admin)

export const retryFailedTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await transactionService.retryFailedTransaction(id);

    if (!result.success) {
      return res.status(400).json({
        success: false,

        message: result.error,
      });
    }

    res.status(200).json({
      success: true,

      data: result.data,

      message: "Transaction retry initiated",
    });
  } catch (error) {
    console.error("Retry failed transaction error:", error);

    res.status(500).json({
      success: false,

      message: "Failed to retry transaction",
    });
  }
};

// @desc    Export transactions to CSV

// @route   GET /api/transactions/export

// @access  Private (Platform Admin)

export const exportTransactions = async (req, res) => {
  try {
    const { status, provider, type, startDate, endDate } = req.query;

    const filters = {};

    if (status) filters.paymentStatus = status;

    if (provider) filters.paymentProvider = provider;

    if (type) filters.type = type;

    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),

        $lte: new Date(endDate),
      };
    }

    const result = await transactionService.exportTransactionsToCSV(filters);

    if (!result.success) {
      return res.status(400).json({
        success: false,

        message: result.error,
      });
    }

    // Set headers for CSV download

    res.setHeader("Content-Type", "text/csv");

    res.setHeader(
      "Content-Disposition",

      `attachment; filename="transactions-${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );

    // Convert data to CSV format

    const csvData = result.data;

    if (csvData.length === 0) {
      return res.status(404).json({
        success: false,

        message: "No transactions found for export",
      });
    }

    // Create CSV headers

    const headers = Object.keys(csvData[0]);

    const csvContent = [
      headers.join(","),

      ...csvData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export transactions error:", error);

    res.status(500).json({
      success: false,

      message: "Failed to export transactions",
    });
  }
};

// @desc    Get transaction summary for dashboard

// @route   GET /api/transactions/dashboard/summary

// @access  Private (Platform Admin)

export const getTransactionSummary = async (req, res) => {
  try {
    const result = await transactionService.getTransactionSummary();

    if (!result.success) {
      return res.status(400).json({
        success: false,

        message: result.error,
      });
    }

    res.status(200).json({
      success: true,

      data: result.data,
    });
  } catch (error) {
    console.error("Get transaction summary error:", error);

    res.status(500).json({
      success: false,

      message: "Failed to get transaction summary",
    });
  }
};

// @desc    Create procurement payment transaction
// @route   POST /api/transactions/procurement-payment
// @access  Private (HOD+)
export const createProcurementPayment = async (req, res) => {
  try {
    const {
      procurementOrder,
      amount,
      currency,
      description,
      paymentMethod,
      supplier,
      notes,
      poNumber,
      projectName,
      projectCode,
    } = req.body;

    const currentUser = req.user;

    // Validate required fields
    if (!procurementOrder || !amount || !supplier) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: procurementOrder, amount, supplier",
      });
    }

    const paymentData = {
      procurementOrder,
      amount,
      currency: currency || "NGN",
      description: description || `Payment for Procurement Order ${poNumber}`,
      paymentMethod: paymentMethod || "manual",
      supplier,
      processedBy: currentUser._id,
      notes: notes || "Payment marked as completed",
      poNumber,
      projectName,
      projectCode,
    };

    const transaction = await Transaction.createProcurementPayment(paymentData);

    // Populate the transaction with related data
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate("procurementOrder", "poNumber title status")
      .populate("processedBy", "firstName lastName email");

    console.log(
      `✅ [TRANSACTION] Procurement payment created: ${transaction.transactionId}`
    );

    res.status(201).json({
      success: true,
      message: "Procurement payment transaction created successfully",
      data: populatedTransaction,
    });
  } catch (error) {
    console.error("❌ [TRANSACTION] Create procurement payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create procurement payment transaction",
      error: error.message,
    });
  }
};
