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
  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const response = await getSalesMarketingReports({
        dateRange: "30", 
        departmentFilter: "all", 
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

  const handleExportPDF = async () => {
    try {
      await exportSalesMarketingReport("PDF", {
        dateRange: "30",
        departmentFilter: "all",
      });
      toast.success("PDF report exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF report");
    }
  };

  const handleExportWord = async () => {
    try {
      await exportSalesMarketingReport("Word", {
        dateRange: "30",
        departmentFilter: "all",
      });
      toast.success("Word report exported successfully!");
    } catch (error) {
      console.error("Error exporting Word report:", error);
      toast.error("Failed to export Word report");
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportSalesMarketingReport("CSV", {
        dateRange: "30",
        departmentFilter: "all",
      });
      toast.success("CSV report exported successfully!");
    } catch (error) {
      console.error("Error exporting CSV report:", error);
      toast.error("Failed to export CSV report");
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

  const recent = reportsData.recentTransactions || [];
  const aggregateByCategory = (referenceType) => {
    const map = new Map();
    for (const t of recent) {
      if (t.status !== "approved" || t.type !== "deposit") continue;
      if (t.referenceType !== referenceType) continue;
      const key = (t.category || "other").replace(/_/g, " ");
      map.set(key, (map.get(key) || 0) + (t.amount || 0));
    }
    return Array.from(map.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  };
  const salesCategories = aggregateByCategory("sales");
  const marketingCategories = aggregateByCategory("marketing");

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
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportPDF}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            title="Export Sales report as PDF"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportWord}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            title="Export Sales report as Word/HTML"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export Word</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            title="Export Sales report as CSV"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
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
                {formatCurrency(reportsData.summary?.totalRevenue || 0)}
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
                {formatCurrency(reportsData.summary?.totalExpenses || 0)}
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
                {formatCurrency(reportsData.summary?.netProfit || 0)}
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
                {reportsData.summary?.totalTransactions || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <FunnelIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly Performance - full width line chart */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Monthly Performance
          </h3>
          <LineChart
            data={{
              labels: (reportsData.monthlyTrends || []).map((d) => d.month),
              datasets: [
                {
                  label: "Total Revenue",
                  data: (reportsData.monthlyTrends || []).map(
                    (d) => d.revenue || 0
                  ),
                  borderColor: "#10B981",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                },
                {
                  label: "Total Expenses",
                  data: (reportsData.monthlyTrends || []).map(
                    (d) => d.expenses || 0
                  ),
                  borderColor: "#EF4444",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                },
              ],
            }}
            title="Revenue vs Expenses Trend"
            height={320}
            showArea={true}
          />
        </motion.div>
      </div>

      {/* Department splits - two pies side-by-side (stack on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
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
                    reportsData.summary?.salesRevenue || 0,
                    reportsData.summary?.marketingRevenue || 0,
                  ],
                },
              ],
            }}
            title="Revenue Distribution"
            height={300}
            colors={["#3B82F6", "#8B5CF6"]}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Department Expenses
          </h3>
          <PieChart
            data={{
              labels: ["Sales Expenses", "Marketing Expenses"],
              datasets: [
                {
                  data: [
                    reportsData.summary?.salesExpenses || 0,
                    reportsData.summary?.marketingExpenses || 0,
                  ],
                },
              ],
            }}
            title="Expenses Distribution"
            height={300}
            colors={["#F59E0B", "#EF4444"]}
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
              labels: (salesCategories || []).map((c) => c.category),
              datasets: [
                {
                  label: "Revenue (₦)",
                  data: (salesCategories || []).map((c) => c.amount),
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
              labels: (marketingCategories || []).map((c) => c.category),
              datasets: [
                {
                  label: "Revenue (₦)",
                  data: (marketingCategories || []).map((c) => c.amount),
                },
              ],
            }}
            title="Marketing Performance by Category"
            height={300}
            colors={["#8B5CF6"]}
          />
        </motion.div>
      </div>

      {/* Removed Top Performers due to lack of underlying data */}
    </div>
  );
};

export default SalesMarketingReports;
