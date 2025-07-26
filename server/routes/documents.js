import express from "express";
import {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  submitForApproval,
  approveDocument,
  rejectDocument,
  getPendingApprovals,
  deleteDocument,
  searchDocuments,
  updateDocument,
} from "../controllers/documentController.js";
import { protect } from "../middleware/auth.js";
import { checkPlanLimits, checkStorageLimit } from "../middleware/planLimits.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Document routes
router.post("/upload", checkPlanLimits("uploadDocument"), checkStorageLimit, uploadDocument);
router.get("/", getAllDocuments);
router.get("/search", searchDocuments);
router.get("/pending-approvals", getPendingApprovals);
router.get("/:id", getDocumentById);
router.post("/:id/submit", submitForApproval);
router.post("/:id/approve", approveDocument);
router.post("/:id/reject", rejectDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;
