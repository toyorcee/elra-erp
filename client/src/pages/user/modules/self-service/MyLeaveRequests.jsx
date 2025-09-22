import React, { useState, useEffect } from "react";
import {
  HiCalendar,
  HiClock,
  HiEye,
  HiPlus,
  HiPencil,
  HiTrash,
  HiChartBar,
  HiCheckCircle,
  HiExclamationTriangle,
  HiXMark,
} from "react-icons/hi2";
import { HiRefresh } from "react-icons/hi";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import { leaveRequests } from "../../../../services/leave";
import LeaveRequestModal from "../../../../components/modals/LeaveRequestModal";
import DeleteConfirmationModal from "../../../../components/modals/DeleteConfirmationModal";
import LeaveDetailsModal from "../../../../components/modals/LeaveDetailsModal";

const MyLeaveRequests = () => {
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    initialized,
  } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailsRequest, setDetailsRequest] = useState(null);

  const filteredRequests = React.useMemo(() => {
    console.log("🔍 [Filtering] Current filters:", filters);
    console.log("🔍 [Filtering] Current search:", searchTerm);
    console.log(
      "🔍 [Filtering] All requests:",
      requests.map((r) => ({ id: r.id || r._id, status: r.status }))
    );

    return requests.filter((request) => {
      if (filters.status !== "all") {
        const requestStatus = request.status?.toLowerCase() || "";
        const filterStatus = filters.status.toLowerCase();
        console.log(
          `🔍 [Filtering] Comparing status: "${requestStatus}" vs "${filterStatus}"`
        );
        if (requestStatus !== filterStatus) {
          return false;
        }
      }

      if (filters.type !== "all" && request.leaveType !== filters.type) {
        return false;
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          request.leaveType?.toLowerCase().includes(searchLower) ||
          request.reason?.toLowerCase().includes(searchLower) ||
          request.status?.toLowerCase().includes(searchLower) ||
          `${request.startDate} ${request.endDate}`
            .toLowerCase()
            .includes(searchLower);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [requests, filters, searchTerm]);

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending", color: "text-yellow-600" },
    { value: "approved", label: "Approved", color: "text-green-600" },
    { value: "rejected", label: "Rejected", color: "text-red-600" },
  ];

  const [leaveTypes, setLeaveTypes] = useState([
    { value: "all", label: "All Types" },
    { value: "Annual", label: "Annual Leave" },
    { value: "Sick", label: "Sick Leave" },
    { value: "Personal", label: "Personal Leave" },
    { value: "Maternity", label: "Maternity Leave" },
    { value: "Paternity", label: "Paternity Leave" },
    { value: "Study", label: "Study Leave" },
    { value: "Bereavement", label: "Bereavement Leave" },
  ]);

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "startDate", label: "Start Date" },
    { value: "status", label: "Status" },
    { value: "type", label: "Leave Type" },
  ];

  // Fetch leave types from backend
  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveRequests.getTypes();
      if (response.success) {
        const backendTypes = response.data;
        const updatedTypes = [
          { value: "all", label: "All Types" },
          ...backendTypes.map((type) => ({
            value: type,
            label:
              type +
              (type === "Annual"
                ? " Leave"
                : type === "Sick"
                ? " Leave"
                : type === "Personal"
                ? " Leave"
                : type === "Maternity"
                ? " Leave"
                : type === "Paternity"
                ? " Leave"
                : type === "Study"
                ? " Leave"
                : type === "Bereavement"
                ? " Leave"
                : ""),
          })),
        ];
        setLeaveTypes(updatedTypes);
      }
    } catch (error) {
      console.error("❌ [MyLeaveRequests] Error fetching leave types:", error);
    }
  };

  useEffect(() => {
    console.log("🔍 [MyLeaveRequests] Auth state changed:", {
      isAuthenticated,
      initialized,
      userId: user?.id || user?._id,
      user: user,
    });

    if (isAuthenticated && initialized && (user?.id || user?._id)) {
      console.log("✅ [MyLeaveRequests] Auth ready, fetching requests...");
      fetchLeaveRequests();
      fetchLeaveTypes();
    } else {
      console.log("⏳ [MyLeaveRequests] Waiting for auth...", {
        isAuthenticated,
        initialized,
        hasUserId: !!(user?.id || user?._id),
      });
    }
  }, [isAuthenticated, initialized, user?.id, user?._id]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      console.log(
        "🔍 [MyLeaveRequests] Fetching leave requests for user:",
        user.id || user._id
      );

      const result = await leaveRequests.getMyRequests();

      if (result.success) {
        console.log(
          "✅ [MyLeaveRequests] Leave requests fetched successfully:",
          result.data
        );
        console.log("🔍 [MyLeaveRequests] First request details:", {
          id: result.data[0]?.id || result.data[0]?._id,
          status: result.data[0]?.status,
          statusType: typeof result.data[0]?.status,
          fullRequest: result.data[0],
        });
        setRequests(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch leave requests");
      }
    } catch (error) {
      console.error(
        "❌ [MyLeaveRequests] Error fetching leave requests:",
        error
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load leave requests";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "approved":
        return "text-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Annual":
        return "text-blue-600";
      case "Sick":
        return "text-red-600";
      case "Personal":
        return "text-purple-600";
      case "Maternity":
        return "text-pink-600";
      case "Paternity":
        return "text-indigo-600";
      case "Study":
        return "text-green-600";
      case "Bereavement":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate statistics
  const getLeaveStats = () => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(
      (r) => r.status === "pending" || r.status === "Pending"
    ).length;
    const approvedRequests = requests.filter(
      (r) => r.status === "approved" || r.status === "Approved"
    ).length;
    const rejectedRequests = requests.filter(
      (r) => r.status === "rejected" || r.status === "Rejected"
    ).length;

    const totalDays = requests.reduce((sum, r) => sum + (r.days || 0), 0);
    const approvedDays = requests
      .filter((r) => r.status === "approved" || r.status === "Approved")
      .reduce((sum, r) => sum + (r.days || 0), 0);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalDays,
      approvedDays,
    };
  };

  const stats = getLeaveStats();

  const columns = [
    {
      header: "Leave Type",
      accessor: "leaveType",
      renderer: (request) => (
        <span
          className={`text-sm font-medium ${getTypeColor(request.leaveType)}`}
        >
          {leaveTypes.find((t) => t.value === request.leaveType)?.label ||
            request.leaveType}
        </span>
      ),
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      ),
    },
    {
      header: "Period",
      accessor: "period",
      renderer: (request) => (
        <div>
          <div className="text-sm text-gray-900">
            {formatDate(request.startDate)} - {formatDate(request.endDate)}
          </div>
          <div className="text-xs text-gray-500">{request.days} day(s)</div>
        </div>
      ),
      skeletonRenderer: () => (
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      ),
    },
    {
      header: "Reason",
      accessor: "reason",
      renderer: (request) => (
        <div
          className="text-sm text-gray-700 max-w-xs break-words leading-relaxed"
          title={request.reason}
        >
          {request.reason}
        </div>
      ),
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (request) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            request.status
          )}`}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      ),
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      ),
    },
    {
      header: "Current Approver",
      accessor: "currentApprover",
      renderer: (request) => {
        if (request.status === "approved" || request.status === "rejected") {
          return (
            <div className="text-sm text-gray-500">
              {request.status === "approved" ? "Completed" : "Rejected"}
            </div>
          );
        }

        if (request.currentApprover) {
          return (
            <div className="text-sm text-blue-600 font-medium">
              {request.currentApprover.firstName}{" "}
              {request.currentApprover.lastName}
              <div className="text-xs text-gray-500">
                {request.currentApprover.role?.name || "HOD"}
              </div>
            </div>
          );
        }

        return <div className="text-sm text-gray-500">Pending Assignment</div>;
      },
      skeletonRenderer: () => (
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      ),
    },
    {
      header: "Submitted",
      accessor: "createdAt",
      renderer: (request) => (
        <div className="text-sm text-gray-500">
          {formatDate(request.createdAt)}
        </div>
      ),
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      align: "center",
      renderer: (request) => {
        console.log("🔍 [Actions Column] Rendering actions for request:", {
          id: request.id || request._id,
          status: request.status,
          statusType: typeof request.status,
          isPending: request.status === "pending",
          isPendingStrict: request.status === "Pending",
        });

        return (
          <div className="flex items-center justify-center space-x-1 w-40">
            {/* View button - always visible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewRequest(request);
              }}
              className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white rounded-lg transition-colors cursor-pointer"
              title="View Details"
            >
              <HiEye className="w-4 h-4" />
            </button>

            {/* Edit button - only for Pending requests with NO approvals */}
            {(request.status === "pending" || request.status === "Pending") &&
              (!request.approvals || request.approvals.length === 0) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRequest(request);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit Request"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
              )}

            {/* Delete button - only for Pending requests with NO approvals */}
            {(request.status === "pending" || request.status === "Pending") &&
              (!request.approvals || request.approvals.length === 0) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRequest(request);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Request"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              )}
          </div>
        );
      },
      skeletonRenderer: () => (
        <div className="flex items-center justify-center space-x-1 w-40">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
      ),
    },
  ];

  const handleViewRequest = (request) => {
    setDetailsRequest(request);
    setShowDetailsModal(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setModalMode("edit");
    setShowLeaveModal(true);
  };

  const handleDeleteRequest = (request) => {
    setDeleteTarget(request);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      console.log(
        "🗑️ [MyLeaveRequests] Deleting leave request:",
        deleteTarget.id || deleteTarget._id
      );

      const result = await leaveRequests.delete(
        deleteTarget.id || deleteTarget._id
      );

      if (result.success) {
        console.log("✅ [MyLeaveRequests] Leave request deleted successfully");
        toast.success("Leave request deleted successfully");
        // Refresh the list
        fetchLeaveRequests();
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        throw new Error(result.message || "Failed to delete leave request");
      }
    } catch (error) {
      console.error(
        "❌ [MyLeaveRequests] Error deleting leave request:",
        error
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete leave request";
      toast.error(errorMessage);
    }
  };

  const handleNewRequest = () => {
    setSelectedRequest(null);
    setModalMode("create");
    setShowLeaveModal(true);
  };

  const handleLeaveModalClose = (success = false) => {
    setShowLeaveModal(false);
    setSelectedRequest(null);
    if (success) {
      fetchLeaveRequests(); // Refresh the list
    }
  };

  // Show loading spinner while authentication is being initialized
  if (!initialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[var(--elra-primary)] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[var(--elra-primary)] text-lg font-medium">
            Loading your leave requests...
          </p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600">
            Please log in to view your leave requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Leave Requests</h1>
            <p className="text-white text-opacity-90 text-lg">
              View and manage your leave requests with ease
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleNewRequest}
              className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-xl hover:bg-[var(--elra-primary-dark)] transition-all duration-300 flex items-center space-x-3 font-semibold shadow-lg"
            >
              <HiPlus className="w-5 h-5" />
              <span>New Request</span>
            </button>
            <button
              onClick={fetchLeaveRequests}
              disabled={loading}
              className="bg-white text-[var(--elra-primary)] px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center space-x-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-white border-opacity-20"
            >
              <HiRefresh
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
              <span>{loading ? "Loading..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Requests */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Requests
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalRequests}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <HiCalendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">All time requests</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pendingRequests}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <HiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Awaiting approval</span>
          </div>
        </div>

        {/* Approved Requests */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.approvedRequests}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {stats.approvedDays} days approved
            </span>
          </div>
        </div>

        {/* Rejected Requests */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.rejectedRequests}
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

      {/* Enhanced Filters & Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
              <HiChartBar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Filter Requests
              </h2>
              <p className="text-sm text-gray-500">
                Search and filter your leave requests
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status Filter
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 ${
                filters.status !== "all"
                  ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] bg-opacity-5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Leave Type
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value }))
              }
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 ${
                filters.type !== "all"
                  ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] bg-opacity-5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {leaveTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Search Requests
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by reason, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 ${
                  searchTerm
                    ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] bg-opacity-5"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ status: "all", type: "all" });
                setSearchTerm("");
              }}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
            >
              <HiXMark className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.status !== "all" || filters.type !== "all" || searchTerm) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Active Filters:
                </span>
                {filters.status !== "all" && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Status: {filters.status}
                  </span>
                )}
                {filters.type !== "all" && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Type: {filters.type}
                  </span>
                )}
                {searchTerm && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    Search: "{searchTerm}"
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {filteredRequests.length} request(s) found
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Requests Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
                <HiCalendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  My Requests
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredRequests.length} of {requests.length} request
                  {requests.length !== 1 ? "s" : ""}
                  {filters.status !== "all" ||
                  filters.type !== "all" ||
                  searchTerm
                    ? " matching filters"
                    : " total"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
            <span className="ml-2 text-gray-600">Loading your requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiCalendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {requests.length === 0
                ? "No Leave Requests Yet"
                : "No Matching Requests"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {requests.length === 0
                ? "You haven't submitted any leave requests yet. Create your first request to get started."
                : "No requests match your current filters. Try adjusting your search criteria."}
            </p>
            {requests.length === 0 && (
              <button
                onClick={handleNewRequest}
                className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-xl hover:bg-[var(--elra-primary-dark)] transition-all duration-300 flex items-center space-x-2 mx-auto font-semibold"
              >
                <HiPlus className="w-5 h-5" />
                <span>Create First Request</span>
              </button>
            )}
          </div>
        ) : (
          <DataTable
            key={`leave-requests-${filteredRequests.length}-${Math.random()}`}
            data={filteredRequests}
            columns={columns}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
            }}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            sortOptions={sortOptions}
          />
        )}
      </div>

      {/* Modals */}
      <LeaveRequestModal
        isOpen={showLeaveModal}
        onClose={handleLeaveModalClose}
        mode={modalMode}
        request={selectedRequest}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        item={deleteTarget}
        itemType="leave request"
      />

      <LeaveDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsRequest(null);
        }}
        request={detailsRequest}
      />
    </div>
  );
};

export default MyLeaveRequests;
