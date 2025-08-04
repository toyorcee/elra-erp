import express from "express";
import { body } from "express-validator";
import {
  createInvitation,
  getInvitations,
  getInvitation,
  resendInvitation,
  cancelInvitation,
  getInvitationStats,
  verifyInvitationCode,
} from "../controllers/invitationController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public route for verifying invitation codes (no authentication required)
router.post("/verify", verifyInvitationCode);

// All other routes require authentication
router.use(protect);

// Validation middleware
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
router.get("/stats", getInvitationStats);
router.get("/:id", getInvitation);
router.post("/:id/resend", resendInvitation);
router.delete("/:id", cancelInvitation);

export default router;
