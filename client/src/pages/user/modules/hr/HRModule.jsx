import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import { FaUsers, FaUserPlus, FaCalendarAlt, FaChartBar } from "react-icons/fa";

const HRModule = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const hrFeatures = [
    {
      title: "Employee Invitation",
      description: "Invite and onboard new employees",
      icon: FaUserPlus,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/hr/invitation",
    },
    {
      title: "Onboarding Management",
      description: "Manage onboarding tasks and checklists",
      icon: FaUsers,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/hr/onboarding",
    },
    {
      title: "Offboarding Management",
      description: "Handle employee exit processes",
      icon: FaUsers,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/hr/offboarding",
    },
    {
      title: "Leave Management",
      description: "Handle leave requests and approvals",
      icon: FaCalendarAlt,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/hr/leave/management",
    },
    {
      title: "Attendance Tracking",
      description: "Track employee attendance and time",
      icon: FaChartBar,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/hr/attendance",
    },
    {
      title: "Policy Management",
      description: "Manage HR policies and procedures",
      icon: FaUsers,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/hr/policies",
    },
    {
      title: "Compliance Management",
      description: "Ensure regulatory compliance",
      icon: FaChartBar,
      color: "bg-[var(--elra-primary)]",
      path: "/dashboard/modules/hr/compliance",
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
          Human Resources Module
        </h1>
        <p className="text-gray-600">
          Manage employees, recruitment, performance, and HR operations.
        </p>
      </div>

      {/* HR Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {hrFeatures.map((feature) => {
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

export default HRModule;
