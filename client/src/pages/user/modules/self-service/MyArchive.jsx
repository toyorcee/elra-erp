import React, { useState, useEffect } from "react";
import {
  HiDocument,
  HiArrowDownTray,
  HiXMark,
  HiFolder,
  HiChevronDown,
  HiCurrencyDollar,
  HiCog,
  HiUserGroup,
  HiShieldCheck,
  HiPlus,
  HiTrash,
  HiArrowLeft,
  HiPencil,
  HiCloudArrowUp,
  HiClock,
} from "react-icons/hi2";
import { HiArchive } from "react-icons/hi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../../components/common/DataTable";
import SmartFileUpload from "../../../../components/common/SmartFileUpload";
import { useAuth } from "../../../../context/AuthContext";
import {
  getMyArchivedDocuments,
  getDocumentStatusColor,
  uploadToArchive,
  updateArchivedDocument,
  deleteArchivedDocument,
} from "../../../../services/documents";
import { downloadDocumentPDF } from "../../../../utils/documentUtils";
import ELRALogo from "../../../../components/ELRALogo";

const MyArchive = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [documentToUpdate, setDocumentToUpdate] = useState(null);

  // Calculate archive stats
  const getArchiveStats = () => {
    const total = documents.length;
    const byCategory = documents.reduce((acc, doc) => {
      const category = doc.archiveCategory || "other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      byCategory,
      recent: documents.filter((doc) => {
        const docDate = new Date(doc.archivedAt || doc.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return docDate > weekAgo;
      }).length,
    };
  };

  const filterOptions = [
    { value: "all", label: "All Archived", icon: HiArchive },
    { value: "project", label: "Project", icon: HiFolder },
    { value: "financial", label: "Financial", icon: HiCurrencyDollar },
    { value: "technical", label: "Technical", icon: HiCog },
    { value: "legal", label: "Legal", icon: HiDocument },
    { value: "hr", label: "HR", icon: HiUserGroup },
    { value: "compliance", label: "Compliance", icon: HiShieldCheck },
    { value: "contracts", label: "Contracts & Agreements", icon: HiDocument },
    { value: "reports", label: "Reports & Analytics", icon: HiDocument },
    { value: "presentations", label: "Presentations", icon: HiDocument },
    { value: "certificates", label: "Certificates & Awards", icon: HiDocument },
    { value: "training", label: "Training Materials", icon: HiDocument },
    { value: "personal", label: "Personal", icon: HiDocument },
    { value: "other", label: "Other", icon: HiDocument },
  ];

  useEffect(() => {
    fetchArchivedDocuments();
  }, []);

  useEffect(() => {
    fetchArchivedDocuments();
  }, [filterType, searchTerm]);

  const fetchArchivedDocuments = async () => {
    setLoading(true);
    try {
      const filters = {
        category: filterType !== "all" ? filterType : undefined,
        search: searchTerm || undefined,
      };
      const response = await getMyArchivedDocuments(filters);
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Error fetching archived documents:", error);
      toast.error("Failed to fetch archived documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      const document = documents.find(
        (doc) => doc.id === documentId || doc._id === documentId
      );
      if (document) {
        await downloadDocumentPDF(document);
        toast.success("Document downloaded successfully");
      } else {
        toast.error("Document not found");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleUploadToArchive = async (formData) => {
    setUploading(true);
    try {
      await uploadToArchive(formData);
      toast.success("Document uploaded to archive successfully");
      setShowUploadModal(false);
      setUploadFiles([]);
      fetchArchivedDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document to archive");
    } finally {
      setUploading(false);
    }
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setShowEditModal(true);
  };

  const handleDeleteDocumentClick = (document) => {
    setDocumentToDelete(document);
    setShowDeleteModal(true);
  };

  const handleUpdateDocument = async (documentId, updateData) => {
    try {
      await updateArchivedDocument(documentId, updateData);
      toast.success("Document updated successfully");
      setShowEditModal(false);
      setSelectedDocument(null);
      fetchArchivedDocuments();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update document");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await deleteArchivedDocument(documentId);
      toast.success("Document deleted successfully");
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      fetchArchivedDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  // Filter and sort data
  const getFilteredData = () => {
    let data = [...documents];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      data = data.filter(
        (doc) =>
          doc.title?.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.category?.toLowerCase().includes(searchLower) ||
          doc.documentType?.toLowerCase().includes(searchLower) ||
          doc.fileName?.toLowerCase().includes(searchLower) ||
          doc.originalFileName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filterType !== "all") {
      data = data.filter((doc) => doc.category === filterType);
    }

    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return data;
  };

  const columns = [
    {
      key: "document",
      header: "Document",
      width: "45%",
      renderer: (document) => (
        <div className="flex items-start space-x-3 min-w-0">
          <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center flex-shrink-0">
            <HiDocument className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-semibold text-gray-900 truncate"
              title={document.title}
            >
              {document.title.length > 15
                ? `${document.title.slice(0, 15)}...`
                : document.title}
            </h3>
            <p
              className="text-xs text-gray-500 mt-1 truncate"
              title={document.description}
            >
              {document.description && document.description.length > 20
                ? `${document.description.slice(0, 20)}...`
                : document.description}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 truncate">
                {document.archiveCategory || document.category}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "fileInfo",
      header: "File Information",
      width: "30%",
      renderer: (document) => (
        <div className="text-sm text-gray-900 min-w-0">
          <div
            className="font-medium truncate max-w-full"
            title={document.originalFileName}
          >
            {document.originalFileName.length > 10
              ? `${document.originalFileName.slice(0, 10)}...`
              : document.originalFileName}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {document.documentType?.toUpperCase()} •{" "}
            {Math.round(document.fileSize / 1024)} KB
          </div>
        </div>
      ),
    },
    {
      key: "archived",
      header: "Archived Date",
      width: "15%",
      renderer: (document) => (
        <div className="text-sm text-gray-900">
          {new Date(
            document.archivedAt || document.createdAt
          ).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const stats = getArchiveStats();

  return (
    <div className="space-y-6 p-6min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  navigate("/dashboard/modules/self-service/my-documents")
                }
                className="p-2 text-white hover:text-gray-200 transition-colors"
              >
                <HiArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">My Archive</h1>
                <p className="text-white text-opacity-80 mt-1">
                  All your archived documents for future reference
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-[var(--elra-primary)] px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2 font-semibold shadow-lg"
            >
              <HiPlus className="w-5 h-5" />
              <span>Add Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Archived
                </p>
                <p className="text-3xl font-bold text-[var(--elra-primary)] mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--elra-primary)] rounded-full flex items-center justify-center">
                <HiArchive className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Recent (7 days)
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.recent}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <HiClock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Categories</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {Object.keys(stats.byCategory).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <HiFolder className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="px-6 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <HiArchive className="w-3 h-3 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                About My Archive
              </h4>
              <p className="text-sm text-green-700">
                This page shows <strong>all your archived documents</strong>{" "}
                including project documents, personal uploads, and general files
                you've saved for future reference.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Documents
              </label>
              <input
                type="text"
                placeholder="Search by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {searchTerm.trim() ? (
              <span>
                Found <strong>{getFilteredData().length}</strong> result
                {getFilteredData().length !== 1 ? "s" : ""} for "
                <strong>{searchTerm}</strong>"
              </span>
            ) : (
              <span>
                <strong>{getFilteredData().length}</strong> archived documents
              </span>
            )}
          </div>
          {searchTerm.trim() && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] text-sm font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-3">
        <DataTable
          data={getFilteredData()}
          columns={columns}
          loading={loading}
          emptyMessage={
            searchTerm.trim()
              ? `No archived documents found for "${searchTerm}"`
              : "No archived documents found. Upload some documents to get started!"
          }
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
            customActions: (row) => (
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadDocument(row.id);
                  }}
                  className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                  title="Download Document"
                >
                  <HiArrowDownTray className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDocument(row);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                  title="Edit Document"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocumentClick(row);
                  }}
                  className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                  title="Delete Document"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            ),
          }}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadToArchiveModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadToArchive}
          uploading={uploading}
          files={uploadFiles}
          onFilesChange={setUploadFiles}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDocument && (
        <UploadToArchiveModal
          document={selectedDocument}
          isEdit={true}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
            setUploadFiles([]);
          }}
          onUpload={handleUpdateDocument}
          uploading={uploading}
          files={uploadFiles}
          onFilesChange={setUploadFiles}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && documentToDelete && (
        <DeleteConfirmationModal
          document={documentToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setDocumentToDelete(null);
          }}
          onConfirm={() => handleDeleteDocument(documentToDelete.id)}
        />
      )}
    </div>
  );
};

