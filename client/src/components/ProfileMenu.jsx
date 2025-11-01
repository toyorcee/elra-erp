import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { MdLogout, MdSettings, MdNotifications, MdEdit } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import LogoutConfirmationModal from "./common/LogoutConfirmationModal";
import defaultAvatar from "../assets/defaulticon.jpg";

const getImageUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;

  const baseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace("/api", "");
  return `${baseUrl}${avatarPath}`;
};

const getDefaultAvatar = () => {
  return defaultAvatar;
};

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const { profileData } = useProfile();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const currentUser = profileData || user;

  useEffect(() => {
    if (user?._id) {
      setRefreshKey((prev) => prev + 1);
      if (window.location.reload) {
        setIsOpen(false);
      }
    }
  }, [user?._id]);

  useEffect(() => {
    setIsOpen(false);
  }, [user]);

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    await logout();
    navigate("/login");
  };

  const getUserInitial = () => {
    if (currentUser?.firstName) return currentUser.firstName[0].toUpperCase();
    if (currentUser?.name) return currentUser.name[0].toUpperCase();
    return "U";
  };

  const getRoleTitle = () => {
    if (!currentUser?.role) return "User";

    const roleLevel = currentUser.role.level;
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

  const navigateToProfile = () => {
    setIsOpen(false);
    navigate("/dashboard/profile");
  };

  return (
    <div className="relative" key={refreshKey}>
      {/* Desktop Profile Section */}
      <div className="hidden lg:flex items-center space-x-3">
        {/* User Info */}
        <div
          onClick={navigateToProfile}
          className="flex items-center space-x-3 bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] rounded-xl px-3 py-2 border border-white/20 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl backdrop-blur-sm"
          title="Go to your profile"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg bg-white/20 backdrop-blur-sm overflow-hidden border border-white/30">
            <img
              src={
                currentUser?.avatar
                  ? getImageUrl(currentUser.avatar)
                  : getDefaultAvatar()
              }
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.target.src = getDefaultAvatar();
              }}
            />
          </div>
          <div className="text-white">
            <div className="text-sm font-medium">
              {currentUser?.firstName
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : "User"}
            </div>
            <div className="text-xs text-white/80">{getRoleTitle()}</div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogoutClick}
          className="p-2 sm:p-2.5 rounded-lg bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white transition-all duration-200 group shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20 touch-target"
          title="Sign out"
          aria-label="Sign out"
        >
          <MdLogout
            size={20}
            className="group-hover:scale-110 transition-transform duration-200"
          />
        </button>

        {/* Dropdown Toggle for Additional Options */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 sm:p-2.5 rounded-lg bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white transition-all duration-300 group shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20 touch-target"
          aria-label="Profile menu"
          aria-expanded={isOpen}
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
        className="lg:hidden flex items-center space-x-2 p-2 rounded-lg bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white transition-all duration-300 group shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20 touch-target"
        aria-label="Profile menu"
        aria-expanded={isOpen}
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
        <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-72 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-[9999]">
          {/* User Info Header */}
          <div
            onClick={navigateToProfile}
            className="px-6 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            title="Go to your profile"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden border-2 border-white/30">
                  <img
                    src={
                      currentUser?.avatar
                        ? getImageUrl(currentUser.avatar)
                        : getDefaultAvatar()
                    }
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.src = getDefaultAvatar();
                    }}
                  />
                </div>
                <button
                  onClick={navigateToSettings}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-200 cursor-pointer border-2 border-white"
                  title="Edit Profile"
                >
                  <MdEdit className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-lg truncate">
                  {currentUser?.firstName
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : "User"}
                </div>
                <div className="text-sm font-medium text-[var(--elra-primary)]">
                  {getRoleTitle()}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {currentUser?.email || "user@edms.com"}
                </div>
                {currentUser?.employeeId && (
                  <div className="text-xs text-gray-400 truncate">
                    ID: {currentUser.employeeId}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={navigateToProfile}
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-[var(--elra-text-primary)] hover:bg-[var(--elra-secondary-3)] hover:text-[var(--elra-primary)] transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-[var(--elra-secondary-3)] rounded-lg flex items-center justify-center mr-3 group-hover:bg-[var(--elra-secondary-2)] transition-colors duration-200">
                <MdEdit className="w-4 h-4 text-[var(--elra-primary)]" />
              </div>
              <span>My Profile</span>
            </button>

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
