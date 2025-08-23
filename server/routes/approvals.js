import express from "express";
import { body } from "express-validator";
import {
  createApproval,
  getAllApprovals,
  getApprovalById,
  takeApprovalAction,
  addApprovalComment,
  fetchPendingApprovals,
  fetchApprovalStats,
} from "../controllers/approvalController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateApproval = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Title must be between 2 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("type")
    .isIn([
      "lease_application",
      "credit_risk_assessment",
      "asset_acquisition",
      "client_onboarding",
      "contract_modification",
      "budget_allocation",
      "project_creation",
      "team_assignment",
    ])
    .withMessage("Invalid approval type"),
  body("entityType")
    .isIn(["project", "budget", "team", "procurement", "inventory"])
    .withMessage("Invalid entity type"),
  body("entityId")
    .isMongoId()
    .withMessage("Entity ID must be a valid MongoDB ID"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("dueDate").isISO8601().withMessage("Due date must be a valid date"),
];

const validateApprovalAction = [
  body("action")
    .isIn(["approve", "reject"])
    .withMessage("Action must be either 'approve' or 'reject'"),
  body("comments")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comments must be less than 500 characters"),
];

const validateComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment content must be between 1 and 1000 characters"),
  body("isInternal")
    .optional()
    .isBoolean()
    .withMessage("isInternal must be a boolean"),
];

// Apply authentication to all routes
router.use(protect);

// Create new approval request - HOD+
router.post("/", checkRole(700), validateApproval, createApproval);

// Get all approvals (with role-based filtering) - HOD+
router.get("/", checkRole(700), getAllApprovals);

// Get approvals pending user's action - HOD+
router.get("/pending", checkRole(700), fetchPendingApprovals);

// Get approval statistics - HOD+
router.get("/stats", checkRole(700), fetchApprovalStats);

// Get approval by ID - HOD+
router.get("/:id", checkRole(700), getApprovalById);

// Take approval action (approve/reject) - HOD+
router.put(
  "/:id/action",
  checkRole(700),
  validateApprovalAction,
  takeApprovalAction
);

// Add comment to approval - HOD+
router.post(
  "/:id/comments",
  checkRole(700),
  validateComment,
  addApprovalComment
);

export default router;
