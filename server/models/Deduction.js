import mongoose from "mongoose";

const deductionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Multiple employees for individual scope
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Deduction details
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Deduction type
    type: {
      type: String,
      enum: ["voluntary", "statutory"],
      required: true,
    },

    // Calculation method
    calculationType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: function () {
        return this.category !== "paye";
      },
    },

    // Amount or percentage
    amount: {
      type: Number,
      required: function () {
        return this.category !== "paye";
      },
      min: 0,
    },

    // If percentage, what it's based on
    percentageBase: {
      type: String,
      enum: ["base_salary", "gross_salary"],
      default: "base_salary",
      required: function () {
        return this.category !== "paye";
      },
    },

    useTaxBrackets: {
      type: Boolean,
      default: false,
    },

    // Deduction category (Nigerian focused)
    category: {
      type: String,
      enum: [
        // Statutory categories
        "paye",
        "pension",
        "nhis",
        // Voluntary categories
        "loan_repayment",
        "insurance",
        "association_dues",
        "savings",
        "transport",
        "cooperative",
        "training_fund",
        "welfare",
        "penalty",
        "general",
      ],
      default: "general",
    },

    // Scope of deduction
    scope: {
      type: String,
      enum: ["company", "department", "individual"],
      default: "company",
    },

    // Frequency of deduction
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "one_time"],
      default: "monthly",
    },

    // Date range for this deduction
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
      enum: ["active", "inactive", "expired", "completed"],
      default: "active",
    },

    isActive: {
      type: Boolean,
      default: true,
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

    // Department (for department scope)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      // Required only for department scope
    },

    // Multiple departments for department scope
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],

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
deductionSchema.index({ employee: 1, status: 1, isActive: 1 });
deductionSchema.index({ department: 1, status: 1 });
deductionSchema.index({ type: 1, status: 1 });
deductionSchema.index({ startDate: 1, endDate: 1 });
deductionSchema.index({ isUsed: 1, status: 1 });

// Pre-save middleware
deductionSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  if (this.endDate && new Date() > this.endDate) {
    this.status = "expired";
  }

  // Validate scope-dependent fields
  if (this.scope === "company") {
    // Company-wide deductions don't need specific employee or department
    if (this.employee || this.employees?.length > 0) {
      return next(
        new Error("Company-wide deductions should not have specific employees")
      );
    }
    if (this.department || this.departments?.length > 0) {
      return next(
        new Error(
          "Company-wide deductions should not have specific departments"
        )
      );
    }
  } else if (this.scope === "department") {
    // Department-wide deductions need department(s) but not specific employee(s)
    if (
      !this.department &&
      (!this.departments || this.departments.length === 0)
    ) {
      return next(
        new Error("Department-wide deductions require at least one department")
      );
    }
    if (this.employee || this.employees?.length > 0) {
      return next(
        new Error(
          "Department-wide deductions should not have specific employees"
        )
      );
    }
  } else if (this.scope === "individual") {
    // Individual deductions need employee(s) and department(s)
    if (!this.employee && (!this.employees || this.employees.length === 0)) {
      return next(
        new Error("Individual deductions require at least one employee")
      );
    }
    if (
      !this.department &&
      (!this.departments || this.departments.length === 0)
    ) {
      return next(
        new Error("Individual deductions require at least one department")
      );
    }
  }

  next();
});

// Instance method to calculate deduction amount
deductionSchema.methods.calculateAmount = function (
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

// Instance method to check if deduction is available for payroll
deductionSchema.methods.isAvailableForPayroll = function (payrollDate) {
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

// Static method to get active deductions for employee
deductionSchema.statics.getActiveDeductions = function (
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

// Static method to get unused deductions for payroll
deductionSchema.statics.getUnusedDeductions = function (
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

// Static method to get voluntary deductions
deductionSchema.statics.getVoluntaryDeductions = function (employeeId) {
  return this.find({
    employee: employeeId,
    type: "voluntary",
    status: "active",
    isActive: true,
  });
};

// Static method to get statutory deductions
deductionSchema.statics.getStatutoryDeductions = function (employeeId) {
  return this.find({
    employee: employeeId,
    type: "statutory",
    status: "active",
    isActive: true,
  });
};

const Deduction = mongoose.model("Deduction", deductionSchema);

export default Deduction;
