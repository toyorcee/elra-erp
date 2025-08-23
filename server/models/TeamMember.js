import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    // Project Reference
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Team Member Details
    role: {
      type: String,
      required: true,
      enum: [
        "project_manager",
        "team_lead",
        "developer",
        "designer",
        "analyst",
        "tester",
        "consultant",
        "support",
        "other",
      ],
    },

    // Assignment Details
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Status and Permissions
    status: {
      type: String,
      enum: ["active", "inactive", "removed"],
      default: "active",
    },

    // Role-specific permissions
    permissions: {
      canEditProject: {
        type: Boolean,
        default: false,
      },
      canManageTeam: {
        type: Boolean,
        default: false,
      },
      canViewReports: {
        type: Boolean,
        default: true,
      },
      canAddNotes: {
        type: Boolean,
        default: true,
      },
    },

    // Work Allocation
    allocationPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    // Performance Tracking
    performance: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      notes: {
        type: String,
        maxlength: 500,
      },
      lastReviewed: {
        type: Date,
      },
    },

    // Audit Fields
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
teamMemberSchema.index({ project: 1, user: 1 }, { unique: true });
teamMemberSchema.index({ project: 1, status: 1 });
teamMemberSchema.index({ user: 1, status: 1 });
teamMemberSchema.index({ assignedBy: 1 });

// Virtual for team member display name
teamMemberSchema.virtual("displayName").get(function () {
  if (this.populated("user")) {
    return `${this.user.firstName} ${this.user.lastName}`;
  }
  return "Unknown User";
});

// Virtual for role display name
teamMemberSchema.virtual("roleDisplay").get(function () {
  const roleMap = {
    project_manager: "Project Manager",
    team_lead: "Team Lead",
    developer: "Developer",
    designer: "Designer",
    analyst: "Analyst",
    tester: "Tester",
    consultant: "Consultant",
    support: "Support",
    other: "Other",
  };
  return roleMap[this.role] || this.role;
});

// Static method to get team members by project
teamMemberSchema.statics.getByProject = async function (
  projectId,
  options = {}
) {
  const query = { project: projectId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate("user", "firstName lastName email avatar department role")
    .populate("assignedBy", "firstName lastName")
    .sort({ assignedDate: -1 });
};

// Static method to get user's team memberships
teamMemberSchema.statics.getByUser = async function (userId, options = {}) {
  const query = { user: userId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate("project", "name code status startDate endDate")
    .populate("assignedBy", "firstName lastName")
    .sort({ assignedDate: -1 });
};

// Static method to check if user is team member
teamMemberSchema.statics.isTeamMember = async function (projectId, userId) {
  const member = await this.findOne({
    project: projectId,
    user: userId,
    isActive: true,
    status: "active",
  });
  return !!member;
};

// Static method to get project manager
teamMemberSchema.statics.getProjectManager = async function (projectId) {
  return this.findOne({
    project: projectId,
    role: "project_manager",
    isActive: true,
    status: "active",
  }).populate("user", "firstName lastName email");
};

// Instance method to update status
teamMemberSchema.methods.updateStatus = async function (newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedBy = updatedBy;
  return this.save();
};

// Instance method to update permissions
teamMemberSchema.methods.updatePermissions = async function (
  permissions,
  updatedBy
) {
  this.permissions = { ...this.permissions, ...permissions };
  this.updatedBy = updatedBy;
  return this.save();
};

// Pre-save middleware to ensure unique project-user combinations
teamMemberSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existing = await this.constructor.findOne({
      project: this.project,
      user: this.user,
      isActive: true,
    });

    if (existing) {
      throw new Error("User is already a team member of this project");
    }
  }
  next();
});

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;
