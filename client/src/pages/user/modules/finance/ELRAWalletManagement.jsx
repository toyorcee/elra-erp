import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WalletIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import {
  getELRAWallet,
  addFundsToWallet,
  getWalletTransactions,
  setBudgetAllocation,
} from "../../../../services/financeAPI";
import {
  formatCurrency,
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../../../../utils/formatters";
import { BarChart, PieChart, LineChart } from "../../../../components/graphs";
import AnimatedBubbles from "../../../../components/ui/AnimatedBubbles";

const ELRAWalletManagement = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [addFundsData, setAddFundsData] = useState({
    amount: "",
    description: "",
    allocateToBudget: false,
    budgetCategory: "payroll",
  });
  const [addingFunds, setAddingFunds] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetData, setBudgetData] = useState({
    category: "payroll",
    amount: "",
  });
  const [settingBudget, setSettingBudget] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);

  const canAddFunds = () => {
    const userDepartment = user?.department?.name;
    const isSuperAdmin = user?.role?.level === 1000;
    const isExecutive =
      user?.role?.level === 700 && userDepartment === "Executive Office";

    return isSuperAdmin || isExecutive;
  };

  const transactionColumns = [
    {
      header: "Transaction",
      accessor: "description",
      renderer: (transaction) => (
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${
              transaction.type === "deposit"
                ? "bg-green-100"
                : transaction.type === "withdrawal"
                ? "bg-red-100"
                : "bg-blue-100"
            }`}
          >
            {transaction.type === "deposit" ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
            ) : transaction.type === "withdrawal" ? (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
            ) : (
              <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">
              {transaction.description?.replace(/_/g, " ").replace(/-/g, " ")}
            </p>
            {transaction.reference && (
              <p className="text-xs text-gray-500 font-mono">
                Ref:{" "}
                {transaction.reference?.replace(/_/g, " ").replace(/-/g, " ")}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      renderer: (transaction) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            transaction.type === "deposit"
              ? "bg-green-100 text-green-800"
              : transaction.type === "withdrawal"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
        </span>
      ),
    },
    {
      header: "Date & Time",
      accessor: "date",
      renderer: (transaction) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {new Date(transaction.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(transaction.date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      renderer: (transaction) => (
        <div>
          <div
            className={`text-sm font-medium ${
              transaction.amount > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.amount > 0 ? "+" : ""}
            {formatCurrency(transaction.amount)}
          </div>
          <div className="text-sm text-gray-500">
            Balance: {formatCurrency(transaction.balanceAfter)}
          </div>
        </div>
      ),
    },
  ];

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletResponse, transactionsResponse] = await Promise.all([
        getELRAWallet(),
        getWalletTransactions({ limit: 10 }),
      ]);

      console.log("Wallet Response:", walletResponse);
      console.log("Transactions Response:", transactionsResponse);

      setWalletData(walletResponse.data);
      setTransactions(transactionsResponse.data?.transactions || []);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Error fetching wallet data");
    } finally {
      setLoading(false);
    }
  };

  // Add funds to wallet
  const handleAddFunds = async (e) => {
    e.preventDefault();
    try {
      setAddingFunds(true);

      // Prepare the data for API call
      const apiData = {
        amount: parseFormattedNumber(addFundsData.amount),
        description: addFundsData.description,
        allocateToBudget: addFundsData.allocateToBudget,
        budgetCategory: addFundsData.allocateToBudget
          ? addFundsData.budgetCategory
          : null,
        monthlyLimit:
          addFundsData.allocateToBudget &&
          addFundsData.budgetCategory === "payroll" &&
          addFundsData.monthlyLimit
            ? parseFormattedNumber(addFundsData.monthlyLimit)
            : null,
        quarterlyLimit:
          addFundsData.allocateToBudget &&
          addFundsData.budgetCategory === "payroll" &&
          addFundsData.quarterlyLimit
            ? parseFormattedNumber(addFundsData.quarterlyLimit)
            : null,
        yearlyLimit:
          addFundsData.allocateToBudget &&
          addFundsData.budgetCategory === "payroll" &&
          addFundsData.yearlyLimit
            ? parseFormattedNumber(addFundsData.yearlyLimit)
            : null,
      };

      const response = await addFundsToWallet(apiData);

      if (response.success) {
        toast.success(response.message || "Funds added successfully");
        setShowAddFundsModal(false);
        setAddFundsData({
          amount: "",
          description: "",
          allocateToBudget: false,
          budgetCategory: "payroll",
        });
        fetchWalletData();
      } else {
        throw new Error(response.message || "Failed to add funds");
      }
    } catch (error) {
      console.error("Error adding funds:", error);
      toast.error(error.message);
    } finally {
      setAddingFunds(false);
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!budgetData.amount) {
      toast.error("Please enter the budget amount");
      return;
    }

    try {
      setSettingBudget(true);
      const response = await setBudgetAllocation({
        category: budgetData.category,
        amount: parseFormattedNumber(budgetData.amount),
        // Frequency limits removed for simplicity
      });

      if (response.success) {
        toast.success(response.message || "Budget allocation set successfully");
        setBudgetData({
          category: "payroll",
          amount: "",
        });
        setShowBudgetModal(false);
        fetchWalletData();
      } else {
        throw new Error(response.message || "Failed to set budget allocation");
      }
    } catch (error) {
      console.error("Error setting budget:", error);
      toast.error(error.message);
    } finally {
      setSettingBudget(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const getUtilizationColor = (percentage) => {
    if (percentage < 50) return "text-green-600";
    if (percentage < 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[var(--elra-primary)] bg-opacity-10 rounded-lg">
              <WalletIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ELRA Wallet Management
              </h1>
              <p className="text-gray-600">
                Manage ELRA company funds and allocations
              </p>
            </div>
          </div>
          {canAddFunds() && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddFundsModal(true)}
                className="flex items-center space-x-2 bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors cursor-pointer"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Funds</span>
              </button>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                <ChartBarIcon className="h-5 w-5" />
                <span>Set Budget</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      {walletData?.financialSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Funds */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                  Total Funds
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                  {formatCurrency(walletData.financialSummary.totalFunds)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Available Funds */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                  Available Funds
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-2 break-all leading-tight">
                  {formatCurrency(walletData.financialSummary.availableFunds)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Allocated Funds */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg border border-indigo-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
                  Allocated Funds
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-900 mt-2 break-all leading-tight">
                  {formatCurrency(walletData.financialSummary.allocatedFunds)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Reserved Funds */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                  Reserved Funds
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-2 break-all leading-tight">
                  {formatCurrency(walletData.financialSummary.reservedFunds)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Wallet Data Available
            </h3>
            <p className="text-gray-600">
              Unable to load wallet information. Please try refreshing the page.
            </p>
          </div>
        </div>
      )}

      {/* Budget Category Cards */}
      {walletData?.financialSummary?.budgetCategories && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Payroll Budget */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                  Payroll Budget
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                  {formatCurrency(
                    walletData.financialSummary.budgetCategories.payroll
                      ?.available || 0
                  )}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Allocated:{" "}
                  {formatCurrency(
                    walletData.financialSummary.budgetCategories.payroll
                      ?.allocated || 0
                  )}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Projects Budget */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                  Projects Budget
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                  {formatCurrency(
                    walletData.financialSummary.budgetCategories.projects
                      ?.available || 0
                  )}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Allocated:{" "}
                  {formatCurrency(
                    walletData.financialSummary.budgetCategories.projects
                      ?.allocated || 0
                  )}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Operational Budget */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                  Operational Budget
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-900 mt-2 break-all leading-tight">
                  {formatCurrency(
                    walletData.financialSummary.budgetCategories.operational
                      ?.available || 0
                  )}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Allocated:{" "}
                  {formatCurrency(
                    walletData.financialSummary.budgetCategories.operational
                      ?.allocated || 0
                  )}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fund Utilization */}
      {walletData?.financialSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Debug info - remove this later */}
          <div className="mb-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: Total={walletData.financialSummary.totalFunds}, Allocated=
            {walletData.financialSummary.allocatedFunds}, Reserved=
            {walletData.financialSummary.reservedFunds}, Available=
            {walletData.financialSummary.availableFunds}, Utilization=
            {walletData.financialSummary.utilizationPercentage}%
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Fund Utilization
            </h3>
            <div className="text-right">
              <span
                className={`text-sm font-medium ${getUtilizationColor(
                  walletData.financialSummary.utilizationPercentage
                )}`}
              >
                {walletData.financialSummary.utilizationPercentage.toFixed(1)}%
                committed
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(walletData.financialSummary.availableFunds)}{" "}
                available
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[var(--elra-primary)] h-3 rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(
                  Math.min(
                    walletData.financialSummary.utilizationPercentage,
                    100
                  ),
                  0.5
                )}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>
              Available:{" "}
              {formatCurrency(walletData.financialSummary.availableFunds)}
            </span>
            <span>
              Committed:{" "}
              {formatCurrency(
                walletData.financialSummary.allocatedFunds +
                  walletData.financialSummary.reservedFunds
              )}
            </span>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <p>
              <strong>Total Funds:</strong>{" "}
              {formatCurrency(walletData.financialSummary.totalFunds)} |
              <strong> Allocated:</strong>{" "}
              {formatCurrency(walletData.financialSummary.allocatedFunds)} |
              <strong> Reserved:</strong>{" "}
              {formatCurrency(walletData.financialSummary.reservedFunds)}
            </p>
          </div>
        </div>
      )}

      {/* Wallet Analytics Graphs */}
      {walletData?.financialSummary && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Wallet Analytics
            </h3>

            {/* Budget Category Breakdown Pie Chart */}
            <div className="mb-8">
              <PieChart
                data={{
                  labels: [
                    "Main Pool",
                    "Payroll Budget",
                    "Projects Budget",
                    "Operational Budget",
                  ],
                  datasets: [
                    {
                      data: [
                        walletData.financialSummary.availableFunds,
                        walletData.financialSummary.budgetCategories?.payroll
                          ?.available || 0,
                        walletData.financialSummary.budgetCategories?.projects
                          ?.available || 0,
                        walletData.financialSummary.budgetCategories
                          ?.operational?.available || 0,
                      ],
                    },
                  ],
                }}
                title="Budget Category Breakdown"
                height={350}
                colors={["#2563EB", "#059669", "#7C3AED", "#D97706"]}
              />
            </div>

            {/* Fund Comparison Bar Chart */}
            <div className="mb-8">
              <BarChart
                data={{
                  labels: ["Total Funds", "Available", "Allocated", "Reserved"],
                  datasets: [
                    {
                      label: "Amount (₦)",
                      data: [
                        walletData.financialSummary.totalFunds,
                        walletData.financialSummary.availableFunds,
                        walletData.financialSummary.allocatedFunds,
                        walletData.financialSummary.reservedFunds,
                      ],
                    },
                  ],
                }}
                title="Fund Comparison"
                height={350}
                colors={["#8B5CF6", "#10B981", "#3B82F6", "#F59E0B"]}
              />
            </div>

            {/* Current Month Transaction Trends */}
            <div>
              <LineChart
                data={(() => {
                  // Generate current month days dynamically
                  const currentDate = new Date();
                  const currentMonth = currentDate.getMonth();
                  const currentYear = currentDate.getFullYear();
                  const daysInMonth = new Date(
                    currentYear,
                    currentMonth + 1,
                    0
                  ).getDate();

                  const days = [];
                  const dailyData = [];

                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentYear, currentMonth, day);
                    const dayLabel = date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                    days.push(dayLabel);

                    // Calculate total transactions for this day
                    const dayStart = new Date(
                      currentYear,
                      currentMonth,
                      day,
                      0,
                      0,
                      0
                    );
                    const dayEnd = new Date(
                      currentYear,
                      currentMonth,
                      day,
                      23,
                      59,
                      59
                    );

                    const dailyTransactions = transactions.filter((t) => {
                      const transactionDate = new Date(t.date);
                      return (
                        transactionDate >= dayStart && transactionDate <= dayEnd
                      );
                    });

                    const dailyTotal = dailyTransactions.reduce(
                      (sum, t) => sum + Math.abs(t.amount),
                      0
                    );
                    dailyData.push(dailyTotal);
                  }

                  return {
                    labels: days,
                    datasets: [
                      {
                        label: "Daily Transaction Volume (₦)",
                        data: dailyData,
                        borderColor: "#3B82F6",
                        backgroundColor: "#DBEAFE",
                        fill: true,
                      },
                    ],
                  };
                })()}
                title={`${new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })} Transaction Trends`}
                height={350}
                showArea={true}
                colors={["#3B82F6"]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Transactions
          </h3>
          <DataTable
            data={transactions}
            columns={transactionColumns}
            loading={loading}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
            }}
          />
        </div>
      )}

      {/* Add Funds Modal */}
      <AnimatePresence>
        {showAddFundsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-end justify-center z-50 sm:items-center"
            onClick={() => !addingFunds && setShowAddFundsModal(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
                duration: 0.3,
              }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Bubbles */}
              <AnimatedBubbles isVisible={showBubbles} variant="bubbles" />
              {/* Header with ELRA Logo */}
              <div className="relative bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-t-2xl sm:rounded-t-2xl p-6">
                <button
                  onClick={() => setShowAddFundsModal(false)}
                  disabled={addingFunds}
                  className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <WalletIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Add Funds to ELRA Wallet
                    </h3>
                    <p className="text-white/80 text-sm">
                      Increase your company's financial capacity
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={handleAddFunds} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (₦) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formatNumberWithCommas(addFundsData.amount)}
                        onChange={(e) => {
                          const rawValue = parseFormattedNumber(e.target.value);
                          setAddFundsData({
                            ...addFundsData,
                            amount: rawValue,
                          });
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 text-lg font-medium"
                        placeholder="Enter amount"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Balance Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Current Main Wallet Balance:
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ₦
                        {walletData?.financialSummary?.availableFunds?.toLocaleString() ||
                          "0"}
                      </span>
                    </div>
                    {addFundsData.amount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          After adding this amount:
                        </span>
                        <span className="font-semibold text-green-600">
                          ₦
                          {(
                            walletData?.financialSummary?.availableFunds +
                            parseFormattedNumber(addFundsData.amount)
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addFundsData.description}
                      onChange={(e) =>
                        setAddFundsData({
                          ...addFundsData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter description for this transaction"
                    />
                  </motion.div>

                  {/* Budget Allocation Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="border-t border-gray-200 pt-6"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="allocateToBudget"
                        checked={addFundsData.allocateToBudget}
                        onChange={(e) =>
                          setAddFundsData({
                            ...addFundsData,
                            allocateToBudget: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-[var(--elra-primary)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--elra-primary)] focus:ring-2"
                      />
                      <label
                        htmlFor="allocateToBudget"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Allocate directly to budget category
                      </label>
                    </div>

                    {addFundsData.allocateToBudget && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Budget Category
                          </label>
                          <select
                            value={addFundsData.budgetCategory}
                            onChange={(e) => {
                              setShowBubbles(true);
                              setAddFundsData({
                                ...addFundsData,
                                budgetCategory: e.target.value,
                              });
                              setTimeout(() => setShowBubbles(false), 2000);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                          >
                            <option value="payroll">Payroll Budget</option>
                            <option value="projects">Projects Budget</option>
                            <option value="operational">
                              Operational Budget
                            </option>
                          </select>
                        </div>

                        {/* Category Balance Information */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800">
                              Current{" "}
                              {addFundsData.budgetCategory
                                .charAt(0)
                                .toUpperCase() +
                                addFundsData.budgetCategory.slice(1)}{" "}
                              Budget:
                            </span>
                            <span className="text-lg font-bold text-blue-900">
                              ₦
                              {walletData?.financialSummary?.budgetCategories?.[
                                addFundsData.budgetCategory
                              ]?.available?.toLocaleString() || "0"}
                            </span>
                          </div>
                          {addFundsData.amount && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-blue-700">
                                After allocation:
                              </span>
                              <span className="font-semibold text-blue-900">
                                ₦
                                {(
                                  walletData?.financialSummary
                                    ?.budgetCategories?.[
                                    addFundsData.budgetCategory
                                  ]?.available +
                                  parseFormattedNumber(addFundsData.amount)
                                ).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-blue-700 mt-2">
                            <strong>Note:</strong> This amount will be added
                            directly to the {addFundsData.budgetCategory} budget
                            category.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex space-x-3 pt-4 border-t border-gray-200 mt-6"
                  >
                    <button
                      type="button"
                      onClick={() => setShowAddFundsModal(false)}
                      disabled={addingFunds}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingFunds}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-semibold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {addingFunds ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Adding Funds...</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-5 h-5" />
                          <span>Add Funds</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Allocation Modal */}
      <AnimatePresence>
        {showBudgetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBudgetModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative"
            >
              {/* Animated Bubbles */}
              <AnimatedBubbles isVisible={showBubbles} variant="bubbles" />
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Set Budget Allocation
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Allocate funds to specific budget categories
                  </p>
                </div>
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={settingBudget}
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={handleSetBudget} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Budget Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={budgetData.category}
                      onChange={(e) => {
                        setShowBubbles(true);
                        setBudgetData({
                          ...budgetData,
                          category: e.target.value,
                        });
                        setTimeout(() => setShowBubbles(false), 2000);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    >
                      <option value="payroll">Payroll Budget</option>
                      <option value="projects">Projects Budget</option>
                      <option value="operational">Operational Budget</option>
                    </select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Budget Amount (₦){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formatNumberWithCommas(budgetData.amount)}
                        onChange={(e) => {
                          const rawValue = parseFormattedNumber(e.target.value);
                          setBudgetData({
                            ...budgetData,
                            amount: rawValue,
                          });
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 text-lg font-medium"
                        placeholder="Enter total budget amount"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Balance Information for Set Budget */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Main Wallet Balance:
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            ₦
                            {walletData?.financialSummary?.availableFunds?.toLocaleString() ||
                              "0"}
                          </span>
                        </div>
                        {budgetData.amount && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              After allocation:
                            </span>
                            <span className="font-semibold text-orange-600">
                              ₦
                              {(
                                walletData?.financialSummary?.availableFunds -
                                parseFormattedNumber(budgetData.amount)
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Current{" "}
                            {budgetData.category.charAt(0).toUpperCase() +
                              budgetData.category.slice(1)}{" "}
                            Budget:
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            ₦
                            {walletData?.financialSummary?.budgetCategories?.[
                              budgetData.category
                            ]?.available?.toLocaleString() || "0"}
                          </span>
                        </div>
                        {budgetData.amount && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              After allocation:
                            </span>
                            <span className="font-semibold text-green-600">
                              ₦
                              {(
                                walletData?.financialSummary
                                  ?.budgetCategories?.[budgetData.category]
                                  ?.available +
                                parseFormattedNumber(budgetData.amount)
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Simple Allocation:</strong> The amount you enter
                      will be allocated directly to the {budgetData.category}{" "}
                      budget category.
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex space-x-4 pt-4 border-t border-gray-200 mt-6"
                  >
                    <button
                      type="button"
                      onClick={() => setShowBudgetModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                      disabled={settingBudget}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={settingBudget}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {settingBudget ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Setting Budget...
                        </>
                      ) : (
                        "Set Budget"
                      )}
                    </button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ELRAWalletManagement;
