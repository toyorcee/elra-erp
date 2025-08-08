import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  MdArchive,
  MdSearch,
  MdFilterList,
  MdDownload,
  MdVisibility,
  MdRefresh,
  MdRestore,
  MdDelete,
  MdFolder,
  MdDescription,
  MdSecurity,
  MdStar,
  MdAccessTime,
  MdLabel,
} from "react-icons/md";
import { searchDocuments, deleteDocument } from "../services/documents";
import { toast } from "react-toastify";

const DocumentArchive = ({ context = "user" }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("archived");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("archivedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // RBAC permissions
  const canRestore = user?.role?.permissions?.includes("document.restore");
  const canDelete = user?.role?.permissions?.includes("document.delete");
  const canViewAll = user?.role?.permissions?.includes("document.view_all");
  const isSuperAdmin = user?.role?.level >= 100;

  // Department-specific configuration
  const departmentConfig = {
    CLAIMS: {
      name: "Claims Department",
      icon: MdDescription,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
    },
    UNDERWRITE: {
      name: "Underwriting Department",
      icon: MdSecurity,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
    },
    FINANCE: {
      name: "Finance Department",
      icon: MdStar,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
    },
    IT: {
      name: "IT Department",
      icon: MdFolder,
      color: "from-cyan-500 to-blue-500",
      bgColor: "from-cyan-50 to-blue-50",
    },
  };

  const currentDept = departmentConfig[user?.department?.code] || {
    name: "Archive",
    icon: MdArchive,
    color: "from-gray-500 to-gray-700",
    bgColor: "from-gray-50 to-gray-100",
  };

  const DeptIcon = currentDept.icon;

  const {
    data: documentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "archived-documents",
      searchTerm,
      selectedStatus,
      selectedCategory,
      sortBy,
      sortOrder,
      user?.department?.code,
    ],
    queryFn: () => {
      const params = {
        page: 1,
        limit: 50,
        q: searchTerm,
        status: selectedStatus,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        sortBy,
        sortOrder,
        department: canViewAll ? undefined : user?.department?.code,
        archived: true,
      };
      return searchDocuments(params);
    },
    enabled: !!user?.department?.code || canViewAll,
  });

  const documents = documentsData?.data?.documents || [];

  const handleRestore = async (documentId) => {
    try {
      // For now, just show a message since restoreDocument doesn't exist
      toast.info("Restore functionality will be implemented soon");
      // TODO: Implement restoreDocument API call
      // await restoreDocument(documentId);
      // toast.success("Document restored successfully");
      // refetch();
    } catch (error) {
      toast.error("Failed to restore document");
    }
  };

  const handleDelete = async (documentId) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this document?"
      )
    ) {
      try {
        await deleteDocument(documentId);
        toast.success("Document deleted permanently");
        refetch();
      } catch (error) {
        toast.error("Failed to delete document");
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg mb-4 w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl bg-gradient-to-r ${currentDept.color} text-white shadow-lg`}
            >
              <DeptIcon size={28} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Document Archive
              </h1>
              <p className="text-gray-600 mt-1">
                {canViewAll
                  ? "All archived documents"
                  : `${currentDept.name} archived documents`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
                  placeholder="Search archived documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              >
                <option value="all">All Categories</option>
                <option value="reports">Reports</option>
                <option value="policies">Policies</option>
                <option value="contracts">Contracts</option>
                <option value="other">Other</option>
              </select>
              <button
                onClick={() => refetch()}
                className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <MdRefresh size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-12 border border-white/20 shadow-xl text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Archived Documents
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "No documents match your search criteria."
                : "No documents have been archived yet."}
            </p>
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
                      <MdArchive className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Archived
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {document.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MdAccessTime size={16} />
                      {formatDate(document.archivedAt || document.uploadedAt)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MdLabel size={16} />
                      {formatFileSize(document.fileSize)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        onClick={() => window.open(document.fileUrl, "_blank")}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <MdVisibility size={18} />
                      </button>
                      <button
                        onClick={() => window.open(document.fileUrl, "_blank")}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <MdDownload size={18} />
                      </button>
                    </div>

                    <div className="flex gap-1">
                      {canRestore && (
                        <button
                          onClick={() => handleRestore(document._id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Restore"
                        >
                          <MdRestore size={18} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(document._id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Permanently"
                        >
                          <MdDelete size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentArchive;
