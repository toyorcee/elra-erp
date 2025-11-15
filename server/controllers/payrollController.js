import PayrollService from "../services/payrollService.js";
import PayrollApprovalService from "../services/payrollApprovalService.js";
import { protect, checkPayrollAccess } from "../middleware/auth.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";
import PayslipService from "../services/payslipService.js";
import { ObjectId } from "mongodb";

/**
 * Payroll Controller
 * Handles all payroll-related API endpoints
 */

// @desc    Process payroll for all employees
// @route   POST /api/payroll/process
// @access  Private (Super Admin, HOD)
const processPayroll = async (req, res) => {
  try {
    const {
      month,
      year,
      frequency = "monthly",
      scope = "company",
      scopeId,
    } = req.body;

    // Validate input
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    // Validate frequency
    const validFrequencies = ["monthly", "quarterly", "yearly", "one_time"];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message:
          "Frequency must be one of: monthly, quarterly, yearly, one_time",
      });
    }

    // Validate scope
    const validScopes = ["company", "department", "individual"];
    if (!validScopes.includes(scope)) {
      return res.status(400).json({
        success: false,
        message: "Scope must be one of: company, department, individual",
      });
    }

    // Validate scopeId based on scope
    if (scope === "department" && !scopeId) {
      return res.status(400).json({
        success: false,
        message: "Department ID(s) are required for department scope",
      });
    }

    if (scope === "individual" && !scopeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID(s) are required for individual scope",
      });
    }

    // Validate scopeId format
    if (
      scope === "department" &&
      !Array.isArray(scopeId) &&
      typeof scopeId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department scopeId must be a string (single department) or array (multiple departments)",
      });
    }

    if (scope === "individual" && !Array.isArray(scopeId)) {
      return res.status(400).json({
        success: false,
        message: "Individual scopeId must be an array of employee IDs",
      });
    }

    // Super Admin can process directly, others need to go through approval workflow
    const userRole = PayrollApprovalService.getUserRole(req.user);
    const markAsUsed = userRole === "superadmin"; // Super Admin can process directly

    const payrollResult = await PayrollService.processPayroll(
      month,
      year,
      frequency,
      scope,
      scopeId,
      req.user._id,
      markAsUsed
    );

    // Prepare response message based on processing summary
    let message = "Payroll processed successfully";
    if (payrollResult.processingSummary) {
      const summary = payrollResult.processingSummary;
      const parts = [];

      if (summary.successful > 0) {
        parts.push(`${summary.successful} successful`);
      }
      if (summary.duplicates > 0) {
        parts.push(`${summary.duplicates} duplicates skipped`);
      }
      if (summary.failed > 0) {
        parts.push(`${summary.failed} failed`);
      }

      if (parts.length > 0) {
        message = `Payroll processed: ${parts.join(", ")} out of ${
          summary.totalEmployees
        } employees`;
      } else {
        message = `Payroll processed successfully for ${summary.successful} employees`;
      }
    }

    res.status(200).json({
      success: true,
      message: message,
      data: payrollResult,
    });
  } catch (error) {
    console.error("Error processing payroll:", error);
    res.status(500).json({
      success: false,
      message: "Error processing payroll",
      error: error.message,
    });
  }
};

const checkForEmployeeOverlap = async (payrollData) => {
  try {
    const { period, payrolls, scope } = payrollData;
    const currentEmployeeIds = payrolls
      .map((p) => p.employee?.id)
      .filter(Boolean);

    console.log("🔍 [BACKEND_VALIDATION] Checking for employee overlaps...");
    console.log(
      "🔍 [BACKEND_VALIDATION] Current employee IDs:",
      currentEmployeeIds
    );

    // Check pending approvals
    const PayrollApproval = (await import("../models/PayrollApproval.js"))
      .default;
    const existingPreviews = await PayrollApproval.find({
      "period.month": period.month,
      "period.year": period.year,
      "metadata.frequency": payrollData.frequency || "monthly",
    });

    for (const preview of existingPreviews) {
      if (preview.payrollData?.payrolls) {
        const existingEmployeeIds = preview.payrollData.payrolls
          .map((p) => p.employee?.id)
          .filter(Boolean);
        const overlap = currentEmployeeIds.filter((id) =>
          existingEmployeeIds.includes(id)
        );

        if (overlap.length > 0) {
          console.log("🔍 [BACKEND_VALIDATION] Found overlap in preview:", {
            previewId: preview.approvalId,
            overlap: overlap,
            status: preview.approvalStatus,
          });

          return {
            found: true,
            message: `Cannot create payroll preview: Some employees have already been included in a payroll preview for ${period.monthName} ${period.year}.`,
            details: {
              type: "preview_overlap",
              approvalId: preview.approvalId,
              status: preview.approvalStatus,
              overlappingEmployees: overlap,
              period: `${period.monthName} ${period.year}`,
            },
          };
        }
      }
    }

    const Payroll = (await import("../models/Payroll.js")).default;
    const existingPayrolls = await Payroll.find({
      "period.month": period.month,
      "period.year": period.year,
      frequency: payrollData.frequency || "monthly",
    });

    for (const payroll of existingPayrolls) {
      let existingEmployeeIds = [];

      if (payroll.payrolls && Array.isArray(payroll.payrolls)) {
        existingEmployeeIds = payroll.payrolls
          .map((p) => p.employee)
          .filter(Boolean);
      } else if (payroll.employee) {
        existingEmployeeIds = [payroll.employee];
      }

      const overlap = currentEmployeeIds.filter((id) =>
        existingEmployeeIds.includes(id)
      );

      if (overlap.length > 0) {
        console.log("🔍 [BACKEND_VALIDATION] Found overlap in payroll:", {
          payrollId: payroll._id,
          overlap: overlap,
        });

        return {
          found: true,
          message: `Cannot create payroll preview: Some employees have already been processed in a payroll for ${period.monthName} ${period.year}.`,
          details: {
            type: "payroll_overlap",
            payrollId: payroll._id,
            overlappingEmployees: overlap,
            period: `${period.monthName} ${period.year}`,
          },
        };
      }
    }

    console.log("✅ [BACKEND_VALIDATION] No employee overlaps found");
    return { found: false };
  } catch (error) {
    console.error(
      "❌ [BACKEND_VALIDATION] Error checking for overlaps:",
      error
    );
    // Don't block on validation errors, but log them
    return { found: false };
  }
};

// @desc    Submit payroll for finance approval
// @route   POST /api/payroll/submit-for-approval
// @access  Private (Super Admin, HOD)
const submitForApproval = async (req, res) => {
  try {
    const { payrollData } = req.body;

    // Validate that payroll data is provided
    if (!payrollData) {
      return res.status(400).json({
        success: false,
        message: "Payroll data is required",
      });
    }

    if (!payrollData.period || !payrollData.payrolls || !payrollData.scope) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll data structure",
      });
    }

    const hasOverlap = await checkForEmployeeOverlap(payrollData);
    if (hasOverlap.found) {
      return res.status(409).json({
        success: false,
        message: hasOverlap.message,
        details: hasOverlap.details,
      });
    }

    const approvalRequest = await PayrollApprovalService.createApprovalRequest(
      payrollData,
      req.user._id
    );

    console.log(
      `📋 [PAYROLL_SUBMISSION] Created approval with ID: ${approvalRequest.approvalId}`
    );

    // Send notification to Finance HOD
    try {
      const NotificationService = (
        await import("../services/notificationService.js")
      ).default;
      const notificationService = new NotificationService();

      // Find Finance HOD user
      const User = (await import("../models/User.js")).default;
      const Department = (await import("../models/Department.js")).default;

      const financeDept = await Department.findOne({
        name: "Finance & Accounting",
      });

      if (!financeDept) {
        console.error(
          "❌ [NOTIFICATION] Finance & Accounting department not found"
        );
        return;
      }

      console.log(
        `🏢 [NOTIFICATION] Found Finance department: ${financeDept._id}`
      );

      // Find Finance HOD using the same logic as project controller
      const Role = (await import("../models/Role.js")).default;
      const hodRole = await Role.findOne({ name: "HOD" });

      let financeHOD = null;

      if (hodRole) {
        financeHOD = await User.findOne({
          role: hodRole._id,
          department: financeDept._id,
        });

        console.log(
          `👥 [NOTIFICATION] Found Finance HOD by role ID: ${
            financeHOD ? "Yes" : "No"
          }`
        );
      }

      if (!financeHOD) {
        console.log(
          `🔄 [NOTIFICATION] No HOD found by role ID, trying role level fallback...`
        );
        financeHOD = await User.findOne({
          department: financeDept._id,
          "role.level": { $gte: 700 },
        });
        console.log(
          `👥 [NOTIFICATION] Found Finance HOD by role level: ${
            financeHOD ? "Yes" : "No"
          }`
        );
      }

      if (financeHOD) {
        await notificationService.createNotification({
          recipient: financeHOD._id,
          type: "PAYROLL_APPROVAL_REQUEST",
          title: "New Payroll Approval Request",
          message: `New payroll approval request for ${
            payrollData.period?.monthName
          } ${payrollData.period?.year}. Gross Pay: ₦${
            payrollData.totalGrossPay?.toLocaleString() || 0
          }`,
          priority: "high",
          data: {
            approvalId: approvalRequest.approvalId,
            period: payrollData.period,
            scope: payrollData.scope,
            totalGrossPay: payrollData.totalGrossPay,
            totalNetPay: payrollData.totalNetPay,
            totalEmployees: payrollData.totalEmployees,
          },
        });
        console.log(
          `📧 [NOTIFICATION] Sent payroll approval notification to Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName}`
        );
      } else {
        console.warn(
          "⚠️ [NOTIFICATION] Finance HOD not found - skipping notification"
        );
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
    }

    try {
      await notificationService.createNotification({
        recipient: req.user._id,
        type: "PAYROLL_SUBMISSION_SUCCESS",
        title: "Payroll Submitted Successfully",
        message: `Payroll for ${payrollData.period?.monthName} ${payrollData.period?.year} has been submitted for finance approval. Approval ID: ${approvalRequest.approvalId}`,
        priority: "medium",
        data: {
          approvalId: approvalRequest.approvalId,
          period: payrollData.period,
          scope: payrollData.scope,
          totalNetPay: payrollData.totalNetPay,
          totalEmployees: payrollData.totalEmployees,
        },
      });
      console.log(
        `📧 [NOTIFICATION] Sent submission confirmation to requester: ${req.user.firstName} ${req.user.lastName}`
      );
    } catch (senderNotificationError) {
      console.error(
        "Error sending notification to sender:",
        senderNotificationError
      );
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: {
        approval: {
          approvalId: approvalRequest.approvalId,
          status: approvalRequest.approvalStatus,
          requestedAt: approvalRequest.requestedAt,
        },
        payroll: {
          period: payrollData.period,
          totalEmployees: payrollData.totalEmployees,
          totalNetPay: payrollData.totalNetPay,
          scope: payrollData.scope,
        },
      },
    });
  } catch (error) {
    console.error("Error submitting payroll for approval:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting payroll for approval",
      error: error.message,
    });
  }
};

