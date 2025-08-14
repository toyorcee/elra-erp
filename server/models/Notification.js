import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "DOCUMENT_APPROVAL",
        "DOCUMENT_REJECTED",
        "DOCUMENT_SUBMITTED",
        "APPROVAL_OVERDUE",
        "DOCUMENT_SHARED",
        "SYSTEM_ALERT",
        "WORKFLOW_UPDATE",
        "WELCOME",
        "ACCOUNT_ACTIVATED",
        "SUBSCRIPTION_ACTIVE",
        "SUBSCRIPTION_NEW",
        "SUBSCRIPTION_RENEWAL",
        "SUBSCRIPTION_CANCELLATION",
        "PAYMENT_FAILURE",
        "DOCUMENT_UPLOAD_SUCCESS",
        "DOCUMENT_OCR_PROCESSING",
        "DOCUMENT_UPLOAD_DEPARTMENT",
        "DOCUMENT_UPLOAD_PERMISSION",
        "USER_REGISTRATION",
        "MESSAGE_RECEIVED",
        "INVITATION_CREATED",
        "BULK_INVITATION_CREATED",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      actionUrl: String,
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
};

// Static method to find unread notifications
notificationSchema.statics.findUnread = function (userId) {
  return this.find({
    recipient: userId,
    isRead: false,
    isActive: true,
  }).populate("data.documentId", "title reference");
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false,
      isActive: true,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
