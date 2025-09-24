import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineCalendar,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineClock,
} from "react-icons/hi2";
import { useAuth } from "../../../../context/AuthContext";
import { leaveRequests } from "../../../../services/leave";
import DataTable from "../../../../components/common/DataTable";
import defaultAvatar from "../../../../assets/defaulticon.jpg";
import LeaveDetailsModal from "../../../../components/modals/LeaveDetailsModal";

const LeaveManagement = () => {
  const { user } = useAuth();
  const [leaveRequestsList, setLeaveRequestsList] = useState([]);
  const [leaveHistoryList, setLeaveHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionReasonError, setRejectionReasonError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return defaultAvatar;
    if (avatarPath.startsWith("http")) return avatarPath;
    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${avatarPath}`;
  };

  useEffect(() => {
    if (user) {
      fetchDepartmentLeaveRequests();
      fetchLeaveHistory();
    }
  }, [user]);

  const fetchDepartmentLeaveRequests = async () => {
    try {
      setLoading(true);
      console.log(
        "🔍 [DepartmentApprovals] Fetching department leave requests..."
      );
      const result = await leaveRequests.getDepartmentRequests();
      console.log("🔍 [DepartmentApprovals] API response:", result);

      if (result.success) {
        setLeaveRequestsList(result.data || []);
        console.log(
          "🔍 [DepartmentApprovals] Leave requests data:",
          result.data?.map((req) => ({
            id: req.id || req._id,
            employee: req.employee?.firstName + " " + req.employee?.lastName,
            status: req.status,
            currentApprover: req.currentApprover
              ? `${req.currentApprover.firstName} ${req.currentApprover.lastName}`
              : "None",
            reason: req.reason,
            approvalLevel: req.approvalLevel,
          }))
        );
      } else {
        toast.error(result.message || "Failed to fetch leave requests");
      }
    } catch (error) {
      console.error("❌ [DepartmentApprovals] Error fetching requests:", error);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveHistory = async () => {
    try {
      setHistoryLoading(true);
      console.log("🔍 [DepartmentApprovals] Fetching leave history...");
      const result = await leaveRequests.getDepartmentHistory();
      console.log("🔍 [DepartmentApprovals] History API response:", result);

      if (result.success) {
        setLeaveHistoryList(result.data || []);
        console.log(
          "🔍 [DepartmentApprovals] Leave history data:",
          (result.data || []).map((req) => ({
            id: req.id || req._id,
            employee: req.employee?.firstName + " " + req.employee?.lastName,
            status: req.status,
            reason: req.reason,
          }))
        );
      } else {
        toast.error(result.message || "Failed to fetch leave history");
      }
    } catch (error) {
      console.error("❌ [DepartmentApprovals] Error fetching history:", error);
      toast.error("Failed to fetch leave history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setApprovalComment("");
    setShowApprovalModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setRejectionReasonError("");
    setShowRejectionModal(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);

    const safetyTimeout = setTimeout(() => {
      console.log(
        "⚠️ [DepartmentApprovals] Safety timeout triggered - forcing modal close"
      );
      setIsSubmitting(false);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalComment("");
      toast.error(
        "Request timed out. Please check if the approval was successful."
      );
    }, 15000);

    try {
      console.log(
        "🔍 [DepartmentApprovals] Starting approval for request:",
        selectedRequest.id || selectedRequest._id
      );

      const result = await leaveRequests.approve(
        selectedRequest.id || selectedRequest._id,
        "approve",
        approvalComment || "Approved by Department HOD"
      );

      clearTimeout(safetyTimeout); // Clear the safety timeout
      console.log("🔍 [DepartmentApprovals] Approval API response:", result);

      if (result && result.success) {
        console.log(
          "✅ [DepartmentApprovals] Approval successful, refreshing data..."
        );
        toast.success("Leave request approved successfully");

        // Close modal and reset state
        setShowApprovalModal(false);
        setSelectedRequest(null);
        setApprovalComment("");

        // Refresh data
        await fetchDepartmentLeaveRequests();
        if (activeTab === "history") {
          await fetchLeaveHistory();
        }
      } else {
        console.error(
          "❌ [DepartmentApprovals] Approval failed:",
          result?.message
        );
        toast.error(result?.message || "Failed to approve request");
      }
    } catch (error) {
      clearTimeout(safetyTimeout); // Clear the safety timeout
      console.error("❌ [DepartmentApprovals] Error approving request:", error);
      toast.error(error.message || "Failed to approve leave request");
    } finally {
      console.log("🔍 [DepartmentApprovals] Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setRejectionReasonError("Please provide a rejection reason");
      return;
    }
    setRejectionReasonError("");
    setIsSubmitting(true);
    try {
      const result = await leaveRequests.approve(
        selectedRequest.id || selectedRequest._id,
        "reject",
        rejectionReason
      );
      if (result.success) {
        toast.success("Leave request rejected successfully");
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason("");
        fetchDepartmentLeaveRequests();
        if (activeTab === "history") {
          fetchLeaveHistory();
        }
      } else {
        throw new Error(result.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("❌ [DepartmentApprovals] Error rejecting request:", error);
      toast.error("Failed to reject leave request");
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
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
            {row.employee?.avatar ? (
              <img
                src={getImageUrl(row.employee.avatar)}
                alt={`${row.employee?.firstName || ""} ${
                  row.employee?.lastName || ""
                }`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                }}
              />
            ) : (
              <span>
                {(row.employee?.firstName?.[0] || "").toUpperCase()}
                {(row.employee?.lastName?.[0] || "").toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 truncate">
                {row.employee?.firstName} {row.employee?.lastName}
              </p>
              {row.employee?.employeeId && (
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {row.employee.employeeId}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {row.employee?.email || "No email"}
            </p>
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
      header: "Reason",
      accessor: "reason",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      ),
      renderer: (row) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 break-words">
            {row.reason && row.reason.length > 50
              ? `${row.reason.substring(0, 50)}...`
              : row.reason}
          </p>
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
        // Check if this is pending but has approved approvals (means HOD approved, waiting for HR)
        if (
          row.status?.toLowerCase() === "pending" &&
          row.approvals &&
          row.approvals.length > 0 &&
          row.approvals.some((approval) => approval.status === "Approved")
        ) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Pending HR HOD Approval
            </span>
          );
        }

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
      header: "Approval History",
      accessor: "approvals",
      skeletonRenderer: () => (
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      ),
      renderer: (row) => {
        if (row.status === "Approved") {
          return (
            <div className="text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Approved
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Final approval granted
              </p>
            </div>
          );
        } else if (row.status === "Rejected") {
          return (
            <div className="text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Rejected
              </span>
              <p className="text-xs text-gray-500 mt-1">Request denied</p>
            </div>
          );
        } else if (row.status === "Cancelled") {
          return (
            <div className="text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Cancelled
              </span>
              <p className="text-xs text-gray-500 mt-1">Request cancelled</p>
            </div>
          );
        } else {
          // Pending status - show current approver
          return (
            <div className="text-sm">
              {row.approvals &&
              row.approvals.length > 0 &&
              row.approvals.some(
                (approval) => approval.status === "Approved"
              ) ? (
                <>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Pending HR HOD Approval
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Waiting for: {row.currentApprover?.firstName}{" "}
                    {row.currentApprover?.lastName}
                  </p>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Awaiting approval
                  </p>
                </>
              )}
            </div>
          );
        }
      },
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
            onClick={() => handleViewRequest(row)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="View Details"
          >
            <HiOutlineEye className="w-4 h-4" />
          </button>
          {/* Only show Approve/Reject buttons if status is pending AND no approved approvals yet (meaning it hasn't been approved by HOD yet) AND we're in pending tab */}
          {activeTab === "pending" &&
            (row.status === "pending" || row.status === "Pending") &&
            (!row.approvals ||
              row.approvals.length === 0 ||
              !row.approvals.some(
                (approval) => approval.status === "Approved"
              )) && (
              <>
                <button
                  onClick={() => handleApprove(row)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Approve Request"
                >
                  <HiOutlineCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReject(row)}
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
              Heads (HODs) can view department approvals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isHRHOD =
    user.role.level === 700 && user.department?.name === "Human Resources";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Department Approvals
          </h1>
          <p className="text-gray-600">
            {isHRHOD
              ? "As HR HOD, you can approve leave requests from all departments."
              : `As ${user.department?.name} Department Head, you can approve leave requests from your department staff.`}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <HiOutlineCheck className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">
                Department Head Access
              </p>
              <p className="text-sm text-green-600">
                {isHRHOD
                  ? "As a Human Resources Department Head, you can approve requests from all departments."
                  : `As a ${user.department?.name} Department Head, you can approve requests from your team members.`}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("pending")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "pending"
                    ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <HiOutlineClock className="w-4 h-4" />
                  <span>Pending Requests</span>
                  {leaveRequestsList.length > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      {leaveRequestsList.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <HiOutlineCalendar className="w-4 h-4" />
                  <span>Request History</span>
                  {leaveHistoryList.length > 0 && (
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                      {leaveHistoryList.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === "pending" ? (
            <DataTable
              data={leaveRequestsList}
              columns={columns}
              loading={loading}
              actions={{
                showEdit: false,
                showDelete: false,
                showToggle: false,
              }}
              emptyMessage={{
                title: "No pending requests found",
                description:
                  "No pending leave requests require your approval at this time",
              }}
            />
          ) : (
            <DataTable
              data={leaveHistoryList}
              columns={columns}
              loading={historyLoading}
              actions={{
                showEdit: false,
                showDelete: false,
                showToggle: false,
              }}
              emptyMessage={{
                title: "No request history found",
                description:
                  "No completed leave requests found in your department",
              }}
            />
          )}
        </div>
      </div>

      {/* Leave Details Modal */}
      <LeaveDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />

      {/* Approval Confirmation Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-[9999] animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-white bg-opacity-50"
            onClick={() => {
              setShowApprovalModal(false);
              setSelectedRequest(null);
              setApprovalComment("");
            }}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  ELRA Leave Request Authorization
                </h3>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                    setApprovalComment("");
                  }}
                  disabled={isSubmitting}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="h-5 w-5"
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

              {/* Leave Request Information Section */}
              <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm mb-6">
                <div className="flex">
                  <HiOutlineCalendar className="h-5 w-5 text-[var(--elra-primary)] mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--elra-primary)] font-medium mb-3">
                      Leave Request Information
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Employee:
                        </span>
                        <p className="text-gray-600">
                          {selectedRequest.employee?.firstName}{" "}
                          {selectedRequest.employee?.lastName}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Leave Type:
                        </span>
                        <p className="text-gray-600">
                          {selectedRequest.leaveType} Leave
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Department:
                        </span>
                        <p className="text-gray-600">
                          {selectedRequest.department?.name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Duration:
                        </span>
                        <p className="text-gray-600">
                          {selectedRequest.days} day(s)
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">
                          Period:
                        </span>
                        <p className="text-gray-600">
                          {formatDate(selectedRequest.startDate)} -{" "}
                          {formatDate(selectedRequest.endDate)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">
                          Reason:
                        </span>
                        <p className="text-gray-600 break-words">
                          {selectedRequest.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorization Level */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Authorization Level
                </h4>
                <p className="text-sm text-gray-600">
                  You are authorizing this leave request at the{" "}
                  <strong className="text-[var(--elra-primary)]">
                    Department HOD
                  </strong>{" "}
                  level.
                </p>
              </div>

              {/* Authorization Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authorization Notes (Optional)
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add any additional notes or comments for this authorization..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Note:</strong> These notes will be recorded with your
                  authorization.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
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
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-md hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin cursor-pointer"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Authorize Leave Request"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-[9999] animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-white bg-opacity-50"
            onClick={() => {
              setShowRejectionModal(false);
              setSelectedRequest(null);
              setRejectionReason("");
              setRejectionReasonError("");
            }}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  ELRA Leave Request Review - Revision Required
                </h3>
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedRequest(null);
                    setRejectionReason("");
                    setRejectionReasonError("");
                  }}
                  disabled={isSubmitting}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="h-5 w-5"
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

              {/* Leave Request Information Section */}
              <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm mb-6">
                <div className="flex">
                  <HiOutlineCalendar className="h-5 w-5 text-[var(--elra-primary)] mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--elra-primary)] font-medium mb-3">
                      Leave Request Information
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Employee:
                        </span>
                        <p className="text-gray-600">
                          {selectedRequest.employee?.firstName}{" "}
                          {selectedRequest.employee?.lastName}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Leave Type:
                        </span>
                        <p className="text-gray-600">
                          {selectedRequest.leaveType} Leave
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Department:
                        </span>
                        <p className="text-gray-600">
                          {selectedRequest.department?.name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Duration:
                        </span>
                        <p className="text-gray-600">
                          {selectedRequest.days} day(s)
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">
                          Period:
                        </span>
                        <p className="text-gray-600">
                          {formatDate(selectedRequest.startDate)} -{" "}
                          {formatDate(selectedRequest.endDate)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-700">Reason:</span>
                        <p className="text-gray-600 break-words">
                          {selectedRequest.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revision Level */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Revision Level
                </h4>
                <p className="text-sm text-gray-600">
                  This leave request requires revision at the{" "}
                  <strong className="text-[var(--elra-primary)]">
                    Department HOD
                  </strong>{" "}
                  level.
                </p>
              </div>

              {/* Warning Section */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <HiOutlineXMark className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700 font-medium mb-1">
                      Important Notice
                    </p>
                    <p className="text-sm text-red-600">
                      This action will halt the approval process and require the
                      leave request to be resubmitted with necessary revisions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Revision Category */}
              <div className="mb-4">
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
                  <option value="insufficient_justification">
                    Insufficient Justification
                  </option>
                  <option value="timing_issues">
                    Timing & Schedule Issues
                  </option>
                  <option value="documentation_incomplete">
                    Documentation Incomplete
                  </option>
                  <option value="resource_constraints">
                    Resource & Coverage Issues
                  </option>
                  <option value="policy_violation">Policy Violation</option>
                  <option value="other">Other Requirements</option>
                </select>
              </div>

              {/* Revision Requirements */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revision Requirements <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide specific requirements for revision, including what needs to be addressed and any recommendations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  rows="4"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Note:</strong> These requirements will be sent to the
                  employee for revision.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedRequest(null);
                    setRejectionReason("");
                    setRejectionReasonError("");
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
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
      )}
    </div>
  );
};

export default LeaveManagement;
