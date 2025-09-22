import React, { useState, useEffect } from "react";
import {
  HiDocument,
  HiArrowDownTray,
  HiXMark,
  HiFolder,
  HiChartBar,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { HiArchive } from "react-icons/hi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import {
  getUserDocuments,
  getDocumentStatusColor,
  archiveDocument,
} from "../../../../services/documents";
import { downloadDocumentPDF } from "../../../../utils/documentUtils";
import ELRALogo from "../../../../components/ELRALogo";

const MyDocuments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showProjectDocumentsModal, setShowProjectDocumentsModal] =
    useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

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

  const getStandaloneDocuments = () => {
    return documents.filter((doc) => !doc.project);
  };

  const getFilteredData = () => {
    let data = [];

    data = [...groupDocumentsByProject()];

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

    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      data = data.filter((item) => {
        if (item.isStandalone) {
          return item.documents.some(
            (doc) =>
              doc.title?.toLowerCase().includes(searchLower) ||
              doc.description?.toLowerCase().includes(searchLower) ||
              doc.category?.toLowerCase().includes(searchLower) ||
              doc.documentType?.toLowerCase().includes(searchLower) ||
              doc.status?.toLowerCase().includes(searchLower) ||
              doc.fileName?.toLowerCase().includes(searchLower) ||
              doc.originalFileName?.toLowerCase().includes(searchLower)
          );
        }

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

    data.sort((a, b) => {
      const aValue = new Date(a.lastUpdated);
      const bValue = new Date(b.lastUpdated);
      return bValue - aValue;
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

  const handleArchiveDocument = async (documentId) => {
    try {
      await archiveDocument(documentId);
      toast.success("Document archived successfully");
      fetchDocuments();
    } catch (error) {
      console.error("Archive error:", error);
      toast.error("Failed to archive document");
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

  // Calculate statistics
  const getDocumentStats = () => {
    const totalDocuments = documents.length;
    const approvedDocuments = documents.filter(
      (doc) => doc.status === "approved" || doc.status === "APPROVED"
    ).length;
    const pendingDocuments = documents.filter(
      (doc) => doc.status === "pending" || doc.status === "PENDING"
    ).length;
    const rejectedDocuments = documents.filter(
      (doc) => doc.status === "rejected" || doc.status === "REJECTED"
    ).length;

    const projectGroups = groupDocumentsByProject();
    const totalProjects = Object.keys(projectGroups).length;

    return {
      totalDocuments,
      approvedDocuments,
      pendingDocuments,
      rejectedDocuments,
      totalProjects,
      completionRate:
        totalDocuments > 0
          ? Math.round((approvedDocuments / totalDocuments) * 100)
          : 0,
    };
  };

  const stats = getDocumentStats();

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
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Documents</h1>
            <p className="text-white text-opacity-90 text-lg">
              Documents from your personal projects and active files
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() =>
                navigate("/dashboard/modules/self-service/my-archive")
              }
              className="bg-white text-[var(--elra-primary)] px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center space-x-3 font-semibold shadow-lg border border-white border-opacity-20"
            >
              <HiArchive className="w-5 h-5" />
              <span>View Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Documents */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Documents
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalDocuments}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <HiDocument className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              Across {stats.totalProjects} projects
            </span>
          </div>
        </div>

        {/* Approved Documents */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.approvedDocuments}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {stats.completionRate}% completion rate
            </span>
          </div>
        </div>

        {/* Pending Documents */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pendingDocuments}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <HiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Awaiting review</span>
          </div>
        </div>

        {/* Rejected Documents */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.rejectedDocuments}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <HiExclamationTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Need attention</span>
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <HiDocument className="w-3 h-3 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              About My Documents
            </h4>
            <p className="text-sm text-blue-700">
              This page shows documents from your{" "}
              <strong>personal projects</strong> and active files. For archived
              documents and general file storage, visit your{" "}
              <strong>Archive</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          {/* Smart Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by project name, code, document title, category, or budget..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent focus:bg-white transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <HiDocument className="w-5 h-5 text-gray-400" />
              </div>
            </div>
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
            className="bg-[var(--elra-primary)] text-white px-8 py-4 rounded-xl hover:bg-[var(--elra-primary-dark)] transition-all duration-300 font-semibold cursor-pointer flex items-center space-x-3 shadow-lg hover:shadow-xl"
          >
            <HiChartBar className="w-5 h-5" />
            <span>Search</span>
            {searchTerm.trim() && (
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-bold">
                {getFilteredData().length}
              </span>
            )}
          </button>
        </div>

        {/* Search Help Text */}
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Search Tips
              </p>
              <p className="text-sm text-blue-700">
                You can search by project name, project code, document title,
                category, budget amount, or document status.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Results Count */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
                <HiFolder className="w-4 h-4 text-white" />
              </div>
              <div>
                {searchTerm.trim() ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Found{" "}
                      <span className="text-[var(--elra-primary)] font-bold">
                        {getFilteredData().length}
                      </span>{" "}
                      result
                      {getFilteredData().length !== 1 ? "s" : ""} for "
                      <span className="text-[var(--elra-primary)] font-semibold">
                        {searchTerm}
                      </span>
                      "
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Search results</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-[var(--elra-primary)] font-bold">
                        {getFilteredData().length}
                      </span>{" "}
                      total projects
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      All your document projects
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {searchTerm.trim() && (
            <button
              onClick={() => setSearchTerm("")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <HiXMark className="w-4 h-4" />
              <span>Clear search</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Projects Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <DataTable
          data={getFilteredData()}
          columns={columns}
          loading={loading}
          emptyMessage={
            searchTerm.trim()
              ? `No results found for "${searchTerm}"`
              : "No projects or documents found"
          }
          emptyStateComponent={
            !searchTerm.trim() && getFilteredData().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <HiDocument className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Documents Yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You haven't uploaded any documents to your projects yet. Start
                  by creating a project or uploading documents to existing
                  projects.
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() =>
                      (window.location.href =
                        "/dashboard/modules/self-service/my-archive")
                    }
                    className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center space-x-2"
                  >
                    <HiArchive className="w-4 h-4" />
                    <span>View Archive</span>
                  </button>
                </div>
              </div>
            ) : null
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
                  className="p-3 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                  title="View Documents"
                >
                  <HiDocument className="w-5 h-5" />
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
                        <button
                          onClick={() => handleArchiveDocument(document.id)}
                          className="p-2 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Archive Document"
                        >
                          <HiArchive className="w-4 h-4" />
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
