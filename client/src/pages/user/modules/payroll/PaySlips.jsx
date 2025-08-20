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
} from "react-icons/hi";
import { toast } from "react-toastify";
import { userModulesAPI } from "../../../../services/userModules.js";
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
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [resendType, setResendType] = useState("");
  const [resendTarget, setResendTarget] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

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

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "employeeName", label: "Employee Name" },
    { value: "employeeId", label: "Employee ID" },
    { value: "grossPay", label: "Gross Pay" },
    { value: "netPay", label: "Net Pay" },
    { value: "deductions", label: "Deductions" },
  ];

  useEffect(() => {
    fetchPayrolls();
  }, []);

  useEffect(() => {
    if (selectedPayroll) {
      fetchPayslips(selectedPayroll._id);
    }
  }, [selectedPayroll]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.payroll.getSavedPayrolls();

      if (response.success) {
        // Handle different response structures
        const payrollsData = response.data?.payrolls || response.data || [];
        setPayrolls(Array.isArray(payrollsData) ? payrollsData : []);
        toast.success("Payrolls loaded successfully");
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
      const response = await getPayslips(payrollId);

      if (response.success) {
        setPayslips(response.data.payslips || []);
      } else {
        toast.error("Failed to load payslips");
      }
    } catch (error) {
      console.error("Error fetching payslips:", error);
      toast.error("Error loading payslips");
    } finally {
      setLoadingPayslips(false);
    }
  };

  const handleViewPaySlip = async (payrollId, employeeId) => {
    try {
      await viewPayslip(payrollId, employeeId);
      toast.success("Opening payslip in new tab...");
    } catch (error) {
      console.error("Error viewing payslip:", error);
      toast.error("Failed to open payslip");
    }
  };

  const handleDownloadPaySlip = async (
    payrollId,
    employeeId,
    employee,
    period
  ) => {
    try {
      const fileName = generatePayslipFileName(employee, period);
      await downloadPayslip(payrollId, employeeId, fileName);
      toast.success("Payslip download started!");
    } catch (error) {
      console.error("Error downloading payslip:", error);
      toast.error("Failed to download payslip");
    }
  };

  const handleResendPaySlip = (payrollId, employeeIds = null) => {
    setSelectedPayroll({ _id: payrollId });
    setSelectedEmployees(employeeIds);
    setShowResendConfirmation(true);
  };

  const confirmResendPayslips = async () => {
    if (!selectedPayroll) return;

    try {
      setResendingPayslips(true);
      setShowResendConfirmation(false);

      const response = await resendMultiplePayslips(
        selectedPayroll._id,
        selectedEmployees
      );

      if (response.success) {
        const { successCount, errorCount, results } = response.data;

        if (errorCount === 0) {
          toast.success(
            `✅ All payslips sent successfully! (${successCount} sent)`
          );
        } else {
          toast.warning(
            `⚠️ Payslips sent with some errors. Success: ${successCount}, Errors: ${errorCount}`
          );

          // Show detailed results
          results.forEach((result) => {
            if (result.status === "error") {
              toast.error(
                `Failed to send to ${result.employeeName}: ${result.message}`
              );
            }
          });
        }
      } else {
        toast.error("Failed to resend payslips");
      }
    } catch (error) {
      console.error("Error resending payslips:", error);
      toast.error("Failed to resend payslips");
    } finally {
      setResendingPayslips(false);
      setSelectedPayroll(null);
      setSelectedEmployees([]);
    }
  };

  const getFilteredAndSortedPayslips = () => {
    let filtered = filterPayslips(payslips, {
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

  const filteredAndSortedPayslips = getFilteredAndSortedPayslips();
  const payslipSummary = getPayslipSummary(payslips);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pay Slips</h1>
          <p className="text-gray-600 mt-1">
            View and manage employee pay slips from processed payrolls
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPayrolls}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center"
          >
            <HiRefresh
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Payroll Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Payroll
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <HiRefresh className="w-6 h-6 animate-spin text-[var(--elra-primary)] mr-3" />
            <span className="text-gray-600">Loading payrolls...</span>
          </div>
        ) : !Array.isArray(payrolls) || payrolls.length === 0 ? (
          <div className="text-center py-8">
            <HiDocumentDownload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No payslips generated yet
            </h3>
            <p className="text-gray-500">
              No payrolls have been processed yet. Process a payroll to generate
              payslips here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(payrolls) &&
              payrolls.map((payroll) => {
                const Icon = getScopeIcon(payroll.scope);
                const isSelected = selectedPayroll?._id === payroll._id;

                return (
                  <div
                    key={payroll._id}
                    onClick={() => setSelectedPayroll(payroll)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] text-white"
                        : "border-gray-200 hover:border-[var(--elra-primary)] hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected
                            ? "text-white"
                            : "text-[var(--elra-primary)]"
                        }`}
                      />
                      <div>
                        <h3
                          className={`font-semibold ${
                            isSelected ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {payroll.period.monthName} {payroll.period.year}
                        </h3>
                        <p
                          className={`text-sm ${
                            isSelected ? "text-white" : "text-gray-600"
                          }`}
                        >
                          {getScopeLabel(payroll.scope)} •{" "}
                          {payroll.payrolls.length} employees
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Payslips Section */}
      {selectedPayroll && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Filters & Search
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                >
                  {months.map((month) => (
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
                      year:
                        e.target.value === "all"
                          ? "all"
                          : parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                >
                  {years.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                >
                  {scopes.map((scope) => (
                    <option key={scope.value} value={scope.value}>
                      {scope.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  />
                  <HiSearch className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end mt-4">
              <button
                onClick={() => {
                  setFilters({
                    month: "all",
                    year: "all",
                    scope: "all",
                    status: "all",
                  });
                  setSearchTerm("");
                  setSortBy("createdAt");
                  setSortOrder("desc");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <HiUserGroup className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">
                    Total Payslips
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {payslipSummary.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <HiCalendar className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">
                    Total Gross Pay
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(payslipSummary.totalGrossPay)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <HiCheckCircle className="w-8 h-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">
                    Total Net Pay
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(payslipSummary.totalNetPay)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <HiExclamation className="w-8 h-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">
                    Total Deductions
                  </p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(payslipSummary.totalDeductions)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payslips Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Payslips
                </h2>
                <button
                  onClick={() => handleResendPaySlip(selectedPayroll._id)}
                  disabled={resendingPayslips}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <HiMail className="w-4 h-4 mr-2" />
                  {resendingPayslips ? "Sending..." : "Resend All"}
                </button>
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
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
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
                              className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] p-1 rounded hover:bg-gray-100"
                              title="View Payslip"
                            >
                              <HiEye className="w-4 h-4" />
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
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-gray-100"
                              title="Download Payslip"
                            >
                              <HiDocumentDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleResendPaySlip(payslip.payrollId, [
                                  payslip.employee.id,
                                ])
                              }
                              disabled={resendingPayslips}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Resend Payslip"
                            >
                              <HiMail className="w-4 h-4" />
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
        </>
      )}

      {/* Resend Confirmation Modal */}
      {showResendConfirmation && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                    {selectedPayroll.period?.monthName}{" "}
                    {selectedPayroll.period?.year}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  {selectedEmployees && selectedEmployees.length > 0
                    ? `Are you sure you want to resend payslips to ${selectedEmployees.length} selected employee(s)?`
                    : `Are you sure you want to resend payslips to all employees?`}
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
                    setSelectedPayroll(null);
                    setSelectedEmployees([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
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

export default PaySlips;
