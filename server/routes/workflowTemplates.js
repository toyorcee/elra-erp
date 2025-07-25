import express from "express";
import {
  createWorkflowTemplate,
  getWorkflowTemplates,
  getWorkflowTemplate,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
} from "../controllers/workflowTemplateController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and SUPER_ADMIN level (100)
router.use(protect);
router.use(authorize(100));

// CRUD operations for workflow templates
router.route("/").get(getWorkflowTemplates).post(createWorkflowTemplate);

router
  .route("/:id")
  .get(getWorkflowTemplate)
  .put(updateWorkflowTemplate)
  .delete(deleteWorkflowTemplate);

export default router;
