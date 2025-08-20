import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    // Payroll period
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },

    // Payroll frequency
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "one_time"],
      default: "monthly",
      required: true,
    },

    // Payroll scope
    scope: {
      type: String,
      enum: ["company", "department", "individual"],
      default: "company",
      required: true,
    },

    processingDate: {
      type: Date,
      required: true,
    },

    // Department this payroll is for (required for department scope)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.scope === "department";
      },
    },

    // Employee this payroll is for (required for individual scope)
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.scope === "individual";
      },
    },

    // Batch payrolls array (for company/department scope)
    payrolls: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        baseSalary: {
          type: Number,
          required: true,
          min: 0,
        },
        housingAllowance: {
          type: Number,
          default: 0,
          min: 0,
        },
        transportAllowance: {
          type: Number,
          default: 0,
          min: 0,
        },
        mealAllowance: {
          type: Number,
          default: 0,
          min: 0,
        },
        otherAllowance: {
          type: Number,
          default: 0,
          min: 0,
        },
        personalAllowances: [
          {
            name: String,
            amount: Number,
            type: {
              type: String,
              enum: ["fixed", "percentage"],
            },
          },
        ],
        personalBonuses: [
          {
            name: String,
            amount: Number,
            type: {
              type: String,
              enum: ["fixed", "percentage"],
            },
          },
        ],
        paye: {
          type: Number,
          default: 0,
          min: 0,
        },
        pension: {
          type: Number,
          default: 0,
          min: 0,
        },
        nhis: {
          type: Number,
          default: 0,
          min: 0,
        },
        voluntaryDeductions: [
          {
            name: String,
            amount: Number,
            type: {
              type: String,
              enum: ["fixed", "percentage"],
            },
          },
        ],
        grossSalary: {
          type: Number,
          required: true,
          min: 0,
        },
        totalAllowances: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalBonuses: {
          type: Number,
          default: 0,
          min: 0,
        },
        taxableIncome: {
          type: Number,
          default: 0,
          min: 0,
        },
        nonTaxableAllowances: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalDeductions: {
          type: Number,
          default: 0,
          min: 0,
        },
        netSalary: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Salary structure (from salary grade)
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    // Built-in allowances from salary grade
    housingAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transportAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },
    mealAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Personal allowances (standalone)
    personalAllowances: [
      {
        name: String,
        amount: Number,
        type: {
          type: String,
          enum: ["fixed", "percentage"],
        },
      },
    ],

    // Personal bonuses (standalone)
    personalBonuses: [
      {
        name: String,
        amount: Number,
        type: {
          type: String,
          enum: ["fixed", "percentage"],
        },
      },
    ],

    // Nigerian statutory deductions
    paye: {
      type: Number,
      default: 0,
      min: 0,
    },
    pension: {
      type: Number,
      default: 0,
      min: 0,
    },
    nhis: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Voluntary deductions
    voluntaryDeductions: [
      {
        name: String,
        amount: Number,
        type: {
          type: String,
          enum: ["fixed", "percentage"],
        },
      },
    ],

    // Calculated totals
    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAllowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    nonTaxableAllowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "processed", "paid", "cancelled"],
      default: "draft",
    },

    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
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

// Indexes
payrollSchema.index({ month: 1, year: 1, department: 1 });
payrollSchema.index({ employee: 1, month: 1, year: 1 });
payrollSchema.index({ "payrolls.employee": 1, month: 1, year: 1 });
payrollSchema.index({ status: 1, isActive: 1 });

// Static method to get payroll for employee
payrollSchema.statics.getEmployeePayroll = function (employeeId, month, year) {
  return this.findOne({
    employee: employeeId,
    month: month,
    year: year,
    isActive: true,
  });
};

// Static method to get department payroll
payrollSchema.statics.getDepartmentPayroll = function (
  departmentId,
  month,
  year
) {
  return this.find({
    department: departmentId,
    month: month,
    year: year,
    isActive: true,
  }).populate("employee", "firstName lastName email employeeId");
};

// Static method to get all payroll for period
payrollSchema.statics.getPayrollForPeriod = function (month, year) {
  return this.find({
    month: month,
    year: year,
    isActive: true,
  }).populate("employee", "firstName lastName email employeeId department");
};

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;
