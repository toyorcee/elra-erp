import express from "express";
import { protect } from "../middleware/auth.js";
import NotificationController from "../controllers/notificationController.js";

const router = express.Router();

// Create a default controller instance (will be updated when io is available)
let notificationController = new NotificationController(null);

export const initializeNotificationRoutes = (io) => {
  notificationController = new NotificationController(io);
};

// Simple test route without authentication
router.get("/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notification routes are accessible",
    controller: !!notificationController,
    timestamp: new Date().toISOString(),
  });
});

router.use(protect);

// Test route to verify notification routes are working
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notification routes are working",
    controller: !!notificationController,
    timestamp: new Date().toISOString(),
  });
});

// Get user's notifications
router.get("/", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.getNotifications(req, res);
});

// Get unread count
router.get("/unread-count", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.getUnreadCount(req, res);
});

// Mark notification as read
router.patch("/:notificationId/read", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.markAsRead(req, res);
});

// Mark all notifications as read
router.patch("/mark-all-read", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.markAllAsRead(req, res);
});

// Delete notification
router.delete("/:notificationId", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.deleteNotification(req, res);
});

// Get notification preferences
router.get("/preferences", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.getPreferences(req, res);
});

// Update notification preferences
router.put("/preferences", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.updatePreferences(req, res);
});

// Test notification (development only)
router.post("/test", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.testNotification(req, res);
});

// Test welcome notification (development only)
router.post("/test-welcome", (req, res) => {
  if (!notificationController) {
    return res.status(500).json({
      success: false,
      message: "Notification service not initialized",
    });
  }
  notificationController.testWelcomeNotification(req, res);
});

export default router;
