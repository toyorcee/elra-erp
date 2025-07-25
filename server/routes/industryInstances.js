import express from "express";
import {
  createIndustryInstance,
  getIndustryInstances,
  getIndustryInstance,
  updateIndustryInstance,
  deleteIndustryInstance,
  getInstanceStats,
  getAvailableIndustries,
  resendInvitation,
  getSuperAdminCredentials,
  markPasswordChanged,
} from "../controllers/industryInstanceController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Platform Admin routes (role level 110+)
router
  .route("/")
  .post(authorize(110), createIndustryInstance)
  .get(authorize(110), getIndustryInstances);

router
  .route("/available-industries")
  .get(authorize(110), getAvailableIndustries);

router
  .route("/:id")
  .get(authorize(110), getIndustryInstance)
  .put(authorize(110), updateIndustryInstance)
  .delete(authorize(110), deleteIndustryInstance);

router.route("/:id/stats").get(authorize(110), getInstanceStats);

router.route("/:id/resend-invitation").post(authorize(110), resendInvitation);

// Public routes for Super Admin credentials (no authentication required)
router.route("/credentials").get(getSuperAdminCredentials);

router.route("/mark-password-changed").post(markPasswordChanged);

export default router;
