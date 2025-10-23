import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  FunnelIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { BarChart, PieChart, LineChart } from "../../../../components/graphs";
import {
  getWalletTransactions,
  exportTransactionHistoryPDF,
  exportTransactionHistoryWord,
  exportTransactionHistoryCSV,
  getFinancialReportsData,
} from "../../../../services/financeAPI";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { useAuth } from "../../../../context/AuthContext";

const TransactionHistoryAndReports = () => {
  const { user } = useAuth();
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // Financial Reports State
  const [reportsData, setReportsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("365");
  const [activeTab, setActiveTab] = useState("transactions"); // "transactions" or "reports"

  // Separate loading states for export functions
  const [exportLoading, setExportLoading] = useState({
    pdf: false,
    word: false,
    csv: false,
  });

  const transactionColumns = [
    {
      header: "Transaction",
      accessor: "description",
      renderer: (transaction) => (
        <div className="flex items-center space-x-3">
          <div
            className={`p-3 rounded-lg ${getTransactionColor(
              transaction.type
            )}`}
          >
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {transaction.description?.replace(/_/g, " ").replace(/-/g, " ")}
            </h4>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDate(transaction.date)}</span>
              </span>
              {transaction.reference && (
                <span>Ref: {transaction.reference}</span>
              )}
              {transaction.referenceType && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {transaction.referenceType
                    .replace(/_/g, " ")
                    .replace(/-/g, " ")}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      headerClassName: "text-right",
      cellClassName: "text-right",
      renderer: (transaction) => (
        <div className="text-right">
          <div
            className={`text-sm font-medium ${
              transaction.type === "deposit"
                ? "text-green-600"
                : transaction.type === "allocation"
                ? "text-gray-600"
                : "text-red-600"
            }`}
          >
            {transaction.type === "deposit"
              ? "+"
              : transaction.type === "allocation"
              ? ""
              : "-"}
            {formatCurrency(Math.abs(transaction.amount))}
          </div>
          <div className="text-sm text-gray-500">
            Balance: {formatCurrency(transaction.balanceAfter)}
          </div>
        </div>
      ),
    },
  ];

  // Fetch transaction history
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getWalletTransactions(filters);
      const fetchedTransactions = data.data.transactions || [];
      setAllTransactions(fetchedTransactions);
      setFilteredTransactions(fetchedTransactions);
      setPagination(data.data.pagination || {});
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Error fetching transaction history");
    } finally {
      setLoading(false);
    }
  };

  // Fetch financial reports data
  const fetchReportsData = async (periodOverride) => {
    try {
      setLoading(true);
      const buildQueryParams = (periodDays) => {
        const key = String(periodDays);
        const mapping = {
          7: "7d",
          30: "30d",
          90: "90d",
          180: "180d",
          365: "1y",
          730: "2y",
          1825: "5y",
          3650: "10y",
          7300: "20y",
        };
        if (mapping[key]) {
          return { dateRange: mapping[periodDays], groupBy: "month" };
        }
        const days = parseInt(key || "365", 10);
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          groupBy: "month",
        };
      };

      const effectivePeriod = periodOverride ?? selectedPeriod;
      const response = await getFinancialReportsData({
        ...buildQueryParams(effectivePeriod),
        moduleFilter: "all",
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

  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);
    if (activeTab === "reports") {
      setReportsData(null);
      fetchReportsData(value);
    }
  };

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    } else if (activeTab === "reports") {
      fetchReportsData();
    }
  }, [filters, activeTab, selectedPeriod]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTransactions(allTransactions);
      return;
    }

    const filtered = allTransactions.filter((transaction) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.reference?.toLowerCase().includes(searchLower) ||
        transaction.referenceType?.toLowerCase().includes(searchLower) ||
        transaction.type?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredTransactions(filtered);
  }, [searchTerm, allTransactions]);

  const monthlyTrendsData =
    reportsData?.monthlyTrends || reportsData?.monthlyBreakdown || [];

  const budgetBreakdownData = React.useMemo(() => {
    if (Array.isArray(reportsData?.budgetBreakdown)) {
      return reportsData.budgetBreakdown;
    }
    const ba = reportsData?.budgetAllocationData;
    if (!ba) return [];
    return [
      {
        category: "payroll",
        allocated: ba?.payroll?.allocated || 0,
        utilizationPercentage: ba?.payroll?.utilization || 0,
      },
      {
        category: "operational",
        allocated: ba?.operational?.allocated || 0,
        utilizationPercentage: ba?.operational?.utilization || 0,
      },
      {
        category: "projects",
        allocated: ba?.projects?.allocated || 0,
        utilizationPercentage: ba?.projects?.utilization || 0,
      },
    ];
  }, [reportsData]);

  const categoryUtilizationData = React.useMemo(() => {
    const cud = reportsData?.fundUtilizationData?.categoryUtilization;
    if (Array.isArray(cud) && cud.length) return cud;
    return budgetBreakdownData.map((b) => ({
      category: b.category,
      utilization: b.utilizationPercentage || 0,
    }));
  }, [reportsData, budgetBreakdownData]);

  const currentAllocatedTotal = React.useMemo(() => {
    const ba = reportsData?.budgetAllocationData;
    if (!ba) return 0;
    return (
      (ba.payroll?.allocated || 0) +
      (ba.operational?.allocated || 0) +
      (ba.projects?.allocated || 0)
    );
  }, [reportsData]);

  const handleExportPDF = async () => {
    try {
      setExportLoading((prev) => ({ ...prev, pdf: true }));
      await exportTransactionHistoryPDF(filters);
      toast.success("PDF report exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF report");
    } finally {
      setExportLoading((prev) => ({ ...prev, pdf: false }));
    }
  };

  const handleExportWord = async () => {
    try {
      setExportLoading((prev) => ({ ...prev, word: true }));
      await exportTransactionHistoryWord(filters);
      toast.success("Word report exported successfully!");
    } catch (error) {
      console.error("Error exporting Word report:", error);
      toast.error("Failed to export Word report");
    } finally {
      setExportLoading((prev) => ({ ...prev, word: false }));
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading((prev) => ({ ...prev, csv: true }));
      await exportTransactionHistoryCSV(filters);
      toast.success("CSV report exported successfully!");
    } catch (error) {
      console.error("Error exporting CSV report:", error);
      toast.error("Failed to export CSV report");
    } finally {
      setExportLoading((prev) => ({ ...prev, csv: false }));
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />;
      case "withdrawal":
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />;
      case "allocation":
        return <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />;
      case "approval":
        return <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />;
      case "rejection":
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "deposit":
        return "bg-green-100";
      case "withdrawal":
        return "bg-red-100";
      case "allocation":
        return "bg-blue-100";
      case "approval":
        return "bg-purple-100";
      case "rejection":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 20,
    });
    setSearchTerm("");
    setFilteredTransactions(allTransactions);
  };

  if (loading && filteredTransactions.length === 0) {
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
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Transaction History & Financial Reports
              </h1>
              <p className="text-gray-600">
                Comprehensive transaction history and financial analytics
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "transactions"
                  ? "bg-white text-[var(--elra-primary)] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Transaction History
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "reports"
                  ? "bg-white text-[var(--elra-primary)] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Financial Reports
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === "transactions" ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Transactions
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by description, reference, type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="allocation">Allocation</option>
                  <option value="approval">Approval</option>
                  <option value="rejection">Rejection</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Period Selector for Reports */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Report Period:
              </span>
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent bg-white"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 6 months</option>
                <option value="365">Last year</option>
                <option value="730">Last 2 years</option>
                <option value="1095">Last 3 years</option>
                <option value="1825">Last 5 years</option>
                <option value="3650">Last 10 years</option>
                <option value="7300">Last 20 years</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 italic">
              Export functionality available in Transaction History tab
            </div>
          </div>
        </>
      )}

      {/* Conditional Content Based on Active Tab */}
      {activeTab === "transactions" ? (
        <>
          {/* Transactions List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transactions ({filteredTransactions.length})
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportPDF}
                    disabled={
                      exportLoading.pdf || filteredTransactions.length === 0
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Export as PDF"
                  >
                    {exportLoading.pdf ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span>
                      {exportLoading.pdf ? "Exporting..." : "Export PDF"}
                    </span>
                  </button>
                  <button
                    onClick={handleExportWord}
                    disabled={
                      exportLoading.word || filteredTransactions.length === 0
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Export as Word/HTML"
                  >
                    {exportLoading.word ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span>
                      {exportLoading.word ? "Exporting..." : "Export Word"}
                    </span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={
                      exportLoading.csv || filteredTransactions.length === 0
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Export as CSV"
                  >
                    {exportLoading.csv ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span>
                      {exportLoading.csv ? "Exporting..." : "Export CSV"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <DataTable
              data={filteredTransactions}
              columns={transactionColumns}
              loading={loading}
              actions={{
                showEdit: false,
                showDelete: false,
                showToggle: false,
              }}
            />
          </div>
        </>
      ) : (
        <>
          {/* Financial Reports Content */}
          {loading && !reportsData ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
            </div>
          ) : !reportsData ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load reports data</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                        Total Transactions
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                        {reportsData.summary?.totalTransactions || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <DocumentTextIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
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
                      <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border border-red-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                        Total Expenses
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-red-900 mt-2 break-all leading-tight">
                        {formatCurrency(
                          reportsData.summary?.totalExpenses || 0
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                      <ArrowTrendingDownIcon className="h-8 w-8 text-white" />
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
                        Net Profit
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                        {formatCurrency(reportsData.summary?.netProfit || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                      <CurrencyDollarIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border border-yellow-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                        Budget Utilization
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-900 mt-2 break-all leading-tight">
                        {(reportsData.summary?.budgetUtilization || 0).toFixed(
                          1
                        )}
                        %
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                      <ChartBarIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Fund Flow KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-lg border border-cyan-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-cyan-700 uppercase tracking-wide">
                        Funds Added
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-cyan-900 mt-2 break-all leading-tight">
                        {formatCurrency(
                          reportsData.summary?.totalFundsAdded || 0
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg">
                      <ArrowUpIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg border border-indigo-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
                        Funds Allocated
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-indigo-900 mt-2 break-all leading-tight">
                        {formatCurrency(currentAllocatedTotal)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                      <ChartBarIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-lg border border-emerald-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                        Funds Used
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-2 break-all leading-tight">
                        {formatCurrency(
                          reportsData.summary?.totalFundsUsed || 0
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                      <CheckCircleIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg border border-amber-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                        Funds Reserved
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-2 break-all leading-tight">
                        {formatCurrency(
                          reportsData.summary?.totalFundsReserved || 0
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                      <ClockIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl shadow-lg border border-violet-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-violet-700 uppercase tracking-wide">
                        Flow Efficiency
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-violet-900 mt-2 break-all leading-tight">
                        {(reportsData.summary?.fundFlowEfficiency || 0).toFixed(
                          1
                        )}
                        %
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg">
                      <ChartBarIcon className="h-8 w-8 text-white" />
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
                    Monthly Financial Trends
                  </h3>
                  <LineChart
                    data={{
                      labels: (monthlyTrendsData || []).map((d) => d.month),
                      datasets: [
                        {
                          label: "Revenue",
                          data: (monthlyTrendsData || []).map(
                            (d) => d.revenue || 0
                          ),
                          borderColor: "#10B981",
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                        },
                        {
                          label: "Expenses",
                          data: (monthlyTrendsData || []).map(
                            (d) => d.expenses || 0
                          ),
                          borderColor: "#EF4444",
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                        },
                        {
                          label: "Net Profit",
                          data: (monthlyTrendsData || []).map(
                            (d) => d.netProfit || 0
                          ),
                          borderColor: "#8B5CF6",
                          backgroundColor: "rgba(139, 92, 246, 0.12)",
                        },
                      ],
                    }}
                    title="Financial Performance Trends"
                    height={320}
                    showArea={true}
                  />
                </motion.div>
              </div>

              {/* Budget Category Breakdown - two charts side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Budget Category Distribution
                  </h3>
                  <PieChart
                    data={{
                      labels: (budgetBreakdownData || []).map(
                        (d) => d.category
                      ),
                      datasets: [
                        {
                          data: (budgetBreakdownData || []).map(
                            (d) => d.allocated
                          ),
                        },
                      ],
                    }}
                    title="Budget Allocation"
                    height={300}
                    colors={[
                      "#3B82F6",
                      "#10B981",
                      "#F59E0B",
                      "#EF4444",
                      "#8B5CF6",
                    ]}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Budget Utilization by Category
                  </h3>
                  <BarChart
                    data={{
                      labels: (categoryUtilizationData || []).map(
                        (d) => d.category
                      ),
                      datasets: [
                        {
                          label: "Utilization %",
                          data: (categoryUtilizationData || []).map(
                            (d) => d.utilization || 0
                          ),
                        },
                      ],
                    }}
                    title="Budget Utilization"
                    height={300}
                    colors={["#8B5CF6"]}
                  />
                </motion.div>
              </div>

              {/* Fund Flow Breakdown Chart */}
              <div className="grid grid-cols-1 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Fund Flow Lifecycle
                  </h3>
                  <BarChart
                    data={{
                      labels: [
                        "Funds Added",
                        "Funds Allocated",
                        "Funds Used",
                        "Funds Reserved",
                        "Funds Rejected",
                      ],
                      datasets: [
                        {
                          label: "Amount ($)",
                          data: [
                            reportsData.summary?.totalFundsAdded || 0,
                            reportsData.summary?.totalFundsAllocated || 0,
                            reportsData.summary?.totalFundsUsed || 0,
                            reportsData.summary?.totalFundsReserved || 0,
                            reportsData.summary?.totalFundsRejected || 0,
                          ],
                        },
                      ],
                    }}
                    title="Complete Fund Flow Tracking"
                    height={300}
                    colors={[
                      "#3B82F6",
                      "#8B5CF6",
                      "#10B981",
                      "#F59E0B",
                      "#EF4444",
                    ]}
                  />
                </motion.div>
              </div>

              {/* Profit/Loss Analysis Chart */}
              <div className="grid grid-cols-1 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Profit/Loss Analysis by Period
                  </h3>
                  <BarChart
                    data={{
                      labels: ["Revenue", "Expenses", "Net Profit"],
                      datasets: [
                        {
                          label: "Amount (₦)",
                          data: [
                            reportsData.summary?.totalRevenue || 0,
                            reportsData.summary?.totalExpenses || 0,
                            reportsData.summary?.netProfit || 0,
                          ],
                        },
                      ],
                    }}
                    title="Financial Performance Breakdown"
                    height={300}
                    colors={["#10B981", "#EF4444", "#8B5CF6"]}
                  />
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Period: {selectedPeriod}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          (reportsData.summary?.netProfit || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(reportsData.summary?.netProfit || 0) >= 0
                          ? "✅ Profitable Period"
                          : "⚠️ Loss Period"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Budget Utilization Trends */}
              <div className="grid grid-cols-1 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Budget Utilization Trends
                  </h3>
                  <LineChart
                    data={{
                      labels: ["Payroll", "Operational", "Projects", "Overall"],
                      datasets: [
                        {
                          label: "Utilization %",
                          data: [
                            reportsData.fundUtilizationData?.categoryUtilization?.find(
                              (c) => c.category === "payroll"
                            )?.utilization || 0,
                            reportsData.fundUtilizationData?.categoryUtilization?.find(
                              (c) => c.category === "operational"
                            )?.utilization || 0,
                            reportsData.fundUtilizationData?.categoryUtilization?.find(
                              (c) => c.category === "projects"
                            )?.utilization || 0,
                            reportsData.fundUtilizationData
                              ?.overallUtilization || 0,
                          ],
                          borderColor: "#8B5CF6",
                          backgroundColor: "rgba(139, 92, 246, 0.12)",
                        },
                      ],
                    }}
                    title="Budget Category Utilization"
                    height={300}
                    showArea={true}
                  />
                </motion.div>
              </div>

              {/* Detailed Budget Category Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Payroll Budget
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Allocated
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.payroll
                            ?.allocated || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Used
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.payroll?.used || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Available
                      </span>
                      <span className="text-lg font-bold text-gray-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.payroll
                            ?.available || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            reportsData.budgetAllocationData?.payroll
                              ?.utilization || 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {(
                          reportsData.budgetAllocationData?.payroll
                            ?.utilization || 0
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Operational Budget
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Allocated
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.operational
                            ?.allocated || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Used
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.operational?.used ||
                          0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Available
                      </span>
                      <span className="text-lg font-bold text-gray-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.operational
                            ?.available || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            reportsData.budgetAllocationData?.operational
                              ?.utilization || 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-green-600">
                        {(
                          reportsData.budgetAllocationData?.operational
                            ?.utilization || 0
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Projects Budget
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Allocated
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.projects
                            ?.allocated || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Used
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.projects?.used || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Available
                      </span>
                      <span className="text-lg font-bold text-gray-600">
                        ₦
                        {(
                          reportsData.budgetAllocationData?.projects
                            ?.available || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{
                          width: `${
                            reportsData.budgetAllocationData?.projects
                              ?.utilization || 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-yellow-600">
                        {(
                          reportsData.budgetAllocationData?.projects
                            ?.utilization || 0
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Financial Alerts */}
              {reportsData.alerts && reportsData.alerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Financial Alerts
                  </h3>
                  <div className="space-y-4">
                    {reportsData.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          alert.type === "critical"
                            ? "bg-red-50 border border-red-200"
                            : alert.type === "warning"
                            ? "bg-yellow-50 border border-yellow-200"
                            : "bg-blue-50 border border-blue-200"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`p-2 rounded-lg ${
                              alert.type === "critical"
                                ? "bg-red-100 text-red-600"
                                : alert.type === "warning"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {alert.type === "critical" ? (
                              <ExclamationTriangleIcon className="h-5 w-5" />
                            ) : alert.type === "warning" ? (
                              <ExclamationTriangleIcon className="h-5 w-5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {alert.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(alert.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </>
      )}

      {/* Pagination - Only for Transactions Tab */}
      {activeTab === "transactions" && pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced KPI Dashboard - Only show for reports tab */}
      {activeTab === "reports" && reportsData && (
        <div className="grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Advanced Financial KPIs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                      Flow Efficiency
                    </p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {(reportsData.summary?.fundFlowEfficiency || 0).toFixed(
                        1
                      )}
                      %
                    </p>
                  </div>
                  <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                      Budget Health
                    </p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {(
                        reportsData.fundUtilizationData?.overallUtilization || 0
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                      Revenue Growth
                    </p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {(
                        ((reportsData.summary?.totalRevenue || 0) /
                          (reportsData.summary?.totalFundsAdded || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                      Expense Ratio
                    </p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      {(
                        ((reportsData.summary?.totalExpenses || 0) /
                          (reportsData.summary?.totalRevenue || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <ArrowTrendingDownIcon className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryAndReports;
