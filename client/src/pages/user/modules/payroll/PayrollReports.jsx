import React, { useState, useEffect } from "react";
import {
  HiDocumentText,
  HiChartBar,
  HiDownload,
  HiRefresh,
} from "react-icons/hi";
import { toast } from "react-toastify";

const PayrollReports = () => {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    reportType: "summary",
  });

  const months = [
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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const reportTypes = [
    { value: "summary", label: "Payroll Summary" },
    { value: "department", label: "Department Report" },
    { value: "employee", label: "Employee Report" },
    { value: "tax", label: "Tax Report" },
    { value: "allowances", label: "Allowances Report" },
    { value: "deductions", label: "Deductions Report" },
  ];

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      // TODO: Implement report generation logic
      toast.success("Report generated successfully!");
    } catch (error) {
      toast.error("Error generating report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate and view comprehensive payroll reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <HiDocumentText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h2>
        <div className="text-center py-12 text-gray-500">
          <HiChartBar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Select a report type and generate to see preview</p>
        </div>
      </div>
    </div>
  );
};

export default PayrollReports;
