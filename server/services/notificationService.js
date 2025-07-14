import Notification from "../models/Notification.js";
import User from "../models/User.js";

class NotificationService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
  }

  // Register user connection
  registerUser(userId, socketId) {
    this.connectedUsers.set(userId.toString(), socketId);
  }

  // Remove user connection
  removeUser(socketId) {
    for (const [userId, id] of this.connectedUsers.entries()) {
      if (id === socketId) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  // Create and send notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Send real-time notification if user is online
      const socketId = this.connectedUsers.get(
        notification.recipient.toString()
      );
      if (socketId) {
        this.io.to(socketId).emit("newNotification", {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Send document approval notification
  async sendApprovalNotification(documentId, approverId, documentTitle) {
    const approver = await User.findById(approverId);
    if (!approver) return;

    await this.createNotification({
      recipient: approverId,
      type: "DOCUMENT_APPROVAL",
      title: "Document Approval Required",
      message: `You have a document "${documentTitle}" waiting for your approval.`,
      data: {
        documentId,
        actionUrl: `/documents/${documentId}`,
        priority: "high",
      },
    });
  }

  // Send document submitted notification
  async sendSubmittedNotification(
    documentId,
    approverId,
    documentTitle,
    submitterName
  ) {
    await this.createNotification({
      recipient: approverId,
      type: "DOCUMENT_SUBMITTED",
      title: "Document Submitted for Approval",
      message: `${submitterName} has submitted "${documentTitle}" for your approval.`,
      data: {
        documentId,
        actionUrl: `/documents/${documentId}`,
        priority: "medium",
      },
    });
  }

  // Send document rejected notification
  async sendRejectedNotification(
    documentId,
    submitterId,
    documentTitle,
    rejectorName,
    comments
  ) {
    await this.createNotification({
      recipient: submitterId,
      type: "DOCUMENT_REJECTED",
      title: "Document Rejected",
      message: `${rejectorName} has rejected "${documentTitle}". ${
        comments ? `Comments: ${comments}` : ""
      }`,
      data: {
        documentId,
        actionUrl: `/documents/${documentId}`,
        priority: "high",
      },
    });
  }

  // Send approval overdue notification
  async sendOverdueNotification(documentId, approverId, documentTitle) {
    await this.createNotification({
      recipient: approverId,
      type: "APPROVAL_OVERDUE",
      title: "Approval Overdue",
      message: `Document "${documentTitle}" approval is overdue. Please review immediately.`,
      data: {
        documentId,
        actionUrl: `/documents/${documentId}`,
        priority: "urgent",
      },
    });
  }

  // Send document shared notification
  async sendSharedNotification(
    documentId,
    recipientId,
    documentTitle,
    sharerName
  ) {
    await this.createNotification({
      recipient: recipientId,
      type: "DOCUMENT_SHARED",
      title: "Document Shared with You",
      message: `${sharerName} has shared "${documentTitle}" with you.`,
      data: {
        documentId,
        actionUrl: `/documents/${documentId}`,
        priority: "medium",
      },
    });
  }

  // Send system alert
  async sendSystemAlert(userId, title, message, priority = "medium") {
    await this.createNotification({
      recipient: userId,
      type: "SYSTEM_ALERT",
      title,
      message,
      data: {
        priority,
      },
    });
  }

  // Send workflow update
  async sendWorkflowUpdate(documentId, userId, documentTitle, updateMessage) {
    await this.createNotification({
      recipient: userId,
      type: "WORKFLOW_UPDATE",
      title: "Workflow Update",
      message: `Workflow update for "${documentTitle}": ${updateMessage}`,
      data: {
        documentId,
        actionUrl: `/documents/${documentId}`,
        priority: "medium",
      },
    });
  }

  // Get user's notifications
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      recipient: userId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("data.documentId", "title reference")
      .populate("data.senderId", "name email");

    const total = await Notification.countDocuments({
      recipient: userId,
      isActive: true,
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (notification) {
      notification.markAsRead();
      await notification.save();
    }

    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    return await Notification.markAllAsRead(userId);
  }

  // Get unread count
  async getUnreadCount(userId) {
    return await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isActive: true,
    });
  }
}

export default NotificationService;
