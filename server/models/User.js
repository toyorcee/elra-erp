import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    passwordChangedAt: {
      type: Date,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    department: {
      type: String,
      enum: [
        "Finance",
        "HR",
        "Legal",
        "IT",
        "Operations",
        "Marketing",
        "Sales",
        "Executive",
        "External",
      ],
      required: true,
    },
    position: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subordinates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    permissions: [
      {
        type: String,
        enum: [
          // Document permissions
          "document.upload",
          "document.view",
          "document.edit",
          "document.delete",
          "document.approve",
          "document.reject",
          "document.share",
          "document.export",
          "document.archive",

          // User management permissions
          "user.create",
          "user.view",
          "user.edit",
          "user.delete",
          "user.assign_role",
          "user.view_permissions",

          // Workflow permissions
          "workflow.create",
          "workflow.start",
          "workflow.approve",
          "workflow.reject",
          "workflow.delegate",
          "workflow.view",

          // System permissions
          "system.settings",
          "system.reports",
          "system.audit",
          "system.backup",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastIpAddress: {
      type: String,
    },
    lastUserAgent: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    // Nigerian-specific fields
    nin: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          return /^\d{11}$/.test(v);
        },
        message: "NIN must be 11 digits",
      },
    },
    bvn: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          return /^\d{11}$/.test(v);
        },
        message: "BVN must be 11 digits",
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    this.passwordChangedAt = Date.now() - 1000;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check permission
userSchema.methods.hasPermission = function (permission) {
  // Check user-specific permissions first
  if (this.permissions && this.permissions.includes(permission)) {
    return true;
  }

  // Check role permissions (will be populated)
  if (
    this.role &&
    this.role.permissions &&
    this.role.permissions.includes(permission)
  ) {
    return true;
  }

  return false;
};

// Instance method to get effective permissions
userSchema.methods.getEffectivePermissions = function () {
  const permissions = new Set();

  // Add user-specific permissions
  if (this.permissions) {
    this.permissions.forEach((p) => permissions.add(p));
  }

  // Add role permissions
  if (this.role && this.role.permissions) {
    this.role.permissions.forEach((p) => permissions.add(p));
  }

  return Array.from(permissions);
};

// Instance method to check if can manage another user
userSchema.methods.canManageUser = function (targetUser) {
  // Super admin can manage anyone
  if (this.role.level >= 100) return true;

  // Users can't manage users with higher or equal role levels
  if (targetUser.role.level >= this.role.level) return false;

  // Check if target user is in same department or user has cross-department permissions
  if (
    this.department === targetUser.department ||
    this.hasPermission("user.assign_role")
  ) {
    return true;
  }

  return false;
};

// Instance method to get manageable users
userSchema.methods.getManageableUsers = async function () {
  const User = mongoose.model("User");

  return await User.find({
    "role.level": { $lt: this.role.level },
    isActive: true,
  }).populate("role");
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find by employee ID
userSchema.statics.findByEmployeeId = function (employeeId) {
  return this.findOne({ employeeId, isActive: true });
};

// Static method to get users by department
userSchema.statics.findByDepartment = function (department) {
  return this.find({ department, isActive: true }).populate("role");
};

// Static method to get users by role level
userSchema.statics.findByRoleLevel = function (level) {
  return this.find({ "role.level": level, isActive: true }).populate("role");
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return this.name;
});

// Virtual for role level
userSchema.virtual("roleLevel").get(function () {
  return this.role ? this.role.level : 0;
});

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Ensure virtuals are included in JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;
