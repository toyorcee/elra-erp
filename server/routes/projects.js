import express from "express";
import { body } from "express-validator";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getNextProjectCode,
  getProjectStats,
  getComprehensiveProjectData,
  getProjectsAvailableForTeams,
  addTeamMember,
  removeTeamMember,
  addProjectNote,
  approveProject,
  rejectProject,
  triggerPostApprovalWorkflow,
  getProjectWorkflowStatus,
  getPendingApprovalProjects,
  getProjectAuditTrail,
  getMyProjectTasks,
  getMyProjects,
  updateTaskStatus,
} from "../controllers/projectController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateProject = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Project name must be between 2 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate").isISO8601().withMessage("End date must be a valid date"),
  body("budget")
    .isFloat({ min: 0 })
    .withMessage("Budget must be a positive number"),
  body("projectManager")
    .isMongoId()
    .withMessage("Project manager must be a valid user ID"),
  body("teamName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Team name must be between 2 and 100 characters"),
  body("category")
    .isIn([
      "equipment_lease",
      "vehicle_lease",
      "property_lease",
      "financial_lease",
      "training_equipment_lease",
      "compliance_lease",
      "service_equipment_lease",
      "strategic_lease",
      "software_development",
      "system_maintenance",
      "consulting",
      "training",
      "other",
    ])
    .withMessage("Invalid project category"),
];

const validateTeamMember = [
  body("userId").isMongoId().withMessage("User ID must be a valid MongoDB ID"),
  body("role")
    .isIn(["developer", "designer", "analyst", "tester", "consultant", "other"])
    .withMessage("Invalid team member role"),
];

const validateNote = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Note content must be between 1 and 1000 characters"),
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean"),
];

// All routes require authentication
router.use(protect);

// Get all projects (with role-based filtering) - Viewer+
router.get("/", checkRole(100), getAllProjects);

// Get next project code - HOD+
router.get("/next-code", checkRole(700), getNextProjectCode);

// Get project statistics - Manager+
router.get("/stats", checkRole(600), getProjectStats);

// Get comprehensive project data - SUPER_ADMIN only
router.get("/comprehensive", checkRole(1000), getComprehensiveProjectData);

// Get projects available for team assignment - SUPER_ADMIN only
router.get(
  "/available-for-teams",
  checkRole(1000),
  getProjectsAvailableForTeams
);

// Self-service routes for project tasks (must come before /:id routes)
router.get("/my-tasks", protect, getMyProjectTasks);
router.get("/my-projects", protect, getMyProjects);

// Pending approval projects - HOD+ only
router.get("/pending-approval", checkRole(700), getPendingApprovalProjects);

// Get project by ID - Viewer+
router.get("/:id", checkRole(100), getProjectById);

// Create new project - HOD+
router.post("/", checkRole(700), validateProject, createProject);

// Update project - Manager+
router.put("/:id", checkRole(600), validateProject, updateProject);

// Delete project - HOD+
router.delete("/:id", checkRole(700), deleteProject);

// Team management routes - Manager+
router.post("/:id/team", checkRole(600), validateTeamMember, addTeamMember);
router.delete("/:id/team/:userId", checkRole(600), removeTeamMember);

// Notes routes - Manager+
router.post("/:id/notes", checkRole(600), validateNote, addProjectNote);

// Approval routes - HOD+
router.post("/:id/approve", checkRole(700), approveProject);
router.post("/:id/reject", checkRole(700), rejectProject);

// Workflow routes - HOD+
router.post(
  "/:id/trigger-workflow",
  checkRole(700),
  triggerPostApprovalWorkflow
);
router.get("/:id/workflow-status", checkRole(700), getProjectWorkflowStatus);

// Audit routes - HOD+
router.get("/:id/audit-trail", checkRole(700), getProjectAuditTrail);

// Task status update
router.put("/tasks/:id/status", protect, updateTaskStatus);

export default router;
