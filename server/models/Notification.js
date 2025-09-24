import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "DOCUMENT_APPROVAL",
        "DOCUMENT_REJECTED",
        "DOCUMENT_SUBMITTED",
        "APPROVAL_OVERDUE",
        "DOCUMENT_SHARED",
        "SYSTEM_ALERT",
        "WORKFLOW_UPDATE",
        "WELCOME",
        "ACCOUNT_ACTIVATED",
        "SUBSCRIPTION_ACTIVE",
        "SUBSCRIPTION_NEW",
        "SUBSCRIPTION_RENEWAL",
        "SUBSCRIPTION_CANCELLATION",
        "PAYMENT_FAILURE",
        "DOCUMENT_UPLOAD_SUCCESS",
        "DOCUMENT_OCR_PROCESSING",
        "DOCUMENT_UPLOAD_DEPARTMENT",
        "DOCUMENT_UPLOAD_PERMISSION",
        "EVENT_CREATED",
        "EVENT_UPDATED",
        "EVENT_CANCELLED",
        "ANNOUNCEMENT_CREATED",
        "ANNOUNCEMENT_UPDATED",
        "ANNOUNCEMENT_DELETED",
        "USER_REGISTRATION",
        "MESSAGE_RECEIVED",
        "INVITATION_CREATED",
        "BULK_INVITATION_CREATED",
        "POLICY_CREATED",
        "POLICY_UPDATED",
        "COMPLIANCE_CREATED",
        "COMPLIANCE_UPDATED",
        "COMPLIANCE_DELETED",
        "LEAVE_REQUEST",
        "LEAVE_RESPONSE",
        "LEAVE_CANCELLED",
        "LEAVE_REQUEST_UPDATE",
        "LEAVE_REQUEST_UPDATED",
        "DEDUCTION_CREATED",
        "DEDUCTION_UPDATED",
        "DEDUCTION_DELETED",
        "DEDUCTION_ACTIVATED",
        "DEDUCTION_DEACTIVATED",
        "BONUS_CREATED",
        "BONUS_UPDATED",
        "BONUS_DELETED",
        "BONUS_ACTIVATED",
        "BONUS_DEACTIVATED",
        "ALLOWANCE_CREATED",
        "PAYROLL_PROCESSED",
        "PAYSLIP_GENERATED",
        "FUND_ADDITION",
        "SALES_MARKETING_APPROVAL_REQUIRED",
        "INSUFFICIENT_FUNDS_ALERT",
        "TRANSACTION_APPROVED",
        "TRANSACTION_REJECTED",
        "project_approval_required",
        "project_sent_for_approval",
        "project_approved",
        "project_rejected",
        "project_auto_approved",
        "project_approval_confirmed",
        "procurement_created",
        "procurement_email_sent",
        "procurement_updated",
        "approval_required",
        "TEAM_MEMBER_ASSIGNED",
        "TEAM_MEMBER_REMOVED",
        "TEAM_MEMBER_UPDATED",
        "DOCUMENT_APPROVAL_REQUIRED",
        "DOCUMENT_APPROVAL_OVERDUE",
        "DOCUMENT_MODIFICATION_REQUESTED",
        "DOCUMENT_APPROVAL_COMPLETED",
        "DOCUMENT_UPLOADED",
        "DOCUMENT_APPROVED",
        "DOCUMENT_PENDING_REVIEW",
        "DOCUMENT_PROCESSED",
        "DOCUMENT_SUBMITTED",
        "PROJECT_READY_FOR_APPROVAL",
        "PROJECT_RESUBMITTED",
        "DEPARTMENTAL_PROJECT_RESUBMITTED",
        "project_auto_approved",
        "INVENTORY_CREATION_REQUIRED",
        "PROCUREMENT_INITIATION_REQUIRED",
        "PROJECT_IMPLEMENTATION_READY",
        "BUDGET_ALLOCATION_REQUIRED",
        "BUDGET_REVIEW_REQUIRED",
        "BUDGET_ALLOCATION_APPROVED",
        "BUDGET_ALLOCATION_REJECTED",
        "BUDGET_ALLOCATION_PENDING",
        "BUDGET_ALLOCATION_COMPLETED",
        "BUDGET_ALLOCATED",
        "WALLET_CREATED",
        "PAYROLL_FUNDING_REQUIRED",
        "OPERATIONAL_FUNDING_REQUIRED",
        "INVENTORY_PENDING_FOR_PROJECT",
        "INVENTORY_SETUP_REQUIRED",
        "PROCUREMENT_DELIVERY_COMPLETED",
        "REGULATORY_COMPLIANCE_REQUIRED",
        "REGULATORY_COMPLIANCE_COMPLETED",
        "DOCUMENT_REPLACED",
        "INVENTORY_COMPLETION",
        "TASK_STARTED",
        "TASK_COMPLETED",
        "TASK_ASSIGNED",
        "TASK_UPDATED",
        "TASK_OVERDUE",
        "WELCOME_ONBOARDING",
        "PAYROLL_APPROVAL_REQUEST",
        "PAYROLL_SUBMISSION_SUCCESS",
        "PAYROLL_HR_APPROVAL",
        "PAYROLL_READY_PROCESSING",
        "PAYROLL_REJECTED",
        "PAYROLL_RESEND_CONFIRMATION",
        "LOW_BALANCE_ALERT",
        "ALL_DOCUMENTS_SUBMITTED",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
      policyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Policy",
      },
      complianceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Compliance",
      },
      leaveRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaveRequest",
      },
      // Leave-specific fields
      employeeName: String,
      employeeRole: String,
      employeeDepartment: String,
      leaveType: String,
      startDate: Date,
      endDate: Date,
      days: Number,
      reason: String,
      status: String,
      comment: String,
      action: String,
      isSuperAdminRequest: Boolean,
      isSuperAdminNotification: Boolean,
      cancelledBy: String,
      cancellationReason: String,
      deductionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deduction",
      },
      bonusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PersonalBonus",
      },
      allowanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Allowance",
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      // Project-related fields
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
      projectName: String,
      approvalLevel: String,
      rejectionLevel: String,
      approverName: String,
      approverRole: String,
      approverDepartment: String,
      nextApprover: String,
      nextApproverRole: String,
      previousApprover: String,
      previousApproverRole: String,
      previousApproverDepartment: String,
      approvalChain: [String],
      totalApprovalSteps: Number,
      isFirstApproval: Boolean,
      isFinalApproval: Boolean,
      rejecterName: String,
      rejecterDepartment: String,
      creatorDepartment: String,
      creatorName: String,
      estimatedApprovalTime: String,
      approvedAt: Date,
      rejectedAt: Date,
      actionUrl: String,
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      // Payroll approval specific fields
      approvalId: String,
      period: {
        month: Number,
        year: Number,
        monthName: String,
      },
      totalNetPay: Number,
      totalEmployees: Number,
      rejectionReason: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
};

// Static method to find unread notifications
notificationSchema.statics.findUnread = function (userId) {
  return this.find({
    recipient: userId,
    isRead: false,
    isActive: true,
  }).populate("data.documentId", "title reference");
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false,
      isActive: true,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
