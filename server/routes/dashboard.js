import express from "express";
import {
  getDashboardData,
  getMyDocuments,
  getMyPendingApprovals,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get("/", getDashboardData);
router.get("/my-documents", getMyDocuments);
router.get("/my-pending-approvals", getMyPendingApprovals);

export default router;
 