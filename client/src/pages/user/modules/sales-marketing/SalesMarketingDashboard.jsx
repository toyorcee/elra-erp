import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  MegaphoneIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  PieChart,
  LineChart,
  RadialProgress,
} from "../../../../components/graphs";
import { formatCurrency } from "../../../../utils/formatters";
import {
  getSalesMarketingDashboard,
  getOperationalBudget,
} from "../../../../services/salesMarketingAPI";
import { toast } from "react-toastify";

const SalesMarketingDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [operationalBudget, setOperationalBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, budgetResponse] = await Promise.all([
        getSalesMarketingDashboard(),
        getOperationalBudget(),
      ]);

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      } else {
        toast.error(
          dashboardResponse.message || "Failed to load dashboard data"
        );
      }

      if (budgetResponse.success) {
        setOperationalBudget(budgetResponse.data);
      } else {
        console.warn(
          "Failed to load operational budget:",
          budgetResponse.message
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Sales & Marketing Dashboard</h1>
        <p className="text-white/80">
          Comprehensive overview of sales and marketing financial performance
        </p>
      </div>

      {/* Combined Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Total Revenue
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                {formatCurrency(dashboardData.combined?.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                Total Expenses
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-red-900 mt-2 break-all leading-tight">
                {formatCurrency(dashboardData.combined?.totalExpenses || 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <ArrowTrendingDownIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Net Profit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Net Profit
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                {formatCurrency(dashboardData.combined?.netProfit || 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Total Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Total Transactions
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                {dashboardData.combined?.totalTransactions || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Operational Budget Status */}
      {operationalBudget && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-xl shadow-lg border p-6 ${
            operationalBudget.isVeryLow
              ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
              : operationalBudget.isLow
              ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
              : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-xl ${
                  operationalBudget.isVeryLow
                    ? "bg-gradient-to-br from-red-500 to-red-600"
                    : operationalBudget.isLow
                    ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                    : "bg-gradient-to-br from-green-500 to-green-600"
                }`}
              >
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Operational Budget Status
                </h3>
                <p className="text-sm text-gray-600">
                  Available funds for Sales & Marketing expenses
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                operationalBudget.isVeryLow
                  ? "bg-red-100 text-red-800"
                  : operationalBudget.isLow
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {operationalBudget.isVeryLow
                ? "Very Low"
                : operationalBudget.isLow
                ? "Low"
                : "Healthy"}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            {/* Center radial progress - Used % of allocated */}
            <div className="lg:col-span-2 order-last lg:order-none flex items-center justify-center">
              <RadialProgress
                percentage={
                  operationalBudget.total > 0
                    ? (operationalBudget.used / operationalBudget.total) * 100
                    : 0
                }
                size={160}
                strokeWidth={14}
                progressColor={
                  operationalBudget.isVeryLow
                    ? "#DC2626"
                    : operationalBudget.isLow
                    ? "#D97706"
                    : "#0d6449"
                }
                label={`of allocated budget used`}
              />
            </div>

            {/* Stats */}
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Available
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  operationalBudget.isVeryLow
                    ? "text-red-600"
                    : operationalBudget.isLow
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {formatCurrency(operationalBudget.available)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Used
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(operationalBudget.used)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Reserved
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(operationalBudget.reserved)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Total
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(operationalBudget.total)}
              </p>
            </div>
          </div>

          {operationalBudget.isLow && (
            <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">⚠️ Low Budget Alert:</span>{" "}
                Available funds are below{" "}
                {formatCurrency(operationalBudget.threshold)}. Contact Finance
                HOD to add funds before creating large expenses.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Sales Performance
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(dashboardData.sales?.totalRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expenses</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(dashboardData.sales?.totalExpenses || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-orange-600">
                {dashboardData.sales?.pendingTransactions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">
                {dashboardData.sales?.completedTransactions || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Marketing Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <MegaphoneIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Marketing Performance
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(dashboardData.marketing?.totalRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expenses</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(dashboardData.marketing?.totalExpenses || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-orange-600">
                {dashboardData.marketing?.pendingTransactions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">
                {dashboardData.marketing?.completedTransactions || 0}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Performance Analytics
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expenses Pie Chart */}
          <div>
            <PieChart
              data={{
                labels: ["Revenue", "Expenses"],
                datasets: [
                  {
                    data: [
                      dashboardData.combined?.totalRevenue || 0,
                      dashboardData.combined?.totalExpenses || 0,
                    ],
                  },
                ],
              }}
              title="Revenue vs Expenses"
              height={300}
              colors={["#10B981", "#EF4444"]}
            />
          </div>

          {/* Department Comparison Bar Chart */}
          <div>
            <BarChart
              data={{
                labels: [
                  "Sales Revenue",
                  "Sales Expenses",
                  "Marketing Revenue",
                  "Marketing Expenses",
                ],
                datasets: [
                  {
                    label: "Amount (₦)",
                    data: [
                      dashboardData.sales?.totalRevenue || 0,
                      dashboardData.sales?.totalExpenses || 0,
                      dashboardData.marketing?.totalRevenue || 0,
                      dashboardData.marketing?.totalExpenses || 0,
                    ],
                  },
                ],
              }}
              title="Department Comparison"
              height={300}
              colors={["#3B82F6", "#EF4444", "#8B5CF6", "#F59E0B"]}
            />
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Recent Transactions
        </h3>

        <div className="space-y-4">
          {(dashboardData.recentTransactions || []).length > 0 ? (
            (dashboardData.recentTransactions || []).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-2 rounded-lg ${
                      transaction.type === "deposit"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {transaction.type === "deposit" ? (
                      <ArrowTrendingUpIcon className="h-5 w-5" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {transaction.title}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {transaction.type} • {transaction.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === "deposit"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "deposit" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === "processed"
                        ? "bg-green-100 text-green-800"
                        : transaction.status === "approved"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent transactions found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SalesMarketingDashboard;
