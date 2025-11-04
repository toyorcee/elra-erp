import express from "express";
import { body } from "express-validator";
import {
  registerFromInvitation,
  getInvitationDetails,
  validateInvitationCode,
} from "../controllers/userRegistrationController.js";

const router = express.Router();

// Validation middleware
const registrationValidation = [
  body("invitationCode")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Invitation code is required"),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage("Please provide a valid Nigerian phone number"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

const codeValidation = [
  body("code")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Invitation code is required"),
];

// Public routes (no authentication required)
router.post("/validate-code", codeValidation, validateInvitationCode);
router.get("/invitation/:code", getInvitationDetails);
router.post("/register", registrationValidation, registerFromInvitation);

export default router;
