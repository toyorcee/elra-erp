import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDynamicSidebar } from "../../context/DynamicSidebarContext";
import {
  UsersIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  CubeIcon,
  PhoneIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  ShoppingBagIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  HomeIcon,
  UserPlusIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const { user } = useAuth();
  const { currentModule, isModuleView, getCurrentModuleInfo } =
    useDynamicSidebar();
  const { module } = useParams();

  // Get user role level
  const getUserRoleLevel = () => {
    if (!user) return 0;

    // Handle both string role and object role
    const roleValue = user.role?.name || user.role;

    switch (roleValue) {
      case "SUPER_ADMIN":
        return 1000;
      case "ADMIN":
        return 800;
      case "MANAGER":
        return 600;
      case "SUPERVISOR":
        return 400;
      case "USER":
        return 300;
      case "GUEST":
        return 100;
      default:
        return 100;
    }
  };

  const roleLevel = getUserRoleLevel();

  // Check if user has access to a specific level
  const hasAccess = (minLevel) => {
    return roleLevel >= minLevel;
  };

  // Get accessible modules based on user role
  const getAccessibleModules = () => {
    const allModules = [
      {
        key: "hr",
        label: "Human Resources",
        icon: UsersIcon,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        minLevel: 300,
        description: "Manage employees, recruitment, and HR processes",
      },
      {
        key: "payroll",
        label: "Payroll",
        icon: CurrencyDollarIcon,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        minLevel: 600,
        description: "Handle payroll processing and salary management",
      },
      {
        key: "procurement",
        label: "Procurement",
        icon: ShoppingCartIcon,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        minLevel: 600,
        description: "Manage purchasing and supplier relationships",
      },
      {
        key: "finance",
        label: "Finance",
        icon: CalculatorIcon,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        minLevel: 600,
        description: "Financial management and accounting",
      },
      {
        key: "communication",
        label: "Communication",
        icon: ChatBubbleLeftRightIcon,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        minLevel: 300,
        description: "Internal and external communication tools",
      },
      {
        key: "projects",
        label: "Projects",
        icon: FolderIcon,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        minLevel: 300,
        description: "Project management and task tracking",
      },
      {
        key: "inventory",
        label: "Inventory",
        icon: CubeIcon,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        minLevel: 300,
        description: "Stock management and asset tracking",
      },
      {
        key: "customer-care",
        label: "Customer Care",
        icon: PhoneIcon,
        color: "text-teal-600",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-200",
        minLevel: 300,
        description: "Customer support and service management",
      },
    ];

    return allModules.filter((module) => hasAccess(module.minLevel));
  };

  const accessibleModules = getAccessibleModules();

  // Render module card
  const renderModuleCard = (module) => {
    const IconComponent = module.icon;

    return (
      <div
        key={module.key}
        className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${module.bgColor} ${module.borderColor} border-2 rounded-2xl p-6`}
        onClick={() =>
          (window.location.href = `/dashboard/modules/${module.key}`)
        }
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${module.bgColor} ${module.color}`}>
            <IconComponent className="h-8 w-8" />
          </div>
          <div
            className={`text-xs font-semibold px-3 py-1 rounded-full ${module.bgColor} ${module.color}`}
          >
            {module.minLevel === 1000
              ? "SUPER ADMIN"
              : module.minLevel === 800
              ? "ADMIN"
              : module.minLevel === 600
              ? "MANAGER+"
              : module.minLevel === 400
              ? "SUPERVISOR+"
              : module.minLevel === 300
              ? "USER+"
              : "GUEST+"}
          </div>
        </div>

        <h3 className={`text-xl font-bold ${module.color} mb-2`}>
          {module.label}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed">
          {module.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">Click to access</span>
          <div
            className={`p-2 rounded-lg ${module.bgColor} ${module.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
          >
            <ArrowTrendingUpIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  };

  // Render dynamic module dashboard content
  const renderDynamicModuleDashboard = () => {
    const moduleInfo = getCurrentModuleInfo();
    const currentModuleData = accessibleModules.find((m) => m.key === module);

    if (!currentModuleData) {
      return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Module Not Found
            </h1>
            <p className="text-gray-600">
              The requested module is not available.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Module Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-4 mb-6">
            <div
              className={`p-3 rounded-xl ${currentModuleData.bgColor} ${currentModuleData.color}`}
            >
              <currentModuleData.icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${currentModuleData.color}`}>
                {currentModuleData.label} Module
              </h1>
              <p className="text-gray-600">{currentModuleData.description}</p>
            </div>
          </div>
        </div>

        {/* Module Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getModuleStats(currentModuleData.key).map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Module Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getModuleQuickActions(currentModuleData.key).map(
              (action, index) => (
                <button
                  key={index}
                  className={`p-4 rounded-xl border-2 border-dashed ${action.borderColor} hover:${action.bgColor} hover:${action.color} transition-all duration-200 group`}
                  onClick={action.onClick}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${action.iconBgColor} ${action.iconColor}`}
                    >
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 group-hover:text-white">
                        {action.label}
                      </p>
                      <p className="text-sm text-gray-500 group-hover:text-gray-200">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Module Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {getModuleRecentActivity(currentModuleData.key).map(
              (activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50"
                >
                  <div
                    className={`p-2 rounded-full ${activity.bgColor} ${activity.color}`}
                  >
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get module-specific statistics
  const getModuleStats = (moduleKey) => {
    const stats = {
      payroll: [
        {
          label: "Total Employees",
          value: "156",
          icon: UsersIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        },
        {
          label: "This Month",
          value: "$89,420",
          icon: CurrencyDollarIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Pending",
          value: "12",
          icon: ClockIcon,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        },
        {
          label: "Processed",
          value: "144",
          icon: CheckIcon,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
        },
      ],
      hr: [
        {
          label: "Total Staff",
          value: "156",
          icon: UsersIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        },
        {
          label: "New Hires",
          value: "8",
          icon: UserPlusIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "On Leave",
          value: "5",
          icon: ClockIcon,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        },
        {
          label: "Departments",
          value: "12",
          icon: BuildingOffice2Icon,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        },
      ],
      finance: [
        {
          label: "Revenue",
          value: "$2.4M",
          icon: ArrowTrendingUpIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Expenses",
          value: "$1.8M",
          icon: ArrowTrendingDownIcon,
          color: "text-red-600",
          bgColor: "bg-red-50",
        },
        {
          label: "Profit",
          value: "$600K",
          icon: CalculatorIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        },
        {
          label: "Pending",
          value: "$45K",
          icon: ClockIcon,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        },
      ],
    };

    return stats[moduleKey] || stats.hr; // Default to HR stats
  };

  // Get module-specific quick actions
  const getModuleQuickActions = (moduleKey) => {
    const actions = {
      payroll: [
        {
          label: "Process Payroll",
          description: "Run monthly payroll",
          icon: CalculatorIcon,
          iconColor: "text-green-600",
          iconBgColor: "bg-green-50",
          borderColor: "border-green-200",
          bgColor: "bg-green-500",
          color: "text-white",
          onClick: () => console.log("Process Payroll"),
        },
        {
          label: "Add Employee",
          description: "Register new employee",
          icon: UserPlusIcon,
          iconColor: "text-blue-600",
          iconBgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          bgColor: "bg-blue-500",
          color: "text-white",
          onClick: () => console.log("Add Employee"),
        },
        {
          label: "View Reports",
          description: "Generate payroll reports",
          icon: ChartBarIcon,
          iconColor: "text-purple-600",
          iconBgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          bgColor: "bg-purple-500",
          color: "text-white",
          onClick: () => console.log("View Reports"),
        },
      ],
      hr: [
        {
          label: "Add Staff",
          description: "Register new employee",
          icon: UserPlusIcon,
          iconColor: "text-blue-600",
          iconBgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          bgColor: "bg-blue-500",
          color: "text-white",
          onClick: () => console.log("Add Staff"),
        },
        {
          label: "Leave Requests",
          description: "Manage time off",
          icon: ClockIcon,
          iconColor: "text-yellow-600",
          iconBgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          bgColor: "bg-yellow-500",
          color: "text-white",
          onClick: () => console.log("Leave Requests"),
        },
        {
          label: "Performance",
          description: "Review evaluations",
          icon: ChartBarIcon,
          iconColor: "text-purple-600",
          iconBgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          bgColor: "bg-purple-500",
          color: "text-white",
          onClick: () => console.log("Performance"),
        },
      ],
      finance: [
        {
          label: "Add Transaction",
          description: "Record new entry",
          icon: PlusIcon,
          iconColor: "text-green-600",
          iconBgColor: "bg-green-50",
          borderColor: "border-green-200",
          bgColor: "bg-green-500",
          color: "text-white",
          onClick: () => console.log("Add Transaction"),
        },
        {
          label: "View Reports",
          description: "Financial statements",
          icon: ChartBarIcon,
          iconColor: "text-blue-600",
          iconBgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          bgColor: "bg-blue-500",
          color: "text-white",
          onClick: () => console.log("View Reports"),
        },
        {
          label: "Budget Planning",
          description: "Plan expenses",
          icon: CalculatorIcon,
          iconColor: "text-purple-600",
          iconBgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          bgColor: "bg-purple-500",
          color: "text-white",
          onClick: () => console.log("Budget Planning"),
        },
      ],
    };

    return actions[moduleKey] || actions.hr; // Default to HR actions
  };

  // Get module-specific recent activity
  const getModuleRecentActivity = (moduleKey) => {
    const activities = {
      payroll: [
        {
          title: "Payroll Processed",
          description: "Monthly payroll completed for 156 employees",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
          time: "2 hours ago",
        },
        {
          title: "New Employee Added",
          description: "John Doe added to payroll system",
          icon: UserPlusIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          time: "4 hours ago",
        },
        {
          title: "Tax Update",
          description: "Tax rates updated for Q4",
          icon: ReceiptPercentIcon,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          time: "1 day ago",
        },
      ],
      hr: [
        {
          title: "New Hire",
          description: "Sarah Wilson joined Marketing team",
          icon: UserPlusIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
          time: "1 hour ago",
        },
        {
          title: "Leave Approved",
          description: "Mike's vacation request approved",
          icon: CheckIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          time: "3 hours ago",
        },
        {
          title: "Performance Review",
          description: "Annual review completed for IT team",
          icon: ChartBarIcon,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          time: "1 day ago",
        },
      ],
      finance: [
        {
          title: "Invoice Paid",
          description: "Client payment received - $15,000",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
          time: "30 minutes ago",
        },
        {
          title: "Expense Added",
          description: "Office supplies - $450",
          icon: MinusIcon,
          color: "text-red-600",
          bgColor: "bg-red-50",
          time: "2 hours ago",
        },
        {
          title: "Report Generated",
          description: "Monthly financial report created",
          icon: ChartBarIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          time: "1 day ago",
        },
      ],
    };

    return activities[moduleKey] || activities.hr; // Default to HR activities
  };

  // Render dashboard content based on current view
  const renderDashboardContent = () => {
    if (isModuleView && currentModule) {
      return renderDynamicModuleDashboard();
    }

    // Main dashboard view
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <HomeIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.firstName || "User"}!
              </h1>
              <p className="text-blue-100 text-lg">
                Access your ERP modules and manage your business operations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">
                {accessibleModules.length}
              </div>
              <div className="text-blue-100 text-sm">Available Modules</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">
                {user?.role?.name || "USER"}
              </div>
              <div className="text-blue-100 text-sm">Your Role</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{roleLevel}</div>
              <div className="text-blue-100 text-sm">Access Level</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-gray-900">56</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <FolderIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$89.4K</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                <p className="text-2xl font-bold text-gray-900">234</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <ClipboardDocumentListIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ERP Modules Grid */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ERP Modules
            </h2>
            <p className="text-gray-600">
              Access and manage different aspects of your business operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {accessibleModules.map(renderModuleCard)}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Recent Activity
            </h2>
            <p className="text-gray-600">
              Latest updates and activities across your system
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: UsersIcon,
                text: "New employee John Doe added to HR system",
                time: "2 hours ago",
                color: "text-blue-600",
              },
              {
                icon: FolderIcon,
                text: "Project 'Website Redesign' status updated to 'In Progress'",
                time: "4 hours ago",
                color: "text-green-600",
              },
              {
                icon: CurrencyDollarIcon,
                text: "Monthly payroll processed for 156 employees",
                time: "1 day ago",
                color: "text-emerald-600",
              },
              {
                icon: ShoppingCartIcon,
                text: "New purchase order #PO-2024-001 created",
                time: "2 days ago",
                color: "text-purple-600",
              },
              {
                icon: CubeIcon,
                text: "Low stock alert: Office supplies running low",
                time: "3 days ago",
                color: "text-red-600",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className={`p-2 rounded-lg bg-white ${activity.color}`}>
                  <activity.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{activity.text}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to get icon component
  const getIconComponent = (iconName) => {
    const iconMap = {
      UsersIcon,
      CurrencyDollarIcon,
      ShoppingCartIcon,
      CalculatorIcon,
      ChatBubbleLeftRightIcon,
      FolderIcon,
      CubeIcon,
      PhoneIcon,
      UserGroupIcon,
      ShieldCheckIcon,
      BuildingOffice2Icon,
      DocumentTextIcon,
      ArchiveBoxIcon,
      ChartBarIcon,
      ChartPieIcon,
      ClipboardDocumentListIcon,
      BriefcaseIcon,
      ShoppingBagIcon,
      EnvelopeIcon,
      MapPinIcon,
      ClockIcon,
      ArrowTrendingUpIcon,
      ChartBarIcon,
      HomeIcon,
    };
    return iconMap[iconName] || HomeIcon;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboardContent()}
      </div>
    </div>
  );
};

export default Dashboard;
