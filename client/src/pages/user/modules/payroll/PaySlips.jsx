import React, { useState, useEffect } from "react";
import {
  HiDocumentDownload,
  HiEye,
  HiMail,
  HiFilter,
  HiSearch,
  HiRefresh,
  HiX,
  HiCheckCircle,
  HiExclamation,
  HiCalendar,
  HiUserGroup,
  HiOfficeBuilding,
  HiUser,
  HiChevronRight,
  HiChevronDown,
} from "react-icons/hi";
import { toast } from "react-toastify";
import { userModulesAPI } from "../../../../services/userModules.js";
import DataTable from "../../../../components/common/DataTable";
import {
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
} from "../../../../utils/payslipUtils.js";

const PaySlips = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [resendingPayslips, setResendingPayslips] = useState(false);
  const [filters, setFilters] = useState({
    month: "all",
    year: "all",
    scope: "all",
    status: "all",
    frequency: "all",
    department: "all",
    employeeId: "",
    employeeName: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [selectedPayrollForResend, setSelectedPayrollForResend] =
    useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [departments, setDepartments] = useState([]);
  const [allPayslips, setAllPayslips] = useState([]);
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [downloadingPayslip, setDownloadingPayslip] = useState(null);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [resendingPayslip, setResendingPayslip] = useState(null);

  const months = [
    { value: "all", label: "All Months" },
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
  ];

  const years = [
    { value: "all", label: "All Years" },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - 2 + i;
      return { value: year, label: year.toString() };
    }),
  ];

  const scopes = [
    { value: "all", label: "All Scopes", icon: HiOfficeBuilding },
    { value: "company", label: "Company-wide", icon: HiOfficeBuilding },
    { value: "department", label: "Department", icon: HiUserGroup },
    { value: "individual", label: "Individual", icon: HiUser },
  ];

  const frequencies = [
    { value: "all", label: "All Frequencies" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "one_time", label: "One Time" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "employeeName", label: "Employee Name" },
    { value: "employeeId", label: "Employee ID" },
    { value: "grossPay", label: "Gross Pay" },
    { value: "netPay", label: "Net Pay" },
    { value: "deductions", label: "Deductions" },
    { value: "department", label: "Department" },
    { value: "period", label: "Period" },
  ];

  useEffect(() => {
    fetchPayrolls();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedPayroll) {
      fetchPayslips(selectedPayroll._id);
    }
  }, [selectedPayroll]);

  useEffect(() => {
    searchPayslips();
  }, [filters, searchTerm]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.payroll.getSavedPayrolls();

      if (response.success) {
        // Handle different response structures
        const payrollsData = response.data?.payrolls || response.data || [];
        setPayrolls(Array.isArray(payrollsData) ? payrollsData : []);
      } else {
        toast.error("Failed to load payrolls");
      }
    } catch (error) {
      console.error("Error fetching payrolls:", error);
      toast.error("Error loading payrolls");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async (payrollId) => {
    try {
      setLoadingPayslips(true);

      // Find the selected payroll from the payrolls array
      const selectedPayrollData = payrolls.find((p) => p._id === payrollId);

      if (selectedPayrollData && selectedPayrollData.payrolls) {
        // Transform payroll data to payslip format
        const payslipData = selectedPayrollData.payrolls.map((payroll) => ({
          id: payroll.employee._id,
          payrollId: selectedPayrollData._id,
          employee: {
            id: payroll.employee._id,
            name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
            employeeId: payroll.employee.employeeId,
            email: payroll.employee.email,
            department: payroll.employee.department?.name || "N/A",
            role: payroll.employee.role?.name || "N/A",
          },
          period: {
            month: selectedPayrollData.period.month,
            year: selectedPayrollData.period.year,
            monthName: selectedPayrollData.period.monthName,
            frequency: selectedPayrollData.period.frequency,
          },
          scope: selectedPayrollData.scope,
          summary: {
            grossPay: payroll.grossSalary || 0,
            netPay: payroll.netSalary || 0,
            totalDeductions: payroll.totalDeductions || 0,
            taxableIncome: payroll.taxableIncome || 0,
          },
          baseSalary: payroll.baseSalary || 0,
          allowances: payroll.personalAllowances || [],
          bonuses: payroll.personalBonuses || [],
          deductions: payroll.voluntaryDeductions || [],
          taxBreakdown: {
            paye: payroll.paye || 0,
            pension: payroll.pension || 0,
            nhis: payroll.nhis || 0,
          },
          status: "generated",
          createdAt: selectedPayrollData.createdAt,
          updatedAt: selectedPayrollData.updatedAt,
        }));

        setPayslips(payslipData);
        setAllPayslips(payslipData);
      } else {
        setPayslips([]);
        setAllPayslips([]);
        toast.error("No payslip data found for this payroll");
      }
    } catch (error) {
      console.error("Error fetching payslips:", error);
      toast.error("Error loading payslips");
    } finally {
      setLoadingPayslips(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await userModulesAPI.departments.getAllDepartments();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const searchPayslips = async () => {
    try {
      setLoadingPayslips(true);

      // Filter payrolls based on search criteria
      let filteredPayrolls = [...payrolls];

      // Filter by year
      if (filters.year !== "all") {
        filteredPayrolls = filteredPayrolls.filter(
          (payroll) => payroll.period.year === parseInt(filters.year)
        );
      }

      // Filter by month
      if (filters.month !== "all") {
        filteredPayrolls = filteredPayrolls.filter(
          (payroll) => payroll.period.month === parseInt(filters.month)
        );
      }

      // Filter by scope
      if (filters.scope !== "all") {
        filteredPayrolls = filteredPayrolls.filter(
          (payroll) => payroll.scope === filters.scope
        );
      }

      // Filter by frequency
      if (filters.frequency !== "all") {
        filteredPayrolls = filteredPayrolls.filter(
          (payroll) => payroll.period.frequency === filters.frequency
        );
      }

      const allPayslipData = [];

      filteredPayrolls.forEach((payroll) => {
        if (payroll.payrolls) {
          const payslipData = payroll.payrolls
            .map((payrollItem) => {
              if (filters.department !== "all") {
                const employeeDept =
                  payrollItem.employee.department?.name || "N/A";
                if (employeeDept !== filters.department) return null;
              }

              if (filters.employeeId) {
                const employeeId = payrollItem.employee.employeeId || "";
                if (
                  !employeeId
                    .toLowerCase()
                    .includes(filters.employeeId.toLowerCase())
                )
                  return null;
              }

              if (filters.employeeName) {
                const employeeName = `${payrollItem.employee.firstName} ${payrollItem.employee.lastName}`;
                if (
                  !employeeName
                    .toLowerCase()
                    .includes(filters.employeeName.toLowerCase())
                )
                  return null;
              }

              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const employeeName = `${payrollItem.employee.firstName} ${payrollItem.employee.lastName}`;
                const employeeId = payrollItem.employee.employeeId || "";
                const department = payrollItem.employee.department?.name || "";

                if (
                  !employeeName.toLowerCase().includes(searchLower) &&
                  !employeeId.toLowerCase().includes(searchLower) &&
                  !department.toLowerCase().includes(searchLower)
                ) {
                  return null;
                }
              }

              return {
                id: payrollItem.employee._id,
                payrollId: payroll._id,
                employee: {
                  id: payrollItem.employee._id,
                  name: `${payrollItem.employee.firstName} ${payrollItem.employee.lastName}`,
                  employeeId: payrollItem.employee.employeeId,
                  email: payrollItem.employee.email,
                  department: payrollItem.employee.department?.name || "N/A",
                  role: payrollItem.employee.role?.name || "N/A",
                },
                period: {
                  month: payroll.period.month,
                  year: payroll.period.year,
                  monthName: payroll.period.monthName,
                  frequency: payroll.period.frequency,
                },
                scope: payroll.scope,
                summary: {
                  grossPay: payrollItem.grossSalary || 0,
                  netPay: payrollItem.netSalary || 0,
                  totalDeductions: payrollItem.totalDeductions || 0,
                  taxableIncome: payrollItem.taxableIncome || 0,
                },
                baseSalary: payrollItem.baseSalary || 0,
                allowances: payrollItem.personalAllowances || [],
                bonuses: payrollItem.personalBonuses || [],
                deductions: payrollItem.voluntaryDeductions || [],
                taxBreakdown: {
                  paye: payrollItem.paye || 0,
                  pension: payrollItem.pension || 0,
                  nhis: payrollItem.nhis || 0,
                },
                status: "generated",
                createdAt: payroll.createdAt,
                updatedAt: payroll.updatedAt,
              };
            })
            .filter(Boolean); // Remove null values

          allPayslipData.push(...payslipData);
        }
      });

      setPayslips(allPayslipData);
      setAllPayslips(allPayslipData);
    } catch (error) {
      console.error("Error searching payslips:", error);
      toast.error("Error searching payslips");
    } finally {
      setLoadingPayslips(false);
    }
  };

  const handleViewPaySlip = async (payrollId, employeeId) => {
    const payslipKey = `${payrollId}-${employeeId}`;
    try {
      setViewingPayslip(payslipKey);
      await viewPayslip(payrollId, employeeId);
      toast.success("Opening payslip in new tab...");
    } catch (error) {
      console.error("Error viewing payslip:", error);
      toast.error("Failed to open payslip");
    } finally {
      setViewingPayslip(null);
    }
  };

  const handleDownloadPaySlip = async (
    payrollId,
    employeeId,
    employee,
    period
  ) => {
    const payslipKey = `${payrollId}-${employeeId}`;
    try {
      setDownloadingPayslip(payslipKey);
      const fileName = `${employee.name.replace(/\s+/g, "_")}_${
        period.monthName
      }_${period.year}_payslip.pdf`;

      const response = await userModulesAPI.payroll.downloadPayslip(
        payrollId,
        employeeId
      );

      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Payslip downloaded successfully!");
    } catch (error) {
      console.error("Error downloading payslip:", error);
      toast.error("Failed to download payslip");
    } finally {
      setDownloadingPayslip(null);
    }
  };

  const handleResendPaySlip = (payrollId, employeeIds = null) => {
    const payroll = payrolls.find((p) => p._id === payrollId);

    if (payroll) {
      setSelectedPayrollForResend(payroll);
      setShowResendConfirmation(true);
    } else {
      console.error("❌ [PAYSLIPS] Payroll not found for ID:", payrollId);
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

  const getFilteredAndSortedPayslips = () => {
    const basePayslips = allPayslips.length > 0 ? allPayslips : payslips;

    let filtered = filterPayslips(basePayslips, {
      ...filters,
      searchTerm,
    });

    return sortPayslips(filtered, sortBy, sortOrder);
  };

  const getScopeIcon = (scope) => {
    const scopeConfig = scopes.find((s) => s.value === scope);
    return scopeConfig ? scopeConfig.icon : HiOfficeBuilding;
  };

  const getScopeLabel = (scope) => {
    const scopeConfig = scopes.find((s) => s.value === scope);
    return scopeConfig ? scopeConfig.label : "Unknown";
  };

  // Helper functions for hierarchical view
  const groupPayrollsByYear = (payrolls) => {
    const grouped = {};
    payrolls.forEach((payroll) => {
      const year = payroll.period.year;
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(payroll);
    });
    return grouped;
  };

  const toggleYearExpansion = (year) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const groupedPayrolls = groupPayrollsByYear(payrolls);
  const sortedYears = Object.keys(groupedPayrolls).sort((a, b) => b - a); // Most recent first

  const filteredAndSortedPayslips = getFilteredAndSortedPayslips();
  const payslipSummary = getPayslipSummary(payslips);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with ELRA Branding */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl shadow-lg">
                <HiDocumentDownload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Payslips Management
                </h1>
                <p className="text-gray-600 mt-1">
                  View, download, and manage employee payslips across all
                  departments
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchPayrolls}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-lg hover:from-[var(--elra-primary-dark)] hover:to-[var(--elra-primary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl"
              >
                <HiRefresh
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Loading..." : "Refresh Data"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Enhanced Search & Filter Section - Moved to Top */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <HiFilter className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">
                    Search & Filter Payslips
                  </h2>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={searchPayslips}
                    disabled={loadingPayslips}
                    className="px-6 py-2 text-sm font-medium text-[var(--elra-primary)] bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md"
                  >
                    <HiSearch
                      className={`w-4 h-4 mr-2 ${
                        loadingPayslips ? "animate-spin" : ""
                      }`}
                    />
                    {loadingPayslips ? "Searching..." : "Search"}
                  </button>
                  <button
                    onClick={() => {
                      setFilters({
                        month: "all",
                        year: "all",
                        scope: "all",
                        status: "all",
                        frequency: "all",
                        department: "all",
                        employeeId: "",
                        employeeName: "",
                      });
                      setSearchTerm("");
                      setSelectedPayroll(null);
                      setPayslips([]);
                    }}
                    disabled={loadingPayslips}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name, ID, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={filters.month}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        month:
                          e.target.value === "all"
                            ? "all"
                            : parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] bg-white"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        year:
                          e.target.value === "all"
                            ? "all"
                            : parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] bg-white"
                  >
                    {years.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={filters.frequency}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        frequency: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] bg-white"
                  >
                    {frequencies.map((frequency) => (
                      <option key={frequency.value} value={frequency.value}>
                        {frequency.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Scope
                  </label>
                  <select
                    value={filters.scope}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        scope: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] bg-white"
                  >
                    {scopes.map((scope) => (
                      <option key={scope.value} value={scope.value}>
                        {scope.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] bg-white"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] bg-white"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Selection Section */}
          {Array.isArray(payrolls) && payrolls.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-[var(--elra-primary)] rounded-lg">
                      <HiCalendar className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Payroll Selection
                    </h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full border">
                      {Array.isArray(payrolls)
                        ? `${payrolls.length} payrolls across ${sortedYears.length} years`
                        : "0 payrolls"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3">
                      <HiRefresh className="w-8 h-8 animate-spin text-[var(--elra-primary)]" />
                      <span className="text-lg font-medium text-gray-600">
                        Loading payrolls...
                      </span>
                    </div>
                  </div>
                ) : !Array.isArray(payrolls) || payrolls.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mx-auto mb-6">
                      <HiDocumentDownload className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      No Payrolls Processed Yet
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Process a payroll to generate payslips and manage employee
                      compensation records.
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={fetchPayrolls}
                        className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-lg hover:from-[var(--elra-primary-dark)] hover:to-[var(--elra-primary)] transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
                      >
                        <HiRefresh className="w-4 h-4 mr-2" />
                        Refresh Data
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedYears.map((year) => {
                      const yearPayrolls = groupedPayrolls[year];
                      const isExpanded = expandedYears.has(parseInt(year));
                      const totalEmployees = yearPayrolls.reduce(
                        (sum, payroll) => sum + payroll.payrolls.length,
                        0
                      );

                      return (
                        <div
                          key={year}
                          className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Year Header */}
                          <button
                            onClick={() => toggleYearExpansion(parseInt(year))}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-center space-x-4">
                              {isExpanded ? (
                                <HiChevronDown className="w-5 h-5 text-[var(--elra-primary)]" />
                              ) : (
                                <HiChevronRight className="w-5 h-5 text-[var(--elra-primary)]" />
                              )}
                              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-lg">
                                <HiCalendar className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {year}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {yearPayrolls.length} payroll
                                  {yearPayrolls.length !== 1 ? "s" : ""} •{" "}
                                  {totalEmployees} employee
                                  {totalEmployees !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 px-3 py-1 rounded-full">
                                {yearPayrolls.length} batches
                              </span>
                            </div>
                          </button>

                          {/* Months under this year */}
                          {isExpanded && (
                            <div className="px-6 pb-4 space-y-3 bg-gray-50/50">
                              {yearPayrolls.map((payroll) => {
                                const Icon = getScopeIcon(payroll.scope);
                                const isSelected =
                                  selectedPayroll?._id === payroll._id;

                                return (
                                  <button
                                    key={payroll._id}
                                    onClick={() => setSelectedPayroll(payroll)}
                                    className={`w-full px-4 py-3 text-sm border-2 rounded-lg transition-all duration-200 flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? "border-[var(--elra-primary)] bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white shadow-lg"
                                        : "border-gray-200 hover:border-[var(--elra-primary)] hover:bg-white hover:shadow-md"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                                          isSelected
                                            ? "bg-white/20"
                                            : "bg-[var(--elra-primary)]/10"
                                        }`}
                                      >
                                        <Icon
                                          className={`w-4 h-4 ${
                                            isSelected
                                              ? "text-white"
                                              : "text-[var(--elra-primary)]"
                                          }`}
                                        />
                                      </div>
                                      <div className="text-left">
                                        <span className="font-semibold text-base">
                                          {payroll.period.monthName}
                                        </span>
                                        <div className="flex items-center space-x-2 mt-1">
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                              isSelected
                                                ? "bg-white/20 text-white/90"
                                                : "bg-[var(--elra-primary)]/10 text-[var(--elra-primary)]"
                                            }`}
                                          >
                                            {getScopeLabel(payroll.scope)}
                                          </span>
                                          <span
                                            className={`text-xs ${
                                              isSelected
                                                ? "text-white/80"
                                                : "text-gray-500"
                                            }`}
                                          >
                                            {payroll.period.frequency}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span
                                        className={`text-sm font-semibold ${
                                          isSelected
                                            ? "text-white"
                                            : "text-gray-900"
                                        }`}
                                      >
                                        {payroll.payrolls.length} employee
                                        {payroll.payrolls.length !== 1
                                          ? "s"
                                          : ""}
                                      </span>
                                      <div
                                        className={`text-xs mt-1 ${
                                          isSelected
                                            ? "text-white/80"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {new Date(
                                          payroll.createdAt
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No Payslips State - Simple and Clean */}
      {payslips.length === 0 && !loadingPayslips && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-16">
          <div className="text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[var(--elra-primary)]/10 to-[var(--elra-primary-dark)]/10 rounded-full mx-auto mb-6">
              <HiDocumentDownload className="w-10 h-10 text-[var(--elra-primary)]" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Payslips Available
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {selectedPayroll
                ? `No payslips were generated for ${selectedPayroll.period.monthName} ${selectedPayroll.period.year}.`
                : "No payslips found. Try selecting a different payroll period or check if payroll processing is complete."}
            </p>
            <button
              onClick={fetchPayrolls}
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-lg hover:from-[var(--elra-primary-dark)] hover:to-[var(--elra-primary)] transition-all duration-200 flex items-center mx-auto shadow-lg hover:shadow-xl"
            >
              <HiRefresh className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
      )}

      {/* Payslips Table */}
      {payslips.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Payslips{" "}
                {selectedPayroll &&
                  `- ${selectedPayroll.period.monthName} ${selectedPayroll.period.year}`}
              </h2>
              {selectedPayroll && (
                <button
                  onClick={() => handleResendPaySlip(selectedPayroll._id)}
                  disabled={resendingPayslips || loadingPayslips}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <HiMail
                    className={`w-4 h-4 mr-2 ${
                      resendingPayslips ? "animate-spin" : ""
                    }`}
                  />
                  {resendingPayslips ? "Sending..." : "Resend All"}
                </button>
              )}
            </div>
          </div>
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
                    Gross Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingPayslips ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <HiRefresh className="w-6 h-6 animate-spin text-[var(--elra-primary)] mr-3" />
                        <span className="text-gray-600">
                          Loading payslips...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedPayslips.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No payslips found
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPayslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payslip.employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payslip.employee.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payslip.employee.department || "No Department"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payslip.summary?.grossPay || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(payslip.summary?.netPay || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-[var(--elra-primary)]/10 text-[var(--elra-primary)]">
                          {getPayslipStatus(payslip)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleViewPaySlip(
                                payslip.payrollId,
                                payslip.employee.id
                              )
                            }
                            disabled={
                              loadingPayslips ||
                              viewingPayslip ===
                                `${payslip.payrollId}-${payslip.employee.id}`
                            }
                            className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="View Payslip"
                          >
                            <HiEye
                              className={`w-4 h-4 ${
                                viewingPayslip ===
                                `${payslip.payrollId}-${payslip.employee.id}`
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadPaySlip(
                                payslip.payrollId,
                                payslip.employee.id,
                                payslip.employee,
                                payslip.period
                              )
                            }
                            disabled={
                              loadingPayslips ||
                              downloadingPayslip ===
                                `${payslip.payrollId}-${payslip.employee.id}`
                            }
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Download Payslip"
                          >
                            <HiDocumentDownload
                              className={`w-4 h-4 ${
                                downloadingPayslip ===
                                `${payslip.payrollId}-${payslip.employee.id}`
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                          </button>
                          <button
                            onClick={() =>
                              handleResendPaySlip(payslip.payrollId)
                            }
                            disabled={resendingPayslips || loadingPayslips}
                            className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Resend Payslip"
                          >
                            <HiMail
                              className={`w-4 h-4 ${
                                resendingPayslips ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resend Confirmation Modal */}
      {showResendConfirmation && selectedPayrollForResend && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <HiMail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Resend Payslips
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedPayrollForResend.period?.monthName}{" "}
                    {selectedPayrollForResend.period?.year}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to resend payslips to all employees for
                  this payroll period?
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
                      </ul>
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
                  Cancel
                </button>
                <button
                  onClick={confirmResendPayslips}
                  disabled={resendingPayslips}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {resendingPayslips ? (
                    <>
                      <HiRefresh className="w-4 h-4 mr-2 animate-spin text-white" />
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

export default PaySlips;
