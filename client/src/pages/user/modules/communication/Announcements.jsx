import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { useSocket } from "../../../../context/SocketContext";
import communicationAPI from "../../../../services/communication";
import { userModulesAPI } from "../../../../services/userModules";
import { toast } from "react-toastify";
import {
  MegaphoneIcon,
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ELRALogo from "../../../../components/ELRALogo.jsx";
import AnimatedBubbles from "../../../../components/ui/AnimatedBubbles.jsx";
import DataTable from "../../../../components/common/DataTable.jsx";
import SmartFileUpload from "../../../../components/common/SmartFileUpload.jsx";

const Announcements = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [announcementToUpdate, setAnnouncementToUpdate] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    audienceScope: "all",
    selectedDepartment: "",
    attachments: [],
    priority: "normal",
  });

  const canManageAnnouncements =
    user?.role?.level >= 700 && user?.department?.name === "Human Resources";

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await communicationAPI.getAnnouncements();
      const announcements = data?.items || data || [];
      setAnnouncements(Array.isArray(announcements) ? announcements : []);
    } catch (err) {
      setError("Failed to load announcements");
      console.error("Error loading announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments for audience scope
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const { data } = await userModulesAPI.departments.getAllDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Load announcements on component mount
  useEffect(() => {
    if (user) {
      loadAnnouncements();
    }
  }, [user]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const refreshAnnouncements = () => {
      loadAnnouncements();
    };

    socket.on("communication:announcementCreated", refreshAnnouncements);
    socket.on("communication:announcementUpdated", refreshAnnouncements);
    socket.on("communication:announcementDeleted", refreshAnnouncements);

    return () => {
      socket.off("communication:announcementCreated");
      socket.off("communication:announcementUpdated");
      socket.off("communication:announcementDeleted");
    };
  }, [socket]);

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      title: "",
      body: "",
      audienceScope: "all",
      selectedDepartment: "",
      attachments: [],
      priority: "normal",
    });
    setEditingAnnouncement(null);
    setShowCreateModal(true);
    fetchDepartments();
  };

  // Open edit modal
  const openEditModal = (announcement) => {
    setFormData({
      title: announcement.title,
      body: announcement.body,
      audienceScope: announcement.audienceScope,
      selectedDepartment: announcement.department?._id || "",
      attachments: [],
      priority: announcement.priority || "normal",
    });
    setEditingAnnouncement(announcement);
    setShowCreateModal(true);
    fetchDepartments();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveAnnouncement = async () => {
    try {
      setSaving(true);

      let processedAttachments = [];
      console.log(
        "🔍 [handleSaveAnnouncement] Form data attachments:",
        formData.attachments
      );

      if (formData.attachments && formData.attachments.length > 0) {
        const uploadFormData = new FormData();
        formData.attachments.forEach((attachment, index) => {
          console.log(
            `🔍 [handleSaveAnnouncement] Processing attachment ${index}:`,
            attachment
          );
          if (attachment.file) {
            uploadFormData.append("documents", attachment.file);
          }
        });

        try {
          const uploadResponse = await communicationAPI.uploadAttachments(
            uploadFormData
          );
          console.log(
            "🔍 [handleSaveAnnouncement] Upload response:",
            uploadResponse
          );

          if (uploadResponse.success) {
            processedAttachments = uploadResponse.data;
            console.log(
              "🔍 [handleSaveAnnouncement] Processed attachments:",
              processedAttachments
            );
          } else {
            throw new Error(uploadResponse.message || "Upload failed");
          }
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          toast.error("Failed to upload attachments. Please try again.");
          setSaving(false);
          return;
        }
      }

      let finalAttachments = processedAttachments;
      if (editingAnnouncement && editingAnnouncement.attachments) {
        // Convert existing attachments to the expected format
        const existingAttachments = editingAnnouncement.attachments.map(
          (att) => ({
            documentId: att._id || att,
            name: att.title || att.originalFileName || att.fileName,
            type: att.mimeType,
            size: att.fileSize,
            url: att.fileUrl,
            filename: att.fileName,
          })
        );
        finalAttachments = [...existingAttachments, ...processedAttachments];
      }

      const payload = {
        title: formData.title,
        body: formData.body,
        audienceScope: formData.audienceScope,
        priority: formData.priority,
        attachments: finalAttachments,
      };

      console.log(
        "🔍 [handleSaveAnnouncement] Form data priority:",
        formData.priority
      );
      console.log("🔍 [handleSaveAnnouncement] Payload being sent:", payload);

      if (
        formData.audienceScope === "department" &&
        formData.selectedDepartment
      ) {
        payload.department = formData.selectedDepartment;
      }

      if (editingAnnouncement) {
        setAnnouncementToUpdate({
          id: editingAnnouncement._id,
          payload,
        });
        setShowUpdateConfirm(true);
      } else {
        // Create new announcement
        await communicationAPI.createAnnouncement(payload);
        await loadAnnouncements();
        toast.success("Announcement created successfully");
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  // Handle update announcement
  const handleUpdateAnnouncement = async () => {
    try {
      setIsUpdating(true);
      await communicationAPI.updateAnnouncement(
        announcementToUpdate.id,
        announcementToUpdate.payload
      );
      await loadAnnouncements();
      toast.success("Announcement updated successfully");
      setShowUpdateConfirm(false);
      setAnnouncementToUpdate(null);
      setShowCreateModal(false);
      setEditingAnnouncement(null);
    } catch (error) {
      console.error("Update announcement error:", error);
      toast.error("Failed to update announcement");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async () => {
    try {
      setIsDeleting(true);
      await communicationAPI.deleteAnnouncement(announcementToDelete.id);
      await loadAnnouncements();
      toast.success("Announcement deleted successfully");
      setShowDeleteConfirm(false);
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error("Delete announcement error:", error);
      toast.error("Failed to delete announcement");
    } finally {
      setIsDeleting(false);
    }
  };

  const announcementsTableColumns = [
    {
      header: "Title",
      accessor: "title",
      renderer: (row) => (
        <div className="max-w-xs min-w-0">
          <p className="font-medium text-gray-900 truncate" title={row.title}>
            {row.title?.length > 30
              ? `${row.title.substring(0, 30)}...`
              : row.title}
          </p>
          <p className="text-sm text-gray-500 truncate" title={row.body}>
            {row.body?.length > 40
              ? `${row.body.substring(0, 40)}...`
              : row.body}
          </p>
        </div>
      ),
    },
    {
      header: "Audience",
      accessor: "audienceScope",
      renderer: (row) => (
        <div className="flex items-center min-w-0">
          {row.audienceScope === "all" ? (
            <>
              <BuildingOfficeIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
              <span className="text-blue-600 font-medium truncate">
                Company-wide
              </span>
            </>
          ) : (
            <>
              <UserGroupIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-green-600 font-medium truncate">
                {row.department?.name || "Department"}
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      header: "Priority",
      accessor: "priority",
      renderer: (row) => {
        const colors = {
          low: "bg-gray-100 text-gray-800",
          normal: "bg-blue-100 text-blue-800",
          high: "bg-orange-100 text-orange-800",
          urgent: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              colors[row.priority] || colors.normal
            }`}
          >
            {row.priority?.charAt(0).toUpperCase() + row.priority?.slice(1)}
          </span>
        );
      },
    },
    {
      header: "Created",
      accessor: "createdAt",
      renderer: (row) => (
        <div className="flex items-center text-sm text-gray-600 min-w-0">
          <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: "Attachments",
      accessor: "attachments",
      renderer: (row) => {
        if (!row.attachments || row.attachments.length === 0) {
          return <span className="text-gray-400 text-sm">No files</span>;
        }
        return (
          <div className="flex items-center space-x-1 min-w-0">
            <DocumentTextIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="text-blue-600 text-sm font-medium truncate">
              {row.attachments.length} file
              {row.attachments.length > 1 ? "s" : ""}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "isActive",
      renderer: (row) => {
        return row.isActive ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Inactive
          </span>
        );
      },
    },
  ];

  const tableActions = {
    showView: true,
    showEdit: canManageAnnouncements,
    showDelete: canManageAnnouncements,
    onView: (rowData) => {
      setViewingAnnouncement(rowData);
      setShowViewModal(true);
    },
    onEdit: (rowData) => openEditModal(rowData),
    onDelete: (id, name) => {
      setAnnouncementToDelete({ id, name });
      setShowDeleteConfirm(true);
    },
  };

  // Calculate stats
  const stats = {
    total: announcements.length,
    thisMonth: announcements.filter((a) => {
      const created = new Date(a.createdAt);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length,
    active: announcements.filter((a) => a.isActive).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <MegaphoneIcon className="h-10 w-10 mr-4" />
                Announcements
              </h1>
              <p className="text-white/90 text-lg">
                View and manage company-wide announcements and important updates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {canManageAnnouncements && (
                <button
                  onClick={openCreateModal}
                  className="bg-white text-[var(--elra-primary)] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 flex items-center shadow-lg"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Announcement
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <MegaphoneIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Announcements
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  This Month
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {stats.thisMonth}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Announcements Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-6 w-6 mr-3 text-[var(--elra-primary)]" />
                Announcements
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading announcements...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={loadAnnouncements}
                  className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-8 text-center">
                <MegaphoneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Announcements Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  {canManageAnnouncements
                    ? "Create your first announcement to communicate important updates to your team."
                    : "No announcements have been published yet."}
                </p>
                {canManageAnnouncements && (
                  <button
                    onClick={openCreateModal}
                    className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors flex items-center mx-auto"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Your First Announcement
                  </button>
                )}
              </div>
            ) : (
              <DataTable
                data={announcements}
                columns={announcementsTableColumns}
                actions={tableActions}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Create/Edit Announcement Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="bg-[var(--elra-primary)] text-white p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                        <ELRALogo className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {editingAnnouncement
                            ? "Edit Announcement"
                            : "Create Announcement"}
                        </h2>
                        <p className="text-white/80 text-sm">
                          {editingAnnouncement
                            ? "Update announcement details"
                            : "Share important updates with your team"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-white/80 hover:text-white transition-colors"
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

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      placeholder="Enter announcement title"
                      required
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      name="body"
                      value={formData.body}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      placeholder="Enter announcement content"
                      required
                    />
                  </div>

                  {/* Audience Scope */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audience Scope *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="audienceScope"
                          value="all"
                          checked={formData.audienceScope === "all"}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <BuildingOfficeIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <span>Company-wide (All employees)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="audienceScope"
                          value="department"
                          checked={formData.audienceScope === "department"}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <UserGroupIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span>Department-specific</span>
                      </label>
                    </div>

                    {/* Department Selection */}
                    {formData.audienceScope === "department" && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Department
                        </label>
                        {loadingDepartments ? (
                          <div className="flex items-center justify-center p-4">
                            <AnimatedBubbles />
                            <span className="ml-2 text-gray-600">
                              Loading departments...
                            </span>
                          </div>
                        ) : (
                          <select
                            name="selectedDepartment"
                            value={formData.selectedDepartment}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                            required
                          >
                            <option value="">Select a department</option>
                            {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* File Attachments */}
                <div className="px-6 py-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Attachments (Optional)
                  </label>

                  {/* Smart File Upload - Count existing + selected against max */}
                  {(editingAnnouncement?.attachments?.length || 0) < 5 && (
                    <SmartFileUpload
                      files={formData.attachments || []}
                      onFilesChange={(files) => {
                        setFormData((prev) => ({
                          ...prev,
                          attachments: files,
                        }));
                      }}
                      maxFiles={5}
                      existingCount={
                        editingAnnouncement?.attachments?.length || 0
                      }
                      maxSizePerFile={10 * 1024 * 1024}
                      className="mb-4"
                    />
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAnnouncement}
                    disabled={saving || !formData.title || !formData.body}
                    className="bg-[var(--elra-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving ? (
                      <>
                        <AnimatedBubbles />
                        <span className="ml-2">Saving...</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        {editingAnnouncement
                          ? "Update Announcement"
                          : "Create Announcement"}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update Confirmation Modal */}
        <AnimatePresence>
          {showUpdateConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              >
                <div className="bg-[var(--elra-primary)] p-6 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <PencilIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Update Announcement
                      </h3>
                      <p className="text-white/80 text-sm">
                        Confirm announcement update
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to update this announcement? All
                    recipients will be notified about the changes.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <svg
                          className="h-4 w-4 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="font-medium text-blue-800">
                        Notification Impact
                      </span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      All employees will receive an update notification.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUpdateConfirm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAnnouncement}
                    disabled={isUpdating}
                    className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isUpdating ? (
                      <>
                        <AnimatedBubbles />
                        <span className="ml-2">Updating...</span>
                      </>
                    ) : (
                      "Update Announcement"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              >
                <div className="bg-red-600 p-6 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <TrashIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Delete Announcement
                      </h3>
                      <p className="text-white/80 text-sm">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to delete "
                    {announcementToDelete?.name}"? This action cannot be undone.
                  </p>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2">
                        <svg
                          className="h-4 w-4 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="font-medium text-red-800">Warning</span>
                    </div>
                    <p className="text-red-700 text-sm">
                      This announcement will be permanently deleted and removed
                      from all users' view.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAnnouncement}
                    disabled={isDeleting}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isDeleting ? (
                      <>
                        <AnimatedBubbles />
                        <span className="ml-2">Deleting...</span>
                      </>
                    ) : (
                      "Delete Announcement"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Announcement Modal */}
        <AnimatePresence>
          {showViewModal && viewingAnnouncement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="bg-[var(--elra-primary)] p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg">
                        <MegaphoneIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {viewingAnnouncement.title}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {viewingAnnouncement.audienceScope === "all"
                            ? "Company-wide Announcement"
                            : `${
                                viewingAnnouncement.department?.name ||
                                "Department"
                              } Announcement`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {/* Priority and Status */}
                  <div className="flex items-center gap-4 mb-6">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        viewingAnnouncement.priority === "urgent"
                          ? "bg-red-100 text-red-800"
                          : viewingAnnouncement.priority === "high"
                          ? "bg-orange-100 text-orange-800"
                          : viewingAnnouncement.priority === "normal"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {viewingAnnouncement.priority?.charAt(0).toUpperCase() +
                        viewingAnnouncement.priority?.slice(1)}{" "}
                      Priority
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        viewingAnnouncement.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {viewingAnnouncement.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Announcement Body */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Content
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {viewingAnnouncement.body}
                      </p>
                    </div>
                  </div>

                  {/* Attachments */}
                  {viewingAnnouncement.attachments &&
                    viewingAnnouncement.attachments.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Attachments ({viewingAnnouncement.attachments.length})
                        </h4>
                        <div className="space-y-2">
                          {viewingAnnouncement.attachments.map(
                            (attachment, index) => (
                              <div
                                key={attachment._id || index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    {attachment.mimeType ===
                                    "application/pdf" ? (
                                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                        <span className="text-red-600 font-bold text-sm">
                                          PDF
                                        </span>
                                      </div>
                                    ) : attachment.mimeType?.startsWith(
                                        "image/"
                                      ) ? (
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm">
                                          IMG
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-600 font-bold text-sm">
                                          DOC
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {attachment.title ||
                                        attachment.originalFileName ||
                                        attachment.fileName ||
                                        `Attachment ${index + 1}`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {attachment.fileSize
                                        ? `${(
                                            attachment.fileSize / 1024
                                          ).toFixed(1)} KB`
                                        : "Unknown size"}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (attachment._id) {
                                      window.open(
                                        `/api/documents/${attachment._id}/view`,
                                        "_blank"
                                      );
                                    }
                                  }}
                                  className="px-3 py-1 text-sm bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors"
                                >
                                  View
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Created By
                      </h4>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {viewingAnnouncement.createdBy?.firstName?.charAt(
                            0
                          ) || "U"}
                        </div>
                        <span className="text-sm text-gray-900">
                          {viewingAnnouncement.createdBy?.firstName}{" "}
                          {viewingAnnouncement.createdBy?.lastName}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Created Date
                      </h4>
                      <p className="text-sm text-gray-900">
                        {new Date(
                          viewingAnnouncement.createdAt
                        ).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(
                          viewingAnnouncement.createdAt
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Announcements;
