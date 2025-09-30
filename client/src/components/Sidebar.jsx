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
  UserCircleIcon,
  BanknotesIcon,
  ComputerDesktopIcon,
  ScaleIcon,
  CreditCardIcon,
  TruckIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import {
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
  const [isHovered, setIsHovered] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const {
    currentModule,
    moduleSidebarItems,
    isModuleView,
    getCurrentModuleInfo,
    startModuleLoading,
  } = useDynamicSidebar();

  const [backendModules, setBackendModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const fetchBackendModules = async () => {
    try {
      setLoadingModules(true);
      const response = await userModulesAPI.getUserModules();

      if (response.success && response.data) {
        const transformedModules = userModulesAPI.transformModules(
          response.data
        );
        setBackendModules(transformedModules);
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
    // Always include the main Dashboard link
    const mainNavigation = [
      {
        label: "Dashboard",
        icon: "HiOutlineHome",
        path: "/dashboard",
        required: { minLevel: 0 },
        section: "main",
      },
    ];

    if (backendModules && backendModules.length > 0) {
      const erpModules = backendModules
        .map((module, index) => {
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

          return sidebarModule;
        })
        .filter(Boolean);

      return [...mainNavigation, ...erpModules];
    }

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

    return [...mainNavigation, ...fallbackModules];
  };

  const getIconForModule = (moduleKey) => {
    const iconMap = {
      "self-service": "UserCircleIcon",
      hr: "UserGroupIcon",
      finance: "BanknotesIcon",
      it: "ComputerDesktopIcon",
      operations: "Cog6ToothIcon",
      sales: "ArrowTrendingUpIcon",
      legal: "ScaleIcon",
      "system-admin": "WrenchScrewdriverIcon",
      payroll: "CreditCardIcon",
      procurement: "TruckIcon",
      projects: "BriefcaseIcon",
      inventory: "ArchiveBoxIcon",
      "customer-care": "HeartIcon",
    };
    return iconMap[moduleKey] || "Cog6ToothIcon";
  };

  const accessibleModules = getAccessibleModules();

  const navigation = [...accessibleModules];

  const userRoleLevel = user?.role?.level || user?.roleLevel || 300;
  const roleInfo = getRoleInfo(userRoleLevel);

  const handleMouseEnter = () => {
    if (!isMobile && !isOpen) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && !isOpen) {
      setIsHovered(false);
    }
  };

  const shouldShowExpanded = isOpen || isHovered;

  const handleToggle = () => {
    setIsTransitioning(true);
    onToggle();

    if (isOpen) {
      const allSections = {};
      Object.keys(sections).forEach((section) => {
        allSections[section] = true;
      });
      setCollapsedSections(allSections);
    }

    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
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

  const isSectionCollapsed = (sectionTitle, _defaultExpanded = false) => {
    if (collapsedSections.hasOwnProperty(sectionTitle)) {
      return collapsedSections[sectionTitle];
    }
    return !shouldShowExpanded;
  };

  React.useEffect(() => {
    if (isModuleView && currentModule) {
      setCollapsedSections({});
    }
  }, [currentModule, isModuleView]);

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
    const currentPath = location.pathname;

    // Dashboard should only be active when on the main dashboard page
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }

    // For module paths, check if current path starts with the module path
    if (path.startsWith("/dashboard/modules/")) {
      return currentPath.startsWith(path);
    }

    return currentPath === path;
  };

  const getMostSpecificActiveItem = () => {
    const currentPath = location.pathname;

    if (currentPath === "/dashboard") return "/dashboard";

    if (currentPath.startsWith("/dashboard/modules/")) {
      const modulePath = currentPath.split("/").slice(0, 4).join("/");
      return modulePath;
    }

    if (currentPath.startsWith("/dashboard/")) {
      return currentPath;
    }

    return currentPath;
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
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
      HiOutlineClock: ClockIcon,
      HiOutlineTrendingUp: ArrowTrendingUpIcon,
      HiOutlineDocumentReport: ChartBarIcon,
      HiOutlineUser: UserCircleIcon,
      HiOutlineUsers: UserGroupIcon,
      HiOutlineChatBubbleLeftRight: HeartIcon,
      HiOutlineCog6Tooth: Cog6ToothIcon,
      HiOutlineBuildingOffice2: BuildingOffice2Icon,

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

      UserCircleIcon: UserCircleIcon,
      UserGroupIcon: UserGroupIcon,
      BanknotesIcon: BanknotesIcon,
      ComputerDesktopIcon: ComputerDesktopIcon,
      ArrowTrendingUpIcon: ArrowTrendingUpIcon,
      ScaleIcon: ScaleIcon,
      CreditCardIcon: CreditCardIcon,
      TruckIcon: TruckIcon,
      BriefcaseIcon: BriefcaseIcon,
      ArchiveBoxIcon: ArchiveBoxIcon,
      HeartIcon: HeartIcon,
    };
    return iconMap[iconName] || HomeIcon;
  };

  const renderNavItem = (item) => {
    const IconComponent = getIconComponent(item.icon);
    const isItemActive = isActive(item.path);
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
          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 relative cursor-pointer ${
            isItemActive
              ? "bg-[var(--elra-primary)] text-white font-semibold"
              : "text-gray-700 hover:bg-gray-100 hover:text-[var(--elra-primary)]"
          } ${!shouldShowExpanded && "justify-center"}`}
        >
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
              </div>
            </>
          )}
        </Link>
      </div>
    );
  };

  const renderSection = (sectionKey, sectionTitle, items) => {
    if (!items || items.length === 0) return null;
    if (!hasSectionAccess(userRoleLevel, sectionKey)) return null;

    const isCollapsed = isSectionCollapsed(sectionTitle, false);
    const extraMarginTop = sectionKey === "erp" ? "mt-8" : "";

    return (
      <div key={sectionKey} className={`mb-8 ${extraMarginTop}`}>
        {shouldShowExpanded && (
          <button
            onClick={(e) => toggleSectionCollapse(sectionTitle, e)}
            className={`w-full px-4 text-sm font-bold uppercase tracking-wider mb-3 py-3 flex items-center justify-between transition-all duration-200 text-[var(--elra-primary)] cursor-pointer hover:bg-gray-100`}
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
                className={`flex flex-col items-center p-2 rounded-full transition-all duration-200 cursor-pointer min-h-[60px] justify-center ${
                  isItemActive
                    ? "bg-[var(--elra-primary)] text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-[var(--elra-primary)]"
                }`}
                title={item.label}
                style={{ height: "60px" }}
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

  // Group navigation items by section
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
        } shadow-2xl shadow-gray-200/20`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          minHeight: "100vh",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          {shouldShowExpanded && (
            <div className="flex items-center">
              <span className="font-bold text-[var(--elra-primary)] text-lg">
                {isModuleView && currentModule
                  ? getCurrentModuleInfo()?.label || currentModule
                  : "Dashboard"}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1">
            {shouldShowExpanded ? (
              <button
                onClick={handleToggle}
                className="p-2 text-gray-500 hover:text-[var(--elra-primary)] hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronDownIcon className="h-5 w-5 transform rotate-90" />
              </button>
            ) : (
              <button
                onClick={handleToggle}
                className="p-2 text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-all duration-200 cursor-pointer"
                title="Expand sidebar"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}

            {/* Mobile toggle button */}
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
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`${
                  shouldShowExpanded ? "w-12 h-12" : "w-10 h-10"
                } rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-[var(--elra-primary)] ${
                  !shouldShowExpanded ? "mx-auto" : ""
                }`}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`${
                    user?.avatar ? "hidden" : "flex"
                  } w-full h-full bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] items-center justify-center`}
                >
                  <span
                    className={`text-white font-bold ${
                      shouldShowExpanded ? "text-lg" : "text-base"
                    }`}
                  >
                    {user?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
                  </span>
                </div>
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
          className="px-4 py-6 space-y-1 sidebar-scroll"
          style={{
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          <div className="space-y-1">
            {shouldShowExpanded && sections.main.map(renderNavItem)}

            {shouldShowExpanded
              ? renderSection("erp", "ERP Modules", sections.erp)
              : renderCollapsedERPModules()}

            {shouldShowExpanded && (
              <>
                {isModuleView && currentModule && (
                  <>
                    <div className="mb-6 mt-4">
                      <button
                        onClick={(e) =>
                          toggleSectionCollapse("Module Features", e)
                        }
                        className="w-full px-4 text-sm font-bold text-[var(--elra-primary)] uppercase tracking-wider mb-3 py-3 rounded-full flex items-center justify-between transition-all duration-200 cursor-pointer hover:bg-gray-100"
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

                    {!isSectionCollapsed("Module Features", false) && (
                      <div className="space-y-4">
                        {moduleSidebarItems.map((section, sectionIndex) => (
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
                                  {isSectionCollapsed(
                                    section.title,
                                    section.defaultExpanded
                                  ) ? (
                                    <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
                                  ) : (
                                    <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
                                  )}
                                </div>
                              )}
                            </button>
                            {(!section.collapsible ||
                              !isSectionCollapsed(
                                section.title,
                                section.defaultExpanded
                              )) && (
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
                                        className={`group flex items-center px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                                          isItemActive
                                            ? "bg-[var(--elra-primary)] text-white font-semibold"
                                            : "text-gray-700 hover:bg-gray-100 hover:text-[var(--elra-primary)]"
                                        }`}
                                      >
                                        <IconComponent
                                          className={`h-4 w-4 ${
                                            isItemActive
                                              ? "text-white"
                                              : "text-gray-600 group-hover:text-[var(--elra-primary)]"
                                          } transition-transform duration-200 group-hover:scale-110`}
                                        />
                                        <span className="ml-3 flex-1">
                                          {item.label}
                                        </span>
                                      </Link>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {renderSection("system", "System", sections.system)}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
