import mongoose from "mongoose";

const companyWalletSchema = new mongoose.Schema(
  {
    // ELRA reference (since this is ELRA's system)
    elraInstance: {
      type: String,
      default: "ELRA_MAIN",
      required: true,
    },

    // Financial totals
    totalFunds: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    allocatedFunds: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    availableFunds: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    reservedFunds: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Budget categories for proper fund allocation
    budgetCategories: {
      payroll: {
        allocated: {
          type: Number,
          default: 0,
          min: 0,
        },
        used: {
          type: Number,
          default: 0,
          min: 0,
        },
        available: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      projects: {
        allocated: {
          type: Number,
          default: 0,
          min: 0,
        },
        used: {
          type: Number,
          default: 0,
          min: 0,
        },
        available: {
          type: Number,
          default: 0,
          min: 0,
        },
        reserved: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      operational: {
        allocated: {
          type: Number,
          default: 0,
          min: 0,
        },
        used: {
          type: Number,
          default: 0,
          min: 0,
        },
        available: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    },

    // Currency
    currency: {
      type: String,
      default: "NGN",
      required: true,
    },

    // Management
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Transaction history
    transactions: [
      {
        type: {
          type: String,
          enum: [
            "deposit",
            "withdrawal",
            "allocation",
            "approval",
            "rejection",
          ],
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
        referenceId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        referenceType: {
          type: String,
          enum: [
            "project",
            "payroll",
            "operational",
            "general",
            "direct_allocation",
            "budget_allocation",
          ],
        },
        date: {
          type: Date,
          default: Date.now,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        balanceAfter: {
          type: Number,
          required: true,
        },
      },
    ],

    // Allocation tracking
    allocations: [
      {
        allocationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BudgetAllocation",
          required: true,
        },
        allocationType: {
          type: String,
          enum: ["project_budget", "payroll_funding", "operational_funding"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "cancelled"],
          default: "pending",
        },
        allocatedAt: {
          type: Date,
          default: Date.now,
        },
        approvedBy: {
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
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
companyWalletSchema.index({ elraInstance: 1 });
companyWalletSchema.index({ managedBy: 1 });
companyWalletSchema.index({ "transactions.date": -1 });
companyWalletSchema.index({ "allocations.status": 1 });

// Virtual for current balance calculation
companyWalletSchema.virtual("currentBalance").get(function () {
  return this.availableFunds;
});

// Method to add funds
companyWalletSchema.methods.addFunds = function (
  amount,
  description,
  reference,
  referenceId,
  referenceType,
  createdBy
) {
  this.totalFunds += amount;
  this.availableFunds += amount;

  this.transactions.push({
    type: "deposit",
    amount,
    description,
    reference,
    referenceId,
    referenceType,
    createdBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = createdBy;

  return this.save();
};

// Method to add funds directly to a budget category (skip main pool)
companyWalletSchema.methods.addFundsDirectToCategory = function (
  category,
  amount,
  description,
  reference,
  createdBy
) {
  if (!this.budgetCategories[category]) {
    throw new Error(`Invalid budget category: ${category}`);
  }

  this.totalFunds += amount;
  this.budgetCategories[category].allocated += amount;
  this.budgetCategories[category].available += amount;

  // Create single transaction for direct allocation
  this.transactions.push({
    type: "allocation",
    amount,
    description: `Allocated to ${category}: ${description}`,
    reference,
    referenceId: null,
    referenceType: "direct_allocation",
    createdBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = createdBy;

  return this.save();
};

// Method to allocate funds to a specific budget category
companyWalletSchema.methods.allocateToCategory = function (
  category,
  amount,
  description,
  reference,
  referenceId,
  referenceType,
  createdBy
) {
  if (!this.budgetCategories[category]) {
    throw new Error(`Invalid budget category: ${category}`);
  }

  if (this.availableFunds < amount) {
    throw new Error(
      `Insufficient available funds. Available: ₦${this.availableFunds.toLocaleString()}, Required: ₦${amount.toLocaleString()}`
    );
  }

  // Update category allocation
  this.budgetCategories[category].allocated += amount;
  this.budgetCategories[category].available += amount;

  // Update overall wallet
  this.allocatedFunds += amount;
  this.availableFunds -= amount;

  // Add transaction
  this.transactions.push({
    type: "allocation",
    amount,
    description: `Allocated to ${category}: ${description}`,
    reference,
    referenceId,
    referenceType,
    createdBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = createdBy;

  return this.save();
};

// Method to use funds from a specific budget category
companyWalletSchema.methods.useFromCategory = function (
  category,
  amount,
  description,
  reference,
  referenceId,
  referenceType,
  createdBy
) {
  if (!this.budgetCategories[category]) {
    throw new Error(`Invalid budget category: ${category}`);
  }

  if (this.budgetCategories[category].available < amount) {
    throw new Error(
      `Insufficient ${category} funds. Available: ₦${this.budgetCategories[
        category
      ].available.toLocaleString()}, Required: ₦${amount.toLocaleString()}`
    );
  }

  // Update category usage
  this.budgetCategories[category].used += amount;
  this.budgetCategories[category].available -= amount;

  // Update overall wallet
  this.allocatedFunds -= amount;

  // Add transaction
  this.transactions.push({
    type: "withdrawal",
    amount,
    description: `Used from ${category}: ${description}`,
    reference,
    referenceId,
    referenceType,
    createdBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = createdBy;

  return this.save();
};

// Method to reserve funds for a specific purpose (e.g., approved projects)
companyWalletSchema.methods.reserveFromCategory = function (
  category,
  amount,
  description,
  reference,
  referenceId,
  referenceType,
  createdBy
) {
  if (!this.budgetCategories[category]) {
    throw new Error(`Invalid budget category: ${category}`);
  }

  if (this.budgetCategories[category].available < amount) {
    throw new Error(
      `Insufficient ${category} funds for reservation. Available: ₦${this.budgetCategories[
        category
      ].available.toLocaleString()}, Required: ₦${amount.toLocaleString()}`
    );
  }

  // Update category reservation
  this.budgetCategories[category].available -= amount;
  this.budgetCategories[category].reserved += amount;

  // Update overall wallet
  this.reservedFunds += amount;

  // Add transaction
  this.transactions.push({
    type: "allocation",
    amount,
    description: `Reserved from ${category}: ${description}`,
    reference,
    referenceId,
    referenceType,
    createdBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = createdBy;

  return this.save();
};

// Simplified - no frequency limit methods needed

// Method to allocate funds (reserve for approval)
companyWalletSchema.methods.allocateFunds = function (
  amount,
  description,
  allocationId,
  allocationType,
  createdBy
) {
  if (this.availableFunds < amount) {
    throw new Error("Insufficient funds available for allocation");
  }

  this.availableFunds -= amount;
  this.reservedFunds += amount;

  this.allocations.push({
    allocationId,
    allocationType,
    amount,
    status: "pending",
  });

  this.transactions.push({
    type: "allocation",
    amount: -amount,
    description,
    reference: allocationId,
    referenceId: allocationId,
    referenceType:
      allocationType === "project_budget"
        ? "project"
        : allocationType === "payroll_funding"
        ? "payroll"
        : "operational",
    createdBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = createdBy;

  return this.save();
};

// Method to approve allocation
companyWalletSchema.methods.approveAllocation = function (
  allocationId,
  approvedBy
) {
  const allocation = this.allocations.find(
    (alloc) => alloc.allocationId.toString() === allocationId.toString()
  );

  if (!allocation) {
    throw new Error("Allocation not found");
  }

  if (allocation.status !== "pending") {
    throw new Error("Allocation is not pending approval");
  }

  // Move from reserved to allocated
  this.reservedFunds -= allocation.amount;
  this.allocatedFunds += allocation.amount;

  allocation.status = "approved";
  allocation.approvedBy = approvedBy;

  this.transactions.push({
    type: "approval",
    amount: allocation.amount,
    description: `Approved ${allocation.allocationType} allocation`,
    reference: allocationId,
    referenceId: allocationId,
    referenceType:
      allocation.allocationType === "project_budget"
        ? "project"
        : allocation.allocationType === "payroll_funding"
        ? "payroll"
        : "operational",
    createdBy: approvedBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = approvedBy;

  return this.save();
};

// Method to reject allocation
companyWalletSchema.methods.rejectAllocation = function (
  allocationId,
  reason,
  rejectedBy
) {
  const allocation = this.allocations.find(
    (alloc) => alloc.allocationId.toString() === allocationId.toString()
  );

  if (!allocation) {
    throw new Error("Allocation not found");
  }

  if (allocation.status !== "pending") {
    throw new Error("Allocation is not pending approval");
  }

  // Return funds to available
  this.reservedFunds -= allocation.amount;
  this.availableFunds += allocation.amount;

  allocation.status = "rejected";

  this.transactions.push({
    type: "rejection",
    amount: allocation.amount,
    description: `Rejected ${allocation.allocationType} allocation: ${reason}`,
    reference: allocationId,
    referenceId: allocationId,
    referenceType:
      allocation.allocationType === "project_budget"
        ? "project"
        : allocation.allocationType === "payroll_funding"
        ? "payroll"
        : "operational",
    createdBy: rejectedBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = rejectedBy;

  return this.save();
};

// Method to process payroll (use reserved funds from payroll budget)
companyWalletSchema.methods.processPayroll = function (
  amount,
  payrollPeriod,
  processedBy
) {
  const payrollBudget = this.budgetCategories?.payroll;

  if (!payrollBudget) {
    throw new Error("Payroll budget category not initialized");
  }

  if (payrollBudget.reserved < amount) {
    throw new Error(
      `Insufficient reserved payroll funds. Reserved: ₦${payrollBudget.reserved.toLocaleString()}, Required: ₦${amount.toLocaleString()}`
    );
  }

  // Update payroll budget - move from reserved to used
  payrollBudget.reserved -= amount;
  payrollBudget.used += amount;

  // Update overall wallet
  this.reservedFunds -= amount;
  this.totalFunds -= amount;

  this.transactions.push({
    type: "withdrawal",
    amount: -amount,
    description: `Payroll processed for ${payrollPeriod}`,
    reference: payrollPeriod,
    referenceType: "payroll",
    createdBy: processedBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = processedBy;

  return this.save();
};

// Static method to get or create ELRA wallet
companyWalletSchema.statics.getOrCreateWallet = async function (
  elraInstance = "ELRA_MAIN",
  managedBy
) {
  let wallet = await this.findOne({
    elraInstance,
    status: "active",
  });

  if (!wallet) {
    wallet = new this({
      elraInstance,
      managedBy,
      totalFunds: 0,
      allocatedFunds: 0,
      availableFunds: 0,
      reservedFunds: 0,
      currency: "NGN",
    });
    await wallet.save();
  }

  return wallet;
};

// Pre-save middleware to ensure mathematical consistency
companyWalletSchema.pre("save", function (next) {
  // Ensure mathematical consistency
  const calculatedAvailable =
    this.totalFunds - this.allocatedFunds - this.reservedFunds;

  if (Math.abs(this.availableFunds - calculatedAvailable) > 0.01) {
    console.warn(
      `Wallet balance inconsistency detected. Available: ${this.availableFunds}, Calculated: ${calculatedAvailable}`
    );
    this.availableFunds = calculatedAvailable;
  }

  // Ensure no negative values
  this.totalFunds = Math.max(0, this.totalFunds);
  this.allocatedFunds = Math.max(0, this.allocatedFunds);
  this.availableFunds = Math.max(0, this.availableFunds);
  this.reservedFunds = Math.max(0, this.reservedFunds);

  // Ensure budget categories consistency
  if (this.budgetCategories) {
    Object.keys(this.budgetCategories).forEach((category) => {
      const cat = this.budgetCategories[category];
      if (cat) {
        cat.allocated = Math.max(0, cat.allocated || 0);
        cat.used = Math.max(0, cat.used || 0);
        cat.available = Math.max(0, cat.available || 0);
        cat.reserved = Math.max(0, cat.reserved || 0);
      }
    });
  }

  next();
});

export default mongoose.model("ELRAWallet", companyWalletSchema);
