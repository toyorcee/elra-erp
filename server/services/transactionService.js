import Transaction from "../models/Transaction.js";
import Subscription from "../models/Subscription.js";
import Company from "../models/Company.js";

class TransactionService {
  // Create a new transaction
  async createTransaction(transactionData) {
    try {
      const transaction = await Transaction.create({
        transactionId: Transaction.generateTransactionId(),
        reference: Transaction.generateReference(),
        ...transactionData,
      });
      return { success: true, data: transaction };
    } catch (error) {
      console.error("Error creating transaction:", error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction by ID
  async getTransactionById(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate("company", "name email")
        .populate("subscription", "plan billingCycle status");
      return { success: true, data: transaction };
    } catch (error) {
      console.error("Error getting transaction:", error);
      return { success: false, error: error.message };
    }
  }

  // Get transactions by company
  async getTransactionsByCompany(companyId, filters = {}) {
    try {
      const query = { company: companyId, ...filters };
      const transactions = await Transaction.find(query)
        .populate("subscription", "plan billingCycle status")
        .sort({ createdAt: -1 });
      return { success: true, data: transactions };
    } catch (error) {
      console.error("Error getting company transactions:", error);
      return { success: false, error: error.message };
    }
  }

  // Get all transactions with filters
  async getAllTransactions(filters = {}, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const transactions = await Transaction.find(filters)
        .populate("company", "name email")
        .populate("subscription", "plan billingCycle status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Transaction.countDocuments(filters);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      console.error("Error getting all transactions:", error);
      return { success: false, error: error.message };
    }
  }

  // Update transaction status
  async updateTransactionStatus(transactionId, status, additionalData = {}) {
    try {
      const updateData = {
        paymentStatus: status,
        processedAt: new Date(),
        ...additionalData,
      };

      const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        updateData,
        { new: true }
      );

      return { success: true, data: transaction };
    } catch (error) {
      console.error("Error updating transaction status:", error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction statistics
  async getTransactionStatistics(filters = {}) {
    try {
      const stats = await Transaction.getStatistics(filters);
      return { success: true, data: stats };
    } catch (error) {
      console.error("Error getting transaction statistics:", error);
      return { success: false, error: error.message };
    }
  }

  // Get revenue by period
  async getRevenueByPeriod(startDate, endDate, groupBy = "month") {
    try {
      const revenue = await Transaction.getRevenueByPeriod(
        startDate,
        endDate,
        groupBy
      );
      return { success: true, data: revenue };
    } catch (error) {
      console.error("Error getting revenue by period:", error);
      return { success: false, error: error.message };
    }
  }

  // Get pending transactions
  async getPendingTransactions() {
    try {
      const transactions = await Transaction.find({ paymentStatus: "pending" })
        .populate("company", "name email")
        .populate("subscription", "plan billingCycle")
        .sort({ createdAt: -1 });
      return { success: true, data: transactions };
    } catch (error) {
      console.error("Error getting pending transactions:", error);
      return { success: false, error: error.message };
    }
  }

  // Get failed transactions
  async getFailedTransactions() {
    try {
      const transactions = await Transaction.find({ paymentStatus: "failed" })
        .populate("company", "name email")
        .populate("subscription", "plan billingCycle")
        .sort({ createdAt: -1 });
      return { success: true, data: transactions };
    } catch (error) {
      console.error("Error getting failed transactions:", error);
      return { success: false, error: error.message };
    }
  }

  // Retry failed transaction
  async retryFailedTransaction(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return { success: false, error: "Transaction not found" };
      }

      if (transaction.paymentStatus !== "failed") {
        return { success: false, error: "Transaction is not failed" };
      }

      // Reset transaction status to pending
      transaction.paymentStatus = "pending";
      transaction.processedAt = null;
      await transaction.save();

      return { success: true, data: transaction };
    } catch (error) {
      console.error("Error retrying failed transaction:", error);
      return { success: false, error: error.message };
    }
  }

  // Get transactions by date range
  async getTransactionsByDateRange(startDate, endDate, filters = {}) {
    try {
      const query = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        ...filters,
      };

      const transactions = await Transaction.find(query)
        .populate("company", "name email")
        .populate("subscription", "plan billingCycle status")
        .sort({ createdAt: -1 });

      return { success: true, data: transactions };
    } catch (error) {
      console.error("Error getting transactions by date range:", error);
      return { success: false, error: error.message };
    }
  }

  // Get transactions by payment provider
  async getTransactionsByProvider(provider, filters = {}) {
    try {
      const query = { paymentProvider: provider, ...filters };
      const transactions = await Transaction.find(query)
        .populate("company", "name email")
        .populate("subscription", "plan billingCycle status")
        .sort({ createdAt: -1 });

      return { success: true, data: transactions };
    } catch (error) {
      console.error("Error getting transactions by provider:", error);
      return { success: false, error: error.message };
    }
  }

  // Export transactions to CSV
  async exportTransactionsToCSV(filters = {}) {
    try {
      const transactions = await Transaction.find(filters)
        .populate("company", "name email")
        .populate("subscription", "plan.name plan.displayName billingCycle")
        .sort({ createdAt: -1 });

      const csvData = transactions.map((transaction) => ({
        TransactionID: transaction.transactionId,
        Reference: transaction.reference,
        Company: transaction.company?.name || "N/A",
        CompanyEmail: transaction.company?.email || "N/A",
        Plan: transaction.subscription?.plan?.displayName || "N/A",
        BillingCycle: transaction.subscription?.billingCycle || "N/A",
        Amount: transaction.amount,
        Currency: transaction.currency,
        PaymentProvider: transaction.paymentProvider,
        PaymentStatus: transaction.paymentStatus,
        Type: transaction.type,
        Description: transaction.description,
        CreatedAt: transaction.createdAt.toISOString(),
        ProcessedAt: transaction.processedAt?.toISOString() || "N/A",
      }));

      return { success: true, data: csvData };
    } catch (error) {
      console.error("Error exporting transactions:", error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction summary for dashboard
  async getTransactionSummary() {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      const [totalStats, monthlyStats, yearlyStats, pendingCount, failedCount] =
        await Promise.all([
          Transaction.getStatistics(),
          Transaction.getStatistics({
            createdAt: { $gte: startOfMonth },
          }),
          Transaction.getStatistics({
            createdAt: { $gte: startOfYear },
          }),
          Transaction.countDocuments({ paymentStatus: "pending" }),
          Transaction.countDocuments({ paymentStatus: "failed" }),
        ]);

      return {
        success: true,
        data: {
          total: totalStats,
          monthly: monthlyStats,
          yearly: yearlyStats,
          pendingCount,
          failedCount,
        },
      };
    } catch (error) {
      console.error("Error getting transaction summary:", error);
      return { success: false, error: error.message };
    }
  }
}

export default new TransactionService();
