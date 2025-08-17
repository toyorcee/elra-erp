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

  // Send policy notifications to relevant users
  async sendPolicyNotification(policy, action = "created", creatorId) {
    try {
      const { title, category, department, _id: policyId } = policy;

      let usersToNotify = [];

      if (department) {
        usersToNotify = await User.find({
          department: department,
          isActive: true,
          _id: { $ne: creatorId },
        }).select("_id");
      } else {
        usersToNotify = await User.find({
          isActive: true,
          _id: { $ne: creatorId },
        }).select("_id");
      }

      const actionText =
        action === "created"
          ? "created"
          : action === "updated"
          ? "updated"
          : "deleted";

      const scopeText = department ? "department" : "company-wide";

      const notifications = [];

      for (const user of usersToNotify) {
        const notificationData = {
          recipient: user._id,
          type: `POLICY_${action.toUpperCase()}`,
          title: `New ${scopeText} policy ${actionText}`,
          message: `A ${category.toLowerCase()} policy "${title}" has been ${actionText}. Please review it.`,
          data: {
            policyId: policyId,
            actionUrl: `/dashboard/modules/hr/policies`,
            priority: "medium",
          },
        };

        const notification = await this.createNotification(notificationData);
        if (notification) {
          notifications.push(notification);
        }
      }

      console.log(
        `Sent ${notifications.length} policy notifications for ${action} policy: ${title}`
      );
      return notifications;
    } catch (error) {
      console.error("Error sending policy notifications:", error);
      throw error;
    }
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

  // Delete a notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId,
      });

      if (!notification) {
        console.log(
          `❌ [NOTIFICATION] Notification ${notificationId} not found or not owned by user ${userId}`
        );
        return null;
      }

      console.log(
        `✅ [NOTIFICATION] Successfully deleted notification ${notificationId}`
      );
      return notification;
    } catch (error) {
      console.error(
        `❌ [NOTIFICATION] Error deleting notification ${notificationId}:`,
        error
      );
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

  // Send document upload success notification to creator
  async sendDocumentUploadSuccessNotification(
    documentId,
    creatorId,
    documentTitle,
    documentType,
    category
  ) {
    return await this.createNotification({
      recipient: creatorId,
      type: "DOCUMENT_UPLOAD_SUCCESS",
      title: "Document Upload Successful",
      message: `Your document "${documentTitle}" has been successfully uploaded and processed with OCR.`,
      data: {
        documentId,
        documentTitle,
        documentType,
        category,
        action: "document_upload_success",
        actionUrl: `/documents/${documentId}`,
        timestamp: new Date(),
      },
      priority: "medium",
    });
  }

  // Send document upload notification to department members (for future use)
  async sendDocumentUploadDepartmentNotification(
    documentId,
    departmentId,
    documentTitle,
    documentType,
    category,
    creatorName
  ) {
    try {
      // Get all users in the department
      const departmentUsers = await User.find({
        department: departmentId,
        _id: { $ne: documentId }, // Exclude the creator
      }).select("_id");

      const notifications = [];

      for (const user of departmentUsers) {
        const notification = await this.createNotification({
          recipient: user._id,
          type: "DOCUMENT_UPLOAD_DEPARTMENT",
          title: "New Document in Your Department",
          message: `${creatorName} uploaded "${documentTitle}" to your department.`,
          data: {
            documentId,
            documentTitle,
            documentType,
            category,
            creatorName,
            action: "document_upload_department",
            actionUrl: `/documents/${documentId}`,
            timestamp: new Date(),
          },
          priority: "low",
        });

        if (notification) {
          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error("Error sending department notifications:", error);
      throw error;
    }
  }

  // Send document upload notification to users with specific permissions (for future use)
  async sendDocumentUploadPermissionNotification(
    documentId,
    permission,
    documentTitle,
    documentType,
    category,
    creatorName
  ) {
    try {
      // Get users with specific permission
      const usersWithPermission = await User.find({
        "role.permissions": permission,
      }).select("_id");

      const notifications = [];

      for (const user of usersWithPermission) {
        const notification = await this.createNotification({
          recipient: user._id,
          type: "DOCUMENT_UPLOAD_PERMISSION",
          title: "New Document Requires Attention",
          message: `${creatorName} uploaded "${documentTitle}" that requires your attention.`,
          data: {
            documentId,
            documentTitle,
            documentType,
            category,
            creatorName,
            permission,
            action: "document_upload_permission",
            actionUrl: `/documents/${documentId}`,
            timestamp: new Date(),
          },
          priority: "medium",
        });

        if (notification) {
          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error("Error sending permission-based notifications:", error);
      throw error;
    }
  }

  // Send document OCR processing notification
  async sendDocumentOCRProcessingNotification(
    documentId,
    creatorId,
    documentTitle,
    confidence,
    extractedKeywords
  ) {
    return await this.createNotification({
      recipient: creatorId,
      type: "DOCUMENT_OCR_PROCESSING",
      title: "Document OCR Processing Complete",
      message: `OCR processing completed for "${documentTitle}" with ${(
        confidence * 100
      ).toFixed(1)}% confidence.`,
      data: {
        documentId,
        documentTitle,
        confidence,
        extractedKeywords,
        action: "document_ocr_processing",
        actionUrl: `/documents/${documentId}`,
        timestamp: new Date(),
      },
      priority: "low",
    });
  }

  // Send document auto-approval notification
  async sendDocumentAutoApprovalNotification(
    documentId,
    creatorId,
    documentTitle,
    documentType,
    category
  ) {
    return await this.createNotification({
      recipient: creatorId,
      type: "DOCUMENT_AUTO_APPROVED",
      title: "Document Auto-Approved",
      message: `Your document "${documentTitle}" has been automatically approved and is now available in the system.`,
      data: {
        documentId,
        documentTitle,
        documentType,
        category,
        action: "document_auto_approved",
        actionUrl: `/documents/${documentId}`,
        timestamp: new Date(),
      },
      priority: "medium",
    });
  }

  // Send document approval request notification
  async sendDocumentApprovalRequestNotification(
    documentId,
    creatorId,
    documentTitle,
    documentType,
    category
  ) {
    return await this.createNotification({
      recipient: creatorId,
      type: "DOCUMENT_PENDING_APPROVAL",
      title: "Document Pending Approval",
      message: `Your document "${documentTitle}" has been submitted for approval and is awaiting review.`,
      data: {
        documentId,
        documentTitle,
        documentType,
        category,
        action: "document_pending_approval",
        actionUrl: `/documents/${documentId}`,
        timestamp: new Date(),
      },
      priority: "medium",
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

  // Send policy notifications to relevant users
  async sendPolicyNotification(policy, action = "created", createdBy) {
    try {
      console.log(
        `🔔 [POLICY NOTIFICATION] Sending ${action} notification for policy: ${policy.title}`
      );

      // Get all active users with populated department and role
      const users = await User.find({ isActive: true })
        .populate("department", "_id name")
        .populate("role", "_id level")
        .select("_id email firstName lastName role department");

      console.log(
        `🔍 [POLICY NOTIFICATION] Found ${users.length} active users`
      );
      console.log(
        `🔍 [POLICY NOTIFICATION] Policy department:`,
        policy.department
      );

      const notificationPromises = users.map(async (user) => {
        let shouldNotify = false;
        let priority = "medium";

        // For company-wide policies (no department)
        if (!policy.department) {
          shouldNotify = true;
          priority = "high";
          console.log(
            `🔔 [POLICY NOTIFICATION] Company-wide policy - notifying user: ${user.email}`
          );
        }
        // For department-specific policies
        else if (user.department && user.department._id) {
          const userDeptId = user.department._id.toString();
          const policyDeptId = policy.department._id
            ? policy.department._id.toString()
            : policy.department.toString();

          if (userDeptId === policyDeptId) {
            shouldNotify = true;
            priority = "high";
            console.log(
              `🔔 [POLICY NOTIFICATION] Department match - notifying user: ${user.email} (dept: ${user.department.name})`
            );
          }
        }

        // Also notify HODs and Super Admins for department policies
        if (!shouldNotify && user.role && user.role.level >= 700) {
          shouldNotify = true;
          priority = "medium";
          console.log(
            `🔔 [POLICY NOTIFICATION] Manager role - notifying user: ${user.email} (role level: ${user.role.level})`
          );
        }

        if (!shouldNotify) {
          console.log(
            `❌ [POLICY NOTIFICATION] Skipping user: ${user.email} (dept: ${
              user.department?.name || "none"
            }, role: ${user.role?.level || "none"})`
          );
          return null;
        }

        const notificationData = {
          recipient: user._id,
          type: action === "created" ? "POLICY_CREATED" : "POLICY_UPDATED",
          title:
            action === "created"
              ? `📋 New Policy: ${policy.title}`
              : `📝 Policy Updated: ${policy.title}`,
          message:
            action === "created"
              ? `A new ${
                  policy.department ? "department" : "company-wide"
                } policy "${policy.title}" has been created and is now active.`
              : `The ${
                  policy.department ? "department" : "company-wide"
                } policy "${policy.title}" has been updated.`,
          priority: priority,
          data: {
            policyId: policy._id,
            policyTitle: policy.title,
            policyCategory: policy.category,
            policyStatus: policy.status,
            department: policy.department,
            createdBy: createdBy._id,
            actionUrl: `/dashboard/modules/hr/policies`,
          },
        };

        return await this.createNotification(notificationData);
      });

      const results = await Promise.allSettled(notificationPromises);
      const successful = results.filter(
        (result) => result.status === "fulfilled" && result.value
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;

      console.log(
        `✅ [POLICY NOTIFICATION] Successfully sent ${successful} notifications, ${failed} failed`
      );

      return { successful, failed };
    } catch (error) {
      console.error("Error sending policy notifications:", error);
      throw error;
    }
  }

  async sendComplianceNotification(compliance, action = "created", createdBy) {
    try {
      const users = await User.find({ isActive: true }).select(
        "_id email firstName lastName role department"
      );

      const notificationPromises = users.map(async (user) => {
        let priority = "medium";

        if (compliance.priority === "Critical") {
          priority = "urgent";
        } else if (compliance.priority === "High") {
          priority = "high";
        } else if (user.role && user.role.level >= 700) {
          priority = "high";
        }

        const notificationData = {
          recipient: user._id,
          type:
            action === "created" ? "COMPLIANCE_CREATED" : "COMPLIANCE_UPDATED",
          title:
            action === "created"
              ? `⚠️ New Compliance: ${compliance.title}`
              : `📝 Compliance Updated: ${compliance.title}`,
          message:
            action === "created"
              ? `A new compliance requirement "${compliance.title}" (${
                  compliance.category
                }) has been created. Due date: ${new Date(
                  compliance.dueDate
                ).toLocaleDateString()}. Priority: ${compliance.priority}.`
              : `The compliance requirement "${compliance.title}" (${
                  compliance.category
                }) has been updated. Due date: ${new Date(
                  compliance.dueDate
                ).toLocaleDateString()}. Priority: ${compliance.priority}.`,
          priority: priority,
          data: {
            complianceId: compliance._id,
            complianceTitle: compliance.title,
            complianceCategory: compliance.category,
            complianceStatus: compliance.status,
            compliancePriority: compliance.priority,
            dueDate: compliance.dueDate,
            nextAudit: compliance.nextAudit,
            description: compliance.description,
            requirements: compliance.requirements,
            findings: compliance.findings,
            createdBy: createdBy._id,
            actionUrl: `/dashboard/modules/hr/compliance`,
          },
        };

        console.log("🔍 [COMPLIANCE NOTIFICATION] Sending notification data:", {
          type: notificationData.type,
          title: notificationData.title,
          data: notificationData.data,
          fullComplianceObject: compliance,
        });

        return await this.createNotification(notificationData);
      });

      const results = await Promise.allSettled(notificationPromises);
      const successful = results.filter(
        (result) => result.status === "fulfilled" && result.value
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;

      console.log(
        `✅ [COMPLIANCE NOTIFICATION] Successfully sent ${successful} notifications, ${failed} failed`
      );

      return { successful, failed };
    } catch (error) {
      console.error("Error sending compliance notifications:", error);
      throw error;
    }
  }

  // Send deduction notifications based on scope
  async sendDeductionNotifications(deduction, populatedDeduction, user) {
    try {
      // Skip notifications for penalty deductions
      if (deduction.category === "penalty") {
        console.log(
          `🔇 [DEDUCTION NOTIFICATION] Skipping notification for penalty deduction: ${deduction.name}`
        );
        return { successful: 0, failed: 0 };
      }

      let targetUsers = [];
      let notificationMessage = "";

      switch (deduction.scope) {
        case "company":
          targetUsers = await User.find({
            isActive: true,
            "role.level": { $ne: 1000 },
          });
          notificationMessage = `New company-wide deduction "${deduction.name}" has been created. This will be applied to all employees.`;
          break;

        case "department":
          if (deduction.departments && deduction.departments.length > 0) {
            targetUsers = await User.find({
              department: { $in: deduction.departments },
              isActive: true,
            });
            const deptNames =
              populatedDeduction.departments?.map((d) => d.name).join(", ") ||
              "selected departments";
            notificationMessage = `New department-wide deduction "${deduction.name}" has been created for ${deptNames}.`;
          } else if (deduction.department) {
            targetUsers = await User.find({
              department: deduction.department,
              isActive: true,
            });
            const deptName =
              populatedDeduction.department?.name || "your department";
            notificationMessage = `New department-wide deduction "${deduction.name}" has been created for ${deptName}.`;
          }
          break;

        case "individual":
          if (deduction.employees && deduction.employees.length > 0) {
            targetUsers = await User.find({
              _id: { $in: deduction.employees },
              isActive: true,
            });
            notificationMessage = `New individual deduction "${deduction.name}" has been created for you.`;
          } else if (deduction.employee) {
            targetUsers = await User.find({
              _id: deduction.employee,
              isActive: true,
            });
            notificationMessage = `New individual deduction "${deduction.name}" has been created for you.`;
          }
          break;
      }

      const notificationPromises = targetUsers.map(async (targetUser) => {
        const notificationData = {
          recipient: targetUser._id,
          type: "DEDUCTION_CREATED",
          title: `💰 New Deduction: ${deduction.name}`,
          message: notificationMessage,
          priority: "medium",
          data: {
            deductionId: deduction._id,
            deductionName: deduction.name,
            deductionType: deduction.type,
            deductionCategory: deduction.category,
            deductionScope: deduction.scope,
            amount: deduction.amount,
            calculationType: deduction.calculationType,
            createdBy: user._id,
            actionUrl: `/dashboard/modules/payroll/deductions`,
          },
        };

        return await this.createNotification(notificationData);
      });

      const results = await Promise.allSettled(notificationPromises);
      const successful = results.filter(
        (result) => result.status === "fulfilled" && result.value
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;

      console.log(
        `✅ [DEDUCTION NOTIFICATION] Successfully sent ${successful} notifications, ${failed} failed for deduction: ${deduction.name}`
      );

      return { successful, failed };
    } catch (error) {
      console.error("Error sending deduction notifications:", error);
      throw error;
    }
  }
}

export default NotificationService;
