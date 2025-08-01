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
  fullTextSearch,
  metadataSearch,
  findSimilarDocuments,
  getSearchSuggestions,
  getDocumentMetadata,
  processOCR,
} from "../controllers/documentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Document routes
router.get("/metadata", getDocumentMetadata);
router.post("/ocr", processOCR);
router.post("/upload", uploadDocument);
router.get("/", getAllDocuments);
router.get("/search", searchDocuments);
router.get("/search/fulltext", fullTextSearch);
router.get("/search/metadata", metadataSearch);
router.get("/search/suggestions", getSearchSuggestions);
router.get("/:id/similar", findSimilarDocuments);
router.get("/pending-approvals", getPendingApprovals);
router.get("/:id", getDocumentById);
router.post("/:id/submit", submitForApproval);
router.post("/:id/approve", approveDocument);
router.post("/:id/reject", rejectDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;
