import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  DocumentTextIcon,
  CreditCardIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  TicketIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const SelfServiceLayout = () => {
  const { user } = useAuth();

  const navigation = [
    {
      name: "My Documents",
      href: "/user/self-service/documents",
      icon: DocumentTextIcon,
      description: "View and manage your documents",
    },
    {
      name: "My Payslips",
      href: "/user/self-service/payslips",
      icon: CreditCardIcon,
      description: "Access your payslips and salary information",
    },
    {
      name: "Leave Requests",
      href: "/user/self-service/leave",
      icon: CalendarIcon,
      description: "Submit and track leave requests",
    },
    {
      name: "Equipment Requests",
      href: "/user/self-service/equipment",
      icon: WrenchScrewdriverIcon,
      description: "Request equipment and tools",
    },
    {
      name: "My Tickets",
      href: "/user/self-service/tickets",
      icon: TicketIcon,
      description: "View your support tickets",
    },
    {
      name: "IT Support",
      href: "/user/self-service/it-support",
      icon: ComputerDesktopIcon,
      description: "Get IT support and assistance",
    },
    {
      name: "Project Tasks",
      href: "/user/self-service/project-tasks",
      icon: CheckCircleIcon,
      description: "Manage tasks from your assigned projects",
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
