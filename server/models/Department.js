import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
      validate: {
        validator: function (v) {
          return /^[A-Z0-9]+$/.test(v);
        },
        message:
          "Department code must contain only uppercase letters and numbers",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    level: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
    },
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    color: {
      type: String,
      default: "#3B82F6", // Default blue color
      validate: {
        validator: function (v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: "Color must be a valid hex color code",
      },
    },
    settings: {
      allowDocumentUpload: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: true,
      },
      maxFileSize: {
        type: Number,
        default: 10, // MB
      },
      allowedFileTypes: [
        {
          type: String,
          enum: [
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "txt",
            "jpg",
            "png",
          ],
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update timestamps
departmentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
departmentSchema.index({ name: 1, isActive: 1 });
departmentSchema.index({ code: 1, isActive: 1 });

// Static method to get all active departments
departmentSchema.statics.getActiveDepartments = function () {
  return this.find({ isActive: true })
    .populate("manager", "name email")
    .sort({ name: 1 });
};

// Static method to get department by code
departmentSchema.statics.getByCode = function (code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

// Static method to get departments by level
departmentSchema.statics.getByLevel = function (level) {
  return this.find({ level: { $lte: level }, isActive: true }).sort({
    name: 1,
  });
};

// Static method to get sub-departments
departmentSchema.statics.getSubDepartments = function (parentId) {
  return this.find({ parentDepartment: parentId, isActive: true }).sort({
    name: 1,
  });
};

// Instance method to check if department can be deleted
departmentSchema.methods.canBeDeleted = async function () {
  const User = mongoose.model("User");
  const Document = mongoose.model("Document");

  // Check if any users belong to this department
  const userCount = await User.countDocuments({ department: this._id });

  // Check if any documents belong to this department
  const documentCount = await Document.countDocuments({ department: this._id });

  return userCount === 0 && documentCount === 0;
};

// Instance method to get department hierarchy
departmentSchema.methods.getHierarchy = async function () {
  const hierarchy = [];
  let currentDept = this;

  while (currentDept) {
    hierarchy.unshift({
      id: currentDept._id,
      name: currentDept.name,
      code: currentDept.code,
    });

    if (currentDept.parentDepartment) {
      currentDept = await this.constructor.findById(
        currentDept.parentDepartment
      );
    } else {
      break;
    }
  }

  return hierarchy;
};

// Instance method to get all users in department
departmentSchema.methods.getUsers = async function () {
  const User = mongoose.model("User");
  return User.find({ department: this._id, isActive: true })
    .populate("role", "name level")
    .sort({ firstName: 1, lastName: 1 });
};

// Instance method to get department statistics
departmentSchema.methods.getStats = async function () {
  const User = mongoose.model("User");
  const Document = mongoose.model("Document");

  const userCount = await User.countDocuments({
    department: this._id,
    isActive: true,
  });
  const documentCount = await Document.countDocuments({
    department: this._id,
    isActive: true,
  });
  const pendingDocuments = await Document.countDocuments({
    department: this._id,
    status: "pending",
    isActive: true,
  });

  return {
    userCount,
    documentCount,
    pendingDocuments,
  };
};

const Department = mongoose.model("Department", departmentSchema);

export default Department;
