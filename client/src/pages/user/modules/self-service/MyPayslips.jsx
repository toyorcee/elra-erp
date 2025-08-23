import React, { useState, useEffect } from "react";
import {
  HiDocumentDownload,
  HiEye,
  HiCalendar,
  HiFilter,
  HiSearch,
  HiRefresh,
} from "react-icons/hi";
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
  const [downloadingPayslip, setDownloadingPayslip] = useState(null);
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

  const handleDownloadPaySlip = async (payslip) => {
    const payslipKey = `${payslip.payrollId}-${payslip.employee?.id}`;
    try {
      setDownloadingPayslip(payslipKey);
      const fileName = `${payslip.employee?.name?.replace(/\s+/g, "_")}_${
        payslip.period?.monthName
      }_${payslip.period?.year}_payslip.pdf`;

      const response = await userModulesAPI.payroll.downloadPayslip(
        payslip.payrollId,
        payslip.employee?.id
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

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
    {
      header: "Actions",
      accessor: "actions",
      renderer: (payslip) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewPaySlip(payslip)}
            disabled={
              loading ||
              viewingPayslip === `${payslip.payrollId}-${payslip.employee?.id}`
            }
            className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="View Payslip"
          >
            <HiEye
              className={`w-4 h-4 ${
                viewingPayslip ===
                `${payslip.payrollId}-${payslip.employee?.id}`
                  ? "animate-spin"
                  : ""
              }`}
            />
          </button>
          <button
            onClick={() => handleDownloadPaySlip(payslip)}
            disabled={
              loading ||
              downloadingPayslip ===
                `${payslip.payrollId}-${payslip.employee?.id}`
            }
            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download Payslip"
          >
            <HiDocumentDownload
              className={`w-4 h-4 ${
                downloadingPayslip ===
                `${payslip.payrollId}-${payslip.employee?.id}`
                  ? "animate-spin"
                  : ""
              }`}
            />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
            <p className="text-gray-600 mt-1">
              View and download your personal payslips
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchPersonalPayslips}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <HiRefresh
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Filter My Payslips
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchPersonalPayslips}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <HiSearch
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Searching..." : "Search"}
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
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    e.target.value === "all" ? "all" : parseInt(e.target.value),
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
                    e.target.value === "all" ? "all" : parseInt(e.target.value),
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
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Payslips</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {payslips.length} payslip{payslips.length !== 1 ? "s" : ""}{" "}
                found
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
            <HiDocumentDownload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Payslips Found
            </h3>
            <p className="text-gray-600">
              You don't have any payslips yet. Payslips will appear here once
              they are generated.
            </p>
          </div>
        ) : (
          <DataTable
            data={payslips}
            columns={columns}
            loading={loading}
            emptyState={{
              icon: <HiDocumentDownload className="w-12 h-12 text-gray-400" />,
              title: "No Payslips Found",
              description:
                "You don't have any payslips yet. Payslips will appear here once they are generated.",
            }}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
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
