import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineClipboardDocument,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineClock,
} from "react-icons/hi2";
import { useAuth } from "../../../../context/AuthContext";
import DataTable from "../../../../components/common/DataTable";

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

  useEffect(() => {
    if (user) {
      fetchDepartmentProjects();
    }
  }, [user]);

  const fetchDepartmentProjects = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch department projects pending approval
      // For now, using mock data
      const mockProjects = [
        {
          id: "1",
          title: "Department Website Redesign",
          employee: { firstName: "John", lastName: "Doe", email: "john.doe@elra.com" },
          department: { name: "Information Technology" },
          budget: 50000,
          startDate: "2025-01-15",
          endDate: "2025-03-15",
          status: "pending",
          priority: "high",
          description: "Redesign the department's internal website for better user experience",
          submittedAt: "2025-01-10",
        },
        {
          id: "2",
          title: "Process Automation Initiative",
          employee: { firstName: "Jane", lastName: "Smith", email: "jane.smith@elra.com" },
          department: { name: "Information Technology" },
          budget: 75000,
          startDate: "2025-02-01",
          endDate: "2025-04-30",
          status: "pending",
          priority: "medium",
          description: "Automate manual processes to improve efficiency",
          submittedAt: "2025-01-12",
        },
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error("❌ [ProjectApprovals] Error fetching projects:", error);
      toast.error("Failed to fetch projects");
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

  const handleApproveSubmit = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
      // TODO: Implement API call to approve project
      toast.success("Project approved successfully");
      setShowApprovalModal(false);
      setSelectedProject(null);
      setApprovalComment("");
      fetchDepartmentProjects();
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
      // TODO: Implement API call to reject project
      toast.success("Project rejected successfully");
      setShowRejectionModal(false);
      setSelectedProject(null);
      setRejectionReason("");
      fetchDepartmentProjects();
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
            <p className="font-medium text-gray-900">{row.title}</p>
            <p className="text-sm text-gray-500">{row.employee?.email}</p>
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
            {Math.ceil((new Date(row.endDate) - new Date(row.startDate)) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      ),
    },
    {
      header: "Priority",
      accessor: "priority",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(row.priority)}`}>
          {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending Approval
        </span>
      ),
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
      renderer: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewProject(row)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="View Details"
          >
            <HiOutlineEye className="w-4 h-4" />
          </button>
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
            Project Approvals
          </h1>
          <p className="text-gray-600">
            As {user.department?.name} Department Head, review and approve project requests from your team members.
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
                Review project details, budget, timeline, and priority before making approval decisions.
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Project Title</h4>
                  <p className="text-gray-600">{selectedProject.title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-600">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Employee</h4>
                    <p className="text-gray-600">
                      {selectedProject.employee?.firstName} {selectedProject.employee?.lastName}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Budget</h4>
                    <p className="text-gray-600">{formatCurrency(selectedProject.budget)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Start Date</h4>
                    <p className="text-gray-600">{formatDate(selectedProject.startDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">End Date</h4>
                    <p className="text-gray-600">{formatDate(selectedProject.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Approve Project
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add any additional notes..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedProject(null);
                    setApprovalComment("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Project
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedProject(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Reject"}
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
