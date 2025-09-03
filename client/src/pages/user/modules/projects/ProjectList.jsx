import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  FolderIcon,
  UsersIcon,
  EyeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import {
  HiDocument,
  HiArrowUpTray,
  HiXMark,
  HiDocumentText,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  getNextProjectCode,
  resubmitProject,
  fetchProjectCategories,
} from "../../../../services/projectAPI.js";
import {
  fetchApprovedVendors,
  fetchVendorCategories,
} from "../../../../services/vendorAPI.js";
import {
  uploadDocument,
  replaceProjectDocument,
  formatFileSize,
  getProjectDocuments,
  viewDocument,
} from "../../../../services/documents.js";
import {
  formatCurrency,
  formatDate,
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../../../../utils/formatters.js";
import DataTable from "../../../../components/common/DataTable";
import UserSearchSelect from "../../../../components/common/UserSearchSelect";
import ELRALogo from "../../../../components/ELRALogo.jsx";

const ProjectList = () => {
  const { user, loading: userLoading } = useAuth();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .modal-shadow-enhanced {
        box-shadow: 
          0 25px 50px -12px rgba(0, 0, 0, 0.25),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          0 0 40px rgba(0, 0, 0, 0.1);
        animation: modalAppear 0.3s ease-out;
      }
      .modal-backdrop-enhanced {
        backdrop-filter: blur(8px);
        background: rgba(0, 0, 0, 0.6);
        animation: backdropAppear 0.3s ease-out;
      }
      @keyframes modalAppear {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes backdropAppear {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
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

  const [vendors, setVendors] = useState([]);
  const [selectedVendorCategory, setSelectedVendorCategory] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    startDate: "",
    endDate: "",
    budget: "",
    projectManager: "",
    priority: "medium",
    projectScope: "personal",
    vendorId: "",
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
    requiresBudgetAllocation: "",
  });

  const [projectItems, setProjectItems] = useState([
    {
      name: "",
      description: "",
      quantity: 1,
      unitPrice: "",
      totalPrice: 0,
      deliveryTimeline: "",
      currency: "NGN",
    },
  ]);

  // Currency options
  const currencyOptions = [
    { value: "NGN", label: "NGN (Nigerian Naira)", symbol: "₦" },
    { value: "USD", label: "USD (US Dollar)", symbol: "$" },
    { value: "GBP", label: "GBP (British Pound)", symbol: "£" },
  ];

  // Vendor categories state
  const [vendorCategories, setVendorCategories] = useState([]);

  const [nextProjectCode, setNextProjectCode] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [resubmittingProject, setResubmittingProject] = useState(null);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);
  const [projectToResubmit, setProjectToResubmit] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);
  const [showStep2ConfirmModal, setShowStep2ConfirmModal] = useState(false);

  // Multi-step form state for external projects
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(2);
  const [showScopeSelection, setShowScopeSelection] = useState(true);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedProjectForDocument, setSelectedProjectForDocument] =
    useState(null);
  const [documentFormData, setDocumentFormData] = useState({
    title: "",
    description: "",
    category: "Project Documentation",
    documentType: "Project Document",
    priority: "Medium",
    tags: "",
    isConfidential: false,
  });
  const [isDocumentEditingDisabled, setIsDocumentEditingDisabled] =
    useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState(null);

  const [projectDocuments, setProjectDocuments] = useState({});
  const [loadingDocuments, setLoadingDocuments] = useState({});

  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedProjectForDocuments, setSelectedProjectForDocuments] =
    useState(null);

  const [isReplacingDocument, setIsReplacingDocument] = useState(false);
  const [currentDocumentType, setCurrentDocumentType] = useState(null);
  const [isInUploadMode, setIsInUploadMode] = useState(false);

  // Document filters
  const [documentFilters, setDocumentFilters] = useState({
    documentType: "all",
    status: "all",
  });
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");

  // State for fetching categories from backend
  const [projectCategories, setProjectCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Project statuses for filtering
  const projectStatuses = [
    { value: "all", label: "All Statuses" },
    {
      value: "planning",
      label: "Planning",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "pending_approval",
      label: "Pending Approval",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "pending_department_approval",
      label: "Pending Department Approval",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "pending_legal_compliance_approval",
      label: "Pending Legal Compliance Approval",
      color: "bg-teal-100 text-teal-800",
    },
    {
      value: "pending_finance_approval",
      label: "Pending Finance Approval",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "pending_executive_approval",
      label: "Pending Executive Approval",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "approved",
      label: "Approved",
      color: "bg-[var(--elra-primary)] text-white",
    },
    {
      value: "implementation",
      label: "Implementation",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "active",
      label: "Active",
      color: "bg-[var(--elra-primary)] text-white",
    },
    {
      value: "on_hold",
      label: "On Hold",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "completed",
      label: "Completed",
      color: "bg-[var(--elra-primary)] text-white",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
    { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
    {
      value: "revision_required",
      label: "Revision Required",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "resubmitted",
      label: "Resubmitted",
      color: "bg-blue-100 text-blue-800",
    },
  ];

  const shouldDisableDocumentEditing = (project) => {
    if (!project) return false;

    // Personal projects - disable document upload for all statuses
    if (project.projectScope === "personal") {
      return true;
    }

    // Departmental and External projects - allow document upload for most statuses
    if (
      project.projectScope === "departmental" ||
      project.projectScope === "external"
    ) {
      // Only disable for completed, rejected, or cancelled projects
      if (
        project.status === "completed" ||
        project.status === "rejected" ||
        project.status === "cancelled"
      ) {
        return true;
      }
      // Allow upload for all other statuses (including implementation)
      return false;
    }

    // Default fallback for any other project scope
    if (
      project.status === "pending_approval" ||
      project.status === "pending_finance_approval" ||
      project.status === "pending_executive_approval" ||
      project.status === "planning"
    ) {
      return false;
    }

    if (
      project.status === "approved" ||
      project.status === "implementation" ||
      project.status === "active" ||
      project.status === "completed" ||
      project.status === "rejected" ||
      project.status === "cancelled"
    ) {
      return true;
    }

    return false;
  };

  const shouldDisableProjectEditing = (project) => {
    if (!project) return false;

    if (project.status !== "planning") {
      return true;
    }

    if (project.status === "rejected" || project.status === "cancelled") {
      return true;
    }

    if (project.status === "completed") {
      return true;
    }

    return false;
  };

  const getApprovalLevelText = (budget) => {
    const numBudget = parseFormattedNumber(budget);
    if (!numBudget || numBudget <= 0) return null;

    console.log("🔍 [DEBUG] getApprovalLevelText:", {
      budget: numBudget,
      projectScope: formData.projectScope,
      requiresBudgetAllocation: formData.requiresBudgetAllocation,
      userDepartment: user.department?.name,
      userRoleLevel: user.role.level,
    });

    // Super Admin - always auto-approved
    if (user.role.level === 1000) {
      return {
        text: "Auto-approved by Super Admin",
        color: "text-purple-600",
      };
    }

    if (numBudget <= 1000000) {
      if (formData.projectScope === "personal") {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Auto-approved (No Budget Allocation Required)",
            color: "text-green-600",
          };
        } else {
          return {
            text: "Finance → Executive Approval",
            color: "text-blue-600",
          };
        }
      } else if (formData.projectScope === "departmental") {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Auto-approved (No Budget Allocation Required)",
            color: "text-green-600",
          };
        } else {
          return {
            text: "Finance → Executive Approval",
            color: "text-blue-600",
          };
        }
      } else if (formData.projectScope === "external") {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Legal → Executive Approval (No Budget)",
            color: "text-green-600",
          };
        } else {
          return {
            text: "Legal → Finance Review → Executive → Budget Allocation",
            color: "text-blue-600",
          };
        }
      } else {
        // Default fallback
        return { text: "Auto-approved by HOD", color: "text-green-600" };
      }
    } else if (numBudget <= 5000000) {
      // Check budget allocation for personal/departmental projects
      if (
        formData.projectScope === "personal" ||
        formData.projectScope === "departmental"
      ) {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Auto-approved (No Budget Allocation Required)",
            color: "text-green-600",
          };
        } else {
          // Budget allocation required - show approval workflow
          if (user.department?.name === "Finance & Accounting") {
            return {
              text: "Direct to Executive Approval",
              color: "text-blue-600",
            };
          } else {
            return {
              text: "Finance → Executive Approval",
              color: "text-blue-600",
            };
          }
        }
      } else if (formData.projectScope === "external") {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Legal → Executive Approval (No Budget)",
            color: "text-green-600",
          };
        } else {
          return {
            text: "Legal → Finance Review → Executive → Budget Allocation",
            color: "text-blue-600",
          };
        }
      }
    } else if (numBudget <= 25000000) {
      // Check budget allocation for personal/departmental projects
      if (
        formData.projectScope === "personal" ||
        formData.projectScope === "departmental"
      ) {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Auto-approved (No Budget Allocation Required)",
            color: "text-green-600",
          };
        } else {
          // Budget allocation required - show approval workflow
          if (user.department?.name === "Finance & Accounting") {
            return {
              text: "Direct to Executive Approval",
              color: "text-orange-600",
            };
          } else {
            return {
              text: "Finance → Executive Approval",
              color: "text-orange-600",
            };
          }
        }
      } else if (formData.projectScope === "external") {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Legal → Executive Approval (No Budget)",
            color: "text-green-600",
          };
        } else {
          return {
            text: "Legal → Finance Review → Executive → Budget Allocation",
            color: "text-orange-600",
          };
        }
      }
    } else {
      // Check budget allocation for personal/departmental projects
      if (
        formData.projectScope === "personal" ||
        formData.projectScope === "departmental"
      ) {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Auto-approved (No Budget Allocation Required)",
            color: "text-green-600",
          };
        } else {
          // Budget allocation required - show approval workflow
          if (user.department?.name === "Finance & Accounting") {
            return {
              text: "Direct to Executive Approval",
              color: "text-red-600",
            };
          } else if (user.department?.name === "Executive Office") {
            return { text: "Finance → Executive Final", color: "text-red-600" };
          } else {
            return {
              text: "Finance → Executive Approval",
              color: "text-red-600",
            };
          }
        }
      } else if (formData.projectScope === "external") {
        if (formData.requiresBudgetAllocation === "false") {
          return {
            text: "Legal → Executive Approval (No Budget)",
            color: "text-green-600",
          };
        } else {
          return {
            text: "Legal → Finance Review → Executive → Budget Allocation",
            color: "text-red-600",
          };
        }
      }
    }
  };

  if (!user || user.role.level < 300) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only STAFF and above can access Project List.
          </p>
        </div>
      </div>
    );
  }

  const fetchProjectCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await api.get("/api/projects/categories");
      setProjectCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching project categories:", error);
      setProjectCategories([
        { value: "software_development", label: "Software Development" },
        { value: "system_maintenance", label: "System Maintenance" },
        { value: "process_automation", label: "Process Automation" },
        { value: "integration_project", label: "Integration Project" },
        { value: "equipment_purchase", label: "Equipment Purchase" },
        {
          value: "infrastructure_development",
          label: "Infrastructure Development",
        },
        { value: "equipment_maintenance", label: "Equipment Maintenance" },
        { value: "training_program", label: "Training Program" },
        {
          value: "professional_development",
          label: "Professional Development",
        },
        { value: "industry_training", label: "Industry Training" },
        { value: "consulting_service", label: "Consulting Service" },
        { value: "advisory_service", label: "Advisory Service" },
        { value: "technical_support", label: "Technical Support" },
        { value: "implementation_service", label: "Implementation Service" },
        { value: "regulatory_compliance", label: "Regulatory Compliance" },
        { value: "policy_development", label: "Policy Development" },
        {
          value: "standards_implementation",
          label: "Standards Implementation",
        },
        { value: "monitoring_system", label: "Monitoring System" },
        { value: "oversight_program", label: "Oversight Program" },
        { value: "verification_service", label: "Verification Service" },
        { value: "inspection_program", label: "Inspection Program" },
        { value: "financial_management", label: "Financial Management" },
        { value: "budget_optimization", label: "Budget Optimization" },
        { value: "cost_reduction", label: "Cost Reduction" },
        {
          value: "administrative_improvement",
          label: "Administrative Improvement",
        },
        { value: "marketplace_development", label: "Marketplace Development" },
        { value: "exchange_platform", label: "Exchange Platform" },
        { value: "trading_system", label: "Trading System" },
        { value: "market_analysis", label: "Market Analysis" },
        { value: "public_awareness", label: "Public Awareness" },
        { value: "communication_campaign", label: "Communication Campaign" },
        { value: "stakeholder_engagement", label: "Stakeholder Engagement" },
        { value: "public_relations", label: "Public Relations" },
        { value: "research_project", label: "Research Project" },
        { value: "market_research", label: "Market Research" },
        { value: "feasibility_study", label: "Feasibility Study" },
        { value: "impact_assessment", label: "Impact Assessment" },
        { value: "other", label: "Other" },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const isHRDepartment =
    user?.department?.name === "Human Resources" ||
    user?.department?.name === "HR" ||
    user?.department?.name === "Human Resource Management";

  const fetchVendors = async () => {
    try {
      const [vendorsResponse, categoriesResponse] = await Promise.all([
        fetchApprovedVendors(),
        fetchVendorCategories(),
      ]);

      if (vendorsResponse.success) {
        setVendors(vendorsResponse.data);
      } else {
        setVendors([]);
      }

      if (categoriesResponse.success) {
        setVendorCategories(categoriesResponse.data);
      } else {
        setVendorCategories([]);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
      setVendorCategories([]);
    }
  };

  // Filter vendors by selected category
  useEffect(() => {
    if (selectedVendorCategory && vendors.length > 0) {
      const filtered = vendors.filter(
        (vendor) =>
          vendor.servicesOffered.includes(selectedVendorCategory) &&
          vendor.status === "approved"
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors([]);
    }
  }, [selectedVendorCategory, vendors]);

  // Determine allowed project scopes based on user role
  const getAllowedProjectScopes = () => {
    if (user?.role?.level >= 1000) {
      // SUPER_ADMIN can create all types
      return ["personal", "departmental", "external"];
    } else if (user?.role?.level >= 700 && isHRDepartment) {
      // HR HOD can create personal, departmental, and external projects
      return ["personal", "departmental", "external"];
    } else if (user?.role?.level >= 700) {
      // ALL HODs can create personal and departmental projects
      return ["personal", "departmental"];
    } else if (user?.role?.level >= 600) {
      // MANAGER can create personal and departmental projects
      return ["personal", "departmental"];
    } else if (user?.role?.level >= 300) {
      // STAFF can only create personal projects
      return ["personal"];
    }
    return [];
  };

  const allowedProjectScopes = getAllowedProjectScopes();

  const canCreateExternalProjects = allowedProjectScopes.includes("external");
  const canCreateDepartmentalProjects =
    allowedProjectScopes.includes("departmental");

  const showExternalProjectFields =
    formData.projectScope === "external" && canCreateExternalProjects;

  // Debug logging for external project fields
  useEffect(() => {
    if (formData.projectScope === "external") {
      console.log("🔍 [DEBUG] Showing external project fields for user:", {
        roleLevel: user?.role?.level,
        department: user?.department?.name,
        allowedProjectScopes: allowedProjectScopes,
        currentScope: formData.projectScope,
      });
    }
  }, [
    formData.projectScope,
    user?.role?.level,
    user?.department?.name,
    allowedProjectScopes,
  ]);

  useEffect(() => {
    loadProjects();
    fetchProjectCategories();
  }, []);

  useEffect(() => {
    if (allowedProjectScopes.length > 0 && !showModal) {
      setFormData((prev) => ({
        ...prev,
        projectScope: allowedProjectScopes[0],
      }));
    }
  }, [allowedProjectScopes, showModal]);

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

        // Load documents for each project
        const projectIds = response.data.map((project) => project._id);
        await Promise.all(
          projectIds.map(async (projectId) => {
            try {
              const docResponse = await getProjectDocuments(projectId);
              if (docResponse.success) {
                setProjectDocuments((prev) => ({
                  ...prev,
                  [projectId]: docResponse.data.documents || [],
                }));
              }
            } catch (error) {
              console.error(
                `Error loading documents for project ${projectId}:`,
                error
              );
            }
          })
        );
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
      category: "",
      startDate: "",
      endDate: "",
      budget: "",
      projectManager: "",
      priority: "medium",
      projectScope: "", // Let user choose, don't auto-set
      vendorId: "",
      requiresBudgetAllocation: "",
    });

    setSelectedVendorCategory("");
    setFilteredVendors([]);
    setProjectItems([
      {
        name: "",
        description: "",
        quantity: 1,
        unitPrice: "",
        totalPrice: 0,
        deliveryTimeline: "",
      },
    ]);
    setIsEditMode(false);
    setSelectedProject(null);
  };

  const truncateFileName = (fileName, maxLength = 25) => {
    if (!fileName) return "";

    if (fileName.length <= maxLength) {
      return fileName;
    }

    const extension = fileName.split(".").pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));
    const maxNameLength = maxLength - extension.length - 4;

    if (nameWithoutExt.length <= maxNameLength) {
      return fileName;
    }

    return `${nameWithoutExt.substring(0, maxNameLength)}...${extension}`;
  };

  const startDocumentReplacement = (documentType, project) => {
    setCurrentDocumentType(documentType);
    setIsReplacingDocument(true);
    setSelectedProjectForDocument(project);
    setShowDocumentsModal(false);
    setShowDocumentModal(true);
  };

  const getDocumentTypeLabel = (documentType) => {
    const labels = {
      project_proposal: "Project Proposal Document",
      budget_breakdown: "Budget & Financial Plan",
      technical_specifications: "Technical & Implementation Plan",
    };
    return labels[documentType] || documentType;
  };

  const handleDocumentReplacement = async () => {
    try {
      const uploadedDoc = getUploadedDocument(currentDocumentType);
      if (!uploadedDoc) {
        toast.error("Original document not found. Cannot replace.");
        return;
      }

      // Prepare form data for replacement
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("projectId", selectedProjectForDocument._id);
      formData.append("documentType", currentDocumentType);
      formData.append("originalDocumentId", uploadedDoc._id);
      formData.append("projectName", selectedProjectForDocument.name);

      const response = await replaceProjectDocument(formData);

      if (!response.success) {
        throw new Error(response.message || "Failed to replace document");
      }
    } catch (error) {
      console.error("Error replacing document:", error);
      toast.error(`Failed to replace document: ${error.message}`);
      throw error; // Re-throw to prevent success flow
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
    fetchVendors(); // Fetch vendors when modal opens

    // Debug logs
    console.log("🔍 [DEBUG] Opening create modal for user:", {
      roleLevel: user?.role?.level,
      department: user?.department?.name,
      allowedProjectScopes: allowedProjectScopes,
    });
  };

  const openDetailsModal = (project) => {
    setSelectedProjectDetails(project);
    setShowDetailsModal(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setIsEditMode(true);

    // Ensure the project scope is allowed for the current user
    const projectScope = project.projectScope || "personal";
    const allowedScope = allowedProjectScopes.includes(projectScope)
      ? projectScope
      : allowedProjectScopes.length > 0
      ? allowedProjectScopes[0]
      : "personal";

    setFormData({
      name: project.name || "",
      description: project.description || "",
      category: project.category || "",
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
      priority: project.priority || "medium",
      projectScope: allowedScope,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentStep(1); // Reset to step 1
    setShowScopeSelection(true); // Reset scope selection
    resetForm();
  };

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep1 = () => {
    const errors = [];
    if (!formData.name || !formData.name.trim()) {
      errors.push("Project name is required");
    }
    if (!formData.category || !formData.category.trim()) {
      errors.push("Project category is required");
    }
    if (!formData.budget || !formData.budget.trim()) {
      errors.push("Project budget is required");
    }
    if (!formData.startDate) {
      errors.push("Start date is required");
    }
    if (!formData.endDate) {
      errors.push("End date is required");
    }
    if (formData.projectScope === "external") {
      if (!selectedVendorCategory) {
        errors.push("Vendor category is required for external projects");
      }
      if (!formData.vendorName || !formData.vendorName.trim()) {
        errors.push("Vendor name is required for external projects");
      }
    }
    return errors;
  };

  const isStep1Complete = () => {
    const errors = validateStep1();
    return errors.length === 0;
  };

  const validateStep2 = () => {
    const errors = [];

    // Check if project items are filled
    if (projectItems.length === 0) {
      errors.push("At least one project item is required");
      return errors;
    }

    // Validate each project item
    projectItems.forEach((item, index) => {
      if (!item.name || !item.name.trim()) {
        errors.push(`Item ${index + 1}: Name is required`);
      }
      if (!item.description || !item.description.trim()) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (
        !item.unitPrice ||
        parseFloat(item.unitPrice.replace(/,/g, "")) <= 0
      ) {
        errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
      }
      if (!item.deliveryTimeline || !item.deliveryTimeline.trim()) {
        errors.push(`Item ${index + 1}: Delivery timeline is required`);
      }
    });

    return errors;
  };

  const isStep2Complete = () => {
    const errors = validateStep2();
    return errors.length === 0;
  };

  const isFormValid = () => {
    if (formData.projectScope === "external") {
      return currentStep === 1 ? isStep1Complete() : isStep2Complete();
    }
    return isStep1Complete();
  };

  const hasInvalidInputs = () => {
    // Check for negative budget
    if (formData.budget && parseFloat(formData.budget.replace(/,/g, "")) < 0) {
      return true;
    }

    // Check for invalid dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        return true;
      }
    }

    // Check for negative quantities or prices in project items
    if (formData.projectScope === "external") {
      return projectItems.some((item) => {
        const quantity = parseInt(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice.replace(/,/g, "")) || 0;
        return quantity <= 0 || unitPrice <= 0;
      });
    }

    return false;
  };

  const handleScopeSelection = (scope) => {
    setFormData({
      ...formData,
      projectScope: scope,
      requiresBudgetAllocation: "", // Reset budget allocation when scope changes
    });
    // Reset vendor selection when scope changes
    if (scope !== "external") {
      setSelectedVendorCategory("");
      setFormData((prev) => ({
        ...prev,
        vendorId: "",
        vendorName: "",
        vendorEmail: "",
        vendorPhone: "",
      }));
    }
    setShowScopeSelection(false);
    setCurrentStep(1);
  };

  const handleViewTeamMembers = (project) => {
    setSelectedProjectForTeam(project);
    setShowTeamModal(true);
  };

  const closeTeamModal = () => {
    setShowTeamModal(false);
    setSelectedProjectForTeam(null);
  };

  const fetchProjectDocuments = async (projectId) => {
    try {
      setLoadingDocuments((prev) => ({ ...prev, [projectId]: true }));
      const response = await getProjectDocuments(projectId);
      if (response.success) {
        setProjectDocuments((prev) => ({
          ...prev,
          [projectId]: response.data.documents || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching project documents:", error);
      toast.error("Failed to fetch project documents");
    } finally {
      setLoadingDocuments((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const handleViewProjectDocuments = async (project) => {
    setSelectedProjectForDocuments(project);
    setShowDocumentsModal(true);

    // Fetch documents if not already loaded
    if (!projectDocuments[project._id]) {
      await fetchProjectDocuments(project._id);
    }
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedProjectForDocument(null);
    setSelectedFile(null);
    setDocumentFormData({
      title: "",
      description: "",
      category: "Project Documentation",
      documentType: "Project Document",
      priority: "Medium",
      tags: "",
      isConfidential: false,
    });
    setIsInUploadMode(false);
    setIsReplacingDocument(false);
    setCurrentDocumentType(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Enhanced file handling with drag and drop
  const processSelectedFile = (file) => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Check file type
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/tiff",
      "image/bmp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!supportedTypes.includes(file.type)) {
      toast.error(
        "Please select a supported file type (JPEG, PNG, TIFF, BMP, PDF, DOC, DOCX, XLS, XLSX)"
      );
      return;
    }

    setSelectedFile(file);

    // Auto-generate title from filename
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setDocumentFormData((prev) => ({
      ...prev,
      title:
        fileName.charAt(0).toUpperCase() +
        fileName.slice(1).replace(/[-_]/g, " "),
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
      toast.success(`File "${files[0].name}" selected successfully!`);
    }
  };

  // Enhanced document viewing with loading state
  const handleViewDocument = async (documentId, documentTitle) => {
    try {
      setViewingDocumentId(documentId);

      const result = await viewDocument(documentId);

      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to open document. Please try again.");
    } finally {
      setViewingDocumentId(null);
    }
  };

  const getUploadedDocument = (documentType) => {
    return projectDocuments[selectedProjectForDocuments._id]?.find(
      (uploaded) => uploaded.documentType === documentType
    );
  };

  const getFilteredDocuments = () => {
    if (
      !selectedProjectForDocuments ||
      !projectDocuments[selectedProjectForDocuments._id]
    ) {
      return [];
    }

    let documents = projectDocuments[selectedProjectForDocuments._id];

    if (documentFilters.documentType !== "all") {
      documents = documents.filter(
        (doc) => doc.documentType === documentFilters.documentType
      );
    }

    // Filter by status (uploaded vs required)
    if (documentFilters.status === "uploaded") {
      documents = documents.filter((doc) => doc._id); // Has an ID means it's uploaded
    } else if (documentFilters.status === "required") {
      // For required, we need to show the required document types that aren't uploaded
      const uploadedTypes = documents.map((doc) => doc.documentType);
      const requiredTypes = [
        "project_proposal",
        "budget_breakdown",
        "technical_specifications",
      ];
      const missingTypes = requiredTypes.filter(
        (type) => !uploadedTypes.includes(type)
      );

      // Create placeholder objects for missing documents
      const missingDocs = missingTypes.map((type) => ({
        documentType: type,
        title: getDocumentTypeLabel(type),
        description: getDocumentTypeDescription(type),
        isRequired: true,
        _id: null,
      }));

      return missingDocs;
    }

    // Filter by search term
    if (documentSearchTerm.trim()) {
      documents = documents.filter(
        (doc) =>
          doc.title?.toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
          doc.documentType
            ?.toLowerCase()
            .includes(documentSearchTerm.toLowerCase()) ||
          doc.description
            ?.toLowerCase()
            .includes(documentSearchTerm.toLowerCase())
      );
    }

    return documents;
  };

  // Helper function to get document type description
  const getDocumentTypeDescription = (documentType) => {
    const descriptions = {
      project_proposal:
        "Complete project proposal with objectives, scope, and detailed description",
      budget_breakdown:
        "Detailed budget breakdown, cost analysis, and financial justification",
      technical_specifications:
        "Technical specifications, timeline, milestones, and implementation strategy",
    };
    return descriptions[documentType] || "";
  };

  // Function to filter projects based on current filters
  const getFilteredProjects = () => {
    let filteredProjects = [...projects];

    // Filter by status
    if (filters.status !== "all") {
      filteredProjects = filteredProjects.filter(
        (project) => project.status === filters.status
      );
    }

    // Filter by category
    if (filters.category !== "all") {
      filteredProjects = filteredProjects.filter(
        (project) => project.category === filters.category
      );
    }

    // Filter by department (only for Super Admin)
    if (user.role.level >= 1000 && filters.department !== "all") {
      filteredProjects = filteredProjects.filter(
        (project) => project.department?.name === filters.department
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredProjects = filteredProjects.filter(
        (project) =>
          project.name?.toLowerCase().includes(searchLower) ||
          project.code?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.projectManager?.firstName
            ?.toLowerCase()
            .includes(searchLower) ||
          project.projectManager?.lastName
            ?.toLowerCase()
            .includes(searchLower) ||
          project.category?.toLowerCase().includes(searchLower) ||
          project.department?.name?.toLowerCase().includes(searchLower)
      );
    }

    return filteredProjects;
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploadingDocument(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      if (isReplacingDocument) {
        // Handle replacement directly
        await handleDocumentReplacement();
        toast.success(
          `Document replaced successfully for project "${selectedProjectForDocument.name}"!`
        );
      } else {
        // Handle new upload
        if (!documentFormData.title.trim()) {
          toast.error("Please enter a document title");
          return;
        }

        const formData = new FormData();
        formData.append("document", selectedFile);
        formData.append("title", documentFormData.title);
        formData.append("description", documentFormData.description);
        formData.append("category", documentFormData.category);
        formData.append("documentType", documentFormData.documentType);
        formData.append("priority", documentFormData.priority);
        formData.append("tags", documentFormData.tags);
        formData.append("isConfidential", documentFormData.isConfidential);
        formData.append("projectId", selectedProjectForDocument._id);
        formData.append("projectName", selectedProjectForDocument.name);

        const response = await uploadDocument(formData);

        if (!response.success) {
          throw new Error(response.message || "Failed to upload document");
        }

        toast.success(
          `Document "${documentFormData.title}" uploaded successfully for project "${selectedProjectForDocument.name}"!`
        );
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      await fetchProjectDocuments(selectedProjectForDocument._id);

      // Always return to documents view after upload/replacement
      setShowDocumentModal(false);
      setShowDocumentsModal(true);
      setSelectedFile(null);
      setDocumentFormData({
        title: "",
        description: "",
        category: "Project Documentation",
        documentType: "Project Document",
        priority: "Medium",
        tags: "",
        isConfidential: false,
      });
      setIsInUploadMode(false);
      setIsReplacingDocument(false);
      setCurrentDocumentType(null);
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setIsUploadingDocument(false);
      setUploadProgress(0);
    }
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

    // Status is managed by backend workflow - no validation needed

    if (!formData.priority) {
      errors.push("Priority is required");
    }

    // Description is only required for non-external projects
    if (formData.projectScope !== "external" && !formData.description.trim()) {
      errors.push("Description is required");
    }

    // Budget allocation is optional - defaults to false if not selected
    // No validation needed as it defaults to false

    // Validate vendor selection for external projects
    if (formData.projectScope === "external") {
      console.log("🔍 [VALIDATION DEBUG] External project validation:");
      console.log("  - selectedVendorCategory:", selectedVendorCategory);
      console.log("  - formData.vendorName:", formData.vendorName);
      console.log("  - projectItems:", projectItems);

      if (!selectedVendorCategory) {
        errors.push("Vendor category is required for external projects");
      }
      if (!formData.vendorName || !formData.vendorName.trim()) {
        errors.push("Vendor name is required for external projects");
      }
      // Email validation (optional)
      if (formData.vendorEmail && formData.vendorEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.vendorEmail)) {
          errors.push("Please enter a valid vendor email address");
        }
      }

      // Validate project items
      if (projectItems.length === 0) {
        errors.push("At least one item is required for external projects");
      } else {
        projectItems.forEach((item, index) => {
          console.log(`🔍 [VALIDATION DEBUG] Item ${index + 1}:`, {
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            deliveryTimeline: item.deliveryTimeline,
          });

          if (!item.name.trim()) {
            errors.push(`Item ${index + 1}: Item name is required`);
          }
          if (
            !item.quantity ||
            item.quantity === "" ||
            parseInt(item.quantity) <= 0
          ) {
            errors.push(
              `Item ${index + 1}: Valid quantity (number > 0) is required`
            );
          }
          if (
            !item.unitPrice ||
            item.unitPrice === "" ||
            parseFloat(item.unitPrice.replace(/,/g, "")) <= 0
          ) {
            errors.push(
              `Item ${index + 1}: Valid unit price (number > 0) is required`
            );
          }
          // Currency is always NGN - no validation needed
          if (!item.deliveryTimeline.trim()) {
            errors.push(`Item ${index + 1}: Delivery timeline is required`);
          }
        });

        // Check if total items cost exceeds budget
        const totalItemsCost = projectItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        const projectBudget =
          parseFloat(formData.budget.replace(/,/g, "")) || 0;
        if (totalItemsCost > projectBudget) {
          errors.push("Total items cost cannot exceed project budget");
        }
      }
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (startDate < currentDate) {
        errors.push("Start date cannot be in the past");
      }

      if (endDate <= startDate) {
        errors.push("End date must be after start date");
      }
    }

    // Delivery timeline validation for external projects
    if (formData.projectScope === "external" && projectItems.length > 0) {
      projectItems.forEach((item, index) => {
        if (item.deliveryTimeline && formData.startDate && formData.endDate) {
          const projectStartDate = new Date(formData.startDate);
          const projectEndDate = new Date(formData.endDate);
          const timelineText = item.deliveryTimeline.toLowerCase();

          // Check if delivery timeline mentions days that exceed project duration
          const daysMatch = timelineText.match(/(\d+)\s*days?/);
          if (daysMatch) {
            const deliveryDays = parseInt(daysMatch[1]);
            const projectDuration = Math.ceil(
              (projectEndDate - projectStartDate) / (1000 * 60 * 60 * 24)
            );

            if (deliveryDays > projectDuration) {
              errors.push(
                `Item ${
                  index + 1
                }: Delivery timeline (${deliveryDays} days) exceeds project duration (${projectDuration} days). Maximum allowed: ${projectDuration} days.`
              );
            }
          } else {
            // If no days mentioned, warn user to specify days
            const projectDuration = Math.ceil(
              (projectEndDate - projectStartDate) / (1000 * 60 * 60 * 24)
            );
            errors.push(
              `Item ${
                index + 1
              }: Please specify delivery timeline in days (e.g., "Within 45 days of PO approval"). Project duration: ${projectDuration} days.`
            );
          }
        }
      });
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Comprehensive form data logging
    console.log(
      "🔍 [FORM DATA DEBUG] ========================================"
    );
    console.log("🔍 [FORM DATA] Form Data:", {
      ...formData,
      budget: parseFormattedNumber(formData.budget),
    });
    console.log("🔍 [FORM DATA] Project Items:", projectItems);
    console.log(
      "🔍 [FORM DATA] Selected Vendor Category:",
      selectedVendorCategory
    );
    console.log("🔍 [FORM DATA] Vendor Name:", formData.vendorName);
    console.log("🔍 [FORM DATA] User Info:", {
      department: user?.department?.name,
      roleLevel: user?.role?.level,
      roleName: user?.role?.name,
    });
    console.log(
      "🔍 [FORM DATA] =============================================="
    );

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      console.log("❌ [VALIDATION ERRORS]:", validationErrors);
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

      if (formData.projectScope === "external") {
        submitData.projectItems = projectItems.map((item) => ({
          ...item,
          unitPrice: parseFloat(item.unitPrice.replace(/,/g, "")),
          totalPrice: item.totalPrice,
          currency: "NGN",
        }));

        // Add vendor category
        submitData.vendorCategory = selectedVendorCategory;

        // Default to false if not selected for external projects
        submitData.requiresBudgetAllocation =
          formData.requiresBudgetAllocation === "true" ? true : false;

        // Debug logging for external projects
        console.log("🔍 [DEBUG] External Project Data:");
        console.log("  - Project Scope:", submitData.projectScope);
        console.log("  - Budget:", submitData.budget);
        console.log("  - Vendor Category:", selectedVendorCategory);
        console.log("  - Vendor Name:", submitData.vendorName);
        console.log("  - Project Items:", submitData.projectItems);
        console.log("  - Items Count:", submitData.projectItems.length);
        console.log(
          "  - requiresBudgetAllocation:",
          submitData.requiresBudgetAllocation
        );
      } else {
        delete submitData.vendorId;
        delete submitData.projectItems;
        // Default to false if not selected
        submitData.requiresBudgetAllocation =
          formData.requiresBudgetAllocation === "true" ? true : false;

        // Debug logging for personal/departmental projects
        console.log("🔍 [DEBUG] Personal/Departmental Project:");
        console.log("  - Project Scope:", submitData.projectScope);
        console.log("  - Budget:", submitData.budget);
        console.log(
          "  - requiresBudgetAllocation (frontend):",
          formData.requiresBudgetAllocation
        );
        console.log(
          "  - requiresBudgetAllocation (backend):",
          submitData.requiresBudgetAllocation
        );
      }

      const response = await createProject(submitData);
      if (response.success) {
        const createdProject = response.data;
        const budget = parseFormattedNumber(submitData.budget);
        let approvalMessage = "Awaiting approval.";

        if (user.role.level === 1000) {
          approvalMessage = "Auto-approved by Super Admin!";
        } else if (budget <= 1000000) {
          // Check budget allocation for personal/departmental projects
          if (submitData.projectScope === "personal") {
            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Auto-approved (No Budget Allocation Required)!";
            } else {
              approvalMessage = "Sent to Finance → Executive for approval.";
            }
          } else if (submitData.projectScope === "departmental") {
            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Auto-approved (No Budget Allocation Required)!";
            } else {
              approvalMessage = "Sent to Finance → Executive for approval.";
            }
          } else if (submitData.projectScope === "external") {
            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Legal → Executive Approval (No Budget Allocation)";
            } else {
              approvalMessage =
                "Legal → Finance Review → Executive → Budget Allocation";
            }
          }
        } else if (budget <= 5000000) {
          if (
            submitData.projectScope === "personal" ||
            submitData.projectScope === "departmental"
          ) {
            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Auto-approved (No Budget Allocation Required)!";
            } else if (user.department?.name === "Finance & Accounting") {
              approvalMessage = "Sent to Executive for approval.";
            } else {
              approvalMessage = "Sent to Finance → Executive for approval.";
            }
          } else if (submitData.projectScope === "external") {
            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Legal → Executive Approval (No Budget Allocation)";
            } else {
              if (user.department?.name === "Finance & Accounting") {
                approvalMessage = "Legal → Executive Approval";
              } else {
                approvalMessage = "Legal → Finance → Executive Approval";
              }
            }
          }
        } else if (budget <= 25000000) {
          // Check budget allocation for personal/departmental projects
          if (
            submitData.projectScope === "personal" ||
            submitData.projectScope === "departmental"
          ) {
            console.log("🔍 [DEBUG] Budget ≤25M - Personal/Departmental:");
            console.log(
              "  - requiresBudgetAllocation:",
              submitData.requiresBudgetAllocation
            );
            console.log("  - User Department:", user.department?.name);

            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Auto-approved (No Budget Allocation Required)!";
              console.log("✅ [DEBUG] Auto-approved - No Budget Allocation");
            } else if (user.department?.name === "Finance & Accounting") {
              approvalMessage = "Sent to Executive for approval.";
              console.log("⏸️ [DEBUG] Finance HOD - Sent to Executive");
            } else {
              approvalMessage = "Sent to Finance → Executive for approval.";
              console.log(
                "⏸️ [DEBUG] Regular User - Sent to Finance → Executive"
              );
            }
          } else if (submitData.projectScope === "external") {
            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Legal → Executive Approval (No Budget Allocation)";
            } else {
              if (user.department?.name === "Finance & Accounting") {
                approvalMessage = "Legal → Executive Approval";
              } else {
                approvalMessage = "Legal → Finance → Executive Approval";
              }
            }
          }
        } else {
          // Check budget allocation for personal/departmental projects
          if (
            submitData.projectScope === "personal" ||
            submitData.projectScope === "departmental"
          ) {
            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Auto-approved (No Budget Allocation Required)!";
            } else if (user.department?.name === "Finance & Accounting") {
              approvalMessage = "Sent to Executive for approval.";
            } else if (user.department?.name === "Executive Office") {
              approvalMessage = "Sent to Finance for approval.";
            } else {
              approvalMessage = "Sent to Finance → Executive for approval.";
            }
          } else if (submitData.projectScope === "external") {
            if (submitData.requiresBudgetAllocation === false) {
              approvalMessage =
                "Legal → Executive Approval (No Budget Allocation)";
            } else {
              if (user.department?.name === "Finance & Accounting") {
                approvalMessage = "Legal → Executive Approval";
              } else if (user.department?.name === "Executive Office") {
                approvalMessage = "Legal → Finance Approval";
              } else {
                approvalMessage =
                  "Legal → Finance Review → Executive → Budget Allocation";
              }
            }
          }
        }

        toast.success(
          `✅ Project "${submitData.name}" created successfully! ${approvalMessage}`,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        loadProjects();
        closeModal();
        setShowStep2ConfirmModal(false);
      } else {
        // Show more specific error message from backend
        if (response.errors && Array.isArray(response.errors)) {
          response.errors.forEach((error) => {
            toast.error(error);
          });
        } else if (response.fieldErrors) {
          Object.values(response.fieldErrors).forEach((error) => {
            toast.error(error);
          });
        } else {
          toast.error(response.message || "Failed to create project");
        }
      }
    } catch (error) {
      console.error("Error submitting project:", error);

      // Show more specific error message
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Error submitting project");
      }
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

      // Add project items for external projects
      if (formData.projectScope === "external") {
        submitData.projectItems = projectItems.map((item) => ({
          ...item,
          unitPrice: parseFloat(item.unitPrice.replace(/,/g, "")),
          totalPrice: item.totalPrice,
          currency: item.currency,
        }));
      } else {
        // Remove vendorId and projectItems for non-external projects
        delete submitData.vendorId;
        delete submitData.projectItems;
        // Default to false if not selected
        submitData.requiresBudgetAllocation =
          formData.requiresBudgetAllocation === "true" ? true : false;
      }

      const response = await updateProject(selectedProject._id, submitData);
      if (response.success) {
        toast.success(`✅ Project "${submitData.name}" updated successfully!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
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

  const handleResubmitProject = (project) => {
    setProjectToResubmit(project);
    setShowResubmitConfirm(true);
  };

  const confirmResubmitProject = async () => {
    try {
      setResubmittingProject(projectToResubmit._id);
      const response = await resubmitProject(projectToResubmit._id);
      if (response.success) {
        toast.success("Project resubmitted successfully");
        loadProjects();
      } else {
        toast.error("Failed to resubmit project");
      }
    } catch (error) {
      console.error("Error resubmitting project:", error);
      toast.error("Error resubmitting project");
    } finally {
      setResubmittingProject(null);
      setShowResubmitConfirm(false);
      setProjectToResubmit(null);
    }
  };

  const closeResubmitConfirm = () => {
    setShowResubmitConfirm(false);
    setProjectToResubmit(null);
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

  // Define columns inside component to access state
  const columns = [
    {
      header: "Project",
      accessor: "name",
      renderer: (project) => (
        <div className="flex items-center min-w-0 max-w-[200px]">
          <FolderIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div
              className="font-medium text-gray-900 truncate"
              title={project.name}
            >
              {project.name.length > 20
                ? `${project.name.slice(0, 12)}...`
                : project.name}
            </div>
            <div
              className="text-sm text-gray-500 truncate"
              title={project.code}
            >
              {project.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Manager",
      accessor: "projectManager",
      renderer: (project) => (
        <div className="text-sm min-w-0 max-w-24">
          <div
            className="font-medium text-gray-900 truncate"
            title={`${project.projectManager?.firstName} ${project.projectManager?.lastName}`}
          >
            {project.projectManager?.firstName?.charAt(0)}.{" "}
            {project.projectManager?.lastName}
          </div>
        </div>
      ),
    },
    {
      header: "Scope",
      accessor: "projectScope",
      renderer: (project) => (
        <div className="text-sm min-w-0 max-w-20">
          <div className="font-medium text-gray-900 truncate">
            {project.projectScope === "personal" && "Personal"}
            {project.projectScope === "departmental" && "Departmental"}
            {project.projectScope === "external" && "External"}
          </div>
        </div>
      ),
    },
    {
      header: "Team",
      accessor: "teamMembers",
      renderer: (project) => (
        <div className="text-sm min-w-0 max-w-20">
          <div className="font-medium text-gray-900 truncate">
            {project.enhancedTeamMembers?.length || 0}{" "}
            {(project.enhancedTeamMembers?.length || 0) === 1
              ? "member"
              : "members"}
          </div>
        </div>
      ),
    },
    {
      header: "Documents",
      accessor: "documents",
      renderer: (project) => {
        const documentCount = projectDocuments[project._id]?.length || 0;
        return (
          <div className="text-sm min-w-0 max-w-20">
            <div className="font-medium text-gray-900 truncate">
              {loadingDocuments[project._id] ? (
                <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
              ) : (
                `${documentCount} docs`
              )}
            </div>
            {documentCount > 0 && (
              <div className="text-xs text-green-600">✓ Submitted</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Budget",
      accessor: "budget",
      renderer: (project) => (
        <span className="font-medium text-gray-900 max-w-28">
          {formatCurrency(project.budget)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (project) => (
        <div className="max-w-32 cursor-pointer">
          {getStatusBadge(project.status)}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      align: "center",
      renderer: (project) => (
        <div className="flex items-center justify-center space-x-1 w-40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDetailsModal(project);
            }}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewTeamMembers(project);
            }}
            className="p-2 text-[var(--elra-primary)] rounded-lg transition-colors cursor-pointer"
            title="View Team Members"
          >
            <UsersIcon className="h-4 w-4" />
          </button>
          {project.projectScope !== "personal" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewProjectDocuments(project);
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
                projectDocuments[project._id]?.length > 0
                  ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                  : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              }`}
              title={
                projectDocuments[project._id]?.length > 0
                  ? `View ${
                      projectDocuments[project._id].length
                    } uploaded documents`
                  : "View Documents to Upload"
              }
            >
              <HiDocument className="h-4 w-4" />
              {projectDocuments[project._id]?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {projectDocuments[project._id].length}
                </span>
              )}
            </button>
          )}
          {!shouldDisableProjectEditing(project) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(project);
              }}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              title="Edit Project"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          {!shouldDisableProjectEditing(project) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProjectToDelete(project);
                setShowDeleteConfirm(true);
              }}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Project"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          {/* Resubmit button for rejected projects */}
          {(project.status === "revision_required" ||
            project.status === "rejected") &&
            (project.createdBy._id === user.id ||
              project.createdBy === user.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResubmitProject(project);
                }}
                disabled={resubmittingProject === project._id}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Resubmit Project"
              >
                {resubmittingProject === project._id ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
              </button>
            )}
        </div>
      ),
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
                : user.role.level >= 600
                ? `View and manage personal and departmental projects for ${
                    user.department?.name || "your department"
                  }`
                : `View and manage your personal projects only`}
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
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-6">
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

        {/* Filter Summary */}
        {projects.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {getFilteredProjects().length} of {projects.length} projects
            {(filters.status !== "all" ||
              filters.category !== "all" ||
              filters.department !== "all" ||
              searchTerm.trim()) && (
              <span className="ml-2">
                (filtered by{" "}
                {[
                  filters.status !== "all" && "status",
                  filters.category !== "all" && "category",
                  user.role.level >= 1000 &&
                    filters.department !== "all" &&
                    "department",
                  searchTerm.trim() && "search",
                ]
                  .filter(Boolean)
                  .join(", ")}
                )
              </span>
            )}
          </div>
        )}

        {/* Projects Table */}
        <div className="overflow-x-auto">
          <DataTable
            data={getFilteredProjects()}
            columns={columns}
            loading={loading}
            onRowClick={openDetailsModal}
            rowClassName="cursor-pointer hover:bg-gray-50 transition-colors"
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
            }}
            emptyState={{
              icon: <FolderIcon className="h-12 w-12 text-white" />,
              title: "No projects found",
              description:
                getFilteredProjects().length === 0 && projects.length > 0
                  ? "No projects match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first project",
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
      </div>

      {/* Enhanced Create/Edit Modal with ELRA Branding */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col"
            >
              {/* Header - Fixed Position */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <ELRALogo variant="dark" size="md" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {isEditMode ? "Edit Project" : "Create New Project"}
                      </h2>
                      <p className="text-white text-opacity-90 mt-1 text-sm">
                        {isEditMode
                          ? "Update project details and specifications"
                          : "Choose project type, budget, and requirements"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={closeModal}
                      className="bg-white text-[var(--elra-primary)] px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium border border-white"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={closeModal}
                      className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                      disabled={submitting}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="p-8 bg-white overflow-y-auto flex-1">
                {/* Back to Project Type Selection Button - Only show when not on scope selection page */}
                {!showScopeSelection && (
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setShowScopeSelection(true)}
                      className="flex items-center space-x-2 text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-colors duration-200 cursor-pointer"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      <span className="font-medium">
                        Back to Project Type Selection
                      </span>
                    </button>
                  </div>
                )}

                {/* Step Indicator - Only for external projects */}
                {formData.projectScope === "external" && (
                  <div className="mb-8">
                    <div className="flex items-center justify-center space-x-4">
                      {[1, 2].map((step) => (
                        <div key={step} className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                              currentStep >= step
                                ? "bg-[var(--elra-primary)] text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {step}
                          </div>
                          {step < 2 && (
                            <div
                              className={`w-16 h-1 mx-2 transition-all duration-300 ${
                                currentStep > step
                                  ? "bg-[var(--elra-primary)]"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {currentStep === 1
                          ? "Basic Information"
                          : "Item Specifications"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {currentStep === 1
                          ? "Define project details, budget, and vendor information"
                          : "Add project items and review total costs"}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Enhanced Project Code Display - Only for new projects */}
                  {!isEditMode && nextProjectCode && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-green-700">
                              Next Project Code:
                            </span>
                            <span className="ml-2 text-xl font-bold text-green-900">
                              {nextProjectCode}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          {currentDate}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scope Selection Interface */}
                  {showScopeSelection ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-8"
                    >
                      {/* Header */}
                      <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                          Choose Project Type
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                          Select the type of project you want to create. This
                          will determine the approval process and required
                          information.
                        </p>
                      </div>

                      {/* Project Type Cards */}
                      <div
                        className={`grid grid-cols-1 ${
                          user?.role?.level >= 700 && canCreateExternalProjects
                            ? "md:grid-cols-3"
                            : user?.role?.level >= 700
                            ? "md:grid-cols-2"
                            : "md:grid-cols-1"
                        } gap-6 max-w-4xl mx-auto`}
                      >
                        {/* Personal Project Type - Always visible */}
                        <motion.div
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-2xl p-8 shadow-xl cursor-pointer border-2 border-transparent hover:border-white/20 transition-all duration-300"
                          onClick={() => handleScopeSelection("personal")}
                        >
                          <div className="text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                              <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-3">
                              Personal
                            </h3>
                            <p className="text-white/90 text-sm leading-relaxed">
                              Individual projects for personal development,
                              learning, or small tasks within your department.
                            </p>
                            <div className="mt-6 text-xs text-white/80">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                <span>Quick approval process</span>
                              </div>
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                <span>Basic project details</span>
                              </div>
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                <span>Single-step form</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Departmental Project Type - Only for HOD and above (level >= 700) */}
                        {user?.role?.level >= 700 && (
                          <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-2xl p-8 shadow-xl cursor-pointer border-2 border-transparent hover:border-white/20 transition-all duration-300"
                            onClick={() => handleScopeSelection("departmental")}
                          >
                            <div className="text-center">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg
                                  className="w-8 h-8"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                </svg>
                              </div>
                              <h3 className="text-2xl font-bold mb-3">
                                Departmental
                              </h3>
                              <p className="text-white/90 text-sm leading-relaxed">
                                Team projects involving multiple team members
                                within your department or cross-departmental
                                collaboration.
                              </p>
                              <div className="mt-6 text-xs text-white/80">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                  <span>Department approval</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                  <span>Team assignment</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                  <span>Single-step form</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* External Project Type - Only for HR HOD */}
                        {canCreateExternalProjects && (
                          <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-2xl p-8 shadow-xl cursor-pointer border-2 border-transparent hover:border-white/20 transition-all duration-300"
                            onClick={() => handleScopeSelection("external")}
                          >
                            <div className="text-center">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg
                                  className="w-8 h-8"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-2xl font-bold mb-3">
                                External
                              </h3>
                              <p className="text-white/90 text-sm leading-relaxed">
                                Client projects involving external vendors,
                                detailed specifications, and multi-level
                                approval process.
                              </p>
                              <div className="mt-6 text-xs text-white/80">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                  <span>Multi-step form</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                  <span>Vendor management</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                  <span>Detailed specifications</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Back to Form Button */}
                      <div className="text-center pt-6">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2 mx-auto"
                        >
                          <svg
                            className="w-5 h-5"
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
                          <span>Cancel</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* Form content after scope selection */
                    <div>
                      {/* Step-based content rendering */}
                      <AnimatePresence mode="wait">
                        {formData.projectScope === "external" ? (
                          // Multi-step form for external projects
                          <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            {currentStep === 1 ? (
                              // Step 1: Basic Information
                              <div className="space-y-6">
                                {/* Parent Level Fields - Moved to top for better UX */}
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                                  {/* Budget Field */}
                                  <div className="lg:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      Total Project Budget (₦ NGN){" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.budget}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          budget: formatNumberWithCommas(
                                            e.target.value
                                          ),
                                        })
                                      }
                                      placeholder="Enter total budget amount (e.g., 25,000,000)"
                                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 text-lg font-semibold"
                                      required
                                      disabled={submitting}
                                    />
                                    {formData.budget &&
                                      getApprovalLevelText(formData.budget) && (
                                        <p
                                          className={`mt-2 text-sm font-medium ${
                                            getApprovalLevelText(
                                              formData.budget
                                            ).color
                                          }`}
                                        >
                                          {
                                            getApprovalLevelText(
                                              formData.budget
                                            ).text
                                          }
                                        </p>
                                      )}
                                  </div>

                                  {/* Start Date Field */}
                                  <div className="lg:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      Start Date of Project{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={formData.startDate}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          startDate: e.target.value,
                                        })
                                      }
                                      min={
                                        new Date().toISOString().split("T")[0]
                                      }
                                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                      required
                                      disabled={submitting}
                                    />
                                  </div>

                                  {/* End Date Field */}
                                  <div className="lg:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      End Date of Project{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={formData.endDate}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          endDate: e.target.value,
                                        })
                                      }
                                      min={
                                        formData.startDate ||
                                        new Date().toISOString().split("T")[0]
                                      }
                                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                      required
                                      disabled={submitting}
                                    />
                                  </div>

                                  {/* Priority Field */}
                                  <div className="lg:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      Project Priority{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={formData.priority}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          priority: e.target.value,
                                        })
                                      }
                                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                      required
                                      disabled={submitting}
                                    >
                                      <option value="low">Low Priority</option>
                                      <option value="medium">
                                        Medium Priority
                                      </option>
                                      <option value="high">
                                        High Priority
                                      </option>
                                      <option value="urgent">
                                        Urgent Priority
                                      </option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      Project Name{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.name}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          name: e.target.value,
                                        })
                                      }
                                      placeholder="Enter project name (e.g., Dangote Group - Training System Implementation)"
                                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                      required
                                      disabled={submitting}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      Category{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={formData.category}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          category: e.target.value,
                                        })
                                      }
                                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                      required
                                      disabled={submitting}
                                    >
                                      <option value="">Select Category</option>
                                      {projectCategories
                                        .filter((cat) => cat.value !== "all")
                                        .map((category) => (
                                          <option
                                            key={category.value}
                                            value={category.value}
                                          >
                                            {category.label}
                                          </option>
                                        ))}
                                    </select>
                                  </div>

                                  {/* Project Manager - Only show for non-personal projects */}
                                  {formData.projectScope !== "personal" && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Project Manager
                                      </label>
                                      <UserSearchSelect
                                        value={formData.projectManager}
                                        onChange={(value) =>
                                          setFormData({
                                            ...formData,
                                            projectManager: value,
                                          })
                                        }
                                        placeholder="Search for a project manager..."
                                        label=""
                                        minRoleLevel={
                                          formData.projectScope ===
                                            "external" &&
                                          (user?.department?.name ===
                                            "Human Resources" ||
                                            user?.department?.name === "HR" ||
                                            user?.department?.name ===
                                              "Human Resource Management") &&
                                          user?.role?.level === 700
                                            ? 300 // HR HOD can assign levels 700, 600, 300 for external projects
                                            : 300 // Default for other cases
                                        }
                                        excludeUsers={[]}
                                        currentUser={user}
                                        className="w-full"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Vendor Category Selection - Only for External Projects */}
                                {formData.projectScope === "external" && (
                                  <div className="rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      Vendor Category{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={selectedVendorCategory}
                                      onChange={(e) => {
                                        setSelectedVendorCategory(
                                          e.target.value
                                        );
                                        setFormData({
                                          ...formData,
                                          vendorId: "",
                                        });
                                      }}
                                      className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      required
                                      disabled={submitting}
                                    >
                                      <option value="">
                                        Select Vendor Category
                                      </option>
                                      {vendorCategories.map((category) => (
                                        <option
                                          key={category.value}
                                          value={category.value}
                                        >
                                          {category.label}
                                        </option>
                                      ))}
                                    </select>
                                    <p className="mt-2 text-sm text-blue-600">
                                      Choose the category that best describes
                                      the vendor's services
                                    </p>
                                  </div>
                                )}

                                {/* Budget Allocation - For External Projects Step 1 */}
                                {/* Budget Allocation - For All Project Types */}
                                {/* Budget Allocation - For External Projects Step 1 */}
                                {formData.projectScope === "external" && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      Request Budget Allocation{" "}
                                      <span className="text-gray-500">
                                        (Optional)
                                      </span>
                                    </label>
                                    <div className="space-y-2">
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={
                                            formData.requiresBudgetAllocation ===
                                            "true"
                                          }
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              requiresBudgetAllocation: e.target
                                                .checked
                                                ? "true"
                                                : "false",
                                            })
                                          }
                                          className="mr-2 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] rounded"
                                          disabled={submitting}
                                        />
                                        <span className="text-sm">
                                          Request budget allocation for this
                                          project
                                        </span>
                                      </label>
                                    </div>
                                    <p className="mt-2 text-sm text-blue-600">
                                      {formData.requiresBudgetAllocation ===
                                      "true"
                                        ? "Project will go through Legal → Finance Review → Executive → Budget Allocation approval."
                                        : "Project will go through Legal → Executive approval (using existing budget)."}
                                    </p>
                                  </div>
                                )}
                                {/* {formData.projectScope === "external" && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                      Budget Allocation{" "}
                                      <span className="text-gray-500">
                                        (Optional - defaults to No Budget
                                        Allocation)
                                      </span>
                                    </label>
                                    <div className="space-y-2">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name="requiresBudgetAllocation_external"
                                          value="false"
                                          checked={
                                            formData.requiresBudgetAllocation ===
                                            "false"
                                          }
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              requiresBudgetAllocation:
                                                e.target.value,
                                            })
                                          }
                                          className="mr-2 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                                          disabled={submitting}
                                        />
                                        <span className="text-sm">
                                          No Budget Allocation (Use Existing
                                          Budget)
                                        </span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name="requiresBudgetAllocation_external"
                                          value="true"
                                          checked={
                                            formData.requiresBudgetAllocation ===
                                            "true"
                                          }
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              requiresBudgetAllocation:
                                                e.target.value,
                                            })
                                          }
                                          className="mr-2 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                                          disabled={submitting}
                                        />
                                        <span className="text-sm">
                                          Requires Budget Allocation (Go Through
                                          Finance)
                                        </span>
                                      </label>
                                    </div>
                                    <p className="mt-2 text-sm text-blue-600">
                                      {formData.requiresBudgetAllocation ===
                                      "false"
                                        ? "Project will go through Legal → Executive approval (No Budget Allocation)."
                                        : formData.requiresBudgetAllocation ===
                                          "true"
                                        ? "Project will go through Legal → Finance Review → Executive → Budget Allocation approval workflow."
                                        : "Choose whether this project needs new budget allocation. If left unselected, defaults to No Budget Allocation."}
                                    </p>
                                  </div>
                                )} */}

                                {/* Vendor Information Section - Only for External Projects */}
                                {formData.projectScope === "external" &&
                                  selectedVendorCategory && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg
                                          className="w-5 h-5 mr-2 text-[var(--elra-primary)]"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V4z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Vendor Information
                                      </h3>

                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Vendor Name - Full Width */}
                                        <div className="md:col-span-2 lg:col-span-3">
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vendor Name{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </label>
                                          <input
                                            type="text"
                                            value={formData.vendorName || ""}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                vendorName: e.target.value,
                                              })
                                            }
                                            placeholder="e.g., Dangote Group, Microsoft, etc."
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                            required
                                            disabled={submitting}
                                          />
                                        </div>

                                        {/* Vendor Email */}
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email{" "}
                                            <span className="text-gray-500">
                                              (Optional)
                                            </span>
                                          </label>
                                          <input
                                            type="email"
                                            value={formData.vendorEmail || ""}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                vendorEmail: e.target.value,
                                              })
                                            }
                                            placeholder="contact@company.com"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                            disabled={submitting}
                                          />
                                        </div>

                                        {/* Vendor Phone */}
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone{" "}
                                            <span className="text-gray-500">
                                              (Optional)
                                            </span>
                                          </label>
                                          <input
                                            type="tel"
                                            value={formData.vendorPhone || ""}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                vendorPhone: e.target.value,
                                              })
                                            }
                                            placeholder="+234 801 234 5678"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                            disabled={submitting}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                {/* Step 1 Navigation */}
                                <div className="flex justify-between pt-6">
                                  <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2"
                                    disabled={submitting}
                                  >
                                    <svg
                                      className="w-5 h-5"
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
                                    <span>Cancel</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={nextStep}
                                    className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                                      isStep1Complete()
                                        ? "bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)]"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                    disabled={submitting || !isStep1Complete()}
                                  >
                                    <span>Next: Item Specifications</span>
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Step 2: Item Specifications
                              <div className="space-y-6">
                                {/* Project Items Specification */}
                                <div className="xl:col-span-2">
                                  <label className="block text-lg font-semibold text-gray-800 mb-4">
                                    Required Items & Specifications{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <div className="space-y-4">
                                    {projectItems.map((item, index) => (
                                      <div
                                        key={index}
                                        className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-green-50 shadow-sm"
                                      >
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-lg font-semibold text-gray-800">
                                            Item {index + 1}
                                          </h4>
                                          {projectItems.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newItems =
                                                  projectItems.filter(
                                                    (_, i) => i !== index
                                                  );
                                                setProjectItems(newItems);
                                              }}
                                              className="text-red-600 hover:text-red-800 text-sm"
                                              disabled={submitting}
                                            >
                                              Remove Item
                                            </button>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Item Name{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <input
                                              type="text"
                                              value={item.name}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                newItems[index].name =
                                                  e.target.value;
                                                setProjectItems(newItems);
                                              }}
                                              placeholder="e.g., Training Software Licenses"
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              required
                                              disabled={submitting}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Description{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <input
                                              type="text"
                                              value={item.description}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                newItems[index].description =
                                                  e.target.value;
                                                setProjectItems(newItems);
                                              }}
                                              placeholder="e.g., Software licenses for training"
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              required
                                              disabled={submitting}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Quantity{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <input
                                              type="number"
                                              value={item.quantity}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                const value = e.target.value;
                                                const quantity =
                                                  value === ""
                                                    ? ""
                                                    : parseInt(value) || 0;
                                                const unitPrice =
                                                  parseFloat(
                                                    newItems[
                                                      index
                                                    ].unitPrice.replace(
                                                      /,/g,
                                                      ""
                                                    )
                                                  ) || 0;
                                                newItems[index].quantity =
                                                  quantity;
                                                newItems[index].totalPrice =
                                                  (quantity || 0) * unitPrice;
                                                setProjectItems(newItems);
                                              }}
                                              placeholder="1"
                                              min="1"
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              required
                                              disabled={submitting}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Unit Price (₦ NGN){" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <input
                                              type="text"
                                              value={item.unitPrice}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                const value = e.target.value;
                                                const unitPrice =
                                                  parseFloat(
                                                    value.replace(/,/g, "")
                                                  ) || 0;
                                                const quantity =
                                                  newItems[index].quantity || 0;
                                                newItems[index].unitPrice =
                                                  formatNumberWithCommas(value);
                                                newItems[index].totalPrice =
                                                  quantity * unitPrice;
                                                setProjectItems(newItems);
                                              }}
                                              placeholder="e.g., 500,000"
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              required
                                              disabled={submitting}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Total Price (₦ NGN)
                                            </label>
                                            <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700 font-semibold">
                                              ₦
                                              {item.totalPrice.toLocaleString(
                                                "en-NG"
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-4">
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Delivery Timeline{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </label>
                                          <input
                                            type="text"
                                            value={item.deliveryTimeline}
                                            onChange={(e) => {
                                              const newItems = [
                                                ...projectItems,
                                              ];
                                              newItems[index].deliveryTimeline =
                                                e.target.value;
                                              setProjectItems(newItems);
                                            }}
                                            placeholder="e.g., 30 days from project start"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                            required
                                            disabled={submitting}
                                          />
                                        </div>
                                      </div>
                                    ))}

                                    {/* Add Another Item Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProjectItems([
                                          ...projectItems,
                                          {
                                            name: "",
                                            description: "",
                                            quantity: 1,
                                            unitPrice: "",
                                            totalPrice: 0,
                                            deliveryTimeline: "",
                                            currency: "NGN",
                                          },
                                        ]);
                                      }}
                                      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-600 hover:border-[var(--elra-primary)] hover:text-[var(--elra-primary)] transition-all duration-200 flex items-center justify-center space-x-2"
                                      disabled={submitting}
                                    >
                                      <PlusIcon className="h-5 w-5" />
                                      <span>Add Another Item</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Budget Summary */}
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <svg
                                      className="w-5 h-5 mr-2 text-green-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Budget Summary
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Total Items Cost
                                      </label>
                                      <div className="text-2xl font-bold text-green-600">
                                        ₦
                                        {projectItems
                                          .reduce(
                                            (sum, item) =>
                                              sum + item.totalPrice,
                                            0
                                          )
                                          .toLocaleString("en-NG")}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Project Budget
                                      </label>
                                      <div className="text-2xl font-bold text-blue-600">
                                        ₦
                                        {(
                                          parseFloat(
                                            formData.budget.replace(/,/g, "")
                                          ) || 0
                                        ).toLocaleString("en-NG")}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Remaining Budget
                                      </label>
                                      <div
                                        className={`text-2xl font-bold ${
                                          projectItems.reduce(
                                            (sum, item) =>
                                              sum + item.totalPrice,
                                            0
                                          ) >
                                          (parseFloat(
                                            formData.budget.replace(/,/g, "")
                                          ) || 0)
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }`}
                                      >
                                        ₦
                                        {(
                                          (parseFloat(
                                            formData.budget.replace(/,/g, "")
                                          ) || 0) -
                                          projectItems.reduce(
                                            (sum, item) =>
                                              sum + item.totalPrice,
                                            0
                                          )
                                        ).toLocaleString("en-NG")}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Step 2 Navigation */}
                                <div className="flex justify-between pt-6">
                                  <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2"
                                    disabled={submitting}
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                      />
                                    </svg>
                                    <span>Previous: Basic Information</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowStep2ConfirmModal(true)
                                    }
                                    className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                                      isFormValid() && !hasInvalidInputs()
                                        ? "bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)]"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed cursor-pointer"
                                    }`}
                                    disabled={
                                      submitting ||
                                      !isFormValid() ||
                                      hasInvalidInputs()
                                    }
                                  >
                                    <span>
                                      {isEditMode
                                        ? "Update Project"
                                        : "Create Project"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          // Single-step form for personal/departmental projects
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {/* Parent Level Fields - Moved to top for better UX */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                              {/* Budget Field */}
                              <div className="lg:col-span-1">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                  Total Project Budget (₦ NGN){" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={formData.budget}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      budget: formatNumberWithCommas(
                                        e.target.value
                                      ),
                                    })
                                  }
                                  placeholder="Enter total budget amount (e.g., 25,000,000)"
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 text-lg font-semibold"
                                  required
                                  disabled={submitting}
                                />
                                {formData.budget &&
                                  getApprovalLevelText(formData.budget) && (
                                    <p
                                      className={`mt-2 text-sm font-medium ${
                                        getApprovalLevelText(formData.budget)
                                          .color
                                      }`}
                                    >
                                      {
                                        getApprovalLevelText(formData.budget)
                                          .text
                                      }
                                    </p>
                                  )}
                              </div>

                              {/* Start Date Field */}
                              <div className="lg:col-span-1">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                  Start Date of Project{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={formData.startDate}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      startDate: e.target.value,
                                    })
                                  }
                                  min={new Date().toISOString().split("T")[0]}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                  required
                                  disabled={submitting}
                                />
                              </div>

                              {/* End Date Field */}
                              <div className="lg:col-span-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                  End Date of Project{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={formData.endDate}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      endDate: e.target.value,
                                    })
                                  }
                                  min={
                                    formData.startDate ||
                                    new Date().toISOString().split("T")[0]
                                  }
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                  required
                                  disabled={submitting}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                  Project Name{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={formData.name}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Enter project name (e.g., Dangote Group - Training System Implementation)"
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                  required
                                  disabled={submitting}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                  Category{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={formData.category}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      category: e.target.value,
                                    })
                                  }
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                  required
                                  disabled={submitting}
                                >
                                  <option value="">Select Category</option>
                                  {projectCategories
                                    .filter((cat) => cat.value !== "all")
                                    .map((category) => (
                                      <option
                                        key={category.value}
                                        value={category.value}
                                      >
                                        {category.label}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              {/* Project Manager - Only show for non-personal projects */}
                              {formData.projectScope !== "personal" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Project Manager
                                  </label>
                                  <UserSearchSelect
                                    value={formData.projectManager}
                                    onChange={(value) =>
                                      setFormData({
                                        ...formData,
                                        projectManager: value,
                                      })
                                    }
                                    placeholder="Search for a project manager..."
                                    label=""
                                    minRoleLevel={
                                      formData.projectScope === "external" &&
                                      (user?.department?.name ===
                                        "Human Resources" ||
                                        user?.department?.name === "HR" ||
                                        user?.department?.name ===
                                          "Human Resource Management") &&
                                      user?.role?.level === 700
                                        ? 300
                                        : 300
                                    }
                                    excludeUsers={[]}
                                    currentUser={user}
                                    className="w-full"
                                  />
                                </div>
                              )}

                              {/* Budget Allocation - For All Project Types */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Request Budget Allocation{" "}
                                  <span className="text-gray-500">
                                    (Optional)
                                  </span>
                                </label>
                                <div className="space-y-2">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={
                                        formData.requiresBudgetAllocation ===
                                        "true"
                                      }
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          requiresBudgetAllocation: e.target
                                            .checked
                                            ? "true"
                                            : "false",
                                        })
                                      }
                                      className="mr-2 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] rounded"
                                      disabled={submitting}
                                    />
                                    <span className="text-sm">
                                      Request budget allocation for this
                                      project
                                    </span>
                                  </label>
                                </div>
                                <p className="mt-2 text-sm text-gray-600">
                                  {formData.requiresBudgetAllocation === "true"
                                    ? formData.projectScope === "external"
                                      ? "Project will go through Legal → Finance Review → Executive → Budget Allocation approval workflow."
                                      : "Project will go through Finance and Executive."
                                    : formData.projectScope === "personal"
                                    ? "Project will be auto-approved and use your existing budget."
                                    : formData.projectScope === "departmental"
                                    ? "Project will be auto-approved and use existing department budget."
                                    : formData.projectScope === "external"
                                    ? "Project will go through Legal → Executive approval (using existing budget)."
                                    : "Project will be auto-approved and use existing budget."}
                                </p>
                              </div>

                              {/* Vendor Category Selection - Only for External Projects */}
                              {formData.projectScope === "external" && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Vendor Category{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={selectedVendorCategory}
                                    onChange={(e) => {
                                      setSelectedVendorCategory(e.target.value);
                                      setFormData({
                                        ...formData,
                                        vendorId: "",
                                      });
                                    }}
                                    className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={submitting}
                                  >
                                    <option value="">
                                      Select Vendor Category
                                    </option>
                                    {vendorCategories.map((category) => (
                                      <option
                                        key={category.value}
                                        value={category.value}
                                      >
                                        {category.label}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="mt-2 text-sm text-blue-600">
                                    Choose the category that best describes the
                                    vendor's services
                                  </p>
                                </div>
                              )}

                              {/* Vendor Information Section - Only for External Projects */}
                              {formData.projectScope === "external" &&
                                selectedVendorCategory && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                      <svg
                                        className="w-5 h-5 mr-2 text-[var(--elra-primary)]"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Vendor Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {/* Vendor Name - Full Width */}
                                      <div className="md:col-span-2 lg:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Vendor Name{" "}
                                          <span className="text-red-500">
                                            *
                                          </span>
                                        </label>
                                        <input
                                          type="text"
                                          value={formData.vendorName || ""}
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              vendorName: e.target.value,
                                            })
                                          }
                                          placeholder="e.g., Dangote Group, Microsoft, etc."
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                          required
                                          disabled={submitting}
                                        />
                                      </div>

                                      {/* Vendor Email */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Email{" "}
                                          <span className="text-gray-500">
                                            (Optional)
                                          </span>
                                        </label>
                                        <input
                                          type="email"
                                          value={formData.vendorEmail || ""}
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              vendorEmail: e.target.value,
                                            })
                                          }
                                          placeholder="contact@company.com"
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                          disabled={submitting}
                                        />
                                      </div>

                                      {/* Vendor Phone */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Phone{" "}
                                          <span className="text-gray-500">
                                            (Optional)
                                          </span>
                                        </label>
                                        <input
                                          type="tel"
                                          value={formData.vendorPhone || ""}
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              vendorPhone: e.target.value,
                                            })
                                          }
                                          placeholder="+234 801 234 5678"
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                          disabled={submitting}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Project Items Specification - Only for External Projects */}
                              {formData.projectScope === "external" && (
                                <div className="xl:col-span-2">
                                  <label className="block text-lg font-semibold text-gray-800 mb-4">
                                    Required Items & Specifications{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <div className="space-y-4">
                                    {projectItems.map((item, index) => (
                                      <div
                                        key={index}
                                        className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-green-50 shadow-sm"
                                      >
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-lg font-semibold text-gray-800">
                                            Item {index + 1}
                                          </h4>
                                          {projectItems.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newItems =
                                                  projectItems.filter(
                                                    (_, i) => i !== index
                                                  );
                                                setProjectItems(newItems);
                                              }}
                                              className="text-red-600 hover:text-red-800 text-sm"
                                              disabled={submitting}
                                            >
                                              Remove Item
                                            </button>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Item Name{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <input
                                              type="text"
                                              value={item.name}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                newItems[index].name =
                                                  e.target.value;
                                                setProjectItems(newItems);
                                              }}
                                              placeholder="e.g., Training Software Licenses"
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              required
                                              disabled={submitting}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Quantity{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <input
                                              type="text"
                                              value={item.quantity}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                const value = e.target.value;
                                                const quantity =
                                                  value === ""
                                                    ? ""
                                                    : parseInt(value) || 0;
                                                const unitPrice =
                                                  parseFloat(
                                                    newItems[
                                                      index
                                                    ].unitPrice.replace(
                                                      /,/g,
                                                      ""
                                                    )
                                                  ) || 0;

                                                newItems[index].quantity =
                                                  quantity;
                                                newItems[index].totalPrice =
                                                  (quantity || 0) * unitPrice;

                                                console.log(
                                                  "🔢 [DEBUG] Quantity changed:",
                                                  {
                                                    quantity,
                                                    unitPrice,
                                                    totalPrice:
                                                      newItems[index]
                                                        .totalPrice,
                                                  }
                                                );

                                                setProjectItems(newItems);
                                              }}
                                              placeholder="e.g., 20"
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              required
                                              disabled={submitting}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Currency
                                            </label>
                                            <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600">
                                              ₦ NGN (Nigerian Naira)
                                            </div>
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Unit Price (₦ NGN){" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <input
                                              type="text"
                                              value={item.unitPrice}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                const unitPrice =
                                                  parseFloat(
                                                    e.target.value.replace(
                                                      /,/g,
                                                      ""
                                                    )
                                                  ) || 0;
                                                const quantity =
                                                  newItems[index].quantity || 0;

                                                newItems[index].unitPrice =
                                                  formatNumberWithCommas(
                                                    e.target.value
                                                  );
                                                newItems[index].totalPrice =
                                                  quantity * unitPrice;

                                                console.log(
                                                  "💰 [DEBUG] Unit Price changed:",
                                                  {
                                                    quantity,
                                                    unitPrice,
                                                    totalPrice:
                                                      newItems[index]
                                                        .totalPrice,
                                                  }
                                                );

                                                setProjectItems(newItems);
                                              }}
                                              placeholder="e.g., 500,000"
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              required
                                              disabled={submitting}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Total Price ({item.currency})
                                            </label>
                                            <input
                                              type="text"
                                              value={`₦${formatNumberWithCommas(
                                                item.totalPrice.toString()
                                              )}`}
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                                              readOnly
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Description
                                            </label>
                                            <input
                                              type="text"
                                              value={item.description}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                newItems[index].description =
                                                  e.target.value;
                                                setProjectItems(newItems);
                                              }}
                                              placeholder="Brief description of the item"
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              disabled={submitting}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Delivery Timeline{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                              {formData.startDate &&
                                                formData.endDate && (
                                                  <span className="text-xs text-green-600 ml-1">
                                                    (Max:{" "}
                                                    {(() => {
                                                      const startDate =
                                                        new Date(
                                                          formData.startDate
                                                        );
                                                      const endDate = new Date(
                                                        formData.endDate
                                                      );
                                                      return Math.ceil(
                                                        (endDate - startDate) /
                                                          (1000 * 60 * 60 * 24)
                                                      );
                                                    })()}{" "}
                                                    days)
                                                  </span>
                                                )}
                                            </label>
                                            <input
                                              type="text"
                                              value={item.deliveryTimeline}
                                              onChange={(e) => {
                                                const newItems = [
                                                  ...projectItems,
                                                ];
                                                newItems[
                                                  index
                                                ].deliveryTimeline =
                                                  e.target.value;
                                                setProjectItems(newItems);
                                              }}
                                              placeholder={`e.g., Within ${
                                                formData.startDate &&
                                                formData.endDate
                                                  ? Math.ceil(
                                                      (new Date(
                                                        formData.endDate
                                                      ) -
                                                        new Date(
                                                          formData.startDate
                                                        )) /
                                                        (1000 * 60 * 60 * 24)
                                                    )
                                                  : 45
                                              } days of PO approval`}
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                              required
                                              disabled={submitting}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProjectItems([
                                          ...projectItems,
                                          {
                                            name: "",
                                            description: "",
                                            quantity: 1,
                                            unitPrice: "",
                                            totalPrice: 0,
                                            deliveryTimeline: "",
                                            currency: "NGN",
                                          },
                                        ]);
                                      }}
                                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                                      disabled={submitting}
                                    >
                                      + Add Another Item
                                    </button>

                                    {/* Enhanced Total Budget Summary */}
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-green-800">
                                          Total Items Cost:
                                        </span>
                                        <span className="text-lg font-bold text-green-900">
                                          {(() => {
                                            const totalCost =
                                              projectItems.reduce(
                                                (sum, item) =>
                                                  sum + item.totalPrice,
                                                0
                                              );
                                            return `₦${formatNumberWithCommas(
                                              totalCost.toString()
                                            )}`;
                                          })()}
                                        </span>
                                      </div>
                                      {formData.budget && (
                                        <div className="mt-3 space-y-2">
                                          <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">
                                              Project Budget:
                                            </span>
                                            <span className="font-medium">
                                              ₦{formData.budget}
                                            </span>
                                          </div>
                                          {(() => {
                                            const totalCost =
                                              projectItems.reduce(
                                                (sum, item) =>
                                                  sum + item.totalPrice,
                                                0
                                              );
                                            const projectBudget =
                                              parseFloat(
                                                formData.budget.replace(
                                                  /,/g,
                                                  ""
                                                )
                                              ) || 0;
                                            const isValid =
                                              totalCost <= projectBudget;

                                            return (
                                              <div
                                                className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                                                  isValid
                                                    ? "bg-green-50 border border-green-200"
                                                    : "bg-red-50 border border-red-200"
                                                }`}
                                              >
                                                <span
                                                  className={`font-medium ${
                                                    isValid
                                                      ? "text-green-700"
                                                      : "text-red-700"
                                                  }`}
                                                >
                                                  {isValid
                                                    ? "✅ Budget Valid"
                                                    : "❌ Budget Exceeded"}
                                                </span>
                                                <span
                                                  className={`font-bold ${
                                                    isValid
                                                      ? "text-green-800"
                                                      : "text-red-800"
                                                  }`}
                                                >
                                                  {isValid
                                                    ? `Remaining: ₦${formatNumberWithCommas(
                                                        (
                                                          projectBudget -
                                                          totalCost
                                                        ).toString()
                                                      )}`
                                                    : `Excess: ₦${formatNumberWithCommas(
                                                        (
                                                          totalCost -
                                                          projectBudget
                                                        ).toString()
                                                      )}`}
                                                </span>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Status field removed - managed by backend workflow system */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Priority{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={formData.priority}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      priority: e.target.value,
                                    })
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
                            <div className="mt-4"></div>

                            {/* Description - Only show for non-external projects */}
                            {formData.projectScope !== "external" && (
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={formData.description}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Enter project description and objectives..."
                                  rows={3}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                  required
                                  disabled={submitting}
                                />
                              </div>
                            )}

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
                                className={`px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer ${
                                  isFormValid() && !hasInvalidInputs()
                                    ? "bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)]"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                                disabled={
                                  submitting ||
                                  !isFormValid() ||
                                  hasInvalidInputs()
                                }
                              >
                                {submitting && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                )}
                                {isEditMode
                                  ? "Update Project"
                                  : "Create Project"}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Details Modal */}
      {showDetailsModal && selectedProjectDetails && (
        <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
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
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
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
                          Team Members
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedProjectDetails.enhancedTeamMembers?.length ||
                            0}{" "}
                          members
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
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
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
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
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
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
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
              {selectedProjectDetails.status === "planning" && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openEditModal(selectedProjectDetails);
                  }}
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors"
                >
                  Edit Project
                </button>
              )}
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

      {/* Resubmit Confirmation Modal */}
      {showResubmitConfirm && projectToResubmit && (
        <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <ArrowPathIcon className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 ml-3">
                  Resubmit Project
                </h2>
              </div>
              <button
                onClick={closeResubmitConfirm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ELRALogo className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      ELRA Project Resubmission
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Please ensure you have addressed all rejection reasons
                      before resubmitting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Project Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Project:
                        </span>
                        <p className="text-gray-900">
                          {projectToResubmit.name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Code:</span>
                        <p className="text-gray-900">
                          {projectToResubmit.code}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <p className="text-gray-900">
                          {getStatusBadge(projectToResubmit.status)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Budget:
                        </span>
                        <p className="text-gray-900">
                          {formatCurrency(projectToResubmit.budget)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-sm font-medium">
                          !
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        Important Reminder
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Have you reviewed and addressed the rejection reasons
                        provided by the approver? The project will be
                        resubmitted for approval from the rejection point
                        onwards.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeResubmitConfirm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResubmitProject}
                disabled={resubmittingProject === projectToResubmit._id}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {resubmittingProject === projectToResubmit._id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Resubmitting...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Yes, Resubmit Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Members View Modal */}
      {showTeamModal && selectedProjectForTeam && (
        <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <UsersIcon className="h-6 w-6 text-blue-600 mr-2" />
                Team Members
              </h2>
              <button
                onClick={closeTeamModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Project: {selectedProjectForTeam.name}
              </h3>
              <p className="text-sm text-gray-500">
                Code: {selectedProjectForTeam.code}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[var(--elra-primary)] p-4 rounded-lg border border-[var(--elra-primary)]">
                <h4 className="font-medium text-white mb-3">
                  Current Team Members (
                  {selectedProjectForTeam.enhancedTeamMembers?.length || 0})
                </h4>
                {selectedProjectForTeam.enhancedTeamMembers &&
                selectedProjectForTeam.enhancedTeamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProjectForTeam.enhancedTeamMembers.map(
                      (member, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200"
                        >
                          <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {member.user?.firstName?.charAt(0)}
                              {member.user?.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 flex items-center">
                              {member.user?.firstName} {member.user?.lastName}
                              {member.role === "project_manager" && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--elra-primary)] text-white">
                                  PM
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.role.replace(/_/g, " ")} •{" "}
                              {member.user?.department?.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {member.allocationPercentage}% allocation
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--elra-primary)] text-white">
                              {member.status}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No team members assigned yet.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Team members can be added from the Teams page.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-[var(--elra-primary)] p-4 rounded-lg border border-[var(--elra-primary)]">
                <h4 className="font-medium text-white mb-2">
                  💡 Team Management
                </h4>
                <p className="text-sm text-white">
                  To add or remove team members, please use the dedicated{" "}
                  <span className="font-medium">Teams page</span> for
                  comprehensive team management.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={closeTeamModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && selectedProjectForDocument && (
        <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl modal-shadow-enhanced max-w-6xl w-full max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="light" size="sm" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {isReplacingDocument
                        ? "Replace Document"
                        : "Upload Document"}{" "}
                      for Project
                    </h2>
                    <p className="text-white text-opacity-80">
                      {selectedProjectForDocument.name} -{" "}
                      {selectedProjectForDocument.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={closeDocumentModal}
                    className="bg-white text-[var(--elra-primary)] px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium border border-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={closeDocumentModal}
                    className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                  >
                    <HiXMark className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              {/* Project Information */}
              <div className="mb-8">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex">
                    <FolderIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        Project Information
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Project:
                          </span>
                          <p className="text-gray-600 break-words">
                            {selectedProjectForDocument.name}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Code:
                          </span>
                          <p className="text-gray-600">
                            {selectedProjectForDocument.code}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Department:
                          </span>
                          <p className="text-gray-600">
                            {selectedProjectForDocument.department?.name}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Status:
                          </span>
                          <div className="mt-1">
                            {getStatusBadge(selectedProjectForDocument.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {/* File Upload Section */}
                <div className="text-center">
                  {/* Upload Option */}
                  <div
                    className={`bg-white border-2 border-dashed rounded-2xl p-8 transition-all duration-300 group ${
                      isDragOver
                        ? "border-[var(--elra-primary)] bg-[var(--elra-primary-light)] shadow-lg scale-105"
                        : "border-gray-200 hover:border-[var(--elra-primary)] hover:shadow-lg"
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                          isDragOver
                            ? "bg-[var(--elra-primary)] scale-110"
                            : "bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] group-hover:scale-110"
                        }`}
                      >
                        <HiArrowUpTray className="w-8 h-8 text-white" />
                      </div>
                      <h3
                        className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                          isDragOver
                            ? "text-[var(--elra-primary)]"
                            : "text-gray-900"
                        }`}
                      >
                        {isDragOver
                          ? "Drop your file here"
                          : `Upload ${documentFormData.title}`}
                      </h3>
                      <p
                        className={`mb-6 leading-relaxed transition-colors duration-300 ${
                          isDragOver
                            ? "text-[var(--elra-primary)] font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {isDragOver
                          ? "Release to upload your document"
                          : "Drag and drop your document here, or click to browse. Document details will be automatically populated."}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG,
                        TIFF, BMP
                      </p>

                      {selectedFile ? (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <HiDocument className="w-5 h-5 text-green-600" />
                              <div className="min-w-0 flex-1">
                                <p
                                  className="font-medium text-green-800 truncate cursor-help"
                                  title={selectedFile.name}
                                >
                                  {selectedFile.name.length > 30
                                    ? selectedFile.name.substring(0, 30) + "..."
                                    : selectedFile.name}
                                </p>
                                <p className="text-sm text-green-600">
                                  {formatFileSize(selectedFile.size)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
                              disabled={isUploadingDocument}
                            >
                              <HiXMark className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.bmp"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                            disabled={isUploadingDocument}
                          />
                          <label
                            htmlFor="file-upload"
                            className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold cursor-pointer inline-block"
                          >
                            Choose File
                          </label>
                        </>
                      )}

                      {isUploadingDocument && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Uploading...
                            </span>
                            <span className="text-sm text-gray-500">
                              {uploadProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {selectedFile && !isUploadingDocument && (
                        <button
                          onClick={handleDocumentUpload}
                          className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold cursor-pointer"
                        >
                          {isReplacingDocument
                            ? "Replace Document"
                            : "Upload Document"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 Confirmation Modal */}
      {showStep2ConfirmModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="dark" size="sm" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      Confirm Project Creation
                    </h2>
                    <p className="text-white text-opacity-90 text-sm">
                      Review your project details before final submission
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStep2ConfirmModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Project Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FolderIcon className="h-5 w-5 text-blue-600 mr-2" />
                  Project Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="text-gray-900 font-semibold">
                      {formData.name}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <p className="text-gray-900">
                      {projectCategories.find(
                        (cat) => cat.value === formData.category
                      )?.label || formData.category}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Budget:</span>
                    <p className="text-green-600 font-bold">
                      ₦{formData.budget}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Vendor:</span>
                    <p className="text-gray-900">{formData.vendorName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Timeline:</span>
                    <p className="text-gray-900">
                      {formData.startDate} to {formData.endDate}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <p className="text-gray-900 capitalize">
                      {formData.priority}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Budget Allocation:
                    </span>
                    <p className="text-gray-900">
                      {formData.requiresBudgetAllocation === "true"
                        ? "Request budget allocation"
                        : "Use existing budget"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg
                    className="h-5 w-5 text-green-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Items Summary
                </h3>
                <div className="space-y-3">
                  {projectItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-3 border border-green-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            <span>Price: ₦{item.unitPrice}</span>
                            <span>Timeline: {item.deliveryTimeline}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ₦{item.totalPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">
                        Total Items Cost:
                      </span>
                      <span className="font-bold text-green-600 text-lg">
                        ₦
                        {projectItems
                          .reduce((sum, item) => sum + item.totalPrice, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Workflow */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg
                    className="h-5 w-5 text-purple-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Approval Workflow
                </h3>
                {getApprovalLevelText(formData.budget) && (
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <p
                      className={`text-sm font-medium ${
                        getApprovalLevelText(formData.budget).color
                      }`}
                    >
                      {getApprovalLevelText(formData.budget).text}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions - Fixed */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowStep2ConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back to Edit
              </button>
              <button
                onClick={() => {
                  handleSubmit(new Event("submit"));
                }}
                disabled={submitting}
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Project...</span>
                  </>
                ) : (
                  <span>Confirm & Create Project</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Project Documents Modal */}
      {showDocumentsModal && selectedProjectForDocuments && (
        <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl modal-shadow-enhanced max-w-[90vw] w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="light" size="md" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Project Documents - {selectedProjectForDocuments.name}
                    </h2>
                    <p className="text-white text-opacity-80">
                      Code: {selectedProjectForDocuments.code} • Budget: ₦
                      {selectedProjectForDocuments.budget?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDocumentsModal(false);
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <HiXMark className="w-8 h-8" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              {/* Project Information */}
              <div className="mb-8">
                <div className="bg-[var(--elra-primary-light)] border border-[var(--elra-primary)] p-4 rounded-lg">
                  <div className="flex">
                    <FolderIcon className="h-5 w-5 text-[var(--elra-primary)] mr-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--elra-primary-dark)] font-medium mb-2">
                        Required Documents for Project Approval
                      </p>
                      <p className="text-sm text-[var(--elra-primary-dark)] mb-4">
                        The following documents are required for project
                        approval. Upload completed documents to proceed with
                        approval.
                      </p>

                      {/* Required Documents List */}
                      <div className="space-y-4">
                        {[
                          {
                            title: "Project Proposal Document",
                            description:
                              "Complete project proposal with objectives, scope, and detailed description",
                            documentType: "project_proposal",
                            isSubmitted:
                              projectDocuments[
                                selectedProjectForDocuments._id
                              ]?.some(
                                (uploadedDoc) =>
                                  uploadedDoc.documentType ===
                                  "project_proposal"
                              ) || false,
                          },
                          {
                            title: "Budget & Financial Plan",
                            description:
                              "Detailed budget breakdown, cost analysis, and financial justification",
                            documentType: "budget_breakdown",
                            isSubmitted:
                              projectDocuments[
                                selectedProjectForDocuments._id
                              ]?.some(
                                (uploadedDoc) =>
                                  uploadedDoc.documentType ===
                                  "budget_breakdown"
                              ) || false,
                          },
                          {
                            title: "Technical & Implementation Plan",
                            description:
                              "Technical specifications, timeline, milestones, and implementation strategy",
                            documentType: "technical_specifications",
                            isSubmitted:
                              projectDocuments[
                                selectedProjectForDocuments._id
                              ]?.some(
                                (uploadedDoc) =>
                                  uploadedDoc.documentType ===
                                  "technical_specifications"
                              ) || false,
                          },
                        ].map((doc, index) => (
                          <div
                            key={index}
                            className={`rounded-lg p-6 transition-colors border ${
                              doc.isSubmitted
                                ? "bg-green-50 border-green-200 hover:bg-green-100"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <div
                                  className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border ${
                                    doc.isSubmitted
                                      ? "bg-green-100 border-green-300"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  {doc.isSubmitted ? (
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  ) : (
                                    <HiDocument className="w-6 h-6 text-[var(--elra-primary)]" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {doc.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3">
                                    {doc.description}
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        doc.isSubmitted
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {doc.isSubmitted
                                        ? "✓ UPLOADED"
                                        : "REQUIRED"}
                                    </span>
                                    <span className="text-gray-500">
                                      Type:{" "}
                                      {doc.documentType
                                        .replace(/_/g, " ")
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {doc.isSubmitted ? (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => {
                                        const uploadedDoc = getUploadedDocument(
                                          doc.documentType
                                        );

                                        if (uploadedDoc) {
                                          handleViewDocument(
                                            uploadedDoc._id,
                                            uploadedDoc.title
                                          );
                                        } else {
                                          toast.error(
                                            "Document not found. Please try uploading again."
                                          );
                                        }
                                      }}
                                      disabled={
                                        viewingDocumentId ===
                                        getUploadedDocument(doc.documentType)
                                          ?._id
                                      }
                                      className="px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {viewingDocumentId ===
                                      getUploadedDocument(doc.documentType)
                                        ?._id ? (
                                        <>
                                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                          <span>Opening...</span>
                                        </>
                                      ) : (
                                        <>
                                          <EyeIcon className="w-4 h-4" />
                                          <span>View Document</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Replace Document Button - Only show if project is not approved */}
                                    {!shouldDisableDocumentEditing(
                                      selectedProjectForDocuments
                                    ) && (
                                      <button
                                        onClick={() =>
                                          startDocumentReplacement(
                                            doc.documentType,
                                            selectedProjectForDocuments
                                          )
                                        }
                                        className="px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700"
                                        title="Replace document"
                                      >
                                        <HiArrowUpTray className="w-4 h-4" />
                                        <span>Replace</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  // Show Upload button for pending documents
                                  <button
                                    onClick={() => {
                                      setShowDocumentsModal(false);
                                      setSelectedProjectForDocument(
                                        selectedProjectForDocuments
                                      );

                                      // Check if editing should be disabled
                                      const isDisabled =
                                        shouldDisableDocumentEditing(
                                          selectedProjectForDocuments
                                        );
                                      setIsDocumentEditingDisabled(isDisabled);

                                      setDocumentFormData({
                                        title: `${doc.title} - ${selectedProjectForDocuments.name}`,
                                        description: `${
                                          doc.description
                                        }\n\nProject: ${
                                          selectedProjectForDocuments.name
                                        }\nProject Code: ${
                                          selectedProjectForDocuments.code
                                        }\nCategory: ${
                                          selectedProjectForDocuments.category
                                        }\nBudget: ₦${
                                          selectedProjectForDocuments.budget?.toLocaleString() ||
                                          "N/A"
                                        }`,
                                        category: "Project Documentation",
                                        documentType: doc.documentType,
                                        priority: "High",
                                        tags: `project-document,required,${selectedProjectForDocuments.code?.toLowerCase()},${
                                          selectedProjectForDocuments.category
                                        }`,
                                        isConfidential: false,
                                      });

                                      setShowDocumentModal(true);
                                      setIsInUploadMode(true);
                                    }}
                                    className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                                      shouldDisableDocumentEditing(
                                        selectedProjectForDocuments
                                      )
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : "bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)]"
                                    }`}
                                    disabled={shouldDisableDocumentEditing(
                                      selectedProjectForDocuments
                                    )}
                                  >
                                    <HiArrowUpTray className="w-4 h-4" />
                                    <span>
                                      {shouldDisableDocumentEditing(
                                        selectedProjectForDocuments
                                      )
                                        ? `Upload ${
                                            doc.title.split(" ")[0]
                                          } (Disabled)`
                                        : `Upload ${doc.title.split(" ")[0]}`}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
