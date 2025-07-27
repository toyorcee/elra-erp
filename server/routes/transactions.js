import express from "express";
import {
  getAllTransactions,
  getTransactionById,
  getTransactionsByCompany,
  getTransactionStatistics,
  getRevenueByPeriod,
  getPendingTransactions,
  getFailedTransactions,
  retryFailedTransaction,
  exportTransactions,
  getTransactionSummary,
} from "../controllers/transactionController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all transactions (Platform Admin only)
// @route   GET /api/transactions
// @access  Private (Platform Admin)
router.get("/", authorize("platform_admin"), getAllTransactions);

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private (Platform Admin, Company Admin)
router.get("/:id", getTransactionById);

// @desc    Get transactions by company
// @route   GET /api/transactions/company/:companyId
// @access  Private (Platform Admin, Company Admin)
router.get("/company/:companyId", getTransactionsByCompany);

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats/summary
// @access  Private (Platform Admin)
router.get(
  "/stats/summary",
  authorize("platform_admin"),
  getTransactionStatistics
);

// @desc    Get revenue by period
// @route   GET /api/transactions/stats/revenue
// @access  Private (Platform Admin)
router.get("/stats/revenue", authorize("platform_admin"), getRevenueByPeriod);

// @desc    Get pending transactions
// @route   GET /api/transactions/pending
// @access  Private (Platform Admin)
router.get("/pending", authorize("platform_admin"), getPendingTransactions);

// @desc    Get failed transactions
// @route   GET /api/transactions/failed
// @access  Private (Platform Admin)
router.get("/failed", authorize("platform_admin"), getFailedTransactions);

// @desc    Retry failed transaction
// @route   POST /api/transactions/:id/retry
// @access  Private (Platform Admin)
router.post("/:id/retry", authorize("platform_admin"), retryFailedTransaction);

// @desc    Export transactions to CSV
// @route   GET /api/transactions/export
// @access  Private (Platform Admin)
router.get("/export", authorize("platform_admin"), exportTransactions);

// @desc    Get transaction summary for dashboard
// @route   GET /api/transactions/dashboard/summary
// @access  Private (Platform Admin)
router.get(
  "/dashboard/summary",
  authorize("platform_admin"),
  getTransactionSummary
);

export default router;
