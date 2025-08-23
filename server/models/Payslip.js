import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema(
  {
    // Reference to the payroll this payslip belongs to
    payrollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: true,
    },

    // Employee information
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Period information
    period: {
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
      monthName: {
        type: String,
        required: true,
      },
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "yearly", "one_time"],
        default: "monthly",
      },
    },

    // Payroll scope
    scope: {
      type: String,
      enum: ["company", "department", "individual"],
      required: true,
    },

    // Salary breakdown
    baseSalary: {
      type: Number,
      default: 0,
    },

    grossSalary: {
      type: Number,
      default: 0,
    },

    netSalary: {
      type: Number,
      default: 0,
    },

    totalDeductions: {
      type: Number,
      default: 0,
    },

    taxableIncome: {
      type: Number,
      default: 0,
    },

    nonTaxableAllowances: {
      type: Number,
      default: 0,
    },

    // Tax breakdown
    paye: {
      type: Number,
      default: 0,
    },

    pension: {
      type: Number,
      default: 0,
    },

    nhis: {
      type: Number,
      default: 0,
    },

    // Allowances and bonuses
    personalAllowances: [
      {
        name: String,
        amount: Number,
        type: {
          type: String,
          enum: ["fixed", "percentage"],
          default: "fixed",
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
          default: "fixed",
        },
      },
    ],

    voluntaryDeductions: [
      {
        name: String,
        amount: Number,
        type: {
          type: String,
          enum: ["fixed", "percentage"],
          default: "fixed",
        },
      },
    ],

    // Summary
    summary: {
      grossPay: {
        type: Number,
        default: 0,
      },
      netPay: {
        type: Number,
        default: 0,
      },
      totalDeductions: {
        type: Number,
        default: 0,
      },
      taxableIncome: {
        type: Number,
        default: 0,
      },
    },

    // File information
    payslipFile: {
      fileName: String,
      filePath: String,
      fileUrl: String,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["generated", "sent", "viewed", "downloaded"],
      default: "generated",
    },

    // Email tracking
    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
    },

    // View tracking
    viewedAt: {
      type: Date,
    },

    downloadedAt: {
      type: Date,
    },

    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Processing information
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
payslipSchema.index({ payrollId: 1 });
payslipSchema.index({ employee: 1 });
payslipSchema.index({ "period.month": 1, "period.year": 1 });
payslipSchema.index({ scope: 1 });
payslipSchema.index({ status: 1 });
payslipSchema.index({ createdBy: 1 });
payslipSchema.index({ createdAt: -1 });

// Virtual for full employee name
payslipSchema.virtual("employeeFullName").get(function () {
  if (this.populated("employee")) {
    return `${this.employee.firstName} ${this.employee.lastName}`;
  }
  return "Unknown Employee";
});

// Virtual for period display
payslipSchema.virtual("periodDisplay").get(function () {
  return `${this.period.monthName} ${this.period.year}`;
});

// Method to mark as sent
payslipSchema.methods.markAsSent = function () {
  this.status = "sent";
  this.emailSent = true;
  this.emailSentAt = new Date();
  return this.save();
};

// Method to mark as viewed
payslipSchema.methods.markAsViewed = function () {
  this.status = "viewed";
  this.viewedAt = new Date();
  return this.save();
};

// Method to mark as downloaded
payslipSchema.methods.markAsDownloaded = function () {
  this.status = "downloaded";
  this.downloadedAt = new Date();
  return this.save();
};

// Static method to get payslips by filters
payslipSchema.statics.findByFilters = function (filters) {
  const query = { isActive: true };

  if (filters.month && filters.month !== "all") {
    query["period.month"] = parseInt(filters.month);
  }

  if (filters.year && filters.year !== "all") {
    query["period.year"] = parseInt(filters.year);
  }

  if (filters.scope && filters.scope !== "all") {
    query.scope = filters.scope;
  }

  if (filters.frequency && filters.frequency !== "all") {
    query["period.frequency"] = filters.frequency;
  }

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (filters.employeeId) {
    query["employee.employeeId"] = {
      $regex: filters.employeeId,
      $options: "i",
    };
  }

  if (filters.employeeName) {
    // This would need to be handled with population
    query["employee.firstName"] = {
      $regex: filters.employeeName,
      $options: "i",
    };
  }

  return this.find(query);
};

const Payslip = mongoose.model("Payslip", payslipSchema);

export default Payslip;
