import express from "express";
import {
  getFinancialDashboard,
  getComprehensiveFinancialReports,
  getWalletOperationsSummary,
  getModuleFinancialReports,
  getFinancialTrends,
  getBudgetPerformance,
  exportFinancialReportsPDF,
  exportFinancialReportsWord,
  exportFinancialReportsCSV,
  getFinancialKPIs,
  getFinancialAlerts,
} from "../controllers/financialReportsController.js";
import { protect, checkFinanceAccess } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication and finance access middleware to all routes
router.use(protect);
router.use(checkFinanceAccess);

/**
 * @route   GET /api/finance/reports/dashboard
 * @desc    Get comprehensive financial reports dashboard
 * @access  Private (Finance HOD, Super Admin)
 * @query   dateRange, moduleFilter, startDate, endDate, year, month
 */
router.get("/dashboard", getFinancialDashboard);

/**
 * @route   GET /api/finance/reports/comprehensive
 * @desc    Get comprehensive financial reports with detailed breakdown
 * @access  Private (Finance HOD, Super Admin)
 * @query   dateRange, moduleFilter, startDate, endDate, year, month, groupBy
 */
router.get("/comprehensive", getComprehensiveFinancialReports);

/**
 * @route   GET /api/finance/reports/wallet-operations
 * @desc    Get ELRA wallet operations summary with monthly aggregation
 * @access  Private (Finance HOD, Super Admin)
 * @query   dateRange, startDate, endDate, year, month, operationType, budgetCategory
 */
router.get("/wallet-operations", getWalletOperationsSummary);

/**
 * @route   GET /api/finance/reports/module/:module
 * @desc    Get module-specific financial reports
 * @access  Private (Finance HOD, Super Admin)
 * @params  module (wallet, payroll, sales-marketing, projects)
 * @query   dateRange, startDate, endDate, year, month, includeDetails
 */
router.get("/module/:module", getModuleFinancialReports);

/**
 * @route   GET /api/finance/reports/trends
 * @desc    Get monthly financial trends and projections
 * @access  Private (Finance HOD, Super Admin)
 * @query   period, includeProjections, projectionMonths
 */
router.get("/trends", getFinancialTrends);

/**
 * @route   GET /api/finance/reports/budget-performance
 * @desc    Get budget utilization and performance metrics
 * @access  Private (Finance HOD, Super Admin)
 * @query   dateRange, includeForecasting
 */
router.get("/budget-performance", getBudgetPerformance);

/**
 * @route   GET /api/finance/reports/kpis
 * @desc    Get financial KPIs and metrics
 * @access  Private (Finance HOD, Super Admin)
 * @query   dateRange, compareWithPrevious
 */
router.get("/kpis", getFinancialKPIs);

/**
 * @route   GET /api/finance/reports/alerts
 * @desc    Get real-time financial alerts and notifications
 * @access  Private (Finance HOD, Super Admin)
 */
router.get("/alerts", getFinancialAlerts);

/**
 * @route   POST /api/finance/reports/export/pdf
 * @desc    Export financial reports as PDF
 * @access  Private (Finance HOD, Super Admin)
 * @body    reportType, dateRange, moduleFilter, includeCharts
 */
router.post("/export/pdf", exportFinancialReportsPDF);

/**
 * @route   POST /api/finance/reports/export/word
 * @desc    Export financial reports as Word/HTML
 * @access  Private (Finance HOD, Super Admin)
 * @body    reportType, dateRange, moduleFilter, includeCharts
 */
router.post("/export/word", exportFinancialReportsWord);

/**
 * @route   POST /api/finance/reports/export/csv
 * @desc    Export financial reports as CSV
 * @access  Private (Finance HOD, Super Admin)
 * @body    reportType, dateRange, moduleFilter
 */
router.post("/export/csv", exportFinancialReportsCSV);

export default router;
