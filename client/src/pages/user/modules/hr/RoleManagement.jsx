import React, { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  UsersIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { userModulesAPI } from "../../../../services/userModules.js";

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const systemPermissions = {
    HOD: {
      level: 700,
      permissions: ["view", "create", "edit", "delete", "approve"],
      description: "Head of Department - Full access to department modules",
    },
    MANAGER: {
      level: 600,
      permissions: ["view", "edit", "approve"],
      description: "Manager - Can manage and approve within modules",
    },
    STAFF: {
      level: 500,
      permissions: ["view"],
      description: "Staff - Basic access to modules",
    },
    VIEWER: {
      level: 400,
      permissions: ["view"],
      description: "Viewer - Read-only access to modules",
    },
    PROJECT_MANAGER: {
      level: 600,
      permissions: ["view", "create", "edit", "approve"],
      description: "Project Manager - Specialized project management role",
    },
    SUPER_ADMIN: {
      level: 1000,
      permissions: [
        "view",
        "create",
        "edit",
        "delete",
        "approve",
        "system_admin",
      ],
      description: "Super Administrator - Full system access",
    },
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.roles.getAllRoles();
      console.log("Roles response:", response);

      // Merge backend roles with system permissions for complete info
      const enhancedRoles = (response.data || []).map((role) => ({
        ...role,
        systemInfo: systemPermissions[role.name] || {
          level: role.level,
          permissions: role.permissions || [],
          description: role.description || "Custom role",
        },
      }));

      setRoles(enhancedRoles);
    } catch (error) {
      console.error("Error loading roles:", error);
      // Fallback to system permissions if API fails
      const fallbackRoles = Object.entries(systemPermissions).map(
        ([name, info]) => ({
          name,
          level: info.level,
          permissions: info.permissions,
          description: info.description,
          isActive: true,
          systemInfo: info,
        })
      );
      setRoles(fallbackRoles);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--elra-bg-light)] p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  Role Management
                </h1>
                <p className="text-[var(--elra-text-secondary)]">
                  View system roles and their permissions (Read-only)
                </p>
                <p className="text-xs text-[var(--elra-text-muted)] mt-1">
                  Roles are automatically assigned based on department and user
                  level
                </p>
                <p className="text-xs text-[var(--elra-primary)] mt-1 font-medium">
                  💡 Click any role card to view complete permissions
                </p>
                <p className="text-xs text-[var(--elra-text-muted)] mt-1">
                  Permissions shown are from backend system configuration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-[var(--elra-border-primary)]">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
              <span className="ml-3 text-[var(--elra-text-secondary)]">
                Loading roles...
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div
                key={role._id || role.name}
                className="bg-white rounded-xl shadow-lg border border-[var(--elra-border-primary)] overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                onClick={() => handleRoleClick(role)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-[var(--elra-bg-secondary)] rounded-lg">
                        <ShieldCheckIcon className="h-5 w-5 text-[var(--elra-primary)]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--elra-text-primary)]">
                          {role.name.replace(/_/g, " ")}
                        </h3>
                        <p className="text-sm text-[var(--elra-text-secondary)]">
                          Level: {role.level}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[var(--elra-text-secondary)] text-sm mb-4 line-clamp-2">
                    {role.description || "No description provided"}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-4 w-4 text-[var(--elra-text-secondary)]" />
                      <span className="text-sm text-[var(--elra-text-secondary)]">
                        {role.userCount || 0} users
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {role.status || "ACTIVE"}
                    </span>
                  </div>

                  {/* Permissions Preview */}
                  <div className="border-t border-[var(--elra-border-primary)] pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <KeyIcon className="h-4 w-4 text-[var(--elra-text-secondary)]" />
                      <span className="text-sm font-medium text-[var(--elra-text-primary)]">
                        System Permissions (
                        {role.systemInfo?.permissions?.length ||
                          role.permissions?.length ||
                          0}
                        )
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(role.systemInfo?.permissions || role.permissions || [])
                        .slice(0, 3)
                        .map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 bg-[var(--elra-bg-secondary)] text-xs text-[var(--elra-text-secondary)] rounded"
                          >
                            {permission}
                          </span>
                        ))}
                      {(role.systemInfo?.permissions || role.permissions || [])
                        .length > 3 && (
                        <span className="px-2 py-1 bg-[var(--elra-bg-secondary)] text-xs text-[var(--elra-text-secondary)] rounded">
                          +
                          {(
                            role.systemInfo?.permissions ||
                            role.permissions ||
                            []
                          ).length - 3}{" "}
                          more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && selectedRole && (
          <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedRole.name.replace(/_/g, " ")} - Role Details
                    </h2>
                    <p className="text-white text-opacity-90 mt-1">
                      Complete permissions and role information
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Role Info */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                        Role Name
                      </label>
                      <div className="p-3 bg-[var(--elra-bg-secondary)] rounded-lg">
                        <span className="text-lg font-semibold text-[var(--elra-text-primary)]">
                          {selectedRole.name.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                        Role Level
                      </label>
                      <div className="p-3 bg-[var(--elra-bg-secondary)] rounded-lg">
                        <span className="text-lg font-semibold text-[var(--elra-text-primary)]">
                          {selectedRole.level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Description
                    </label>
                    <div className="p-3 bg-[var(--elra-bg-secondary)] rounded-lg">
                      <span className="text-[var(--elra-text-secondary)]">
                        {selectedRole.description || "No description provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-3">
                    All Permissions (
                    {selectedRole.systemInfo?.permissions?.length ||
                      selectedRole.permissions?.length ||
                      0}
                    )
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(
                      selectedRole.systemInfo?.permissions ||
                      selectedRole.permissions ||
                      []
                    ).map((permission) => (
                      <div
                        key={permission}
                        className="p-3 bg-[var(--elra-bg-secondary)] rounded-lg border border-[var(--elra-border-primary)]"
                      >
                        <span className="text-sm font-medium text-[var(--elra-text-primary)] capitalize">
                          {permission}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Special Note for Project Management */}
                  {selectedRole.name === "PROJECT_MANAGER" && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Special Case:</strong> Project Management
                        department allows all roles (including STAFF and VIEWER)
                        to create projects, unlike other departments.
                      </p>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div className="flex justify-end mt-8 pt-6 border-t border-[var(--elra-border-primary)]">
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
