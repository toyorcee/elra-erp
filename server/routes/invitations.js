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
import {
  protect,
  checkRole,
  checkDepartmentAccess,
} from "../middleware/auth.js";

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

router.post(
  "/",
  checkRole(700),
  checkDepartmentAccess,
  createInvitationValidation,
  createInvitation
);
router.get("/", checkRole(700), getInvitations);
router.get("/user", checkRole(700), getUserInvitations);
router.get("/stats", checkRole(700), getInvitationStats);

router.get("/salary-grades", checkRole(700), getSalaryGrades);
router.get("/next-batch-number", checkRole(700), getNextBatchNumber);
router.post("/batch/:batchId/retry-emails", checkRole(700), retryFailedEmails);
router.post("/:invitationId/retry-email", checkRole(700), retrySingleEmail);
router.post(
  "/bulk-create",
  checkRole(700),
  checkDepartmentAccess,
  createBulkInvitations
);
router.post(
  "/bulk-csv",
  checkRole(700),
  checkDepartmentAccess,
  createBulkInvitationsFromCSV
);
router.get("/pending-approval", checkRole(700), getPendingApprovalInvitations);
router.post("/batch/:batchId/approve", checkRole(700), approveBulkInvitations);
router.get("/batch/:batchId", checkRole(700), getBatchInvitations);
router.get("/search-batches", checkRole(700), searchBatches);

router.get("/:id", checkRole(700), getInvitation);
router.post("/:id/resend", checkRole(700), resendInvitation);
router.delete("/:id", checkRole(700), cancelInvitation);

export default router;
