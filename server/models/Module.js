import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "DocumentIcon",
    },
    color: {
      type: String,
      default: "#8B5CF6", // Purple
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "view",
          "create",
          "edit",
          "delete",
          "approve",
          "export",
          "import",
          "admin",
        ],
      },
    ],
    departmentAccess: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
moduleSchema.index({ isActive: 1, order: 1 });
moduleSchema.index({ departmentAccess: 1 });

const Module = mongoose.model("Module", moduleSchema);

export default Module;
