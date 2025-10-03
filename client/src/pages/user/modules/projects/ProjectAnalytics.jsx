import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  FolderIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import {
  getProjectDashboard,
  getProjectBudget,
} from "../../../../services/projectAPI.js";
import { toast } from "react-toastify";
import { formatCurrency } from "../../../../utils/formatters.js";
import {
  BarChart,
  PieChart,
  LineChart,
  RadialProgress,
} from "../../../../components/graphs";

const ProjectDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [projectWallet, setProjectWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  // Access control - only Project Management HOD can access
  const isProjectManagementHOD =
    user?.department?.name === "Project Management" && user?.role?.level >= 700;
  const isSuperAdmin = user?.role?.level === 1000 || user?.isSuperadmin;

  if (!user || (!isProjectManagementHOD && !isSuperAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only Project Management HOD can access the Project Dashboard.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardResponse, budgetResponse] = await Promise.all([
        getProjectDashboard(),
        getProjectBudget(),
      ]);

      if (dashboardResponse.success) {
        setAnalytics(dashboardResponse.data);
      } else {
        toast.error("Failed to load project dashboard data");
      }

      if (budgetResponse.success) {
        setProjectWallet(budgetResponse.data);
      } else {
        console.warn("Failed to load project budget:", budgetResponse.message);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  // Calculate project wallet data - API returns data directly
  const projectWalletData = projectWallet || {
    allocated: 0,
    used: 0,
    available: 0,
    reserved: 0,
  };

  const isLowBudget = projectWalletData.isLow || false;
  const isVeryLowBudget = projectWalletData.isVeryLow || false;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Project Management Dashboard
        </h1>
        <p className="text-white/80">
          Project Management HOD dashboard - comprehensive overview of project
          performance and financial management
        </p>
      </div>

      {/* Combined Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Projects
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                {analytics?.total || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FolderIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                In Implementation
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                {analytics?.byStatus?.implementation || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Completed Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Completed Projects
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                {analytics?.byStatus?.completed || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Pending Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border border-yellow-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                Pending Approval
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-900 mt-2 break-all leading-tight">
                {(analytics?.byStatus?.pending_approval || 0) +
                  (analytics?.byStatus?.pending_project_management_approval ||
                    0) +
                  (analytics?.byStatus?.pending_legal_compliance_approval ||
                    0) +
                  (analytics?.byStatus?.pending_finance_approval || 0) +
                  (analytics?.byStatus?.pending_executive_approval || 0) +
                  (analytics?.byStatus?.pending_budget_allocation || 0) +
                  (analytics?.byStatus?.pending_procurement || 0) +
                  (analytics?.byStatus?.resubmitted || 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
              <ClockIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Total Budget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Total Budget
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                {formatCurrency(analytics?.totalBudget || 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Project Wallet Status */}
      {projectWallet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-xl shadow-lg border p-6 ${
            isVeryLowBudget
              ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
              : isLowBudget
              ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
              : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-xl ${
                  isVeryLowBudget
                    ? "bg-gradient-to-br from-red-500 to-red-600"
                    : isLowBudget
                    ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                    : "bg-gradient-to-br from-green-500 to-green-600"
                }`}
              >
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Project Wallet Status
                </h3>
                <p className="text-sm text-gray-600">
                  Available funds for project expenses and implementations
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isVeryLowBudget
                  ? "bg-red-100 text-red-800"
                  : isLowBudget
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {isVeryLowBudget ? "Very Low" : isLowBudget ? "Low" : "Healthy"}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            {/* Center radial progress - Used % of allocated */}
            <div className="lg:col-span-2 order-last lg:order-none flex items-center justify-center">
              <RadialProgress
                percentage={
                  projectWalletData.allocated > 0
                    ? (projectWalletData.used / projectWalletData.allocated) *
                      100
                    : 0
                }
                size={160}
                strokeWidth={14}
                progressColor={
                  isVeryLowBudget
                    ? "#DC2626"
                    : isLowBudget
                    ? "#D97706"
                    : "#0d6449"
                }
                label={`of allocated budget used`}
              />
            </div>

            {/* Stats */}
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Available
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  isVeryLowBudget
                    ? "text-red-600"
                    : isLowBudget
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {formatCurrency(projectWalletData.available)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Used
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(projectWalletData.used)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Reserved
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(projectWalletData.reserved)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Total
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(projectWalletData.allocated)}
              </p>
            </div>
          </div>

          {isLowBudget && (
            <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">⚠️ Low Budget Alert:</span>{" "}
                Available project funds are below ₦5M threshold. Contact Finance
                HOD to allocate more funds to the project budget category.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Project Status Overview
            </h3>
          </div>

          <div className="space-y-4">
            {analytics?.byStatus &&
              Object.entries(analytics.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        status === "implementation" ||
                        status === "in_progress" ||
                        status === "active"
                          ? "bg-green-500"
                          : status === "approved"
                          ? "bg-blue-500"
                          : status.includes("pending")
                          ? "bg-yellow-500"
                          : status === "completed"
                          ? "bg-purple-500"
                          : status === "rejected" || status === "cancelled"
                          ? "bg-red-500"
                          : status === "on_hold"
                          ? "bg-orange-500"
                          : status === "planning"
                          ? "bg-indigo-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-gray-600 capitalize">
                      {status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Priority Distribution
            </h3>
          </div>

          <div className="space-y-4">
            {analytics?.byPriority &&
              Object.entries(analytics.byPriority).map(([priority, count]) => (
                <div
                  key={priority}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        priority === "critical"
                          ? "bg-red-500"
                          : priority === "urgent"
                          ? "bg-red-600"
                          : priority === "high"
                          ? "bg-orange-500"
                          : priority === "medium"
                          ? "bg-yellow-500"
                          : priority === "low"
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-gray-600 capitalize">{priority}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Project Performance Analytics
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Pie Chart */}
          <div>
            <PieChart
              data={{
                labels: Object.keys(analytics?.byStatus || {}).map((status) =>
                  status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                ),
                datasets: [
                  {
                    data: Object.values(analytics?.byStatus || {}),
                  },
                ],
              }}
              title="Project Status Distribution"
              height={300}
              colors={[
                "#3B82F6",
                "#10B981",
                "#F59E0B",
                "#EF4444",
                "#8B5CF6",
                "#6B7280",
              ]}
            />
          </div>

          {/* Priority vs Status Bar Chart */}
          <div>
            <BarChart
              data={{
                labels: Object.keys(analytics?.byPriority || {}).map(
                  (priority) =>
                    priority.charAt(0).toUpperCase() + priority.slice(1)
                ),
                datasets: [
                  {
                    label: "Projects",
                    data: Object.values(analytics?.byPriority || {}),
                  },
                ],
              }}
              title="Priority Distribution"
              height={300}
              colors={["#DC2626", "#EF4444", "#F59E0B", "#EAB308", "#10B981"]}
            />
          </div>
        </div>
      </motion.div>

      {/* Department Breakdown */}
      {analytics?.departmentBreakdown &&
        Object.keys(analytics.departmentBreakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Department Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics.departmentBreakdown).map(
                ([dept, data]) => (
                  <div
                    key={dept}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-3">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="font-semibold text-gray-900">{dept}</h3>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {data.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Object.entries(data.byStatus || {}).map(
                        ([status, count]) => (
                          <div key={status} className="flex justify-between">
                            <span className="capitalize">
                              {status.replace(/_/g, " ")}
                            </span>
                            <span>{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}

      {/* Recent Projects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Recent Projects
        </h3>

        <div className="space-y-4">
          {analytics?.recentProjects && analytics.recentProjects.length > 0 ? (
            analytics.recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-2 rounded-lg ${
                      project.status === "implementation" ||
                      project.status === "in_progress" ||
                      project.status === "active"
                        ? "bg-green-100 text-green-600"
                        : project.status === "approved"
                        ? "bg-blue-100 text-blue-600"
                        : project.status.includes("pending")
                        ? "bg-yellow-100 text-yellow-600"
                        : project.status === "completed"
                        ? "bg-purple-100 text-purple-600"
                        : project.status === "rejected" ||
                          project.status === "cancelled"
                        ? "bg-red-100 text-red-600"
                        : project.status === "on_hold"
                        ? "bg-orange-100 text-orange-600"
                        : project.status === "planning"
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {project.status === "implementation" ||
                    project.status === "in_progress" ||
                    project.status === "active" ? (
                      <WrenchScrewdriverIcon className="h-5 w-5" />
                    ) : project.status === "approved" ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : project.status.includes("pending") ? (
                      <ClockIcon className="h-5 w-5" />
                    ) : project.status === "completed" ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : project.status === "rejected" ||
                      project.status === "cancelled" ? (
                      <XCircleIcon className="h-5 w-5" />
                    ) : project.status === "on_hold" ? (
                      <ExclamationTriangleIcon className="h-5 w-5" />
                    ) : (
                      <DocumentTextIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {project.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {project.code} • {project.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(project.budget)}
                    </p>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      project.status === "implementation" ||
                      project.status === "in_progress" ||
                      project.status === "active"
                        ? "bg-green-100 text-green-800"
                        : project.status === "approved"
                        ? "bg-blue-100 text-blue-800"
                        : project.status.includes("pending")
                        ? "bg-yellow-100 text-yellow-800"
                        : project.status === "completed"
                        ? "bg-purple-100 text-purple-800"
                        : project.status === "rejected" ||
                          project.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : project.status === "on_hold"
                        ? "bg-orange-100 text-orange-800"
                        : project.status === "planning"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {project.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent projects found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectDashboard;
