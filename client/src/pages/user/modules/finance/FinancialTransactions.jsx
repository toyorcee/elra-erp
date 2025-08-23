import React, { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../../../services/financeAPI.js";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";

const FinancialTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState({
    transactionNumber: "",
    type: "income",
    amount: "",
    description: "",
    category: "",
    date: "",
    status: "completed",
    reference: "",
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
            You don't have permission to access Financial Transactions.
          </p>
        </div>
      </div>
    );
  }

  const transactionTypes = [
    { value: "all", label: "All Types" },
    { value: "income", label: "Income", color: "bg-green-100 text-green-800" },
    { value: "expense", label: "Expense", color: "bg-red-100 text-red-800" },
  ];

  const transactionStatuses = [
    { value: "all", label: "All Statuses" },
    {
      value: "completed",
      label: "Completed",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetchTransactions();
      if (response.success) {
        setTransactions(response.data);
      } else {
        toast.error("Failed to load transactions");
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Error loading transactions");
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const typeConfig = transactionTypes.find((t) => t.value === type);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          typeConfig?.color || "bg-gray-100 text-gray-800"
        }`}
      >
        {typeConfig?.label || type}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = transactionStatuses.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusConfig?.color || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  const columns = [
    {
      header: "Transaction",
      accessor: "transactionNumber",
      cell: (transaction) => (
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <div className="font-medium text-gray-900">
              {transaction.transactionNumber}
            </div>
            <div className="text-sm text-gray-500">
              {transaction.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      cell: (transaction) => getTypeBadge(transaction.type),
    },
    {
      header: "Amount",
      accessor: "amount",
      cell: (transaction) => (
        <div className="flex items-center">
          {transaction.type === "income" ? (
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span
            className={`text-sm font-medium ${
              transaction.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            ₦{new Intl.NumberFormat().format(transaction.amount || 0)}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (transaction) => getStatusBadge(transaction.status),
    },
    {
      header: "Date",
      accessor: "date",
      cell: (transaction) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">
            {new Date(transaction.date).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (transaction) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedTransaction(transaction);
              setFormData({
                transactionNumber: transaction.transactionNumber,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description,
                category: transaction.category,
                date: transaction.date.split("T")[0],
                status: transaction.status,
                reference: transaction.reference,
              });
              setShowEditModal(true);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit Transaction"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteTransaction(transaction._id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete Transaction"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const response = await deleteTransaction(transactionId);
      if (response.success) {
        toast.success("Transaction deleted successfully");
        loadTransactions();
      } else {
        toast.error(response.message || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Error deleting transaction");
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
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Financial Transactions
            </h1>
            <p className="text-gray-600">
              Manage all financial transactions and records
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                {transactionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable
            data={transactions}
            columns={columns}
            searchTerm={searchTerm}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialTransactions;
