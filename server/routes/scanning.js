import express from "express";
import {
  detectScanners,
  scanDocument,
  bulkScanDocuments,
  processScannedDocument,
  bulkProcessScannedDocuments,
  createArchiveBatch,
  getArchiveStats,
} from "../controllers/scanningController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Scanner management
router.get("/scanners", detectScanners);

// Document scanning
router.post("/scan", scanDocument);
router.post("/scan/bulk", bulkScanDocuments);

// Document processing
router.post("/process", processScannedDocument);
router.post("/process/bulk", bulkProcessScannedDocuments);

// Archive management
router.post("/archive/batch", createArchiveBatch);
router.get("/archive/stats", getArchiveStats);

export default router;
