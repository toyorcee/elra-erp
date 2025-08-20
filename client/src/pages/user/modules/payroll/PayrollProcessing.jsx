import React, { useState, useEffect } from "react";
import {
  HiCalculator,
  HiDocumentText,
  HiUserGroup,
  HiCurrencyDollar,
  HiCalendar,
  HiCheckCircle,
  HiExclamation,
  HiRefresh,
  HiPlay,
  HiPause,
  HiStop,
  HiMinusCircle,
  HiPlus,
  HiEye,
  HiX,
  HiClock,
  HiOfficeBuilding,
  HiUser,
  HiMail,
} from "react-icons/hi";
import { toast } from "react-toastify";
import PayrollProcessingForm from "../../../../components/payroll/PayrollProcessingForm.jsx";
import { userModulesAPI } from "../../../../services/userModules.js";
import ELRALogo from "../../../../assets/ELRA.png";

const PayrollProcessing = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recentPayrolls, setRecentPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] =
    useState(false);
  const [resendingPayslips, setResendingPayslips] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [selectedPayrollForResend, setSelectedPayrollForResend] =
    useState(null);

  useEffect(() => {
    fetchSavedPayrolls();
  }, [filters]);

  const fetchSavedPayrolls = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.payroll.getSavedPayrolls(filters);
      if (response.success) {
        const payrolls = response.data.payrolls || [];

        setRecentPayrolls(payrolls);
      }
    } catch (error) {
      console.error(
        "❌ [PAYROLL PROCESSING] Error fetching saved payrolls:",
        error
      );
      toast.error("Failed to fetch saved payrolls");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = (payrollData) => {
    fetchSavedPayrolls();
    setIsFormOpen(false);
  };

  const handleViewPayrollDetails = async (payroll) => {
    try {
      setDetailLoading(true);
      setSelectedPayroll(payroll);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Error loading payroll details:", error);
      toast.error("Failed to load payroll details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewEmployeeDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeDetailModalOpen(true);
  };

  const handleViewPayslip = (payroll) => {
    try {
      let employeeId = null;
      let employeeData = null;

      if (payroll.payrolls && payroll.payrolls.length > 0) {
        employeeData = payroll.payrolls[0].employee;
        employeeId = employeeData?._id || employeeData?.id;
      } else if (payroll.employee) {
        employeeData = payroll.employee;
        employeeId = employeeData._id || employeeData.id;
      }

      if (!employeeId) {
        toast.error("Employee ID not found in payroll data");
        return;
      }

      const payrollId = payroll.payrollIds?.[0] || payroll._id;
      const payslipUrl = `/api/payroll/payslips/${payrollId}/view/${employeeId}`;
      const fullUrl = `${window.location.origin}${payslipUrl}?t=${Date.now()}`;

      window.open(fullUrl, "_blank");
    } catch (error) {
      console.error("❌ [PAYROLL PROCESSING] Error viewing payslip:", error);
      toast.error("Failed to open payslip");
    }
  };

  const handleResendPayslips = async (payrollId, employeeIds = null) => {
    const payroll = recentPayrolls.find((p) => p._id === payrollId);

    if (payroll) {
      setSelectedPayrollForResend(payroll);
      setShowResendConfirmation(true);
    } else {
      console.error(
        "❌ [PAYROLL PROCESSING] Payroll not found for ID:",
        payrollId
      );
      toast.error("Payroll not found. Please refresh and try again.");
    }
  };

  const confirmResendPayslips = async () => {
    if (!selectedPayrollForResend) return;

    const actualPayrollId = selectedPayrollForResend.payrollIds?.[0];
    if (!actualPayrollId) {
      toast.error(
        "No payroll data found for resending. Please refresh and try again."
      );
      return;
    }

    try {
      setResendingPayslips(true);

      const response = await userModulesAPI.payroll.resendPayslips(
        actualPayrollId,
        null
      );

      if (response.success) {
        const { successCount, errorCount, results } = response.data;

        if (errorCount === 0) {
          toast.success(
            `✅ All payslips sent successfully! (${successCount} sent)`
          );

          const firstSuccessResult = results.find(
            (result) => result.status === "success" && result.payslipUrl
          );
          if (firstSuccessResult) {
            const fullUrl = `${window.location.origin}${firstSuccessResult.payslipUrl}`;
            window.open(fullUrl, "_blank");
          }
        } else {
          toast.warning(
            `⚠️ Payslips sent with some errors. Success: ${successCount}, Errors: ${errorCount}`
          );

          const firstSuccessResult = results.find(
            (result) => result.status === "success" && result.payslipUrl
          );
          if (firstSuccessResult) {
            const fullUrl = `${window.location.origin}${firstSuccessResult.payslipUrl}`;
            window.open(fullUrl, "_blank");
          }
        }

        // Close modal only after successful completion
        setShowResendConfirmation(false);
        setSelectedPayrollForResend(null);
      } else {
        toast.error("Failed to resend payslips");
      }
    } catch (error) {
      console.error("Error resending payslips:", error);

      // Show only one clean error message
      toast.error("Failed to resend payslips. Please try again.");
    } finally {
      setResendingPayslips(false);

      if (!selectedPayrollForResend) {
        setShowResendConfirmation(false);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDefaultAvatar = (employee = null) => {
    if (employee?.firstName || employee?.lastName) {
      const firstName = employee.firstName || "";
      const lastName = employee.lastName || "";
      return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff&size=40&rounded=true`;
    }
    return "https://ui-avatars.com/api/?name=Unknown+Employee&background=random&color=fff&size=40&rounded=true";
  };

  const getImageUrl = (avatarPath, employee = null) => {
    if (!avatarPath) return getDefaultAvatar(employee);

    let path = avatarPath;
    if (typeof avatarPath === "object" && avatarPath.url) {
      path = avatarPath.url;
    }

    if (path.startsWith("http")) return path;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");

    return `${baseUrl}${path}`;
  };

  const getEmployeeAvatar = (employee) => {
    try {
      return getImageUrl(employee.avatar, employee);
    } catch (error) {
      return getDefaultAvatar(employee);
    }
  };

  const getDepartmentName = (employee) => {
    if (!employee) return "N/A";

    // Handle different department data structures
    if (employee.department?.name) {
      return employee.department.name;
    }

    if (typeof employee.department === "string") {
      return employee.department;
    }

    if (employee.department?._id) {
      // This might be a populated department object
      return employee.department.name || "N/A";
    }

    return "N/A";
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payroll Processing
          </h1>
          <p className="text-gray-600 mt-1">
            Calculate and process payroll for employees with scope-based
            processing
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-6 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center cursor-pointer"
        >
          <HiPlus className="w-4 h-4 mr-2 cursor-pointer" />
          Process Payroll
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Filter Payrolls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  month: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {[
                { value: 1, label: "January" },
                { value: 2, label: "February" },
                { value: 3, label: "March" },
                { value: 4, label: "April" },
                { value: 5, label: "May" },
                { value: 6, label: "June" },
                { value: 7, label: "July" },
                { value: 8, label: "August" },
                { value: 9, label: "September" },
                { value: 10, label: "October" },
                { value: 11, label: "November" },
                { value: 12, label: "December" },
              ].map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  year: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - 2 + i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchSavedPayrolls}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <HiRefresh className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <HiUserGroup className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">
                Total Payroll Groups
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {recentPayrolls.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <HiCurrencyDollar className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">
                Total Gross Pay
              </p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(
                  recentPayrolls.reduce(
                    (sum, payroll) => sum + (payroll.totalGrossPay || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <HiMinusCircle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">
                Total Deductions
              </p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(
                  recentPayrolls.reduce(
                    (sum, payroll) => sum + (payroll.totalDeductions || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <HiCheckCircle className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">
                Total Net Pay
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(
                  recentPayrolls.reduce(
                    (sum, payroll) => sum + (payroll.totalNetPay || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Payrolls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Saved Payrolls
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <HiRefresh className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading payrolls...</p>
          </div>
        ) : recentPayrolls.length === 0 ? (
          <div className="text-center py-12">
            <HiDocumentText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No payrolls found for the selected period. Click "Process Payroll"
              to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processing Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPayrolls.map((payroll, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payroll.period?.monthName} {payroll.period?.year}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payroll.period?.frequency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {payroll.scope || "company"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payroll.period?.frequency || "monthly"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payroll.totalEmployees || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payroll.totalGrossPay || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                      {formatCurrency(payroll.totalNetPay || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payroll.processingDate
                        ? new Date(payroll.processingDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewPayrollDetails(payroll)}
                          className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] flex items-center cursor-pointer"
                        >
                          <HiEye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleViewPayslip(payroll)}
                          className="text-blue-600 hover:text-blue-700 flex items-center cursor-pointer"
                          title="View payslip"
                        >
                          <HiEye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleResendPayslips(payroll._id)}
                          disabled={resendingPayslips}
                          className="text-green-600 hover:text-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          title="Resend payslip"
                        >
                          <HiRefresh
                            className={`w-4 h-4 mr-1 ${
                              resendingPayslips ? "animate-spin" : ""
                            }`}
                          />
                          {resendingPayslips ? "Sending..." : "Resend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payroll Processing Form Modal */}
      <PayrollProcessingForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Payroll Details Modal */}
      {isDetailModalOpen && selectedPayroll && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Payroll Details
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedPayroll.period?.monthName}{" "}
                  {selectedPayroll.period?.year} -{" "}
                  {selectedPayroll.scope || "company"}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleResendPayslips(selectedPayroll._id)}
                  disabled={resendingPayslips}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Resend payslips"
                >
                  <HiRefresh
                    className={`w-4 h-4 mr-2 ${
                      resendingPayslips ? "animate-spin" : ""
                    }`}
                  />
                  {resendingPayslips ? "Sending..." : "Resend Payslips"}
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedPayroll(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HiUserGroup className="w-8 h-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">
                        Total Employees
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {selectedPayroll.totalEmployees || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HiCurrencyDollar className="w-8 h-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">
                        Gross Pay
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(selectedPayroll.totalGrossPay || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HiMinusCircle className="w-8 h-8 text-red-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600">
                        Total Deductions
                      </p>
                      <p className="text-2xl font-bold text-red-900">
                        {formatCurrency(selectedPayroll.totalDeductions || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HiCheckCircle className="w-8 h-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">
                        Net Pay
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(selectedPayroll.totalNetPay || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payroll Information */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HiCalendar className="w-5 h-5 mr-2 text-gray-600" />
                  Payroll Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Period:
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedPayroll.period?.monthName}{" "}
                      {selectedPayroll.period?.year}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Frequency:
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedPayroll.period?.frequency || "monthly"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Scope:
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {selectedPayroll.scope || "company"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Processing Date:
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedPayroll.processingDate
                        ? new Date(
                            selectedPayroll.processingDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Total PAYE:
                    </span>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(selectedPayroll.totalPAYE || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Average per Employee:
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedPayroll.totalEmployees > 0
                        ? formatCurrency(
                            (selectedPayroll.totalNetPay || 0) /
                              selectedPayroll.totalEmployees
                          )
                        : "₦0"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employee Breakdown */}
              {selectedPayroll.payrolls &&
                selectedPayroll.payrolls.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <HiUser className="w-5 h-5 mr-2 text-gray-600" />
                      Employee Breakdown
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Department
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Base Salary
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Gross Pay
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Deductions
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Net Pay
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedPayroll.payrolls.map((payroll, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() =>
                                  handleViewEmployeeDetails(payroll)
                                }
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <img
                                        src={getEmployeeAvatar(
                                          payroll.employee
                                        )}
                                        alt={`${payroll.employee?.firstName} ${payroll.employee?.lastName}`}
                                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                        onError={(e) => {
                                          e.target.src = getDefaultAvatar(
                                            payroll.employee
                                          );
                                        }}
                                      />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {payroll.employee?.firstName}{" "}
                                        {payroll.employee?.lastName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {payroll.employee?.employeeId}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {getDepartmentName(payroll.employee)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatCurrency(payroll.baseSalary || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  {formatCurrency(payroll.grossSalary || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                  {formatCurrency(payroll.totalDeductions || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                                  {formatCurrency(payroll.netSalary || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              {/* Additional Information */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOfficeBuilding className="w-5 h-5 mr-2 text-gray-600" />
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created By:</span>
                    <p className="font-medium text-gray-900">
                      {selectedPayroll.payrolls?.[0]?.createdBy?.firstName}{" "}
                      {selectedPayroll.payrolls?.[0]?.createdBy?.lastName ||
                        "System"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Processed By:</span>
                    <p className="font-medium text-gray-900">
                      {selectedPayroll.payrolls?.[0]?.processedBy?.firstName}{" "}
                      {selectedPayroll.payrolls?.[0]?.processedBy?.lastName ||
                        "System"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Records:</span>
                    <p className="font-medium text-gray-900">
                      {selectedPayroll.payrolls?.length || 0} employee(s)
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Processing Time:</span>
                    <p className="font-medium text-gray-900">
                      {selectedPayroll.processingDate
                        ? new Date(
                            selectedPayroll.processingDate
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {isEmployeeDetailModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img
                  src={ELRALogo}
                  alt="ELRA Logo"
                  className="w-8 h-8 object-contain"
                />
                <div className="flex items-center space-x-3">
                  <img
                    src={getEmployeeAvatar(selectedEmployee.employee)}
                    alt={`${selectedEmployee.employee?.firstName} ${selectedEmployee.employee?.lastName}`}
                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.src = getDefaultAvatar(
                        selectedEmployee.employee
                      );
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedEmployee.employee?.firstName}{" "}
                      {selectedEmployee.employee?.lastName}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {selectedEmployee.employee?.employeeId} •{" "}
                      {getDepartmentName(selectedEmployee.employee)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEmployeeDetailModalOpen(false);
                  setSelectedEmployee(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HiCurrencyDollar className="w-6 h-6 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">
                        Base Salary
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(selectedEmployee.baseSalary || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HiCurrencyDollar className="w-6 h-6 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">
                        Gross Pay
                      </p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(selectedEmployee.grossSalary || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HiMinusCircle className="w-6 h-6 text-red-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600">
                        Deductions
                      </p>
                      <p className="text-lg font-bold text-red-900">
                        {formatCurrency(selectedEmployee.totalDeductions || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HiCheckCircle className="w-6 h-6 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">
                        Net Pay
                      </p>
                      <p className="text-lg font-bold text-purple-900">
                        {formatCurrency(selectedEmployee.netSalary || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Allowances Breakdown */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <HiPlus className="w-5 h-5 mr-2" />
                    Allowances
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">
                        Base Salary:
                      </span>
                      <span className="font-semibold text-blue-900">
                        {formatCurrency(selectedEmployee.baseSalary || 0)}
                      </span>
                    </div>

                    {/* Note: Grade allowances are included in base salary calculation */}

                    {/* Personal Allowances */}
                    {selectedEmployee.personalAllowances?.map(
                      (allowance, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center"
                        >
                          <span className="text-blue-700">
                            {allowance.name}:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(allowance.amount)}
                          </span>
                        </div>
                      )
                    )}

                    <div className="border-t border-blue-200 pt-3 mt-3">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-blue-800">Total Allowances:</span>
                        <span className="text-blue-800 text-lg">
                          {formatCurrency(
                            selectedEmployee.totalAllowances || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonuses Breakdown */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                    <HiPlus className="w-5 h-5 mr-2" />
                    Bonuses
                  </h4>
                  <div className="space-y-3 text-sm">
                    {selectedEmployee.personalBonuses?.length > 0 ? (
                      selectedEmployee.personalBonuses.map((bonus, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center"
                        >
                          <span className="text-orange-700">{bonus.name}:</span>
                          <span className="font-medium">
                            {formatCurrency(bonus.amount)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-orange-600 text-center py-4">
                        No bonuses for this period
                      </div>
                    )}

                    <div className="border-t border-orange-200 pt-3 mt-3">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-orange-800">Total Bonuses:</span>
                        <span className="text-orange-800 text-lg">
                          {formatCurrency(selectedEmployee.totalBonuses || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions Breakdown */}
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <HiMinusCircle className="w-5 h-5 mr-2" />
                    Deductions
                  </h4>
                  <div className="space-y-3 text-sm">
                    {/* Statutory Deductions */}
                    {selectedEmployee.paye > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-red-700 font-medium">
                          PAYE Tax:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(selectedEmployee.paye)}
                        </span>
                      </div>
                    )}
                    {selectedEmployee.pension > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">Pension (8%):</span>
                        <span className="font-medium">
                          {formatCurrency(selectedEmployee.pension)}
                        </span>
                      </div>
                    )}
                    {selectedEmployee.nhis > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">NHIS (5%):</span>
                        <span className="font-medium">
                          {formatCurrency(selectedEmployee.nhis)}
                        </span>
                      </div>
                    )}

                    {/* Other Deductions */}
                    {selectedEmployee.deductions?.map((deduction, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center"
                      >
                        <span className="text-red-700">{deduction.name}:</span>
                        <span className="font-medium">
                          {formatCurrency(deduction.amount)}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-red-200 pt-3 mt-3">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-red-800">Total Deductions:</span>
                        <span className="text-red-800 text-lg">
                          {formatCurrency(
                            selectedEmployee.totalDeductions || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Taxable vs Non-Taxable Summary */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HiCalculator className="w-5 h-5 mr-2" />
                  Taxable vs Non-Taxable Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-800 mb-3">
                      Taxable Income
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Base Salary:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedEmployee.baseSalary || 0)}
                        </span>
                      </div>
                      {selectedEmployee.personalAllowances?.map(
                        (allowance, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-green-700">
                              {allowance.name}:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(allowance.amount)}
                            </span>
                          </div>
                        )
                      )}
                      {selectedEmployee.personalBonuses?.map((bonus, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-green-700">{bonus.name}:</span>
                          <span className="font-medium">
                            {formatCurrency(bonus.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-green-800">Total Taxable:</span>
                          <span className="text-green-800">
                            {formatCurrency(
                              selectedEmployee.taxableIncome || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-3">
                      Non-Taxable Allowances
                    </h5>
                    <div className="space-y-2 text-sm">
                      {/* Note: Grade allowances are included in base salary calculation */}
                      <div className="border-t border-blue-200 pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-blue-800">
                            Total Non-Taxable:
                          </span>
                          <span className="text-blue-800">
                            {formatCurrency(
                              selectedEmployee.nonTaxableAllowances || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resend Confirmation Modal */}
      {showResendConfirmation && selectedPayrollForResend && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <HiMail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Resend Payslips
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedPayrollForResend.period?.monthName}{" "}
                    {selectedPayrollForResend.period?.year} -{" "}
                    {selectedPayrollForResend.scope || "company"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to resend payslips to all{" "}
                  {selectedPayrollForResend.totalEmployees || 0} employees?
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <HiExclamation className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">This will:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Generate new PDF payslips</li>
                        <li>Send emails with attachments</li>
                        <li>Create in-app notifications</li>
                        <li>May take a few minutes to complete</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Payroll Summary */}
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Payroll Summary:
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Employees:</span>
                      <p className="font-medium text-gray-900">
                        {selectedPayrollForResend.totalEmployees || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Net Pay:</span>
                      <p className="font-medium text-green-600">
                        {formatCurrency(
                          selectedPayrollForResend.totalNetPay || 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResendConfirmation(false);
                    setSelectedPayrollForResend(null);
                  }}
                  disabled={resendingPayslips}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendingPayslips ? "Please wait..." : "Cancel"}
                </button>
                <button
                  onClick={confirmResendPayslips}
                  disabled={resendingPayslips}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {resendingPayslips ? (
                    <>
                      <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <HiCheckCircle className="w-4 h-4 mr-2" />
                      Confirm Resend
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollProcessing;
