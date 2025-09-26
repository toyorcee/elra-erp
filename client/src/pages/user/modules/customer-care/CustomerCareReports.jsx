import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiChartBar,
  HiDocumentText,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiUserGroup,
  HiCalendar,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiArrowLeft,
  HiHome,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import { BarChart, PieChart, LineChart } from "../../../../components/graphs";
import { statisticsAPI } from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";

const CustomerCareReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);

        // Fetch all report data in parallel
        const [
          statisticsResponse,
          trendsResponse,
          departmentBreakdownResponse,
          categoryBreakdownResponse,
        ] = await Promise.all([
          statisticsAPI.getStatistics(),
          statisticsAPI.getTrends({ months: 6 }),
          statisticsAPI.getDepartmentBreakdown(),
          statisticsAPI.getCategoryBreakdown(),
        ]);

        if (
          statisticsResponse.success &&
          trendsResponse.success &&
          departmentBreakdownResponse.success &&
          categoryBreakdownResponse.success
        ) {
          const stats = statisticsResponse.data;
          const trends = trendsResponse.data;
          const departmentData = departmentBreakdownResponse.data;
          const categoryData = categoryBreakdownResponse.data;

          setReportData({
            totalComplaints: stats.totalComplaints || 0,
            resolvedComplaints: stats.resolvedComplaints || 0,
            pendingComplaints: stats.pendingComplaints || 0,
            inProgressComplaints: stats.inProgressComplaints || 0,
            averageResolutionTime: stats.averageResolutionTime || 0,
            satisfactionScore: stats.satisfactionRating || 0,
            departmentBreakdown: departmentData.map((dept) => ({
              department: dept.department,
              count: dept.count,
              percentage: dept.resolutionRate,
            })),
            monthlyTrends: trends.map((trend) => ({
              month: new Date(
                trend._id.year,
                trend._id.month - 1
              ).toLocaleDateString("en-US", { month: "short" }),
              complaints: trend.total,
              resolved: trend.resolved,
            })),
            priorityBreakdown: [
              {
                priority: "High",
                count: stats.highPriority || 0,
                color: "#EF4444",
              },
              {
                priority: "Medium",
                count: Math.floor((stats.totalComplaints || 0) * 0.5),
                color: "#F59E0B",
              },
              {
                priority: "Low",
                count: Math.floor((stats.totalComplaints || 0) * 0.3),
                color: "#10B981",
              },
            ],
            topCategories: categoryData.map((cat) => ({
              category: cat.category,
              count: cat.count,
            })),
          });
        } else {
          toast.error("Failed to load report data");
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

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
        <span className="text-gray-900 font-medium">Reports</span>
      </div>

      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Customer Care Reports</h1>
            <p className="text-white/80">
              Analytics and insights for customer care performance
            </p>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Complaints
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {reportData.totalComplaints}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                <HiArrowTrendingUp className="w-4 h-4 inline mr-1" />
                +12% from last month
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <HiDocumentText className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Resolution Rate
              </p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {Math.round(
                  (reportData.resolvedComplaints / reportData.totalComplaints) *
                    100
                )}
                %
              </p>
              <p className="text-sm text-green-600 mt-1">
                <HiArrowTrendingUp className="w-4 h-4 inline mr-1" />
                +5% improvement
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <HiCheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Avg. Resolution Time
              </p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {reportData.averageResolutionTime} days
              </p>
              <p className="text-sm text-purple-600 mt-1">
                <HiArrowTrendingDown className="w-4 h-4 inline mr-1" />
                -0.5 days faster
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <HiClock className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border border-yellow-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                Satisfaction Score
              </p>
              <p className="text-2xl font-bold text-yellow-900 mt-2">
                {reportData.satisfactionScore}/5
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                <HiArrowTrendingUp className="w-4 h-4 inline mr-1" />
                +0.3 improvement
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
              <HiUserGroup className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Complaints by Department
          </h3>
          <PieChart
            data={{
              labels: reportData.departmentBreakdown.map((d) => d.department),
              datasets: [
                {
                  data: reportData.departmentBreakdown.map((d) => d.count),
                  backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
                },
              ],
            }}
            title="Department Breakdown"
            height={300}
          />
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Priority Distribution
          </h3>
          <BarChart
            data={{
              labels: reportData.priorityBreakdown.map((p) => p.priority),
              datasets: [
                {
                  label: "Complaints",
                  data: reportData.priorityBreakdown.map((p) => p.count),
                  backgroundColor: reportData.priorityBreakdown.map(
                    (p) => p.color
                  ),
                },
              ],
            }}
            title="Priority Distribution"
            height={300}
          />
        </motion.div>
      </div>

      {/* Monthly Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Trends</h3>
        <LineChart
          data={{
            labels: reportData.monthlyTrends.map((t) => t.month),
            datasets: [
              {
                label: "Complaints Received",
                data: reportData.monthlyTrends.map((t) => t.complaints),
                borderColor: "#EF4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
              },
              {
                label: "Complaints Resolved",
                data: reportData.monthlyTrends.map((t) => t.resolved),
                borderColor: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
              },
            ],
          }}
          title="Monthly Trends"
          height={400}
        />
      </motion.div>

      {/* Top Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Top Complaint Categories
        </h3>
        <div className="space-y-4">
          {reportData.topCategories.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <HiChartBar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {category.category}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {category.count} complaints
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {category.count}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.round(
                    (category.count / reportData.totalComplaints) * 100
                  )}
                  %
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerCareReports;
