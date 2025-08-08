import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: [
        // Legacy roles (maintained for backward compatibility)
        "PLATFORM_ADMIN",
        "SUPER_ADMIN",
        "ADMIN",
        "MANAGER",
        "SUPERVISOR",
        "SENIOR_STAFF",
        "STAFF",
        "JUNIOR_STAFF",
        "EXTERNAL_USER",
        "GUEST",
        "READ_ONLY",
        // New ERP roles
        "COMPANY_ADMIN",
        "HOD",
        "HOD", // Head of Department
        "HR_MANAGER",
        "PAYROLL_MANAGER",
        "PROCUREMENT_MANAGER",
        "FINANCE_MANAGER",
        "VIEWER",
      ],
    },
    level: {
      type: Number,
      required: true,
      unique: true,
      min: 10,
      max: 1000,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: String,
<<<<<<< HEAD
=======
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
          "document.scan",

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

          "company.create",
          "company.view",
          "company.edit",
          "company.delete",
        ],
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
      },
    ],
    departmentAccess: [
      {
        type: String,
        enum: [
          "Finance",
          "HR",
          "Legal",
          "IT",
          "Operations",
          "Marketing",
          "Sales",
          "Procurement",
          "Payroll",
          "Accounts",
          "Communication",
          "All",
        ],
      },
    ],
    canManageRoles: [
      {
        type: String,
        ref: "Role",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    // ERP-specific fields
    autoApproval: {
      type: Boolean,
      default: false,
      description: "Whether users with this role can be auto-approved",
    },
    canApproveDepartment: {
      type: Boolean,
      default: false,
      description: "Whether this role can approve users in their department",
    },
    canManageManagers: {
      type: Boolean,
      default: false,
      description: "Whether this role can manage MANAGER roles",
    },
    canManageHODs: {
      type: Boolean,
      default: false,
      description: "Whether this role can manage HOD roles",
    },
    canManageStaff: {
      type: Boolean,
      default: false,
      description: "Whether this role can manage STAFF roles",
    },
    moduleAccess: [
      {
        module: {
          type: String,
          enum: [
            "HR",
            "PAYROLL",
            "PROCUREMENT",
            "ACCOUNTS",
            "COMMUNICATION",
            "SYSTEM",
            "DOCUMENTS",
            "PROJECTS",
            "INVENTORY",
            "FINANCE",
          ],
        },
        permissions: [String],
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
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update timestamps
roleSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get role by level
roleSchema.statics.getByLevel = function (level) {
  return this.findOne({ level, isActive: true });
};

// Static method to get manageable roles
roleSchema.statics.getManageableRoles = function (userLevel) {
  return this.find({
    level: { $lt: userLevel },
    isActive: true,
  }).sort({ level: -1 });
};

// Instance method to check if can manage another role
roleSchema.methods.canManageRole = function (targetRoleLevel) {
  return this.level > targetRoleLevel;
};

// Instance method to get effective permissions
roleSchema.methods.getEffectivePermissions = function () {
  const permissions = new Set(this.permissions);

  // Add inherited permissions based on level
  if (this.level >= 100) {
    // SUPER_ADMIN
    permissions.add("system.settings");
    permissions.add("system.reports");
    permissions.add("system.audit");
  }

  if (this.level >= 90) {
    // ADMIN
    permissions.add("user.assign_role");
    permissions.add("document.archive");
  }

  if (this.level >= 80) {
    // MANAGER
    permissions.add("workflow.approve");
    permissions.add("workflow.reject");
  }

  if (this.level >= 70) {
    // SUPERVISOR
    permissions.add("document.approve");
    permissions.add("document.reject");
  }

  if (this.level >= 60) {
    // SENIOR_STAFF
    permissions.add("document.edit");
    permissions.add("workflow.view");
  }

  if (this.level >= 50) {
    // STAFF
    permissions.add("document.upload");
    permissions.add("document.view");
  }

  return Array.from(permissions);
};

const Role = mongoose.model("Role", roleSchema);

export default Role;
