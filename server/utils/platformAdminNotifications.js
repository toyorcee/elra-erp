import {
  sendPlatformAdminNewSubscriptionEmail,
  sendPlatformAdminRenewalEmail,
  sendPlatformAdminCancellationEmail,
  sendPlatformAdminPaymentFailureEmail,
  sendUserRenewalEmail,
  sendUserCancellationEmail,
  sendUserPaymentFailureEmail,
} from "../services/emailService.js";
import NotificationService from "../services/notificationService.js";

class PlatformAdminNotificationService {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  // Send new subscription notifications to all platform admins
  async notifyNewSubscription(subscriptionData) {
    try {
      console.log(
        "📧 [PLATFORM ADMIN] Sending new subscription notifications..."
      );

      // Get all platform admin users
      const platformAdmins =
        await this.notificationService.getPlatformAdminUsers();

      if (platformAdmins.length === 0) {
        console.log("⚠️ [PLATFORM ADMIN] No platform admin users found");
        return;
      }

      // Send email notifications
      const emailPromises = platformAdmins.map((admin) =>
        sendPlatformAdminNewSubscriptionEmail(admin.email, subscriptionData)
      );

      // Send in-app notifications
      const inAppPromises = platformAdmins.map((admin) =>
        this.notificationService.sendPlatformAdminNewSubscriptionNotification(
          admin._id,
          subscriptionData
        )
      );

      // Wait for all notifications to be sent
      const [emailResults, inAppResults] = await Promise.allSettled([
        Promise.allSettled(emailPromises),
        Promise.allSettled(inAppPromises),
      ]);

      console.log(
        `✅ [PLATFORM ADMIN] New subscription notifications sent to ${platformAdmins.length} platform admins`
      );
      console.log(
        `📧 Email results: ${
          emailResults.value?.filter((r) => r.status === "fulfilled").length ||
          0
        } successful`
      );
      console.log(
        `🔔 In-app results: ${
          inAppResults.value?.filter((r) => r.status === "fulfilled").length ||
          0
        } successful`
      );
    } catch (error) {
      console.error(
        "❌ [PLATFORM ADMIN] Error sending new subscription notifications:",
        error
      );
    }
  }

  // Send renewal notifications to all platform admins
  async notifyRenewal(subscriptionData) {
    try {
      console.log("📧 [PLATFORM ADMIN] Sending renewal notifications...");

      const platformAdmins =
        await this.notificationService.getPlatformAdminUsers();

      if (platformAdmins.length === 0) {
        console.log("⚠️ [PLATFORM ADMIN] No platform admin users found");
        return;
      }

      // Send email notifications
      const emailPromises = platformAdmins.map((admin) =>
        sendPlatformAdminRenewalEmail(admin.email, subscriptionData)
      );

      // Send in-app notifications
      const inAppPromises = platformAdmins.map((admin) =>
        this.notificationService.sendPlatformAdminRenewalNotification(
          admin._id,
          subscriptionData
        )
      );

      // Wait for all notifications to be sent
      const [emailResults, inAppResults] = await Promise.allSettled([
        Promise.allSettled(emailPromises),
        Promise.allSettled(inAppPromises),
      ]);

      console.log(
        `✅ [PLATFORM ADMIN] Renewal notifications sent to ${platformAdmins.length} platform admins`
      );
      console.log(
        `📧 Email results: ${
          emailResults.value?.filter((r) => r.status === "fulfilled").length ||
          0
        } successful`
      );
      console.log(
        `🔔 In-app results: ${
          inAppResults.value?.filter((r) => r.status === "fulfilled").length ||
          0
        } successful`
      );
    } catch (error) {
      console.error(
        "❌ [PLATFORM ADMIN] Error sending renewal notifications:",
        error
      );
    }
  }

  // Send cancellation notifications to all platform admins
  async notifyCancellation(subscriptionData) {
    try {
      console.log("📧 [PLATFORM ADMIN] Sending cancellation notifications...");

      const platformAdmins =
        await this.notificationService.getPlatformAdminUsers();

      if (platformAdmins.length === 0) {
        console.log("⚠️ [PLATFORM ADMIN] No platform admin users found");
        return;
      }

      // Send email notifications
      const emailPromises = platformAdmins.map((admin) =>
        sendPlatformAdminCancellationEmail(admin.email, subscriptionData)
      );

      // Send in-app notifications
      const inAppPromises = platformAdmins.map((admin) =>
        this.notificationService.sendPlatformAdminCancellationNotification(
          admin._id,
          subscriptionData
        )
      );

      // Wait for all notifications to be sent
      const [emailResults, inAppResults] = await Promise.allSettled([
        Promise.allSettled(emailPromises),
        Promise.allSettled(inAppPromises),
      ]);

      console.log(
        `✅ [PLATFORM ADMIN] Cancellation notifications sent to ${platformAdmins.length} platform admins`
      );
      console.log(
        `📧 Email results: ${
          emailResults.value?.filter((r) => r.status === "fulfilled").length ||
          0
        } successful`
      );
      console.log(
        `🔔 In-app results: ${
          inAppResults.value?.filter((r) => r.status === "fulfilled").length ||
          0
        } successful`
      );
    } catch (error) {
      console.error(
        "❌ [PLATFORM ADMIN] Error sending cancellation notifications:",
        error
      );
    }
  }

