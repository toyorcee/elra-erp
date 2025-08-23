import mongoose from "mongoose";

const financeSchema = new mongoose.Schema(
  {
    // Basic Transaction Information
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Transaction Type and Category
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        // Income categories
        "lease_revenue",
        "project_income",
        "service_fees",
        "interest_income",
        "other_income",

        // Expense categories
        "maintenance_costs",
        "procurement_costs",
        "project_expenses",
        "operational_costs",
        "salary_expenses",
        "insurance_costs",
        "utility_costs",
        "other_expenses",
      ],
    },

    // Transaction Status
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "cancelled", "overdue"],
      default: "pending",
      required: true,
    },

    // Financial Information (in Naira)
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Transaction Date
    transactionDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    paymentDate: {
      type: Date,
    },

    // Related Entities
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    relatedInventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    },
    relatedProcurement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Procurement",
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },

    // Customer/Supplier Information
    customer: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
      },
    },
    supplier: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
      },
    },

    // Invoice Information
    invoice: {
      invoiceNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
      invoiceDate: {
        type: Date,
      },
      dueDate: {
        type: Date,
      },
      items: [
        {
          description: {
            type: String,
            required: true,
            trim: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          unitPrice: {
            type: Number,
            required: true,
            min: 0,
          },
          totalPrice: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
    },

    // Payment Information
    payments: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        paymentDate: {
          type: Date,
          required: true,
        },
        paymentMethod: {
          type: String,
          enum: ["cash", "bank_transfer", "cheque", "card", "mobile_money"],
          required: true,
        },
        reference: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
        },
        recordedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],

    // Approval Information
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedDate: {
      type: Date,
    },
    approvalNotes: {
      type: String,
      trim: true,
    },

    // Notes and Comments
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isPrivate: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Documents
    documents: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ["invoice", "receipt", "contract", "quote", "other"],
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
financeSchema.index({ company: 1, type: 1 });
financeSchema.index({ company: 1, category: 1 });
financeSchema.index({ company: 1, status: 1 });
financeSchema.index({ transactionNumber: 1 }, { unique: true });
financeSchema.index({ transactionDate: 1 });
financeSchema.index({ dueDate: 1 });

// Virtual for outstanding amount
financeSchema.virtual("outstandingAmount").get(function () {
  return this.totalAmount - this.paidAmount;
});

// Virtual for payment status
financeSchema.virtual("paymentStatus").get(function () {
  if (this.paidAmount === 0) return "unpaid";
  if (this.paidAmount >= this.totalAmount) return "paid";
  return "partial";
});

// Virtual for overdue status
financeSchema.virtual("isOverdue").get(function () {
  if (this.status === "completed" || this.status === "cancelled") return false;
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Virtual for days overdue
financeSchema.virtual("daysOverdue").get(function () {
  if (!this.isOverdue) return 0;
  return Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate transaction number if not provided
financeSchema.pre("save", async function (next) {
  if (!this.transactionNumber) {
    const count = await this.constructor.countDocuments({
      company: this.company,
    });
    this.transactionNumber = `FIN${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Pre-save middleware to calculate totals
financeSchema.pre("save", function (next) {
  // Calculate total amount
  this.totalAmount = this.amount + this.tax;

  // Calculate paid amount from payments
  this.paidAmount = this.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  next();
});

// Static method to get financial statistics
financeSchema.statics.getFinancialStats = async function (
  companyId,
  startDate,
  endDate
) {
  const match = { company: companyId, isActive: true };
  if (startDate && endDate) {
    match.transactionDate = { $gte: startDate, $lte: endDate };
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        paidAmount: { $sum: "$paidAmount" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
      paidAmount: stat.paidAmount,
      outstandingAmount: stat.totalAmount - stat.paidAmount,
    };
    return acc;
  }, {});
};

// Static method to get revenue statistics
financeSchema.statics.getRevenueStats = async function (
  companyId,
  startDate,
  endDate
) {
  const match = {
    company: companyId,
    isActive: true,
    type: "income",
  };
  if (startDate && endDate) {
    match.transactionDate = { $gte: startDate, $lte: endDate };
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        paidAmount: { $sum: "$paidAmount" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
      paidAmount: stat.paidAmount,
      outstandingAmount: stat.totalAmount - stat.paidAmount,
    };
    return acc;
  }, {});
};

// Static method to get expense statistics
financeSchema.statics.getExpenseStats = async function (
  companyId,
  startDate,
  endDate
) {
  const match = {
    company: companyId,
    isActive: true,
    type: "expense",
  };
  if (startDate && endDate) {
    match.transactionDate = { $gte: startDate, $lte: endDate };
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        paidAmount: { $sum: "$paidAmount" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
      paidAmount: stat.paidAmount,
      outstandingAmount: stat.totalAmount - stat.paidAmount,
    };
    return acc;
  }, {});
};

// Static method to get overdue transactions
financeSchema.statics.getOverdueTransactions = function (companyId) {
  return this.find({
    company: companyId,
    isActive: true,
    dueDate: { $lt: new Date() },
    status: { $nin: ["completed", "cancelled"] },
  })
    .populate("createdBy", "firstName lastName")
    .populate("relatedProject", "name code")
    .populate("relatedInventory", "name code")
    .sort({ dueDate: 1 });
};

// Static method to get pending approvals
financeSchema.statics.getPendingApprovals = function (companyId) {
  return this.find({ company: companyId, isActive: true, status: "pending" })
    .populate("createdBy", "firstName lastName")
    .populate("relatedProject", "name code")
    .sort({ transactionDate: 1 });
};

// Instance method to approve transaction
financeSchema.methods.approve = async function (approvedBy, notes = "") {
  this.status = "approved";
  this.approvedBy = approvedBy;
  this.approvedDate = new Date();
  this.approvalNotes = notes;

  await this.save();
};

// Instance method to add payment
financeSchema.methods.addPayment = async function (
  amount,
  paymentMethod,
  reference = "",
  notes = "",
  recordedBy
) {
  this.payments.push({
    amount,
    paymentDate: new Date(),
    paymentMethod,
    reference,
    notes,
    recordedBy,
  });

  // Update paid amount
  this.paidAmount = this.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Update status if fully paid
  if (this.paidAmount >= this.totalAmount) {
    this.status = "completed";
    this.paymentDate = new Date();
  }

  await this.save();
};

// Instance method to add note
financeSchema.methods.addNote = async function (
  content,
  authorId,
  isPrivate = false
) {
  this.notes.push({
    content,
    author: authorId,
    isPrivate,
    createdAt: new Date(),
  });

  await this.save();
};

// Instance method to get financial summary
financeSchema.methods.getSummary = function () {
  return {
    id: this._id,
    transactionNumber: this.transactionNumber,
    title: this.title,
    type: this.type,
    category: this.category,
    status: this.status,
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    outstandingAmount: this.outstandingAmount,
    paymentStatus: this.paymentStatus,
    isOverdue: this.isOverdue,
    daysOverdue: this.daysOverdue,
    transactionDate: this.transactionDate,
    dueDate: this.dueDate,
    paymentDate: this.paymentDate,
  };
};

const Finance = mongoose.model("Finance", financeSchema);

export default Finance;
