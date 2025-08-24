import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    // Basic Document Information
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },

    // Document Type and Category
    documentType: {
      type: String,
      enum: [
        "project_proposal",
        "budget_breakdown",
        "technical_specifications",
        "risk_assessment",
        "timeline_detailed",
        "team_structure",
        "vendor_quotes",
        "legal_review",
        "financial_analysis",
        "contract",
        "invoice",
        "receipt",
        "policy",
        "procedure",
        "report",
        "other",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "project",
        "financial",
        "legal",
        "technical",
        "administrative",
        "other",
      ],
      default: "other",
    },

    // Document Status
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected", "archived"],
      default: "draft",
    },

    // Document Versioning
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [
      {
        version: Number,
        fileUrl: String,
        fileName: String,
        updatedAt: Date,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Document Access and Permissions
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowedDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    allowedRoles: [
      {
        type: String,
        enum: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF", "VIEWER"],
      },
    ],

    // Document Review and Approval
    reviewStatus: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected"],
      default: "pending",
    },
    reviewers: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        comments: {
          type: String,
          trim: true,
        },
        reviewedAt: {
          type: Date,
        },
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Document Tags and Metadata
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    metadata: {
      type: Map,
      of: String,
    },

    // Related Entities
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
documentSchema.index({ documentType: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ project: 1 });
documentSchema.index({ department: 1 });
documentSchema.index({ createdBy: 1 });
documentSchema.index({ "reviewers.reviewer": 1 });

// Virtual for document access URL
documentSchema.virtual("accessUrl").get(function () {
  return this.fileUrl;
});

// Virtual for document size in human readable format
documentSchema.virtual("fileSizeFormatted").get(function () {
  if (this.fileSize < 1024) return `${this.fileSize} B`;
  if (this.fileSize < 1024 * 1024)
    return `${(this.fileSize / 1024).toFixed(1)} KB`;
  if (this.fileSize < 1024 * 1024 * 1024)
    return `${(this.fileSize / (1024 * 1024)).toFixed(1)} MB`;
  return `${(this.fileSize / (1024 * 1024 * 1024)).toFixed(1)} GB`;
});

// Pre-save middleware to handle versioning
documentSchema.pre("save", async function (next) {
  try {
    if (this.isModified("fileUrl") && !this.isNew) {
      // Store previous version
      this.previousVersions.push({
        version: this.version,
        fileUrl: this.fileUrl,
        fileName: this.fileName,
        updatedAt: new Date(),
        updatedBy: this.updatedBy,
      });
      this.version += 1;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get documents by type
documentSchema.statics.getByType = function (documentType) {
  return this.find({ documentType, isActive: true })
    .populate("createdBy", "firstName lastName email")
    .populate("department", "name")
    .sort({ createdAt: -1 });
};

// Static method to get documents by project
documentSchema.statics.getByProject = function (projectId) {
  return this.find({ project: projectId, isActive: true })
    .populate("createdBy", "firstName lastName email")
    .populate("reviewers.reviewer", "firstName lastName email")
    .sort({ createdAt: -1 });
};

// Static method to get documents pending review
documentSchema.statics.getPendingReview = function (reviewerId) {
  return this.find({
    "reviewers.reviewer": reviewerId,
    "reviewers.status": "pending",
    isActive: true,
  })
    .populate("createdBy", "firstName lastName email")
    .populate("project", "name code")
    .sort({ createdAt: -1 });
};

// Instance method to add reviewer
documentSchema.methods.addReviewer = async function (
  reviewerId,
  required = true
) {
  const existingReviewer = this.reviewers.find(
    (r) => r.reviewer.toString() === reviewerId.toString()
  );

  if (!existingReviewer) {
    this.reviewers.push({
      reviewer: reviewerId,
      status: "pending",
      required,
    });
    await this.save();
  }

  return this;
};

// Instance method to approve document
documentSchema.methods.approveDocument = async function (
  reviewerId,
  comments = ""
) {
  const reviewer = this.reviewers.find(
    (r) => r.reviewer.toString() === reviewerId.toString()
  );

  if (!reviewer) {
    throw new Error("Reviewer not found");
  }

  reviewer.status = "approved";
  reviewer.comments = comments;
  reviewer.reviewedAt = new Date();

  // Check if all required reviewers have approved
  const requiredReviewers = this.reviewers.filter((r) => r.required);
  const approvedReviewers = requiredReviewers.filter(
    (r) => r.status === "approved"
  );

  if (approvedReviewers.length === requiredReviewers.length) {
    this.status = "approved";
    this.reviewStatus = "approved";
    this.approvedBy = reviewerId;
    this.approvedAt = new Date();
  } else {
    this.reviewStatus = "in_review";
  }

  await this.save();
  return this;
};

// Instance method to reject document
documentSchema.methods.rejectDocument = async function (
  reviewerId,
  comments = ""
) {
  const reviewer = this.reviewers.find(
    (r) => r.reviewer.toString() === reviewerId.toString()
  );

  if (!reviewer) {
    throw new Error("Reviewer not found");
  }

  reviewer.status = "rejected";
  reviewer.comments = comments;
  reviewer.reviewedAt = new Date();

  this.status = "rejected";
  this.reviewStatus = "rejected";

  await this.save();
  return this;
};

// Instance method to check if user has access
documentSchema.methods.hasAccess = function (user) {
  // Public documents
  if (this.isPublic) return true;

  // Document creator
  if (this.createdBy.toString() === user._id.toString()) return true;

  // Super admin
  if (user.role.level >= 1000) return true;

  // Department access
  if (this.allowedDepartments.length > 0) {
    const hasDepartmentAccess = this.allowedDepartments.some(
      (dept) => dept.toString() === user.department?._id.toString()
    );
    if (!hasDepartmentAccess) return false;
  }

  // Role access
  if (this.allowedRoles.length > 0) {
    const hasRoleAccess = this.allowedRoles.includes(user.role.name);
    if (!hasRoleAccess) return false;
  }

  return true;
};

const Document = mongoose.model("Document", documentSchema);

export default Document;