  // Send payment failure notifications to all platform admins
  async notifyPaymentFailure(subscriptionData) {
    try {
      console.log(
        "📧 [PLATFORM ADMIN] Sending payment failure notifications..."
      );

      const platformAdmins =
        await this.notificationService.getPlatformAdminUsers();

      if (platformAdmins.length === 0) {
        console.log("⚠️ [PLATFORM ADMIN] No platform admin users found");
        return;
      }

      // Send email notifications
      const emailPromises = platformAdmins.map((admin) =>
        sendPlatformAdminPaymentFailureEmail(admin.email, subscriptionData)
      );

      // Send in-app notifications
      const inAppPromises = platformAdmins.map((admin) =>
        this.notificationService.sendPlatformAdminPaymentFailureNotification(
          admin._id,
          subscriptionData
        )
      );

      // Wait for all notifications to be sent
      const [emailResults, inAppResults] = await Promise.allSettled([
        Promise.allSettled(emailPromises),
        Promise.allSettled(inAppPromises),
      ]);

      console.log(
        `✅ [PLATFORM ADMIN] Payment failure notifications sent to ${platformAdmins.length} platform admins`
      );
      console.log(
        `📧 Email results: ${
          emailResults.value?.filter((r) => r.status === "fulfilled").length ||
          0
        } successful`
      );
      console.log(
        `🔔 In-app results: ${
          inAppResults.value?.filter((r) => r.status === "fulfilled").length ||
          0
        } successful`
      );
    } catch (error) {
      console.error(
        "❌ [PLATFORM ADMIN] Error sending payment failure notifications:",
        error
      );
    }
  }

  // Send user notification for their own subscription renewal
  async notifyUserRenewal(userId, userEmail, userName, subscriptionData) {
    try {
      console.log("📧 [USER] Sending renewal notification to user...");

      // Send email notification
      const emailResult = await sendUserRenewalEmail(
        userEmail,
        userName,
        subscriptionData
      );

      // Send in-app notification
      const inAppResult =
        await this.notificationService.sendUserRenewalNotification(
          userId,
          subscriptionData
        );

      console.log(`✅ [USER] Renewal notification sent to user: ${userEmail}`);
      console.log(
        `📧 Email result: ${emailResult.success ? "successful" : "failed"}`
      );
      console.log(`🔔 In-app result: ${inAppResult ? "successful" : "failed"}`);
    } catch (error) {
      console.error(
        "❌ [USER] Error sending user renewal notification:",
        error
      );
    }
  }

  // Send user notification for their own subscription cancellation
  async notifyUserCancellation(userId, userEmail, userName, subscriptionData) {
    try {
      console.log("📧 [USER] Sending cancellation notification to user...");

      // Send email notification
      const emailResult = await sendUserCancellationEmail(
        userEmail,
        userName,
        subscriptionData
      );

      // Send in-app notification
      const inAppResult =
        await this.notificationService.sendUserCancellationNotification(
          userId,
          subscriptionData
        );

      console.log(
        `✅ [USER] Cancellation notification sent to user: ${userEmail}`
      );
      console.log(
        `📧 Email result: ${emailResult.success ? "successful" : "failed"}`
      );
      console.log(`🔔 In-app result: ${inAppResult ? "successful" : "failed"}`);
    } catch (error) {
      console.error(
        "❌ [USER] Error sending user cancellation notification:",
        error
      );
    }
  }

  // Send user notification for payment failure
  async notifyUserPaymentFailure(
    userId,
    userEmail,
    userName,
    subscriptionData
  ) {
    try {
      console.log("📧 [USER] Sending payment failure notification to user...");

      // Send email notification
      const emailResult = await sendUserPaymentFailureEmail(
        userEmail,
        userName,
        subscriptionData
      );

      // Send in-app notification
      const inAppResult =
        await this.notificationService.sendUserPaymentFailureNotification(
          userId,
          subscriptionData
        );

      console.log(
        `✅ [USER] Payment failure notification sent to user: ${userEmail}`
      );
      console.log(
        `📧 Email result: ${emailResult.success ? "successful" : "failed"}`
      );
      console.log(`🔔 In-app result: ${inAppResult ? "successful" : "failed"}`);
    } catch (error) {
      console.error(
        "❌ [USER] Error sending user payment failure notification:",
        error
      );
    }
  }
}

export default PlatformAdminNotificationService;
