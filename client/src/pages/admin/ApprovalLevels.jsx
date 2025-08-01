import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import {
  getApprovalLevels,
  createApprovalLevel,
  updateApprovalLevel,
  deleteApprovalLevel,
} from "../../services/approvalLevels";

const ApprovalLevels = () => {
  const [approvalLevels, setApprovalLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    level: 1,
    description: "",
    permissions: [],
    documentTypes: [],
    isActive: true,
  });

  // NAIC-specific document types
  const availableDocumentTypes = [
    "insurance_policy",
    "claims_document",
    "financial_report",
    "client_correspondence",
    "regulatory_compliance",
    "underwriting_document",
    "general",
  ];

  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Available permissions
  const availablePermissions = [
    "document.upload",
    "document.view",
    "document.edit",
    "document.delete",
    "document.approve",
    "document.reject",
    "document.share",
    "document.export",
    "document.archive",
    "user.create",
    "user.view",
    "user.edit",
    "user.delete",
    "user.assign_role",
    "user.view_permissions",
    "workflow.create",
    "workflow.start",
    "workflow.approve",
    "workflow.reject",
    "workflow.delegate",
    "workflow.view",
    "system.settings",
    "system.reports",
    "system.audit",
    "system.backup",
  ];

  useEffect(() => {
    fetchApprovalLevels();
  }, []);

  const fetchApprovalLevels = async () => {
    try {
      setLoading(true);
      const response = await getApprovalLevels();
      setApprovalLevels(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch approval levels");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.level) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      if (editingLevel) {
        await updateApprovalLevel(editingLevel._id, formData);
        toast.success("Approval level updated successfully");
      } else {
        await createApprovalLevel(formData);
        toast.success("Approval level created successfully");
      }

      setShowModal(false);
      setEditingLevel(null);
      resetForm();
      fetchApprovalLevels();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save approval level"
      );
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (level) => {
    setEditingLevel(level);
    setFormData({
      name: level.name || "",
      level: level.level || 1,
      description: level.description || "",
      permissions: level.permissions || [],
      documentTypes: level.documentTypes || [],
      isActive: level.isActive !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this approval level?")
    ) {
      return;
    }

    try {
      setDeleteLoading(id);
      await deleteApprovalLevel(id);
      toast.success("Approval level deleted successfully");
      fetchApprovalLevels();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete approval level"
      );
      console.error(error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: 1,
      description: "",
      permissions: [],
      documentTypes: [],
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setEditingLevel(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLevel(null);
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

  const toggleDocumentType = (docType) => {
    setFormData((prev) => ({
      ...prev,
      documentTypes: prev.documentTypes.includes(docType)
        ? prev.documentTypes.filter((d) => d !== docType)
        : [...prev.documentTypes, docType],
    }));
  };

  const filteredLevels = approvalLevels.filter(
    (level) =>
      level.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      level.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <HiOutlineCheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Approval Levels
              </h1>
              <p className="text-gray-600 mt-1">
                Manage NAIC approval hierarchies and permissions
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Create Level</span>
          </button>
        </div>
      </div>

      {/* Approval Flow Information */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl border border-blue-200 p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <HiOutlineShieldCheck className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">
            📋 8-Level Document Approval Workflow
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">
              🔄 Complete Document Flow:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Claims Department (Level 10) - Initial Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Underwriting Department (Level 15) - Policy Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>Regional Operations (Level 20) - Operational Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>Compliance & Audit (Level 25) - Compliance Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <span>Finance & Accounting (Level 30) - Financial Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold">
                  6
                </span>
                <span>Human Resources (Level 35) - HR Policy Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold">
                  7
                </span>
                <span>
                  Information Technology (Level 40) - Technical Review
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">
                  8
                </span>
                <span className="font-semibold">
                  Executive Management (Level 50) - Final Approval
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">
              👥 Required User Roles:
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
            <strong>Workflow Rules:</strong> Each document must be approved at
            every level before proceeding to the next. Users can only approve
            documents at their assigned department level and with appropriate
            role permissions. The system automatically routes documents through
            all 8 levels sequentially.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search approval levels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300"
          />
        </div>
      </div>

      {/* Approval Levels Grid */}
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
      ) : filteredLevels.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiOutlineCheckCircle className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            No approval levels found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm
              ? "Try adjusting your search"
              : "Get started by creating your first NAIC approval level"}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span>Create Level</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLevels.map((level) => (
            <div
              key={level._id}
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
                        {level.name}
                      </h3>
                      <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded-lg">
                        Level {level.level}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                      level.isActive !== false
                        ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                        : "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200"
                    }`}
                  >
                    {level.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>

                {level.description && (
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2 bg-gray-50/50 p-3 rounded-xl">
                    {level.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-3 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <HiOutlineUsers className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">
                      {level.permissions?.length || 0} permissions
                    </span>
                  </div>
                  <span className="font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                    {level.documentTypes?.length || 0} doc types
                  </span>
                </div>

                {/* Audit Trail Information */}
                <div className="mb-6 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <HiOutlineUser className="mr-1" />
                        Created by: {level.createdBy?.firstName}{" "}
                        {level.createdBy?.lastName}
                      </span>
                      <span className="flex items-center">
                        <HiOutlineClock className="mr-1" />
                        Created:{" "}
                        {new Date(level.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="flex items-center">
                      <HiOutlineArrowPath className="mr-1" />
                      Updated: {new Date(level.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEdit(level)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:shadow-md"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(level._id)}
                    disabled={deleteLoading === level._id}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteLoading === level._id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <HiOutlineTrash className="w-4 h-4" />
                    )}
                    <span>
                      {deleteLoading === level._id ? "Deleting..." : "Delete"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <HiOutlineCheckCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {editingLevel
                    ? "Edit Approval Level"
                    : "Create Approval Level"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Level Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300"
                      placeholder="e.g., Senior Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Level Number *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300"
                      placeholder="1"
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
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300"
                    placeholder="Describe the approval level..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Document Types
                  </label>
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableDocumentTypes.map((docType) => (
                        <label
                          key={docType}
                          className="flex items-center p-3 bg-white/80 rounded-lg hover:bg-white transition-all duration-200"
                        >
                          <input
                            type="checkbox"
                            checked={formData.documentTypes.includes(docType)}
                            onChange={() => toggleDocumentType(docType)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mr-3"
                          />
                          <span className="text-sm text-gray-700">
                            {docType
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Permissions
                  </label>
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availablePermissions.map((permission) => (
                        <label
                          key={permission}
                          className="flex items-center p-3 bg-white/80 rounded-lg hover:bg-white transition-all duration-200"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission)}
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
                </div>

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
                      Active Level
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100/80 backdrop-blur-sm rounded-xl hover:bg-gray-200/80 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingLevel ? "Update" : "Create"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalLevels;
