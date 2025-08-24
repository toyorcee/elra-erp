import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  getNextProjectCode,
} from "../../../../services/projectAPI.js";
import {
  formatCurrency,
  formatDate,
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../../../../utils/formatters.js";
import DataTable from "../../../../components/common/DataTable";
import UserSearchSelect from "../../../../components/common/UserSearchSelect";

const ProjectList = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    projectManager: "all",
    department: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    budget: "",
    projectManager: "",
    category: "",
    customCategory: "",
    status: "planning",
    priority: "medium",
    teamName: "",
  });

  const [nextProjectCode, setNextProjectCode] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const getApprovalLevelText = (budget) => {
    const numBudget = parseFormattedNumber(budget);
    if (!numBudget || numBudget <= 0) return null;

    // Super Admin - always auto-approved
    if (user.role.level === 1000) {
      return {
        text: "👑 Auto-approved by Super Admin",
        color: "text-purple-600",
      };
    }

    if (numBudget <= 1000000) {
      return { text: "✅ Auto-approved by HOD", color: "text-green-600" };
    } else if (numBudget <= 5000000) {
      if (user.department?.name === "Finance & Accounting") {
        return {
          text: "📋 Direct to Executive Approval",
          color: "text-blue-600",
        };
      } else {
        return {
          text: "📋 Finance → Executive Approval",
          color: "text-blue-600",
        };
      }
    } else if (numBudget <= 25000000) {
      if (user.department?.name === "Finance & Accounting") {
        return {
          text: "💰 Direct to Executive Approval",
          color: "text-orange-600",
        };
      } else {
        return {
          text: "💰 Finance → Executive Approval",
          color: "text-orange-600",
        };
      }
    } else {
      if (user.department?.name === "Finance & Accounting") {
        return {
          text: "👔 Direct to Executive Approval",
          color: "text-red-600",
        };
      } else if (user.department?.name === "Executive Office") {
        return { text: "👔 Finance → Self-approval", color: "text-red-600" };
      } else {
        return {
          text: "👔 Finance → Executive Approval",
          color: "text-red-600",
        };
      }
    }
  };

  if (!user || user.role.level < 700) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only HOD and Super Admin can access Project List.
          </p>
        </div>
      </div>
    );
  }

  // Project categories from backend model - filtered by user's department
  const getProjectCategories = () => {
    const allCategories = [
      { value: "all", label: "All Categories" },
      { value: "equipment_lease", label: "Equipment Lease" },
      { value: "vehicle_lease", label: "Vehicle Lease" },
      { value: "property_lease", label: "Property Lease" },
      { value: "financial_lease", label: "Financial Lease" },
      { value: "training_equipment_lease", label: "Training Equipment Lease" },
      { value: "compliance_lease", label: "Compliance Lease" },
      { value: "service_equipment_lease", label: "Service Equipment Lease" },
      { value: "strategic_lease", label: "Strategic Lease" },
      { value: "software_development", label: "Software Development" },
      { value: "system_maintenance", label: "System Maintenance" },
      { value: "consulting", label: "Consulting" },
      { value: "training", label: "Training" },
      { value: "other", label: "Other (Custom Category)" },
    ];

    // Super Admin can see all categories
    if (user.role.level >= 1000) {
      return allCategories;
    }

    // Department-based categories
    const departmentCategoryMap = {
      Operations: [
        "equipment_lease",
        "software_development",
        "system_maintenance",
      ],
      "Sales & Marketing": ["vehicle_lease", "consulting", "training"],
      "Information Technology": [
        "property_lease",
        "software_development",
        "system_maintenance",
      ],
      "Finance & Accounting": ["financial_lease", "consulting", "training"],
      "Human Resources": ["training_equipment_lease", "consulting", "training"],
      "Legal & Compliance": ["compliance_lease", "consulting"],
      "Customer Service": ["service_equipment_lease", "consulting", "training"],
      "Executive Office": ["strategic_lease", "consulting", "training"],
    };

    const userDepartment = user.department?.name;
    const allowedCategories = departmentCategoryMap[userDepartment] || [];

    return [
      { value: "all", label: "All Categories" },
      ...allCategories.filter(
        (cat) => cat.value === "all" || allowedCategories.includes(cat.value)
      ),
    ];
  };

  const projectCategories = getProjectCategories();

  const projectStatuses = [
    { value: "all", label: "All Statuses" },
    {
      value: "planning",
      label: "Planning",
      color: "bg-gray-100 text-gray-800",
    },
    { value: "active", label: "Active", color: "bg-blue-100 text-blue-800" },
    {
      value: "on_hold",
      label: "On Hold",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "completed",
      label: "Completed",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (showModal && !isEditMode) {
      loadNextProjectCode();
    }
  }, [showModal, isEditMode]);

  const loadNextProjectCode = async () => {
    try {
      const response = await getNextProjectCode();
      if (response.success) {
        setNextProjectCode(response.data.nextCode);
        setCurrentDate(response.data.currentDate);
      }
    } catch (error) {
      console.error("Error loading next project code:", error);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetchProjects();
      if (response.success) {
        setProjects(response.data);
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      budget: "",
      projectManager: "",
      category: "",
      status: "planning",
      priority: "medium",
      teamName: "",
    });
    setIsEditMode(false);
    setSelectedProject(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openDetailsModal = (project) => {
    setSelectedProjectDetails(project);
    setShowDetailsModal(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setIsEditMode(true);
    setFormData({
      name: project.name || "",
      description: project.description || "",
      startDate: project.startDate
        ? new Date(project.startDate).toISOString().split("T")[0]
        : "",
      endDate: project.endDate
        ? new Date(project.endDate).toISOString().split("T")[0]
        : "",
      budget: project.budget
        ? formatNumberWithCommas(project.budget.toString())
        : "",
      projectManager:
        project.projectManager?._id || project.projectManager || "",
      category: project.category || "",
      status: project.status || "planning",
      priority: project.priority || "medium",
      teamName: project.teamName || "",
    });
    console.log(
      "🔍 [EDIT] Form data set with manager ID:",
      project.projectManager?._id || project.projectManager
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push("Project name is required");
    }

    if (!formData.category) {
      errors.push("Category is required");
    }

    if (formData.category === "other" && !formData.customCategory?.trim()) {
      errors.push("Custom category name is required when selecting 'Other'");
    }

    if (!formData.startDate) {
      errors.push("Start date is required");
    }

    if (!formData.endDate) {
      errors.push("End date is required");
    }

    if (!formData.budget || parseFormattedNumber(formData.budget) <= 0) {
      errors.push("Budget must be greater than 0");
    }

    if (!formData.projectManager) {
      errors.push("Project Manager is required");
    }

    if (!formData.status) {
      errors.push("Status is required");
    }

    if (!formData.priority) {
      errors.push("Priority is required");
    }

    if (!formData.description.trim()) {
      errors.push("Description is required");
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        errors.push("End date must be after start date");
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        toast.error(error);
      });
      return;
    }

    if (isEditMode) {
      setProjectToEdit(selectedProject);
      setShowEditConfirm(true);
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        budget: parseFormattedNumber(formData.budget),
      };

      const response = await createProject(submitData);
      if (response.success) {
        toast.success("Project created successfully");
        loadProjects();
        closeModal();
      } else {
        toast.error(response.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      toast.error("Error submitting project");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmUpdate = async () => {
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        budget: parseFormattedNumber(formData.budget),
      };

      const response = await updateProject(selectedProject._id, submitData);
      if (response.success) {
        toast.success("Project updated successfully");
        loadProjects();
        closeModal();
      } else {
        toast.error(response.message || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Error updating project");
    } finally {
      setSubmitting(false);
      setShowEditConfirm(false);
      setProjectToEdit(null);
    }
  };

  const handleDelete = async (projectId) => {
    const project = projects.find((p) => p._id === projectId);
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteProject(projectToDelete._id);
      if (response.success) {
        toast.success("Project deleted successfully");
        loadProjects();
      } else {
        toast.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error deleting project");
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = projectStatuses.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusConfig?.color || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  const getDefaultAvatar = (user = null) => {
    if (user && user.firstName && user.lastName) {
      const firstName = user.firstName.charAt(0).toUpperCase();
      const lastName = user.lastName.charAt(0).toUpperCase();
      return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff&size=32&rounded=true`;
    }
    return "https://ui-avatars.com/api/?name=Unknown+User&background=random&color=fff&size=32&rounded=true";
  };

  const getImageUrl = (avatarPath, user = null) => {
    if (!avatarPath) return getDefaultAvatar(user);

    let path = avatarPath;
    if (typeof avatarPath === "object" && avatarPath.url) {
      path = avatarPath.url;
    }

    if (path.startsWith("http")) return path;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");

    return `${baseUrl}${path}`;
  };

  const getUserAvatar = (user) => {
    if (!user) return getDefaultAvatar();

    if (user.avatar && user.avatar !== "") {
      return getImageUrl(user.avatar, user);
    }

    return getDefaultAvatar(user);
  };

  const columns = [
    {
      header: "Project",
      accessor: "name",
      renderer: (project) => (
        <div className="flex items-center">
          <FolderIcon className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{project.name}</div>
            <div className="text-sm text-gray-500">{project.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Project Manager",
      accessor: "projectManager",
      renderer: (project) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {project.projectManager?.firstName}{" "}
            {project.projectManager?.lastName}
          </div>
          <div className="text-gray-500">{project.projectManager?.email}</div>
        </div>
      ),
    },
    {
      header: "Team Name",
      accessor: "teamName",
      renderer: (project) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {project.teamName || `${project.name} Team`}
          </div>
          <div className="text-gray-500">Team Tag</div>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "department",
      renderer: (project) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {project.department?.name || "Not Assigned"}
          </div>
          <div className="text-gray-500">Department</div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      renderer: (project) => {
        const category = projectCategories.find(
          (c) => c.value === project.category
        );
        return (
          <span className="text-sm text-gray-600">
            {category?.label || project.category?.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      header: "Budget",
      accessor: "budget",
      renderer: (project) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(project.budget)}
        </span>
      ),
    },
    {
      header: "Timeline",
      accessor: "startDate",
      renderer: (project) => (
        <div className="text-sm">
          <div className="text-gray-900">{formatDate(project.startDate)}</div>
          <div className="text-gray-500">to {formatDate(project.endDate)}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (project) => getStatusBadge(project.status),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Project List
            </h1>
            <p className="text-gray-600">
              {user.role.level >= 1000
                ? "Manage and track all projects across all departments"
                : `Manage and track projects for ${
                    user.department?.name || "your department"
                  } - Only leasing projects allowed`}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Project
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
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
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                {projectCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            {user.role.level >= 1000 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) =>
                    setFilters({ ...filters, department: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                >
                  <option value="all">All Departments</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Information Technology">
                    Information Technology
                  </option>
                  <option value="Finance & Accounting">
                    Finance & Accounting
                  </option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Legal & Compliance">Legal & Compliance</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Executive Office">Executive Office</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={loadProjects}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <DataTable
          data={projects}
          columns={columns}
          loading={loading}
          onRowClick={openDetailsModal}
          actions={{
            showEdit: true,
            showDelete: true,
            onEdit: openEditModal,
            onDelete: handleDelete,
          }}
          emptyState={{
            icon: <FolderIcon className="h-12 w-12 text-white" />,
            title: "No projects found",
            description: "Get started by creating your first project",
            actionButton: (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                Create Project
              </button>
            ),
          }}
        />
      </div>

      {/* Unified Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditMode ? "Edit Project" : "Create New Project"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Project Code Display - Only for new projects */}
              {!isEditMode && nextProjectCode && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-blue-800">
                        Next Project Code:
                      </span>
                      <span className="ml-2 text-lg font-bold text-blue-900">
                        {nextProjectCode}
                      </span>
                    </div>
                    <div className="text-sm text-blue-600">{currentDate}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter project name (e.g., ABC Construction - Excavator Lease)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name/Tag
                  </label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData({ ...formData, teamName: e.target.value })
                    }
                    placeholder="Enter team name or tag (optional)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    required
                    disabled={submitting}
                  >
                    <option value="">Select Category</option>
                    {projectCategories
                      .filter((cat) => cat.value !== "all") // Exclude "All Categories" from form
                      .map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                  </select>
                  {user.role.level < 1000 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available categories for {user.department?.name}{" "}
                      department
                    </p>
                  )}
                </div>
                {formData.category === "other" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customCategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customCategory: e.target.value,
                        })
                      }
                      placeholder="Enter custom category name"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                      required
                      disabled={submitting}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget (NGN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budget: formatNumberWithCommas(e.target.value),
                      })
                    }
                    placeholder="Enter budget amount (e.g., 2,500,000)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    required
                    disabled={submitting}
                  />
                  {formData.budget && getApprovalLevelText(formData.budget) && (
                    <p
                      className={`mt-2 text-sm font-medium ${
                        getApprovalLevelText(formData.budget).color
                      }`}
                    >
                      {getApprovalLevelText(formData.budget).text}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    required
                    disabled={submitting}
                  >
                    {projectStatuses.slice(1).map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    required
                    disabled={submitting}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Project Manager - Full Width */}
              <div className="mt-4">
                <UserSearchSelect
                  value={formData.projectManager}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      projectManager: value,
                    })
                  }
                  placeholder="Search for project manager..."
                  label="Project Manager"
                  required
                  disabled={submitting}
                  minRoleLevel={600} // Manager level and above
                  className="w-full"
                  currentUser={user}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter project description and objectives..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={submitting}
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isEditMode ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showDetailsModal && selectedProjectDetails && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Project Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FolderIcon className="h-5 w-5 text-blue-600 mr-2" />
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          N
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Project Name
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {selectedProjectDetails.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">
                          #
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Project Code
                        </label>
                        <p className="text-green-600 font-mono font-semibold">
                          {selectedProjectDetails.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">
                          T
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Team Name/Tag
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedProjectDetails.teamName ||
                            `${selectedProjectDetails.name} Team`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">
                          D
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Department
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedProjectDetails.department?.name ||
                            "Not Assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">
                          C
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Category
                        </label>
                        <p className="text-gray-900 font-medium">
                          {projectCategories.find(
                            (c) => c.value === selectedProjectDetails.category
                          )?.label ||
                            selectedProjectDetails.category?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">
                          S
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Status
                        </label>
                        <div className="mt-1">
                          {getStatusBadge(selectedProjectDetails.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-600 font-semibold text-sm">
                          %
                        </span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Progress
                        </label>
                        <div className="flex items-center mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-[var(--elra-primary)] h-2 rounded-full"
                              style={{
                                width: `${
                                  selectedProjectDetails.progress || 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-[var(--elra-primary)] font-semibold">
                            {selectedProjectDetails.progress || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-green-600 font-bold text-xl mr-2">
                      ₦
                    </span>
                    Financial Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">
                          B
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Budget
                        </label>
                        <p className="text-green-600 font-bold text-lg">
                          {formatCurrency(selectedProjectDetails.budget)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline and Team */}
              <div className="space-y-6">
                {/* Timeline */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-orange-600 font-bold text-xl mr-2">
                      📅
                    </span>
                    Timeline
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">
                          S
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Start Date
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {formatDate(selectedProjectDetails.startDate)}
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
                          {formatDate(selectedProjectDetails.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 font-semibold text-sm">
                          D
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Duration
                        </label>
                        <p className="text-yellow-600 font-bold">
                          {Math.ceil(
                            (new Date(selectedProjectDetails.endDate) -
                              new Date(selectedProjectDetails.startDate)) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Information */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-indigo-600 font-bold text-xl mr-2">
                      👥
                    </span>
                    Team Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                        Project Manager
                      </label>
                      <div className="text-gray-900">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {selectedProjectDetails.projectManager?.firstName}{" "}
                            {selectedProjectDetails.projectManager?.lastName}
                          </div>
                          <div className="text-sm text-indigo-600 font-medium">
                            {selectedProjectDetails.projectManager?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                        Team Members
                      </label>
                      <div className="text-gray-900">
                        {selectedProjectDetails.teamMembers?.length > 0 ? (
                          <div className="space-y-2">
                            {selectedProjectDetails.teamMembers.map(
                              (member, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-100"
                                >
                                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-semibold text-xs">
                                      {member.user?.firstName
                                        ?.charAt(0)
                                        ?.toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="font-medium text-sm">
                                    {member.user?.firstName}{" "}
                                    {member.user?.lastName}
                                  </span>
                                  <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-full">
                                    {member.role}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-gray-500 text-sm text-center">
                              No team members assigned
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedProjectDetails.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedProjectDetails);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Project
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Project
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium text-gray-900">
                  "{projectToDelete.name}"
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProjectToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Confirmation Modal */}
      {showEditConfirm && projectToEdit && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[var(--elra-primary)] bg-opacity-20">
                <PencilIcon className="h-6 w-6 text-[var(--elra-primary)]" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Update Project
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to update{" "}
                <span className="font-medium text-gray-900">
                  "{projectToEdit.name}"
                </span>
                ?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowEditConfirm(false);
                    setProjectToEdit(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpdate}
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors"
                >
                  Update Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
