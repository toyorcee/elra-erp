import mongoose from "mongoose";

const documentTypeSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: [
        "Personal",
        "Employment",
        "Training",
        "Equipment",
        "Legal",
        "Financial",
        "Other",
      ],
      required: true,
    },
    // Whether this document is required
    isRequired: {
      type: Boolean,
      default: true,
    },
    // Whether this document needs verification
    requiresVerification: {
      type: Boolean,
      default: false,
    },
    // Allowed file types
    allowedFileTypes: [
      {
        type: String,
        enum: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "txt"],
      },
    ],
    // Maximum file size in MB
    maxFileSize: {
      type: Number,
      default: 10, // 10MB default
    },
    // Instructions for document submission
    instructions: {
      type: String,
      trim: true,
    },
    // Whether this document type is active
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
documentTypeSchema.index({ department: 1, category: 1 });
documentTypeSchema.index({ role: 1, category: 1 });
documentTypeSchema.index({ isActive: 1 });

// Static method to get document types by department and category
documentTypeSchema.statics.findByDepartmentAndCategory = function (
  departmentId,
  category
) {
  return this.find({
    $or: [
      { department: departmentId },
      { department: null },
    ],
    category,
    isActive: true,
  })
    .populate("department", "name")
    .populate("role", "name");
};

// Static method to get document types by role and category
documentTypeSchema.statics.findByRoleAndCategory = function (roleId, category) {
  return this.find({
    $or: [
      { role: roleId },
      { role: null }, // Global document types
    ],
    category,
    isActive: true,
  })
    .populate("department", "name")
    .populate("role", "name");
};

const DocumentType = mongoose.model("DocumentType", documentTypeSchema);

export default DocumentType;
