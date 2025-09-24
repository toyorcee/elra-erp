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

  // Communication module sidebar configuration
  const communicationSidebarConfig = {
    label: "Communication",
    icon: "ChatBubbleLeftRightIcon",
    path: "/dashboard/modules/communication",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    sections: [
      {
        title: "Messaging & Collaboration",
        items: [
          {
            label: "Internal Messages",
            icon: "ChatBubbleLeftIcon",
            path: "/dashboard/modules/communication/messages",
            required: { minLevel: 300 },
            description: "Send and receive internal messages",
          },
          // {
          //   label: "Team Chats",
          //   icon: "UsersIcon",
          //   path: "/dashboard/modules/communication/teams",
          //   required: { minLevel: 300 },
          //   description: "Collaborate in team chat rooms",
          // },
        ],
      },
      {
        title: "Announcements",
        items: [
          {
            label: "Announcements",
            icon: "MegaphoneIcon",
            path: "/dashboard/modules/communication/announcements",
            required: { minLevel: 600 },
            description: "Create and manage announcements",
          },
        ],
      },
    ],
  };

  // Sidebar for this module is populated automatically by DynamicSidebarContext

  const navigationItems = [
    {
      id: "messages",
      label: "Internal Messages",
      icon: ChatBubbleLeftRightIcon,
      description:
        "Send and receive internal messages with Gmail-like interface",
      path: "/dashboard/modules/communication/messages",
      color: "pink",
      stats: "12 active conversations",
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: MegaphoneIcon,
      description: "Create and manage company-wide announcements",
      path: "/dashboard/modules/communication/announcements",
      color: "purple",
      stats: "3 recent announcements",
      requiredLevel: 700, // HR department only
      requiredDepartment: "Human Resources",
    },
    {
      id: "events",
      label: "Events Calendar",
      icon: CalendarIcon,
      description: "View and manage company events and meetings",
      path: "/dashboard/modules/communication/events",
      color: "orange",
      stats: "5 upcoming events",
      requiredLevel: 700,
      requiredDepartment: "Human Resources",
    },
  ];

  const canAccess = (item) => {
    // Check role level
    if (item.requiredLevel && user?.role?.level < item.requiredLevel) {
      return false;
    }

    // Check department
    if (
      item.requiredDepartment &&
      user?.department?.name !== item.requiredDepartment
    ) {
      return false;
    }

    return true;
  };

  const getColorClasses = (color) => {
    const colors = {
      pink: {
        bg: "bg-pink-50",
        hover: "hover:bg-pink-100",
        border: "border-pink-200",
        hoverBorder: "hover:border-pink-300",
        icon: "text-pink-600",
        iconBg: "bg-pink-100",
        button: "bg-pink-50 hover:bg-pink-100 text-pink-700",
      },
      blue: {
        bg: "bg-blue-50",
        hover: "hover:bg-blue-100",
        border: "border-blue-200",
        hoverBorder: "hover:border-blue-300",
        icon: "text-blue-600",
        iconBg: "bg-blue-100",
        button: "bg-blue-50 hover:bg-blue-100 text-blue-700",
      },
      green: {
        bg: "bg-green-50",
        hover: "hover:bg-green-100",
        border: "border-green-200",
        hoverBorder: "hover:border-green-300",
        icon: "text-green-600",
        iconBg: "bg-green-100",
        button: "bg-green-50 hover:bg-green-100 text-green-700",
      },
      purple: {
        bg: "bg-purple-50",
        hover: "hover:bg-purple-100",
        border: "border-purple-200",
        hoverBorder: "hover:border-purple-300",
        icon: "text-purple-600",
        iconBg: "bg-purple-100",
        button: "bg-purple-50 hover:bg-purple-100 text-purple-700",
      },
      orange: {
        bg: "bg-orange-50",
        hover: "hover:bg-orange-100",
        border: "border-orange-200",
        hoverBorder: "hover:border-orange-300",
        icon: "text-orange-600",
        iconBg: "bg-orange-100",
        button: "bg-orange-50 hover:bg-orange-100 text-orange-700",
      },
    };
    return colors[color] || colors.pink;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-pink-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Communication Hub
                </h1>
                <p className="text-sm text-gray-500">
                  Stay connected with your team
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, {user?.firstName} {user?.lastName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Communication Hub
          </h2>
          <p className="text-gray-600">
            Choose a communication tool to get started or explore your options
            below.
          </p>
        </motion.div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {navigationItems.map((item, index) => {
            const colors = getColorClasses(item.color);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={`bg-white rounded-xl shadow-sm border ${
                  colors.border
                } p-6 hover:shadow-md transition-all duration-200 cursor-pointer ${
                  !canAccess(item)
                    ? "opacity-50 cursor-not-allowed"
                    : `hover:${colors.hoverBorder}`
                }`}
                onClick={() => canAccess(item) && navigate(item.path)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 ${colors.iconBg} rounded-lg`}>
                      <item.icon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.label}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {item.description}
                      </p>
                      <p className="text-xs text-gray-400 mb-4">{item.stats}</p>
                      {!canAccess(item) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.requiredDepartment
                            ? `Requires ${item.requiredDepartment} Department`
                            : "Requires Manager+ Access"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-pink-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() =>
                navigate("/dashboard/modules/communication/messages")
              }
              className="flex items-center justify-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-pink-600 mr-2" />
              <span className="text-sm font-medium text-pink-700">
                New Message
              </span>
            </button>
            <button
              onClick={() =>
                navigate("/dashboard/modules/communication/announcements")
              }
              className="flex items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <MegaphoneIcon className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-700">
                Create Announcement
              </span>
            </button>
            <button
              onClick={() =>
                navigate("/dashboard/modules/communication/events")
              }
              className="flex items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <CalendarIcon className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-700">
                View Events
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Communication;
