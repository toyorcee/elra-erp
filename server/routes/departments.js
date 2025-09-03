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
import { protect, checkRole } from "../middleware/auth.js";

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
];

// All routes require authentication
router.use(protect);

// Get active departments (for dropdowns) - All authenticated users
router.get("/active", getActiveDepartments);

// Get department statistics - Manager+
router.get("/:id/stats", checkRole(600), getDepartmentStats);

// Get department hierarchy - Manager+
router.get("/:id/hierarchy", checkRole(600), getDepartmentHierarchy);

// Get department users - Manager+
router.get("/:id/users", checkRole(600), getDepartmentUsers);

// Get department by ID - Manager+
router.get("/:id", checkRole(600), getDepartmentById);

router.get("/", getAllDepartments);

// HR HOD+ and Super Admin routes
router.post("/", validateDepartment, createDepartment);
router.put("/:id", validateDepartment, updateDepartment);
router.delete("/:id", deleteDepartment);
router.delete("/bulk-delete", checkRole(1000), bulkDeleteDepartments);
router.post("/bulk-create", checkRole(1000), bulkCreateDepartments);

export default router;
