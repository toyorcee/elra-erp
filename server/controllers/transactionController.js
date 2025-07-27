import transactionService from "../services/transactionService.js";

// @desc    Get all transactions with pagination and filters
// @route   GET /api/transactions
// @access  Private (Platform Admin)
export const getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      provider,
      type,
      startDate,
      endDate,
    } = req.query;

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

    const result = await transactionService.getAllTransactions(
      filters,
      parseInt(page),
      parseInt(limit)
    );

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
    console.error("Get all transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transactions",
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private (Platform Admin, Company Admin)
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const result = await transactionService.getTransactionById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const transaction = result.data;

    // Check if user has access to this transaction
    if (user.role !== "platform_admin") {
      // Company admin can only see transactions for their company
      if (transaction.company._id.toString() !== user.company.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
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
    });
  }
};

// @desc    Get transactions by company
// @route   GET /api/transactions/company/:companyId
// @access  Private (Platform Admin, Company Admin)
export const getTransactionsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { user } = req;
    const { status, type, startDate, endDate } = req.query;

    // Check if user has access to this company
    if (user.role !== "platform_admin") {
      if (companyId !== user.company.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    const filters = {};
    if (status) filters.paymentStatus = status;
    if (type) filters.type = type;
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const result = await transactionService.getTransactionsByCompany(
      companyId,
      filters
    );

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
    console.error("Get transactions by company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get company transactions",
    });
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats/summary
// @access  Private (Platform Admin)
export const getTransactionStatistics = async (req, res) => {
  try {
    const { startDate, endDate, status, provider } = req.query;

    const filters = {};
    if (status) filters.paymentStatus = status;
    if (provider) filters.paymentProvider = provider;
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const result = await transactionService.getTransactionStatistics(filters);

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
    console.error("Get transaction statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction statistics",
    });
  }
};

// @desc    Get revenue by period
// @route   GET /api/transactions/stats/revenue
// @access  Private (Platform Admin)
export const getRevenueByPeriod = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const result = await transactionService.getRevenueByPeriod(
      new Date(startDate),
      new Date(endDate),
      groupBy
    );

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
    console.error("Get revenue by period error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get revenue data",
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
