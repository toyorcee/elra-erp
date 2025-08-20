import mongoose from "mongoose";

const personalAllowanceSchema = new mongoose.Schema(
  {
    // Scope of the allowance (company, department, individual)
    scope: {
      type: String,
      enum: ["company", "department", "individual"],
      required: true,
      default: "individual",
    },

    // Employee this allowance belongs to (for individual scope)
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Employees this allowance applies to (for individual scope with multiple employees)
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Department this allowance applies to (for department scope)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    // Departments this allowance applies to (for company scope with multiple departments)
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],

    // Allowance details
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

    // Allowance type (Nigerian focused)
    type: {
      type: String,
      enum: [
        "transport",
        "housing",
        "meal",
        "medical",
        "education",
        "hardship",
        "special",
        "performance",
        "other",
      ],
      default: "transport",
    },

    // Allowance category (for grouping)
    category: {
      type: String,
      enum: [
        "transport",
        "housing",
        "meal",
        "medical",
        "education",
        "hardship",
        "special",
        "performance",
        "other",
      ],
      default: "transport",
    },

    // Frequency of payment
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "one_time"],
      default: "monthly",
    },

    // Date range for this allowance
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

    // Taxable status (auto-categorized based on Nigerian tax law)
    taxable: {
      type: Boolean,
      default: function () {
        // Auto-categorize based on type
        const nonTaxableTypes = [
          "transport",
          "meal",
          "medical",
          "housing",
          "education",
        ];
        return !nonTaxableTypes.includes(this.type);
      },
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

    // Usage count for recurring items
    usageCount: {
      type: Number,
      default: 0,
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
personalAllowanceSchema.index({ employee: 1, status: 1, isActive: 1 });
personalAllowanceSchema.index({ employees: 1, status: 1, isActive: 1 });
personalAllowanceSchema.index({ department: 1, status: 1 });
personalAllowanceSchema.index({ departments: 1, status: 1 });
personalAllowanceSchema.index({ startDate: 1, endDate: 1 });
personalAllowanceSchema.index({ isUsed: 1, status: 1 });
personalAllowanceSchema.index({ frequency: 1, isUsed: 1 });

// Pre-save middleware
personalAllowanceSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-update status based on dates
  if (this.endDate && new Date() > this.endDate) {
    this.status = "expired";
  }

  // Auto-update taxable status based on type (unless manually set)
  if (this.isModified("type") && !this.isModified("taxable")) {
    const nonTaxableTypes = [
      "transport",
      "meal",
      "medical",
      "housing",
      "education",
    ];
    this.taxable = !nonTaxableTypes.includes(this.type);
  }

  next();
});

// Instance method to calculate allowance amount
personalAllowanceSchema.methods.calculateAmount = function (
  baseSalary,
  grossSalary
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
      default:
        baseAmount = baseSalary;
    }
    return (baseAmount * this.amount) / 100;
  }
  return 0;
};

personalAllowanceSchema.methods.isAvailableForPayroll = function (payrollDate) {
  if (this.status !== "active" || !this.isActive) {
    return false;
  }

  const date = new Date(payrollDate);
  if (date < this.startDate) {
    return false;
  }

  if (this.endDate && date > this.endDate) {
    return false;
  }

  // Check frequency-based usage
  if (this.frequency === "one_time" && this.isUsed) {
    return false;
  }

  // For recurring items, check if already used in this period
  if (this.frequency !== "one_time" && this.lastUsedDate) {
    const lastUsed = new Date(this.lastUsedDate);
    const payroll = new Date(payrollDate);

    // Check if already used in the same period
    if (
      this.frequency === "monthly" &&
      lastUsed.getFullYear() === payroll.getFullYear() &&
      lastUsed.getMonth() === payroll.getMonth()
    ) {
      return false;
    }

    if (this.frequency === "quarterly") {
      const lastQuarter = Math.floor(lastUsed.getMonth() / 3);
      const currentQuarter = Math.floor(payroll.getMonth() / 3);
      if (
        lastUsed.getFullYear() === payroll.getFullYear() &&
        lastQuarter === currentQuarter
      ) {
        return false;
      }
    }

    if (
      this.frequency === "yearly" &&
      lastUsed.getFullYear() === payroll.getFullYear()
    ) {
      return false;
    }
  }

  return true;
};

// Static method to get unused allowances for payroll
personalAllowanceSchema.statics.getUnusedAllowances = function (
  employeeId,
  departmentId,
  payrollDate
) {
  return this.find({
    $or: [
      // Individual allowances for this employee
      {
        scope: "individual",
        $or: [{ employee: employeeId }, { employees: employeeId }],
        status: "active",
        isActive: true,
        startDate: { $lte: payrollDate },
        $or: [{ endDate: { $gte: payrollDate } }, { endDate: null }],
      },
      // Department allowances for this employee's department
      {
        scope: "department",
        $or: [{ department: departmentId }, { departments: departmentId }],
        status: "active",
        isActive: true,
        startDate: { $lte: payrollDate },
        $or: [{ endDate: { $gte: payrollDate } }, { endDate: null }],
      },
      // Company-wide allowances
      {
        scope: "company",
        status: "active",
        isActive: true,
        startDate: { $lte: payrollDate },
        $or: [{ endDate: { $gte: payrollDate } }, { endDate: null }],
      },
    ],
  });
};

// Instance method to mark as used
personalAllowanceSchema.methods.markAsUsed = function (payrollId, payrollDate) {
  this.isUsed = true;
  this.lastUsedInPayroll = payrollId;
  this.lastUsedDate = payrollDate;
  this.usageCount += 1;

  // For one-time allowances, keep isUsed as true
  // For recurring allowances, reset isUsed for next period
  if (this.frequency !== "one_time") {
    this.isUsed = false; // Reset for next period
  }

  return this.save();
};

const PersonalAllowance = mongoose.model(
  "PersonalAllowance",
  personalAllowanceSchema
);

export default PersonalAllowance;
