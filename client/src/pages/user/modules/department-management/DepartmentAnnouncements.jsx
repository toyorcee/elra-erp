import React, { useEffect, useMemo, useState } from "react";
import {
  MegaphoneIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import DataTable from "../../../../components/common/DataTable.jsx";
import SmartFileUpload from "../../../../components/common/SmartFileUpload.jsx";
import { useAuth } from "../../../../context/AuthContext.jsx";
import communicationAPI from "../../../../services/communication.js";
import { toast } from "react-toastify";

const DepartmentAnnouncements = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    priority: "normal",
    attachments: [],
  });

  const loadDepartmentAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        departmentId: user?.department?._id || user?.department,
        page: 1,
        limit: 50,
      };
      const { data } = await communicationAPI.getAnnouncements(params);
      const items = data?.items || data || [];
      setAnnouncements(Array.isArray(items) ? items : []);
    } catch (e) {
      console.error("Dept announcements load error", e);
      setError("Failed to load announcements");
      setAnnouncements([]);
      toast.error("Failed to load announcements. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartmentAnnouncements();
  }, [user?.department?._id]);

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      priority: announcement.priority || "normal",
      attachments: [],
    });
    setShowEdit(true);
  };

  const openViewModal = (announcement) => {
    setViewingAnnouncement(announcement);
    setShowView(true);
  };

  const openDeleteModal = (announcement) => {
    setDeletingAnnouncement(announcement);
    setShowDeleteConfirm(true);
  };

  const handleSaveAnnouncement = async () => {
    try {
      setSaving(true);
      let processedAttachments = [];

      if (formData.attachments?.length) {
        const fd = new FormData();
        formData.attachments.forEach((f) =>
          fd.append("documents", f.file || f)
        );
        const uploadRes = await communicationAPI.uploadAttachments(fd);
        processedAttachments = uploadRes?.data || [];
      }

      if (editingAnnouncement) {
        let finalAttachments = processedAttachments;
        if (editingAnnouncement.attachments) {
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

        await communicationAPI.updateDepartmentAnnouncement(
          editingAnnouncement._id,
          {
            title: formData.title,
            body: formData.body,
            departmentId: user?.department?._id || user?.department,
            attachments: finalAttachments,
            priority: formData.priority,
            isActive: true,
          }
        );
        setShowEdit(false);
      } else {
        await communicationAPI.createDepartmentAnnouncement({
          title: formData.title,
          body: formData.body,
          departmentId: user?.department?._id || user?.department,
          attachments: processedAttachments,
          priority: formData.priority,
          isActive: true,
        });
        setShowCreate(false);
      }

      setFormData({
        title: "",
        body: "",
        priority: "normal",
        attachments: [],
      });
      setEditingAnnouncement(null);
      await loadDepartmentAnnouncements();

      toast.success(
        editingAnnouncement
          ? "Announcement updated successfully!"
          : "Announcement created successfully!"
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to save announcement. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    try {
      setDeleting(true);
      await communicationAPI.deleteDepartmentAnnouncement(
        deletingAnnouncement._id
      );
      setShowDeleteConfirm(false);
      setDeletingAnnouncement(null);
      await loadDepartmentAnnouncements();

      // Show success toast
      toast.success("Announcement deleted successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete announcement. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Title",
        accessor: "title",
        renderer: (row) => (
          <div className="min-w-0 max-w-xs">
            <p className="font-medium text-gray-900 truncate" title={row.title}>
              {row.title?.length > 40
                ? `${row.title.slice(0, 40)}...`
                : row.title}
            </p>
            <p className="text-sm text-gray-500 truncate" title={row.body}>
              {row.body?.length > 60 ? `${row.body.slice(0, 60)}...` : row.body}
            </p>
          </div>
        ),
      },
      {
        header: "Audience",
        accessor: "audienceScope",
        renderer: (row) => (
          <span
            className={`text-sm font-medium ${
              row.audienceScope === "all" ? "text-blue-600" : "text-green-600"
            }`}
          >
            {row.audienceScope === "all" ? "Company" : "Department"}
          </span>
        ),
      },
      {
        header: "Priority",
        accessor: "priority",
        renderer: (row) => {
          const map = {
            low: "bg-gray-100 text-gray-800",
            normal: "bg-blue-100 text-blue-800",
            high: "bg-orange-100 text-orange-800",
            urgent: "bg-red-100 text-red-800",
          };
          const cls = map[row.priority] || map.normal;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}
            >
              {row.priority || "normal"}
            </span>
          );
        },
      },
      {
        header: "Created",
        accessor: "createdAt",
        renderer: (row) => (
          <span className="text-sm text-gray-600">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        header: "Attachments",
        accessor: "attachments",
        renderer: (row) => (
          <span className="text-sm text-blue-600 font-medium">
            {row.attachments?.length || 0} file
            {(row.attachments?.length || 0) === 1 ? "" : "s"}
          </span>
        ),
      },
      {
        header: "Status",
        accessor: "isActive",
        renderer: (row) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        header: "Actions",
        accessor: "actions",
        renderer: (row) => {
          const isOwner =
            row.createdBy?._id === user?.id || row.createdBy === user?.id;
          const isDepartmentAnnouncement = row.audienceScope === "department";

          const canEditDelete = isDepartmentAnnouncement && isOwner;

          return (
            <div className="flex items-center space-x-2">
              {/* View button - always visible */}
              <button
                onClick={() => openViewModal(row)}
                className="p-2 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                title="View"
              >
                <EyeIcon className="w-4 h-4" />
              </button>

              {/* Edit button - only for department announcements created by current user */}
              {canEditDelete && (
                <button
                  onClick={() => openEditModal(row)}
                  className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white rounded-lg transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}

              {/* Delete button - only for department announcements created by current user */}
              {canEditDelete && (
                <button
                  onClick={() => openDeleteModal(row)}
                  className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const actions = useMemo(
    () => ({
      showView: false,
      showEdit: false,
      showDelete: false,
    }),
    []
  );

  return (
    <div className="space-y-6 p-4">
      {/* Hero/Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/30 rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-white/20 rounded-full" />
        </div>
        <div className="relative p-6 md:p-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
              <MegaphoneIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Department Announcements
              </h1>
              <p className="text-white/80 mt-1 flex items-center space-x-2">
                <BuildingOfficeIcon className="h-4 w-4" />
                <span>Share updates with your department team</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDepartmentAnnouncements}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
            >
              Create Announcement
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
            <p className="text-gray-600 mt-3">Loading announcements…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : (
          <DataTable
            data={announcements}
            columns={columns}
            actions={actions}
            loading={loading}
          />
        )}
      </div>
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={() => !saving && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[var(--elra-primary)] p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <MegaphoneIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                    </div>
                    <h3 className="font-semibold text-white">
                      Create Department Announcement
                    </h3>
                  </div>
                  <button
                    onClick={() => !saving && setShowCreate(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    value={formData.body}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, body: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="Write the announcement..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (optional)
                  </label>
                  <SmartFileUpload
                    files={formData.attachments}
                    onFilesChange={(files) =>
                      setFormData((p) => ({ ...p, attachments: files }))
                    }
                    maxFiles={5}
                    existingCount={0}
                    maxSizePerFile={10 * 1024 * 1024}
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  onClick={() => !saving && setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={saving || !formData.title || !formData.body}
                  onClick={handleSaveAnnouncement}
                  className="px-6 py-2 rounded-lg bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && editingAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={() => !saving && setShowEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[var(--elra-primary)] p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <PencilIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                    </div>
                    <h3 className="font-semibold text-white">
                      Edit Department Announcement
                    </h3>
                  </div>
                  <button
                    onClick={() => !saving && setShowEdit(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    value={formData.body}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, body: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="Write the announcement..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (optional)
                  </label>
                  <SmartFileUpload
                    files={formData.attachments}
                    onFilesChange={(files) =>
                      setFormData((p) => ({ ...p, attachments: files }))
                    }
                    maxFiles={
                      5 - (editingAnnouncement?.attachments?.length || 0)
                    }
                    existingCount={
                      editingAnnouncement?.attachments?.length || 0
                    }
                    maxSizePerFile={10 * 1024 * 1024}
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  onClick={() => !saving && setShowEdit(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={saving || !formData.title || !formData.body}
                  onClick={handleSaveAnnouncement}
                  className="px-6 py-2 rounded-lg bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showView && viewingAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowView(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[var(--elra-primary)] p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <EyeIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {viewingAnnouncement.title}
                      </h3>
                      <p className="text-white/80 text-sm">
                        Department Announcement
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowView(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
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
                                  {attachment.mimeType === "application/pdf" ? (
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
                                      ? `${(attachment.fileSize / 1024).toFixed(
                                          1
                                        )} KB`
                                      : "Unknown size"}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (attachment.fileUrl) {
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Created By
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {viewingAnnouncement.createdBy?.firstName?.charAt(0) ||
                          "U"}
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
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setShowView(false)}
                  className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && deletingAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-500 p-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <TrashIcon className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Delete Announcement
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete "{deletingAnnouncement.title}
                  "? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                    onClick={() => !deleting && setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    onClick={handleDeleteAnnouncement}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DepartmentAnnouncements;
