import mongoose from "mongoose";

const salesFinancialTransactionSchema = new mongoose.Schema(
  {
    // Basic Info
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    // Transaction Type & Direction
    type: {
      type: String,
      enum: ["expense", "revenue"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },

    // Financial Details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },

    // Sales-specific Categories
    category: {
      type: String,
      required: true,
      enum: [
        // Revenue categories
        "product_sales",
        "service_sales",
        "consulting",
        "subscriptions",
        "commissions",
        "partnerships",
        // Expense categories
        "sales_tools",
        "crm_software",
        "sales_training",
        "client_entertainment",
        "travel",
        "conferences",
        "sales_materials",
        "lead_generation",
        "other",
      ],
    },

    // Department & Module
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    module: {
      type: String,
      default: "sales",
      enum: ["sales"],
    },

    // Approval Workflow
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed", "cancelled"],
      default: "pending",
    },
    approvalLevel: {
      type: String,
      enum: ["department", "finance", "executive"],
      required: true,
    },

    // Budget Integration (for expenses)
    budgetCategory: {
      type: String,
      enum: ["operational", "projects"],
      required: function () {
        return this.type === "expense";
      },
    },
    budgetReservationId: {
      type: String,
    },

    // People
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Sales-specific fields
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    clientName: {
      type: String,
    },
    salesRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dealId: {
      type: String,
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
    },

    // Payment Information
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "check", "card", "crypto", "other"],
    },
    paymentReference: {
      type: String,
    },

    // Supporting Documents
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Dates
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: Date,
    processedAt: Date,
    dueDate: Date,
    expectedDate: Date, // For revenue

    // Metadata
    tags: [String],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: String,

    // Integration
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    // Audit
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
salesFinancialTransactionSchema.index({ transactionId: 1 });
salesFinancialTransactionSchema.index({ type: 1, status: 1 });
salesFinancialTransactionSchema.index({ department: 1, createdAt: -1 });
salesFinancialTransactionSchema.index({ requestedBy: 1, createdAt: -1 });
salesFinancialTransactionSchema.index({ clientId: 1, createdAt: -1 });

// Pre-save middleware
salesFinancialTransactionSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-set direction based on type
  if (this.type === "revenue") {
    this.direction = "in";
  } else if (this.type === "expense") {
    this.direction = "out";
  }

  next();
});

// Static methods
salesFinancialTransactionSchema.statics.generateTransactionId = function () {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SALES_${timestamp}_${random}`;
};

// Instance methods
salesFinancialTransactionSchema.methods.calculateCommission = function () {
  if (this.type === "revenue" && this.commissionRate && this.amount) {
    this.commissionAmount = (this.amount * this.commissionRate) / 100;
  }
  return this.commissionAmount;
};

const SalesFinancialTransaction = mongoose.model(
  "SalesFinancialTransaction",
  salesFinancialTransactionSchema
);

export default SalesFinancialTransaction;
