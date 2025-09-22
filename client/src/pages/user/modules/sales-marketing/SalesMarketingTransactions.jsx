import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import {
  formatCurrency,
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../../../../utils/formatters";
import AnimatedBubbles from "../../../../components/ui/AnimatedBubbles";
import ELRALogo from "../../../../components/ELRALogo";
import {
  getSalesMarketingTransactions,
  createSalesMarketingTransaction,
} from "../../../../services/salesMarketingAPI";
import {
  getCategories,
  getAllCategories,
  DEPARTMENT_CONFIG,
} from "../../../../constants/salesMarketingCategories";

const SalesMarketingTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("sales");
  const [transactionData, setTransactionData] = useState({
    type: "expense",
    title: "",
    description: "",
    amount: "",
    category: "",
    budgetCategory: "operational",
  });
  const [customCategory, setCustomCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getSalesMarketingTransactions();

      if (response.success) {
        setTransactions(response.data || []);
        setFilteredTransactions(response.data || []);
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

  // Real-time search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = transactions.filter(
      (t) =>
        t.reference?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.title?.toLowerCase().includes(searchLower) ||
        t.type?.toLowerCase().includes(searchLower) ||
        (t.type === "deposit" && "revenue".includes(searchLower)) ||
        (t.type === "withdrawal" && "expense".includes(searchLower)) ||
        t.category?.toLowerCase().includes(searchLower) ||
        t.status?.toLowerCase().includes(searchLower)
    );
    setFilteredTransactions(filtered);
  }, [searchTerm, transactions]);

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (
      !transactionData.title ||
      !transactionData.amount ||
      !transactionData.category
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (transactionData.category === "other" && !customCategory.trim()) {
      toast.error("Please enter a custom category name");
      return;
    }

    try {
      setCreating(true);
      setShowBubbles(true);

      const response = await createSalesMarketingTransaction({
        ...transactionData,
        module: selectedDepartment,
        amount: transactionData.amount,
        category:
          transactionData.category === "other"
            ? customCategory
            : transactionData.category,
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
        });
        setCustomCategory("");
        fetchTransactions();
      } else {
        toast.error(response.message || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);

      const errorMessage = error.response?.data?.message || error.message;

      if (errorMessage && errorMessage.includes("Insufficient funds")) {
        toast.error(
          "Insufficient funds in operational budget. Please contact the Finance HOD to add funds to the operational budget.",
          {
            autoClose: 8000,
            style: {
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
            },
          }
        );
      } else {
        toast.error(errorMessage || "Failed to create transaction");
      }
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

  const transactionColumns = [
    {
      header: "Reference",
      accessor: "reference",
      renderer: (transaction) => (
        <div className="font-mono text-sm text-gray-900">
          {transaction.reference}
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      renderer: (transaction) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            transaction.type === "deposit"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {transaction.type === "deposit" ? "revenue" : "expense"}
        </span>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      renderer: (transaction) => {
        const formatCategory = (category) => {
          return category
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        };

        return (
          <div>
            <div className="font-semibold text-gray-900">
              {transaction.description}
            </div>
            <div className="text-sm text-gray-500">
              Category: {formatCategory(transaction.category)}
            </div>
          </div>
        );
      },
    },
    {
      header: "Amount",
      accessor: "amount",
      renderer: (transaction) => (
        <div className="flex items-center space-x-1">
          <span
            className={`text-lg font-bold ${
              transaction.type === "deposit" ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.type === "deposit" ? "+" : "-"}
          </span>
          <span
            className={`font-semibold ${
              transaction.type === "deposit" ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (transaction) => getStatusBadge(transaction.status),
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
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Transactions
            </h3>
          </div>
          <div className="relative w-full max-w-xs">
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
        <DataTable
          data={filteredTransactions}
          columns={transactionColumns}
          loading={loading}
          searchable={false}
          pagination={true}
          pageSize={10}
          actions={{
            showEdit: false,
            showDelete: false,
          }}
        />
      </div>

      {/* Create Transaction Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
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
                <div className="flex items-center space-x-4">
                  {/* ELRA Logo */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <ELRALogo variant="dark" size="md" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Create New Transaction
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Add a new sales or marketing transaction
                    </p>
                  </div>
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
                  {/* Department Selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(DEPARTMENT_CONFIG).map(
                        ([key, config]) => (
                          <motion.button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedDepartment(key);
                              setTransactionData({
                                ...transactionData,
                                category: "", // Reset category when switching departments
                              });
                              setShowBubbles(true);
                              setTimeout(() => setShowBubbles(false), 2000);
                            }}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                              selectedDepartment === key
                                ? `border-[var(--elra-primary)] bg-[var(--elra-primary)]/10 shadow-lg`
                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{config.icon}</span>
                              <div className="text-left">
                                <div
                                  className={`font-semibold ${
                                    selectedDepartment === key
                                      ? "text-[var(--elra-primary)]"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {config.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {config.description}
                                </div>
                              </div>
                            </div>
                            {selectedDepartment === key && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2"
                              >
                                <SparklesIcon className="h-5 w-5 text-[var(--elra-primary)]" />
                              </motion.div>
                            )}
                          </motion.button>
                        )
                      )}
                    </div>
                  </motion.div>

                  {/* Transaction Type Selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Transaction Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-3">
                      <motion.button
                        type="button"
                        onClick={() =>
                          setTransactionData({
                            ...transactionData,
                            type: "revenue",
                            category: "",
                          })
                        }
                        className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                          transactionData.type === "revenue"
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <span>💰</span>
                          <span>Revenue</span>
                        </div>
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() =>
                          setTransactionData({
                            ...transactionData,
                            type: "expense",
                            category: "", // Reset category when switching types
                          })
                        }
                        className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                          transactionData.type === "expense"
                            ? "bg-red-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <span>💸</span>
                          <span>Expense</span>
                        </div>
                      </motion.button>
                    </div>
                    <motion.p
                      className="text-sm text-gray-500 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {transactionData.type === "revenue"
                        ? "✅ Revenue is auto-approved and adds to wallet immediately"
                        : "⏳ Expenses need Finance approval (Finance HOD or Super Admin can approve)"}
                    </motion.p>
                  </motion.div>

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

                  {/* Budget Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Budget Category
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 flex items-center space-x-2">
                      <span>🏢</span>
                      <span>Operational</span>
                      <span className="text-sm text-gray-500">
                        (Sales & Marketing transactions use operational budget)
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formatNumberWithCommas(transactionData.amount)}
                      onChange={(e) => {
                        const numericValue = parseFormattedNumber(
                          e.target.value
                        );
                        setTransactionData({
                          ...transactionData,
                          amount: numericValue,
                        });
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter amount (e.g., 1,000,000)"
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
                      <AnimatePresence mode="wait">
                        {getCategories(
                          selectedDepartment,
                          transactionData.type
                        ).map((category, index) => (
                          <motion.option
                            key={category.value}
                            value={category.value}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            {category.icon} {category.label}
                          </motion.option>
                        ))}
                      </AnimatePresence>
                    </select>
                  </div>

                  {/* Custom Category Input - Only show when "Other" is selected */}
                  <AnimatePresence>
                    {transactionData.category === "other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Custom Category Name{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={transactionData.category === "other"}
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                          placeholder="Enter custom category name (e.g., Property Maintenance)"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          This will be saved as the category for this
                          transaction
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleCreateTransaction}
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
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
