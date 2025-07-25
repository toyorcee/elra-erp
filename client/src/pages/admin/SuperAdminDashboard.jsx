import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GradientSpinner } from "../../components/common";
import * as HiIcons from "react-icons/hi";
import {
  MdSecurity,
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdCheckCircle,
  MdError,
  MdSchedule,
  MdPerson,
  MdDocumentScanner,
  MdSettings,
  MdRefresh,
} from "react-icons/md";
import { toast } from "react-toastify";

// API functions
const fetchSystemStats = async () => {
  const response = await fetch("/api/super-admin/stats", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch system stats");
  return response.json();
};

const fetchRecentActivity = async () => {
  const response = await fetch("/api/audit/recent?limit=10", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch recent activity");
  return response.json();
};

const fetchAuditDashboard = async () => {
  const response = await fetch("/api/audit/dashboard?days=7", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch audit dashboard");
  return response.json();
};

const SuperAdminDashboard = () => {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const {
    data: systemStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["systemStats"],
    queryFn: fetchSystemStats,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recent activity
  const {
    data: recentActivity,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: fetchRecentActivity,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch audit dashboard
  const {
    data: auditDashboard,
    isLoading: auditLoading,
    error: auditError,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ["auditDashboard"],
    queryFn: fetchAuditDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchStats(), refetchActivity(), refetchAudit()]);
      setLastRefresh(new Date());
      toast.success("Dashboard refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh dashboard");
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "DOCUMENT_CREATED":
        return <MdDocumentScanner className="w-5 h-5 text-green-500" />;
      case "DOCUMENT_APPROVED":
        return <MdCheckCircle className="w-5 h-5 text-blue-500" />;
      case "DOCUMENT_REJECTED":
        return <MdError className="w-5 h-5 text-red-500" />;
      case "USER_LOGIN":
        return <MdPerson className="w-5 h-5 text-purple-500" />;
      case "USER_CREATED":
        return <MdPerson className="w-5 h-5 text-green-500" />;
      case "SETTINGS_UPDATED":
        return <MdSettings className="w-5 h-5 text-orange-500" />;
      case "DOCUMENT_DELETED":
        return <MdError className="w-5 h-5 text-red-600" />;
      default:
        return <MdSchedule className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "DOCUMENT_CREATED":
      case "USER_CREATED":
        return "text-green-600 bg-green-50";
      case "DOCUMENT_APPROVED":
        return "text-blue-600 bg-blue-50";
      case "DOCUMENT_REJECTED":
      case "DOCUMENT_DELETED":
        return "text-red-600 bg-red-50";
      case "USER_LOGIN":
        return "text-purple-600 bg-purple-50";
      case "SETTINGS_UPDATED":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (statsLoading || activityLoading || auditLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <GradientSpinner
          size="lg"
          variant="primary"
          text="Loading system stats..."
        />
      </div>
    );
  }

  // Handle errors gracefully
  if (statsError || activityError || auditError) {
    console.error("❌ Dashboard API Errors:", {
      statsError: statsError?.message,
      activityError: activityError?.message,
      auditError: auditError?.message,
    });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Failed to load dashboard data
          </div>
          <div className="text-gray-600 text-sm">
            Please refresh the page or try again later
          </div>
        </div>
      </div>
    );
  }

  const stats = systemStats?.data || {
    totalUsers: 0,
    totalDocuments: 0,
    totalDepartments: 0,
    pendingApprovals: 0,
  };

  const activity = recentActivity?.data || [];
  const auditData = auditDashboard?.data || {};

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      color: "from-blue-500 to-cyan-500",
      trend: "up",
      trendValue: "+12%",
      description: "Active system users",
    },
    {
      title: "Total Documents",
      value: stats.totalDocuments,
      color: "from-green-500 to-emerald-500",
      trend: "up",
      trendValue: "+8%",
      description: "Documents in system",
    },
    {
      title: "Departments",
      value: stats.totalDepartments,
      color: "from-purple-500 to-pink-500",
      description: "Active departments",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      color: "from-orange-500 to-red-500",
      trend: "down",
      trendValue: "-5%",
      description: "Awaiting approval",
    },
  ];

  const quickActions = [
    {
      title: "System Settings",
      description: "Configure system parameters",
      href: "/admin/settings",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Manage Departments",
      description: "Create and manage departments",
      href: "/admin/departments",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "User Management",
      description: "Manage system users",
      href: "/admin/users",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Audit Logs",
      description: "View system audit trail",
      href: "/admin/audit",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="w-10 h-10 bg-blue-400/20 rounded-lg"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Super Admin Dashboard
                </h1>
                <p className="text-slate-300 text-lg">
                  System overview and management
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
              title="Refresh dashboard"
            >
              <MdRefresh className="w-6 h-6" />
            </button>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300">System Online</span>
            </div>
            <div className="w-px h-4 bg-slate-600"></div>
            <span className="text-slate-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-lg`}
              >
                <div className="w-6 h-6 bg-white/20 rounded"></div>
              </div>
              {stat.trend && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <MdTrendingUp className="w-4 h-4" />
                  ) : (
                    <MdTrendingDown className="w-4 h-4" />
                  )}
                  {stat.trendValue}
                </div>
              )}
            </div>

            <div className="mb-2">
              <h3 className="text-2xl font-bold text-slate-800">
                {stat.value.toLocaleString()}
              </h3>
              <p className="text-slate-600 font-medium">{stat.title}</p>
            </div>

            <p className="text-sm text-slate-500">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <MdSecurity className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                Recent Activity
              </h3>
            </div>
            <span className="text-sm text-slate-500">
              {activity.length} activities
            </span>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activity.length > 0 ? (
              activity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg bg-white/50 hover:bg-white/80"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(item.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-800">
                        {item.userDetails?.name || "Unknown User"}
                      </p>
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {item.action.replace(/_/g, " ").toLowerCase()}
                    </p>
                    {item.details?.documentTitle && (
                      <p className="text-xs text-slate-500">
                        Document: {item.details.documentTitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                          item.action
                        )}`}
                      >
                        {item.resourceType}
                      </span>
                      {item.riskLevel !== "LOW" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.riskLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <MdSchedule className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & System Status */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <div className="w-5 h-5 bg-white/20 rounded"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Quick Actions
              </h3>
            </div>

            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="group p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white/50 hover:bg-white/80 block"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white shadow-md group-hover:shadow-lg transition-shadow duration-300`}
                    >
                      <div className="w-4 h-4 bg-white/20 rounded"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors text-sm">
                        {action.title}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <div className="w-5 h-5 bg-white/20 rounded"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                System Status
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">
                    Database
                  </span>
                </div>
                <span className="text-xs text-green-600">Online</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">
                    File Storage
                  </span>
                </div>
                <span className="text-xs text-blue-600">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-purple-800">
                    Email Service
                  </span>
                </div>
                <span className="text-xs text-purple-600">Connected</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-orange-800">
                    Audit Logging
                  </span>
                </div>
                <span className="text-xs text-orange-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
