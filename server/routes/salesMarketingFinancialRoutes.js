import express from "express";
import {
  getSalesMarketingDashboard,
  getSalesMarketingApprovals,
  getSalesMarketingTransactions,
  createSalesMarketingTransaction,
  approveSalesMarketingTransaction,
  rejectSalesMarketingTransaction,
  getSalesMarketingReports,
  getSalesCategories,
  getMarketingCategories,
  getOperationalBudget,
} from "../controllers/salesMarketingFinancialController.js";
import {
  protect,
  checkSalesMarketingAccess,
  checkSalesMarketingApprovalAccess,
} from "../middleware/auth.js";

const router = express.Router();

// All routes protected
router.use(protect);
router.use(checkSalesMarketingAccess);

// ===== CORE SALES & MARKETING ENDPOINTS =====

// Dashboard
router.route("/dashboard").get(getSalesMarketingDashboard);

// Budget Information
router.route("/operational-budget").get(getOperationalBudget);

// Transactions
router
  .route("/transactions")
  .get(getSalesMarketingTransactions)
  .post(createSalesMarketingTransaction);
router
  .route("/transactions/:id/approve")
  .post(checkSalesMarketingApprovalAccess, approveSalesMarketingTransaction);
router
  .route("/transactions/:id/reject")
  .post(checkSalesMarketingApprovalAccess, rejectSalesMarketingTransaction);

// Approvals
router.route("/approvals").get(getSalesMarketingApprovals);

// Reports
router.route("/reports").get(getSalesMarketingReports);

// Categories
router.route("/categories/sales").get(getSalesCategories);
router.route("/categories/marketing").get(getMarketingCategories);

export default router;
