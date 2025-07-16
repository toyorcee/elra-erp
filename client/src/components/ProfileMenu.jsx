import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAccountCircle,
  MdLogout,
  MdSettings,
  MdPerson,
  MdNotifications,
} from "react-icons/md";
import { useAuth } from "../context/AuthContext";

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/login");
  };

  const getUserInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.name) return user.name[0].toUpperCase();
    return "U";
  };

  const getUserRole = () => {
    if (user?.role?.level >= 100) return "Super Administrator";
    if (user?.role?.level >= 90) return "Administrator";
    return "User";
  };

  return (
    <div className="relative">
      {/* Desktop Profile Section */}
      <div className="hidden lg:flex items-center space-x-3">
        {/* User Info */}
        <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {getUserInitial()}
          </div>
          <div className="text-gray-700">
            <div className="text-sm font-medium">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : "User"}
            </div>
            <div className="text-xs text-gray-500">{getUserRole()}</div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 group"
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
          className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 group"
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
        className="lg:hidden flex items-center space-x-2 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 group"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {getUserInitial()}
        </div>
        <span className="hidden md:block font-medium">
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
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {getUserInitial()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-lg truncate">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : "User"}
                </div>
                <div className="text-sm font-medium text-blue-600">
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
                setIsOpen(false);
                navigate("/dashboard/profile");
              }}
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                <MdPerson className="w-4 h-4 text-blue-600" />
              </div>
              <span>My Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/dashboard/notifications");
              }}
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                <MdNotifications className="w-4 h-4 text-blue-600" />
              </div>
              <span>Notifications</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/dashboard/settings");
              }}
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                <MdSettings className="w-4 h-4 text-blue-600" />
              </div>
              <span>Settings</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 my-2 mx-6"></div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
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
    </div>
  );
};

export default ProfileMenu;
