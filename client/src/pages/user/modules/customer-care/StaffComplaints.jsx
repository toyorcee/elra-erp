import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiPlus,
  HiTicket,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiEye,
  HiChatBubbleOvalLeftEllipsis,
  HiUser,
  HiCalendar,
  HiArrowLeft,
  HiHome,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import {
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";

const StaffComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

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
            key={complaint.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <HiTicket className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {complaint.title}
                    </h3>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{complaint.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <HiUser className="w-4 h-4" />
                      <span>Dept: {complaint.department?.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <HiCalendar className="w-4 h-4" />
                      <span>Created: {complaint.createdAt}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <HiChatBubbleOvalLeftEllipsis className="w-4 h-4" />
                      <span>Category: {complaint.category}</span>
                    </div>
                    {complaint.assignedTo && (
                      <div className="flex items-center space-x-1">
                        <HiUser className="w-4 h-4" />
                        <span>Assigned: {complaint.assignedTo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <HiEye className="w-5 h-5 text-gray-600" />
                </button>
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
    </div>
  );
};

export default StaffComplaints;
