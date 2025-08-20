import mongoose from "mongoose";

const salaryGradeSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    minGrossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    maxGrossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // Allowances for this grade
    allowances: {
      housing: {
        type: Number,
        default: 0,
        min: 0,
      },
      transport: {
        type: Number,
        default: 0,
        min: 0,
      },
      meal: {
        type: Number,
        default: 0,
        min: 0,
      },
      other: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    // Custom allowances with names
    customAllowances: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // Salary steps based on years of service
    steps: [
      {
        step: {
          type: String,
          required: true,
          trim: true,
        },
        increment: {
          type: Number,
          default: 0,
          min: 0,
        },
        yearsOfService: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    roleMappings: [
      {
        role: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role",
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
salaryGradeSchema.index({ grade: 1 });
salaryGradeSchema.index({ minGrossSalary: 1, maxGrossSalary: 1 });
salaryGradeSchema.index({ isActive: 1 });

// Static method to find grade by gross salary
salaryGradeSchema.statics.findByGrossSalary = function (grossSalary) {
  return this.findOne({
    minGrossSalary: { $lte: grossSalary },
    maxGrossSalary: { $gte: grossSalary },
    isActive: true,
  });
};

// Static method to get all active grades
salaryGradeSchema.statics.getActiveGrades = function () {
  return this.find({ isActive: true }).sort({ minGrossSalary: 1 });
};

// Instance method to calculate total compensation (without steps)
salaryGradeSchema.methods.calculateTotalCompensation = function (baseSalary) {
  const customAllowancesTotal = this.customAllowances.reduce(
    (sum, allowance) => sum + allowance.amount,
    0
  );

  return {
    baseSalary: baseSalary,
    housing: this.allowances.housing,
    transport: this.allowances.transport,
    meal: this.allowances.meal,
    other: this.allowances.other,
    customAllowances: this.customAllowances,
    customAllowancesTotal,
    total:
      baseSalary +
      this.allowances.housing +
      this.allowances.transport +
      this.allowances.meal +
      this.allowances.other +
      customAllowancesTotal,
  };
};

// Pre-save middleware to validate salary ranges
salaryGradeSchema.pre("save", function (next) {
  if (this.minGrossSalary >= this.maxGrossSalary) {
    return next(new Error("Minimum salary must be less than maximum salary"));
  }
  next();
});

const SalaryGrade = mongoose.model("SalaryGrade", salaryGradeSchema);

export default SalaryGrade;
