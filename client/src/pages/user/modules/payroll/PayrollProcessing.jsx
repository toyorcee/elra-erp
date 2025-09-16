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

      const payrollId = payroll._id; // Use the group's _id which is now a valid MongoDB ObjectId
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

    const actualPayrollId = selectedPayrollForResend._id;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <HiCalculator className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">
                      Payroll Processing
                    </h1>
                    <p className="text-white/90 text-lg">
                      Advanced scope-based payroll management with ELRA
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Real-time Processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Scope-based Calculations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>Usage Tracking</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="group relative px-8 py-4 text-lg font-semibold text-[var(--elra-primary)] bg-white rounded-2xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <HiPlus className="w-5 h-5 text-white" />
                </div>
                <span>Process New Payroll</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl flex items-center justify-center">
              <HiCalendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Filter & Search
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 bg-white/50 backdrop-blur-sm"
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 bg-white/50 backdrop-blur-sm"
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Quick Actions
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setFilters({
                      month: new Date().getMonth() + 1,
                      year: new Date().getFullYear(),
                    })
                  }
                  className="px-4 py-3 text-sm font-medium text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 rounded-xl hover:bg-[var(--elra-primary)]/20 transition-colors"
                >
                  Current Month
                </button>
                <button
                  onClick={() =>
                    setFilters({
                      month: new Date().getMonth(),
                      year: new Date().getFullYear(),
                    })
                  }
                  className="px-4 py-3 text-sm font-medium text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 rounded-xl hover:bg-[var(--elra-primary)]/20 transition-colors"
                >
                  Last Month
                </button>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchSavedPayrolls}
                disabled={loading}
                className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <HiRefresh className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <HiRefresh className="w-5 h-5" />
                    <span>Refresh Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">
                    Payroll Groups
                  </p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {recentPayrolls.length}
                  </p>
                  <p className="text-blue-200 text-xs">
                    Active payroll periods
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <HiUserGroup className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">
                    Total Gross Pay
                  </p>
                  <p className="text-2xl font-bold text-white mb-2">
                    {formatCurrency(
                      recentPayrolls.reduce(
                        (sum, payroll) => sum + (payroll.totalGrossPay || 0),
                        0
                      )
                    )}
                  </p>
                  <p className="text-green-200 text-xs">Before deductions</p>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <HiCurrencyDollar className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">
                    Total Deductions
                  </p>
                  <p className="text-2xl font-bold text-white mb-2">
                    {formatCurrency(
                      recentPayrolls.reduce(
                        (sum, payroll) => sum + (payroll.totalDeductions || 0),
                        0
                      )
                    )}
                  </p>
                  <p className="text-red-200 text-xs">Taxes & other</p>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <HiMinusCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">
                    Total Net Pay
                  </p>
                  <p className="text-2xl font-bold text-white mb-2">
                    {formatCurrency(
                      recentPayrolls.reduce(
                        (sum, payroll) => sum + (payroll.totalNetPay || 0),
                        0
                      )
                    )}
                  </p>
                  <p className="text-purple-200 text-xs">Take-home amount</p>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <HiCheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Management Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <HiDocumentText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Payroll Management
                  </h2>
                  <p className="text-white/90">
                    Manage and track all payroll processing activities
                  </p>
                </div>
              </div>
              <div className="text-right text-white/90">
                <p className="text-sm">Total Records</p>
                <p className="text-2xl font-bold">{recentPayrolls.length}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-full mx-auto mb-6 flex items-center justify-center">
                    <HiRefresh className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-full mx-auto opacity-20 animate-ping"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Loading Payroll Data
                </h3>
                <p className="text-gray-600">
                  Please wait while we fetch your payroll information...
                </p>
              </div>
            ) : recentPayrolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-[var(--elra-primary)]/10 to-[var(--elra-primary-dark)]/10 rounded-full mx-auto flex items-center justify-center">
                    <HiDocumentText className="w-16 h-16 text-[var(--elra-primary)]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <HiExclamation className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  No Payrolls Found
                </h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  No payrolls have been processed for the selected period. Start
                  by creating your first payroll to get started.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="group relative px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                      <HiPlus className="w-5 h-5 text-white" />
                    </div>
                    <span>Create First Payroll</span>
                  </button>
                  <div className="text-sm text-gray-500">
                    <p className="mb-2">
                      💡 <strong>Quick Tips:</strong>
                    </p>
                    <ul className="text-left max-w-md mx-auto space-y-1">
                      <li>• Choose the correct period and frequency</li>
                      <li>
                        • Select appropriate scope
                        (Company/Department/Individual)
                      </li>
                      <li>• Review employee eligibility before processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Scope
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Employees
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Gross Pay
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Net Pay
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Processing Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentPayrolls.map((payroll, index) => (
                      <tr
                        key={index}
                        className="group hover:bg-gradient-to-r hover:from-[var(--elra-primary)]/5 hover:to-[var(--elra-primary-dark)]/5 transition-all duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[var(--elra-primary)]/10 to-[var(--elra-primary-dark)]/10 rounded-lg flex items-center justify-center">
                              <HiCalendar className="w-5 h-5 text-[var(--elra-primary)]" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {payroll.period?.monthName}{" "}
                                {payroll.period?.year}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payroll.period?.frequency}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              payroll.scope === "company"
                                ? "bg-blue-100 text-blue-800"
                                : payroll.scope === "department"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {payroll.scope || "company"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                              {payroll.period?.frequency || "monthly"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <HiUserGroup className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {payroll.totalEmployees || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(payroll.totalGrossPay || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-purple-600">
                            {formatCurrency(payroll.totalNetPay || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {payroll.processingDate
                              ? new Date(
                                  payroll.processingDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewPayrollDetails(payroll)}
                              className="group/btn px-3 py-2 text-xs font-semibold text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-all duration-200 flex items-center space-x-1"
                            >
                              <HiEye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleViewPayslip(payroll)}
                              className="group/btn px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center space-x-1"
                              title="View payslip"
                            >
                              <HiEye className="w-3 h-3" />
                              <span>Payslip</span>
                            </button>
                            <button
                              onClick={() => handleResendPayslips(payroll._id)}
                              disabled={resendingPayslips}
                              className="group/btn px-3 py-2 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              title="Resend payslip"
                            >
                              <HiRefresh
                                className={`w-3 h-3 ${
                                  resendingPayslips ? "animate-spin" : ""
                                }`}
                              />
                              <span>
                                {resendingPayslips ? "Sending..." : "Resend"}
                              </span>
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
        </div>

        {/* Scope Processing Guide */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl flex items-center justify-center">
              <HiOfficeBuilding className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Scope-Based Processing Guide
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <HiOfficeBuilding className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">
                    Company Scope
                  </h3>
                  <p className="text-blue-700 text-sm">All employees</p>
                </div>
              </div>
              <p className="text-blue-800 text-sm mb-4">
                Processes payroll for all active employees in the organization.
                Perfect for monthly company-wide payroll runs.
              </p>
              <div className="space-y-2 text-xs text-blue-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>All departments included</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Company-wide allowances/bonuses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Standard deductions applied</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <HiUserGroup className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">
                    Department Scope
                  </h3>
                  <p className="text-green-700 text-sm">Specific departments</p>
                </div>
              </div>
              <p className="text-green-800 text-sm mb-4">
                Processes payroll for employees in selected departments only.
                Ideal for department-specific bonuses or adjustments.
              </p>
              <div className="space-y-2 text-xs text-green-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Select specific departments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Department-specific items</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Targeted processing</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <HiUser className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-900">
                    Individual Scope
                  </h3>
                  <p className="text-purple-700 text-sm">Specific employees</p>
                </div>
              </div>
              <p className="text-purple-800 text-sm mb-4">
                Processes payroll for individually selected employees. Perfect
                for bonuses, adjustments, or corrections.
              </p>
              <div className="space-y-2 text-xs text-purple-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Select specific employees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Personal allowances/bonuses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Individual adjustments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
