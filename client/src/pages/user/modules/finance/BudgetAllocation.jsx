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
  getBudgetAllocationHistory,
} from "../../../../services/budgetAllocationAPI";
import DataTable from "../../../../components/common/DataTable";

const BudgetAllocation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState("projects");
  const [budgetHistory, setBudgetHistory] = useState([]);

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
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadStats(), loadProjects(), loadBudgetHistory()]);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, filters]);

  useEffect(() => {
    if (activeTab === "history") {
      loadBudgetHistory();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      console.log("📊 [FRONTEND] Loading budget allocation stats...");
      const data = await getBudgetAllocationStats();
      console.log("📊 [FRONTEND] Stats response:", data);
      if (data.success) {
        console.log("📊 [FRONTEND] Stats breakdown:");
        console.log(
          "  - pendingAllocations:",
          data.data.stats.pendingAllocations
        );
        console.log(
          "  - allocatedAllocations:",
          data.data.stats.allocatedAllocations
        );
        console.log("  - totalAllocated:", data.data.stats.totalAllocated);
        console.log("  - pendingProjects:", data.data.stats.pendingProjects);
        console.log(
          "  - allocatedProjects:",
          data.data.stats.allocatedProjects
        );
        console.log(
          "  - totalProjectItemsCost:",
          data.data.stats.totalProjectItemsCost
        );
        setStats(data.data.stats);
        console.log("✅ [FRONTEND] Stats loaded successfully!");
      } else {
        console.error("Failed to load stats:", data.message);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
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

  const loadBudgetHistory = async () => {
    try {
      console.log("🔄 [FRONTEND] Loading budget history...");
      const data = await getBudgetAllocationHistory({ limit: 1000 });
      if (data.success) {
        console.log(
          "📊 [FRONTEND] Budget allocation history:",
          data.data.allocations
        );
        console.log(
          "📊 [FRONTEND] Budget allocation statuses:",
          data.data.allocations.map((a) => ({
            code: a.allocationCode,
            status: a.status,
          }))
        );

        console.log(
          `✅ [FRONTEND] Loaded ${data.data.allocations.length} budget history records`
        );
        setBudgetHistory(data.data.allocations);
      } else {
        console.error(
          "❌ [FRONTEND] Failed to load budget history:",
          data.message
        );
      }
    } catch (error) {
      console.error("❌ [FRONTEND] Error loading budget history:", error);
    }
  };

  // Stats are calculated from projects and allocations data
  // No need for separate API call

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

      const allocationData = {
        ...formData,
        allocatedAmount: 0, // No extra allocation allowed
      };

      console.log("🔄 [FRONTEND] Creating budget allocation...");
      console.log("📊 [FRONTEND] Form data:", formData);
      console.log("💰 [FRONTEND] Base amount:", baseAmount);
      console.log("📤 [FRONTEND] Sending to backend:", allocationData);

      const data = await createBudgetAllocation(allocationData);

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
        await loadStats();
        await loadProjects();
        setTimeout(async () => {
          await loadBudgetHistory();
          console.log("✅ [FRONTEND] Data refreshed successfully!");
        }, 1000);
        setActiveTab("history");
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

  const handleViewProjectDetails = (project) => {
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  };

  const handleApproveAllocation = async (allocationId) => {
    try {
      const data = await approveBudgetAllocation(allocationId);
      if (data.success) {
        toast.success("Budget allocation approved successfully!");
        loadBudgetAllocations();
        loadProjects();
        loadBudgetHistory();
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
        loadProjects();
        loadBudgetHistory();
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
    // Base allocation is always the total project items cost (for procurement)
    return calculateProjectItemsTotal(project);
  };

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
      header: "Extra Funds Available",
      accessor: "extraAllocatedFunds",
      renderer: (project) => {
        const itemsTotal = calculateProjectItemsTotal(project);
        const extraFunds = project.budget - itemsTotal;

        return (
          <div className="text-sm">
            <div
              className={`font-medium ${
                extraFunds > 0 ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {formatCurrency(extraFunds)}
            </div>
            <div className="text-xs text-gray-500">
              Available for allocation
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Need Allocation
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 break-words leading-tight">
                  {stats.pendingProjects || 0}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-red-100 rounded-lg">
                <DocumentTextIcon className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Already Allocated
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 break-words leading-tight">
                  {stats.allocatedProjects || 0}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                <CheckIcon className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Pending Approval
                </p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 break-words leading-tight">
                  {stats.pendingAllocations || 0}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Total Allocated
                </p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 break-words leading-tight">
                  {formatCurrency(stats.totalAllocated || 0)}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Total Items Cost
                </p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600 break-words leading-tight">
                  {formatCurrency(stats.totalProjectItemsCost || 0)}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-4 h-4 text-purple-600" />
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
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("projects")}
                className={`py-3 px-3 border-b-2 font-medium text-sm cursor-pointer transition-colors rounded-t-md ${
                  activeTab === "projects"
                    ? "border-[var(--elra-primary)] text-[var(--elra-primary)] bg-[color:var(--elra-primary,#0f5132)]/10"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                Projects Pending Allocation
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-3 px-3 border-b-2 font-medium text-sm cursor-pointer transition-colors rounded-t-md ${
                  activeTab === "history"
                    ? "border-[var(--elra-primary)] text-[var(--elra-primary)] bg-[color:var(--elra-primary,#0f5132)]/10"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                My Allocation History
              </button>
            </nav>
          </div>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <DataTable
                data={filteredProjects}
                columns={projectColumns}
                loading={loading}
                actions={{
                  showEdit: false,
                  showDelete: false,
                  showToggle: false,
                  customActions: (project) => (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProjectDetails(project);
                        }}
                        title="View Project Details"
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {project.status === "pending_budget_allocation" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateAllocationForProject(project);
                          }}
                          title="Create Budget Allocation"
                          className="bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ),
                }}
                emptyState={{
                  icon: (
                    <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                  ),
                  title: "No projects found",
                  description:
                    filters.status || filters.search
                      ? "No projects match your current filters. Try adjusting your search criteria."
                      : "No projects found that need budget allocation.",
                }}
              />
            </div>
          </>
        ) : activeTab === "history" ? (
          /* Budget History Table using DataTable component */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <DataTable
              data={budgetHistory}
              columns={[
                {
                  header: "Project",
                  accessor: "project",
                  renderer: (allocation) => (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {allocation.project?.name ||
                          allocation.entityName ||
                          "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {allocation.project?.code ||
                          allocation.entityCode ||
                          "N/A"}
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Allocation Code",
                  accessor: "allocationCode",
                  renderer: (allocation) => (
                    <span className="text-sm font-mono text-gray-900">
                      {allocation.allocationCode}
                    </span>
                  ),
                },
                {
                  header: "Amount Allocated",
                  accessor: "allocatedAmount",
                  renderer: (allocation) => (
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(
                        allocation.allocatedAmount,
                        allocation.currency
                      )}
                    </div>
                  ),
                },
                {
                  header: "Status",
                  accessor: "status",
                  renderer: (allocation) => (
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
                  ),
                },
                {
                  header: "Allocated Date",
                  accessor: "createdAt",
                  renderer: (allocation) => (
                    <div className="text-sm text-gray-500">
                      {new Date(allocation.createdAt).toLocaleDateString()}
                    </div>
                  ),
                },
              ]}
              loading={loading}
              searchable={true}
              sortable={true}
              pagination={true}
              actions={{
                showEdit: false,
                showDelete: false,
                showToggle: false,
                customActions: (allocation) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAllocation(allocation);
                      setShowDetailsModal(true);
                    }}
                    title="View Allocation Details"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                ),
              }}
              emptyState={{
                icon: <DocumentTextIcon className="h-12 w-12 text-gray-400" />,
                title: "No budget allocation history found",
                description:
                  "Your approved budget allocations will appear here.",
              }}
            />
          </div>
        ) : (
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
                      {budgetHistory.map((allocation) => (
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

                {budgetHistory.length === 0 && (
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
          <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
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
                                    Items Cost (Base Allocation):
                                  </span>
                                  <span className="text-green-700 font-bold">
                                    {formatCurrency(baseAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Project Documents Section */}
                            {selectedProject.requiredDocuments &&
                              selectedProject.requiredDocuments.length > 0 && (
                                <div className="mt-4 p-3 bg-white rounded border border-green-200">
                                  <p className="text-sm font-medium text-green-800 mb-3">
                                    📄 Required Documents
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {selectedProject.requiredDocuments.map(
                                      (doc, index) => (
                                        <div key={index}>
                                          <div className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-center mb-2">
                                              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <p className="text-xs font-medium text-gray-700 truncate text-center">
                                              {doc.documentType
                                                .replace(/_/g, " ")
                                                .toUpperCase()}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate mt-1 text-center">
                                              {doc.fileName}
                                            </p>
                                            <div className="flex items-center justify-center mt-3">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (doc.documentId) {
                                                    window.open(
                                                      `/api/documents/${doc.documentId}/view`,
                                                      "_blank"
                                                    );
                                                  }
                                                }}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                                                title="View Document"
                                              >
                                                View
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm">💡</span>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Simplified Allocation
                      </p>
                      <p className="text-sm text-blue-700">
                        This will allocate the exact project items cost. Extra
                        funds will be saved in the employee's wallet for future
                        requests.
                      </p>
                    </div>
                  </div>
                </div>

                {formData.projectId &&
                  (() => {
                    const selectedProject = projects.find(
                      (p) => p._id === formData.projectId
                    );
                    if (selectedProject) {
                      const baseAmount =
                        getBaseAmountForAllocation(selectedProject);
                      return (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-800 mb-3">
                            💳 Payment Summary
                          </p>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="text-gray-600">
                                Project Items Cost:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(baseAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-100 rounded border-2 border-green-300">
                              <span className="text-green-800 font-semibold">
                                Total Amount to Allocate:
                              </span>
                              <span className="text-green-800 font-bold text-lg">
                                {formatCurrency(baseAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const signatureTemplate = `Budget allocation approved for project items cost.

Allocated by: ${user?.firstName} ${user?.lastName}
Date & Time: ${new Date().toLocaleString()}
Finance HOD`;
                        setFormData((prev) => ({
                          ...prev,
                          notes: signatureTemplate,
                        }));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Use Signature Template
                    </button>
                  </div>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    rows="4"
                    placeholder={`Budget allocation approved for project items cost.

Allocated by: ${user?.firstName} ${user?.lastName}
Date & Time: ${new Date().toLocaleString()}
Finance HOD`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Use Signature Template" to auto-fill your signature,
                    or add your own notes
                  </p>
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
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
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
                className="flex-1 px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg font-medium hover:bg-[var(--elra-primary-dark)] transition-colors cursor-pointer"
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

      {/* Project Details Modal */}
      {showProjectDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Project Details
                </h2>
                <p className="text-gray-600">
                  {selectedProject.name} - {selectedProject.code}
                </p>
              </div>
              <button
                onClick={() => setShowProjectDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Project Progress Tracking */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 text-lg">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Approval Progress
                  </h3>
                </div>

                {selectedProject.approvalChain &&
                selectedProject.approvalChain.length > 0 ? (
                  <div className="space-y-4">
                    {/* Overall Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Overall Approval Progress
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {(() => {
                            const completed =
                              selectedProject.approvalChain.filter(
                                (step) => step.status === "approved"
                              ).length;
                            const total = selectedProject.approvalChain.length;
                            return `${completed}/${total} levels completed`;
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${(() => {
                              const completed =
                                selectedProject.approvalChain.filter(
                                  (step) => step.status === "approved"
                                ).length;
                              const total =
                                selectedProject.approvalChain.length;
                              return total > 0 ? (completed / total) * 100 : 0;
                            })()}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Approval Chain Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProject.approvalChain.map((step, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            step.status === "approved"
                              ? "bg-green-50 border-green-200"
                              : step.status === "pending"
                              ? "bg-yellow-50 border-yellow-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {step.level
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <div className="flex items-center">
                            {step.status === "approved" ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            ) : step.status === "pending" ? (
                              <ClockSolid className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      No approval chain data available
                    </p>
                  </div>
                )}
              </div>

              {/* Extra Wallet Information */}
              {selectedProject.requiresBudgetAllocation && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 text-lg">💳</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Extra Wallet Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        Project Budget
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedProject.budget)}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        Items Cost
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(
                          selectedProject.projectItems?.reduce(
                            (sum, item) => sum + (item.totalPrice || 0),
                            0
                          ) || 0
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        Extra Funds Available
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(
                          selectedProject.budget -
                            (selectedProject.projectItems?.reduce(
                              (sum, item) => sum + (item.totalPrice || 0),
                              0
                            ) || 0)
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-blue-600 text-sm">💡</span>
                      </div>
                      <div>
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          Budget Allocation Tip
                        </p>
                        <p className="text-sm text-blue-700">
                          After approving this budget allocation, procurement
                          will be automatically triggered. The extra funds will
                          be saved in the employee's wallet for future project
                          requests.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Basic Information */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Project Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">
                      Project Name:
                    </span>
                    <p className="text-gray-900">{selectedProject.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Project Code:
                    </span>
                    <p className="text-gray-900 font-mono">
                      {selectedProject.code}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Department:
                    </span>
                    <p className="text-gray-900">
                      {selectedProject.department?.name}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Project Manager:
                    </span>
                    <p className="text-gray-900">
                      {selectedProject.projectManager?.firstName}{" "}
                      {selectedProject.projectManager?.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Budget:</span>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(selectedProject.budget)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedProject.status === "pending_budget_allocation"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedProject.status === "pending_budget_allocation"
                        ? "Need Allocation"
                        : "Allocated"}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="font-medium text-gray-700">
                    Description:
                  </span>
                  <p className="text-gray-900 mt-1">
                    {selectedProject.description}
                  </p>
                </div>
              </div>

              {/* Project Items */}
              {selectedProject.projectItems &&
                selectedProject.projectItems.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <span className="text-2xl">🛍️</span>
                      Project Items
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item Name
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedProject.projectItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {item.description}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                                {formatCurrency(item.totalPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-3 bg-white rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          Items Total:
                        </span>
                        <span className="font-bold text-lg text-blue-600">
                          {formatCurrency(
                            calculateProjectItemsTotal(selectedProject)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Required Documents */}
              {selectedProject.requiredDocuments &&
                selectedProject.requiredDocuments.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <DocumentTextIcon className="w-6 h-6 text-green-600" />
                      Required Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProject.requiredDocuments.map((doc, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1 capitalize">
                              {doc.documentType.replace(/_/g, " ")}
                            </h4>
                            <p className="text-xs text-gray-500 mb-3 truncate w-full">
                              {doc.fileName}
                            </p>
                            <button
                              onClick={() => {
                                if (doc.documentId) {
                                  window.open(
                                    `/api/documents/${doc.documentId}/view`,
                                    "_blank"
                                  );
                                }
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full"
                            >
                              View Document
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Financial Summary */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="text-gray-600">Project Budget:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedProject.budget)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="text-gray-600">Items Total:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        calculateProjectItemsTotal(selectedProject)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-100 rounded border-2 border-yellow-300">
                    <span className="text-yellow-800 font-semibold">
                      Extra Funds Available:
                    </span>
                    <span className="text-yellow-800 font-bold text-lg">
                      {formatCurrency(
                        selectedProject.budget -
                          calculateProjectItemsTotal(selectedProject)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowProjectDetailsModal(false)}
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg font-medium hover:bg-[var(--elra-primary-dark)] transition-colors"
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

export default BudgetAllocation;
