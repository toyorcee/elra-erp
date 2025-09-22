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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Sales & Marketing Approvals
                </h1>
                <p className="mt-2 text-slate-600">
                  Review and approve pending Sales & Marketing transactions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    fetchPendingApprovals();
                    fetchApprovalHistory();
                  }}
                  disabled={loading || historyLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon
                    className={`w-4 h-4 ${
                      loading || historyLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sales & Marketing Approval Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Available Operations Budget Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300">
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
          </div>

          {/* Pending Approvals Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-all duration-300">
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
          </div>

          {/* Pending Expense Transactions Card */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-all duration-300">
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
          </div>

          {/* Total Pending Amount Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300">
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
          </div>
        </div>

        {/* Sales & Marketing Finance Allocation Tracking */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              Sales & Marketing Finance Allocation Tracking
            </h2>
            <div className="p-3 bg-white rounded-lg shadow-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-[var(--elra-primary)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-[var(--elra-primary)] mb-1">
                Available Operations Budget
              </p>
              <p className="text-2xl font-black text-[var(--elra-primary)]">
                {formatCurrency(walletBalance.available)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ready for Sales & Marketing
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-blue-600 mb-1">
                Total Operational Budget
              </p>
              <p className="text-2xl font-black text-blue-600">
                {formatCurrency(walletBalance.allocated)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Allocated to Operations
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-green-600 mb-1">
                Used Budget
              </p>
              <p className="text-2xl font-black text-green-600">
                {formatCurrency(walletBalance.used)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Processed Transactions
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-amber-600 mb-1">
                Pending Transaction Amount
              </p>
              <p className="text-2xl font-black text-amber-600">
                {formatCurrency(
                  pendingApprovals.reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting Approval</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab("pending");
                  // Only refetch if data is stale or empty
                  if (pendingApprovals.length === 0) {
                    fetchPendingApprovals();
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "pending"
                    ? "border-[var(--elra-primary)] text-white bg-[var(--elra-primary)] rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>Pending Approvals</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      activeTab === "pending"
                        ? "bg-white text-[var(--elra-primary)]"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {pendingApprovals.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("history");
                  setSearchTerm("");
                  if (approvalHistory.length === 0) {
                    fetchApprovalHistory();
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-[var(--elra-primary)] text-white bg-[var(--elra-primary)] rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Approval History</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      activeTab === "history"
                        ? "bg-white text-[var(--elra-primary)]"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {approvalHistory.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(transaction);
                          }}
                          title="View Transaction Details"
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
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
                        </button>
                        <button
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
                        </button>
                      </div>
                    )
                  : (transaction) => (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(transaction);
                          }}
                          title="View Transaction Details"
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
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
        </div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {showModal && selectedApproval && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-white bg-opacity-50"
                onClick={() => setShowModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-slate-900">
                      Transaction Details
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Reference
                      </label>
                      <div className="font-mono text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        {selectedApproval.reference}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Type
                      </label>
                      <div className="flex items-center">
                        {getTypeBadge(selectedApproval.type)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Amount
                      </label>
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
                        <span className="text-2xl font-bold text-slate-900">
                          {formatCurrency(selectedApproval.amount)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <div className="flex items-center">
                        {getStatusBadge(selectedApproval.status)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Title
                    </label>
                    <div className="text-slate-900 font-medium">
                      {selectedApproval.title}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <div className="text-slate-600 bg-slate-50 p-3 rounded-lg">
                      {selectedApproval.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Category
                      </label>
                      <div className="text-slate-600">
                        {selectedApproval.category
                          ?.replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Budget Category
                      </label>
                      <div className="text-slate-600">
                        {selectedApproval.budgetCategory
                          ?.replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Requested At
                      </label>
                      <div className="text-slate-600">
                        {formatDate(selectedApproval.requestedAt)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Module
                      </label>
                      <div className="text-slate-600">
                        {selectedApproval.module
                          ?.replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                    </div>
                    {selectedApproval.approvedBy && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Approved/Rejected By
                        </label>
                        <div className="text-slate-600">
                          {selectedApproval.approvedBy.firstName}{" "}
                          {selectedApproval.approvedBy.lastName}
                          <span className="text-slate-500 ml-2">
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {selectedApproval.status === "approved"
                            ? "Approved"
                            : "Rejected"}{" "}
                          At
                        </label>
                        <div className="text-slate-600">
                          {formatDate(selectedApproval.approvedAt)}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedApproval.approvalComments && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Approval Comments
                      </label>
                      <div className="text-slate-600 bg-slate-50 p-3 rounded-lg">
                        {selectedApproval.approvalComments}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedApproval && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-white bg-opacity-50"
                onClick={() => setShowConfirmModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-xl shadow-xl max-w-md w-full"
              >
                <div className="p-6">
                  <div
                    className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-opacity-10"
                    style={{
                      backgroundColor:
                        confirmAction === "approve"
                          ? "rgba(34, 197, 94, 0.1)"
                          : "rgba(239, 68, 68, 0.1)",
                    }}
                  >
                    {confirmAction === "approve" ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-600" />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
                    {confirmAction === "approve"
                      ? "Approve Transaction"
                      : "Reject Transaction"}
                  </h3>

                  <p className="text-sm text-slate-600 text-center mb-6">
                    Are you sure you want to {confirmAction} this transaction?
                  </p>

                  <div className="bg-slate-50 p-4 rounded-lg mb-6">
                    <div className="text-sm text-slate-600 mb-2">
                      <strong>Reference:</strong> {selectedApproval.reference}
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      <strong>Amount:</strong>{" "}
                      {formatCurrency(selectedApproval.amount)}
                    </div>
                    <div className="text-sm text-slate-600">
                      <strong>Type:</strong>{" "}
                      {selectedApproval.type === "revenue"
                        ? "Revenue"
                        : "Expense"}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={confirmComments}
                      onChange={(e) => setConfirmComments(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      placeholder={`Add comments for ${confirmAction} (optional)...`}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Comments are optional but recommended for audit trail
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      disabled={actionLoading}
                      className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmApproval}
                      disabled={actionLoading}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
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
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesMarketingApprovals;
