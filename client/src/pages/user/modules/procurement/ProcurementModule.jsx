import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import {
  FaShoppingCart,
  FaFileInvoice,
  FaSearch,
  FaChartBar,
  FaArrowRight,
  FaCog,
  FaRocket,
} from "react-icons/fa";

const ProcurementModule = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const procurementFeatures = [
    {
      title: "Purchase Orders",
      description:
        "Streamline procurement workflows with intelligent order management",
      icon: FaFileInvoice,
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      bgGradient: "from-indigo-50 to-purple-50",
      iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
      path: "/dashboard/modules/procurement/orders",
      status: "Active",
      badge: "Orders",
      stats: "24/7",
    },
    {
      title: "Procurement Tracking",
      description:
        "Real-time visibility into procurement status across all projects",
      icon: FaSearch,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      bgGradient: "from-emerald-50 to-teal-50",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      path: "/dashboard/modules/procurement/tracking",
      status: "Active",
      badge: "Tracking",
      stats: "Live",
    },
    {
      title: "Procurement Reports",
      description:
        "Advanced analytics and insights for strategic decision making",
      icon: FaChartBar,
      gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
      bgGradient: "from-rose-50 to-pink-50",
      iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
      path: "/dashboard/modules/procurement/reports",
      status: "Active",
      badge: "Analytics",
      stats: "AI-Powered",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <GradientSpinner variant="white-green" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-8 shadow-2xl">
              <FaShoppingCart className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Procurement Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transform your procurement processes with intelligent automation,
              real-time tracking, and data-driven insights that drive business
              success.
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
            Everything you need to manage procurement efficiently and
            effectively
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {procurementFeatures.map((feature, index) => {
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
                  className={`relative bg-gradient-to-br ${feature.bgGradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 backdrop-blur-sm`}
                >
                  {/* Animated Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`p-4 rounded-2xl ${feature.iconBg} shadow-lg`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                          {feature.status}
                        </span>
                        <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-xs font-semibold">
                          {feature.badge}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-indigo-600">
                          {feature.stats}
                        </span>
                        <div className="flex items-center text-indigo-600 font-medium">
                          <span>Explore</span>
                          <FaArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
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
                Get started with these essential procurement tasks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {procurementFeatures.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.button
                    key={action.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="group flex items-center p-6 rounded-2xl bg-gradient-to-r from-white to-gray-50 hover:from-indigo-50 hover:to-purple-50 border border-gray-200 hover:border-indigo-300 transition-all duration-300 transform hover:scale-105"
                    onClick={() => navigate(action.path)}
                  >
                    <div
                      className={`p-3 rounded-xl ${action.iconBg} mr-4 shadow-lg`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-gray-800 font-semibold group-hover:text-indigo-600 transition-colors">
                        {action.title}
                      </span>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500">
                          Access now
                        </span>
                        <FaArrowRight className="ml-2 h-3 w-3 text-indigo-500 transform group-hover:translate-x-1 transition-transform" />
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

export default ProcurementModule;
