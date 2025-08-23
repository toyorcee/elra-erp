import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema(
  {
    // Basic approval info
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Approval type and context
    type: {
      type: String,
      required: true,
      enum: [
        "lease_application",
        "credit_risk_assessment",
        "asset_acquisition",
        "client_onboarding",
        "contract_modification",
        "budget_allocation",
        "project_creation",
        "team_assignment",
      ],
    },

    // What's being approved
    entityType: {
      type: String,
      required: true,
      enum: ["project", "budget", "team", "procurement", "inventory"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityModel",
    },
    entityModel: {
      type: String,
      required: true,
      enum: ["Project", "Budget", "TeamMember", "Procurement", "Inventory"],
    },

    // Approval workflow
    status: {
      type: String,
      required: true,
      enum: ["pending", "under_review", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    // Priority levels for Nigerian government context
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent", "critical"],
      default: "medium",
    },

    // Department and ministry context
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // Requestor (who submitted for approval)
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Approval chain (Nigerian government hierarchy)
    approvalChain: [
      {
        level: {
          type: Number,
          required: true,
          min: 1,
        },
        role: {
          type: String,
          required: true,
          enum: [
            "DEPARTMENT_MANAGER",
            "DEPARTMENT_APPROVER",
            "EXECUTIVE_APPROVER",
          ],
        },
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        comments: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        approvedAt: Date,
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Current approval level
    currentLevel: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Approval details
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Nigerian government specific fields
    ministryReference: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    budgetYear: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{4}$/.test(v);
        },
        message: "Budget year must be a 4-digit year",
      },
    },

    // Financial context
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: "NGN",
      enum: ["NGN", "USD", "EUR", "GBP"],
    },

    // Timeline
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },

    // Attachments and documents
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Comments and notes
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isInternal: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Status tracking
    isActive: {
      type: Boolean,
      default: true,
    },

    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
approvalSchema.index({ status: 1, type: 1 });
approvalSchema.index({ entityType: 1, entityId: 1 });
approvalSchema.index({ requestedBy: 1, status: 1 });
approvalSchema.index({ department: 1, status: 1 });
approvalSchema.index({ dueDate: 1, status: 1 });
approvalSchema.index({ priority: 1, status: 1 });

// Virtual for approval progress
approvalSchema.virtual("progress").get(function () {
  if (!this.approvalChain || this.approvalChain.length === 0) return 0;

  const approvedLevels = this.approvalChain.filter(
    (level) => level.status === "approved"
  ).length;
  const totalLevels = this.approvalChain.length;

  return Math.round((approvedLevels / totalLevels) * 100);
});

// Virtual for isOverdue
approvalSchema.virtual("isOverdue").get(function () {
  return this.dueDate && new Date() > this.dueDate && this.status === "pending";
});

// Virtual for nextApprover
approvalSchema.virtual("nextApprover").get(function () {
  if (!this.approvalChain) return null;

  const currentApproval = this.approvalChain.find(
    (level) => level.level === this.currentLevel
  );
  return currentApproval ? currentApproval.approver : null;
});

// Static methods
approvalSchema.statics.findByEntity = function (entityType, entityId) {
  return this.find({ entityType, entityId }).sort({ createdAt: -1 });
};

approvalSchema.statics.findPendingByUser = function (userId) {
  return this.find({
    "approvalChain.approver": userId,
    "approvalChain.status": "pending",
    status: { $in: ["pending", "under_review"] },
    isActive: true,
  }).sort({ priority: -1, dueDate: 1 });
};

approvalSchema.statics.findByDepartment = function (
  departmentId,
  status = null
) {
  const query = { department: departmentId, isActive: true };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

// Instance methods
approvalSchema.methods.approve = async function (approverId, comments = "") {
  const currentApproval = this.approvalChain.find(
    (level) => level.level === this.currentLevel
  );

  if (!currentApproval) {
    throw new Error("No current approval level found");
  }

  // Update current level
  currentApproval.status = "approved";
  currentApproval.approver = approverId;
  currentApproval.approvedAt = new Date();
  currentApproval.comments = comments;

  // Check if this was the final approval
  const nextLevel = this.approvalChain.find(
    (level) => level.level === this.currentLevel + 1
  );

  if (!nextLevel) {
    // Final approval
    this.status = "approved";
    this.approvedBy = approverId;
    this.approvedAt = new Date();
  } else {
    // Move to next level
    this.currentLevel += 1;
    this.status = "under_review";
  }

  return this.save();
};

approvalSchema.methods.reject = async function (rejectorId, reason) {
  const currentApproval = this.approvalChain.find(
    (level) => level.level === this.currentLevel
  );

  if (!currentApproval) {
    throw new Error("No current approval level found");
  }

  // Update current level
  currentApproval.status = "rejected";
  currentApproval.approver = rejectorId;
  currentApproval.approvedAt = new Date();
  currentApproval.comments = reason;

  // Reject the entire approval
  this.status = "rejected";
  this.rejectedBy = rejectorId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;

  return this.save();
};

approvalSchema.methods.addComment = async function (
  userId,
  content,
  isInternal = false
) {
  this.comments.push({
    user: userId,
    content,
    isInternal,
  });

  return this.save();
};

// Pre-save middleware
approvalSchema.pre("save", function (next) {
  // Auto-generate ministry reference if not provided
  if (!this.ministryReference) {
    const year = new Date().getFullYear();
    const type = this.type.toUpperCase().replace("_", "");
    this.ministryReference = `MIN/${year}/${type}/${this._id
      .toString()
      .slice(-6)
      .toUpperCase()}`;
  }

  next();
});

const Approval = mongoose.model("Approval", approvalSchema);

export default Approval;
