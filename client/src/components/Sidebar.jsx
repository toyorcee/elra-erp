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
import { getNavigationForRole, getRoleTitle } from "../config/sidebarConfig";
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
    const roleTitle = getRoleTitle(user?.role?.level || 10);
    return roleTitle;
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
      {/* Pin/Unpin Button - Moved to top and made white */}
      <div
        className={`absolute top-2 right-2 z-20 transition-all duration-200 ${
          isExpanded ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => setPinned((prev) => !prev)}
          className={`p-1.5 rounded-full transition-all duration-200 ${
            pinned
              ? "bg-green-500/20 text-green-400 rotate-45"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
          title={pinned ? "Unpin sidebar" : "Pin sidebar"}
        >
          <MdPushPin size={16} />
        </button>
      </div>

      {/* Navigation */}
      <div
        className={`flex-1 p-4 overflow-y-auto pt-12 transition-all duration-300 ${
          isExpanded ? "custom-scrollbar" : "scrollbar-hide"
        }`}
        style={{
          scrollbarWidth: isExpanded ? "thin" : "none",
          msOverflowStyle: isExpanded ? "auto" : "none",
        }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            margin: 4px 0;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%);
            border-radius: 10px;
            min-height: 40px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb 0%, #0891b2 100%);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
          }

          .custom-scrollbar::-webkit-scrollbar-corner {
            background: transparent;
          }
        `}</style>
        <nav className="space-y-2">
          {(() => {
            const navigationItems = getNavigationForRole(
              user?.role?.level || 10
            );

            return navigationItems;
          })().map((item) => {
            const Icon = HiIcons[item.icon] || HiIcons.HiOutlineDocumentText;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`group flex items-center p-3 rounded-xl transition-all duration-300 relative ${
                  isExpanded
                    ? isActive
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                      : "text-white/80 hover:bg-white/20 hover:text-white"
                    : isActive
                    ? "text-cyan-400"
                    : "text-white/80 hover:text-white"
                }`}
                title={!isExpanded ? item.label : ""}
              >
                <div
                  className={`flex items-center transition-all duration-300 ${
                    isExpanded ? "space-x-3 w-full" : "justify-center w-full"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
                      isExpanded
                        ? isActive
                          ? "bg-white/20"
                          : "bg-white/10 group-hover:bg-white/20"
                        : "bg-transparent"
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  {isExpanded && (
                    <span
                      className={`font-medium transition-all duration-300 ${
                        isActive ? "text-white" : "text-white/90"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="relative p-4 border-t border-blue-700/50">
        {isExpanded ? (
          // Expanded Profile View
          <div className="space-y-3">
            {/* Profile Button */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/20 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={getImageUrl(user.avatar)}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      user?.avatar ? "hidden" : ""
                    }`}
                  >
                    {getUserInitial()}
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">
                    {user?.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : "User"}
                  </div>
                  <div className="text-xs text-white/80">{getUserRole()}</div>
                </div>
              </div>

              <div
                className={`w-4 h-4 transition-transform duration-300 ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="w-4 h-4 text-white/90"
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
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 py-3">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={getImageUrl(user.avatar)}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          user?.avatar ? "hidden" : ""
                        }`}
                      >
                        {getUserInitial()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm truncate">
                        {user?.firstName
                          ? `${user.firstName} ${user.lastName}`
                          : "User"}
                      </div>
                      <div className="text-xs font-medium text-blue-600">
                        {getUserRole()}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user?.email || "user@edms.com"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/dashboard/notifications");
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                      <MdNotifications className="w-3 h-3 text-blue-600" />
                    </div>
                    <span>Notifications</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/dashboard/settings");
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                      <MdSettings className="w-3 h-3 text-blue-600" />
                    </div>
                    <span>Settings</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2 mx-4"></div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                  >
                    <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors duration-200">
                      <MdLogout className="w-3 h-3 text-red-600" />
                    </div>
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Collapsed Profile View (Icon Only) - Improved styling
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden">
              {user?.avatar ? (
                <img
                  src={getImageUrl(user.avatar)}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full flex items-center justify-center ${
                  user?.avatar ? "hidden" : ""
                }`}
              >
                {getUserInitial()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </aside>
  );
};

export default Sidebar;