// @desc    Process payroll using preview data
// @route   POST /api/payroll/process-with-data
// @access  Private (Super Admin, HOD)
const processPayrollWithData = async (req, res) => {
  try {
    const { payrollData } = req.body;

    // Validate that payroll data is provided
    if (!payrollData) {
      return res.status(400).json({
        success: false,
        message: "Payroll data is required",
      });
    }

    // Validate required fields in payroll data
    if (!payrollData.period || !payrollData.payrolls || !payrollData.scope) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll data structure",
      });
    }

    // Save the preview data directly
    const savedPayroll = await PayrollService.savePayroll(
      payrollData,
      req.user._id
    );

    try {
      const notificationService = new NotificationService();
      const scopeDescription = getScopeDescription(
        payrollData.scope,
        payrollData.scope?.details
      );

      await notificationService.createNotification({
        recipient: req.user._id,
        type: "PAYROLL_PROCESSED",
        title: "Payroll Processed Successfully",
        message: `Payroll for ${payrollData.period?.monthName} ${
          payrollData.period?.year
        } has been processed successfully. ${scopeDescription} Total: ₦${
          payrollData.totalNetPay?.toLocaleString() || 0
        }`,
        priority: "high",
        data: {
          payrollId: savedPayroll.payrollId,
          period: payrollData.period,
          scope: payrollData.scope,
          totalEmployees: payrollData.totalEmployees,
          totalNetPay: payrollData.totalNetPay,
          actionUrl: "/dashboard/modules/payroll",
        },
      });
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
    }

    try {
      const payslipService = new PayslipService();

      for (const payroll of payrollData.payrolls) {
        try {
          const employeeData = {
            _id: payroll.employee.id,
            firstName: payroll.employee.name.split(" ")[0] || "",
            lastName: payroll.employee.name.split(" ").slice(1).join(" ") || "",
            employeeId: payroll.employee.employeeId,
            email: payroll.employee.email,
            department: payroll.employee.department,
            role: payroll.employee.role,
            avatar: payroll.employee.avatar,
          };

          const payslipPayrollData = {
            period: payrollData.period,
            scope: payrollData.scope,
            payrolls: [payroll],
            payrollId: savedPayroll.payrollId,
          };

          const payslipFile = await payslipService.generatePayslipPDF(
            payslipPayrollData,
            employeeData
          );

          await payslipService.savePayslipToDatabase(
            payslipPayrollData,
            employeeData,
            payslipFile,
            req.user._id
          );

          // Handle both name formats (firstName/lastName vs name)
          const employeeName =
            employeeData.firstName && employeeData.lastName
              ? `${employeeData.firstName} ${employeeData.lastName}`
              : employeeData.name || "Unknown Employee";

          await payslipService.sendPayslipNotification(
            payslipPayrollData,
            employeeData,
            payslipFile
          );
        } catch (payslipError) {
          // Handle both name formats for error message
          const errorEmployeeName =
            payroll.employee?.firstName && payroll.employee?.lastName
              ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
              : payroll.employee?.name || "Unknown Employee";

          console.error(
            `Failed to generate/send payslip for employee ${errorEmployeeName}:`,
            payslipError
          );
        }
      }
    } catch (payslipError) {
      console.error("Failed to generate/send payslips:", payslipError);
    }

    res.status(200).json({
      success: true,
      message: "Payroll processed successfully using preview data",
      data: savedPayroll,
    });
  } catch (error) {
    console.error("Error processing payroll with data:", error);
    res.status(500).json({
      success: false,
      message: "Error processing payroll with data",
      error: error.message,
    });
  }
};

// @desc    Calculate payroll for a specific employee
// @route   POST /api/payroll/calculate-employee
// @access  Private (Super Admin, HOD)
const calculateEmployeePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, frequency = "monthly" } = req.body;

    // Validate input
    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, month, and year are required",
      });
    }

    // Validate frequency
    const validFrequencies = ["monthly", "quarterly", "yearly", "one_time"];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message:
          "Frequency must be one of: monthly, quarterly, yearly, one_time",
      });
    }

    // Calculate payroll for employee
    const payrollResult = await PayrollService.calculateEmployeePayroll(
      employeeId,
      month,
      year,
      frequency
    );

    res.status(200).json({
      success: true,
      message: "Employee payroll calculated successfully",
      data: payrollResult,
    });
  } catch (error) {
    console.error("Error calculating employee payroll:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating employee payroll",
      error: error.message,
    });
  }
};

// Helper function to check for employee overlaps in preview requests
const checkForEmployeeOverlapInPreview = async (
  month,
  year,
  frequency,
  scope,
  scopeId
) => {
  try {
    console.log(
      "🔍 [BACKEND_PREVIEW_VALIDATION] Checking for employee overlaps..."
    );

    const currentEmployeeIds = await getEmployeeIdsForScope(scope, scopeId);
    console.log(
      "🔍 [BACKEND_PREVIEW_VALIDATION] Current scope employee IDs:",
      currentEmployeeIds
    );

    if (currentEmployeeIds.length === 0) {
      console.log(
        "⚠️ [BACKEND_PREVIEW_VALIDATION] No employees found for scope"
      );
      return { found: false };
    }

    const PayrollApproval = (await import("../models/PayrollApproval.js"))
      .default;
    const existingPreviews = await PayrollApproval.find({
      "period.month": month,
      "period.year": year,
      "metadata.frequency": frequency,
    });

    for (const preview of existingPreviews) {
      if (preview.payrollData?.payrolls) {
        const existingEmployeeIds = preview.payrollData.payrolls
          .map((p) => p.employee?.id)
          .filter(Boolean);
        const overlap = currentEmployeeIds.filter((id) =>
          existingEmployeeIds.includes(id)
        );

        if (overlap.length > 0) {
          console.log(
            "🔍 [BACKEND_PREVIEW_VALIDATION] Found overlap in preview:",
            {
              previewId: preview.approvalId,
              overlap: overlap,
              status: preview.approvalStatus,
            }
          );

          return {
            found: true,
            message: `Cannot create payroll preview: Some employees have already been included in a payroll preview for ${month}/${year} (${frequency}).`,
            details: {
              type: "preview_overlap",
              approvalId: preview.approvalId,
              status: preview.approvalStatus,
              overlappingEmployees: overlap,
              period: `${month}/${year}`,
            },
          };
        }
      }
    }

    const Payroll = (await import("../models/Payroll.js")).default;
    const existingPayrolls = await Payroll.find({
      "period.month": month,
      "period.year": year,
      frequency: frequency,
    });

    for (const payroll of existingPayrolls) {
      let existingEmployeeIds = [];

      if (payroll.payrolls && Array.isArray(payroll.payrolls)) {
        existingEmployeeIds = payroll.payrolls
          .map((p) => p.employee)
          .filter(Boolean);
      } else if (payroll.employee) {
        existingEmployeeIds = [payroll.employee];
      }

      const overlap = currentEmployeeIds.filter((id) =>
        existingEmployeeIds.includes(id)
      );

      if (overlap.length > 0) {
        console.log(
          "🔍 [BACKEND_PREVIEW_VALIDATION] Found overlap in payroll:",
          {
            payrollId: payroll._id,
            overlap: overlap,
          }
        );

        return {
          found: true,
          message: `Cannot create payroll preview: Some employees have already been processed in a payroll for ${month}/${year} (${frequency}).`,
          details: {
            type: "payroll_overlap",
            payrollId: payroll._id,
            overlappingEmployees: overlap,
            period: `${month}/${year}`,
          },
        };
      }
    }

    console.log("✅ [BACKEND_PREVIEW_VALIDATION] No employee overlaps found");
    return { found: false };
  } catch (error) {
    console.error(
      "❌ [BACKEND_PREVIEW_VALIDATION] Error checking for overlaps:",
      error
    );
    // Don't block on validation errors, but log them
    return { found: false };
  }
};

