import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdFilterList,
  MdAdd,
  MdDownload,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdMoreVert,
  MdSort,
  MdRefresh,
  MdFileDownload,
  MdShare,
  MdLock,
  MdPublic,
  MdSchedule,
  MdCheckCircle,
  MdError,
  MdPending,
  MdArchive,
  MdPictureAsPdf,
  MdTableChart,
  MdScanner,
} from "react-icons/md";
import DocumentScanning from "../../components/DocumentScanning";
import EditDocumentModal from "../../components/EditDocumentModal";
import { Link, useLocation } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import DocumentIcon from "../../components/DocumentIcon";
import GradientSpinner from "../../components/common/GradientSpinner";
import {
  getDocuments,
  deleteDocument,
  searchDocuments,
  getDocumentById,
} from "../../services/documents";
import {
  downloadAsPDF,
  downloadAsCSV,
  handleDocumentAction,
} from "../../utils/fileUtils";

const Documents = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    view: {},
    download: {},
    viewPdf: {},
    viewCsv: {},
    edit: {},
    delete: {},
  });
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [showScanning, setShowScanning] = useState(false);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    document: null,
  });

  const handleSelectDoc = (id) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const {
    data: documentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "documents",
      searchTerm,
      selectedCategory,
      selectedStatus,
      selectedPriority,
      sortBy,
      sortOrder,
      currentPage,
    ],
    queryFn: () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        q: searchTerm,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        priority: selectedPriority !== "all" ? selectedPriority : undefined,
        sortBy,
        sortOrder,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      return searchDocuments(params).then((res) => res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  const documents = Array.isArray(documentsData?.data?.documents)
    ? documentsData.data.documents
    : [];
  const totalDocuments =
    documentsData?.data?.pagination?.total || documentsData?.total || 0;
  const totalPages = Math.ceil(totalDocuments / itemsPerPage);

  const handleSelectAll = () => {
    if (selectedDocs.length === documents.length) setSelectedDocs([]);
    else setSelectedDocs(documents.map((doc) => doc._id));
  };

  const selectedDocuments = documents.filter((doc) =>
    selectedDocs.includes(doc._id)
  );

  // Filter options
  const categories = [
    "Finance",
    "HR",
    "Legal",
    "IT",
    "Operations",
    "Marketing",
    "Sales",
    "Executive",
    "General",
  ];

  const statuses = [
    {
      value: "draft",
      label: "Draft",
      icon: MdSchedule,
      color: "text-gray-300",
    },
    {
      value: "pending",
      label: "Pending",
      icon: MdPending,
      color: "text-yellow-300",
    },
    {
      value: "approved",
      label: "Approved",
      icon: MdCheckCircle,
      color: "text-green-300",
    },
    {
      value: "rejected",
      label: "Rejected",
      icon: MdError,
      color: "text-red-300",
    },
    {
      value: "archived",
      label: "Archived",
      icon: MdArchive,
      color: "text-gray-400",
    },
  ];

  const priorities = [
    { value: "low", label: "Low", color: "text-green-300" },
    { value: "medium", label: "Medium", color: "text-yellow-300" },
    { value: "high", label: "High", color: "text-orange-300" },
    { value: "critical", label: "Critical", color: "text-red-300" },
  ];

  // Handle document deletion
  const handleDeleteDocument = async (documentId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      // Set loading state for this specific document
      setLoadingStates((prev) => ({
        ...prev,
        delete: { ...prev.delete, [documentId]: true },
      }));

      try {
        await deleteDocument(documentId);
        toast.success("Document deleted successfully");
        refetch();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to delete document"
        );
      } finally {
        // Clear loading state
        setLoadingStates((prev) => ({
          ...prev,
          delete: { ...prev.delete, [documentId]: false },
        }));
      }
    }
  };

  const handleDownloadDocument = async (documentId, fileUrl, filename) => {
    // Set loading state for this specific document
    setLoadingStates((prev) => ({
      ...prev,
      download: { ...prev.download, [documentId]: true },
    }));

    try {
      // Simulate a small delay to show the spinner
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        download: { ...prev.download, [documentId]: false },
      }));
    }
  };

  const handleViewDocument = async (documentId, fileUrl) => {
    setLoadingStates((prev) => ({
      ...prev,
      view: { ...prev.view, [documentId]: true },
    }));

    try {
      console.log("Logging document view for:", documentId);
      const response = await getDocumentById(documentId);
      console.log("Document view logged successfully");

      const documentData = response.data.data;
      console.log("Document data", documentData);
      const updatedFileUrl = documentData.fileUrl || fileUrl;

      console.log("Opening document with URL:", updatedFileUrl);
      window.open(updatedFileUrl, "_blank");
    } catch (error) {
      console.error("Error logging document view:", error);
      window.open(fileUrl, "_blank");
    } finally {
      // Clear loading state
      setLoadingStates((prev) => ({
        ...prev,
        view: { ...prev.view, [documentId]: false },
      }));
    }
  };

  const handleViewAsPDF = async (document) => {
    // Set loading state for this specific document
    setLoadingStates((prev) => ({
      ...prev,
      viewPdf: { ...prev.viewPdf, [document._id]: true },
    }));

    try {
      await handleDocumentAction(document, "view-pdf");
      toast.success("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      // Clear loading state
      setLoadingStates((prev) => ({
        ...prev,
        viewPdf: { ...prev.viewPdf, [document._id]: false },
      }));
    }
  };

  const handleViewAsCSV = async (document) => {
    // Set loading state for this specific document
    setLoadingStates((prev) => ({
      ...prev,
      viewCsv: { ...prev.viewCsv, [document._id]: true },
    }));

    try {
      await handleDocumentAction(document, "view-csv");
      toast.success("CSV generated successfully");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV");
    } finally {
      // Clear loading state
      setLoadingStates((prev) => ({
        ...prev,
        viewCsv: { ...prev.viewCsv, [document._id]: false },
      }));
    }
  };

  const handleEditDocument = (document) => {
    setEditModal({
      isOpen: true,
      document: document,
    });
  };

  const handleCloseEditModal = () => {
    setEditModal({
      isOpen: false,
      document: null,
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    return statuses.find((s) => s.value === status) || statuses[0];
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    return (
      priorities.find((p) => p.value === priority)?.color || "text-gray-300"
    );
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setSortBy("uploadedAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    selectedPriority !== "all";

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6">
        <div className="bg-red-900/50 border border-red-300/30 rounded-lg p-6 text-center">
          <MdError className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Error Loading Documents
          </h3>
          <p className="text-red-200 mb-4">
            {error.message || "Failed to load documents"}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <MdRefresh className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4 sm:py-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            Documents
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage and organize your documents efficiently
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Link
            to={
              location.pathname.includes("/admin")
                ? "/admin/upload"
                : "/dashboard/upload"
            }
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl cursor-pointer text-sm sm:text-base font-medium"
          >
            <MdAdd className="mr-1 sm:mr-2 text-sm sm:text-base" />
            <span className="hidden sm:inline">Upload Document</span>
            <span className="sm:hidden">Upload</span>
          </Link>

          <button
            onClick={() => setShowScanning(true)}
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl cursor-pointer text-sm sm:text-base font-medium"
          >
            <MdScanner className="mr-1 sm:mr-2 text-sm sm:text-base" />
            <span className="hidden sm:inline">Scan Document</span>
            <span className="sm:hidden">Scan</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-xl border border-white/30 p-4 sm:p-6 mb-4 sm:mb-6 hover:shadow-2xl hover:bg-white/90 transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-900 placeholder-gray-500 backdrop-blur-sm text-sm sm:text-base"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-200/50 rounded-lg bg-gray-50/50 overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                }`}
                title="Table view"
              >
                <MdSort className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`px-3 py-2 text-sm transition-all duration-200 ${
                  viewMode === "card"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                }`}
                title="Card view"
              >
                <MdMoreVert className="w-4 h-4" />
              </button>
            </div>

            {/* PDF Export Button (Pear Green) */}
            <button
              onClick={async () =>
                selectedDocuments.length > 0 &&
                (await downloadAsPDF(selectedDocuments))
              }
              className="inline-flex items-center px-2 sm:px-3 py-2 border border-green-400 text-green-100 bg-green-700/70 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 cursor-pointer text-xs sm:text-sm"
              title="Export selected as PDF"
            >
              <MdFileDownload className="mr-1 sm:mr-2 text-sm sm:text-base" />{" "}
              PDF
            </button>
            {/* CSV Export Button (Salmon) */}
            <button
              onClick={() =>
                selectedDocuments.length > 0 && downloadAsCSV(selectedDocuments)
              }
              className="inline-flex items-center px-2 sm:px-3 py-2 border border-rose-400 text-rose-100 bg-rose-600/70 rounded-lg hover:bg-rose-500 hover:text-white transition-all duration-200 cursor-pointer text-xs sm:text-sm"
              title="Export selected as CSV"
            >
              <MdFileDownload className="mr-1 sm:mr-2 text-sm sm:text-base" />{" "}
              CSV
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border rounded-lg transition-all duration-200 ${
                showFilters
                  ? "border-blue-400 text-blue-600 bg-blue-100"
                  : "border-gray-200 text-black hover:border-gray-300 hover:bg-gray-50 bg-white/80"
              }`}
            >
              <MdFilterList className="mr-2" />
              Filters
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-black hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 bg-white/80"
            >
              <MdRefresh className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
                >
                  <option value="all">All Priorities</option>
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
                >
                  <option value="uploadedAt-desc">Newest First</option>
                  <option value="uploadedAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="priority-desc">Priority High-Low</option>
                  <option value="priority-asc">Priority Low-High</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {isLoading
            ? "Loading..."
            : `${totalDocuments} document${
                totalDocuments !== 1 ? "s" : ""
              } found`}
        </p>
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <MdFilterList />
            Filters applied
          </div>
        )}
      </div>

      {/* Documents Display */}
      {isLoading ? (
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl hover:bg-white/90 transition-all duration-300">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 bg-gray-200 rounded w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : documents.length > 0 ? (
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-xl border border-white/30 overflow-hidden hover:shadow-2xl hover:bg-white/90 transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 sm:py-3">
                        <input
                          type="checkbox"
                          checked={
                            selectedDocs.length === documents.length &&
                            documents.length > 0
                          }
                          onChange={handleSelectAll}
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                        Category
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Priority
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Size
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Uploaded
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/30 divide-y divide-gray-200/50">
                    {documents.map((document) => {
                      const statusInfo = getStatusInfo(document.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <tr
                          key={document._id}
                          className="hover:bg-white/10 transition-colors"
                        >
                          <td className="px-2 sm:px-3 py-3 sm:py-4">
                            <input
                              type="checkbox"
                              checked={selectedDocs.includes(document._id)}
                              onChange={() => handleSelectDoc(document._id)}
                              className="w-3 h-3 sm:w-4 sm:h-4"
                            />
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <DocumentIcon
                                size="sm"
                                variant="light"
                                className="mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-white flex items-center">
                                  {document.title}
                                  {document.isConfidential && (
                                    <MdLock
                                      className="ml-2 text-yellow-300"
                                      size={16}
                                    />
                                  )}
                                </div>
                                <div className="text-sm text-gray-300">
                                  {document.documentType} •{" "}
                                  {document.uploadedBy?.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-300/30">
                              {document.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <StatusIcon
                                className={`mr-2 ${statusInfo.color}`}
                                size={16}
                              />
                              <span
                                className={`text-sm font-medium ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <span
                              className={`text-sm font-medium ${getPriorityColor(
                                document.priority
                              )}`}
                            >
                              {document.priority.charAt(0).toUpperCase() +
                                document.priority.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden lg:table-cell">
                            {formatFileSize(document.fileSize)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden lg:table-cell">
                            {formatDate(document.uploadedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {/* View Original */}
                              <button
                                onClick={() =>
                                  handleViewDocument(
                                    document._id,
                                    document.fileUrl
                                  )
                                }
                                disabled={loadingStates.view[document._id]}
                                className="text-blue-300 hover:text-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="View original document"
                              >
                                {loadingStates.view[document._id] ? (
                                  <GradientSpinner
                                    size="sm"
                                    variant="primary"
                                  />
                                ) : (
                                  <MdVisibility size={18} />
                                )}
                              </button>

                              {/* View as PDF */}
                              <button
                                onClick={() => handleViewAsPDF(document)}
                                disabled={loadingStates.viewPdf[document._id]}
                                className="text-red-300 hover:text-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="View as PDF"
                              >
                                {loadingStates.viewPdf[document._id] ? (
                                  <GradientSpinner size="sm" variant="error" />
                                ) : (
                                  <MdPictureAsPdf size={18} />
                                )}
                              </button>

                              {/* View as CSV */}
                              <button
                                onClick={() => handleViewAsCSV(document)}
                                disabled={loadingStates.viewCsv[document._id]}
                                className="text-green-300 hover:text-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="View as CSV"
                              >
                                {loadingStates.viewCsv[document._id] ? (
                                  <GradientSpinner
                                    size="sm"
                                    variant="success"
                                  />
                                ) : (
                                  <MdTableChart size={18} />
                                )}
                              </button>

                              {/* Download Original */}
                              <button
                                onClick={() =>
                                  handleDownloadDocument(
                                    document._id,
                                    document.fileUrl,
                                    document.originalName || document.filename
                                  )
                                }
                                disabled={loadingStates.download[document._id]}
                                className="text-purple-300 hover:text-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="Download original document"
                              >
                                {loadingStates.download[document._id] ? (
                                  <GradientSpinner size="sm" variant="purple" />
                                ) : (
                                  <MdDownload size={18} />
                                )}
                              </button>

                              {/* Edit */}
                              {document.status !== "approved" &&
                                document.status !== "finalized" && (
                                  <button
                                    onClick={() => handleEditDocument(document)}
                                    className="text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer"
                                    title="Edit document"
                                  >
                                    <MdEdit size={18} />
                                  </button>
                                )}

                              {/* Delete */}
                              <button
                                onClick={() =>
                                  handleDeleteDocument(document._id)
                                }
                                disabled={loadingStates.delete[document._id]}
                                className="text-red-300 hover:text-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="Delete document"
                              >
                                {loadingStates.delete[document._id] ? (
                                  <GradientSpinner size="sm" variant="error" />
                                ) : (
                                  <MdDelete size={18} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Card View */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map((document) => {
                const statusInfo = getStatusInfo(document.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={document._id}
                    className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl hover:bg-white/90 transition-all duration-300 group"
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-200/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(document._id)}
                            onChange={() => handleSelectDoc(document._id)}
                            className="w-4 h-4 mr-3 flex-shrink-0"
                          />
                          <DocumentIcon
                            size="sm"
                            variant="light"
                            className="mr-3 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate flex items-center">
                              {document.title}
                              {document.isConfidential && (
                                <MdLock
                                  className="ml-2 text-yellow-300 flex-shrink-0"
                                  size={14}
                                />
                              )}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">
                              {document.documentType} •{" "}
                              {document.uploadedBy?.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status and Category */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <StatusIcon
                            className={`mr-1 ${statusInfo.color}`}
                            size={14}
                          />
                          <span
                            className={`text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-300/30">
                          {document.category}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-2">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Priority:</span>{" "}
                        <span className={getPriorityColor(document.priority)}>
                          {document.priority.charAt(0).toUpperCase() +
                            document.priority.slice(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Size:</span>{" "}
                        {formatFileSize(document.fileSize)}
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Uploaded:</span>{" "}
                        {formatDate(document.uploadedAt)}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 border-t border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {/* View Original */}
                          <button
                            onClick={() =>
                              handleViewDocument(document._id, document.fileUrl)
                            }
                            disabled={loadingStates.view[document._id]}
                            className="p-1.5 text-blue-300 hover:text-blue-200 hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View original document"
                          >
                            {loadingStates.view[document._id] ? (
                              <GradientSpinner size="sm" variant="primary" />
                            ) : (
                              <MdVisibility size={16} />
                            )}
                          </button>

                          {/* View as PDF */}
                          <button
                            onClick={() => handleViewAsPDF(document)}
                            disabled={loadingStates.viewPdf[document._id]}
                            className="p-1.5 text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View as PDF"
                          >
                            {loadingStates.viewPdf[document._id] ? (
                              <GradientSpinner size="sm" variant="error" />
                            ) : (
                              <MdPictureAsPdf size={16} />
                            )}
                          </button>

                          {/* View as CSV */}
                          <button
                            onClick={() => handleViewAsCSV(document)}
                            disabled={loadingStates.viewCsv[document._id]}
                            className="p-1.5 text-green-300 hover:text-green-200 hover:bg-green-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View as CSV"
                          >
                            {loadingStates.viewCsv[document._id] ? (
                              <GradientSpinner size="sm" variant="success" />
                            ) : (
                              <MdTableChart size={16} />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center space-x-1">
                          {/* Download Original */}
                          <button
                            onClick={() =>
                              handleDownloadDocument(
                                document._id,
                                document.fileUrl,
                                document.originalName || document.filename
                              )
                            }
                            disabled={loadingStates.download[document._id]}
                            className="p-1.5 text-purple-300 hover:text-purple-200 hover:bg-purple-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download original document"
                          >
                            {loadingStates.download[document._id] ? (
                              <GradientSpinner size="sm" variant="purple" />
                            ) : (
                              <MdDownload size={16} />
                            )}
                          </button>

                          {/* Edit */}
                          {document.status !== "approved" &&
                            document.status !== "finalized" && (
                              <Link
                                to={`/dashboard/documents/edit/${document._id}`}
                                className="p-1.5 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-900/30 rounded transition-colors"
                                title="Edit document"
                              >
                                <MdEdit size={16} />
                              </Link>
                            )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteDocument(document._id)}
                            disabled={loadingStates.delete[document._id]}
                            className="p-1.5 text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete document"
                          >
                            {loadingStates.delete[document._id] ? (
                              <GradientSpinner size="sm" variant="error" />
                            ) : (
                              <MdDelete size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-xl border border-white/30 p-8 text-center hover:shadow-2xl hover:bg-white/90 transition-all duration-300">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <DocumentIcon size="lg" variant="light" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">
            No documents found
          </h3>
          <p className="text-black mb-6">
            {hasActiveFilters
              ? "No documents match your current filters. Try adjusting your search criteria."
              : "You haven't uploaded any documents yet. Start by uploading your first document."}
          </p>
          {!hasActiveFilters && (
            <Link
              to="/dashboard/upload"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-medium"
            >
              <MdAdd className="mr-2" />
              Upload Document
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-200">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalDocuments)} of{" "}
            {totalDocuments} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-white/30 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === pageNum
                      ? "border-blue-400 text-blue-200 bg-blue-900/30"
                      : "border-white/30 text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-white/30 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Document Scanning Modal */}
      {showScanning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6 border-b border-white/20 bg-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  Document Scanning & OCR
                </h2>
                <button
                  onClick={() => setShowScanning(false)}
                  className="text-gray-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <DocumentScanning
                context={
                  location.pathname.includes("/admin") ? "admin" : "user"
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      <EditDocumentModal
        document={editModal.document}
        isOpen={editModal.isOpen}
        onClose={handleCloseEditModal}
        onSuccess={() => {
          refetch();
        }}
        userPermissions={[]} // This should come from user context
        userRole="user" // This should come from user context
      />
    </div>
  );
};

export default Documents;
