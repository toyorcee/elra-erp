import mongoose from "mongoose";

const approvalLevelSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  description: {
    type: String,
    required: true,
  },
  permissions: {
    canApprove: { type: Boolean, default: false },
    canReject: { type: Boolean, default: false },
    canRoute: { type: Boolean, default: false },
    canView: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
  },
  documentTypes: [
    {
      type: String,
      enum: [
        "insurance_policy",
        "claims_document",
        "financial_report",
        "client_correspondence",
        "regulatory_compliance",
        "underwriting_document",
        "general",
      ],
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
approvalLevelSchema.index({ company: 1, level: 1 });
approvalLevelSchema.index({ company: 1, isActive: 1 });

// Pre-save middleware to update timestamp
approvalLevelSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const ApprovalLevel = mongoose.model("ApprovalLevel", approvalLevelSchema);

export default ApprovalLevel;