// Helper function to get employee IDs for a given scope
const getEmployeeIdsForScope = async (scope, scopeId) => {
  try {
    const User = (await import("../models/User.js")).default;
    const Department = (await import("../models/Department.js")).default;

    switch (scope) {
      case "company":
        // For company scope, get all active employees
        const allEmployees = await User.find({
          isActive: true,
          status: "ACTIVE",
        }).select("_id");
        return allEmployees.map((emp) => emp._id.toString());

      case "department":
        // For department scope, get employees in that department
        const deptEmployees = await User.find({
          department: scopeId,
          isActive: true,
          status: "ACTIVE",
        }).select("_id");
        return deptEmployees.map((emp) => emp._id.toString());

      case "individual":
        // For individual scope, scopeId is already the employee IDs
        return Array.isArray(scopeId)
          ? scopeId.map((id) => id.toString())
          : [scopeId.toString()];

      default:
        return [];
    }
  } catch (error) {
    console.error("Error getting employee IDs for scope:", error);
    return [];
  }
};

// @desc    Get payroll preview
// @route   POST /api/payroll/preview
// @access  Private (Super Admin, HOD)
const getPayrollPreview = async (req, res) => {
  try {
    const {
      month,
      year,
      frequency = "monthly",
      scope = "company",
      scopeId,
    } = req.body;

    // Validate input
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Validate frequency
    const validFrequencies = ["monthly", "quarterly", "yearly", "one_time"];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message:
          "Frequency must be one of: monthly, quarterly, yearly, one_time",
      });
    }

    // Validate scope
    const validScopes = ["company", "department", "individual"];
    if (!validScopes.includes(scope)) {
      return res.status(400).json({
        success: false,
        message: "Scope must be one of: company, department, individual",
      });
    }

    // Validate scopeId based on scope
    if (scope === "department" && !scopeId) {
      return res.status(400).json({
        success: false,
        message: "Department ID(s) are required for department scope",
      });
    }

    if (scope === "individual" && !scopeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID(s) are required for individual scope",
      });
    }

    // Validate scopeId format
    if (
      scope === "department" &&
      !Array.isArray(scopeId) &&
      typeof scopeId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department scopeId must be a string (single department) or array (multiple departments)",
      });
    }

    if (scope === "individual" && !Array.isArray(scopeId)) {
      return res.status(400).json({
        success: false,
        message: "Individual scopeId must be an array of employee IDs",
      });
    }

    // Backend validation: Check for employee overlaps before calculating preview
    const overlapCheck = await checkForEmployeeOverlapInPreview(
      month,
      year,
      frequency,
      scope,
      scopeId
    );
    if (overlapCheck.found) {
      return res.status(409).json({
        success: false,
        message: overlapCheck.message,
        details: overlapCheck.details,
      });
    }

    const previewResult = await PayrollService.calculatePayroll(
      month,
      year,
      frequency,
      scope,
      scopeId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Payroll preview generated successfully",
      data: previewResult,
    });
  } catch (error) {
    console.error("Error generating payroll preview:", error);
    res.status(500).json({
      success: false,
      message: "Error generating payroll preview",
      error: error.message,
    });
  }
};

// @desc    Get pending payroll approvals
// @route   GET /api/payroll/approvals/pending
// @access  Private (Finance HOD, HR HOD, Super Admin)
const getPendingApprovals = async (req, res) => {
  try {
    const pendingApprovals = await PayrollApprovalService.getPendingApprovals(
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Pending approvals retrieved successfully",
      data: pendingApprovals,
    });
  } catch (error) {
    console.error("Error getting pending approvals:", error);
    res.status(500).json({
      success: false,
      message: "Error getting pending approvals",
      error: error.message,
    });
  }
};

// @desc    Get payroll approval details
// @route   GET /api/payroll/approvals/:approvalId
// @access  Private (Finance HOD, HR HOD, Super Admin)
const getApprovalDetails = async (req, res) => {
  try {
    const { approvalId } = req.params;

    const approvalDetails = await PayrollApprovalService.getApprovalDetails(
      approvalId
    );

    if (!approvalDetails) {
      return res.status(404).json({
        success: false,
        message: "Payroll approval not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Approval details retrieved successfully",
      data: approvalDetails,
    });
  } catch (error) {
    console.error("Error getting approval details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting approval details",
      error: error.message,
    });
  }
};

// @desc    Get payroll preview data for HR HOD
// @route   GET /api/payroll/preview/:approvalId
// @access  Private (HR HOD, Super Admin)
const getPayrollPreviewForHR = async (req, res) => {
  try {
    const { approvalId } = req.params;

    // Check if user is HR HOD or Super Admin
    const user = req.user;
    const isHRHOD =
      user.department?.name === "Human Resources" && user.role?.level >= 700;
    const isSuperAdmin = user.role?.level >= 1000;

    if (!isHRHOD && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HR HOD and Super Admin can access payroll preview data.",
      });
    }

    // Get approval details with payroll data
    const approvalDetails = await PayrollApprovalService.getApprovalDetails(
      approvalId
    );

    if (!approvalDetails) {
      return res.status(404).json({
        success: false,
        message: "Payroll approval not found",
      });
    }

    // Check if the approval is in the correct status for HR review
    if (approvalDetails.approvalStatus !== "approved_finance") {
      return res.status(400).json({
        success: false,
        message:
          "Payroll is not ready for HR review. Finance approval is required first.",
      });
    }

    // Return the payroll preview data
    res.status(200).json({
      success: true,
      message: "Payroll preview data retrieved successfully",
      data: {
        approvalId: approvalDetails.approvalId,
        period: approvalDetails.period,
        scope: approvalDetails.scope,
        financialSummary: approvalDetails.financialSummary,
        payrollData: approvalDetails.payrollData,
        approvalStatus: approvalDetails.approvalStatus,
        requestedBy: approvalDetails.requestedBy,
        requestedAt: approvalDetails.requestedAt,
        financeApproval: approvalDetails.financeApproval,
      },
    });
  } catch (error) {
    console.error("Error getting payroll preview for HR:", error);
    res.status(500).json({
      success: false,
      message: "Error getting payroll preview data",
      error: error.message,
    });
  }
};

// @desc    Approve payroll (Finance or HR)
// @route   POST /api/payroll/approvals/:approvalId/approve
// @access  Private (Finance HOD, HR HOD)
const approvePayroll = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { comments = "" } = req.body;

    if (req.userType?.isExecutiveHOD) {
      return res.status(403).json({
        success: false,
        message:
          "Executive HOD can only view payroll approvals, not approve them",
      });
    }

    const userRole = PayrollApprovalService.getUserRole(req.user);

    // Super Admin can approve as Finance HOD
    if (userRole === "superadmin" || userRole === "finance_hod") {
      const approval = await PayrollApprovalService.approveByFinance(
        approvalId,
        req.user._id,
        comments
      );

      res.status(200).json({
        success: true,
        message:
          userRole === "superadmin"
            ? "Payroll approved by Super Admin"
            : "Payroll approved by Finance HOD",
        data: approval,
      });
    } else if (userRole === "hr_hod") {
      const approval = await PayrollApprovalService.approveByHR(
        approvalId,
        req.user._id,
        comments
      );

      res.status(200).json({
        success: true,
        message: "Payroll approved by HR HOD",
        data: approval,
      });
    } else {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions to approve payroll",
      });
    }
  } catch (error) {
    console.error("Error approving payroll:", error);
    res.status(500).json({
      success: false,
      message: "Error approving payroll",
      error: error.message,
    });
  }
};

// @desc    Reject payroll approval
// @route   POST /api/payroll/approvals/:approvalId/reject
// @access  Private (Finance HOD, HR HOD)
const rejectPayroll = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { reason } = req.body;

    if (req.userType?.isExecutiveHOD) {
      return res.status(403).json({
        success: false,
        message:
          "Executive HOD can only view payroll approvals, not reject them",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    // Determine user role
    const userRole = PayrollApprovalService.getUserRole(req.user);

    // Super Admin can reject as Finance HOD
    if (
      userRole === "superadmin" ||
      userRole === "finance_hod" ||
      userRole === "hr_hod"
    ) {
      const approval = await PayrollApprovalService.rejectApproval(
        approvalId,
        req.user._id,
        reason,
        userRole === "superadmin" ? "finance_hod" : userRole
      );

      res.status(200).json({
        success: true,
        message: "Payroll approval rejected",
        data: approval,
      });
    } else {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions to reject payroll",
      });
    }
  } catch (error) {
    console.error("Error rejecting payroll:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting payroll",
      error: error.message,
    });
  }
};

