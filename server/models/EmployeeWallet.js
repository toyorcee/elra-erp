import mongoose from "mongoose";

const employeeWalletSchema = new mongoose.Schema(
  {
    // Employee reference
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },

    // Wallet balance
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Currency
    currency: {
      type: String,
      default: "NGN",
      required: true,
    },

    // Wallet type
    walletType: {
      type: String,
      enum: ["project_extra_funds", "general", "bonus"],
      default: "project_extra_funds",
      required: true,
    },

    // Transaction history
    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit", "transfer"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        reference: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["active", "suspended", "closed"],
      default: "active",
    },

    // Metadata
    metadata: {
      projectName: String,
      projectCode: String,
      department: String,
      createdFromBudgetAllocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BudgetAllocation",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
employeeWalletSchema.index({ employee: 1, project: 1 });
employeeWalletSchema.index({ employee: 1, walletType: 1 });
employeeWalletSchema.index({ status: 1 });

// Virtual for formatted balance
employeeWalletSchema.virtual("formattedBalance").get(function () {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: this.currency,
  }).format(this.balance);
});

// Method to add funds
employeeWalletSchema.methods.addFunds = function (
  amount,
  description,
  reference,
  createdBy
) {
  this.balance += amount;
  this.transactions.push({
    type: "credit",
    amount,
    description,
    reference,
    createdBy,
    date: new Date(),
  });
  return this.save();
};

// Method to deduct funds
employeeWalletSchema.methods.deductFunds = function (
  amount,
  description,
  reference,
  createdBy
) {
  if (this.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }
  this.balance -= amount;
  this.transactions.push({
    type: "debit",
    amount,
    description,
    reference,
    createdBy,
    date: new Date(),
  });
  return this.save();
};

// Static method to get or create wallet
employeeWalletSchema.statics.getOrCreateWallet = async function (
  employeeId,
  projectId = null,
  walletType = "project_extra_funds"
) {
  let wallet = await this.findOne({
    employee: employeeId,
    project: projectId,
    walletType,
    status: "active",
  });

  if (!wallet) {
    wallet = new this({
      employee: employeeId,
      project: projectId,
      walletType,
      balance: 0,
      currency: "NGN",
    });
    await wallet.save();
  }

  return wallet;
};

// Pre-save middleware
employeeWalletSchema.pre("save", function (next) {
  // Ensure balance is never negative
  if (this.balance < 0) {
    this.balance = 0;
  }
  next();
});

export default mongoose.model("EmployeeWallet", employeeWalletSchema);
