import express from "express";
import {
  processPayroll,
  processPayrollWithData,
  submitForApproval,
  calculateEmployeePayroll,
  getPayrollPreview,
  getPendingApprovals,
  getApprovalDetails,
  getPayrollPreviewForHR,
  approvePayroll,
  rejectPayroll,
  processApprovedPayroll,
  getPayrollSummary,
  getSavedPayrolls,
  getEmployeePayrollBreakdown,
  resendPayslips,
  getPayslips,
  searchPayslips,
  viewPayslip,
  downloadPayslip,
  resendPayslip,
  getAllPayslips,
  getPersonalPayslips,
  calculateFinalPayroll,
  getFinalPayrollData,
  resendToFinance,
} from "../controllers/payrollController.js";
import {
  protect,
  checkPayrollAccess,
  checkPayrollApprovalAccess,
} from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

router.get("/personal-payslips", getPersonalPayslips);
router.get("/payslips/:payrollId/view/:employeeId", viewPayslip);
router.get("/payslips/:payrollId/download/:employeeId", downloadPayslip);

// Apply payroll access restrictions to admin routes only
router.use(checkPayrollAccess);

// Payroll processing routes
router.post("/process", processPayroll);
router.post("/process-with-data", processPayrollWithData);
router.post("/submit-for-approval", submitForApproval);
router.post("/calculate/:employeeId", calculateEmployeePayroll);
router.post("/preview", getPayrollPreview);
router.get("/summary", getPayrollSummary);
router.get("/saved", getSavedPayrolls);
router.get("/breakdown/:employeeId", getEmployeePayrollBreakdown);

// Payroll approval routes - use specific approval access middleware
router.get(
  "/approvals/pending",
  checkPayrollApprovalAccess,
  getPendingApprovals
);
router.get(
  "/approvals/:approvalId",
  checkPayrollApprovalAccess,
  getApprovalDetails
);
router.get(
  "/preview/:approvalId",
  checkPayrollApprovalAccess,
  getPayrollPreviewForHR
);
router.post(
  "/approvals/:approvalId/approve",
  checkPayrollApprovalAccess,
  approvePayroll
);
router.post(
  "/approvals/:approvalId/reject",
  checkPayrollApprovalAccess,
  rejectPayroll
);
router.post(
  "/approvals/:approvalId/resend",
  checkPayrollAccess,
  resendToFinance
);
router.post("/process-approved/:approvalId", processApprovedPayroll);

// Payslip management routes
router.post("/resend-payslips", resendPayslips);

// New payslip routes
router.get("/search-payslips", searchPayslips);
router.get("/payslips", getAllPayslips);
router.get("/payslips/:payrollId", getPayslips);

router.post("/payslips/:payrollId/resend/:employeeId", resendPayslip);

// Final payroll routes
router.post("/final", checkPayrollAccess, calculateFinalPayroll);
router.get("/final/:employeeId", checkPayrollAccess, getFinalPayrollData);

export default router;
