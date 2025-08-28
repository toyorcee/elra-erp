import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { fetchProjectAnalytics } from "../../../../services/projectAPI.js";
import { toast } from "react-toastify";
import { formatCurrency } from "../../../../utils/formatters.js";
import DataTable from "../../../../components/common/DataTable";

const ProjectDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Access control - only HOD+ can access
  if (!user || user.role.level < 700) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need HOD level (700) or higher to access Project Analytics.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetchProjectAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      } else {
        toast.error("Failed to load project analytics");
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Error loading project analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
                 <h1 className="text-3xl font-bold text-gray-900 mb-2">
           Project Dashboard
         </h1>
        <p className="text-gray-600">
          {user.role.level >= 1000
            ? "View comprehensive project analytics across all departments"
            : "View project analytics for your department and approved projects"}
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <FolderIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                In Implementation
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.byStatus?.implementation || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Approval
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(analytics?.byStatus?.pending_approval || 0) +
                  (analytics?.byStatus?.pending_finance_approval || 0) +
                  (analytics?.byStatus?.pending_executive_approval || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics?.totalBudget || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Project Status Breakdown
          </h2>
          <div className="space-y-3">
            {analytics?.byStatus &&
              Object.entries(analytics.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        status === "implementation"
                          ? "bg-green-500"
                          : status === "approved"
                          ? "bg-blue-500"
                          : status.includes("pending")
                          ? "bg-yellow-500"
                          : status === "completed"
                          ? "bg-purple-500"
                          : status === "rejected"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Priority Distribution
          </h2>
          <div className="space-y-3">
            {analytics?.byPriority &&
              Object.entries(analytics.byPriority).map(([priority, count]) => (
                <div
                  key={priority}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        priority === "critical"
                          ? "bg-red-500"
                          : priority === "high"
                          ? "bg-orange-500"
                          : priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {priority}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      {analytics?.departmentBreakdown &&
        Object.keys(analytics.departmentBreakdown).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Department Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics.departmentBreakdown).map(
                ([dept, data]) => (
                  <div
                    key={dept}
                    className="border border-gray-200 rounded-lg p-4"
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
          </div>
        )}

             {/* Recent Projects */}
       {analytics?.recentProjects && analytics.recentProjects.length > 0 && (
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
           <h2 className="text-xl font-bold text-gray-900 mb-4">
             Recent Projects
           </h2>
           <DataTable
             data={analytics.recentProjects}
             columns={[
               {
                 header: "Project",
                 accessor: "name",
                 renderer: (project) => (
                   <div>
                     <div className="text-sm font-medium text-gray-900">
                       {project.name}
                     </div>
                     <div className="text-sm text-gray-500">
                       {project.code}
                     </div>
                   </div>
                 ),
               },
               {
                 header: "Status",
                 accessor: "status",
                 renderer: (project) => (
                   <span
                     className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                       project.status === "implementation"
                         ? "bg-green-100 text-green-800"
                         : project.status === "approved"
                         ? "bg-blue-100 text-blue-800"
                         : project.status.includes("pending")
                         ? "bg-yellow-100 text-yellow-800"
                         : "bg-gray-100 text-gray-800"
                     }`}
                   >
                     {project.status.replace(/_/g, " ")}
                   </span>
                 ),
               },
               {
                 header: "Progress",
                 accessor: "progress",
                 renderer: (project) => (
                   <div className="flex items-center">
                     <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                       <div
                         className="bg-blue-600 h-2 rounded-full"
                         style={{ width: `${project.progress}%` }}
                       ></div>
                     </div>
                     <span className="text-sm text-gray-900">
                       {project.progress}%
                     </span>
                   </div>
                 ),
               },
               {
                 header: "Budget",
                 accessor: "budget",
                 renderer: (project) => (
                   <span className="text-sm text-gray-900">
                     {formatCurrency(project.budget)}
                   </span>
                 ),
               },
               {
                 header: "Department",
                 accessor: "department",
                 renderer: (project) => (
                   <span className="text-sm text-gray-500">
                     {project.department}
                   </span>
                 ),
               },
             ]}
             actions={{
               showEdit: false,
               showDelete: false,
               showToggle: false,
               customActions: (project) => (
                 <button
                   onClick={() => {
                     // Navigate to project details
                     window.location.href = `/dashboard/modules/projects/${project.id}`;
                   }}
                   className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                   title="View Project Details"
                 >
                   <EyeIcon className="h-4 w-4" />
                 </button>
               ),
             }}
             emptyState={{
               icon: <FolderIcon className="h-12 w-12 text-gray-400" />,
               title: "No recent projects found",
               description: "No projects match your current filters",
             }}
           />
         </div>
       )}
    </div>
  );
};

export default ProjectDashboard;
