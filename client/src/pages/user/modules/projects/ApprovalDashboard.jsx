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
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import { fetchPendingProjectApprovals } from "../../../../services/projectAPI.js";
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

  const handleApprovalAction = async (projectId, action, comments = "") => {
    setActionLoading((prev) => ({ ...prev, [projectId]: true }));

    try {
      toast.success(
        `Project ${action === "approve" ? "approved" : "rejected"} successfully`
      );
      loadPendingProjectApprovals();
    } catch (error) {
      console.error(`Error ${action}ing project approval:`, error);
      toast.error(`Error ${action}ing project approval`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Get current approval level display for project approval chain
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
          View project approval status and take action if you are the next
          approver in the chain
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
              Project Approval Requests
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

                const isNextApprover =
                  nextApprovalStep &&
                  ((nextApprovalStep.level === "hod" &&
                    currentUser.department?._id ===
                      nextApprovalStep.department) ||
                    (nextApprovalStep.level === "finance" &&
                      currentUser.department?.name ===
                        "Finance & Accounting") ||
                    (nextApprovalStep.level === "executive" &&
                      currentUser.department?.name === "Executive Office") ||
                    currentUser.role.level >= 1000);

                // Show actions only if:
                // 1. Project is pending approval
                // 2. User is NOT the project creator (can't approve own project)
                // 3. User IS the next approver in the chain
                const canShowActions =
                  progress.percentage < 100 &&
                  project.status === "pending_approval" &&
                  !isProjectCreator &&
                  isNextApprover;

                return (
                  <div className="flex items-center space-x-2">
                    {canShowActions ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprovalAction(project._id, "approve");
                          }}
                          disabled={actionLoading[project._id]}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          {actionLoading[project._id]
                            ? "Processing..."
                            : "Approve"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprovalAction(project._id, "reject");
                          }}
                          disabled={actionLoading[project._id]}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          {actionLoading[project._id]
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </>
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
              title: "No project approval requests found",
              description:
                "No project approval requests match your current filters",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;
