import express from "express";
import {
  getELRAWallet,
  addFunds,
  setBudgetAllocation,
  getTransactionHistory,
  getAllocations,
  getFinancialReports,
  updateWalletSettings,
  exportTransactionHistoryPDF,
  exportTransactionHistoryWord,
} from "../controllers/companyWalletController.js";
import { protect, checkFinanceAccess } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication and finance access middleware to all routes
router.use(protect);
router.use(checkFinanceAccess);

// ELRA wallet management routes
router.route("/").get(getELRAWallet);
router.route("/add-funds").post(addFunds);
router.route("/set-budget").post(setBudgetAllocation);
router.route("/transactions").get(getTransactionHistory);
router.route("/allocations").get(getAllocations);
router.route("/reports").get(getFinancialReports);
router.route("/settings").put(updateWalletSettings);

// Transaction export routes
router.route("/transactions/export/pdf").post(exportTransactionHistoryPDF);
router.route("/transactions/export/word").post(exportTransactionHistoryWord);

export default router;
