import express from "express";
import { protect, checkRole } from "../middleware/auth.js";
import {
  saveSystemSetup,
  getIndustryTemplates,
  getSystemSetupStatus,
} from "../controllers/systemSetupController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get available industry templates (public for authenticated users)
router.get("/templates", getIndustryTemplates);

// Get system setup status for a company
router.get("/status/:companyId", getSystemSetupStatus);

// Save system setup configuration (superadmin only)
router.post(
  "/:companyId",
  checkRole({ minLevel: 100 }), // SUPER_ADMIN only
  saveSystemSetup
);

export default router;
