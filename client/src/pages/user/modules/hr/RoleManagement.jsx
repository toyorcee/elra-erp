import React, { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { userModulesAPI } from "../../../../services/userModules.js";

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    level: 100,
    permissions: [],
    status: "ACTIVE",
  });

  // Available permissions
  const availablePermissions = [
    {
      value: "user.manage",
      label: "Manage Users",
      category: "User Management",
    },
    { value: "user.view", label: "View Users", category: "User Management" },
    {
      value: "department.manage",
      label: "Manage Departments",
      category: "Department Management",
    },
    {
      value: "department.view",
      label: "View Departments",
      category: "Department Management",
    },
    {
      value: "role.manage",
      label: "Manage Roles",
      category: "Role Management",
    },
    { value: "role.view", label: "View Roles", category: "Role Management" },
    {
      value: "invitation.manage",
      label: "Manage Invitations",
      category: "Invitation Management",
    },
    {
      value: "invitation.view",
      label: "View Invitations",
      category: "Invitation Management",
    },
    {
      value: "payroll.manage",
      label: "Manage Payroll",
      category: "Payroll Management",
    },
    {
      value: "payroll.view",
      label: "View Payroll",
      category: "Payroll Management",
    },
    {
      value: "document.manage",
      label: "Manage Documents",
      category: "Document Management",
    },
    {
      value: "document.view",
      label: "View Documents",
      category: "Document Management",
    },
    { value: "report.view", label: "View Reports", category: "Reporting" },
    {
      value: "report.generate",
      label: "Generate Reports",
      category: "Reporting",
    },
    {
      value: "system.settings",
      label: "System Settings",
      category: "System Administration",
    },
    {
      value: "audit.view",
      label: "View Audit Logs",
      category: "System Administration",
    },
  ];

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.roles.getAllRoles();
      console.log("Roles response:", response);
      setRoles(response.data || []);
    } catch (error) {
      console.error("Error loading roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePermissionChange = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await userModulesAPI.roles.updateRole(editingRole.id, formData);
      } else {
        await userModulesAPI.roles.createRole(formData);
      }
      setShowModal(false);
      setEditingRole(null);
      setFormData({
        name: "",
        description: "",
        level: 100,
        permissions: [],
        status: "ACTIVE",
      });
      loadRoles();
    } catch (error) {
      console.error("Error saving role:", error);
      alert(error.response?.data?.message || "Error saving role");
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      level: role.level,
      permissions: role.permissions || [],
      status: role.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (roleId) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await userModulesAPI.roles.deleteRole(roleId);
        loadRoles();
      } catch (error) {
        console.error("Error deleting role:", error);
        alert(error.response?.data?.message || "Error deleting role");
      }
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      level: 100,
      permissions: [],
      status: "ACTIVE",
    });
    setShowModal(true);
  };

  const getPermissionCategory = (permission) => {
    return (
      availablePermissions.find((p) => p.value === permission)?.category ||
      "Other"
    );
  };

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--elra-bg-light)] p-6">
      <div className="max-w-7xl mx-auto">
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
                  Manage user roles and their permissions
                </p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Role</span>
            </button>
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
                key={role._id}
                className="bg-white rounded-xl shadow-lg border border-[var(--elra-border-primary)] overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-[var(--elra-bg-secondary)] rounded-lg">
                        <ShieldCheckIcon className="h-5 w-5 text-[var(--elra-primary)]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--elra-text-primary)]">
                          {role.name}
                        </h3>
                        <p className="text-sm text-[var(--elra-text-secondary)]">
                          Level: {role.level}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(role)}
                        className="p-1 text-[var(--elra-text-secondary)] hover:text-[var(--elra-primary)] rounded"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role._id)}
                        className="p-1 text-[var(--elra-text-secondary)] hover:text-red-500 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
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
                      {role.status}
                    </span>
                  </div>

                  {/* Permissions Preview */}
                  <div className="border-t border-[var(--elra-border-primary)] pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <KeyIcon className="h-4 w-4 text-[var(--elra-text-secondary)]" />
                      <span className="text-sm font-medium text-[var(--elra-text-primary)]">
                        Permissions ({role.permissions?.length || 0})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions?.slice(0, 3).map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-[var(--elra-bg-secondary)] text-xs text-[var(--elra-text-secondary)] rounded"
                        >
                          {permission}
                        </span>
                      ))}
                      {role.permissions?.length > 3 && (
                        <span className="px-2 py-1 bg-[var(--elra-bg-secondary)] text-xs text-[var(--elra-text-secondary)] rounded">
                          +{role.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && roles.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-[var(--elra-border-primary)] text-center">
            <ShieldCheckIcon className="h-12 w-12 text-[var(--elra-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--elra-text-primary)] mb-2">
              No roles found
            </h3>
            <p className="text-[var(--elra-text-secondary)] mb-6">
              Get started by creating your first role
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2 mx-auto"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Role</span>
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[var(--elra-text-primary)]">
                    {editingRole ? "Edit Role" : "Create Role"}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)] rounded"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                        Role Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                        placeholder="e.g., HR Manager"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                        Role Level *
                      </label>
                      <input
                        type="number"
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="1000"
                        className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] resize-none"
                      placeholder="Brief description of the role..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-4">
                      Permissions
                    </label>
                    <div className="max-h-64 overflow-y-auto border border-[var(--elra-border-primary)] rounded-lg p-4">
                      {Object.entries(groupedPermissions).map(
                        ([category, permissions]) => (
                          <div key={category} className="mb-4">
                            <h4 className="text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                              {category}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {permissions.map((permission) => (
                                <label
                                  key={permission.value}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(
                                      permission.value
                                    )}
                                    onChange={() =>
                                      handlePermissionChange(permission.value)
                                    }
                                    className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-border-focus)] border-[var(--elra-border-primary)] rounded"
                                  />
                                  <span className="text-sm text-[var(--elra-text-secondary)]">
                                    {permission.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>{editingRole ? "Update" : "Create"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
