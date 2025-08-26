import express from "express";
import {
  initializeDocumentApproval,
  approveDocument,
  rejectDocument,
  updateDocumentDuringApproval,
  getDocumentApprovalStatus,
  getAllDocumentsApprovalStatus,
  triggerInventoryCreation,
} from "../controllers/documentApprovalController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Initialize document approval chain
router.post("/:projectId/initialize", initializeDocumentApproval);

// Approve document
router.post("/:projectId/approve/:documentType", approveDocument);

// Reject document
router.post("/:projectId/reject/:documentType", rejectDocument);

// Update document during approval
router.post("/:projectId/update/:documentType", updateDocumentDuringApproval);

// Get document approval status
router.get("/:projectId/status/:documentType", getDocumentApprovalStatus);

// Get all documents approval status
router.get("/:projectId/status", getAllDocumentsApprovalStatus);

// Trigger inventory creation
router.post("/:projectId/trigger-inventory", triggerInventoryCreation);

export default router;
