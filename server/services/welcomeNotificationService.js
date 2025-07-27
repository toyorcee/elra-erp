import Notification from "../models/Notification.js";
import NotificationPreferences from "../models/NotificationPreferences.js";
import { sendWelcomeEmail } from "./emailService.js";

class WelcomeNotificationService {
  constructor(io) {
    this.io = io || { to: () => ({ emit: () => {} }) };
  }

  // Send welcome notification and email to new user
  async sendWelcomeNotification(user) {
    try {
      console.log(`🎉 Sending welcome notification to user: ${user.email}`);

      // Create welcome notification
      const notification = await this.createWelcomeNotification(user);

      // Send welcome email
      await this.sendWelcomeEmail(user);

      // Send real-time notification if user is online
      this.sendRealTimeNotification(user._id, notification);

      console.log(
        `✅ Welcome notification sent successfully to: ${user.email}`
      );
      return { success: true, notification };
    } catch (error) {
      console.error(
        `❌ Error sending welcome notification to ${user.email}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Create welcome notification in database
  async createWelcomeNotification(user) {
    const notification = new Notification({
      recipient: user._id,
      type: "WELCOME",
      title: "Welcome to EDMS! 🎉",
      message: `Welcome ${
        user.firstName || user.username
      }! Your account has been successfully created. Start exploring the EDMS platform and manage your documents efficiently.`,
      data: {
        priority: "medium",
        actionUrl: "/dashboard",
      },
    });

    await notification.save();
    return notification;
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    try {
      const userName = user.firstName || user.username;
      const result = await sendWelcomeEmail(user.email, userName);

      if (result.success) {
        console.log(`✅ Welcome email sent to: ${user.email}`);
      } else {
        console.error(
          `❌ Failed to send welcome email to ${user.email}:`,
          result.error
        );
      }

      return result;
    } catch (error) {
      console.error(`❌ Error sending welcome email to ${user.email}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send real-time notification via Socket.IO
  sendRealTimeNotification(userId, notification) {
    try {
      this.io.to(userId.toString()).emit("newNotification", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
      });
      console.log(`📡 Real-time welcome notification sent to user: ${userId}`);
    } catch (error) {
      console.error(
        `❌ Error sending real-time notification to ${userId}:`,
        error
      );
    }
  }

  // Send account activation notification
  async sendAccountActivationNotification(user) {
    try {
      console.log(
        `🔓 Sending account activation notification to user: ${user.email}`
      );

      const notification = new Notification({
        recipient: user._id,
        type: "ACCOUNT_ACTIVATED",
        title: "Account Activated! ✅",
        message: `Your account has been successfully activated. You now have full access to all EDMS features.`,
        data: {
          priority: "medium",
          actionUrl: "/dashboard",
        },
      });

      await notification.save();

      // Send real-time notification
      this.sendRealTimeNotification(user._id, notification);

      console.log(`✅ Account activation notification sent to: ${user.email}`);
      return { success: true, notification };
    } catch (error) {
      console.error(
        `❌ Error sending account activation notification to ${user.email}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Send subscription activation notification
  async sendSubscriptionActivationNotification(user, subscriptionDetails) {
    try {
      console.log(
        `💳 Sending subscription activation notification to user: ${user.email}`
      );

      const notification = new Notification({
        recipient: user._id,
        type: "SUBSCRIPTION_ACTIVE",
        title: "Subscription Activated! 🎉",
        message: `Your ${subscriptionDetails.planName} subscription is now active. Enjoy all the premium features!`,
        data: {
          priority: "high",
          actionUrl: "/dashboard",
          subscriptionDetails,
        },
      });

      await notification.save();

      // Send real-time notification
      this.sendRealTimeNotification(user._id, notification);

      console.log(
        `✅ Subscription activation notification sent to: ${user.email}`
      );
      return { success: true, notification };
    } catch (error) {
      console.error(
        `❌ Error sending subscription activation notification to ${user.email}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Check if user should receive notifications
  async shouldSendNotification(userId, type) {
    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);
      return preferences.isNotificationEnabled(type, "inApp");
    } catch (error) {
      console.error(
        `❌ Error checking notification preferences for user ${userId}:`,
        error
      );
      return true; // Default to sending if preferences can't be checked
    }
  }
}

export default WelcomeNotificationService;
