import mongoose from "mongoose";
import PayrollApproval from "../models/PayrollApproval.js";
import NotificationService from "./notificationService.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

/**
 * Payroll Approval Service
 * Handles the complete payroll approval workflow
 */
class PayrollApprovalService {
  /**
   * Create a new payroll approval request
   */
  async createApprovalRequest(payrollData, requestedBy) {
    try {
      const totalTax = payrollData.totalPAYE || 0;

      console.log(
        "🔍 [PAYROLL_APPROVAL] Creating approval request with data:",
        {
          totalEmployees: payrollData.totalEmployees,
          totalGrossPay: payrollData.totalGrossPay,
          totalNetPay: payrollData.totalNetPay,
          totalDeductions: payrollData.totalDeductions,
          totalPAYE: payrollData.totalPAYE,
          totalTax: totalTax,
        }
      );

      // Create the approval request
      const approvalRequest = new PayrollApproval({
        payrollData,
        period: payrollData.period,
        scope: payrollData.scope,
        financialSummary: {
          totalEmployees: payrollData.totalEmployees || 0,
          totalGrossPay: payrollData.totalGrossPay || 0,
          totalNetPay: payrollData.totalNetPay || 0,
          totalDeductions: payrollData.totalDeductions || 0,
          totalTax: totalTax,
        },
        requestedBy,
        approvalStatus: "pending_finance",
        metadata: {
          frequency: payrollData.frequency || "monthly",
          priority: this.determinePriority(payrollData),
        },
      });

      await approvalRequest.save();

      // Send notifications
      await this.sendFinanceApprovalNotification(approvalRequest);

      console.log(
        `📋 [PAYROLL_APPROVAL] Created approval request: ${approvalRequest.approvalId}`
      );

      return approvalRequest;
    } catch (error) {
      console.error("Error creating payroll approval request:", error);
      throw error;
    }
  }

