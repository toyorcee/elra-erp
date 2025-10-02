import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDynamicSidebar } from "../../context/DynamicSidebarContext";
import { useDebouncedNavigation } from "../../hooks/useDebouncedNavigation";
import { useModulePreloader } from "../../hooks/useModulePreloader";
import GradientSpinner from "../../components/common/GradientSpinner";
import dashboardAPI from "../../services/dashboardAPI";
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
  HomeIcon,
  UserIcon,
  CheckIcon,
  CogIcon,
  ArrowTrendingDownIcon,
  UserPlusIcon,
  PlusIcon,
  MinusIcon,
  ReceiptPercentIcon,
  ClipboardDocumentCheckIcon,
  BuildingOfficeIcon,
  BellIcon,
  UserCircleIcon,
  PencilIcon,
  XCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  StarIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { userModulesAPI } from "../../services/userModules.js";
import { getNavigationForRole } from "../../config/sidebarConfig.js";
import { FinancialManagement } from "./modules/finance";
import { ProjectManagement } from "./modules/projects";
import HRModule from "./modules/hr/HRModule";
import SelfService from "./modules/self-service/SelfService";
import InventoryModule from "./modules/inventory/InventoryModule";
import PayrollManagement from "./modules/payroll/PayrollManagement";
import ProcurementModule from "./modules/procurement/ProcurementModule";
import SalesMarketingModule from "./modules/sales-marketing/SalesMarketingModule";
import LegalModule from "./modules/legal/LegalModule";

