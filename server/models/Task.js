import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    // Basic Task Information
    title: {
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
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    // Task Status and Priority
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "overdue", "cancelled"],
      default: "pending",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      required: true,
    },

    // Task Timeline
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Task Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },

    // Task Categories (Personal Project Implementation)
    category: {
      type: String,
      required: true,
      enum: [
        // Personal Project Implementation Tasks
        "project_setup",
        "resource_preparation",
        "core_implementation",
        "quality_check",
        "documentation",
        "project_closure",

        // Legacy Categories (for backward compatibility)
        "equipment_setup",
        "vehicle_maintenance",
        "property_inspection",
        "customer_service",
        "billing",
        "compliance",
        "other",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Task Progress
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Personal Project Implementation Fields
    projectType: {
      type: String,
      enum: ["personal", "departmental", "external"],
      default: "personal",
    },

    implementationPhase: {
      type: String,
      enum: ["setup", "preparation", "execution", "review", "closure"],
      default: "setup",
    },

    milestoneOrder: {
      type: Number,
      min: 1,
      default: 1,
    },

    isBaseTask: {
      type: Boolean,
      default: false,
    },

    baseTaskTemplate: {
      type: String,
      enum: [
        "project_setup_planning",
        "resource_gathering",
        "main_implementation",
        "quality_testing",
        "final_documentation",
      ],
    },

    notes: {
      type: String,
      trim: true,
    },

    // Task Comments
    comments: [
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

    // Task Checklist
    checklist: [
      {
        item: {
          type: String,
          required: true,
          trim: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        completedAt: {
          type: Date,
        },
      },
    ],

    // Audit Fields
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
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
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ code: 1 }, { unique: true });
taskSchema.index({ startDate: 1 });
taskSchema.index({ dueDate: 1 });

// Virtual for task duration
taskSchema.virtual("duration").get(function () {
  if (this.startDate && this.completedDate) {
    return Math.ceil(
      (this.completedDate - this.startDate) / (1000 * 60 * 60 * 24)
    );
  }
  return null;
});

// Virtual for overdue status
taskSchema.virtual("isOverdue").get(function () {
  if (this.status === "completed" || this.status === "cancelled") return false;
  return new Date() > this.dueDate;
});

// Virtual for time variance
taskSchema.virtual("timeVariance").get(function () {
  if (this.estimatedHours === 0) return 0;
  return this.actualHours - this.estimatedHours;
});

// Pre-save middleware to generate task code if not provided
taskSchema.pre("save", async function (next) {
  if (!this.code) {
    const count = await this.constructor.countDocuments();
    this.code = `TASK${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Static method to get task statistics
taskSchema.statics.getTaskStats = async function (projectId = null) {
  const match = { isActive: true };
  if (projectId) match.project = projectId;

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalEstimatedHours: { $sum: "$estimatedHours" },
        totalActualHours: { $sum: "$actualHours" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalEstimatedHours: stat.totalEstimatedHours,
      totalActualHours: stat.totalActualHours,
    };
    return acc;
  }, {});
};

// Static method to get tasks by status
taskSchema.statics.getByStatus = function (status) {
  return this.find({ isActive: true, status })
    .populate("assignedTo", "firstName lastName email")
    .populate("project", "name code")
    .sort({ dueDate: 1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function () {
  return this.find({
    isActive: true,
    dueDate: { $lt: new Date() },
    status: { $nin: ["completed", "cancelled"] },
  })
    .populate("assignedTo", "firstName lastName email")
    .populate("project", "name code")
    .sort({ dueDate: 1 });
};

// Instance method to update task progress based on checklist
taskSchema.methods.updateProgress = async function () {
  if (this.checklist.length === 0) {
    this.progress = 0;
    return;
  }

  const completedItems = this.checklist.filter(
    (item) => item.isCompleted
  ).length;
  this.progress = Math.round((completedItems / this.checklist.length) * 100);

  await this.save();
};

// Instance method to add comment
taskSchema.methods.addComment = async function (
  content,
  authorId,
  isPrivate = false
) {
  this.comments.push({
    content,
    author: authorId,
    isPrivate,
    createdAt: new Date(),
  });

  await this.save();
};

// Instance method to add checklist item
taskSchema.methods.addChecklistItem = async function (item) {
  this.checklist.push({
    item,
    isCompleted: false,
  });

  await this.save();
};

// Instance method to complete checklist item
taskSchema.methods.completeChecklistItem = async function (
  itemIndex,
  completedBy
) {
  if (itemIndex >= 0 && itemIndex < this.checklist.length) {
    this.checklist[itemIndex].isCompleted = true;
    this.checklist[itemIndex].completedBy = completedBy;
    this.checklist[itemIndex].completedAt = new Date();

    await this.updateTwoPhaseProgress();
  }
};

// Instance method to get task summary
taskSchema.methods.getSummary = function () {
  const completedChecklistItems = this.checklist.filter(
    (item) => item.isCompleted
  ).length;

  return {
    id: this._id,
    title: this.title,
    code: this.code,
    status: this.status,
    priority: this.priority,
    progress: this.progress,
    dueDate: this.dueDate,
    isOverdue: this.isOverdue,
    estimatedHours: this.estimatedHours,
    actualHours: this.actualHours,
    timeVariance: this.timeVariance,
    checklistItems: this.checklist.length,
    completedChecklistItems,
    commentsCount: this.comments.length,
  };
};

const Task = mongoose.model("Task", taskSchema);

export default Task;
