import express from "express";
import { protect, checkRole } from "../middleware/auth.js";
import {
  getAllLifecycles,
  getLifecycleById,
  createLifecycle,
  updateLifecycleStatus,
  completeChecklistItem,
  updateTaskStatus,
  getActiveLifecycles,
  getOverdueLifecycles,
  getLifecycleStats,
  initiateOffboarding,
  getOffboardingLifecycles,
} from "../controllers/employeeLifecycleController.js";

const router = express.Router();

router.use(protect);

router.post("/initiate-offboarding", checkRole(600), initiateOffboarding);
router.get("/offboarding", checkRole(600), getOffboardingLifecycles);

router.get("/", checkRole(600), getAllLifecycles);

router.get("/stats", checkRole(600), getLifecycleStats);

router.get("/active", checkRole(600), getActiveLifecycles);

router.get("/overdue", checkRole(600), getOverdueLifecycles);

router.post("/", checkRole(600), createLifecycle);

// Parameterized routes (must come LAST)
router.get("/:id", checkRole(600), getLifecycleById);

router.patch("/:id/status", checkRole(600), updateLifecycleStatus);

router.patch("/:id/checklist", checkRole(600), completeChecklistItem);

router.patch("/:id/task", checkRole(600), updateTaskStatus);

export default router;
