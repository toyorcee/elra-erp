import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Policy title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Policy category is required"],
      enum: [
        "Behavioral",
        "Benefits",
        "Work Arrangements",
        "Safety",
        "Compensation",
        "Other",
      ],
    },
    status: {
      type: String,
      required: [true, "Policy status is required"],
      enum: ["Active", "Draft", "Inactive", "Under Review"],
      default: "Draft",
    },
    version: {
      type: String,
      required: [true, "Policy version is required"],
      default: "1.0",
    },
    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
    },
    description: {
      type: String,
      required: [true, "Policy description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    content: {
      type: String,
      required: [true, "Policy content is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
policySchema.index({ title: 1 });
policySchema.index({ category: 1 });
policySchema.index({ status: 1 });
policySchema.index({ department: 1 });
policySchema.index({ createdBy: 1 });
policySchema.index({ effectiveDate: 1 });

// Virtual for formatted version
policySchema.virtual("formattedVersion").get(function () {
  return `v${this.version}`;
});

// Method to update version
policySchema.methods.incrementVersion = function () {
  const currentVersion = parseFloat(this.version);
  this.version = (currentVersion + 0.1).toFixed(1);
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get policy statistics
policySchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await this.countDocuments({ isActive: true });

  const statsMap = {
    Active: 0,
    Draft: 0,
    Inactive: 0,
    "Under Review": 0,
    Total: total,
  };

  stats.forEach((stat) => {
    statsMap[stat._id] = stat.count;
  });

  return statsMap;
};

// Ensure virtuals are included in JSON output
policySchema.set("toJSON", { virtuals: true });
policySchema.set("toObject", { virtuals: true });

const Policy = mongoose.model("Policy", policySchema);
export default Policy;
