import mongoose from "mongoose";

const checklistTemplateSchema = new mongoose.Schema(
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
    checklistType: {
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
    // Checklist items
    items: [
      {
        item: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        // Reference to department for department-specific items
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
        isRequired: {
          type: Boolean,
          default: true,
        },
        // Instructions for completing this item
        instructions: {
          type: String,
          trim: true,
        },
        // Order in the checklist
        order: {
          type: Number,
          default: 0,
        },
        // Whether this item is active
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    // Whether this template is active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Created by
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
checklistTemplateSchema.index({ department: 1, checklistType: 1 });
checklistTemplateSchema.index({ role: 1, checklistType: 1 });
checklistTemplateSchema.index({ isActive: 1 });

// Static method to get templates by department and checklist type
checklistTemplateSchema.statics.findByDepartmentAndType = function (
  departmentId,
  checklistType
) {
  return this.find({
    $or: [
      { department: departmentId },
      { department: null }, // Global templates
    ],
    checklistType,
    isActive: true,
  })
    .populate("department", "name")
    .populate("role", "name")
    .populate("items.category", "name");
};

// Static method to get templates by role and checklist type
checklistTemplateSchema.statics.findByRoleAndType = function (
  roleId,
  checklistType
) {
  return this.find({
    $or: [
      { role: roleId },
      { role: null }, // Global templates
    ],
    checklistType,
    isActive: true,
  })
    .populate("department", "name")
    .populate("role", "name")
    .populate("items.category", "name");
};

const ChecklistTemplate = mongoose.model(
  "ChecklistTemplate",
  checklistTemplateSchema
);

export default ChecklistTemplate;
