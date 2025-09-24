import FinancialReportsService from "../services/financialReportsService.js";
import { protect, checkFinanceAccess } from "../middleware/auth.js";

/**
 * Financial Reports Controller
 * Handles comprehensive financial reporting across finance modules:
 * - ELRA Wallet (main wallet operations)
 * - Payroll Approvals (payroll budget category)
 * - Sales Marketing Approvals (operational budget category)
 * - Projects Approvals (projects budget category)
 */

// @desc    Get comprehensive financial reports dashboard
// @route   GET /api/finance/reports/dashboard
// @access  Private (Finance HOD, Super Admin)
export const getFinancialDashboard = async (req, res) => {
  try {
    const {
      dateRange = "30d",
      moduleFilter = "all",
      startDate,
      endDate,
      year,
      month,
    } = req.query;

    const result = await FinancialReportsService.getDashboardData(
      dateRange,
      moduleFilter,
      startDate,
      endDate,
      year,
      month
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Financial dashboard data retrieved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting financial dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get comprehensive financial reports with detailed breakdown
// @route   GET /api/finance/reports/comprehensive
// @access  Private (Finance HOD, Super Admin)
export const getComprehensiveFinancialReports = async (req, res) => {
  try {
    const {
      dateRange = "30d",
      moduleFilter = "all",
      startDate,
      endDate,
      year,
      month,
      groupBy = "month",
    } = req.query;

    const result = await FinancialReportsService.getComprehensiveReports(
      dateRange,
      moduleFilter,
      startDate,
      endDate,
      year,
      month,
      groupBy
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Comprehensive financial reports retrieved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting comprehensive financial reports:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get ELRA wallet operations summary with monthly aggregation
// @route   GET /api/finance/reports/wallet-operations
// @access  Private (Finance HOD, Super Admin)
export const getWalletOperationsSummary = async (req, res) => {
  try {
    const {
      dateRange = "30d",
      startDate,
      endDate,
      year,
      month,
      operationType = "all",
      budgetCategory = "all",
    } = req.query;

    const result = await FinancialReportsService.getWalletOperationsSummary(
      dateRange,
      startDate,
      endDate,
      year,
      month,
      operationType,
      budgetCategory
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Wallet operations summary retrieved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting wallet operations summary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get module-specific financial reports
// @route   GET /api/finance/reports/module/:module
// @access  Private (Finance HOD, Super Admin)
export const getModuleFinancialReports = async (req, res) => {
  try {
    const { module } = req.params;
    const {
      dateRange = "30d",
      startDate,
      endDate,
      year,
      month,
      includeDetails = false,
    } = req.query;

    const validModules = ["wallet", "payroll", "sales-marketing", "projects"];
    if (!validModules.includes(module)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid module. Must be one of: wallet, payroll, sales-marketing, projects",
      });
    }

    const result = await FinancialReportsService.getModuleReports(
      module,
      dateRange,
      startDate,
      endDate,
      year,
      month,
      includeDetails === "true"
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: `${module} financial reports retrieved successfully`,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error(
      `Error getting ${req.params.module} financial reports:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get monthly financial trends and projections
// @route   GET /api/finance/reports/trends
// @access  Private (Finance HOD, Super Admin)
export const getFinancialTrends = async (req, res) => {
  try {
    const {
      period = "12m",
      includeProjections = false,
      projectionMonths = 3,
    } = req.query;

    const result = await FinancialReportsService.getFinancialTrends(
      period,
      includeProjections === "true",
      parseInt(projectionMonths)
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Financial trends retrieved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting financial trends:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get budget utilization and performance metrics
// @route   GET /api/finance/reports/budget-performance
// @access  Private (Finance HOD, Super Admin)
export const getBudgetPerformance = async (req, res) => {
  try {
    const { dateRange = "30d", includeForecasting = false } = req.query;

    const result = await FinancialReportsService.getBudgetPerformance(
      dateRange,
      includeForecasting === "true"
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Budget performance metrics retrieved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting budget performance:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Export financial reports as PDF
// @route   POST /api/finance/reports/export/pdf
// @access  Private (Finance HOD, Super Admin)
export const exportFinancialReportsPDF = async (req, res) => {
  try {
    const {
      reportType = "comprehensive",
      dateRange = "30d",
      moduleFilter = "all",
      includeCharts = true,
    } = req.body;

    const result = await FinancialReportsService.exportReportsPDF(
      reportType,
      dateRange,
      moduleFilter,
      includeCharts
    );

    if (result.success) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="financial-report-${Date.now()}.pdf"`
      );
      res.send(result.data);
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error exporting financial reports PDF:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Export financial reports as Word/HTML
// @route   POST /api/finance/reports/export/word
// @access  Private (Finance HOD, Super Admin)
export const exportFinancialReportsWord = async (req, res) => {
  try {
    const {
      reportType = "comprehensive",
      dateRange = "30d",
      moduleFilter = "all",
      includeCharts = true,
    } = req.body;

    const result = await FinancialReportsService.exportReportsWord(
      reportType,
      dateRange,
      moduleFilter,
      includeCharts
    );

    if (result.success) {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="financial-report-${Date.now()}.docx"`
      );
      res.send(result.data);
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error exporting financial reports Word:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Export financial reports as CSV
// @route   POST /api/finance/reports/export/csv
// @access  Private (Finance HOD, Super Admin)
export const exportFinancialReportsCSV = async (req, res) => {
  try {
    const {
      reportType = "comprehensive",
      dateRange = "30d",
      moduleFilter = "all",
    } = req.body;

    const result = await FinancialReportsService.exportReportsCSV(
      reportType,
      dateRange,
      moduleFilter
    );

    if (result.success) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="financial-report-${Date.now()}.csv"`
      );
      res.send(result.data);
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error exporting financial reports CSV:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get financial KPIs and metrics
// @route   GET /api/finance/reports/kpis
// @access  Private (Finance HOD, Super Admin)
export const getFinancialKPIs = async (req, res) => {
  try {
    const { dateRange = "30d", compareWithPrevious = false } = req.query;

    const result = await FinancialReportsService.getFinancialKPIs(
      dateRange,
      compareWithPrevious === "true"
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Financial KPIs retrieved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting financial KPIs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get real-time financial alerts and notifications
// @route   GET /api/finance/reports/alerts
// @access  Private (Finance HOD, Super Admin)
export const getFinancialAlerts = async (req, res) => {
  try {
    const result = await FinancialReportsService.getFinancialAlerts();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Financial alerts retrieved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting financial alerts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
