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
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      path: "/dashboard/modules/self-service/payslips",
      status: "Active",
      badge: "Payroll",
    },
    {
      title: "My Documents",
      description: "View, upload, and scan documents with OCR processing",
      icon: FaFileAlt,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
      path: "/dashboard/modules/self-service/documents",
      status: "Active",
      badge: "Core Feature",
    },
    {
      title: "My Projects",
      description: "Create and manage your personal projects",
      icon: FaProjectDiagram,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      path: "/dashboard/modules/self-service/my-projects",
      status: "Active",
      badge: "Projects",
    },
    {
      title: "My Leave Requests",
      description: "View your leave and other requests",
      icon: FaCalendarAlt,
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      path: "/dashboard/modules/self-service/leave-requests",
      status: "Active",
      badge: "HR",
    },
    {
      title: "My Archive",
      description: "Access your archived documents and historical records",
      icon: FaArchive,
      color: "bg-gradient-to-br from-emerald-500 to-teal-600",
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
    <motion.div
      className="w-full max-w-7xl mx-auto py-8 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center mb-4">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaUser className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <motion.h1
              className="text-3xl font-bold text-gray-900"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Self-Service
            </motion.h1>
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Personal services and self-management tools for all employees
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Welcome Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.h2
          className="text-2xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Welcome to Self-Service
        </motion.h2>
        <motion.p
          className="text-gray-600"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Access your personal information, manage requests, and handle your own
          administrative tasks.
        </motion.p>
      </motion.div>

      {/* Core Features Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        {selfServiceFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <motion.div
              key={feature.title}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.8 + index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={feature.path} className="block">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      className={`p-3 rounded-lg ${feature.color}`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </motion.div>
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
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions Section */}
      <motion.div
        className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.3 }}
      >
        <motion.h3
          className="text-lg font-semibold text-gray-900 mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.4 }}
        >
          Quick Actions
        </motion.h3>
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
                  className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SelfService;
