import React, { useState, useEffect } from "react";
import {
  HiCalendar,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamationTriangle,
  HiEye,
  HiPlus,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";

const MyLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending", color: "text-yellow-600" },
    { value: "approved", label: "Approved", color: "text-green-600" },
    { value: "rejected", label: "Rejected", color: "text-red-600" },
    { value: "cancelled", label: "Cancelled", color: "text-gray-600" },
  ];

  const leaveTypes = [
    { value: "all", label: "All Types" },
    { value: "annual", label: "Annual Leave" },
    { value: "sick", label: "Sick Leave" },
    { value: "personal", label: "Personal Leave" },
    { value: "maternity", label: "Maternity Leave" },
    { value: "paternity", label: "Paternity Leave" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "startDate", label: "Start Date" },
    { value: "status", label: "Status" },
    { value: "type", label: "Leave Type" },
  ];

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      // Mock data for demonstration
      const mockRequests = [
        {
          id: "1",
          type: "annual",
          startDate: "2024-02-15",
          endDate: "2024-02-20",
          days: 5,
          reason: "Family vacation",
          status: "approved",
          createdAt: "2024-01-10T10:30:00Z",
          approvedBy: "John Manager",
          approvedAt: "2024-01-12T14:20:00Z",
        },
        {
          id: "2",
          type: "sick",
          startDate: "2024-01-25",
          endDate: "2024-01-26",
          days: 2,
          reason: "Medical appointment",
          status: "pending",
          createdAt: "2024-01-20T09:15:00Z",
          approvedBy: null,
          approvedAt: null,
        },
        {
          id: "3",
          type: "personal",
          startDate: "2024-03-01",
          endDate: "2024-03-01",
          days: 1,
          reason: "Personal emergency",
          status: "rejected",
          createdAt: "2024-02-15T16:45:00Z",
          approvedBy: "Jane Supervisor",
          approvedAt: "2024-02-16T11:30:00Z",
        },
      ];

      setRequests(mockRequests);
      toast.success("Leave requests loaded successfully");
    } catch (error) {
      toast.error("Failed to load leave requests");
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
      case "cancelled":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "annual":
        return "text-blue-600";
      case "sick":
        return "text-red-600";
      case "personal":
        return "text-purple-600";
      case "maternity":
        return "text-pink-600";
      case "paternity":
        return "text-indigo-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns = [
    {
      header: "Leave Type",
      accessor: "type",
      cell: (request) => (
        <span className={`text-sm font-medium ${getTypeColor(request.type)}`}>
          {leaveTypes.find((t) => t.value === request.type)?.label ||
            request.type}
        </span>
      ),
    },
    {
      header: "Period",
      accessor: "period",
      cell: (request) => (
        <div>
          <div className="text-sm text-gray-900">
            {formatDate(request.startDate)} - {formatDate(request.endDate)}
          </div>
          <div className="text-xs text-gray-500">{request.days} day(s)</div>
        </div>
      ),
    },
    {
      header: "Reason",
      accessor: "reason",
      cell: (request) => (
        <div
          className="text-sm text-gray-700 max-w-xs truncate"
          title={request.reason}
        >
          {request.reason}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (request) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            request.status
          )}`}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      ),
    },
    {
      header: "Submitted",
      accessor: "createdAt",
      cell: (request) => (
        <div className="text-sm text-gray-500">
          {formatDate(request.createdAt)}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (request) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewRequest(request.id)}
            className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] p-1 rounded hover:bg-gray-100 cursor-pointer"
            title="View Details"
          >
            <HiEye className="w-4 h-4" />
          </button>
          {request.status === "pending" && (
            <button
              onClick={() => handleCancelRequest(request.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-100 cursor-pointer"
              title="Cancel Request"
            >
              <HiXCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleViewRequest = (requestId) => {
    // TODO: Implement request view modal/page
    toast.info(`Viewing leave request #${requestId}`);
  };

  const handleCancelRequest = (requestId) => {
    // TODO: Implement request cancellation
    toast.info(`Cancelling leave request #${requestId}`);
  };

  const handleNewRequest = () => {
    // TODO: Navigate to new leave request form
    toast.info("Redirecting to new leave request form");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Leave Requests
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage your leave requests
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleNewRequest}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center"
            >
              <HiPlus className="w-4 h-4 mr-2" />
              New Request
            </button>
            <button
              onClick={fetchLeaveRequests}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <HiClock
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Filter Requests
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {leaveTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Requests</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {requests.length} request{requests.length !== 1 ? "s" : ""}{" "}
                found
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
            <span className="ml-2 text-gray-600">Loading your requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <HiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Leave Requests Found
            </h3>
            <p className="text-gray-600">
              You haven't submitted any leave requests yet.
            </p>
          </div>
        ) : (
          <DataTable
            data={requests}
            columns={columns}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            sortOptions={sortOptions}
          />
        )}
      </div>
    </div>
  );
};

export default MyLeaveRequests;
