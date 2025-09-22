import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import {
  getWalletTransactions,
  exportTransactionHistoryPDF,
  exportTransactionHistoryWord,
  exportTransactionHistoryCSV,
} from "../../../../services/financeAPI";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

const TransactionHistoryAndReports = () => {
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
      renderer: (transaction) => (
        <div>
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

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  // Real-time search for transactions
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

  // Export functions
  const handleExportPDF = async () => {
    try {
      setLoading(true);
      await exportTransactionHistoryPDF(filters);
      toast.success("PDF report exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setLoading(true);
      await exportTransactionHistoryWord(filters);
      toast.success("Word report exported successfully!");
    } catch (error) {
      console.error("Error exporting Word report:", error);
      toast.error("Failed to export Word report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      await exportTransactionHistoryCSV(filters);
      toast.success("CSV report exported successfully!");
    } catch (error) {
      console.error("Error exporting CSV report:", error);
      toast.error("Failed to export CSV report");
    } finally {
      setLoading(false);
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
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[var(--elra-primary)] bg-opacity-10 rounded-lg">
            <ClockIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Transaction History & Reports
            </h1>
            <p className="text-gray-600">
              Detailed transaction history and audit trail
            </p>
          </div>
        </div>
      </div>

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
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
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
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
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
                disabled={loading || filteredTransactions.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Export as PDF"
              >
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
                <span>Export PDF</span>
              </button>
              <button
                onClick={handleExportWord}
                disabled={loading || filteredTransactions.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Export as Word/HTML"
              >
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
                <span>Export Word</span>
              </button>
              <button
                onClick={handleExportCSV}
                disabled={loading || filteredTransactions.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Export as CSV"
              >
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
                <span>Export CSV</span>
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
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
    </div>
  );
};

export default TransactionHistoryAndReports;
