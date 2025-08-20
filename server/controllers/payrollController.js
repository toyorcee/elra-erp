import PayrollService from "../services/payrollService.js";
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

    const payrollResult = await PayrollService.processPayroll(
      month,
      year,
      frequency,
      scope,
      scopeId,
      req.user._id,
      false
    );

    res.status(200).json({
      success: true,
      message: "Payroll processed successfully",
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

    console.log(
      "💾 [PAYROLL CONTROLLER] =========================================="
    );
    console.log("💾 [PAYROLL CONTROLLER] PAYROLL SAVED TO DATABASE!");
    console.log("💾 [PAYROLL CONTROLLER] Summary Data:");
    console.log(
      "💾 [PAYROLL CONTROLLER] - Total Employees:",
      payrollData.payrolls.length
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] - Total Gross Pay: ₦" +
        payrollData.totalGrossPay?.toLocaleString()
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] - Total Net Pay: ₦" +
        payrollData.totalNetPay?.toLocaleString()
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] - Total Deductions: ₦" +
        payrollData.totalDeductions?.toLocaleString()
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] - Total PAYE: ₦" +
        payrollData.totalPAYE?.toLocaleString()
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] - Total Taxable Income: ₦" +
        payrollData.totalTaxableIncome?.toLocaleString()
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] - Period:",
      payrollData.period?.monthName + " " + payrollData.period?.year
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] - Scope Type:",
      payrollData.scope?.type
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] - Saved Payroll ID:",
      savedPayroll.payrollId
    );
    console.log(
      "💾 [PAYROLL CONTROLLER] =========================================="
    );

    // Send notification to the creator
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
      console.log("✅ [PAYROLL CONTROLLER] Notification sent to creator");
    } catch (notificationError) {
      console.error(
        "❌ [PAYROLL CONTROLLER] Failed to send notification:",
        notificationError
      );
    }

    // Generate and send payslips for all employees
    try {
      console.log("📄 [PAYROLL CONTROLLER] Starting payslip generation...");
      const payslipService = new PayslipService();

      for (const payroll of payrollData.payrolls) {
        try {
          const employeeData = payroll.employee;

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

          console.log(
            `📄 [PAYROLL CONTROLLER] Payslip generated for ${employeeData.firstName} ${employeeData.lastName}: ${payslipFile.fileName}`
          );

          await payslipService.sendPayslipNotification(
            payslipPayrollData,
            employeeData,
            payslipFile
          );

          console.log(
            `📧 [PAYROLL CONTROLLER] Payslip sent to ${employeeData.firstName} ${employeeData.lastName} (${employeeData.email})`
          );
        } catch (payslipError) {
          console.error(
            `❌ [PAYROLL CONTROLLER] Failed to generate/send payslip for employee ${payroll.employee?.firstName} ${payroll.employee?.lastName}:`,
            payslipError
          );
          // Continue with other employees even if one fails
        }
      }

      console.log(
        "✅ [PAYROLL CONTROLLER] Payslip generation and sending completed"
      );
    } catch (payslipError) {
      console.error(
        "❌ [PAYROLL CONTROLLER] Failed to generate/send payslips:",
        payslipError
      );
      // Don't fail the entire payroll process if payslip generation fails
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

    if (isHOD && !isSuperAdmin) {
      if (req.user.department) {
        filter.department = req.user.department._id;
      } else {
        return res.status(403).json({
          success: false,
          message: "Access denied. HOD must be assigned to a department.",
        });
      }
    }

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
          _id: key,
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

    // For HOD, check if they can access payrolls from their department
    const canHODAccess =
      isHOD &&
      // Check if any payroll in the batch belongs to HOD's department
      batchPayrolls.some(
        (payroll) =>
          payroll.employee &&
          payroll.employee.department &&
          req.user.department &&
          payroll.employee.department._id.toString() ===
            req.user.department._id.toString()
      );

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

    // For HOD, further filter to only include employees from their department
    if (isHOD && !isSuperAdmin) {
      payrollsToProcess = payrollsToProcess.filter(
        (payroll) =>
          payroll.employee &&
          payroll.employee.department &&
          req.user.department &&
          payroll.employee.department._id.toString() ===
            req.user.department._id.toString()
      );
    }

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
          `❌ [PAYROLL CONTROLLER] Failed to resend payslip for employee ${payroll.employee?.firstName} ${payroll.employee?.lastName}:`,
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
    console.error("❌ [PAYROLL CONTROLLER] Error resending payslips:", error);
    console.error("❌ [PAYROLL CONTROLLER] Error stack:", error.stack);
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
      !req.user.role.includes("SUPER_ADMIN")
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

    const canHODAccess =
      isHOD &&
      ((employeePayroll.employee.department &&
        req.user.department &&
        employeePayroll.employee.department._id.toString() ===
          req.user.department._id.toString()) ||
        (employeePayroll.employee.department &&
          employeePayroll.employee.department.manager &&
          employeePayroll.employee.department.manager.toString() ===
            req.user._id.toString()));

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

    // Set response headers for PDF viewing
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${payslipFile.fileName}"`
    );
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Send the PDF file
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

// @desc    Download payslip PDF
// @route   GET /api/payroll/payslips/:payrollId/download/:employeeId
// @access  Private (Super Admin, HOD, Employee)
const downloadPayslip = async (req, res) => {
  try {
    const { payrollId, employeeId } = req.params;

    // Validate input
    if (!payrollId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Payroll ID and Employee ID are required",
      });
    }

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

    // Check access permissions
    const isOwner =
      savedPayroll.createdBy &&
      savedPayroll.createdBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role && req.user.role.level >= 1000;
    const isEmployee =
      employeePayroll.employee._id.toString() === req.user._id.toString();
    const isHOD = req.user.role && req.user.role.level >= 700;

    // For HOD, check if they can access this specific employee's department
    const canHODAccess =
      isHOD &&
      // HOD can access if employee is in their department
      ((employeePayroll.employee.department &&
        req.user.department &&
        employeePayroll.employee.department._id.toString() ===
          req.user.department._id.toString()) ||
        // Or if HOD is the manager of the employee's department
        (employeePayroll.employee.department &&
          employeePayroll.employee.department.manager &&
          employeePayroll.employee.department.manager.toString() ===
            req.user._id.toString()));

    if (!isOwner && !isSuperAdmin && !isEmployee && !canHODAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this payslip",
      });
    }

    // Generate payslip PDF
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

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${payslipFile.fileName}"`
    );
    res.setHeader("Cache-Control", "no-cache");

    // Send the PDF file
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

    // Check if user has access to this payroll
    if (
      savedPayroll.createdBy.toString() !== req.user._id.toString() &&
      !req.user.role.includes("SUPER_ADMIN")
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

export {
  processPayroll,
  processPayrollWithData,
  calculateEmployeePayroll,
  getPayrollPreview,
  getPayrollSummary,
  getSavedPayrolls,
  getEmployeePayrollBreakdown,
  resendPayslips,
  getPayslips,
  viewPayslip,
  downloadPayslip,
  resendPayslip,
};
