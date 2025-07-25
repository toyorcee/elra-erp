import mongoose from "mongoose";

const documentWorkflowSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  workflowTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkflowTemplate",
    required: true,
  },
  currentStep: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  steps: [
    {
      stepNumber: { type: Number, required: true },
      approvalLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApprovalLevel",
        required: true,
      },
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "skipped"],
        default: "pending",
      },
      comments: { type: String },
      actionDate: { type: Date },
      actionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  history: [
    {
      action: { type: String, required: true },
      fromStep: { type: Number },
      toStep: { type: Number },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      performedAt: { type: Date, default: Date.now },
      comments: { type: String },
      metadata: { type: mongoose.Schema.Types.Mixed },
    },
  ],
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
documentWorkflowSchema.index({ document: 1 });
documentWorkflowSchema.index({ status: 1 });
documentWorkflowSchema.index({ "steps.assignedTo": 1 });

// Pre-save middleware to update timestamp
documentWorkflowSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const DocumentWorkflow = mongoose.model(
  "DocumentWorkflow",
  documentWorkflowSchema
);

export default DocumentWorkflow;
