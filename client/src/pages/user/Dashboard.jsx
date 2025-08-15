import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDynamicSidebar } from "../../context/DynamicSidebarContext";
import GradientSpinner from "../../components/common/GradientSpinner";
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
  const { user, loading: authLoading } = useAuth();
  const {
    currentModule,
    isModuleView,
    getCurrentModuleInfo,
    isModuleLoading,
    startModuleLoading,
  } = useDynamicSidebar();
  const { module } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModulesCollapsed, setIsModulesCollapsed] = useState(false);

  const getUserRoleLevel = () => {
    if (!user) return 0;

    const roleValue = user.role?.name || user.role;

    switch (roleValue) {
      case "SUPER_ADMIN":
        return 1000;
      case "HOD":
        return 700;
      case "MANAGER":
        return 600;
      case "STAFF":
        return 300;
      case "VIEWER":
        return 100;
      default:
        return 100;
    }
  };

  const roleLevel = getUserRoleLevel();

  const hasAccess = (minLevel) => {
    return roleLevel >= minLevel;
  };

  const getAccessibleModules = () => {
    const allModules = [
      {
        key: "hr",
        label: "Human Resources",
        icon: UsersIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 400,
        description: "Manage employees, recruitment, and HR processes",
      },
      {
        key: "payroll",
        label: "Payroll",
        icon: CurrencyDollarIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 600,
        description: "Handle payroll processing and salary management",
      },
      {
        key: "procurement",
        label: "Procurement",
        icon: ShoppingCartIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 600,
        description: "Manage purchasing and supplier relationships",
      },
      {
        key: "finance",
        label: "Finance",
        icon: CalculatorIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 600,
        description: "Financial management and accounting",
      },
      {
        key: "communication",
        label: "Communication",
        icon: ChatBubbleLeftRightIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 400,
        description: "Internal and external communication tools",
      },
      {
        key: "projects",
        label: "Projects",
        icon: FolderIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 400,
        description: "Project management and task tracking",
      },
      {
        key: "inventory",
        label: "Inventory",
        icon: CubeIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 300,
        description: "Stock management and asset tracking",
      },
      {
        key: "customer-care",
        label: "Customer Care",
        icon: PhoneIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 300,
        description: "Customer support and service management",
      },
      {
        key: "documents",
        label: "Document Management",
        icon: DocumentTextIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        minLevel: 300,
        description: "Document storage, sharing and workflow",
      },
    ];

    return allModules.filter((module) => hasAccess(module.minLevel));
  };

  const accessibleModules = getAccessibleModules();

  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 200); // Reduced from 500ms to 200ms for better responsiveness
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "d":
            event.preventDefault();
            window.location.href = "/dashboard";
            break;
          case "m":
            event.preventDefault();
            window.location.href = "/modules";
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Render module card
  const renderModuleCard = (module) => {
    const IconComponent = module.icon;
    const isActive = currentModule === module.key;

    const handleModuleClick = () => {
      if (currentModule !== module.key) {
        startModuleLoading();
        setTimeout(() => {
          navigate(`/dashboard/modules/${module.key}`);
        }, 100);
      }
    };

    return (
      <div
        key={module.key}
        className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
          isActive
            ? "bg-[var(--elra-primary)] text-white shadow-xl border-[var(--elra-primary)]"
            : `${module.bgColor} ${module.borderColor}`
        } border-2 rounded-2xl p-6`}
        onClick={handleModuleClick}
      >
        <div className="flex items-center mb-4">
          <div
            className={`p-3 rounded-xl ${
              isActive ? "bg-white/20" : `${module.bgColor} ${module.color}`
            }`}
          >
            <IconComponent
              className={`h-8 w-8 ${isActive ? "text-white" : ""}`}
            />
          </div>
        </div>

        <h3
          className={`text-xl font-bold ${
            isActive ? "text-white" : module.color
          } mb-2`}
        >
          {module.label}
        </h3>

        <p
          className={`text-sm leading-relaxed ${
            isActive ? "text-white/90" : "text-[var(--elra-text-secondary)]"
          }`}
        >
          {module.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`text-xs ${
              isActive ? "text-white/80" : "text-[var(--elra-text-muted)]"
            }`}
          >
            {isActive ? "Currently active" : "Click to access"}
          </span>
          <div
            className={`p-2 rounded-lg ${
              isActive
                ? "bg-white/20 text-white"
                : `${module.bgColor} ${module.color}`
            } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
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
        {/* Breadcrumb Navigation */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 mb-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] hover:underline"
            >
              Dashboard
            </button>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => (window.location.href = "/modules")}
              className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] hover:underline"
            >
              Modules
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">
              {currentModuleData.label}
            </span>
          </nav>

          {/* Mobile Navigation Buttons */}
          <div className="flex space-x-2 mt-3 lg:hidden">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => (window.location.href = "/modules")}
              className="flex-1 px-3 py-2 bg-[var(--elra-secondary-3)] text-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-secondary-2)] transition-colors text-sm font-medium"
            >
              All Modules
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              💡{" "}
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                Ctrl + D
              </kbd>{" "}
              for Dashboard •
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                Ctrl + M
              </kbd>{" "}
              for Modules
            </p>
          </div>
        </div>

        {/* Module Header with Navigation */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
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
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
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
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Processed",
          value: "144",
          icon: CheckIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      hr: [
        {
          label: "Total Staff",
          value: "156",
          icon: UsersIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "New Hires",
          value: "8",
          icon: UserPlusIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "On Leave",
          value: "5",
          icon: ClockIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Departments",
          value: "12",
          icon: BuildingOffice2Icon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
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
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Pending",
          value: "$45K",
          icon: ClockIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
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
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => console.log("Process Payroll"),
        },
        {
          label: "Add Employee",
          description: "Register new employee",
          icon: UserPlusIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
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
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => console.log("Add Staff"),
        },
        {
          label: "Leave Requests",
          description: "Manage time off",
          icon: ClockIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => console.log("Leave Requests"),
        },
        {
          label: "Performance",
          description: "Review evaluations",
          icon: ChartBarIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
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
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
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
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
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
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
          time: "1 hour ago",
        },
        {
          title: "Leave Approved",
          description: "Mike's vacation request approved",
          icon: CheckIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
          time: "3 hours ago",
        },
        {
          title: "Performance Review",
          description: "Annual review completed for IT team",
          icon: ChartBarIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
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
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
          time: "1 day ago",
        },
      ],
    };

    return activities[moduleKey] || activities.hr; // Default to HR activities
  };

  // Render dashboard content based on current view
  const renderDashboardContent = () => {
    // Main dashboard view - ALWAYS present as per user requirement
    const mainDashboardContent = (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-[var(--elra-primary)] rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <HomeIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {user?.firstName || "User"}!
                </h1>
                <p className="text-white/80 text-lg">
                  Access your ERP modules and manage your business operations
                </p>
              </div>
            </div>

            {/* Date and Time */}
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <ClockIcon className="h-5 w-5 text-white/80" />
                <span className="text-lg font-semibold">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
              <div className="text-white/80 text-sm">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">
                {accessibleModules.length}
              </div>
              <div className="text-white/80 text-sm">Available Modules</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">
                {(user?.role?.name || "USER").replace(/_/g, " ")}
              </div>
              <div className="text-white/80 text-sm">Your Role</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{roleLevel}</div>
              <div className="text-white/80 text-sm">Access Level</div>
            </div>
          </div>
        </div>

        {/* ERP Modules Grid */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--elra-text-primary)] mb-2">
                ERP Modules
              </h2>
              <p className="text-[var(--elra-text-secondary)]">
                Access and manage different aspects of your business operations
              </p>
            </div>
            <button
              onClick={() => setIsModulesCollapsed(!isModulesCollapsed)}
              className="p-2 text-gray-500 hover:text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] rounded-lg transition-colors cursor-pointer"
              title={
                isModulesCollapsed
                  ? "Expand ERP Modules"
                  : "Collapse ERP Modules"
              }
            >
              {isModulesCollapsed ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              )}
            </button>
          </div>

          {!isModulesCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {accessibleModules.map(renderModuleCard)}
            </div>
          )}
        </div>
      </div>
    );

    if (isModuleView && currentModule) {
      return (
        <div className="space-y-8">
          {/* Main Dashboard - ALWAYS PRESENT */}
          {mainDashboardContent}

          {/* Module-specific content below the main dashboard */}
          <div className="pt-8">
            <div className="bg-[var(--elra-secondary-3)] rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-[var(--elra-primary)] mb-2">
                Currently Viewing: {getCurrentModuleInfo()?.label || "Module"}
              </h2>
              <p className="text-[var(--elra-primary)]">
                You're currently working in the{" "}
                {getCurrentModuleInfo()?.label || "module"}.
              </p>
            </div>

            {renderDynamicModuleDashboard()}
          </div>
        </div>
      );
    }

    return mainDashboardContent;
  };

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

  // Show loading spinner while authenticating or during initial load
  if (authLoading || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <GradientSpinner size="lg" />
          <p className="text-gray-600 mt-4 text-lg">
            {authLoading ? "Authenticating..." : "Loading your dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboardContent()}
      </div>

      {isModuleLoading && (
        <div className="fixed inset-0 bg-[var(--elra-bg-light)] flex items-center justify-center z-50">
          <GradientSpinner
            size="lg"
            title="Switching Module"
            text="Loading module content..."
            showText={true}
          />
        </div>
      )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 left-6 z-50 p-3 bg-[var(--elra-primary)] text-white rounded-full shadow-2xl hover:bg-[var(--elra-primary-dark)] transition-colors hover:scale-110"
        title="Back to top"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
  );
};

export default Dashboard;
