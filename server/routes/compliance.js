import express from "express";
import {
  createCompliance,
  getComplianceItems,
  getComplianceById,
  updateCompliance,
  deleteCompliance,
  getComplianceStats,
  getOverdueItems,
  getDueSoonItems,
  updateAuditDates,
} from "../controllers/complianceController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Create compliance item (HOD and Super Admin only)
router.post("/", checkRole(700), createCompliance);

// Get all compliance items (all authenticated users can view)
router.get("/", checkRole(100), getComplianceItems);

// Get compliance item by ID (all authenticated users can view)
router.get("/:id", checkRole(100), getComplianceById);

// Update compliance item (HOD and Super Admin only)
router.put("/:id", checkRole(700), updateCompliance);

// Delete compliance item (Super Admin only)
router.delete("/:id", checkRole(1000), deleteCompliance);

// Get compliance statistics (all authenticated users can view)
router.get("/stats/overview", checkRole(100), getComplianceStats);

// Get overdue compliance items (all authenticated users can view)
router.get("/overdue/items", checkRole(100), getOverdueItems);

// Get due soon compliance items (all authenticated users can view)
router.get("/due-soon/items", checkRole(100), getDueSoonItems);

// Update audit dates (HOD and Super Admin only)
router.put("/:id/audit-dates", checkRole(700), updateAuditDates);

export default router;
