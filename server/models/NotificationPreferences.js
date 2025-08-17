import mongoose from "mongoose";

const notificationPreferencesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Email notification preferences
    email: {
      enabled: {
        type: Boolean,
        default: true,
      },
      types: {
        DOCUMENT_APPROVAL: { type: Boolean, default: true },
        DOCUMENT_REJECTED: { type: Boolean, default: true },
        DOCUMENT_SUBMITTED: { type: Boolean, default: true },
        APPROVAL_OVERDUE: { type: Boolean, default: true },
        DOCUMENT_SHARED: { type: Boolean, default: true },
        SYSTEM_ALERT: { type: Boolean, default: true },
        WORKFLOW_UPDATE: { type: Boolean, default: true },
        WELCOME: { type: Boolean, default: true },
        ACCOUNT_ACTIVATED: { type: Boolean, default: true },
        SUBSCRIPTION_ACTIVE: { type: Boolean, default: true },
        DEDUCTION_CREATED: { type: Boolean, default: true },
        DEDUCTION_UPDATED: { type: Boolean, default: true },
        DEDUCTION_DELETED: { type: Boolean, default: true },
        DEDUCTION_ACTIVATED: { type: Boolean, default: true },
        DEDUCTION_DEACTIVATED: { type: Boolean, default: true },
        BONUS_CREATED: { type: Boolean, default: true },
      },
    },
    // In-app notification preferences
    inApp: {
      enabled: {
        type: Boolean,
        default: true,
      },
      types: {
        DOCUMENT_APPROVAL: { type: Boolean, default: true },
        DOCUMENT_REJECTED: { type: Boolean, default: true },
        DOCUMENT_SUBMITTED: { type: Boolean, default: true },
        APPROVAL_OVERDUE: { type: Boolean, default: true },
        DOCUMENT_SHARED: { type: Boolean, default: true },
        SYSTEM_ALERT: { type: Boolean, default: true },
        WORKFLOW_UPDATE: { type: Boolean, default: true },
        WELCOME: { type: Boolean, default: true },
        ACCOUNT_ACTIVATED: { type: Boolean, default: true },
        SUBSCRIPTION_ACTIVE: { type: Boolean, default: true },
        DEDUCTION_CREATED: { type: Boolean, default: true },
        DEDUCTION_UPDATED: { type: Boolean, default: true },
        DEDUCTION_DELETED: { type: Boolean, default: true },
        DEDUCTION_ACTIVATED: { type: Boolean, default: true },
        DEDUCTION_DEACTIVATED: { type: Boolean, default: true },
        BONUS_CREATED: { type: Boolean, default: true },
      },
    },
    // Push notification preferences (for future mobile app)
    push: {
      enabled: {
        type: Boolean,
        default: false,
      },
      types: {
        DOCUMENT_APPROVAL: { type: Boolean, default: true },
        DOCUMENT_REJECTED: { type: Boolean, default: true },
        DOCUMENT_SUBMITTED: { type: Boolean, default: true },
        APPROVAL_OVERDUE: { type: Boolean, default: true },
        DOCUMENT_SHARED: { type: Boolean, default: true },
        SYSTEM_ALERT: { type: Boolean, default: true },
        WORKFLOW_UPDATE: { type: Boolean, default: true },
        WELCOME: { type: Boolean, default: true },
        ACCOUNT_ACTIVATED: { type: Boolean, default: true },
        SUBSCRIPTION_ACTIVE: { type: Boolean, default: true },
        DEDUCTION_CREATED: { type: Boolean, default: true },
        DEDUCTION_UPDATED: { type: Boolean, default: true },
        DEDUCTION_DELETED: { type: Boolean, default: true },
        DEDUCTION_ACTIVATED: { type: Boolean, default: true },
        DEDUCTION_DEACTIVATED: { type: Boolean, default: true },
        BONUS_CREATED: { type: Boolean, default: true },
      },
    },
    // General preferences
    quietHours: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startTime: {
        type: String,
        default: "22:00",
      },
      endTime: {
        type: String,
        default: "08:00",
      },
      timezone: {
        type: String,
        default: "Africa/Lagos",
      },
    },
    // Priority level preferences
    priorityLevels: {
      low: { type: Boolean, default: true },
      medium: { type: Boolean, default: true },
      high: { type: Boolean, default: true },
      urgent: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Note: user field already has unique: true which creates an index automatically

// Static method to get or create preferences for a user
notificationPreferencesSchema.statics.getOrCreate = async function (userId) {
  let preferences = await this.findOne({ user: userId });

  if (!preferences) {
    preferences = new this({ user: userId });
    await preferences.save();
  }

  return preferences;
};

// Instance method to check if a notification type is enabled
notificationPreferencesSchema.methods.isNotificationEnabled = function (
  type,
  channel = "inApp"
) {
  if (!this[channel]?.enabled) return false;
  return this[channel]?.types?.[type] ?? true;
};

// Instance method to check if quiet hours are active
notificationPreferencesSchema.methods.isQuietHoursActive = function () {
  if (!this.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.toLocaleTimeString("en-US", {
    hour12: false,
    timeZone: this.quietHours.timezone,
  });

  const start = this.quietHours.startTime;
  const end = this.quietHours.endTime;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  } else {
    return currentTime >= start && currentTime <= end;
  }
};

const NotificationPreferences = mongoose.model(
  "NotificationPreferences",
  notificationPreferencesSchema
);

export default NotificationPreferences;
