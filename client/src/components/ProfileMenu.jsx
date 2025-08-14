import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { MdLogout, MdSettings, MdNotifications } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import LogoutConfirmationModal from "./common/LogoutConfirmationModal";

const getImageUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;

  const baseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace("/api", "");
  return `${baseUrl}${avatarPath}`;
};

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    await logout();
    navigate("/login");
  };

  const getUserInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.name) return user.name[0].toUpperCase();
    return "U";
  };

  const getRoleTitle = () => {
    if (!user?.role) return "User";

    const roleLevel = user.role.level;
    if (roleLevel >= 1000) return "Super Administrator";
    if (roleLevel >= 700) return "Head of Department";
    if (roleLevel >= 600) return "Manager";
    if (roleLevel >= 300) return "Staff";

    return "User";
  };

  const navigateToSettings = () => {
    setIsOpen(false);
    navigate("/dashboard/settings");
  };

  const navigateToNotifications = () => {
    setIsOpen(false);
    navigate("/dashboard/notifications");
  };

  return (
    <div className="relative">
      {/* Desktop Profile Section */}
      <div className="hidden lg:flex items-center space-x-3">
        {/* User Info */}
        <div className="flex items-center space-x-3 bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] rounded-xl px-3 py-2 border border-white/20 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg bg-white/20 backdrop-blur-sm overflow-hidden border border-white/30">
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
          <div className="text-white">
            <div className="text-sm font-medium">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : "User"}
            </div>
            <div className="text-xs text-white/80">{getRoleTitle()}</div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogoutClick}
          className="p-2 rounded-lg bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white transition-all duration-200 group shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
          title="Sign out"
        >
          <MdLogout
            size={20}
            className="group-hover:scale-110 transition-transform duration-200"
          />
        </button>

        {/* Dropdown Toggle for Additional Options */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white transition-all duration-300 group shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
        >
          <div
            className={`w-4 h-4 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <svg
              className="w-4 h-4"
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
      </div>

      {/* Mobile Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center space-x-2 p-2 rounded-lg bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white transition-all duration-300 group shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
      >
        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg lg:hidden overflow-hidden border border-white/30">
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
        <span className="hidden md:block font-medium text-white">
          {user?.firstName ? `${user.firstName} ${user.lastName}` : "User"}
        </span>
        <div
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <svg
            className="w-4 h-4"
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
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-[9999]">
          {/* User Info Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden border-2 border-white/30">
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
                <div className="font-bold text-gray-900 text-lg truncate">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : "User"}
                </div>
                <div className="text-sm font-medium text-[var(--elra-primary)]">
                  {getRoleTitle()}
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
              onClick={navigateToNotifications}
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-[var(--elra-text-primary)] hover:bg-[var(--elra-secondary-3)] hover:text-[var(--elra-primary)] transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-[var(--elra-secondary-3)] rounded-lg flex items-center justify-center mr-3 group-hover:bg-[var(--elra-secondary-2)] transition-colors duration-200">
                <MdNotifications className="w-4 h-4 text-[var(--elra-primary)]" />
              </div>
              <span>Notifications</span>
            </button>

            <button
              onClick={navigateToSettings}
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-[var(--elra-text-primary)] hover:bg-[var(--elra-secondary-3)] hover:text-[var(--elra-primary)] transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-[var(--elra-secondary-3)] rounded-lg flex items-center justify-center mr-3 group-hover:bg-[var(--elra-secondary-2)] transition-colors duration-200">
                <MdSettings className="w-4 h-4 text-[var(--elra-primary)]" />
              </div>
              <span>Settings</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 my-2 mx-6"></div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors duration-200">
                <MdLogout className="w-4 h-4 text-red-600" />
              </div>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal &&
        createPortal(
          <LogoutConfirmationModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={handleLogoutConfirm}
            user={user}
          />,
          document.body
        )}
    </div>
  );
};

export default ProfileMenu;
