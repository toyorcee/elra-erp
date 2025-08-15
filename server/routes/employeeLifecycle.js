import express from "express";
import {
  protect,
  checkRole,
  checkDepartmentAccess,
} from "../middleware/auth.js";
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

router.post(
  "/initiate-offboarding",
  checkRole(700),
  checkDepartmentAccess,
  initiateOffboarding
);
router.get("/offboarding", checkRole(700), getOffboardingLifecycles);

router.get("/", checkRole(700), getAllLifecycles);

router.get("/stats", checkRole(700), getLifecycleStats);

router.get("/active", checkRole(700), getActiveLifecycles);

router.get("/overdue", checkRole(700), getOverdueLifecycles);

router.post("/", checkRole(700), checkDepartmentAccess, createLifecycle);

// Parameterized routes (must come LAST)
router.get("/:id", checkRole(700), getLifecycleById);

router.patch("/:id/status", checkRole(700), updateLifecycleStatus);

router.patch("/:id/checklist", checkRole(700), completeChecklistItem);

router.patch("/:id/task", checkRole(700), updateTaskStatus);

export default router;
