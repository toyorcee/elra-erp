import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineClipboardDocument,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineClock,
} from "react-icons/hi2";
import { HiDocument, HiArrowDownTray } from "react-icons/hi2";
import { useAuth } from "../../../../context/AuthContext";
import DataTable from "../../../../components/common/DataTable";
import {
  fetchDepartmentPendingApprovalProjects,
  approveProject,
  rejectProject,
} from "../../../../services/projectAPI";
import {
  viewDocument,
  getProjectDocuments,
} from "../../../../services/documents.js";

const ProjectApprovals = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedProjectForDocuments, setSelectedProjectForDocuments] =
    useState(null);
  const [viewingDocumentId, setViewingDocumentId] = useState(null);
  const [projectDocuments, setProjectDocuments] = useState({});
  const [loadingDocuments, setLoadingDocuments] = useState({});

  useEffect(() => {
    if (user) {
      fetchDepartmentProjects();
    }
  }, [user]);

  const fetchDepartmentProjects = async () => {
    try {
      setLoading(true);

      // Department Management module only handles department-specific approvals
      // Project Management HOD should use the Project Management module for cross-departmental approvals
      const response = await fetchDepartmentPendingApprovalProjects();

      if (response.success) {
        // Transform the API response to match the expected format
        const transformedProjects = response.data.map((project) => ({
          id: project._id,
          title: project.name,
          employee: {
            firstName: project.createdBy?.firstName || "Unknown",
            lastName: project.createdBy?.lastName || "User",
            email: project.createdBy?.email || "unknown@elra.com",
          },
          department: {
            name: project.department?.name || "Unknown Department",
          },
          budget: project.budget || 0,
          startDate: project.startDate,
          endDate: project.endDate,
          status: project.status,
          priority: project.priority || "medium",
          description: project.description || "No description provided",
          submittedAt: project.createdAt,
          projectCode: project.code,
          projectScope: project.projectScope,
          requiresBudgetAllocation: project.requiresBudgetAllocation,
          approvalChain: project.approvalChain,
          requiredDocuments: project.requiredDocuments,
          projectItems: project.projectItems,
        }));

        setProjects(transformedProjects);
        console.log(
          `✅ [ProjectApprovals] Loaded ${transformedProjects.length} projects pending approval`
        );
      } else {
        console.error(
          "❌ [ProjectApprovals] API response error:",
          response.message
        );
        toast.error(response.message || "Failed to fetch projects");
        setProjects([]);
      }
    } catch (error) {
      console.error("❌ [ProjectApprovals] Error fetching projects:", error);
      toast.error("Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleApprove = (project) => {
    setSelectedProject(project);
    setApprovalComment("");
    setShowApprovalModal(true);
  };

  const handleReject = (project) => {
    setSelectedProject(project);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const fetchProjectDocuments = async (projectId) => {
    try {
      setLoadingDocuments((prev) => ({ ...prev, [projectId]: true }));
      const response = await getProjectDocuments(projectId);
      if (response.success) {
        setProjectDocuments((prev) => ({
          ...prev,
          [projectId]: response.data.documents || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching project documents:", error);
      toast.error("Failed to fetch project documents");
    } finally {
      setLoadingDocuments((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const handleViewDocuments = async (project) => {
    setSelectedProjectForDocuments(project);
    setShowDocumentsModal(true);

    // Fetch documents if not already loaded
    if (!projectDocuments[project.id]) {
      await fetchProjectDocuments(project.id);
    }
  };

  const getUploadedDocument = (documentType) => {
    return projectDocuments[selectedProjectForDocuments.id]?.find(
      (uploaded) => uploaded.documentType === documentType
    );
  };

  const handleViewDocument = async (documentType) => {
    const uploadedDoc = getUploadedDocument(documentType);
    if (!uploadedDoc) {
      toast.error("Document not found. Please try uploading again.");
      return;
    }

    try {
      setViewingDocumentId(uploadedDoc._id);
      const result = await viewDocument(uploadedDoc._id);
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      if (error.status === 404) {
        toast.error("Document not found. It may have been deleted or moved.");
      } else {
        toast.error("Failed to open document. Please try again.");
      }
    } finally {
      setViewingDocumentId(null);
    }
  };

  // Helper function to check if all documents are submitted
  const areAllDocumentsSubmitted = (project) => {
    if (!project.requiredDocuments || project.requiredDocuments.length === 0) {
      return true;
    }
    return project.requiredDocuments.every((doc) => doc.isSubmitted);
  };

  const handleApproveSubmit = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
      // Determine approval level based on user's department
      const approvalLevel =
        user.department?.name === "Project Management" ? "department" : "hod";

      const approvalData = {
        level: approvalLevel,
        comment:
          approvalComment ||
          `Approved by ${
            user.department?.name === "Project Management"
              ? "Project Management"
              : "Department"
          } Head`,
        approvedAt: new Date().toISOString(),
      };

      const response = await approveProject(selectedProject.id, approvalData);

      if (response.success) {
        toast.success("Project approved successfully! Progress updated.");
        setShowApprovalModal(false);
        setSelectedProject(null);
        setApprovalComment("");
        fetchDepartmentProjects(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to approve project");
      }
    } catch (error) {
      console.error("❌ [ProjectApprovals] Error approving project:", error);
      toast.error("Failed to approve project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedProject || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsSubmitting(true);
    try {
      // Determine rejection level based on user's department
      const rejectionLevel =
        user.department?.name === "Project Management" ? "department" : "hod";

      const rejectionData = {
        level: rejectionLevel,
        reason: rejectionReason,
        rejectedAt: new Date().toISOString(),
      };

      const response = await rejectProject(selectedProject.id, rejectionData);

      if (response.success) {
        toast.success("Project rejected successfully");
        setShowRejectionModal(false);
        setSelectedProject(null);
        setRejectionReason("");
        fetchDepartmentProjects();
      } else {
        toast.error(response.message || "Failed to reject project");
      }
    } catch (error) {
      console.error("❌ [ProjectApprovals] Error rejecting project:", error);
      toast.error("Failed to reject project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
      critical: "bg-purple-100 text-purple-800",
    };
    return colors[priority] || colors.medium;
  };

  const columns = [
    {
      header: "Project",
      accessor: "title",
      skeletonRenderer: () => (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      ),
      renderer: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <HiOutlineClipboardDocument className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p
              className="font-medium text-gray-900 cursor-help"
              title={row.title}
            >
              {row.title.length > 10
                ? `${row.title.slice(0, 10)}...`
                : row.title}
            </p>
            <p
              className="text-sm text-gray-500 cursor-help"
              title={row.employee?.email}
            >
              {row.employee?.email && row.employee.email.length > 15
                ? `${row.employee.email.slice(0, 15)}...`
                : row.employee?.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Employee",
      accessor: "employee",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className="text-sm text-gray-900">
          {row.employee?.firstName} {row.employee?.lastName}
        </span>
      ),
    },
    {
      header: "Budget",
      accessor: "budget",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(row.budget)}
        </span>
      ),
    },
    {
      header: "Timeline",
      accessor: "startDate",
      skeletonRenderer: () => (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      ),
      renderer: (row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">
            {formatDate(row.startDate)} - {formatDate(row.endDate)}
          </p>
          <p className="text-gray-500">
            <HiOutlineClock className="inline w-3 h-3 mr-1" />
            {Math.ceil(
              (new Date(row.endDate) - new Date(row.startDate)) /
                (1000 * 60 * 60 * 24)
            )}{" "}
            days
          </p>
        </div>
      ),
    },
    {
      header: "Progress",
      accessor: "progress",
      skeletonRenderer: () => (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full w-20 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
        </div>
      ),
      renderer: (row) => {
        const submittedDocs =
          row.requiredDocuments?.filter((doc) => doc.isSubmitted).length || 0;
        const totalDocs = row.requiredDocuments?.length || 0;
        const approvedSteps =
          row.approvalChain?.filter((step) => step.status === "approved")
            .length || 0;
        const totalSteps = row.approvalChain?.length || 0;

        // Calculate approval progress (20% docs + 80% approvals)
        const docProgress =
          totalDocs > 0 ? (submittedDocs / totalDocs) * 20 : 0;
        const approvalProgress =
          totalSteps > 0 ? (approvedSteps / totalSteps) * 80 : 0;
        const totalProgress = docProgress + approvalProgress;

        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Progress
              </span>
              <span className="text-xs font-bold text-blue-600">
                {Math.round(totalProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {submittedDocs}/{totalDocs} docs • {approvedSteps}/{totalSteps}{" "}
              approvals
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      ),
      renderer: (row) => {
        const getStatusDisplay = (status) => {
          switch (status) {
            case "pending_approval":
              return {
                text: "Pending HOD Approval",
                color: "bg-yellow-100 text-yellow-800",
              };
            case "pending_department_approval":
              return {
                text: "Pending Department Approval",
                color: "bg-blue-100 text-blue-800",
              };
            case "pending_project_management_approval":
              return {
                text: "Pending Project Management Approval",
                color: "bg-purple-100 text-purple-800",
              };
            case "pending_finance_approval":
              return {
                text: "Pending Finance Approval",
                color: "bg-orange-100 text-orange-800",
              };
            case "pending_executive_approval":
              return {
                text: "Pending Executive Approval",
                color: "bg-red-100 text-red-800",
              };
            default:
              return {
                text: "Pending Approval",
                color: "bg-yellow-100 text-yellow-800",
              };
          }
        };

        const statusInfo = getStatusDisplay(row.status);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help ${statusInfo.color}`}
            title={statusInfo.text}
          >
            {statusInfo.text.length > 5
              ? `${statusInfo.text.slice(0, 5)}...`
              : statusInfo.text}
          </span>
        );
      },
    },
    {
      header: "Submitted",
      accessor: "submittedAt",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      ),
      renderer: (row) => (
        <div className="text-sm text-gray-500">
          {formatDate(row.submittedAt)}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      skeletonRenderer: () => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ),
      renderer: (row) => {
        const allDocsSubmitted = areAllDocumentsSubmitted(row);
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewProject(row)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
              title="View Details"
            >
              <HiOutlineEye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewDocuments(row)}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 cursor-pointer relative"
              title="View Documents"
            >
              <HiDocument className="w-4 h-4" />
              {row.requiredDocuments?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {
                    row.requiredDocuments.filter((doc) => doc.isSubmitted)
                      .length
                  }
                </span>
              )}
            </button>
            {allDocsSubmitted && (
              <>
                <button
                  onClick={() => handleApprove(row)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Approve Project"
                >
                  <HiOutlineCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReject(row)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Reject Project"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (!user || user.role.level < 700) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h1>
            <p className="text-red-600">
              You don't have permission to access this page. Only Department
              Heads (HODs) can view project approvals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Department Project Approvals
          </h1>
          <p className="text-gray-600">
            Review and approve projects created by staff in your department
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <HiOutlineClipboardDocument className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">
                Project Approval Process
              </p>
              <p className="text-sm text-blue-600">
                Review project details, budget, timeline, and priority before
                making approval decisions.
              </p>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-lg shadow">
          <DataTable
            data={projects}
            columns={columns}
            loading={loading}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
            }}
            emptyMessage={{
              title: "No projects pending approval",
              description: "All department projects have been reviewed",
            }}
          />
        </div>
      </div>

      {/* Project Details Modal */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Project Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedProject(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Project Title</h4>
                  <p className="text-gray-600">{selectedProject.title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Project Code</h4>
                  <p className="text-gray-600 font-mono">
                    {selectedProject.projectCode || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-600">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Employee</h4>
                    <p className="text-gray-600">
                      {selectedProject.employee?.firstName}{" "}
                      {selectedProject.employee?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedProject.employee?.email}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Department</h4>
                    <p className="text-gray-600">
                      {selectedProject.department?.name}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Budget</h4>
                    <p className="text-gray-600">
                      {formatCurrency(selectedProject.budget)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Project Scope</h4>
                    <p className="text-gray-600 capitalize">
                      {selectedProject.projectScope || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Start Date</h4>
                    <p className="text-gray-600">
                      {formatDate(selectedProject.startDate)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">End Date</h4>
                    <p className="text-gray-600">
                      {formatDate(selectedProject.endDate)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Priority</h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                        selectedProject.priority
                      )}`}
                    >
                      {selectedProject.priority?.charAt(0).toUpperCase() +
                        selectedProject.priority?.slice(1) || "Medium"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Budget Allocation Required
                    </h4>
                    <p className="text-gray-600">
                      {selectedProject.requiresBudgetAllocation ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                {/* Project Items */}
                {selectedProject.projectItems &&
                  selectedProject.projectItems.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">
                          Project Items
                        </h4>
                        <span className="text-sm text-gray-500">
                          Total Items Cost: ₦
                          {selectedProject.projectItems
                            .reduce(
                              (sum, item) => sum + (item.totalPrice || 0),
                              0
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedProject.projectItems
                          .slice(0, 3)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium text-gray-900 text-sm">
                                  {item.name}
                                </h5>
                                <span className="text-sm font-semibold text-blue-600">
                                  ₦{item.totalPrice?.toLocaleString() || 0}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                {item.description}
                              </p>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Qty: {item.quantity}</span>
                                <span>
                                  Unit: ₦{item.unitPrice?.toLocaleString() || 0}
                                </span>
                              </div>
                            </div>
                          ))}
                        {selectedProject.projectItems.length > 3 && (
                          <div className="text-center py-2">
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              +{selectedProject.projectItems.length - 3} more
                              items
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Project Progress Tracking */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-blue-900">
                      Project Progress
                    </h4>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        Overall Progress
                      </span>
                      <span className="text-sm font-bold text-blue-900">
                        {(() => {
                          const submittedDocs =
                            selectedProject.requiredDocuments?.filter(
                              (doc) => doc.isSubmitted
                            ).length || 0;
                          const totalDocs =
                            selectedProject.requiredDocuments?.length || 0;
                          const approvedSteps =
                            selectedProject.approvalChain?.filter(
                              (step) => step.status === "approved"
                            ).length || 0;
                          const totalSteps =
                            selectedProject.approvalChain?.length || 0;

                          // Calculate approval progress (20% docs + 80% approvals)
                          const docProgress =
                            totalDocs > 0
                              ? (submittedDocs / totalDocs) * 20
                              : 0;
                          const approvalProgress =
                            totalSteps > 0
                              ? (approvedSteps / totalSteps) * 80
                              : 0;
                          const totalApprovalProgress =
                            docProgress + approvalProgress;

                          return Math.round(totalApprovalProgress);
                        })()}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(() => {
                            const submittedDocs =
                              selectedProject.requiredDocuments?.filter(
                                (doc) => doc.isSubmitted
                              ).length || 0;
                            const totalDocs =
                              selectedProject.requiredDocuments?.length || 0;
                            const approvedSteps =
                              selectedProject.approvalChain?.filter(
                                (step) => step.status === "approved"
                              ).length || 0;
                            const totalSteps =
                              selectedProject.approvalChain?.length || 0;

                            const docProgress =
                              totalDocs > 0
                                ? (submittedDocs / totalDocs) * 20
                                : 0;
                            const approvalProgress =
                              totalSteps > 0
                                ? (approvedSteps / totalSteps) * 80
                                : 0;
                            return docProgress + approvalProgress;
                          })()}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Phase Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Document Phase */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <svg
                              className="w-3 h-3 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            Document Phase
                          </span>
                        </div>
                        <span className="text-xs font-bold text-green-600">
                          {(() => {
                            const submittedDocs =
                              selectedProject.requiredDocuments?.filter(
                                (doc) => doc.isSubmitted
                              ).length || 0;
                            const totalDocs =
                              selectedProject.requiredDocuments?.length || 0;
                            return totalDocs > 0
                              ? Math.round((submittedDocs / totalDocs) * 100)
                              : 0;
                          })()}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(() => {
                              const submittedDocs =
                                selectedProject.requiredDocuments?.filter(
                                  (doc) => doc.isSubmitted
                                ).length || 0;
                              const totalDocs =
                                selectedProject.requiredDocuments?.length || 0;
                              return totalDocs > 0
                                ? (submittedDocs / totalDocs) * 100
                                : 0;
                            })()}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedProject.requiredDocuments?.filter(
                          (doc) => doc.isSubmitted
                        ).length || 0}{" "}
                        of {selectedProject.requiredDocuments?.length || 0}{" "}
                        documents submitted
                      </p>
                    </div>

                    {/* Approval Phase */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <svg
                              className="w-3 h-3 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            Approval Phase
                          </span>
                        </div>
                        <span className="text-xs font-bold text-blue-600">
                          {(() => {
                            const approvedSteps =
                              selectedProject.approvalChain?.filter(
                                (step) => step.status === "approved"
                              ).length || 0;
                            const totalSteps =
                              selectedProject.approvalChain?.length || 0;
                            return totalSteps > 0
                              ? Math.round((approvedSteps / totalSteps) * 100)
                              : 0;
                          })()}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(() => {
                              const approvedSteps =
                                selectedProject.approvalChain?.filter(
                                  (step) => step.status === "approved"
                                ).length || 0;
                              const totalSteps =
                                selectedProject.approvalChain?.length || 0;
                              return totalSteps > 0
                                ? (approvedSteps / totalSteps) * 100
                                : 0;
                            })()}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedProject.approvalChain?.filter(
                          (step) => step.status === "approved"
                        ).length || 0}{" "}
                        of {selectedProject.approvalChain?.length || 0}{" "}
                        approvals completed
                      </p>
                    </div>
                  </div>

                  {/* Approval Chain Status */}
                  {selectedProject.approvalChain &&
                    selectedProject.approvalChain.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">
                          Approval Chain Status
                        </h5>
                        <div className="space-y-2">
                          {selectedProject.approvalChain.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100"
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                                    step.status === "approved"
                                      ? "bg-green-100 text-green-600"
                                      : step.status === "pending"
                                      ? "bg-yellow-100 text-yellow-600"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {step.status === "approved" ? (
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : step.status === "pending" ? (
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm text-gray-700 capitalize">
                                  {step.level.replace(/_/g, " ")} Approval
                                </span>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  step.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : step.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {step.status === "approved"
                                  ? "Completed"
                                  : step.status === "pending"
                                  ? "Pending"
                                  : "Not Started"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Required Documents Status */}
                {selectedProject.requiredDocuments &&
                  selectedProject.requiredDocuments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Required Documents
                      </h4>
                      <div className="space-y-2">
                        {(() => {
                          const submittedDocs =
                            selectedProject.requiredDocuments.filter(
                              (doc) => doc.isSubmitted
                            );
                          const pendingDocs =
                            selectedProject.requiredDocuments.filter(
                              (doc) => !doc.isSubmitted
                            );

                          if (submittedDocs.length === 0) {
                            return (
                              <div className="text-center py-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">
                                  No documents uploaded yet
                                </p>
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* Show submitted documents */}
                              {submittedDocs.map((doc, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-green-900">
                                      {doc.title ||
                                        doc.documentType
                                          ?.replace(/_/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase()
                                          )}
                                    </p>
                                    <p className="text-xs text-green-700">
                                      {doc.description ||
                                        `${doc.documentType?.replace(
                                          /_/g,
                                          " "
                                        )} document`}
                                    </p>
                                  </div>
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                                    Submitted
                                  </span>
                                </div>
                              ))}

                              {/* Show pending documents count */}
                              {pendingDocs.length > 0 && (
                                <div className="text-center py-2">
                                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {pendingDocs.length} document
                                    {pendingDocs.length > 1 ? "s" : ""} pending
                                    upload
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
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
                    setApprovalComment("");
                  }}
                  disabled={isSubmitting}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineXMark className="h-5 w-5" />
                </button>
              </div>

              {/* Project Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <HiOutlineCheck className="h-6 w-6 text-green-600 mr-2" />
                  <h4 className="text-lg font-semibold text-green-800">
                    Ready for Approval
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-700">Project:</span>
                    <p className="text-green-600">{selectedProject.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Code:</span>
                    <p className="text-green-600 font-mono">
                      {selectedProject.projectCode}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Budget:</span>
                    <p className="text-green-600">
                      {formatCurrency(selectedProject.budget)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">
                      Priority:
                    </span>
                    <p className="text-green-600 capitalize">
                      {selectedProject.priority}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="4"
                  placeholder="Add any additional notes or comments for the project creator..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedProject(null);
                    setApprovalComment("");
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <HiOutlineCheck className="h-4 w-4 mr-2" />
                      Approve Project
                    </>
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
                    setRejectionReason("");
                  }}
                  disabled={isSubmitting}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineXMark className="h-5 w-5" />
                </button>
              </div>

              {/* Project Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <HiOutlineXMark className="h-6 w-6 text-red-600 mr-2" />
                  <h4 className="text-lg font-semibold text-red-800">
                    Project Requires Revision
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-red-700">Project:</span>
                    <p className="text-red-600">{selectedProject.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">Code:</span>
                    <p className="text-red-600 font-mono">
                      {selectedProject.projectCode}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">Budget:</span>
                    <p className="text-red-600">
                      {formatCurrency(selectedProject.budget)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">Priority:</span>
                    <p className="text-red-600 capitalize">
                      {selectedProject.priority}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows="4"
                  placeholder="Please provide a detailed reason for rejection. This will help the project creator understand what needs to be revised..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This feedback will be sent to the project creator for
                  revision.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedProject(null);
                    setRejectionReason("");
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <HiOutlineXMark className="h-4 w-4 mr-2" />
                      Reject Project
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedProjectForDocuments && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Project Documents - {selectedProjectForDocuments.title}
                </h3>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedProjectForDocuments.requiredDocuments?.map(
                  (doc, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        doc.isSubmitted
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              doc.isSubmitted
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            <HiDocument className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {doc.documentType
                                ?.replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {doc.isSubmitted
                                ? "Document submitted"
                                : "Document pending"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              doc.isSubmitted
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {doc.isSubmitted ? "Submitted" : "Pending"}
                          </div>
                          {doc.isSubmitted &&
                            getUploadedDocument(doc.documentType) && (
                              <button
                                onClick={() =>
                                  handleViewDocument(doc.documentType)
                                }
                                disabled={
                                  viewingDocumentId ===
                                  getUploadedDocument(doc.documentType)?._id
                                }
                                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                                title="View Document"
                              >
                                {viewingDocumentId ===
                                getUploadedDocument(doc.documentType)?._id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Loading...</span>
                                  </>
                                ) : (
                                  <>
                                    <HiArrowDownTray className="w-4 h-4" />
                                    <span>View</span>
                                  </>
                                )}
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectApprovals;
