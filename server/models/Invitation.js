import mongoose from "mongoose";
import crypto from "crypto";

const invitationSchema = new mongoose.Schema(
  {
    // Invitation code
    code: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(8).toString("hex").toUpperCase(),
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // Role assignment
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    // Invitation details
    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      type: String,
      trim: true,
    },

    // Enhanced fields for onboarding
    jobTitle: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    employeeId: {
      type: String,
      trim: true,
    },

    // Bulk processing fields
    batchId: {
      type: String,
      trim: true,
    },

    batchName: {
      type: String,
      trim: true,
    },

    csvRowNumber: {
      type: Number,
    },

    // Invitation status
    status: {
      type: String,
      enum: [
        "active",
        "used",
        "expired",
        "cancelled",
        "sent",
        "failed",
        "pending_approval",
      ],
      default: "active",
    },

    // Approval workflow fields
    requiresApproval: {
      type: Boolean,
      default: false,
    },

    approvalLevel: {
      type: Number,
      default: 0,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    // Email tracking
    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
    },

    emailError: {
      type: String,
      trim: true,
    },

    // Expiration
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },

    // Usage tracking
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    usedAt: {
      type: Date,
    },

    // Onboarding completion tracking
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    onboardingCompletedAt: {
      type: Date,
    },

    // Created by (superadmin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Additional notes
    notes: {
      type: String,
      trim: true,
    },

    // For pending users
    isPendingUser: {
      type: Boolean,
      default: false,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ code: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ batchId: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

invitationSchema.pre("save", function (next) {
  if (this.isModified("expiresAt") && this.expiresAt < new Date()) {
    this.status = "expired";
  }
  next();
});

// Static method to generate invitation code
invitationSchema.statics.generateCode = function () {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
};

// Static method to generate batch ID
invitationSchema.statics.generateBatchId = function () {
  return `BATCH_${Date.now()}_${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
};

// Static method to generate sequential batch number
invitationSchema.statics.generateSequentialBatchNumber = async function () {
  try {
    const lastInvitation = await this.findOne({
      batchId: { $exists: true, $ne: null },
    }).sort({ batchId: -1 });

    let nextNumber = 1;

    if (lastInvitation && lastInvitation.batchId) {
      const match = lastInvitation.batchId.match(/BATCH(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      } else {
        const timestampMatch = lastInvitation.batchId.match(/BATCH(\d+)_/);
        if (timestampMatch) {
          nextNumber = 1;
        }
      }
    }

    return `BATCH${nextNumber.toString().padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating sequential batch number:", error);
    return `BATCH${Date.now()}_${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;
  }
};

// Instance method to check if invitation is valid
invitationSchema.methods.isValid = function () {
  return this.status === "active" && this.expiresAt > new Date();
};

// Instance method to mark as used
invitationSchema.methods.markAsUsed = function (userId) {
  this.status = "used";
  this.usedBy = userId;
  this.usedAt = new Date();
  return this.save();
};

// Instance method to mark email as sent
invitationSchema.methods.markEmailSent = function () {
  this.emailSent = true;
  this.emailSentAt = new Date();
  return this.save();
};

// Instance method to mark email as failed
invitationSchema.methods.markEmailFailed = function (error) {
  this.emailSent = false;
  this.emailError = error;
  return this.save();
};

// Instance method to mark onboarding as completed
invitationSchema.methods.markOnboardingCompleted = function () {
  this.onboardingCompleted = true;
  this.onboardingCompletedAt = new Date();
  return this.save();
};

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
