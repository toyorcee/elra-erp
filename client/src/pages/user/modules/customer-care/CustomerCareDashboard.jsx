import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiChatBubbleLeftRight,
  HiExclamationTriangle,
  HiCheckCircle,
  HiClock,
  HiUserGroup,
  HiDocumentText,
  HiPlus,
  HiTicket,
  HiChatBubbleOvalLeftEllipsis,
  HiChartBar,
  HiPaperAirplane,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  statisticsAPI,
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";

const CustomerCareDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    averageResolutionTime: 0,
    highPriority: 0,
    overdue: 0,
    resolutionRate: 0,
    satisfactionRating: 0,
  });

  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const isCustomerCareUser =
    user?.department?.name === "Customer Service" ||
    user?.department?.name === "Customer Care";

  const isHOD = user?.role?.level >= 700;
  const isManager = user?.role?.level >= 600;
  const isStaff = user?.role?.level >= 300;
  const isViewer = user?.role?.level >= 100;
  const canHandleComplaints = user?.role?.level >= 300; // Only staff level and above can handle complaints

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const statsResponse = await statisticsAPI.getStatistics();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }

        const complaintsResponse = await complaintAPI.getComplaints({
          limit: 5,
          sortBy: "submittedAt",
          sortOrder: "desc",
          submittedByMe: !isCustomerCareUser && !isHOD,
        });
        if (complaintsResponse.success) {
          setRecentComplaints(complaintsResponse.data.complaints);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (!isCustomerCareUser) {
    return (
      <div className="space-y-6 p-4">
        {/* Header for Non-Customer Care Users */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Customer Care</h1>
          <p className="text-white/80">
            {isHOD
              ? "Monitor department complaints and service requests"
              : "Submit complaints and get help from our Customer Care team"}
          </p>
        </div>

        {/* Stats Cards for Regular Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* My Complaints Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                  {isHOD ? "Department Complaints" : "My Complaints"}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">
                  {recentComplaints.length}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {isHOD ? "Total in department" : "Total submitted"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <HiDocumentText className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Pending Complaints */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border border-yellow-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                  Pending
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-900 mt-2">
                  {
                    recentComplaints.filter((c) => c.status === "pending")
                      .length
                  }
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  {isHOD ? "Department pending" : "Awaiting response"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                <HiClock className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* In Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                  In Progress
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2">
                  {
                    recentComplaints.filter((c) => c.status === "in_progress")
                      .length
                  }
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  {isHOD ? "Department in progress" : "Being handled"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <HiExclamationTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Resolved */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                  Resolved
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2">
                  {
                    recentComplaints.filter((c) => c.status === "resolved")
                      .length
                  }
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {isHOD ? "Department resolved" : "Successfully closed"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <HiCheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions for Regular Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <HiPaperAirplane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Make a Complaint
                </h3>
                <p className="text-gray-600">Report an issue or concern</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Have a complaint or issue? Submit it through our easy-to-use form
              and get help from our Customer Care team.
            </p>
            <Link
              to="/dashboard/modules/customer-care/submit-complaint"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
            >
              <HiPlus className="w-5 h-5" />
              <span>Make Complaint</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <HiChatBubbleLeftRight className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Live Chat</h3>
                <p className="text-gray-600">Get instant help</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Need immediate assistance? Get instant help from our Customer Care
              team.
            </p>
            <button
              onClick={() => {
                const chatButton = document.querySelector("[data-chat-button]");
                if (chatButton) {
                  chatButton.click();
                }
              }}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
            >
              <HiChatBubbleLeftRight className="w-5 h-5" />
              <span>Start Live Chat</span>
            </button>
          </motion.div>
        </div>

        {/* My Complaints Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {isHOD ? "Recent Department Complaints" : "Recent Complaints"}
            </h2>
            <Link
              to="/dashboard/modules/customer-care/my-complaints"
              className="text-sm text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium"
            >
              View All →
            </Link>
          </div>
          {recentComplaints.length > 0 ? (
            <div className="space-y-3">
              {recentComplaints.slice(0, 3).map((complaint) => (
                <motion.div
                  key={complaint._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {complaint.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {complaint.complaintNumber} •{" "}
                      {new Date(complaint.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      complaint.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : complaint.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : complaint.status === "resolved"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {complaintUtils.formatStatus(complaint.status).label}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
                <HiTicket className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No complaints yet
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any complaints yet. Use the button above
                to submit your first complaint.
              </p>
              <Link
                to="/dashboard/modules/customer-care/submit-complaint"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                <HiPlus className="w-5 h-5" />
                <span>Make Your First Complaint</span>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header for Customer Care Users */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Customer Care Dashboard</h1>
        <p className="text-white/80">
          {isHOD
            ? "Manage team assignments and oversee complaint resolution"
            : canHandleComplaints
            ? "Handle assigned complaints and manage customer service requests"
            : "View customer care data and reports (Viewer access)"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Complaints
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                {stats.total || stats.totalComplaints}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <HiDocumentText className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Pending Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border border-yellow-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                Pending
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-900 mt-2 break-all leading-tight">
                {stats.pending || stats.pendingComplaints}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
              <HiClock className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Resolved Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Resolved
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                {stats.resolved || stats.resolvedComplaints}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <HiCheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Average Resolution Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Avg. Resolution
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                {stats.averageResolutionTime} days
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <HiUserGroup className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* All Complaints - Available to all Customer Care users */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/dashboard/modules/customer-care/complaints"
              className="flex items-center p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <HiTicket className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">All Complaints</h3>
                <p className="text-sm text-gray-600">
                  View all staff complaints
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Complaint Management - Only for staff level and above (not viewers) */}
          {canHandleComplaints && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/dashboard/modules/customer-care/management"
                className="flex items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <HiChatBubbleOvalLeftEllipsis className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    Complaint Management
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage complaint status and assignments
                  </p>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Assign Complaints - Only for HODs */}
          {isHOD && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/dashboard/modules/customer-care/assign-complaints"
                className="flex items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <HiUserGroup className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    Assign Complaints
                  </h3>
                  <p className="text-sm text-gray-600">
                    Assign complaints to team members
                  </p>
                </div>
              </Link>
            </motion.div>
          )}

          {/* My Assignments - Only for non-HOD Customer Care staff (level 300-699) */}
          {canHandleComplaints && !isHOD && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/dashboard/modules/customer-care/assignments"
                className="flex items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <HiDocumentText className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    My Assignments
                  </h3>
                  <p className="text-sm text-gray-600">
                    View complaints assigned to you
                  </p>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Reports - Available to all Customer Care users */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/dashboard/modules/customer-care/reports"
              className="flex items-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <HiChartBar className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Reports</h3>
                <p className="text-sm text-gray-600">
                  View analytics and reports
                </p>
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Complaints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {isHOD
            ? "Recent Department Complaints"
            : canHandleComplaints
            ? "Recent Assigned Complaints"
            : "Recent Complaints (View Only)"}
        </h2>
        <div className="space-y-4">
          {recentComplaints.map((complaint, index) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <HiChatBubbleOvalLeftEllipsis className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {complaint.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Department: {complaint.department?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {complaint.createdAt}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
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
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerCareDashboard;
