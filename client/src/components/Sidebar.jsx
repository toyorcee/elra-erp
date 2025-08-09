import React, { useState } from "react";
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

  // Custom scrollbar styles
  const scrollbarStyles = `
    .sidebar-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .sidebar-scroll::-webkit-scrollbar-track {
      background: rgba(59, 130, 246, 0.05);
      border-radius: 2px;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.3);
      border-radius: 2px;
      min-height: 30px;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(59, 130, 246, 0.5);
    }
    .sidebar-scroll::-webkit-scrollbar-thumb:active {
      background: rgba(59, 130, 246, 0.6);
    }
  `;

  // Dynamic sidebar context
  const {
    currentModule,
    moduleSidebarItems,
    isModuleView,
    getCurrentModuleInfo,
    returnToMainDashboard,
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
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

    return (
      <div key={item.path} className="relative">
        <Link
          to={item.path}
          className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
            isItemActive
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700"
          } ${!shouldShowExpanded && "justify-center"}`}
        >
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
              {isPinned && <MapPinIcon className="h-4 w-4 text-blue-600" />}
            </>
          )}
        </Link>
        {shouldShowExpanded && (
          <button
            onClick={() => togglePin(item.label)}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-all duration-200 ${
              isPinned
                ? "text-blue-600 bg-blue-100"
                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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

    return (
      <div key={sectionKey} className="mb-6">
        {shouldShowExpanded && (
          <h3 className="px-4 text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 bg-gradient-to-r from-blue-50 to-blue-100 py-2 rounded-lg">
            {sectionTitle}
          </h3>
        )}
        <div className="space-y-2">{items.map(renderNavItem)}</div>
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
        className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-blue-200/50 z-50 transition-all duration-500 ease-out ${
          shouldShowExpanded ? "w-72" : "w-20"
        } ${
          isMobile
            ? isOpen
              ? "transform translate-x-0"
              : "-translate-x-full"
            : ""
        } ${
          !isOpen && !isMobile ? "lg:translate-x-0" : ""
        } shadow-2xl shadow-blue-500/10 overflow-hidden`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-white">
          {/* Section Title when expanded or hovered */}
          {shouldShowExpanded && (
            <div className="flex items-center">
              {isModuleView && currentModule ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={returnToMainDashboard}
                    className="p-1 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
                    title="Back to main dashboard"
                  >
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-blue-600 text-lg">
                    {getCurrentModuleInfo()?.label || currentModule || "Module"}
                  </span>
                </div>
              ) : (
                <span className="font-bold text-blue-600 text-lg">
                  Navigation
                </span>
              )}
            </div>
          )}

          {/* Only show hamburger on mobile */}
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 lg:hidden"
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
            className="hidden lg:block p-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110"
          >
            {shouldShowExpanded ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-blue-200/50 bg-gradient-to-r from-blue-50/30 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {user?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
                </span>
              </div>
              {shouldShowExpanded && (
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
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
                    ? "text-blue-600 bg-blue-100"
                    : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
          className="flex-1 px-4 py-6 space-y-1 overflow-y-auto sidebar-scroll"
          style={{
            maxHeight: "calc(100vh - 200px)",
            overflowY: shouldShowExpanded ? "auto" : "hidden",
          }}
        >
          {/* Render module-specific navigation when in module view */}
          {isModuleView && currentModule ? (
            <div className="space-y-6">
              {moduleSidebarItems.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-6">
                  {shouldShowExpanded && (
                    <h3 className="px-4 text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 bg-gradient-to-r from-blue-50 to-blue-100 py-2 rounded-lg">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => {
                      const IconComponent = getIconComponent(item.icon);
                      const isItemActive = isActive(item.path);

                      return (
                        <div key={itemIndex} className="relative">
                          <Link
                            to={item.path}
                            className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                              isItemActive
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                                : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700"
                            } ${!shouldShowExpanded && "justify-center"}`}
                          >
                            <div className="relative">
                              <IconComponent
                                className={`h-5 w-5 ${
                                  !shouldShowExpanded && "mx-auto"
                                } transition-transform duration-200 group-hover:scale-110`}
                              />
                            </div>
                            {shouldShowExpanded && (
                              <span className="ml-3 flex-1">{item.label}</span>
                            )}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Render main dashboard navigation */}
              {renderSection("main", "Main", sections.main)}
              {renderSection("erp", "ERP Modules", sections.erp)}
              {renderSection("system", "System", sections.system)}
              {renderSection("documents", "Documents", sections.documents)}
              {renderSection(
                "communication",
                "Communication",
                sections.communication
              )}
              {renderSection(
                "reports",
                "Reports & Analytics",
                sections.reports
              )}
            </>
          )}

          {/* Pinned Items */}
          {pinnedItems.length > 0 && (
            <div className="mb-6">
              {shouldShowExpanded && (
                <h3 className="px-4 text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 bg-gradient-to-r from-blue-50 to-blue-100 py-2 rounded-lg">
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

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-blue-200/50 bg-gradient-to-r from-white to-blue-50/30">
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard/settings")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-200 hover:scale-105 ${
                !shouldShowExpanded && "justify-center"
              }`}
            >
              <Cog6ToothIcon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {shouldShowExpanded && <span className="ml-3">Settings</span>}
            </button>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 transition-all duration-200 hover:scale-105 ${
                !shouldShowExpanded && "justify-center"
              }`}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {shouldShowExpanded && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