  /**
   * Approve payroll by Finance HOD
   */
  async approveByFinance(approvalId, approvedBy, comments = "") {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const approval = await PayrollApproval.findOne({ approvalId }).session(
          session
        );

        if (!approval) {
          throw new Error("Payroll approval request not found");
        }

        if (approval.approvalStatus !== "pending_finance") {
          throw new Error("Payroll approval is not in pending finance status");
        }

        // Check payroll budget availability and reserve funds
        // Finance HOD approves based on GROSS PAY, so we reserve gross pay amount
        const ELRAWallet = await import("../models/ELRAWallet.js");
        const elraWallet = await ELRAWallet.default.getOrCreateWallet(
          "ELRA_MAIN",
          approvedBy
        );

        const payrollAmount = approval.financialSummary.totalGrossPay;
        const payrollBudget = elraWallet.budgetCategories?.payroll;

        if (!payrollBudget) {
          throw new Error("Payroll budget category not initialized");
        }

        // Check if payroll budget has sufficient funds
        if (payrollBudget.available < payrollAmount) {
          throw new Error(
            `Insufficient payroll budget. Available: ₦${payrollBudget.available.toLocaleString()}, Required: ₦${payrollAmount.toLocaleString()}`
          );
        }

        // Reserve funds from payroll budget (within transaction)
        // Reserve GROSS PAY amount since Finance HOD approves based on gross pay
        await elraWallet.reserveFromCategory(
          "payroll",
          payrollAmount,
          `Payroll allocation for ${approval.period.monthName} ${
            approval.period.year
          } (Gross Pay: ₦${payrollAmount.toLocaleString()})`,
          approval.approvalId,
          approval._id,
          "payroll",
          approvedBy,
          session // Pass session for transaction
        );

        console.log(
          `💳 [ELRA WALLET] Reserved ₦${payrollAmount.toLocaleString()} (GROSS PAY) from payroll budget for approval ${approvalId}`
        );

        // Update finance approval (within transaction)
        approval.financeApproval = {
          approvedBy,
          approvedAt: new Date(),
          comments,
          status: "approved",
        };

        approval.approvalStatus = "approved_finance";
        await approval.save({ session });

        console.log(`✅ [PAYROLL_APPROVAL] Finance approved: ${approvalId}`);
      });

      // After successful transaction, send notification (outside transaction)
      const approval = await PayrollApproval.findOne({ approvalId });
      await this.sendHRApprovalNotification(approval);

      return approval;
    } catch (error) {
      console.error("Error approving payroll by finance:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Approve payroll by HR HOD
   */
  async approveByHR(approvalId, approvedBy, comments = "") {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const approval = await PayrollApproval.findOne({ approvalId }).session(
          session
        );

        if (!approval) {
          throw new Error("Payroll approval request not found");
        }

        if (approval.approvalStatus !== "approved_finance") {
          throw new Error("Payroll approval is not in approved finance status");
        }

        // Approve allocation in company wallet (within transaction)
        const ELRAWallet = await import("../models/ELRAWallet.js");
        const elraWallet = await ELRAWallet.default.getOrCreateWallet(
          "ELRA_MAIN", // Use ELRA main instance
          approvedBy
        );

        await elraWallet.approveAllocation(approval._id, approvedBy, session);

        console.log(
          `✅ [ELRA WALLET] Approved payroll allocation of ₦${approval.financialSummary.totalNetPay.toLocaleString()}`
        );

        // Update HR approval (within transaction)
        approval.hrApproval = {
          approvedBy,
          approvedAt: new Date(),
          comments,
          status: "approved",
        };

        approval.approvalStatus = "approved_hr";
        await approval.save({ session });

        console.log(`✅ [PAYROLL_APPROVAL] HR approved: ${approvalId}`);
      });

      // After successful transaction, send notification (outside transaction)
      const approval = await PayrollApproval.findOne({ approvalId });
      await this.sendProcessingNotification(approval);

      return approval;
    } catch (error) {
      console.error("Error approving payroll by HR:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Process payroll (deduct from allocated funds)
   */
  async processPayroll(approvalId, processedBy) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const approval = await PayrollApproval.findOne({ approvalId }).session(
          session
        );

        if (!approval) {
          throw new Error("Payroll approval request not found");
        }

        if (
          approval.approvalStatus !== "approved_hr" &&
          approval.approvalStatus !== "approved_finance"
        ) {
          throw new Error(
            "Payroll approval is not in approved status (Finance or HR approval required)"
          );
        }

        const ELRAWallet = await import("../models/ELRAWallet.js");
        const elraWallet = await ELRAWallet.default.getOrCreateWallet(
          "ELRA_MAIN",
          processedBy
        );

        await elraWallet.processPayroll(
          approval.financialSummary.totalNetPay,
          `${approval.period.monthName} ${approval.period.year}`,
          processedBy,
          session
        );

        console.log(
          `✅ [ELRA WALLET] Processed payroll of ₦${approval.financialSummary.totalNetPay.toLocaleString()}`
        );

        const PayrollService = await import("./payrollService.js");
        const payrollService = PayrollService.default;

        const payrollResult =
          await payrollService.savePayrollWithDuplicateHandling(
            approval.payrollData,
            processedBy
          );

        console.log(
          `✅ [PAYROLL_SERVICE] Generated payroll records for ${payrollResult.processingSummary.successful} employees`
        );

        approval.approvalStatus = "processed";
        approval.processedAt = new Date();
        approval.processedBy = processedBy;
        await approval.save({ session });

        console.log(`✅ [PAYROLL_APPROVAL] Payroll processed: ${approvalId}`);
      });

      // After successful transaction, generate payslips and send emails (outside transaction)
      const approval = await PayrollApproval.findOne({ approvalId });
      await this.generateAndSendPayslips(approval, processedBy);

      return approval;
    } catch (error) {
      console.error("Error processing payroll:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Generate payslips and send emails to employees
   */
  async generateAndSendPayslips(approval, processedBy) {
    try {
      console.log(
        `📄 [PAYSLIP_GENERATION] Starting payslip generation for ${approval.approvalId}`
      );

      const PayslipService = await import("./payslipService.js");
      const payslipService = new PayslipService.default();

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const payroll of approval.payrollData.payrolls) {
        try {
          const employeeData = {
            _id: payroll.employee.id,
            firstName: payroll.employee.name.split(" ")[0] || "",
            lastName: payroll.employee.name.split(" ").slice(1).join(" ") || "",
            employeeId: payroll.employee.employeeId,
            email: payroll.employee.email,
            department: payroll.employee.department,
            role: payroll.employee.role,
            position: payroll.employee.role,
            jobTitle: payroll.employee.role,
          };

          const payslipPayrollData = {
            period: approval.period,
            scope: approval.scope,
            payrolls: [payroll],
            payrollId: approval._id,
          };

          const payslipFile = await payslipService.generatePayslipPDF(
            payslipPayrollData,
            employeeData
          );

          await payslipService.savePayslipToDatabase(
            payslipPayrollData,
            employeeData,
            payslipFile,
            processedBy
          );

          await payslipService.sendPayslipNotification(
            payslipPayrollData,
            employeeData,
            payslipFile
          );

          successCount++;
          console.log(
            `✅ [PAYSLIP_GENERATION] Generated payslip for ${payroll.employee.name} (${payroll.employee.employeeId})`
          );
        } catch (error) {
          errorCount++;
          errors.push({
            employee: payroll.employee.name,
            employeeId: payroll.employee.employeeId,
            error: error.message,
          });
          console.error(
            `❌ [PAYSLIP_GENERATION] Error generating payslip for ${payroll.employee.name}:`,
            error
          );
        }
      }

      console.log(`📊 [PAYSLIP_GENERATION] Summary:`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Failed: ${errorCount}`);
      console.log(
        `   📧 Total Employees: ${approval.payrollData.payrolls.length}`
      );

      if (errors.length > 0) {
        console.log(`⚠️ [PAYSLIP_GENERATION] Errors encountered:`);
        errors.forEach((error, index) => {
          console.log(
            `   ${index + 1}. ${error.employee} (${error.employeeId}): ${
              error.error
            }`
          );
        });
      }

      return {
        success: true,
        totalEmployees: approval.payrollData.payrolls.length,
        successful: successCount,
        failed: errorCount,
        errors: errors,
      };
    } catch (error) {
      console.error("Error generating and sending payslips:", error);
      throw error;
    }
  }

  /**
   * Reject payroll approval
   */
  async rejectApproval(approvalId, rejectedBy, reason, userRole) {
    try {
      const approval = await PayrollApproval.findOne({ approvalId });

      if (!approval) {
        throw new Error("Payroll approval request not found");
      }

      // Update rejection info
      approval.rejectionReason = reason;
      approval.rejectedBy = rejectedBy;
      approval.rejectedAt = new Date();
      approval.approvalStatus = "rejected";

      // Update specific approval based on role
      if (userRole === "finance_hod") {
        approval.financeApproval = {
          ...approval.financeApproval,
          status: "rejected",
          comments: reason,
        };
      } else if (userRole === "hr_hod") {
        approval.hrApproval = {
          ...approval.hrApproval,
          status: "rejected",
          comments: reason,
        };
      }

      await approval.save();

      try {
        const ELRAWallet = await import("../models/ELRAWallet.js");
        const elraWallet = await ELRAWallet.default.getOrCreateWallet(
          "ELRA_MAIN",
          rejectedBy
        );

        const payrollAmount = approval.financialSummary.totalNetPay;

        const payrollBudget = elraWallet.budgetCategories?.payroll;
        if (payrollBudget && payrollBudget.reserved >= payrollAmount) {
          payrollBudget.reserved -= payrollAmount;
          payrollBudget.available += payrollAmount;

          elraWallet.reservedFunds -= payrollAmount;

          await elraWallet.save();

          console.log(
            `💳 [ELRA WALLET] Released ₦${payrollAmount.toLocaleString()} from reserved back to available in payroll budget due to rejection`
          );
        } else {
          console.warn(
            `⚠️ [ELRA WALLET] Could not release funds - insufficient reserved funds. Reserved: ₦${
              payrollBudget?.reserved || 0
            }, Required: ₦${payrollAmount.toLocaleString()}`
          );
        }
      } catch (walletError) {
        console.error(
          "❌ [ELRA WALLET] Error releasing funds on rejection:",
          walletError
        );
      }

      // Send rejection notification
      await this.sendRejectionNotification(approval, rejectedBy, reason);

      console.log(
        `❌ [PAYROLL_APPROVAL] Rejected: ${approvalId} by ${userRole} - Funds released back to available`
      );

      return approval;
    } catch (error) {
      console.error("Error rejecting payroll approval:", error);
      throw error;
    }
  }

  /**
   * Mark payroll as processed and move funds from reserved to used
   */
  async markAsProcessed(approvalId, processedBy) {
    try {
      const approval = await PayrollApproval.findOne({ approvalId });

      if (!approval) {
        throw new Error("Payroll approval request not found");
      }

      if (approval.approvalStatus !== "approved_hr") {
        throw new Error("Payroll approval is not in approved HR status");
      }

      // Move funds from reserved to used in ELRA wallet
      try {
        const ELRAWallet = await import("../models/ELRAWallet.js");
        const elraWallet = await ELRAWallet.default.getOrCreateWallet(
          "ELRA_MAIN",
          processedBy
        );

        const payrollAmount = approval.financialSummary.totalNetPay;

        // Move from reserved to used in payroll budget category
        const payrollBudget = elraWallet.budgetCategories?.payroll;
        if (payrollBudget && payrollBudget.reserved >= payrollAmount) {
          payrollBudget.reserved -= payrollAmount;
          payrollBudget.used += payrollAmount;

          // Update overall wallet
          elraWallet.reservedFunds -= payrollAmount;

          await elraWallet.save();

          console.log(
            `💳 [ELRA WALLET] Moved ₦${payrollAmount.toLocaleString()} from reserved to used in payroll budget`
          );
        } else {
          console.warn(
            `⚠️ [ELRA WALLET] Insufficient reserved funds for payroll processing. Reserved: ₦${
              payrollBudget?.reserved || 0
            }, Required: ₦${payrollAmount.toLocaleString()}`
          );
        }
      } catch (walletError) {
        console.error(
          "❌ [ELRA WALLET] Error moving funds from reserved to used:",
          walletError
        );
        // Don't fail the processing if wallet update fails
      }

      approval.approvalStatus = "processed";
      approval.processedAt = new Date();
      approval.processedBy = processedBy;
      await approval.save();

      console.log(`🎉 [PAYROLL_APPROVAL] Processed: ${approvalId}`);

      return approval;
    } catch (error) {
      console.error("Error marking payroll as processed:", error);
      throw error;
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId) {
    try {
      const user = await User.findById(userId).populate("role");
      const userRole = this.getUserRole(user);

      return await PayrollApproval.getPendingApprovals(userId, userRole);
    } catch (error) {
      console.error("Error getting pending approvals:", error);
      throw error;
    }
  }

  /**
   * Get approval details
   */
  async getApprovalDetails(approvalId) {
    try {
      return await PayrollApproval.findOne({ approvalId })
        .populate({
          path: "requestedBy",
          select: "firstName lastName email employeeId department avatar role",
          populate: [
            { path: "department", select: "name" },
            { path: "role", select: "name level" },
          ],
        })
        .populate({
          path: "financeApproval.approvedBy",
          select: "firstName lastName email role",
          populate: { path: "role", select: "name level" },
        })
        .populate({
          path: "hrApproval.approvedBy",
          select: "firstName lastName email role",
          populate: { path: "role", select: "name level" },
        })
        .populate({
          path: "processedBy",
          select: "firstName lastName email role",
          populate: { path: "role", select: "name level" },
        });
    } catch (error) {
      console.error("Error getting approval details:", error);
      throw error;
    }
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats(filters = {}) {
    try {
      return await PayrollApproval.getApprovalStats(filters);
    } catch (error) {
      console.error("Error getting approval stats:", error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Send notification to Finance HOD for approval
   */
  async sendFinanceApprovalNotification(approval) {
    try {
      const notificationService = new NotificationService();

      // Get Finance HOD
      const financeHOD = await User.findOne({
        "department.name": "Finance & Accounting",
        "role.name": "HOD",
      });

      if (financeHOD) {
        await notificationService.createNotification({
          recipient: financeHOD._id,
          type: "PAYROLL_APPROVAL_REQUEST",
          title: "Payroll Approval Required",
          message: `Payroll approval required for ${
            approval.period.monthName
          } ${
            approval.period.year
          }. Gross Pay: ₦${approval.financialSummary.totalGrossPay.toLocaleString()}`,
          priority: "high",
          data: {
            approvalId: approval.approvalId,
            period: approval.period,
            totalGrossPay: approval.financialSummary.totalGrossPay,
            totalNetPay: approval.financialSummary.totalNetPay,
            totalEmployees: approval.financialSummary.totalEmployees,
            actionUrl: `/dashboard/approvals/payroll/${approval.approvalId}`,
          },
        });

        // Update notifications sent
        approval.notificationsSent.push({
          type: "finance_request",
          sentTo: financeHOD._id,
        });
        await approval.save();
      }
    } catch (error) {
      console.error("Error sending finance approval notification:", error);
    }
  }

  /**
   * Send notification to HR HOD for approval
   */
  async sendHRApprovalNotification(approval) {
    try {
      const notificationService = new NotificationService();

      const Department = await import("../models/Department.js");
      const Role = await import("../models/Role.js");

      const hrDept = await Department.default.findOne({
        name: "Human Resources",
      });

      if (!hrDept) {
        console.error("❌ [NOTIFICATION] Human Resources department not found");
        return;
      }

      console.log(`🏢 [NOTIFICATION] Found HR department: ${hrDept._id}`);

      const hodRole = await Role.default.findOne({ name: "HOD" });

      let hrHOD = null;

      if (hodRole) {
        hrHOD = await User.findOne({
          role: hodRole._id,
          department: hrDept._id,
        });

        console.log(
          `👥 [NOTIFICATION] Found HR HOD by role ID: ${hrHOD ? "Yes" : "No"}`
        );
      }

      if (!hrHOD) {
        console.log(
          `🔄 [NOTIFICATION] No HOD found by role ID, trying role level fallback...`
        );
        hrHOD = await User.findOne({
          department: hrDept._id,
          "role.level": { $gte: 700 },
        });
        console.log(
          `👥 [NOTIFICATION] Found HR HOD by role level: ${
            hrHOD ? "Yes" : "No"
          }`
        );
      }

      if (hrHOD) {
        await notificationService.createNotification({
          recipient: hrHOD._id,
          type: "PAYROLL_HR_APPROVAL",
          title: "Payroll Ready for HR Approval",
          message: `Payroll approved by Finance for ${approval.period.monthName} ${approval.period.year}. Ready for HR approval.`,
          priority: "high",
          data: {
            approvalId: approval.approvalId,
            period: approval.period,
            totalNetPay: approval.financialSummary.totalNetPay,
            actionUrl: `/dashboard/approvals/payroll/${approval.approvalId}`,
          },
        });

        console.log(
          `📧 [NOTIFICATION] HR approval notification sent to: ${hrHOD.firstName} ${hrHOD.lastName} (${hrHOD.email})`
        );

        // Update notifications sent
        approval.notificationsSent.push({
          type: "hr_approval",
          sentTo: hrHOD._id,
        });
        await approval.save();
      } else {
        console.error(
          "❌ [NOTIFICATION] HR HOD not found - notification not sent"
        );
      }
    } catch (error) {
      console.error("Error sending HR approval notification:", error);
    }
  }

  /**
   * Send notification that payroll is ready for processing
   */
  async sendProcessingNotification(approval) {
    try {
      const notificationService = new NotificationService();

      // Only notify the requester - Super Admin can process anytime
      await notificationService.createNotification({
        recipient: approval.requestedBy,
        type: "PAYROLL_READY_PROCESSING",
        title: "Payroll Ready for Processing",
        message: `Payroll fully approved for ${approval.period.monthName} ${approval.period.year}. Ready to process.`,
        priority: "high",
        data: {
          approvalId: approval.approvalId,
          period: approval.period,
          totalNetPay: approval.financialSummary.totalNetPay,
          actionUrl: `/dashboard/modules/payroll/process/${approval.approvalId}`,
        },
      });

      // Update notifications sent
      approval.notificationsSent.push({
        type: "processing_complete",
        sentTo: approval.requestedBy,
      });
      await approval.save();
    } catch (error) {
      console.error("Error sending processing notification:", error);
    }
  }

  /**
   * Send rejection notification
   */
  async sendRejectionNotification(approval, rejectedBy, reason) {
    try {
      const notificationService = new NotificationService();

      await notificationService.createNotification({
        recipient: approval.requestedBy,
        type: "PAYROLL_REJECTED",
        title: "Payroll Approval Rejected",
        message: `Payroll approval rejected for ${approval.period.monthName} ${approval.period.year}. Reason: ${reason}`,
        priority: "high",
        data: {
          approvalId: approval.approvalId,
          period: approval.period,
          rejectionReason: reason,
          actionUrl: `/dashboard/modules/payroll`,
        },
      });
    } catch (error) {
      console.error("Error sending rejection notification:", error);
    }
  }

  /**
   * Determine priority based on payroll data
   */
  determinePriority(payrollData) {
    const totalAmount = payrollData.totalNetPay || 0;

    if (totalAmount > 10000000) return "urgent"; // > 10M
    if (totalAmount > 5000000) return "high"; // > 5M
    if (totalAmount > 1000000) return "medium"; // > 1M
    return "low";
  }

  /**
   * Get user role for approval workflow
   */
  getUserRole(user) {
    // Super Admin (role level >= 1000) can act as Finance HOD for approvals
    if (user.role?.level >= 1000) {
      return "superadmin";
    }
    if (
      user.department?.name === "Finance & Accounting" &&
      user.role?.name === "HOD"
    ) {
      return "finance_hod";
    }
    if (
      user.department?.name === "Human Resources" &&
      user.role?.name === "HOD"
    ) {
      return "hr_hod";
    }
    return "employee";
  }
}

export default new PayrollApprovalService();
