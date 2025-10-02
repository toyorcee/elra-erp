import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Listbox, Transition } from "@headlessui/react";
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
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { FaCertificate } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPendingProjectApprovals,
  fetchCrossDepartmentalApprovalHistory,
  approveProject,
  rejectProject,
  legalApproveProject,
} from "../../../../services/projectAPI.js";
import { getProjectDocuments } from "../../../../services/documents.js";
import { formatCurrency } from "../../../../utils/formatters.js";
import DataTable from "../../../../components/common/DataTable";

const ApprovalDashboard = () => {
  ``;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [approvedProjects, setApprovedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState("pending");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionComments, setRejectionComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [projectDocuments, setProjectDocuments] = useState({});
  const [loadingDocuments, setLoadingDocuments] = useState({});
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Compliance programs state
  const [compliancePrograms, setCompliancePrograms] = useState([]);
  const [loadingCompliancePrograms, setLoadingCompliancePrograms] =
    useState(false);
  const [selectedComplianceProgram, setSelectedComplianceProgram] =
    useState("");

  useEffect(() => {
    loadPendingProjectApprovals();
    loadApprovedProjects();
  }, []);

  const loadPendingProjectApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetchPendingProjectApprovals();
      if (response.success) {
        setProjects(response.data);

        setStats((prevStats) => ({
          total: response.data.length,
          pending: response.data.filter(
            (p) =>
              p.status === "pending_project_management_approval" ||
              p.status === "pending_legal_compliance_approval" ||
              p.status === "pending_finance_approval" ||
              p.status === "pending_executive_approval" ||
              p.status === "pending_budget_allocation" ||
              p.status === "pending_procurement" ||
              p.status === "resubmitted"
          ).length,
          approved: prevStats.approved,
          rejected: prevStats.rejected,
        }));
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

  const loadApprovedProjects = async () => {
    try {
      const response = await fetchCrossDepartmentalApprovalHistory();

      if (response.success) {
        setApprovedProjects(response.data);

        const approvedCount = response.data.filter(
          (p) => p.approver?._id?.toString() === user?.id
        ).length;

        const rejectedCount = response.data.filter(
          (p) =>
            p.approver?._id?.toString() === user?.id && p.status === "rejected"
        ).length;

        setStats((prevStats) => ({
          ...prevStats,
          approved: approvedCount,
          rejected: rejectedCount,
        }));
      } else {
        console.error("Failed to load approved projects:", response.message);
      }
    } catch (error) {
      console.error("Error loading approved projects:", error);
    }
  };

  const loadCompliantCompliancePrograms = async () => {
    setLoadingCompliancePrograms(true);
    console.log("🔍 [FRONTEND] Loading compliant compliance programs...");

    try {
      const response = await fetch("/api/legal/compliance-programs/compliant", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("🔍 [FRONTEND] API Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 [FRONTEND] API Response data:", data);

        if (data.success) {
          const programs = data.data.compliancePrograms || [];
          console.log(
            `✅ [FRONTEND] Loaded ${programs.length} compliant programs:`,
            programs
          );
          setCompliancePrograms(programs);
        } else {
          console.error(
            "❌ [FRONTEND] Failed to load compliant compliance programs:",
            data.message
          );
        }
      } else {
        const errorData = await response.json();
        console.error("❌ [FRONTEND] API Error:", response.status, errorData);
      }
    } catch (error) {
      console.error(
        "❌ [FRONTEND] Error loading compliant compliance programs:",
        error
      );
    } finally {
      setLoadingCompliancePrograms(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  };

  const handleApprovalClick = (project) => {
    setSelectedProject(project);
    const defaultComment = `Approved by ${user.firstName} ${user.lastName} (${user.department?.name} HOD)`;
    setApprovalComments(defaultComment);
    setSelectedComplianceProgram("");

    if (
      user.department?.name === "Legal & Compliance" &&
      user.role?.level >= 700 &&
      project.status === "pending_legal_compliance_approval"
    ) {
      loadCompliantCompliancePrograms();
    }

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
      setLoadingDocuments((prev) => ({ ...prev, [project._id]: true }));
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
      console.error("❌ [APPROVAL DASHBOARD] Error loading documents:", error);
      toast.error("Failed to load project documents");
    } finally {
      setLoadingDocuments((prev) => ({ ...prev, [project._id]: false }));
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
        // Use legal approval for Legal HOD when it's their turn, regular approval for others
        if (
          user.department?.name === "Legal & Compliance" &&
          user.role?.level >= 700 &&
          selectedProject?.status === "pending_legal_compliance_approval"
        ) {
          // MANDATORY: Legal HOD must select a compliance program
          if (!selectedComplianceProgram) {
            toast.error(
              "MANDATORY: You must select a compliance program before approving this project. This ensures ELRA maintains full regulatory compliance."
            );
            return;
          }

          const legalApprovalData = {
            ...approvalData,
            complianceProgramId: selectedComplianceProgram,
          };
          response = await legalApproveProject(projectId, legalApprovalData);
        } else {
          response = await approveProject(projectId, approvalData);
        }
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
        loadApprovedProjects();

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

    if (
      project.status === "resubmitted" ||
      project.workflowHistory?.some((h) => h.action === "project_resubmitted")
    ) {
      const firstPendingStep = project.approvalChain.find(
        (step) => step.status === "pending"
      );

      const resubmissionHistory = project.workflowHistory?.find(
        (h) => h.action === "project_resubmitted"
      );
      const rejectionPoint = resubmissionHistory?.metadata?.rejectionPoint;
      const preservedApprovals =
        resubmissionHistory?.metadata?.preservedApprovals || [];

      if (firstPendingStep) {
        const levelMap = {
          hod: "HOD Approval",
          department: "Department Approval",
          finance: "Finance Review",
          executive: "Executive Approval",
          legal_compliance: "Legal & Compliance Approval",
          budget_allocation: "Budget Allocation",
        };

        let displayText = `${
          levelMap[firstPendingStep.level] || firstPendingStep.level
        } (Resubmitted)`;

        if (preservedApprovals.length > 0) {
          const preservedText = preservedApprovals
            .map((level) => levelMap[level] || level)
            .join(", ");
          displayText += ` - Preserved: ${preservedText}`;
        }

        return displayText;
      }
      return "Resubmitted - Pending Approval";
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
      legal_compliance: "Legal & Compliance Approval",
    };

    return levelMap[currentStep.level] || currentStep.level.replace(/_/g, " ");
  };

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

  const getApprovalStatusColor = (project) => {
    const progress = getApprovalProgress(project);

    if (progress.percentage === 100) return "bg-green-100 text-green-800";
    if (progress.percentage >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

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

  // Helper function to check if all documents are uploaded
  const areAllDocumentsUploaded = (project) => {
    if (!project.requiredDocuments || project.requiredDocuments.length === 0) {
      return true;
    }
    const total = project.requiredDocuments.length;
    const submitted = project.requiredDocuments.filter(
      (doc) => doc.isSubmitted
    ).length;
    return submitted === total;
  };

  const getColumns = () => {
    const baseColumns = [
      {
        header: "Project",
        accessor: "name",
        renderer: (project) => (
          <div className="flex items-center space-x-3 max-w-xs">
            <div className="flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeTab === "approved"
                    ? "bg-gradient-to-br from-green-500 to-green-600"
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                }`}
              >
                {activeTab === "approved" ? (
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                ) : (
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="font-medium text-gray-900 text-sm leading-tight truncate"
                title={project.name}
              >
                {project.name}
                {activeTab === "approved" && (
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {project.code} •{" "}
                {project.category?.replace(/_/g, " ").toUpperCase()}
              </div>
              <div className="text-xs text-gray-400 truncate">
                By {project.createdBy?.firstName} {project.createdBy?.lastName}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Current Level",
        accessor: "currentLevel",
        renderer: (project) => {
          if (activeTab === "approved" && project.approvalLevel) {
            return (
              <div className="space-y-2">
                <div className="text-sm font-medium text-green-700">
                  ✅ Approved at {project.approvalLevel.replace(/_/g, " ")}{" "}
                  level
                </div>
                <div className="text-xs text-gray-600">
                  Approved: {new Date(project.approvedAt).toLocaleDateString()}
                </div>
                {project.approvalComments && (
                  <div className="text-xs text-gray-500 italic">
                    "{project.approvalComments}"
                  </div>
                )}
              </div>
            );
          }

          const currentLevel = getCurrentApprovalLevel(project);
          const progress = getApprovalProgress(project);

          return (
            <div className="space-y-1 max-w-xs">
              <div
                className="text-sm font-medium text-gray-900 truncate"
                title={currentLevel}
              >
                {currentLevel}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-[var(--elra-primary)] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {progress.completed}/{progress.total} levels
              </div>
            </div>
          );
        },
      },
      {
        header: "Department",
        accessor: "department",
        renderer: (project) => (
          <div className="flex items-center space-x-2 max-w-xs">
            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div
              className="text-sm text-gray-900 truncate"
              title={project.department?.name || "N/A"}
            >
              {project.department?.name || "N/A"}
            </div>
          </div>
        ),
      },
      {
        header: "Budget",
        accessor: "budget",
        renderer: (project) => (
          <div className="flex items-center space-x-2 max-w-xs">
            <CurrencyDollarIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
            <div className="text-sm min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {formatCurrency(project.budget)}
              </div>
              <div className="text-xs text-gray-500 truncate">
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
            <div className="flex items-center space-x-2 max-w-xs">
              <CalendarIcon
                className={`h-4 w-4 flex-shrink-0 ${
                  isOverdue ? "text-red-500" : "text-gray-400"
                }`}
              />
              <div className="text-sm min-w-0">
                <div
                  className={`font-medium truncate ${
                    isOverdue ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {startDate.toLocaleDateString()} -{" "}
                  {endDate.toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {project.duration} days •{" "}
                  {project.isOverdue ? "Overdue" : "On track"}
                </div>
              </div>
            </div>
          );
        },
      },
    ];

    // Add Documents column only if not all projects have all documents uploaded
    const hasIncompleteDocuments = (
      activeTab === "pending" ? projects : approvedProjects
    ).some((project) => !areAllDocumentsUploaded(project));

    if (hasIncompleteDocuments) {
      baseColumns.splice(2, 0, {
        header: "Documents",
        accessor: "documents",
        renderer: (project) => {
          const docStatus = getDocumentStatus(project);

          return (
            <div className="space-y-1 max-w-xs">
              <div className="text-sm font-medium text-gray-900">
                {docStatus.submitted}/{docStatus.total} docs
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${docStatus.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {docStatus.percentage}% complete
              </div>
            </div>
          );
        },
      });
    }

    return baseColumns;
  };

  const columns = getColumns();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4">
      {/* Enhanced Header */}
      <div className="mb-8 relative">
        <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Cross-Departmental Project Approvals
                </h1>
                <p className="text-white/90 mt-2 text-lg">
                  Review and approve projects from other departments that
                  require your expertise
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                <DocumentTextIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Total Projects
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl">
                <ClockSolid className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Pending Approval
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Approved
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl">
                <XCircleIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Rejected
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
        <div className="p-6">
          <nav
            className="flex space-x-1 bg-gray-100 p-1 rounded-xl"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("pending")}
              className={`${
                activeTab === "pending"
                  ? "bg-white text-[var(--elra-primary)] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              } flex-1 py-3 px-4 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 flex items-center justify-center space-x-2`}
            >
              <ClockSolid className="h-5 w-5" />
              <span>Pending Approvals ({projects.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`${
                activeTab === "approved"
                  ? "bg-white text-[var(--elra-primary)] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              } flex-1 py-3 px-4 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 flex items-center justify-center space-x-2`}
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span>My Approval History ({approvedProjects.length})</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Enhanced Approvals Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === "pending"
                  ? "Project Approval Requests & Audit Trail"
                  : "My Approval History"}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeTab === "pending"
                  ? "Review and approve projects requiring your expertise"
                  : "Track your approval decisions and project outcomes"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-50 px-4 py-2 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  {activeTab === "pending"
                    ? projects.length
                    : approvedProjects.length}{" "}
                  project
                  {(activeTab === "pending"
                    ? projects.length
                    : approvedProjects.length) !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </div>
              </div>
            </div>
          </div>
        </div>

        {(
          activeTab === "pending"
            ? projects.length === 0
            : approvedProjects.length === 0
        ) ? (
          <div className="text-center py-16 px-8">
            <div className="mb-8">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20"></div>
                <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
                  <CheckCircleIcon className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {activeTab === "pending"
                ? "All Projects Approved! 🎉"
                : "No Approval History Yet"}
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              {activeTab === "pending"
                ? "Great news! All project approval requests have been processed. No pending approvals require your attention."
                : "You haven't approved any cross-departmental projects yet. Your approval history will appear here once you start reviewing projects."}
            </p>
            <div className="inline-flex items-center space-x-3 text-sm font-medium text-green-700 bg-green-50 rounded-full px-6 py-3 shadow-sm border border-green-200">
              <CheckCircleIcon className="h-5 w-5" />
              <span>
                {activeTab === "pending"
                  ? "All projects are approved"
                  : "No approvals yet"}
              </span>
            </div>
          </div>
        ) : (
          <DataTable
            data={activeTab === "pending" ? projects : approvedProjects}
            columns={columns}
            loading={loading}
            searchable={true}
            sortable={true}
            pagination={true}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
              customActions: (project) => {
                const progress = getApprovalProgress(project);
                const currentUser = user;

                if (activeTab === "approved") {
                  return (
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleViewProject(project)}
                        className="group inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-lg hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] transition-all duration-200 cursor-pointer"
                        title="View Project Details"
                      >
                        <EyeIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                      <button
                        onClick={() => handleViewDocuments(project)}
                        className="group inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                        title="View Project Documents"
                      >
                        <DocumentIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                    </div>
                  );
                }

                // For pending projects, show approval actions

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
                  } else if (nextApprovalStep.level === "project_management") {
                    // Project Management HOD approves project_management level (cross-departmental)
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?.name === "Project Management";
                  } else if (nextApprovalStep.level === "department") {
                    // Legacy case - should not happen with new logic
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?.name === "Project Management";
                  } else if (nextApprovalStep.level === "finance") {
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?.name === "Finance & Accounting";
                  } else if (nextApprovalStep.level === "legal_compliance") {
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?.name === "Legal & Compliance";
                  } else if (nextApprovalStep.level === "executive") {
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?.name === "Executive Office";
                  } else if (nextApprovalStep.level === "budget_allocation") {
                    isNextApprover =
                      currentUser.role.level >= 700 &&
                      currentUser.department?.name === "Finance & Accounting";
                  }
                }

                const isPendingApproval = [
                  "pending_approval",
                  "pending_project_management_approval",
                  "pending_finance_approval",
                  "pending_executive_approval",
                  "pending_legal_compliance_approval",
                  "pending_budget_allocation",
                  "resubmitted",
                ].includes(project.status);

                const isApproved = ["approved", "implementation"].includes(
                  project.status
                );

                const canShowActions =
                  progress.percentage < 100 &&
                  isPendingApproval &&
                  !isProjectCreator &&
                  isNextApprover;

                const docStatus = getDocumentStatus(project);

                return (
                  <div className="flex flex-col space-y-1.5">
                    {/* First row: View and Documents buttons */}
                    <div className="flex items-center space-x-1.5">
                      {/* Enhanced View Project Button - Always visible */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProject(project);
                        }}
                        className="group inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-lg hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] transition-all duration-200 cursor-pointer"
                        title="View Project Details"
                      >
                        <EyeIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      </button>

                      {/* Enhanced View Documents Button - Always visible */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDocuments(project);
                        }}
                        disabled={loadingDocuments[project._id]}
                        className="group inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 cursor-pointer"
                        title="View Project Documents"
                      >
                        {loadingDocuments[project._id] ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <DocumentIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        )}
                      </button>
                    </div>

                    {/* Second row: Action buttons or status */}
                    <div className="flex items-center space-x-1.5">
                      {canShowActions &&
                      docStatus.submitted === docStatus.total ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprovalClick(project);
                            }}
                            disabled={actionLoading[project._id]}
                            className="group inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 cursor-pointer"
                            title="Approve Project"
                          >
                            {actionLoading[project._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <CheckIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectionClick(project);
                            }}
                            disabled={actionLoading[project._id]}
                            className="group inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 cursor-pointer"
                            title="Reject Project"
                          >
                            {actionLoading[project._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <XMarkIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            )}
                          </button>
                        </>
                      ) : canShowActions &&
                        docStatus.submitted < docStatus.total ? (
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200"
                          title={`${
                            docStatus.total - docStatus.submitted
                          } document(s) still need to be submitted before approval`}
                        >
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Waiting for Docs
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          {project.status === "implementation"
                            ? "In Implementation"
                            : "Approved"}
                        </span>
                      ) : progress.percentage === 100 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      ) : isProjectCreator ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Waiting for Approval
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
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

        {/* Enhanced Approval Confirmation Modal */}
        {showApprovalModal && selectedProject && (
          <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-100">
              {/* ELRA Branded Header */}
              <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                          ELRA Project Authorization
                        </h3>
                        <p className="text-white/90 mt-2 text-lg">
                          Authorize project: {selectedProject.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowApprovalModal(false);
                        setSelectedProject(null);
                        setApprovalComments("");
                      }}
                      disabled={actionLoading[selectedProject._id]}
                      className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white flex-1 overflow-y-auto">
                {/* Enhanced Project Information Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-6 rounded-2xl shadow-sm mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-[var(--elra-primary)] rounded-xl">
                      <InformationCircleIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Project Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Project Name
                      </span>
                      <p className="text-gray-900 font-medium mt-1 break-words">
                        {selectedProject.name}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Budget
                      </span>
                      <p className="text-gray-900 font-medium mt-1">
                        {formatCurrency(selectedProject.budget)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Department
                      </span>
                      <p className="text-gray-900 font-medium mt-1">
                        {selectedProject.department?.name}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Submitted By
                      </span>
                      <p className="text-gray-900 font-medium mt-1">
                        {selectedProject.createdBy?.firstName}{" "}
                        {selectedProject.createdBy?.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Authorization Level */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-500 rounded-xl">
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Authorization Level
                    </h4>
                  </div>
                  <p className="text-gray-700">
                    You are authorizing this project at the{" "}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--elra-primary)] text-white">
                      {getCurrentApprovalLevel(selectedProject)}
                    </span>{" "}
                    level.
                  </p>
                </div>

                {/* Enhanced Authorization Checklist */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-xl">
                      <CheckIcon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Authorization Checklist
                    </h4>
                  </div>
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
                    <p className="text-green-800 font-medium">
                      Please confirm the following criteria have been met:
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Project scope and objectives are clearly defined",
                      "Budget allocation is justified and within limits",
                      "Resource requirements are adequately specified",
                      "Timeline and deliverables are realistic",
                      "Risk assessment has been conducted",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Program Selection - Only for Legal HOD when it's their turn */}
                {user.department?.name === "Legal & Compliance" &&
                  user.role?.level >= 700 &&
                  selectedProject?.status ===
                    "pending_legal_compliance_approval" && (
                    <div className="mb-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-purple-500 rounded-xl">
                          <DocumentTextIcon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Compliance Program Selection
                        </h4>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                          </div>
                          <p className="text-red-800 font-bold">
                            MANDATORY: Select a compliance program to attach to
                            this project
                          </p>
                        </div>
                        <p className="text-purple-700 text-sm mb-4">
                          As ELRA's Legal & Compliance HOD, you must attach a
                          fully compliant program to ensure regulatory
                          adherence. This is mandatory for all project
                          approvals.
                        </p>

                        {loadingCompliancePrograms ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                            <span className="ml-2 text-purple-600">
                              Loading compliance programs...
                            </span>
                          </div>
                        ) : compliancePrograms.length > 0 ? (
                          <Listbox
                            value={selectedComplianceProgram}
                            onChange={setSelectedComplianceProgram}
                          >
                            <div className="relative">
                              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-300">
                                <span className="block truncate">
                                  {selectedComplianceProgram
                                    ? compliancePrograms.find(
                                        (p) =>
                                          p._id === selectedComplianceProgram
                                      )?.name || "Select a compliance program"
                                    : "Select a compliance program"}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronUpDownIcon
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                  />
                                </span>
                              </Listbox.Button>
                              <Transition
                                as={React.Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                  {compliancePrograms.map((program) => (
                                    <Listbox.Option
                                      key={program._id}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active
                                            ? "bg-purple-100 text-purple-900"
                                            : "text-gray-900"
                                        }`
                                      }
                                      value={program._id}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-medium"
                                                : "font-normal"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <div className="font-medium text-gray-900">
                                                  {program.name}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                  {program.category}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  Owner:{" "}
                                                  {program.programOwner ===
                                                  "ELRA"
                                                    ? "ELRA"
                                                    : program.programOwner
                                                        ?.firstName +
                                                      " " +
                                                      program.programOwner
                                                        ?.lastName}
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                  ✓ All Items Compliant
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                  {program.complianceItemsCount ||
                                                    0}{" "}
                                                  items
                                                </div>
                                              </div>
                                            </div>
                                          </span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <div className="p-3 bg-yellow-50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                            </div>
                            <p className="font-medium text-gray-700 mb-1">
                              No Compliant Programs Available
                            </p>
                            <p className="text-sm text-gray-600">
                              All compliance programs must have all items marked
                              as "Compliant" before they can be attached to
                              projects.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Please update your compliance items to "Compliant"
                              status in the Legal & Compliance module.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Attached Compliance Program - Show for all users after legal approval */}
                {selectedProject?.complianceProgram && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-500 rounded-xl">
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Attached Compliance Program
                      </h4>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-green-800 font-bold">
                          ✓ Compliance Program Attached by Legal & Compliance
                          HOD
                        </p>
                      </div>

                      {/* Compliance Program Details */}
                      <div className="bg-white border border-green-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-lg font-semibold text-gray-900">
                            {selectedProject.complianceProgram.name}
                          </h5>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Fully Compliant
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              Category:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.complianceProgram.category}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Program Owner:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.complianceProgram
                                .programOwner === "ELRA"
                                ? "ELRA"
                                : selectedProject.complianceProgram.programOwner
                                    ?.firstName +
                                  " " +
                                  selectedProject.complianceProgram.programOwner
                                    ?.lastName}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Status:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.complianceProgram.status}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Priority:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.complianceProgram.priority}
                            </p>
                          </div>
                        </div>
                        {selectedProject.complianceProgram.description && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700">
                              Description:
                            </span>
                            <p className="text-gray-600 text-sm mt-1">
                              {selectedProject.complianceProgram.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Compliance Items */}
                      {selectedProject.complianceProgram.complianceItems &&
                        selectedProject.complianceProgram.complianceItems
                          .length > 0 && (
                          <div className="bg-white border border-green-200 rounded-xl p-4">
                            <h6 className="text-md font-semibold text-gray-900 mb-3">
                              Compliance Items (
                              {
                                selectedProject.complianceProgram
                                  .complianceItems.length
                              }{" "}
                              items)
                            </h6>
                            <div className="space-y-2">
                              {selectedProject.complianceProgram.complianceItems.map(
                                (item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {item.name}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {item.category}
                                      </div>
                                      {item.description && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {item.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✓ Compliant
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Enhanced Authorization Notes */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-500 rounded-xl">
                      <DocumentTextIcon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Authorization Notes
                    </h4>
                  </div>
                  <textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Add any additional notes or comments for this authorization..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent transition-all duration-200 resize-none"
                    rows="4"
                  />
                  <p className="text-sm text-gray-600 mt-2 flex items-center space-x-2">
                    <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                    <span>
                      These notes will be recorded with your authorization and
                      visible to the project team.
                    </span>
                  </p>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedProject(null);
                      setApprovalComments("");
                    }}
                    disabled={actionLoading[selectedProject._id]}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                    disabled={
                      actionLoading[selectedProject._id] ||
                      (user.department?.name === "Legal & Compliance" &&
                        user.role?.level >= 700 &&
                        selectedProject?.status ===
                          "pending_legal_compliance_approval" &&
                        !selectedComplianceProgram)
                    }
                    className="px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer transition-all duration-200"
                  >
                    {actionLoading[selectedProject._id] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin cursor-pointer"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-5 w-5" />
                        <span>
                          {user.department?.name === "Legal & Compliance" &&
                          user.role?.level >= 700 &&
                          selectedProject?.status ===
                            "pending_legal_compliance_approval" &&
                          !selectedComplianceProgram
                            ? "Select Compliance Program First"
                            : "Authorize Project"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Rejection Confirmation Modal */}
        {showRejectionModal && selectedProject && (
          <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-100">
              {/* ELRA Branded Header */}
              <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white p-8 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                        <XMarkIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                          ELRA Project Review - Revision Required
                        </h3>
                        <p className="text-white/90 mt-2 text-lg">
                          Request revision for: {selectedProject.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowRejectionModal(false);
                        setSelectedProject(null);
                        setRejectionComments("");
                        setRejectionReason("");
                      }}
                      disabled={actionLoading[selectedProject._id]}
                      className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white flex-1 overflow-y-auto">
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

        {/* Enhanced Documents Modal */}
        {showDocumentsModal && selectedProject && (
          <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
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

                {loadingDocuments[selectedProject._id] ? (
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

        {/* Enhanced Project Details Modal */}
        {showProjectDetailsModal && selectedProject && (
          <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Project Details - {selectedProject.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowProjectDetailsModal(false);
                      setSelectedProject(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Project Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">
                          Project Code:
                        </span>
                        <p className="text-gray-600">{selectedProject.code}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Description:
                        </span>
                        <p className="text-gray-600">
                          {selectedProject.description}
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
                          Created By:
                        </span>
                        <p className="text-gray-600">
                          {selectedProject.createdBy?.firstName}{" "}
                          {selectedProject.createdBy?.lastName}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Project Manager:
                        </span>
                        <p className="text-gray-600">
                          {selectedProject.projectManager?.firstName}{" "}
                          {selectedProject.projectManager?.lastName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Approval Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Approval Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">
                          Current Status:
                        </span>
                        <p className="text-gray-600 capitalize">
                          {selectedProject.status?.replace(/_/g, " ")}
                        </p>
                      </div>

                      {/* Show different info based on whether it's approved or pending */}
                      {activeTab === "approved" ? (
                        // For approved projects in history tab
                        <>
                          <div>
                            <span className="font-medium text-gray-700">
                              Approved At Level:
                            </span>
                            <p className="text-gray-600 capitalize">
                              {selectedProject.approvalLevel?.replace(
                                /_/g,
                                " "
                              ) || "N/A"}
                            </p>
                          </div>

                          {/* Show current project status if it's in budget allocation */}
                          {selectedProject.status ===
                            "pending_budget_allocation" && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Current Status:
                              </span>
                              <p className="text-blue-600 font-medium">
                                📋 Awaiting Budget Allocation
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Project is waiting for Finance HOD to create
                                budget allocation
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">
                              Approved At:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.approvedAt
                                ? new Date(
                                    selectedProject.approvedAt
                                  ).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Approved By:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.approver?.firstName}{" "}
                              {selectedProject.approver?.lastName}
                              {selectedProject.approver?.email && (
                                <span className="text-sm text-gray-500 ml-2">
                                  ({selectedProject.approver.email})
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Your Approval Comments:
                            </span>
                            <p className="text-gray-600">
                              {selectedProject.approvalComments ||
                                "No comments provided"}
                            </p>
                          </div>

                          {/* Show approval progress for approved projects */}
                          <div>
                            <span className="font-medium text-gray-700">
                              Approval Progress:
                            </span>
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${
                                      getApprovalProgress(selectedProject)
                                        .percentage
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {getApprovalProgress(selectedProject).completed}{" "}
                                of {getApprovalProgress(selectedProject).total}{" "}
                                levels completed
                              </p>
                            </div>
                          </div>

                          {/* Show complete approval chain for approved projects */}
                          {selectedProject.approvalChain &&
                            selectedProject.approvalChain.length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">
                                  Complete Approval Chain:
                                </span>
                                <div className="mt-2 space-y-2">
                                  {selectedProject.approvalChain.map(
                                    (step, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <span className="capitalize">
                                          {step.level.replace(/_/g, " ")}{" "}
                                          Approval
                                        </span>
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            step.status === "approved"
                                              ? "bg-green-100 text-green-800"
                                              : step.status === "pending"
                                              ? step.level ===
                                                  "budget_allocation" &&
                                                selectedProject.status ===
                                                  "pending_budget_allocation"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-yellow-100 text-yellow-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {step.status === "approved"
                                            ? "✓ Approved"
                                            : step.status === "pending"
                                            ? step.level ===
                                                "budget_allocation" &&
                                              selectedProject.status ===
                                                "pending_budget_allocation"
                                              ? "📋 Budget Allocation"
                                              : "⏳ Pending"
                                            : "⏸️ Waiting"}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </>
                      ) : (
                        // For pending projects
                        <>
                          <div>
                            <span className="font-medium text-gray-700">
                              Current Approval Level:
                            </span>
                            <p className="text-gray-600">
                              {getCurrentApprovalLevel(selectedProject)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Approval Progress:
                            </span>
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${
                                      getApprovalProgress(selectedProject)
                                        .percentage
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {getApprovalProgress(selectedProject).completed}{" "}
                                of {getApprovalProgress(selectedProject).total}{" "}
                                levels completed
                              </p>
                            </div>
                          </div>

                          {/* Show approval chain */}
                          {selectedProject.approvalChain &&
                            selectedProject.approvalChain.length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">
                                  Approval Chain:
                                </span>
                                <div className="mt-2 space-y-2">
                                  {selectedProject.approvalChain.map(
                                    (step, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <span className="capitalize">
                                          {step.level.replace(/_/g, " ")}{" "}
                                          Approval
                                        </span>
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            step.status === "approved"
                                              ? "bg-green-100 text-green-800"
                                              : step.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {step.status === "approved"
                                            ? "✓ Approved"
                                            : step.status === "pending"
                                            ? "⏳ Pending"
                                            : "⏸️ Waiting"}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Items */}
                {selectedProject.projectItems &&
                  selectedProject.projectItems.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Project Items
                      </h4>
                      <div className="space-y-3">
                        {selectedProject.projectItems.map((item, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">
                                  {item.name}
                                </h5>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>
                                    Quantity:{" "}
                                    <span className="font-medium text-gray-700">
                                      {item.quantity}
                                    </span>
                                  </span>
                                  <span>
                                    Unit Price:{" "}
                                    <span className="font-medium text-gray-700">
                                      {formatCurrency(item.unitPrice)}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatCurrency(item.totalPrice)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Total
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-gray-900">
                              Total Project Budget:
                            </span>
                            <span className="text-xl font-bold text-blue-600">
                              {formatCurrency(selectedProject.budget)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Attached Compliance Program - Show in project details modal */}
                {selectedProject?.complianceProgram && (
                  <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-500 rounded-xl">
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Attached Compliance Program
                      </h4>
                    </div>

                    <div className="bg-white border border-green-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-lg font-semibold text-gray-900">
                          {selectedProject.complianceProgram.name}
                        </h5>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          ✓ Fully Compliant
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Category:
                          </span>
                          <p className="text-gray-600">
                            {selectedProject.complianceProgram.category}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Program Owner:
                          </span>
                          <p className="text-gray-600">
                            {selectedProject.complianceProgram.programOwner ===
                            "ELRA"
                              ? "ELRA"
                              : selectedProject.complianceProgram.programOwner
                                  ?.firstName +
                                " " +
                                selectedProject.complianceProgram.programOwner
                                  ?.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Status:
                          </span>
                          <p className="text-gray-600">
                            {selectedProject.complianceProgram.status}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Priority:
                          </span>
                          <p className="text-gray-600">
                            {selectedProject.complianceProgram.priority}
                          </p>
                        </div>
                      </div>
                      {selectedProject.complianceProgram.description && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700">
                            Description:
                          </span>
                          <p className="text-gray-600 text-sm mt-1">
                            {selectedProject.complianceProgram.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Compliance Items */}
                    {selectedProject.complianceProgram.complianceItems &&
                      selectedProject.complianceProgram.complianceItems.length >
                        0 && (
                        <div className="bg-white border border-green-200 rounded-xl p-4">
                          <h6 className="text-md font-semibold text-gray-900 mb-3">
                            Compliance Items (
                            {
                              selectedProject.complianceProgram.complianceItems
                                .length
                            }{" "}
                            items)
                          </h6>
                          <div className="space-y-2">
                            {selectedProject.complianceProgram.complianceItems.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {item.title || item.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {item.category}
                                    </div>
                                    {item.description && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {item.description}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✓ Compliant
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* View Certificate Button - only after completion */}
                {selectedProject?.status === "completed" && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() =>
                        navigate(
                          `/dashboard/modules/projects/certificate/${selectedProject._id}`
                        )
                      }
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105"
                    >
                      <FaCertificate className="h-5 w-5 mr-2" />
                      View Project Certificate
                    </button>
                  </div>
                )}

                {/* Timeline Information */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Timeline
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">
                        Start Date:
                      </span>
                      <p className="text-gray-600">
                        {new Date(
                          selectedProject.startDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        End Date:
                      </span>
                      <p className="text-gray-600">
                        {new Date(selectedProject.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Duration:
                      </span>
                      <p className="text-gray-600">
                        {selectedProject.duration} days
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Priority:
                      </span>
                      <p className="text-gray-600 capitalize">
                        {selectedProject.priority}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowProjectDetailsModal(false);
                      setSelectedProject(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;
