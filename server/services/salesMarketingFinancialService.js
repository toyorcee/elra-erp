import SalesFinancialTransaction from "../models/SalesFinancialTransaction.js";
import MarketingFinancialTransaction from "../models/MarketingFinancialTransaction.js";
import ELRAWallet from "../models/ELRAWallet.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import AuditService from "./auditService.js";

class SalesMarketingFinancialService {
  /**
   * Determine which model to use based on transaction type
   */
  static getModel(transactionType) {
    switch (transactionType) {
      case "sales":
        return SalesFinancialTransaction;
      case "marketing":
        return MarketingFinancialTransaction;
      default:
        throw new Error(`Invalid transaction type: ${transactionType}`);
    }
  }

  /**
   * Create a financial transaction
   */
  static async createTransaction(transactionData, userId) {
    const { type, amount, budgetCategory, module } = transactionData;
    const transactionType = module; // sales or marketing

    try {
      // Get the appropriate model
      const Model = this.getModel(transactionType);

      // Generate transaction ID
      const transactionId = Model.generateTransactionId();

      // Create transaction record
      const transaction = new Model({
        ...transactionData,
        transactionId,
        requestedBy: userId,
        requestedAt: new Date(),
      });

      // If it's an expense, reserve funds from ELRA wallet
      if (type === "expense" && budgetCategory) {
        const reservationId = await this.reserveFunds(
          budgetCategory,
          amount,
          transactionId,
          userId
        );
        transaction.budgetReservationId = reservationId;
      }

      // Save transaction
      await transaction.save();

      // Send notifications
      await this.sendCreationNotifications(transaction, transactionType);

      // Log audit
      await AuditService.logActivity({
        userId,
        action: "CREATE_FINANCIAL_TRANSACTION",
        resourceType: transactionType.toUpperCase() + "_FINANCIAL_TRANSACTION",
        resourceId: transaction._id,
        details: {
          transactionType,
          type,
          amount,
          category: transactionData.category,
        },
      });

      return transaction;
    } catch (error) {
      console.error("Error creating financial transaction:", error);
      throw error;
    }
  }

