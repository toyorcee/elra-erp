import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineClipboardDocument,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineDocument,
} from "react-icons/hi2";
import { useAuth } from "../../../../context/AuthContext";
import DataTable from "../../../../components/common/DataTable";
import { fetchHODApprovalHistory } from "../../../../services/projectAPI";
import { viewDocument } from "../../../../services/documents.js";

const ApprovalHistory = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedProjectDocs, setSelectedProjectDocs] = useState(null);
  const [viewingDocumentId, setViewingDocumentId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchApprovalHistory();
    }
  }, [user]);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      const response = await fetchHODApprovalHistory();

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
          approvedAt: project.approvedAt,
          approvalLevel: project.approvalLevel,
          approvalComments: project.approvalComments,
          projectCode: project.code,
          projectScope: project.projectScope,
          requiresBudgetAllocation: project.requiresBudgetAllocation,
          projectItems: project.projectItems,
          requiredDocuments: project.requiredDocuments,
          documentStats: project.documentStats,
          approvalChain: project.approvalChain,
        }));

        setProjects(transformedProjects);
        console.log(
          `✅ [ApprovalHistory] Loaded ${transformedProjects.length} approved projects`
        );
      } else {
        console.error(
          "❌ [ApprovalHistory] API response error:",
          response.message
        );
        toast.error(response.message || "Failed to fetch approval history");
        setProjects([]);
      }
    } catch (error) {
      console.error(
        "❌ [ApprovalHistory] Error fetching approval history:",
        error
      );
      toast.error("Failed to fetch approval history");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleViewDocs = (project) => {
    setSelectedProjectDocs(project);
    setShowDocsModal(true);
  };

  const handleViewDocument = async (documentId) => {
    try {
      setViewingDocumentId(documentId);
      const result = await viewDocument(documentId);
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getApprovalLevelColor = (level) => {
    const colors = {
      hod: "bg-blue-100 text-blue-800",
      department: "bg-green-100 text-green-800",
      finance: "bg-yellow-100 text-yellow-800",
      executive: "bg-purple-100 text-purple-800",
      legal_compliance: "bg-red-100 text-red-800",
    };
    return colors[level] || colors.hod;
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-800",
      implementation: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      pending_approval: "bg-yellow-100 text-yellow-800",
      pending_department_approval: "bg-blue-100 text-blue-800",
      pending_project_management_approval: "bg-purple-100 text-purple-800",
      pending_finance_approval: "bg-orange-100 text-orange-800",
      pending_executive_approval: "bg-red-100 text-red-800",
    };
    return colors[status] || colors.approved;
  };

  const getStatusText = (status) => {
    const statusMap = {
      approved: "Approved",
      implementation: "Implementation",
      completed: "Completed",
      pending_approval: "Pending HOD Approval",
      pending_department_approval: "Pending Department Approval",
      pending_project_management_approval:
        "Pending Project Management Approval",
      pending_finance_approval: "Pending Finance Approval",
      pending_executive_approval: "Pending Executive Approval",
    };
    return statusMap[status] || "Approved";
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
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <HiOutlineCheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p
              className="font-medium text-gray-900 cursor-help"
              title={row.title}
            >
              {row.title.length > 15
                ? `${row.title.slice(0, 15)}...`
                : row.title}
            </p>
            <p
              className="text-sm text-gray-500 cursor-help"
              title={row.employee?.email}
            >
              {row.employee?.email && row.employee.email.length > 20
                ? `${row.employee.email.slice(0, 20)}...`
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
      header: "Approval Level",
      accessor: "approvalLevel",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalLevelColor(
            row.approvalLevel
          )}`}
        >
          {row.approvalLevel?.charAt(0).toUpperCase() +
            row.approvalLevel?.slice(1) || "HOD"}
        </span>
      ),
    },
    {
      header: "Approved At",
      accessor: "approvedAt",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      ),
      renderer: (row) => (
        <div className="text-sm text-gray-500">
          {formatDate(row.approvedAt)}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            row.status
          )}`}
        >
          {getStatusText(row.status)}
        </span>
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
              <span className="text-xs font-bold text-green-600">
                {Math.round(totalProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
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
      header: "Actions",
      accessor: "actions",
      skeletonRenderer: () => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ),
      renderer: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewProject(row)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="View Details"
          >
            <HiOutlineEye className="w-4 h-4" />
          </button>
          {row.requiredDocuments && row.requiredDocuments.length > 0 && (
            <button
              onClick={() => handleViewDocs(row)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 cursor-pointer"
              title="View Documents"
            >
              <HiOutlineDocument className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
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
              Heads (HODs) can view approval history.
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
            Department Approval History
          </h1>
          <p className="text-gray-600">
            View all projects from your department that you have approved as{" "}
            {user.department?.name} Department Head.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <HiOutlineCheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">
                Your Department Approval History
              </p>
              <p className="text-sm text-green-600">
                This shows all projects from your department that you have
                approved.
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
              title: "No approval history found",
              description: "You haven't approved any projects yet",
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
                    <h4 className="font-medium text-gray-900">
                      Approval Level
                    </h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalLevelColor(
                        selectedProject.approvalLevel
                      )}`}
                    >
                      {selectedProject.approvalLevel?.charAt(0).toUpperCase() +
                        selectedProject.approvalLevel?.slice(1) || "HOD"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Approved At</h4>
                    <p className="text-gray-600">
                      {formatDate(selectedProject.approvedAt)}
                    </p>
                  </div>
                </div>

                {/* Project Progress Tracking */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-green-600"
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
                    <h4 className="text-lg font-semibold text-green-900">
                      Project Progress
                    </h4>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-green-800">
                        Overall Progress
                      </span>
                      <span className="text-sm font-bold text-green-900">
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
                    <div className="w-full bg-green-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
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
                    <div className="bg-white rounded-lg p-4 border border-green-100">
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
                    <div className="bg-white rounded-lg p-4 border border-green-100">
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
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            Approval Phase
                          </span>
                        </div>
                        <span className="text-xs font-bold text-green-600">
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
                          className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
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

                {/* Approval Comments */}
                {selectedProject.approvalComments && (
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Your Approval Comments
                    </h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        {selectedProject.approvalComments}
                      </p>
                    </div>
                  </div>
                )}

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

                {/* Document Status */}
                {selectedProject.requiredDocuments &&
                  selectedProject.requiredDocuments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Document Status
                      </h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-800">
                            {selectedProject.documentStats?.submitted || 0} of{" "}
                            {selectedProject.documentStats?.total || 0}{" "}
                            documents submitted
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            {selectedProject.documentStats?.percentage || 0}%
                            Complete
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocsModal && selectedProjectDocs && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Project Documents - {selectedProjectDocs.title}
                </h3>
                <button
                  onClick={() => {
                    setShowDocsModal(false);
                    setSelectedProjectDocs(null);
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
                {selectedProjectDocs.requiredDocuments &&
                selectedProjectDocs.requiredDocuments.length > 0 ? (
                  selectedProjectDocs.requiredDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <HiOutlineDocumentText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 capitalize">
                              {doc.documentType?.replace(/_/g, " ")}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {doc.fileName || "Document"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              doc.approvalStatus === "approved"
                                ? "bg-green-100 text-green-800"
                                : doc.approvalStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {doc.approvalStatus?.charAt(0).toUpperCase() +
                              doc.approvalStatus?.slice(1) || "Pending"}
                          </span>
                          {doc.documentId && (
                            <button
                              onClick={() => handleViewDocument(doc.documentId)}
                              disabled={viewingDocumentId === doc.documentId}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {viewingDocumentId === doc.documentId ? (
                                <>
                                  <div className="w-4 h-4 mr-1 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                  Opening...
                                </>
                              ) : (
                                <>
                                  <HiOutlineEye className="w-4 h-4 mr-1" />
                                  View
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {doc.submittedAt && (
                        <div className="text-xs text-gray-500">
                          Submitted: {formatDate(doc.submittedAt)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <HiOutlineDocumentText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No documents found for this project
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalHistory;
