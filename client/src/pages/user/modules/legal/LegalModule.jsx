import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  FaGavel,
  FaFileContract,
  FaShieldAlt,
  FaClipboardList,
} from "react-icons/fa";

const LegalModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const legalFeatures = [
    {
      title: "Legal Policies",
      description: "Manage legal policies and procedures for projects",
      icon: FaFileContract,
      path: "/dashboard/modules/legal/policies",
      badge: "Policies",
    },
    {
      title: "Compliance Programs",
      description: "Create and manage compliance program frameworks",
      icon: FaShieldAlt,
      path: "/dashboard/modules/legal/compliance-programs",
      badge: "Programs",
    },
    {
      title: "Compliance Items",
      description: "Track and manage individual compliance requirements",
      icon: FaClipboardList,
      path: "/dashboard/modules/legal/compliance-items",
      badge: "Items",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-lg mb-6">
            <FaGavel className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Legal & Compliance
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive legal management, compliance tracking, and regulatory
            system
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {legalFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <IconComponent className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-semibold">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {feature.description}
                </p>
                <div className="flex items-center text-emerald-600 font-medium text-sm">
                  <span>Explore</span>
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LegalModule;
