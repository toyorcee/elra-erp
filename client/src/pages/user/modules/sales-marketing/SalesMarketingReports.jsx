import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { BarChart, PieChart, LineChart } from "../../../../components/graphs";
import { formatCurrency } from "../../../../utils/formatters";
import {
  getSalesMarketingReports,
  exportSalesMarketingReport,
} from "../../../../services/salesMarketingAPI";
import { toast } from "react-toastify";

const SalesMarketingReports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30"); 
  const [departmentFilter, setDepartmentFilter] = useState("all");

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, departmentFilter]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const response = await getSalesMarketingReports({
        dateRange,
        departmentFilter,
      });

      if (response.success) {
        setReportsData(response.data);
      } else {
        toast.error(response.message || "Failed to load reports data");
      }
    } catch (error) {
      console.error("Error fetching reports data:", error);
      toast.error("Error loading reports data");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await exportSalesMarketingReport(format, {
        dateRange,
        departmentFilter,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `sales-marketing-report.${format.toLowerCase()}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load reports data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sales & Marketing Reports
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and performance insights
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => exportReport("PDF")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => exportReport("Excel")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
            >
              <option value="all">All Departments</option>
              <option value="sales">Sales Only</option>
              <option value="marketing">Marketing Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Total Revenue
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                {formatCurrency(reportsData.summary.totalRevenue)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border border-red-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                Total Expenses
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-red-900 mt-2 break-all leading-tight">
                {formatCurrency(reportsData.summary.totalExpenses)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Net Profit
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                {formatCurrency(reportsData.summary.netProfit)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <CalendarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Total Transactions
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                {reportsData.summary.totalTransactions}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <FunnelIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Line Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Monthly Performance
          </h3>
          <LineChart
            data={{
              labels: reportsData.monthlyData.map((d) => d.month),
              datasets: [
                {
                  label: "Sales Revenue",
                  data: reportsData.monthlyData.map((d) => d.sales),
                  borderColor: "#3B82F6",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                },
                {
                  label: "Marketing Revenue",
                  data: reportsData.monthlyData.map((d) => d.marketing),
                  borderColor: "#8B5CF6",
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                },
                {
                  label: "Total Expenses",
                  data: reportsData.monthlyData.map((d) => d.expenses),
                  borderColor: "#EF4444",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                },
              ],
            }}
            title="Revenue vs Expenses Trend"
            height={300}
            showArea={true}
          />
        </motion.div>

        {/* Department Revenue Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Department Revenue
          </h3>
          <PieChart
            data={{
              labels: ["Sales Revenue", "Marketing Revenue"],
              datasets: [
                {
                  data: [
                    reportsData.summary.salesRevenue,
                    reportsData.summary.marketingRevenue,
                  ],
                },
              ],
            }}
            title="Revenue Distribution"
            height={300}
            colors={["#3B82F6", "#8B5CF6"]}
          />
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Sales Categories
          </h3>
          <BarChart
            data={{
              labels: reportsData.categoryBreakdown.sales.map(
                (c) => c.category
              ),
              datasets: [
                {
                  label: "Revenue (₦)",
                  data: reportsData.categoryBreakdown.sales.map(
                    (c) => c.amount
                  ),
                },
              ],
            }}
            title="Sales Performance by Category"
            height={300}
            colors={["#3B82F6"]}
          />
        </motion.div>

        {/* Marketing Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Marketing Categories
          </h3>
          <BarChart
            data={{
              labels: reportsData.categoryBreakdown.marketing.map(
                (c) => c.category
              ),
              datasets: [
                {
                  label: "Revenue (₦)",
                  data: reportsData.categoryBreakdown.marketing.map(
                    (c) => c.amount
                  ),
                },
              ],
            }}
            title="Marketing Performance by Category"
            height={300}
            colors={["#8B5CF6"]}
          />
        </motion.div>
      </div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Top Performers</h3>
        <div className="space-y-4">
          {reportsData.topPerformers.map((performer, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {performer.name}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {performer.department} • {performer.transactions}{" "}
                    transactions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  {formatCurrency(performer.revenue)}
                </p>
                <p className="text-sm text-gray-500">Revenue Generated</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SalesMarketingReports;
