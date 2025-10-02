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

  const quickActions = legalFeatures.slice(0, 3).map((feature) => ({
    title: feature.title,
    icon: feature.icon,
    color: "bg-purple-500",
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-400/15 to-rose-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-indigo-400/15 to-blue-400/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="relative z-10 px-6 py-14">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-xl mb-6">
              <FaGavel className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Legal & Compliance
            </h1>
            <p className="text-gray-600 mt-3">
              Comprehensive legal management, compliance tracking, and
              regulatory system
            </p>
          </div>
        </div>
      </div>

      {/* Features - glass cards */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {legalFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            const palettes = [
              {
                bg: "from-purple-50 to-violet-50",
                overlay: "from-purple-500 via-violet-500 to-indigo-500",
                iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
                badge: "from-purple-500 to-violet-500",
                text: "text-purple-600",
              },
              {
                bg: "from-pink-50 to-rose-50",
                overlay: "from-pink-500 via-rose-500 to-fuchsia-500",
                iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
                badge: "from-pink-500 to-rose-500",
                text: "text-pink-600",
              },
              {
                bg: "from-indigo-50 to-blue-50",
                overlay: "from-indigo-500 via-blue-500 to-cyan-500",
                iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
                badge: "from-indigo-500 to-blue-500",
                text: "text-indigo-600",
              },
            ];
            const palette = palettes[index % palettes.length];
            return (
              <div
                key={feature.title}
                className="group cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div
                  className={`relative bg-gradient-to-br ${palette.bg} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 backdrop-blur-sm`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${palette.overlay} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`p-4 rounded-2xl ${palette.iconBg} shadow-lg`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                          {feature.status}
                        </span>
                        <span
                          className={`px-3 py-1 bg-gradient-to-r ${palette.badge} text-white rounded-full text-xs font-semibold`}
                        >
                          {feature.badge}
                        </span>
                      </div>
                    </div>
                    <h3
                      className={`text-2xl font-bold text-gray-900 mb-4 group-hover:${palette.text} transition-colors`}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <div
                      className={`flex items-center font-medium ${palette.text}`}
                    >
                      <span>Explore</span>
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
      </div>

      {/* Quick Actions - glass */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.title}
                  className="group flex items-center p-6 rounded-2xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
                  onClick={() => navigate(action.path)}
                >
                  <div
                    className={`p-3 rounded-xl ${action.color} mr-4 shadow-lg`}
                  >
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-semibold group-hover:text-purple-600 transition-colors">
                    {action.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModule;
