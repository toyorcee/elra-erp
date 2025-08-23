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
  ClipboardDocumentCheckIcon,
  BuildingOfficeIcon,
  BellIcon,
  CogIcon,
  UserCircleIcon,
  PencilIcon,
  XCircleIcon,
  XMarkIcon,
  UserIcon,
  CheckCircleIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { userModulesAPI } from "../../services/userModules.js";
import { getModulesForUser } from "../../config/sidebarConfig.js";

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
  const [hrDashboardData, setHrDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

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
    const sidebarModules = getModulesForUser(user);

    const filteredModules =
      roleLevel === 300
        ? sidebarModules.filter((module) => {
            const moduleKey = module.path.split("/").pop();
            return ["self-service", "documents", "customer-care"].includes(
              moduleKey
            );
          })
        : sidebarModules;

    const moduleMap = {
      "self-service": {
        key: "self-service",
        label: "Self-Service",
        icon: UserIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Personal services and self-management tools",
      },
      hr: {
        key: "hr",
        label: "HR Management",
        icon: UsersIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Employee records and HR processes",
      },
      payroll: {
        key: "payroll",
        label: "Payroll Management",
        icon: CurrencyDollarIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Employee payroll processing and management",
      },
      finance: {
        key: "finance",
        label: "Financial Management",
        icon: CalculatorIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Financial reporting and analysis",
      },
      procurement: {
        key: "procurement",
        label: "Procurement",
        icon: ShoppingCartIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Purchase requisitions and vendor management",
      },
      documents: {
        key: "documents",
        label: "Document Management",
        icon: DocumentTextIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Document storage, sharing and workflow",
      },
      projects: {
        key: "projects",
        label: "Project Management",
        icon: FolderIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Project planning and task management",
      },
      inventory: {
        key: "inventory",
        label: "Inventory Management",
        icon: CubeIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Stock management and asset tracking",
      },
      "customer-care": {
        key: "customer-care",
        label: "Customer Care",
        icon: PhoneIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description:
          "Customer support, ticket management, and service requests",
      },

      it: {
        key: "it",
        label: "IT Management",
        icon: CogIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "IT infrastructure and technical support management",
      },
      operations: {
        key: "operations",
        label: "Operations Management",
        icon: CogIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Business operations and process management",
      },
      sales: {
        key: "sales",
        label: "Sales & Marketing",
        icon: ChartBarIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Sales, marketing and customer acquisition",
      },

      legal: {
        key: "legal",
        label: "Legal & Compliance",
        icon: ShieldCheckIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "Legal affairs and regulatory compliance",
      },

      "system-admin": {
        key: "system-admin",
        label: "System Administration",
        icon: CogIcon,
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-border-primary)]",
        description: "System administration and management",
      },
    };

    return filteredModules
      .filter((module) => module.section === "erp")
      .map((module) => {
        const path = module.path;
        const moduleKey = path.split("/").pop();
        const mappedModule = moduleMap[moduleKey];
        return mappedModule;
      })
      .filter(Boolean);
  };

  const accessibleModules = getAccessibleModules();

  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // Fetch HR dashboard data when module is 'hr'
  useEffect(() => {
    if (module === "hr") {
      fetchHRDashboardData();
    }
  }, [module]);

  const fetchHRDashboardData = async () => {
    try {
      setLoading(true);
      console.log("🔄 [Dashboard] Fetching HR dashboard data...");

      const response = await userModulesAPI.dashboard.getHRDashboardData();

      if (response.success) {
        console.log(
          "✅ [Dashboard] HR dashboard data received:",
          response.data
        );
        setHrDashboardData(response.data);
      } else {
        console.error(
          "❌ [Dashboard] Failed to fetch HR dashboard data:",
          response.message
        );
      }
    } catch (error) {
      console.error("❌ [Dashboard] Error fetching HR dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render module card
  const renderModuleCard = (module) => {
    const IconComponent = module.icon;
    const isActive = currentModule === module.key;

    const handleModuleClick = () => {
      if (currentModule !== module.key) {
        startModuleLoading();
        setTimeout(() => {
          const firstChildPages = {
            "self-service": "/dashboard/modules/self-service/payslips",
            documents: "/dashboard/modules/documents",
            "customer-care": "/dashboard/modules/customer-care",
            hr: "/dashboard/modules/hr/employees",
            payroll: "/dashboard/modules/payroll/processing",
            finance: "/dashboard/modules/finance/transactions",
            inventory: "/dashboard/modules/inventory/list",
            procurement: "/dashboard/modules/procurement/orders",
            projects: "/dashboard/modules/projects/list",
            it: "/dashboard/modules/it",
            operations: "/dashboard/modules/operations",
            sales: "/dashboard/modules/sales",
            legal: "/dashboard/modules/legal",
            "system-admin": "/dashboard/modules/system-admin",
          };

          const targetPath =
            firstChildPages[module.key] || `/dashboard/modules/${module.key}`;
          navigate(targetPath);
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
          {module === "hr" && loading
            ? // Loading state for HR module
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-8 w-24 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              ))
            : getModuleStats(module).map((stat, index) => (
                <div
                  key={index}
                  className="bg-[var(--elra-primary)] rounded-xl p-6 shadow-sm border border-[var(--elra-primary)] hover:shadow-md transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white">
                      {stat.label}
                    </h3>
                    <div className="p-2 rounded-lg bg-white/20">
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">
                    {stat.value}
                  </p>

                  {/* Enhanced HR-specific details */}
                  {module === "hr" && hrDashboardData && (
                    <div className="space-y-2">
                      {stat.label === "Total Staff" && (
                        <div className="text-xs text-white/80 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Active:</span>
                            <span className="font-medium text-white">
                              {hrDashboardData.summary?.totalStaff || 0}
                            </span>
                          </div>
                          {hrDashboardData.summary?.pendingInvitations > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Pending Invites:</span>
                              <span className="font-medium text-yellow-300">
                                {hrDashboardData.summary?.pendingInvitations}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {stat.label === "New Hires" && (
                        <div className="text-xs text-white/80 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Last 30 days:</span>
                            <span className="font-medium text-white">
                              {hrDashboardData.summary?.newHires || 0}
                            </span>
                          </div>
                          {hrDashboardData.recentOnboardings?.length > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Latest:</span>
                              <span className="text-white/60">
                                {hrDashboardData.recentOnboardings[0]?.usedBy
                                  ?.firstName || "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {stat.label === "On Leave" && (
                        <div className="text-xs text-white/80 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Currently:</span>
                            <span className="font-medium text-white">
                              {hrDashboardData.summary?.onLeave || 0}
                            </span>
                          </div>
                          {hrDashboardData.upcomingLeaves?.length > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Upcoming:</span>
                              <span className="font-medium text-white">
                                {hrDashboardData.upcomingLeaves.length}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {stat.label === "Departments" && (
                        <div className="text-xs text-white/80 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Active:</span>
                            <span className="font-medium text-white">
                              {hrDashboardData.summary?.totalDepartments || 0}
                            </span>
                          </div>
                          {hrDashboardData.leaveStats?.pendingRequests > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Pending Leave:</span>
                              <span className="font-medium text-yellow-300">
                                {hrDashboardData.leaveStats?.pendingRequests}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
        </div>

        {/* Module Quick Actions */}
        {/* <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getModuleQuickActions(currentModuleData.key).map(
              (action, index) => (
                <button
                  key={index}
                  className="p-4 rounded-xl bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)] transition-all duration-200 group shadow-lg hover:shadow-xl"
                  onClick={action.onClick}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white/20">
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">{action.label}</p>
                      <p className="text-sm text-white/80">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div> */}

        {/* Module Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div
            className={`space-y-3 ${
              showAllActivities ? "max-h-96 overflow-y-auto" : ""
            }`}
          >
            {getModuleRecentActivity(currentModuleData.key).map(
              (activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
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

          {/* Show More/Less Button */}
          {hasMoreActivities() && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAllActivities(!showAllActivities)}
                className="w-full py-2 px-4 text-sm font-medium text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] hover:bg-[var(--elra-secondary-3)] rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>
                  {showAllActivities
                    ? "Show Less"
                    : `Show More (${
                        hrDashboardData?.recentActivity?.length - 3
                      } more)`}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showAllActivities ? "rotate-180" : ""
                  }`}
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
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get module-specific statistics
  const getModuleStats = (moduleKey) => {
    // For HR module, use real data from API
    if (moduleKey === "hr") {
      if (hrDashboardData) {
        return [
          {
            label: "Total Staff",
            value: hrDashboardData.summary?.totalStaff?.toString() || "0",
            icon: UsersIcon,
            color: "text-[var(--elra-primary)]",
            bgColor: "bg-[var(--elra-secondary-3)]",
          },
          {
            label: "New Hires",
            value: hrDashboardData.summary?.newHires?.toString() || "0",
            icon: UserPlusIcon,
            color: "text-[var(--elra-primary)]",
            bgColor: "bg-[var(--elra-secondary-3)]",
          },
          {
            label: "On Leave",
            value: hrDashboardData.summary?.onLeave?.toString() || "0",
            icon: ClockIcon,
            color: "text-[var(--elra-primary)]",
            bgColor: "bg-[var(--elra-secondary-3)]",
          },
          {
            label: "Departments",
            value: hrDashboardData.summary?.totalDepartments?.toString() || "0",
            icon: BuildingOffice2Icon,
            color: "text-[var(--elra-primary)]",
            bgColor: "bg-[var(--elra-secondary-3)]",
          },
          {
            label: "Compliances",
            value: hrDashboardData.summary?.totalCompliances?.toString() || "0",
            icon: ShieldCheckIcon,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Policies",
            value: hrDashboardData.summary?.totalPolicies?.toString() || "0",
            icon: DocumentTextIcon,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
        ];
      } else {
        return [
          {
            label: "Total Staff",
            value: "Loading...",
            icon: UsersIcon,
            color: "text-gray-400",
            bgColor: "bg-gray-100",
          },
          {
            label: "New Hires",
            value: "Loading...",
            icon: UserPlusIcon,
            color: "text-gray-400",
            bgColor: "bg-gray-100",
          },
          {
            label: "On Leave",
            value: "Loading...",
            icon: ClockIcon,
            color: "text-gray-400",
            bgColor: "bg-gray-100",
          },
          {
            label: "Departments",
            value: "Loading...",
            icon: BuildingOffice2Icon,
            color: "text-gray-400",
            bgColor: "bg-gray-100",
          },
          {
            label: "Compliances",
            value: "Loading...",
            icon: ShieldCheckIcon,
            color: "text-gray-400",
            bgColor: "bg-gray-100",
          },
          {
            label: "Policies",
            value: "Loading...",
            icon: DocumentTextIcon,
            color: "text-gray-400",
            bgColor: "bg-gray-100",
          },
        ];
      }
    }

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
      projects: [
        {
          label: "Active Projects",
          value: "18",
          icon: FolderIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Completed",
          value: "45",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "On Hold",
          value: "3",
          icon: ClockIcon,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        },
        {
          label: "Total Budget",
          value: "$1.2M",
          icon: CurrencyDollarIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      tasks: [
        {
          label: "Active Tasks",
          value: "67",
          icon: ClipboardDocumentListIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Completed",
          value: "234",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Overdue",
          value: "8",
          icon: ExclamationTriangleIcon,
          color: "text-red-600",
          bgColor: "bg-red-50",
        },
        {
          label: "Assigned",
          value: "45",
          icon: UserIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      inventory: [
        {
          label: "Total Items",
          value: "1,247",
          icon: CubeIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Available",
          value: "892",
          icon: CheckCircleIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Leased",
          value: "298",
          icon: CurrencyDollarIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        },
        {
          label: "Maintenance",
          value: "57",
          icon: ClockIcon,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
        },
      ],
      procurement: [
        {
          label: "Purchase Orders",
          value: "156",
          icon: ShoppingCartIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Pending Approval",
          value: "23",
          icon: ClockIcon,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        },
        {
          label: "Delivered",
          value: "89",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Total Value",
          value: "$890K",
          icon: CurrencyDollarIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      "self-service": [
        {
          label: "My Payslips",
          value: "12",
          icon: DocumentTextIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "My Documents",
          value: "8",
          icon: DocumentTextIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "My Tickets",
          value: "3",
          icon: ClipboardDocumentListIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "My Requests",
          value: "5",
          icon: ClockIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      it: [
        {
          label: "Active Tickets",
          value: "24",
          icon: ClipboardDocumentListIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Resolved",
          value: "156",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Pending",
          value: "8",
          icon: ClockIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Systems",
          value: "12",
          icon: CogIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      operations: [
        {
          label: "Active Processes",
          value: "18",
          icon: CogIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Completed",
          value: "89",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Efficiency",
          value: "94%",
          icon: ArrowTrendingUpIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Resources",
          value: "32",
          icon: UsersIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      sales: [
        {
          label: "Revenue",
          value: "$1.2M",
          icon: ArrowTrendingUpIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Leads",
          value: "156",
          icon: UserPlusIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Conversions",
          value: "23",
          icon: CheckIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Pipeline",
          value: "$890K",
          icon: ChartBarIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      "customer-care": [
        {
          label: "Open Tickets",
          value: "45",
          icon: ClipboardDocumentListIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Resolved",
          value: "234",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Satisfaction",
          value: "4.8/5",
          icon: StarIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Response Time",
          value: "2.3h",
          icon: ClockIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      legal: [
        {
          label: "Active Cases",
          value: "12",
          icon: DocumentTextIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Compliance",
          value: "98%",
          icon: ShieldCheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Contracts",
          value: "45",
          icon: DocumentTextIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Risk Level",
          value: "Low",
          icon: ShieldCheckIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
      "system-admin": [
        {
          label: "Active Users",
          value: "156",
          icon: UsersIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "System Health",
          value: "99.9%",
          icon: CheckIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Backups",
          value: "24",
          icon: CogIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Security",
          value: "A+",
          icon: ShieldCheckIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
      ],
    };

    return stats[moduleKey] || [];
  };

  const getModuleQuickActions = (moduleKey) => {
    if (moduleKey === "hr" && hrDashboardData?.quickActions) {
      return hrDashboardData.quickActions.map((action) => ({
        label: action.title,
        description: action.description,
        icon: getIconComponent(action.icon),
        iconColor: "text-[var(--elra-primary)]",
        iconBgColor: "bg-[var(--elra-secondary-3)]",
        borderColor: "border-[var(--elra-primary)]",
        bgColor: "bg-[var(--elra-primary)]",
        color: "text-white",
        onClick: () => navigate(action.path),
      }));
    }

    if (moduleKey === "hr") {
      return [
        {
          label: "User Management",
          description: "Manage all users and employees",
          icon: UsersIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => navigate("/dashboard/modules/hr/users"),
        },
        {
          label: "Department Management",
          description: "Manage company departments",
          icon: BuildingOffice2Icon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => navigate("/dashboard/modules/hr/departments"),
        },
        {
          label: "Leave Requests",
          description: "Submit and manage leave requests",
          icon: ClockIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => navigate("/dashboard/modules/hr/leave/requests"),
        },
        {
          label: "Leave Management",
          description: "Approve leave requests",
          icon: CheckIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => navigate("/dashboard/modules/hr/leave/management"),
        },
        {
          label: "Employee Invitation",
          description: "Invite new employees",
          icon: UserPlusIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => navigate("/dashboard/modules/hr/invitation"),
        },
        {
          label: "Policy Management",
          description: "Manage HR policies",
          icon: DocumentTextIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => navigate("/dashboard/modules/hr/policies"),
        },
        {
          label: "Compliance",
          description: "Manage HR compliance",
          icon: ShieldCheckIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () => navigate("/dashboard/modules/hr/compliance"),
        },
      ];
    }

    // Fallback to hardcoded actions for other modules
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

    return actions[moduleKey] || [];
  };

  // Get module-specific recent activity
  const getModuleRecentActivity = (moduleKey) => {
    // For HR module, use real data from API
    if (moduleKey === "hr" && hrDashboardData?.recentActivity) {
      const activities = hrDashboardData.recentActivity.map((activity) => {
        // Create meaningful descriptions based on action type
        let description = "";
        const action = activity.action || "";

        if (action.includes("LEAVE_REQUEST")) {
          if (action === "LEAVE_REQUEST_CREATED") {
            description = `Created leave request for ${
              activity.details?.leaveType || "time off"
            }`;
          } else if (action === "LEAVE_REQUEST_APPROVED") {
            description = `Approved leave request - ${
              activity.details?.approvalComment || "No comment"
            }`;
          } else if (action === "LEAVE_REQUEST_REJECTED") {
            description = `Rejected leave request - ${
              activity.details?.approvalReason || "No reason provided"
            }`;
          } else if (action === "LEAVE_REQUEST_CANCELLED") {
            description = "Cancelled leave request";
          } else {
            description = `Updated leave request status to ${
              activity.details?.newStatus || "unknown"
            }`;
          }
        } else if (action.includes("USER")) {
          if (action === "USER_CREATED") {
            description = `Created new user account`;
          } else if (action === "USER_UPDATED") {
            description = `Updated user profile`;
          } else if (action === "USER_ROLE_CHANGED") {
            description = `Changed role from ${
              activity.details?.oldRole || "unknown"
            } to ${activity.details?.newRole || "unknown"}`;
          } else if (action === "USER_DEPARTMENT_CHANGED") {
            description = `Moved user from ${
              activity.details?.oldDepartment || "unknown"
            } to ${activity.details?.newDepartment || "unknown"}`;
          } else {
            description = "User management action performed";
          }
        } else if (action.includes("INVITATION")) {
          if (action === "BULK_INVITATION_CREATED") {
            description = `Sent ${
              activity.details?.invitationCount || "multiple"
            } invitations`;
          } else if (action === "INVITATION_CREATED") {
            description = "Sent invitation to new employee";
          } else if (action === "INVITATION_USED") {
            description = "Employee completed onboarding";
          } else {
            description = "Invitation management action";
          }
        } else if (action.includes("DEPARTMENT")) {
          if (action === "DEPARTMENT_CREATED") {
            description = `Created department: ${
              activity.details?.departmentName || "New department"
            }`;
          } else if (action === "DEPARTMENT_UPDATED") {
            description = `Updated department: ${
              activity.details?.departmentName || "Department"
            }`;
          } else {
            description = "Department management action";
          }
        } else {
          // Fallback for other actions
          description =
            activity.details?.description ||
            activity.details?.approvalComment ||
            activity.details?.reason ||
            "Action completed";
        }

        return {
          title: activity.action?.replace(/_/g, " ") || "Activity",
          description: description,
          icon: getActivityIcon(activity.action),
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
          time: formatTimeAgo(activity.timestamp),
        };
      });

      // Return limited activities for initial view, or all if showAllActivities is true
      return showAllActivities ? activities : activities.slice(0, 3);
    }

    // Fallback to hardcoded activities for HR when API data not loaded
    if (moduleKey === "hr") {
      return [
        {
          title: "Loading...",
          description: "Fetching recent activities",
          icon: ClockIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
          time: "Just now",
        },
      ];
    }

    // Fallback to hardcoded activities for other modules
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

    return activities[moduleKey] || [];
  };

  // Check if there are more activities to show
  const hasMoreActivities = () => {
    if (module === "hr" && hrDashboardData?.recentActivity) {
      return hrDashboardData.recentActivity.length > 3;
    }
    return false;
  };

  // Helper function to get icon component
  const getIconComponent = (iconName) => {
    const iconMap = {
      UserPlusIcon,
      ClockIcon,
      ClipboardDocumentCheckIcon: CheckIcon,
      BuildingOfficeIcon: BuildingOffice2Icon,
      ShieldCheckIcon: CogIcon,
      ChartBarIcon,
    };
    return iconMap[iconName] || UserPlusIcon;
  };

  // Helper function to get activity icon
  const getActivityIcon = (action) => {
    if (!action) return CheckIcon;

    // Leave request actions
    if (action.includes("LEAVE_REQUEST_CREATED")) return ClockIcon;
    if (action.includes("LEAVE_REQUEST_APPROVED")) return CheckIcon;
    if (action.includes("LEAVE_REQUEST_REJECTED")) return XCircleIcon;
    if (action.includes("LEAVE_REQUEST_CANCELLED")) return XMarkIcon;
    if (action.includes("LEAVE")) return ClockIcon;

    // User management actions
    if (action.includes("USER_CREATED")) return UserPlusIcon;
    if (action.includes("USER_UPDATED")) return PencilIcon;
    if (action.includes("USER_ROLE_CHANGED")) return ShieldCheckIcon;
    if (action.includes("USER_DEPARTMENT_CHANGED")) return BuildingOffice2Icon;
    if (action.includes("USER")) return UserIcon;

    // Invitation actions
    if (action.includes("BULK_INVITATION_CREATED")) return UserGroupIcon;
    if (action.includes("INVITATION_CREATED")) return EnvelopeIcon;
    if (action.includes("INVITATION_USED")) return CheckCircleIcon;
    if (action.includes("INVITATION")) return EnvelopeIcon;

    // Department actions
    if (action.includes("DEPARTMENT_CREATED")) return PlusIcon;
    if (action.includes("DEPARTMENT_UPDATED")) return PencilIcon;
    if (action.includes("DEPARTMENT")) return BuildingOffice2Icon;

    // Default fallback
    return CheckIcon;
  };

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently";
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
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
              <div className="text-lg font-bold">
                {accessibleModules.length}
              </div>
              <div className="text-white/80 text-sm">Available Modules</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-lg font-bold">
                {(user?.role?.name || "USER").replace(/_/g, " ")}
              </div>
              <div className="text-white/80 text-sm">Your Role</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-lg font-bold">{roleLevel}</div>
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
