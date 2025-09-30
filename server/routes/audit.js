import express from "express";
import {
  getRecentActivity,
  getDocumentAuditTrail,
  getUserActivitySummary,
  getActivityStats,
  exportAuditLogs,
  getAuditLogs,
  getAuditLogById,
  cleanOldLogs,
  getAuditDashboard,
  createSampleAuditData,
} from "../controllers/auditController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/recent-activity", getRecentActivity);

router.get("/dashboard", getAuditDashboard);
router.get("/activity-stats", getActivityStats);
router.get("/logs", getAuditLogs);
router.get("/logs/:id", getAuditLogById);

router.get("/documents/:documentId", getDocumentAuditTrail);

router.get("/users/:userId", getUserActivitySummary);

router.get("/export", exportAuditLogs);
router.delete("/clean", cleanOldLogs);

// Test endpoint to create sample audit data
router.post("/sample-data", createSampleAuditData);

export default router;
