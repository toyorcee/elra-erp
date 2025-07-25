import mongoose from "mongoose";

const workflowTemplateSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true,
  },
  documentType: {
    type: String,
    required: true,
    enum: [
      "case_filing",
      "legal_document",
      "administrative",
      "evidence",
      "settlement",
      "general",
    ],
  },
  steps: [
    {
      order: { type: Number, required: true },
      approvalLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApprovalLevel",
        required: true,
      },
      isRequired: { type: Boolean, default: true },
      canSkip: { type: Boolean, default: false },
      autoApprove: { type: Boolean, default: false },
      conditions: {
        amount: { type: Number },
        documentType: [String],
        department: [String],
        priority: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
      },
      actions: [
        {
          type: {
            type: String,
            enum: ["approve", "reject", "route", "notify", "escalate"],
          },
          target: { type: String },
          message: { type: String },
        },
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
workflowTemplateSchema.index({ company: 1, documentType: 1 });
workflowTemplateSchema.index({ company: 1, isActive: 1 });

// Pre-save middleware to update timestamp
workflowTemplateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const WorkflowTemplate = mongoose.model(
  "WorkflowTemplate",
  workflowTemplateSchema
);

export default WorkflowTemplate;
