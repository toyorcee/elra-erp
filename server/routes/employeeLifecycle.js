import express from "express";
import { protect, checkLifecycleAccess } from "../middleware/auth.js";
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
  revertOffboarding,
  getCompletedOffboardings,
} from "../controllers/employeeLifecycleController.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Apply lifecycle access restrictions to admin routes only
router.use(checkLifecycleAccess);

// Lifecycle management routes
router.get("/", getAllLifecycles);
router.get("/stats", getLifecycleStats);
router.get("/active", getActiveLifecycles);
router.get("/overdue", getOverdueLifecycles);
router.get("/offboarding", getOffboardingLifecycles);
router.get("/offboarding/completed", getCompletedOffboardings);
router.post("/", createLifecycle);
router.post("/initiate-offboarding", initiateOffboarding);
router.get("/:id", getLifecycleById);
router.patch("/:id/status", updateLifecycleStatus);
router.patch("/:id/checklist", completeChecklistItem);
router.patch("/:id/task", updateTaskStatus);
router.patch("/:id/revert-offboarding", revertOffboarding);

export default router;
