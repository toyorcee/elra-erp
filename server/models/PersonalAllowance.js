import mongoose from "mongoose";

const personalAllowanceSchema = new mongoose.Schema(
  {
    // Employee this allowance belongs to
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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

    // Allowance category (Nigerian focused)
    category: {
      type: String,
      enum: [
        "performance",
        "special",
        "hardship",
        "transport",
        "housing",
        "meal",
        "medical",
        "education",
        "other",
      ],
      default: "performance",
    },

    // Allowance scope/priority
    scope: {
      type: String,
      enum: ["department", "grade", "individual"],
      default: "individual",
    },

    // Priority level (1=department, 2=grade, 3=individual)
    priority: {
      type: Number,
      enum: [1, 2, 3],
      default: 3,
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

    // Department (required for department scope)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.scope === "department";
      },
    },

    // Salary Grade (for grade-specific allowances)
    salaryGrade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryGrade",
    },

    // Taxable status (auto-categorized based on Nigerian tax law)
    taxable: {
      type: Boolean,
      default: function () {
        // Auto-categorize based on category
        const nonTaxableCategories = [
          "transport",
          "meal",
          "medical",
          "housing",
          "education",
        ];
        return !nonTaxableCategories.includes(this.category);
      },
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
personalAllowanceSchema.index({ department: 1, status: 1 });
personalAllowanceSchema.index({ startDate: 1, endDate: 1 });
personalAllowanceSchema.index({ isUsed: 1, status: 1 });

// Pre-save middleware
personalAllowanceSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-update status based on dates
  if (this.endDate && new Date() > this.endDate) {
    this.status = "expired";
  }

  // Validation based on scope
  if (this.scope === "department" && !this.department) {
    next(new Error("Department is required for department-wide allowances"));
  }
  if (this.scope === "individual" && !this.employee) {
    next(new Error("Employee is required for individual allowances"));
  }
  if (this.scope === "grade" && !this.salaryGrade) {
    next(new Error("Salary Grade is required for grade-specific allowances"));
  }

  // Auto-update taxable status based on category (unless manually set)
  if (this.isModified("category") && !this.isModified("taxable")) {
    const nonTaxableCategories = [
      "transport",
      "meal",
      "medical",
      "housing",
      "education",
    ];
    this.taxable = !nonTaxableCategories.includes(this.category);
  }

  next();
});

// Instance method to calculate allowance amount
personalAllowanceSchema.methods.calculateAmount = function (
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

// Instance method to check if allowance is available for payroll
personalAllowanceSchema.methods.isAvailableForPayroll = function (payrollDate) {
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

// Static method to get active allowances for employee
personalAllowanceSchema.statics.getActiveAllowances = function (
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

// Static method to get unused allowances for payroll
personalAllowanceSchema.statics.getUnusedAllowances = function (
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

// Static method to get all valid allowances for an employee (like your system)
personalAllowanceSchema.statics.getEmployeeAllowances = async function (
  employeeId,
  salaryGradeId,
  departmentId,
  startDate,
  endDate
) {
  // Get department-wide allowances
  const departmentAllowances = await this.find({
    scope: "department",
    department: departmentId,
    status: "active",
    isActive: true,
    startDate: { $lte: endDate },
    $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
  }).sort({ priority: 1 });

  // Get grade-specific allowances
  const gradeAllowances = await this.find({
    scope: "grade",
    salaryGrade: salaryGradeId,
    status: "active",
    isActive: true,
    startDate: { $lte: endDate },
    $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
  }).sort({ priority: 1 });

  // Get individual allowances
  const individualAllowances = await this.find({
    scope: "individual",
    employee: employeeId,
    status: "active",
    isActive: true,
    startDate: { $lte: endDate },
    $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
  }).sort({ priority: 1 });

  // Combine all allowances, with individual allowances taking precedence
  const allAllowances = [
    ...departmentAllowances,
    ...gradeAllowances,
    ...individualAllowances,
  ];

  // Remove duplicates based on name, keeping the highest priority (individual) version
  const uniqueAllowances = allAllowances.reduce((acc, current) => {
    const existingIndex = acc.findIndex((a) => a.name === current.name);
    if (
      existingIndex === -1 ||
      acc[existingIndex].priority < current.priority
    ) {
      if (existingIndex !== -1) {
        acc.splice(existingIndex, 1);
      }
      acc.push(current);
    }
    return acc;
  }, []);

  return uniqueAllowances;
};

const PersonalAllowance = mongoose.model(
  "PersonalAllowance",
  personalAllowanceSchema
);

export default PersonalAllowance;
