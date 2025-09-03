import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      required: true,
      enum: [
        "Annual",
        "Sick",
        "Personal",
        "Maternity",
        "Paternity",
        "Study",
        "Bereavement",
      ],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    currentApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalLevel: {
      type: Number,
      default: 1,
    },
    approvalChain: {
      type: [String],
      default: [],
    },
    totalApprovalSteps: {
      type: Number,
      default: 1,
    },
    approvals: [
      {
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["MANAGER", "HOD", "SUPER_ADMIN"],
        },
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
        comment: String,
        approvedAt: Date,
      },
    ],
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: Date,
    rejectedAt: Date,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
leaveRequestSchema.index({ employee: 1, status: 1 });
leaveRequestSchema.index({ department: 1, status: 1 });
leaveRequestSchema.index({ currentApprover: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

// Virtual for checking if request is active
leaveRequestSchema.virtual("isActive").get(function () {
  const now = new Date();
  return (
    this.startDate <= now && this.endDate >= now && this.status === "Approved"
  );
});

// Method to get next approver based on employee role
leaveRequestSchema.methods.getNextApprover = function () {
  // This will be implemented in the controller based on user roles
  return null;
};

// Method to add approval entry
leaveRequestSchema.methods.addApproval = function (
  approverId,
  role,
  status,
  comment = ""
) {
  // Check if an approval entry already exists for this approver
  const existingApprovalIndex = this.approvals.findIndex(
    (approval) => approval.approver.toString() === approverId.toString()
  );

  if (existingApprovalIndex !== -1) {
    // Update existing approval entry
    const existingApproval = this.approvals[existingApprovalIndex];

    // Only update if the existing status is "Pending" or if we're adding a comment
    if (
      existingApproval.status === "Pending" ||
      (comment && comment !== existingApproval.comment)
    ) {
      existingApproval.status = status;
      existingApproval.comment = comment || existingApproval.comment;
      existingApproval.approvedAt = status !== "Pending" ? new Date() : null;

      console.log(
        `✅ [LeaveRequest] Updated existing approval for ${approverId}: ${existingApproval.status}`
      );
    } else {
      console.log(
        `⚠️ [LeaveRequest] Skipping update - existing approval already ${existingApproval.status}`
      );
    }
  } else {
    const approval = {
      approver: approverId,
      role,
      status,
      comment,
      approvedAt: status !== "Pending" ? new Date() : null,
    };

    this.approvals.push(approval);
    console.log(
      `✅ [LeaveRequest] Added new approval entry for ${approverId}: ${status}`
    );
  }

  return this.save();
};

leaveRequestSchema.methods.cleanupApprovals = function () {
  const uniqueApprovals = [];
  const seenApprovers = new Set();

  // Process approvals in reverse order to keep the latest status
  for (let i = this.approvals.length - 1; i >= 0; i--) {
    const approval = this.approvals[i];
    const approverKey = approval.approver.toString();

    if (!seenApprovers.has(approverKey)) {
      uniqueApprovals.unshift(approval);
      seenApprovers.add(approverKey);
    }
  }

  // Update the approvals array
  this.approvals = uniqueApprovals;

  console.log(
    `🧹 [LeaveRequest] Cleaned up approvals: ${this.approvals.length} unique entries`
  );
  return this.save();
};

// Method to update status based on approvals
leaveRequestSchema.methods.updateStatus = function () {
  const pendingApprovals = this.approvals.filter((a) => a.status === "Pending");
  const rejectedApprovals = this.approvals.filter(
    (a) => a.status === "Rejected"
  );
  const approvedApprovals = this.approvals.filter(
    (a) => a.status === "Approved"
  );

  if (rejectedApprovals.length > 0) {
    this.status = "Rejected";
    this.rejectedAt = new Date();
  } else if (pendingApprovals.length === 0 && approvedApprovals.length > 0) {
    this.status = "Approved";
    this.approvedAt = new Date();
  }
};

// Static method to get leave statistics
leaveRequestSchema.statics.getStats = async function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ];

  const stats = await this.aggregate(pipeline);
  const result = {
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
  };

  stats.forEach((stat) => {
    result[stat._id.toLowerCase()] = stat.count;
    result.total += stat.count;
  });

  return result;
};

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;
