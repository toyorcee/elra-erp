import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineClipboardDocument,
  HiOutlineCalendar,
} from "react-icons/hi2";
import { HiTrendingUp, HiTrendingDown } from "react-icons/hi";

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
  });

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch department analytics
      // For now, using mock data
      const mockData = {
        teamSize: 12,
        activeProjects: 8,
        completedProjects: 15,
        pendingApprovals: 3,
        leaveRequests: 5,
        budgetUtilization: 78.5,
        projectSuccessRate: 92.3,
        teamProductivity: 85.7,
        monthlyTrends: [
          { month: "Jan", projects: 3, completion: 2 },
          { month: "Feb", projects: 4, completion: 3 },
          { month: "Mar", projects: 5, completion: 4 },
          { month: "Apr", projects: 6, completion: 5 },
          { month: "May", projects: 7, completion: 6 },
          { month: "Jun", projects: 8, completion: 7 },
        ],
        projectStatus: [
          { status: "Planning", count: 2, color: "bg-blue-500" },
          { status: "In Progress", count: 4, color: "bg-yellow-500" },
          { status: "Review", count: 1, color: "bg-purple-500" },
          { status: "Completed", count: 15, color: "bg-green-500" },
        ],
        leaveDistribution: [
          { type: "Annual Leave", count: 8, color: "bg-green-500" },
          { type: "Sick Leave", count: 3, color: "bg-red-500" },
          { type: "Personal Leave", count: 2, color: "bg-blue-500" },
          { type: "Training", count: 1, color: "bg-purple-500" },
        ],
      };
      setAnalyticsData(mockData);
    } catch (error) {
      console.error("❌ [Analytics] Error fetching analytics:", error);
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
          {trend && (
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
                {Math.abs(trend)}% from last month
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Team Size"
            value={analyticsData.teamSize}
            icon={HiOutlineUsers}
            color="bg-blue-500"
            trend={5.2}
          />
          <StatCard
            title="Active Projects"
            value={analyticsData.activeProjects}
            icon={HiOutlineClipboardDocument}
            color="bg-green-500"
            trend={12.5}
          />
          <StatCard
            title="Pending Approvals"
            value={analyticsData.pendingApprovals}
            icon={HiOutlineCalendar}
            color="bg-yellow-500"
            trend={-8.3}
          />
          <StatCard
            title="Success Rate"
            value={`${analyticsData.projectSuccessRate}%`}
            icon={HiOutlineChartBar}
            color="bg-purple-500"
            trend={2.1}
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
                    <span className="text-sm font-medium text-gray-900">
                      {item.count}
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{
                          width: `${
                            (item.count / analyticsData.activeProjects) * 100
                          }%`,
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
                    <span className="text-sm font-medium text-gray-900">
                      {item.count}
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{
                          width: `${
                            (item.count / analyticsData.leaveRequests) * 100
                          }%`,
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
          {/* Monthly Trends */}
          <ChartCard title="Monthly Project Trends" className="lg:col-span-2">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartCard title="Budget Utilization">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-blue-500"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${
                      2 *
                      Math.PI *
                      36 *
                      (1 - analyticsData.budgetUtilization / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-lg font-bold text-gray-900">
                  {analyticsData.budgetUtilization}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                of allocated budget used
              </p>
            </div>
          </ChartCard>

          <ChartCard title="Team Productivity">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-green-500"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${
                      2 *
                      Math.PI *
                      36 *
                      (1 - analyticsData.teamProductivity / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-lg font-bold text-gray-900">
                  {analyticsData.teamProductivity}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                overall team efficiency
              </p>
            </div>
          </ChartCard>

          <ChartCard title="Project Success Rate">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-purple-500"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${
                      2 *
                      Math.PI *
                      36 *
                      (1 - analyticsData.projectSuccessRate / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-lg font-bold text-gray-900">
                  {analyticsData.projectSuccessRate}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                projects completed successfully
              </p>
            </div>
          </ChartCard>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <ChartCard title="Quick Actions">
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
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
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
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
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
