import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiPlus,
  HiTicket,
  HiUser,
  HiCalendar,
  HiArrowLeft,
  HiHome,
  HiEye,
  HiXMark,
  HiChatBubbleOvalLeftEllipsis,
  HiUserCircle,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import {
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";
import defaultAvatar from "../../../../assets/defaulticon.jpg";

const StaffComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return getDefaultAvatar();
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(
      "/api",
      ""
    );
    return `${baseUrl}${avatarPath}`;
  };

  const getAvatarDisplay = (user) => {
    if (user?.avatar) {
      return (
        <img
          src={getImageUrl(user.avatar)}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
          onError={(e) => {
            e.target.src = getDefaultAvatar();
          }}
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--elra-primary)] flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-md">
        {user?.firstName?.[0] || "U"}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = await complaintAPI.getComplaints({
          page: 1,
          limit: 10,
          sortBy: "submittedAt",
          sortOrder: "desc",
        });

        if (response.success) {
          setComplaints(response.data.complaints);
        } else {
          toast.error("Failed to load complaints");
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
        toast.error("Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getStatusColor = (status) => {
    const statusInfo = complaintUtils.formatStatus(status);
    return statusInfo.bgColor;
  };

  const getPriorityColor = (priority) => {
    const priorityInfo = complaintUtils.formatPriority(priority);
    return priorityInfo.bgColor;
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (filter === "all") return true;
    return complaint.status === filter;
  });

  // Action handlers
  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  // Status update functionality removed - this is now view-only

  // Status update functionality removed - this is now view-only

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <Link
          to="/dashboard/modules/customer-care"
          className="flex items-center space-x-1 hover:text-[var(--elra-primary)] transition-colors"
        >
          <HiHome className="w-4 h-4" />
          <span>Customer Care</span>
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">All Complaints</span>
      </div>

      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Staff Complaints</h1>
            <p className="text-white/80">
              View and manage all staff complaints and service requests
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/modules/customer-care"
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <Link
              to="/dashboard/modules/customer-care/submit-complaint"
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2"
            >
              <HiPlus className="w-5 h-5" />
              <span>Submit Complaint</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All Complaints", count: complaints.length },
            {
              key: "pending",
              label: "Pending",
              count: complaints.filter((c) => c.status === "pending").length,
            },
            {
              key: "in_progress",
              label: "In Progress",
              count: complaints.filter((c) => c.status === "in_progress")
                .length,
            },
            {
              key: "resolved",
              label: "Resolved",
              count: complaints.filter((c) => c.status === "resolved").length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
                filter === tab.key
                  ? "bg-[var(--elra-primary)] text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint, index) => (
          <motion.div
            key={complaint._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {getAvatarDisplay(complaint.submittedBy)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header with Title and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {complaint.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600">
                          by {complaint.submittedBy?.firstName}{" "}
                          {complaint.submittedBy?.lastName}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {complaint.department?.name || "No Department"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          complaint.status
                        )}`}
                      >
                        {complaint.status?.replace("_", " ").toUpperCase()}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {complaint.description &&
                    !complaint.description.includes("COMPLAINT SUBMITTED BY")
                      ? complaint.description
                      : "No description provided"}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <HiCalendar className="w-4 h-4" />
                      <span>
                        {formatDate(
                          complaint.submittedAt || complaint.createdAt
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <HiChatBubbleOvalLeftEllipsis className="w-4 h-4" />
                      <span className="capitalize">
                        {complaint.category || "General"}
                      </span>
                    </div>
                    {complaint.assignedTo && (
                      <div className="flex items-center space-x-1">
                        <HiUserCircle className="w-4 h-4" />
                        <span>
                          Assigned to {complaint.assignedTo?.firstName}{" "}
                          {complaint.assignedTo?.lastName}
                        </span>
                      </div>
                    )}
                    {complaint.complaintNumber && (
                      <div className="flex items-center space-x-1">
                        <HiTicket className="w-4 h-4" />
                        <span className="font-mono text-xs">
                          {complaint.complaintNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleViewDetails(complaint)}
                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  title="View Details"
                >
                  <HiEye className="w-5 h-5" />
                </button>
                {/* Status update button removed - this is now view-only */}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredComplaints.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl inline-block">
            <HiTicket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No complaints found
            </h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "No complaints have been submitted yet."
                : `No ${filter} complaints found.`}
            </p>
          </div>
        </motion.div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Complaint Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiXMark className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start space-x-4">
                  {getAvatarDisplay(selectedComplaint.submittedBy)}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedComplaint.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        by {selectedComplaint.submittedBy?.firstName}{" "}
                        {selectedComplaint.submittedBy?.lastName}
                      </span>
                      <span>•</span>
                      <span>{selectedComplaint.department?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedComplaint.status
                      )}`}
                    >
                      {selectedComplaint.status
                        ?.replace("_", " ")
                        .toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                        selectedComplaint.priority
                      )}`}
                    >
                      {selectedComplaint.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                    {selectedComplaint.description &&
                    !selectedComplaint.description.includes(
                      "COMPLAINT SUBMITTED BY"
                    )
                      ? selectedComplaint.description
                      : "No description provided"}
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">
                      Category:
                    </span>
                    <span className="ml-2 text-gray-600 capitalize">
                      {selectedComplaint.category || "General"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">
                      Submitted:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {formatDate(
                        selectedComplaint.submittedAt ||
                          selectedComplaint.createdAt
                      )}
                    </span>
                  </div>
                  {selectedComplaint.complaintNumber && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Complaint #:
                      </span>
                      <span className="ml-2 text-gray-600 font-mono">
                        {selectedComplaint.complaintNumber}
                      </span>
                    </div>
                  )}
                  {selectedComplaint.assignedTo && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Assigned to:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {selectedComplaint.assignedTo?.firstName}{" "}
                        {selectedComplaint.assignedTo?.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status update modal removed - this is now view-only */}
      {false && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Update Status
                </h2>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiXMark className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">Update status for:</p>
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedComplaint.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Current status:{" "}
                    <span className="font-medium capitalize">
                      {selectedComplaint.status?.replace("_", " ")}
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      value: "pending",
                      label: "Pending",
                      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                      icon: "⏳",
                    },
                    {
                      value: "in_progress",
                      label: "In Progress",
                      color: "bg-blue-100 text-blue-800 border-blue-200",
                      icon: "🔄",
                    },
                    {
                      value: "resolved",
                      label: "Resolved",
                      color: "bg-green-100 text-green-800 border-green-200",
                      icon: "✅",
                    },
                    {
                      value: "closed",
                      label: "Closed",
                      color: "bg-gray-100 text-gray-800 border-gray-200",
                      icon: "🔒",
                    },
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() =>
                        handleStatusUpdate(selectedComplaint._id, status.value)
                      }
                      disabled={
                        updatingStatus ||
                        selectedComplaint.status === status.value
                      }
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                        selectedComplaint.status === status.value
                          ? "bg-[var(--elra-primary)] text-white border-[var(--elra-primary)]"
                          : status.color + " hover:shadow-md hover:scale-[1.02]"
                      } ${
                        updatingStatus
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{status.icon}</span>
                        <span className="font-semibold">{status.label}</span>
                      </div>
                      {selectedComplaint.status === status.value && (
                        <span className="text-sm font-medium">Current</span>
                      )}
                      {updatingStatus && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={updatingStatus}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StaffComplaints;
