import mongoose from "mongoose";
import documentClassifications, {
  categories,
  documentTypes,
  documentStatuses,
  priorityLevels,
} from "../constants/documentClassifications.js";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
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
    documentType: {
      type: String,
      enum: documentTypes,
      required: true,
      validate: {
        validator: function (value) {
          return documentClassifications[this.category]?.includes(value);
        },
        message: function (props) {
          return `Document type '${props.value}' is not valid for category '${this.category}'.`;
        },
      },
    },
    category: {
      type: String,
      enum: categories,
      required: true,
    },
    priority: {
      type: String,
      enum: priorityLevels.map((p) => p.value),
      default: "Medium",
    },
    status: {
      type: String,
      enum: documentStatuses.map((s) => s.value),
      default: "DRAFT",
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
      enum: [
        "Finance",
        "HR",
        "Legal",
        "IT",
        "Operations",
        "Marketing",
        "Sales",
        "Executive",
        "External",
      ],
      required: false,
    },
    // Workflow tracking
    currentApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalChain: [
      {
        level: {
          type: Number,
          required: true,
        },
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "REJECTED", "DELEGATED"],
          default: "PENDING",
        },
        comments: String,
        actionDate: Date,
        deadline: Date,
      },
    ],
    // Document metadata
    tags: [String],
    keywords: [String],
    expiryDate: Date,
    isConfidential: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [
      {
        version: Number,
        filename: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: Date,
      },
    ],
    // Access control
    permissions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permission: {
          type: String,
          enum: ["view", "edit", "approve", "delete", "share"],
        },
        grantedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        grantedAt: Date,
      },
    ],
    // Audit trail
    auditTrail: [
      {
        action: {
          type: String,
          enum: [
            "UPLOADED",
            "VIEWED",
            "EDITED",
            "APPROVED",
            "REJECTED",
            "SHARED",
            "ARCHIVED",
            "DELETED",
          ],
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: String,
        ipAddress: String,
      },
    ],
    // Nigerian-specific fields
    organization: {
      type: String,
      trim: true,
    },
    regulatoryCompliance: [
      {
        regulation: String,
        complianceStatus: {
          type: String,
          enum: ["COMPLIANT", "NON_COMPLIANT", "PENDING_REVIEW"],
        },
        reviewDate: Date,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },

    ocrData: {
      extractedText: {
        type: String,
        default: "",
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      documentType: {
        type: String,
        default: "",
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
      dateReferences: [
        {
          type: String,
          trim: true,
        },
      ],
      organizationReferences: [
        {
          type: String,
          trim: true,
        },
      ],
      monetaryValues: [
        {
          type: String,
          trim: true,
        },
      ],
      ocrLanguage: {
        type: String,
        default: "eng",
      },
    },

    // Scanning and archiving metadata
    scanMetadata: {
      scannerId: String,
      resolution: Number,
      format: String,
      scanDate: Date,
      originalDocumentDate: Date,
      archiveLocation: String,
      boxNumber: Number,
      folderNumber: Number,
      archiveReference: String,
      physicalLocation: String,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate reference
documentSchema.pre("save", function (next) {
  if (this.isNew && !this.reference) {
    this.reference = this.generateReference();
  }
  next();
});

// Instance method to generate document reference
documentSchema.methods.generateReference = function () {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const prefix = this.category.substring(0, 3).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Instance method to add to audit trail
documentSchema.methods.addAuditEntry = function (
  action,
  userId,
  details = "",
  ipAddress = ""
) {
  this.auditTrail.push({
    action,
    userId,
    details,
    ipAddress,
    timestamp: new Date(),
  });
};

// Instance method to check if user can access document
documentSchema.methods.canAccess = function (user) {
  // Document owner can always access
  if (this.uploadedBy.equals(user._id)) return true;

  // Check specific permissions
  const userPermission = this.permissions.find((p) =>
    p.userId.equals(user._id)
  );
  if (userPermission) return true;

  // Check role-based access
  if (user.role.level >= 80) return true; // Manager and above

  // Check department access
  if (user.department === this.department) {
    if (user.role.level >= 50) return true; // Staff and above
  }

  return false;
};

// Instance method to get next approver
documentSchema.methods.getNextApprover = function () {
  const pendingApproval = this.approvalChain.find(
    (approval) => approval.status === "PENDING"
  );

  if (pendingApproval) {
    return pendingApproval.approver;
  }

  return null;
};

// Instance method to approve document
documentSchema.methods.approve = function (userId, comments = "") {
  const pendingApproval = this.approvalChain.find(
    (approval) => approval.status === "PENDING"
  );

  if (pendingApproval) {
    pendingApproval.status = "APPROVED";
    pendingApproval.comments = comments;
    pendingApproval.actionDate = new Date();

    // Check if this was the final approval
    const remainingApprovals = this.approvalChain.filter(
      (approval) => approval.status === "PENDING"
    );

    if (remainingApprovals.length === 0) {
      this.status = "APPROVED";
    }

    this.addAuditEntry("APPROVED", userId, comments);
  }
};

// Instance method to reject document
documentSchema.methods.reject = function (userId, comments = "") {
  const pendingApproval = this.approvalChain.find(
    (approval) => approval.status === "PENDING"
  );

  if (pendingApproval) {
    pendingApproval.status = "REJECTED";
    pendingApproval.comments = comments;
    pendingApproval.actionDate = new Date();
    this.status = "REJECTED";

    this.addAuditEntry("REJECTED", userId, comments);
  }
};

// Static method to find documents by status
documentSchema.statics.findByStatus = function (status) {
  return this.find({ status, isActive: true }).populate(
    "uploadedBy currentApprover"
  );
};

// Static method to find documents by category
documentSchema.statics.findByCategory = function (category) {
  return this.find({ category, isActive: true }).populate(
    "uploadedBy currentApprover"
  );
};

// Static method to find documents by department
documentSchema.statics.findByDepartment = function (department) {
  return this.find({ department, isActive: true }).populate(
    "uploadedBy currentApprover"
  );
};

// Static method to find documents pending approval
documentSchema.statics.findPendingApproval = function () {
  return this.find({
    status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
    isActive: true,
  }).populate("uploadedBy currentApprover");
};

// Index for better search performance
documentSchema.index({ title: "text", description: "text", tags: "text" });
documentSchema.index({ status: 1, category: 1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
