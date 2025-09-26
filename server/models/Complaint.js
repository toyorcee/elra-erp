import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    // Basic complaint information
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Complaint category is required"],
      enum: [
        "technical", 
        "payroll", 
        "hr", 
        "customer_care", 
        "sales", 
        "procurement", 
        "inventory", 
        "equipment", 
        "access", 
        "policy", 
        "training", 
        "facilities", 
        "security", 
        "other"
      ],
      default: "other",
    },
    priority: {
      type: String,
      required: [true, "Priority level is required"],
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "in_progress", "resolved", "closed", "rejected"],
      default: "pending",
    },

    // User information
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Complaint must be submitted by a user"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },

    // Resolution information
    resolution: {
      type: String,
      trim: true,
      maxlength: [1000, "Resolution cannot exceed 1000 characters"],
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },

    // Timestamps
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // Additional metadata
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    notes: [
      {
        note: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Note cannot exceed 500 characters"],
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // SLA tracking
    slaDeadline: {
      type: Date,
    },
    slaStatus: {
      type: String,
      enum: ["on_time", "at_risk", "overdue"],
      default: "on_time",
    },

    // Feedback
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [500, "Feedback cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
complaintSchema.index({ submittedBy: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ category: 1, priority: 1 });
complaintSchema.index({ status: 1, submittedAt: -1 });
complaintSchema.index({ slaDeadline: 1 });

// Virtual for complaint number
complaintSchema.virtual("complaintNumber").get(function () {
  return `CC-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Virtual for age in days
complaintSchema.virtual("ageInDays").get(function () {
  return Math.floor((Date.now() - this.submittedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
complaintSchema.virtual("isOverdue").get(function () {
  if (!this.slaDeadline) return false;
  return (
    new Date() > this.slaDeadline &&
    this.status !== "resolved" &&
    this.status !== "closed"
  );
});

// Pre-save middleware to update lastUpdated
complaintSchema.pre("save", function (next) {
  this.lastUpdated = new Date();

  // Set SLA deadline based on priority
  if (this.isNew && !this.slaDeadline) {
    const now = new Date();
    switch (this.priority) {
      case "high":
        this.slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
        break;
      case "medium":
        this.slaDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        break;
      case "low":
        this.slaDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
    }
  }

  // Update SLA status
  if (this.slaDeadline) {
    const now = new Date();
    const deadline = new Date(this.slaDeadline);
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

    if (this.status === "resolved" || this.status === "closed") {
      this.slaStatus = "on_time";
    } else if (hoursUntilDeadline < 0) {
      this.slaStatus = "overdue";
    } else if (hoursUntilDeadline < 24) {
      this.slaStatus = "at_risk";
    } else {
      this.slaStatus = "on_time";
    }
  }

  next();
});

// Static method to get complaint statistics
complaintSchema.statics.getStatistics = async function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        closed: {
          $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
        },
        highPriority: {
          $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$status", "resolved"] },
                  { $ne: ["$status", "closed"] },
                  { $lt: ["$slaDeadline", new Date()] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return (
    result[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      highPriority: 0,
      overdue: 0,
    }
  );
};

// Instance method to add a note
complaintSchema.methods.addNote = function (note, userId) {
  this.notes.push({
    note,
    addedBy: userId,
    addedAt: new Date(),
  });
  return this.save();
};

// Instance method to update status
complaintSchema.methods.updateStatus = function (
  newStatus,
  userId,
  resolution = null
) {
  this.status = newStatus;
  this.lastUpdated = new Date();

  if (newStatus === "resolved" || newStatus === "closed") {
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    if (resolution) {
      this.resolution = resolution;
    }
  }

  if (newStatus === "closed") {
    this.closedAt = new Date();
  }

  return this.save();
};

export default mongoose.model("Complaint", complaintSchema);
