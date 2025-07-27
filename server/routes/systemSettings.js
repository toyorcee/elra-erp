import express from "express";
import { body } from "express-validator";
import {
  getSystemSettings,
  updateSystemSettings,
  getRegistrationSettings,
  getAvailableDepartments,
  resetSystemSettings,
  updateSubscriptionPlan,
} from "../controllers/systemSettingsController.js";
import { protect } from "../middleware/auth.js";
import { checkRole } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateSystemSettings = [
  body("registration.allowPublicRegistration")
    .optional()
    .isBoolean()
    .withMessage("Allow public registration must be a boolean"),
  body("registration.requireDepartmentSelection")
    .optional()
    .isBoolean()
    .withMessage("Require department selection must be a boolean"),
  body("registration.defaultDepartment")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Default department must be between 1 and 100 characters"),
  body("departments.allowExternalDepartment")
    .optional()
    .isBoolean()
    .withMessage("Allow external department must be a boolean"),
  body("departments.maxDepartments")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Max departments must be between 1 and 100"),
  body("systemInfo.companyName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Company name must be between 1 and 100 characters"),
  body("systemInfo.systemName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("System name must be between 1 and 100 characters"),
  body("security.passwordMinLength")
    .optional()
    .isInt({ min: 6, max: 20 })
    .withMessage("Password minimum length must be between 6 and 20"),
  body("fileUpload.maxFileSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Max file size must be between 1 and 100 MB"),
  // Subscription plans validation
  body("subscriptionPlans.*.displayName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Plan display name must be between 1 and 100 characters"),
  body("subscriptionPlans.*.description")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Plan description must be between 1 and 500 characters"),
  body("subscriptionPlans.*.price.USD.monthly")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("USD monthly price must be a positive number"),
  body("subscriptionPlans.*.price.USD.yearly")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("USD yearly price must be a positive number"),
  body("subscriptionPlans.*.price.NGN.monthly")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("NGN monthly price must be a positive number"),
  body("subscriptionPlans.*.price.NGN.yearly")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("NGN yearly price must be a positive number"),
  body("subscriptionPlans.*.features.maxUsers")
    .optional()
    .isInt({ min: -1 })
    .withMessage("Max users must be -1 (unlimited) or a positive number"),
  body("subscriptionPlans.*.features.maxStorage")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max storage must be a positive number"),
  body("subscriptionPlans.*.features.maxDepartments")
    .optional()
    .isInt({ min: -1 })
    .withMessage("Max departments must be -1 (unlimited) or a positive number"),
  body("subscriptionPlans.*.isActive")
    .optional()
    .isBoolean()
    .withMessage("Plan active status must be a boolean"),
];

// Public routes (no authentication required)
router.get("/registration", getRegistrationSettings);
router.get("/departments", getAvailableDepartments);

// Protected routes
router.use(protect);

// Admin+ routes
router.get("/", checkRole(90), getSystemSettings);

// Super Admin only routes
router.put("/", checkRole(100), validateSystemSettings, updateSystemSettings);
router.post("/reset", checkRole(100), resetSystemSettings);

// Platform Admin only routes
router.put(
  "/subscription-plans/:planName",
  checkRole(110),
  updateSubscriptionPlan
);

export default router;
