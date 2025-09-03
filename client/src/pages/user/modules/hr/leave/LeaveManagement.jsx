import React, { useState, useEffect } from "react";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HiOutlineCheck, HiOutlineXMark } from "react-icons/hi2";
import { toast } from "react-toastify";
import { userModulesAPI } from "../../../../../services/userModules.js";
import { useAuth } from "../../../../../context/AuthContext.jsx";
import { getActiveDepartments } from "../../../../../services/departments.js";
import defaultAvatar from "../../../../../assets/defaulticon.jpg";
import DataTable from "../../../../../components/common/DataTable";
import ELRALogo from "../../../../../components/ELRALogo.jsx";

const LeaveManagement = () => {
  const { user } = useAuth();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .modal-shadow-enhanced {
        box-shadow: 
          0 25px 50px -12px rgba(0, 0, 0, 0.25),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          0 0 40px rgba(0, 0, 0, 0.1);
        animation: modalAppear 0.3s ease-out;
      }
      .modal-backdrop-enhanced {
        backdrop-filter: blur(8px);
        background: rgba(0, 0, 0, 0.6);
        animation: backdropAppear 0.3s ease-out;
      }
      @keyframes modalAppear {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes backdropAppear {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Role-based permissions for leave approval hierarchy
  const canViewAllRequests = user?.role?.level >= 600; // MANAGER+ can view all requests
  const canApproveLeave = user?.role?.level >= 600; // MANAGER+ can approve
  const canApproveAllDepartments = user?.role?.level >= 1000; // SUPER_ADMIN can approve all
  const canApproveOwnDepartment = user?.role?.level >= 700; // HOD can approve their department
  const canApproveDirectReports = user?.role?.level >= 600; // MANAGER can approve direct reports

  // Image utility functions
  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return getDefaultAvatar();
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${avatarPath}`;
  };

  const getAvatarDisplay = (user) => {
    if (user.avatar) {
      return (
        <img
          src={getImageUrl(user.avatar)}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.target.src = getDefaultAvatar();
          }}
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center">
        <span className="text-white font-semibold text-sm">
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </span>
      </div>
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, statsRes, departmentsRes] = await Promise.all([
        userModulesAPI.leave.getRequests(filters),
        userModulesAPI.leave.getStats(),
        getActiveDepartments(),
      ]);

      console.log("🔍 [LeaveManagement] API response:", requestsRes);
      console.log(
        "🔍 [LeaveManagement] Leave requests data:",
        requestsRes.data
      );

      setLeaveRequests(requestsRes.data);
      setStats(statsRes.data);
      setDepartments(departmentsRes.data.departments || []);
    } catch (error) {
      console.error("Error fetching leave data:", error);
      toast.error("Failed to fetch leave data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-[var(--elra-secondary-3)] text-[var(--elra-primary)]";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "Rejected":
        return <XCircleIcon className="w-4 h-4" />;
      case "Pending":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const handleApprove = async (requestId, action, comment = "") => {
    try {
      await userModulesAPI.leave.approveRequest(requestId, action, comment);
      toast.success(
        `Leave request ${
          action === "approve" ? "approved" : "rejected"
        } successfully!`
      );
      fetchData();
    } catch (error) {
      console.error("Error approving leave request:", error);
      toast.error(`Failed to ${action} leave request`);
    }
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setApprovalComment("");
    setShowApprovalModal(true);
  };

  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      const result = await userModulesAPI.leave.approveRequest(
        selectedRequest._id,
        "approve",
        approvalComment || "Approved by HR HOD"
      );
      if (result.success) {
        toast.success("Leave request approved successfully");
        setShowApprovalModal(false);
        setSelectedRequest(null);
        setApprovalComment("");
        fetchData();
      } else {
        throw new Error(result.message || "Failed to approve request");
      }
    } catch (error) {
      console.error("❌ [LeaveManagement] Error approving request:", error);
      toast.error("Failed to approve leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await userModulesAPI.leave.approveRequest(
        selectedRequest._id,
        "reject",
        rejectionReason
      );
      if (result.success) {
        toast.success("Leave request rejected successfully");
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason("");
        fetchData();
      } else {
        throw new Error(result.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("❌ [LeaveManagement] Error rejecting request:", error);
      toast.error("Failed to reject leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (requestId, reason = "") => {
    try {
      await userModulesAPI.leave.cancelRequest(requestId, reason);
      toast.success("Leave request cancelled successfully!");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      toast.error("Failed to cancel leave request");
    }
  };

  const canApproveRequest = (request) => {
    if (!canApproveLeave) return false;

    // Super Admin can approve all requests
    if (canApproveAllDepartments) return true;

    // Get department IDs for comparison
    const requestDeptId = request.department?._id || request.department;
    const userDeptId = user?.department?._id || user?.department;

    // HOD can approve requests from their department
    if (canApproveOwnDepartment && requestDeptId === userDeptId) return true;

    // Manager can approve direct reports (simplified - could be enhanced with reporting structure)
    if (canApproveDirectReports && requestDeptId === userDeptId) return true;

    return false;
  };

  // Check if HR HOD can approve this specific request (it's their turn)
  const canHRHODApprove = (request) => {
    // HR HOD can only approve requests that have been approved by Department HOD
    // and are now waiting for final HR approval
    if (
      user?.role?.level === 700 &&
      user?.department?.name === "Human Resources"
    ) {
      const canApprove =
        request.status === "Pending" &&
        request.approvals &&
        request.approvals.length > 0 &&
        request.approvals.some((approval) => approval.status === "Approved");

      console.log(
        `🔍 [LeaveManagement] HR HOD approval check for request ${request._id}:`,
        {
          status: request.status,
          approvalsCount: request.approvals?.length || 0,
          hasApprovedApproval:
            request.approvals?.some(
              (approval) => approval.status === "Approved"
            ) || false,
          canApprove,
          userRole: user?.role?.level,
          userDepartment: user?.department?.name,
        }
      );

      return canApprove;
    }
    return false;
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

  const columns = [
    {
      header: "Employee",
      accessor: "employee",
      skeletonRenderer: () => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      ),
      renderer: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {row.employee?.firstName} {row.employee?.lastName}
            </p>
            <p className="text-sm text-gray-500">{row.employee?.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Leave Type",
      accessor: "leaveType",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.leaveType} Leave
        </span>
      ),
    },
    {
      header: "Period",
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
          <p className="text-gray-500">{row.days} day(s)</p>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "department",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      ),
      renderer: (row) => (
        <div className="text-sm text-gray-900">
          {row.department?.name || "No department"}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      ),
      renderer: (row) => {
        const statusConfig = {
          pending: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            label: "Pending",
          },
          approved: {
            bg: "bg-green-100",
            text: "text-green-800",
            label: "Approved",
          },
          rejected: {
            bg: "bg-red-100",
            text: "text-red-800",
            label: "Rejected",
          },
          cancelled: {
            bg: "bg-gray-100",
            text: "text-gray-800",
            label: "Cancelled",
          },
        };
        const config =
          statusConfig[row.status?.toLowerCase()] || statusConfig.pending;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      header: "Approval Status",
      accessor: "approvalStatus",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse"></div>
      ),
      renderer: (row) => {
        if (row.status === "Approved" || row.status === "Rejected") {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Finalized
            </span>
          );
        }

        if (row.status === "Pending") {
          // Check if Department HOD has already approved
          if (
            row.approvals &&
            row.approvals.length > 0 &&
            row.approvals.some((approval) => approval.status === "Approved")
          ) {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Pending HR HOD
              </span>
            );
          } else {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Pending Dept HOD
              </span>
            );
          }
        }

        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            N/A
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
      renderer: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetails(row._id)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="View Details"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {/* Only show Approve/Reject buttons if HR HOD can approve this request */}
          {canHRHODApprove(row) && (
            <>
              <button
                onClick={() => handleApproveRequest(row)}
                className="p-2 text-gray-400 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 cursor-pointer"
                title="Approve Request"
              >
                <HiOutlineCheck className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRejectRequest(row)}
                className="p-2 text-gray-400 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 cursor-pointer"
                title="Reject Request"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleViewDetails = async (requestId) => {
    try {
      const response = await userModulesAPI.leave.getRequestById(requestId);
      setSelectedRequest(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching leave request details:", error);
      toast.error("Failed to fetch leave request details");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Approve and manage leave requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)]">
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] min-w-[150px]"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {canViewAllRequests && (
            <select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] min-w-[200px]"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] min-w-[250px] flex-1"
            placeholder="Search by employee name or ID"
          />
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <DataTable
          data={leaveRequests.docs || leaveRequests || []}
          columns={columns}
          loading={loading}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
          }}
          emptyMessage={{
            title: "No leave requests found",
            description: "No leave requests match your current filters",
          }}
        />
      </div>

      {/* Leave Request Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <ELRALogo variant="dark" size="sm" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Leave Request Details
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                    Employee Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {selectedRequest.employee.firstName?.[0]}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Employee Name
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {selectedRequest.employee.firstName}{" "}
                          {selectedRequest.employee.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">
                          D
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Department
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {selectedRequest.department.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    Leave Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">
                          T
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Leave Type
                        </label>
                        <p className="text-indigo-600 font-mono font-semibold">
                          {selectedRequest.leaveType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">
                          S
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Status
                        </label>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            selectedRequest.status
                          )}`}
                        >
                          {getStatusIcon(selectedRequest.status)}
                          <span className="ml-1">{selectedRequest.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                    Date Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">
                          S
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Start Date
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {new Date(
                            selectedRequest.startDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-semibold text-sm">
                          E
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          End Date
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {new Date(
                            selectedRequest.endDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          D
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Duration
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {selectedRequest.days} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 font-semibold text-sm">
                          T
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Submitted
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {new Date(
                            selectedRequest.submittedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 text-orange-600 mr-2" />
                  Request Reason
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">
                      R
                    </span>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Reason for Leave
                    </label>
                    <p className="text-gray-900 font-medium leading-relaxed">
                      {selectedRequest.reason}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRequest.approvals &&
                selectedRequest.approvals.length > 0 && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CalendarIcon className="h-5 w-5 text-purple-600 mr-2" />
                      Approval History
                    </h3>
                    <div className="space-y-3">
                      {selectedRequest.approvals.map((approval, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">
                                {approval.approver?.firstName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {approval.approver?.firstName}{" "}
                                {approval.approver?.lastName}
                              </p>
                              <p className="text-xs text-gray-600 uppercase tracking-wide">
                                {approval.role}
                              </p>
                              {approval.comment && (
                                <p className="text-sm text-gray-700 mt-1 italic">
                                  "{approval.comment}"
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              approval.status
                            )}`}
                          >
                            {getStatusIcon(approval.status)}
                            <span className="ml-1 font-semibold">
                              {approval.status}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <ELRALogo variant="dark" size="sm" />
                <h2 className="text-xl font-bold text-gray-900">
                  Approve Leave Request
                </h2>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 mb-2">
                  You are about to approve the leave request for{" "}
                  <span className="font-semibold">
                    {selectedRequest.employee?.firstName}{" "}
                    {selectedRequest.employee?.lastName}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">
                      Leave Type:
                    </span>{" "}
                    <span className="font-semibold text-blue-900">
                      {selectedRequest.leaveType}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Duration:</span>{" "}
                    <span className="font-semibold text-blue-900">
                      {selectedRequest.days} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Approval Comment (Optional)
              </label>
              <textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-colors resize-none"
                placeholder="Add a comment about this approval..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-4 h-4" />
                    Approve Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <ELRALogo variant="dark" size="sm" />
                <h2 className="text-xl font-bold text-gray-900">
                  Reject Leave Request
                </h2>
              </div>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 mb-2">
                  You are about to reject the leave request for{" "}
                  <span className="font-semibold">
                    {selectedRequest.employee?.firstName}{" "}
                    {selectedRequest.employee?.lastName}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-700 font-medium">
                      Leave Type:
                    </span>{" "}
                    <span className="font-semibold text-red-900">
                      {selectedRequest.leaveType}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Duration:</span>{" "}
                    <span className="font-semibold text-red-900">
                      {selectedRequest.days} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-colors resize-none"
                placeholder="Please provide a reason for rejection..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowRejectionModal(false)}
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <HiOutlineXMark className="w-4 h-4" />
                    Reject Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
