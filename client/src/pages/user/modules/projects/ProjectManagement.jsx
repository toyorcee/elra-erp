import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import {
  FaFolderOpen,
  FaChartLine,
  FaUsers,
  FaClipboardCheck,
  FaFileAlt,
  FaRocket,
  FaLightbulb,
  FaHandshake,
} from "react-icons/fa";

const ProjectManagement = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const hasAccess = (item) => {
    const userLevel = user?.role?.level || 0;
    const userDepartment = user?.department?.name;

    if (item.required?.minLevel && userLevel < item.required.minLevel) {
      return false;
    }

    if (
      item.required?.department &&
      userDepartment !== item.required.department
    ) {
      return false;
    }

    // Check hidden function
    if (item.hidden && typeof item.hidden === "function") {
      return !item.hidden(user);
    }

    return true;
  };

  const projectFeatures = [
    {
      title: "Project Dashboard",
      description:
        "Project Management HOD dashboard - comprehensive overview of project performance and financial management",
      icon: FaChartLine,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      path: "/dashboard/modules/projects/analytics",
      status: "Active",
      badge: "Dashboard",
      required: { minLevel: 700, department: "Project Management" },
    },
    {
      title: "Approval Management",
      description: "Review and approve project requests",
      icon: FaClipboardCheck,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
      path: "/dashboard/modules/projects/approvals",
      status: "Active",
      badge: "Approvals",
      required: { minLevel: 700 },
    },
    {
      title: "Manage External Projects",
      description:
        "Create and manage external projects - Project Management HOD only",
      icon: FaHandshake,
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      path: "/dashboard/modules/projects/external",
      status: "Active",
      badge: "External",
      required: { minLevel: 700, department: "Project Management" },
    },
    {
      title: "Project Teams",
      description: "Manage project teams and assignments",
      icon: FaUsers,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      path: "/dashboard/modules/projects/teams",
      status: "Active",
      badge: "Teams",
      required: { minLevel: 700, department: "Project Management" },
    },
    {
      title: "Project Reports",
      description: "Monthly project approval reports and analytics",
      icon: FaFileAlt,
      color: "bg-gradient-to-br from-indigo-500 to-blue-600",
      path: "/dashboard/modules/projects/reports",
      status: "Active",
      badge: "Reports",
      required: { minLevel: 700 },
    },
  ].filter(hasAccess); // Filter out items user doesn't have access to

  const quickActions = [
    {
      title: "View Projects",
      icon: FaFolderOpen,
      color: "bg-blue-500",
      path: "/dashboard/modules/projects/list",
    },
    {
      title: "Create Project",
      icon: FaRocket,
      color: "bg-green-500",
      path: "/dashboard/modules/projects/create",
    },
    {
      title: "View Analytics",
      icon: FaChartLine,
      color: "bg-purple-500",
      path: "/dashboard/modules/projects/analytics",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner variant="white-green" size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4">
            <FaFolderOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Project Management
            </h1>
            <p className="text-gray-600">
              Comprehensive project planning, tracking and management tools
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Project Management
        </h2>
        <p className="text-gray-600">
          Choose a project management tool to get started or explore your
          options below.
        </p>
      </div>

      {/* Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {projectFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={feature.title}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 group"
              onClick={() => navigate(feature.path)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        feature.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : feature.status === "Available"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {feature.status}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {feature.badge}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>Access Feature</span>
                    <svg
                      className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.title}
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                onClick={() => (window.location.href = action.path)}
              >
                <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                  {action.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;
