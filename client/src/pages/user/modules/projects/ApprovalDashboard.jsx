import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPendingApprovals,
  takeApprovalAction,
  getApprovalTypeDisplayName,
  getDepartmentLevelDisplayName,
  getStatusDisplay,
  getPriorityDisplay,
  formatCurrency,
} from "../../../../services/approvalAPI.js";
import DataTable from "../../../../components/common/DataTable";

const ApprovalDashboard = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetchPendingApprovals();
      if (response.success) {
        setApprovals(response.data);
      } else {
        toast.error("Failed to load pending approvals");
      }
    } catch (error) {
      console.error("Error loading approvals:", error);
      toast.error("Error loading pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (approvalId, action, comments = "") => {
    setActionLoading((prev) => ({ ...prev, [approvalId]: true }));

    try {
      const response = await takeApprovalAction(approvalId, action, comments);
      if (response.success) {
        toast.success(
          `Approval ${
            action === "approve" ? "approved" : "rejected"
          } successfully`
        );
        loadPendingApprovals(); 
      } else {
        toast.error(response.message || `Failed to ${action} approval`);
      }
    } catch (error) {
      console.error(`Error ${action}ing approval:`, error);
      toast.error(`Error ${action}ing approval`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [approvalId]: false }));
    }
  };

  const columns = [
    {
      header: "Title",
      accessor: "title",
      cell: (approval) => (
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-medium text-gray-900">{approval.title}</div>
            <div className="text-sm text-gray-500">
              {getApprovalTypeDisplayName(approval.type)}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      cell: (approval) => (
        <div className="text-right">
          <div className="font-medium text-gray-900">
            {formatCurrency(approval.amount)}
          </div>
          <div className="text-sm text-gray-500">{approval.currency}</div>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "department",
      cell: (approval) => (
        <div className="text-sm text-gray-600">
          {approval.department?.name || "N/A"}
        </div>
      ),
    },
    {
      header: "Priority",
      accessor: "priority",
      cell: (approval) => {
        const priority = getPriorityDisplay(approval.priority);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.bgColor} ${priority.color}`}
          >
            {priority.name}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      cell: (approval) => {
        const status = getStatusDisplay(approval.status);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
          >
            {status.name}
          </span>
        );
      },
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      cell: (approval) => (
        <div className="text-sm text-gray-600">
          {new Date(approval.dueDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (approval) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleApprovalAction(approval._id, "approve")}
            disabled={actionLoading[approval._id]}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            {actionLoading[approval._id] ? "Processing..." : "Approve"}
          </button>
          <button
            onClick={() => handleApprovalAction(approval._id, "reject")}
            disabled={actionLoading[approval._id]}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            {actionLoading[approval._id] ? "Processing..." : "Reject"}
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Approval Dashboard
          </h1>
          <p className="text-gray-600">
            Review and manage pending approval requests
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {approvals.length} pending approval
            {approvals.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No pending approvals
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            All approval requests have been processed.
          </p>
        </div>
      ) : (
        <DataTable
          data={approvals}
          columns={columns}
          loading={loading}
          searchable={true}
          sortable={true}
          pagination={true}
        />
      )}
    </div>
  );
};

export default ApprovalDashboard;
