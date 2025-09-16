import mongoose from "mongoose";

const payrollApprovalSchema = new mongoose.Schema(
  {
    // Basic approval info
    approvalId: {
      type: String,
      required: true,
      unique: true,
    },

    // Payroll data
    payrollData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Period information
    period: {
      month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: true,
      },
      monthName: {
        type: String,
        required: true,
      },
    },

    // Scope information
    scope: {
      type: {
        type: String,
        enum: ["company", "department", "individual"],
        required: true,
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
      },
    },

    // Financial summary
    financialSummary: {
      totalEmployees: {
        type: Number,
        required: true,
      },
      totalGrossPay: {
        type: Number,
        required: true,
      },
      totalNetPay: {
        type: Number,
        required: true,
      },
      totalDeductions: {
        type: Number,
        required: true,
      },
      totalTax: {
        type: Number,
        required: true,
      },
    },

    // Approval workflow
    approvalStatus: {
      type: String,
      enum: [
        "pending_finance",
        "approved_finance",
        "approved_hr",
        "rejected",
        "processed",
      ],
      default: "pending_finance",
    },

    // Request information
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    // Finance HOD approval
    financeApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: {
        type: Date,
      },
      comments: {
        type: String,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },

    // HR HOD approval
    hrApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: {
        type: Date,
      },
      comments: {
        type: String,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },

    // Processing information
    processedAt: {
      type: Date,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Rejection information
    rejectionReason: {
      type: String,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    rejectedAt: {
      type: Date,
    },

    // Notifications sent
    notificationsSent: [
      {
        type: {
          type: String,
          enum: ["finance_request", "hr_approval", "processing_complete"],
        },
        sentTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Additional metadata
    metadata: {
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "yearly", "one_time"],
        default: "monthly",
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
payrollApprovalSchema.index({ approvalId: 1 });
payrollApprovalSchema.index({ approvalStatus: 1 });
payrollApprovalSchema.index({ requestedBy: 1 });
payrollApprovalSchema.index({ "period.month": 1, "period.year": 1 });
payrollApprovalSchema.index({ createdAt: -1 });

// Virtual for approval progress
payrollApprovalSchema.virtual("approvalProgress").get(function () {
  const steps = [
    "pending_finance",
    "approved_finance",
    "approved_hr",
    "processed",
  ];
  const currentStep = steps.indexOf(this.approvalStatus);
  return {
    current: currentStep + 1,
    total: steps.length,
    percentage: ((currentStep + 1) / steps.length) * 100,
  };
});

// Virtual for time tracking
payrollApprovalSchema.virtual("timeInCurrentStatus").get(function () {
  const statusDates = {
    pending_finance: this.requestedAt,
    approved_finance: this.financeApproval?.approvedAt,
    approved_hr: this.hrApproval?.approvedAt,
    processed: this.processedAt,
  };

  const currentStatusDate = statusDates[this.approvalStatus];
  if (currentStatusDate) {
    return Date.now() - new Date(currentStatusDate).getTime();
  }
  return null;
});

// Pre-save middleware to generate approval ID
payrollApprovalSchema.pre("save", function (next) {
  if (!this.approvalId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.approvalId = `PAY-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Static method to get approval statistics
payrollApprovalSchema.statics.getApprovalStats = async function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: "$approvalStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: "$financialSummary.totalNetPay" },
      },
    },
  ];

  return await this.aggregate(pipeline);
};

// Static method to get pending approvals for a user
payrollApprovalSchema.statics.getPendingApprovals = async function (
  userId,
  userRole
) {
  const query = {};

  if (userRole === "finance_hod") {
    query.approvalStatus = "pending_finance";
  } else if (userRole === "hr_hod") {
    query.approvalStatus = "approved_finance";
  }

  return await this.find(query)
    .populate("requestedBy", "firstName lastName email employeeId")
    .populate("financeApproval.approvedBy", "firstName lastName email")
    .populate("hrApproval.approvedBy", "firstName lastName email")
    .sort({ createdAt: -1 });
};

const PayrollApproval = mongoose.model(
  "PayrollApproval",
  payrollApprovalSchema
);

export default PayrollApproval;
