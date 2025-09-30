import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  DocumentTextIcon,
  CreditCardIcon,
  CalendarIcon,
  ArchiveBoxIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";

const SelfServiceLayout = () => {
  const { user } = useAuth();

  const navigation = [
    {
      name: "My Payslips",
      href: "/dashboard/modules/self-service/payslips",
      icon: CreditCardIcon,
      description: "View and download your personal payslips",
    },
    {
      name: "My Documents",
      href: "/dashboard/modules/self-service/documents",
      icon: DocumentTextIcon,
      description: "View, upload, and scan documents with OCR processing",
    },
    {
      name: "My Projects",
      href: "/dashboard/modules/self-service/my-projects",
      icon: FolderIcon,
      description: "Create and manage your personal projects",
    },
    {
      name: "My Leave Requests",
      href: "/dashboard/modules/self-service/leave-requests",
      icon: CalendarIcon,
      description: "View your leave and other requests",
    },
    {
      name: "My Archive",
      href: "/dashboard/modules/self-service/my-archive",
      icon: ArchiveBoxIcon,
      description: "Access your archived documents and historical records",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Self-Service</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user?.firstName}! Manage your personal information
              and access your data.
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group relative bg-white p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`
                }
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <item.icon
                      className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </NavLink>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfServiceLayout;
