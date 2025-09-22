import ELRAWallet from "../models/ELRAWallet.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import AuditService from "./auditService.js";
import mongoose from "mongoose";

class SalesMarketingFinancialService {
  /**
   * Create a financial transaction directly in ELRA wallet
   */
  static async createTransaction(transactionData, userId) {
    const {
      type,
      amount,
      module,
      title,
      description,
      category,
      budgetCategory,
    } = transactionData;

    // Start MongoDB session for atomicity
    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        console.log("🚀 [SALES_MARKETING] Starting transaction creation...");
        console.log("📊 [SALES_MARKETING] Transaction Data:", {
          type,
          amount,
          module,
          title,
          description,
          category,
          budgetCategory,
        });
        console.log("👤 [SALES_MARKETING] User ID:", userId);

        // Get ELRA wallet with session
        const wallet = await ELRAWallet.findOne({
          elraInstance: "ELRA_MAIN",
        }).session(session);
        if (!wallet) {
          console.error("❌ [SALES_MARKETING] ELRA wallet not found");
          throw new Error("ELRA wallet not found");
        }

        console.log("💰 [SALES_MARKETING] Wallet found:", {
          id: wallet._id,
          totalFunds: wallet.totalFunds,
          availableFunds: wallet.availableFunds,
          transactionCount: wallet.transactions.length,
        });

        // Get user info for approval logic
        const user = await User.findById(userId)
          .populate("role")
          .populate("department")
          .session(session);

        console.log("👤 [SALES_MARKETING] User info:", {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          roleLevel: user.role?.level,
          department: user.department?.name,
          isSuperadmin: user.isSuperadmin,
        });

        const isSuperAdmin = user.role?.level === 1000 || user.isSuperadmin;
        const isRevenue = type === "revenue";
        const isExpense = type === "expense";

        console.log("🔍 [SALES_MARKETING] Transaction Analysis:", {
          isSuperAdmin,
          isRevenue,
          isExpense,
          amount,
        });

        // All expenses require executive approval (simplified)

        // Generate transaction reference
        const reference = `SM-${module.toUpperCase()}-${Date.now()}`;
        console.log("📝 [SALES_MARKETING] Generated reference:", reference);

        // Determine approval status based on logic
        let approvalStatus = "pending";
        let approvedBy = null;
        let approvedAt = null;
        let requiresExecutiveApproval = false;

        if (isSuperAdmin) {
          // Super Admin: Auto-approved
          approvalStatus = "approved";
          approvedBy = userId;
          approvedAt = new Date();
          console.log("✅ [SALES_MARKETING] Super Admin - Auto-approved");
        } else if (isRevenue) {
          approvalStatus = "approved";
          approvedBy = userId;
          approvedAt = new Date();
          console.log("✅ [SALES_MARKETING] Revenue - Auto-approved");
        } else if (isExpense) {
          approvalStatus = "pending";
          requiresExecutiveApproval = false;
          console.log(
            `⏳ [SALES_MARKETING] Expense (₦${amount.toLocaleString()}) - Pending approval (Finance only)`
          );
        }

        console.log("📋 [SALES_MARKETING] Approval Status:", {
          status: approvalStatus,
          requiresExecutiveApproval,
          approvedBy,
          approvedAt,
        });

        // Create transaction record in ELRA wallet
        const transactionRecord = {
          type: isRevenue ? "deposit" : "withdrawal",
          amount: amount,
          description: `${module.toUpperCase()}: ${title} - ${description}`,
          reference: reference,
          referenceType: module === "sales" ? "sales" : "marketing",
          category: category,
          budgetCategory: budgetCategory,
          status: approvalStatus,
          requestedBy: userId,
          requestedAt: new Date(),
          approvedBy: approvedBy,
          approvedAt: approvedAt,
          module: module,
          department: user.department?._id,
          requiresExecutiveApproval: requiresExecutiveApproval,
          createdBy: userId,
          balanceAfter: wallet.availableFunds,
        };

        console.log("📋 [SALES_MARKETING] Created transaction record:", {
          type: transactionRecord.type,
          amount: transactionRecord.amount,
          reference: transactionRecord.reference,
          status: transactionRecord.status,
          category: transactionRecord.category,
          budgetCategory: transactionRecord.budgetCategory,
        });

        // If approved, update wallet balances first
        if (approvalStatus === "approved") {
          console.log(
            "💰 [SALES_MARKETING] Updating wallet balances (approved)"
          );
          if (isRevenue) {
            // Add to total funds and available funds
            const oldTotalFunds = wallet.totalFunds;
            const oldAvailableFunds = wallet.availableFunds;

            wallet.totalFunds += amount;
            wallet.availableFunds += amount;

            console.log("💰 [SALES_MARKETING] Revenue added:", {
              amount,
              oldTotalFunds,
              newTotalFunds: wallet.totalFunds,
              oldAvailableFunds,
              newAvailableFunds: wallet.availableFunds,
            });
          } else if (isExpense) {
            // For expenses, deduct from operational budget category only
            if (
              budgetCategory === "operational" &&
              wallet.budgetCategories.operational
            ) {
              const category = wallet.budgetCategories.operational;
              if (category.available >= amount) {
                const oldAvailable = category.available;
                const oldUsed = category.used;

                category.available -= amount;
                category.used += amount;

                console.log(
                  `💸 [SALES_MARKETING] Expense deducted from operational budget:`,
                  {
                    amount,
                    oldAvailable,
                    newAvailable: category.available,
                    oldUsed,
                    newUsed: category.used,
                  }
                );
              } else {
                console.error(
                  `❌ [SALES_MARKETING] Insufficient funds in operational budget`
                );
                throw new Error(`Insufficient funds in operational budget`);
              }
            } else {
              console.error(
                `❌ [SALES_MARKETING] Sales & Marketing can only use operational budget`
              );
              throw new Error(
                `Sales & Marketing can only use operational budget`
              );
            }
          }
        } else {
          console.log(
            "⏳ [SALES_MARKETING] Transaction pending - reserving funds"
          );
          if (
            isExpense &&
            budgetCategory === "operational" &&
            wallet.budgetCategories.operational
          ) {
            const category = wallet.budgetCategories.operational;
            if (category.available >= amount) {
              const oldAvailable = category.available;
              const oldReserved = category.reserved;

              category.available -= amount;
              category.reserved += amount;

              wallet.reservedFunds += amount;

              console.log(
                `⏳ [SALES_MARKETING] Funds reserved in operational budget:`,
                {
                  amount,
                  oldAvailable,
                  newAvailable: category.available,
                  oldReserved,
                  newReserved: category.reserved,
                  mainWalletReserved: wallet.reservedFunds,
                }
              );
            } else {
              console.error(
                `❌ [SALES_MARKETING] Insufficient funds in operational budget for reservation`
              );

              await this.notifyInsufficientFunds(
                amount,
                user,
                category.available
              );

              throw new Error(`Insufficient funds in operational budget`);
            }
          }
        }

        transactionRecord.balanceAfter = wallet.availableFunds;

        wallet.transactions.push(transactionRecord);
        console.log("➕ [SALES_MARKETING] Added transaction to wallet");

        await wallet.save({ session });
        console.log("💾 [SALES_MARKETING] Wallet saved successfully");

        if (approvalStatus === "pending") {
          console.log("📧 [SALES_MARKETING] Sending approval notifications...");
          await this.notifyApprovers(
            amount,
            module,
            reference,
            userId,
            false,
            "expense"
          );
          console.log("✅ [SALES_MARKETING] Notifications sent");
        } else if (isRevenue) {
          console.log("📧 [SALES_MARKETING] Sending revenue notifications...");
          await this.notifyApprovers(
            amount,
            module,
            reference,
            userId,
            false,
            "revenue"
          );
          console.log("✅ [SALES_MARKETING] Revenue notifications sent");
        } else {
          console.log(
            "✅ [SALES_MARKETING] No notifications needed (auto-approved)"
          );
          console.log("📊 [SALES_MARKETING] Transaction Type:", {
            type: transactionRecord.type,
            isRevenue: isRevenue,
            isExpense: isExpense,
            autoApproved: true,
          });
        }

        // Log audit
        console.log("📝 [SALES_MARKETING] Creating audit log...");
        await AuditService.logActivity({
          userId: userId,
          action: "CREATE_SALES_MARKETING_TRANSACTION",
          resourceType: "ELRAWALLET",
          resourceId: wallet._id,
          details: {
            type: type,
            amount: amount,
            module: module,
            category: category,
            budgetCategory: budgetCategory,
            reference: reference,
            status: approvalStatus,
          },
        });
        console.log("✅ [SALES_MARKETING] Audit log created");

        console.log(
          "🎉 [SALES_MARKETING] Transaction creation completed successfully"
        );
        return {
          success: true,
          data: {
            transaction: transactionRecord,
            wallet: wallet,
            approvalStatus: approvalStatus,
          },
        };
      });

      return result;
    } catch (error) {
      console.error("❌ [SALES_MARKETING] Error creating transaction:", {
        error: error.message,
        stack: error.stack,
        transactionData: {
          type,
          amount,
          module,
          title,
          category,
          budgetCategory,
        },
        userId,
      });
      return {
        success: false,
        message: error.message,
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Approve a pending transaction
   */
  static async approveTransaction(transactionId, approverId, comments = "") {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      const transaction = wallet.transactions.id(transactionId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.status !== "pending") {
        throw new Error("Transaction is not pending approval");
      }

      // Update transaction
      transaction.status = "approved";
      transaction.approvedBy = approverId;
      transaction.approvedAt = new Date();
      transaction.approvalComments = comments;

      // If it's an expense, move from reserved to used in operational budget
      if (
        transaction.type === "withdrawal" &&
        transaction.budgetCategory === "operational"
      ) {
        const category = wallet.budgetCategories.operational;
        if (category) {
          const oldReserved = category.reserved;
          const oldUsed = category.used;

          category.reserved -= transaction.amount;
          category.used += transaction.amount;

          // Update main wallet reserved funds
          wallet.reservedFunds -= transaction.amount;

          console.log(
            `✅ [SALES_MARKETING] Approved expense - moved from reserved to used in operational budget:`,
            {
              amount: transaction.amount,
              oldReserved,
              newReserved: category.reserved,
              oldUsed,
              newUsed: category.used,
              mainWalletReserved: wallet.reservedFunds,
            }
          );
        }
      }

      await wallet.save();

      // Notify Sales & Marketing HOD about the approval
      await this.notifyApprovalResult(transaction, "approved", approverId);

      if (
        transaction.type === "withdrawal" &&
        transaction.budgetCategory === "operational"
      ) {
        await this.checkAndNotifyLowBudget(wallet, "operational");
      }

      await AuditService.logActivity({
        userId: approverId,
        action: "APPROVE_SALES_MARKETING_TRANSACTION",
        resourceType: "ELRAWALLET",
        resourceId: wallet._id,
        details: {
          transactionId: transactionId,
          amount: transaction.amount,
          comments: comments,
        },
      });

      return {
        success: true,
        data: { transaction, wallet },
      };
    } catch (error) {
      console.error("Error approving transaction:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Reject a pending transaction
   */
  static async rejectTransaction(transactionId, approverId, comments = "") {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      const transaction = wallet.transactions.id(transactionId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.status !== "pending") {
        throw new Error("Transaction is not pending approval");
      }

      // Update transaction
      transaction.status = "rejected";
      transaction.approvedBy = approverId;
      transaction.approvedAt = new Date();
      transaction.approvalComments = comments;

      if (
        transaction.type === "withdrawal" &&
        transaction.budgetCategory === "operational"
      ) {
        const category = wallet.budgetCategories.operational;
        if (category) {
          const oldReserved = category.reserved;
          const oldAvailable = category.available;

          category.reserved -= transaction.amount;
          category.available += transaction.amount;

          // Update main wallet reserved funds
          wallet.reservedFunds -= transaction.amount;

          console.log(
            `🔄 [SALES_MARKETING] Rejected expense - funds released in operational budget:`,
            {
              amount: transaction.amount,
              oldReserved,
              newReserved: category.reserved,
              oldAvailable,
              newAvailable: category.available,
              mainWalletReserved: wallet.reservedFunds,
            }
          );
        }
      }

      await wallet.save();

      // Notify Sales & Marketing HOD about the rejection
      await this.notifyApprovalResult(transaction, "rejected", approverId);

      await AuditService.logActivity({
        userId: approverId,
        action: "REJECT_SALES_MARKETING_TRANSACTION",
        resourceType: "ELRAWALLET",
        resourceId: wallet._id,
        details: {
          transactionId: transactionId,
          amount: transaction.amount,
          comments: comments,
        },
      });

      return {
        success: true,
        data: { transaction, wallet },
      };
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get reports data with summary and analytics
   */
  static async getReportsData(dateRange = "30d", departmentFilter = "all") {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      // Get sales and marketing transactions
      const salesTransactions = wallet.transactions.filter(
        (t) => t.referenceType === "sales"
      );
      const marketingTransactions = wallet.transactions.filter(
        (t) => t.referenceType === "marketing"
      );
      const allTransactions = [...salesTransactions, ...marketingTransactions];

      // Calculate date range filter
      const now = new Date();
      let startDate;
      switch (dateRange) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Filter transactions by date range
      const filteredTransactions = allTransactions.filter(
        (t) => new Date(t.requestedAt) >= startDate
      );

      // Filter by department if specified
      let finalTransactions = filteredTransactions;
      if (departmentFilter === "sales") {
        finalTransactions = filteredTransactions.filter(
          (t) => t.referenceType === "sales"
        );
      } else if (departmentFilter === "marketing") {
        finalTransactions = filteredTransactions.filter(
          (t) => t.referenceType === "marketing"
        );
      }

      // Calculate summary statistics
      const totalRevenue = finalTransactions
        .filter((t) => t.type === "deposit" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = finalTransactions
        .filter((t) => t.type === "withdrawal" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const salesRevenue = finalTransactions
        .filter(
          (t) =>
            t.referenceType === "sales" &&
            t.type === "deposit" &&
            t.status === "approved"
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const marketingRevenue = finalTransactions
        .filter(
          (t) =>
            t.referenceType === "marketing" &&
            t.type === "deposit" &&
            t.status === "approved"
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const salesExpenses = finalTransactions
        .filter(
          (t) =>
            t.referenceType === "sales" &&
            t.type === "withdrawal" &&
            t.status === "approved"
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const marketingExpenses = finalTransactions
        .filter(
          (t) =>
            t.referenceType === "marketing" &&
            t.type === "withdrawal" &&
            t.status === "approved"
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const totalTransactions = finalTransactions.length;
      const pendingTransactions = finalTransactions.filter(
        (t) => t.status === "pending"
      ).length;

      // Calculate monthly trends
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthTransactions = finalTransactions.filter(
          (t) =>
            new Date(t.requestedAt) >= monthStart &&
            new Date(t.requestedAt) <= monthEnd
        );

        const monthRevenue = monthTransactions
          .filter((t) => t.type === "deposit" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0);

        const monthExpenses = monthTransactions
          .filter((t) => t.type === "withdrawal" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0);

        monthlyData.push({
          month: monthStart.toLocaleDateString("en-US", { month: "short" }),
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        });
      }

      return {
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            totalTransactions,
            pendingTransactions,
            salesRevenue,
            marketingRevenue,
            salesExpenses,
            marketingExpenses,
          },
          monthlyTrends: monthlyData,
          departmentBreakdown: {
            sales: {
              revenue: salesRevenue,
              expenses: salesExpenses,
              profit: salesRevenue - salesExpenses,
              transactions: finalTransactions.filter(
                (t) => t.referenceType === "sales"
              ).length,
            },
            marketing: {
              revenue: marketingRevenue,
              expenses: marketingExpenses,
              profit: marketingRevenue - marketingExpenses,
              transactions: finalTransactions.filter(
                (t) => t.referenceType === "marketing"
              ).length,
            },
          },
          recentTransactions: finalTransactions
            .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
            .slice(0, 10),
        },
      };
    } catch (error) {
      console.error("Error getting reports data:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get dashboard data
   */
  static async getDashboardData() {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      // Get sales and marketing transactions
      const salesTransactions = wallet.transactions.filter(
        (t) => t.referenceType === "sales"
      );
      const marketingTransactions = wallet.transactions.filter(
        (t) => t.referenceType === "marketing"
      );
      const allTransactions = [...salesTransactions, ...marketingTransactions];

      // Calculate combined statistics
      const totalRevenue = allTransactions
        .filter((t) => t.type === "deposit" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = allTransactions
        .filter((t) => t.type === "withdrawal" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingApprovals = allTransactions.filter(
        (t) => t.status === "pending"
      ).length;

      const totalTransactions = allTransactions.length;

      // Calculate sales statistics
      const salesRevenue = salesTransactions
        .filter((t) => t.type === "deposit" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const salesExpenses = salesTransactions
        .filter((t) => t.type === "withdrawal" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const salesPendingTransactions = salesTransactions.filter(
        (t) => t.status === "pending"
      ).length;

      const salesCompletedTransactions = salesTransactions.filter(
        (t) => t.status === "approved"
      ).length;

      // Calculate marketing statistics
      const marketingRevenue = marketingTransactions
        .filter((t) => t.type === "deposit" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const marketingExpenses = marketingTransactions
        .filter((t) => t.type === "withdrawal" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const marketingPendingTransactions = marketingTransactions.filter(
        (t) => t.status === "pending"
      ).length;

      const marketingCompletedTransactions = marketingTransactions.filter(
        (t) => t.status === "approved"
      ).length;

      const recentTransactions = allTransactions
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
        .slice(0, 10);

      return {
        success: true,
        data: {
          combined: {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            pendingApprovals,
            totalTransactions,
          },
          sales: {
            totalRevenue: salesRevenue,
            totalExpenses: salesExpenses,
            pendingTransactions: salesPendingTransactions,
            completedTransactions: salesCompletedTransactions,
          },
          marketing: {
            totalRevenue: marketingRevenue,
            totalExpenses: marketingExpenses,
            pendingTransactions: marketingPendingTransactions,
            completedTransactions: marketingCompletedTransactions,
          },
          recentTransactions,
          walletBalance: wallet.totalFunds,
          availableFunds: wallet.availableFunds,
          reservedFunds: wallet.reservedFunds,
          budgetCategories: wallet.budgetCategories,
        },
      };
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get transactions for a specific module
   */
  static async getTransactions(module = null, status = null) {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      console.log("🔍 [SALES_MARKETING] Getting transactions with filters:", {
        module,
        status,
        totalTransactions: wallet.transactions.length,
      });

      // Log all transaction reference types for debugging
      const allReferenceTypes = wallet.transactions.map((t) => ({
        id: t._id,
        referenceType: t.referenceType,
        type: t.type,
        amount: t.amount,
        status: t.status,
      }));
      console.log(
        "📋 [SALES_MARKETING] All transaction reference types:",
        allReferenceTypes
      );

      let transactions = wallet.transactions.filter(
        (t) => t.referenceType === "sales" || t.referenceType === "marketing"
      );

      console.log("✅ [SALES_MARKETING] Filtered transactions:", {
        count: transactions.length,
        transactions: transactions.map((t) => ({
          id: t._id,
          referenceType: t.referenceType,
          type: t.type,
          amount: t.amount,
          status: t.status,
        })),
      });

      if (module) {
        transactions = transactions.filter((t) => t.referenceType === module);
      }

      if (status) {
        transactions = transactions.filter((t) => t.status === status);
      }

      // Sort by date (newest first)
      transactions.sort(
        (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
      );

      return {
        success: true,
        data: transactions,
      };
    } catch (error) {
      console.error("Error getting transactions:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get pending approvals
   */
  static async getPendingApprovals() {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      const pendingTransactions = wallet.transactions.filter(
        (t) =>
          t.status === "pending" &&
          (t.referenceType === "sales" || t.referenceType === "marketing")
      );

      // Populate user details and transform transaction types
      const populatedTransactions = await Promise.all(
        pendingTransactions.map(async (transaction) => {
          const requestedBy = await User.findById(transaction.requestedBy)
            .populate("role")
            .populate("department");

          return {
            ...transaction.toObject(),
            type: transaction.type === "deposit" ? "revenue" : "expense",
            requestedBy: requestedBy,
          };
        })
      );

      return {
        success: true,
        data: populatedTransactions,
      };
    } catch (error) {
      console.error("Error getting pending approvals:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get approval history (completed transactions)
   */
  static async getApprovalHistory() {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      const completedTransactions = wallet.transactions.filter(
        (t) =>
          (t.status === "approved" || t.status === "rejected") &&
          (t.referenceType === "sales" || t.referenceType === "marketing")
      );

      // Populate user details and transform transaction types
      const populatedTransactions = await Promise.all(
        completedTransactions.map(async (transaction) => {
          const requestedBy = await User.findById(transaction.requestedBy)
            .populate("role")
            .populate("department");

          const approvedBy = transaction.approvedBy
            ? await User.findById(transaction.approvedBy)
                .populate("role")
                .populate("department")
            : null;

          return {
            ...transaction.toObject(),
            type: transaction.type === "deposit" ? "revenue" : "expense",
            requestedBy: requestedBy,
            approvedBy: approvedBy,
          };
        })
      );

      // Sort by approval date (newest first)
      populatedTransactions.sort(
        (a, b) =>
          new Date(b.approvedAt || b.createdAt) -
          new Date(a.approvedAt || a.createdAt)
      );

      return {
        success: true,
        data: populatedTransactions,
      };
    } catch (error) {
      console.error("Error getting approval history:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Notify approvers about pending transactions
   */
  static async notifyApprovers(
    amount,
    module,
    reference,
    requestedBy,
    requiresExecutiveApproval = false,
    transactionType = "expense"
  ) {
    try {
      console.log("🔔 [SALES_MARKETING] Starting notification process:", {
        amount,
        module,
        reference,
        requiresExecutiveApproval,
      });

      const approvers = [];

      // Always notify Finance HOD
      const financeDept = await Department.findOne({
        name: "Finance & Accounting",
      });

      let financeHOD = null;
      if (financeDept) {
        const financeUsers = await User.find({
          department: financeDept._id,
          isActive: true,
        })
          .populate("role", "name level description")
          .populate("department", "name description");

        financeHOD = financeUsers.find(
          (user) =>
            user.role && (user.role.name === "HOD" || user.role.level >= 700)
        );
      }

      if (financeHOD) {
        approvers.push(financeHOD);
        console.log("✅ [SALES_MARKETING] Finance HOD found:", {
          name: `${financeHOD.firstName} ${financeHOD.lastName}`,
          email: financeHOD.email,
        });
      } else {
        console.log("❌ [SALES_MARKETING] Finance HOD not found");
      }

      // Always notify Sales & Marketing HOD
      const salesDept = await Department.findOne({
        name: "Sales & Marketing",
      });

      let salesMarketingHOD = null;
      if (salesDept) {
        const salesUsers = await User.find({
          department: salesDept._id,
          isActive: true,
        })
          .populate("role", "name level description")
          .populate("department", "name description");

        salesMarketingHOD = salesUsers.find(
          (user) =>
            user.role && (user.role.name === "HOD" || user.role.level >= 700)
        );
      }

      if (salesMarketingHOD) {
        approvers.push(salesMarketingHOD);
        console.log("✅ [SALES_MARKETING] Sales & Marketing HOD found:", {
          name: `${salesMarketingHOD.firstName} ${salesMarketingHOD.lastName}`,
          email: salesMarketingHOD.email,
        });
      } else {
        console.log("❌ [SALES_MARKETING] Sales & Marketing HOD not found");
      }

      // Notify Executive HOD if required (expenses >= ₦1M)
      if (requiresExecutiveApproval) {
        const executiveHOD = await User.findOne({
          $or: [
            { "role.level": 700, "department.name": "Executive Office" },
            { "role.name": "Executive" },
          ],
        })
          .populate("role")
          .populate("department");

        if (executiveHOD) {
          approvers.push(executiveHOD);
        }
      }

      // Always notify Super Admin
      const superAdmin = await User.findOne({
        $or: [{ "role.level": 1000 }, { isSuperadmin: true }],
      })
        .populate("role")
        .populate("department");

      if (superAdmin) {
        approvers.push(superAdmin);
        console.log("✅ [SALES_MARKETING] Super Admin found:", {
          name: `${superAdmin.firstName} ${superAdmin.lastName}`,
          email: superAdmin.email,
        });
      } else {
        console.log("❌ [SALES_MARKETING] Super Admin not found");
      }

      // Send notifications
      for (const approver of approvers) {
        if (approver) {
          const isExecutive =
            approver.role?.name === "Executive" ||
            approver.department?.name === "Executive Office";
          const isFinance =
            approver.department?.name === "Finance & Accounting";
          const isSalesMarketing =
            approver.department?.name === "Sales & Marketing";
          const isSuperAdmin =
            approver.role?.level === 1000 || approver.isSuperadmin;

          const isRevenueNotification = transactionType === "revenue";

          let title = `${module.toUpperCase()} Transaction Approval Required`;
          let message = `A ${module} expense of ₦${amount.toLocaleString()} (${reference}) requires your approval.`;

          if (isRevenueNotification) {
            title = `${module.toUpperCase()} Revenue Transaction`;
            message = `A ${module} revenue transaction of ₦${amount.toLocaleString()} (${reference}) has been processed.`;
          } else if (isExecutive) {
            title = `${module.toUpperCase()} Transaction - Executive Notification`;
            message = isRevenueNotification
              ? `A ${module} revenue transaction of ₦${amount.toLocaleString()} (${reference}) has been processed.`
              : `A ${module} expense of ₦${amount.toLocaleString()} (${reference}) has been submitted for finance approval.`;
          } else if (isSalesMarketing) {
            title = `${module.toUpperCase()} Transaction - Department Notification`;
            message = isRevenueNotification
              ? `A ${module} revenue transaction of ₦${amount.toLocaleString()} (${reference}) has been processed.`
              : `A ${module} transaction of ₦${amount.toLocaleString()} (${reference}) has been submitted for approval.`;
          } else if (isFinance) {
            title = `${module.toUpperCase()} Transaction - Finance Approval Required`;
            message = isRevenueNotification
              ? `A ${module} revenue transaction of ₦${amount.toLocaleString()} (${reference}) has been processed.`
              : `A ${module} expense of ₦${amount.toLocaleString()} (${reference}) requires your approval. Please review and approve this transaction in the Finance module.`;
          } else if (isSuperAdmin) {
            title = `${module.toUpperCase()} Transaction - Super Admin Notification`;
            message = isRevenueNotification
              ? `A ${module} revenue transaction of ₦${amount.toLocaleString()} (${reference}) has been processed.`
              : `A ${module} transaction of ₦${amount.toLocaleString()} (${reference}) has been submitted for approval.`;
          }

          await Notification.create({
            recipient: approver._id,
            type: "SALES_MARKETING_APPROVAL_REQUIRED",
            title: title,
            message: message,
            data: {
              transactionReference: reference,
              amount: amount,
              module: module,
              requestedBy: requestedBy,
              requiresExecutiveApproval: requiresExecutiveApproval,
            },
            priority: amount > 1000000 ? "high" : "medium",
          });

          console.log("📧 [SALES_MARKETING] Notification sent to:", {
            recipient: `${approver.firstName} ${approver.lastName}`,
            email: approver.email,
            role: approver.role?.name,
            department: approver.department?.name,
            title: title,
          });
        }
      }

      console.log("🎉 [SALES_MARKETING] Notification process completed:", {
        totalApprovers: approvers.length,
        approversNotified: approvers.map(
          (a) => `${a.firstName} ${a.lastName} (${a.department?.name})`
        ),
      });
    } catch (error) {
      console.error("❌ [SALES_MARKETING] Error notifying approvers:", error);
    }
  }

  /**
   * Get sales categories
   */
  static async getSalesCategories() {
    return {
      success: true,
      data: [
        // Revenue categories (ELRA leasing business)
        {
          value: "lease_agreements",
          label: "Lease Agreements",
          type: "revenue",
        },
        {
          value: "property_rentals",
          label: "Property Rentals",
          type: "revenue",
        },
        {
          value: "commercial_leases",
          label: "Commercial Leases",
          type: "revenue",
        },
        {
          value: "residential_leases",
          label: "Residential Leases",
          type: "revenue",
        },
        { value: "lease_renewals", label: "Lease Renewals", type: "revenue" },
        {
          value: "property_management_fees",
          label: "Property Management Fees",
          type: "revenue",
        },
        {
          value: "commission_earned",
          label: "Commission Earned",
          type: "revenue",
        },
        {
          value: "consultation_fees",
          label: "Consultation Fees",
          type: "revenue",
        },
        { value: "late_fees", label: "Late Fees", type: "revenue" },
        {
          value: "security_deposits",
          label: "Security Deposits",
          type: "revenue",
        },
        {
          value: "application_fees",
          label: "Application Fees",
          type: "revenue",
        },
        { value: "processing_fees", label: "Processing Fees", type: "revenue" },
        {
          value: "maintenance_fees",
          label: "Maintenance Fees",
          type: "revenue",
        },
        { value: "parking_fees", label: "Parking Fees", type: "revenue" },
        { value: "pet_fees", label: "Pet Fees", type: "revenue" },
        { value: "other", label: "Other", type: "revenue" },
        // Expense categories
        {
          value: "property_marketing",
          label: "Property Marketing",
          type: "expense",
        },
        {
          value: "client_acquisition",
          label: "Client Acquisition",
          type: "expense",
        },
        {
          value: "property_showings",
          label: "Property Showings",
          type: "expense",
        },
        { value: "sales_training", label: "Sales Training", type: "expense" },
        {
          value: "client_entertainment",
          label: "Client Entertainment",
          type: "expense",
        },
        { value: "travel_expenses", label: "Travel Expenses", type: "expense" },
        { value: "sales_materials", label: "Sales Materials", type: "expense" },
        { value: "lead_generation", label: "Lead Generation", type: "expense" },
        {
          value: "equipment_technology",
          label: "Equipment & Technology",
          type: "expense",
        },
        {
          value: "software_licenses",
          label: "Software & Licenses",
          type: "expense",
        },
        {
          value: "property_photography",
          label: "Property Photography",
          type: "expense",
        },
        {
          value: "video_production",
          label: "Video Production",
          type: "expense",
        },
        { value: "office_supplies", label: "Office Supplies", type: "expense" },
        {
          value: "telecommunications",
          label: "Telecommunications",
          type: "expense",
        },
        {
          value: "professional_services",
          label: "Professional Services",
          type: "expense",
        },
        {
          value: "insurance_premiums",
          label: "Insurance Premiums",
          type: "expense",
        },
        {
          value: "maintenance_repairs",
          label: "Maintenance & Repairs",
          type: "expense",
        },
        { value: "utilities", label: "Utilities", type: "expense" },
        { value: "other", label: "Other", type: "expense" },
      ],
    };
  }

  /**
   * Get marketing categories
   */
  static async getMarketingCategories() {
    return {
      success: true,
      data: [
        // Revenue categories (ELRA leasing business)
        {
          value: "lease_agreements",
          label: "Lease Agreements",
          type: "revenue",
        },
        {
          value: "property_rentals",
          label: "Property Rentals",
          type: "revenue",
        },
        {
          value: "commercial_leases",
          label: "Commercial Leases",
          type: "revenue",
        },
        {
          value: "residential_leases",
          label: "Residential Leases",
          type: "revenue",
        },
        { value: "lease_renewals", label: "Lease Renewals", type: "revenue" },
        {
          value: "property_management_fees",
          label: "Property Management Fees",
          type: "revenue",
        },
        {
          value: "commission_earned",
          label: "Commission Earned",
          type: "revenue",
        },
        {
          value: "consultation_fees",
          label: "Consultation Fees",
          type: "revenue",
        },
        { value: "late_fees", label: "Late Fees", type: "revenue" },
        {
          value: "security_deposits",
          label: "Security Deposits",
          type: "revenue",
        },
        {
          value: "application_fees",
          label: "Application Fees",
          type: "revenue",
        },
        { value: "processing_fees", label: "Processing Fees", type: "revenue" },
        {
          value: "maintenance_fees",
          label: "Maintenance Fees",
          type: "revenue",
        },
        { value: "parking_fees", label: "Parking Fees", type: "revenue" },
        { value: "pet_fees", label: "Pet Fees", type: "revenue" },
        {
          value: "property_sponsorships",
          label: "Property Sponsorships",
          type: "revenue",
        },
        {
          value: "partnership_revenue",
          label: "Partnership Revenue",
          type: "revenue",
        },
        {
          value: "referral_commissions",
          label: "Referral Commissions",
          type: "revenue",
        },
        {
          value: "property_listing_fees",
          label: "Property Listing Fees",
          type: "revenue",
        },
        { value: "event_revenue", label: "Event Revenue", type: "revenue" },
        { value: "brand_licensing", label: "Brand Licensing", type: "revenue" },
        {
          value: "advertising_revenue",
          label: "Advertising Revenue",
          type: "revenue",
        },
        {
          value: "content_licensing",
          label: "Content Licensing",
          type: "revenue",
        },
        {
          value: "affiliate_commissions",
          label: "Affiliate Commissions",
          type: "revenue",
        },
        {
          value: "premium_listings",
          label: "Premium Listings",
          type: "revenue",
        },
        { value: "other", label: "Other", type: "revenue" },
        // Expense categories
        {
          value: "property_digital_ads",
          label: "Property Digital Ads",
          type: "expense",
        },
        {
          value: "social_media_marketing",
          label: "Social Media Marketing",
          type: "expense",
        },
        {
          value: "property_content_creation",
          label: "Property Content Creation",
          type: "expense",
        },
        {
          value: "influencer_marketing",
          label: "Influencer Marketing",
          type: "expense",
        },
        { value: "email_marketing", label: "Email Marketing", type: "expense" },
        { value: "seo_tools", label: "SEO Tools", type: "expense" },
        { value: "analytics_tools", label: "Analytics Tools", type: "expense" },
        { value: "design_software", label: "Design Software", type: "expense" },
        {
          value: "property_photography",
          label: "Property Photography",
          type: "expense",
        },
        {
          value: "video_production",
          label: "Video Production",
          type: "expense",
        },
        { value: "property_events", label: "Property Events", type: "expense" },
        {
          value: "real_estate_conferences",
          label: "Real Estate Conferences",
          type: "expense",
        },
        { value: "trade_shows", label: "Trade Shows", type: "expense" },
        { value: "print_materials", label: "Print Materials", type: "expense" },
        { value: "branding", label: "Branding", type: "expense" },
        { value: "other", label: "Other", type: "expense" },
      ],
    };
  }

  /**
   * Notify Executive and Super Admin about insufficient funds
   */
  static async notifyInsufficientFunds(
    requestedAmount,
    requestingUser,
    availableAmount
  ) {
    try {
      console.log("🚨 [SALES_MARKETING] Sending insufficient funds alert:", {
        requestedAmount,
        availableAmount,
        requestingUser: `${requestingUser.firstName} ${requestingUser.lastName}`,
        department: requestingUser.department?.name,
      });

      const approvers = [];

      // Find Executive HOD
      const executiveDept = await Department.findOne({
        name: "Executive Office",
      });

      let executiveHOD = null;
      if (executiveDept) {
        const executiveUsers = await User.find({
          department: executiveDept._id,
          isActive: true,
        })
          .populate("role", "name level description")
          .populate("department", "name description");

        executiveHOD = executiveUsers.find(
          (user) =>
            user.role && (user.role.name === "HOD" || user.role.level >= 700)
        );
      }

      if (executiveHOD) {
        approvers.push(executiveHOD);
        console.log("✅ [SALES_MARKETING] Executive HOD found:", {
          name: `${executiveHOD.firstName} ${executiveHOD.lastName}`,
          email: executiveHOD.email,
        });
      }

      // Find Super Admin
      const superAdmin = await User.findOne({
        $or: [{ "role.level": 1000 }, { isSuperadmin: true }],
        isActive: true,
      })
        .populate("role", "name level description")
        .populate("department", "name description");

      if (superAdmin) {
        approvers.push(superAdmin);
        console.log("✅ [SALES_MARKETING] Super Admin found:", {
          name: `${superAdmin.firstName} ${superAdmin.lastName}`,
          email: superAdmin.email,
        });
      }

      // Send notifications to each approver
      for (const approver of approvers) {
        const notification = new Notification({
          recipient: approver._id,
          type: "INSUFFICIENT_FUNDS_ALERT",
          title: "🚨 Insufficient Funds Alert",
          message: `Sales & Marketing expense request of ₦${requestedAmount.toLocaleString()} cannot be processed. Only ₦${availableAmount.toLocaleString()} available in operational budget. Requested by ${
            requestingUser.firstName
          } ${requestingUser.lastName} (${requestingUser.department?.name}).`,
          data: {
            requestedAmount,
            availableAmount,
            requestingUser: {
              id: requestingUser._id,
              name: `${requestingUser.firstName} ${requestingUser.lastName}`,
              department: requestingUser.department?.name,
            },
            budgetCategory: "operational",
            module: "sales_marketing",
            priority: "high",
          },
          priority: "high",
        });

        await notification.save();
        console.log(
          `📧 [SALES_MARKETING] Insufficient funds notification sent to ${approver.firstName} ${approver.lastName}`
        );
      }

      console.log(
        "✅ [SALES_MARKETING] Insufficient funds notifications sent successfully"
      );
    } catch (error) {
      console.error(
        "❌ [SALES_MARKETING] Error sending insufficient funds notifications:",
        error
      );
    }
  }

  /**
   * Check if budget category is low and notify Finance HOD
   */
  static async checkAndNotifyLowBudget(
    wallet,
    budgetCategory,
    threshold = 5000000
  ) {
    try {
      const category = wallet.budgetCategories[budgetCategory];
      if (!category) {
        console.log(
          `⚠️ [SALES_MARKETING] Budget category ${budgetCategory} not found`
        );
        return;
      }

      const availableAmount = category.available;
      console.log(
        `💰 [SALES_MARKETING] Checking ${budgetCategory} budget: ₦${availableAmount.toLocaleString()} (threshold: ₦${threshold.toLocaleString()})`
      );

      if (availableAmount < threshold) {
        console.log(
          `🚨 [SALES_MARKETING] ${budgetCategory} budget is low! Notifying Finance HOD...`
        );

        // Find Finance HOD
        const financeDept = await mongoose.model("Department").findOne({
          name: "Finance & Accounting",
        });

        if (!financeDept) {
          console.log("❌ [SALES_MARKETING] Finance department not found");
          return;
        }

        const financeUsers = await User.find({
          department: financeDept._id,
          isActive: true,
        })
          .populate("role")
          .populate("department");

        const financeHOD = financeUsers.find(
          (user) =>
            user.role && (user.role.name === "HOD" || user.role.level >= 700)
        );

        if (financeHOD) {
          const notification = new Notification({
            recipient: financeHOD._id,
            type: "INSUFFICIENT_FUNDS_ALERT",
            title: `⚠️ Low ${
              budgetCategory.charAt(0).toUpperCase() + budgetCategory.slice(1)
            } Budget`,
            message: `${
              budgetCategory.charAt(0).toUpperCase() + budgetCategory.slice(1)
            } budget is running low. Available: ₦${availableAmount.toLocaleString()}. Consider adding more funds to avoid transaction failures.`,
            data: {
              budgetCategory,
              availableAmount,
              threshold,
              priority: "medium",
            },
            priority: "medium",
          });

          await notification.save();
          console.log(
            `📧 [SALES_MARKETING] Low budget notification sent to Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName}`
          );
        }
      }
    } catch (error) {
      console.error("❌ [SALES_MARKETING] Error checking low budget:", error);
    }
  }

  /**
   * Notify Sales & Marketing HOD about approval/rejection result
   */
  static async notifyApprovalResult(transaction, result, approverId) {
    try {
      console.log(`🔔 [SALES_MARKETING] Notifying Sales HOD about ${result}:`, {
        transactionId: transaction._id,
        amount: transaction.amount,
        result,
      });

      // Find Sales & Marketing HOD
      const salesDept = await Department.findOne({
        name: "Sales & Marketing",
      });

      let salesMarketingHOD = null;
      if (salesDept) {
        const salesUsers = await User.find({
          department: salesDept._id,
          isActive: true,
        })
          .populate("role", "name level description")
          .populate("department", "name description");

        salesMarketingHOD = salesUsers.find(
          (user) =>
            user.role && (user.role.name === "HOD" || user.role.level >= 700)
        );
      }

      if (salesMarketingHOD) {
        const isApproved = result === "approved";
        const title = `${transaction.module.toUpperCase()} Transaction ${
          isApproved ? "Approved" : "Rejected"
        }`;
        const message = `Your ${transaction.module} ${
          transaction.type === "deposit" ? "revenue" : "expense"
        } transaction of ₦${transaction.amount.toLocaleString()} (${
          transaction.reference
        }) has been ${result} by Finance.`;

        const notification = new Notification({
          recipient: salesMarketingHOD._id,
          title,
          message,
          type: isApproved ? "TRANSACTION_APPROVED" : "TRANSACTION_REJECTED",
          priority: "high",
          metadata: {
            transactionId: transaction._id,
            amount: transaction.amount,
            reference: transaction.reference,
            result,
            approverId,
          },
        });

        await notification.save();
        console.log(
          `📧 [SALES_MARKETING] ${result} notification sent to Sales HOD: ${salesMarketingHOD.firstName} ${salesMarketingHOD.lastName}`
        );
      } else {
        console.log(
          "❌ [SALES_MARKETING] Sales & Marketing HOD not found for approval notification"
        );
      }
    } catch (error) {
      console.error(
        "❌ [SALES_MARKETING] Error notifying approval result:",
        error
      );
    }
  }
}

export default SalesMarketingFinancialService;
