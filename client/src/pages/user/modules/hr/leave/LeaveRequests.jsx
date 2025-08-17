import React, { useState, useEffect } from "react";
import {
  CalendarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../context/AuthContext";
import { userModulesAPI } from "../../../../../services/userModules";
import { getActiveDepartments } from "../../../../../services/departments";
import defaultAvatar from "../../../../../assets/defaulticon.jpg";

const LeaveRequests = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    department: "",
  });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statuses = ["Pending", "Approved", "Rejected", "Cancelled"];

  const canRequestLeave = user?.role?.level >= 300 && user?.role?.level !== 100;
  const canViewAllRequests = user?.role?.level >= 600;
  const canEditOwnRequests = true;
  const canCancelOwnRequests = true;

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, departmentsRes, leaveTypesRes] = await Promise.all([
        userModulesAPI.leave.getRequests(filters),
        getActiveDepartments(),
        userModulesAPI.leave.getLeaveTypes(),
      ]);

      let requests = requestsRes.data?.docs || requestsRes.data || [];
      if (!canViewAllRequests) {
        requests = requests.filter(
          (request) => request.employee?._id === user?._id
        );
      }

      setLeaveRequests(requests);
      setFilteredRequests(requests);
      setDepartments(departmentsRes.data?.departments || []);
      setLeaveTypes(leaveTypesRes.data || []);
    } catch (error) {
      console.error("Error fetching leave data:", error);
      toast.error("Failed to fetch leave data");
      setLeaveRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, filters]);

  const filterRequests = () => {
    let filtered = leaveRequests;

    if (filters.status && filters.status !== "All") {
      filtered = filtered.filter(
        (request) => request.status === filters.status
      );
    }

    if (filters.type && filters.type !== "All") {
      filtered = filtered.filter(
        (request) => request.leaveType === filters.type
      );
    }

    if (filters.search) {
      filtered = filtered.filter(
        (request) =>
          request.leaveType
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          request.reason.toLowerCase().includes(filters.search.toLowerCase()) ||
          (request.employee?.firstName && request.employee?.lastName
            ? `${request.employee.firstName} ${request.employee.lastName}`
            : request.employee?.name || ""
          )
            .toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleCreateRequest = () => {
    setFormData({
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      department: user?.department?._id || user?.department || "",
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log(
        "🚀 [LeaveRequests] Creating leave request with data:",
        formData
      );

      // Calculate days between start and end date
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      const requestData = {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: days,
        reason: formData.reason,
      };

      console.log("📦 [LeaveRequests] Final request data:", requestData);

      const response = await userModulesAPI.leave.createRequest(requestData);
      console.log(
        "✅ [LeaveRequests] Leave request created successfully:",
        response
      );

      toast.success("Leave request submitted successfully!");
      setShowCreateModal(false);
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
        department: user?.department?._id || user?.department || "",
      });
      fetchData();
    } catch (error) {
      console.error("❌ [LeaveRequests] Error creating leave request:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit leave request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequest = (request) => {
    if (request.status !== "Pending") {
      toast.error("Only pending requests can be edited");
      return;
    }
    setFormData({
      leaveType: request.leaveType,
      startDate: request.startDate.split("T")[0],
      endDate: request.endDate.split("T")[0],
      reason: request.reason,
      department: request.department?._id || request.department,
    });
    setSelectedRequest(request);
    setShowCreateModal(true);
  };

  const handleCancelRequest = async (requestId) => {
    try {
      console.log("🚀 [LeaveRequests] Cancelling leave request:", requestId);

      const reason = prompt("Please provide a reason for cancellation:");
      if (!reason) {
        toast.error("Cancellation reason is required");
        return;
      }

      const response = await userModulesAPI.leave.cancelRequest(
        requestId,
        reason
      );
      console.log(
        "✅ [LeaveRequests] Leave request cancelled successfully:",
        response
      );

      toast.success("Leave request cancelled successfully!");
      fetchData();
    } catch (error) {
      console.error(
        "❌ [LeaveRequests] Error cancelling leave request:",
        error
      );
      toast.error(
        error.response?.data?.message || "Failed to cancel leave request"
      );
    }
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-[var(--elra-secondary-3)] text-[var(--elra-primary)]";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-800";
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
      case "Cancelled":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
            <p className="text-gray-600 mt-2">
              Submit and manage your leave requests
            </p>
          </div>
          {canRequestLeave && (
            <button
              onClick={handleCreateRequest}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5 cursor-pointer" />
              New Leave Request
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
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
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              <option value="">All Types</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: "", type: "", search: "" })}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Leave Requests ({filteredRequests?.length || 0})
          </h2>
        </div>

        {!loading && (!filteredRequests || filteredRequests.length === 0) ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No leave requests found
            </h3>
            <p className="text-gray-500 mb-6">
              {canRequestLeave
                ? "You haven't submitted any leave requests yet. Create your first request to get started."
                : "No leave requests are available to view."}
            </p>
            {canRequestLeave && (
              <button
                onClick={handleCreateRequest}
                className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Leave Request
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(filteredRequests || []).map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {getAvatarDisplay(request.employee)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.employee?.firstName &&
                            request.employee?.lastName
                              ? `${request.employee.firstName} ${request.employee.lastName}`
                              : request.employee?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee?.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.leaveType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.department?.name || "No department"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.startDate).toLocaleDateString()} -{" "}
                        {new Date(request.endDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.ceil(
                          (new Date(request.endDate) -
                            new Date(request.startDate)) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(request._id)}
                          className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)]"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {canEditOwnRequests &&
                          request.status === "Pending" &&
                          request.employee?._id === user?._id && (
                            <button
                              onClick={() => handleEditRequest(request)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                        {canCancelOwnRequests &&
                          request.status === "Pending" &&
                          request.employee?._id === user?._id && (
                            <button
                              onClick={() => handleCancelRequest(request._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedRequest ? "Edit Leave Request" : "New Leave Request"}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Leave Type *
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-colors"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    min={
                      formData.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-colors"
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Duration:</span>{" "}
                    {Math.ceil(
                      (new Date(formData.endDate) -
                        new Date(formData.startDate)) /
                        (1000 * 60 * 60 * 24)
                    ) + 1}{" "}
                    days
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-colors resize-none"
                  placeholder="Please provide a detailed reason for your leave request..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 text-sm font-medium text-white bg-[var(--elra-primary)] border border-transparent rounded-lg hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Leave Request Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.employee?.firstName &&
                    selectedRequest.employee?.lastName
                      ? `${selectedRequest.employee.firstName} ${selectedRequest.employee.lastName}`
                      : selectedRequest.employee?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.department?.name || "No department"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Leave Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.leaveType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedRequest.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedRequest.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <p className="text-sm text-gray-900">
                  {selectedRequest.reason}
                </p>
              </div>
              {selectedRequest.comments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Comments
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.comments}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;
