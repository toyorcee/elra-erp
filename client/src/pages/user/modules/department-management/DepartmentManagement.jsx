import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import {
  FaClipboardCheck,
  FaCalendarAlt,
  FaUsers,
  FaChartBar,
  FaProjectDiagram,
} from "react-icons/fa";

const DepartmentManagement = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const deptFeatures = [
    {
      title: "Analytics",
      description: "Department overview and key metrics",
      icon: FaChartBar,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/department-management/analytics",
    },
    {
      title: "Department Users",
      description: "View and manage users in your department",
      icon: FaUsers,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/department-management/users",
    },
    {
      title: "Announcements",
      description:
        "Create and manage department-specific announcements (HOD only)",
      icon: FaClipboardCheck,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/department-management/announcements",
    },
    {
      title: "Leave Management",
      description: "Review and approve employee leave requests",
      icon: FaCalendarAlt,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/department-management/leave-management",
    },
    {
      title: "Department Leave Calendar",
      description: "Visual calendar of approved leaves for your department",
      icon: FaCalendarAlt,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/department-management/leave-calendar",
    },
    {
      title: "Department Projects",
      description: "Create and manage internal departmental projects",
      icon: FaProjectDiagram,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/department-management/projects",
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Department Management Module
        </h1>
        <p className="text-gray-600">
          Centralized module for HODs to manage department-specific functions
          including project approvals, leave management, team oversight, and
          analytics.
        </p>
      </div>

      {/* Department Management Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deptFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={feature.title}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
              onClick={() => navigate(feature.path)}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-[var(--elra-primary)] text-sm font-medium">
                  <span>Access Feature</span>
                  <svg
                    className="ml-2 h-4 w-4"
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
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentManagement;
