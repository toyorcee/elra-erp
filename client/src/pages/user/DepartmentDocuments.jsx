import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  canViewDocuments,
  canEditDocuments,
  canDeleteDocuments,
  canApproveDocuments,
  canShareDocuments,
  canExportDocuments,
  canArchiveDocuments,
  canScanDocuments,
  canUploadDocuments,
} from "../../constants/userRoles";
import {
  MdSearch,
  MdFilterList,
  MdDownload,
  MdVisibility,
  MdMoreVert,
  MdRefresh,
  MdCheckCircle,
  MdError,
  MdPending,
  MdTableChart,
  MdScanner,
  MdCloudUpload,
  MdFolder,
  MdDescription,
  MdSecurity,
  MdStar,
  MdAccessTime,
  MdLabel,
  MdList,
  MdTrendingUp,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import DocumentScanning from "../../components/DocumentScanning";
import EditDocumentModal from "../../components/EditDocumentModal";
import { Link } from "react-router-dom";
import DocumentIcon from "../../components/DocumentIcon";
import { deleteDocument, searchDocuments } from "../../services/documents";
import { handleDocumentAction } from "../../utils/fileUtils";

const DepartmentDocuments = () => {
  const { user } = useAuth();

  // Permission checks
  const hasViewPermission = canViewDocuments(user);
  const hasEditPermission = canEditDocuments(user);
  const hasDeletePermission = canDeleteDocuments(user);
  const hasApprovePermission = canApproveDocuments(user);
  const hasSharePermission = canShareDocuments(user);
  const hasExportPermission = canExportDocuments(user);
  const hasArchivePermission = canArchiveDocuments(user);
  const hasScanPermission = canScanDocuments(user);
  const hasUploadPermission = canUploadDocuments(user);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
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
  const [viewMode, setViewMode] = useState("grid");
  const [showScanning, setShowScanning] = useState(false);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    document: null,
  });

  const departmentConfig = {
    CLAIMS: {
      name: "Claims Department",
      icon: MdDescription,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      accentColor: "blue",
      description: "Manage claims processing and documentation",
      categories: [
        "Claims Reports",
        "Insurance Policies",
        "Damage Assessments",
        "Settlement Documents",
      ],
    },
    UNDERWRITE: {
      name: "Underwriting Department",
      icon: MdSecurity,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
      accentColor: "purple",
      description: "Handle underwriting processes and risk assessment",
      categories: [
        "Risk Assessments",
        "Policy Underwriting",
        "Financial Analysis",
        "Compliance Reports",
      ],
    },
    FINANCE: {
      name: "Finance Department",
      icon: MdTrendingUp,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      accentColor: "green",
      description: "Manage financial documents and reports",
      categories: [
        "Financial Reports",
        "Budget Documents",
        "Audit Reports",
        "Tax Documents",
      ],
    },
    COMPLIANCE: {
      name: "Compliance Department",
      icon: MdSecurity,
      color: "from-red-500 to-orange-500",
      bgColor: "from-red-50 to-orange-50",
      accentColor: "red",
      description: "Ensure regulatory compliance and audit trails",
      categories: [
        "Compliance Reports",
        "Audit Documents",
        "Regulatory Filings",
        "Policy Documents",
      ],
    },
    HR: {
      name: "HR Department",
      icon: MdDescription,
      color: "from-indigo-500 to-purple-500",
      bgColor: "from-indigo-50 to-purple-50",
      accentColor: "indigo",
      description: "Manage human resources documentation",
      categories: [
        "Employee Records",
        "HR Policies",
        "Performance Reviews",
        "Training Materials",
      ],
    },
    IT: {
      name: "IT Department",
      icon: MdTableChart,
      color: "from-cyan-500 to-blue-500",
      bgColor: "from-cyan-50 to-blue-50",
      accentColor: "cyan",
      description: "Handle IT infrastructure and system documentation",
      categories: [
        "System Documentation",
        "Network Configs",
        "Security Protocols",
        "Technical Reports",
      ],
    },
    REGIONAL: {
      name: "Regional Operations",
      icon: MdFolder,
      color: "from-amber-500 to-orange-500",
      bgColor: "from-amber-50 to-orange-50",
      accentColor: "amber",
      description: "Manage regional operations and documentation",
      categories: [
        "Regional Reports",
        "Field Operations",
        "Local Policies",
        "Regional Data",
      ],
    },
    EXECUTIVE: {
      name: "Executive Management",
      icon: MdStar,
      color: "from-gray-600 to-gray-800",
      bgColor: "from-gray-50 to-gray-100",
      accentColor: "gray",
      description: "Executive-level documents and strategic planning",
      categories: [
        "Strategic Plans",
        "Executive Reports",
        "Board Documents",
        "Policy Decisions",
      ],
    },
  };

  const currentDept = departmentConfig[user?.department?.code] || {
    name: "Documents",
    icon: MdFolder,
    color: "from-gray-500 to-gray-700",
    bgColor: "from-gray-50 to-gray-100",
    accentColor: "gray",
    description: "Manage and organize your documents efficiently",
    categories: ["General Documents", "Reports", "Policies", "Other"],
  };

  const DeptIcon = currentDept.icon;

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
      user?.department?.code,
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
        department: user?.department?.code || undefined,
      };
      return searchDocuments(params);
    },
    enabled: !!user?.department?.code,
  });

  const documents = documentsData?.data?.documents || [];
  const totalDocuments = documentsData?.data?.total || 0;
  const totalPages = Math.ceil(totalDocuments / itemsPerPage);

  // Statistics
  const stats = useMemo(() => {
    if (!documents.length)
      return { total: 0, pending: 0, approved: 0, rejected: 0 };

    return documents.reduce(
      (acc, doc) => {
        acc.total++;
        if (doc.status === "pending") acc.pending++;
        else if (doc.status === "approved") acc.approved++;
        else if (doc.status === "rejected") acc.rejected++;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [documents]);

  const handleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map((doc) => doc._id));
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        delete: { ...prev.delete, [documentId]: true },
      }));
      await deleteDocument(documentId);
      toast.success("Document deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        delete: { ...prev.delete, [documentId]: false },
      }));
    }
  };

  const handleDownloadDocument = async (documentId, fileUrl, filename) => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        download: { ...prev.download, [documentId]: true },
      }));
      await handleDocumentAction("download", fileUrl, filename);
      toast.success("Document downloaded successfully");
    } catch (error) {
      toast.error("Failed to download document");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        download: { ...prev.download, [documentId]: false },
      }));
    }
  };

  const handleViewDocument = async (documentId, fileUrl) => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        view: { ...prev.view, [documentId]: true },
      }));
      await handleDocumentAction("view", fileUrl);
    } catch (error) {
      toast.error("Failed to view document");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        view: { ...prev.view, [documentId]: false },
      }));
    }
  };

  const handleEditDocument = (document) => {
    setEditModal({ isOpen: true, document });
  };

  const handleCloseEditModal = () => {
    setEditModal({ isOpen: false, document: null });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        icon: MdPending,
      },
      approved: {
        color: "text-green-600",
        bg: "bg-green-100",
        icon: MdCheckCircle,
      },
      rejected: { color: "text-red-600", bg: "bg-red-100", icon: MdError },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPriorityColor = (priority) => {
    const priorityMap = {
      low: "text-gray-600 bg-gray-100",
      medium: "text-blue-600 bg-blue-100",
      high: "text-orange-600 bg-orange-100",
      urgent: "text-red-600 bg-red-100",
    };
    return priorityMap[priority] || priorityMap.medium;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setSortBy("uploadedAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg mb-4 w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Documents
            </h2>
            <p className="text-gray-600 mb-6">
              Failed to load your documents. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${currentDept.color} text-white shadow-lg`}
              >
                <DeptIcon size={28} />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {currentDept.name} Documents
                </h1>
                <p className="text-gray-600 mt-1">{currentDept.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasScanPermission && (
                <button
                  onClick={() => setShowScanning(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2"
                >
                  <MdScanner size={20} />
                  Scan Document
                </button>
              )}
              {hasUploadPermission && (
                <Link
                  to="/dashboard/upload"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center gap-2"
                >
                  <MdCloudUpload size={20} />
                  Upload
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Documents
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <MdFolder size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <MdPending size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.approved}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <MdCheckCircle size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white">
                <MdError size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MdSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <MdFilterList size={20} />
                Filters
              </button>
              <button
                onClick={() => refetch()}
                className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <MdRefresh size={20} />
              </button>
              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <MdTableChart size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <MdList size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                    >
                      <option value="all">All Categories</option>
                      {currentDept.categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split("-");
                        setSortBy(field);
                        setSortOrder(order);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                    >
                      <option value="uploadedAt-desc">Newest First</option>
                      <option value="uploadedAt-asc">Oldest First</option>
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="size-desc">Largest First</option>
                      <option value="size-asc">Smallest First</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Documents Display */}
        {documents.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-12 border border-white/20 shadow-xl text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Documents Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ||
              selectedCategory !== "all" ||
              selectedStatus !== "all" ||
              selectedPriority !== "all"
                ? "Try adjusting your search criteria or filters."
                : "Get started by uploading your first document."}
            </p>
            <div className="flex justify-center gap-3">
              {hasUploadPermission && (
                <Link
                  to="/dashboard/upload"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
                >
                  Upload Document
                </Link>
              )}
              {hasScanPermission && (
                <button
                  onClick={() => setShowScanning(true)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Scan Document
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map((document, index) => (
              <motion.div
                key={document._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <DocumentIcon type={document.fileType} size={48} />
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(document._id)}
                        onChange={() => handleSelectDoc(document._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {document.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MdAccessTime size={16} />
                      {formatDate(document.uploadedAt)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MdLabel size={16} />
                      {formatFileSize(document.fileSize)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusInfo(document.status).bg
                      } ${getStatusInfo(document.status).color}`}
                    >
                      {document.status}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        document.priority
                      )}`}
                    >
                      {document.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          handleViewDocument(document._id, document.fileUrl)
                        }
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <MdVisibility size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadDocument(
                            document._id,
                            document.fileUrl,
                            document.name
                          )
                        }
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <MdDownload size={18} />
                      </button>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => handleEditDocument(document)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="More"
                      >
                        <MdMoreVert size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modals */}
        <DocumentScanning
          isOpen={showScanning}
          onClose={() => setShowScanning(false)}
          onSuccess={() => {
            setShowScanning(false);
            refetch();
          }}
        />

        <EditDocumentModal
          isOpen={editModal.isOpen}
          document={editModal.document}
          onClose={handleCloseEditModal}
          onSuccess={() => {
            handleCloseEditModal();
            refetch();
          }}
        />
      </div>
    </div>
  );
};

export default DepartmentDocuments;
