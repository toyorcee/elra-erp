import mongoose from "mongoose";

const personalBonusSchema = new mongoose.Schema(
  {
    // Employee this bonus belongs to
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Bonus details
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Calculation method
    calculationType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },

    // Amount or percentage
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // If percentage, what it's based on
    percentageBase: {
      type: String,
      enum: ["base_salary", "gross_salary"],
      default: "base_salary",
    },

    // Bonus type (Nigerian focused)
    type: {
      type: String,
      enum: [
        "personal",
        "performance",
        "thirteenth_month",
        "special",
        "achievement",
        "retention",
        "project",
        "year_end",
      ],
      default: "performance",
    },

    // Bonus category (for grouping)
    category: {
      type: String,
      enum: [
        "performance",
        "year_end",
        "special",
        "achievement",
        "retention",
        "project",
        "other",
      ],
      default: "performance",
    },

    // Frequency of payment
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "one_time"],
      default: "yearly",
    },

    // Date range for this bonus
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      // null means ongoing
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },

    // Approval workflow
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    // Usage tracking
    isUsed: {
      type: Boolean,
      default: false,
    },

    lastUsedInPayroll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
    },

    lastUsedDate: {
      type: Date,
    },

    // Department
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // Taxable status (auto-categorized based on Nigerian tax law)
    taxable: {
      type: Boolean,
      default: function () {
        // Most bonuses are taxable in Nigeria
        const nonTaxableBonuses = [
          "retention", // Some retention bonuses might be non-taxable
        ];
        return !nonTaxableBonuses.includes(this.type);
      },
    },

    // Rejection comment
    rejectionComment: {
      type: String,
    },

    // Audit fields
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

// Indexes
personalBonusSchema.index({ employee: 1, status: 1, isActive: 1 });
personalBonusSchema.index({ department: 1, status: 1 });
personalBonusSchema.index({ startDate: 1, endDate: 1 });
personalBonusSchema.index({ isUsed: 1, status: 1 });

// Pre-save middleware
personalBonusSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-update status based on dates
  if (this.endDate && new Date() > this.endDate) {
    this.status = "expired";
  }

  // Auto-update taxable status based on type (unless manually set)
  if (this.isModified("type") && !this.isModified("taxable")) {
    const nonTaxableBonuses = [
      "retention", // Some retention bonuses might be non-taxable
    ];
    this.taxable = !nonTaxableBonuses.includes(this.type);
  }

  next();
});

// Instance method to calculate bonus amount
personalBonusSchema.methods.calculateAmount = function (
  baseSalary,
  grossSalary,
  totalCompensation
) {
  if (this.calculationType === "fixed") {
    return this.amount;
  } else if (this.calculationType === "percentage") {
    let baseAmount;
    switch (this.percentageBase) {
      case "base_salary":
        baseAmount = baseSalary;
        break;
      case "gross_salary":
        baseAmount = grossSalary;
        break;
      case "total_compensation":
        baseAmount = totalCompensation;
        break;
      default:
        baseAmount = baseSalary;
    }
    return (baseAmount * this.amount) / 100;
  }
  return 0;
};

// Instance method to check if bonus is available for payroll
personalBonusSchema.methods.isAvailableForPayroll = function (payrollDate) {
  if (this.status !== "active" || this.isUsed) {
    return false;
  }

  const date = new Date(payrollDate);
  if (date < this.startDate) {
    return false;
  }

  if (this.endDate && date > this.endDate) {
    return false;
  }

  // Check frequency
  if (this.frequency === "one_time" && this.isUsed) {
    return false;
  }

  return true;
};

// Static method to get active bonuses for employee
personalBonusSchema.statics.getActiveBonuses = function (
  employeeId,
  payrollDate
) {
  return this.find({
    employee: employeeId,
    status: "active",
    isActive: true,
    startDate: { $lte: payrollDate },
    $or: [{ endDate: { $gte: payrollDate } }, { endDate: null }],
  });
};

// Static method to get unused bonuses for payroll
personalBonusSchema.statics.getUnusedBonuses = function (
  employeeId,
  payrollDate
) {
  return this.find({
    employee: employeeId,
    status: "active",
    isActive: true,
    isUsed: false,
    startDate: { $lte: payrollDate },
    $or: [{ endDate: { $gte: payrollDate } }, { endDate: null }],
  });
};

const PersonalBonus = mongoose.model("PersonalBonus", personalBonusSchema);

export default PersonalBonus;
