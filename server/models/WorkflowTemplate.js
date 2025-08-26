import mongoose from "mongoose";

const workflowTemplateSchema = new mongoose.Schema({
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
      "project_workflow",
      "regulatory_compliance",
      "equipment_lease_registration",
      "vehicle_lease_registration",
      "financial_lease_registration",
      "software_development_registration",
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
        projectCategory: { type: String },
        minBudget: { type: Number },
        maxBudget: { type: Number },
        departments: [String],
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
workflowTemplateSchema.index({ documentType: 1 });
workflowTemplateSchema.index({ isActive: 1 });

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
