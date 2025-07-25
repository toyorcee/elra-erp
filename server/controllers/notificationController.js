import NotificationService from "../services/notificationService.js";
import { asyncHandler } from "../utils/index.js";

class NotificationController {
  constructor(io) {
    this.notificationService = new NotificationService(io || {});
    this.io = io;
  }

  // Get user's notifications
  getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const result = await this.notificationService.getUserNotifications(
      userId,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      message: "Notifications retrieved successfully",
    });
  });

  // Get unread notification count
  getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const count = await this.notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
      message: "Unread count retrieved successfully",
    });
  });

  // Mark notification as read
  markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await this.notificationService.markAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  });

  // Mark all notifications as read
  markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await this.notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  });

  // Delete notification
  deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await this.notificationService.deleteNotification(
      notificationId,
      userId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  });

  // Get user's notification preferences
  getPreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const preferences = await this.notificationService.getUserPreferences(
      userId
    );

    res.status(200).json({
      success: true,
      data: preferences,
      message: "Notification preferences retrieved successfully",
    });
  });

  // Update user's notification preferences
  updatePreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const preferences = req.body;

    const updatedPreferences =
      await this.notificationService.updateUserPreferences(userId, preferences);

    res.status(200).json({
      success: true,
      data: updatedPreferences,
      message: "Notification preferences updated successfully",
    });
  });

  // Test notification (for development)
  testNotification = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { type = "SYSTEM_ALERT", priority = "medium" } = req.body;

    const notification = await this.notificationService.createNotification({
      recipient: userId,
      type,
      title: "Test Notification",
      message: "This is a test notification to verify your preferences.",
      data: {
        priority,
        test: true,
      },
    });

    res.status(200).json({
      success: true,
      data: notification,
      message: "Test notification sent successfully",
    });
  });
}

export default NotificationController;

export const initializeNotificationService = (io) => {
  global.notificationService = new NotificationService(io);
};
