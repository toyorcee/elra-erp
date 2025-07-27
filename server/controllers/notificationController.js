import NotificationService from "../services/notificationService.js";
import { asyncHandler } from "../utils/index.js";
import WelcomeNotificationService from "../services/welcomeNotificationService.js";

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

  // Test notification (development)
  testNotification = asyncHandler(async (req, res) => {
    const { type = "WELCOME", priority = "medium" } = req.body;
    const userId = req.user._id;

    try {
      const notification = await this.notificationService.createNotification({
        recipient: userId,
        type,
        title: `Test ${type} Notification`,
        message: `This is a test ${type.toLowerCase()} notification for development purposes.`,
        data: {
          priority,
          actionUrl: "/dashboard",
        },
      });

      res.status(200).json({
        success: true,
        message: "Test notification sent successfully",
        data: notification,
      });
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send test notification",
      });
    }
  });

  // Test welcome notification specifically
  testWelcomeNotification = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
      const welcomeService = new WelcomeNotificationService(global.io);
      const result = await welcomeService.sendWelcomeNotification(req.user);

      res.status(200).json({
        success: true,
        message: "Welcome notification test sent successfully",
        data: result,
      });
    } catch (error) {
      console.error("Welcome notification test error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send welcome notification test",
      });
    }
  });
}

export default NotificationController;

export const initializeNotificationService = (io) => {
  global.notificationService = new NotificationService(io);
};
