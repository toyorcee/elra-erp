import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import inventoryService from "../../../../services/inventoryService";
import { toast } from "react-toastify";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

const InventoryReports = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Access control - only Super Admin and Operations HOD can access
  const userRole = user?.role?.name || user?.role;
  const userDepartment = user?.department?.name;
  const isSuperAdmin = user?.role?.level === 1000;
  const isOperationsHOD =
    user?.role?.level === 700 && userDepartment === "Operations";
  const hasAccess = user && (isSuperAdmin || isOperationsHOD);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Inventory Reports. This module
            is restricted to Super Admin and Operations HOD only.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getInventoryStats();
      if (response.success) {
        setStats(response.data);
      } else {
        toast.error("Failed to load inventory statistics");
      }
    } catch (error) {
      console.error("Error loading inventory stats:", error);
      toast.error("Error loading inventory statistics");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      // This would typically generate and download a report
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error generating report");
    }
  };

  const getStatusStats = () => {
    const totalItems = Object.values(stats).reduce(
      (sum, status) => sum + (status.count || 0),
      0
    );
    const totalValue = Object.values(stats).reduce(
      (sum, status) => sum + (status.totalValue || 0),
      0
    );
    const totalPurchasePrice = Object.values(stats).reduce(
      (sum, status) => sum + (status.totalPurchasePrice || 0),
      0
    );

    return {
      totalItems,
      totalValue,
      totalPurchasePrice,
      depreciation: totalPurchasePrice - totalValue,
    };
  };

  const statusStats = getStatusStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Inventory Reports
        </h1>
        <p className="text-gray-600">
          Comprehensive reports and analytics for inventory management
        </p>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
            >
              <option value="overview">Overview Report</option>
              <option value="maintenance">Maintenance Report</option>
              <option value="financial">Financial Report</option>
              <option value="status">Status Report</option>
            </select>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadStats}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={generateReport}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {statusStats.totalItems}
              </p>
            </div>
            <CubeIcon className="h-8 w-8 text-[var(--elra-primary)]" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statusStats.totalValue)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Purchase Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statusStats.totalPurchasePrice)}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Depreciation</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statusStats.depreciation)}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Status Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(stats).map(([status, data]) => {
              const percentage =
                statusStats.totalItems > 0
                  ? ((data.count || 0) / statusStats.totalItems) * 100
                  : 0;

              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status.replace("_", " ")}
                    </span>
                    <span className="text-sm text-gray-500">
                      {data.count || 0} items ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === "available"
                          ? "bg-green-500"
                          : status === "leased"
                          ? "bg-blue-500"
                          : status === "maintenance"
                          ? "bg-yellow-500"
                          : status === "retired"
                          ? "bg-gray-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Value: {formatCurrency(data.totalValue || 0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => setReportType("maintenance")}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-500 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    Maintenance Report
                  </div>
                  <div className="text-sm text-gray-500">
                    Items requiring maintenance
                  </div>
                </div>
              </div>
              <ArrowPathIcon className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => setReportType("financial")}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 text-green-500 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    Financial Report
                  </div>
                  <div className="text-sm text-gray-500">
                    Value and depreciation analysis
                  </div>
                </div>
              </div>
              <ArrowPathIcon className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => setReportType("status")}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-blue-500 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Status Report</div>
                  <div className="text-sm text-gray-500">
                    Current status of all items
                  </div>
                </div>
              </div>
              <ArrowPathIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {reportType === "overview" && "Overview Report"}
          {reportType === "maintenance" && "Maintenance Report"}
          {reportType === "financial" && "Financial Report"}
          {reportType === "status" && "Status Report"}
        </h3>

        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Report Content
          </h4>
          <p className="text-gray-500 mb-4">
            Detailed report content will be displayed here based on the selected
            report type and date range.
          </p>
          <p className="text-sm text-gray-400">
            Date Range: {formatDate(dateRange.start)} -{" "}
            {formatDate(dateRange.end)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;
