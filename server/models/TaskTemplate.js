import mongoose from "mongoose";

const taskTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    taskType: {
      type: String,
      enum: [
        "Onboarding",
        "Offboarding",
        "Training",
        "Documentation",
        "Equipment",
        "Orientation",
        "Custom",
      ],
      required: true,
    },
    defaultPriority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    defaultDueDateOffset: {
      type: Number,
      default: 7,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    customFields: [
      {
        name: { type: String, trim: true },
        type: {
          type: String,
          enum: ["text", "number", "date", "boolean", "select"],
        },
        required: { type: Boolean, default: false },
        options: [{ type: String }],
        defaultValue: mongoose.Schema.Types.Mixed,
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
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
taskTemplateSchema.index({ department: 1, taskType: 1 });
taskTemplateSchema.index({ role: 1, taskType: 1 });
taskTemplateSchema.index({ isActive: 1 });

// Static method to get templates by department and task type
taskTemplateSchema.statics.findByDepartmentAndType = function (
  departmentId,
  taskType
) {
  return this.find({
    $or: [
      { department: departmentId },
      { department: null }, // Global templates
    ],
    taskType,
    isActive: true,
  })
    .populate("department", "name")
    .populate("role", "name");
};

// Static method to get templates by role and task type
taskTemplateSchema.statics.findByRoleAndType = function (roleId, taskType) {
  return this.find({
    $or: [
      { role: roleId },
      { role: null }, // Global templates
    ],
    taskType,
    isActive: true,
  })
    .populate("department", "name")
    .populate("role", "name");
};

const TaskTemplate = mongoose.model("TaskTemplate", taskTemplateSchema);

export default TaskTemplate;
