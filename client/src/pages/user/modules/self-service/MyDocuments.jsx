import React, { useState, useEffect, useRef } from "react";
import {
  HiDocument,
  HiDocumentText,
  HiArrowDownTray,
  HiEye,
  HiTrash,
  HiPlus,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiArrowUpTray,
  HiDocumentMagnifyingGlass,
  HiArchiveBox,
  HiChartBar,
  HiMagnifyingGlass,
  HiXMark,
  HiCloudArrowUp,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import {
  uploadDocument,
  getUserDocuments,
  getDocumentStats,
  getDocumentStatusColor,
  formatFileSize,
  getFileIcon,
  canUserApproveDocument,
  approveDocument,
  rejectDocument,
} from "../../../../services/documents";

const MyDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    name: "",
    description: "",
    category: "other",
    tags: "",
    isPublic: false,
  });
  const fileInputRef = useRef(null);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "contracts", label: "Contracts" },
    { value: "policies", label: "Policies" },
    { value: "forms", label: "Forms" },
    { value: "reports", label: "Reports" },
    { value: "certificates", label: "Certificates" },
    { value: "other", label: "Other" },
  ];

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active", color: "text-green-600" },
    { value: "expired", label: "Expired", color: "text-red-600" },
    { value: "pending", label: "Pending", color: "text-yellow-600" },
    { value: "draft", label: "Draft", color: "text-gray-600" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "updatedAt", label: "Last Updated" },
    { value: "name", label: "Document Name" },
    { value: "category", label: "Category" },
    { value: "status", label: "Status" },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getUserDocuments({
        category: filters.category !== "all" ? filters.category : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
      });

      setDocuments(response.data || []);
      toast.success("Documents loaded successfully");
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error(error.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50";
      case "expired":
        return "text-red-600 bg-red-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "draft":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "contracts":
        return "text-blue-600";
      case "policies":
        return "text-purple-600";
      case "forms":
        return "text-orange-600";
      case "reports":
        return "text-green-600";
      case "certificates":
        return "text-indigo-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (size) => {
    return size;
  };

  const columns = [
    {
      header: "Document",
      accessor: "name",
      cell: (document) => (
        <div>
          <div className="font-medium text-gray-900">{document.name}</div>
          <div className="text-sm text-gray-500">{document.description}</div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      cell: (document) => (
        <span
          className={`text-sm font-medium ${getCategoryColor(
            document.category
          )}`}
        >
          {categories.find((c) => c.value === document.category)?.label ||
            document.category}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (document) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            document.status
          )}`}
        >
          {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
        </span>
      ),
    },
    {
      header: "File Info",
      accessor: "fileInfo",
      cell: (document) => (
        <div>
          <div className="text-sm text-gray-900">{document.fileType}</div>
          <div className="text-xs text-gray-500">
            {formatFileSize(document.fileSize)}
          </div>
        </div>
      ),
    },
    {
      header: "Updated",
      accessor: "updatedAt",
      cell: (document) => (
        <div className="text-sm text-gray-500">
          {formatDate(document.updatedAt)}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (document) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDocument(document.id)}
            className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] p-1 rounded hover:bg-gray-100 cursor-pointer"
            title="View Document"
          >
            <HiEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadDocument(document.id)}
            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-gray-100 cursor-pointer"
            title="Download Document"
          >
            <HiArrowDownTray className="w-4 h-4" />
          </button>
          {document.status === "draft" && (
            <button
              onClick={() => handleDeleteDocument(document.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-100 cursor-pointer"
              title="Delete Document"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleViewDocument = (documentId) => {
    // TODO: Implement document view
    toast.info(`Viewing document #${documentId}`);
  };

  const handleDownloadDocument = (documentId) => {
    // TODO: Implement document download
    toast.info(`Downloading document #${documentId}`);
  };

  const handleDeleteDocument = (documentId) => {
    // TODO: Implement document deletion
    toast.info(`Deleting document #${documentId}`);
  };

  // Upload and Scan Functions
  const handleFileSelect = (file) => {
    if (file && file.size > 50 * 1024 * 1024) {
      // 50MB limit
      toast.error("File size must be less than 50MB");
      return;
    }
    setSelectedFile(file);
    if (file && !uploadFormData.name) {
      setUploadFormData((prev) => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!uploadFormData.name.trim()) {
      toast.error("Document name is required");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("title", uploadFormData.name);
      formData.append("description", uploadFormData.description);
      formData.append("category", uploadFormData.category);
      formData.append("tags", uploadFormData.tags);
      formData.append("isPublic", uploadFormData.isPublic);
      formData.append("priority", "Medium");
      formData.append("documentType", "GENERAL");

      const response = await uploadDocument(formData);

      toast.success(response.message || "Document uploaded successfully!");
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadFormData({
        name: "",
        description: "",
        category: "other",
        tags: "",
        isPublic: false,
      });
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      // TODO: Implement actual scan API call
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate scanning

      toast.success("Document scanned and processed successfully!");
      setShowScanModal(false);
      fetchDocuments(); // Refresh the list
    } catch (error) {
      toast.error("Failed to scan document");
    } finally {
      setScanning(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadFormData({
      name: "",
      description: "",
      category: "other",
      tags: "",
      isPublic: false,
    });
    setDragActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-600 mt-1">
              View and manage your personal documents with OCR processing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center"
            >
              <HiArrowUpTray className="w-4 h-4 mr-2" />
              Upload Document
            </button>
            <button
              onClick={() => setShowScanModal(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <HiDocumentMagnifyingGlass className="w-4 h-4 mr-2" />
              Scan Document
            </button>
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <HiClock
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Documents
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.length}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <HiDocument className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {documents.filter((doc) => doc.status === "active").length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <HiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {documents.filter((doc) => doc.status === "pending").length}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <HiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-red-600">
                {documents.filter((doc) => doc.status === "expired").length}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <HiExclamationTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Filter Documents
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              My Documents
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
                found
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
            <span className="ml-2 text-gray-600">
              Loading your documents...
            </span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <HiDocument className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Documents Found
            </h3>
            <p className="text-gray-600">You don't have any documents yet.</p>
          </div>
        ) : (
          <DataTable
            data={documents}
            columns={columns}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            sortOptions={sortOptions}
          />
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Upload Document
                </h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiXMark className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* File Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] bg-opacity-5"
                      : selectedFile
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div>
                      <HiCloudArrowUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <HiCloudArrowUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop your file here, or{" "}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, JPG, PNG up to 50MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileSelect(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>

              {/* Document Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadFormData.name}
                    onChange={(e) =>
                      setUploadFormData({
                        ...uploadFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                    placeholder="Enter document name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadFormData.category}
                    onChange={(e) =>
                      setUploadFormData({
                        ...uploadFormData,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) =>
                    setUploadFormData({
                      ...uploadFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  placeholder="Enter document description"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={uploadFormData.tags}
                  onChange={(e) =>
                    setUploadFormData({
                      ...uploadFormData,
                      tags: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadFormData.isPublic}
                  onChange={(e) =>
                    setUploadFormData({
                      ...uploadFormData,
                      isPublic: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                />
                <label
                  htmlFor="isPublic"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Make this document public (visible to all users)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  "Upload Document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Document Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Scan Document
                </h2>
                <button
                  onClick={() => setShowScanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiXMark className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center">
                <HiDocumentMagnifyingGlass className="h-16 w-16 text-[var(--elra-primary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Document Scanning
                </h3>
                <p className="text-gray-600 mb-6">
                  This feature will scan physical documents and convert them to
                  digital format with OCR processing.
                </p>

                {scanning ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
                    <p className="text-sm text-gray-600">
                      Scanning document...
                    </p>
                    <p className="text-xs text-gray-500">
                      This may take a few moments
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Please ensure your scanner is connected and ready.
                    </p>
                    <button
                      onClick={handleScan}
                      className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center mx-auto"
                    >
                      <HiDocumentMagnifyingGlass className="h-5 w-5 mr-2" />
                      Start Scanning
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
