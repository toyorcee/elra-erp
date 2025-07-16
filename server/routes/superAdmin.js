import express from "express";
import {
  getSystemOverview,
  getAllSystemUsers,
  getSystemRoles,
  updateSystemSettings,
  getSystemAudit,
  bulkUserOperations,
} from "../controllers/superAdminController.js";
import { protect } from "../middleware/auth.js";
import { checkRole } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and super admin privileges
router.use(protect);
router.use(checkRole(100)); // Super admin only

// System overview and statistics
router.get("/overview", getSystemOverview);

// User management
router.get("/users", getAllSystemUsers);
router.post("/users/bulk", bulkUserOperations);

// Role management
router.get("/roles", getSystemRoles);

// System settings
router.put("/settings", updateSystemSettings);

// Audit and monitoring
router.get("/audit", getSystemAudit);

export default router;
