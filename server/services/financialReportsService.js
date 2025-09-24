import ELRAWallet from "../models/ELRAWallet.js";
import PayrollApproval from "../models/PayrollApproval.js";
import Project from "../models/Project.js";
import mongoose from "mongoose";

/**
 * Financial Reports Service
 * Aggregates data from the 4 main finance modules:
 * - ELRA Wallet (main wallet operations)
 * - Payroll Approvals (payroll budget category)
 * - Sales Marketing Approvals (operational budget category)
 * - Projects Approvals (projects budget category)
 */
class FinancialReportsService {
  /**
   * Calculate date range based on parameters (similar to project reports)
   */
  static calculateDateRange(dateRange, startDate, endDate, year, month) {
    const now = new Date();
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (year && month) {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59);
    } else if (year) {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59);
    } else {
      // Use dateRange parameter
      switch (dateRange) {
        case "7d":
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case "30d":
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case "90d":
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case "1y":
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case "2y":
          start = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case "5y":
          start = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case "10y":
          start = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case "20y":
          start = new Date(now.getTime() - 20 * 365 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          end = now;
      }
    }

    return { start, end };
  }

  /**
   * Get dashboard data aggregating all finance modules
   */
  static async getDashboardData(
    dateRange,
    moduleFilter,
    startDate,
    endDate,
    year,
    month
  ) {
    try {
      const { start, end } = this.calculateDateRange(
        dateRange,
        startDate,
        endDate,
        year,
        month
      );

      console.log(
        `📊 [FINANCIAL_REPORTS] Getting dashboard data from ${start.toISOString()} to ${end.toISOString()}`
      );

      // Get data from all modules in parallel
      const [walletData, payrollData, salesMarketingData, projectsData] =
        await Promise.all([
          this.getWalletOperationsData(start, end, moduleFilter),
          this.getPayrollApprovalsData(start, end, moduleFilter),
          this.getSalesMarketingApprovalsData(start, end, moduleFilter),
          this.getProjectsApprovalsData(start, end, moduleFilter),
        ]);

      // Aggregate summary statistics
      const summary = {
        totalRevenue:
          (salesMarketingData.revenue || 0) + (projectsData.revenue || 0),
        totalExpenses:
          (payrollData.expenses || 0) +
          (salesMarketingData.expenses || 0) +
          (projectsData.expenses || 0),
        totalTransactions: walletData.transactionCount || 0,
        totalApprovals:
          (payrollData.approvalCount || 0) +
          (salesMarketingData.approvalCount || 0) +
          (projectsData.approvalCount || 0),
        netProfit:
          (salesMarketingData.revenue || 0) +
          (projectsData.revenue || 0) -
          ((payrollData.expenses || 0) +
            (salesMarketingData.expenses || 0) +
            (projectsData.expenses || 0)),
      };

      // Monthly trends
      const monthlyTrends = this.generateMonthlyTrends(start, end, {
        wallet: walletData,
        payroll: payrollData,
        salesMarketing: salesMarketingData,
        projects: projectsData,
      });

      return {
        success: true,
        data: {
          summary,
          monthlyTrends,
          moduleBreakdown: {
            wallet: walletData,
            payroll: payrollData,
            salesMarketing: salesMarketingData,
            projects: projectsData,
          },
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
            period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          },
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
   * Get comprehensive financial reports
   */
  static async getComprehensiveReports(
    dateRange,
    moduleFilter,
    startDate,
    endDate,
    year,
    month,
    groupBy
  ) {
    try {
      const { start, end } = this.calculateDateRange(
        dateRange,
        startDate,
        endDate,
        year,
        month
      );

      console.log(
        `📊 [FINANCIAL_REPORTS] Getting comprehensive reports from ${start.toISOString()} to ${end.toISOString()}`
      );

      // Get detailed data from all modules
      const [
        walletData,
        payrollData,
        salesMarketingData,
        projectsData,
        fundFlowData,
        budgetAllocationData,
        fundUtilizationData,
      ] = await Promise.all([
        this.getWalletOperationsData(start, end, moduleFilter, true),
        this.getPayrollApprovalsData(start, end, moduleFilter, true),
        this.getSalesMarketingApprovalsData(start, end, moduleFilter, true),
        this.getProjectsApprovalsData(start, end, moduleFilter, true),
        this.getFundFlowData(start, end, moduleFilter),
        this.getBudgetAllocationData(start, end, moduleFilter),
        this.getFundUtilizationData(start, end, moduleFilter),
      ]);

      // Generate detailed breakdowns
      const budgetUtilization = this.calculateBudgetUtilization();
      const financialKPIs = this.calculateFinancialKPIs({
        wallet: walletData,
        payroll: payrollData,
        salesMarketing: salesMarketingData,
        projects: projectsData,
      });

      return {
        success: true,
        data: {
          summary: {
            totalRevenue:
              (salesMarketingData.revenue || 0) + (projectsData.revenue || 0),
            totalExpenses:
              (payrollData.expenses || 0) +
              (salesMarketingData.expenses || 0) +
              (projectsData.expenses || 0),
            netProfit:
              (salesMarketingData.revenue || 0) +
              (projectsData.revenue || 0) -
              ((payrollData.expenses || 0) +
                (salesMarketingData.expenses || 0) +
                (projectsData.expenses || 0)),
            totalTransactions: walletData.transactionCount || 0,
            totalApprovals:
              (payrollData.approvalCount || 0) +
              (salesMarketingData.approvalCount || 0) +
              (projectsData.approvalCount || 0),

            // Enhanced fund flow metrics
            totalFundsAdded: fundFlowData.totalFundsAdded,
            totalFundsAllocated: fundFlowData.totalFundsAllocated,
            totalFundsReserved: fundFlowData.totalFundsReserved,
            totalFundsUsed: fundFlowData.totalFundsUsed,
            totalFundsRejected: fundFlowData.totalFundsRejected,
            fundFlowEfficiency: fundFlowData.efficiency,

            // Budget utilization
            budgetUtilization: fundUtilizationData.overallUtilization,
          },
          budgetUtilization,
          financialKPIs,
          moduleDetails: {
            wallet: walletData,
            payroll: payrollData,
            salesMarketing: salesMarketingData,
            projects: projectsData,
          },
          fundFlowData,
          budgetAllocationData,
          fundUtilizationData,
          monthlyBreakdown: this.generateMonthlyTrends(start, end, {
            wallet: walletData,
            payroll: payrollData,
            salesMarketing: salesMarketingData,
            projects: projectsData,
          }),
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
            period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          },
        },
      };
    } catch (error) {
      console.error("Error getting comprehensive reports:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get wallet operations summary with monthly aggregation
   */
  static async getWalletOperationsSummary(
    dateRange,
    startDate,
    endDate,
    year,
    month,
    operationType,
    budgetCategory
  ) {
    try {
      const { start, end } = this.calculateDateRange(
        dateRange,
        startDate,
        endDate,
        year,
        month
      );

      console.log(
        `💰 [WALLET_OPERATIONS] Getting operations from ${start.toISOString()} to ${end.toISOString()}`
      );

      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        throw new Error("ELRA wallet not found");
      }

      // Filter transactions by date range
      let transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return transactionDate >= start && transactionDate <= end;
      });

      // Filter by operation type
      if (operationType !== "all") {
        transactions = transactions.filter((t) => t.type === operationType);
      }

      // Filter by budget category
      if (budgetCategory !== "all") {
        transactions = transactions.filter(
          (t) => t.budgetCategory === budgetCategory
        );
      }

      // Calculate summary statistics
      const summary = {
        totalTransactions: transactions.length,
        totalDeposits: transactions
          .filter((t) => t.type === "deposit")
          .reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawals: transactions
          .filter((t) => t.type === "withdrawal")
          .reduce((sum, t) => sum + t.amount, 0),
        totalAllocations: transactions
          .filter((t) => t.type === "allocation")
          .reduce((sum, t) => sum + t.amount, 0),
        netFlow:
          transactions
            .filter((t) => t.type === "deposit")
            .reduce((sum, t) => sum + t.amount, 0) -
          transactions
            .filter((t) => t.type === "withdrawal")
            .reduce((sum, t) => sum + t.amount, 0),
      };

      // Monthly aggregation
      const monthlyData = this.aggregateTransactionsByMonth(
        transactions,
        start,
        end
      );

      return {
        success: true,
        data: {
          summary,
          monthlyData,
          transactions: transactions.slice(0, 100), // Limit for performance
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
            period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          },
        },
      };
    } catch (error) {
      console.error("Error getting wallet operations summary:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get module-specific reports
   */
  static async getModuleReports(
    module,
    dateRange,
    startDate,
    endDate,
    year,
    month,
    includeDetails
  ) {
    try {
      const { start, end } = this.calculateDateRange(
        dateRange,
        startDate,
        endDate,
        year,
        month
      );

      console.log(
        `📊 [MODULE_REPORTS] Getting ${module} reports from ${start.toISOString()} to ${end.toISOString()}`
      );

      let moduleData;

      switch (module) {
        case "wallet":
          moduleData = await this.getWalletOperationsData(
            start,
            end,
            "all",
            includeDetails
          );
          break;
        case "payroll":
          moduleData = await this.getPayrollApprovalsData(
            start,
            end,
            "all",
            includeDetails
          );
          break;
        case "sales-marketing":
          moduleData = await this.getSalesMarketingApprovalsData(
            start,
            end,
            "all",
            includeDetails
          );
          break;
        case "projects":
          moduleData = await this.getProjectsApprovalsData(
            start,
            end,
            "all",
            includeDetails
          );
          break;
        default:
          throw new Error(`Invalid module: ${module}`);
      }

      return {
        success: true,
        data: {
          module,
          ...moduleData,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
            period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          },
        },
      };
    } catch (error) {
      console.error(`Error getting ${module} reports:`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get wallet operations data filtered by budget category
   */
  static async getWalletOperationsData(
    start,
    end,
    moduleFilter,
    includeDetails = false
  ) {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { transactionCount: 0, totalAmount: 0, transactions: [] };
      }

      // Filter transactions by date range
      let transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return transactionDate >= start && transactionDate <= end;
      });

      // Filter by module/budget category if specified
      if (moduleFilter && moduleFilter !== "all") {
        transactions = transactions.filter((t) => {
          // Map module filter to budget category
          const budgetCategoryMap = {
            payroll: "payroll",
            "sales-marketing": "operational",
            projects: "projects",
          };
          const expectedCategory = budgetCategoryMap[moduleFilter];
          return t.budgetCategory === expectedCategory;
        });
      }

      const summary = {
        transactionCount: transactions.length,
        totalDeposits: transactions
          .filter((t) => t.type === "deposit")
          .reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawals: transactions
          .filter((t) => t.type === "withdrawal")
          .reduce((sum, t) => sum + t.amount, 0),
        totalAllocations: transactions
          .filter((t) => t.type === "allocation")
          .reduce((sum, t) => sum + t.amount, 0),
        netFlow:
          transactions
            .filter((t) => t.type === "deposit")
            .reduce((sum, t) => sum + t.amount, 0) -
          transactions
            .filter((t) => t.type === "withdrawal")
            .reduce((sum, t) => sum + t.amount, 0),
      };

      return {
        ...summary,
        transactions: includeDetails ? transactions : transactions.slice(0, 50),
      };
    } catch (error) {
      console.error("Error getting wallet operations data:", error);
      return { transactionCount: 0, totalAmount: 0, transactions: [] };
    }
  }

  /**
   * Get payroll approvals data from wallet transactions
   */
  static async getPayrollApprovalsData(
    start,
    end,
    moduleFilter,
    includeDetails = false
  ) {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { approvalCount: 0, expenses: 0, transactions: [] };
      }

      // Get payroll-related transactions from wallet
      const transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return (
          transactionDate >= start &&
          transactionDate <= end &&
          t.budgetCategory === "payroll"
        );
      });

      const summary = {
        approvalCount: transactions.length,
        expenses: transactions
          .filter((t) => t.type === "withdrawal" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0),
        pendingCount: transactions.filter((t) => t.status === "pending").length,
        approvedCount: transactions.filter((t) => t.status === "approved")
          .length,
        rejectedCount: transactions.filter((t) => t.status === "rejected")
          .length,
      };

      return {
        ...summary,
        transactions: includeDetails ? transactions : transactions.slice(0, 50),
      };
    } catch (error) {
      console.error("Error getting payroll approvals data:", error);
      return {
        approvalCount: 0,
        expenses: 0,
        transactions: [],
      };
    }
  }

  /**
   * Get sales marketing approvals data from wallet transactions
   */
  static async getSalesMarketingApprovalsData(
    start,
    end,
    moduleFilter,
    includeDetails = false
  ) {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { approvalCount: 0, revenue: 0, expenses: 0, transactions: [] };
      }

      // Get operational budget category transactions (sales & marketing)
      const transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return (
          transactionDate >= start &&
          transactionDate <= end &&
          t.budgetCategory === "operational"
        );
      });

      const summary = {
        approvalCount: transactions.length,
        revenue: transactions
          .filter((t) => t.type === "deposit" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0),
        expenses: transactions
          .filter((t) => t.type === "withdrawal" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0),
        pendingCount: transactions.filter((t) => t.status === "pending").length,
        approvedCount: transactions.filter((t) => t.status === "approved")
          .length,
        rejectedCount: transactions.filter((t) => t.status === "rejected")
          .length,
      };

      return {
        ...summary,
        transactions: includeDetails ? transactions : transactions.slice(0, 50),
      };
    } catch (error) {
      console.error("Error getting sales marketing approvals data:", error);
      return { approvalCount: 0, revenue: 0, expenses: 0, transactions: [] };
    }
  }

  /**
   * Get projects approvals data from wallet transactions
   */
  static async getProjectsApprovalsData(
    start,
    end,
    moduleFilter,
    includeDetails = false
  ) {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return {
          approvalCount: 0,
          totalBudget: 0,
          totalSpent: 0,
          transactions: [],
        };
      }

      // Get projects budget category transactions
      const transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return (
          transactionDate >= start &&
          transactionDate <= end &&
          t.budgetCategory === "projects"
        );
      });

      const summary = {
        approvalCount: transactions.length,
        totalBudget: transactions
          .filter((t) => t.type === "allocation")
          .reduce((sum, t) => sum + t.amount, 0),
        totalSpent: transactions
          .filter((t) => t.type === "withdrawal" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0),
        pendingCount: transactions.filter((t) => t.status === "pending").length,
        approvedCount: transactions.filter((t) => t.status === "approved")
          .length,
        rejectedCount: transactions.filter((t) => t.status === "rejected")
          .length,
      };

      return {
        ...summary,
        transactions: includeDetails ? transactions : transactions.slice(0, 50),
      };
    } catch (error) {
      console.error("Error getting projects approvals data:", error);
      return {
        approvalCount: 0,
        totalBudget: 0,
        totalSpent: 0,
        transactions: [],
      };
    }
  }

  /**
   * Generate monthly trends data
   */
  static generateMonthlyTrends(start, end, moduleData) {
    const trends = [];
    const current = new Date(start);

    while (current <= end) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0
      );

      // Calculate actual data for this month
      const monthTransactions =
        moduleData.wallet?.transactions?.filter((t) => {
          const transactionDate = new Date(t.requestedAt || t.date);
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        }) || [];

      const monthDeposits = monthTransactions
        .filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + t.amount, 0);

      const monthWithdrawals = monthTransactions
        .filter((t) => t.type === "withdrawal" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const monthNetProfit = monthDeposits - monthWithdrawals;

      trends.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        year: monthStart.getFullYear(),
        monthNumber: monthStart.getMonth() + 1,
        revenue: monthDeposits,
        expenses: monthWithdrawals,
        netProfit: monthNetProfit,
        wallet: {
          transactions: monthTransactions.length,
          netFlow: monthNetProfit,
        },
        payroll: {
          approvals: monthTransactions.filter(
            (t) => t.budgetCategory === "payroll"
          ).length,
          totalAmount: monthTransactions
            .filter(
              (t) =>
                t.budgetCategory === "payroll" &&
                t.type === "withdrawal" &&
                t.status === "approved"
            )
            .reduce((sum, t) => sum + t.amount, 0),
        },
        salesMarketing: {
          approvals: monthTransactions.filter(
            (t) => t.budgetCategory === "operational"
          ).length,
          revenue: monthTransactions
            .filter(
              (t) => t.budgetCategory === "operational" && t.type === "deposit"
            )
            .reduce((sum, t) => sum + t.amount, 0),
          expenses: monthTransactions
            .filter(
              (t) =>
                t.budgetCategory === "operational" &&
                t.type === "withdrawal" &&
                t.status === "approved"
            )
            .reduce((sum, t) => sum + t.amount, 0),
        },
        projects: {
          approvals: monthTransactions.filter(
            (t) => t.budgetCategory === "projects"
          ).length,
          totalBudget: monthTransactions
            .filter(
              (t) => t.budgetCategory === "projects" && t.type === "allocation"
            )
            .reduce((sum, t) => sum + t.amount, 0),
        },
      });

      current.setMonth(current.getMonth() + 1);
    }

    return trends;
  }

  /**
   * Calculate budget utilization
   */
  static async calculateBudgetUtilization() {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { payroll: 0, projects: 0, operational: 0 };
      }

      const budgetCategories = wallet.budgetCategories || {};

      return {
        payroll: {
          allocated: budgetCategories.payroll?.allocated || 0,
          available: budgetCategories.payroll?.available || 0,
          used: budgetCategories.payroll?.used || 0,
          reserved: budgetCategories.payroll?.reserved || 0,
          utilization:
            budgetCategories.payroll?.allocated > 0
              ? ((budgetCategories.payroll?.used || 0) /
                  budgetCategories.payroll.allocated) *
                100
              : 0,
        },
        projects: {
          allocated: budgetCategories.projects?.allocated || 0,
          available: budgetCategories.projects?.available || 0,
          used: budgetCategories.projects?.used || 0,
          reserved: budgetCategories.projects?.reserved || 0,
          utilization:
            budgetCategories.projects?.allocated > 0
              ? ((budgetCategories.projects?.used || 0) /
                  budgetCategories.projects.allocated) *
                100
              : 0,
        },
        operational: {
          allocated: budgetCategories.operational?.allocated || 0,
          available: budgetCategories.operational?.available || 0,
          used: budgetCategories.operational?.used || 0,
          reserved: budgetCategories.operational?.reserved || 0,
          utilization:
            budgetCategories.operational?.allocated > 0
              ? ((budgetCategories.operational?.used || 0) /
                  budgetCategories.operational.allocated) *
                100
              : 0,
        },
      };
    } catch (error) {
      console.error("Error calculating budget utilization:", error);
      return { payroll: 0, projects: 0, operational: 0 };
    }
  }

  /**
   * Calculate financial KPIs
   */
  static calculateFinancialKPIs(moduleData) {
    const totalRevenue =
      (moduleData.salesMarketing?.revenue || 0) +
      (moduleData.projects?.totalBudget || 0);
    const totalExpenses =
      (moduleData.payroll?.totalAmount || 0) +
      (moduleData.salesMarketing?.expenses || 0) +
      (moduleData.projects?.totalSpent || 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      revenueGrowth: 0, // Would calculate from historical data
      expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      budgetUtilization: 0, // Would calculate from budget data
      approvalEfficiency: 0, // Would calculate from approval times
      transactionVolume: moduleData.wallet?.transactionCount || 0,
    };
  }

  /**
   * Aggregate transactions by month
   */
  static aggregateTransactionsByMonth(transactions, start, end) {
    const monthlyData = {};
    const current = new Date(start);

    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyData[monthKey] = {
        month: current.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        deposits: 0,
        withdrawals: 0,
        allocations: 0,
        transactionCount: 0,
      };
      current.setMonth(current.getMonth() + 1);
    }

    transactions.forEach((transaction) => {
      const transactionDate = new Date(
        transaction.requestedAt || transaction.date
      );
      const monthKey = `${transactionDate.getFullYear()}-${String(
        transactionDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].transactionCount++;
        if (transaction.type === "deposit") {
          monthlyData[monthKey].deposits += transaction.amount;
        } else if (transaction.type === "withdrawal") {
          monthlyData[monthKey].withdrawals += transaction.amount;
        } else if (transaction.type === "allocation") {
          monthlyData[monthKey].allocations += transaction.amount;
        }
      }
    });

    return Object.values(monthlyData);
  }

  /**
   * Get financial trends and projections
   */
  static async getFinancialTrends(
    period,
    includeProjections,
    projectionMonths
  ) {
    try {
      const now = new Date();
      const months = parseInt(period.replace("m", "")) || 12;
      const start = new Date(now.getFullYear(), now.getMonth() - months, 1);
      const end = now;

      console.log(`📊 [FINANCIAL_TRENDS] Getting trends for ${months} months`);

      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { success: false, message: "ELRA wallet not found" };
      }

      // Get all transactions for the period
      const transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return transactionDate >= start && transactionDate <= end;
      });

      // Generate monthly trends
      const trends = this.generateMonthlyTrends(start, end, {
        wallet: { transactions },
        payroll: {
          transactions: transactions.filter(
            (t) => t.budgetCategory === "payroll"
          ),
        },
        salesMarketing: {
          transactions: transactions.filter(
            (t) => t.budgetCategory === "operational"
          ),
        },
        projects: {
          transactions: transactions.filter(
            (t) => t.budgetCategory === "projects"
          ),
        },
      });

      // Add projections if requested
      let projections = [];
      if (includeProjections) {
        projections = this.generateProjections(trends, projectionMonths);
      }

      return {
        success: true,
        data: {
          trends,
          projections,
          period: `${months} months`,
          includeProjections,
        },
      };
    } catch (error) {
      console.error("Error getting financial trends:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get budget performance metrics
   */
  static async getBudgetPerformance(dateRange, includeForecasting) {
    try {
      const { start, end } = this.calculateDateRange(dateRange);

      console.log(
        `📊 [BUDGET_PERFORMANCE] Getting performance from ${start.toISOString()} to ${end.toISOString()}`
      );

      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { success: false, message: "ELRA wallet not found" };
      }

      const budgetUtilization = await this.calculateBudgetUtilization();

      // Get transactions for the period
      const transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return transactionDate >= start && transactionDate <= end;
      });

      // Calculate performance metrics
      const performance = {
        totalAllocated: wallet.financialSummary?.allocatedFunds || 0,
        totalUsed: transactions
          .filter((t) => t.type === "withdrawal" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0),
        totalReserved: wallet.financialSummary?.reservedFunds || 0,
        utilizationRate: wallet.financialSummary?.utilizationPercentage || 0,
        budgetCategories: budgetUtilization,
      };

      // Add forecasting if requested
      let forecasting = null;
      if (includeForecasting) {
        forecasting = this.generateBudgetForecasting(performance, transactions);
      }

      return {
        success: true,
        data: {
          performance,
          forecasting,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
            period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          },
        },
      };
    } catch (error) {
      console.error("Error getting budget performance:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get financial KPIs
   */
  static async getFinancialKPIs(dateRange, compareWithPrevious) {
    try {
      const { start, end } = this.calculateDateRange(dateRange);

      // Calculate previous period for comparison
      const periodLength = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodLength);
      const previousEnd = new Date(start.getTime() - 1);

      console.log(
        `📊 [FINANCIAL_KPIS] Getting KPIs from ${start.toISOString()} to ${end.toISOString()}`
      );

      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { success: false, message: "ELRA wallet not found" };
      }

      // Get current period transactions
      const currentTransactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return transactionDate >= start && transactionDate <= end;
      });

      // Get previous period transactions for comparison
      let previousTransactions = [];
      if (compareWithPrevious) {
        previousTransactions = wallet.transactions.filter((t) => {
          const transactionDate = new Date(t.requestedAt || t.date);
          return (
            transactionDate >= previousStart && transactionDate <= previousEnd
          );
        });
      }

      // Calculate KPIs
      const kpis = {
        totalRevenue: currentTransactions
          .filter((t) => t.type === "deposit" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: currentTransactions
          .filter((t) => t.type === "withdrawal" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0),
        netProfit: 0, // Will be calculated below
        transactionVolume: currentTransactions.length,
        averageTransactionSize: 0, // Will be calculated below
        budgetUtilization: wallet.financialSummary?.utilizationPercentage || 0,
        cashFlow: 0, // Will be calculated below
      };

      // Calculate derived KPIs
      kpis.netProfit = kpis.totalRevenue - kpis.totalExpenses;
      kpis.averageTransactionSize =
        kpis.transactionVolume > 0
          ? (kpis.totalRevenue + kpis.totalExpenses) / kpis.transactionVolume
          : 0;
      kpis.cashFlow = kpis.totalRevenue - kpis.totalExpenses;

      // Add comparison data if requested
      let comparison = null;
      if (compareWithPrevious && previousTransactions.length > 0) {
        const previousRevenue = previousTransactions
          .filter((t) => t.type === "deposit" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0);
        const previousExpenses = previousTransactions
          .filter((t) => t.type === "withdrawal" && t.status === "approved")
          .reduce((sum, t) => sum + t.amount, 0);

        comparison = {
          revenueGrowth:
            previousRevenue > 0
              ? ((kpis.totalRevenue - previousRevenue) / previousRevenue) * 100
              : 0,
          expenseGrowth:
            previousExpenses > 0
              ? ((kpis.totalExpenses - previousExpenses) / previousExpenses) *
                100
              : 0,
          profitGrowth:
            previousRevenue - previousExpenses > 0
              ? ((kpis.netProfit - (previousRevenue - previousExpenses)) /
                  (previousRevenue - previousExpenses)) *
                100
              : 0,
          transactionVolumeGrowth:
            previousTransactions.length > 0
              ? ((kpis.transactionVolume - previousTransactions.length) /
                  previousTransactions.length) *
                100
              : 0,
        };
      }

      return {
        success: true,
        data: {
          kpis,
          comparison,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
            period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          },
        },
      };
    } catch (error) {
      console.error("Error getting financial KPIs:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get financial alerts
   */
  static async getFinancialAlerts() {
    try {
      console.log(`📊 [FINANCIAL_ALERTS] Getting real-time alerts`);

      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { success: false, message: "ELRA wallet not found" };
      }

      const alerts = [];

      // Check for low balance alerts
      const utilizationPercentage =
        wallet.financialSummary?.utilizationPercentage || 0;
      if (utilizationPercentage > 90) {
        alerts.push({
          type: "critical",
          category: "budget",
          title: "High Budget Utilization",
          message: `Budget utilization is at ${utilizationPercentage.toFixed(
            1
          )}%. Consider adding more funds.`,
          timestamp: new Date(),
        });
      } else if (utilizationPercentage > 75) {
        alerts.push({
          type: "warning",
          category: "budget",
          title: "Moderate Budget Utilization",
          message: `Budget utilization is at ${utilizationPercentage.toFixed(
            1
          )}%. Monitor closely.`,
          timestamp: new Date(),
        });
      }

      // Check for pending transactions
      const pendingTransactions = wallet.transactions.filter(
        (t) => t.status === "pending"
      );
      if (pendingTransactions.length > 10) {
        alerts.push({
          type: "warning",
          category: "transactions",
          title: "High Pending Transactions",
          message: `${pendingTransactions.length} transactions are pending approval.`,
          timestamp: new Date(),
        });
      }

      // Check for budget category alerts
      Object.entries(wallet.budgetCategories || {}).forEach(
        ([category, data]) => {
          if (data.available < data.allocated * 0.1) {
            alerts.push({
              type: "warning",
              category: "budget_category",
              title: `Low ${category} Budget`,
              message: `${category} budget is running low. Available: ₦${data.available.toLocaleString()}`,
              timestamp: new Date(),
            });
          }
        }
      );

      return {
        success: true,
        data: {
          alerts,
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter((a) => a.type === "critical").length,
          warningAlerts: alerts.filter((a) => a.type === "warning").length,
        },
      };
    } catch (error) {
      console.error("Error getting financial alerts:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Export reports as PDF
   */
  static async exportReportsPDF(
    reportType,
    dateRange,
    moduleFilter,
    includeCharts
  ) {
    try {
      // This would integrate with a PDF generation library like puppeteer or jsPDF
      // For now, return a placeholder
      return {
        success: false,
        message: "PDF export functionality not yet implemented",
      };
    } catch (error) {
      console.error("Error exporting PDF:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Export reports as Word/HTML
   */
  static async exportReportsWord(
    reportType,
    dateRange,
    moduleFilter,
    includeCharts
  ) {
    try {
      // This would integrate with a Word generation library
      // For now, return a placeholder
      return {
        success: false,
        message: "Word export functionality not yet implemented",
      };
    } catch (error) {
      console.error("Error exporting Word:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Export reports as CSV
   */
  static async exportReportsCSV(reportType, dateRange, moduleFilter) {
    try {
      const { start, end } = this.calculateDateRange(dateRange);

      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return { success: false, message: "ELRA wallet not found" };
      }

      // Get transactions based on report type and filters
      let transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return transactionDate >= start && transactionDate <= end;
      });

      // Apply module filter
      if (moduleFilter && moduleFilter !== "all") {
        const budgetCategoryMap = {
          payroll: "payroll",
          "sales-marketing": "operational",
          projects: "projects",
        };
        const expectedCategory = budgetCategoryMap[moduleFilter];
        transactions = transactions.filter(
          (t) => t.budgetCategory === expectedCategory
        );
      }

      // Generate CSV content
      const csvHeaders =
        "Date,Type,Amount,Description,Reference,Budget Category,Status,Requested By\n";
      const csvRows = transactions
        .map((t) => {
          const date = new Date(t.requestedAt || t.date)
            .toISOString()
            .split("T")[0];
          return `${date},${t.type},${t.amount},"${t.description}","${
            t.reference || ""
          }","${t.budgetCategory || ""}",${t.status},"${t.requestedBy || ""}"`;
        })
        .join("\n");

      const csvContent = csvHeaders + csvRows;

      return {
        success: true,
        data: csvContent,
      };
    } catch (error) {
      console.error("Error exporting CSV:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate projections based on historical trends
   */
  static generateProjections(trends, projectionMonths) {
    // Simple linear projection based on recent trends
    const recentTrends = trends.slice(-3); // Last 3 months
    const projections = [];

    for (let i = 1; i <= projectionMonths; i++) {
      const lastTrend = recentTrends[recentTrends.length - 1];
      const projectionDate = new Date(
        lastTrend.year,
        lastTrend.monthNumber + i - 1,
        1
      );

      projections.push({
        month: projectionDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        year: projectionDate.getFullYear(),
        monthNumber: projectionDate.getMonth() + 1,
        projected: true,
        wallet: {
          transactions: Math.floor(lastTrend.wallet.transactions * 1.05), // 5% growth
          netFlow: Math.floor(lastTrend.wallet.netFlow * 1.02), // 2% growth
        },
        payroll: {
          approvals: Math.floor(lastTrend.payroll.approvals * 1.03),
          totalAmount: Math.floor(lastTrend.payroll.totalAmount * 1.04),
        },
        salesMarketing: {
          approvals: Math.floor(lastTrend.salesMarketing.approvals * 1.06),
          revenue: Math.floor(lastTrend.salesMarketing.revenue * 1.08),
          expenses: Math.floor(lastTrend.salesMarketing.expenses * 1.05),
        },
        projects: {
          approvals: Math.floor(lastTrend.projects.approvals * 1.04),
          totalBudget: Math.floor(lastTrend.projects.totalBudget * 1.07),
        },
      });
    }

    return projections;
  }

  /**
   * Generate budget forecasting
   */
  static generateBudgetForecasting(performance, transactions) {
    // Simple forecasting based on current trends
    const monthlyExpenses =
      transactions
        .filter((t) => t.type === "withdrawal" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0) / 12; // Assuming 12 months of data

    return {
      projectedMonthlyExpenses: monthlyExpenses,
      projectedYearlyExpenses: monthlyExpenses * 12,
      recommendedBudgetIncrease: monthlyExpenses * 1.2, // 20% buffer
      forecastConfidence: "medium",
    };
  }

  /**
   * Get comprehensive fund flow data tracking the complete lifecycle
   */
  static async getFundFlowData(start, end, moduleFilter) {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return {
          totalFundsAdded: 0,
          totalFundsAllocated: 0,
          totalFundsReserved: 0,
          totalFundsUsed: 0,
          totalFundsRejected: 0,
          efficiency: 0,
          flowBreakdown: [],
        };
      }

      const transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return transactionDate >= start && transactionDate <= end;
      });

      // Track fund flow lifecycle
      const fundFlowData = {
        totalFundsAdded: 0,
        totalFundsAllocated: 0,
        totalFundsReserved: 0,
        totalFundsUsed: 0,
        totalFundsRejected: 0,
        flowBreakdown: [],
      };

      transactions.forEach((transaction) => {
        switch (transaction.type) {
          case "deposit":
            fundFlowData.totalFundsAdded += transaction.amount;
            fundFlowData.flowBreakdown.push({
              type: "fund_added",
              amount: transaction.amount,
              date: transaction.date,
              description: transaction.description,
              budgetCategory: transaction.budgetCategory,
            });
            break;
          case "allocation":
            fundFlowData.totalFundsAllocated += transaction.amount;
            fundFlowData.flowBreakdown.push({
              type: "fund_allocated",
              amount: transaction.amount,
              date: transaction.date,
              description: transaction.description,
              budgetCategory: transaction.budgetCategory,
            });
            break;
          case "withdrawal":
            if (transaction.status === "approved") {
              fundFlowData.totalFundsUsed += transaction.amount;
              fundFlowData.flowBreakdown.push({
                type: "fund_used",
                amount: transaction.amount,
                date: transaction.date,
                description: transaction.description,
                budgetCategory: transaction.budgetCategory,
              });
            } else if (transaction.status === "rejected") {
              fundFlowData.totalFundsRejected += transaction.amount;
              fundFlowData.flowBreakdown.push({
                type: "fund_rejected",
                amount: transaction.amount,
                date: transaction.date,
                description: transaction.description,
                budgetCategory: transaction.budgetCategory,
              });
            } else if (transaction.status === "pending") {
              // Pending withdrawals are funds being reserved (should be positive)
              fundFlowData.totalFundsReserved += transaction.amount;
              fundFlowData.flowBreakdown.push({
                type: "fund_reserved",
                amount: transaction.amount,
                date: transaction.date,
                description: transaction.description,
                budgetCategory: transaction.budgetCategory,
              });
            }
            break;
        }
      });

      // Calculate efficiency (funds used vs funds added)
      fundFlowData.efficiency =
        fundFlowData.totalFundsAdded > 0
          ? (fundFlowData.totalFundsUsed / fundFlowData.totalFundsAdded) * 100
          : 0;

      return fundFlowData;
    } catch (error) {
      console.error("❌ [FUND_FLOW_DATA] Error:", error);
      return {
        totalFundsAdded: 0,
        totalFundsAllocated: 0,
        totalFundsReserved: 0,
        totalFundsUsed: 0,
        totalFundsRejected: 0,
        efficiency: 0,
        flowBreakdown: [],
      };
    }
  }

  /**
   * Get budget allocation data across the 3 categories
   */
  static async getBudgetAllocationData(start, end, moduleFilter) {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return {
          payroll: { allocated: 0, used: 0, available: 0, utilization: 0 },
          operational: { allocated: 0, used: 0, available: 0, utilization: 0 },
          projects: { allocated: 0, used: 0, available: 0, utilization: 0 },
        };
      }

      const budgetCategories = wallet.budgetCategories || {};

      return {
        payroll: {
          allocated: budgetCategories.payroll?.allocated || 0,
          used: budgetCategories.payroll?.used || 0,
          available: budgetCategories.payroll?.available || 0,
          utilization:
            budgetCategories.payroll?.allocated > 0
              ? ((budgetCategories.payroll?.used || 0) /
                  budgetCategories.payroll.allocated) *
                100
              : 0,
        },
        operational: {
          allocated: budgetCategories.operational?.allocated || 0,
          used: budgetCategories.operational?.used || 0,
          available: budgetCategories.operational?.available || 0,
          utilization:
            budgetCategories.operational?.allocated > 0
              ? ((budgetCategories.operational?.used || 0) /
                  budgetCategories.operational.allocated) *
                100
              : 0,
        },
        projects: {
          allocated: budgetCategories.projects?.allocated || 0,
          used: budgetCategories.projects?.used || 0,
          available: budgetCategories.projects?.available || 0,
          utilization:
            budgetCategories.projects?.allocated > 0
              ? ((budgetCategories.projects?.used || 0) /
                  budgetCategories.projects.allocated) *
                100
              : 0,
        },
      };
    } catch (error) {
      console.error("❌ [BUDGET_ALLOCATION_DATA] Error:", error);
      return {
        payroll: { allocated: 0, used: 0, available: 0, utilization: 0 },
        operational: { allocated: 0, used: 0, available: 0, utilization: 0 },
        projects: { allocated: 0, used: 0, available: 0, utilization: 0 },
      };
    }
  }

  /**
   * Get fund utilization metrics and trends
   */
  static async getFundUtilizationData(start, end, moduleFilter) {
    try {
      const wallet = await ELRAWallet.findOne({ elraInstance: "ELRA_MAIN" });
      if (!wallet) {
        return {
          overallUtilization: 0,
          categoryUtilization: [],
          utilizationTrends: [],
          efficiencyMetrics: {},
        };
      }

      const transactions = wallet.transactions.filter((t) => {
        const transactionDate = new Date(t.requestedAt || t.date);
        return transactionDate >= start && transactionDate <= end;
      });

      // Calculate utilization trends by month
      const utilizationTrends = this.generateUtilizationTrends(
        transactions,
        start,
        end
      );

      // Calculate efficiency metrics
      const efficiencyMetrics = {
        fundsAddedVsUsed: 0,
        allocationEfficiency: 0,
        rejectionRate: 0,
        averageProcessingTime: 0,
      };

      const totalAdded = transactions
        .filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalUsed = transactions
        .filter((t) => t.type === "withdrawal" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalRejected = transactions
        .filter((t) => t.type === "withdrawal" && t.status === "rejected")
        .reduce((sum, t) => sum + t.amount, 0);

      efficiencyMetrics.fundsAddedVsUsed =
        totalAdded > 0 ? (totalUsed / totalAdded) * 100 : 0;
      efficiencyMetrics.rejectionRate =
        totalUsed + totalRejected > 0
          ? (totalRejected / (totalUsed + totalRejected)) * 100
          : 0;

      // Calculate overall utilization from budget categories
      const budgetCategories = wallet.budgetCategories || {};
      const totalAllocated =
        (budgetCategories.payroll?.allocated || 0) +
        (budgetCategories.operational?.allocated || 0) +
        (budgetCategories.projects?.allocated || 0);
      const totalUsedFromBudgets =
        (budgetCategories.payroll?.used || 0) +
        (budgetCategories.operational?.used || 0) +
        (budgetCategories.projects?.used || 0);
      const overallUtilization =
        totalAllocated > 0 ? (totalUsedFromBudgets / totalAllocated) * 100 : 0;

      return {
        overallUtilization,
        categoryUtilization: [
          {
            category: "payroll",
            utilization:
              budgetCategories.payroll?.allocated > 0
                ? ((budgetCategories.payroll?.used || 0) /
                    budgetCategories.payroll.allocated) *
                  100
                : 0,
          },
          {
            category: "operational",
            utilization:
              budgetCategories.operational?.allocated > 0
                ? ((budgetCategories.operational?.used || 0) /
                    budgetCategories.operational.allocated) *
                  100
                : 0,
          },
          {
            category: "projects",
            utilization:
              budgetCategories.projects?.allocated > 0
                ? ((budgetCategories.projects?.used || 0) /
                    budgetCategories.projects.allocated) *
                  100
                : 0,
          },
        ],
        utilizationTrends,
        efficiencyMetrics,
      };
    } catch (error) {
      console.error("❌ [FUND_UTILIZATION_DATA] Error:", error);
      return {
        overallUtilization: 0,
        categoryUtilization: [],
        utilizationTrends: [],
        efficiencyMetrics: {},
      };
    }
  }

  /**
   * Generate utilization trends by month
   */
  static generateUtilizationTrends(transactions, start, end) {
    const monthlyData = {};
    const current = new Date(start);

    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyData[monthKey] = {
        month: current.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        fundsAdded: 0,
        fundsUsed: 0,
        fundsRejected: 0,
        utilization: 0,
      };
      current.setMonth(current.getMonth() + 1);
    }

    transactions.forEach((transaction) => {
      const transactionDate = new Date(
        transaction.requestedAt || transaction.date
      );
      const monthKey = `${transactionDate.getFullYear()}-${String(
        transactionDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (monthlyData[monthKey]) {
        switch (transaction.type) {
          case "deposit":
            monthlyData[monthKey].fundsAdded += transaction.amount;
            break;
          case "withdrawal":
            if (transaction.status === "approved") {
              monthlyData[monthKey].fundsUsed += transaction.amount;
            } else if (transaction.status === "rejected") {
              monthlyData[monthKey].fundsRejected += transaction.amount;
            }
            break;
        }
      }
    });

    // Calculate utilization percentages
    Object.values(monthlyData).forEach((month) => {
      month.utilization =
        month.fundsAdded > 0 ? (month.fundsUsed / month.fundsAdded) * 100 : 0;
    });

    return Object.values(monthlyData);
  }
}

export default FinancialReportsService;
