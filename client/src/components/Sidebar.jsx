import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as HiIcons from "react-icons/hi";
import {
  MdLogout,
  MdSettings,
  MdPerson,
  MdNotifications,
  MdPushPin,
} from "react-icons/md";
import {
  getNavigationForRole,
  getRoleInfo,
  getNavigationBySection,
  hasSectionAccess,
} from "../config/sidebarConfig";
import { useAuth } from "../context/AuthContext";

const getImageUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;

  const baseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace("/api", "");
  return `${baseUrl}${avatarPath}`;
};

function hasAccess(user, required) {
  if (!user) return false;
  if (!required) return true;
  if (required.minLevel && user.role?.level < required.minLevel) return false;
  if (required.permission && !user.permissions?.includes(required.permission))
    return false;
  return true;
}

const Sidebar = ({ onExpandedChange, onPinnedChange }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);

  const isExpanded = pinned ? true : expanded;

  // Notify parent of state changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(expanded);
    }
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    if (onPinnedChange) {
      onPinnedChange(pinned);
    }
  }, [pinned, onPinnedChange]);

  const handleMouseEnter = () => {
    if (!pinned) setExpanded(true);
  };

  const handleMouseLeave = () => {
    if (!pinned) setExpanded(false);
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate("/login");
  };

  const getUserInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.name) return user.name[0].toUpperCase();
    return "U";
  };

  const getUserRole = () => {
    const roleInfo = getRoleInfo(user?.role?.level || 10);
    return roleInfo.title;
  };

  const getRoleStyling = () => {
    const roleInfo = getRoleInfo(user?.role?.level || 10);
    return {
      color: roleInfo.color,
      bgColor: roleInfo.bgColor,
      borderColor: roleInfo.borderColor,
    };
  };

  // Get navigation items for user's role
  const navigationItems = getNavigationForRole(user?.role?.level || 10);

  // Group navigation items by section
  const sections = {
    main: getNavigationBySection(user?.role?.level || 10, "main"),
    erp: getNavigationBySection(user?.role?.level || 10, "erp"),
    system: getNavigationBySection(user?.role?.level || 10, "system"),
    documents: getNavigationBySection(user?.role?.level || 10, "documents"),
    communication: getNavigationBySection(
      user?.role?.level || 10,
      "communication"
    ),
    reports: getNavigationBySection(user?.role?.level || 10, "reports"),
  };

  const roleStyling = getRoleStyling();

  const renderNavItem = (item) => {
    const IconComponent = HiIcons[item.icon];
    const isActive = location.pathname === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          isActive
            ? "bg-blue-700 text-white shadow-lg"
            : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
        }`}
      >
        <IconComponent className="mr-3 h-5 w-5 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
        {item.badge && (
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderSection = (sectionKey, sectionTitle, items) => {
    if (!items || items.length === 0) return null;
    if (!hasSectionAccess(user?.role?.level || 10, sectionKey)) return null;

    return (
      <div key={sectionKey} className="mb-6">
        {isExpanded && (
          <h3 className="px-3 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
            {sectionTitle}
          </h3>
        )}
        <div className="space-y-1">{items.map(renderNavItem)}</div>
      </div>
    );
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`h-[calc(100vh-4rem)] bg-blue-900/95 backdrop-blur-xl border-r border-blue-700/50 flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
      }`}
      style={{
        minWidth: isExpanded ? 256 : 64,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Pin/Unpin Button */}
      <div
        className={`absolute top-2 right-2 z-20 transition-all duration-200 ${
          isExpanded ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => setPinned(!pinned)}
          className="p-1 rounded-md text-blue-300 hover:text-white hover:bg-blue-700/50 transition-colors"
        >
          <MdPushPin
            className={`h-4 w-4 transition-transform ${
              pinned ? "rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* User Profile Section */}
      <div className="flex-shrink-0 p-4 border-b border-blue-700/50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {getUserInitial()}
            </div>
          </div>
          {isExpanded && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${roleStyling.bgColor} ${roleStyling.color} ${roleStyling.borderColor} border`}
                >
                  {getUserRole()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {renderSection("main", "Main", sections.main)}
        {renderSection("erp", "ERP Modules", sections.erp)}
        {renderSection("system", "System", sections.system)}
        {renderSection("documents", "Documents", sections.documents)}
        {renderSection(
          "communication",
          "Communication",
          sections.communication
        )}
        {renderSection("reports", "Reports & Analytics", sections.reports)}
      </nav>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 p-4 border-t border-blue-700/50">
        <div className="space-y-2">
          <Link
            to="/notifications"
            className="group flex items-center px-3 py-2 text-sm font-medium text-blue-100 rounded-md hover:bg-blue-700/50 hover:text-white transition-colors"
          >
            <MdNotifications className="mr-3 h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="truncate">Notifications</span>}
          </Link>

          <Link
            to="/settings"
            className="group flex items-center px-3 py-2 text-sm font-medium text-blue-100 rounded-md hover:bg-blue-700/50 hover:text-white transition-colors"
          >
            <MdSettings className="mr-3 h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="truncate">Settings</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="group w-full flex items-center px-3 py-2 text-sm font-medium text-blue-100 rounded-md hover:bg-red-600/50 hover:text-white transition-colors"
          >
            <MdLogout className="mr-3 h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="truncate">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
