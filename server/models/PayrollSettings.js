import mongoose from "mongoose";

const payrollSettingsSchema = new mongoose.Schema(
  {
    // Payroll processing day (same day for processing and payment)
    processingDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
      default: 25, // 25th of every month
    },

    // Nigerian statutory rates
    // PAYE will be calculated using tax brackets, not flat rate

    pensionEmployeeRate: {
      type: Number,
      default: 8, // 8% employee contribution
      min: 0,
      max: 100,
    },

    pensionEmployerRate: {
      type: Number,
      default: 10, // 10% employer contribution
      min: 0,
      max: 100,
    },

    nhisEmployeeRate: {
      type: Number,
      default: 5, // 5% employee contribution
      min: 0,
      max: 100,
    },

    nhisEmployerRate: {
      type: Number,
      default: 10, // 10% employer contribution
      min: 0,
      max: 100,
    },

    // Tax threshold
    taxThreshold: {
      type: Number,
      default: 30000, // Minimum salary for tax
      min: 0,
    },

    // System settings
    isActive: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
payrollSettingsSchema.index({ isActive: 1 });

// Static method to get active settings
payrollSettingsSchema.statics.getActiveSettings = function () {
  return this.findOne({ isActive: true });
};

const PayrollSettings = mongoose.model(
  "PayrollSettings",
  payrollSettingsSchema
);

export default PayrollSettings;
