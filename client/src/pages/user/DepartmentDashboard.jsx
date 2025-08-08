import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { searchDocuments } from "../../services/documents";
import { getRecentActivities } from "../../services/audit";
import { getDashboard } from "../../services/dashboard";
import { canViewDocuments, canAccessSettings } from "../../constants/userRoles";
import {
  MdFolder,
  MdSecurity,
  MdPending,
  MdCheckCircle,
  MdTrendingUp,
  MdTrendingDown,
  MdAssignment,
  MdComputer,
  MdAccessTime,
  MdArrowForward,
  MdDescription,
} from "react-icons/md";
import { motion } from "framer-motion";

const DepartmentDashboard = () => {
  const { user } = useAuth();

  // Permission checks using centralized constants
  const hasViewPermission = canViewDocuments(user);
  const hasSettingsPermission = canAccessSettings(user);

  // Department-specific configuration with dynamic data
  const departmentConfig = {
    CLAIMS: {
      name: "Claims Department",
      icon: MdAssignment,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      accentColor: "blue",
      description: "Manage insurance claims and policy documents",
      getMetrics: (data) => [
        {
          label: "Total Claims",
          value: data?.totalDocuments || "0",
          change: "0%",
          trend: "neutral",
          icon: MdAssignment,
        },
        {
          label: "Pending Reviews",
          value: data?.pendingApprovals || "0",
          change: "0%",
          trend: "neutral",
          icon: MdPending,
        },
        {
          label: "Approved Claims",
          value:
            data?.documentsByStatus?.find((s) => s._id === "APPROVED")?.count ||
            "0",
          change: "0%",
          trend: "neutral",
          icon: MdCheckCircle,
        },
        {
          label: "Recent Activity",
          value: (recentActivity?.length || 0).toString(),
          change: "0%",
          trend: "neutral",
          icon: MdAccessTime,
        },
      ],
      quickActions: [
        {
          label: "View Documents",
          icon: MdFolder,
          path: "/dashboard/documents",
          color: "from-green-500 to-emerald-500",
        },
        {
          label: "Settings",
          icon: MdSecurity,
          path: "/dashboard/settings",
          color: "from-orange-500 to-red-500",
        },
      ],
    },
    IT: {
      name: "IT Department",
      icon: MdComputer,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
      accentColor: "purple",
      description: "Manage IT infrastructure and technical documents",
      getMetrics: (data) => [
        {
          label: "Total Documents",
          value: data?.totalDocuments || "0",
          change: "0%",
          trend: "neutral",
          icon: MdFolder,
        },
        {
          label: "Pending Reviews",
          value: data?.pendingApprovals || "0",
          change: "0%",
          trend: "neutral",
          icon: MdPending,
        },
        {
          label: "Approved Items",
          value:
            data?.documentsByStatus?.find((s) => s._id === "APPROVED")?.count ||
            "0",
          change: "0%",
          trend: "neutral",
          icon: MdCheckCircle,
        },
        {
          label: "Recent Activity",
          value: (recentActivity?.length || 0).toString(),
          change: "0%",
          trend: "neutral",
          icon: MdAccessTime,
        },
      ],
      quickActions: [
        {
          label: "View Documents",
          icon: MdFolder,
          path: "/dashboard/documents",
          color: "from-green-500 to-emerald-500",
        },
        {
          label: "Settings",
          icon: MdSecurity,
          path: "/dashboard/settings",
          color: "from-orange-500 to-red-500",
        },
      ],
    },
  };

  const currentDept = departmentConfig[user?.department?.code] || {
    name: "Dashboard",
    icon: MdFolder,
    color: "from-gray-500 to-gray-700",
    bgColor: "from-gray-50 to-gray-100",
    accentColor: "gray",
    description: "Welcome to your dashboard",
    getMetrics: (data) => [
      {
        label: "Total Documents",
        value: data?.totalDocuments || "0",
        change: "0%",
        trend: "neutral",
        icon: MdFolder,
      },
      {
        label: "Pending Reviews",
        value: data?.pendingApprovals || "0",
        change: "0%",
        trend: "neutral",
        icon: MdPending,
      },
      {
        label: "Approved Items",
        value:
          data?.documentsByStatus?.find((s) => s._id === "APPROVED")?.count ||
          "0",
        change: "0%",
        trend: "neutral",
        icon: MdCheckCircle,
      },
      {
        label: "Recent Activity",
        value: (recentActivity?.length || 0).toString(),
        change: "0%",
        trend: "neutral",
        icon: MdAccessTime,
      },
    ],
    quickActions: [
      ...(hasViewPermission
        ? [
            {
              label: "View Documents",
              icon: MdFolder,
              path: "/dashboard/documents",
              color: "from-green-500 to-emerald-500",
            },
          ]
        : []),
      ...(hasSettingsPermission
        ? [
            {
              label: "Settings",
              icon: MdSecurity,
              path: "/dashboard/settings",
              color: "from-orange-500 to-red-500",
            },
          ]
        : []),
    ],
  };

  const DeptIcon = currentDept.icon;

  // Fetch recent documents
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ["recent-documents", user?.department?.code],
    queryFn: () => {
      const params = {
        page: 1,
        limit: 5,
        sortBy: "uploadedAt",
        sortOrder: "desc",
        department: user?.department?.code || undefined,
      };
      return searchDocuments(params);
    },
    enabled: !!user?.department?.code,
  });

  const recentDocuments = documentsData?.data?.documents || [];

  // Fetch dashboard data for metrics
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard-data", user?.department?.code],
    queryFn: () => getDashboard(),
    enabled: !!user?.department?.code,
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity", user?.department?.code, user?._id],
    queryFn: () => {
      const params = {
        limit: 8,
        department: user?.department?.code || undefined,
        userId: user?._id || undefined,
        sortBy: "timestamp",
        sortOrder: "desc",
      };
      return getRecentActivities(params);
    },
    enabled: !!user?.department?.code && !!user?._id,
  });

  const recentActivity = activityData?.data || [];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <MdTrendingUp className="text-green-500" size={20} />;
      case "down":
        return <MdTrendingDown className="text-red-500" size={20} />;
      default:
        return <MdTrendingUp className="text-gray-500" size={20} />;
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case "DOCUMENT_CREATED":
      case "DOCUMENT_UPLOADED":
        return <MdDescription className="text-blue-500" size={20} />;
      case "DOCUMENT_APPROVED":
      case "APPROVED":
        return <MdCheckCircle className="text-green-500" size={20} />;
      case "DOCUMENT_REJECTED":
      case "REJECTED":
        return <MdTrendingDown className="text-red-500" size={20} />;
      case "DOCUMENT_REVIEWED":
      case "REVIEWED":
        return <MdAssignment className="text-purple-500" size={20} />;
      case "USER_LOGIN":
      case "LOGIN":
        return <MdSecurity className="text-orange-500" size={20} />;
      case "USER_CREATED":
      case "USER_REGISTRATION":
        return <MdCheckCircle className="text-green-500" size={20} />;
      case "SETTINGS_UPDATED":
        return <MdSecurity className="text-orange-500" size={20} />;
      case "DOCUMENT_DELETED":
        return <MdTrendingDown className="text-red-500" size={20} />;
      default:
        return <MdAccessTime className="text-gray-500" size={20} />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${currentDept.color} text-white shadow-lg`}
              >
                <DeptIcon size={28} />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {currentDept.name} Dashboard
                </h1>
                <p className="text-gray-600 mt-1">{currentDept.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentDept
            .getMetrics(dashboardData?.data || {})
            .map((metric, index) => {
              const MetricIcon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200">
                      <MetricIcon size={24} className="text-gray-600" />
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      {metric.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">
                      {metric.value}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          metric.trend === "up"
                            ? "text-green-600"
                            : metric.trend === "down"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {metric.change}
                      </span>
                      <span className="text-sm text-gray-500">
                        from last month
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="space-y-4">
                {currentDept.quickActions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.path}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-white border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <ActionIcon size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {action.label}
                        </h3>
                        <p className="text-sm text-gray-600">Quick access</p>
                      </div>
                      <MdArrowForward
                        className="text-gray-400 group-hover:text-gray-600 transition-colors"
                        size={20}
                      />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Recent Documents */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Documents
                </h2>
                <Link
                  to="/dashboard/documents"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 transition-colors"
                >
                  View All
                  <MdArrowForward size={16} />
                </Link>
              </div>

              {documentsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : recentDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📄</div>
                  <p className="text-gray-600 mb-4">No recent documents</p>
                  <p className="text-sm text-gray-500">
                    Documents will appear here once they are uploaded
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDocuments.map((document, index) => (
                    <motion.div
                      key={document._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-white border border-gray-200 hover:border-gray-300 transition-all duration-300"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                        <MdDescription size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {document.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(document.uploadedAt).toLocaleDateString()} •{" "}
                          {document.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            document.status === "approved"
                              ? "bg-green-100 text-green-600"
                              : document.status === "pending"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {document.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-8 bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={activity._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-white border border-gray-200 hover:border-gray-300 transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {typeof activity.details === "string"
                        ? activity.details
                        : activity.details?.description ||
                          activity.action ||
                          "No details available"}
                    </p>
                    <p className="text-sm text-gray-600">
                      by {activity.userName || "System"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
