import React, { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import api from "../../../../services/api";

const ProjectFinanceManagement = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    scope: "all",
    financeStatus: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [reimbursementData, setReimbursementData] = useState({
    amount: "",
    notes: "",
    paymentMethod: "bank_transfer",
  });

  // Access control - only Finance HOD+ can access
  if (
    !user ||
    user.role.level < 700 ||
    user.department?.name !== "Finance & Accounting"
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only Finance HOD can access Project Finance Management.
          </p>
        </div>
      </div>
    );
  }

  const projectStatuses = [
    { value: "all", label: "All Statuses" },
    {
      value: "implementation",
      label: "Implementation",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "completed",
      label: "Completed",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "on_hold",
      label: "On Hold",
      color: "bg-yellow-100 text-yellow-800",
    },
  ];

  const financeStatuses = [
    { value: "all", label: "All Finance Status" },
    {
      value: "pending",
      label: "Pending Reimbursement",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "approved",
      label: "Approved",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "reimbursed",
      label: "Reimbursed",
      color: "bg-green-100 text-green-800",
    },
    { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  ];

  const projectScopes = [
    { value: "all", label: "All Projects" },
    {
      value: "internal",
      label: "Internal Projects",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "external",
      label: "External Projects",
      color: "bg-orange-100 text-orange-800",
    },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        // Filter for projects that are approved and in implementation or completed
        const approvedProjects = response.data.data.projects.filter(
          (project) =>
            project.status === "implementation" ||
            project.status === "completed" ||
            project.status === "on_hold"
        );
        setProjects(approvedProjects);
      } else {
        toast.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Error loading projects");
    } finally {
      setLoading(false);
    }
  };

  const handleReimbursement = async () => {
    if (!selectedProject || !reimbursementData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await api.post(
        `/projects/${selectedProject._id}/reimburse`,
        {
          amount: parseFloat(reimbursementData.amount),
          notes: reimbursementData.notes,
          paymentMethod: reimbursementData.paymentMethod,
        }
      );

      if (response.data.success) {
        toast.success("Reimbursement processed successfully");
        setShowReimbursementModal(false);
        setSelectedProject(null);
        setReimbursementData({
          amount: "",
          notes: "",
          paymentMethod: "bank_transfer",
        });
        loadProjects(); // Refresh the list
      } else {
        toast.error(response.data.message || "Failed to process reimbursement");
      }
    } catch (error) {
      console.error("Error processing reimbursement:", error);
      toast.error("Error processing reimbursement");
    }
  };

  const getFinanceStatusBadge = (status) => {
    const statusConfig = financeStatuses.find((s) => s.value === status);
    if (!statusConfig) return null;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
      >
        {statusConfig.label}
      </span>
    );
  };

  const getProjectScopeBadge = (scope) => {
    const scopeConfig = projectScopes.find((s) => s.value === scope);
    if (!scopeConfig) return null;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scopeConfig.color}`}
      >
        {scopeConfig.label}
      </span>
    );
  };

  const columns = [
    {
      header: "Project",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.original.name}</span>
          <span className="text-sm text-gray-500">{row.original.code}</span>
        </div>
      ),
    },
    {
      header: "Department",
      accessorKey: "department.name",
      cell: ({ row }) => (
        <span className="text-sm text-gray-900">
          {row.original.department?.name}
        </span>
      ),
    },
    {
      header: "Scope",
      accessorKey: "projectScope",
      cell: ({ row }) => getProjectScopeBadge(row.original.projectScope),
    },
    {
      header: "Budget",
      accessorKey: "budget",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          ₦{row.original.budget?.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const statusConfig = projectStatuses.find(
          (s) => s.value === row.original.status
        );
        return statusConfig ? (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
          >
            {statusConfig.label}
          </span>
        ) : null;
      },
    },
    {
      header: "Finance Status",
      accessorKey: "financeStatus",
      cell: ({ row }) => getFinanceStatusBadge(row.original.financeStatus),
    },
    {
      header: "Progress",
      accessorKey: "progress",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
            <div
              className="bg-[var(--elra-primary)] h-2 rounded-full"
              style={{ width: `${row.original.progress || 0}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">
            {row.original.progress || 0}%
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedProject(row.original);
              setShowDetailsModal(true);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {row.original.financeStatus === "pending" && (
            <button
              onClick={() => {
                setSelectedProject(row.original);
                setShowReimbursementModal(true);
              }}
              className="p-1 text-green-600 hover:text-green-800"
              title="Process Reimbursement"
            >
              <CurrencyDollarIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filters.status === "all" || project.status === filters.status;
    const matchesScope =
      filters.scope === "all" || project.projectScope === filters.scope;
    const matchesFinanceStatus =
      filters.financeStatus === "all" ||
      project.financeStatus === filters.financeStatus;

    return (
      matchesSearch && matchesStatus && matchesScope && matchesFinanceStatus
    );
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Project Finance Management
        </h1>
        <p className="text-gray-600">
          Manage project reimbursements and fund disbursements for approved
          projects.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Projects
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or code..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
            >
              {projectStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Scope
            </label>
            <select
              value={filters.scope}
              onChange={(e) =>
                setFilters({ ...filters, scope: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
            >
              {projectScopes.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Finance Status
            </label>
            <select
              value={filters.financeStatus}
              onChange={(e) =>
                setFilters({ ...filters, financeStatus: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
            >
              {financeStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          data={filteredProjects}
          columns={columns}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showSearch={false}
          showPagination={true}
          pageSize={10}
        />
      </div>

      {/* Project Details Modal */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Project Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedProject.name}
                </h3>
                <p className="text-sm text-gray-600">{selectedProject.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedProject.department?.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project Scope
                  </label>
                  <p className="text-sm text-gray-900">
                    {getProjectScopeBadge(selectedProject.projectScope)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Budget
                  </label>
                  <p className="text-sm text-gray-900">
                    ₦{selectedProject.budget?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Finance Status
                  </label>
                  <p className="text-sm text-gray-900">
                    {getFinanceStatusBadge(selectedProject.financeStatus)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Progress
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedProject.progress || 0}%
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedProject.status}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <p className="text-sm text-gray-900">
                  {selectedProject.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reimbursement Modal */}
      {showReimbursementModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Process Reimbursement</h2>
              <button
                onClick={() => setShowReimbursementModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <p className="text-sm text-gray-900">{selectedProject.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reimbursement Amount (NGN){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={reimbursementData.amount}
                  onChange={(e) =>
                    setReimbursementData({
                      ...reimbursementData,
                      amount: e.target.value,
                    })
                  }
                  placeholder="Enter amount"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={reimbursementData.paymentMethod}
                  onChange={(e) =>
                    setReimbursementData({
                      ...reimbursementData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={reimbursementData.notes}
                  onChange={(e) =>
                    setReimbursementData({
                      ...reimbursementData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Add notes about the reimbursement..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowReimbursementModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReimbursement}
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)]"
                >
                  Process Reimbursement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFinanceManagement;
