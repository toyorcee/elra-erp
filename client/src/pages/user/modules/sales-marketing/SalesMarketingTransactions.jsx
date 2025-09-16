import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import { formatCurrency } from "../../../../utils/formatters";
import AnimatedBubbles from "../../../../components/ui/AnimatedBubbles";
import {
  getSalesMarketingTransactions,
  createSalesMarketingTransaction,
  getSalesCategories,
  getMarketingCategories,
} from "../../../../services/salesMarketingAPI";

const SalesMarketingTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [transactionType, setTransactionType] = useState("sales");
  const [transactionData, setTransactionData] = useState({
    type: "expense",
    title: "",
    description: "",
    amount: "",
    category: "",
    budgetCategory: "operational",
    approvalLevel: "department",
    priority: "medium",
  });
  const [creating, setCreating] = useState(false);
  const [salesCategories, setSalesCategories] = useState([]);
  const [marketingCategories, setMarketingCategories] = useState([]);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getSalesMarketingTransactions();

      if (response.success) {
        setTransactions(response.data.transactions || []);
      } else {
        toast.error(response.message || "Failed to load transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Error loading transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const [salesResponse, marketingResponse] = await Promise.all([
        getSalesCategories(),
        getMarketingCategories(),
      ]);

      if (salesResponse.success) {
        setSalesCategories(salesResponse.data.categories || []);
      }
      if (marketingResponse.success) {
        setMarketingCategories(marketingResponse.data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!transactionData.title || !transactionData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setCreating(true);
      setShowBubbles(true);

      const response = await createSalesMarketingTransaction({
        ...transactionData,
        transactionType: transactionType,
        amount: parseFloat(transactionData.amount),
      });

      if (response.success) {
        toast.success("Transaction created successfully");
        setShowCreateModal(false);
        setTransactionData({
          type: "expense",
          title: "",
          description: "",
          amount: "",
          category: "",
          budgetCategory: "operational",
          approvalLevel: "department",
          priority: "medium",
        });
        fetchTransactions();
      } else {
        toast.error(response.message || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to create transaction");
    } finally {
      setCreating(false);
      setShowBubbles(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      processed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[status]}`}
      >
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityConfig[priority]}`}
      >
        {priority}
      </span>
    );
  };

  const transactionColumns = [
    {
      header: "Transaction ID",
      accessor: "transactionId",
      renderer: (transaction) => (
        <div className="font-mono text-sm text-gray-900">
          {transaction.transactionId}
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      renderer: (transaction) => (
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              transaction.type === "sales"
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            {transaction.type}
          </span>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              transaction.transactionType === "revenue"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {transaction.transactionType}
          </span>
        </div>
      ),
    },
    {
      header: "Title",
      accessor: "title",
      renderer: (transaction) => (
        <div>
          <div className="font-semibold text-gray-900">{transaction.title}</div>
          <div className="text-sm text-gray-500">{transaction.description}</div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      renderer: (transaction) => (
        <div
          className={`font-semibold ${
            transaction.transactionType === "revenue"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {transaction.transactionType === "revenue" ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (transaction) => getStatusBadge(transaction.status),
    },
    {
      header: "Priority",
      accessor: "priority",
      renderer: (transaction) => getPriorityBadge(transaction.priority),
    },
    {
      header: "Requested By",
      accessor: "requestedBy",
      renderer: (transaction) => (
        <div className="text-sm text-gray-900">{transaction.requestedBy}</div>
      ),
    },
    {
      header: "Date",
      accessor: "requestedAt",
      renderer: (transaction) => (
        <div className="text-sm text-gray-900">
          {new Date(transaction.requestedAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  // Categories are now fetched from API

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sales & Marketing Transactions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all sales and marketing financial transactions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Transaction</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <DataTable
          data={transactions}
          columns={transactionColumns}
          loading={loading}
          searchable={true}
          pagination={true}
          pageSize={10}
        />
      </div>

      {/* Create Transaction Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !creating && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Bubbles */}
              <AnimatedBubbles isVisible={showBubbles} variant="bubbles" />

              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create New Transaction
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Add a new sales or marketing transaction
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={handleCreateTransaction} className="space-y-6">
                  {/* Transaction Type Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setTransactionType("sales")}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                            transactionType === "sales"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Sales
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionType("marketing")}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                            transactionType === "marketing"
                              ? "bg-purple-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Marketing
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Transaction Type <span className="text-red-500">*</span>
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            setTransactionData({
                              ...transactionData,
                              type: "expense",
                            })
                          }
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                            transactionData.type === "expense"
                              ? "bg-red-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Expense
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTransactionData({
                              ...transactionData,
                              type: "revenue",
                            })
                          }
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                            transactionData.type === "revenue"
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Revenue
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionData.title}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter transaction title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={transactionData.description}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter transaction description"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={transactionData.amount}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          amount: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter amount"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={transactionData.category}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    >
                      <option value="">Select category</option>
                      {(transactionType === "sales"
                        ? salesCategories
                        : marketingCategories
                      ).map((category) => (
                        <option key={category} value={category}>
                          {category
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget Category (for expenses only) */}
                  {transactionData.type === "expense" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Budget Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={transactionData.budgetCategory}
                        onChange={(e) =>
                          setTransactionData({
                            ...transactionData,
                            budgetCategory: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        <option value="operational">Operational</option>
                        <option value="projects">Projects</option>
                      </select>
                    </div>
                  )}

                  {/* Approval Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Approval Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={transactionData.approvalLevel}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          approvalLevel: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    >
                      <option value="department">Department HOD</option>
                      <option value="finance">Finance HOD</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={transactionData.priority}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          priority: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleCreateTransaction}
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5" />
                      <span>Create Transaction</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesMarketingTransactions;
