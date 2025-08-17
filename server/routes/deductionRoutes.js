import express from "express";
import { protect, checkPayrollAccess } from "../middleware/auth.js";
import {
  getAllDeductions,
  getDeductionCategories,
  getDeductionTypes,
  getEmployeesByDepartments,
  createDeduction,
  updateDeduction,
  deleteDeduction,
  getDeductionById,
  getEmployeeDeductions,
  getActiveDeductionsForPayroll,
  updateDeductionUsage,
  toggleDeductionStatus,
} from "../controllers/deductionController.js";

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(checkPayrollAccess);

// Get all deductions with filtering and pagination
router.get("/", getAllDeductions);

// Get deduction categories and types
router.get("/categories", getDeductionCategories);
router.get("/types", getDeductionTypes);
router.get("/employees-by-departments", getEmployeesByDepartments);

// Get deductions for specific employee
router.get("/employee/:employeeId", getEmployeeDeductions);

// Get active deductions for payroll processing
router.get("/payroll", getActiveDeductionsForPayroll);

// CRUD operations
router.post("/", createDeduction);
router.get("/:id", getDeductionById);
router.put("/:id", updateDeduction);
router.delete("/:id", deleteDeduction);

// Bulk operations for payroll
router.put("/usage/update", updateDeductionUsage);

router.put("/:id/toggle", toggleDeductionStatus);

export default router;
