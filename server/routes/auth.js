import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  joinCompany,
  verifyEmail,
  resendVerificationEmail,
  getRegistrationRoles,
  getRegistrationDepartments,
  getUserModules,
  getAllModules,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { passwordResetLimiter } from "../middleware/rateLimit.js";
import { allowPasswordChangeRoutes } from "../middleware/passwordSecurity.js";

const router = express.Router();

// Validation middleware
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
];

const loginValidation = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordValidation = [
  body("currentPassword")
    .optional()
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage("Please provide a valid email address"),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

const verifyEmailValidation = [
  body("token").notEmpty().withMessage("Verification token is required"),
];

const resendVerificationValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

// Routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/join-company", joinCompany);
router.post("/logout", protect, logout);
router.post("/refresh", refreshToken);
router.get("/me", protect, getMe);
router.put(
  "/change-password",
  protect,
  allowPasswordChangeRoutes,
  changePasswordValidation,
  changePassword
);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPasswordValidation,
  forgotPassword
);
router.post("/reset-password", resetPasswordValidation, resetPassword);
router.post("/verify-email", verifyEmailValidation, verifyEmail);
router.post(
  "/resend-verification",
  resendVerificationValidation,
  resendVerificationEmail
);

// Registration data endpoints
router.get("/registration-roles", getRegistrationRoles);
router.get("/registration-departments", getRegistrationDepartments);

// User modules endpoint
router.get("/all-modules", getAllModules);
router.get("/user-modules", protect, getUserModules);

export default router;
