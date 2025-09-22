import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineClipboardDocument,
  HiOutlineCalendar,
  HiOutlineDocumentCheck,
  HiOutlineUser,
} from "react-icons/hi2";
import { HiTrendingUp, HiTrendingDown } from "react-icons/hi";

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [analyticsData, setAnalyticsData] = useState({
    teamSize: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingApprovals: 0,
    leaveRequests: 0,
    budgetUtilization: 0,
    projectSuccessRate: 0,
    teamProductivity: 0,
    monthlyTrends: [],
    projectStatus: [],
    leaveDistribution: [],
    payrollAnalytics: {
      totalPayrollCost: 0,
      employeeCount: 0,
      averageSalary: 0,
      payrollRuns: 0,
      frequencyBreakdown: {
        monthly: 0,
        quarterly: 0,
        yearly: 0,
        one_time: 0,
      },
    },
    budgetAllocationBreakdown: {
      withAllocation: 0,
      withoutAllocation: 0,
    },
    userAnalytics: {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      pendingRegistration: 0,
      suspendedUsers: 0,
      pendingOffboarding: 0,
      roleDistribution: {
        hod: 0,
        manager: 0,
        staff: 0,
        viewer: 0,
      },
    },
  });

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async (period = selectedPeriod) => {
    try {
      setLoading(true);
      console.log("📊 [Analytics] Fetching real analytics data...");

      if (!user?.department?._id) {
        console.error("❌ [Analytics] No department found for user");
        return;
      }

      // Fetch both analytics and user data
      const [analyticsResponse, usersResponse] = await Promise.all([
        fetch(
          `/api/analytics/department/${user.department._id}?period=${period}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            credentials: "include",
          }
        ),
        fetch("/api/users/department", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include",
        }),
      ]);

      if (!analyticsResponse.ok) {
        throw new Error(`HTTP error! status: ${analyticsResponse.status}`);
      }

      const analyticsResult = await analyticsResponse.json();
      let userAnalytics = {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        pendingRegistration: 0,
        suspendedUsers: 0,
        pendingOffboarding: 0,
        roleDistribution: {
          hod: 0,
          manager: 0,
          staff: 0,
          viewer: 0,
        },
      };

      // Process user data if available
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        if (usersResult.success && usersResult.data) {
          const users = usersResult.data;
          userAnalytics = {
            totalUsers: users.length,
            activeUsers: users.filter((u) => u.status === "ACTIVE").length,
            inactiveUsers: users.filter((u) => u.status === "INACTIVE").length,
            pendingRegistration: users.filter(
              (u) => u.status === "PENDING_REGISTRATION"
            ).length,
            suspendedUsers: users.filter((u) => u.status === "SUSPENDED")
              .length,
            pendingOffboarding: users.filter(
              (u) => u.status === "PENDING_OFFBOARDING"
            ).length,
            roleDistribution: {
              hod: users.filter((u) => u.role?.level === 700).length,
              manager: users.filter((u) => u.role?.level === 600).length,
              staff: users.filter((u) => u.role?.level === 300).length,
              viewer: users.filter((u) => u.role?.level === 100).length,
            },
          };
        }
      }

      if (analyticsResult.success) {
        console.log(
          "✅ [Analytics] Successfully fetched analytics data:",
          analyticsResult.data
        );
        setAnalyticsData({
          ...analyticsResult.data,
          userAnalytics,
        });
      } else {
        throw new Error(
          analyticsResult.message || "Failed to fetch analytics data"
        );
      }
    } catch (error) {
      console.error("❌ [Analytics] Error fetching analytics:", error);
      setError(error.message || "Failed to fetch analytics data");
      setAnalyticsData({
        teamSize: 0,
        activeProjects: 0,
        completedProjects: 0,
        pendingApprovals: 0,
        leaveRequests: 0,
        budgetUtilization: 0,
        projectSuccessRate: 0,
        teamProductivity: 0,
        monthlyTrends: [],
        projectStatus: [],
        leaveDistribution: [],
        payrollAnalytics: {
          totalPayrollCost: 0,
          employeeCount: 0,
          averageSalary: 0,
          payrollRuns: 0,
          frequencyBreakdown: {
            monthly: 0,
            quarterly: 0,
            yearly: 0,
            one_time: 0,
          },
        },
        budgetAllocationBreakdown: {
          withAllocation: 0,
          withoutAllocation: 0,
        },
        userAnalytics: {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          pendingRegistration: 0,
          suspendedUsers: 0,
          pendingOffboarding: 0,
          roleDistribution: {
            hod: 0,
            manager: 0,
            staff: 0,
            viewer: 0,
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "bg-blue-500",
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && trend !== null && (
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <HiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <HiTrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm ${
                  trend > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {Math.abs(trend).toFixed(1)}% from previous period
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  if (!user || user.role.level < 700) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h1>
            <p className="text-red-600">
              You don't have permission to access this page. Only Department
              Heads (HODs) can view department analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Analytics Error
            </h1>
            <p className="text-red-600 mb-4">
              Failed to load analytics data: {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                fetchAnalyticsData();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    fetchAnalyticsData(newPeriod);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Department Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into {user.department?.name} department
            performance, team productivity, and project metrics.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Team Size"
            value={analyticsData.teamSize}
            icon={HiOutlineUsers}
            color="bg-blue-500"
            trend={analyticsData.trends?.teamSize}
          />
          <StatCard
            title="Active Users"
            value={analyticsData.userAnalytics?.activeUsers || 0}
            icon={HiOutlineUser}
            color="bg-emerald-500"
            trend={analyticsData.trends?.activeUsers}
          />
          <StatCard
            title="Active Projects"
            value={analyticsData.activeProjects}
            icon={HiOutlineClipboardDocument}
            color="bg-green-500"
            trend={analyticsData.trends?.activeProjects}
          />
          <StatCard
            title="Pending Approvals"
            value={analyticsData.pendingApprovals}
            icon={HiOutlineCalendar}
            color="bg-yellow-500"
            trend={analyticsData.trends?.pendingApprovals}
          />
          <StatCard
            title="Success Rate"
            value={`${analyticsData.projectSuccessRate}%`}
            icon={HiOutlineChartBar}
            color="bg-purple-500"
            trend={analyticsData.trends?.completedProjects}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Project Status Distribution */}
          <ChartCard title="Project Status Distribution">
            <div className="space-y-4">
              {analyticsData.projectStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${item.color} mr-3`}
                    ></div>
                    <span className="text-sm text-gray-700">{item.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                      {item.count}
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                        style={{
                          width: `${Math.min(
                            (item.count /
                              Math.max(
                                ...analyticsData.projectStatus.map(
                                  (s) => s.count
                                )
                              )) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Leave Distribution */}
          <ChartCard title="Leave Request Distribution">
            <div className="space-y-4">
              {analyticsData.leaveDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${item.color} mr-3`}
                    ></div>
                    <span className="text-sm text-gray-700">{item.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                      {item.count}
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                        style={{
                          width: `${Math.min(
                            (item.count /
                              Math.max(
                                ...analyticsData.leaveDistribution.map(
                                  (l) => l.count
                                )
                              )) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Budget Allocation Breakdown */}
          <ChartCard title="Budget Allocation Breakdown">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm text-gray-700">
                    With Budget Allocation
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.budgetAllocationBreakdown?.withAllocation ||
                      0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.budgetAllocationBreakdown
                            ?.withAllocation || 0) /
                            Math.max(
                              analyticsData.budgetAllocationBreakdown
                                ?.withAllocation || 0,
                              analyticsData.budgetAllocationBreakdown
                                ?.withoutAllocation || 0,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-sm text-gray-700">
                    Without Budget Allocation
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.budgetAllocationBreakdown
                      ?.withoutAllocation || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.budgetAllocationBreakdown
                            ?.withoutAllocation || 0) /
                            Math.max(
                              analyticsData.budgetAllocationBreakdown
                                ?.withAllocation || 0,
                              analyticsData.budgetAllocationBreakdown
                                ?.withoutAllocation || 0,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Payroll Frequency Breakdown */}
          <ChartCard title="Payroll Frequency Breakdown">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Monthly</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analyticsData.payrollAnalytics?.frequencyBreakdown
                    ?.monthly || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Quarterly</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analyticsData.payrollAnalytics?.frequencyBreakdown
                    ?.quarterly || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Yearly</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analyticsData.payrollAnalytics?.frequencyBreakdown?.yearly ||
                    0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-500 mr-3"></div>
                  <span className="text-sm text-gray-700">One Time</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analyticsData.payrollAnalytics?.frequencyBreakdown
                    ?.one_time || 0}
                </span>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trends */}
          <ChartCard title="Monthly Project Trends" className="lg:col-span-2">
            {/* Time Period Selector */}
            <div className="flex justify-end items-center space-x-3 mb-4">
              <label className="text-sm font-medium text-gray-700">
                Time Period:
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="current">Current Year</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analyticsData.monthlyTrends.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-100 rounded-t-lg relative">
                    <div
                      className="bg-blue-500 rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${
                          (item.projects /
                            Math.max(
                              ...analyticsData.monthlyTrends.map(
                                (t) => t.projects
                              )
                            )) *
                          100
                        }%`,
                      }}
                    ></div>
                    <div
                      className="bg-green-500 rounded-t-lg absolute bottom-0 w-full transition-all duration-500"
                      style={{
                        height: `${
                          (item.completion /
                            Math.max(
                              ...analyticsData.monthlyTrends.map(
                                (t) => t.completion
                              )
                            )) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">
                    {item.month}
                  </span>
                  {item.year && (
                    <span className="text-xs text-gray-400">{item.year}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Total Projects</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ChartCard title="Budget Utilization">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-blue-500"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${
                      2 *
                      Math.PI *
                      30 *
                      (1 - analyticsData.budgetUtilization / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {analyticsData.budgetUtilization}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                of allocated budget used
              </p>
            </div>
          </ChartCard>

          <ChartCard title="Team Productivity">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-green-500"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${
                      2 *
                      Math.PI *
                      30 *
                      (1 - analyticsData.teamProductivity / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {analyticsData.teamProductivity}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                overall team efficiency
              </p>
            </div>
          </ChartCard>

          <ChartCard title="Project Success Rate">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-purple-500"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${
                      2 *
                      Math.PI *
                      30 *
                      (1 - analyticsData.projectSuccessRate / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {analyticsData.projectSuccessRate}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                projects completed successfully
              </p>
            </div>
          </ChartCard>

          <ChartCard title="Payroll Analytics">
            <div className="text-center">
              <div className="space-y-2">
                <div className="text-lg font-bold text-gray-900">
                  ₦
                  {analyticsData.payrollAnalytics?.totalPayrollCost?.toLocaleString() ||
                    0}
                </div>
                <div className="text-xs text-gray-600">Total Payroll Cost</div>
                <div className="text-xs text-gray-500">
                  {analyticsData.payrollAnalytics?.payrollRuns || 0} runs
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <ChartCard title="Quick Actions">
            <div className="space-y-3">
              <button
                onClick={() =>
                  navigate(
                    "/dashboard/modules/department-management/project-approvals"
                  )
                }
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <HiOutlineClipboardDocument className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Review Pending Projects
                    </p>
                    <p className="text-sm text-gray-600">
                      {analyticsData.pendingApprovals} projects awaiting
                      approval
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() =>
                  navigate(
                    "/dashboard/modules/department-management/leave-management"
                  )
                }
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center">
                  <HiOutlineCalendar className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Process Leave Requests
                    </p>
                    <p className="text-sm text-gray-600">
                      {analyticsData.leaveRequests} requests pending
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() =>
                  navigate(
                    "/dashboard/modules/department-management/approval-history"
                  )
                }
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center">
                  <HiOutlineDocumentCheck className="w-5 h-5 text-purple-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      View Approval History
                    </p>
                    <p className="text-sm text-gray-600">
                      Review past approval decisions
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </ChartCard>

          <ChartCard title="Department Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Total Team Members
                </span>
                <span className="font-medium text-gray-900">
                  {analyticsData.teamSize}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Projects</span>
                <span className="font-medium text-gray-900">
                  {analyticsData.activeProjects}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Completed Projects
                </span>
                <span className="font-medium text-gray-900">
                  {analyticsData.completedProjects}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Budget Used</span>
                <span className="font-medium text-gray-900">
                  {analyticsData.budgetUtilization}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Payroll</span>
                <span className="font-medium text-gray-900">
                  ₦
                  {analyticsData.payrollAnalytics?.totalPayrollCost?.toLocaleString() ||
                    0}
                </span>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* User Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Status Distribution */}
          <ChartCard title="User Status Distribution">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.activeUsers || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.activeUsers || 0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                  <span className="text-sm text-gray-700">
                    Pending Registration
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.pendingRegistration || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-yellow-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.pendingRegistration ||
                            0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Inactive</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.inactiveUsers || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-red-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.inactiveUsers || 0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Suspended</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.suspendedUsers || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.suspendedUsers || 0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-500 mr-3"></div>
                  <span className="text-sm text-gray-700">
                    Pending Offboarding
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.pendingOffboarding || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gray-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.pendingOffboarding ||
                            0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Role Distribution */}
          <ChartCard title="Role Distribution">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-sm text-gray-700">HOD</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.roleDistribution?.hod || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.roleDistribution
                            ?.hod || 0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Manager</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.roleDistribution?.manager ||
                      0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.roleDistribution
                            ?.manager || 0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Staff</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.roleDistribution?.staff || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-purple-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.roleDistribution
                            ?.staff || 0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-500 mr-3"></div>
                  <span className="text-sm text-gray-700">Viewer</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                    {analyticsData.userAnalytics?.roleDistribution?.viewer || 0}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gray-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((analyticsData.userAnalytics?.roleDistribution
                            ?.viewer || 0) /
                            Math.max(
                              analyticsData.userAnalytics?.totalUsers || 1,
                              1
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
