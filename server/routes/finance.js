import express from "express";
import { body } from "express-validator";
import {
  getAllFinance,
  getFinanceById,
  createFinance,
  updateFinance,
  deleteFinance,
  getFinancialStats,
  getRevenueStats,
  getExpenseStats,
  getOverdueTransactions,
  getPendingApprovals,
  approve,
  addPayment,
  addNote,
} from "../controllers/financeController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateFinance = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Transaction title must be between 2 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("type")
    .isIn(["income", "expense", "transfer"])
    .withMessage("Invalid transaction type"),
  body("category")
    .isIn([
      "lease_revenue",
      "project_income",
      "service_fees",
      "interest_income",
      "other_income",
      "maintenance_costs",
      "procurement_costs",
      "project_expenses",
      "operational_costs",
      "salary_expenses",
      "insurance_costs",
      "utility_costs",
      "other_expenses",
    ])
    .withMessage("Invalid transaction category"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),
  body("transactionDate")
    .isISO8601()
    .withMessage("Transaction date must be a valid date"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
];

const validatePayment = [
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Payment amount must be a positive number"),
  body("paymentMethod")
    .isIn(["cash", "bank_transfer", "cheque", "card", "mobile_money"])
    .withMessage("Invalid payment method"),
  body("reference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Reference must be less than 100 characters"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Payment notes must be less than 500 characters"),
];

const validateApproval = [
  body("approvalNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Approval notes must be less than 500 characters"),
];

const validateNote = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Note content must be between 1 and 1000 characters"),
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean"),
];

// All routes require authentication
router.use(protect);

// Get all finance transactions (with role-based filtering) - HOD+
router.get("/", checkRole(700), getAllFinance);

// Get financial statistics - HOD+
router.get("/stats", checkRole(700), getFinancialStats);

// Get revenue statistics - HOD+
router.get("/revenue-stats", checkRole(700), getRevenueStats);

// Get expense statistics - HOD+
router.get("/expense-stats", checkRole(700), getExpenseStats);

// Get overdue transactions - HOD+
router.get("/overdue", checkRole(700), getOverdueTransactions);

// Get pending approvals - HOD+
router.get("/pending-approvals", checkRole(700), getPendingApprovals);

// Get finance transaction by ID - HOD+
router.get("/:id", checkRole(700), getFinanceById);

// Create new finance transaction - HOD+
router.post("/", checkRole(700), validateFinance, createFinance);

// Update finance transaction - HOD+
router.put("/:id", checkRole(700), validateFinance, updateFinance);

// Delete finance transaction - HOD+
router.delete("/:id", checkRole(700), deleteFinance);

// Approval routes - HOD+
router.post("/:id/approve", checkRole(700), validateApproval, approve);

// Payment routes - HOD+
router.post("/:id/payments", checkRole(700), validatePayment, addPayment);

// Notes routes - HOD+
router.post("/:id/notes", checkRole(700), validateNote, addNote);

export default router;
