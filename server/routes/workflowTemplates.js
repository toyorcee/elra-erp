import express from "express";
import {
  getAllWorkflowTemplates,
  getWorkflowTemplateById,
  createWorkflowTemplate,
  createComplianceTemplate,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  getWorkflowTemplateForProject,
  applyWorkflowTemplateToProject,
  getWorkflowTemplateStats,
  getComplianceTypes,
} from "../controllers/workflowTemplateController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and HOD level (700)
router.use(protect);
router.use(checkRole(700));

// Workflow template routes
router.route("/").get(getAllWorkflowTemplates).post(createWorkflowTemplate);
router.route("/stats").get(getWorkflowTemplateStats);
router.route("/compliance-types").get(getComplianceTypes);
router.route("/compliance").post(createComplianceTemplate);
router.route("/project/:projectId").get(getWorkflowTemplateForProject);

router
  .route("/:id")
  .get(getWorkflowTemplateById)
  .put(updateWorkflowTemplate)
  .delete(deleteWorkflowTemplate);

router.route("/:id/apply/:projectId").post(applyWorkflowTemplateToProject);

export default router;
