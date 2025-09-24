import express from "express";
import { protect, checkLifecycleAccess } from "../middleware/auth.js";
import {
  uploadMultipleDocuments,
  handleUploadError,
} from "../middleware/upload.js";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  uploadAnnouncementAttachments,
  getAllEvents,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/communicationController.js";

const router = express.Router();

router.get("/announcements", protect, listAnnouncements);
router.post("/announcements", protect, createAnnouncement);
router.patch("/announcements/:id", protect, updateAnnouncement);
router.delete("/announcements/:id", protect, deleteAnnouncement);

// File upload for announcements
router.post(
  "/announcements/upload-attachments",
  protect,
  uploadMultipleDocuments,
  handleUploadError,
  uploadAnnouncementAttachments
);

// Events
router.get("/events/all", protect, getAllEvents);
router.get("/events", protect, listEvents);
router.post("/events", protect, createEvent);
router.patch("/events/:id", protect, updateEvent);
router.delete("/events/:id", protect, deleteEvent);

export default router;
