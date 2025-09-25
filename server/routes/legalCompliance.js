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
  getLegalComplianceCategories,
} from "../controllers/legalComplianceController.js";
import { protect } from "../middleware/auth.js";
import {
  checkLegalAccess,
  checkComplianceWriteAccess,
  checkLegalDeleteAccess,
} from "../middleware/legalAccess.js";

const router = express.Router();

router.use(protect);

router.post("/", checkComplianceWriteAccess, createCompliance);

router.get("/", checkLegalAccess, getComplianceItems);

router.get("/:id", checkLegalAccess, getComplianceById);

router.put("/:id", checkComplianceWriteAccess, updateCompliance);

router.delete("/:id", checkLegalDeleteAccess, deleteCompliance);

router.get("/stats/overview", checkLegalAccess, getComplianceStats);

router.get("/overdue/items", checkLegalAccess, getOverdueItems);

router.get("/due-soon/items", checkLegalAccess, getDueSoonItems);

router.put("/:id/audit-dates", checkComplianceWriteAccess, updateAuditDates);

router.get(
  "/categories/available",
  checkLegalAccess,
  getLegalComplianceCategories
);

export default router;
