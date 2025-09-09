import express from "express";
import { body } from "express-validator";
import {
  getAllProcurement,
  getProcurementById,
  createProcurement,
  updateProcurement,
  deleteProcurement,
  getProcurementStats,
  getPendingApprovals,
  getOverdueDeliveries,
  approve,
  receiveItems,
  addNote,
  completeProcurementOrder,
  resendProcurementEmail,
} from "../controllers/procurementController.js";
import { protect, checkRole, checkProcurementAccess } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateProcurement = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("PO title must be between 2 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("supplier.name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Supplier name must be between 2 and 100 characters"),
  body("supplier.email")
    .optional()
    .isEmail()
    .withMessage("Supplier email must be a valid email"),
  body("supplier.phone")
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage("Supplier phone must be between 10 and 20 characters"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.name")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Item name must be between 2 and 200 characters"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  body("items.*.unitPrice")
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a positive number"),
  body("expectedDeliveryDate")
    .isISO8601()
    .withMessage("Expected delivery date must be a valid date"),
];

const validateApproval = [
  body("approvalNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Approval notes must be less than 500 characters"),
];

const validateReceipt = [
  body("receivedItems")
    .isArray({ min: 1 })
    .withMessage("At least one received item is required"),
  body("receivedItems.*.itemIndex")
    .isInt({ min: 0 })
    .withMessage("Item index must be a non-negative integer"),
  body("receivedItems.*.receivedQuantity")
    .isInt({ min: 1 })
    .withMessage("Received quantity must be a positive integer"),
  body("receiptNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Receipt notes must be less than 500 characters"),
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

// Get all procurement (with role-based filtering) - Manager+
router.get("/", checkRole(600), getAllProcurement);

// Get procurement statistics - Manager+
router.get("/stats", checkRole(600), getProcurementStats);

// Get pending approvals - Manager+
router.get("/pending-approvals", checkRole(600), getPendingApprovals);

// Get overdue deliveries - Manager+
router.get("/overdue-deliveries", checkRole(600), getOverdueDeliveries);

// Get procurement by ID - Manager+
router.get("/:id", checkRole(600), getProcurementById);

// Create new procurement - Procurement HOD+
router.post("/", checkProcurementAccess, validateProcurement, createProcurement);

// Update procurement - Procurement HOD+
router.put("/:id", checkProcurementAccess, validateProcurement, updateProcurement);

// Complete draft procurement order - Procurement HOD+
router.put("/:id/complete", checkProcurementAccess, completeProcurementOrder);

// Resend procurement email - Procurement HOD+
router.post("/:id/resend-email", checkProcurementAccess, resendProcurementEmail);

// Delete procurement - Procurement HOD+
router.delete("/:id", checkProcurementAccess, deleteProcurement);

// Approval routes - Manager+
router.post("/:id/approve", checkRole(600), validateApproval, approve);

// Receipt routes - Manager+
router.post("/:id/receive", checkRole(600), validateReceipt, receiveItems);

// Notes routes - Manager+
router.post("/:id/notes", checkRole(600), validateNote, addNote);

export default router;
