import express from "express";
import {
  getAllTransactions,
  getTransactionById,
  createProcurementPayment,
  getTransactionStatistics,
} from "../controllers/transactionController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all procurement payment transactions
// @route   GET /api/transactions
// @access  Private (HOD+)
router.get("/", authorize("hod"), getAllTransactions);

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private (HOD+)
router.get("/:id", authorize("hod"), getTransactionById);

// @desc    Create procurement payment transaction
// @route   POST /api/transactions
// @access  Private (HOD+)
router.post("/", authorize("hod"), createProcurementPayment);

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private (HOD+)
router.get("/stats", authorize("hod"), getTransactionStatistics);

export default router;
