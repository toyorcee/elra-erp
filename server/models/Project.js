import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    // Basic Project Information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    // Project Status and Priority
    status: {
      type: String,
      enum: [
        "planning",
        "pending_approval",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      default: "planning",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      required: true,
    },

    // Project Timeline
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    actualStartDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },

    // Project Budget (in Naira)
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Project Team
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: function () {
        return this.name ? `${this.name} Team` : "Project Team";
      },
    },
    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          required: true,
          enum: [
            "developer",
            "designer",
            "analyst",
            "tester",
            "consultant",
            "other",
          ],
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Project Department (which department owns this project)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // Project Categories (relevant for leasing business)
    category: {
      type: String,
      required: true,
      enum: [
        "equipment_lease",
        "vehicle_lease",
        "property_lease",
        "financial_lease",
        "training_equipment_lease",
        "compliance_lease",
        "service_equipment_lease",
        "strategic_lease",
        "software_development",
        "system_maintenance",
        "consulting",
        "training",
        "other",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Project Progress
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Project Notes
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isPrivate: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

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
projectSchema.index({ status: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ "teamMembers.user": 1 });
projectSchema.index({ code: 1 }, { unique: true });
projectSchema.index({ startDate: 1, endDate: 1 });

// Virtual for project duration
projectSchema.virtual("duration").get(function () {
  if (this.actualStartDate && this.actualEndDate) {
    return Math.ceil(
      (this.actualEndDate - this.actualStartDate) / (1000 * 60 * 60 * 24)
    );
  }
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

projectSchema.virtual("budgetVariance").get(function () {
  return this.budget - this.actualCost;
});

projectSchema.virtual("isOverdue").get(function () {
  if (this.status === "completed" || this.status === "cancelled") return false;
  return new Date() > this.endDate;
});

projectSchema.pre("save", async function (next) {
  try {
    if (!this.code) {
      const count = await this.constructor.countDocuments({ isActive: true });
      const currentYear = new Date().getFullYear();
      this.code = `PRJ${currentYear}${String(count + 1).padStart(4, "0")}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

projectSchema.statics.getProjectStats = async function () {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalBudget: { $sum: "$budget" },
        totalActualCost: { $sum: "$actualCost" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalBudget: stat.totalBudget,
      totalActualCost: stat.totalActualCost,
    };
    return acc;
  }, {});
};

// Static method to get active projects
projectSchema.statics.getActiveProjects = function () {
  return this.find({ isActive: true, status: "active" })
    .populate("projectManager", "firstName lastName email")
    .populate("teamMembers.user", "firstName lastName email")
    .sort({ startDate: 1 });
};

// Static method to get projects by category
projectSchema.statics.getByCategory = function (category) {
  return this.find({ isActive: true, category })
    .populate("projectManager", "firstName lastName email")
    .sort({ startDate: 1 });
};

// Instance method to add team member
projectSchema.methods.addTeamMember = async function (userId, role) {
  const existingMember = this.teamMembers.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (existingMember) {
    existingMember.isActive = true;
    existingMember.role = role;
  } else {
    this.teamMembers.push({
      user: userId,
      role: role,
      assignedDate: new Date(),
      isActive: true,
    });
  }

  await this.save();
};

// Instance method to remove team member
projectSchema.methods.removeTeamMember = async function (userId) {
  const memberIndex = this.teamMembers.findIndex(
    (member) => member.user.toString() === userId.toString()
  );

  if (memberIndex !== -1) {
    this.teamMembers[memberIndex].isActive = false;
    await this.save();
  }
};

// Instance method to add note
projectSchema.methods.addNote = async function (
  content,
  authorId,
  isPrivate = false
) {
  this.notes.push({
    content,
    author: authorId,
    isPrivate,
    createdAt: new Date(),
  });

  await this.save();
};

// Instance method to get project summary
projectSchema.methods.getSummary = function () {
  const activeTeamMembers = this.teamMembers.filter(
    (member) => member.isActive
  ).length;

  return {
    id: this._id,
    name: this.name,
    code: this.code,
    status: this.status,
    progress: this.progress,
    budget: this.budget,
    actualCost: this.actualCost,
    budgetVariance: this.budgetVariance,
    duration: this.duration,
    isOverdue: this.isOverdue,
    teamSize: activeTeamMembers,
    startDate: this.startDate,
    endDate: this.endDate,
  };
};

const Project = mongoose.model("Project", projectSchema);

export default Project;
