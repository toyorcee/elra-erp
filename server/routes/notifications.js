import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getUserNotifications);

router.get("/unread-count", getUnreadCount);

router.patch("/:id/read", markAsRead);

router.patch("/mark-all-read", markAllAsRead);

router.delete("/:id", deleteNotification);

export default router;
 