import api from "../services/api.js";

/**
 * Payslip Utility Functions
 * Handles all payslip operations without hardcoding
 */

/**
 * Get payslips for a specific payroll
 * @param {string} payrollId - The payroll ID
 * @param {string} employeeId - Optional employee ID to filter
 * @returns {Promise<Object>} Payslips data
 */
export const getPayslips = async (payrollId, employeeId = null) => {
  try {
    const params = employeeId ? { employeeId } : {};
    const response = await api.get(`/payroll/payslips/${payrollId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching payslips:", error);
    throw error;
  }
};

/**
 * View payslip PDF in new tab
 * @param {string} payrollId - The payroll ID
 * @param {string} employeeId - The employee ID
 */
export const viewPayslip = (payrollId, employeeId) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const payslipUrl = `${baseUrl}/payroll/payslips/${payrollId}/view/${employeeId}`;

    // Open PDF in new tab
    window.open(payslipUrl, "_blank");
    return { success: true, message: "Opening payslip in new tab..." };
  } catch (error) {
    console.error("Error viewing payslip:", error);
    throw error;
  }
};

/**
 * Download payslip PDF
 * @param {string} payrollId - The payroll ID
 * @param {string} employeeId - The employee ID
 * @param {string} fileName - Optional custom filename
 */
export const downloadPayslip = async (
  payrollId,
  employeeId,
  fileName = null
) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const payslipUrl = `${baseUrl}/payroll/payslips/${payrollId}/download/${employeeId}`;

    // Create a temporary link to download the file
    const link = document.createElement("a");
    link.href = payslipUrl;

    if (fileName) {
      link.download = fileName;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: "Payslip download started!" };
  } catch (error) {
    console.error("Error downloading payslip:", error);
    throw error;
  }
};

/**
 * Resend payslip to employee
 * @param {string} payrollId - The payroll ID
 * @param {string} employeeId - The employee ID
 * @returns {Promise<Object>} Resend result
 */
export const resendPayslip = async (payrollId, employeeId) => {
  try {
    const response = await api.post(
      `/payroll/payslips/${payrollId}/resend/${employeeId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error resending payslip:", error);
    throw error;
  }
};

/**
 * Resend multiple payslips
 * @param {string} payrollId - The payroll ID
 * @param {Array<string>} employeeIds - Array of employee IDs (optional, if null sends to all)
 * @returns {Promise<Object>} Resend result
 */
export const resendMultiplePayslips = async (payrollId, employeeIds = null) => {
  try {
    const response = await api.post("/payroll/resend-payslips", {
      payrollId,
      employeeIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error resending payslips:", error);
    throw error;
  }
};

/**
 * Generate payslip filename
 * @param {Object} employee - Employee data
 * @param {Object} period - Period data
 * @returns {string} Generated filename
 */
export const generatePayslipFileName = (employee, period) => {
  const employeeName =
    employee.name || `${employee.firstName} ${employee.lastName}`;
  const employeeId = employee.employeeId || employee.id;
  const monthName = period.monthName || period.month;
  const year = period.year;

  return `payslip_${employeeName}_${employeeId}_${monthName}_${year}.pdf`;
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: NGN)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

/**
 * Get payslip status based on data
 * @param {Object} payslip - Payslip data
 * @returns {string} Status string
 */
export const getPayslipStatus = (payslip) => {
  if (!payslip) return "unknown";

  // Check if payslip has been generated
  if (payslip.summary && payslip.summary.netPay) {
    return "generated";
  }

  return "pending";
};

/**
 * Validate payslip access permissions
 * @param {Object} payslip - Payslip data
 * @param {Object} user - Current user data
 * @returns {Object} Access permissions
 */
export const validatePayslipAccess = (payslip, user) => {
  if (!payslip || !user) {
    return { canView: false, canDownload: false, canResend: false };
  }

  const isOwner = payslip.createdBy === user._id;
  const isSuperAdmin = user.role?.includes("SUPER_ADMIN");
  const isHOD = user.role?.includes("HOD");
  const isEmployee = payslip.employee?.id === user._id;

  return {
    canView: isOwner || isSuperAdmin || isHOD || isEmployee,
    canDownload: isOwner || isSuperAdmin || isHOD || isEmployee,
    canResend: isOwner || isSuperAdmin || isHOD,
  };
};

/**
 * Get payslip summary statistics
 * @param {Array} payslips - Array of payslips
 * @returns {Object} Summary statistics
 */
export const getPayslipSummary = (payslips) => {
  if (!payslips || payslips.length === 0) {
    return {
      total: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeductions: 0,
      averageGrossPay: 0,
      averageNetPay: 0,
    };
  }

  const total = payslips.length;
  const totalGrossPay = payslips.reduce(
    (sum, p) => sum + (p.summary?.grossPay || 0),
    0
  );
  const totalNetPay = payslips.reduce(
    (sum, p) => sum + (p.summary?.netPay || 0),
    0
  );
  const totalDeductions = payslips.reduce(
    (sum, p) => sum + (p.summary?.totalDeductions || 0),
    0
  );

  return {
    total,
    totalGrossPay,
    totalNetPay,
    totalDeductions,
    averageGrossPay: totalGrossPay / total,
    averageNetPay: totalNetPay / total,
  };
};

/**
 * Filter payslips by various criteria
 * @param {Array} payslips - Array of payslips
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered payslips
 */
export const filterPayslips = (payslips, filters = {}) => {
  if (!payslips || payslips.length === 0) return [];

  let filtered = [...payslips];

  // Filter by month
  if (filters.month && filters.month !== "all") {
    filtered = filtered.filter((p) => p.period.month === filters.month);
  }

  // Filter by year
  if (filters.year && filters.year !== "all") {
    filtered = filtered.filter((p) => p.period.year === filters.year);
  }

  // Filter by scope
  if (filters.scope && filters.scope !== "all") {
    filtered = filtered.filter((p) => p.scope === filters.scope);
  }

  // Filter by search term
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.employee.name.toLowerCase().includes(searchLower) ||
        p.employee.employeeId.toLowerCase().includes(searchLower) ||
        p.employee.email.toLowerCase().includes(searchLower)
    );
  }

  // Filter by department
  if (filters.department && filters.department !== "all") {
    filtered = filtered.filter(
      (p) => p.employee.department === filters.department
    );
  }

  return filtered;
};

/**
 * Sort payslips by various criteria
 * @param {Array} payslips - Array of payslips
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Array} Sorted payslips
 */
export const sortPayslips = (
  payslips,
  sortBy = "createdAt",
  sortOrder = "desc"
) => {
  if (!payslips || payslips.length === 0) return [];

  const sorted = [...payslips];

  sorted.sort((a, b) => {
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
        aValue = a.summary?.grossPay || 0;
        bValue = b.summary?.grossPay || 0;
        break;
      case "netPay":
        aValue = a.summary?.netPay || 0;
        bValue = b.summary?.netPay || 0;
        break;
      case "deductions":
        aValue = a.summary?.totalDeductions || 0;
        bValue = b.summary?.totalDeductions || 0;
        break;
      case "createdAt":
      default:
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sorted;
};

export default {
  getPayslips,
  viewPayslip,
  downloadPayslip,
  resendPayslip,
  resendMultiplePayslips,
  generatePayslipFileName,
  formatCurrency,
  getPayslipStatus,
  validatePayslipAccess,
  getPayslipSummary,
  filterPayslips,
  sortPayslips,
};
