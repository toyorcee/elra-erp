import express from "express";
import { body } from "express-validator";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  getOverdueTasks,
  addComment,
  addChecklistItem,
  completeChecklistItem,
} from "../controllers/taskController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateTask = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Task title must be between 2 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("dueDate").isISO8601().withMessage("Due date must be a valid date"),
  body("assignedTo")
    .isMongoId()
    .withMessage("Assigned user must be a valid user ID"),
  body("project").isMongoId().withMessage("Project must be a valid project ID"),
  body("category")
    .isIn([
      "equipment_setup",
      "vehicle_maintenance",
      "property_inspection",
      "documentation",
      "customer_service",
      "billing",
      "compliance",
      "other",
    ])
    .withMessage("Invalid task category"),
  body("estimatedHours")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Estimated hours must be a positive number"),
];

const validateComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment content must be between 1 and 1000 characters"),
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean"),
];

const validateChecklistItem = [
  body("item")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Checklist item must be between 1 and 200 characters"),
];

// All routes require authentication
router.use(protect);

// Get all tasks (with role-based filtering) - Manager+
router.get("/", checkRole(600), getAllTasks);

// Get task statistics - Manager+
router.get("/stats", checkRole(600), getTaskStats);

// Get overdue tasks - Manager+
router.get("/overdue", checkRole(600), getOverdueTasks);

// Get task by ID - Manager+
router.get("/:id", checkRole(600), getTaskById);

// Create new task - Manager+
router.post("/", checkRole(600), validateTask, createTask);

// Update task - Manager+
router.put("/:id", checkRole(600), validateTask, updateTask);

// Delete task - HOD+
router.delete("/:id", checkRole(700), deleteTask);

// Comments routes - Manager+
router.post("/:id/comments", checkRole(600), validateComment, addComment);

// Checklist routes - Manager+
router.post(
  "/:id/checklist",
  checkRole(600),
  validateChecklistItem,
  addChecklistItem
);
router.put(
  "/:id/checklist/:itemIndex/complete",
  checkRole(600),
  completeChecklistItem
);

export default router;
