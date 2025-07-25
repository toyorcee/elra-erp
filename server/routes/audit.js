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
} from "../controllers/auditController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/recent", getRecentActivity);

router.get(
  "/dashboard",
  restrictTo("PLATFORM_ADMIN", "SUPER_ADMIN", "ADMIN"),
  getAuditDashboard
);

router.get(
  "/stats",
  restrictTo("PLATFORM_ADMIN", "SUPER_ADMIN", "ADMIN"),
  getActivityStats
);

router.get(
  "/logs",
  restrictTo("PLATFORM_ADMIN", "SUPER_ADMIN", "ADMIN"),
  getAuditLogs
);

router.get(
  "/logs/:id",
  restrictTo("PLATFORM_ADMIN", "SUPER_ADMIN", "ADMIN"),
  getAuditLogById
);

router.get("/documents/:documentId", getDocumentAuditTrail);

router.get("/users/:userId", getUserActivitySummary);

router.get("/export", restrictTo("SUPER_ADMIN", "ADMIN"), exportAuditLogs);

router.delete("/clean", restrictTo("SUPER_ADMIN"), cleanOldLogs);

export default router;
