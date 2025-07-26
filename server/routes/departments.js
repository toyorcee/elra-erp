import express from "express";
import { body } from "express-validator";
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentUsers,
  getDepartmentHierarchy,
  getDepartmentStats,
  getActiveDepartments,
  bulkDeleteDepartments,
  bulkCreateDepartments,
} from "../controllers/departmentController.js";
import { protect } from "../middleware/auth.js";
import { checkRole } from "../middleware/auth.js";
import { checkPlanLimits } from "../middleware/planLimits.js";

const router = express.Router();

// Validation middleware
const validateDepartment = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department name must be between 2 and 100 characters"),
  body("code")
    .trim()
    .isLength({ min: 2, max: 10 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Department code must be 2-10 uppercase letters/numbers"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("level")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Level must be between 1 and 100"),
  body("color")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Color must be a valid hex color code"),
];

// All routes require authentication
router.use(protect);

// Get active departments (for dropdowns) - All authenticated users
router.get("/active", getActiveDepartments);

// Get department statistics - Admin+
router.get("/:id/stats", checkRole(80), getDepartmentStats);

// Get department hierarchy - Admin+
router.get("/:id/hierarchy", checkRole(80), getDepartmentHierarchy);

// Get department users - Admin+
router.get("/:id/users", checkRole(80), getDepartmentUsers);

// Get department by ID - Admin+
router.get("/:id", checkRole(80), getDepartmentById);

router.get("/", checkRole(80), getAllDepartments);

// Super Admin only routes
router.post(
  "/",
  checkRole(100),
  checkPlanLimits("createDepartment"),
  validateDepartment,
  createDepartment
);
router.put("/:id", checkRole(100), validateDepartment, updateDepartment);
router.delete("/:id", checkRole(100), deleteDepartment);
router.delete("/bulk-delete", checkRole(100), bulkDeleteDepartments);
router.post("/bulk-create", checkRole(100), bulkCreateDepartments);

export default router;
