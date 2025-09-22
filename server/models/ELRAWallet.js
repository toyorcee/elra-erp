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
        reserved: {
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
            "reversal",
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
            "sales",
            "marketing",
            "flexible_allocation",
            "fund_addition",
            "system",
          ],
        },
        budgetCategory: {
          type: String,
          enum: ["payroll", "projects", "operational"],
        },
        category: {
          type: String,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        module: {
          type: String,
          enum: ["sales", "marketing"],
        },
        department: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
        requiresExecutiveApproval: {
          type: Boolean,
          default: false,
        },
        requestedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        requestedAt: {
          type: Date,
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        approvedAt: {
          type: Date,
        },
        approvalComments: {
          type: String,
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
          required: false,
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
  createdBy,
  session = null
) {
  console.log(`🔍 [WALLET METHOD] reserveFromCategory called with:`, {
    category,
    amount,
    description,
    reference,
    referenceId,
    referenceType,
    createdBy: createdBy?.toString(),
    hasSession: !!session,
  });

  if (!this.budgetCategories[category]) {
    console.error(`❌ [WALLET METHOD] Invalid budget category: ${category}`);
    throw new Error(`Invalid budget category: ${category}`);
  }

  console.log(`🔍 [WALLET METHOD] Current ${category} budget:`, {
    available: this.budgetCategories[category].available,
    reserved: this.budgetCategories[category].reserved,
    required: amount,
  });

  if (this.budgetCategories[category].available < amount) {
    console.error(`❌ [WALLET METHOD] Insufficient funds:`, {
      available: this.budgetCategories[category].available,
      required: amount,
    });
    throw new Error(
      `Insufficient ${category} funds for reservation. Available: ₦${this.budgetCategories[
        category
      ].available.toLocaleString()}, Required: ₦${amount.toLocaleString()}`
    );
  }

  console.log(`💰 [WALLET METHOD] BEFORE UPDATE:`, {
    categoryAvailable: this.budgetCategories[category].available,
    categoryReserved: this.budgetCategories[category].reserved,
    totalReservedFunds: this.reservedFunds,
    totalAvailableFunds: this.availableFunds,
  });

  // Update category reservation
  this.budgetCategories[category].available -= amount;
  this.budgetCategories[category].reserved += amount;

  // Update overall wallet
  this.reservedFunds += amount;

  console.log(`💰 [WALLET METHOD] AFTER UPDATE:`, {
    categoryAvailable: this.budgetCategories[category].available,
    categoryReserved: this.budgetCategories[category].reserved,
    totalReservedFunds: this.reservedFunds,
    totalAvailableFunds: this.availableFunds,
  });

  // Add transaction
  const transaction = {
    type: "allocation",
    amount,
    description: `Reserved from ${category}: ${description}`,
    reference,
    referenceId,
    referenceType,
    createdBy,
    balanceAfter: this.availableFunds,
    date: new Date(),
  };

  this.transactions.push(transaction);

  console.log(`📝 [WALLET METHOD] Added transaction:`, {
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    reference: transaction.reference,
    referenceType: transaction.referenceType,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = createdBy;

  console.log(`💾 [WALLET METHOD] Saving wallet with session:`, !!session);
  return this.save({ session });
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
  // Determine which budget category to use based on allocation type
  let budgetCategory;
  if (allocationType === "project_budget") {
    budgetCategory = "projects";
  } else if (allocationType === "payroll_funding") {
    budgetCategory = "payroll";
  } else if (allocationType === "operational_funding") {
    budgetCategory = "operational";
  } else {
    // Fallback to main wallet for unknown types
    budgetCategory = null;
  }

  // Check funds availability based on budget category
  if (budgetCategory) {
    const category = this.budgetCategories[budgetCategory];
    if (!category) {
      throw new Error(`Budget category ${budgetCategory} not found`);
    }

    if (category.available < amount) {
      throw new Error(
        `Insufficient funds in ${budgetCategory} budget category. Available: ₦${category.available.toLocaleString()}, Required: ₦${amount.toLocaleString()}`
      );
    }

    // Deduct from specific budget category
    category.available -= amount;
    category.reserved += amount;

    console.log(
      `💰 [BUDGET ALLOCATION] Reserved ₦${amount.toLocaleString()} from ${budgetCategory} budget category`
    );
  } else {
    // Fallback to main wallet
    if (this.availableFunds < amount) {
      throw new Error("Insufficient funds available for allocation");
    }
    this.availableFunds -= amount;
    this.reservedFunds += amount;
  }

  this.allocations.push({
    allocationId,
    allocationType,
    amount,
    status: "pending",
    budgetCategory: budgetCategory, // Store which category was used
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
    balanceAfter: budgetCategory
      ? this.budgetCategories[budgetCategory].available
      : this.availableFunds,
    budgetCategory: budgetCategory,
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

  // Handle fund movement based on budget category
  if (allocation.budgetCategory) {
    // Move from reserved to used in specific budget category
    const category = this.budgetCategories[allocation.budgetCategory];
    if (!category) {
      throw new Error(`Budget category ${allocation.budgetCategory} not found`);
    }

    category.reserved -= allocation.amount;
    category.used += allocation.amount;

    console.log(
      `✅ [BUDGET APPROVAL] Moved ₦${allocation.amount.toLocaleString()} from ${
        allocation.budgetCategory
      }.reserved to ${allocation.budgetCategory}.used`
    );
  } else {
    // Fallback to main wallet movement
    this.reservedFunds -= allocation.amount;
    this.allocatedFunds += allocation.amount;
  }

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
    balanceAfter: allocation.budgetCategory
      ? this.budgetCategories[allocation.budgetCategory].available
      : this.availableFunds,
    budgetCategory: allocation.budgetCategory,
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

  // Return funds to available based on budget category
  if (allocation.budgetCategory) {
    // Return from reserved to available in specific budget category
    const category = this.budgetCategories[allocation.budgetCategory];
    if (!category) {
      throw new Error(`Budget category ${allocation.budgetCategory} not found`);
    }

    category.reserved -= allocation.amount;
    category.available += allocation.amount;

    console.log(
      `❌ [BUDGET REJECTION] Returned ₦${allocation.amount.toLocaleString()} from ${
        allocation.budgetCategory
      }.reserved to ${allocation.budgetCategory}.available`
    );
  } else {
    // Fallback to main wallet movement
    this.reservedFunds -= allocation.amount;
    this.availableFunds += allocation.amount;
  }

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
    balanceAfter: allocation.budgetCategory
      ? this.budgetCategories[allocation.budgetCategory].available
      : this.availableFunds,
    budgetCategory: allocation.budgetCategory,
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

// Method to add funds with flexible budget allocation
companyWalletSchema.methods.addFundsWithAllocation = function (
  totalAmount,
  allocations,
  description,
  reference,
  createdBy
) {
  // Validate allocations
  const validCategories = ["payroll", "projects", "operational"];
  let totalAllocated = 0;

  for (const allocation of allocations) {
    if (!validCategories.includes(allocation.category)) {
      throw new Error(`Invalid budget category: ${allocation.category}`);
    }
    if (allocation.amount <= 0) {
      throw new Error(
        `Invalid amount for ${allocation.category}: ${allocation.amount}`
      );
    }
    totalAllocated += allocation.amount;
  }

  if (totalAllocated > totalAmount) {
    throw new Error(
      `Total allocations (₦${totalAllocated.toLocaleString()}) cannot exceed total amount (₦${totalAmount.toLocaleString()})`
    );
  }

  // Add total amount to wallet
  this.totalFunds += totalAmount;
  this.allocatedFunds += totalAllocated;
  const remainingAmount = totalAmount - totalAllocated;
  this.availableFunds += remainingAmount;

  // Allocate to specific categories
  for (const allocation of allocations) {
    const category = this.budgetCategories[allocation.category];
    category.allocated += allocation.amount;
    category.available += allocation.amount;

    // Create transaction for each allocation
    this.transactions.push({
      type: "allocation",
      amount: allocation.amount,
      description: `Allocated to ${allocation.category}: ${description}`,
      reference: `${reference}-${allocation.category}`,
      referenceId: null,
      referenceType: "flexible_allocation",
      createdBy,
      balanceAfter: this.availableFunds,
      budgetCategory: allocation.category,
    });
  }

  // Create main transaction for the total amount
  this.transactions.push({
    type: "deposit",
    amount: totalAmount,
    description: `Funds added with flexible allocation: ${description}`,
    reference,
    referenceId: null,
    referenceType: "fund_addition",
    createdBy,
    balanceAfter: this.availableFunds,
  });

  this.metadata.lastUpdated = new Date();
  this.metadata.lastUpdatedBy = createdBy;

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
