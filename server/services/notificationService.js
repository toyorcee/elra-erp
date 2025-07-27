import Notification from "../models/Notification.js";
import NotificationPreferences from "../models/NotificationPreferences.js";
import User from "../models/User.js";
import Role from "../models/Role.js";

class NotificationService {
  constructor(io) {
    this.io = io || { to: () => ({ emit: () => {} }) };
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

  // Check if notification should be sent based on user preferences
  async shouldSendNotification(userId, type, priority = "medium") {
    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);

      // Check if quiet hours are active
      if (preferences.isQuietHoursActive()) {
        return priority === "urgent";
      }

      if (!preferences.priorityLevels[priority]) {
        return false;
      }

      return preferences.isNotificationEnabled(type, "inApp");
    } catch (error) {
      console.error("Error checking notification preferences:", error);
      return true;
    }
  }

  // Create and send notification with preference checking
  async createNotification(notificationData) {
    try {
      const { recipient, type, priority = "medium" } = notificationData;

      // Check if notification should be sent
      const shouldSend = await this.shouldSendNotification(
        recipient,
        type,
        priority
      );

      if (!shouldSend) {
        console.log(
          `Notification skipped for user ${recipient} - type: ${type}, priority: ${priority}`
        );
        return null;
      }

      const notification = new Notification(notificationData);
      await notification.save();

      // Send real-time notification if user is online
      const socketId = this.connectedUsers.get(recipient.toString());
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

  // Get user's notification preferences
  async getUserPreferences(userId) {
    return await NotificationPreferences.getOrCreate(userId);
  }

  // Update user's notification preferences
  async updateUserPreferences(userId, preferences) {
    const userPreferences = await NotificationPreferences.getOrCreate(userId);

    // Update the preferences
    Object.keys(preferences).forEach((key) => {
      if (userPreferences[key] !== undefined) {
        userPreferences[key] = preferences[key];
      }
    });

    await userPreferences.save();
    return userPreferences;
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

  // Send platform admin notification for new subscription
  async sendPlatformAdminNewSubscriptionNotification(
    platformAdminId,
    subscriptionData
  ) {
    try {
      const notificationData = {
        recipient: platformAdminId,
        type: "SUBSCRIPTION_NEW",
        title: "🎉 New Subscription Alert!",
        message: `${subscriptionData.isCompany ? "Company" : "User"} ${
          subscriptionData.companyName || subscriptionData.userName
        } has subscribed to ${subscriptionData.planName} plan`,
        priority: "high",
        data: {
          isCompany: subscriptionData.isCompany,
          companyName: subscriptionData.companyName,
          userName: subscriptionData.userName,
          adminEmail: subscriptionData.adminEmail,
          userEmail: subscriptionData.userEmail,
          planName: subscriptionData.planName,
          billingCycle: subscriptionData.billingCycle,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
          paymentProvider: subscriptionData.paymentProvider,
          subscriptionId: subscriptionData.subscriptionId,
          actionUrl: "/platform-admin/subscriptions",
        },
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error(
        "Error sending platform admin new subscription notification:",
        error
      );
      throw error;
    }
  }

  // Send platform admin notification for subscription renewal
  async sendPlatformAdminRenewalNotification(
    platformAdminId,
    subscriptionData
  ) {
    try {
      const notificationData = {
        recipient: platformAdminId,
        type: "subscription_renewal",
        title: "🔄 Subscription Renewed!",
        message: `${subscriptionData.isCompany ? "Company" : "User"} ${
          subscriptionData.companyName || subscriptionData.userName
        } has renewed their ${subscriptionData.planName} subscription`,
        priority: "medium",
        data: {
          isCompany: subscriptionData.isCompany,
          companyName: subscriptionData.companyName,
          userName: subscriptionData.userName,
          planName: subscriptionData.planName,
          billingCycle: subscriptionData.billingCycle,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
          nextBillingDate: subscriptionData.nextBillingDate,
          subscriptionId: subscriptionData.subscriptionId,
          actionUrl: "/platform-admin/subscriptions",
        },
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error(
        "Error sending platform admin renewal notification:",
        error
      );
      throw error;
    }
  }

  // Send platform admin notification for subscription cancellation
  async sendPlatformAdminCancellationNotification(
    platformAdminId,
    subscriptionData
  ) {
    try {
      const notificationData = {
        recipient: platformAdminId,
        type: "subscription_cancellation",
        title: "⚠️ Subscription Cancelled",
        message: `${subscriptionData.isCompany ? "Company" : "User"} ${
          subscriptionData.companyName || subscriptionData.userName
        } has cancelled their ${subscriptionData.planName} subscription`,
        priority: "high",
        data: {
          isCompany: subscriptionData.isCompany,
          companyName: subscriptionData.companyName,
          userName: subscriptionData.userName,
          adminEmail: subscriptionData.adminEmail,
          userEmail: subscriptionData.userEmail,
          planName: subscriptionData.planName,
          cancellationReason: subscriptionData.cancellationReason,
          cancelledDate: subscriptionData.cancelledDate,
          subscriptionId: subscriptionData.subscriptionId,
          actionUrl: "/platform-admin/subscriptions",
        },
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error(
        "Error sending platform admin cancellation notification:",
        error
      );
      throw error;
    }
  }

  // Send platform admin notification for payment failure
  async sendPlatformAdminPaymentFailureNotification(
    platformAdminId,
    subscriptionData
  ) {
    try {
      const notificationData = {
        recipient: platformAdminId,
        type: "payment_failure",
        title: "❌ Payment Failed",
        message: `Payment failed for ${
          subscriptionData.isCompany ? "company" : "user"
        } ${subscriptionData.companyName || subscriptionData.userName}'s ${
          subscriptionData.planName
        } subscription`,
        priority: "urgent",
        data: {
          isCompany: subscriptionData.isCompany,
          companyName: subscriptionData.companyName,
          userName: subscriptionData.userName,
          adminEmail: subscriptionData.adminEmail,
          userEmail: subscriptionData.userEmail,
          planName: subscriptionData.planName,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
          paymentProvider: subscriptionData.paymentProvider,
          errorMessage: subscriptionData.errorMessage,
          subscriptionId: subscriptionData.subscriptionId,
          actionUrl: "/platform-admin/subscriptions",
        },
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error(
        "Error sending platform admin payment failure notification:",
        error
      );
      throw error;
    }
  }

  // Send user notification for their own subscription renewal
  async sendUserRenewalNotification(userId, subscriptionData) {
    try {
      const notificationData = {
        recipient: userId,
        type: "subscription_renewal",
        title: "🔄 Your Subscription Has Been Renewed!",
        message: `Your ${subscriptionData.planName} subscription has been successfully renewed`,
        priority: "medium",
        data: {
          planName: subscriptionData.planName,
          billingCycle: subscriptionData.billingCycle,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
          nextBillingDate: subscriptionData.nextBillingDate,
          transactionId: subscriptionData.transactionId,
          subscriptionId: subscriptionData.subscriptionId,
          actionUrl: "/dashboard",
        },
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error("Error sending user renewal notification:", error);
      throw error;
    }
  }

  // Send user notification for their own subscription cancellation
  async sendUserCancellationNotification(userId, subscriptionData) {
    try {
      const notificationData = {
        recipient: userId,
        type: "subscription_cancellation",
        title: "⚠️ Your Subscription Has Been Cancelled",
        message: `Your ${subscriptionData.planName} subscription has been cancelled`,
        priority: "high",
        data: {
          planName: subscriptionData.planName,
          cancelledDate: subscriptionData.cancelledDate,
          cancellationReason: subscriptionData.cancellationReason,
          accessUntil: subscriptionData.accessUntil,
          subscriptionId: subscriptionData.subscriptionId,
          actionUrl: "/dashboard",
        },
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error("Error sending user cancellation notification:", error);
      throw error;
    }
  }

  // Send user notification for payment failure
  async sendUserPaymentFailureNotification(userId, subscriptionData) {
    try {
      const notificationData = {
        recipient: userId,
        type: "payment_failure",
        title: "❌ Payment Failed - Action Required",
        message: `We were unable to process your ${subscriptionData.planName} subscription payment`,
        priority: "urgent",
        data: {
          planName: subscriptionData.planName,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
          paymentProvider: subscriptionData.paymentProvider,
          errorMessage: subscriptionData.errorMessage,
          nextRetryDate: subscriptionData.nextRetryDate,
          subscriptionId: subscriptionData.subscriptionId,
          actionUrl: "/dashboard",
        },
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error("Error sending user payment failure notification:", error);
      throw error;
    }
  }

  // Get all platform admin users
  async getPlatformAdminUsers() {
    try {
      console.log("🔍 [PLATFORM ADMIN] Searching for platform admin users...");

      // First, find the PLATFORM_ADMIN role ID
      const platformAdminRole = await Role.findOne({ name: "PLATFORM_ADMIN" });
      const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });

      if (!platformAdminRole && !superAdminRole) {
        console.log(
          "❌ [PLATFORM ADMIN] No platform admin or super admin roles found"
        );
        return [];
      }

      const roleIds = [];
      if (platformAdminRole) roleIds.push(platformAdminRole._id);
      if (superAdminRole) roleIds.push(superAdminRole._id);

      // Find users with these role IDs
      let platformAdmins = await User.find({
        role: { $in: roleIds },
      })
        .populate("role")
        .select("_id email firstName lastName role");

      // If still no results, try with the specific platform admin ID
      if (platformAdmins.length === 0) {
        console.log(
          "🔍 [PLATFORM ADMIN] No users found with role queries, trying with specific platform admin ID..."
        );
        const specificPlatformAdmin = await User.findById(
          "68823e6996e49078159dbe91"
        )
          .populate("role")
          .select("_id email firstName lastName role");

        if (specificPlatformAdmin) {
          platformAdmins = [specificPlatformAdmin];
          console.log(
            "✅ [PLATFORM ADMIN] Found specific platform admin:",
            specificPlatformAdmin.email
          );
        }
      }

      console.log("🔍 [PLATFORM ADMIN] Found users:", platformAdmins.length);
      console.log(
        "🔍 [PLATFORM ADMIN] Users:",
        platformAdmins.map((u) => ({
          id: u._id,
          email: u.email,
          roleLevel: u.role?.level,
          roleName: u.role?.name,
        }))
      );

      return platformAdmins;
    } catch (error) {
      console.error("Error getting platform admin users:", error);
      throw error;
    }
  }

  // Send notification to all platform admins
  async notifyAllPlatformAdmins(notificationFunction, subscriptionData) {
    try {
      const platformAdmins = await this.getPlatformAdminUsers();

      const notificationPromises = platformAdmins.map((admin) =>
        notificationFunction.call(this, admin._id, subscriptionData)
      );

      await Promise.allSettled(notificationPromises);

      console.log(
        `✅ Notifications sent to ${platformAdmins.length} platform admins`
      );
      return platformAdmins.length;
    } catch (error) {
      console.error("Error notifying all platform admins:", error);
      throw error;
    }
  }
}

export default NotificationService;
