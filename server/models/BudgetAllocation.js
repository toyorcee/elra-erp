import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const budgetAllocationSchema = new mongoose.Schema(
  {
    // Unique allocation code
    allocationCode: {
      type: String,
      unique: true,
      required: true,
      default: function() {
        return `BA-${uuidv4().substring(0, 8).toUpperCase()}`;
      }
    },

    // Entity reference (dynamic based on allocation type)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: function () {
        return this.allocationType === "project_budget";
      },
    },
    projectCode: {
      type: String,
      required: function () {
        return this.allocationType === "project_budget";
      },
    },
    projectName: {
      type: String,
      required: function () {
        return this.allocationType === "project_budget";
      },
    },

    // Payroll reference (for payroll funding)
    payrollPeriod: {
      type: String,
      required: function () {
        return this.allocationType === "payroll_funding";
      },
    },
    payrollMonth: {
      type: String,
      required: function () {
        return this.allocationType === "payroll_funding";
      },
    },
    payrollYear: {
      type: Number,
      required: function () {
        return this.allocationType === "payroll_funding";
      },
    },

    // Department reference (for operational funding)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return ["operational_funding", "maintenance_funding"].includes(
          this.allocationType
        );
      },
    },

    // Generic entity fields
    entityType: {
      type: String,
      enum: ["project", "payroll", "department", "general"],
      required: true,
    },
    entityName: {
      type: String,
      required: true,
    },
    entityCode: {
      type: String,
      required: true,
    },

    // Allocation details
    allocationType: {
      type: String,
      enum: [
        "project_budget",
        "payroll_funding",
        "operational_funding",
        "capital_expenditure",
        "maintenance_funding",
      ],
      default: "project_budget",
      required: true,
    },
    allocatedAmount: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    previousBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    newBudget: {
      type: Number,
      required: true,
      min: 0,
    },

    // Status and workflow
    status: {
      type: String,
      enum: ["pending", "allocated", "rejected", "cancelled"],
      default: "pending",
      required: true,
    },
    workflowPhase: {
      type: String,
      enum: [
        "pending_allocation",
        "allocation_approved",
        "funds_transferred",
        "procurement_triggered",
        "payroll_processed",
        "completed",
      ],
      default: "pending_allocation",
    },

    // Approval chain (dynamic based on allocation type and amount)
    approvalChain: [
      {
        level: {
          type: String,
          enum: [
            "finance_hod",
            "executive",
            "finance_manager",
            "department_hod",
            "payroll_manager",
          ],
          required: true,
        },
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        comments: {
          type: String,
          trim: true,
        },
        approvedAt: {
          type: Date,
        },
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // User references
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Timestamps
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },

    // Notes and comments
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Financial tracking
    currency: {
      type: String,
      default: "NGN",
      enum: ["NGN", "USD", "EUR", "GBP"],
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },

    // Audit fields
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
budgetAllocationSchema.index({ project: 1, status: 1 });
budgetAllocationSchema.index({ allocatedBy: 1 });
budgetAllocationSchema.index({ status: 1, workflowPhase: 1 });
budgetAllocationSchema.index({ allocationType: 1 });
budgetAllocationSchema.index({ createdAt: -1 });

// Virtual for formatted amount
budgetAllocationSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: this.currency,
  }).format(this.allocatedAmount);
});

// Virtual for allocation duration
budgetAllocationSchema.virtual("allocationDuration").get(function () {
  if (!this.allocatedAt) return null;
  const now = new Date();
  const duration = now - this.allocatedAt;
  return Math.ceil(duration / (1000 * 60 * 60 * 24)); // Days
});

// Instance methods
budgetAllocationSchema.methods.approveAllocation = async function (
  approverId,
  comments = ""
) {
  this.status = "allocated";
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.workflowPhase = "allocation_approved";
  this.notes = comments;

  // Update approval chain
  const pendingApproval = this.approvalChain.find(
    (step) => step.status === "pending"
  );
  if (pendingApproval) {
    pendingApproval.status = "approved";
    pendingApproval.approver = approverId;
    pendingApproval.comments = comments;
    pendingApproval.approvedAt = new Date();
  }

  return this.save();
};

