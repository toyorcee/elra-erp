import express from "express";
import {
  getProjectTasksByPhase,
  completeWorkflowPhase,
  getWorkflowProgress,
  getOperationsTasks,
  completeTask,
} from "../controllers/workflowTaskController.js";
import { protect, checkWorkflowAccess } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// All workflow routes require HOD or Super Admin access
router.use(checkWorkflowAccess);

// Get all operations tasks for the current user
router.get("/operations", getOperationsTasks);

// Complete a specific task
router.post("/:taskId/complete", completeTask);

// Get tasks for a specific workflow phase
router.get("/:projectId/:phase", getProjectTasksByPhase);

// Complete a workflow phase and trigger next phase
router.post("/:projectId/:phase/complete", completeWorkflowPhase);

// Get workflow progress for a project
router.get("/:projectId/progress", getWorkflowProgress);

export default router;
