import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
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
  const [selectedPeriod, setSelectedPeriod] = useState("365");
  const [exportLoading, setExportLoading] = useState({
    PDF: false,
    Word: false,
    CSV: false,
  });

  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const response = await getProjectApprovalReports({
        period: selectedPeriod,
        approverId: user?.id,
      });

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
      setExportLoading((prev) => ({ ...prev, PDF: true }));
      await exportProjectApprovalReport("PDF", {
        period: selectedPeriod,
        approverId: user?.id,
      });
      toast.success("PDF report exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF report");
    } finally {
      setExportLoading((prev) => ({ ...prev, PDF: false }));
    }
  };

  const handleExportWord = async () => {
    try {
      setExportLoading((prev) => ({ ...prev, Word: true }));
      await exportProjectApprovalReport("Word", {
        period: selectedPeriod,
        approverId: user?.id,
      });
      toast.success("Word report exported successfully!");
    } catch (error) {
      console.error("Error exporting Word:", error);
      toast.error("Failed to export Word report");
    } finally {
      setExportLoading((prev) => ({ ...prev, Word: false }));
    }
  };

  const handleExportCSV = async () => {
    if (!reportsData) return;

    try {
      setExportLoading((prev) => ({ ...prev, CSV: true }));
      // Create CSV content
      let csvContent = "Project Approval Reports\n\n";
      csvContent += `Generated for: ${reportsData.approver.name}\n`;
      csvContent += `Department: ${reportsData.approver.department}\n`;
      csvContent += `Period: Last ${reportsData.period} days\n`;
      csvContent += `Generated: ${new Date(
        reportsData.generatedAt
      ).toLocaleString()}\n\n`;

      // Summary data
      csvContent += "SUMMARY\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Projects,${reportsData.summary.totalProjects}\n`;
      csvContent += `Approved Projects,${reportsData.summary.approvedProjects}\n`;
      csvContent += `Rejected Projects,${reportsData.summary.rejectedProjects}\n`;
      csvContent += `Pending Projects,${reportsData.summary.pendingProjects}\n`;
      csvContent += `Total Budget Impact,${formatCurrency(
        reportsData.summary.totalBudgetImpact
      )}\n\n`;

      // Monthly trends
      csvContent += "MONTHLY TRENDS\n";
      csvContent += "Month,Projects,Approved,Rejected,Budget\n";
      reportsData.monthlyTrends.forEach((trend) => {
        csvContent += `${trend.month},${trend.projects},${trend.approved},${
          trend.rejected
        },${formatCurrency(trend.budget)}\n`;
      });
      csvContent += "\n";

      // Department breakdown
      csvContent += "DEPARTMENT BREAKDOWN\n";
      csvContent += "Department,Projects,Budget,Approved,Rejected,Pending\n";
      reportsData.departmentBreakdown.forEach((dept) => {
        csvContent += `${dept.department},${dept.projects},${formatCurrency(
          dept.budget
        )},${dept.approved},${dept.rejected},${dept.pending}\n`;
      });
      csvContent += "\n";

      // Recent approvals
      csvContent += "RECENT PROJECT ACTIVITY\n";
      csvContent += "Project Name,Department,Budget,Status\n";
      reportsData.recentApprovals.forEach((approval) => {
        csvContent += `${approval.projectName},${
          approval.department
        },${formatCurrency(approval.budget)},${approval.status}\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `project-approval-reports-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV report exported successfully!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV report");
    } finally {
      setExportLoading((prev) => ({ ...prev, CSV: false }));
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
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportPDF}
            disabled={exportLoading.PDF}
            className={`${
              exportLoading.PDF
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 cursor-pointer"
            } text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-colors`}
            title="Export Project report as PDF"
          >
            {exportLoading.PDF ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <ArrowDownTrayIcon className="h-5 w-5" />
            )}
            <span>{exportLoading.PDF ? "Exporting..." : "Export PDF"}</span>
          </button>
          <button
            onClick={handleExportWord}
            disabled={exportLoading.Word}
            className={`${
              exportLoading.Word
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
            } text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-colors`}
            title="Export Project report as Word/HTML"
          >
            {exportLoading.Word ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <ArrowDownTrayIcon className="h-5 w-5" />
            )}
            <span>{exportLoading.Word ? "Exporting..." : "Export Word"}</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exportLoading.CSV}
            className={`${
              exportLoading.CSV
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 cursor-pointer"
            } text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-colors`}
            title="Export Project report as CSV"
          >
            {exportLoading.CSV ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <ArrowDownTrayIcon className="h-5 w-5" />
            )}
            <span>{exportLoading.CSV ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Report Period:
          </span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
            <option value="730">Last 2 years</option>
            <option value="1095">Last 3 years</option>
            <option value="1825">Last 5 years</option>
            <option value="3650">Last 10 years</option>
            <option value="7300">Last 20 years</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Generated: {new Date(reportsData.generatedAt).toLocaleString()}
        </div>
      </div>

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

      {/* Approval Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Weekly Approval Volume
          </h3>
          <BarChart
            data={{
              labels: Object.keys(
                reportsData.approvalMetrics?.approvalVolumeByDay || {}
              ),
              datasets: [
                {
                  label: "Projects Approved",
                  data: Object.values(
                    reportsData.approvalMetrics?.approvalVolumeByDay || {}
                  ),
                },
              ],
            }}
            title="Daily Approval Patterns"
            height={300}
            colors={["#F59E0B"]}
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
