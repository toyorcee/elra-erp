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
  HiArrowTrendingUp,
  HiArrowTrendingDown,
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

  // Check if user is from Customer Care department
  const isCustomerCareUser =
    user?.department?.name === "Customer Service" ||
    user?.department?.name === "Customer Care";

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch statistics
        const statsResponse = await statisticsAPI.getStatistics();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }

        // Fetch recent complaints
        const complaintsResponse = await complaintAPI.getComplaints({
          limit: 5,
          sortBy: "submittedAt",
          sortOrder: "desc",
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

  // Render different content based on user department
  if (!isCustomerCareUser) {
    return (
      <div className="space-y-6 p-4">
        {/* Header for Non-Customer Care Users */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Customer Care</h1>
          <p className="text-white/80">
            Submit complaints and get help from our Customer Care team
          </p>
        </div>

        {/* Quick Actions for Regular Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <HiPaperAirplane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Submit a Complaint
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
              <span>Submit Complaint</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
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
              Need immediate assistance? Use the floating chat button to get
              instant help from our Customer Care team.
            </p>
            <div className="text-sm text-gray-500">
              💡 Look for the chat button in the bottom-right corner of your
              screen
            </div>
          </motion.div>
        </div>

        {/* My Complaints Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            My Complaints
          </h2>
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <HiTicket className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No complaints yet
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't submitted any complaints yet. Use the button above to
              submit your first complaint.
            </p>
            <Link
              to="/dashboard/modules/customer-care/submit-complaint"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
            >
              <HiPlus className="w-5 h-5" />
              <span>Submit Your First Complaint</span>
            </Link>
          </div>
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
          Manage staff complaints and service requests
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
                {stats.totalComplaints}
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
                {stats.pendingComplaints}
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
                {stats.resolvedComplaints}
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
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/dashboard/modules/customer-care/submit-complaint"
              className="flex items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <HiPlus className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">
                  Submit Complaint
                </h3>
                <p className="text-sm text-gray-600">
                  Report an issue or concern
                </p>
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/dashboard/modules/customer-care/complaints"
              className="flex items-center p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <HiTicket className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">View Complaints</h3>
                <p className="text-sm text-gray-600">Check all complaints</p>
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/dashboard/modules/customer-care/reports"
              className="flex items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
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
          Recent Complaints
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
                    Department: {complaint.department}
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
