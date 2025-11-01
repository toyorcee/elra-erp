import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import { motion } from "framer-motion";
import {
  FaChartBar,
  FaDollarSign,
  FaCheckCircle,
  FaPlus,
  FaDownload,
} from "react-icons/fa";

const SalesMarketingModule = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const hasAccess = (item) => {
    const userLevel = user?.role?.level || 0;
    const userDepartment = user?.department?.name;

    if (userLevel >= 1000) {
      return true;
    }

    if (item.required?.minLevel && userLevel < item.required.minLevel) {
      return false;
    }

    if (
      item.required?.department &&
      userDepartment !== item.required.department
    ) {
      return false;
    }

    if (item.hidden && typeof item.hidden === "function") {
      return !item.hidden(user);
    }

    return true;
  };

  const salesMarketingFeatures = [
    {
      title: "Overview",
      description: "Overview of sales and marketing performance",
      icon: FaChartBar,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
      path: "/dashboard/modules/sales/overview",
      status: "Active",
      badge: "Overview",
      required: { minLevel: 300 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSalesMarketing = userDepartment === "Sales & Marketing";
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";
        const isExecutive =
          user?.role?.level === 700 && userDepartment === "Executive Office";

        return !(
          isSalesMarketing ||
          isSuperAdmin ||
          isFinanceHOD ||
          isExecutive
        );
      },
    },
    {
      title: "Transactions",
      description: "Create and manage sales & marketing transactions",
      icon: FaDollarSign,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      path: "/dashboard/modules/sales/transactions",
      status: "Active",
      badge: "Transactions",
      required: { minLevel: 300 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSalesMarketing = userDepartment === "Sales & Marketing";
        const isSuperAdmin = user?.role?.level === 1000;

        return !(isSalesMarketing || isSuperAdmin);
      },
    },
    {
      title: "Approvals",
      description: "Review and approve sales & marketing transactions",
      icon: FaCheckCircle,
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      path: "/dashboard/modules/sales/approvals",
      status: "Active",
      badge: "Approvals",
      required: { minLevel: 700 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";
        const isSalesMarketingHOD =
          user?.role?.level === 700 && userDepartment === "Sales & Marketing";

        return !(isSuperAdmin || isFinanceHOD || isSalesMarketingHOD);
      },
    },
  ].filter(hasAccess);

  const quickActions = [
    {
      title: "View Dashboard",
      icon: FaChartBar,
      color: "bg-blue-500",
      path: "/dashboard/modules/sales/overview",
    },
    {
      title: "New Transaction",
      icon: FaPlus,
      color: "bg-green-500",
      path: "/dashboard/modules/sales/transactions",
    },
    {
      title: "Generate Reports",
      icon: FaDownload,
      color: "bg-purple-500",
      path: "/dashboard/modules/sales/reports",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-400/15 to-sky-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-rose-400/15 to-amber-400/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="relative z-10 px-4 sm:px-6 py-12 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl mb-6">
              <FaChartBar className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent mb-4 sm:mb-6">
              Sales & Marketing
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Manage sales transactions, track marketing campaigns, and build
              strong customer relationships.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features - glass cards with dynamic palettes */}
      <div className="px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Sales & Marketing Tools
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access comprehensive sales and marketing management tools
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {salesMarketingFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            const palettes = [
              {
                bg: "from-blue-50 to-cyan-50",
                overlay: "from-blue-500 via-cyan-500 to-indigo-500",
                iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
                badge: "from-blue-500 to-cyan-500",
                text: "text-blue-600",
              },
              {
                bg: "from-emerald-50 to-teal-50",
                overlay: "from-emerald-500 via-teal-500 to-cyan-500",
                iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
                badge: "from-emerald-500 to-teal-500",
                text: "text-emerald-600",
              },
              {
                bg: "from-amber-50 to-orange-50",
                overlay: "from-amber-500 via-orange-500 to-rose-500",
                iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
                badge: "from-amber-500 to-orange-500",
                text: "text-orange-600",
              },
            ];
            const palette = palettes[index % palettes.length];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="group cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div
                  className={`relative bg-gradient-to-br ${palette.bg} rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 backdrop-blur-sm`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${palette.overlay} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`p-4 rounded-2xl ${palette.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}
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
                      className={`text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:${palette.text} transition-colors`}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">
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
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions - glass */}
      <div className="px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <p className="text-gray-600">
                Jump to the most-used sales and marketing tools
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 1.0 + index * 0.1,
                      type: "spring",
                      stiffness: 100,
                    }}
                    whileHover={{
                      scale: 1.02,
                      y: -2,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      className="group flex items-center p-4 sm:p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 w-full"
                      onClick={() => navigate(action.path)}
                    >
                      <div
                        className={`p-3 rounded-xl ${action.color} mr-4 shadow-lg`}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-gray-800 font-semibold group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                        {action.title}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SalesMarketingModule;
