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
import { getImageUrl } from "../utils/fileUtils.js";

const Sidebar = ({ isOpen, onToggle, isMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const scrollbarStyles = `
    .sidebar-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .sidebar-scroll::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 2px;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb {
      background: #9ca3af;
      border-radius: 2px;
      min-height: 30px;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb:hover {
      background: #6b7280;
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

  const navigation = React.useMemo(() => {
    const list = [...accessibleModules];
    const customerCarePath = "/dashboard/modules/customer-care";
    const idx = list.findIndex((i) => i.path === customerCarePath);
    if (idx !== -1) {
      const [cc] = list.splice(idx, 1);
      list.push(cc);
    }
    return list;
  }, [accessibleModules]);

  const userRoleLevel = user?.role?.level || user?.roleLevel || 300;
  const roleInfo = getRoleInfo(userRoleLevel);

  const shouldShowExpanded = isOpen;

  const handleToggle = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onToggle();
  };

  const toggleItemExpand = (itemPath, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setExpandedItems((prev) => ({
      ...prev,
      [itemPath]: !prev[itemPath],
    }));
  };

  const isActive = (path) => {
    const currentPath = location.pathname;

    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }

    if (path.startsWith("/dashboard/modules/")) {
      return currentPath.startsWith(path);
    }

    return currentPath === path;
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

  // Get children for a module item
  const getItemChildren = (item) => {
    if (!item.path.includes("/modules/")) return [];

    const moduleKey = item.path.split("/modules/")[1];

    if (
      isModuleView &&
      currentModule === moduleKey &&
      moduleSidebarItems.length > 0
    ) {
      return moduleSidebarItems.flatMap((section) => section.items || []);
    }

    return [];
  };

  // Check if item has children
  const itemHasChildren = (item) => {
    if (!item.path.includes("/modules/")) return false;
    const moduleKey = item.path.split("/modules/")[1];
    return (
      isModuleView &&
      currentModule === moduleKey &&
      moduleSidebarItems.length > 0
    );
  };

  // Auto-expand parent if any child is active
  React.useEffect(() => {
    if (isModuleView && currentModule && moduleSidebarItems.length > 0) {
      const modulePath = `/dashboard/modules/${currentModule}`;
      const hasActiveChild = moduleSidebarItems.some((section) =>
        section.items?.some((item) => isActive(item.path))
      );

      if (hasActiveChild && !expandedItems[modulePath]) {
        setExpandedItems((prev) => ({
          ...prev,
          [modulePath]: true,
        }));
      }
    }
  }, [isModuleView, currentModule, moduleSidebarItems, location.pathname]);

  const renderNavItemExpanded = (item) => {
    const IconComponent = getIconComponent(item.icon);
    const isItemActive = isActive(item.path);
    const hasChildren = itemHasChildren(item);
    const children = hasChildren ? getItemChildren(item) : [];
    const isExpanded = expandedItems[item.path] || false;

    return (
      <div key={item.path} className="relative">
        <div
          className={`group flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ${
            isItemActive
              ? "bg-emerald-50 text-emerald-700"
              : "text-gray-800 hover:bg-gray-50"
          }`}
        >
          <IconComponent
            className={`h-5 w-5 ${
              isItemActive ? "text-emerald-600" : "text-gray-600"
            }`}
          />
          <Link
            to={item.path}
            onClick={() => {
              if (item.path.includes("/modules/") && !isItemActive) {
                startModuleLoading();
              }
            }}
            className="ml-3 flex-1"
          >
            {item.label}
          </Link>
          {hasChildren && (
            <button
              onClick={(e) => toggleItemExpand(item.path, e)}
              className="p-1 hover:bg-gray-200 rounded transition-colors ml-2"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-8 mt-1 space-y-1">
            {children.map((child, childIndex) => {
              const ChildIconComponent = getIconComponent(child.icon);
              const isChildActive = isActive(child.path);

              return (
                <Link
                  key={childIndex}
                  to={child.path}
                  className={`group flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isChildActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ChildIconComponent
                    className={`h-4 w-4 ${
                      isChildActive ? "text-emerald-600" : "text-gray-600"
                    }`}
                  />
                  <span className="ml-3 flex-1">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out ${
          shouldShowExpanded ? "w-80" : "w-16"
        } ${
          isMobile
            ? isOpen
              ? "transform translate-x-0"
              : "-translate-x-full"
            : ""
        } ${!isOpen && !isMobile ? "lg:translate-x-0" : ""}`}
        style={{
          minHeight: "100vh",
          height: "100vh",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Collapsed Panel - Only shown when NOT expanded */}
        {!shouldShowExpanded && (
          <div
            className="bg-white w-16 h-full flex flex-col items-center border-r border-gray-200 relative"
            style={{
              minHeight: "100vh",
              height: "100vh",
              overflowY: "auto",
            }}
          >
            {/* Top Section - Arrow and Logo */}
            <div className="w-full flex flex-col items-center pt-3 pb-4">
              {/* Expand Arrow Button - Top right */}
              <button
                onClick={handleToggle}
                className="w-6 h-6 bg-white border border-gray-300 shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors z-20 rounded-sm mb-3"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRightIcon className="h-4 w-4 text-gray-800" />
              </button>

              {/* Logo/Icon - Green square with E */}
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex flex-col items-center space-y-3 flex-1 px-2">
              {navigation.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                const isItemActive = isActive(item.path);

                return (
                  <div
                    key={item.path}
                    className="relative w-full flex justify-center"
                  >
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (item.path.includes("/modules/") && !isItemActive) {
                          startModuleLoading();
                        }
                      }}
                      className={`relative flex items-center justify-center h-11 w-11 rounded-lg transition-all duration-300 ${
                        isItemActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      title={item.label}
                    >
                      <IconComponent className="h-5 w-5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expanded Panel - Only shown when expanded */}
        {shouldShowExpanded && (
          <div
            className="bg-white w-80 h-full flex flex-col border-r border-gray-200 relative"
            style={{
              minHeight: "100vh",
              height: "100vh",
              overflowY: "auto",
            }}
          >
            {/* Collapse Arrow Button - Right edge, protruding */}
            <button
              onClick={handleToggle}
              className="absolute top-2 right-2 w-6 h-6 bg-white border border-gray-300 shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors z-20 rounded-sm"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-800 transform rotate-180" />
            </button>

            {/* AdminHub Header Section */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center mr-3">
                  <span className="text-white text-xs font-bold">ERP</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  AdminHub
                </span>
              </div>
            </div>

            {/* Navigation Items */}
            <div
              className="px-2 py-4 space-y-1 sidebar-scroll flex-1"
              style={{
                maxHeight: "calc(100vh - 80px)",
                overflowY: "auto",
              }}
            >
              <div className="space-y-1">
                {sections.main.map(renderNavItemExpanded)}

                {loadingModules ? (
                  <div className="space-y-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center px-3 py-2 rounded-lg animate-pulse bg-gray-100"
                      >
                        <div className="h-5 w-5 rounded bg-gray-300" />
                        <div className="ml-3 h-4 w-32 rounded bg-gray-300" />
                      </div>
                    ))}
                  </div>
                ) : (
                  sections.erp.map(renderNavItemExpanded)
                )}

                {sections.system.map(renderNavItemExpanded)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
