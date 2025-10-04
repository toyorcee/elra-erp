import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { BarChart, PieChart, LineChart } from "../../../../components/graphs";
import { formatCurrency } from "../../../../utils/formatters";
import { useAuth } from "../../../../context/AuthContext";
import {
  getProjectApprovalReports,
  exportProjectApprovalReport,
} from "../../../../services/projectAPI";
import { toast } from "react-toastify";

const ProjectReports = () => {
  const { user } = useAuth();
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("yearly");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchReportsData();
  }, [reportType, selectedMonth, selectedYear]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const params = {
        approverId: user?.id,
      };

      if (reportType === "monthly") {
        if (selectedMonth === "all") {
          toast.error("Please select a specific month for monthly reports");
          return;
        }
        params.period = `${selectedMonth}/${selectedYear}`;
      } else if (reportType === "yearly") {
        params.period = selectedYear;
      }
      // For "all", don't send period parameter

      const response = await getProjectApprovalReports(params);

      if (response.success) {
        setReportsData(response.data);
      } else {
        toast.error(response.message || "Failed to load reports data");
      }
    } catch (error) {
      console.error("Error fetching reports data:", error);
      toast.error("Error loading reports data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      const params = {
        approverId: user?.id,
        format: "PDF",
      };

      if (reportType === "monthly") {
        if (selectedMonth === "all") {
          toast.error("Please select a specific month for monthly reports");
          return;
        }
        params.period = `${selectedMonth}/${selectedYear}`;
      } else if (reportType === "yearly") {
        params.period = selectedYear;
      }

      await exportProjectApprovalReport("PDF", params);
      toast.success("PDF report exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF report");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load reports data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Project Approval Reports
          </h1>
          <p className="text-gray-600 mt-1">
            Project approval analytics for HODs and approvers in the project
            management module
          </p>
        </div>
      </div>

      {/* Report Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center space-y-4 xl:space-y-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-4 w-full xl:w-auto">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Report Type:
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
              >
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
              </select>
            </div>

            {reportType === "monthly" && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Month:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
                >
                  <option value="all">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full xl:w-auto">
            <button
              onClick={handleExportPDF}
              disabled={exportLoading}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {exportLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <DocumentTextIcon className="h-4 w-4 mr-2" />
              )}
              {exportLoading ? "Generating PDF..." : "Export PDF"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Projects
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                {reportsData.summary?.totalProjects || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <DocumentTextIcon className="h-8 w-8 text-white" />
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
                Approved Projects
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                {reportsData.summary?.approvedProjects || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border border-red-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                Rejected Projects
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-red-900 mt-2 break-all leading-tight">
                {reportsData.summary?.rejectedProjects || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <XCircleIcon className="h-8 w-8 text-white" />
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
                Pending Projects
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-900 mt-2 break-all leading-tight">
                {reportsData.summary?.pendingProjects || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
              <ClockIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Budget Impact
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                {formatCurrency(reportsData.summary?.totalBudgetImpact || 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly Performance - full width line chart */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Monthly Approval Trends
          </h3>
          <LineChart
            data={{
              labels: (reportsData.monthlyTrends || []).map((d) => d.month),
              datasets: [
                {
                  label: "Total Projects",
                  data: (reportsData.monthlyTrends || []).map(
                    (d) => d.projects || 0
                  ),
                  borderColor: "#3B82F6",
                  backgroundColor: "rgba(59, 130, 246, 0.12)",
                },
                {
                  label: "Approved Projects",
                  data: (reportsData.monthlyTrends || []).map(
                    (d) => d.approved || 0
                  ),
                  borderColor: "#10B981",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                },
                {
                  label: "Pending Projects",
                  data: (reportsData.monthlyTrends || []).map(
                    (d) => d.pending || 0
                  ),
                  borderColor: "#6B7280",
                  backgroundColor: "rgba(107, 114, 128, 0.12)",
                },
                {
                  label: "Rejected Projects",
                  data: (reportsData.monthlyTrends || []).map(
                    (d) => d.rejected || 0
                  ),
                  borderColor: "#EF4444",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                },
              ],
            }}
            title="Project Approval Trends"
            height={320}
            showArea={true}
          />
        </motion.div>
      </div>

      {/* Project Classification Graph for PM HOD */}
      {user?.department?.name === "Project Management" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Project Classification Overview
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChart
              data={{
                labels: [
                  "Pending Approvals",
                  "Cross-Departmental Approved",
                  "External Projects",
                ],
                datasets: [
                  {
                    data: [
                      reportsData.summary.pendingProjects || 0,
                      reportsData.summary.approvedProjects || 0,
                      reportsData.summary.externalProjects || 0,
                    ],
                  },
                ],
              }}
              title="Project Distribution"
              height={300}
              colors={["#F59E0B", "#10B981", "#8B5CF6"]}
            />
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-amber-800">
                      Pending Approvals
                    </h4>
                    <p className="text-2xl font-bold text-amber-900">
                      {reportsData.summary.pendingProjects || 0}
                    </p>
                    <p className="text-sm text-amber-700">
                      Projects awaiting your approval
                    </p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">
                      Cross-Departmental Approved
                    </h4>
                    <p className="text-2xl font-bold text-green-900">
                      {reportsData.summary.approvedProjects || 0}
                    </p>
                    <p className="text-sm text-green-700">
                      Projects you've approved across departments
                    </p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-purple-800">
                      External Projects
                    </h4>
                    <p className="text-2xl font-bold text-purple-900">
                      {reportsData.summary.externalProjects || 0}
                    </p>
                    <p className="text-sm text-purple-700">
                      External projects you manage
                    </p>
                  </div>
                  <GlobeAltIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Department breakdown - two charts side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Projects by Department
          </h3>
          <PieChart
            data={{
              labels: (reportsData.departmentBreakdown || []).map(
                (d) => d.department
              ),
              datasets: [
                {
                  data: (reportsData.departmentBreakdown || []).map(
                    (d) => d.projects
                  ),
                },
              ],
            }}
            title="Project Distribution"
            height={300}
            colors={["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Budget Impact by Department
          </h3>
          <BarChart
            data={{
              labels: (reportsData.departmentBreakdown || []).map(
                (d) => d.department
              ),
              datasets: [
                {
                  label: "Budget (₦)",
                  data: (reportsData.departmentBreakdown || []).map(
                    (d) => d.budget
                  ),
                },
              ],
            }}
            title="Budget Distribution"
            height={300}
            colors={["#8B5CF6"]}
          />
        </motion.div>
      </div>

      {/* Recent Approvals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Recent Project Activity
        </h3>
        <div className="space-y-4">
          {(reportsData.recentApprovals || []).map((approval) => (
            <div
              key={approval.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`p-2 rounded-lg ${
                    approval.status === "approved"
                      ? "bg-green-100 text-green-600"
                      : approval.status === "pending"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {approval.status === "approved" ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : approval.status === "pending" ? (
                    <ClockIcon className="h-5 w-5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {approval.projectName}
                  </p>
                  <p className="text-sm text-gray-500">{approval.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(approval.budget)}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {approval.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectReports;
