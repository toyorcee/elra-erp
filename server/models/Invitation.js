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

    // Company this invitation belongs to
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Department assignment
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

    // Invitation status
    status: {
      type: String,
      enum: ["active", "used", "expired", "cancelled"],
      default: "active",
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
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
invitationSchema.index({ code: 1 });
invitationSchema.index({ company: 1, status: 1 });
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to check expiration
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

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
