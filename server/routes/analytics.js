import express from "express";
import {
  getDepartmentAnalytics,
  getCompanyAnalytics,
} from "../controllers/analyticsController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get department analytics (for HODs - level 700+)
router.get("/department/:departmentId", checkRole(700), getDepartmentAnalytics);

// Get company-wide analytics (for super admins - level 1000)
router.get("/company", checkRole(1000), getCompanyAnalytics);

export default router;
