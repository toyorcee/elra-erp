import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import {
  FaGavel,
  FaFileContract,
  FaShieldAlt,
  FaClipboardList,
} from "react-icons/fa";

const LegalModule = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const legalFeatures = [
    {
      title: "Legal Policies",
      description: "Manage legal policies and procedures for projects",
      icon: FaFileContract,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      path: "/dashboard/modules/legal/policies",
      status: "Active",
      badge: "Policies",
    },
    {
      title: "Compliance Programs",
      description: "Create and manage compliance program frameworks",
      icon: FaShieldAlt,
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      path: "/dashboard/modules/legal/compliance-programs",
      status: "Active",
      badge: "Programs",
    },
    {
      title: "Compliance Items",
      description: "Track and manage individual compliance requirements",
      icon: FaClipboardList,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      path: "/dashboard/modules/legal/compliance-items",
      status: "Active",
      badge: "Items",
    },
  ];

  // Quick Actions should match the available feature cards
  const quickActions = legalFeatures.slice(0, 3).map((feature) => ({
    title: feature.title,
    icon: feature.icon,
    color: "bg-blue-500",
    path: feature.path,
  }));

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
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mr-4">
            <FaGavel className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Legal & Compliance
            </h1>
            <p className="text-gray-600">
              Comprehensive legal management, compliance tracking, and
              regulatory system
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Legal & Compliance
        </h2>
        <p className="text-gray-600">
          Manage legal policies, track compliance requirements, and ensure
          regulatory adherence for your organization.
        </p>
      </div>

      {/* Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {legalFeatures.map((feature) => {
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

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-purple-600 text-sm font-medium">
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
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
                onClick={() => (window.location.href = action.path)}
              >
                <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium group-hover:text-purple-600 transition-colors">
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

export default LegalModule;
