import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import { formatCurrency } from "../../../../utils/formatters";
import {
  getSalesMarketingApprovals,
  approveSalesMarketingTransaction,
  rejectSalesMarketingTransaction,
} from "../../../../services/salesMarketingAPI";

const SalesMarketingApprovals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const canApprove = () => {
    const userDepartment = user?.department?.name;
    const isSuperAdmin = user?.role?.level === 1000;
    const isFinanceHOD =
      user?.role?.level === 700 && userDepartment === "Finance & Accounting";
    const isSalesMarketingHOD =
      user?.role?.level === 700 && userDepartment === "Sales & Marketing";

    return isSuperAdmin || isFinanceHOD || isSalesMarketingHOD;
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await getSalesMarketingApprovals();

      if (response.success) {
        setApprovals(response.data.approvals || []);
      } else {
        toast.error(response.message || "Failed to load approvals");
      }
    } catch (error) {
      console.error("Error fetching approvals:", error);
      toast.error("Error loading approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId) => {
    try {
      setProcessing(true);
      const response = await approveSalesMarketingTransaction(transactionId);

      if (response.success) {
        toast.success("Transaction approved successfully");
        fetchApprovals();
      } else {
        toast.error(response.message || "Failed to approve transaction");
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (transactionId) => {
    try {
      setProcessing(true);
      const response = await rejectSalesMarketingTransaction(transactionId);

      if (response.success) {
        toast.success("Transaction rejected");
        fetchApprovals();
      } else {
        toast.error(response.message || "Failed to reject transaction");
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
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

  const approvalColumns = [
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
    {
      header: "Actions",
      accessor: "actions",
      renderer: (transaction) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedTransaction(transaction);
              setShowDetailModal(true);
            }}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {canApprove() && (
            <>
              <button
                onClick={() => handleApprove(transaction.id)}
                disabled={processing}
                className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Approve"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleReject(transaction.id)}
                disabled={processing}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reject"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Sales & Marketing Approvals</h1>
        <p className="text-white/80">
          Review and approve pending sales and marketing transactions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">
                Pending Approvals
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {approvals.filter((a) => a.status === "pending").length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">
                Approved Today
              </p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <XMarkIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">
                Rejected Today
              </p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <DataTable
          data={approvals}
          columns={approvalColumns}
          loading={loading}
          searchable={false}
          pagination={true}
          pageSize={10}
        />
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Transaction Details
                </h2>
                <p className="text-gray-600 mt-1">
                  Review transaction information before approval
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <p className="text-gray-900 font-mono">
                      {selectedTransaction.transactionId}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type
                    </label>
                    <div className="flex space-x-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedTransaction.type === "sales"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {selectedTransaction.type}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedTransaction.transactionType === "revenue"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedTransaction.transactionType}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <p className="text-gray-900">{selectedTransaction.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <p className="text-gray-900">
                    {selectedTransaction.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount
                    </label>
                    <p
                      className={`text-2xl font-bold ${
                        selectedTransaction.transactionType === "revenue"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedTransaction.transactionType === "revenue"
                        ? "+"
                        : "-"}
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <p className="text-gray-900 capitalize">
                      {selectedTransaction.category.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    {getPriorityBadge(selectedTransaction.priority)}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Approval Level
                    </label>
                    <p className="text-gray-900 capitalize">
                      {selectedTransaction.approvalLevel}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Requested By
                    </label>
                    <p className="text-gray-900">
                      {selectedTransaction.requestedBy}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Request Date
                    </label>
                    <p className="text-gray-900">
                      {new Date(
                        selectedTransaction.requestedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedTransaction.budgetCategory && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Budget Category
                    </label>
                    <p className="text-gray-900 capitalize">
                      {selectedTransaction.budgetCategory}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {canApprove() && (
                <>
                  <button
                    onClick={() => handleReject(selectedTransaction.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 border-2 border-red-200 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedTransaction.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <CheckIcon className="h-5 w-5" />
                    <span>Approve</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SalesMarketingApprovals;
