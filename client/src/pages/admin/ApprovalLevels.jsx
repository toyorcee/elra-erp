import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineClipboardCheck,
} from "react-icons/hi";
import { GradientSpinner } from "../../components/common";

const ApprovalLevels = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    level: 1,
    description: "",
    permissions: [],
    documentTypes: [],
  });

  const availablePermissions = [
    "document.view",
    "document.edit",
    "document.delete",
    "document.approve",
    "document.reject",
    "document.share",
    "document.export",
    "user.view",
    "user.edit",
    "workflow.start",
    "workflow.approve",
    "workflow.reject",
    "workflow.delegate",
  ];

  const availableDocumentTypes = [
    "contracts",
    "invoices",
    "reports",
    "proposals",
    "legal_documents",
    "financial_statements",
    "court_filings",
    "evidence",
    "transcripts",
  ];

  useEffect(() => {
    fetchApprovalLevels();
  }, []);

  const fetchApprovalLevels = async () => {
    try {
      const response = await fetch("/api/approval-levels", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch approval levels");
      const data = await response.json();
      setLevels(data.data || []);
    } catch (error) {
      toast.error("Failed to fetch approval levels");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingLevel
        ? `/api/approval-levels/${editingLevel._id}`
        : "/api/approval-levels";
      const method = editingLevel ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save approval level");

      toast.success(
        editingLevel
          ? "Approval level updated successfully"
          : "Approval level created successfully"
      );

      setShowModal(false);
      setEditingLevel(null);
      resetForm();
      fetchApprovalLevels();
    } catch (error) {
      toast.error("Failed to save approval level");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this approval level?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/approval-levels/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete approval level");

      toast.success("Approval level deleted successfully");
      fetchApprovalLevels();
    } catch (error) {
      toast.error("Failed to delete approval level");
      console.error(error);
    }
  };

  const handleEdit = (level) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      level: level.level,
      description: level.description,
      permissions: level.permissions || [],
      documentTypes: level.documentTypes || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: 1,
      description: "",
      permissions: [],
      documentTypes: [],
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Approval Levels Management
              </h1>
              <p className="text-gray-600">
                Create and manage approval levels for your organization
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <HiOutlinePlus className="w-5 h-5" />
              Create Level
            </motion.button>
          </div>
        </div>

        {/* Approval Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((level, index) => (
            <motion.div
              key={level._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {level.name}
                  </h3>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                    Level {level.level}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(level)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(level._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{level.description}</p>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Permissions ({level.permissions?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {level.permissions?.slice(0, 3).map((perm) => (
                      <span
                        key={perm}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                      >
                        {perm}
                      </span>
                    ))}
                    {level.permissions?.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{level.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Document Types ({level.documentTypes?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {level.documentTypes?.slice(0, 3).map((docType) => (
                      <span
                        key={docType}
                        className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded"
                      >
                        {docType}
                      </span>
                    ))}
                    {level.documentTypes?.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{level.documentTypes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {levels.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <HiOutlineClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              No Approval Levels Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first approval level to get started
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Create First Level
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingLevel ? "Edit Approval Level" : "Create Approval Level"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {permission}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Types
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availableDocumentTypes.map((docType) => (
                    <label key={docType} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.documentTypes.includes(docType)}
                        onChange={() => toggleDocumentType(docType)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{docType}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition-all"
                >
                  {editingLevel ? "Update Level" : "Create Level"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingLevel(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ApprovalLevels;
