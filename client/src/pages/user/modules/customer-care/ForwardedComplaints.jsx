import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiArrowLeft,
  HiMagnifyingGlass,
  HiEye,
  HiChatBubbleLeftRight,
  HiPaperAirplane,
} from "react-icons/hi2";
import { HiX } from "react-icons/hi";
import { Link } from "react-router-dom";
import { complaintAPI } from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useMessageContext } from "../../../../context/MessageContext";

const ForwardedComplaints = () => {
  const { openChatWithUser } = useMessageContext();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchComplaints = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(priorityFilter !== "all" && { priority: priorityFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await complaintAPI.getForwardedComplaints(params);

      if (response.success) {
        setComplaints(response.data.complaints);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching forwarded complaints:", error);
      toast.error("Failed to load forwarded complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    console.log(
      "🔍 [MODAL STATE] showDetailsModal:",
      showDetailsModal,
      "selectedComplaint:",
      selectedComplaint
    );
  }, [showDetailsModal, selectedComplaint]);

  const handleSearch = () => {
    fetchComplaints(1);
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleChat = (complaint) => {
    sessionStorage.setItem("prefetchedComplaintId", complaint._id);
    sessionStorage.setItem("chatUserId", complaint.submittedBy._id);

    openChatWithUser(complaint.submittedBy);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-white bg-yellow-600";
      case "resolved":
        return "text-white bg-green-600";
      case "in_progress":
        return "text-white bg-blue-600";
      default:
        return "text-white bg-gray-600";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-white bg-red-600";
      case "medium":
        return "text-white bg-yellow-600";
      case "low":
        return "text-white bg-green-600";
      default:
        return "text-white bg-gray-600";
    }
  };

  const columns = [
    {
      key: "complaintNumber",
      label: "Complaint #",
      header: "Complaint #",
      renderer: (complaint) => (
        <span className="font-mono text-sm font-semibold text-gray-900">
          {complaint.complaintNumber}
        </span>
      ),
    },
    {
      key: "title",
      label: "Title",
      header: "Complaint Details",
      renderer: (complaint) => (
        <div className="max-w-xs">
          <p className="font-medium text-gray-900 truncate">
            {complaint.title}
          </p>
          <p className="text-sm text-gray-500">
            From: {complaint.submittedBy?.firstName || ""}{" "}
            {complaint.submittedBy?.lastName || ""}
          </p>
        </div>
      ),
    },
    {
      key: "department",
      label: "Original Department",
      header: "Original Department",
      renderer: (complaint) => {
        let departmentName = "N/A";
        if (complaint.department) {
          if (
            typeof complaint.department === "object" &&
            complaint.department.name
          ) {
            departmentName = complaint.department.name;
          } else if (typeof complaint.department === "string") {
            departmentName = complaint.department;
          }
        }
        return <span className="text-sm text-gray-600">{departmentName}</span>;
      },
    },
    {
      key: "priority",
      label: "Priority",
      header: "Priority",
      renderer: (complaint) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
            complaint.priority
          )}`}
        >
          {complaint.priority?.toUpperCase()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      header: "Status",
      renderer: (complaint) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            complaint.status
          )}`}
        >
          {complaint.status?.replace("_", " ").toUpperCase()}
        </span>
      ),
    },
    {
      key: "forwardedAt",
      label: "Forwarded",
      header: "Forwarded",
      renderer: (complaint) => {
        const forwardedBy = complaint.forwardedTo?.forwardedBy;

        const forwardedByName =
          forwardedBy && forwardedBy.firstName
            ? `${forwardedBy.firstName} ${forwardedBy.lastName || ""}`.trim()
            : "Unknown User";

        return (
          <div className="text-sm text-gray-600">
            <p>
              {complaint.forwardedTo?.forwardedAt
                ? new Date(
                    complaint.forwardedTo.forwardedAt
                  ).toLocaleDateString()
                : "N/A"}
            </p>
            <p className="text-xs text-gray-500">by {forwardedByName}</p>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      renderer: (complaint) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetails(complaint)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiEye className="h-4 w-4 mr-1" />
            View
          </button>
          <button
            onClick={() => handleChat(complaint)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <HiChatBubbleLeftRight className="h-4 w-4 mr-1" />
            Chat
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-96"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard/modules/customer-care"
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <HiArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Forwarded Complaints</h1>
                <p className="text-orange-100 mt-1">
                  Complaints forwarded to you for awareness and follow-up
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white/20 rounded-xl">
            <HiPaperAirplane className="h-8 w-8" />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <HiMagnifyingGlass className="h-4 w-4 mr-2" />
            Search
          </button>
        </div>
      </motion.div>

      {/* Complaints Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        {complaints.length === 0 ? (
          <div className="text-center py-12">
            <HiPaperAirplane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Forwarded Complaints
            </h3>
            <p className="text-gray-500">
              No complaints have been forwarded to you yet.
            </p>
          </div>
        ) : (
          <DataTable
            data={complaints}
            columns={columns}
            loading={loading}
            pagination={pagination}
            onPageChange={fetchComplaints}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
              showView: false,
            }}
          />
        )}
      </motion.div>

      {/* Complaint Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HiEye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Complaint Details
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedComplaint?.complaintNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Title
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedComplaint.title}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Category
                  </label>
                  <p className="text-gray-900">{selectedComplaint.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Priority
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                      selectedComplaint.priority
                    )}`}
                  >
                    {selectedComplaint.priority?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedComplaint.status
                    )}`}
                  >
                    {selectedComplaint.status?.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="text-gray-900 mt-1">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Submitted By */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Submitted By
                </label>
                <p className="text-gray-900">
                  {selectedComplaint.submittedBy?.firstName}{" "}
                  {selectedComplaint.submittedBy?.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedComplaint.submittedBy?.email}
                </p>
              </div>

              {/* Forwarded Info */}
              {selectedComplaint.forwardedTo && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Forwarded Information
                  </label>
                  <div className="mt-2 p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Forwarded to:</strong>{" "}
                      {selectedComplaint.forwardedTo.department?.name}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Forwarded by:</strong>{" "}
                      {selectedComplaint.forwardedTo.forwardedBy?.firstName}{" "}
                      {selectedComplaint.forwardedTo.forwardedBy?.lastName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Date:</strong>{" "}
                      {new Date(
                        selectedComplaint.forwardedTo.forwardedAt
                      ).toLocaleDateString()}
                    </p>
                    {selectedComplaint.forwardedTo.note && (
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>Note:</strong>{" "}
                        {selectedComplaint.forwardedTo.note}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Submitted
                  </label>
                  <p className="text-gray-900">
                    {new Date(
                      selectedComplaint.submittedAt
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {new Date(
                      selectedComplaint.lastUpdated
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleChat(selectedComplaint);
                }}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <HiChatBubbleLeftRight className="h-4 w-4" />
                <span>Start Chat</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ForwardedComplaints;
