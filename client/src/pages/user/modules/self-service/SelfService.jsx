import React from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import { motion } from "framer-motion";
import {
  FaFileAlt,
  FaCreditCard,
  FaCalendarAlt,
  FaArchive,
  FaProjectDiagram,
  FaUser,
} from "react-icons/fa";

const SelfService = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const [loading, setLoading] = React.useState(false);

  const selfServiceFeatures = [
    {
      title: "My Payslips",
      description: "View and download your personal payslips",
      icon: FaCreditCard,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      bgGradient: "from-emerald-50 to-teal-50",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      path: "/dashboard/modules/self-service/payslips",
      status: "Active",
      badge: "Payroll",
    },
    {
      title: "My Documents",
      description: "View, upload, and scan documents with OCR processing",
      icon: FaFileAlt,
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      bgGradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      path: "/dashboard/modules/self-service/documents",
      status: "Active",
      badge: "Core Feature",
    },
    {
      title: "My Projects",
      description: "Create and manage your personal projects",
      icon: FaProjectDiagram,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      bgGradient: "from-orange-50 to-amber-50",
      iconBg: "bg-gradient-to-br from-orange-500 to-amber-600",
      path: "/dashboard/modules/self-service/my-projects",
      status: "Active",
      badge: "Projects",
    },
    {
      title: "My Leave Requests",
      description: "View your leave and other requests",
      icon: FaCalendarAlt,
      gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
      bgGradient: "from-rose-50 to-pink-50",
      iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
      path: "/dashboard/modules/self-service/leave-requests",
      status: "Active",
      badge: "HR",
    },
    {
      title: "My Archive",
      description: "Access your archived documents and historical records",
      icon: FaArchive,
      gradient: "from-slate-500 via-gray-500 to-zinc-500",
      bgGradient: "from-slate-50 to-gray-50",
      iconBg: "bg-gradient-to-br from-slate-500 to-gray-600",
      path: "/dashboard/modules/self-service/my-archive",
      status: "Active",
      badge: "Archive",
    },
  ];

  const quickActions = [
    {
      title: "My Payslips",
      icon: FaCreditCard,
      color: "bg-green-500",
      path: "/dashboard/modules/self-service/payslips",
    },
    {
      title: "My Documents",
      icon: FaFileAlt,
      color: "bg-blue-500",
      path: "/dashboard/modules/self-service/documents",
    },
    {
      title: "My Projects",
      icon: FaProjectDiagram,
      color: "bg-orange-500",
      path: "/dashboard/modules/self-service/my-projects",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="relative z-10 px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-8 shadow-2xl">
              <FaUser className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Self-Service
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Personal services and self-management tools for all employees.
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Tools</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access your personal information, manage requests, and handle your
            own administrative tasks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {selfServiceFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.2 }}
                className="group cursor-pointer"
              >
                <Link to={feature.path} className="block">
                  <div
                    className={`relative bg-gradient-to-br ${
                      feature.bgGradient || "from-white to-gray-50"
                    } rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 backdrop-blur-sm`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        feature.gradient || ""
                      } opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}
                    ></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div
                          className={`p-4 rounded-2xl ${
                            feature.iconBg || "bg-blue-500"
                          } shadow-lg`}
                        >
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                            {feature.status}
                          </span>
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-semibold">
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
                </Link>
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
                Jump to the most-used self-service tools
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 1.5 + index * 0.1,
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
                    <Link
                      to={action.path}
                      className="group flex items-center p-6 rounded-2xl bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105"
                    >
                      <div
                        className={`p-3 rounded-xl ${action.color} mr-4 shadow-lg`}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-gray-800 font-semibold group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </span>
                    </Link>
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

export default SelfService;