const Dashboard = () => {
  const { user, loading: authLoading, initialized } = useAuth();
  const {
    currentModule,
    isModuleView,
    getCurrentModuleInfo,
    isModuleLoading,
    startModuleLoading,
  } = useDynamicSidebar();
  const { module } = useParams();

  const navigate = useDebouncedNavigation();
  const { isModulePreloaded } = useModulePreloader();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hrDashboardData, setHrDashboardData] = useState(null);
  const [selfServiceDashboardData, setSelfServiceDashboardData] =
    useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendModules, setBackendModules] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(false);

  const [leaveRequestsData, setLeaveRequestsData] = useState(null);
  const [payslipsData, setPayslipsData] = useState(null);
  const [projectsData, setProjectsData] = useState(null);

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

  // Icon mapping for ERP modules
  const getModuleIcon = (moduleKey) => {
    const iconMap = {
      "self-service": UserIcon,
      hr: UsersIcon,
      payroll: CurrencyDollarIcon,
      finance: CalculatorIcon,
      procurement: ShoppingCartIcon,
      projects: FolderIcon,
      inventory: CubeIcon,
      "customer-care": PhoneIcon,
      it: CogIcon,
      operations: CogIcon,
      sales: ChartBarIcon,
      legal: ShieldCheckIcon,
      "system-admin": CogIcon,
    };
    return iconMap[moduleKey] || CogIcon;
  };

  // Color mapping for ERP modules
  const getModuleColors = (moduleKey) => {
    const colorMap = {
      "self-service": {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
        borderColor: "border-transparent",
      },
      hr: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
        borderColor: "border-transparent",
      },
      payroll: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-green-50 to-green-100",
        borderColor: "border-transparent",
      },
      finance: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
        borderColor: "border-transparent",
      },
      procurement: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
        borderColor: "border-transparent",
      },
      projects: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100",
        borderColor: "border-transparent",
      },
      inventory: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-cyan-50 to-cyan-100",
        borderColor: "border-transparent",
      },
      "customer-care": {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-pink-50 to-pink-100",
        borderColor: "border-transparent",
      },
      it: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
        borderColor: "border-transparent",
      },
      operations: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-teal-50 to-teal-100",
        borderColor: "border-transparent",
      },
      sales: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-rose-50 to-rose-100",
        borderColor: "border-transparent",
      },
      legal: {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
        borderColor: "border-transparent",
      },
      "system-admin": {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-violet-50 to-violet-100",
        borderColor: "border-transparent",
      },
    };
    return (
      colorMap[moduleKey] || {
        color: "text-[var(--elra-primary)]",
        bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
        borderColor: "border-transparent",
      }
    );
  };

  // Description mapping for ERP modules
  const getModuleDescription = (moduleKey) => {
    const descriptionMap = {
      "self-service": "Personal services and self-management tools",
      hr: "Employee records and HR processes",
      payroll: "Employee payroll processing and management",
      finance: "Financial reporting and analysis",
      procurement: "Purchase requisitions and vendor management",
      projects: "Project planning and task management",
      inventory: "Stock management and asset tracking",
      "customer-care":
        "Customer support, ticket management, and service requests",
      it: "IT infrastructure and technical support management",
      operations: "Business operations and process management",
      sales: "Sales, marketing and customer acquisition",
      legal: "Legal affairs and regulatory compliance",
      "system-admin": "System administration and management",
    };
    return descriptionMap[moduleKey] || "Business operations module";
  };

  const fetchBackendModules = async () => {
    try {
      setModulesLoading(true);
      const response = await userModulesAPI.getUserModules();
      console.log("🔍 [Dashboard] Raw API response:", response);

      if (response.success && response.data) {
        const transformedModules = userModulesAPI.transformModules(
          response.data
        );
        setBackendModules(transformedModules);
        console.log(
          "✅ [Dashboard] Transformed modules loaded:",
          transformedModules.length
        );
        console.log(
          "🔍 [Dashboard] First transformed module:",
          transformedModules[0]
        );
      }
    } catch (error) {
      console.error("❌ [Dashboard] Error fetching backend modules:", error);
    } finally {
      setModulesLoading(false);
    }
  };

  const getAccessibleModules = () => {
    if (backendModules && backendModules.length > 0) {
      const processedModules = backendModules
        .map((module) => {
          const moduleKey = module.code.toLowerCase().replace(/_/g, "-");
          const colors = getModuleColors(moduleKey);
          const icon = getModuleIcon(moduleKey);
          const description = getModuleDescription(moduleKey);

          const processedModule = {
            key: moduleKey,
            label: module.title || module.name,
            icon: icon,
            ...colors,
            description: description,
            path: `/dashboard/modules/${moduleKey}`,
            section: "erp",
            required: { minLevel: module.requiredRoleLevel || 300 },
            badge: module.name?.split(" ")[0] || moduleKey,
            permissions: module.permissions,
          };

          return processedModule;
        })
        .filter(Boolean);

      return processedModules;
    }

    // Fallback to frontend filtering using the same logic as sidebar
    const userRoleLevel =
      user?.role?.level || user?.roleLevel || getUserRoleLevel();
    const userDepartment = user?.department?.name || null;
    const userPermissions = user?.permissions || [];
    const userModuleAccess = user?.moduleAccess || [];

    const navigation = getNavigationForRole(
      userRoleLevel,
      userDepartment,
      userPermissions,
      userModuleAccess
    );

    const erpModules = navigation
      ? navigation.filter((item) => item.section === "erp")
      : [];

    return erpModules
      .map((module) => {
        const path = module.path;
        const moduleKey = path.split("/").pop();
        const colors = getModuleColors(moduleKey);
        const icon = getModuleIcon(moduleKey);
        const description = getModuleDescription(moduleKey);

        return {
          key: moduleKey,
          label: module.label,
          icon: icon,
          ...colors,
          description: description,
          path: module.path,
          section: module.section,
          required: module.required,
          badge: module.badge,
        };
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

  // Fetch backend modules when user is available
  useEffect(() => {
    if (user && !authLoading) {
      fetchBackendModules();
    }
  }, [user, authLoading]);

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

  useEffect(() => {
    if (module === "hr") {
      fetchHRDashboardData();
    } else if (module === "self-service" || module === "self_service") {
      fetchSelfServiceDashboardData();
    } else if (module === "department-management") {
      setLoading(false);
    }

    // Always fetch audit data for recent activity
    fetchAuditData();
  }, [module]);

  // Fetch audit data when user becomes available
  useEffect(() => {
    if (user && !authLoading && initialized) {
      console.log("🔄 [AUDIT] User is ready, fetching audit data...");
      fetchAuditData();
    }
  }, [user, authLoading, initialized]);

  // Fetch self-service data when user becomes available
  useEffect(() => {
    if (user && !authLoading && initialized) {
      console.log(
        "🔄 [SELF-SERVICE] User is ready, fetching self-service data..."
      );
      fetchSelfServiceData();
    }
  }, [user, authLoading, initialized]);

  const fetchHRDashboardData = async () => {
    try {
      setLoading(true);

      const response = await userModulesAPI.dashboard.getHRDashboardData();

      if (response.success) {
        setHrDashboardData(response.data);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchSelfServiceDashboardData = async () => {
    try {
      setLoading(true);

      const response =
        await userModulesAPI.dashboard.getSelfServiceDashboardData();

      if (response.success) {
        setSelfServiceDashboardData(response.data);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditData = async () => {
    try {
      console.log("🔍 [AUDIT] Starting fetchAuditData...");
      console.log("🔍 [AUDIT] User:", user);
      console.log("🔍 [AUDIT] Auth loading:", authLoading);
      console.log("🔍 [AUDIT] Auth initialized:", initialized);
      console.log(
        "🔍 [AUDIT] User department:",
        user?.department?.name || user?.department
      );

      // Don't make API call if user is not available
      if (!user || authLoading || !initialized) {
        console.log("⏳ [AUDIT] Skipping API call - user not ready");
        return;
      }

      const requestParams = {
        limit: 10,
        department: user?.department?.name || user?.department,
      };

      console.log("🔍 [AUDIT] Request parameters:", requestParams);
      console.log("🔍 [AUDIT] User department object:", user?.department);
      console.log("🔍 [AUDIT] User department name:", user?.department?.name);

      const response = await dashboardAPI.getRecentActivity(requestParams);

      console.log("🔍 [AUDIT] API Response:", response);
      console.log("🔍 [AUDIT] Response data type:", typeof response.data);
      console.log("🔍 [AUDIT] Response data length:", response.data?.length);

      if (response.success) {
        const activities = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setAuditData(activities);
      } else {
        console.log("❌ [AUDIT] API response not successful:", response);
      }
    } catch (error) {
      console.error("❌ [AUDIT] Error fetching audit data:", error);
      console.error(
        "❌ [AUDIT] Error details:",
        error.response?.data || error.message
      );
    }
  };

  // Fetch self-service data
  const fetchSelfServiceData = async () => {
    if (!user || authLoading || !initialized) return;

    try {
      // Fetch leave requests data
      const leaveResponse = await dashboardAPI.getLeaveRequestsData();
      console.log("🔍 [LEAVE] API Response:", leaveResponse);
      console.log("🔍 [LEAVE] Data type:", typeof leaveResponse?.data);
      console.log("🔍 [LEAVE] Is array:", Array.isArray(leaveResponse?.data));
      console.log("🔍 [LEAVE] Data length:", leaveResponse?.data?.length);
      console.log("🔍 [LEAVE] First request:", leaveResponse?.data?.[0]);
      setLeaveRequestsData(leaveResponse);

      // Fetch payslips data
      const payslipsResponse = await dashboardAPI.getPayslipsData();
      console.log("🔍 [PAYSLIPS] API Response:", payslipsResponse);
      console.log("🔍 [PAYSLIPS] Data type:", typeof payslipsResponse?.data);
      console.log(
        "🔍 [PAYSLIPS] Is array:",
        Array.isArray(payslipsResponse?.data)
      );
      console.log(
        "🔍 [PAYSLIPS] First payslip summary:",
        payslipsResponse?.data?.[0]?.summary
      );
      console.log(
        "🔍 [PAYSLIPS] Net pay:",
        payslipsResponse?.data?.[0]?.summary?.netPay
      );
      console.log(
        "🔍 [PAYSLIPS] Gross pay:",
        payslipsResponse?.data?.[0]?.summary?.grossPay
      );
      setPayslipsData(payslipsResponse);

      // Fetch projects data
      const projectsResponse = await dashboardAPI.getProjectsData();
      console.log("🔍 [PROJECTS] API Response:", projectsResponse);
      console.log("🔍 [PROJECTS] Data type:", typeof projectsResponse?.data);
      console.log(
        "🔍 [PROJECTS] Is array:",
        Array.isArray(projectsResponse?.data)
      );
      setProjectsData(projectsResponse);
    } catch (error) {
      console.error(
        "❌ [SELF-SERVICE] Error fetching self-service data:",
        error
      );
    }
  };

  // Render module card
  const renderModuleCard = (module) => {
    const IconComponent = module.icon;
    const isActive = currentModule === module.key;

    const handleModuleClick = () => {
      if (currentModule !== module.key) {
        startModuleLoading();
        const targetPath = `/dashboard/modules/${module.key}`;
        navigate(targetPath);
      }
    };

    // Get module-specific icon colors
    const getModuleIconColor = (moduleKey) => {
      const colorMap = {
        "self-service": "from-blue-500 to-blue-600",
        hr: "from-purple-500 to-purple-600",
        payroll: "from-green-500 to-green-600",
        finance: "from-emerald-500 to-emerald-600",
        procurement: "from-orange-500 to-orange-600",
        projects: "from-indigo-500 to-indigo-600",
        inventory: "from-cyan-500 to-cyan-600",
        "customer-care": "from-pink-500 to-pink-600",
        it: "from-gray-500 to-gray-600",
        operations: "from-teal-500 to-teal-600",
        sales: "from-rose-500 to-rose-600",
        legal: "from-amber-500 to-amber-600",
        "system-admin": "from-violet-500 to-violet-600",
      };
      return colorMap[moduleKey] || "from-gray-500 to-gray-600";
    };

    return (
      <div
        key={module.key}
        className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
          isActive
            ? "bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white shadow-2xl border-[var(--elra-primary)]"
            : `${module.bgColor} ${module.borderColor} hover:shadow-lg`
        } border-0 rounded-2xl p-4 sm:p-6 shadow-md`}
        onClick={handleModuleClick}
      >
        <div className="flex items-center mb-4">
          <div
            className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
              isActive
                ? "bg-white/20"
                : `bg-gradient-to-br ${getModuleIconColor(
                    module.key
                  )} group-hover:shadow-xl`
            }`}
          >
            <IconComponent
              className={`h-6 w-6 sm:h-8 sm:w-8 ${
                isActive ? "text-white" : "text-white"
              }`}
            />
          </div>
        </div>

        <h3
          className={`text-lg sm:text-xl font-bold ${
            isActive ? "text-white" : module.color
          } mb-2`}
        >
          {module.label}
        </h3>

        <p
          className={`text-xs sm:text-sm leading-relaxed ${
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
            className={`p-2 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-white/20 text-white"
                : "bg-white/80 text-[var(--elra-primary)] shadow-md"
            } opacity-0 group-hover:opacity-100 group-hover:scale-110`}
          >
            <ArrowTrendingUpIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  };

  const renderDynamicModuleDashboard = () => {
    const moduleInfo = getCurrentModuleInfo();

    if (!module) {
      return null;
    }

    if (module === "finance") {
      return <FinancialManagement />;
    }
    if (module === "projects") {
      return <ProjectManagement />;
    }
    if (module === "hr") {
      return <HRModule />;
    }
    if (module === "self-service" || module === "self_service") {
      return <SelfService />;
    }
    if (module === "inventory") {
      return <InventoryModule />;
    }
    if (module === "payroll") {
      return <PayrollManagement />;
    }
    if (module === "procurement") {
      return <ProcurementModule />;
    }
    if (module === "sales" || module === "sales-marketing") {
      return <SalesMarketingModule />;
    }
    if (module === "legal") {
      return <LegalModule />;
    }

    console.log("🔍 [Dashboard] Debug module finding:", {
      module,
      accessibleModules: accessibleModules.map((m) => ({
        key: m.key,
        path: m.path,
      })),
    });

    // Find the current module data by matching the path or key
    let currentModuleData = accessibleModules.find(
      (m) => m.key === module || m.path.includes(`/${module}`)
    );

    console.log(
      "🔍 [Dashboard] Found in accessibleModules:",
      currentModuleData
    );

    if (!currentModuleData) {
      // Try to find module using the helper functions
      const moduleKey = module.replace(/_/g, "-");
      const icon = getModuleIcon(moduleKey);
      const colors = getModuleColors(moduleKey);
      const description = getModuleDescription(moduleKey);

      if (icon && colors && description) {
        currentModuleData = {
          key: moduleKey,
          label: moduleKey
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          icon: icon,
          ...colors,
          description: description,
        };
        console.log(
          "🔍 [Dashboard] Created module data from helper functions:",
          currentModuleData
        );
      }
    }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(module === "self-service" ||
            module === "self_service" ||
            module === "department-management") &&
          loading
            ? Array.from({ length: 4 }).map((_, index) => (
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
                  className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-800">
                      {stat.label}
                    </h3>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    {stat.value}
                  </p>

                  {/* Enhanced HR-specific details */}
                  {module === "hr" && hrDashboardData && (
                    <div className="space-y-2">
                      {stat.label === "Total Staff" && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Active:</span>
                            <span className="font-medium text-gray-800">
                              {hrDashboardData.summary?.totalStaff || 0}
                            </span>
                          </div>
                          {hrDashboardData.summary?.pendingInvitations > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Pending Invites:</span>
                              <span className="font-medium text-yellow-600">
                                {hrDashboardData.summary?.pendingInvitations}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {stat.label === "New Hires" && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Last 30 days:</span>
                            <span className="font-medium text-gray-800">
                              {hrDashboardData.summary?.newHires || 0}
                            </span>
                          </div>
                          {hrDashboardData.recentOnboardings?.length > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Latest:</span>
                              <span className="text-gray-500">
                                {hrDashboardData.recentOnboardings[0]?.usedBy
                                  ?.firstName || "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {stat.label === "On Leave" && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Currently:</span>
                            <span className="font-medium text-gray-800">
                              {hrDashboardData.summary?.onLeave || 0}
                            </span>
                          </div>
                          {hrDashboardData.upcomingLeaves?.length > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Upcoming:</span>
                              <span className="font-medium text-gray-800">
                                {hrDashboardData.upcomingLeaves.length}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {stat.label === "Departments" && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Active:</span>
                            <span className="font-medium text-gray-800">
                              {hrDashboardData.summary?.totalDepartments || 0}
                            </span>
                          </div>
                          {hrDashboardData.leaveStats?.pendingRequests > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Pending Leave:</span>
                              <span className="font-medium text-yellow-600">
                                {hrDashboardData.leaveStats?.pendingRequests}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced Department Management-specific details */}
                  {module === "department-management" && (
                    <div className="space-y-2">
                      {stat.label === "Team Size" && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Active:</span>
                            <span className="font-medium text-gray-800">
                              12
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>On Leave:</span>
                            <span className="font-medium text-yellow-600">
                              2
                            </span>
                          </div>
                        </div>
                      )}

                      {stat.label === "Active Projects" && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>In Progress:</span>
                            <span className="font-medium text-gray-800">6</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Pending Approval:</span>
                            <span className="font-medium text-yellow-600">
                              2
                            </span>
                          </div>
                        </div>
                      )}

                      {stat.label === "Pending Approvals" && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Projects:</span>
                            <span className="font-medium text-gray-800">2</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Leave Requests:</span>
                            <span className="font-medium text-yellow-600">
                              1
                            </span>
                          </div>
                        </div>
                      )}

                      {stat.label === "Budget Used" && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Allocated:</span>
                            <span className="font-medium text-gray-800">
                              ₦2.5M
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Remaining:</span>
                            <span className="font-medium text-green-600">
                              ₦540K
                            </span>
                          </div>
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
    } else if (moduleKey === "department-management") {
      // Department Management module statistics
      return [
        {
          label: "Team Size",
          value: "12",
          icon: UsersIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Active Projects",
          value: "8",
          icon: FolderIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Pending Approvals",
          value: "3",
          icon: ClipboardDocumentCheckIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Leave Requests",
          value: "5",
          icon: ClockIcon,
          color: "text-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-secondary-3)]",
        },
        {
          label: "Budget Used",
          value: "78.5%",
          icon: ChartBarIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          label: "Success Rate",
          value: "92.3%",
          icon: CheckCircleIcon,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        },
      ];
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
      "self-service": selfServiceDashboardData
        ? [
            {
              label: "My Payslips",
              value:
                selfServiceDashboardData.summary?.totalPayslips?.toString() ||
                "0",
              icon: DocumentTextIcon,
              color: "text-[var(--elra-primary)]",
              bgColor: "bg-[var(--elra-secondary-3)]",
            },
            {
              label: "Leave Requests",
              value:
                selfServiceDashboardData.summary?.totalLeaveRequests?.toString() ||
                "0",
              icon: ClipboardDocumentListIcon,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              label: "My Projects",
              value:
                selfServiceDashboardData.summary?.totalProjects?.toString() ||
                "0",
              icon: FolderIcon,
              color: "text-orange-600",
              bgColor: "bg-orange-50",
            },
            {
              label: "My Documents",
              value:
                selfServiceDashboardData.summary?.totalDocuments?.toString() ||
                "0",
              icon: DocumentIcon,
              color: "text-green-600",
              bgColor: "bg-green-50",
            },
          ]
        : [
            {
              label: "My Payslips",
              value: "Loading...",
              icon: DocumentTextIcon,
              color: "text-gray-400",
              bgColor: "bg-gray-100",
            },
            {
              label: "Leave Requests",
              value: "Loading...",
              icon: ClipboardDocumentListIcon,
              color: "text-gray-400",
              bgColor: "bg-gray-100",
            },
            {
              label: "My Projects",
              value: "Loading...",
              icon: FolderIcon,
              color: "text-gray-400",
              bgColor: "bg-gray-100",
            },
            {
              label: "My Documents",
              value: "Loading...",
              icon: DocumentIcon,
              color: "text-gray-400",
              bgColor: "bg-gray-100",
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

    // Handle both hyphen and underscore versions for module keys
    const normalizedModuleKey = moduleKey.replace(/_/g, "-");
    const underscoreModuleKey = moduleKey.replace(/-/g, "_");

    return (
      stats[moduleKey] ||
      stats[normalizedModuleKey] ||
      stats[underscoreModuleKey] ||
      []
    );
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
      "department-management": [
        {
          label: "Project Approvals",
          description: "Review and approve projects",
          icon: ClipboardDocumentCheckIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () =>
            navigate(
              "/dashboard/modules/department-management/project-approvals"
            ),
        },
        {
          label: "Leave Management",
          description: "Approve leave requests",
          icon: ClockIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () =>
            navigate(
              "/dashboard/modules/department-management/leave-management"
            ),
        },
        {
          label: "Team Management",
          description: "Manage department staff",
          icon: UsersIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () =>
            navigate(
              "/dashboard/modules/department-management/team-management"
            ),
        },
        {
          label: "Analytics",
          description: "View department metrics",
          icon: ChartBarIcon,
          iconColor: "text-[var(--elra-primary)]",
          iconBgColor: "bg-[var(--elra-secondary-3)]",
          borderColor: "border-[var(--elra-primary)]",
          bgColor: "bg-[var(--elra-primary)]",
          color: "text-white",
          onClick: () =>
            navigate("/dashboard/modules/department-management/analytics"),
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
    // Use real audit data for all modules if available
    if (auditData && auditData.length > 0) {
      const activities = auditData.map((activity) => {
        // Create meaningful descriptions based on action type
        let description = "";
        const action = activity.action || "";

        // Project-related actions
        if (action.includes("PROJECT")) {
          if (action === "PROJECT_CREATED") {
            description = `Created project: ${
              activity.details?.projectName ||
              activity.resourceDetails?.name ||
              "New project"
            }`;
          } else if (action === "PROJECT_APPROVED") {
            description = `Approved project: ${
              activity.details?.projectName ||
              activity.resourceDetails?.name ||
              "Project"
            }`;
          } else if (action === "PROJECT_REJECTED") {
            description = `Rejected project: ${
              activity.details?.projectName ||
              activity.resourceDetails?.name ||
              "Project"
            }`;
          } else if (action === "PROJECT_UPDATED") {
            description = `Updated project: ${
              activity.details?.projectName ||
              activity.resourceDetails?.name ||
              "Project"
            }`;
          } else {
            description = `Project action: ${
              activity.details?.projectName ||
              activity.resourceDetails?.name ||
              "Project"
            }`;
          }
        }
        // Document-related actions
        else if (action.includes("DOCUMENT")) {
          if (action === "DOCUMENT_UPLOADED") {
            description = `Uploaded document: ${
              activity.details?.documentTitle || "Document"
            }`;
          } else if (action === "DOCUMENT_APPROVED") {
            description = `Approved document: ${
              activity.details?.documentTitle || "Document"
            }`;
          } else if (action === "DOCUMENT_REJECTED") {
            description = `Rejected document: ${
              activity.details?.documentTitle || "Document"
            }`;
          } else {
            description = `Document action: ${
              activity.details?.documentTitle || "Document"
            }`;
          }
        }
        // User-related actions
        else if (action.includes("USER")) {
          if (action === "USER_CREATED") {
            description = `Created user account`;
          } else if (action === "USER_UPDATED") {
            description = `Updated user profile`;
          } else if (action === "USER_LOGIN") {
            description = `Logged into system`;
          } else {
            description = "User management action";
          }
        }
        // System actions
        else if (action.includes("SYSTEM")) {
          description = "System configuration change";
        }
        // Default fallback
        else {
          description =
            activity.details?.description ||
            activity.details?.approvalComment ||
            activity.details?.reason ||
            "System activity";
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

      return showAllActivities ? activities : activities.slice(0, 3);
    }

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

    // If no real audit data available, return empty array
    return [];
  };

  // Check if there are more activities to show
  const hasMoreActivities = () => {
    if (auditData && auditData.length > 0) {
      return auditData.length > 3;
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

    // Project actions
    if (action.includes("PROJECT_CREATED")) return PlusIcon;
    if (action.includes("PROJECT_APPROVED")) return CheckCircleIcon;
    if (action.includes("PROJECT_REJECTED")) return XCircleIcon;
    if (action.includes("PROJECT_UPDATED")) return PencilIcon;
    if (action.includes("PROJECT")) return BriefcaseIcon;

    // Document actions
    if (action.includes("DOCUMENT_UPLOADED")) return DocumentIcon;
    if (action.includes("DOCUMENT_APPROVED")) return CheckCircleIcon;
    if (action.includes("DOCUMENT_REJECTED")) return XCircleIcon;
    if (action.includes("DOCUMENT")) return DocumentTextIcon;

    // System actions
    if (action.includes("SYSTEM")) return CogIcon;

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

  // Render main dashboard content
  const renderMainDashboard = () => {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
          {/* Enhanced Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/30 via-purple-400/25 to-pink-400/20 rounded-full -translate-y-20 translate-x-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-400/25 via-emerald-400/20 to-blue-400/15 rounded-full translate-y-16 -translate-x-16 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/15 rounded-full -translate-y-10 -translate-x-10 animate-bounce"></div>
          <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/15 rounded-full translate-y-8 translate-x-8 animate-pulse"></div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl w-fit">
                  <HomeIcon className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Welcome back, {user?.firstName || "User"}!
                  </h1>
                  <p className="text-gray-600 text-lg sm:text-xl mt-2">
                    Access your ERP modules and manage your business operations
                  </p>
                </div>
              </div>

              {/* Enhanced Date and Time */}
              <div className="text-left lg:text-right">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-800">
                      {currentTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">
                      Available Modules
                    </p>
                    <p className="text-3xl font-bold">
                      {accessibleModules.length}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <FolderIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">
                      Your Role
                    </p>
                    <p className="text-lg font-bold">
                      {(user?.role?.name || "USER").replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <ShieldCheckIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">
                      Access Level
                    </p>
                    <p className="text-3xl font-bold">{roleLevel}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <StarIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleModules.slice(0, 6).map((module, index) => {
              const IconComponent = module.icon;
              return (
                <Link
                  key={module.key}
                  to={module.path}
                  className="p-4 rounded-xl bg-white border-2 border-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white transition-all duration-200 group shadow-lg hover:shadow-xl block"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[var(--elra-primary)] group-hover:bg-white transition-colors">
                      <IconComponent className="h-5 w-5 text-white group-hover:text-[var(--elra-primary)] transition-colors" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[var(--elra-primary)] group-hover:text-white transition-colors">
                        {module.label}
                      </p>
                      <p className="text-sm text-[var(--elra-primary)]/80 group-hover:text-white/80 transition-colors">
                        {module.description || "Access module"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Self-Service Major Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Requests Card */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-red-100 text-sm font-medium">
                  Leave Requests
                </p>
                <p className="text-2xl font-bold">
                  {Array.isArray(leaveRequestsData?.data)
                    ? leaveRequestsData.data.length
                    : 0}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-100">Pending</span>
                <span className="text-white font-medium">
                  {(() => {
                    try {
                      return Array.isArray(leaveRequestsData?.data)
                        ? leaveRequestsData.data.filter(
                            (req) => req.status === "pending"
                          ).length
                        : 0;
                    } catch (error) {
                      console.error(
                        "Error filtering leave requests pending:",
                        error
                      );
                      return 0;
                    }
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-100">Approved</span>
                <span className="text-white font-medium">
                  {(() => {
                    try {
                      return Array.isArray(leaveRequestsData?.data)
                        ? leaveRequestsData.data.filter(
                            (req) => req.status === "approved"
                          ).length
                        : 0;
                    } catch (error) {
                      console.error(
                        "Error filtering leave requests approved:",
                        error
                      );
                      return 0;
                    }
                  })()}
                </span>
              </div>
            </div>
            <button className="w-full mt-4 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors">
              View All Requests
            </button>
          </div>

          {/* Payslip Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-green-100 text-sm font-medium">
                  Latest Payslip
                </p>
                <p className="text-lg font-bold">
                  ₦
                  {Array.isArray(payslipsData?.data) &&
                  payslipsData.data.length > 0
                    ? (
                        payslipsData.data[0]?.summary?.netPay || 0
                      ).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-100">Net Pay</span>
                <span className="text-white font-medium">
                  ₦
                  {Array.isArray(payslipsData?.data) &&
                  payslipsData.data.length > 0
                    ? (
                        payslipsData.data[0]?.summary?.netPay || 0
                      ).toLocaleString()
                    : 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-100">Gross Pay</span>
                <span className="text-white font-medium">
                  ₦
                  {Array.isArray(payslipsData?.data) &&
                  payslipsData.data.length > 0
                    ? (
                        payslipsData.data[0]?.summary?.grossPay || 0
                      ).toLocaleString()
                    : 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-100">Deductions</span>
                <span className="text-white font-medium">
                  ₦
                  {Array.isArray(payslipsData?.data) &&
                  payslipsData.data.length > 0
                    ? (
                        payslipsData.data[0]?.summary?.totalDeductions || 0
                      ).toLocaleString()
                    : 0}
                </span>
              </div>
            </div>
            <button className="w-full mt-4 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors">
              View Payslips
            </button>
          </div>

          {/* Project Count Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <BriefcaseIcon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm font-medium">
                  Active Projects
                </p>
                <p className="text-2xl font-bold">
                  {projectsData?.data?.totalProjects || 0}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-100">Total Projects</span>
                <span className="text-white font-medium">
                  {projectsData?.data?.totalProjects || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-100">Active Projects</span>
                <span className="text-white font-medium">
                  {projectsData?.data?.totalProjects || 0}
                </span>
              </div>
            </div>
            <button className="w-full mt-4 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors">
              View Projects
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          {auditData && auditData.length > 0 ? (
            <div className="space-y-3">
              {auditData.slice(0, 5).map((activity, index) => {
                const colors = [
                  { bg: "bg-blue-100", icon: "text-blue-600" },
                  { bg: "bg-green-100", icon: "text-green-600" },
                  { bg: "bg-purple-100", icon: "text-purple-600" },
                  { bg: "bg-orange-100", icon: "text-orange-600" },
                  { bg: "bg-pink-100", icon: "text-pink-600" },
                ];
                const colorScheme = colors[index % colors.length];

                return (
                  <div
                    key={activity._id || index}
                    className="flex items-center space-x-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${colorScheme.bg}`}>
                      {React.createElement(getActivityIcon(activity.action), {
                        className: `h-5 w-5 ${colorScheme.icon}`,
                      })}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {activity.action?.replace(/_/g, " ") || "Activity"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {activity.details?.description ||
                          activity.details?.projectName ||
                          activity.details?.documentTitle ||
                          "System activity"}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="p-3 rounded-full bg-gray-100 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No recent activity found</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDashboardContent = () => {
    if (isModuleView && currentModule) {
      return (
        <div className="space-y-8">
          {/* Main Dashboard - ALWAYS PRESENT */}
          {renderMainDashboard()}

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

    return renderMainDashboard();
  };

  if (!initialized && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <GradientSpinner size="lg" />
          <p className="text-[var(--elra-primary)] mt-4 text-lg font-medium">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  // Show loading spinner while modules are being loaded
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <GradientSpinner size="lg" />
          <p className="text-[var(--elra-primary)] mt-4 text-lg font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show loading spinner while modules are being loaded
  if (modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <GradientSpinner size="lg" />
          <p className="text-[var(--elra-primary)] mt-4 text-lg font-medium">
            Loading your modules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto p-4">{renderDashboardContent()}</div>

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
    </div>
  );
};

export default Dashboard;
