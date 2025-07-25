import express from "express";
import { protect, checkRole } from "../middleware/auth.js";
import {
  createCompanyAndSuperadmin,
  listCompanies,
  getPlatformStatistics,
} from "../controllers/platformAdminController.js";

const router = express.Router();

// All routes require authentication and platform admin role
router.use(protect);
router.use(checkRole("PLATFORM_ADMIN"));

// Company management
router.post("/companies", createCompanyAndSuperadmin);
router.get("/companies", listCompanies);

// Platform statistics
router.get("/statistics", getPlatformStatistics);

export default router;
