import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiClipboardDocumentList,
  HiArrowLeft,
  HiHome,
  HiChatBubbleOvalLeftEllipsis,
  HiEye,
  HiPencil,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import {
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await complaintAPI.getComplaints({
          page: 1,
          limit: 20,
          sortBy: "submittedAt",
          sortOrder: "desc",
          assignedToMe: true, // Filter for complaints assigned to current user
        });

        if (response.success) {
          setAssignments(response.data.complaints);
        } else {
          toast.error("Failed to load assignments");
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        toast.error("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const getStatusColor = (status) => {
    const statusInfo = complaintUtils.formatStatus(status);
    return statusInfo.bgColor;
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
        <span className="text-gray-900 font-medium">My Assignments</span>
      </div>

      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              <HiClipboardDocumentList className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">My Assignments</h1>
              <p className="text-white/80">
                Complaints assigned to you by Customer Care HODs
              </p>
            </div>
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

      {/* Assignments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Assigned Complaints ({assignments.length})
        </h2>

        {assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <HiChatBubbleOvalLeftEllipsis className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submitted by: {assignment.submittedBy?.firstName}{" "}
                      {assignment.submittedBy?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Department: {assignment.department?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Assigned:{" "}
                      {new Date(
                        assignment.assignedAt || assignment.submittedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      assignment.status
                    )}`}
                  >
                    {complaintUtils.formatStatus(assignment.status).label}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                      assignment.priority
                    )}`}
                  >
                    {complaintUtils.formatPriority(assignment.priority).label}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-gray-400 hover:text-[var(--elra-primary)] transition-colors"
                      title="View Details"
                    >
                      <HiEye className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-[var(--elra-primary)] transition-colors"
                      title="Add Note"
                    >
                      <HiPencil className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <HiClipboardDocumentList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No assignments yet
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have any complaints assigned to you yet. Your HOD will
              assign complaints to you as they come in.
            </p>
            <Link
              to="/dashboard/modules/customer-care"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
            >
              <HiHome className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MyAssignments;
