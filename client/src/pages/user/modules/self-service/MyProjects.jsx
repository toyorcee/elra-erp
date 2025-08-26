import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { fetchMyProjects } from "../../../../services/projectAPI";
import { formatCurrency } from "../../../../utils/formatters";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  WrenchIcon,
  ChartBarIcon,
  CodeBracketIcon,
  CogIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const MyProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching projects...");
        const response = await fetchMyProjects();
        console.log("Projects response:", response);

        if (
          response &&
          response.success &&
          response.data &&
          response.data.projects
        ) {
          console.log("Found", response.data.projects.length, "projects");
          setProjects(response.data.projects);
        } else {
          console.log("No projects found or invalid response:", response);
          setProjects([]);
        }
      } catch (err) {
        console.error("Error loading projects:", err);
        setError("Failed to load projects: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    // Just call the API - backend handles authentication
    loadProjects();
  }, []);

  // Filter projects based on search and filters
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || project.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case "active":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircleIcon className="w-4 h-4" />,
          label: "Active",
        };
      case "completed":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <CheckCircleIcon className="w-4 h-4" />,
          label: "Completed",
        };
      case "pending_approval":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <ClockIcon className="w-4 h-4" />,
          label: "Pending Approval",
        };
      case "on_hold":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <ExclamationTriangleIcon className="w-4 h-4" />,
          label: "On Hold",
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircleIcon className="w-4 h-4" />,
          label: "Cancelled",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <ClockIcon className="w-4 h-4" />,
          label: status?.replace("_", " ").toUpperCase() || "Unknown",
        };
    }
  };

  const projectCategories = [
    "equipment_lease",
    "vehicle_lease",
    "property_lease",
    "financial_lease",
    "training_equipment_lease",
    "compliance_lease",
    "service_equipment_lease",
    "strategic_lease",
    "software_development",
    "system_maintenance",
    "consulting",
    "training",
    "other",
  ];

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case "equipment_lease":
        return <WrenchScrewdriverIcon className="w-5 h-5" />;
      case "vehicle_lease":
        return <TruckIcon className="w-5 h-5" />;
      case "property_lease":
        return <BuildingOfficeIcon className="w-5 h-5" />;
      case "financial_lease":
        return <CurrencyDollarIcon className="w-5 h-5" />;
      case "training_equipment_lease":
        return <AcademicCapIcon className="w-5 h-5" />;
      case "compliance_lease":
        return <ShieldCheckIcon className="w-5 h-5" />;
      case "service_equipment_lease":
        return <WrenchIcon className="w-5 h-5" />;
      case "strategic_lease":
        return <ChartBarIcon className="w-5 h-5" />;
      case "software_development":
        return <CodeBracketIcon className="w-5 h-5" />;
      case "system_maintenance":
        return <CogIcon className="w-5 h-5" />;
      case "consulting":
        return <UserGroupIcon className="w-5 h-5" />;
      case "training":
        return <AcademicCapIcon className="w-5 h-5" />;
      case "other":
        return <FolderIcon className="w-5 h-5" />;
      default:
        return <FolderIcon className="w-5 h-5" />;
    }
  };

  // Calculate project progress based on documents and workflow
  const calculateProgress = (project) => {
    // Use the project's built-in progress if available
    if (project.progress !== undefined) {
      return project.progress;
    }

    // Calculate based on required documents
    if (project.requiredDocuments && project.requiredDocuments.length > 0) {
      const submittedDocs = project.requiredDocuments.filter(
        (doc) => doc.isSubmitted
      ).length;
      return Math.round(
        (submittedDocs / project.requiredDocuments.length) * 100
      );
    }

    return 0;
  };

  // Get approval status
  const getApprovalStatus = (project) => {
    if (!project.approvalChain || project.approvalChain.length === 0) {
      return {
        status: "no_approval",
        label: "No Approval Required",
        color: "bg-gray-100 text-gray-800",
      };
    }

    const pendingApprovals = project.approvalChain.filter(
      (approval) => approval.status === "pending"
    );
    const approvedCount = project.approvalChain.filter(
      (approval) => approval.status === "approved"
    ).length;
    const totalCount = project.approvalChain.length;

    if (pendingApprovals.length === 0) {
      return {
        status: "approved",
        label: "Fully Approved",
        color: "bg-green-100 text-green-800",
      };
    } else if (approvedCount > 0) {
      return {
        status: "partial",
        label: `${approvedCount}/${totalCount} Approved`,
        color: "bg-yellow-100 text-yellow-800",
      };
    } else {
      return {
        status: "pending",
        label: `${pendingApprovals.length} Pending`,
        color: "bg-orange-100 text-orange-800",
      };
    }
  };

  // Get document status
  const getDocumentStatus = (project) => {
    if (!project.requiredDocuments || project.requiredDocuments.length === 0) {
      return { submitted: 0, total: 0, percentage: 0 };
    }

    const submitted = project.requiredDocuments.filter(
      (doc) => doc.isSubmitted
    ).length;
    const total = project.requiredDocuments.length;
    const percentage = Math.round((submitted / total) * 100);

    return { submitted, total, percentage };
  };

  // Handle view project
  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  // Close view modal
  const closeViewModal = () => {
    setSelectedProject(null);
    setShowViewModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded-full mb-2"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Debug info
  console.log("Current state:", {
    loading,
    error,
    projects: projects.length,
    user: user?._id,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Projects
              </h1>
              <p className="text-gray-600">
                Manage and track your personal projects
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchMyProjects()
                    .then((response) => {
                      if (
                        response &&
                        response.success &&
                        response.data &&
                        response.data.projects
                      ) {
                        setProjects(response.data.projects);
                      } else {
                        setProjects([]);
                      }
                    })
                    .catch((err) => {
                      setError("Failed to refresh projects: " + err.message);
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }}
                className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white px-4 py-2 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold flex items-center space-x-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Active</p>
                  <p className="text-2xl font-bold text-white">
                    {projects.filter((p) => p.status === "active").length}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {projects.filter((p) => p.status === "completed").length}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Pending</p>
                  <p className="text-2xl font-bold text-white">
                    {
                      projects.filter((p) => p.status === "pending_approval")
                        .length
                    }
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Total</p>
                  <p className="text-2xl font-bold text-white">
                    {projects.length}
                  </p>
                </div>
                <FolderIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-300"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <FolderIcon className="w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-300"
              >
                <option value="all">All Categories</option>
                {projectCategories.map((category) => (
                  <option key={category} value={category}>
                    {category
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchMyProjects()
                  .then((response) => {
                    if (
                      response &&
                      response.success &&
                      response.data &&
                      response.data.projects
                    ) {
                      setProjects(response.data.projects);
                    } else {
                      setProjects([]);
                    }
                  })
                  .catch((err) => {
                    setError("Failed to refresh projects: " + err.message);
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
              className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Projects
            </h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Projects Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "No projects match your current filters."
                : "You haven't created any projects yet."}
            </p>
            <p className="text-sm text-gray-500">
              Projects you create will appear here for easy access and
              management.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const statusInfo = getStatusInfo(project.status);
              const progress = calculateProgress(project);

              return (
                <div
                  key={project._id}
                  className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-[var(--elra-primary)]/20 hover:border-[var(--elra-primary)]/40 overflow-hidden group backdrop-blur-sm"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-lg flex items-center justify-center text-white">
                          {getCategoryIcon(project.category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-[var(--elra-primary)] transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {project.code}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color} flex items-center space-x-1`}
                      >
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {project.description || "No description available"}
                    </p>

                    {/* Progress & Status Section */}
                    <div className="mb-4 space-y-3">
                      {/* Overall Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">
                            Overall Progress
                          </span>
                          <span className="font-medium text-gray-900">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Document Progress */}
                      {(() => {
                        const docStatus = getDocumentStatus(project);
                        return (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">Documents</span>
                              <span className="font-medium text-gray-900">
                                {docStatus.submitted}/{docStatus.total}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${docStatus.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Approval Status */}
                      {(() => {
                        const approvalStatus = getApprovalStatus(project);
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Approval
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${approvalStatus.color}`}
                            >
                              {approvalStatus.label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900">
                          {project.duration || 0} days
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Documents:</span>
                        <span className="font-medium text-gray-900">
                          {getDocumentStatus(project).submitted}/
                          {getDocumentStatus(project).total}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Phase:</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {project.workflowPhase || "planning"}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600">Priority:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : project.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {project.priority?.toUpperCase() || "MEDIUM"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium text-gray-900">
                          {project.department?.name || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleViewProject(project)}
                        className="flex items-center space-x-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project View Modal */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl flex items-center justify-center text-white">
                    {getCategoryIcon(selectedProject.category)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedProject.name}
                    </h2>
                    <p className="text-gray-600">{selectedProject.code}</p>
                  </div>
                </div>
                <button
                  onClick={closeViewModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Project Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Project Overview
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedProject.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        Timeline
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Start:</span>{" "}
                      {new Date(selectedProject.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">End:</span>{" "}
                      {new Date(selectedProject.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Duration:</span>{" "}
                      {selectedProject.duration || 0} days
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">Budget</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(selectedProject.budget)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Actual Cost:</span>{" "}
                      {formatCurrency(selectedProject.actualCost || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Variance:</span>{" "}
                      {formatCurrency(selectedProject.budgetVariance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Progress */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Status & Progress
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">Status</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getStatusInfo(selectedProject.status).color
                      }`}
                    >
                      {getStatusInfo(selectedProject.status).label}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <ChartBarIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        Progress
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${calculateProgress(selectedProject)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {calculateProgress(selectedProject)}% Complete
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        Documents
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {getDocumentStatus(selectedProject).submitted}/
                      {getDocumentStatus(selectedProject).total}
                    </p>
                    <p className="text-sm text-gray-600">Documents Submitted</p>
                  </div>
                </div>
              </div>

              {/* Required Documents */}
              {selectedProject.requiredDocuments &&
                selectedProject.requiredDocuments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Required Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProject.requiredDocuments.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                doc.isSubmitted ? "bg-green-500" : "bg-gray-300"
                              }`}
                            ></div>
                            <span className="text-sm font-medium text-gray-900">
                              {doc.documentType
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              doc.isSubmitted
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {doc.isSubmitted ? "Submitted" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Approval Chain */}
              {selectedProject.approvalChain &&
                selectedProject.approvalChain.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Approval Status
                    </h3>
                    <div className="space-y-3">
                      {selectedProject.approvalChain.map((approval, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                approval.status === "approved"
                                  ? "bg-green-500"
                                  : approval.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }`}
                            ></div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {approval.level} Approval
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              approval.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : approval.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {approval.status.charAt(0).toUpperCase() +
                              approval.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Project Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Project Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {selectedProject.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedProject.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : selectedProject.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedProject.priority?.toUpperCase() || "MEDIUM"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-gray-900">
                        {selectedProject.department?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span className="font-medium text-gray-900">
                        {selectedProject.createdBy?.fullName ||
                          selectedProject.createdBy?.firstName +
                            " " +
                            selectedProject.createdBy?.lastName ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Workflow Phase:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {selectedProject.workflowPhase || "planning"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Workflow Step:</span>
                      <span className="font-medium text-gray-900">
                        {selectedProject.workflowStep || 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Team Members:</span>
                      <span className="font-medium text-gray-900">
                        {selectedProject.teamMembers?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(
                          selectedProject.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeViewModal}
                className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
