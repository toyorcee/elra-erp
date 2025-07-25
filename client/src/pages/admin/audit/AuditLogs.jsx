import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GradientSpinner,
  StatCard,
} from "../../../components/common";
import auditService from "../../../services/audit.js";
import {
  MdSearch,
  MdFilterList,
  MdDownload,
  MdDelete,
  MdRefresh,
  MdSecurity,
  MdWarning,
  MdCheckCircle,
  MdError,
  MdSchedule,
  MdPerson,
  MdDocumentScanner,
  MdSettings,
  MdTrendingUp,
  MdTrendingDown,
} from "react-icons/md";
import { toast } from "react-toastify";

const AuditLogs = () => {
  const [filters, setFilters] = useState({
    action: "",
    resourceType: "",
    riskLevel: "",
    userId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });

  const [selectedLogs, setSelectedLogs] = useState([]);

  // Fetch audit logs
  const {
    data: auditData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auditLogs", filters],
    queryFn: () => auditService.getAuditLogs(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch audit stats
  const {
    data: statsData,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["auditStats", filters],
    queryFn: () => auditService.getActivityStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleExport = async () => {
    try {
      const blob = await auditService.exportAuditLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Audit logs exported successfully");
    } catch (error) {
      toast.error("Failed to export audit logs");
    }
  };

  const handleCleanLogs = async () => {
    if (!window.confirm("Are you sure you want to clean old audit logs? This action cannot be undone.")) {
      return;
    }

    try {
      await auditService.cleanOldLogs(90);
      toast.success("Old audit logs cleaned successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to clean old audit logs");
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

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <GradientSpinner
          size="lg"
          variant="primary"
          text="Loading audit logs..."
        />
      </div>
    );
  }

  const logs = auditData?.data || [];
  const stats = statsData?.data || {};
  const pagination = auditData?.pagination || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <MdSecurity className="w-10 h-10 text-purple-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Audit Logs</h1>
                <p className="text-slate-300 text-lg">
                  System activity monitoring and compliance tracking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                title="Export logs"
              >
                <MdDownload className="w-6 h-6" />
              </button>
              <button
                onClick={handleCleanLogs}
                className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                title="Clean old logs"
              >
                <MdDelete className="w-6 h-6" />
              </button>
              <button
                onClick={() => refetch()}
                className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                title="Refresh"
              >
                <MdRefresh className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Activities"
          value={stats.totalActivities || 0}
          icon="MdSecurity"
          color="from-purple-500 to-pink-500"
          trend={stats.activityTrend}
          trendValue={stats.activityChange}
        />
        <StatCard
          title="High Risk Events"
          value={stats.highRiskEvents || 0}
          icon="MdWarning"
          color="from-red-500 to-pink-500"
          trend={stats.riskTrend}
          trendValue={stats.riskChange}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers || 0}
          icon="MdPerson"
          color="from-blue-500 to-cyan-500"
          trend={stats.userTrend}
          trendValue={stats.userChange}
        />
        <StatCard
          title="Documents Processed"
          value={stats.documentsProcessed || 0}
          icon="MdDocumentScanner"
          color="from-green-500 to-emerald-500"
          trend={stats.documentTrend}
          trendValue={stats.documentChange}
        />
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <MdFilterList className="w-6 h-6 text-slate-600" />
          <h3 className="text-xl font-bold text-slate-800">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="DOCUMENT_CREATED">Document Created</option>
              <option value="DOCUMENT_APPROVED">Document Approved</option>
              <option value="DOCUMENT_REJECTED">Document Rejected</option>
              <option value="DOCUMENT_DELETED">Document Deleted</option>
              <option value="USER_LOGIN">User Login</option>
              <option value="USER_CREATED">User Created</option>
              <option value="SETTINGS_UPDATED">Settings Updated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Resource Type
            </label>
            <select
              value={filters.resourceType}
              onChange={(e) => handleFilterChange("resourceType", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Resources</option>
              <option value="DOCUMENT">Document</option>
              <option value="USER">User</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Risk Level
            </label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            Audit Logs ({pagination.total || 0})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                  Action
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                  User
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                  Resource
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                  Risk Level
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log._id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.action)}
                      <div>
                        <p className="font-medium text-slate-800">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-slate-500">
                          {log.resourceType}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-slate-800">
                        {log.userDetails?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {log.userDetails?.email || log.userId}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-slate-800">
                        {log.resourceId || "N/A"}
                      </p>
                      {log.details?.documentTitle && (
                        <p className="text-sm text-slate-500">
                          {log.details.documentTitle}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(
                        log.riskLevel
                      )}`}
                    >
                      {log.riskLevel}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-slate-600">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-slate-500">
                      {log.ipAddress || "N/A"}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange("page", pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handleFilterChange("page", pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs; 