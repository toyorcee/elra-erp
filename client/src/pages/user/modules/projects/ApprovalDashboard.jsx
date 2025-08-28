import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockSolid,
  InformationCircleIcon,
  ExclamationCircleIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPendingProjectApprovals,
  approveProject,
  rejectProject,
} from "../../../../services/projectAPI.js";
import { getProjectDocuments } from "../../../../services/documents.js";
import { formatCurrency } from "../../../../utils/formatters.js";
import DataTable from "../../../../components/common/DataTable";

const ApprovalDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Approval confirmation modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionComments, setRejectionComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Document viewing states
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [projectDocuments, setProjectDocuments] = useState({});
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    loadPendingProjectApprovals();
  }, []);

  const loadPendingProjectApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetchPendingProjectApprovals();
      if (response.success) {
        setProjects(response.data);

        // Calculate stats
        const stats = {
          total: response.data.length,
          pending: response.data.filter((p) => p.status === "pending_approval")
            .length,
          approved: response.data.filter((p) => p.status === "approved").length,
          rejected: response.data.filter((p) => p.status === "rejected").length,
        };
        setStats(stats);
      } else {
        toast.error("Failed to load pending project approvals");
      }
    } catch (error) {
      console.error("Error loading project approvals:", error);
      toast.error("Error loading pending project approvals");
    } finally {
      setLoading(false);
    }
  };

  // Handle approval action with confirmation
  const handleApprovalClick = (project) => {
    setSelectedProject(project);
    setApprovalComments("");
    setShowApprovalModal(true);
  };

  const handleRejectionClick = (project) => {
    setSelectedProject(project);
    setRejectionComments("");
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const handleViewDocuments = async (project) => {
    try {
      setLoadingDocuments(true);
      setSelectedProject(project);

      const response = await getProjectDocuments(project._id);
      if (response.success) {
        setProjectDocuments((prev) => ({
          ...prev,
          [project._id]: response.data.documents,
        }));
        setShowDocumentsModal(true);
      }
    } catch (error) {
      toast.error("Failed to load project documents");
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleApprovalAction = async (projectId, action, comments = "") => {
    setActionLoading((prev) => ({ ...prev, [projectId]: true }));

    try {
      const nextApprovalStep = selectedProject?.approvalChain?.find(
        (step) => step.status === "pending"
      );

      if (!nextApprovalStep) {
        throw new Error("No pending approval step found");
      }

      const approvalData = {
        level: nextApprovalStep.level,
        comments: comments,
        ...(action === "reject" && {
          rejectionReason: comments.split(": ")[0],
        }),
      };

      let response;
      if (action === "approve") {
        response = await approveProject(projectId, approvalData);
      } else {
        response = await rejectProject(projectId, approvalData);
      }

      if (response.success) {
        toast.success(
          `Project ${
            action === "approve" ? "approved" : "rejected"
          } successfully`
        );
        loadPendingProjectApprovals();

        // Close modals
        setShowApprovalModal(false);
        setShowRejectionModal(false);
        setSelectedProject(null);
      } else {
        if (response.data && response.data.missing) {
          toast.error(
            `Cannot approve project. ${response.data.missing} required document(s) still need to be submitted.`
          );
        } else {
          throw new Error(response.message || `Failed to ${action} project`);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing project approval:`, error);
      toast.error(error.message || `Error ${action}ing project approval`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const getCurrentApprovalLevel = (project) => {
    if (!project.approvalChain || project.approvalChain.length === 0) {
      return "No approval chain";
    }

    const currentStep = project.approvalChain.find(
      (step) => step.status === "pending"
    );
    if (!currentStep) {
      return "All levels completed";
    }

    const levelMap = {
      hod: "HOD Approval",
      department: "Department Approval",
      finance: "Finance Approval",
      executive: "Executive Approval",
    };

    return levelMap[currentStep.level] || currentStep.level;
  };

  // Get approval progress for project approval chain
  const getApprovalProgress = (project) => {
    if (!project.approvalChain || project.approvalChain.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const total = project.approvalChain.length;
    const completed = project.approvalChain.filter(
      (step) => step.status === "approved" || step.status === "skipped"
    ).length;

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  };

  // Get approval status color
  const getApprovalStatusColor = (project) => {
    const progress = getApprovalProgress(project);

    if (progress.percentage === 100) return "bg-green-100 text-green-800";
    if (progress.percentage >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  // Get document submission status
  const getDocumentStatus = (project) => {
    if (!project.requiredDocuments || project.requiredDocuments.length === 0) {
      return { submitted: 0, total: 0, percentage: 0 };
    }

    const total = project.requiredDocuments.length;
    const submitted = project.requiredDocuments.filter(
      (doc) => doc.isSubmitted
    ).length;

    return {
      submitted,
      total,
      percentage: Math.round((submitted / total) * 100),
    };
  };

  // Avatar handling functions
  const getDefaultAvatar = (user = null) => {
    if (user && user.firstName && user.lastName) {
      const firstName = user.firstName.charAt(0).toUpperCase();
      const lastName = user.lastName.charAt(0).toUpperCase();
      return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=6366f1&color=fff&size=40&rounded=true`;
    }
    return "https://ui-avatars.com/api/?name=Unknown+User&background=6366f1&color=fff&size=40&rounded=true";
  };

  const getImageUrl = (avatarPath, user = null) => {
    if (!avatarPath) return getDefaultAvatar(user);

    let path = avatarPath;
    if (typeof avatarPath === "object" && avatarPath.url) {
      path = avatarPath.url;
    }

    if (path.startsWith("http")) return path;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");

    return `${baseUrl}${path}`;
  };

  const getAvatarDisplay = (user) => {
    if (user && user.avatar) {
      return (
        <img
          src={getImageUrl(user.avatar, user)}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-bold text-sm">
        {user?.firstName?.[0]}
        {user?.lastName?.[0]}
      </div>
    );
  };

  const columns = [
    {
      header: "Project",
      accessor: "name",
      renderer: (project) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 break-words leading-tight">
              {project.name}
            </div>
            <div className="text-sm text-gray-500 break-words">
              {project.code} •{" "}
              {project.category?.replace(/_/g, " ").toUpperCase()}
            </div>
            <div className="text-xs text-gray-400 mt-1 break-words">
              Created by {project.createdBy?.firstName}{" "}
              {project.createdBy?.lastName}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Current Level",
      accessor: "currentLevel",
      renderer: (project) => {
        const currentLevel = getCurrentApprovalLevel(project);
        const progress = getApprovalProgress(project);

        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              {currentLevel}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {progress.completed} of {progress.total} levels completed
            </div>
          </div>
        );
      },
    },
    {
      header: "Documents",
      accessor: "documents",
      renderer: (project) => {
        const docStatus = getDocumentStatus(project);

        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              Documents: {docStatus.submitted}/{docStatus.total}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${docStatus.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {docStatus.percentage}% submitted
            </div>
          </div>
        );
      },
    },
    {
      header: "Department",
      accessor: "department",
      renderer: (project) => (
        <div className="flex items-center space-x-2">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
          <div className="text-sm text-gray-900">
            {project.department?.name || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Budget",
      accessor: "budget",
      renderer: (project) => (
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {formatCurrency(project.budget)}
            </div>
            <div className="text-xs text-gray-500">
              {project.budgetThreshold?.replace(/_/g, " ")}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Timeline",
      accessor: "timeline",
      renderer: (project) => {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        const today = new Date();
        const isOverdue = endDate < today;

        return (
          <div className="flex items-center space-x-2">
            <CalendarIcon
              className={`h-4 w-4 ${
                isOverdue ? "text-red-500" : "text-gray-400"
              }`}
            />
            <div className="text-sm">
              <div
                className={`font-medium ${
                  isOverdue ? "text-red-600" : "text-gray-900"
                }`}
              >
                {startDate.toLocaleDateString()} -{" "}
                {endDate.toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500">
                {project.duration} days •{" "}
                {project.isOverdue ? "Overdue" : "On track"}
              </div>
            </div>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Project Approval Dashboard
        </h1>
        <p className="text-gray-600">
          View project approval status, take action if you are the next
          approver, and audit approved projects
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Projects
              </h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockSolid className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Approval
              </h3>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Approved</h3>
              <p className="text-3xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Rejected</h3>
              <p className="text-3xl font-bold text-red-600">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Project Approval Requests & Audit Trail
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {projects.length} project{projects.length !== 1 ? "s" : ""}{" "}
                found
              </div>
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="relative">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              All Projects Approved! 🎉
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              Great news! All project approval requests have been processed.
              <br />
              No pending approvals require your attention.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-green-600 bg-green-50 rounded-full px-4 py-2 shadow-sm">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-medium">All projects are approved</span>
            </div>
          </div>
        ) : (
          <DataTable
            data={projects}
            columns={columns}
            loading={loading}
            searchable={true}
            sortable={true}
            pagination={true}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
              customActions: (project) => {
                const progress = getApprovalProgress(project);
                const currentUser = user;

                const currentUserId = currentUser._id || currentUser.id;
                const projectCreatorId =
                  project.createdBy?._id || project.createdBy?.id;
                const isProjectCreator = currentUserId === projectCreatorId;

                const nextApprovalStep = project.approvalChain?.find(
                  (step) => step.status === "pending"
                );

                let isNextApprover = false;

                if (nextApprovalStep) {
                  if (currentUser.role.level >= 1000) {
                    isNextApprover = true;
                  } else if (nextApprovalStep.level === "hod") {
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?._id ===
                        nextApprovalStep.department;
                  } else if (nextApprovalStep.level === "finance") {
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?.name === "Finance & Accounting";
                  } else if (nextApprovalStep.level === "executive") {
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?.name === "Executive Office";
                  }
                }

                // Show actions only if:
                // 1. Project is in any pending approval status
                // 2. User is NOT the project creator (can't approve own project)
                // 3. User IS the next approver in the chain
                const isPendingApproval = [
                  "pending_approval",
                  "pending_finance_approval",
                  "pending_executive_approval",
                ].includes(project.status);

                const isApproved = ["approved", "implementation"].includes(
                  project.status
                );

                const canShowActions =
                  progress.percentage < 100 &&
                  isPendingApproval &&
                  !isProjectCreator &&
                  isNextApprover;

                // Get document status for this project
                const docStatus = getDocumentStatus(project);

                return (
                  <div className="flex items-center space-x-2">
                    {/* View Documents Button - Always visible */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocuments(project);
                      }}
                      disabled={loadingDocuments}
                      className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                      title="View Project Documents"
                    >
                      {loadingDocuments ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <DocumentIcon className="h-4 w-4" />
                      )}
                    </button>

                    {canShowActions &&
                    docStatus.submitted === docStatus.total ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprovalClick(project);
                          }}
                          disabled={actionLoading[project._id]}
                          className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                          title="Approve Project"
                        >
                          {actionLoading[project._id] ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectionClick(project);
                          }}
                          disabled={actionLoading[project._id]}
                          className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                          title="Reject Project"
                        >
                          {actionLoading[project._id] ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <XMarkIcon className="h-4 w-4" />
                          )}
                        </button>
                      </>
                    ) : canShowActions &&
                      docStatus.submitted < docStatus.total ? (
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                        title={`${
                          docStatus.total - docStatus.submitted
                        } document(s) still need to be submitted before approval`}
                      >
                        <ClockIcon className="h-3 w-3 mr-1" />
                        Waiting for Docs
                      </span>
                    ) : isApproved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        {project.status === "implementation"
                          ? "In Implementation"
                          : "Approved"}
                      </span>
                    ) : progress.percentage === 100 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Completed
                      </span>
                    ) : isProjectCreator ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Waiting for Approval
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                );
              },
            }}
            emptyState={{
              icon: <DocumentTextIcon className="h-12 w-12 text-gray-400" />,
              title: "No projects found",
              description:
                "No projects (pending or approved) match your current filters",
            }}
          />
        )}

        {/* Approval Confirmation Modal */}
        {showApprovalModal && selectedProject && (
          <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    ELRA Project Authorization
                  </h3>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedProject(null);
                      setApprovalComments("");
                    }}
                    disabled={actionLoading[selectedProject._id]}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Project Information Section */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-[var(--elra-primary)] mr-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--elra-primary)] font-medium mb-3">
                        Project Information
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Project:
                          </span>
                          <p className="text-gray-600 break-words">
                            {selectedProject.name}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Budget:
                          </span>
                          <p className="text-gray-600">
                            {formatCurrency(selectedProject.budget)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Department:
                          </span>
                          <p className="text-gray-600">
                            {selectedProject.department?.name}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Submitted By:
                          </span>
                          <p className="text-gray-600">
                            {selectedProject.createdBy?.firstName}{" "}
                            {selectedProject.createdBy?.lastName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authorization Level */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Authorization Level
                  </h4>
                  <p className="text-sm text-gray-600">
                    You are authorizing this project at the{" "}
                    <strong className="text-[var(--elra-primary)]">
                      {getCurrentApprovalLevel(selectedProject)}
                    </strong>{" "}
                    level.
                  </p>
                </div>

                {/* Authorization Checklist */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Authorization Checklist
                  </label>
                  <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Please confirm the following:</strong>
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[
                      "Project scope and objectives are clearly defined",
                      "Budget allocation is justified and within limits",
                      "Resource requirements are adequately specified",
                      "Timeline and deliverables are realistic",
                      "Risk assessment has been conducted",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md"
                      >
                        <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Authorization Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authorization Notes
                  </label>
                  <textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Add any additional notes or comments for this authorization..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Note:</strong> These notes will be recorded with
                    your authorization.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedProject(null);
                      setApprovalComments("");
                    }}
                    disabled={actionLoading[selectedProject._id]}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleApprovalAction(
                        selectedProject._id,
                        "approve",
                        approvalComments
                      )
                    }
                    disabled={actionLoading[selectedProject._id]}
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-md hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
                  >
                    {actionLoading[selectedProject._id] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin cursor-pointer"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      "Authorize Project"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Confirmation Modal */}
        {showRejectionModal && selectedProject && (
          <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    ELRA Project Review - Revision Required
                  </h3>
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      setSelectedProject(null);
                      setRejectionComments("");
                      setRejectionReason("");
                    }}
                    disabled={actionLoading[selectedProject._id]}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Project Information Section */}
                  <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-[var(--elra-primary)] mr-3 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-[var(--elra-primary)] font-medium mb-3">
                          Project Under Review
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              Project:
                            </span>
                            <p className="text-gray-600 break-words">
                              {selectedProject.name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Budget:
                            </span>
                            <p className="text-gray-600">
                              {formatCurrency(selectedProject.budget)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Department:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.department?.name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Submitted By:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.createdBy?.firstName}{" "}
                              {selectedProject.createdBy?.lastName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revision Level */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Revision Level
                    </h4>
                    <p className="text-sm text-gray-600">
                      This project requires revision at the{" "}
                      <strong className="text-[var(--elra-primary)]">
                        {getCurrentApprovalLevel(selectedProject)}
                      </strong>{" "}
                      level.
                    </p>
                  </div>

                  {/* Warning Section */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-700 font-medium mb-1">
                          Important Notice
                        </p>
                        <p className="text-sm text-red-600">
                          This action will halt the approval process and require
                          the project to be resubmitted with necessary
                          revisions.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Revision Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Revision Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      required
                    >
                      <option value="">Select revision category</option>
                      <option value="budget_issues">
                        Budget & Financial Concerns
                      </option>
                      <option value="scope_concerns">
                        Scope & Objectives Issues
                      </option>
                      <option value="documentation_incomplete">
                        Documentation & Specifications
                      </option>
                      <option value="resource_constraints">
                        Resource & Capacity Issues
                      </option>
                      <option value="timeline_issues">
                        Timeline & Schedule Concerns
                      </option>
                      <option value="compliance_concerns">
                        Compliance & Regulatory Issues
                      </option>
                      <option value="other">Other Requirements</option>
                    </select>
                  </div>

                  {/* Revision Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Revision Requirements{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionComments}
                      onChange={(e) => setRejectionComments(e.target.value)}
                      placeholder="Please provide specific requirements for revision, including what needs to be addressed and any recommendations..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      rows="4"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Note:</strong> These requirements will be sent to
                      the project creator for revision.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectionModal(false);
                        setSelectedProject(null);
                        setRejectionComments("");
                        setRejectionReason("");
                      }}
                      disabled={actionLoading[selectedProject._id]}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleApprovalAction(
                          selectedProject._id,
                          "reject",
                          `${rejectionReason}: ${rejectionComments}`
                        )
                      }
                      disabled={
                        actionLoading[selectedProject._id] ||
                        !rejectionReason ||
                        !rejectionComments.trim()
                      }
                      className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-md hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
                    >
                      {actionLoading[selectedProject._id] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin cursor-pointer"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        "Request Revision"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Modal */}
        {showDocumentsModal && selectedProject && (
          <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Project Documents - {selectedProject.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDocumentsModal(false);
                      setSelectedProject(null);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
                    <span className="ml-2 text-gray-600">
                      Loading documents...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectDocuments[selectedProject._id]?.length > 0 ? (
                      projectDocuments[selectedProject._id].map(
                        (doc, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <DocumentIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {doc.title}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {doc.documentType} • {doc.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded:{" "}
                                    {new Date(
                                      doc.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Uploaded
                                </span>
                                <button
                                  onClick={() => {
                                    const url = `${
                                      import.meta.env.VITE_API_URL
                                    }/documents/${doc._id}/view`;
                                    window.open(url, "_blank");
                                  }}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  title="View Document"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-8">
                        <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No documents uploaded yet
                        </h3>
                        <p className="text-gray-600">
                          The project creator has not uploaded any documents for
                          this project.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;