  /**
   * Reserve funds from ELRA wallet budget category
   */
  static async reserveFunds(budgetCategory, amount, transactionId, userId) {
    try {
      const wallet = await ELRAWallet.findOne();
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      const reservationId = `RES_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      // Reserve funds from budget category
      await wallet.reserveFromCategory(
        budgetCategory,
        amount,
        `Transaction: ${transactionId}`,
        reservationId,
        userId
      );

      return reservationId;
    } catch (error) {
      console.error("Error reserving funds:", error);
      throw error;
    }
  }

  /**
   * Process expense payment
   */
  static async processExpensePayment(
    transactionId,
    transactionType,
    processedBy
  ) {
    try {
      const Model = this.getModel(transactionType);
      const transaction = await Model.findById(transactionId);

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.type !== "expense") {
        throw new Error("Only expenses can be processed for payment");
      }

      // Use reserved funds from ELRA wallet
      await this.useReservedFunds(
        transaction.budgetCategory,
        transaction.amount,
        transaction.budgetReservationId,
        transactionId,
        processedBy
      );

      // Update transaction status
      transaction.status = "processed";
      transaction.processedBy = processedBy;
      transaction.processedAt = new Date();
      await transaction.save();

      // Send payment confirmation
      await this.sendPaymentConfirmation(transaction, transactionType);

      // Log audit
      await AuditService.logActivity({
        userId: processedBy,
        action: "PROCESS_EXPENSE_PAYMENT",
        resourceType: transactionType.toUpperCase() + "_FINANCIAL_TRANSACTION",
        resourceId: transaction._id,
        details: {
          amount: transaction.amount,
          category: transaction.category,
        },
      });

      return transaction;
    } catch (error) {
      console.error("Error processing expense payment:", error);
      throw error;
    }
  }

  /**
   * Process revenue receipt
   */
  static async processRevenueReceipt(
    transactionId,
    transactionType,
    processedBy
  ) {
    try {
      const Model = this.getModel(transactionType);
      const transaction = await Model.findById(transactionId);

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.type !== "revenue") {
        throw new Error("Only revenue can be processed for receipt");
      }

      // Add funds to ELRA wallet main pool
      await this.addRevenueToWallet(
        transaction.amount,
        transactionId,
        processedBy
      );

      // Update transaction status
      transaction.status = "processed";
      transaction.processedBy = processedBy;
      transaction.processedAt = new Date();
      await transaction.save();

      // Send receipt confirmation
      await this.sendReceiptConfirmation(transaction, transactionType);

      // Log audit
      await AuditService.logActivity({
        userId: processedBy,
        action: "PROCESS_REVENUE_RECEIPT",
        resourceType: transactionType.toUpperCase() + "_FINANCIAL_TRANSACTION",
        resourceId: transaction._id,
        details: {
          amount: transaction.amount,
          category: transaction.category,
        },
      });

      return transaction;
    } catch (error) {
      console.error("Error processing revenue receipt:", error);
      throw error;
    }
  }

  /**
   * Use reserved funds from ELRA wallet
   */
  static async useReservedFunds(
    budgetCategory,
    amount,
    reservationId,
    transactionId,
    userId
  ) {
    try {
      const wallet = await ELRAWallet.findOne();
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      // Use reserved funds
      await wallet.useFromCategory(
        budgetCategory,
        amount,
        `Payment: ${transactionId}`,
        reservationId,
        userId
      );

      // Create transaction record in ELRA wallet
      await wallet.addTransaction({
        type: "withdrawal",
        amount,
        description: `Expense Payment: ${transactionId}`,
        reference: transactionId,
        referenceType: "expense",
        createdBy: userId,
      });
    } catch (error) {
      console.error("Error using reserved funds:", error);
      throw error;
    }
  }

  /**
   * Add revenue to ELRA wallet
   */
  static async addRevenueToWallet(amount, transactionId, userId) {
    try {
      const wallet = await ELRAWallet.findOne();
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      // Add to main pool
      await wallet.addFunds(
        amount,
        `Revenue: ${transactionId}`,
        transactionId,
        userId
      );

      // Create transaction record in ELRA wallet
      await wallet.addTransaction({
        type: "deposit",
        amount,
        description: `Revenue: ${transactionId}`,
        reference: transactionId,
        referenceType: "revenue",
        createdBy: userId,
      });
    } catch (error) {
      console.error("Error adding revenue to wallet:", error);
      throw error;
    }
  }

  /**
   * Send creation notifications
   */
  static async sendCreationNotifications(transaction, transactionType) {
    try {
      // Find approvers based on approval level
      const approvers = await this.findApprovers(transaction.approvalLevel);

      for (const approver of approvers) {
        await new Notification({
          recipient: approver._id,
          type: "FINANCIAL_TRANSACTION_PENDING",
          title: `New ${transactionType} ${transaction.type} request`,
          message: `${
            transaction.title
          } - ₦${transaction.amount.toLocaleString()}`,
          priority: "medium",
          data: {
            transactionId: transaction._id,
            transactionType,
            amount: transaction.amount,
            category: transaction.category,
            actionUrl: `/dashboard/modules/sales-marketing/transactions/${transaction._id}`,
          },
        }).save();
      }
    } catch (error) {
      console.error("Error sending creation notifications:", error);
    }
  }

  /**
   * Find approvers based on approval level
   */
  static async findApprovers(approvalLevel) {
    try {
      let approvers = [];

      switch (approvalLevel) {
        case "department":
          // Find Sales & Marketing HOD
          approvers = await User.find({
            "department.name": "Sales & Marketing",
            "role.name": "HOD",
            isActive: true,
          })
            .populate("role", "name level")
            .populate("department", "name");
          break;

        case "finance":
          // Find Finance HOD
          approvers = await User.find({
            "department.name": "Finance & Accounting",
            "role.name": "HOD",
            isActive: true,
          })
            .populate("role", "name level")
            .populate("department", "name");
          break;

        case "executive":
          // Find Executive HOD
          approvers = await User.find({
            "department.name": "Executive Office",
            "role.name": "HOD",
            isActive: true,
          })
            .populate("role", "name level")
            .populate("department", "name");
          break;
      }

      return approvers;
    } catch (error) {
      console.error("Error finding approvers:", error);
      return [];
    }
  }

  /**
   * Send payment confirmation
   */
  static async sendPaymentConfirmation(transaction, transactionType) {
    try {
      await new Notification({
        recipient: transaction.requestedBy,
        type: "PAYMENT_PROCESSED",
        title: `Payment processed for ${transaction.title}`,
        message: `Your ${transactionType} expense of ₦${transaction.amount.toLocaleString()} has been processed.`,
        priority: "low",
        data: {
          transactionId: transaction._id,
          amount: transaction.amount,
          actionUrl: `/dashboard/modules/sales-marketing/transactions/${transaction._id}`,
        },
      }).save();
    } catch (error) {
      console.error("Error sending payment confirmation:", error);
    }
  }

  /**
   * Send receipt confirmation
   */
  static async sendReceiptConfirmation(transaction, transactionType) {
    try {
      await new Notification({
        recipient: transaction.requestedBy,
        type: "REVENUE_RECEIVED",
        title: `Revenue received for ${transaction.title}`,
        message: `Your ${transactionType} revenue of ₦${transaction.amount.toLocaleString()} has been processed.`,
        priority: "low",
        data: {
          transactionId: transaction._id,
          amount: transaction.amount,
          actionUrl: `/dashboard/modules/sales-marketing/transactions/${transaction._id}`,
        },
      }).save();
    } catch (error) {
      console.error("Error sending receipt confirmation:", error);
    }
  }

  /**
   * Approve a transaction
   */
  static async approveTransaction(
    transactionType,
    transactionId,
    approverId,
    comments = ""
  ) {
    try {
      const Model = this.getModel(transactionType);

      const transaction = await Model.findById(transactionId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      transaction.status = "approved";
      transaction.approvedBy = approverId;
      transaction.approvedAt = new Date();
      transaction.approvalComments = comments;

      await transaction.save();

      // Send notification to requester
      await this.sendApprovalNotification(transaction);

      return transaction;
    } catch (error) {
      console.error("Error approving transaction:", error);
      throw error;
    }
  }

  /**
   * Reject a transaction
   */
  static async rejectTransaction(
    transactionType,
    transactionId,
    rejectorId,
    reason = ""
  ) {
    try {
      const Model = this.getModel(transactionType);

      const transaction = await Model.findById(transactionId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      transaction.status = "rejected";
      transaction.rejectedBy = rejectorId;
      transaction.rejectedAt = new Date();
      transaction.rejectionReason = reason;

      // Release reserved funds if any
      if (transaction.budgetReservationId) {
        await this.releaseReservedFunds(transaction.budgetReservationId);
      }

      await transaction.save();

      // Send notification to requester
      await this.sendRejectionNotification(transaction);

      return transaction;
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      throw error;
    }
  }

  /**
   * Process a transaction (execute payment/receipt)
   */
  static async processTransaction(
    transactionType,
    transactionId,
    processorId,
    processData = {}
  ) {
    try {
      const Model = this.getModel(transactionType);

      const transaction = await Model.findById(transactionId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.status !== "approved") {
        throw new Error("Transaction must be approved before processing");
      }

      // Process based on transaction type
      if (transaction.type === "expense") {
        await this.processExpensePayment(transaction, processorId, processData);
      } else if (transaction.type === "revenue") {
        await this.processRevenueReceipt(transaction, processorId, processData);
      }

      transaction.status = "processed";
      transaction.processedBy = processorId;
      transaction.processedAt = new Date();

      await transaction.save();

      return transaction;
    } catch (error) {
      console.error("Error processing transaction:", error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(transactionType) {
    try {
      const Model = this.getModel(transactionType);

      const stats = await Model.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      const totalTransactions = await Model.countDocuments();
      const totalAmount = await Model.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      return {
        byStatus: stats,
        totalTransactions,
        totalAmount: totalAmount[0]?.total || 0,
      };
    } catch (error) {
      console.error("Error getting transaction stats:", error);
      throw error;
    }
  }

  /**
   * Get combined analytics for Sales & Marketing
   */
  static async getCombinedAnalytics() {
    try {
      // Get sales statistics
      const salesStats = await SalesFinancialTransaction.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      // Get marketing statistics
      const marketingStats = await MarketingFinancialTransaction.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      // Get recent transactions (last 5 from both sales and marketing)
      const [recentSales, recentMarketing] = await Promise.all([
        SalesFinancialTransaction.find()
          .populate("requestedBy", "firstName lastName email")
          .sort({ createdAt: -1 })
          .limit(5),
        MarketingFinancialTransaction.find()
          .populate("requestedBy", "firstName lastName email")
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      const recentTransactions = [...recentSales, ...recentMarketing]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Calculate totals
      const salesExpenses =
        salesStats.find((s) => s._id === "expense")?.totalAmount || 0;
      const salesRevenue =
        salesStats.find((s) => s._id === "revenue")?.totalAmount || 0;
      const marketingExpenses =
        marketingStats.find((m) => m._id === "expense")?.totalAmount || 0;
      const marketingRevenue =
        marketingStats.find((m) => m._id === "revenue")?.totalAmount || 0;

      return {
        sales: {
          totalRevenue: salesRevenue,
          totalExpenses: salesExpenses,
          pendingTransactions:
            salesStats.find((s) => s._id === "pending")?.count || 0,
          completedTransactions:
            salesStats.find((s) => s._id === "completed")?.count || 0,
        },
        marketing: {
          totalRevenue: marketingRevenue,
          totalExpenses: marketingExpenses,
          pendingTransactions:
            marketingStats.find((m) => m._id === "pending")?.count || 0,
          completedTransactions:
            marketingStats.find((m) => m._id === "completed")?.count || 0,
        },
        combined: {
          totalRevenue: salesRevenue + marketingRevenue,
          totalExpenses: salesExpenses + marketingExpenses,
          pendingTransactions:
            (salesStats.find((s) => s._id === "pending")?.count || 0) +
            (marketingStats.find((m) => m._id === "pending")?.count || 0),
          completedTransactions:
            (salesStats.find((s) => s._id === "completed")?.count || 0) +
            (marketingStats.find((m) => m._id === "completed")?.count || 0),
        },
        recentTransactions: recentTransactions.map((transaction) => ({
          id: transaction._id,
          title: transaction.title,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          module:
            transaction.module ||
            (transaction.constructor.modelName === "SalesFinancialTransaction"
              ? "sales"
              : "marketing"),
          requestedBy: transaction.requestedBy,
          createdAt: transaction.createdAt,
        })),
      };
    } catch (error) {
      console.error("Error getting combined analytics:", error);
      throw error;
    }
  }
}

export default SalesMarketingFinancialService;
