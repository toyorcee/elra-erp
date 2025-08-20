import express from "express";
import {
  processPayroll,
  processPayrollWithData,
  calculateEmployeePayroll,
  getPayrollPreview,
  getPayrollSummary,
  getSavedPayrolls,
  getEmployeePayrollBreakdown,
  resendPayslips,
  getPayslips,
  viewPayslip,
  downloadPayslip,
  resendPayslip,
} from "../controllers/payrollController.js";
import { protect, checkPayrollAccess } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(checkPayrollAccess);

// Payroll processing routes
router.post("/process", processPayroll);
router.post("/process-with-data", processPayrollWithData);
router.post("/calculate/:employeeId", calculateEmployeePayroll);
router.post("/preview", getPayrollPreview);
router.get("/summary", getPayrollSummary);
router.get("/saved", getSavedPayrolls);
router.get("/breakdown/:employeeId", getEmployeePayrollBreakdown);

// Payslip management routes
router.post("/resend-payslips", resendPayslips);

// New payslip routes
router.get("/payslips/:payrollId", getPayslips);
router.get("/payslips/:payrollId/view/:employeeId", viewPayslip);
router.get("/payslips/:payrollId/download/:employeeId", downloadPayslip);
router.post("/payslips/:payrollId/resend/:employeeId", resendPayslip);

export default router;