const UploadToArchiveModal = ({
  onClose,
  onUpload,
  uploading,
  files,
  onFilesChange,
  document = null,
  isEdit = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: document?.title || "",
    description: document?.description || "",
    archiveCategory: document?.archiveCategory || "other",
    customCategory:
      document?.archiveCategory === "other"
        ? document?.customCategory || ""
        : "",
    tags: document?.tags ? document.tags.join(", ") : "",
  });

  console.log("🔍 [UploadToArchiveModal] Modal state:", {
    isEdit,
    files: files.length,
    isSubmitting,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(
      "🔍 [UploadToArchiveModal] handleSubmit called, isEdit:",
      isEdit,
      "files.length:",
      files.length
    );

    if (!isEdit && files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setIsSubmitting(true);
    let uploadSuccess = false;

    try {
      if (isEdit) {
        console.log(
          "🔍 [UploadToArchiveModal] Updating archived document:",
          document.id
        );

        const updateData = new FormData();

        updateData.append("title", formData.title);
        updateData.append("description", formData.description);
        updateData.append("archiveCategory", formData.archiveCategory);
        if (formData.archiveCategory === "other" && formData.customCategory) {
          updateData.append("customCategory", formData.customCategory);
        }
        updateData.append("tags", formData.tags);

        if (files.length > 0) {
          updateData.append("document", file);
          console.log(
            "🔍 [UploadToArchiveModal] Including new file for replacement:",
            file.name
          );
        }

        console.log(
          "🔍 [UploadToArchiveModal] Sending update request with FormData"
        );
        await onUpload(document.id, updateData);
        uploadSuccess = true;
      } else {
        // For uploading new files - handle each file separately
        console.log("🔍 [UploadToArchiveModal] Files to upload:", files);

        for (const fileWrapper of files) {
          const file = fileWrapper.file || fileWrapper;
          console.log("🔍 [UploadToArchiveModal] Processing file:", file);

          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("title", formData.title || file.name);
          uploadData.append("description", formData.description);
          uploadData.append("archiveCategory", formData.archiveCategory);
          if (formData.archiveCategory === "other" && formData.customCategory) {
            uploadData.append("customCategory", formData.customCategory);
          }
          uploadData.append("tags", formData.tags);

          console.log("🔍 [UploadToArchiveModal] FormData contents:");
          for (let [key, value] of uploadData.entries()) {
            console.log(`  ${key}:`, value);
          }

          // Call the upload service directly
          console.log(
            "🔍 [UploadToArchiveModal] About to call uploadToArchive..."
          );
          try {
            const result = await uploadToArchive(uploadData);
            console.log("🔍 [UploadToArchiveModal] Upload successful:", result);
            uploadSuccess = true;
          } catch (error) {
            console.error("🔍 [UploadToArchiveModal] Upload failed:", error);
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("🔍 [UploadToArchiveModal] Upload failed:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsSubmitting(false);
      if (uploadSuccess) {
        toast.success("Document uploaded to archive successfully");
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ELRALogo className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEdit ? "Edit Document" : "Upload to Archive"}
                </h2>
                <p className="text-white text-opacity-80 text-sm">
                  {isEdit
                    ? "Update document details"
                    : "Save a document for future reference"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 flex-1 overflow-y-auto"
        >
          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isEdit ? "Current File & Upload New" : "Select Files"}{" "}
              <span className="text-red-500">*</span>
            </label>

            {/* Show current file info when editing */}
            {isEdit && document && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
                    <HiDocument className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {document.originalFileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {document.documentType?.toUpperCase()} •{" "}
                      {Math.round(document.fileSize / 1024)} KB
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Upload a new file below to replace the current one
                </p>
              </div>
            )}

            <SmartFileUpload
              files={files}
              onFilesChange={onFilesChange}
              maxFiles={5}
              className="border border-gray-300 rounded-lg p-4"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              placeholder="Enter document title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              placeholder="Enter document description"
              rows={3}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.archiveCategory}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  archiveCategory: e.target.value,
                  customCategory:
                    e.target.value === "other" ? prev.customCategory : "",
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              <option value="project">Project</option>
              <option value="financial">Financial</option>
              <option value="technical">Technical</option>
              <option value="legal">Legal</option>
              <option value="hr">HR</option>
              <option value="compliance">Compliance</option>
              <option value="contracts">Contracts & Agreements</option>
              <option value="reports">Reports & Analytics</option>
              <option value="presentations">Presentations</option>
              <option value="certificates">Certificates & Awards</option>
              <option value="training">Training Materials</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Custom Category Input (only if "Other" is selected) */}
          {formData.archiveCategory === "other" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customCategory}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customCategory: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                placeholder="e.g., Research Papers, Meeting Minutes"
                required
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              placeholder="e.g., important, reference, personal"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isEdit && files.length === 0)}
              onClick={() =>
                console.log(
                  "🔍 [UploadToArchiveModal] Submit button clicked, isSubmitting:",
                  isSubmitting,
                  "files.length:",
                  files.length,
                  "isEdit:",
                  isEdit
                )
              }
              className="bg-[var(--elra-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEdit ? "Updating..." : "Uploading..."}</span>
                </>
              ) : (
                <>
                  <HiCloudArrowUp className="w-4 h-4" />
                  <span>
                    {isEdit ? "Update Document" : "Upload to Archive"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ document, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <HiTrash className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Delete Document</h2>
                <p className="text-white text-opacity-80 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <HiDocument className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {document.title}
              </h3>
              <p className="text-sm text-gray-500">
                {document.description || "No description provided"}
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this document? This action cannot be
            undone and the document will be permanently removed from your
            archive.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <HiTrash className="w-4 h-4" />
              <span>Delete Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyArchive;
