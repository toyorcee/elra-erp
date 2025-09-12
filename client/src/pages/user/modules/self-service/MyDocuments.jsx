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
} from "react-icons/hi2";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import {
  getUserDocuments,
  getDocumentStatusColor,
} from "../../../../services/documents";
import { downloadDocumentPDF } from "../../../../utils/documentUtils";
import ELRALogo from "../../../../components/ELRALogo";

const MyDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  // Removed sortBy and sortOrder - now using automatic date sorting

  const [showProjectDocumentsModal, setShowProjectDocumentsModal] =
    useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const filterOptions = [
    { value: "all", label: "All Documents", icon: HiDocument },
    { value: "project", label: "Project Documents", icon: HiFolder },
    {
      value: "financial",
      label: "Financial Documents",
      icon: HiCurrencyDollar,
    },
    { value: "technical", label: "Technical Documents", icon: HiCog },
    { value: "legal", label: "Legal Documents", icon: HiDocument },
    { value: "hr", label: "HR Documents", icon: HiUserGroup },
    { value: "compliance", label: "Compliance Documents", icon: HiShieldCheck },
    { value: "other", label: "Other Documents", icon: HiDocument },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getUserDocuments();
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const groupDocumentsByProject = () => {
    const projectGroups = {};

    documents.forEach((doc) => {
      if (doc.project) {
        const projectId = doc.project.id || doc.project._id;
        if (!projectGroups[projectId]) {
          projectGroups[projectId] = {
            project: doc.project,
            documents: [],
            totalDocuments: 0,
            completedDocuments: 0,
            lastUpdated: doc.updatedAt,
          };
        }
        projectGroups[projectId].documents.push(doc);
        projectGroups[projectId].totalDocuments++;
        // Check for completed documents (approved status)
        if (doc.status === "approved" || doc.status === "APPROVED") {
          projectGroups[projectId].completedDocuments++;
        }
        if (
          new Date(doc.updatedAt) >
          new Date(projectGroups[projectId].lastUpdated)
        ) {
          projectGroups[projectId].lastUpdated = doc.updatedAt;
        }
      }
    });

    return Object.values(projectGroups);
  };

  // Get standalone documents (not associated with projects)
  const getStandaloneDocuments = () => {
    return documents.filter((doc) => !doc.project);
  };

  // Removed date search functionality - keeping it simple with text search only

  // Filter and sort data based on current filter with REAL-TIME search
  const getFilteredData = () => {
    let data = [];

    if (filterType === "all" || filterType === "project") {
      data = [...groupDocumentsByProject()];
    }

    if (filterType === "all" || filterType !== "project") {
      const standaloneDocs = getStandaloneDocuments();
      if (standaloneDocs.length > 0) {
        data.push({
          project: null,
          documents: standaloneDocs,
          totalDocuments: standaloneDocs.length,
          completedDocuments: standaloneDocs.filter(
            (d) => d.status === "approved" || d.status === "APPROVED"
          ).length,
          lastUpdated: standaloneDocs[0]?.updatedAt,
          isStandalone: true,
        });
      }
    }

    // Apply REAL-TIME search filter with enhanced search capabilities
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      data = data.filter((item) => {
        if (item.isStandalone) {
          return item.documents.some(
            (doc) =>
              // Document title and description
              doc.title?.toLowerCase().includes(searchLower) ||
              doc.description?.toLowerCase().includes(searchLower) ||
              // Document category and type
              doc.category?.toLowerCase().includes(searchLower) ||
              doc.documentType?.toLowerCase().includes(searchLower) ||
              // Document status
              doc.status?.toLowerCase().includes(searchLower) ||
              // File name matching
              doc.fileName?.toLowerCase().includes(searchLower) ||
              doc.originalFileName?.toLowerCase().includes(searchLower)
          );
        }

        // For project documents, search in multiple fields
        const projectMatch =
          item.project.name?.toLowerCase().includes(searchLower) ||
          item.project.code?.toLowerCase().includes(searchLower) ||
          item.project.category?.toLowerCase().includes(searchLower) ||
          item.project.status?.toLowerCase().includes(searchLower) ||
          item.project.budget?.toString().includes(searchLower) ||
          item.project.budget?.toLocaleString().includes(searchLower);

        const documentMatch = item.documents.some(
          (doc) =>
            doc.title?.toLowerCase().includes(searchLower) ||
            doc.description?.toLowerCase().includes(searchLower) ||
            doc.category?.toLowerCase().includes(searchLower) ||
            doc.documentType?.toLowerCase().includes(searchLower) ||
            doc.status?.toLowerCase().includes(searchLower) ||
            doc.fileName?.toLowerCase().includes(searchLower) ||
            doc.originalFileName?.toLowerCase().includes(searchLower)
        );

        return projectMatch || documentMatch;
      });
    }

    if (filterType !== "all") {
      data = data.filter((item) => {
        if (item.isStandalone) {
          return item.documents.some((doc) => doc.category === filterType);
        }
        return item.documents.some((doc) => doc.category === filterType);
      });
    }

    data.sort((a, b) => {
      const aValue = new Date(a.lastUpdated);
      const bValue = new Date(b.lastUpdated);
      return bValue - aValue; // Descending order (newest first)
    });

    return data;
  };

  const handleViewProjectDocuments = (projectData) => {
    setSelectedProject(projectData);
    setShowProjectDocumentsModal(true);
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

  const getProjectStatusColor = (projectData) => {
    const completionRate =
      projectData.completedDocuments / projectData.totalDocuments;
    if (completionRate === 1) return "bg-green-100 text-green-800";
    if (completionRate >= 0.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getProjectStatusText = (projectData) => {
    const completionRate =
      projectData.completedDocuments / projectData.totalDocuments;
    if (completionRate === 1) return "Complete";
    if (completionRate >= 0.5) return "In Progress";
    return "Pending";
  };

  const columns = [
    {
      key: "project",
      header: "Project",
      renderer: (projectData) => (
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
            {projectData.isStandalone ? (
              <HiDocument className="w-5 h-5 text-white" />
            ) : (
              <HiFolder className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {projectData.isStandalone
                ? "Standalone Documents"
                : projectData.project.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {projectData.isStandalone
                ? `${projectData.totalDocuments} document${
                    projectData.totalDocuments !== 1 ? "s" : ""
                  }`
                : `Code: ${
                    projectData.project.code
                  } • Budget: ₦${projectData.project.budget?.toLocaleString()}`}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectStatusColor(
                  projectData
                )}`}
              >
                {getProjectStatusText(projectData)}
              </span>
              <span className="text-xs text-gray-500">
                {projectData.completedDocuments}/{projectData.totalDocuments}{" "}
                docs
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "categories",
      header: "Classifications",
      renderer: (projectData) => {
        if (projectData.isStandalone) {
          const categories = [
            ...new Set(projectData.documents.map((d) => d.category)),
          ];
          return (
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {category}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{categories.length - 2}
                </span>
              )}
            </div>
          );
        }

        const categories = [
          ...new Set(projectData.documents.map((d) => d.category)),
        ];
        return (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {category}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{categories.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "updated",
      header: "Date Created",
      renderer: (projectData) => (
        <div className="text-sm text-gray-900">
          {new Date(projectData.lastUpdated).toLocaleDateString()}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-600 mt-1">
            Manage your documents and project files
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Upload functionality will be implemented later */}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Smart Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by project name, code, document title, category, or budget (e.g., 'Office Building', 'INF20250003', 'financial', '700000')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={() => {
              const filteredData = getFilteredData();
              const resultCount = filteredData.length;
              if (searchTerm.trim()) {
                toast.success(
                  `Found ${resultCount} result${
                    resultCount !== 1 ? "s" : ""
                  } for "${searchTerm}"`
                );
              } else {
                toast.info("Showing all documents");
              }
            }}
            className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 font-semibold cursor-pointer flex items-center space-x-2"
          >
            <HiDocument className="w-4 h-4" />
            <span>Search</span>
            {searchTerm.trim() && (
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                {getFilteredData().length}
              </span>
            )}
          </button>

          {/* Filter Dropdown (Simplified) */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>
            <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Search Help Text */}
        <div className="mt-3 text-xs text-gray-500">
          💡 <strong>Search Tips:</strong> You can search by project name,
          project code, document title, category, budget amount, or document
          status.
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
                <strong>{getFilteredData().length}</strong> total items
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

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          data={getFilteredData()}
          columns={columns}
          loading={loading}
          emptyMessage={
            searchTerm.trim()
              ? `No results found for "${searchTerm}"`
              : "No projects or documents found"
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
                    handleViewProjectDocuments(row);
                  }}
                  className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white rounded-lg transition-colors"
                  title="View Documents"
                >
                  <HiDocument className="w-4 h-4" />
                </button>
              </div>
            ),
          }}
        />
      </div>

      {/* Project Documents Modal */}
      {showProjectDocumentsModal && selectedProject && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[90vw] w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="dark" size="md" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedProject.isStandalone
                        ? "Standalone Documents"
                        : selectedProject.project.name}
                    </h2>
                    <p className="text-white text-opacity-80">
                      {selectedProject.isStandalone
                        ? `${selectedProject.totalDocuments} document${
                            selectedProject.totalDocuments !== 1 ? "s" : ""
                          }`
                        : `Project Code: ${
                            selectedProject.project.code
                          } • Budget: ₦${selectedProject.project.budget?.toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectDocumentsModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <HiXMark className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedProject.documents.map((document) => (
                  <div
                    key={document.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <HiDocument className="w-5 h-5 text-[var(--elra-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {document.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {document.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(
                                document.status
                              )}`}
                            >
                              {document.status.replace("_", " ").toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {document.category}
                            </span>
                            {document.project &&
                              document.status === "draft" && (
                                <span className="text-xs text-blue-600 font-medium">
                                  📄 Required Document
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadDocument(document.id)}
                          className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Download Document"
                        >
                          <HiArrowDownTray className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedProject.completedDocuments} of{" "}
                  {selectedProject.totalDocuments} documents completed
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowProjectDocumentsModal(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
