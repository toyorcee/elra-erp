import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // Company for data isolation
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // User who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User details for quick access (denormalized)
    userDetails: {
      name: String,
      email: String,
      role: String,
      department: String,
    },

    // Action details
    action: {
      type: String,
      enum: [
        // Document actions
        "DOCUMENT_CREATED",
        "DOCUMENT_UPDATED",
        "DOCUMENT_DELETED",
        "DOCUMENT_VIEWED",
        "DOCUMENT_DOWNLOADED",
        "DOCUMENT_APPROVED",
        "DOCUMENT_REJECTED",
        "DOCUMENT_ARCHIVED",
        "DOCUMENT_RESTORED",
        "DOCUMENT_SHARED",

        // User actions
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_CREATED",
        "USER_UPDATED",
        "USER_DELETED",
        "USER_ROLE_CHANGED",
        "USER_DEPARTMENT_CHANGED",
        "USER_PASSWORD_CHANGED",
        "INVITATION_CREATED",
        "INVITATION_RESENT",
        "INVITATION_USED",
        "INVITATION_CANCELLED",
        "DOCUMENT_UPLOADED",

        // System actions
        "SETTINGS_UPDATED",
        "DEPARTMENT_CREATED",
        "DEPARTMENT_UPDATED",
        "DEPARTMENT_DELETED",
        "SYSTEM_MAINTENANCE",

        // Security actions
        "LOGIN_ATTEMPT",
        "PERMISSION_DENIED",
        "SUSPICIOUS_ACTIVITY",
      ],
      required: true,
    },

    // Resource being acted upon
    resourceType: {
      type: String,
      required: true,
      enum: ["DOCUMENT", "USER", "DEPARTMENT", "SYSTEM", "AUTH"],
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "resourceModel",
    },

    resourceModel: {
      type: String,
      enum: ["Document", "User", "Department", "SystemSettings"],
    },

    // Resource details for quick access (denormalized)
    resourceDetails: {
      title: String, // For documents
      name: String, // For users/departments
      type: String, // Document type, user role, etc.
    },

    // Action details
    details: {
      // For document actions
      documentTitle: String,
      documentType: String,
      category: String,
      priority: String,
      status: String,
      fileSize: Number,
      fileName: String,

      // For approval actions
      approvalComment: String,
      approvalReason: String,
      previousStatus: String,
      newStatus: String,

      // For user actions
      oldRole: String,
      newRole: String,
      oldDepartment: String,
      newDepartment: String,

      // For system actions
      settingName: String,
      oldValue: String,
      newValue: String,

      // For security actions
      ipAddress: String,
      userAgent: String,
      location: String,
      attemptCount: Number,

      // Generic
      description: String,
      metadata: mongoose.Schema.Types.Mixed,
    },

    // IP and location tracking
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      region: String,
    },

    // Timestamps
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Session info
    sessionId: String,

    // Risk level for security monitoring
    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },

    // For compliance and retention
    retentionPeriod: {
      type: Number, // Days to keep this log
      default: 2555, // 7 years default
    },

    // Soft delete for compliance
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Indexes for performance
    indexes: [
      { userId: 1, timestamp: -1 },
      { action: 1, timestamp: -1 },
      { resourceType: 1, resourceId: 1, timestamp: -1 },
      { "userDetails.role": 1, timestamp: -1 },
      { "details.status": 1, timestamp: -1 },
      { riskLevel: 1, timestamp: -1 },
      { timestamp: -1 }, // For time-based queries
    ],
  }
);

// Pre-save middleware to populate user details
auditLogSchema.pre("save", async function (next) {
  if (this.isNew && this.userId) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.userId).select(
        "firstName lastName email role department"
      );

      if (user) {
        this.userDetails = {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          department: user.department?.code || "N/A",
        };
      }
    } catch (error) {
      console.error("Error populating user details in audit log:", error);
    }
  }
  next();
});

// Static method to create audit log
auditLogSchema.statics.log = async function (data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error("Error creating audit log:", error);
    throw error;
  }
};

// Method to get recent activity
auditLogSchema.statics.getRecentActivity = async function (options = {}) {
  const {
    limit = 50,
    userId,
    resourceType,
    action,
    startDate,
    endDate,
    riskLevel,
    department,
    companyFilter = {},
  } = options;

  const query = { isDeleted: false, ...companyFilter };

  if (userId) query.userId = userId;
  if (resourceType) query.resourceType = resourceType;
  if (action) query.action = action;
  if (riskLevel) query.riskLevel = riskLevel;

  // Add department filter if provided
  if (department) {
    // Only show activities from users in the same department
    // If user has no department (N/A), don't show any activities
    if (department !== "N/A") {
      query["userDetails.department"] = department;
    } else {
      // If the logged-in user has no department, don't show any activities
      query["userDetails.department"] = "NONEXISTENT_DEPARTMENT";
    }
  }

  // If userId is provided, filter by the specific user (show only their activities)
  if (userId) {
    query.userId = userId;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "firstName lastName email")
    .populate("resourceId");
};

// Method to get audit trail for a specific resource
auditLogSchema.statics.getAuditTrail = async function (
  resourceType,
  resourceId,
  companyFilter = {}
) {
  return this.find({
    resourceType,
    resourceId,
    isDeleted: false,
    ...companyFilter,
  })
    .sort({ timestamp: -1 })
    .populate("userId", "firstName lastName email role");
};

// Method to get user activity summary
auditLogSchema.statics.getUserActivitySummary = async function (
  userId,
  days = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        lastActivity: { $max: "$timestamp" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
