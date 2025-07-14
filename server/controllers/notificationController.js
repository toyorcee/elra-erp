import NotificationService from "../services/notificationService.js";
import Notification from "../models/Notification.js";

let notificationService;

export const initializeNotificationService = (io) => {
  notificationService = new NotificationService(io);
  global.notificationService = notificationService;
};

export const getUserNotifications = async (req, res) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getUserNotifications(
      currentUser.userId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get user notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const currentUser = req.user;
    const count = await notificationService.getUnreadCount(currentUser.userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const notification = await notificationService.markAsRead(
      id,
      currentUser.userId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const currentUser = req.user;

    await notificationService.markAllAsRead(currentUser.userId);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: currentUser.userId,
      },
      { isActive: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// Export notification service for use in other controllers
export { notificationService };
