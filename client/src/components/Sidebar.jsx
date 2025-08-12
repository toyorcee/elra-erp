import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
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

  // Ensure we get the correct role level
  const userRoleLevel = user?.role?.level || user?.roleLevel || 300;
  const roleInfo = getRoleInfo(userRoleLevel);
  const navigation = getNavigationForRole(userRoleLevel);

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

  const toggleSectionCollapse = (sectionTitle) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const isSectionCollapsed = (sectionTitle, defaultExpanded = false) => {
    if (collapsedSections.hasOwnProperty(sectionTitle)) {
      return collapsedSections[sectionTitle];
    }
    return !defaultExpanded;
  };

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

    // For module paths, only highlight the most specific match
    if (path.startsWith("/dashboard/modules/")) {
      return location.pathname.startsWith(path);
    }

    // For main dashboard, only highlight if we're not in a specific module
    if (path === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        (location.pathname.startsWith("/dashboard") &&
          !location.pathname.startsWith("/dashboard/modules/"))
      );
    }

    // For other paths, use exact prefix matching
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
          className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative ${
            isItemActive
              ? isMostSpecific
                ? "bg-[var(--elra-primary)] text-white shadow-lg"
                : "bg-[var(--elra-primary)] text-white shadow-lg"
              : "text-[var(--elra-text-primary)] hover:bg-[var(--elra-secondary-3)] hover:text-[var(--elra-primary)]"
          } ${!shouldShowExpanded && "justify-center"}`}
        >
          {/* Active indicator */}
          {isItemActive && (
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                isMostSpecific
                  ? "bg-[var(--elra-primary)]"
                  : "bg-[var(--elra-secondary-2)]"
              }`}
            />
          )}
          <div className="relative">
            <IconComponent
              className={`h-5 w-5 ${
                !shouldShowExpanded && "mx-auto"
              } transition-transform duration-200 group-hover:scale-110`}
            />
          </div>
          {shouldShowExpanded && (
            <>
              <span className="ml-3 flex-1">{item.label}</span>
              <div className="flex items-center space-x-2">
                {isMostSpecific && (
                  <span className="px-2 py-1 text-xs font-bold bg-[var(--elra-secondary-3)] text-[var(--elra-primary)] rounded-full">
                    Active
                  </span>
                )}
                {isPinned && (
                  <MapPinIcon className="h-4 w-4 text-[var(--elra-primary)]" />
                )}
              </div>
            </>
          )}
        </Link>
        {shouldShowExpanded && (
          <button
            onClick={() => togglePin(item.label)}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-all duration-200 ${
              isPinned
                ? "text-[var(--elra-primary)] bg-[var(--elra-secondary-3)]"
                : "text-gray-400 hover:text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)]"
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
    const isCollapsed = isSectionCollapsed(sectionTitle, false); // Default collapsed for main sections

    return (
      <div key={sectionKey} className="mb-6">
        {shouldShowExpanded && (
          <button
            onClick={() => toggleSectionCollapse(sectionTitle)}
            className={`w-full px-4 text-sm font-bold uppercase tracking-wider mb-3 py-3 rounded-lg flex items-center justify-between transition-all duration-200 ${
              hasActiveItem
                ? "text-white bg-[var(--elra-primary)] border-l-4 border-white"
                : "text-white bg-[var(--elra-primary)]"
            }`}
          >
            <div className="flex items-center">
              <span>{sectionTitle.toUpperCase()}</span>
              {hasActiveItem && (
                <span className="ml-2 text-[var(--elra-primary)]">●</span>
              )}
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

  // Group navigation items by section
  const sections = {
    main: sidebarConfig.filter((item) => item.section === "main"),
    erp: sidebarConfig.filter((item) => item.section === "erp"),
    system: sidebarConfig.filter((item) => item.section === "system"),
    documents: sidebarConfig.filter((item) => item.section === "documents"),
    communication: sidebarConfig.filter(
      (item) => item.section === "communication"
    ),
    reports: sidebarConfig.filter((item) => item.section === "reports"),
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-[var(--elra-border-primary)] z-50 transition-all duration-500 ease-out ${
          shouldShowExpanded ? "w-64" : "w-16"
        } ${
          isMobile
            ? isOpen
              ? "transform translate-x-0"
              : "-translate-x-full"
            : ""
        } ${
          !isOpen && !isMobile ? "lg:translate-x-0" : ""
        } shadow-2xl shadow-[var(--elra-primary)]/10 overflow-hidden`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--elra-border-primary)] bg-[var(--elra-bg-light)]">
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

          {/* Only show hamburger on mobile */}
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] hover:bg-[var(--elra-secondary-3)] transition-all duration-200 hover:scale-110 lg:hidden"
          >
            {isOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>

          {/* Desktop toggle button */}
          <button
            onClick={onToggle}
            className="hidden lg:block p-2 rounded-xl text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] hover:bg-[var(--elra-secondary-3)] transition-all duration-200 hover:scale-110"
          >
            {shouldShowExpanded ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-[var(--elra-border-primary)] bg-[var(--elra-secondary-3)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-[var(--elra-primary)] rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {user?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
                </span>
              </div>
              {shouldShowExpanded && (
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-[var(--elra-primary)] font-medium">
                    {typeof roleInfo?.title === "string"
                      ? roleInfo.title
                      : "Staff"}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar Pin Button - moved to top section */}
            {shouldShowExpanded && (
              <button
                onClick={toggleSidebarPin}
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                  isPinned
                    ? "text-[var(--elra-primary)] bg-[var(--elra-secondary-3)]"
                    : "text-gray-400 hover:text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)]"
                }`}
                title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                <MapPinIcon
                  className={`h-4 w-4 ${isPinned ? "rotate-45" : ""}`}
                />
              </button>
            )}
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
            {/* Dashboard at the top */}
            {sections.main.map(renderNavItem)}

            {/* Other sections */}
            {renderSection("erp", "ERP Modules", sections.erp)}

            {/* Render module-specific navigation when in module view */}
            {isModuleView && currentModule && (
              <>
                {/* Module Header */}
                {shouldShowExpanded && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSectionCollapse("Module Features")}
                      className="w-full px-4 text-sm font-bold text-white uppercase tracking-wider mb-3 bg-[var(--elra-primary)] py-3 rounded-lg border-l-4 border-white flex items-center justify-between transition-all duration-200"
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
                )}

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
                          {shouldShowExpanded && (
                            <button
                              onClick={() =>
                                toggleSectionCollapse(section.title)
                              }
                              className={`w-full px-4 text-xs font-semibold text-[var(--elra-primary)] uppercase tracking-wider mb-2 bg-[var(--elra-secondary-2)] py-2 rounded-lg flex items-center justify-between transition-all duration-200 ${
                                hasActiveItem
                                  ? "border-l-4 border-[var(--elra-primary)]"
                                  : ""
                              }`}
                            >
                              <span>{section.title}</span>
                              {section.collapsible && (
                                <div className="flex items-center space-x-2">
                                  {hasActiveItem && (
                                    <span className="text-[var(--elra-primary)]">
                                      ●
                                    </span>
                                  )}
                                  {isCollapsed ? (
                                    <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
                                  ) : (
                                    <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
                                  )}
                                </div>
                              )}
                            </button>
                          )}
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
                                      className={`group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                        isItemActive
                                          ? "bg-[var(--elra-primary)] text-white shadow-lg"
                                          : "text-[var(--elra-text-primary)] hover:bg-[var(--elra-secondary-3)] hover:text-[var(--elra-primary)]"
                                      } ${
                                        !shouldShowExpanded && "justify-center"
                                      }`}
                                    >
                                      <div className="relative">
                                        <IconComponent
                                          className={`h-4 w-4 ${
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
                {shouldShowExpanded && (
                  <h3 className="px-4 text-xs font-bold text-[var(--elra-primary)] uppercase tracking-wider mb-3 bg-[var(--elra-secondary-3)] py-2 rounded-lg">
                    Pinned
                  </h3>
                )}
                {pinnedItems.map((itemLabel) => {
                  const item = sidebarConfig.find(
                    (nav) => nav.label === itemLabel
                  );
                  return item ? renderNavItem(item) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
