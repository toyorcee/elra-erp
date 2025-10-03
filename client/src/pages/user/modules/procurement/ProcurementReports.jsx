import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { BarChart, PieChart, LineChart } from "../../../../components/graphs";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPurchaseOrders,
  exportProcurementReportPDF,
} from "../../../../services/procurementAPI";
import { toast } from "react-toastify";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

const ProcurementReports = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filteredData, setFilteredData] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Procurement Reports.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [purchaseOrders, reportType, selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetchPurchaseOrders();
      if (response.success) {
        setPurchaseOrders(response.data);
      } else {
        toast.error("Failed to load procurement data");
      }
    } catch (error) {
      console.error("Error loading procurement data:", error);
      toast.error("Error loading procurement data");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...purchaseOrders];

    if (reportType === "all") {
      setFilteredData(filtered);
      return;
    }

    if (reportType === "monthly") {
      filtered = filtered.filter((po) => {
        const poDate = new Date(po.createdAt);
        if (selectedMonth === "all") {
          return poDate.getFullYear() === selectedYear;
        }
        return (
          poDate.getMonth() + 1 === selectedMonth &&
          poDate.getFullYear() === selectedYear
        );
      });
    } else if (reportType === "yearly") {
      filtered = filtered.filter((po) => {
        const poDate = new Date(po.createdAt);
        return poDate.getFullYear() === selectedYear;
      });
    }
    setFilteredData(filtered);
  };

  const generateReport = () => {
    const reportData = {
      reportType,
      period:
        reportType === "monthly"
          ? `${selectedMonth}/${selectedYear}`
          : selectedYear,
      totalPOs: filteredData.length,
      totalAmount: filteredData.reduce(
        (sum, po) => sum + (po.totalAmount || 0),
        0
      ),
      byStatus: getStatusBreakdown(),
      bySupplier: getSupplierBreakdown(),
      byProject: getProjectBreakdown(),
      data: filteredData,
    };

    // Create downloadable report
    const reportContent = generateReportContent(reportData);
    downloadReport(
      reportContent,
      `procurement-report-${reportType}-${selectedYear}${
        reportType === "monthly" ? `-${selectedMonth}` : ""
      }.txt`
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

      const blob = await exportProcurementReportPDF(params);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `procurement-report-${reportType}-${selectedYear}${
        reportType === "monthly" ? `-${selectedMonth}` : ""
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

  const generateReportContent = (data) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let content = `ELRA PROCUREMENT REPORT\n`;
    content += `========================\n\n`;
    content += `Report Type: ${data.reportType.toUpperCase()}\n`;
    content += `Period: ${data.period}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    content += `SUMMARY\n`;
    content += `-------\n`;
    content += `Total Purchase Orders: ${data.totalPOs}\n`;
    content += `Total Amount: ${formatCurrency(data.totalAmount)}\n\n`;

    content += `STATUS BREAKDOWN\n`;
    content += `----------------\n`;
    Object.entries(data.byStatus).forEach(([status, count]) => {
      content += `${status.toUpperCase()}: ${count}\n`;
    });
    content += `\n`;

    content += `SUPPLIER BREAKDOWN\n`;
    content += `------------------\n`;
    Object.entries(data.bySupplier).forEach(([supplier, amount]) => {
      content += `${supplier}: ${formatCurrency(amount)}\n`;
    });
    content += `\n`;

    if (data.byProject && Object.keys(data.byProject).length > 0) {
      content += `PROJECT BREAKDOWN\n`;
      content += `-----------------\n`;
      Object.entries(data.byProject).forEach(([project, amount]) => {
        content += `${project}: ${formatCurrency(amount)}\n`;
      });
      content += `\n`;
    }

    content += `DETAILED RECORDS\n`;
    content += `----------------\n`;
    data.data.forEach((po, index) => {
      content += `${index + 1}. ${po.poNumber} - ${po.title}\n`;
      content += `   Supplier: ${po.supplier?.name || "N/A"}\n`;
      content += `   Amount: ${formatCurrency(po.totalAmount)}\n`;
      content += `   Status: ${po.status.toUpperCase()}\n`;
      content += `   Created: ${formatDate(po.createdAt)}\n`;
      if (po.relatedProject) {
        content += `   Project: ${po.relatedProject.name}\n`;
      }
      content += `\n`;
    });

    return content;
  };

  const downloadReport = (content, filename) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully!");
  };

  const getStatusBreakdown = () => {
    const breakdown = {};
    filteredData.forEach((po) => {
      breakdown[po.status] = (breakdown[po.status] || 0) + 1;
    });
    return breakdown;
  };

  const getSupplierBreakdown = () => {
    const breakdown = {};
    filteredData.forEach((po) => {
      const supplier = po.supplier?.name || "Unknown";
      const amount = parseFloat(po.totalAmount) || 0;
      breakdown[supplier] = (breakdown[supplier] || 0) + amount;
    });
    return breakdown;
  };

  const getProjectBreakdown = () => {
    const breakdown = {};
    filteredData.forEach((po) => {
      if (po.relatedProject) {
        const project = po.relatedProject.name;
        const amount = parseFloat(po.totalAmount) || 0;
        breakdown[project] = (breakdown[project] || 0) + amount;
      }
    });
    return breakdown;
  };

  // Enhanced analytics functions
  const getProcurementAnalytics = () => {
    const totalPOs = filteredData.length;
    const totalAmount = filteredData.reduce(
      (sum, po) => sum + (parseFloat(po.totalAmount) || 0),
      0
    );
    const projectTiedPOs = filteredData.filter(
      (po) => po.relatedProject
    ).length;
    const standalonePOs = filteredData.filter(
      (po) => !po.relatedProject
    ).length;

    const statusBreakdown = getStatusBreakdown();
    const supplierBreakdown = getSupplierBreakdown();
    const projectBreakdown = getProjectBreakdown();

    const monthlyData = {};
    filteredData.forEach((po) => {
      const month = new Date(po.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      monthlyData[month].count += 1;
      monthlyData[month].amount += parseFloat(po.totalAmount) || 0;
    });

    return {
      totalPOs,
      totalAmount,
      projectTiedPOs,
      standalonePOs,
      statusBreakdown,
      supplierBreakdown,
      projectBreakdown,
      monthlyData,
    };
  };

  const getChartData = () => {
    const analytics = getProcurementAnalytics();

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

    const supplierEntries = Object.entries(analytics.supplierBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);

    const supplierChartData = {
      labels: supplierEntries.map(([supplier]) => supplier),
      datasets: [
        {
          label: "Amount (NGN)",
          data: supplierEntries.map(([, amount]) => parseFloat(amount) || 0),
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
          label: "Number of POs",
          data: monthlyEntries.map(([, data]) => parseInt(data.count) || 0),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
        },
        {
          label: "Total Amount (NGN)",
          data: monthlyEntries.map(([, data]) => parseFloat(data.amount) || 0),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.12)",
        },
      ],
    };

    return {
      statusChartData,
      supplierChartData,
      monthlyChartData,
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "#6B7280",
      pending: "#F59E0B",
      approved: "#10B981",
      completed: "#059669",
      cancelled: "#EF4444",
      issued: "#3B82F6",
      paid: "#8B5CF6",
      delivered: "#10B981",
    };
    return colors[status] || "#6B7280";
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || statusColors.draft
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  const totalAmount = filteredData.reduce(
    (sum, po) => sum + (po.totalAmount || 0),
    0
  );
  const statusBreakdown = getStatusBreakdown();
  const supplierBreakdown = getSupplierBreakdown();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Procurement Reports</h1>
            <p className="text-white/80">
              Generate and download procurement reports by month or year
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
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-blue-700">
                    Total POs
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {filteredData.length}
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
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {formatCurrency(totalAmount)}
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
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-purple-700">
                    Statuses
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {Object.keys(statusBreakdown).length}
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
                  title="Purchase Orders by Status"
                  showLegend={true}
                />
              </div>
            </motion.div>

            {/* Top Suppliers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                Top Suppliers by Value
              </h3>
              <div className="h-80">
                <BarChart
                  data={getChartData().supplierChartData}
                  title="Supplier Spending"
                  showLegend={false}
                />
              </div>
            </motion.div>
          </div>

          {/* Monthly Trends - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              Monthly Procurement Trends
            </h3>
            <div className="h-96">
              <LineChart
                data={getChartData().monthlyChartData}
                title="Procurement Activity Over Time"
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
                    case "delivered":
                      return {
                        bg: "bg-gradient-to-br from-green-50 to-emerald-100",
                        border: "border-green-200",
                        text: "text-green-800",
                        count: "text-green-900",
                        icon: "✅",
                      };
                    case "pending":
                      return {
                        bg: "bg-gradient-to-br from-yellow-50 to-amber-100",
                        border: "border-yellow-200",
                        text: "text-yellow-800",
                        count: "text-yellow-900",
                        icon: "⏳",
                      };
                    case "approved":
                      return {
                        bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
                        border: "border-blue-200",
                        text: "text-blue-800",
                        count: "text-blue-900",
                        icon: "✅",
                      };
                    case "draft":
                      return {
                        bg: "bg-gradient-to-br from-gray-50 to-slate-100",
                        border: "border-gray-200",
                        text: "text-gray-800",
                        count: "text-gray-900",
                        icon: "📝",
                      };
                    case "cancelled":
                      return {
                        bg: "bg-gradient-to-br from-red-50 to-rose-100",
                        border: "border-red-200",
                        text: "text-red-800",
                        count: "text-red-900",
                        icon: "❌",
                      };
                    case "issued":
                      return {
                        bg: "bg-gradient-to-br from-purple-50 to-violet-100",
                        border: "border-purple-200",
                        text: "text-purple-800",
                        count: "text-purple-900",
                        icon: "📤",
                      };
                    case "paid":
                      return {
                        bg: "bg-gradient-to-br from-emerald-50 to-teal-100",
                        border: "border-emerald-200",
                        text: "text-emerald-800",
                        count: "text-emerald-900",
                        icon: "💰",
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

          {/* Supplier Breakdown */}
          {Object.keys(supplierBreakdown).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Suppliers
              </h3>
              <div className="space-y-3">
                {Object.entries(supplierBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([supplier, amount], index) => (
                    <div
                      key={supplier}
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
                          {supplier}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-[var(--elra-primary)]">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Recent POs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Purchase Orders
            </h3>
            <DataTable
              columns={[
                {
                  header: "PO Number",
                  key: "poNumber",
                  renderer: (po) => (
                    <span className="font-medium text-gray-900">
                      {po.poNumber}
                    </span>
                  ),
                },
                {
                  header: "Title",
                  key: "title",
                  renderer: (po) => (
                    <span className="text-gray-900">{po.title}</span>
                  ),
                },
                {
                  header: "Supplier",
                  key: "supplier",
                  renderer: (po) => (
                    <span className="text-gray-900">
                      {po.supplier?.name || "N/A"}
                    </span>
                  ),
                },
                {
                  header: "Amount",
                  key: "totalAmount",
                  renderer: (po) => (
                    <span className="text-gray-900">
                      {formatCurrency(po.totalAmount)}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  key: "status",
                  renderer: (po) => getStatusBadge(po.status),
                },
                {
                  header: "Created",
                  key: "createdAt",
                  renderer: (po) => (
                    <span className="text-gray-900">
                      {formatDate(po.createdAt)}
                    </span>
                  ),
                },
              ]}
              data={filteredData}
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

export default ProcurementReports;