// @desc    Process approved payroll
// @route   POST /api/payroll/process-approved/:approvalId
// @access  Private (Super Admin, HR HOD)
const processApprovedPayroll = async (req, res) => {
  try {
    const { approvalId } = req.params;

    // Get approval details
    const approval = await PayrollApprovalService.getApprovalDetails(
      approvalId
    );

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: "Payroll approval not found",
      });
    }

    // Super Admin can process anytime, others need HR approval
    const userRole = PayrollApprovalService.getUserRole(req.user);
    if (
      userRole !== "superadmin" &&
      approval.approvalStatus !== "approved_hr"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll must be approved by both Finance and HR before processing",
      });
    }

    // Process the payroll using the approved data
    const payrollResult = await PayrollService.processPayroll(
      approval.period.month,
      approval.period.year,
      approval.metadata.frequency,
      approval.scope.type,
      approval.scope.details?.scopeId,
      req.user._id,
      true // markAsUsed = true for actual processing
    );

    // Mark approval as processed
    await PayrollApprovalService.markAsProcessed(approvalId, req.user._id);

    res.status(200).json({
      success: true,
      message: "Approved payroll processed successfully",
      data: payrollResult,
    });
  } catch (error) {
    console.error("Error processing approved payroll:", error);
    res.status(500).json({
      success: false,
      message: "Error processing approved payroll",
      error: error.message,
    });
  }
};

// @desc    Get payroll summary
// @route   GET /api/payroll/summary
// @access  Private (Super Admin, HOD)
const getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Validate input
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Get summary data
    const summaryResult = await PayrollService.processPayroll(
      parseInt(month),
      parseInt(year)
    );

    res.status(200).json({
      success: true,
      message: "Payroll summary retrieved successfully",
      data: {
        period: summaryResult.period,
        totalEmployees: summaryResult.totalEmployees,
        totalGrossPay: summaryResult.totalGrossPay,
        totalNetPay: summaryResult.totalNetPay,
      },
    });
  } catch (error) {
    console.error("Error getting payroll summary:", error);
    res.status(500).json({
      success: false,
      message: "Error getting payroll summary",
      error: error.message,
    });
  }
};

// @desc    Get all saved payrolls
// @route   GET /api/payroll/saved
// @access  Private (Super Admin, HOD)
const getSavedPayrolls = async (req, res) => {
  try {
    const { month, year, scope, department, employee } = req.query;

    // Build filter object
    const filter = {};

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (scope) filter.scope = scope;
    if (department) filter.department = department;
    if (employee) filter.employee = employee;

    const isSuperAdmin = req.user.role && req.user.role.level >= 1000;
    const isHOD = req.user.role && req.user.role.level >= 700;

    const Payroll = (await import("../models/Payroll.js")).default;

    const payrolls = await Payroll.find(filter)
      .populate({
        path: "employee",
        select: "firstName lastName employeeId avatar department role",
        populate: [
          {
            path: "department",
            select: "name code",
          },
          {
            path: "role",
            select: "name level description",
          },
        ],
      })
      .populate("department", "name code")
      .populate("createdBy", "firstName lastName")
      .populate("processedBy", "firstName lastName")
      .sort({ processingDate: -1 })
      .limit(100);

    const groupedPayrolls = payrolls.reduce((acc, payroll) => {
      const key = `${payroll.month}-${payroll.year}-${payroll.scope}`;
      if (!acc[key]) {
        acc[key] = {
          _id: payroll._id,
          groupKey: key,
          period: {
            month: payroll.month,
            year: payroll.year,
            monthName: getMonthName(payroll.month),
            frequency: payroll.frequency,
          },
          scope: payroll.scope,
          processingDate: payroll.processingDate,
          totalEmployees: 0,
          totalGrossPay: 0,
          totalNetPay: 0,
          totalDeductions: 0,
          totalPAYE: 0,
          payrolls: [],
          payrollIds: [],
        };
      }

      acc[key].totalEmployees++;
      acc[key].totalGrossPay += payroll.grossSalary;
      acc[key].totalNetPay += payroll.netSalary;
      acc[key].totalDeductions += payroll.totalDeductions;
      acc[key].totalPAYE += payroll.paye;
      acc[key].payrolls.push(payroll);
      acc[key].payrollIds.push(payroll._id);

      return acc;
    }, {});

    const result = Object.values(groupedPayrolls);

    res.status(200).json({
      success: true,
      message: "Saved payrolls retrieved successfully",
      data: {
        totalGroups: result.length,
        totalRecords: payrolls.length,
        payrolls: result,
      },
    });
  } catch (error) {
    console.error("Error getting saved payrolls:", error);
    res.status(500).json({
      success: false,
      message: "Error getting saved payrolls",
      error: error.message,
    });
  }
};

