import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  CubeIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { BarChart, PieChart, LineChart } from "../../../../components/graphs";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import inventoryService from "../../../../services/inventoryService";
import { toast } from "react-toastify";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

const InventoryReports = () => {
  const { user } = useAuth();
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [reportType, setReportType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [reportType, selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getAllInventory();
      if (response.success) {
        setInventoryData(response.data);
      } else {
        toast.error("Failed to load inventory data");
      }
    } catch (error) {
      console.error("Error loading inventory data:", error);
      toast.error("Error loading inventory data");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    let filtered = [...inventoryData];

    if (reportType === "monthly" && selectedMonth !== "all") {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return (
          itemDate.getMonth() + 1 === selectedMonth &&
          itemDate.getFullYear() === selectedYear
        );
      });
    } else if (reportType === "yearly") {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate.getFullYear() === selectedYear;
      });
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  const getInventoryAnalytics = () => {
    const totalItems = filteredData.length;
    const totalValue = filteredData.reduce(
      (sum, item) => sum + (parseFloat(item.currentValue) || 0),
      0
    );
    const projectTiedItems = filteredData.filter((item) => item.project).length;
    const standaloneItems = filteredData.filter((item) => !item.project).length;

    const statusBreakdown = getStatusBreakdown();
    const categoryBreakdown = getCategoryBreakdown();
    const typeBreakdown = getTypeBreakdown();

    const monthlyData = {};
    filteredData.forEach((item) => {
      const month = new Date(item.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, value: 0 };
      }
      monthlyData[month].count += 1;
      monthlyData[month].value += parseFloat(item.currentValue) || 0;
    });

    return {
      totalItems,
      totalValue,
      projectTiedItems,
      standaloneItems,
      statusBreakdown,
      categoryBreakdown,
      typeBreakdown,
      monthlyData,
    };
  };

  const getStatusBreakdown = () => {
    const breakdown = {};
    filteredData.forEach((item) => {
      breakdown[item.status] = (breakdown[item.status] || 0) + 1;
    });
    return breakdown;
  };

  const getCategoryBreakdown = () => {
    const breakdown = {};
    filteredData.forEach((item) => {
      breakdown[item.category] = (breakdown[item.category] || 0) + 1;
    });
    return breakdown;
  };

  const getTypeBreakdown = () => {
    const breakdown = {};
    filteredData.forEach((item) => {
      breakdown[item.type] = (breakdown[item.type] || 0) + 1;
    });
    return breakdown;
  };

  const getChartData = () => {
    const analytics = getInventoryAnalytics();

    const statusChartData = {
      labels: Object.keys(analytics.statusBreakdown),
      datasets: [
        {
          data: Object.values(analytics.statusBreakdown),
          backgroundColor: Object.keys(analytics.statusBreakdown).map(
            (status) => getStatusColor(status)
          ),
        },
      ],
    };

    const categoryEntries = Object.entries(analytics.categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const categoryChartData = {
      labels: categoryEntries.map(([category]) => category),
      datasets: [
        {
          label: "Items",
          data: categoryEntries.map(([, count]) => parseInt(count) || 0),
        },
      ],
    };

    const monthlyEntries = Object.entries(analytics.monthlyData)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-24);

    const monthlyChartData = {
      labels: monthlyEntries.map(([month]) => month),
      datasets: [
        {
          label: "Number of Items",
          data: monthlyEntries.map(([, data]) => parseInt(data.count) || 0),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
        },
        {
          label: "Total Value (NGN)",
          data: monthlyEntries.map(([, data]) => parseFloat(data.value) || 0),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.12)",
        },
      ],
    };

    return {
      statusChartData,
      categoryChartData,
      monthlyChartData,
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "#10B981",
      in_use: "#3B82F6",
      maintenance: "#F59E0B",
      retired: "#6B7280",
      lost: "#EF4444",
      damaged: "#F97316",
    };
    return colors[status] || "#6B7280";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { bg: "bg-green-100", text: "text-green-800", icon: "✅" },
      in_use: { bg: "bg-blue-100", text: "text-blue-800", icon: "🔵" },
      maintenance: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "🔧" },
      retired: { bg: "bg-gray-100", text: "text-gray-800", icon: "📦" },
      lost: { bg: "bg-red-100", text: "text-red-800", icon: "❌" },
      damaged: { bg: "bg-orange-100", text: "text-orange-800", icon: "⚠️" },
    };

    const config = statusConfig[status] || statusConfig.available;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <span className="mr-1">{config.icon}</span>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);

      const params = {
        reportType,
        period:
          reportType === "monthly"
            ? `${selectedMonth}/${selectedYear}`
            : selectedYear,
      };

      const blob = await inventoryService.exportInventoryReport(params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-report-${reportType}-${
        params.period || "all"
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF report:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setExportLoading(false);
    }
  };

  const generateReport = () => {
    const analytics = getInventoryAnalytics();
    const reportText = `
INVENTORY REPORT
================
Generated: ${new Date().toLocaleString()}
Period: ${
      reportType === "all"
        ? "All Time"
        : reportType === "monthly"
        ? `${selectedMonth}/${selectedYear}`
        : selectedYear
    }

SUMMARY
-------
Total Items: ${analytics.totalItems}
Total Value: NGN ${analytics.totalValue.toLocaleString()}
Project-tied Items: ${analytics.projectTiedItems}
Standalone Items: ${analytics.standaloneItems}

STATUS BREAKDOWN
----------------
${Object.entries(analytics.statusBreakdown)
  .map(([status, count]) => `${status.toUpperCase()}: ${count} items`)
  .join("\n")}

CATEGORY BREAKDOWN
------------------
${Object.entries(analytics.categoryBreakdown)
  .map(([category, count]) => `${category}: ${count} items`)
  .join("\n")}
    `;

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-report-${reportType}-${selectedYear}${
      reportType === "monthly" ? `-${selectedMonth}` : ""
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Text report generated successfully!");
  };

  const analytics = getInventoryAnalytics();
  const statusBreakdown = getStatusBreakdown();
  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Inventory Reports</h1>
            <p className="text-white/80">
              Generate and download comprehensive inventory reports and
              analytics
            </p>
          </div>

          {/* Report Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center space-y-4 xl:space-y-0">
              <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-4 w-full xl:w-auto">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Report Type:
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
                  >
                    <option value="all">All Data</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="yearly">Yearly Report</option>
                  </select>
                </div>

                {reportType === "monthly" && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      Month:
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) =>
                        setSelectedMonth(parseInt(e.target.value))
                      }
                      className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
                    >
                      <option value="all">All Months</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString("default", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Year:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full xl:w-auto">
                <button
                  onClick={handleExportPDF}
                  disabled={exportLoading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {exportLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                  )}
                  {exportLoading ? "Generating PDF..." : "Export PDF"}
                </button>
                <button
                  onClick={generateReport}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] w-full sm:w-auto"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download Text Report
                </button>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <CubeIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-blue-700">
                    Total Items
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {analytics.totalItems}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-green-700">
                    Total Value
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {formatCurrency(analytics.totalValue)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shadow-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-purple-700">
                    Available Items
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {statusBreakdown.available || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6 shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl shadow-lg">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-orange-700">
                    Period
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    {reportType === "all"
                      ? "All Time"
                      : reportType === "monthly"
                      ? `${selectedMonth}/${selectedYear}`
                      : selectedYear}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Analytics Charts - Responsive Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                Status Distribution
              </h3>
              <div className="h-80">
                <PieChart
                  data={getChartData().statusChartData}
                  title="Inventory Items by Status"
                  showLegend={true}
                />
              </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                Top Categories
              </h3>
              <div className="h-80">
                <BarChart
                  data={getChartData().categoryChartData}
                  title="Items by Category"
                  showLegend={false}
                />
              </div>
            </motion.div>
          </div>

          {/* Monthly Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              Monthly Inventory Trends
            </h3>
            <div className="h-96">
              <LineChart
                data={getChartData().monthlyChartData}
                title="Inventory Activity Over Time"
                showLegend={true}
              />
            </div>
          </motion.div>

          {/* Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const getStatusStyles = (status) => {
                  switch (status.toLowerCase()) {
                    case "available":
                      return {
                        bg: "bg-gradient-to-br from-green-50 to-emerald-100",
                        border: "border-green-200",
                        text: "text-green-800",
                        count: "text-green-900",
                        icon: "✅",
                      };
                    case "in_use":
                      return {
                        bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
                        border: "border-blue-200",
                        text: "text-blue-800",
                        count: "text-blue-900",
                        icon: "🔵",
                      };
                    case "maintenance":
                      return {
                        bg: "bg-gradient-to-br from-yellow-50 to-amber-100",
                        border: "border-yellow-200",
                        text: "text-yellow-800",
                        count: "text-yellow-900",
                        icon: "🔧",
                      };
                    case "retired":
                      return {
                        bg: "bg-gradient-to-br from-gray-50 to-slate-100",
                        border: "border-gray-200",
                        text: "text-gray-800",
                        count: "text-gray-900",
                        icon: "📦",
                      };
                    case "lost":
                      return {
                        bg: "bg-gradient-to-br from-red-50 to-rose-100",
                        border: "border-red-200",
                        text: "text-red-800",
                        count: "text-red-900",
                        icon: "❌",
                      };
                    case "damaged":
                      return {
                        bg: "bg-gradient-to-br from-orange-50 to-amber-100",
                        border: "border-orange-200",
                        text: "text-orange-800",
                        count: "text-orange-900",
                        icon: "⚠️",
                      };
                    default:
                      return {
                        bg: "bg-gradient-to-br from-gray-50 to-slate-100",
                        border: "border-gray-200",
                        text: "text-gray-800",
                        count: "text-gray-900",
                        icon: "📋",
                      };
                  }
                };

                const styles = getStatusStyles(status);

                return (
                  <div
                    key={status}
                    className={`text-center p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-300 ${styles.bg} ${styles.border}`}
                  >
                    <div className="text-3xl mb-2">{styles.icon}</div>
                    <div className={`text-3xl font-bold ${styles.count} mb-2`}>
                      {count}
                    </div>
                    <div
                      className={`text-sm font-semibold ${styles.text} tracking-wide`}
                    >
                      {status.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Category Breakdown */}
          {Object.keys(categoryBreakdown).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Categories
              </h3>
              <div className="space-y-3">
                {Object.entries(categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count], index) => (
                    <div
                      key={category}
                      className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                        index === 0
                          ? "bg-gradient-to-r from-yellow-50 to-amber-100 border-yellow-200 shadow-sm"
                          : index === 1
                          ? "bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200 shadow-sm"
                          : index === 2
                          ? "bg-gradient-to-r from-orange-50 to-amber-100 border-orange-200 shadow-sm"
                          : "bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-500 to-amber-600"
                              : index === 1
                              ? "bg-gradient-to-r from-gray-500 to-slate-600"
                              : index === 2
                              ? "bg-gradient-to-r from-orange-500 to-amber-600"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {category}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-[var(--elra-primary)]">
                        {count} items
                      </span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Recent Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Inventory Items
            </h3>
            <DataTable
              columns={[
                {
                  header: "Item Details",
                  key: "name",
                  renderer: (item) => (
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">{item.code}</div>
                      <div className="text-xs text-gray-400">{item.type}</div>
                    </div>
                  ),
                },
                {
                  header: "Category & Description",
                  key: "category",
                  renderer: (item) => (
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.category}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Value",
                  key: "currentValue",
                  renderer: (item) => (
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.currentValue)}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  key: "status",
                  renderer: (item) => getStatusBadge(item.status),
                },
                {
                  header: "Location",
                  key: "location",
                  renderer: (item) => (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {typeof item.location === "string"
                          ? item.location
                          : item.location?.warehouse || "N/A"}
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Created",
                  key: "createdAt",
                  renderer: (item) => (
                    <span className="text-gray-900">
                      {formatDate(item.createdAt)}
                    </span>
                  ),
                },
              ]}
              data={filteredData.slice(0, 20)}
              loading={loading}
              actions={{
                showEdit: false,
                showDelete: false,
                showToggle: false,
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;