budgetAllocationSchema.methods.rejectAllocation = async function (
  rejectorId,
  reason = ""
) {
  this.status = "rejected";
  this.rejectedBy = rejectorId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;

  // Update approval chain
  const pendingApproval = this.approvalChain.find(
    (step) => step.status === "pending"
  );
  if (pendingApproval) {
    pendingApproval.status = "rejected";
    pendingApproval.approver = rejectorId;
    pendingApproval.comments = reason;
    pendingApproval.approvedAt = new Date();
  }

  return this.save();
};

budgetAllocationSchema.methods.triggerProcurement = async function () {
  this.workflowPhase = "procurement_triggered";
  return this.save();
};

budgetAllocationSchema.methods.triggerPayrollProcessing = async function () {
  this.workflowPhase = "payroll_processed";
  return this.save();
};

// Method to generate approval chain based on allocation type and amount
budgetAllocationSchema.methods.generateApprovalChain = async function () {
  const approvalChain = [];

  // Base approval - Finance HOD
  approvalChain.push({
    level: "finance_hod",
    status: "pending",
    required: true,
  });

  // Add additional approvals based on allocation type and amount
  if (
    this.allocationType === "project_budget" &&
    this.allocatedAmount > 10000000
  ) {
    // Large project budgets need Executive approval
    approvalChain.push({
      level: "executive",
      status: "pending",
      required: true,
    });
  }

  if (this.allocationType === "payroll_funding") {
    // Payroll funding needs Payroll Manager approval
    approvalChain.push({
      level: "payroll_manager",
      status: "pending",
      required: true,
    });
  }

  if (
    ["operational_funding", "maintenance_funding"].includes(this.allocationType)
  ) {
    // Department funding needs Department HOD approval
    approvalChain.push({
      level: "department_hod",
      status: "pending",
      required: true,
    });
  }

  this.approvalChain = approvalChain;
  return this.save();
};

// Static methods
budgetAllocationSchema.statics.findPendingAllocations = function (
  allocationType = null
) {
  const query = { status: "pending" };
  if (allocationType) {
    query.allocationType = allocationType;
  }

  return this.find(query)
    .populate("project", "name code budget projectScope")
    .populate("department", "name code")
    .populate("allocatedBy", "firstName lastName email")
    .sort({ createdAt: -1 });
};

budgetAllocationSchema.statics.findByProject = function (projectId) {
  return this.find({ project: projectId })
    .populate("allocatedBy", "firstName lastName email")
    .populate("approvedBy", "firstName lastName email")
    .sort({ createdAt: -1 });
};

budgetAllocationSchema.statics.findByDepartment = function (departmentId) {
  return this.find({ department: departmentId })
    .populate("allocatedBy", "firstName lastName email")
    .populate("approvedBy", "firstName lastName email")
    .sort({ createdAt: -1 });
};

budgetAllocationSchema.statics.findByPayrollPeriod = function (month, year) {
  return this.find({
    allocationType: "payroll_funding",
    payrollMonth: month,
    payrollYear: year,
  })
    .populate("allocatedBy", "firstName lastName email")
    .populate("approvedBy", "firstName lastName email")
    .sort({ createdAt: -1 });
};

budgetAllocationSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$allocatedAmount" },
      },
    },
  ]);

  const totalStats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalAllocations: { $sum: 1 },
        totalAmount: { $sum: "$allocatedAmount" },
        avgAmount: { $avg: "$allocatedAmount" },
      },
    },
  ]);

  return {
    byStatus: stats,
    totals: totalStats[0] || {
      totalAllocations: 0,
      totalAmount: 0,
      avgAmount: 0,
    },
  };
};

const BudgetAllocation = mongoose.model(
  "BudgetAllocation",
  budgetAllocationSchema
);

export default BudgetAllocation;
