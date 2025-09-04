import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockSolid,
} from "@heroicons/react/24/solid";
import { useAuth } from "../../../../context/AuthContext";
import {
  formatCurrency,
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../../../../utils/formatters";
import {
  createBudgetAllocation,
  getBudgetAllocations,
  getBudgetAllocationById,
  approveBudgetAllocation,
  rejectBudgetAllocation,
  getBudgetAllocationStats,
  getProjectsNeedingBudgetAllocation,
} from "../../../../services/budgetAllocationAPI";
import DataTable from "../../../../components/common/DataTable";

const BudgetAllocation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budgetAllocations, setBudgetAllocations] = useState([]);
  const [filteredAllocations, setFilteredAllocations] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState("projects");

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    allocationType: "",
    search: "",
  });

  // Create form state
  const [formData, setFormData] = useState({
    projectId: "",
    allocationType: "project_budget",
    allocatedAmount: "",
    notes: "",
    currency: "NGN",
  });

  useEffect(() => {
    loadBudgetAllocations();
    loadProjects();
  }, []);

  useEffect(() => {
    filterAllocations();
  }, [budgetAllocations, filters]);

  useEffect(() => {
    filterProjects();
  }, [projects, filters]);

  const loadBudgetAllocations = async () => {
    try {
      setLoading(true);
      const data = await getBudgetAllocations();
      if (data.success) {
        setBudgetAllocations(data.data.budgetAllocations);
      } else {
        toast.error(data.message || "Failed to load budget allocations");
      }
    } catch (error) {
      console.error("Error loading budget allocations:", error);
      toast.error("Failed to load budget allocations");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      console.log("🔄 [FRONTEND] Loading projects...");
      const data = await getProjectsNeedingBudgetAllocation();
      if (data.success) {
        console.log(
          `✅ [FRONTEND] Loaded ${data.data.projects?.length || 0} projects`
        );
        setProjects(data.data.projects || []);
      } else {
        console.error("❌ [FRONTEND] Failed to load projects:", data.message);
      }
    } catch (error) {
      console.error("❌ [FRONTEND] Error loading projects:", error);
    }
  };

  // Stats are calculated from projects and allocations data
  // No need for separate API call

  const filterAllocations = () => {
    let filtered = [...budgetAllocations];

    if (filters.status) {
      filtered = filtered.filter(
        (allocation) => allocation.status === filters.status
      );
    }

    if (filters.allocationType) {
      filtered = filtered.filter(
        (allocation) => allocation.allocationType === filters.allocationType
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (allocation) =>
          allocation.entityName?.toLowerCase().includes(searchTerm) ||
          allocation.entityCode?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredAllocations(filtered);
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Filter by project status
    if (filters.status) {
      if (filters.status === "pending_budget_allocation") {
        filtered = filtered.filter(
          (project) => project.status === "pending_budget_allocation"
        );
      } else if (filters.status === "approved") {
        filtered = filtered.filter((project) => project.status === "approved");
      }
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name?.toLowerCase().includes(searchTerm) ||
          project.code?.toLowerCase().includes(searchTerm) ||
          project.department?.name?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredProjects(filtered);
  };

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedProject = projects.find(
        (p) => p._id === formData.projectId
      );
      const baseAmount = selectedProject
        ? getBaseAmountForAllocation(selectedProject)
        : 0;
      const extraAmount = Number(formData.allocatedAmount) || 0;
      const totalAllocation = baseAmount + extraAmount;

      const allocationData = {
        ...formData,
        allocatedAmount: totalAllocation,
      };

      console.log("🔄 [FRONTEND] Creating budget allocation...");
      console.log("📊 [FRONTEND] Form data:", formData);
      console.log("💰 [FRONTEND] Base amount:", baseAmount);
      console.log("💰 [FRONTEND] Extra amount:", extraAmount);
      console.log("💰 [FRONTEND] Total allocation:", totalAllocation);
      console.log("📤 [FRONTEND] Sending to backend:", allocationData);

      const data = await createBudgetAllocation(allocationData);

      // Check if the response has an error
      if (data.error || !data.success) {
        console.error(
          "❌ [FRONTEND] Backend error:",
          data.error || data.message
        );
        toast.error(
          data.message || data.error || "Failed to create budget allocation"
        );
        return;
      }

      if (data.success) {
        console.log("✅ [FRONTEND] Budget allocation created successfully!");
        toast.success("Budget allocation created successfully!");
        setShowCreateModal(false);
        setFormData({
          projectId: "",
          allocationType: "project_budget",
          allocatedAmount: "",
          notes: "",
          currency: "NGN",
        });
        console.log("🔄 [FRONTEND] Refreshing data...");
        await loadBudgetAllocations();
        await loadProjects();
        console.log("✅ [FRONTEND] Data refreshed successfully!");
        setActiveTab("allocations"); // Switch to allocations tab after creation
      } else {
        console.error(
          "❌ [FRONTEND] Failed to create budget allocation:",
          data.message
        );
        toast.error(data.message || "Failed to create budget allocation");
      }
    } catch (error) {
      console.error("❌ [FRONTEND] Error creating budget allocation:", error);
      toast.error("Failed to create budget allocation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAllocationForProject = (project) => {
    setFormData({
      projectId: project._id,
      allocationType: "project_budget",
      allocatedAmount: "",
      notes: "",
      currency: "NGN",
    });
    setShowCreateModal(true);
  };

  const handleApproveAllocation = async (allocationId) => {
    try {
      const data = await approveBudgetAllocation(allocationId);
      if (data.success) {
        toast.success("Budget allocation approved successfully!");
        loadBudgetAllocations();
        loadProjects();
      } else {
        toast.error(data.message || "Failed to approve budget allocation");
      }
    } catch (error) {
      console.error("Error approving budget allocation:", error);
      toast.error("Failed to approve budget allocation");
    }
  };

  const handleRejectAllocation = async (allocationId) => {
    try {
      const data = await rejectBudgetAllocation(allocationId);
      if (data.success) {
        toast.success("Budget allocation rejected successfully!");
        loadBudgetAllocations();
        loadProjects(); // Refresh projects to update status
      } else {
        toast.error(data.message || "Failed to reject budget allocation");
      }
    } catch (error) {
      console.error("Error rejecting budget allocation:", error);
      toast.error("Failed to reject budget allocation");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockSolid className="w-5 h-5 text-yellow-500" />;
      case "allocated":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "allocated":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAllocationTypeLabel = (type) => {
    switch (type) {
      case "project_budget":
        return "Project Budget";
      case "payroll_funding":
        return "Payroll Funding";
      case "operational_funding":
        return "Operational Funding";
      case "maintenance_funding":
        return "Maintenance Funding";
      case "capital_expenditure":
        return "Capital Expenditure";
      default:
        return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const calculateProjectItemsTotal = (project) => {
    return (
      project.projectItems?.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      ) || 0
    );
  };

  const getBaseAmountForAllocation = (project) => {
    const itemsTotal = calculateProjectItemsTotal(project);
    const budget = project.budget || 0;

    return itemsTotal < budget ? itemsTotal : budget;
  };

  // Define columns for projects table
  const projectColumns = [
    {
      header: "Project",
      accessor: "name",
      renderer: (project) => (
        <div className="flex items-center min-w-0 max-w-[200px]">
          <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div
              className="font-medium text-gray-900 cursor-help break-words"
              title={project.name}
            >
              {project.name}
            </div>
            <div className="text-sm text-gray-500">{project.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "department",
      renderer: (project) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {project.department?.name}
        </span>
      ),
    },
    {
      header: "Allocation Base",
      accessor: "allocationBase",
      renderer: (project) => (
        <div className="grid grid-cols-1 gap-1">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(getBaseAmountForAllocation(project))}
          </div>
          <div className="text-xs text-gray-500">
            <div>
              Items: {formatCurrency(calculateProjectItemsTotal(project))}
            </div>
            <div>Budget: {formatCurrency(project.budget)}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Remaining Budget",
      accessor: "remainingBudget",
      renderer: (project) => {
        const itemsTotal = calculateProjectItemsTotal(project);
        const remainingBudget = project.budget - itemsTotal;

        return (
          <div className="text-sm">
            <div
              className={`font-medium ${
                remainingBudget > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(remainingBudget)}
            </div>
            <div className="text-xs text-gray-500">
              {remainingBudget > 0 ? "Available for future use" : "Over budget"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (project) => (
        <div className="flex items-center gap-2">
          {project.status === "pending_budget_allocation" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
              Need Allocation
            </span>
          ) : project.status === "approved" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              Allocated
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
              {project.status}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Project Manager",
      accessor: "projectManager",
      renderer: (project) => (
        <div className="text-sm">
          <div
            className="text-gray-900 cursor-help"
            title={`${project.projectManager?.firstName} ${project.projectManager?.lastName}`}
          >
            {project.projectManager?.firstName}{" "}
            {project.projectManager?.lastName}
          </div>
          <div
            className="text-gray-500 cursor-help"
            title={project.projectManager?.email}
          >
            {project.projectManager?.email?.length > 25
              ? `${project.projectManager?.email?.substring(0, 25)}...`
              : project.projectManager?.email}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CurrencyDollarIcon className="w-8 h-8 text-[var(--elra-primary)]" />
              Project Budget Allocation
            </h1>
            <p className="text-gray-600 mt-2">
              Manage budget allocations for projects and operational funding
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("projects")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "projects"
                    ? "bg-[var(--elra-primary)] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => setActiveTab("allocations")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "allocations"
                    ? "bg-[var(--elra-primary)] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Budget Allocations
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent w-48"
                />
              </div>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending_budget_allocation">
                  Need Allocation
                </option>
                <option value="approved">Already Allocated</option>
                <option value="pending">Pending Approval</option>
              </select>

              <select
                value={filters.allocationType}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    allocationType: e.target.value,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="project_budget">Project Budget</option>
                <option value="payroll_funding">Payroll Funding</option>
                <option value="operational_funding">Operational Funding</option>
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          {(filters.status || filters.allocationType || filters.search) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 items-center text-sm">
                <span className="text-gray-600">Filters:</span>
                {filters.status && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                    Status:{" "}
                    {filters.status === "pending_budget_allocation"
                      ? "Need Allocation"
                      : filters.status === "approved"
                      ? "Already Allocated"
                      : filters.status === "pending"
                      ? "Pending Approval"
                      : filters.status}
                  </span>
                )}
                {filters.allocationType && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">
                    Type: {getAllocationTypeLabel(filters.allocationType)}
                  </span>
                )}
                {filters.search && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
                    Search: "{filters.search}"
                  </span>
                )}
                <button
                  onClick={() =>
                    setFilters({ status: "", allocationType: "", search: "" })
                  }
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Need Allocation
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    projects.filter(
                      (p) => p.status === "pending_budget_allocation"
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Already Allocated
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter((p) => p.status === "approved").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Approval
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    budgetAllocations.filter((a) => a.status === "pending")
                      .length
                  }
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Allocated
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    budgetAllocations.reduce(
                      (sum, a) => sum + (a.newBudget || 0),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "projects"
                      ? "Search projects..."
                      : "Search allocations..."
                  }
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                />
              </div>
            </div>

            {activeTab === "projects" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                >
                  <option value="">All Projects</option>
                  <option value="pending_budget_allocation">
                    Need Allocation
                  </option>
                  <option value="approved">Already Allocated</option>
                </select>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {(filters.search || filters.status) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() =>
                  setFilters({ status: "", allocationType: "", search: "" })
                }
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === "projects" ? (
          <>
            {/* Filter Summary */}
            {(filters.status || filters.search) && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <span className="font-medium">Active Filters:</span>
                    {filters.status && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Status:{" "}
                        {filters.status === "pending_budget_allocation"
                          ? "Need Allocation"
                          : "Already Allocated"}
                      </span>
                    )}
                    {filters.search && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Search: "{filters.search}"
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-blue-600">
                    {filteredProjects.length} project
                    {filteredProjects.length !== 1 ? "s" : ""} found
                  </span>
                </div>
              </div>
            )}

            {/* Projects Table */}
            <DataTable
              data={filteredProjects}
              columns={projectColumns}
              loading={loading}
              actions={{
                showEdit: false,
                showDelete: false,
                showToggle: false,
                customActions: (project) =>
                  project.status === "pending_budget_allocation" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateAllocationForProject(project);
                      }}
                      title="Create Budget Allocation"
                      className="bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white p-2 rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  ) : null,
              }}
              emptyState={{
                icon: <DocumentTextIcon className="h-12 w-12 text-gray-400" />,
                title: "No projects found",
                description:
                  filters.status || filters.search
                    ? "No projects match your current filters. Try adjusting your search criteria."
                    : "No projects found that need budget allocation.",
              }}
            />
          </>
        ) : (
          /* Allocations Table */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  Loading budget allocations...
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAllocations.map((allocation) => (
                        <tr key={allocation._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {allocation.entityName || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {allocation.allocationCode} •{" "}
                                {allocation.entityCode || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getAllocationTypeLabel(
                                allocation.allocationType
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(
                                allocation.allocatedAmount,
                                allocation.currency
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(allocation.status)}
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                  allocation.status
                                )}`}
                              >
                                {allocation.status.charAt(0).toUpperCase() +
                                  allocation.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {allocation.allocatedBy?.firstName}{" "}
                              {allocation.allocatedBy?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {allocation.allocatedBy?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              allocation.createdAt
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedAllocation(allocation);
                                  setShowDetailsModal(true);
                                }}
                                className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)]"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              {allocation.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApproveAllocation(allocation._id)
                                    }
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <CheckIcon className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectAllocation(allocation._id)
                                    }
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredAllocations.length === 0 && (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No budget allocations found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new budget allocation.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Allocation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create Budget Allocation
            </h2>

            <form onSubmit={handleCreateAllocation}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allocation Type
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                    Project Budget
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                    {(() => {
                      const selectedProject = projects.find(
                        (p) => p._id === formData.projectId
                      );
                      return selectedProject
                        ? `${selectedProject.name} - ${selectedProject.code}`
                        : "No project selected";
                    })()}
                  </div>

                  {formData.projectId &&
                    (() => {
                      const selectedProject = projects.find(
                        (p) => p._id === formData.projectId
                      );
                      if (selectedProject) {
                        const itemsTotal =
                          calculateProjectItemsTotal(selectedProject);
                        const budget = selectedProject.budget || 0;
                        const baseAmount =
                          getBaseAmountForAllocation(selectedProject);
                        return (
                          <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-medium text-green-800 mb-3">
                              📋 Project Details
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Project Name:</p>
                                <p className="font-medium text-gray-900">
                                  {selectedProject.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Project Code:</p>
                                <p className="font-medium text-gray-900">
                                  {selectedProject.code}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Department:</p>
                                <p className="font-medium text-gray-900">
                                  {selectedProject.department?.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">
                                  Project Manager:
                                </p>
                                <p className="font-medium text-gray-900">
                                  {selectedProject.projectManager?.firstName}{" "}
                                  {selectedProject.projectManager?.lastName}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-white rounded border border-green-200">
                              <p className="text-sm font-medium text-green-800 mb-2">
                                💰 Financial Breakdown
                              </p>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Items Total:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(itemsTotal)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Project Budget:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(budget)}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                  <span className="text-green-700 font-medium">
                                    Base Allocation:
                                  </span>
                                  <span className="text-green-700 font-bold">
                                    {formatCurrency(baseAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extra Funding Amount (₦)
                  </label>
                  <input
                    type="text"
                    value={
                      formData.allocatedAmount
                        ? formatNumberWithCommas(formData.allocatedAmount)
                        : ""
                    }
                    onChange={(e) => {
                      const rawValue = parseFormattedNumber(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        allocatedAmount:
                          rawValue > 0 ? rawValue.toString() : "",
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    placeholder="Enter extra funding amount in Naira (optional)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This amount will be added to the base allocation (leave
                    empty if no extra funding needed)
                  </p>
                </div>

                {formData.projectId &&
                  (() => {
                    const selectedProject = projects.find(
                      (p) => p._id === formData.projectId
                    );
                    if (selectedProject) {
                      const baseAmount =
                        getBaseAmountForAllocation(selectedProject);
                      const extraAmount = Number(formData.allocatedAmount) || 0;
                      const totalAllocation = baseAmount + extraAmount;
                      return (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-800 mb-3">
                            💳 Payment Summary
                          </p>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="text-gray-600">
                                Base Allocation:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(baseAmount)}
                              </span>
                            </div>
                            {extraAmount > 0 && (
                              <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <span className="text-gray-600">
                                  Extra Funding:
                                </span>
                                <span className="font-medium text-green-700">
                                  {formatCurrency(extraAmount)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center p-3 bg-green-100 rounded border-2 border-green-300">
                              <span className="text-green-800 font-semibold">
                                Total Amount to Pay:
                              </span>
                              <span className="text-green-800 font-bold text-lg">
                                {formatCurrency(totalAllocation)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    rows="3"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg font-medium hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Allocation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Budget Allocation Details
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Allocation Code
                  </label>
                  <p className="text-sm text-gray-900 font-mono">
                    {selectedAllocation.allocationCode}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Entity Name
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAllocation.entityName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Entity Code
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAllocation.entityCode}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Allocation Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {getAllocationTypeLabel(selectedAllocation.allocationType)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatCurrency(
                      selectedAllocation.allocatedAmount,
                      selectedAllocation.currency
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedAllocation.status)}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        selectedAllocation.status
                      )}`}
                    >
                      {selectedAllocation.status.charAt(0).toUpperCase() +
                        selectedAllocation.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Created By
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAllocation.allocatedBy?.firstName}{" "}
                    {selectedAllocation.allocatedBy?.lastName}
                  </p>
                </div>
              </div>

              {selectedAllocation.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAllocation.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Close
              </button>
              {selectedAllocation.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      handleApproveAllocation(selectedAllocation._id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleRejectAllocation(selectedAllocation._id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetAllocation;
