import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiTicket,
  HiUser,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiEye,
  HiArrowPath,
  HiArrowLeft,
  HiHome,
  HiXMark,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import {
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";
import defaultAvatar from "../../../../assets/defaulticon.jpg";

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) {
      return getDefaultAvatar();
    }
    if (avatarPath.startsWith("http")) {
      return avatarPath;
    }

    const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(
      "/api",
      ""
    );
    const finalUrl = `${baseUrl}${avatarPath}`;

    return finalUrl;
  };

  const getAvatarDisplay = (user) => {
    if (!user) return null;

    const avatarUrl = user.avatar
      ? getImageUrl(user.avatar)
      : getDefaultAvatar();

    return (
      <img
        src={avatarUrl}
        alt={`${user.firstName} ${user.lastName}`}
        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
        onError={(e) => {
          e.target.src = getDefaultAvatar();
        }}
      />
    );
  };

  const getCleanDescription = (description) => {
    if (!description) return "No description provided";

    // Remove the raw data dump and return clean description
    if (description.includes("COMPLAINT SUBMITTED BY:")) {
      // Extract just the clean description part
      const parts = description.split("COMPLAINT DETAILS:");
      if (parts.length > 1) {
        return parts[1].split("FULL CONVERSATION CONTEXT:")[0].trim();
      }
    }

    return description;
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleStatusChange = (complaintId, newStatus) => {
    const complaint = complaints.find((c) => c._id === complaintId);
    setPendingStatusChange({ complaintId, newStatus, complaint });
    setShowConfirmationModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    try {
      setUpdatingStatus(true);
      const response = await complaintAPI.updateComplaintStatus(
        pendingStatusChange.complaintId,
        { status: pendingStatusChange.newStatus }
      );

      if (response.success) {
        toast.success(
          `Complaint status updated to ${pendingStatusChange.newStatus
            .replace("_", " ")
            .toUpperCase()} successfully!`
        );

        // Update the complaint in the local state
        setComplaints((prev) =>
          prev.map((complaint) =>
            complaint._id === pendingStatusChange.complaintId
              ? { ...complaint, status: pendingStatusChange.newStatus }
              : complaint
          )
        );

        setShowConfirmationModal(false);
        setPendingStatusChange(null);
      } else {
        toast.error("Failed to update complaint status");
      }
    } catch (error) {
      console.error("Error updating complaint status:", error);
      toast.error("Failed to update complaint status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmationModal(false);
    setPendingStatusChange(null);
  };

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = await complaintAPI.getComplaints({
          page: 1,
          limit: 20,
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

  const handleStatusUpdate = async (
    complaintId,
    newStatus,
    resolution = null
  ) => {
    try {
      const response = await complaintAPI.updateComplaintStatus(complaintId, {
        status: newStatus,
        resolution: resolution,
      });

      if (response.success) {
        toast.success("Complaint status updated successfully");
        // Refresh complaints list
        const refreshResponse = await complaintAPI.getComplaints({
          page: 1,
          limit: 20,
          sortBy: "submittedAt",
          sortOrder: "desc",
        });
        if (refreshResponse.success) {
          setComplaints(refreshResponse.data.complaints);
        }
      } else {
        toast.error("Failed to update complaint status");
      }
    } catch (error) {
      console.error("Error updating complaint status:", error);
      toast.error("Failed to update complaint status");
    }
  };

  const handleAddNote = async (complaintId, note) => {
    try {
      const response = await complaintAPI.addComplaintNote(complaintId, {
        note,
      });

      if (response.success) {
        toast.success("Note added successfully");
        // Refresh complaints list
        const refreshResponse = await complaintAPI.getComplaints({
          page: 1,
          limit: 20,
          sortBy: "submittedAt",
          sortOrder: "desc",
        });
        if (refreshResponse.success) {
          setComplaints(refreshResponse.data.complaints);
        }
      } else {
        toast.error("Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const getPriorityColor = (priority) => {
    const priorityInfo = complaintUtils.formatPriority(priority);
    return priorityInfo.bgColor;
  };

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
        <span className="text-gray-900 font-medium">Complaint Management</span>
      </div>

      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Complaint Management</h1>
            <p className="text-white/80">
              Manage and resolve staff complaints efficiently
            </p>
          </div>
          <Link
            to="/dashboard/modules/customer-care"
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Complaints
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {complaints.length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <HiTicket className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border border-yellow-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-900 mt-2">
                {complaints.filter((c) => c.status === "pending").length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
              <HiClock className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                In Progress
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {complaints.filter((c) => c.status === "in_progress").length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <HiArrowPath className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Resolved
              </p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {complaints.filter((c) => c.status === "resolved").length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <HiCheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Complaints Management Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Complaints Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and update complaint status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint, index) => (
                <motion.tr
                  key={complaint.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                        <HiTicket className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {complaint.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {complaint.reporter}
                    </div>
                    <div className="text-sm text-gray-500">
                      {complaint.createdAt}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {complaint.department?.name || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={complaint.status}
                      onChange={(e) =>
                        handleStatusChange(complaint._id, e.target.value)
                      }
                      className={`px-3 py-1 text-sm font-semibold rounded-full border-0 ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {complaint.assignedTo ? complaint.assignedTo : "Not Set"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(complaint)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <HiEye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* View Details Modal - Beautiful Elra Branded */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100"
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <HiTicket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Complaint Details</h2>
                    <p className="text-white/80 text-sm">
                      Complaint #
                      {selectedComplaint.complaintNumber ||
                        selectedComplaint._id?.slice(-6).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <HiXMark className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Status and Priority Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <HiCheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Status
                      </p>
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                          selectedComplaint.status
                        )}`}
                      >
                        {selectedComplaint.status
                          ?.replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500 rounded-lg">
                      <HiExclamationTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-700">
                        Priority
                      </p>
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                          selectedComplaint.priority
                        )}`}
                      >
                        {selectedComplaint.priority?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <HiTicket className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">
                        Category
                      </p>
                      <p className="text-sm font-semibold text-purple-900">
                        {selectedComplaint.category
                          ?.replace("_", " ")
                          .toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Complaint Title
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-900 font-medium text-lg">
                    {selectedComplaint.title}
                  </p>
                </div>
              </div>

              {/* Description Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Description
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {getCleanDescription(selectedComplaint.description)}
                  </p>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                    <HiUser className="w-5 h-5 mr-2" />
                    Submitted By
                  </h4>
                  <div className="flex items-center space-x-4">
                    {getAvatarDisplay(selectedComplaint.submittedBy)}
                    <div>
                      <p className="font-semibold text-green-900">
                        {selectedComplaint.submittedBy?.firstName}{" "}
                        {selectedComplaint.submittedBy?.lastName}
                      </p>
                      <p className="text-sm text-green-700">
                        {selectedComplaint.department?.name || "N/A"}
                      </p>
                      <p className="text-xs text-green-600">
                        {formatDate(selectedComplaint.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                    <HiUser className="w-5 h-5 mr-2" />
                    Assignment
                  </h4>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <HiUser className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">
                        {selectedComplaint.assignedTo || "Not Assigned"}
                      </p>
                      <p className="text-sm text-blue-700">
                        {selectedComplaint.assignedTo
                          ? "Assigned"
                          : "Pending Assignment"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)] rounded-xl transition-colors font-medium"
                >
                  Close Details
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {showConfirmationModal && pendingStatusChange && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Confirm Status Change
                </h2>
                <button
                  onClick={cancelStatusChange}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiXMark className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">
                    Are you sure you want to change the status of:
                  </p>
                  <p className="font-semibold text-gray-900 text-lg">
                    "{pendingStatusChange.complaint.title}"
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    From:{" "}
                    <span className="font-medium capitalize">
                      {pendingStatusChange.complaint.status?.replace("_", " ")}
                    </span>{" "}
                    → To:{" "}
                    <span className="font-medium capitalize text-[var(--elra-primary)]">
                      {pendingStatusChange.newStatus.replace("_", " ")}
                    </span>
                  </p>
                </div>

                {/* Special message for resolved status */}
                {pendingStatusChange.newStatus === "resolved" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <HiCheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Resolution Notification
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          {pendingStatusChange.complaint.submittedBy?.firstName}{" "}
                          {pendingStatusChange.complaint.submittedBy?.lastName}{" "}
                          will be notified that their complaint has been
                          resolved.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={cancelStatusChange}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={updatingStatus}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStatusChange}
                    disabled={updatingStatus}
                    className="flex-1 px-4 py-2 bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {updatingStatus ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Confirm Change</span>
                    )}
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

export default ComplaintManagement;
