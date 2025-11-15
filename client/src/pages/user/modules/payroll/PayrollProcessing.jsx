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
  HiChevronLeft,
  HiInformationCircle,
} from "react-icons/hi";
import { toast } from "react-toastify";
import PayrollProcessingForm from "../../../../components/payroll/PayrollProcessingForm.jsx";
import { userModulesAPI } from "../../../../services/userModules.js";
import ELRALogo from "../../../../components/ELRALogo";
import defaultAvatar from "../../../../assets/defaulticon.jpg";

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
  const [savedPreviews, setSavedPreviews] = useState([]);
  const [loadingSavedPreviews, setLoadingSavedPreviews] = useState(false);
  const [showSavedPreviewsModal, setShowSavedPreviewsModal] = useState(false);
  const [selectedPreviewData, setSelectedPreviewData] = useState(null);
  const [showPreviewDetailModal, setShowPreviewDetailModal] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const [showRejectedPreviews, setShowRejectedPreviews] = useState(false);
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);
  const [selectedApprovedPreview, setSelectedApprovedPreview] = useState(null);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [showRejectionReasonModal, setShowRejectionReasonModal] =
    useState(false);
  const [selectedRejectionData, setSelectedRejectionData] = useState(null);
  const [showResendConfirmationModal, setShowResendConfirmationModal] =
    useState(false);
  const [selectedResendPreview, setSelectedResendPreview] = useState(null);
  const [resendingToFinance, setResendingToFinance] = useState(false);

  useEffect(() => {
    fetchSavedPayrolls();
    fetchSavedPreviews();
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
    fetchSavedPreviews();
    setIsFormOpen(false);
  };

  const fetchSavedPreviews = async () => {
    try {
      setLoadingSavedPreviews(true);
      console.log("🔍 [PayrollProcessing] Fetching saved previews...");

      const response = await userModulesAPI.payroll.getPendingApprovals();

      if (response.success) {
        const allPreviews = response.data || [];

        const uniquePreviews = allPreviews.reduce((acc, preview) => {
          const key = `${preview.period?.monthName}-${preview.period?.year}`;
          const existing = acc.find(
            (p) => `${p.period?.monthName}-${p.period?.year}` === key
          );

          if (!existing) {
            acc.push(preview);
          } else {
            // Keep the most recent one (by requestedAt date)
            const existingDate = new Date(existing.requestedAt);
            const currentDate = new Date(preview.requestedAt);
            if (currentDate > existingDate) {
              const index = acc.indexOf(existing);
              acc[index] = preview;
            }
          }

          return acc;
        }, []);

        uniquePreviews.sort(
          (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
        );

        setSavedPreviews(uniquePreviews);
        console.log(
          "✅ [PayrollProcessing] Fetched and deduplicated saved previews:",
          uniquePreviews
        );
      } else {
        throw new Error(response.message || "Failed to fetch saved previews");
      }
    } catch (error) {
      console.error(
        "❌ [PayrollProcessing] Error fetching saved previews:",
        error
      );
      toast.error("Failed to fetch saved previews");
    } finally {
      setLoadingSavedPreviews(false);
    }
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

  const handleResendToFinance = (preview) => {
    setSelectedResendPreview(preview);
    setShowResendConfirmationModal(true);

    console.log(
      "🔄 [PayrollProcessing] Opening resend confirmation for:",
      preview.approvalId
    );
  };

  const confirmResendToFinance = async () => {
    if (!selectedResendPreview) return;

    try {
      setResendingToFinance(true);
      console.log(
        "🔄 [PayrollProcessing] Resending to finance:",
        selectedResendPreview.approvalId
      );

      const response = await userModulesAPI.payroll.resendToFinance(
        selectedResendPreview.approvalId
      );

      if (response.success) {
        // Toast removed - backend handles success message

        setShowResendConfirmationModal(false);
        setSelectedResendPreview(null);
        fetchSavedPreviews();
      } else {
        toast.error(response.message || "Failed to resend to finance");
      }
    } catch (error) {
      console.error(
        "❌ [PayrollProcessing] Error resending to finance:",
        error
      );
      toast.error("Failed to resend to finance. Please try again.");
    } finally {
      setResendingToFinance(false);
    }
  };

  const handleCreateNewPreview = (rejectedPreview) => {
    if (rejectedPreview.rejectionReason) {
      toast.info(
        `Previous preview was rejected: ${rejectedPreview.rejectionReason}. Creating new preview...`,
        { autoClose: 5000 }
      );
    }

    setShowPayrollForm(true);

    console.log(
      "🆕 [PayrollProcessing] Creating new preview after rejection:",
      rejectedPreview.approvalId
    );
  };

  const handleRunPayroll = (approvedPreview) => {
    setSelectedApprovedPreview(approvedPreview);
    setShowRunPayrollModal(true);

    console.log(
      "▶️ [PayrollProcessing] Opening run payroll confirmation for:",
      approvedPreview.approvalId
    );
  };

  const confirmRunPayroll = async () => {
    if (!selectedApprovedPreview) return;

    try {
      setProcessingPayroll(true);
      console.log(
        "▶️ [PayrollProcessing] Processing approved payroll:",
        selectedApprovedPreview.approvalId
      );

      const response = await userModulesAPI.payroll.processApprovedPayroll(
        selectedApprovedPreview.approvalId
      );

      if (response.success) {
        toast.success(
          `✅ Payroll processed successfully! ${
            response.data?.totalEmployees || 0
          } employees paid.`
        );

        setShowRunPayrollModal(false);
        setSelectedApprovedPreview(null);
        fetchSavedPreviews();
        fetchSavedPayrolls();
      } else {
        toast.error(response.message || "Failed to process payroll");
      }
    } catch (error) {
      console.error("❌ [PayrollProcessing] Error running payroll:", error);
      toast.error("Failed to process payroll. Please try again.");
    } finally {
      setProcessingPayroll(false);
    }
  };

  const handleViewRejectionReason = (rejectedPreview) => {
    setSelectedRejectionData(rejectedPreview);
    setShowRejectionReasonModal(true);

    console.log(
      "ℹ️ [PayrollProcessing] Viewing rejection reason for:",
      rejectedPreview.approvalId
    );
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

      const payrollId = payroll._id;
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

  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return getDefaultAvatar();
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${avatarPath}`;
  };

  const getEmployeeAvatar = (employee) => {
    if (employee?.avatar) {
      return getImageUrl(employee.avatar);
    }
    return getDefaultAvatar();
  };

  const getDepartmentName = (employee) => {
    if (!employee) return "N/A";

    if (employee.department?.name) {
      return employee.department.name;
    }

    if (typeof employee.department === "string") {
      return employee.department;
    }

    if (employee.department?._id) {
      return employee.department.name || "N/A";
    }

    return "N/A";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-white/10"></div>
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
                className="group relative px-8 py-4 text-lg font-semibold text-[var(--elra-primary)] bg-white rounded-2xl hover:bg-gray-50 shadow-xl hover:shadow-2xl flex items-center space-x-3 cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-lg flex items-center justify-center">
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

        {/* Saved Previews Table - Only show if we have data or are loading */}
        {(savedPreviews.length > 0 || loadingSavedPreviews) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <HiDocumentText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Saved Payroll Previews
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Previews submitted for finance approval
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showRejectedPreviews}
                    onChange={(e) => setShowRejectedPreviews(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Show rejected
                </label>
                <button
                  onClick={fetchSavedPreviews}
                  disabled={loadingSavedPreviews}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingSavedPreviews ? (
                    <>
                      <HiRefresh className="w-4 h-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <HiRefresh className="w-4 h-4" />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>

            {savedPreviews.length === 0 && !loadingSavedPreviews ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiDocumentText className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Saved Previews Found
                </h3>
                <p className="text-gray-500 mb-4">
                  There are no saved payroll previews in the database.
                </p>
                <button
                  onClick={fetchSavedPreviews}
                  disabled={loadingSavedPreviews}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loadingSavedPreviews ? (
                    <>
                      <HiRefresh className="w-4 h-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <HiDocumentText className="w-4 h-4" />
                      Fetch Saved Previews
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Approval ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Employees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Total Net Pay
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Requested Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {savedPreviews
                      .filter(
                        (preview) =>
                          showRejectedPreviews ||
                          preview.approvalStatus !== "rejected"
                      )
                      .map((preview, index) => (
                        <tr
                          key={index}
                          className="group hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <HiCalendar className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {preview.period?.monthName}{" "}
                                  {preview.period?.year}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {preview.approvalId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                preview.approvalStatus === "pending_finance"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : preview.approvalStatus ===
                                    "approved_finance"
                                  ? "bg-green-100 text-green-800"
                                  : preview.approvalStatus === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : preview.approvalStatus ===
                                    "rejected_finance"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {preview.approvalStatus === "rejected"
                                ? "REJECTED"
                                : preview.approvalStatus
                                    ?.replace("_", " ")
                                    .toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {preview.financialSummary?.totalEmployees || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">
                              ₦
                              {preview.financialSummary?.totalNetPay?.toLocaleString() ||
                                0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(
                                preview.requestedAt
                              ).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  // Include approvalStatus in the preview data
                                  setSelectedPreviewData({
                                    ...preview.payrollData,
                                    approvalStatus: preview.approvalStatus,
                                    _id: preview._id,
                                    approvalId: preview.approvalId,
                                  });
                                  setShowPreviewDetailModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                                title="View Data"
                              >
                                <HiEye className="w-4 h-4" />
                              </button>
                              {preview.approvalStatus === "pending_finance" && (
                                <button
                                  onClick={() => handleResendToFinance(preview)}
                                  className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                                  title="Resend to Finance"
                                >
                                  <HiRefresh className="w-4 h-4" />
                                </button>
                              )}
                              {preview.approvalStatus === "rejected" && (
                                <>
                                  {preview.rejectionReason && (
                                    <button
                                      onClick={() =>
                                        handleViewRejectionReason(preview)
                                      }
                                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                      title="View Rejection Reason"
                                    >
                                      <HiInformationCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleCreateNewPreview(preview)
                                    }
                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Create New Preview"
                                  >
                                    <HiPlus className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {preview.approvalStatus ===
                                "approved_finance" && (
                                <button
                                  onClick={() => handleRunPayroll(preview)}
                                  className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                                  title="Run Payroll"
                                >
                                  <HiPlay className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payroll Management Section - Only show when there are completed payrolls */}
        {recentPayrolls.length > 0 && (
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
                          <td className="px-6 py-4">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() =>
                                    handleViewPayrollDetails(payroll)
                                  }
                                  className="group/btn px-2 py-1 text-xs font-semibold text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-all duration-200 flex items-center space-x-1"
                                >
                                  <HiEye className="w-3 h-3" />
                                  <span>View</span>
                                </button>
                                {/* Only show Payslip button for individual scope */}
                                {payroll.scope === "individual" && (
                                  <button
                                    onClick={() => handleViewPayslip(payroll)}
                                    className="group/btn px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center space-x-1"
                                    title="View payslip"
                                  >
                                    <HiEye className="w-3 h-3" />
                                    <span>Payslip</span>
                                  </button>
                                )}
                              </div>
                              <div className="flex justify-center">
                                <button
                                  onClick={() =>
                                    handleResendPayslips(payroll._id)
                                  }
                                  disabled={resendingPayslips}
                                  className="group/btn px-2 py-1 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                  title="Resend payslip"
                                >
                                  <HiRefresh
                                    className={`w-3 h-3 ${
                                      resendingPayslips ? "animate-spin" : ""
                                    }`}
                                  />
                                  <span>
                                    {resendingPayslips
                                      ? "Sending..."
                                      : "Resend"}
                                  </span>
                                </button>
                              </div>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
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
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const employeeId =
                                        payroll.employee?.id ||
                                        payroll.employee?._id;
                                      if (employeeId) {
                                        const payrollId = selectedPayroll._id;
                                        const payslipUrl = `/api/payroll/payslips/${payrollId}/view/${employeeId}`;
                                        const fullUrl = `${
                                          window.location.origin
                                        }${payslipUrl}?t=${Date.now()}`;
                                        window.open(fullUrl, "_blank");
                                      }
                                    }}
                                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <HiEye className="w-3 h-3" />
                                    View Payslip
                                  </button>
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
                <div className="w-8 h-8 flex items-center justify-center">
                  <ELRALogo variant="dark" size="sm" />
                </div>
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

      {/* Saved Previews Modal */}
      {showSavedPreviewsModal && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* ELRA Branded Header */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-6 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <ELRALogo variant="dark" size="sm" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Saved Payroll Previews
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {savedPreviews.length} preview(s) found in database
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowSavedPreviewsModal(false)}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 font-medium border border-white/30 backdrop-blur-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setShowSavedPreviewsModal(false)}
                      className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                    >
                      <HiX className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {savedPreviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiDocumentText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Saved Previews Found
                  </h3>
                  <p className="text-gray-500">
                    There are no saved payroll previews in the database.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-lg flex items-center justify-center">
                              <HiDocumentText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {preview.period?.monthName}{" "}
                                {preview.period?.year}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Approval ID: {preview.approvalId}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-blue-600 mb-1">
                                Status
                              </div>
                              <div className="text-sm font-semibold text-blue-900">
                                {preview.approvalStatus === "rejected"
                                  ? "REJECTED"
                                  : preview.approvalStatus
                                      ?.replace("_", " ")
                                      .toUpperCase()}
                              </div>
                            </div>
                            {preview.approvalStatus === "rejected" &&
                              preview.rejectionReason && (
                                <div className="bg-red-50 p-3 rounded-lg col-span-2 md:col-span-4">
                                  <div className="text-xs font-medium text-red-600 mb-1">
                                    Rejection Reason
                                  </div>
                                  <div className="text-sm font-semibold text-red-900">
                                    {preview.rejectionReason}
                                  </div>
                                </div>
                              )}
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-green-600 mb-1">
                                Total Employees
                              </div>
                              <div className="text-sm font-semibold text-green-900">
                                {preview.financialSummary?.totalEmployees || 0}
                              </div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-purple-600 mb-1">
                                Total Net Pay
                              </div>
                              <div className="text-sm font-semibold text-purple-900">
                                ₦
                                {preview.financialSummary?.totalNetPay?.toLocaleString() ||
                                  0}
                              </div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-orange-600 mb-1">
                                Requested Date
                              </div>
                              <div className="text-sm font-semibold text-orange-900">
                                {new Date(
                                  preview.requestedAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedPreviewData({
                                ...preview.payrollData,
                                approvalStatus: preview.approvalStatus,
                                _id: preview._id,
                                approvalId: preview.approvalId,
                              });
                              setShowPreviewDetailModal(true);
                            }}
                            className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                          >
                            <HiEye className="w-4 h-4" />
                            View Data
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Detail Modal */}
      {showPreviewDetailModal && selectedPreviewData && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* ELRA Branded Header */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-6 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                      <ELRALogo variant="dark" size="lg" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Payroll Preview Details
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {selectedPreviewData.period?.monthName}{" "}
                        {selectedPreviewData.period?.year} •{" "}
                        {selectedPreviewData.totalEmployees} employees
                      </p>
                      <p className="text-white/70 text-xs mt-1">
                        {selectedPreviewData.scope?.type === "company"
                          ? "Company-wide"
                          : selectedPreviewData.scope?.type === "department"
                          ? "Department"
                          : "Individual"}{" "}
                        Payroll
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setShowPreviewDetailModal(false);
                        setSelectedPreviewData(null);
                      }}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 font-medium border border-white/30 backdrop-blur-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowPreviewDetailModal(false);
                        setSelectedPreviewData(null);
                      }}
                      className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                    >
                      <HiX className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <HiUserGroup className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-blue-800">
                      Total Employees
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {selectedPreviewData.totalEmployees || 0}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <HiCurrencyDollar className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-800">
                      Total Gross Pay
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-green-900">
                    ₦{selectedPreviewData.totalGrossPay?.toLocaleString() || 0}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <HiMinusCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-red-800">
                      Total Deductions
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-red-900">
                    ₦
                    {selectedPreviewData.totalDeductions?.toLocaleString() || 0}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <HiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-purple-800">
                      Net Pay
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">
                    ₦{selectedPreviewData.totalNetPay?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* Employee Details Table */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HiUserGroup className="w-6 h-6 text-[var(--elra-primary)]" />
                  Employee Details ({selectedPreviewData.payrolls?.length ||
                    0}{" "}
                  employees)
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Base Salary
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Gross Pay
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Deductions
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Net Pay
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPreviewData.payrolls?.map((payroll, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full overflow-hidden shadow-md border-2 border-white">
                                  <img
                                    src={getEmployeeAvatar(payroll.employee)}
                                    alt={payroll.employee?.name || "Employee"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = getDefaultAvatar(
                                        payroll.employee
                                      );
                                    }}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {payroll.employee?.name || "Unknown"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {payroll.employee?.employeeId || "No ID"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {payroll.employee?.department?.name ||
                                  payroll.employee?.department ||
                                  "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-blue-600">
                                ₦
                                {payroll.baseSalary?.effectiveBaseSalary?.toLocaleString() ||
                                  0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">
                                ₦
                                {payroll.summary?.grossPay?.toLocaleString() ||
                                  0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-red-600">
                                ₦
                                {payroll.summary?.totalDeductions?.toLocaleString() ||
                                  0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-[var(--elra-primary)]">
                                ₦
                                {payroll.summary?.netPay?.toLocaleString() || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedEmployeeData(payroll);
                                    setShowEmployeeDetailModal(true);
                                  }}
                                  className="px-3 py-1 text-xs font-medium text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-colors flex items-center gap-1"
                                >
                                  <HiEye className="w-3 h-3" />
                                  View Details
                                </button>
                                {/* Only show Payslip button when payroll is processed (payslips generated) */}
                                {selectedPreviewData?.approvalStatus ===
                                  "processed" && (
                                  <button
                                    onClick={() => {
                                      const employeeId =
                                        payroll.employee?.id ||
                                        payroll.employee?._id;
                                      if (employeeId) {
                                        // Use the approval ID from selectedPreviewData if available, otherwise fallback
                                        const payrollId =
                                          selectedPreviewData?._id ||
                                          selectedPayroll?._id;
                                        if (payrollId) {
                                          const payslipUrl = `/api/payroll/payslips/${payrollId}/view/${employeeId}`;
                                          const fullUrl = `${
                                            window.location.origin
                                          }${payslipUrl}?t=${Date.now()}`;
                                          window.open(fullUrl, "_blank");
                                        } else {
                                          toast.error("Payroll ID not found");
                                        }
                                      } else {
                                        toast.error("Employee ID not found");
                                      }
                                    }}
                                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1"
                                  >
                                    <HiEye className="w-3 h-3" />
                                    Payslip
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showEmployeeDetailModal && selectedEmployeeData && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* ELRA Branded Header */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-6 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setShowEmployeeDetailModal(false);
                        setSelectedEmployeeData(null);
                      }}
                      className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
                    >
                      <HiChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                      <ELRALogo variant="dark" size="lg" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Employee Payroll Details
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {selectedEmployeeData.employee?.name ||
                          "Unknown Employee"}
                      </p>
                      <p className="text-white/70 text-xs mt-1">
                        {selectedEmployeeData.employee?.employeeId || "No ID"} •{" "}
                        {selectedEmployeeData.employee?.department?.name ||
                          selectedEmployeeData.employee?.department ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setShowEmployeeDetailModal(false);
                        setSelectedEmployeeData(null);
                      }}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 font-medium border border-white/30 backdrop-blur-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowEmployeeDetailModal(false);
                        setSelectedEmployeeData(null);
                      }}
                      className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                    >
                      <HiX className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Employee Info Card */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)]/5 to-[var(--elra-primary-dark)]/5 rounded-xl p-6 mb-6 border border-[var(--elra-primary)]/20">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg border-4 border-white">
                    <img
                      src={getEmployeeAvatar(selectedEmployeeData.employee)}
                      alt={selectedEmployeeData.employee?.name || "Employee"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getDefaultAvatar(
                          selectedEmployeeData.employee
                        );
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedEmployeeData.employee?.name ||
                        "Unknown Employee"}
                    </h3>
                    <p className="text-gray-600">
                      {selectedEmployeeData.employee?.employeeId || "No ID"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedEmployeeData.employee?.department?.name ||
                        selectedEmployeeData.employee?.department ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Base Salary</p>
                    <p className="text-2xl font-bold text-[var(--elra-primary)]">
                      ₦
                      {selectedEmployeeData.baseSalary?.effectiveBaseSalary?.toLocaleString() ||
                        0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <HiCurrencyDollar className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-800">
                      Gross Pay
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-green-900">
                    ₦
                    {selectedEmployeeData.summary?.grossPay?.toLocaleString() ||
                      0}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <HiMinusCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-red-800">
                      Total Deductions
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-red-900">
                    ₦
                    {selectedEmployeeData.summary?.totalDeductions?.toLocaleString() ||
                      0}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <HiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-purple-800">
                      Net Pay
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">
                    ₦
                    {selectedEmployeeData.summary?.netPay?.toLocaleString() ||
                      0}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HiCalculator className="w-6 h-6 text-[var(--elra-primary)]" />
                  Detailed Breakdown
                </h3>

                {/* Allowances */}
                {selectedEmployeeData.allowances?.items &&
                  selectedEmployeeData.allowances.items.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
                        <h4 className="text-lg font-semibold text-green-800">
                          Allowances
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {selectedEmployeeData.allowances.items.map(
                            (allowance, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                              >
                                <span className="text-gray-700">
                                  {allowance.name}
                                </span>
                                <span className="font-semibold text-green-600">
                                  ₦{allowance.amount?.toLocaleString() || 0}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Bonuses */}
                {selectedEmployeeData.bonuses?.items &&
                  selectedEmployeeData.bonuses.items.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                        <h4 className="text-lg font-semibold text-blue-800">
                          Bonuses
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {selectedEmployeeData.bonuses.items.map(
                            (bonus, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                              >
                                <span className="text-gray-700">
                                  {bonus.name}
                                </span>
                                <span className="font-semibold text-blue-600">
                                  ₦{bonus.amount?.toLocaleString() || 0}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Deductions */}
                {selectedEmployeeData.deductions?.items &&
                  selectedEmployeeData.deductions.items.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
                        <h4 className="text-lg font-semibold text-red-800">
                          Deductions
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {selectedEmployeeData.deductions.items.map(
                            (deduction, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                              >
                                <span className="text-gray-700">
                                  {deduction.name}
                                </span>
                                <span className="font-semibold text-red-600">
                                  ₦{deduction.amount?.toLocaleString() || 0}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Tax Information */}
                {selectedEmployeeData.taxBreakdown && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                      <h4 className="text-lg font-semibold text-orange-800">
                        Tax Information
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-700">Taxable Income</span>
                          <span className="font-semibold text-gray-900">
                            ₦
                            {selectedEmployeeData.summary?.taxableIncome?.toLocaleString() ||
                              0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-700">PAYE Tax</span>
                          <span className="font-semibold text-orange-600">
                            ₦
                            {selectedEmployeeData.deductions?.paye?.toLocaleString() ||
                              0}
                          </span>
                        </div>
                        {selectedEmployeeData.taxBreakdown?.taxRate && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-700">Tax Rate</span>
                            <span className="font-semibold text-gray-900">
                              {selectedEmployeeData.taxBreakdown.taxRate}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Payroll Confirmation Modal */}
      {showRunPayrollModal && selectedApprovedPreview && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* ELRA Branded Header */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-6 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                      <ELRALogo variant="dark" size="md" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Run Payroll Confirmation
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {selectedApprovedPreview.period?.monthName}{" "}
                        {selectedApprovedPreview.period?.year} •{" "}
                        {
                          selectedApprovedPreview.financialSummary
                            ?.totalEmployees
                        }{" "}
                        employees
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowRunPayrollModal(false);
                      setSelectedApprovedPreview(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                  >
                    <HiX className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <HiExclamation className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-800">
                        Final Confirmation Required
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This action will process the payroll and send payslips
                        to all employees. Funds will be moved from reserved to
                        used. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payroll Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-xs font-medium text-blue-600 mb-1">
                      Total Employees
                    </div>
                    <div className="text-lg font-semibold text-blue-900">
                      {selectedApprovedPreview.financialSummary
                        ?.totalEmployees || 0}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-xs font-medium text-green-600 mb-1">
                      Total Net Pay
                    </div>
                    <div className="text-lg font-semibold text-green-900">
                      ₦
                      {(
                        selectedApprovedPreview.financialSummary?.totalNetPay ||
                        0
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-xs font-medium text-purple-600 mb-1">
                      Approval ID
                    </div>
                    <div className="text-sm font-mono text-purple-900">
                      {selectedApprovedPreview.approvalId}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      Period
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {selectedApprovedPreview.period?.monthName}{" "}
                      {selectedApprovedPreview.period?.year}
                    </div>
                  </div>
                </div>

                {/* Fund Movement Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Fund Movement
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      • Funds will be moved from{" "}
                      <span className="font-semibold">reserved</span> to{" "}
                      <span className="font-semibold">used</span>
                    </div>
                    <div>
                      • Payslips will be automatically sent to all employees
                    </div>
                    <div>• Payroll will be marked as processed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 p-6">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRunPayrollModal(false);
                    setSelectedApprovedPreview(null);
                  }}
                  disabled={processingPayroll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRunPayroll}
                  disabled={processingPayroll}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center space-x-2"
                >
                  {processingPayroll ? (
                    <>
                      <HiRefresh className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <HiPlay className="w-4 h-4" />
                      <span>Run Payroll</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionReasonModal && selectedRejectionData && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* ELRA Branded Header */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-6 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                      <HiInformationCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Rejection Reason
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {selectedRejectionData.period?.monthName}{" "}
                        {selectedRejectionData.period?.year}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowRejectionReasonModal(false);
                      setSelectedRejectionData(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                  >
                    <HiX className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Approval ID */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    Approval ID
                  </div>
                  <div className="text-sm font-mono text-gray-900">
                    {selectedRejectionData.approvalId}
                  </div>
                </div>

                {/* Rejection Reason */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-xs font-medium text-red-600 mb-2">
                    Rejection Reason
                  </div>
                  <div className="text-sm text-red-800 leading-relaxed">
                    {selectedRejectionData.rejectionReason ||
                      "No reason provided"}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-blue-600 mb-1">
                      Total Employees
                    </div>
                    <div className="text-sm font-semibold text-blue-900">
                      {selectedRejectionData.financialSummary?.totalEmployees ||
                        0}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-green-600 mb-1">
                      Total Amount
                    </div>
                    <div className="text-sm font-semibold text-green-900">
                      ₦
                      {(
                        selectedRejectionData.financialSummary?.totalNetPay || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Action Suggestion */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <HiExclamation className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-yellow-800 mb-1">
                        Next Steps
                      </div>
                      <div className="text-sm text-yellow-700">
                        Review the rejection reason and create a new payroll
                        preview with the necessary corrections.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowRejectionReasonModal(false);
                    setSelectedRejectionData(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowRejectionReasonModal(false);
                    setSelectedRejectionData(null);
                    handleCreateNewPreview(selectedRejectionData);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
                >
                  <HiPlus className="w-4 h-4" />
                  <span>Create New Preview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resend to Finance Confirmation Modal */}
      {showResendConfirmationModal && selectedResendPreview && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* ELRA Branded Header */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-6 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                      <HiRefresh className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Resend to Finance
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {selectedResendPreview.period?.monthName}{" "}
                        {selectedResendPreview.period?.year}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowResendConfirmationModal(false);
                      setSelectedResendPreview(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                  >
                    <HiX className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <HiInformationCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-blue-800">
                        Resend Payroll Preview
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        This will send a new notification to the Finance HOD for
                        this payroll preview. The Finance HOD will receive an
                        updated notification with the same approval ID.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payroll Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      Approval ID
                    </div>
                    <div className="text-sm font-mono text-gray-900">
                      {selectedResendPreview.approvalId}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-blue-600 mb-1">
                      Total Employees
                    </div>
                    <div className="text-sm font-semibold text-blue-900">
                      {selectedResendPreview.financialSummary?.totalEmployees ||
                        0}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-green-600 mb-1">
                      Total Amount
                    </div>
                    <div className="text-sm font-semibold text-green-900">
                      ₦
                      {(
                        selectedResendPreview.financialSummary?.totalNetPay || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-purple-600 mb-1">
                      Status
                    </div>
                    <div className="text-sm font-semibold text-purple-900">
                      PENDING FINANCE
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <HiExclamation className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-yellow-800 mb-1">
                        What Happens Next
                      </div>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <div>• Finance HOD will receive a new notification</div>
                        <div>• The approval ID remains the same</div>
                        <div>
                          • You will receive a confirmation notification
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 p-6">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResendConfirmationModal(false);
                    setSelectedResendPreview(null);
                  }}
                  disabled={resendingToFinance}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResendToFinance}
                  disabled={resendingToFinance}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center space-x-2"
                >
                  {resendingToFinance ? (
                    <>
                      <HiRefresh className="w-4 h-4 animate-spin" />
                      <span>Resending...</span>
                    </>
                  ) : (
                    <>
                      <HiRefresh className="w-4 h-4" />
                      <span>Resend to Finance</span>
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
