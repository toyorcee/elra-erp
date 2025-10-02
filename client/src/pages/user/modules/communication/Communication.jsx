import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";

const Communication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: "messages",
      label: "Internal Messages",
      icon: ChatBubbleLeftRightIcon,
      description:
        "Send and receive internal messages with Gmail-like interface",
      path: "/dashboard/modules/communication/messages",
      gradient: "from-pink-500 via-rose-500 to-fuchsia-500",
      bgGradient: "from-pink-50 to-rose-50",
      iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
      status: "Active",
      badge: "Messages",
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: MegaphoneIcon,
      description: "Create and manage company-wide announcements",
      path: "/dashboard/modules/communication/announcements",
      gradient: "from-purple-500 via-violet-500 to-indigo-500",
      bgGradient: "from-purple-50 to-violet-50",
      iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
      status: "Active",
      badge: "Announcements",
    },
    {
      id: "events",
      label: "Events Calendar",
      icon: CalendarIcon,
      description: "View and manage company events and meetings",
      path: "/dashboard/modules/communication/events",
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      bgGradient: "from-orange-50 to-amber-50",
      iconBg: "bg-gradient-to-br from-orange-500 to-amber-600",
      status: "Active",
      badge: "Events",
    },
  ];

  const canAccess = (item) => {
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-rose-50">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl mb-8 shadow-2xl">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Communication Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Stay connected with your team through intelligent messaging,
              announcements, and event management that drives collaboration.
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
            Communication Tools
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to stay connected and collaborate effectively
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.2 }}
                className="group cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <div
                  className={`relative bg-gradient-to-br ${item.bgGradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 backdrop-blur-sm`}
                >
                  {/* Animated Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`p-4 rounded-2xl ${item.iconBg} shadow-lg`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                          {item.status}
                        </span>
                        <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-xs font-semibold">
                          {item.badge}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-pink-600 transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-pink-600">
                          {item.stats}
                        </span>
                        <div className="flex items-center text-pink-600 font-medium">
                          <span>Explore</span>
                          <ArrowRightIcon className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
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
                Get started with these essential communication tasks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {navigationItems.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="group flex items-center p-6 rounded-2xl bg-gradient-to-r from-white to-gray-50 hover:from-pink-50 hover:to-rose-50 border border-gray-200 hover:border-pink-300 transition-all duration-300 transform hover:scale-105"
                    onClick={() => navigate(action.path)}
                  >
                    <div
                      className={`p-3 rounded-xl ${action.iconBg} mr-4 shadow-lg`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-gray-800 font-semibold group-hover:text-pink-600 transition-colors">
                        {action.label}
                      </span>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500">
                          Access now
                        </span>
                        <ArrowRightIcon className="ml-2 h-3 w-3 text-pink-500 transform group-hover:translate-x-1 transition-transform" />
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

export default Communication;
