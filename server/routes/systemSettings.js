import express from "express";
import { body } from "express-validator";
import {
  getSystemSettings,
  updateSystemSettings,
  getRegistrationSettings,
  getAvailableDepartments,
  resetSystemSettings,
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

export default router;
