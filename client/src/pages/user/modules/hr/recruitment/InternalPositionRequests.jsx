import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GradientSpinner } from "../../../../../components/common";
import {
  BriefcaseIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const InternalPositionRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Mock data - replace with actual API call
  const mockRequests = [
    {
      id: 1,
      title: "Senior Software Engineer",
      department: "IT",
      requestedBy: "John Smith",
      requestDate: "2024-01-15",
      status: "Pending",
      urgency: "High",
      description: "Need experienced developer for new project",
      budget: "$80,000 - $100,000",
      requiredSkills: ["React", "Node.js", "MongoDB"],
    },
    {
      id: 2,
      title: "HR Assistant",
      department: "HR",
      requestedBy: "Jane Doe",
      requestDate: "2024-01-10",
      status: "Approved",
      urgency: "Medium",
      description: "Support HR operations and recruitment",
      budget: "$45,000 - $55,000",
      requiredSkills: ["HR Management", "Communication"],
    },
    {
      id: 3,
      title: "Accountant",
      department: "Finance",
      requestedBy: "Mike Johnson",
      requestDate: "2024-01-08",
      status: "Rejected",
      urgency: "Low",
      description: "Handle financial reporting and audits",
      budget: "$50,000 - $65,000",
      requiredSkills: ["Accounting", "Excel", "QuickBooks"],
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRequests(mockRequests);
      setLoading(false);
    }, 1000);
  }, []);

  // Get user role level for permissions
  const getUserRoleLevel = () => {
    if (!user) return 0;
    const roleValue = user.role?.name || user.role;

    switch (roleValue) {
      case "SUPER_ADMIN":
        return 1000;
      case "HOD":
        return 700;
      case "MANAGER":
        return 600;
      case "STAFF":
        return 300;
      default:
        return 100;
    }
  };

  const roleLevel = getUserRoleLevel();

  // Permission checks
  const canViewRequests = roleLevel >= 300;
  const canCreateRequests = roleLevel >= 600;
  const canApproveRequests = roleLevel >= 700;

  // Filter requests based on search and status
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || request.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", "Pending", "Approved", "Rejected", "In Progress"];

  const handleCreateRequest = () => {
    setShowRequestForm(true);
  };

  const handleViewRequest = (requestId) => {
    navigate(`/dashboard/modules/hr/recruitment/request/${requestId}`);
  };

  const handleApproveRequest = (requestId) => {
    // Implement approval logic
    console.log("Approve request:", requestId);
  };

  const handleRejectRequest = (requestId) => {
    // Implement rejection logic
    console.log("Reject request:", requestId);
  };

  const handleCreateEmployee = (requestId) => {
    // Navigate to add employee with pre-filled data from request
    navigate(`/dashboard/modules/hr/employees/add?fromRequest=${requestId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner title="Loading Position Requests" />
      </div>
    );
  }

  if (!canViewRequests) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to view position requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--elra-text-primary)] mb-2">
              Internal Position Requests
            </h1>
            <p className="text-[var(--elra-text-secondary)]">
              Manage internal position requests and employee onboarding
            </p>
          </div>
          {canCreateRequests && (
            <button
              onClick={handleCreateRequest}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Request Position
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600">
              {filteredRequests.length} request
              {filteredRequests.length !== 1 ? "s" : ""} found
            </span>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-[var(--elra-secondary-3)] flex items-center justify-center">
                        <BriefcaseIcon className="h-5 w-5 text-[var(--elra-primary)]" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.requestedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : request.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : request.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.urgency === "High"
                          ? "bg-red-100 text-red-800"
                          : request.urgency === "Medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {request.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.budget}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewRequest(request.id)}
                        className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      {canApproveRequests && request.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Approve Request"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Reject Request"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {request.status === "Approved" && canCreateRequests && (
                        <button
                          onClick={() => handleCreateEmployee(request.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Create Employee"
                        >
                          <UserPlusIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No position requests found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedStatus !== "all"
                ? "Try adjusting your search or filters."
                : "Get started by creating your first position request."}
            </p>
            {canCreateRequests && (
              <div className="mt-6">
                <button
                  onClick={handleCreateRequest}
                  className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Request Position
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalPositionRequests;
