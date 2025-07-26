import express from "express";
import {
  createApprovalLevel,
  getApprovalLevels,
  getApprovalLevel,
  updateApprovalLevel,
  deleteApprovalLevel,
} from "../controllers/approvalLevelController.js";
import { protect, authorize } from "../middleware/auth.js";
import { checkPlanLimits } from "../middleware/planLimits.js";

const router = express.Router();

// All routes require authentication and SUPER_ADMIN level (100)
router.use(protect);
router.use(authorize(100));

// CRUD operations for approval levels
router.route("/").get(getApprovalLevels).post(checkPlanLimits("createApprovalLevel"), createApprovalLevel);

router
  .route("/:id")
  .get(getApprovalLevel)
  .put(updateApprovalLevel)
  .delete(deleteApprovalLevel);

export default router;
