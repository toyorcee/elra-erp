import React from "react";
import {
  HiX,
  HiCalendar,
  HiUser,
  HiClock,
  HiDocumentText,
  HiCheckCircle,
  HiXCircle,
  HiClock as HiPending,
} from "react-icons/hi";
import ELRALogo from "../ELRALogo";

const LeaveDetailsModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <HiXCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <HiPending className="w-5 h-5 text-yellow-500" />;
      case "cancelled":
        return <HiXCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <HiClock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Annual":
        return "text-blue-600";
      case "Sick":
        return "text-red-600";
      case "Personal":
        return "text-purple-600";
      case "Maternity":
        return "text-pink-600";
      case "Paternity":
        return "text-indigo-600";
      case "Study":
        return "text-green-600";
      case "Bereavement":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[95vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ELRALogo variant="dark" size="sm" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Leave Request Details</h2>
                <p className="text-sm text-white text-opacity-90">
                  Request ID: {request._id?.slice(-8) || "N/A"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 transition-colors"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                request.status
              )}`}
            >
              {getStatusIcon(request.status)}
              <span className="ml-2 capitalize">{request.status}</span>
            </div>
          </div>

          {/* Leave Type & Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leave Type */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <HiDocumentText className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Leave Type</h3>
              </div>
              <span
                className={`text-lg font-semibold ${getTypeColor(
                  request.leaveType
                )}`}
              >
                {request.leaveType} Leave
              </span>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <HiClock className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Duration</h3>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {request.days} day{request.days !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <HiCalendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Leave Period</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 mb-1">Start Date</p>
                <p className="font-medium text-blue-900">
                  {formatDate(request.startDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">End Date</p>
                <p className="font-medium text-blue-900">
                  {formatDate(request.endDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <HiDocumentText className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Reason</h3>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {request.reason || "No reason provided"}
            </p>
          </div>

          {/* Current Approver */}
          {request.currentApprover && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <HiUser className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">Current Approver</h3>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold text-sm">
                    {request.currentApprover.firstName?.[0]}
                    {request.currentApprover.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-green-900">
                    {request.currentApprover.firstName}{" "}
                    {request.currentApprover.lastName}
                  </p>
                  <p className="text-sm text-green-700">
                    {request.currentApprover.role?.name || "HOD"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Approval History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Approval History</h3>
            <div className="space-y-3">
              {/* Current Status */}
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    request.status === "Approved"
                      ? "bg-green-100"
                      : request.status === "Rejected"
                      ? "bg-red-100"
                      : request.status === "Cancelled"
                      ? "bg-gray-100"
                      : "bg-yellow-100"
                  }`}
                >
                  {request.status === "Approved" ? (
                    <HiCheckCircle className="w-4 h-4 text-green-600" />
                  ) : request.status === "Rejected" ? (
                    <HiXCircle className="w-4 h-4 text-red-600" />
                  ) : request.status === "Cancelled" ? (
                    <HiXCircle className="w-4 h-4 text-gray-600" />
                  ) : (
                    <HiPending className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {request.status === "Approved"
                      ? "Request Approved"
                      : request.status === "Rejected"
                      ? "Request Rejected"
                      : request.status === "Cancelled"
                      ? "Request Cancelled"
                      : "Request Pending"}
                  </p>
                  <p className="text-sm text-gray-600">Current Status</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {request.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {request.status === "Approved" && request.approvedAt
                      ? formatDate(request.approvedAt)
                      : request.status === "Rejected" && request.rejectedAt
                      ? formatDate(request.rejectedAt)
                      : request.status === "Cancelled" && request.cancelledAt
                      ? formatDate(request.cancelledAt)
                      : "Pending"}
                  </p>
                </div>
              </div>

              {/* Current Approver (if pending) */}
              {request.status === "Pending" && request.currentApprover && (
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <HiPending className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {request.currentApprover.firstName}{" "}
                      {request.currentApprover.lastName}
                    </p>
                    <p className="text-sm text-gray-600">Current Approver</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Waiting</p>
                    <p className="text-xs text-gray-500">For approval</p>
                  </div>
                </div>
              )}

              {/* Approval Chain */}
              {request.approvalChain && request.approvalChain.length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-purple-200">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <HiClock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Approval Chain</p>
                    <p className="text-sm text-gray-600">
                      {request.approvalChain.join(" → ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {request.approvals &&
                      request.approvals.length > 0 &&
                      request.approvals.some(
                        (approval) => approval.status === "Approved"
                      )
                        ? 2
                        : 1}
                      /{request.totalApprovalSteps || 1}
                    </p>
                    <p className="text-xs text-gray-500">Current step</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(request.createdAt)}
                </span>
              </div>
              {request.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(request.approvedAt)}
                  </span>
                </div>
              )}
              {request.rejectedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Rejected:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(request.rejectedAt)}
                  </span>
                </div>
              )}
              {request.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelled:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(request.cancelledAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-gray-50 px-6 py-4 border-t rounded-b-2xl flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailsModal;
