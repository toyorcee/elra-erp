import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { fetchPurchaseOrders } from "../../../../services/procurementAPI";
import { toast } from "react-toastify";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

const ProcurementReports = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Procurement Reports. This module
            is restricted to Manager level and above.
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
      const response = await fetchPurchaseOrders();
      if (response.success) {
        const orders = response.data;
        const stats = calculateStats(orders);
        setStats(stats);
      } else {
        toast.error("Failed to load procurement statistics");
      }
    } catch (error) {
      console.error("Error loading procurement stats:", error);
      toast.error("Error loading procurement statistics");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const totalOrders = orders.length;
    const totalValue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const draftOrders = orders.filter(
      (order) => order.status === "draft"
    ).length;
    const approvedOrders = orders.filter(
      (order) => order.status === "approved"
    ).length;
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    ).length;
    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled"
    ).length;

    const statusBreakdown = {
      draft: {
        count: draftOrders,
        value: orders
          .filter((o) => o.status === "draft")
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      },
      approved: {
        count: approvedOrders,
        value: orders
          .filter((o) => o.status === "approved")
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      },
      completed: {
        count: completedOrders,
        value: orders
          .filter((o) => o.status === "completed")
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      },
      cancelled: {
        count: cancelledOrders,
        value: orders
          .filter((o) => o.status === "cancelled")
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      },
    };

    return {
      totalOrders,
      totalValue,
      statusBreakdown,
      averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
    };
  };

  const generateReport = async () => {
    try {
      // Show loading state
      toast.info("Generating PDF report...");

      // Simulate report generation (replace with actual PDF generation)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create a simple CSV download for now (replace with actual PDF generation)
      const csvData = [
        ["Procurement Report", ""],
        ["Generated:", new Date().toLocaleDateString()],
        [
          "Date Range:",
          `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`,
        ],
        [""],
        ["Summary", ""],
        ["Total Orders", stats.totalOrders || 0],
        ["Total Value", formatCurrency(stats.totalValue || 0)],
        ["Average Order Value", formatCurrency(stats.averageOrderValue || 0)],
        [""],
        ["Status Breakdown", ""],
        ...Object.entries(stats.statusBreakdown || {}).map(([status, data]) => [
          status.replace("_", " ").toUpperCase(),
          `${data.count || 0} orders`,
          formatCurrency(data.value || 0),
        ]),
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `procurement-report-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Report generated and downloaded successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error generating report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Procurement Reports</h1>
        <p className="text-white/80">
          Comprehensive reports and analytics for procurement management
        </p>
      </div>

      {/* Simple Report Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
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
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Generate PDF Report
            </button>
          </div>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Orders
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                {stats.totalOrders || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Total Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Total Value
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                {formatCurrency(stats.totalValue || 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Average Order Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Average Order
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                {formatCurrency(stats.averageOrderValue || 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Completed Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                Completed
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-900 mt-2 break-all leading-tight">
                {stats.statusBreakdown?.completed?.count || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Simple Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Order Status Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats.statusBreakdown || {}).map(([status, data]) => {
            const percentage =
              stats.totalOrders > 0
                ? ((data.count || 0) / stats.totalOrders) * 100
                : 0;

            return (
              <div key={status} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.replace("_", " ")}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {data.count || 0}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {percentage.toFixed(1)}% • {formatCurrency(data.value || 0)}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Simple Report Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Procurement Report Summary
          </h3>
          <div className="text-sm text-gray-500">
            {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900 mb-1">
              {stats.totalOrders || 0}
            </div>
            <div className="text-sm text-blue-700">Total Orders</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900 mb-1">
              {formatCurrency(stats.totalValue || 0)}
            </div>
            <div className="text-sm text-green-700">Total Value</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900 mb-1">
              {formatCurrency(stats.averageOrderValue || 0)}
            </div>
            <div className="text-sm text-purple-700">Average Order</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProcurementReports;
