import React, { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { userModulesAPI } from "../../services/userModules.js";

const UserMultiSelect = ({
  value = [],
  onChange,
  placeholder = "Search for users...",
  disabled = false,
  required = false,
  label = "Select Users",
  minRoleLevel = 300,
  excludeUsers = [],
  className = "",
  currentUser = null,
  maxSelections = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const dropdownRef = useRef(null);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search term, role level, and exclusions
  useEffect(() => {
    if (!users.length) return;

    const filtered = users.filter((user) => {
      // Check if user should be excluded
      if (excludeUsers.includes(user._id)) return false;
      if (value.includes(user._id)) return false; // Exclude already selected users

      // Check role level
      if (!user.role || user.role.level < minRoleLevel) return false;

      // For Super Admin, show all users (no department restriction)
      // For HOD, restrict to their department only
      if (
        currentUser &&
        currentUser.role.level === 700 &&
        currentUser.department
      ) {
        // HOD can only see users in their department
        if (
          !user.department ||
          user.department._id !== currentUser.department._id
        ) {
          return false;
        }
      }

      // Check if user matches search term
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.firstName || ""} ${
        user.lastName || ""
      }`.toLowerCase();
      const email = (user.email || "").toLowerCase();
      const department = (user.department?.name || "").toLowerCase();

      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        department.includes(searchLower)
      );
    });

    setFilteredUsers(filtered.slice(0, 10)); // Limit to 10 results
  }, [users, searchTerm, minRoleLevel, excludeUsers, currentUser, value]);

  // Set selected users when value changes
  useEffect(() => {
    if (value && value.length && users.length) {
      const selected = users.filter((u) => value.includes(u._id));
      setSelectedUsers(selected);
    } else {
      setSelectedUsers([]);
    }
  }, [value, users]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userModulesAPI.users.getAllUsers();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    if (maxSelections && value.length >= maxSelections) {
      return; // Don't allow more selections
    }

    const newValue = [...value, user._id];
    onChange(newValue);
    setSearchTerm("");
  };

  const handleRemoveUser = (userId) => {
    const newValue = value.filter((id) => id !== userId);
    onChange(newValue);
  };

  const handleClearAll = () => {
    onChange([]);
    setSearchTerm("");
  };

  const getDefaultAvatar = (user = null) => {
    if (user && user.firstName && user.lastName) {
      const firstName = user.firstName.charAt(0).toUpperCase();
      const lastName = user.lastName.charAt(0).toUpperCase();
      return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff&size=32&rounded=true`;
    }
    return "https://ui-avatars.com/api/?name=Unknown+User&background=random&color=fff&size=32&rounded=true";
  };

  const getImageUrl = (avatarPath, user = null) => {
    if (!avatarPath) return getDefaultAvatar(user);

    let path = avatarPath;
    if (typeof avatarPath === "object" && avatarPath.url) {
      path = avatarPath.url;
    }

    if (path.startsWith("http")) return path;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");

    return `${baseUrl}${path}`;
  };

  const getUserAvatar = (user) => {
    if (!user) return getDefaultAvatar();

    if (user.avatar && user.avatar !== "") {
      return getImageUrl(user.avatar, user);
    }

    return getDefaultAvatar(user);
  };

  const getRoleLabel = (role) => {
    if (!role) return "No Role";

    const roleLabels = {
      1000: "Super Admin",
      700: "HOD",
      600: "Manager",
      500: "Supervisor",
      400: "Senior Staff",
      300: "Staff",
      200: "Junior Staff",
      100: "Viewer",
      50: "Guest",
    };

    return roleLabels[role.level] || role.name || "Unknown";
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
          {maxSelections && (
            <span className="text-sm text-gray-500 ml-2">
              ({value.length}/{maxSelections} selected)
            </span>
          )}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Selected Users Display */}
        {selectedUsers.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <img
                  src={getUserAvatar(user)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-5 h-5 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = getDefaultAvatar(user);
                  }}
                />
                <span>
                  {user.firstName} {user.lastName}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user._id)}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={disabled}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedUsers.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded border border-gray-300"
                disabled={disabled}
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={
              maxSelections && value.length >= maxSelections
                ? `Maximum ${maxSelections} users selected`
                : placeholder
            }
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            disabled={
              disabled || (maxSelections && value.length >= maxSelections)
            }
          />
        </div>

        {/* Dropdown */}
        {isOpen && !(maxSelections && value.length >= maxSelections) && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
                <p className="mt-2">Loading users...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div>
                {filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={getUserAvatar(user)}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = getDefaultAvatar(user);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.department?.name || "No Department"} •{" "}
                          {getRoleLabel(user.role)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="p-4 text-center text-gray-500">
                No users found matching "{searchTerm}"
                {currentUser && currentUser.role.level === 700 && (
                  <div className="text-xs mt-1">
                    Showing only users from your department
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Start typing to search for users
                {currentUser && currentUser.role.level === 700 && (
                  <div className="text-xs mt-1">
                    Showing only users from your department
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMultiSelect;
