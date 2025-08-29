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
  resubmitProject,
  triggerPostApprovalWorkflow,
  getProjectWorkflowStatus,
  getPendingApprovalProjects,
  getProjectAuditTrail,
  getMyProjects,
  getProjectAnalytics,
  getProjectProgress,
  completeRegulatoryCompliance,
  getRegulatoryComplianceStatus,
  completeInventory,
  completeProcurement,
  getWorkflowStatus,
  getProjectsNeedingInventory,
  getProjectCategories,
  processProjectReimbursement,
  completeDepartmentalProjectImplementation,
} from "../controllers/projectController.js";
import { protect, checkRole } from "../middleware/auth.js";
import {
  checkExternalProjectAccess,
  checkExternalProjectEdit,
  checkExternalProjectDelete,
  checkExternalProjectCreate,
} from "../middleware/projectPermissions.js";
import {
  checkDepartmentalProjectAccess,
  checkDepartmentalProjectEdit,
  checkDepartmentalProjectDelete,
  checkDepartmentalProjectCreate,
} from "../middleware/departmentalProjectPermissions.js";
import {
  checkPersonalProjectAccess,
  checkPersonalProjectEdit,
  checkPersonalProjectDelete,
  checkPersonalProjectCreate,
} from "../middleware/personalProjectPermissions.js";

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
      // SOFTWARE & TECHNOLOGY
      "software_development",
      "system_maintenance",
      "infrastructure_upgrade",
      "digital_transformation",
      "data_management",
      "security_enhancement",
      "process_automation",
      "integration_project",

      // EQUIPMENT & FACILITIES
      "equipment_purchase",
      "equipment_lease",
      "facility_improvement",
      "infrastructure_development",
      "equipment_maintenance",

      // TRAINING & DEVELOPMENT
      "training_program",
      "capacity_building",
      "skill_development",
      "professional_development",
      "industry_training",

      // CONSULTING & SERVICES
      "consulting_service",
      "advisory_service",
      "technical_support",
      "implementation_service",

      // REGULATORY & COMPLIANCE
      "regulatory_compliance",
      "compliance_audit",
      "regulatory_enforcement",
      "policy_development",
      "standards_implementation",

      // MONITORING & OVERSIGHT
      "monitoring_system",
      "oversight_program",
      "verification_service",
      "inspection_program",

      // FINANCIAL & ADMINISTRATIVE
      "financial_management",
      "budget_optimization",
      "cost_reduction",
      "administrative_improvement",

      // MARKETPLACE & EXCHANGE
      "marketplace_development",
      "exchange_platform",
      "trading_system",
      "market_analysis",

      // PUBLIC & COMMUNICATION
      "public_awareness",
      "communication_campaign",
      "stakeholder_engagement",
      "public_relations",

      // RESEARCH & ANALYSIS
      "research_project",
      "market_research",
      "feasibility_study",
      "impact_assessment",

      // OTHER
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

// Get all projects (with role-based filtering) - VIEWER+
router.get("/", checkRole(100), getAllProjects);

// Get project categories from model schema - All authenticated users
router.get("/categories", protect, getProjectCategories);

// Get next project code - STAFF+ (300+)
router.get("/next-code", checkRole(300), getNextProjectCode);

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

// Self-service routes for projects (must come before /:id routes)
router.get("/my-projects", protect, getMyProjects);

// Pending approval projects - HOD+ only
router.get("/pending-approval", checkRole(700), getPendingApprovalProjects);

// Analytics route - HOD+ only
router.get("/analytics", checkRole(700), getProjectAnalytics);

// Inventory workflow route - Operations HOD only
router.get("/inventory-workflow", checkRole(700), getProjectsNeedingInventory);

// Regulatory Compliance routes - Legal/Compliance HOD+ only
router.get(
  "/:id/regulatory-compliance",
  checkRole(700),
  getRegulatoryComplianceStatus
);
router.post(
  "/:id/complete-regulatory-compliance",
  checkRole(700),
  completeRegulatoryCompliance
);

// Workflow Completion routes - HOD+ only
router.post("/:id/complete-inventory", checkRole(700), completeInventory);
router.post("/:id/complete-procurement", checkRole(700), completeProcurement);
router.get("/:id/workflow-status", checkRole(700), getWorkflowStatus);

// Get project by ID - Viewer+ (with project access control)
router.get(
  "/:id",
  checkRole(100),
  checkExternalProjectAccess,
  checkDepartmentalProjectAccess,
  checkPersonalProjectAccess,
  getProjectById
);

// Create new project - Any authenticated user for personal projects; STAFF+ for others
router.post(
  "/",
  protect,
  checkPersonalProjectCreate,
  checkRole(300),
  checkExternalProjectCreate,
  checkDepartmentalProjectCreate,
  validateProject,
  createProject
);

// Update project - STAFF+ (300+) (with project edit control)
router.put(
  "/:id",
  checkRole(300),
  checkExternalProjectEdit,
  checkDepartmentalProjectEdit,
  checkPersonalProjectEdit,
  validateProject,
  updateProject
);

// Delete project - HOD+ (700+) (with project delete control)
router.delete(
  "/:id",
  checkRole(700),
  checkExternalProjectDelete,
  checkDepartmentalProjectDelete,
  checkPersonalProjectDelete,
  deleteProject
);

// Team management routes - MANAGER+ (600+) - Only managers and HODs can manage teams
router.post("/:id/team", checkRole(600), validateTeamMember, addTeamMember);
router.delete("/:id/team/:userId", checkRole(600), removeTeamMember);

// Notes routes - STAFF+ (300+) - All staff can add notes to projects they're involved in
router.post("/:id/notes", checkRole(300), validateNote, addProjectNote);

// Approval routes - HOD+ (700+) - Only HODs can approve/reject projects
router.post("/:id/approve", checkRole(700), approveProject);
router.post("/:id/reject", checkRole(700), rejectProject);
router.post("/:id/resubmit", protect, resubmitProject);

// Workflow routes - HOD+
router.post(
  "/:id/trigger-workflow",
  checkRole(700),
  triggerPostApprovalWorkflow
);
router.get("/:id/workflow-status", checkRole(700), getProjectWorkflowStatus);

// Audit routes - HOD+
router.get("/:id/audit-trail", checkRole(700), getProjectAuditTrail);

// Complete departmental project implementation - HOD+
router.post(
  "/:id/complete-implementation",
  checkRole(700),
  completeDepartmentalProjectImplementation
);

// Process project reimbursement - Finance HOD+
router.post("/:id/reimburse", checkRole(700), processProjectReimbursement);

export default router;
