import express from "express";
import {
  getAllAllowances,
  getAllowanceById,
  createAllowance,
  updateAllowance,
  deleteAllowance,
  getAllowanceCategories,
  getAllowanceTypes,
  getTaxableStatus,
  getEmployeesByDepartments,
} from "../controllers/allowanceController.js";
import { protect, checkPayrollAccess } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// Use the reusable payroll access middleware
router.use(checkPayrollAccess);

// Routes
router.route("/").get(getAllAllowances).post(createAllowance);

router.route("/categories").get(getAllowanceCategories);
router.route("/types").get(getAllowanceTypes);
router.route("/taxable-status").get(getTaxableStatus);
router.route("/employees-by-departments").get(getEmployeesByDepartments);

router
  .route("/:id")
  .get(getAllowanceById)
  .put(updateAllowance)
  .delete(deleteAllowance);

export default router;
