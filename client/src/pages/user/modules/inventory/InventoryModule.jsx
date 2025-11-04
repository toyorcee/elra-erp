import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import {
  FaBoxes,
  FaList,
  FaChartLine,
  FaSearch,
} from "react-icons/fa";

const InventoryModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const hasAccess = (item) => {
    const userLevel = user?.role?.level || 0;
    const userDepartment = user?.department?.name;
    const isSuperAdmin = userLevel === 1000;

    if (isSuperAdmin) {
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

  const inventoryFeatures = [
    {
      title: "Inventory List",
      description: "View and manage all inventory items",
      icon: FaList,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      path: "/dashboard/modules/inventory/list",
      status: "Active",
      badge: "List",
      required: { minLevel: 600, department: "Operations" },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isOperationsHOD =
          user?.role?.level === 700 && userDepartment === "Operations";
        const isOperationsManager =
          user?.role?.level >= 600 &&
          user?.role?.level < 700 &&
          userDepartment === "Operations";

        return !(isSuperAdmin || isOperationsHOD || isOperationsManager);
      },
    },
    {
      title: "Inventory Tracking",
      description: "Track maintenance schedules and available items",
      icon: FaSearch,
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      path: "/dashboard/modules/inventory/tracking",
      status: "Active",
      badge: "Tracking",
      required: { minLevel: 600, department: "Operations" },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isOperationsHOD =
          user?.role?.level === 700 && userDepartment === "Operations";
        const isOperationsManager =
          user?.role?.level >= 600 &&
          user?.role?.level < 700 &&
          userDepartment === "Operations";

        return !(isSuperAdmin || isOperationsHOD || isOperationsManager);
      },
    },
    {
      title: "Inventory Reports",
      description: "Generate inventory reports and analytics",
      icon: FaChartLine,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      path: "/dashboard/modules/inventory/reports",
      status: "Active",
      badge: "Reports",
      required: { minLevel: 600, department: "Operations" },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isOperationsHOD =
          user?.role?.level === 700 && userDepartment === "Operations";
        const isOperationsManager =
          user?.role?.level >= 600 &&
          user?.role?.level < 700 &&
          userDepartment === "Operations";

        return !(isSuperAdmin || isOperationsHOD || isOperationsManager);
      },
    },
  ].filter(hasAccess);

  const quickActions = [
    {
      title: "Inventory List",
      icon: FaList,
      color: "bg-green-500",
      path: "/dashboard/modules/inventory/list",
      required: { minLevel: 600, department: "Operations" },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isOperationsHOD =
          user?.role?.level === 700 && userDepartment === "Operations";
        const isOperationsManager =
          user?.role?.level >= 600 &&
          user?.role?.level < 700 &&
          userDepartment === "Operations";

        return !(isSuperAdmin || isOperationsHOD || isOperationsManager);
      },
    },
    {
      title: "Inventory Tracking",
      icon: FaSearch,
      color: "bg-purple-500",
      path: "/dashboard/modules/inventory/tracking",
      required: { minLevel: 600, department: "Operations" },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isOperationsHOD =
          user?.role?.level === 700 && userDepartment === "Operations";
        const isOperationsManager =
          user?.role?.level >= 600 &&
          user?.role?.level < 700 &&
          userDepartment === "Operations";

        return !(isSuperAdmin || isOperationsHOD || isOperationsManager);
      },
    },
    {
      title: "Inventory Reports",
      icon: FaChartLine,
      color: "bg-orange-500",
      path: "/dashboard/modules/inventory/reports",
      required: { minLevel: 600, department: "Operations" },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isOperationsHOD =
          user?.role?.level === 700 && userDepartment === "Operations";
        const isOperationsManager =
          user?.role?.level >= 600 &&
          user?.role?.level < 700 &&
          userDepartment === "Operations";

        return !(isSuperAdmin || isOperationsHOD || isOperationsManager);
      },
    },
  ].filter(hasAccess);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner variant="white-green" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="relative z-10 px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl mb-8 shadow-2xl">
              <FaBoxes className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-6">
              Inventory Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Track stock, manage workflows, and get insights that power
              reliable operations.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage inventory efficiently and effectively
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {inventoryFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.2 }}
                className="group cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div
                  className={`relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 backdrop-blur-sm`}
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`p-4 rounded-2xl ${feature.color} shadow-lg`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                          {feature.status}
                        </span>
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs font-semibold">
                          {feature.badge}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-600 font-medium">
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
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <p className="text-gray-600">
                Jump into the most common inventory tasks
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.button
                    key={action.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="group flex items-center p-6 rounded-2xl bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-cyan-50 border border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105"
                    onClick={() => navigate(action.path)}
                  >
                    <div
                      className={`p-3 rounded-xl ${action.color} mr-4 shadow-lg`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-gray-800 font-semibold group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </span>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500">
                          Access now
                        </span>
                        <svg
                          className="ml-2 h-3 w-3 text-blue-500 transform group-hover:translate-x-1 transition-transform"
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
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryModule;
