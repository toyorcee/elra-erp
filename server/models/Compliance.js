import mongoose from "mongoose";

const complianceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Compliance title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Compliance category is required"],
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
      required: [true, "Compliance status is required"],
      enum: ["Compliant", "Non-Compliant", "Under Review", "Pending"],
      default: "Pending",
    },
    priority: {
      type: String,
      required: [true, "Priority level is required"],
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    lastAudit: {
      type: Date,
      default: null,
    },
    nextAudit: {
      type: Date,
      required: [true, "Next audit date is required"],
    },
    description: {
      type: String,
      required: [true, "Compliance description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    requirements: [
      {
        type: String,
        required: [true, "At least one requirement is needed"],
      },
    ],
    findings: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    complianceProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ComplianceProgram",
      required: [true, "Compliance program is required"],
    },
    complianceScope: {
      type: String,
      enum: ["hr", "legal", "general"],
      default: "hr",
      required: true,
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
complianceSchema.index({ title: 1 });
complianceSchema.index({ category: 1 });
complianceSchema.index({ status: 1 });
complianceSchema.index({ priority: 1 });

complianceSchema.index({ dueDate: 1 });
complianceSchema.index({ nextAudit: 1 });

// Virtual for days until due
complianceSchema.virtual("daysUntilDue").get(function () {
  if (!this.dueDate) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
complianceSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) return false;
  return this.daysUntilDue < 0;
});

// Virtual for due soon status
complianceSchema.virtual("isDueSoon").get(function () {
  if (!this.dueDate) return false;
  const days = this.daysUntilDue;
  return days <= 7 && days >= 0;
});

// Method to update audit dates
complianceSchema.methods.updateAuditDates = function (
  newLastAudit,
  newNextAudit
) {
  this.lastAudit = newLastAudit || new Date();
  this.nextAudit = newNextAudit;
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get compliance statistics
complianceSchema.statics.getStats = async function () {
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

// Static method to get overdue items
complianceSchema.statics.getOverdueItems = async function () {
  const today = new Date();
  return await this.find({
    isActive: true,
    dueDate: { $lt: today },
    status: { $ne: "Compliant" },
  });
};

// Static method to get due soon items
complianceSchema.statics.getDueSoonItems = async function () {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  return await this.find({
    isActive: true,
    dueDate: { $gte: today, $lte: sevenDaysFromNow },
    status: { $ne: "Compliant" },
  });
};

// Ensure virtuals are included in JSON output
complianceSchema.set("toJSON", { virtuals: true });
complianceSchema.set("toObject", { virtuals: true });

const Compliance = mongoose.model("Compliance", complianceSchema);
export default Compliance;
