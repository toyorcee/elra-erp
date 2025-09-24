import React, { useState, useEffect } from "react";
import {
  HiEye,
  HiCalendar,
  HiFilter,
  HiSearch,
  HiRefresh,
  HiCurrencyDollar,
} from "react-icons/hi";
import {
  HiXMark,
  HiChartBar,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { userModulesAPI } from "../../../../services/userModules.js";
import DataTable from "../../../../components/common/DataTable";

const MyPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: "all",
    year: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingPayslip, setViewingPayslip] = useState(null);

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
    ...Array.from({ length: 21 }, (_, i) => {
      const year = new Date().getFullYear() + i;
      return { value: year, label: year.toString() };
    }),
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "grossPay", label: "Gross Pay" },
    { value: "netPay", label: "Net Pay" },
    { value: "deductions", label: "Deductions" },
    { value: "period", label: "Period" },
  ];

  useEffect(() => {
    fetchPersonalPayslips();
  }, []);

  const fetchPersonalPayslips = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.payroll.getPersonalPayslips(
        filters
      );

      if (response.success) {
        const payslipsData = response.data || [];
        setPayslips(payslipsData);

        if (payslipsData.length > 0) {
          toast.success(
            `Successfully loaded ${payslipsData.length} payslip${
              payslipsData.length !== 1 ? "s" : ""
            }`
          );
        } else {
          toast.info("No payslips found for the selected criteria");
        }
      } else {
        toast.error("Failed to load your payslips");
      }
    } catch (error) {
      toast.error("Error loading your payslips");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPaySlip = async (payslip) => {
    const payslipKey = `${payslip.payrollId}-${payslip.employee?.id}`;
    try {
      setViewingPayslip(payslipKey);
      const response = await userModulesAPI.payroll.viewPayslip(
        payslip.payrollId,
        payslip.employee?.id
      );

      if (response.success) {
        toast.success("Opening payslip in new tab...");
      } else {
        toast.error("Failed to open payslip");
      }
    } catch (error) {
      console.error("Error viewing payslip:", error);
      toast.error("Failed to open payslip");
    } finally {
      setViewingPayslip(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Calculate statistics
  const getPayslipStats = () => {
    const totalPayslips = payslips.length;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const currentYearPayslips = payslips.filter(
      (p) => p.period?.year === currentYear
    );
    const currentMonthPayslips = payslips.filter(
      (p) => p.period?.year === currentYear && p.period?.month === currentMonth
    );

    const totalGrossPay = payslips.reduce(
      (sum, p) => sum + (p.summary?.grossPay || 0),
      0
    );
    const totalNetPay = payslips.reduce(
      (sum, p) => sum + (p.summary?.netPay || 0),
      0
    );
    const averageNetPay = totalPayslips > 0 ? totalNetPay / totalPayslips : 0;

    return {
      totalPayslips,
      currentYearPayslips: currentYearPayslips.length,
      currentMonthPayslips: currentMonthPayslips.length,
      totalGrossPay,
      totalNetPay,
      averageNetPay,
    };
  };

  const stats = getPayslipStats();

  const columns = [
    {
      header: "Period",
      accessor: "period",
      renderer: (payslip) => (
        <div>
          <div className="font-medium text-gray-900">
            {payslip.period?.monthName || "N/A"} {payslip.period?.year || "N/A"}
          </div>
          <div className="text-sm text-gray-500">
            {payslip.period?.frequency || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "employee.department",
      renderer: (payslip) => (
        <div className="text-sm text-gray-900">
          {payslip.employee?.department || "Not Assigned"}
        </div>
      ),
    },
    {
      header: "Gross Pay",
      accessor: "summary.grossPay",
      renderer: (payslip) => (
        <span className="font-medium text-green-600">
          {formatCurrency(payslip.summary?.grossPay)}
        </span>
      ),
    },
    {
      header: "Net Pay",
      accessor: "summary.netPay",
      renderer: (payslip) => (
        <span className="font-bold text-purple-600">
          {formatCurrency(payslip.summary?.netPay)}
        </span>
      ),
    },
    {
      header: "Deductions",
      accessor: "summary.totalDeductions",
      renderer: (payslip) => (
        <span className="font-medium text-red-600">
          {formatCurrency(payslip.summary?.totalDeductions)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Payslips</h1>
            <p className="text-white text-opacity-90 text-lg">
              View and download your personal payslips with ease
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchPersonalPayslips}
              disabled={loading}
              className="bg-white text-[var(--elra-primary)] px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center space-x-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-white border-opacity-20"
            >
              <HiRefresh
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
              <span>{loading ? "Loading..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Payslips */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Payslips
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalPayslips}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <HiCalendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">All time records</span>
          </div>
        </div>

        {/* Current Year Payslips */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                This Year
              </p>
              <p className="text-3xl font-bold text-green-600">
                {stats.currentYearPayslips}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {new Date().getFullYear()} payslips
            </span>
          </div>
        </div>

        {/* Current Month Payslips */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                This Month
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.currentMonthPayslips}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <HiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Current period</span>
          </div>
        </div>

        {/* Average Net Pay */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Avg Net Pay
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(stats.averageNetPay)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <HiCurrencyDollar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Per payslip</span>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
              <HiFilter className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Filter Payslips
              </h2>
              <p className="text-sm text-gray-500">
                Search and filter your payslip records
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchPersonalPayslips}
              disabled={loading}
              className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-xl hover:bg-[var(--elra-primary-dark)] transition-all duration-300 font-semibold cursor-pointer flex items-center space-x-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiSearch
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
              <span>{loading ? "Searching..." : "Search"}</span>
            </button>
            <button
              onClick={() => {
                setFilters({
                  month: "all",
                  year: "all",
                });
                setSearchTerm("");
              }}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiXMark className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  month:
                    e.target.value === "all" ? "all" : parseInt(e.target.value),
                }))
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-300"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  year:
                    e.target.value === "all" ? "all" : parseInt(e.target.value),
                }))
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-300"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Payslips Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
                <HiCalendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  My Payslips
                </h2>
                <p className="text-sm text-gray-500">
                  {payslips.length} payslip{payslips.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
            <span className="ml-2 text-gray-600">Loading your payslips...</span>
          </div>
        ) : payslips.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiCalendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Payslips Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have any payslips yet. Payslips will appear here once
              they are generated by HR.
            </p>
            <button
              onClick={fetchPersonalPayslips}
              className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center space-x-2 mx-auto"
            >
              <HiRefresh className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        ) : (
          <DataTable
            data={payslips}
            columns={columns}
            loading={loading}
            emptyState={{
              icon: <HiCalendar className="w-12 h-12 text-gray-400" />,
              title: "No Payslips Found",
              description:
                "You don't have any payslips yet. Payslips will appear here once they are generated.",
            }}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
              customActions: (row) => (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewPaySlip(row);
                    }}
                    disabled={
                      loading ||
                      viewingPayslip === `${row.payrollId}-${row.employee?.id}`
                    }
                    className="p-3 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="View Payslip"
                  >
                    <HiEye
                      className={`w-5 h-5 ${
                        viewingPayslip ===
                        `${row.payrollId}-${row.employee?.id}`
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                  </button>
                </div>
              ),
            }}
            onRowClick={(payslip) => {
              // Optional: Add row click functionality if needed
            }}
            rowClassName={(payslip) => "hover:bg-gray-50 cursor-pointer"}
          />
        )}
      </div>
    </div>
  );
};

export default MyPayslips;