// @desc    Resend payslips to employees
// @route   POST /api/payroll/resend-payslips
// @access  Private (Super Admin, HOD)
const resendPayslips = async (req, res) => {
  try {
    const { payrollId, employeeIds } = req.body;

    // Validate input
    if (!payrollId) {
      return res.status(400).json({
        success: false,
        message: "Payroll ID is required",
      });
    }

    const Payroll = (await import("../models/Payroll.js")).default;

    const referencePayroll = await Payroll.findById(payrollId);
    if (!referencePayroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    const batchPayrolls = await Payroll.find({
      month: referencePayroll.month,
      year: referencePayroll.year,
      scope: referencePayroll.scope,
      createdBy: referencePayroll.createdBy,
    })
      .populate({
        path: "employee",
        select:
          "firstName lastName employeeId email department role avatar position jobTitle",
        populate: [
          {
            path: "department",
            select: "name code",
          },
          {
            path: "role",
            select: "name level description",
          },
        ],
      })
      .populate("createdBy", "firstName lastName email");

    if (batchPayrolls.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payrolls found in this batch",
      });
    }

    // Check if user has access to this payroll batch
    const isOwner =
      referencePayroll.createdBy &&
      referencePayroll.createdBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role && req.user.role.level >= 1000;
    const isHOD = req.user.role && req.user.role.level >= 700;

    // HR HODs can access all payroll batches, not just their department
    const canHODAccess = isHOD; // HR HODs have full access

    const hasAccess = isOwner || isSuperAdmin || canHODAccess;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this payroll batch",
      });
    }

    const payslipService = new PayslipService();

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // Filter payrolls based on employeeIds if provided
    let payrollsToProcess = employeeIds
      ? batchPayrolls.filter((p) =>
          employeeIds.includes(p.employee._id.toString())
        )
      : batchPayrolls;

    // HR HODs can process payrolls for all employees, not just their department
    // No department filtering for HR HODs (level 700+)

    // Process each employee's payroll data
    for (const payroll of payrollsToProcess) {
      try {
        // Get employee data
        const employeeData = payroll.employee;

        // Create payroll data structure for payslip

        const payslipPayrollData = {
          period: {
            month: payroll.month,
            year: payroll.year,
            monthName: getMonthName(payroll.month),
            frequency: payroll.frequency,
          },
          scope: {
            type: payroll.scope,
            details:
              payroll.scope === "department"
                ? { department: payroll.department }
                : null,
          },
          payrolls: [
            {
              employee: employeeData,
              baseSalary: payroll.baseSalary || 0,
              grossSalary: payroll.grossSalary || 0,
              netSalary: payroll.netSalary || 0,
              totalDeductions: payroll.totalDeductions || 0,
              paye: payroll.paye || 0,
              pension: payroll.pension || 0,
              nhis: payroll.nhis || 0,
              personalAllowances: payroll.personalAllowances || [],
              personalBonuses: payroll.personalBonuses || [],
              voluntaryDeductions: payroll.voluntaryDeductions || [],
              taxableIncome: payroll.taxableIncome || 0,
              nonTaxableAllowances: payroll.nonTaxableAllowances || 0,
              totalAllowances: payroll.totalAllowances || 0,
              totalBonuses: payroll.totalBonuses || 0,
              period: {
                month: payroll.month,
                year: payroll.year,
                monthName: getMonthName(payroll.month),
              },
              summary: {
                grossPay: payroll.grossSalary || 0,
                netPay: payroll.netSalary || 0,
                totalDeductions: payroll.totalDeductions || 0,
                taxableIncome: payroll.taxableIncome || 0,
              },
            },
          ],
          payrollId: payroll._id,
        };

        // Generate payslip PDF
        const payslipFile = await payslipService.generatePayslipPDF(
          payslipPayrollData,
          employeeData
        );

        // Send payslip notification and email
        await payslipService.sendPayslipNotification(
          payslipPayrollData,
          employeeData,
          payslipFile
        );

        successCount++;
        results.push({
          employeeId: employeeData._id,
          employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
          email: employeeData.email,
          status: "success",
          message: "Payslip sent successfully",
          payslipUrl: `/api/payroll/payslips/${payroll._id}/view/${employeeData._id}`,
          payslipFileName: payslipFile.fileName,
        });
      } catch (payslipError) {
        console.error(
          `Failed to resend payslip for employee ${payroll.employee?.firstName} ${payroll.employee?.lastName}:`,
          payslipError
        );
        errorCount++;
        results.push({
          employeeId: payroll.employee._id,
          employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          email: payroll.employee.email,
          status: "error",
          message: payslipError.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Payslips resent successfully. Success: ${successCount}, Errors: ${errorCount}`,
      data: {
        totalProcessed: payrollsToProcess.length,
        successCount,
        errorCount,
        results,
        batchInfo: {
          month: referencePayroll.month,
          year: referencePayroll.year,
          scope: referencePayroll.scope,
          totalEmployees: batchPayrolls.length,
        },
      },
    });
  } catch (error) {
    console.error("Error resending payslips:", error);
    res.status(500).json({
      success: false,
      message: "Error resending payslips",
      error: error.message,
    });
  }
};

// Helper function to get month name
const getMonthName = (month) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1] || "Unknown";
};

// Helper function to get scope description for notifications
const getScopeDescription = (scope, details) => {
  if (!scope) return "Scope: Unknown";

  switch (scope.type) {
    case "company":
      return "Scope: All Employees";
    case "department":
      return `Scope: Department (${details || "Unknown"})`;
    case "individual":
      if (Array.isArray(details)) {
        return `Scope: ${details.length} Selected Employee${
          details.length !== 1 ? "s" : ""
        }`;
      }
      return "Scope: Individual Employee";
    default:
      return "Scope: Unknown";
  }
};

// @desc    Get payroll breakdown for employee
// @route   GET /api/payroll/breakdown/:employeeId
// @access  Private (Super Admin, HOD)
const getEmployeePayrollBreakdown = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    // Validate input
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Get detailed breakdown
    const breakdown = await PayrollService.calculateEmployeePayroll(
      employeeId,
      parseInt(month),
      parseInt(year)
    );

    res.status(200).json({
      success: true,
      message: "Employee payroll breakdown retrieved successfully",
      data: breakdown,
    });
  } catch (error) {
    console.error("Error getting employee payroll breakdown:", error);
    res.status(500).json({
      success: false,
      message: "Error getting employee payroll breakdown",
      error: error.message,
    });
  }
};

// @desc    Get all payslips from database
// @route   GET /api/payroll/payslips
// @access  Private (Super Admin, HOD)
const getAllPayslips = async (req, res) => {
  try {
    const {
      month,
      year,
      scope,
      frequency,
      department,
      employeeId,
      employeeName,
      searchTerm,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    // Check user permissions
    const isSuperAdmin = req.user.role && req.user.role.level >= 1000;
    const isHOD = req.user.role && req.user.role.level >= 700;

    // Build filters object
    const filters = {
      month,
      year,
      scope,
      frequency,
      department,
      employeeId,
      employeeName,
      searchTerm,
    };

    // HR HODs can see all payslips, not just their department
    // No department filtering for HR HODs (level 700+)

    const payslipService = new PayslipService();
    const payslips = await payslipService.getPayslipsByFilters(filters);

    // Transform payslips to frontend format
    const transformedPayslips = payslips.map((payslip) => ({
      id: payslip._id,
      payrollId: payslip.payrollId._id,
      employee: {
        id: payslip.employee._id,
        name: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        employeeId: payslip.employee.employeeId,
        email: payslip.employee.email,
        department: payslip.employee.department?.name || "N/A",
        role: payslip.employee.role?.name || "N/A",
      },
      period: {
        month: payslip.period.month,
        year: payslip.period.year,
        monthName: payslip.period.monthName,
        frequency: payslip.period.frequency,
      },
      scope: payslip.scope,
      summary: {
        grossPay: payslip.summary.grossPay,
        netPay: payslip.summary.netPay,
        totalDeductions: payslip.summary.totalDeductions,
        taxableIncome: payslip.summary.taxableIncome,
      },
      baseSalary: payslip.baseSalary,
      allowances: payslip.personalAllowances,
      bonuses: payslip.personalBonuses,
      deductions: payslip.voluntaryDeductions,
      taxBreakdown: {
        paye: payslip.paye,
        pension: payslip.pension,
        nhis: payslip.nhis,
      },
      status: payslip.status,
      payslipUrl: `/api/payroll/payslips/${payslip.payrollId._id}/view/${payslip.employee._id}`,
      downloadUrl: `/api/payroll/payslips/${payslip.payrollId._id}/download/${payslip.employee._id}`,
      resendUrl: `/api/payroll/payslips/${payslip.payrollId._id}/resend/${payslip.employee._id}`,
      createdAt: payslip.createdAt,
      updatedAt: payslip.updatedAt,
    }));

    // Sort payslips
    const sortedPayslips = transformedPayslips.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "employeeName":
          aValue = a.employee.name;
          bValue = b.employee.name;
          break;
        case "employeeId":
          aValue = a.employee.employeeId;
          bValue = b.employee.employeeId;
          break;
        case "grossPay":
          aValue = a.summary.grossPay;
          bValue = b.summary.grossPay;
          break;
        case "netPay":
          aValue = a.summary.netPay;
          bValue = b.summary.netPay;
          break;
        case "deductions":
          aValue = a.summary.totalDeductions;
          bValue = b.summary.totalDeductions;
          break;
        case "department":
          aValue = a.employee.department;
          bValue = b.employee.department;
          break;
        case "period":
          aValue = new Date(a.period.year, a.period.month - 1);
          bValue = new Date(b.period.year, b.period.month - 1);
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const totalPayslips = sortedPayslips.length;
    const totalPages = Math.ceil(totalPayslips / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPayslips = sortedPayslips.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      message: "Payslips retrieved successfully",
      data: {
        payslips: paginatedPayslips,
        total: totalPayslips,
        totalPages,
        currentPage: parseInt(page),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        filters: {
          month,
          year,
          scope,
          frequency,
          department,
          employeeId,
          employeeName,
          searchTerm,
        },
      },
    });
  } catch (error) {
    console.error("Error getting payslips:", error);
    res.status(500).json({
      success: false,
      message: "Error getting payslips",
      error: error.message,
    });
  }
};

// @desc    Search payslips across all payrolls
// @route   GET /api/payroll/search-payslips
// @access  Private (Super Admin, HOD)
const searchPayslips = async (req, res) => {
  try {
    const {
      month,
      year,
      scope,
      frequency,
      department,
      employeeId,
      employeeName,
      searchTerm,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Check user permissions
    const isSuperAdmin = req.user.role && req.user.role.level >= 1000;
    const isHOD = req.user.role && req.user.role.level >= 700;

    // Build filters object
    const filters = {
      month,
      year,
      scope,
      frequency,
      department,
      employeeId,
      employeeName,
      searchTerm,
    };

    // HR HODs can see all payslips, not just their department
    // No department filtering for HR HODs (level 700+)

    const payslipService = new PayslipService();
    const payslips = await payslipService.getPayslipsByFilters(filters);

    // Transform payslips to frontend format
    const transformedPayslips = payslips.map((payslip) => ({
      id: payslip._id,
      payrollId: payslip.payrollId._id,
      employee: {
        id: payslip.employee._id,
        name: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        employeeId: payslip.employee.employeeId,
        email: payslip.employee.email,
        department: payslip.employee.department?.name || "N/A",
        role: payslip.employee.role?.name || "N/A",
      },
      period: {
        month: payslip.period.month,
        year: payslip.period.year,
        monthName: payslip.period.monthName,
        frequency: payslip.period.frequency,
      },
      scope: payslip.scope,
      summary: {
        grossPay: payslip.summary.grossPay,
        netPay: payslip.summary.netPay,
        totalDeductions: payslip.summary.totalDeductions,
        taxableIncome: payslip.summary.taxableIncome,
      },
      baseSalary: payslip.baseSalary,
      allowances: payslip.personalAllowances,
      bonuses: payslip.personalBonuses,
      deductions: payslip.voluntaryDeductions,
      taxBreakdown: {
        paye: payslip.paye,
        pension: payslip.pension,
        nhis: payslip.nhis,
      },
      status: payslip.status,
      payslipUrl: `/api/payroll/payslips/${payslip.payrollId._id}/view/${payslip.employee._id}`,
      downloadUrl: `/api/payroll/payslips/${payslip.payrollId._id}/download/${payslip.employee._id}`,
      resendUrl: `/api/payroll/payslips/${payslip.payrollId._id}/resend/${payslip.employee._id}`,
      createdAt: payslip.createdAt,
      updatedAt: payslip.updatedAt,
    }));

    // Sort payslips
    const sortedPayslips = transformedPayslips.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "employeeName":
          aValue = a.employee.name;
          bValue = b.employee.name;
          break;
        case "employeeId":
          aValue = a.employee.employeeId;
          bValue = b.employee.employeeId;
          break;
        case "grossPay":
          aValue = a.summary.grossPay;
          bValue = b.summary.grossPay;
          break;
        case "netPay":
          aValue = a.summary.netPay;
          bValue = b.summary.netPay;
          break;
        case "deductions":
          aValue = a.summary.totalDeductions;
          bValue = b.summary.totalDeductions;
          break;
        case "department":
          aValue = a.employee.department;
          bValue = b.employee.department;
          break;
        case "period":
          aValue = new Date(a.period.year, a.period.month - 1);
          bValue = new Date(b.period.year, b.period.month - 1);
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    res.status(200).json({
      success: true,
      message: "Payslips search completed successfully",
      data: {
        payslips: sortedPayslips,
        total: sortedPayslips.length,
        filters: {
          month,
          year,
          scope,
          frequency,
          department,
          employeeId,
          employeeName,
          searchTerm,
        },
      },
    });
  } catch (error) {
    console.error("Error searching payslips:", error);
    res.status(500).json({
      success: false,
      message: "Error searching payslips",
      error: error.message,
    });
  }
};

// @desc    Get payslips for a specific payroll
// @route   GET /api/payroll/payslips/:payrollId
// @access  Private (Super Admin, HOD)
const getPayslips = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { employeeId } = req.query;

    // Validate input
    if (!payrollId) {
      return res.status(400).json({
        success: false,
        message: "Payroll ID is required",
      });
    }

    // Get the saved payroll data
    const savedPayroll = await PayrollService.getPayrollById(payrollId);
    if (!savedPayroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    // Check if user has access to this payroll
    if (
      savedPayroll.createdBy.toString() !== req.user._id.toString() &&
      !(req.user.role && req.user.role.level >= 700)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this payroll",
      });
    }

    // Filter by employee if specified
    let payrolls = savedPayroll.payrolls;
    if (employeeId) {
      payrolls = payrolls.filter(
        (p) => p.employee._id.toString() === employeeId
      );
    }

    // Transform payroll data to payslip format
    const payslips = payrolls.map((payroll) => ({
      id: `${payroll.employee._id}_${savedPayroll.period.month}_${savedPayroll.period.year}`,
      payrollId: savedPayroll._id,
      employee: {
        id: payroll.employee._id,
        name: payroll.employee.name,
        employeeId: payroll.employee.employeeId,
        email: payroll.employee.email,
        department: payroll.employee.department,
        role: payroll.employee.role,
      },
      period: {
        month: savedPayroll.month,
        year: savedPayroll.year,
        monthName: getMonthName(savedPayroll.month),
        frequency: savedPayroll.frequency || "monthly",
      },
      scope: savedPayroll.scope,
      summary: payroll.summary,
      baseSalary: payroll.baseSalary,
      allowances: payroll.allowances,
      bonuses: payroll.bonuses,
      deductions: payroll.deductions,
      taxBreakdown: payroll.taxBreakdown,
      payslipUrl: `/api/payroll/payslips/${savedPayroll._id}/view/${payroll.employee._id}`,
      downloadUrl: `/api/payroll/payslips/${savedPayroll._id}/download/${payroll.employee._id}`,
      resendUrl: `/api/payroll/payslips/${savedPayroll._id}/resend/${payroll.employee._id}`,
      createdAt: savedPayroll.createdAt,
      updatedAt: savedPayroll.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: "Payslips retrieved successfully",
      data: {
        payroll: {
          id: savedPayroll._id,
          period: {
            month: savedPayroll.month,
            year: savedPayroll.year,
            monthName: getMonthName(savedPayroll.month),
            frequency: savedPayroll.frequency || "monthly",
          },
          scope: savedPayroll.scope,
          totalEmployees: savedPayroll.payrolls.length,
          totalGrossPay: savedPayroll.totalGrossPay,
          totalNetPay: savedPayroll.totalNetPay,
          totalDeductions: savedPayroll.totalDeductions,
          createdAt: savedPayroll.createdAt,
        },
        payslips,
        total: payslips.length,
      },
    });
  } catch (error) {
    console.error("Error getting payslips:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payslips",
      error: error.message,
    });
  }
};

// @desc    View payslip PDF
// @route   GET /api/payroll/payslips/:payrollId/view/:employeeId
// @access  Private (Super Admin, HOD, Employee)
const viewPayslip = async (req, res) => {
  try {
    const { payrollId, employeeId } = req.params;

    // Validate input
    if (!payrollId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Payroll ID and Employee ID are required",
      });
    }

    // Get the saved payroll data
    const savedPayroll = await PayrollService.getPayrollById(payrollId);
    if (!savedPayroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    let employeePayroll = null;

    if (savedPayroll.payrolls && savedPayroll.payrolls.length > 0) {
      employeePayroll = savedPayroll.payrolls.find(
        (p) => p.employee._id.toString() === employeeId
      );
    } else if (
      savedPayroll.employee &&
      savedPayroll.employee._id.toString() === employeeId
    ) {
      const employee = savedPayroll.employee;

      if (
        typeof employee.role === "string" ||
        employee.role instanceof ObjectId
      ) {
        const User = (await import("../models/User.js")).default;
        const populatedEmployee = await User.findById(employee._id)
          .populate("department", "name code")
          .populate("role", "name level description");
        employee.role = populatedEmployee.role;
        employee.department = populatedEmployee.department;
      }

      employeePayroll = {
        employee: employee,
        baseSalary: savedPayroll.baseSalary,
        grossSalary: savedPayroll.grossSalary,
        netSalary: savedPayroll.netSalary,
        totalDeductions: savedPayroll.totalDeductions,
        paye: savedPayroll.paye,
        pension: savedPayroll.pension,
        nhis: savedPayroll.nhis,
        personalAllowances: savedPayroll.personalAllowances,
        personalBonuses: savedPayroll.personalBonuses,
        voluntaryDeductions: savedPayroll.voluntaryDeductions,
        taxableIncome: savedPayroll.taxableIncome,
        nonTaxableAllowances: savedPayroll.nonTaxableAllowances,
        totalAllowances: savedPayroll.totalAllowances,
        totalBonuses: savedPayroll.totalBonuses,
        period: {
          month: savedPayroll.month,
          year: savedPayroll.year,
          monthName: getMonthName(savedPayroll.month),
          frequency: savedPayroll.frequency || "monthly",
        },
        summary: {
          grossPay: savedPayroll.grossSalary,
          netPay: savedPayroll.netSalary,
          totalDeductions: savedPayroll.totalDeductions,
          taxableIncome: savedPayroll.taxableIncome,
        },
      };
    }

    if (!employeePayroll) {
      return res.status(404).json({
        success: false,
        message: "Employee payroll not found",
      });
    }

    const isOwner =
      savedPayroll.createdBy &&
      savedPayroll.createdBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role && req.user.role.level >= 1000;
    const isEmployee =
      employeePayroll.employee._id.toString() === req.user._id.toString();
    const isHOD = req.user.role && req.user.role.level >= 700;

    // HR HODs can access all employee payroll breakdowns
    const canHODAccess = isHOD;

    if (!isOwner && !isSuperAdmin && !isEmployee && !canHODAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this payslip",
      });
    }

    const payslipService = new PayslipService();
    const payslipPayrollData = {
      period: {
        month: savedPayroll.month,
        year: savedPayroll.year,
        monthName: getMonthName(savedPayroll.month),
        frequency: savedPayroll.frequency || "monthly",
      },
      scope: savedPayroll.scope,
      payrolls: [employeePayroll],
      payrollId: savedPayroll._id,
    };

    const payslipFile = await payslipService.generatePayslipPDF(
      payslipPayrollData,
      employeePayroll.employee
    );

    try {
      const payslips = await payslipService.getPayslipsByFilters({
        payrollId: savedPayroll._id.toString(),
        employeeId: employeeId,
      });
      if (payslips && payslips.length > 0) {
        await payslipService.markPayslipAsViewed(payslips[0]._id);
      }
    } catch (error) {
      console.error("Error marking payslip as viewed:", error);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${payslipFile.fileName}"`
    );
    res.setHeader("Cache-Control", "public, max-age=3600");

    res.sendFile(payslipFile.filePath);
  } catch (error) {
    console.error("Error viewing payslip:", error);
    res.status(500).json({
      success: false,
      message: "Error viewing payslip",
      error: error.message,
    });
  }
};

// @desc    Resend payslip to employee
// @route   POST /api/payroll/payslips/:payrollId/resend/:employeeId
// @access  Private (Super Admin, HOD)
const resendPayslip = async (req, res) => {
  try {
    const { payrollId, employeeId } = req.params;

    // Validate input
    if (!payrollId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Payroll ID and Employee ID are required",
      });
    }

    // Get the saved payroll data
    const savedPayroll = await PayrollService.getPayrollById(payrollId);
    if (!savedPayroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    // Find the specific employee payroll
    const employeePayroll = savedPayroll.payrolls.find(
      (p) => p.employee._id.toString() === employeeId
    );

    if (!employeePayroll) {
      return res.status(404).json({
        success: false,
        message: "Employee payroll not found",
      });
    }

    if (
      savedPayroll.createdBy.toString() !== req.user._id.toString() &&
      !(req.user.role && req.user.role.level >= 1000)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this payroll",
      });
    }

    // Generate and send payslip
    const payslipService = new PayslipService();
    const payslipPayrollData = {
      period: {
        month: savedPayroll.month,
        year: savedPayroll.year,
        monthName: getMonthName(savedPayroll.month),
        frequency: savedPayroll.frequency || "monthly",
      },
      scope: savedPayroll.scope,
      payrolls: [employeePayroll],
      payrollId: savedPayroll._id,
    };

    const payslipFile = await payslipService.generatePayslipPDF(
      payslipPayrollData,
      employeePayroll.employee
    );

    await payslipService.sendPayslipNotification(
      payslipPayrollData,
      employeePayroll.employee,
      payslipFile
    );

    res.status(200).json({
      success: true,
      message: "Payslip resent successfully",
      data: {
        employeeId: employeePayroll.employee._id,
        employeeName: employeePayroll.employee.name,
        email: employeePayroll.employee.email,
        status: "sent",
        message: "Payslip sent successfully",
      },
    });
  } catch (error) {
    console.error("Error resending payslip:", error);
    res.status(500).json({
      success: false,
      message: "Error resending payslip",
      error: error.message,
    });
  }
};

