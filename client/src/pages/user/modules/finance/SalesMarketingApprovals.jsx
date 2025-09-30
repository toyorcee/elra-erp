import React, { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarDaysIcon,
  EyeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import DataTable from "../../../../components/common/DataTable";
import {
  getSalesMarketingApprovals,
  getSalesMarketingApprovalHistory,
  approveSalesMarketingTransaction,
  rejectSalesMarketingTransaction,
  getELRAWallet,
} from "../../../../services/financeAPI";

const SalesMarketingApprovals = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmComments, setConfirmComments] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [walletBalance, setWalletBalance] = useState({
    available: 0,
    allocated: 0,
    used: 0,
    reserved: 0,
  });

  useEffect(() => {
    fetchPendingApprovals();
    fetchApprovalHistory();
    fetchELRABudget();
  }, []);

  const fetchELRABudget = async () => {
    try {
      const response = await getELRAWallet();
      if (response.success) {
        const budgetCategories =
          response.data?.financialSummary?.budgetCategories;
        if (budgetCategories?.operational) {
          setWalletBalance({
            available: budgetCategories.operational.available || 0,
            allocated: budgetCategories.operational.allocated || 0,
            used: budgetCategories.operational.used || 0,
            reserved: budgetCategories.operational.reserved || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching ELRA wallet budget:", error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await getSalesMarketingApprovals();
      if (response.success) {
        setPendingApprovals(response.data || []);
      } else {
        toast.error("Failed to fetch pending approvals");
      }
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      toast.error("Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await getSalesMarketingApprovalHistory();
      if (response.success) {
        setApprovalHistory(response.data || []);
      } else {
        toast.error("Failed to fetch approval history");
      }
    } catch (error) {
      console.error("Error fetching approval history:", error);
      toast.error("Failed to fetch approval history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedApproval(transaction);
    setShowModal(true);
  };

  const handleApproval = (approval, action) => {
    setSelectedApproval(approval);
    setConfirmAction(action);
    setConfirmComments("");
    setShowConfirmModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedApproval || !confirmAction) return;

    try {
      setActionLoading(true);
      let response;

      if (confirmAction === "approve") {
        response = await approveSalesMarketingTransaction(
          selectedApproval._id,
          {
            comments: confirmComments,
          }
        );
      } else {
        response = await rejectSalesMarketingTransaction(selectedApproval._id, {
          comments: confirmComments,
        });
      }

      if (response.success) {
        toast.success(
          `Transaction ${
            confirmAction === "approve" ? "approved" : "rejected"
          } successfully`
        );
        setShowConfirmModal(false);
        setShowModal(false);
        // Refresh both pending approvals and approval history
        fetchPendingApprovals();
        fetchApprovalHistory();
      } else {
        toast.error(response.message || "Failed to process transaction");
      }
    } catch (error) {
      console.error(`Error ${confirmAction}ing transaction:`, error);
      toast.error(`Failed to ${confirmAction} transaction`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: ClockIcon,
        color: "amber",
        bgColor: "bg-amber-100",
        textColor: "text-amber-800",
        label: "Pending",
      },
      approved: {
        icon: CheckCircleIcon,
        color: "green",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        label: "Approved",
      },
      rejected: {
        icon: XCircleIcon,
        color: "red",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const isRevenue = type === "revenue";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          isRevenue ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isRevenue ? "Revenue" : "Expense"}
      </span>
    );
  };

  const columns = [
    {
      header: "Reference",
      accessor: "reference",
      renderer: (transaction) => (
        <div className="flex items-center min-w-0 max-w-[200px]">
          <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div
              className="font-mono text-sm text-gray-900 cursor-help break-words"
              title={transaction.reference}
            >
              {transaction.reference}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(transaction.requestedAt)}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      renderer: (transaction) => getTypeBadge(transaction.type),
    },
    {
      header: "Description",
      accessor: "title",
      renderer: (transaction) => (
        <div className="max-w-xs">
          <div
            className="font-medium text-gray-900 break-words"
            title={transaction.title}
          >
            {transaction.title}
          </div>
          <div
            className="text-sm text-gray-500 break-words"
            title={transaction.description}
          >
            {transaction.description}
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      renderer: (transaction) => (
        <span className="text-sm text-gray-700">
          {transaction.category
            ?.replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      renderer: (transaction) => (
        <span className="font-medium text-gray-900 break-words">
          {formatCurrency(transaction.amount)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (transaction) => getStatusBadge(transaction.status),
    },
    ...(activeTab === "history"
      ? [
          {
            header: "Approved/Rejected By",
            accessor: "approvedBy",
            renderer: (transaction) => (
              <div className="text-sm text-gray-700">
                {transaction.approvedBy ? (
                  <div>
                    <div className="font-medium">
                      {transaction.approvedBy.firstName}{" "}
                      {transaction.approvedBy.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.approvedBy.role?.name || "Finance"}
                    </div>
                    {transaction.approvedAt && (
                      <div className="text-xs text-gray-500">
                        {formatDate(transaction.approvedAt)}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      key: "actions",
      label: "Actions",
      render: (transaction) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedApproval(transaction);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={() => handleApproval(transaction, "approve")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            onClick={() => handleApproval(transaction, "reject")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <XCircleIcon className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Modern Header */}
      <div className="mb-8 relative">
        <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                  <BanknotesIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    Sales & Marketing Approvals
                  </h1>
                  <p className="text-white/90 mt-2 text-lg">
                    Review and approve pending Sales & Marketing transactions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    fetchPendingApprovals();
                    fetchApprovalHistory();
                  }}
                  disabled={loading || historyLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 disabled:opacity-50 border border-white/20"
                >
                  <ArrowPathIcon
                    className={`w-5 h-5 ${
                      loading || historyLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh Data
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Sales & Marketing Approval Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Available Operations Budget Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <CurrencyDollarIcon className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                    Available Operations Budget
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(walletBalance.available)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ready for Sales & Marketing
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </motion.div>

          {/* Pending Approvals Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                  <ClockIcon className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                    Pending Approvals
                  </p>
                  <p className="text-3xl font-bold text-amber-900">
                    {pendingApprovals.length}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Awaiting Finance Review
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>

          {/* Pending Expense Transactions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                  <ExclamationTriangleIcon className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                    Pending Expense Transactions
                  </p>
                  <p className="text-3xl font-bold text-red-900">
                    {
                      pendingApprovals.filter((t) => t.type === "expense")
                        .length
                    }
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Awaiting Finance Approval
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>

          {/* Total Pending Amount Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <CheckBadgeIcon className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                    Total Pending Amount
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-900 break-words">
                    {formatCurrency(
                      pendingApprovals.reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    All Pending Transactions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sales & Marketing Finance Allocation Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl shadow-lg p-6 mb-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Sales & Marketing Finance Allocation Tracking
              </h2>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg border border-white/20">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
                <p className="text-sm font-bold text-white mb-1">
                  Available Operations Budget
                </p>
                <p className="text-2xl font-black text-white">
                  {formatCurrency(walletBalance.available)}
                </p>
                <p className="text-xs text-white/80 mt-1">
                  Ready for Sales & Marketing
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
                <p className="text-sm font-bold text-white mb-1">
                  Total Operational Budget
                </p>
                <p className="text-2xl font-black text-white">
                  {formatCurrency(walletBalance.allocated)}
                </p>
                <p className="text-xs text-white/80 mt-1">
                  Allocated to Operations
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
                <p className="text-sm font-bold text-white mb-1">Used Budget</p>
                <p className="text-2xl font-black text-white">
                  {formatCurrency(walletBalance.used)}
                </p>
                <p className="text-xs text-white/80 mt-1">
                  Processed Transactions
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
                <p className="text-sm font-bold text-white mb-1">
                  Pending Transaction Amount
                </p>
                <p className="text-2xl font-black text-white">
                  {formatCurrency(
                    pendingApprovals.reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
                <p className="text-xs text-white/80 mt-1">Awaiting Approval</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <motion.div
                className={`flex-1 py-4 px-6 border-b-2 font-medium text-sm cursor-pointer transition-all duration-200 ${
                  activeTab === "pending"
                    ? "border-[var(--elra-primary)] text-[var(--elra-primary)] bg-[var(--elra-primary)]/5"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab("pending");
                  if (pendingApprovals.length === 0) {
                    fetchPendingApprovals();
                  }
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>Pending Approvals</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      activeTab === "pending"
                        ? "bg-[var(--elra-primary)] text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {pendingApprovals.length}
                  </span>
                </div>
              </motion.div>
              <motion.div
                className={`flex-1 py-4 px-6 border-b-2 font-medium text-sm cursor-pointer transition-all duration-200 ${
                  activeTab === "history"
                    ? "border-[var(--elra-primary)] text-[var(--elra-primary)] bg-[var(--elra-primary)]/5"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab("history");
                  if (approvalHistory.length === 0) {
                    fetchApprovalHistory();
                  }
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Approval History</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      activeTab === "history"
                        ? "bg-[var(--elra-primary)] text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {approvalHistory.length}
                  </span>
                </div>
              </motion.div>
            </nav>
          </div>
        </motion.div>

        {/* Approvals Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <DataTable
            data={activeTab === "pending" ? pendingApprovals : approvalHistory}
            columns={
              activeTab === "pending"
                ? columns
                : columns.filter((col) => col.key !== "actions")
            }
            loading={activeTab === "pending" ? loading : historyLoading}
            onRowClick={(transaction) => handleViewDetails(transaction)}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
              customActions:
                activeTab === "pending"
                  ? (transaction) => (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(transaction);
                          }}
                          title="View Transaction Details"
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(transaction, "approve");
                          }}
                          disabled={actionLoading}
                          title="Approve Transaction"
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5" />
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(transaction, "reject");
                          }}
                          disabled={actionLoading}
                          title="Reject Transaction"
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          ) : (
                            <XCircleIcon className="w-5 h-5" />
                          )}
                        </motion.button>
                      </div>
                    )
                  : (transaction) => (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(transaction);
                          }}
                          title="View Transaction Details"
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    ),
            }}
            searchable={true}
            sortable={true}
            pagination={true}
            itemsPerPage={10}
            emptyState={{
              icon: <DocumentTextIcon className="h-12 w-12 text-gray-400" />,
              title:
                activeTab === "pending"
                  ? "No pending approvals found"
                  : "No approval history found",
              description:
                activeTab === "pending"
                  ? "There are no Sales & Marketing approval requests at this time."
                  : "No previously approved or rejected transactions found.",
            }}
          />
        </motion.div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {showModal && selectedApproval && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                        <DocumentTextIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">
                          Transaction Details
                        </h3>
                        <p className="text-white/90 text-sm">
                          Review transaction information and approval status
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowModal(false)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200"
                    >
                      <XMarkIcon className="w-6 h-6 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Key Information Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                          <DocumentTextIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-blue-800">
                            Reference
                          </h4>
                        </div>
                      </div>
                      <div className="font-mono text-sm text-blue-900 bg-white/50 p-3 rounded-lg">
                        {selectedApproval.reference}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <CurrencyDollarIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-green-800">
                            Amount
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span
                          className={
                            selectedApproval.type === "revenue"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {selectedApproval.type === "revenue" ? "+" : "-"}
                        </span>
                        <span className="text-3xl font-bold text-green-900">
                          {formatCurrency(selectedApproval.amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Transaction Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <div className="flex items-center">
                          {getTypeBadge(selectedApproval.type)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="flex items-center">
                          {getStatusBadge(selectedApproval.status)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <div className="text-gray-600">
                          {selectedApproval.category
                            ?.replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Budget Category
                        </label>
                        <div className="text-gray-600">
                          {selectedApproval.budgetCategory
                            ?.replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requested At
                        </label>
                        <div className="text-gray-600">
                          {formatDate(selectedApproval.requestedAt)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Module
                        </label>
                        <div className="text-gray-600">
                          {selectedApproval.module
                            ?.replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Transaction Details
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <div className="text-gray-900 font-medium text-lg">
                          {selectedApproval.title}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                          {selectedApproval.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Information */}
                  {(selectedApproval.approvedBy ||
                    selectedApproval.approvedAt ||
                    selectedApproval.approvalComments) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Approval Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedApproval.approvedBy && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Approved/Rejected By
                            </label>
                            <div className="text-gray-600">
                              {selectedApproval.approvedBy.firstName}{" "}
                              {selectedApproval.approvedBy.lastName}
                              <span className="text-gray-500 ml-2">
                                (
                                {selectedApproval.approvedBy.role?.name ||
                                  "Finance"}
                                )
                              </span>
                            </div>
                          </div>
                        )}
                        {selectedApproval.approvedAt && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {selectedApproval.status === "approved"
                                ? "Approved"
                                : "Rejected"}{" "}
                              At
                            </label>
                            <div className="text-gray-600">
                              {formatDate(selectedApproval.approvedAt)}
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedApproval.approvalComments && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Approval Comments
                          </label>
                          <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                            {selectedApproval.approvalComments}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex-shrink-0 p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(false)}
                    className="px-8 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-all duration-200 cursor-pointer"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedApproval && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className={`p-6 text-white relative overflow-hidden ${
                  confirmAction === "approve"
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                        {confirmAction === "approve" ? (
                          <CheckCircleIcon className="w-6 h-6 text-white" />
                        ) : (
                          <XCircleIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {confirmAction === "approve"
                            ? "Approve Transaction"
                            : "Reject Transaction"}
                        </h3>
                        <p className="text-white/90 text-sm">
                          Confirm your decision for this transaction
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowConfirmModal(false)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200"
                    >
                      <XMarkIcon className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Are you sure you want to {confirmAction} this transaction?
                  </p>
                </div>

                {/* Transaction Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Transaction Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-mono text-gray-900">
                        {selectedApproval.reference}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(selectedApproval.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedApproval.type === "revenue"
                          ? "Revenue"
                          : "Expense"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={confirmComments}
                    onChange={(e) => setConfirmComments(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent transition-all duration-200"
                    placeholder={`Add comments for ${confirmAction} (optional)...`}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Comments are optional but recommended for audit trail
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConfirmModal(false)}
                    disabled={actionLoading}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmApproval}
                    disabled={actionLoading}
                    className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl transition-all duration-200 disabled:opacity-50 font-medium ${
                      confirmAction === "approve"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {actionLoading ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : confirmAction === "approve" ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      <XCircleIcon className="w-4 h-4" />
                    )}
                    {actionLoading
                      ? "Processing..."
                      : confirmAction === "approve"
                      ? "Approve"
                      : "Reject"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesMarketingApprovals;
