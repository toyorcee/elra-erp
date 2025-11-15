import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { FaComments, FaBullhorn, FaCalendarAlt } from "react-icons/fa";

const Communication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: "messages",
      label: "Internal Messages",
      icon: FaComments,
      description:
        "Send and receive internal messages with Gmail-like interface",
      path: "/dashboard/modules/communication/messages",
      badge: "Messages",
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: FaBullhorn,
      description: "Create and manage company-wide announcements",
      path: "/dashboard/modules/communication/announcements",
      badge: "Announcements",
    },
    {
      id: "events",
      label: "Events Calendar",
      icon: FaCalendarAlt,
      description: "View and manage company events and meetings",
      path: "/dashboard/modules/communication/events",
      badge: "Events",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-lg mb-6">
            <FaComments className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Communication Hub
          </h1>
          <p className="text-lg text-gray-600">
            Stay connected with your team through intelligent messaging,
            announcements, and event management that drives collaboration.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <IconComponent className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-semibold">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.label}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">{item.description}</p>
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

export default Communication;
