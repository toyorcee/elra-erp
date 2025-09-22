import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
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
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  UserPlusIcon,
  IdentificationIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ReceiptPercentIcon,
  GiftIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  BookOpenIcon,
  DocumentMagnifyingGlassIcon,
  MegaphoneIcon,
  CalendarDaysIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TagIcon,
  WrenchScrewdriverIcon,
  TicketIcon,
  QuestionMarkCircleIcon,
  FlagIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  sidebarConfig,
  getNavigationForRole,
  getRoleInfo,
  hasSectionAccess,
} from "../config/sidebarConfig";
import { userModulesAPI } from "../services/userModules.js";
import { useAuth } from "../context/AuthContext";
import { useDynamicSidebar } from "../context/DynamicSidebarContext";

const Sidebar = ({ isOpen, onToggle, isMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pinnedItems, setPinnedItems] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Custom scrollbar styles
  const scrollbarStyles = `
    .sidebar-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .sidebar-scroll::-webkit-scrollbar-track {
      background: var(--elra-secondary-3);
      border-radius: 2px;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb {
      background: var(--elra-primary);
      border-radius: 2px;
      min-height: 30px;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb:hover {
      background: var(--elra-primary-dark);
    }
    .sidebar-scroll::-webkit-scrollbar-thumb:active {
      background: var(--elra-primary-dark);
    }
  `;

  // Dynamic sidebar context
  const {
    currentModule,
    moduleSidebarItems,
    isModuleView,
    getCurrentModuleInfo,
    returnToMainDashboard,
    startModuleLoading,
  } = useDynamicSidebar();

  // Use the same logic as the dashboard - fetch from backend API
  const [backendModules, setBackendModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const fetchBackendModules = async () => {
    try {
      setLoadingModules(true);
      const response = await userModulesAPI.getUserModules();
      console.log("🔍 [Sidebar] Raw API response:", response);

      if (response.success && response.data) {
        const transformedModules = userModulesAPI.transformModules(
          response.data
        );
        setBackendModules(transformedModules);
        console.log(
          "✅ [Sidebar] Transformed modules loaded:",
          transformedModules.length
        );
        console.log(
          "🔍 [Sidebar] First transformed module:",
          transformedModules[0]
        );
      }
    } catch (error) {
      console.error("❌ [Sidebar] Error fetching backend modules:", error);
    } finally {
      setLoadingModules(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBackendModules();
    }
  }, [user]);

  const getAccessibleModules = () => {
    console.log("🔍 [Sidebar] getAccessibleModules called");
    console.log("🔍 [Sidebar] backendModules:", backendModules);

    if (backendModules && backendModules.length > 0) {
      console.log("🔍 [Sidebar] Processing backend modules...");

      return backendModules
        .map((module, index) => {
          console.log(`🔍 [Sidebar] Processing module ${index}:`, module);

          const moduleName = module.name || module.title;
          if (!module.code || !moduleName) {
            console.warn(
              `⚠️ [Sidebar] Module ${index} missing required fields:`,
              module
            );
            return null;
          }

          const moduleKey = module.code.toLowerCase().replace(/_/g, "-");
          const sidebarModule = {
            label: moduleName,
            icon: getIconForModule(moduleKey),
            path: `/dashboard/modules/${moduleKey}`,
            required: { minLevel: module.requiredRoleLevel || 300 },
            section: "erp",
            badge: moduleName.split(" ")[0],
            permissions: module.permissions,
          };

          console.log(`✅ [Sidebar] Created sidebar module:`, sidebarModule);
          return sidebarModule;
        })
        .filter(Boolean);
    }

    // Fallback to frontend filtering
    console.log("🔍 [Sidebar] No backend modules, using fallback...");
    const userRoleLevel = user?.role?.level || user?.roleLevel || 300;
    const userDepartment = user?.department?.name || null;
    const userPermissions = user?.permissions || [];
    const userModuleAccess =
      user?.role?.moduleAccess || user?.moduleAccess || [];

    const fallbackNavigation = getNavigationForRole(
      userRoleLevel,
      userDepartment,
      userPermissions,
      userModuleAccess
    );

    const fallbackModules = fallbackNavigation
      ? fallbackNavigation.filter((item) => item.section === "erp")
      : [];

    console.log("🔍 [Sidebar] Fallback modules:", fallbackModules);
    return fallbackModules;
  };

  // Helper function to get icon for module
  const getIconForModule = (moduleKey) => {
    const iconMap = {
      "self-service": "HiOutlineUser",
      hr: "HiOutlineUsers",
      finance: "HiOutlineCalculator",
      it: "HiOutlineCog6Tooth",
      operations: "HiOutlineCog6Tooth",
      sales: "HiOutlineChartBar",
      legal: "HiOutlineShieldCheck",
      "system-admin": "HiOutlineCog6Tooth",
      payroll: "HiOutlineCurrencyDollar",
      procurement: "HiOutlineShoppingCart",
      projects: "HiOutlineFolder",
      inventory: "HiOutlineCube",
      "customer-care": "HiOutlineChatBubbleLeftRight",
    };
    return iconMap[moduleKey] || "HiOutlineCog6Tooth";
  };

  const accessibleModules = getAccessibleModules();

  // Create navigation with backend modules
  const navigation = [
    // Main dashboard
    {
      label: "Dashboard",
      icon: "HiOutlineHome",
      path: "/dashboard",
      required: { minLevel: 0 },
      section: "main",
    },
    // ERP modules from backend
    ...accessibleModules,
  ];

  const userRoleLevel = user?.role?.level || user?.roleLevel || 300;
  const roleInfo = getRoleInfo(userRoleLevel);

  const handleMouseEnter = () => {
    if (!isMobile && !isOpen && !isPinned) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && !isOpen && !isPinned) {
      setIsHovered(false);
    }
  };

  const shouldShowExpanded = isOpen || isPinned || (isHovered && !isPinned);

  // Handle sidebar toggle with smooth transitions
  const handleToggle = () => {
    setIsTransitioning(true);
    onToggle();

    // Close all sections when collapsing
    if (isOpen) {
      const allSections = {};
      Object.keys(sections).forEach((section) => {
        allSections[section] = true;
      });
      setCollapsedSections(allSections);
    }

    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const togglePin = (itemId) => {
    setPinnedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSidebarPin = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);

    if (newPinnedState) {
      if (!isOpen) {
        onToggle();
      }
      setIsHovered(false);
    } else {
      if (isOpen && !isMobile) {
        onToggle();
      }
      setIsHovered(false);
    }
  };

  const toggleSectionCollapse = (sectionTitle, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setTimeout(() => {
      setCollapsedSections((prev) => ({
        ...prev,
        [sectionTitle]: !prev[sectionTitle],
      }));
    }, 50);
  };

  const isSectionCollapsed = (sectionTitle, defaultExpanded = false) => {
    if (collapsedSections.hasOwnProperty(sectionTitle)) {
      return collapsedSections[sectionTitle];
    }
    return !shouldShowExpanded; // Collapse by default when sidebar is closed
  };

  React.useEffect(() => {
    if (isModuleView && currentModule) {
      setCollapsedSections({});
    }
  }, [currentModule, isModuleView]);

  // Auto-collapse sections when sidebar is closed
  useEffect(() => {
    if (!shouldShowExpanded) {
      const allSections = {};
      Object.keys(sections).forEach((section) => {
        allSections[section] = true;
      });
      setCollapsedSections(allSections);
    }
  }, [shouldShowExpanded]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => {
    // Exact match takes priority
    if (location.pathname === path) {
      return true;
    }

    if (path.startsWith("/dashboard/modules/")) {
      return location.pathname === path;
    }

    if (path === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        (location.pathname.startsWith("/dashboard") &&
          !location.pathname.startsWith("/dashboard/modules/"))
      );
    }

    return location.pathname.startsWith(path + "/");
  };

  // Get the most specific active item for visual feedback
  const getMostSpecificActiveItem = () => {
    const currentPath = location.pathname;

    // Check for exact matches first
    if (currentPath === "/dashboard") return "/dashboard";

    // Check for module paths
    if (currentPath.startsWith("/dashboard/modules/")) {
      const modulePath = currentPath.split("/").slice(0, 4).join("/");
      return modulePath;
    }

    // Check for other dashboard paths
    if (currentPath.startsWith("/dashboard/")) {
      return currentPath;
    }

    return currentPath;
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      // Main sidebar icons
      HiOutlineHome: HomeIcon,
      HiOutlineUsers: UsersIcon,
      HiOutlineCurrencyDollar: CurrencyDollarIcon,
      HiOutlineShoppingCart: ShoppingCartIcon,
      HiOutlineCalculator: CalculatorIcon,
      HiOutlineChat: ChatBubbleLeftRightIcon,
      HiOutlineFolder: FolderIcon,
      HiOutlineCube: CubeIcon,
      HiOutlineSupport: PhoneIcon,
      HiOutlineUserGroup: UserGroupIcon,
      HiOutlineShieldCheck: ShieldCheckIcon,
      HiOutlineBuildingOffice2: BuildingOffice2Icon,
      HiOutlineDocumentText: DocumentTextIcon,
      HiOutlineArchive: ArchiveBoxIcon,
      HiOutlineChartBar: ChartBarIcon,
      HiOutlineChartPie: ChartPieIcon,
      HiOutlineClipboardDocumentList: ClipboardDocumentListIcon,
      HiOutlineBriefcase: BriefcaseIcon,
      HiOutlineShoppingBag: ShoppingBagIcon,
      HiOutlinePhone: PhoneIcon,
      HiOutlineMail: EnvelopeIcon,
      HiOutlineLocationMarker: MapPinIcon,
      HiOutlineClock: ClockIcon,
      HiOutlineTrendingUp: ArrowTrendingUpIcon,
      HiOutlineDocumentReport: ChartBarIcon,

      // Module-specific icons
      UsersIcon: UsersIcon,
      UserPlusIcon: UserPlusIcon,
      IdentificationIcon: IdentificationIcon,
      AcademicCapIcon: AcademicCapIcon,
      ClipboardDocumentCheckIcon: ClipboardDocumentCheckIcon,
      ReceiptPercentIcon: ReceiptPercentIcon,
      GiftIcon: GiftIcon,
      MinusCircleIcon: MinusCircleIcon,
      PlusCircleIcon: PlusCircleIcon,
      BookOpenIcon: BookOpenIcon,
      DocumentMagnifyingGlassIcon: DocumentMagnifyingGlassIcon,
      MegaphoneIcon: MegaphoneIcon,
      CalendarDaysIcon: CalendarDaysIcon,
      CalendarIcon: CalendarIcon,
      BuildingStorefrontIcon: BuildingStorefrontIcon,
      StarIcon: StarIcon,
      ExclamationTriangleIcon: ExclamationTriangleIcon,
      ArrowPathIcon: ArrowPathIcon,
      TagIcon: TagIcon,
      WrenchScrewdriverIcon: WrenchScrewdriverIcon,
      TicketIcon: TicketIcon,
      QuestionMarkCircleIcon: QuestionMarkCircleIcon,
      FlagIcon: FlagIcon,
      CogIcon: CogIcon,
    };
    return iconMap[iconName] || HomeIcon;
  };

  const renderNavItem = (item) => {
    const IconComponent = getIconComponent(item.icon);
    const isItemActive = isActive(item.path);
    const isPinned = pinnedItems.includes(item.label);
    const isMostSpecific = getMostSpecificActiveItem() === item.path;

    const handleClick = () => {
      if (item.path.includes("/modules/") && !isItemActive) {
        startModuleLoading();
      }
    };

    return (
      <div key={item.path} className="relative">
        <Link
          to={item.path}
          onClick={handleClick}
          className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative cursor-pointer ${
            isItemActive
              ? "bg-[var(--elra-primary)] text-white font-semibold shadow-lg"
              : "text-gray-700 hover:bg-gray-100 hover:text-[var(--elra-primary)]"
          } ${!shouldShowExpanded && "justify-center"}`}
        >
          {/* Active indicator */}
          {isItemActive && (
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[var(--elra-primary-dark)]`}
            />
          )}
          <div className="relative">
            <IconComponent
              className={`h-5 w-5 ${
                isItemActive
                  ? "text-white"
                  : "text-gray-600 group-hover:text-[var(--elra-primary)]"
              } ${
                !shouldShowExpanded && "mx-auto"
              } transition-transform duration-200 group-hover:scale-110`}
            />
          </div>
          {shouldShowExpanded && (
            <>
              <span
                className={`ml-3 flex-1 ${
                  isItemActive
                    ? "text-white"
                    : "text-gray-700 group-hover:text-[var(--elra-primary)]"
                }`}
              >
                {item.label}
              </span>
              <div className="flex items-center space-x-2">
                {isMostSpecific && (
                  <span className="px-2 py-1 text-xs font-bold text-white bg-white/20 rounded-full">
                    Active
                  </span>
                )}
                {isPinned && (
                  <MapPinIcon
                    className={`h-4 w-4 ${
                      isItemActive
                        ? "text-white"
                        : "text-gray-600 group-hover:text-[var(--elra-primary)]"
                    }`}
                  />
                )}
              </div>
            </>
          )}
        </Link>
        {shouldShowExpanded && item.section !== "erp" && (
          <button
            onClick={() => togglePin(item.label)}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-all duration-200 cursor-pointer ${
              isPinned
                ? "text-[var(--elra-primary)]"
                : "text-gray-400 hover:text-[var(--elra-primary)]"
            }`}
          >
            <MapPinIcon className={`h-4 w-4 ${isPinned ? "rotate-45" : ""}`} />
          </button>
        )}
      </div>
    );
  };

  const renderSection = (sectionKey, sectionTitle, items) => {
    if (!items || items.length === 0) return null;
    if (!hasSectionAccess(userRoleLevel, sectionKey)) return null;

    // Check if this section contains the active item
    const hasActiveItem = items.some((item) => isActive(item.path));
    const isCollapsed = isSectionCollapsed(sectionTitle, false);

    // Add extra margin-top for ERP Modules section
    const extraMarginTop = sectionKey === "erp" ? "mt-8" : "";

    return (
      <div key={sectionKey} className={`mb-8 ${extraMarginTop}`}>
        {shouldShowExpanded && (
          <button
            onClick={(e) => toggleSectionCollapse(sectionTitle, e)}
            className={`w-full px-4 text-sm font-bold uppercase tracking-wider mb-3 py-3 rounded-lg flex items-center justify-between transition-all duration-200 text-[var(--elra-primary)] cursor-pointer hover:bg-gray-100`}
          >
            <div className="flex items-center">
              <span>{sectionTitle.toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-2">
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
              )}
            </div>
          </button>
        )}
        {!isCollapsed && (
          <div className="space-y-2">{items.map(renderNavItem)}</div>
        )}
      </div>
    );
  };

  // Special renderer for ERP modules when sidebar is collapsed
  const renderCollapsedERPModules = () => {
    if (shouldShowExpanded || sections.erp.length === 0) return null;

    return (
      <div className="mb-8 mt-8">
        <div className="grid grid-cols-2 gap-2 px-2">
          {sections.erp.slice(0, 8).map((item) => {
            const IconComponent = getIconComponent(item.icon);
            const isItemActive = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  isItemActive
                    ? "bg-[var(--elra-primary)] text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100 hover:text-[var(--elra-primary)]"
                }`}
                title={item.label}
              >
                <IconComponent className="h-5 w-5 mb-1" />
                <span className="text-xs text-center leading-tight truncate w-full">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
        {sections.erp.length > 8 && (
          <div className="mt-2 text-center">
            <button className="text-gray-500 text-xs hover:text-[var(--elra-primary)]">
              +{sections.erp.length - 8} more
            </button>
          </div>
        )}
      </div>
    );
  };

  // Group navigation items by section using the filtered navigation
  const sections = {
    main: navigation.filter((item) => item.section === "main"),
    erp: navigation.filter((item) => item.section === "erp"),
    system: navigation.filter((item) => item.section === "system"),
    documents: navigation.filter((item) => item.section === "documents"),
    communication: navigation.filter(
      (item) => item.section === "communication"
    ),
    reports: navigation.filter((item) => item.section === "reports"),
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white backdrop-blur-xl border-r border-gray-200 z-50 transition-all duration-300 ease-in-out ${
          shouldShowExpanded ? "w-64" : "w-16"
        } ${
          isMobile
            ? isOpen
              ? "transform translate-x-0"
              : "-translate-x-full"
            : ""
        } ${
          !isOpen && !isMobile ? "lg:translate-x-0" : ""
        } shadow-2xl shadow-gray-200/20 overflow-hidden`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white">
          {/* Section Title when expanded or hovered */}
          {shouldShowExpanded && (
            <div className="flex items-center">
              <span className="font-bold text-[var(--elra-primary)] text-lg">
                {isModuleView && currentModule
                  ? getCurrentModuleInfo()?.label || currentModule
                  : "Dashboard"}
              </span>
            </div>
          )}

          {/* Show hamburger when collapsed, pin when expanded */}
          {shouldShowExpanded ? (
            <button
              onClick={toggleSidebarPin}
              className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 cursor-pointer ${
                isPinned
                  ? "text-[var(--elra-primary)]"
                  : "text-gray-500 hover:text-[var(--elra-primary)]"
              }`}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <MapPinIcon
                className={`h-5 w-5 ${isPinned ? "rotate-45" : ""}`}
              />
            </button>
          ) : (
            <button
              onClick={handleToggle}
              className="p-2 rounded-xl text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-all duration-200 hover:scale-110 cursor-pointer"
              title="Expand sidebar"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          )}

          {/* Only show hamburger on mobile */}
          <button
            onClick={handleToggle}
            className="p-2 rounded-xl text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-all duration-200 hover:scale-110 cursor-pointer lg:hidden"
          >
            {isOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>

          {/* Desktop toggle button - only show when expanded */}
          {shouldShowExpanded && (
            <button
              onClick={handleToggle}
              className="hidden lg:block p-2 rounded-xl text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-all duration-200 hover:scale-110 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`${
                  shouldShowExpanded ? "w-12 h-12" : "w-10 h-10"
                } bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-2xl flex items-center justify-center shadow-lg ${
                  !shouldShowExpanded ? "mx-auto" : ""
                }`}
              >
                <span
                  className={`text-white font-bold ${
                    shouldShowExpanded ? "text-lg" : "text-base"
                  }`}
                >
                  {user?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
                </span>
              </div>
              {shouldShowExpanded && (
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 font-semibold truncate">
                    {user?.department?.name || "Department"}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {typeof roleInfo?.title === "string"
                      ? roleInfo.title
                      : "Staff"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div
          className="flex-1 px-4 py-6 space-y-1 overflow-y-auto sidebar-scroll flex flex-col"
          style={{
            maxHeight: "calc(100vh - 200px)",
            overflowY: shouldShowExpanded ? "auto" : "hidden",
          }}
        >
          <div className="flex-1">
            {/* Dashboard at the top - only show when expanded */}
            {shouldShowExpanded && sections.main.map(renderNavItem)}

            {/* ERP Modules - special rendering when collapsed */}
            {shouldShowExpanded
              ? renderSection("erp", "ERP Modules", sections.erp)
              : renderCollapsedERPModules()}

            {/* Other sections - only show when expanded */}
            {shouldShowExpanded && (
              <>
                {/* Render module-specific navigation when in module view */}
                {isModuleView && currentModule && (
                  <>
                    {/* Module Header */}
                    <div className="mb-6 mt-4">
                      <button
                        onClick={(e) =>
                          toggleSectionCollapse("Module Features", e)
                        }
                        className="w-full px-4 text-sm font-bold text-[var(--elra-primary)] uppercase tracking-wider mb-3 py-3 rounded-lg flex items-center justify-between transition-all duration-200 cursor-pointer hover:bg-gray-100"
                      >
                        <span>Module Features</span>
                        <div className="flex items-center space-x-2">
                          {isSectionCollapsed("Module Features", false) ? (
                            <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Module-specific items */}
                    {!isSectionCollapsed("Module Features", false) && (
                      <div className="space-y-4">
                        {moduleSidebarItems.map((section, sectionIndex) => {
                          const isCollapsed = isSectionCollapsed(
                            section.title,
                            section.defaultExpanded
                          );
                          const hasActiveItem = section.items.some((item) =>
                            isActive(item.path)
                          );

                          return (
                            <div key={sectionIndex} className="mb-4">
                              <button
                                onClick={(e) =>
                                  toggleSectionCollapse(section.title, e)
                                }
                                className="w-full px-4 text-xs font-semibold text-[var(--elra-primary)] uppercase tracking-wider mb-2 py-2 rounded-lg flex items-center justify-between transition-all duration-200 cursor-pointer hover:bg-gray-100"
                              >
                                <span>{section.title}</span>
                                {section.collapsible && (
                                  <div className="flex items-center space-x-2">
                                    {isCollapsed ? (
                                      <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
                                    ) : (
                                      <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
                                    )}
                                  </div>
                                )}
                              </button>
                              {(!section.collapsible || !isCollapsed) && (
                                <div className="space-y-1 ml-4">
                                  {section.items.map((item, itemIndex) => {
                                    const IconComponent = getIconComponent(
                                      item.icon
                                    );
                                    const isItemActive = isActive(item.path);

                                    return (
                                      <div key={itemIndex} className="relative">
                                        <Link
                                          to={item.path}
                                          className={`group flex items-center px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                                            isItemActive
                                              ? "bg-[var(--elra-primary)] text-white font-semibold shadow-lg"
                                              : "text-gray-700 hover:bg-gray-100 hover:text-[var(--elra-primary)]"
                                          } ${
                                            !shouldShowExpanded &&
                                            "justify-center"
                                          }`}
                                        >
                                          <div className="relative">
                                            <IconComponent
                                              className={`h-4 w-4 ${
                                                isItemActive
                                                  ? "text-white"
                                                  : "text-gray-600 group-hover:text-[var(--elra-primary)]"
                                              } ${
                                                !shouldShowExpanded && "mx-auto"
                                              } transition-transform duration-200 group-hover:scale-110`}
                                            />
                                          </div>
                                          {shouldShowExpanded && (
                                            <span className="ml-3 flex-1">
                                              {item.label}
                                            </span>
                                          )}
                                        </Link>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* System section after module features */}
                {renderSection("system", "System", sections.system)}

                {/* Pinned Items */}
                {pinnedItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="px-4 text-xs font-bold text-[var(--elra-primary)] uppercase tracking-wider mb-3 py-2 rounded-lg">
                      Pinned
                    </h3>
                    {pinnedItems.map((itemLabel) => {
                      const item = sidebarConfig.find(
                        (nav) => nav.label === itemLabel
                      );
                      return item ? renderNavItem(item) : null;
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
