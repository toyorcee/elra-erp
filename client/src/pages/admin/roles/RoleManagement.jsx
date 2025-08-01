import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineKey,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
} from "react-icons/hi2";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../../services/roles";

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [showCapabilitiesModal, setShowCapabilitiesModal] = useState(false);
  const [viewingRole, setViewingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    level: 50,
    description: "",
    permissions: [],
    isActive: true,
  });

  useEffect(() => {
    fetchRoles();
  }, [searchTerm, statusFilter]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await getRoles({
        search: searchTerm,
        status: statusFilter,
        includeInactive: statusFilter === "all",
      });
      const rolesData =
        response.data?.roles || response.data?.docs || response.data || [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      toast.error("Failed to fetch roles");
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (formData.level < 10 || formData.level > 120) {
      toast.error("Role level must be between 10 and 120");
      return;
    }

    // Check for duplicate levels (case insensitive)
    const existingRole = roles.find(
      (r) => r.level === formData.level && r._id !== editingRole?._id
    );

    if (existingRole) {
      toast.error(`Role level "${formData.level}" already exists`);
      return;
    }

    try {
      setLoading(true);

      if (editingRole) {
        await updateRole(editingRole._id, formData);
        toast.success(`"${formData.name}" updated successfully`);
      } else {
        await createRole(formData);
        toast.success(`"${formData.name}" created successfully`);
      }

      setShowModal(false);
      setEditingRole(null);
      resetForm();
      fetchRoles();
    } catch (error) {
      console.error("Submit error:", error);
      const errorMessage = error.response?.data?.message || "Operation failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      level: role.level,
      description: role.description || "",
      permissions: role.permissions || [],
      isActive: role.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (roleId) => {
    const role = roles.find((r) => r._id === roleId);
    setDeletingRole(role);
    setShowDeleteModal(true);
  };

  const handleViewCapabilities = (role) => {
    setViewingRole(role);
    setShowCapabilitiesModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingRole) return;

    try {
      setLoading(true);
      await deleteRole(deletingRole._id);
      toast.success(`"${deletingRole.name}" deleted successfully`);
      fetchRoles();
      setShowDeleteModal(false);
      setDeletingRole(null);
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete role";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingRole(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: 50,
      description: "",
      permissions: [],
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setEditingRole(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    resetForm();
  };

  const togglePermission = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const filteredRoles = roles.filter((role) => {
    if (statusFilter === "active" && !role.isActive) return false;
    if (statusFilter === "inactive" && role.isActive) return false;
    return true;
  });

  const permissionCategories = {
    "Document Permissions": [
      "document.upload",
      "document.view",
      "document.edit",
      "document.delete",
      "document.approve",
      "document.reject",
      "document.share",
      "document.export",
      "document.archive",
    ],
    "User Management": [
      "user.create",
      "user.view",
      "user.edit",
      "user.delete",
      "user.assign_role",
      "user.view_permissions",
    ],
    "Workflow Permissions": [
      "workflow.create",
      "workflow.start",
      "workflow.approve",
      "workflow.reject",
      "workflow.delegate",
      "workflow.view",
    ],
    "System Permissions": [
      "system.settings",
      "system.reports",
      "system.audit",
      "system.backup",
    ],
  };

  const getRoleCapabilities = (role) => {
    if (!role || !role.permissions) return [];

    const capabilities = [];

    // Document capabilities
    if (role.permissions.includes("document.upload"))
      capabilities.push({
        type: "document",
        action: "Upload documents",
        icon: "📤",
        color: "text-green-600",
      });
    if (role.permissions.includes("document.view"))
      capabilities.push({
        type: "document",
        action: "View documents",
        icon: "👁️",
        color: "text-blue-600",
      });
    if (role.permissions.includes("document.edit"))
      capabilities.push({
        type: "document",
        action: "Edit documents",
        icon: "✏️",
        color: "text-yellow-600",
      });
    if (role.permissions.includes("document.delete"))
      capabilities.push({
        type: "document",
        action: "Delete documents",
        icon: "🗑️",
        color: "text-red-600",
      });
    if (role.permissions.includes("document.approve"))
      capabilities.push({
        type: "document",
        action: "Approve documents",
        icon: "✅",
        color: "text-green-600",
      });
    if (role.permissions.includes("document.reject"))
      capabilities.push({
        type: "document",
        action: "Reject documents",
        icon: "❌",
        color: "text-red-600",
      });
    if (role.permissions.includes("document.share"))
      capabilities.push({
        type: "document",
        action: "Share documents",
        icon: "📤",
        color: "text-purple-600",
      });
    if (role.permissions.includes("document.export"))
      capabilities.push({
        type: "document",
        action: "Export documents",
        icon: "📥",
        color: "text-indigo-600",
      });
    if (role.permissions.includes("document.archive"))
      capabilities.push({
        type: "document",
        action: "Archive documents",
        icon: "📦",
        color: "text-gray-600",
      });

    // User management capabilities
    if (role.permissions.includes("user.create"))
      capabilities.push({
        type: "user",
        action: "Create users",
        icon: "👤➕",
        color: "text-green-600",
      });
    if (role.permissions.includes("user.view"))
      capabilities.push({
        type: "user",
        action: "View users",
        icon: "👥",
        color: "text-blue-600",
      });
    if (role.permissions.includes("user.edit"))
      capabilities.push({
        type: "user",
        action: "Edit users",
        icon: "✏️",
        color: "text-yellow-600",
      });
    if (role.permissions.includes("user.delete"))
      capabilities.push({
        type: "user",
        action: "Delete users",
        icon: "🗑️",
        color: "text-red-600",
      });
    if (role.permissions.includes("user.assign_role"))
      capabilities.push({
        type: "user",
        action: "Assign roles",
        icon: "🔑",
        color: "text-purple-600",
      });
    if (role.permissions.includes("user.view_permissions"))
      capabilities.push({
        type: "user",
        action: "View permissions",
        icon: "🔍",
        color: "text-indigo-600",
      });

    // Workflow capabilities
    if (role.permissions.includes("workflow.create"))
      capabilities.push({
        type: "workflow",
        action: "Create workflows",
        icon: "⚙️➕",
        color: "text-green-600",
      });
    if (role.permissions.includes("workflow.start"))
      capabilities.push({
        type: "workflow",
        action: "Start workflows",
        icon: "▶️",
        color: "text-blue-600",
      });
    if (role.permissions.includes("workflow.approve"))
      capabilities.push({
        type: "workflow",
        action: "Approve workflows",
        icon: "✅",
        color: "text-green-600",
      });
    if (role.permissions.includes("workflow.reject"))
      capabilities.push({
        type: "workflow",
        action: "Reject workflows",
        icon: "❌",
        color: "text-red-600",
      });
    if (role.permissions.includes("workflow.delegate"))
      capabilities.push({
        type: "workflow",
        action: "Delegate workflows",
        icon: "👥",
        color: "text-purple-600",
      });
    if (role.permissions.includes("workflow.view"))
      capabilities.push({
        type: "workflow",
        action: "View workflows",
        icon: "👁️",
        color: "text-blue-600",
      });

    // System capabilities
    if (role.permissions.includes("system.settings"))
      capabilities.push({
        type: "system",
        action: "System settings",
        icon: "⚙️",
        color: "text-gray-600",
      });
    if (role.permissions.includes("system.reports"))
      capabilities.push({
        type: "system",
        action: "View reports",
        icon: "📊",
        color: "text-indigo-600",
      });
    if (role.permissions.includes("system.audit"))
      capabilities.push({
        type: "system",
        action: "Audit logs",
        icon: "📋",
        color: "text-orange-600",
      });
    if (role.permissions.includes("system.backup"))
      capabilities.push({
        type: "system",
        action: "System backup",
        icon: "💾",
        color: "text-green-600",
      });

    return capabilities;
  };

  const getCapabilitySummary = (capabilities) => {
    const summary = {
      document: capabilities.filter((c) => c.type === "document").length,
      user: capabilities.filter((c) => c.type === "user").length,
      workflow: capabilities.filter((c) => c.type === "workflow").length,
      system: capabilities.filter((c) => c.type === "system").length,
    };
    return summary;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <HiOutlineKey className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Role Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage NAIC system roles and permissions
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Add Role</span>
          </button>
        </div>
      </div>

      {/* Approval Flow Information */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl border border-blue-200 p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <HiOutlineShieldCheck className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">
            📋 Role-Based Approval Permissions
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">
              🔄 Document Approval Flow:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>
                  Claims (Level 10) → <strong>STAFF/SENIOR_STAFF</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>
                  Underwriting (Level 15) → <strong>STAFF/SENIOR_STAFF</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>
                  Regional Ops (Level 20) →{" "}
                  <strong>SENIOR_STAFF/SUPERVISOR</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>
                  Compliance (Level 25) →{" "}
                  <strong>SENIOR_STAFF/SUPERVISOR</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <span>
                  Finance (Level 30) → <strong>SUPERVISOR</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold">
                  6
                </span>
                <span>
                  HR (Level 35) → <strong>SUPERVISOR</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold">
                  7
                </span>
                <span>
                  IT (Level 40) → <strong>SUPERVISOR/MANAGER</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">
                  8
                </span>
                <span className="font-semibold">
                  Executive (Level 50) → <strong>MANAGER/SUPER_ADMIN</strong>
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">
              👥 Role Level Permissions:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                <span className="font-medium">Level 10-15:</span> STAFF and
                SENIOR_STAFF can approve
              </div>
              <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                <span className="font-medium">Level 20-25:</span> SENIOR_STAFF
                and SUPERVISOR can approve
              </div>
              <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <span className="font-medium">Level 30-35:</span> SUPERVISOR can
                approve
              </div>
              <div className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                <span className="font-medium">Level 40:</span> SUPERVISOR and
                MANAGER can approve
              </div>
              <div className="p-2 bg-red-50 rounded border-l-4 border-red-400">
                <span className="font-medium">Level 50:</span> MANAGER and
                SUPER_ADMIN can approve
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> When assigning roles to users, ensure
            they have the appropriate level to approve documents at their
            assigned department. Each document must be approved at every level
            before proceeding to the next.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300 cursor-text"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <HiOutlineFunnel className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300 cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200/50 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200/50 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200/50 rounded-lg w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiOutlineKey className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            No roles found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first NAIC role"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span>Create Role</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRoles.map((role) => (
            <div
              key={role._id}
              className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1 group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <HiOutlineShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {role.name.replace(/_/g, " ")}
                      </h3>
                      <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded-lg">
                        Level {role.level}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                      role.isActive
                        ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                        : "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200"
                    }`}
                  >
                    {role.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {role.description && (
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2 bg-gray-50/50 p-3 rounded-xl">
                    {role.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 mb-6 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-3 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <HiOutlineUsers className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">
                      {role.userCount || 0} users
                    </span>
                  </div>
                  <span className="font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                    {role.permissions?.length || 0} permissions
                  </span>
                </div>

                {/* Capabilities Summary */}
                {(() => {
                  const capabilities = getRoleCapabilities(role);
                  const summary = getCapabilitySummary(capabilities);
                  return (
                    <div className="mb-6 bg-gradient-to-r from-green-50/50 to-blue-50/30 p-4 rounded-xl">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <HiOutlineShieldCheck className="w-4 h-4 mr-2 text-green-500" />
                        Role Capabilities
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {summary.document > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-gray-600">
                              Documents: {summary.document}
                            </span>
                          </div>
                        )}
                        {summary.user > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-gray-600">
                              Users: {summary.user}
                            </span>
                          </div>
                        )}
                        {summary.workflow > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            <span className="text-gray-600">
                              Workflows: {summary.workflow}
                            </span>
                          </div>
                        )}
                        {summary.system > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            <span className="text-gray-600">
                              System: {summary.system}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEdit(role)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleViewCapabilities(role)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer"
                  >
                    <HiOutlineEye className="w-4 h-4" />
                    <span>Capabilities</span>
                  </button>
                  <button
                    onClick={() => handleDelete(role._id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <HiOutlineKey className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {editingRole ? "Edit Role" : "Create Role"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300 cursor-text"
                      placeholder="e.g., CLAIMS_OFFICER"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role Level *
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="120"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300 cursor-text"
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300 cursor-text"
                    placeholder="Describe the role's responsibilities..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Permissions
                  </label>
                  <div className="bg-gray-50/50 rounded-xl p-6">
                    {Object.entries(permissionCategories).map(
                      ([category, permissions]) => (
                        <div key={category} className="mb-6">
                          <h4 className="font-medium text-gray-700 mb-3 text-lg">
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {permissions.map((permission) => (
                              <label
                                key={permission}
                                className="flex items-center p-3 bg-white/80 rounded-lg hover:bg-white transition-all duration-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(
                                    permission
                                  )}
                                  onChange={() => togglePermission(permission)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mr-3"
                                />
                                <span className="text-sm text-gray-700 font-mono">
                                  {permission}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {editingRole && (
                  <div className="bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-4 rounded-xl">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        Active Role
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100/80 backdrop-blur-sm rounded-xl hover:bg-gray-200/80 transition-all duration-300 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>
                          {editingRole ? "Updating..." : "Creating..."}
                        </span>
                      </div>
                    ) : (
                      <span>{editingRole ? "Update" : "Create"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full relative">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                  <HiOutlineTrash className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Delete Role
                </h2>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete{" "}
                  <strong>"{deletingRole.name}"</strong>?
                </p>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
                    <div className="text-sm text-red-700">
                      <p className="font-semibold mb-2">
                        This action cannot be undone!
                      </p>
                      <ul className="space-y-1">
                        <li>
                          • All users with this role will need to be reassigned
                        </li>
                        <li>• Role permissions and settings will be lost</li>
                        <li>• Workflow assignments may be affected</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Role Level:</strong> {deletingRole.level}
                  </p>
                  {deletingRole.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Description:</strong> {deletingRole.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={loading}
                  className="px-6 py-3 text-gray-700 bg-gray-100/80 backdrop-blur-sm rounded-xl hover:bg-gray-200/80 transition-all duration-300 font-medium disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    <span>Delete Role</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities Modal */}
      {showCapabilitiesModal && viewingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                    <HiOutlineShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {viewingRole.name.replace(/_/g, " ")} Capabilities
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Level {viewingRole.level} •{" "}
                      {viewingRole.permissions?.length || 0} permissions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCapabilitiesModal(false);
                    setViewingRole(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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

              {viewingRole.description && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-800 text-sm">
                    <strong>Description:</strong> {viewingRole.description}
                  </p>
                </div>
              )}

              {/* Capabilities Breakdown */}
              {(() => {
                const capabilities = getRoleCapabilities(viewingRole);
                const summary = getCapabilitySummary(capabilities);

                if (capabilities.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiOutlineShieldCheck className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Capabilities
                      </h3>
                      <p className="text-gray-600">
                        This role has no specific permissions assigned.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {summary.document > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                          <div className="text-2xl mb-2">📄</div>
                          <div className="text-lg font-bold text-blue-700">
                            {summary.document}
                          </div>
                          <div className="text-sm text-blue-600">
                            Document Actions
                          </div>
                        </div>
                      )}
                      {summary.user > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                          <div className="text-2xl mb-2">👥</div>
                          <div className="text-lg font-bold text-green-700">
                            {summary.user}
                          </div>
                          <div className="text-sm text-green-600">
                            User Actions
                          </div>
                        </div>
                      )}
                      {summary.workflow > 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                          <div className="text-2xl mb-2">⚙️</div>
                          <div className="text-lg font-bold text-purple-700">
                            {summary.workflow}
                          </div>
                          <div className="text-sm text-purple-600">
                            Workflow Actions
                          </div>
                        </div>
                      )}
                      {summary.system > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                          <div className="text-2xl mb-2">🔧</div>
                          <div className="text-lg font-bold text-orange-700">
                            {summary.system}
                          </div>
                          <div className="text-sm text-orange-600">
                            System Actions
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detailed Capabilities */}
                    <div className="space-y-4">
                      {summary.document > 0 && (
                        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                            <span className="text-2xl mr-3">📄</span>
                            Document Management
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {capabilities
                              .filter((c) => c.type === "document")
                              .map((cap, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-100"
                                >
                                  <span className="text-lg">{cap.icon}</span>
                                  <span className={`font-medium ${cap.color}`}>
                                    {cap.action}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {summary.user > 0 && (
                        <div className="bg-green-50/50 border border-green-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                            <span className="text-2xl mr-3">👥</span>
                            User Management
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {capabilities
                              .filter((c) => c.type === "user")
                              .map((cap, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100"
                                >
                                  <span className="text-lg">{cap.icon}</span>
                                  <span className={`font-medium ${cap.color}`}>
                                    {cap.action}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {summary.workflow > 0 && (
                        <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                            <span className="text-2xl mr-3">⚙️</span>
                            Workflow Management
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {capabilities
                              .filter((c) => c.type === "workflow")
                              .map((cap, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-purple-100"
                                >
                                  <span className="text-lg">{cap.icon}</span>
                                  <span className={`font-medium ${cap.color}`}>
                                    {cap.action}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {summary.system > 0 && (
                        <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                            <span className="text-2xl mr-3">🔧</span>
                            System Management
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {capabilities
                              .filter((c) => c.type === "system")
                              .map((cap, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-orange-100"
                                >
                                  <span className="text-lg">{cap.icon}</span>
                                  <span className={`font-medium ${cap.color}`}>
                                    {cap.action}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCapabilitiesModal(false);
                    setViewingRole(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
