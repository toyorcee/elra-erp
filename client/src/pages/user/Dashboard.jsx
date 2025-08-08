import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  canAccessModule,
  ERP_MODULES,
  isSuperAdmin,
  isHOD,
  isManager,
  isStaff,
  isViewer,
} from "../../constants/userRoles";
import { GradientSpinner } from "../../components/common";
import {
  FaUsers,
  FaMoneyBillWave,
  FaShoppingCart,
  FaChartLine,
  FaComments,
  FaFileAlt,
  FaProjectDiagram,
  FaBoxes,
  FaHeadset,
  FaUserPlus,
  FaCalendarAlt,
  FaChartBar,
  FaCog,
  FaBell,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Get role-based stats
  const getRoleBasedStats = (user) => {
    if (isSuperAdmin(user)) {
      return [
        {
          title: "Total Users",
          value: "1,234",
          icon: FaUsers,
          color: "bg-blue-500",
          bgColor: "bg-blue-100",
        },
        {
          title: "Active Modules",
          value: "9",
          icon: FaCog,
          color: "bg-green-500",
          bgColor: "bg-green-100",
        },
        {
          title: "System Alerts",
          value: "5",
          icon: FaBell,
          color: "bg-red-500",
          bgColor: "bg-red-100",
        },
      ];
    } else if (isHOD(user)) {
      return [
        {
          title: "Department Staff",
          value: "45",
          icon: FaUsers,
          color: "bg-blue-500",
          bgColor: "bg-blue-100",
        },
        {
          title: "Pending Approvals",
          value: "12",
          icon: FaClock,
          color: "bg-yellow-500",
          bgColor: "bg-yellow-100",
        },
        {
          title: "Active Projects",
          value: "8",
          icon: FaProjectDiagram,
          color: "bg-green-500",
          bgColor: "bg-green-100",
        },
      ];
    } else if (isManager(user)) {
      return [
        {
          title: "Team Members",
          value: "15",
          icon: FaUsers,
          color: "bg-blue-500",
          bgColor: "bg-blue-100",
        },
        {
          title: "Tasks Due",
          value: "7",
          icon: FaClock,
          color: "bg-orange-500",
          bgColor: "bg-orange-100",
        },
        {
          title: "Completed Tasks",
          value: "23",
          icon: FaCheckCircle,
          color: "bg-green-500",
          bgColor: "bg-green-100",
        },
      ];
    } else {
      return [
        {
          title: "My Documents",
          value: "12",
          icon: FaFileAlt,
          color: "bg-blue-500",
          bgColor: "bg-blue-100",
        },
        {
          title: "Pending Tasks",
          value: "3",
          icon: FaClock,
          color: "bg-yellow-500",
          bgColor: "bg-yellow-100",
        },
        {
          title: "Completed Tasks",
          value: "18",
          icon: FaCheckCircle,
          color: "bg-green-500",
          bgColor: "bg-green-100",
        },
      ];
    }
  };

  // Get role-based quick actions
  const getRoleBasedActions = (user) => {
    const baseActions = [
      {
        title: "Documents",
        description: "Access document management",
        icon: FaFileAlt,
        color: "bg-indigo-500",
        path: "/dashboard/documents",
      },
    ];

    if (isSuperAdmin(user)) {
      return [
        ...baseActions,
        {
          title: "User Management",
          description: "Manage system users and roles",
          icon: FaUsers,
          color: "bg-blue-500",
          path: "/dashboard/admin/users",
        },
        {
          title: "System Settings",
          description: "Configure system parameters",
          icon: FaCog,
          color: "bg-gray-500",
          path: "/dashboard/admin/settings",
        },
      ];
    } else if (isHOD(user)) {
      return [
        ...baseActions,
        {
          title: "Staff Management",
          description: "Manage department staff",
          icon: FaUsers,
          color: "bg-blue-500",
          path: "/dashboard/modules/hr",
        },
        {
          title: "Approvals",
          description: "Review pending approvals",
          icon: FaCheckCircle,
          color: "bg-green-500",
          path: "/dashboard/approvals",
        },
      ];
    } else if (isManager(user)) {
      return [
        ...baseActions,
        {
          title: "Team Tasks",
          description: "Manage team assignments",
          icon: FaProjectDiagram,
          color: "bg-purple-500",
          path: "/dashboard/modules/projects",
        },
        {
          title: "Reports",
          description: "View department reports",
          icon: FaChartBar,
          color: "bg-orange-500",
          path: "/dashboard/reports",
        },
      ];
    } else {
      return [
        ...baseActions,
        {
          title: "My Tasks",
          description: "View assigned tasks",
          icon: FaClock,
          color: "bg-yellow-500",
          path: "/dashboard/tasks",
        },
        {
          title: "Profile",
          description: "Update personal information",
          icon: FaUsers,
          color: "bg-blue-500",
          path: "/dashboard/profile",
        },
      ];
    }
  };

  // Get role-based recent activities
  const getRoleBasedActivities = (user) => {
    if (isSuperAdmin(user)) {
      return [
        {
          message: "New user registered: John Doe",
          timestamp: "2 hours ago",
          type: "user",
        },
        {
          message: "System backup completed",
          timestamp: "4 hours ago",
          type: "system",
        },
        {
          message: "Module 'Finance' activated",
          timestamp: "1 day ago",
          type: "module",
        },
      ];
    } else if (isHOD(user)) {
      return [
        {
          message: "Leave request approved for Jane Smith",
          timestamp: "1 hour ago",
          type: "approval",
        },
        {
          message: "New project assigned: Q4 Budget Review",
          timestamp: "3 hours ago",
          type: "project",
        },
        {
          message: "Department meeting scheduled",
          timestamp: "1 day ago",
          type: "meeting",
        },
      ];
    } else {
      return [
        {
          message: "Document uploaded: Monthly Report",
          timestamp: "2 hours ago",
          type: "document",
        },
        {
          message: "Task completed: Data Entry",
          timestamp: "4 hours ago",
          type: "task",
        },
        { message: "Profile updated", timestamp: "1 day ago", type: "profile" },
      ];
    }
  };

  // All available modules
  const allModules = [
    {
      id: ERP_MODULES.HR,
      name: "Human Resources",
      description: "Employee management, recruitment, and performance tracking",
      icon: FaUsers,
      color: "bg-blue-500",
      path: "/dashboard/modules/hr",
      roles: [isSuperAdmin, isHOD, isManager],
    },
    {
      id: ERP_MODULES.PAYROLL,
      name: "Payroll",
      description: "Salary processing, tax management, and payment tracking",
      icon: FaMoneyBillWave,
      color: "bg-green-500",
      path: "/dashboard/modules/payroll",
      roles: [isSuperAdmin, isHOD],
    },
    {
      id: ERP_MODULES.PROCUREMENT,
      name: "Procurement",
      description:
        "Purchase requests, vendor management, and contract handling",
      icon: FaShoppingCart,
      color: "bg-purple-500",
      path: "/dashboard/modules/procurement",
      roles: [isSuperAdmin, isHOD, isManager],
    },
    {
      id: ERP_MODULES.FINANCE,
      name: "Finance",
      description: "Financial reporting, budgeting, and accounting",
      icon: FaChartLine,
      color: "bg-yellow-500",
      path: "/dashboard/modules/finance",
      roles: [isSuperAdmin, isHOD],
    },
    {
      id: ERP_MODULES.COMMUNICATION,
      name: "Communication",
      description: "Internal messaging, notifications, and collaboration",
      icon: FaComments,
      color: "bg-pink-500",
      path: "/dashboard/modules/communication",
      roles: [isSuperAdmin, isHOD, isManager, isStaff],
    },
    {
      id: ERP_MODULES.DOCUMENTS,
      name: "Documents",
      description: "Document storage, sharing, and workflow management",
      icon: FaFileAlt,
      color: "bg-indigo-500",
      path: "/dashboard/documents",
      roles: [isSuperAdmin, isHOD, isManager, isStaff],
    },
    {
      id: ERP_MODULES.PROJECTS,
      name: "Projects",
      description: "Project planning, task management, and progress tracking",
      icon: FaProjectDiagram,
      color: "bg-orange-500",
      path: "/dashboard/modules/projects",
      roles: [isSuperAdmin, isHOD, isManager, isStaff],
    },
    {
      id: ERP_MODULES.INVENTORY,
      name: "Inventory",
      description: "Stock management, asset tracking, and inventory control",
      icon: FaBoxes,
      color: "bg-red-500",
      path: "/dashboard/modules/inventory",
      roles: [isSuperAdmin, isHOD, isManager],
    },
    {
      id: ERP_MODULES.CUSTOMER_CARE,
      name: "Customer Care",
      description: "Customer support, ticket management, and service requests",
      icon: FaHeadset,
      color: "bg-teal-500",
      path: "/dashboard/modules/customer-care",
      roles: [isSuperAdmin, isHOD, isManager, isStaff],
    },
  ];

  // Filter modules based on user access
  const accessibleModules = allModules.filter((module) =>
    canAccessModule(user, module.id)
  );

  const stats = getRoleBasedStats(user);
  const quickActions = getRoleBasedActions(user);
  const recentActivities = getRoleBasedActivities(user);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner variant="white-green" size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-gray-600">
          {isSuperAdmin(user) &&
            "Manage the entire ERP system and user access."}
          {isHOD(user) &&
            "Oversee your department operations and staff management."}
          {isManager(user) && "Lead your team and manage project workflows."}
          {isStaff(user) && "Access your assigned tasks and manage your work."}
          {isViewer(user) && "View reports and system information."}
        </p>
      </div>

      {/* Role-based Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <IconComponent
                    className={`h-6 w-6 ${stat.color.replace("bg-", "text-")}`}
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <div
                key={action.title}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
                onClick={() => (window.location.href = action.path)}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="ml-3 text-lg font-semibold text-gray-900">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {action.description}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                    <span>Access</span>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Modules */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Available Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleModules.map((module) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
                onClick={() => (window.location.href = module.path)}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="ml-3 text-lg font-semibold text-gray-900">
                      {module.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {module.description}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                    <span>Access Module</span>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activities
        </h3>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center p-4 border border-gray-200 rounded-lg"
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <FaBell className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
