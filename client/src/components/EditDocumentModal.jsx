import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  MdClose,
  MdSave,
  MdCancel,
  MdTag,
  MdCategory,
  MdPriorityHigh,
  MdDescription,
  MdTitle,
  MdVisibility,
  MdDownload,
  MdEdit,
} from "react-icons/md";
import { updateDocument } from "../services/documents";
import GradientSpinner from "./common/GradientSpinner";
import DocumentIcon from "./DocumentIcon";

const EditDocumentModal = ({
  document,
  isOpen,
  onClose,
  onSuccess,
  userPermissions = [],
  userRole = "user",
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Medium",
    tags: [],
    department: "",
  });

  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user can edit this document
  const canEdit = () => {
    // Super admin can edit any document
    if (userRole === "super_admin") return true;

    // Admin can edit if they have document.edit permission
    if (userRole === "admin" && userPermissions.includes("document.edit"))
      return true;

    // Regular user can only edit their own documents (unless approved/finalized)
    if (userRole === "user") {
      return (
        document?.uploadedBy === document?.currentUser?._id &&
        document?.status !== "APPROVED" &&
        document?.status !== "FINALIZED"
      );
    }

    return false;
  };

  // Initialize form data when document changes
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || "",
        description: document.description || "",
        category: document.category || "",
        priority: document.priority || "Medium",
        tags: document.tags || [],
        department: document.department || "",
      });
    }
  }, [document]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => updateDocument(document._id, data),
    onSuccess: () => {
      toast.success("Document updated successfully!");
      queryClient.invalidateQueries(["documents"]);
      queryClient.invalidateQueries(["document", document._id]);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update document");
    },
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit()) {
      toast.error("You don't have permission to edit this document");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <MdEdit className="text-blue-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Edit Document</h2>
              <p className="text-gray-300 text-sm">
                Update document information and metadata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Permission Warning */}
        {!canEdit() && (
          <div className="mx-6 mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-sm">
              {document?.status === "APPROVED" ||
              document?.status === "FINALIZED"
                ? "Cannot edit approved or finalized documents"
                : "You don't have permission to edit this document"}
            </p>
          </div>
        )}

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Document Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <MdTitle className="inline mr-2" />
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300 backdrop-blur-sm"
                      required
                      disabled={!canEdit()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <MdCategory className="inline mr-2" />
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
                      required
                      disabled={!canEdit()}
                    >
                      <option value="">Select Category</option>
                      <option value="Financial">Financial</option>
                      <option value="HR">HR</option>
                      <option value="Legal">Legal</option>
                      <option value="Operations">Operations</option>
                      <option value="Marketing">Marketing</option>
                      <option value="IT">IT</option>
                      <option value="Sales">Sales</option>
                      <option value="Executive">Executive</option>
                      <option value="External">External</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <MdDescription className="inline mr-2" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300 backdrop-blur-sm resize-none"
                    placeholder="Enter document description..."
                    disabled={!canEdit()}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <MdPriorityHigh className="inline mr-2" />
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        handleInputChange("priority", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
                      disabled={!canEdit()}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
                      disabled={!canEdit()}
                    >
                      <option value="">Select Department</option>
                      <option value="Finance">Finance</option>
                      <option value="HR">HR</option>
                      <option value="Legal">Legal</option>
                      <option value="IT">IT</option>
                      <option value="Operations">Operations</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Executive">Executive</option>
                      <option value="External">External</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <MdTag className="inline mr-2" />
                    Tags
                  </label>
                  <div className="space-y-3">
                    {/* Existing Tags */}
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600/50 text-blue-200 border border-blue-400/30"
                          >
                            {tag}
                            {canEdit() && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-2 text-blue-300 hover:text-blue-100"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add New Tag */}
                    {canEdit() && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), handleAddTag())
                          }
                          placeholder="Add a tag..."
                          className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300 backdrop-blur-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <MdCancel className="inline mr-2" />
                    Cancel
                  </button>
                  {canEdit() && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <GradientSpinner size="sm" />
                      ) : (
                        <>
                          <MdSave className="inline mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Document Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Document Preview
                </h3>

                {/* Document Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <DocumentIcon size="md" variant="light" />
                    <div>
                      <p className="text-sm text-gray-300">Original File</p>
                      <p className="text-white font-medium">
                        {document.originalName}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300">File Size</p>
                      <p className="text-white">
                        {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300">Type</p>
                      <p className="text-white">{document.documentType}</p>
                    </div>
                    <div>
                      <p className="text-gray-300">Status</p>
                      <p className="text-white capitalize">{document.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-300">Reference</p>
                      <p className="text-white font-mono text-xs">
                        {document.reference}
                      </p>
                    </div>
                  </div>

                  {/* OCR Data Preview */}
                  {document.ocrData && document.ocrData.extractedText && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <h4 className="text-sm font-medium text-white mb-2">
                        OCR Extracted Text
                      </h4>
                      <div className="bg-black/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {document.ocrData.extractedText.substring(0, 200)}
                          {document.ocrData.extractedText.length > 200 && "..."}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Confidence:{" "}
                        {Math.round(document.ocrData.confidence * 100)}%
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4 border-t border-white/20">
                    <button
                      onClick={() =>
                        window.open(
                          `/api/documents/${document._id}/download`,
                          "_blank"
                        )
                      }
                      className="flex-1 px-3 py-2 bg-green-600/50 text-green-200 rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <MdDownload className="inline mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() =>
                        window.open(
                          `/api/documents/${document._id}/view`,
                          "_blank"
                        )
                      }
                      className="flex-1 px-3 py-2 bg-blue-600/50 text-blue-200 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <MdVisibility className="inline mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDocumentModal;
