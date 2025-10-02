import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
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

  const filterProjects = () => {
    let filtered = [...projects];

    if (filters.status) {
      if (filters.status === "pending_budget_allocation") {
        filtered = filtered.filter(
          (project) => project.status === "pending_budget_allocation"
        );
      } else if (filters.status === "approved") {
        filtered = filtered.filter((project) => project.status === "approved");
      }
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
        allocatedAmount: 0,
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
    if (!project) return 0;

    const totalItemsCost = calculateProjectItemsTotal(project);

    if (project.projectScope === "external" && project.budgetPercentage) {
      return (totalItemsCost * project.budgetPercentage) / 100;
    }

    return totalItemsCost;
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
            {project.projectScope === "external" &&
              project.budgetPercentage && (
                <div className="text-xs text-blue-600 font-medium">
                  ELRA: {project.budgetPercentage}% | Client:{" "}
                  {100 - project.budgetPercentage}%
                </div>
              )}
          </div>
        </div>
      ),
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
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Modern Header */}
      <div className="mb-8 relative">
        <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                  <BanknotesIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    Project Budget Allocation
                  </h1>
                  <p className="text-white/90 mt-2 text-lg">
                    Review and approve budget allocations for projects and
                    operational funding
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    loadStats();
                    loadProjects();
                    loadBudgetHistory();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 disabled:opacity-50 border border-white/20"
                >
                  <ArrowPathIcon
                    className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh Data
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pending Projects Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                  Pending Projects
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-2 break-all leading-tight">
                  {stats.pendingProjects || 0}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Need Budget Allocation
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <DocumentTextIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Allocated Projects Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                  Allocated Projects
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                  {stats.allocatedProjects || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">Budget Approved</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <CheckIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Pending Approvals Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                  Pending Approvals
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                  {stats.pendingAllocations || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">Awaiting Review</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Total Allocated Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                  Total Allocated
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                  {formatCurrency(stats.totalAllocated || 0)}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Budget Distributed
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Financial Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl shadow-lg p-8 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Financial Overview</h2>
                  <p className="text-white/80">
                    Budget allocation and wallet status
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    ELRA Wallet Balance
                  </p>
                  <BuildingOfficeIcon className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(
                    stats.walletBalance?.projects?.available || 0
                  )}
                </p>
                <p className="text-xs text-white/70">Available for Projects</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Total Project Items Cost
                  </p>
                  <ArrowTrendingUpIcon className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(stats.totalProjectItemsCost || 0)}
                </p>
                <p className="text-xs text-white/70">Pending Allocation</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Total Allocated Amount
                  </p>
                  <ArrowTrendingDownIcon className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(stats.totalAllocated || 0)}
                </p>
                <p className="text-xs text-white/70">Budget Distributed</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden"
        >
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === "projects"
                    ? "bg-[var(--elra-primary)] text-white border-b-2 border-[var(--elra-primary)]"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Projects Pending Allocation</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === "history"
                    ? "bg-[var(--elra-primary)] text-white border-b-2 border-[var(--elra-primary)]"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>Allocation History</span>
                </div>
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          {activeTab === "projects" ? (
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Enhanced Filter Summary */}
              {filters.status && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-blue-800">
                      <span className="font-semibold">Active Filter:</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        Status:{" "}
                        {filters.status === "pending_budget_allocation"
                          ? "Pending Allocation"
                          : "Approved"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {filteredProjects.length} project
                      {filteredProjects.length !== 1 ? "s" : ""} found
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Projects Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
              >
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
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProjectDetails(project);
                          }}
                          title="View Project Details"
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </motion.button>
                        {project.status === "pending_budget_allocation" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateAllocationForProject(project);
                            }}
                            title="Create Budget Allocation"
                            className="bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white p-2 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>
                    ),
                  }}
                  searchable={true}
                  sortable={true}
                  pagination={true}
                  itemsPerPage={10}
                  emptyState={{
                    icon: (
                      <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                    ),
                    title: "No projects found",
                    description: filters.status
                      ? "No projects match your current status filter. Try adjusting your filter criteria."
                      : "No projects found that need budget allocation.",
                  }}
                />
              </motion.div>
            </motion.div>
          ) : activeTab === "history" ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Enhanced Budget History Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
              >
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
                        <span className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
                          {allocation.allocationCode}
                        </span>
                      ),
                    },
                    {
                      header: "Amount Allocated",
                      accessor: "allocatedAmount",
                      renderer: (allocation) => (
                        <div className="text-sm font-semibold text-gray-900">
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAllocation(allocation);
                          setShowDetailsModal(true);
                        }}
                        title="View Allocation Details"
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </motion.button>
                    ),
                  }}
                  emptyState={{
                    icon: (
                      <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                    ),
                    title: "No budget allocation history found",
                    description:
                      "Your approved budget allocations will appear here.",
                  }}
                />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Enhanced Create Allocation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col border border-gray-100 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                        <PlusIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                          Create Budget Allocation
                        </h2>
                        <p className="text-white/90 mt-2 text-lg">
                          Allocate budget for project procurement and operations
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateModal(false)}
                      className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/20"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <form onSubmit={handleCreateAllocation} className="space-y-8">
                  {/* Project Selection */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      Selected Project
                    </label>

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
                            <div className="mt-6 space-y-6">
                              {/* Project Details */}
                              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex items-center space-x-3 mb-4">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Project Details
                                  </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                      Project Name:
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      {selectedProject.name}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                      Project Code:
                                    </p>
                                    <p className="font-semibold text-gray-900 font-mono">
                                      {selectedProject.code}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                      Department:
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      {selectedProject.department?.name}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                      Project Manager:
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      {
                                        selectedProject.projectManager
                                          ?.firstName
                                      }{" "}
                                      {selectedProject.projectManager?.lastName}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Financial Breakdown */}
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                <div className="flex items-center space-x-3 mb-4">
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Financial Breakdown
                                  </h3>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                    <span className="text-gray-600 font-medium">
                                      Items Total:
                                    </span>
                                    <span className="font-bold text-gray-900">
                                      {formatCurrency(itemsTotal)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                    <span className="text-gray-600 font-medium">
                                      Project Budget:
                                    </span>
                                    <span className="font-bold text-gray-900">
                                      {formatCurrency(budget)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border-2 border-green-300">
                                    <span className="text-green-800 font-semibold">
                                      Items Cost (Base Allocation):
                                    </span>
                                    <span className="text-green-800 font-bold text-lg">
                                      {formatCurrency(baseAmount)}
                                    </span>
                                  </div>
                                </div>

                                {/* ELRA Contribution Breakdown (for external projects) */}
                                {selectedProject.projectScope === "external" &&
                                  selectedProject.budgetPercentage && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                      <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                          <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                          ELRA Contribution Breakdown
                                        </h3>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* ELRA Contribution */}
                                        <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">
                                              ELRA Contribution
                                            </span>
                                            <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                                              {selectedProject.budgetPercentage}
                                              %
                                            </span>
                                          </div>
                                          <div className="text-2xl font-bold text-green-700">
                                            {formatCurrency(
                                              (itemsTotal *
                                                selectedProject.budgetPercentage) /
                                                100
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            ELRA will fund this amount
                                          </div>
                                        </div>

                                        {/* Client Contribution */}
                                        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">
                                              Client Contribution
                                            </span>
                                            <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                              {100 -
                                                selectedProject.budgetPercentage}
                                              %
                                            </span>
                                          </div>
                                          <div className="text-2xl font-bold text-blue-700">
                                            {formatCurrency(
                                              (itemsTotal *
                                                (100 -
                                                  selectedProject.budgetPercentage)) /
                                                100
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            Client will handle this amount
                                          </div>
                                        </div>
                                      </div>

                                      {/* Total Project Cost */}
                                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold text-gray-700">
                                            Total Project Cost:
                                          </span>
                                          <span className="font-bold text-lg text-gray-900">
                                            {formatCurrency(itemsTotal)}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Important Notice */}
                                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                          <div className="p-1 bg-yellow-100 rounded">
                                            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-yellow-800">
                                              Important Notice
                                            </p>
                                            <p className="text-xs text-yellow-700 mt-1">
                                              ELRA will only fund{" "}
                                              {selectedProject.budgetPercentage}
                                              % of the project cost. The client
                                              is responsible for the remaining{" "}
                                              {100 -
                                                selectedProject.budgetPercentage}
                                              % and must coordinate their own
                                              delivery and payment arrangements.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </div>

                              {/* Project Documents Section */}
                              {selectedProject.requiredDocuments &&
                                selectedProject.requiredDocuments.length >
                                  0 && (
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                    <div className="flex items-center space-x-3 mb-4">
                                      <div className="p-2 bg-blue-100 rounded-lg">
                                        <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        Required Documents
                                      </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {selectedProject.requiredDocuments.map(
                                        (doc, index) => (
                                          <div
                                            key={index}
                                            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                          >
                                            <div className="flex items-center justify-center mb-3">
                                              <div className="p-3 bg-blue-100 rounded-lg">
                                                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                                              </div>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 text-center mb-1">
                                              {doc.documentType
                                                .replace(/_/g, " ")
                                                .toUpperCase()}
                                            </p>
                                            <p className="text-xs text-gray-500 text-center mb-4 truncate">
                                              {doc.fileName}
                                            </p>
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              type="button"
                                              onClick={() => {
                                                if (doc.documentId) {
                                                  window.open(
                                                    `/api/documents/${doc.documentId}/view`,
                                                    "_blank"
                                                  );
                                                }
                                              }}
                                              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                                              title="View Document"
                                            >
                                              View Document
                                            </motion.button>
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

                  {/* Budget Allocation Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <span className="text-blue-600 text-xl">💡</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          Budget Allocation Information
                        </h3>
                        <p className="text-blue-800">
                          This will allocate the exact project items cost for
                          procurement. Current ELRA wallet balance:{" "}
                          <span className="font-bold">
                            {formatCurrency(
                              stats.walletBalance?.projects?.available || 0
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  {formData.projectId &&
                    (() => {
                      const selectedProject = projects.find(
                        (p) => p._id === formData.projectId
                      );
                      if (selectedProject) {
                        const baseAmount =
                          getBaseAmountForAllocation(selectedProject);
                        return (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Payment Summary
                              </h3>
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200">
                                <span className="text-gray-600 font-medium">
                                  ELRA Wallet Balance:
                                </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(
                                    stats.walletBalance?.projects?.available ||
                                      0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200">
                                <span className="text-gray-600 font-medium">
                                  Project Items Cost:
                                </span>
                                <span className="font-bold text-gray-900">
                                  {formatCurrency(baseAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-4 bg-green-100 rounded-xl border-2 border-green-300">
                                <span className="text-green-800 font-semibold text-lg">
                                  Total Amount to Allocate:
                                </span>
                                <span className="text-green-800 font-bold text-xl">
                                  {formatCurrency(baseAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <span className="text-blue-700 font-semibold">
                                  Remaining Balance After:
                                </span>
                                <span className="text-blue-700 font-bold text-lg">
                                  {formatCurrency(
                                    (stats.walletBalance?.projects?.available ||
                                      0) - baseAmount
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                  {/* Notes Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-lg font-semibold text-gray-900">
                        Allocation Notes
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
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
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                      >
                        Use Signature Template
                      </motion.button>
                    </div>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent resize-none"
                      rows="4"
                      placeholder={`Budget allocation approved for project items cost.

Allocated by: ${user?.firstName} ${user?.lastName}
Date & Time: ${new Date().toLocaleString()}
Finance HOD`}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Click "Use Signature Template" to auto-fill your
                      signature, or add your own notes
                    </p>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex-shrink-0 p-8 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleCreateAllocation}
                    className="flex-1 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating Allocation...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        Create Allocation
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedAllocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-gray-100 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                        <EyeIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                          Budget Allocation Details
                        </h2>
                        <p className="text-white/90 mt-2 text-lg">
                          View detailed information about this allocation
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDetailsModal(false)}
                      className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/20"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-8">
                  {/* Allocation Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Allocation Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Allocation Code
                        </label>
                        <p className="text-lg font-mono text-gray-900 bg-white px-3 py-2 rounded-lg border">
                          {selectedAllocation.allocationCode}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Entity Name
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedAllocation.entityName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Entity Code
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedAllocation.entityCode}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Allocation Type
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {getAllocationTypeLabel(
                            selectedAllocation.allocationType
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Financial Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Amount Allocated
                        </label>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            selectedAllocation.allocatedAmount,
                            selectedAllocation.currency
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Status
                        </label>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedAllocation.status)}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                              selectedAllocation.status
                            )}`}
                          >
                            {selectedAllocation.status.charAt(0).toUpperCase() +
                              selectedAllocation.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Creator Information */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Creator Information
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Created By
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedAllocation.allocatedBy?.firstName}{" "}
                        {selectedAllocation.allocatedBy?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedAllocation.allocatedBy?.email}
                      </p>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {selectedAllocation.notes && (
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Notes
                      </h3>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {selectedAllocation.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex-shrink-0 p-8 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-all duration-200 cursor-pointer"
                  >
                    Close
                  </motion.button>
                  {selectedAllocation.status === "pending" && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleApproveAllocation(selectedAllocation._id);
                          setShowDetailsModal(false);
                        }}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200"
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleRejectAllocation(selectedAllocation._id);
                          setShowDetailsModal(false);
                        }}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                      >
                        Reject
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Project Details Modal */}
      <AnimatePresence>
        {showProjectDetailsModal && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowProjectDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col border border-gray-100 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                        <DocumentTextIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                          Project Details
                        </h2>
                        <p className="text-white/90 mt-2 text-lg">
                          {selectedProject.name} - {selectedProject.code}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowProjectDetailsModal(false)}
                      className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/20"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8">
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
                  {/* Budget Allocation Information */}
                  {selectedProject.requiresBudgetAllocation && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-lg">💳</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Budget Allocation Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            ELRA Wallet Balance
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              stats.walletBalance?.projects?.available || 0
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Available for Projects
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            Project Budget
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(selectedProject.budget)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Total Project Budget
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            Items Cost (To Allocate)
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(
                              selectedProject.projectItems?.reduce(
                                (sum, item) => sum + (item.totalPrice || 0),
                                0
                              ) || 0
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Required for Procurement
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-start">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-green-600 text-sm">💰</span>
                          </div>
                          <div>
                            <p className="text-sm text-green-800 font-medium mb-1">
                              Allocation Summary
                            </p>
                            <p className="text-sm text-green-700">
                              This allocation will reserve ₦
                              {formatNumberWithCommas(
                                selectedProject.projectItems?.reduce(
                                  (sum, item) => sum + (item.totalPrice || 0),
                                  0
                                ) || 0
                              )}{" "}
                              from the ELRA wallet for project procurement.
                              After approval, procurement will be automatically
                              triggered.
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
                        <span className="font-medium text-gray-700">
                          Budget:
                        </span>
                        <p className="text-gray-900 font-semibold">
                          {formatCurrency(selectedProject.budget)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedProject.status ===
                            "pending_budget_allocation"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {selectedProject.status ===
                          "pending_budget_allocation"
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

                  {/* Budget Percentage Breakdown (for external projects) */}
                  {selectedProject.projectScope === "external" &&
                    selectedProject.budgetPercentage && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                          <span className="text-2xl">💰</span>
                          Budget Contribution Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                ELRA Contribution
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {selectedProject.budgetPercentage}%
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-green-700">
                              {formatCurrency(
                                (calculateProjectItemsTotal(selectedProject) *
                                  selectedProject.budgetPercentage) /
                                  100
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ELRA will handle this amount
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                Client Contribution
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {100 - selectedProject.budgetPercentage}%
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-blue-700">
                              {formatCurrency(
                                (calculateProjectItemsTotal(selectedProject) *
                                  (100 - selectedProject.budgetPercentage)) /
                                  100
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Client will handle this amount
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-700">
                              Total Project Cost:
                            </span>
                            <span className="font-bold text-lg text-gray-900">
                              {formatCurrency(
                                calculateProjectItemsTotal(selectedProject)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

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
                              {selectedProject.projectItems.map(
                                (item, index) => (
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
                                )
                              )}
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
                          {selectedProject.requiredDocuments.map(
                            (doc, index) => (
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
                            )
                          )}
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex-shrink-0 p-8 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowProjectDetailsModal(false)}
                    className="px-8 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-all duration-200 cursor-pointer"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetAllocation;
