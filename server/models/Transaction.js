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

    // Company and subscription details
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },

    // Transaction details
    type: {
      type: String,
      enum: [
        "subscription",
        "renewal",
        "upgrade",
        "downgrade",
        "refund",
        "adjustment",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    description: {
      type: String,
      required: true,
    },

    // Payment provider details
    paymentProvider: {
      type: String,
      enum: ["paystack", "stripe", "paypal", "manual"],
      required: true,
    },
    paymentMethod: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },

    // Billing details
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    billingPeriod: {
      startDate: Date,
      endDate: Date,
    },

    // Plan details at time of transaction
    planDetails: {
      name: String,
      displayName: String,
      price: {
        monthly: Number,
        yearly: Number,
      },
      features: mongoose.Schema.Types.Mixed,
    },

    // Metadata
    metadata: {
      adminEmail: String,
      companyEmail: String,
      adminName: String,
      companyName: String,
      customFields: mongoose.Schema.Types.Mixed,
    },

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: Date,

    // Email tracking
    emailsSent: [
      {
        type: {
          type: String,
          enum: [
            "admin_invitation",
            "company_billing",
            "payment_confirmation",
            "renewal_reminder",
            "payment_failed",
          ],
        },
        recipient: String,
        sentAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["sent", "delivered", "failed"],
          default: "sent",
        },
        messageId: String,
      },
    ],

    // Notes and comments
    notes: String,
    internalNotes: String,

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
transactionSchema.index({ company: 1, createdAt: -1 });
transactionSchema.index({ subscription: 1, createdAt: -1 });
transactionSchema.index({ paymentStatus: 1, createdAt: -1 });
transactionSchema.index({ "billingPeriod.endDate": 1 });

// Pre-save middleware
transactionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
transactionSchema.methods.isSuccessful = function () {
  return this.paymentStatus === "completed";
};

transactionSchema.methods.isPending = function () {
  return this.paymentStatus === "pending";
};

transactionSchema.methods.isFailed = function () {
  return this.paymentStatus === "failed";
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
  return `TXN_${timestamp}_${random}`;
};

transactionSchema.statics.generateReference = function () {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EDMS_${timestamp}_${random}`;
};

// Get transaction statistics
transactionSchema.statics.getStatistics = async function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0] },
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "failed"] }, 1, 0] },
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return (
    result[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
    }
  );
};

// Get revenue by period
transactionSchema.statics.getRevenueByPeriod = async function (
  startDate,
  endDate,
  groupBy = "month"
) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "completed",
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$amount" },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ];

  return await this.aggregate(pipeline);
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
