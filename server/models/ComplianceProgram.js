import mongoose from "mongoose";

const complianceProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Compliance program name is required"],
      trim: true,
      maxlength: [200, "Program name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Program description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Program category is required"],
      enum: [
        "Leasing Regulations",
        "Financial Compliance",
        "Risk Management",
        "Customer Protection",
        "Anti-Money Laundering",
        "Data Protection & Privacy",
        "Operational Standards",
        "Reporting Requirements",
        "Audit & Monitoring",
        "Contractual Compliance",
        "Regulatory Compliance",
        "Environmental Compliance",
        "Health & Safety",
        "Quality Assurance",
        "Vendor Management",
        "Project Compliance",
        "Legal Documentation",
        "Insurance Compliance",
        "Tax Compliance",
        "Other",
      ],
    },
    customCategory: {
      type: String,
      trim: true,
      maxlength: [200, "Custom category cannot exceed 200 characters"],
      required: function () {
        return this.category === "Other";
      },
    },
    status: {
      type: String,
      required: [true, "Program status is required"],
      enum: ["Active", "Inactive", "Under Review", "Draft"],
      default: "Draft",
    },
    priority: {
      type: String,
      required: [true, "Priority level is required"],
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
    },
    reviewDate: {
      type: Date,
      required: [true, "Review date is required"],
    },
    complianceScope: {
      type: String,
      enum: ["hr", "legal", "general"],
      default: "legal",
      required: true,
    },
    applicableProjectScopes: [
      {
        type: String,
        enum: ["personal", "departmental", "external"],
      },
    ],
    programOwner: {
      type: String,
      trim: true,
      maxlength: [200, "Program owner name cannot exceed 200 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    objectives: [
      {
        type: String,
        required: [true, "At least one objective is required"],
      },
    ],
    kpis: [
      {
        name: {
          type: String,
          required: true,
        },
        target: {
          type: String,
          required: true,
        },
        currentValue: {
          type: String,
          default: "0",
        },
        unit: {
          type: String,
          required: true,
        },
      },
    ],
    documentation: [
      {
        title: String,
        description: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

complianceProgramSchema.index({ name: 1 });
complianceProgramSchema.index({ category: 1 });
complianceProgramSchema.index({ status: 1 });
complianceProgramSchema.index({ priority: 1 });
complianceProgramSchema.index({ complianceScope: 1 });

complianceProgramSchema.virtual("daysUntilReview").get(function () {
  if (!this.reviewDate) return null;
  const today = new Date();
  const review = new Date(this.reviewDate);
  const diffTime = review - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

complianceProgramSchema.virtual("isReviewDueSoon").get(function () {
  if (!this.reviewDate) return false;
  const days = this.daysUntilReview;
  return days <= 30 && days >= 0;
});

complianceProgramSchema.virtual("complianceItemsCount", {
  ref: "Compliance",
  localField: "_id",
  foreignField: "complianceProgram",
  count: true,
});

complianceProgramSchema.virtual("complianceStatusSummary", {
  ref: "Compliance",
  localField: "_id",
  foreignField: "complianceProgram",
  options: { match: { isActive: true } },
});

complianceProgramSchema.methods.getComplianceItems = function () {
  return mongoose.model("Compliance").find({
    complianceProgram: this._id,
    isActive: true,
  });
};

complianceProgramSchema.methods.getComplianceStats = async function () {
  const Compliance = mongoose.model("Compliance");
  const stats = await Compliance.aggregate([
    {
      $match: {
        complianceProgram: this._id,
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await Compliance.countDocuments({
    complianceProgram: this._id,
    isActive: true,
  });

  const statsMap = {
    Compliant: 0,
    "Non-Compliant": 0,
    "Under Review": 0,
    Pending: 0,
    Total: total,
  };

  stats.forEach((stat) => {
    statsMap[stat._id] = stat.count;
  });

  return statsMap;
};

complianceProgramSchema.methods.isReadyForAttachment = async function () {
  const Compliance = mongoose.model("Compliance");

  // Count non-compliant items
  const nonCompliantItems = await Compliance.countDocuments({
    complianceProgram: this._id,
    isActive: true,
    status: { $in: ["Non-Compliant", "Pending", "Under Review"] },
  });

  return nonCompliantItems === 0;
};

complianceProgramSchema.statics.getProgramStats = async function () {
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
    Inactive: 0,
    "Under Review": 0,
    Draft: 0,
    Total: total,
  };

  stats.forEach((stat) => {
    statsMap[stat._id] = stat.count;
  });

  return statsMap;
};

complianceProgramSchema.set("toJSON", { virtuals: true });
complianceProgramSchema.set("toObject", { virtuals: true });

const ComplianceProgram = mongoose.model(
  "ComplianceProgram",
  complianceProgramSchema
);
export default ComplianceProgram;
