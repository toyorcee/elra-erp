import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // Transaction identification
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    // Procurement payment details
    procurementOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Procurement",
      required: true,
    },
    supplier: {
      name: String,
      email: String,
      contactPerson: String,
      phone: String,
    },

    // Transaction details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    description: {
      type: String,
      required: true,
    },

    // Payment details
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "check", "manual", "other"],
      default: "manual",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "completed",
    },

    // Audit trail
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },

    // Notes
    notes: String,

    // Timestamps
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

// Indexes for efficient queries
transactionSchema.index({ procurementOrder: 1, createdAt: -1 });
transactionSchema.index({ paymentStatus: 1, createdAt: -1 });
transactionSchema.index({ processedBy: 1, createdAt: -1 });

// Pre-save middleware
transactionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
transactionSchema.methods.isSuccessful = function () {
  return this.paymentStatus === "completed";
};

transactionSchema.methods.getFormattedAmount = function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: this.currency,
  }).format(this.amount);
};

// Static methods
transactionSchema.statics.generateTransactionId = function () {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY_${timestamp}_${random}`;
};

transactionSchema.statics.generateReference = function () {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PROC_${timestamp}_${random}`;
};

// Create procurement payment transaction
transactionSchema.statics.createProcurementPayment = async function (
  paymentData
) {
  const transaction = new this({
    transactionId: this.generateTransactionId(),
    reference: this.generateReference(),
    procurementOrder: paymentData.procurementOrder,
    supplier: paymentData.supplier,
    amount: paymentData.amount,
    currency: paymentData.currency || "NGN",
    description: paymentData.description,
    paymentMethod: paymentData.paymentMethod || "manual",
    paymentStatus: "completed",
    processedBy: paymentData.processedBy,
    processedAt: new Date(),
    notes: paymentData.notes,
  });

  return await transaction.save();
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
