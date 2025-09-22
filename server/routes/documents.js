import express from "express";
import {
  uploadDocument,
  uploadProjectDocuments,
  uploadInventoryDocuments,
  replaceProjectDocument,
  getAllDocuments,
  getMyDocuments,
  getMyArchivedDocuments,
  getDocumentById,
  approveDocument,
  rejectDocument,
  deleteDocument,
  searchDocuments,
  updateDocument,
  fullTextSearch,
  metadataSearch,
  findSimilarDocuments,
  getSearchSuggestions,
  getDocumentMetadata,
  processOCR,
  getProjectDocuments,
  getPendingApprovalDocuments,
  getDocumentStats,
  processDocumentWithOCR,
  viewDocument,
  archiveDocument,
  restoreDocument,
  uploadToArchive,
  updateArchiveCategory,
  deleteArchivedDocument,
  updateArchivedDocument,
  getArchivedDocument,
} from "../controllers/documentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Document routes
router.get("/metadata", getDocumentMetadata);
router.get("/stats", getDocumentStats);
router.post("/ocr", processOCR);
router.post("/upload", uploadDocument);
router.post("/upload-project-documents", uploadProjectDocuments);
router.post("/upload-inventory", uploadInventoryDocuments);
router.post("/upload-archive", uploadToArchive);
router.post("/replace-project-document", replaceProjectDocument);
router.get("/", getAllDocuments);
router.get("/my-documents", getMyDocuments);
router.get("/my-archived", getMyArchivedDocuments);
router.get("/search", searchDocuments);
router.get("/search/fulltext", fullTextSearch);
router.get("/search/metadata", metadataSearch);
router.get("/search/suggestions", getSearchSuggestions);
router.get("/pending-approval", getPendingApprovalDocuments);
router.get("/project/:projectId", getProjectDocuments);
router.get("/:id/similar", findSimilarDocuments);
router.get("/:id/view", viewDocument);
router.get("/:id", getDocumentById);

router.post("/:id/approve", approveDocument);
router.post("/:id/reject", rejectDocument);
router.post("/:id/archive", archiveDocument);
router.get("/:id/archive", getArchivedDocument);
router.put("/:id/archive", updateArchivedDocument);
router.delete("/:id/archive", deleteArchivedDocument);
router.put("/:id/archive-category", updateArchiveCategory);
router.post("/:id/ocr", processDocumentWithOCR);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;
