import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HiTicket,
  HiChatBubbleOvalLeftEllipsis,
  HiEye,
  HiPlus,
  HiXMark,
} from "react-icons/hi2";
import {
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      try {
        setLoading(true);
        const response = await complaintAPI.getComplaints({
          page: currentPage,
          limit: 10,
          sortBy: "submittedAt",
          sortOrder: "desc",
          submittedByMe: true,
          status: filter === "all" ? undefined : filter,
        });

        if (response.success) {
          setComplaints(response.data.complaints);
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.totalItems);
        } else {
          toast.error("Failed to load your complaints");
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
        toast.error("Failed to load your complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchMyComplaints();
  }, [currentPage, filter]);

  const getStatusColor = (status) => {
    const statusInfo = complaintUtils.formatStatus(status);
    return statusInfo.bgColor;
  };

  const getPriorityColor = (priority) => {
    const priorityInfo = complaintUtils.formatPriority(priority);
    return priorityInfo.bgColor;
  };

  const handleCheckStatus = (complaint) => {
    const chatButton = document.querySelector("[data-chat-button]");
    if (chatButton) {
      sessionStorage.setItem("prefetchedComplaintId", complaint._id);
      chatButton.click();
    } else {
      console.error("❌ Chat button not found");
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
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
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              <HiTicket className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">My Complaints</h1>
              <p className="text-white/80">
                View and track your submitted complaints
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/modules/customer-care/submit-complaint"
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2"
            >
              <HiPlus className="w-5 h-5" />
              <span>Submit New Complaint</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-4"
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-[var(--elra-primary)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({totalItems})
          </button>
          <button
            onClick={() => handleFilterChange("pending")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "pending"
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange("in_progress")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "in_progress"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => handleFilterChange("resolved")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "resolved"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Resolved
          </button>
        </div>
      </motion.div>

      {/* Complaints List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {filter === "all"
            ? "All My Complaints"
            : `${filter.replace("_", " ")} Complaints`}
        </h2>
        {complaints.length > 0 ? (
          <div className="space-y-4">
            {complaints.map((complaint, index) => (
              <motion.div
                key={complaint._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start lg:items-center space-x-4 mb-4 lg:mb-0">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <HiChatBubbleOvalLeftEllipsis className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {complaint.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {complaint.complaintNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      Category:{" "}
                      {complaintUtils.formatCategory(complaint.category).label}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted:{" "}
                      {new Date(complaint.submittedAt).toLocaleDateString()}
                    </p>
                    {complaint.assignedTo && (
                      <p className="text-sm text-blue-600">
                        Assigned to: {complaint.assignedTo?.firstName}{" "}
                        {complaint.assignedTo?.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      {complaintUtils.formatStatus(complaint.status).label}
                    </span>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                        complaint.priority
                      )}`}
                    >
                      {complaintUtils.formatPriority(complaint.priority).label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(complaint.status === "pending" ||
                      complaint.status === "in_progress") && (
                      <button
                        onClick={() => handleCheckStatus(complaint)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        title="Check status and continue conversation about this complaint"
                      >
                        <HiChatBubbleOvalLeftEllipsis className="w-4 h-4" />
                        <span>Check Status</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleViewDetails(complaint);
                      }}
                      className="p-2 text-gray-400 hover:text-[var(--elra-primary)] transition-colors cursor-pointer"
                      title="View Details"
                      type="button"
                    >
                      <HiEye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <HiTicket className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === "all"
                ? "No complaints submitted yet"
                : `No ${filter.replace("_", " ")} complaints`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "You haven't submitted any complaints yet. Use the button above to submit your first complaint."
                : `You don't have any ${filter.replace(
                    "_",
                    " "
                  )} complaints at the moment.`}
            </p>
            {filter === "all" && (
              <Link
                to="/dashboard/modules/customer-care/submit-complaint"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                <HiPlus className="w-5 h-5" />
                <span>Submit Your First Complaint</span>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mt-6"
          >
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 10 + 1} to{" "}
              {Math.min(currentPage * 10, totalItems)} of {totalItems}{" "}
              complaints
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? "bg-[var(--elra-primary)] text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Complaint Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div
          className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <HiTicket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Complaint Details</h2>
                    <p className="text-white/90 text-sm">
                      #{selectedComplaint.complaintNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <HiXMark className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Title and Status */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedComplaint.title}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        complaintUtils.formatStatus(selectedComplaint.status)
                          .bgColor
                      } ${
                        complaintUtils.formatStatus(selectedComplaint.status)
                          .textColor
                      }`}
                    >
                      {
                        complaintUtils.formatStatus(selectedComplaint.status)
                          .label
                      }
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        complaintUtils.formatPriority(
                          selectedComplaint.priority
                        ).bgColor
                      } ${
                        complaintUtils.formatPriority(
                          selectedComplaint.priority
                        ).textColor
                      }`}
                    >
                      {
                        complaintUtils.formatPriority(
                          selectedComplaint.priority
                        ).label
                      }
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Description
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Complaint Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Complaint ID:</span>
                        <span className="font-medium">
                          {selectedComplaint.complaintNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium capitalize">
                          {selectedComplaint.category.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedComplaint.submittedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedComplaint.lastUpdated
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Status Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            complaintUtils.formatStatus(
                              selectedComplaint.status
                            ).bgColor
                          } ${
                            complaintUtils.formatStatus(
                              selectedComplaint.status
                            ).textColor
                          }`}
                        >
                          {
                            complaintUtils.formatStatus(
                              selectedComplaint.status
                            ).label
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            complaintUtils.formatPriority(
                              selectedComplaint.priority
                            ).bgColor
                          } ${
                            complaintUtils.formatPriority(
                              selectedComplaint.priority
                            ).textColor
                          }`}
                        >
                          {
                            complaintUtils.formatPriority(
                              selectedComplaint.priority
                            ).label
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SLA Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            selectedComplaint.slaStatus === "on_time"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedComplaint.slaStatus === "on_time"
                            ? "On Time"
                            : "Overdue"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">
                          {selectedComplaint.ageInDays} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedComplaint.notes &&
                  selectedComplaint.notes.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Notes & Updates
                      </h4>
                      <div className="space-y-3">
                        {selectedComplaint.notes.map((note, index) => (
                          <div
                            key={index}
                            className="bg-blue-50 p-4 rounded-xl"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-blue-900">
                                {note.addedBy?.firstName}{" "}
                                {note.addedBy?.lastName}
                              </span>
                              <span className="text-xs text-blue-600">
                                {new Date(note.addedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-blue-800">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Resolution Section */}
                {selectedComplaint.resolution && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Resolution
                    </h4>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-green-800">
                        {selectedComplaint.resolution}
                      </p>
                      {selectedComplaint.resolvedAt && (
                        <p className="text-sm text-green-600 mt-2">
                          Resolved on:{" "}
                          {new Date(
                            selectedComplaint.resolvedAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {(selectedComplaint.status === "pending" ||
                selectedComplaint.status === "in_progress") && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleCheckStatus(selectedComplaint);
                  }}
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                >
                  Check Status
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