// @desc    Download payslip PDF
// @route   GET /api/payroll/payslips/:payrollId/download/:employeeId
// @access  Private (Super Admin, HOD, Employee - own payslip only)
const downloadPayslip = async (req, res) => {
  try {
    const { payrollId, employeeId } = req.params;

    // Helper function to get month name
    const getMonthName = (month) => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return months[month - 1] || "Unknown";
    };

    // Validate input
    if (!payrollId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Payroll ID and Employee ID are required",
      });
    }

    const Payroll = (await import("../models/Payroll.js")).default;
    const savedPayroll = await Payroll.findById(payrollId)
      .populate(
        "employee",
        "firstName lastName email employeeId department role position jobTitle"
      )
      .populate("employee.department", "name code")
      .populate("employee.role", "name level description")
      .populate(
        "payrolls.employee",
        "firstName lastName email employeeId department role position jobTitle"
      )
      .populate("payrolls.employee.department", "name code")
      .populate("payrolls.employee.role", "name level description");

    if (!savedPayroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    let employeePayroll = null;

    if (savedPayroll.payrolls && savedPayroll.payrolls.length > 0) {
      employeePayroll = savedPayroll.payrolls.find(
        (p) => p.employee._id.toString() === employeeId
      );
    } else if (
      savedPayroll.employee &&
      savedPayroll.employee._id.toString() === employeeId
    ) {
      const employee = savedPayroll.employee;
      employeePayroll = {
        employee: employee,
        baseSalary: savedPayroll.baseSalary,
        grossSalary: savedPayroll.grossSalary,
        netSalary: savedPayroll.netSalary,
        totalDeductions: savedPayroll.totalDeductions,
        paye: savedPayroll.paye,
        pension: savedPayroll.pension,
        nhis: savedPayroll.nhis,
        personalAllowances: savedPayroll.personalAllowances,
        personalBonuses: savedPayroll.personalBonuses,
        voluntaryDeductions: savedPayroll.voluntaryDeductions,
        taxableIncome: savedPayroll.taxableIncome,
        nonTaxableAllowances: savedPayroll.nonTaxableAllowances,
        totalAllowances: savedPayroll.totalAllowances,
        totalBonuses: savedPayroll.totalBonuses,
      };
    }

    if (!employeePayroll) {
      return res.status(404).json({
        success: false,
        message: "Employee payroll not found",
      });
    }

    // Permission checks
    const isOwner =
      savedPayroll.createdBy &&
      savedPayroll.createdBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role && req.user.role.level >= 1000;
    const isEmployee =
      employeePayroll.employee._id.toString() === req.user._id.toString();
    const isHOD = req.user.role && req.user.role.level >= 700;

    // HR HODs can access all employee payroll breakdowns
    const canHODAccess = isHOD;

    if (!isOwner && !isSuperAdmin && !isEmployee && !canHODAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this payslip",
      });
    }

    // Generate PDF using PayslipService
    const PayslipService = (await import("../services/payslipService.js"))
      .default;
    const payslipService = new PayslipService();

    const payslipPayrollData = {
      period: {
        month: savedPayroll.month,
        year: savedPayroll.year,
        monthName: getMonthName(savedPayroll.month),
        frequency: savedPayroll.frequency || "monthly",
      },
      scope: savedPayroll.scope,
      payrolls: [employeePayroll],
      payrollId: savedPayroll._id,
    };

    const payslipFile = await payslipService.generatePayslipPDF(
      payslipPayrollData,
      employeePayroll.employee
    );

    const fileName = `${employeePayroll.employee.firstName}_${employeePayroll.employee.lastName}_${payslipPayrollData.period.monthName}_${payslipPayrollData.period.year}_payslip.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "public, max-age=3600");

    res.sendFile(payslipFile.filePath);
  } catch (error) {
    console.error("Error downloading payslip:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading payslip",
      error: error.message,
    });
  }
};

// Get personal payslips for the logged-in employee
const getPersonalPayslips = async (req, res) => {
  try {
    const { month, year } = req.query;
    const employeeId = req.user._id;

    const filter = {
      $or: [{ employee: employeeId }, { "payrolls.employee": employeeId }],
    };

    if (year && year !== "all") {
      filter.year = parseInt(year);
    }
    if (month && month !== "all") {
      filter.month = parseInt(month);
    }

    const Payroll = (await import("../models/Payroll.js")).default;

    const payrolls = await Payroll.find(filter)
      .populate({
        path: "employee",
        select: "firstName lastName employeeId email department role",
        populate: [
          { path: "department", select: "name" },
          { path: "role", select: "name" },
        ],
      })
      .populate({
        path: "payrolls.employee",
        select: "firstName lastName employeeId email department role",
        populate: [
          { path: "department", select: "name" },
          { path: "role", select: "name" },
        ],
      })
      .sort({ year: -1, month: -1 })
      .lean();

    const personalPayslips = [];

    payrolls.forEach((payroll, index) => {
      // Handle individual payrolls (direct employee field)
      if (
        payroll.employee &&
        payroll.employee._id.toString() === employeeId.toString()
      ) {
        const payslip = {
          id: `${payroll._id}-${employeeId}`,
          payrollId: payroll._id,
          employee: {
            id: payroll.employee._id,
            name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
            employeeId: payroll.employee.employeeId,
            email: payroll.employee.email,
            department: payroll.employee.department?.name || "Not Assigned",
            role: payroll.employee.role?.name || "Not Assigned",
          },
          period: {
            month: payroll.month,
            year: payroll.year,
            monthName: getMonthName(payroll.month),
            frequency: payroll.frequency,
          },
          scope: payroll.scope,
          summary: {
            grossPay: payroll.grossSalary || 0,
            netPay: payroll.netSalary || 0,
            totalDeductions: payroll.totalDeductions || 0,
            taxableIncome: payroll.taxableIncome || 0,
          },
          baseSalary: payroll.baseSalary || 0,
          allowances: payroll.personalAllowances || [],
          bonuses: payroll.personalBonuses || [],
          deductions: payroll.deductions || [],
          taxBreakdown: {
            paye: payroll.paye || 0,
            pension: payroll.pension || 0,
            nhis: payroll.nhis || 0,
          },
          status: "generated",
          createdAt: payroll.createdAt,
          updatedAt: payroll.updatedAt,
        };

        personalPayslips.push(payslip);
      }

      if (payroll.payrolls && Array.isArray(payroll.payrolls)) {
        const employeePayroll = payroll.payrolls.find(
          (p) => p.employee._id.toString() === employeeId.toString()
        );

        if (employeePayroll) {
          const payslip = {
            id: `${payroll._id}-${employeeId}`,
            payrollId: payroll._id,
            employee: {
              id: employeePayroll.employee._id,
              name: `${employeePayroll.employee.firstName} ${employeePayroll.employee.lastName}`,
              employeeId: employeePayroll.employee.employeeId,
              email: employeePayroll.employee.email,
              department:
                employeePayroll.employee.department?.name || "Not Assigned",
              role: employeePayroll.employee.role?.name || "Not Assigned",
            },
            period: {
              month: payroll.month,
              year: payroll.year,
              monthName: getMonthName(payroll.month),
              frequency: payroll.frequency,
            },
            scope: payroll.scope,
            summary: {
              grossPay: employeePayroll.grossSalary || 0,
              netPay: employeePayroll.netSalary || 0,
              totalDeductions: employeePayroll.totalDeductions || 0,
              taxableIncome: employeePayroll.taxableIncome || 0,
            },
            baseSalary: employeePayroll.baseSalary || 0,
            allowances: employeePayroll.personalAllowances || [],
            bonuses: employeePayroll.personalBonuses || [],
            deductions: employeePayroll.deductions || [],
            taxBreakdown: {
              paye: employeePayroll.paye || 0,
              pension: employeePayroll.pension || 0,
              nhis: employeePayroll.nhis || 0,
            },
            status: "generated",
            createdAt: payroll.createdAt,
            updatedAt: payroll.updatedAt,
          };

          personalPayslips.push(payslip);
        }
      }
    });

    res.json({
      success: true,
      data: personalPayslips,
      total: personalPayslips.length,
    });
  } catch (error) {
    console.error("Error fetching personal payslips:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch personal payslips",
      error: error.message,
    });
  }
};

// @desc    Resend payroll preview to Finance HOD
// @route   POST /api/payroll/approvals/:approvalId/resend
// @access  Private (HR HOD, Super Admin)
const resendToFinance = async (req, res) => {
  try {
    const { approvalId } = req.params;

    // Get the existing approval
    const PayrollApproval = (await import("../models/PayrollApproval.js"))
      .default;
    const existingApproval = await PayrollApproval.findOne({ approvalId });

    if (!existingApproval) {
      return res.status(404).json({
        success: false,
        message: "Payroll approval not found",
      });
    }

    if (existingApproval.approvalStatus !== "pending_finance") {
      return res.status(400).json({
        success: false,
        message: "Can only resend pending finance approvals",
      });
    }

    // Send notification to Finance HOD using the same logic as submitForApproval
    try {
      const NotificationService = (
        await import("../services/notificationService.js")
      ).default;
      const notificationService = new NotificationService();

      const User = (await import("../models/User.js")).default;
      const Department = (await import("../models/Department.js")).default;
      const Role = (await import("../models/Role.js")).default;

      const financeDept = await Department.findOne({
        name: "Finance & Accounting",
      });

      if (!financeDept) {
        console.error(
          "❌ [NOTIFICATION] Finance & Accounting department not found"
        );
        return res.status(500).json({
          success: false,
          message: "Finance department not found",
        });
      }

      console.log(
        `🏢 [NOTIFICATION] Found Finance department: ${financeDept._id}`
      );

      const hodRole = await Role.findOne({ name: "HOD" });

      let financeHOD = null;

      if (hodRole) {
        financeHOD = await User.findOne({
          role: hodRole._id,
          department: financeDept._id,
        });

        console.log(
          `👥 [NOTIFICATION] Found Finance HOD by role ID: ${
            financeHOD ? "Yes" : "No"
          }`
        );
      }

      if (!financeHOD) {
        console.log(
          `🔄 [NOTIFICATION] No HOD found by role ID, trying role level fallback...`
        );
        financeHOD = await User.findOne({
          department: financeDept._id,
          "role.level": { $gte: 700 },
        });
        console.log(
          `👥 [NOTIFICATION] Found Finance HOD by role level: ${
            financeHOD ? "Yes" : "No"
          }`
        );
      }

      if (financeHOD) {
        await notificationService.createNotification({
          recipient: financeHOD._id,
          type: "PAYROLL_APPROVAL_REQUEST",
          title: "Payroll Approval Request (Resent)",
          message: `A payroll preview has been resent for your approval. Approval ID: ${approvalId}`,
          data: {
            approvalId: approvalId,
            requesterId: req.user._id,
            requesterName: `${req.user.firstName} ${req.user.lastName}`,
            period: existingApproval.period,
            totalEmployees: existingApproval.financialSummary?.totalEmployees,
            totalNetPay: existingApproval.financialSummary?.totalNetPay,
            isResend: true,
          },
        });

        console.log(
          `📧 [NOTIFICATION] Sent resend notification to Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName}`
        );
      } else {
        console.log(
          "⚠️ [NOTIFICATION] Finance HOD not found - skipping notification"
        );
      }

      await notificationService.createNotification({
        recipient: req.user._id,
        type: "PAYROLL_RESEND_CONFIRMATION",
        title: "Payroll Resent to Finance",
        message: `Your payroll preview has been resent to Finance HOD for approval. Approval ID: ${approvalId}`,
        data: {
          approvalId: approvalId,
          resentAt: new Date(),
        },
      });

      console.log(
        `📧 [NOTIFICATION] Sent resend confirmation to requester: ${req.user.firstName} ${req.user.lastName}`
      );
    } catch (notificationError) {
      console.error(
        "❌ [NOTIFICATION] Error sending notifications:",
        notificationError
      );
    }

    res.json({
      success: true,
      data: {
        approvalId: approvalId,
        status: "resent",
        resentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ [PAYROLL_RESEND] Error resending to finance:", error);
    res.status(500).json({
      success: false,
      message: "Error resending payroll to finance",
      error: error.message,
    });
  }
};

// @desc    Process approved payroll (deduct funds and generate payslips)
// @route   POST /api/payroll/process/:approvalId
// @access  Private (HR HOD, Super Admin)
const processApprovedPayrollV2 = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const processedBy = req.user._id;

    // Check if user is HR HOD or Super Admin
    const isHRHOD =
      req.user.department?.name === "Human Resources" &&
      req.user.role?.level >= 700;
    const isSuperAdmin = req.user.role?.level >= 1000;

    if (!isHRHOD && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HR HOD and Super Admin can process payroll.",
      });
    }

    // Process the payroll using the service
    const result = await PayrollApprovalService.processPayroll(
      approvalId,
      processedBy
    );

    console.log(
      `✅ [PAYROLL_CONTROLLER] Payroll processed successfully: ${approvalId}`
    );

    res.status(200).json({
      success: true,
      message:
        "Payroll processed successfully. Funds deducted and payslips generated.",
      data: {
        approvalId: result.approvalId,
        status: result.approvalStatus,
        processedAt: result.processedAt,
        totalNetPay: result.financialSummary.totalNetPay,
        totalEmployees: result.financialSummary.totalEmployees,
      },
    });
  } catch (error) {
    console.error("Error processing approved payroll:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process payroll",
    });
  }
};

export {
  processPayroll,
  processPayrollWithData,
  submitForApproval,
  calculateEmployeePayroll,
  getPayrollPreview,
  getPendingApprovals,
  getApprovalDetails,
  getPayrollPreviewForHR,
  approvePayroll,
  rejectPayroll,
  processApprovedPayroll,
  processApprovedPayrollV2,
  getPayrollSummary,
  getSavedPayrolls,
  getEmployeePayrollBreakdown,
  resendPayslips,
  getPayslips,
  searchPayslips,
  viewPayslip,
  resendPayslip,
  getAllPayslips,
  getPersonalPayslips,
  downloadPayslip,
  calculateFinalPayroll,
  getFinalPayrollData,
  resendToFinance,
};

// @desc    Calculate final payroll for offboarding employee
// @route   POST /api/payroll/final
// @access  Private (Super Admin, HR HOD)
const calculateFinalPayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    // Validate input
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const currentDate = new Date();
    const finalMonth = month || currentDate.getMonth() + 1;
    const finalYear = year || currentDate.getFullYear();

    console.log(
      `🚀 [FINAL PAYROLL API] Calculating final payroll for employee: ${employeeId}`
    );

    // Calculate final payroll
    const finalPayrollData = await PayrollService.calculateFinalPayroll(
      employeeId,
      finalMonth,
      finalYear
    );

    // Log the action
    await AuditService.logUserAction(
      req.user._id,
      "FINAL_PAYROLL_CALCULATED",
      employeeId,
      {
        employeeId,
        month: finalMonth,
        year: finalYear,
        finalNetPay: finalPayrollData.summary.finalNetPay,
        gratuityAmount: finalPayrollData.finalPayments.gratuity.gratuityAmount,
        leavePayoutAmount:
          finalPayrollData.finalPayments.leavePayout.leavePayout,
        description: `Final payroll calculated for ${finalPayrollData.employee.name}`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      success: true,
      message: "Final payroll calculated successfully",
      data: finalPayrollData,
    });
  } catch (error) {
    console.error(
      "❌ [FINAL PAYROLL API] Error calculating final payroll:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate final payroll",
    });
  }
};

// @desc    Get final payroll data for offboarded employee
// @route   GET /api/payroll/final/:employeeId
// @access  Private (Super Admin, HR HOD)
const getFinalPayrollData = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find the offboarding lifecycle with final payroll data
    const EmployeeLifecycle = (await import("../models/EmployeeLifecycle.js"))
      .default;

    const offboardingLifecycle = await EmployeeLifecycle.findOne({
      employee: employeeId,
      type: "Offboarding",
      status: "Completed",
      finalPayrollData: { $exists: true, $ne: null },
    }).populate("employee", "firstName lastName email employeeId");

    if (!offboardingLifecycle) {
      return res.status(404).json({
        success: false,
        message: "Final payroll data not found for this employee",
      });
    }

    res.json({
      success: true,
      message: "Final payroll data retrieved successfully",
      data: {
        employee: offboardingLifecycle.employee,
        finalPayrollData: offboardingLifecycle.finalPayrollData,
        offboardingCompletedAt: offboardingLifecycle.actualCompletionDate,
      },
    });
  } catch (error) {
    console.error(
      "❌ [FINAL PAYROLL API] Error retrieving final payroll data:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve final payroll data",
    });
  }
};
