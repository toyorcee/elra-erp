import express from "express";
import { body } from "express-validator";
import {
  createInvitation,
  getInvitations,
  getUserInvitations,
  getInvitation,
  resendInvitation,
  cancelInvitation,
  getInvitationStats,
  verifyInvitationCode,
  getSalaryGrades,
  createBulkInvitations,
  getBatchInvitations,
  searchBatches,
  createBulkInvitationsFromCSV,
  approveBulkInvitations,
  getPendingApprovalInvitations,
  getNextBatchNumber,
  retryFailedEmails,
  retrySingleEmail,
} from "../controllers/invitationController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/verify", verifyInvitationCode);

router.use(protect);

const createInvitationValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("position")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Position must be less than 100 characters"),
  body("departmentId")
    .isMongoId()
    .withMessage("Valid department ID is required"),
  body("roleId").isMongoId().withMessage("Valid role ID is required"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be less than 500 characters"),
];

// Routes
router.post("/", createInvitationValidation, createInvitation);
router.get("/", getInvitations);
router.get("/user", getUserInvitations);
router.get("/stats", getInvitationStats);

router.get("/salary-grades", getSalaryGrades);
router.get("/next-batch-number", getNextBatchNumber);
router.post("/batch/:batchId/retry-emails", retryFailedEmails);
router.post("/:invitationId/retry-email", retrySingleEmail);
router.post("/bulk-create", createBulkInvitations);
router.post("/bulk-csv", createBulkInvitationsFromCSV);
router.get("/pending-approval", getPendingApprovalInvitations);
router.post("/batch/:batchId/approve", approveBulkInvitations);
router.get("/batch/:batchId", getBatchInvitations);
router.get("/search-batches", searchBatches);

router.get("/:id", getInvitation);
router.post("/:id/resend", resendInvitation);
router.delete("/:id", cancelInvitation);

export default router;
