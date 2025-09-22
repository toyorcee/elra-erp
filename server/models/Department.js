import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
      trim: true,
      maxlength: 100,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    code: {
      type: String,
      required: false,
      unique: false,
      trim: true,
      uppercase: true,
      maxlength: 10,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty/null values
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
      required: true,
      unique: true,
      min: 1,
      max: 100,
      validate: {
        validator: function (v) {
          return v >= 1 && v <= 100;
        },
        message: "Department level must be between 1 and 100",
      },
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
      required: false, // Made optional for self-service creation
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update timestamps and auto-add to module access
departmentSchema.pre("save", async function (next) {
  this.updatedAt = new Date();

  // If this is a new department, add it to relevant modules' departmentAccess
  if (this.isNew) {
    try {
      console.log(
        `🔧 [Department] New department created: ${this.name}, auto-adding to module access...`
      );

      const Module = mongoose.model("Module");

      const universalModules = await Module.find({
        code: {
          $in: ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS", "COMMUNICATION"],
        },
        isActive: true,
      });

      for (const module of universalModules) {
        // Check if department is already in the access list
        const hasAccess = module.departmentAccess?.some(
          (deptId) => deptId.toString() === this._id.toString()
        );

        if (!hasAccess) {
          if (!module.departmentAccess) {
            module.departmentAccess = [];
          }

          module.departmentAccess.push(this._id);
          module.markModified("departmentAccess");
          await module.save();

          console.log(
            `   ✅ Added ${this.name} to ${module.name} (${module.code}) department access`
          );
        }
      }

      console.log(
        `✅ [Department] Auto-module access setup completed for ${this.name}`
      );
    } catch (error) {
      console.error(
        `❌ [Department] Error setting up auto-module access for ${this.name}:`,
        error.message
      );
      // Don't fail the department creation if module access setup fails
    }
  }

  next();
});

// Index for better query performance
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ level: 1 }, { unique: true });

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
