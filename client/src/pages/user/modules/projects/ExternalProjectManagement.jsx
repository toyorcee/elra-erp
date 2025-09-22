import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GlobeAltIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
} from "@heroicons/react/24/solid";
import DataTable from "../../../../components/common/DataTable";
import { toast } from "react-toastify";
import {
  formatCurrency,
  formatDate,
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../../../../utils/formatters.js";
import { useAuth } from "../../../../context/AuthContext";
import AnimatedBubbles from "../../../../components/ui/AnimatedBubbles";
import {
  fetchProjects,
  createProject,
  getNextExternalProjectCode,
  fetchProjectCategories,
  addVendorToProject,
} from "../../../../services/projectAPI.js";
import {
  uploadDocument,
  getProjectDocuments,
} from "../../../../services/documents.js";
import SmartFileUpload from "../../../../components/common/SmartFileUpload.jsx";
import ELRALogo from "../../../../components/ELRALogo.jsx";
import {
  UNIFIED_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
} from "../../../../constants/unifiedCategories.js";

const ExternalProjectManagement = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [vendorFormData, setVendorFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    deliveryAddress: "",
  });

  // Document upload state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedProjectForDocument, setSelectedProjectForDocument] =
    useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documentFormData, setDocumentFormData] = useState({
    title: "",
    description: "",
    category: "Project Documentation",
    documentType: "",
    priority: "Medium",
    tags: "",
    isConfidential: false,
  });
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    // Basic project info
    name: "",
    description: "",
    category: "",
    startDate: "",
    endDate: "",
    budget: "",
    priority: "medium",
    projectScope: "external",

    // Budget allocation
    requiresBudgetAllocation: "false",

    // Client information
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    clientPhone: "",
    clientAddress: "",

    // Budget percentage agreement
    budgetPercentage: "",

    // Vendor information
    hasVendor: false,
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
    vendorAddress: "",
    deliveryAddress: "",

    // Custom category for "Other"
    customCategory: "",
  });

  // Project items for external projects
  const [projectItems, setProjectItems] = useState([
    {
      name: "",
      description: "",
      quantity: 1,
      unitPrice: "",
      totalPrice: 0,
      deliveryTimeline: "",
    },
  ]);

  // Additional states for external projects
  const [projectCategories, setProjectCategories] = useState([]);
  const [nextProjectCode, setNextProjectCode] = useState("");
  const [elraWalletBudget, setElraWalletBudget] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(3);

  const getApprovalLevelText = (budget) => {
    const numericBudget = parseFormattedNumber(budget);
    if (numericBudget >= 50000000) {
      return {
        text: "⚠️ High-value project - Requires Executive approval",
        color: "text-red-600",
      };
    } else if (numericBudget >= 10000000) {
      return {
        text: "📋 Medium-value project - Standard approval process",
        color: "text-yellow-600",
      };
    } else {
      return {
        text: "✅ Low-value project - Quick approval process",
        color: "text-green-600",
      };
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("🔄 [INIT] Loading initial data for external projects...");
        console.log("👤 [USER] Current user:", {
          id: user?.id,
          role: user?.role?.name,
          level: user?.role?.level,
          department: user?.department?.name,
        });

        setLoading(true);

        const [projectCodeResponse, categoriesResponse, projectsResponse] =
          await Promise.all([
            getNextExternalProjectCode(),
            fetchProjectCategories(),
            fetchProjects({ projectScope: "external" }),
          ]);

        if (projectCodeResponse.success) {
          setNextProjectCode(projectCodeResponse.data.code);
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          console.log("📋 [CATEGORIES] API Response:", categoriesResponse);
          const categories =
            categoriesResponse.data.categories || categoriesResponse.data || [];
          console.log("📋 [CATEGORIES] Setting categories:", categories);
          setProjectCategories(categories);
        } else {
          console.error(
            "❌ [CATEGORIES] Failed to fetch categories:",
            categoriesResponse
          );
          // Fallback to default categories if API fails
          setProjectCategories([]);
        }

        if (projectsResponse.success) {
          console.log("📊 [PROJECTS] API Response:", projectsResponse);
          const externalProjects =
            projectsResponse.data.projects || projectsResponse.data || [];
          console.log(
            "📊 [PROJECTS] Setting external projects:",
            externalProjects
          );

          // Log each project's budget percentage to debug
          externalProjects.forEach((project, index) => {
            console.log(`📊 [PROJECT ${index}] Budget Percentage Debug:`, {
              projectName: project.name,
              projectCode: project.code,
              budgetPercentage: project.budgetPercentage,
              requiresBudgetAllocation: project.requiresBudgetAllocation,
              budget: project.budget,
              projectItems: project.projectItems?.length || 0,
            });
          });

          setProjects(externalProjects);
        } else {
          console.error(
            "❌ [PROJECTS] Failed to fetch external projects:",
            projectsResponse
          );
          toast.error("Failed to load external projects");
        }

        console.log("✅ [INIT] Initial data loaded successfully");
      } catch (error) {
        console.error("❌ [INIT] Error loading initial data:", error);
        console.error("❌ [INIT] Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast.error("Failed to load external projects data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  // Enhanced modal styles
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

  // DataTable columns configuration
  const columns = [
    {
      header: "Project Name",
      accessor: "name",
      width: "w-80",
      renderer: (row) => (
        <div className="max-w-xs">
          <div
            className="font-semibold text-gray-900 break-words"
            title={row.name}
          >
            {row.name}
          </div>
          <div
            className="text-sm text-gray-500 break-words"
            title={row.description}
          >
            {row.description}
          </div>
        </div>
      ),
    },
    {
      header: "Client",
      accessor: "clientName",
      width: "w-48",
      renderer: (row) => (
        <div className="flex items-center max-w-xs">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          <div>
            <span
              className="text-sm font-medium truncate block"
              title={row.clientName}
            >
              {row.clientName}
            </span>
            {row.clientCompany && (
              <span
                className="text-xs text-gray-500 truncate block"
                title={row.clientCompany}
              >
                {row.clientCompany}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Budget",
      accessor: "budget",
      width: "w-32",
      renderer: (row) => (
        <div>
          <span className="font-semibold text-gray-900">
            {formatCurrency(row.budget)}
          </span>
          {row.requiresBudgetAllocation && row.budgetPercentage && (
            <div className="text-xs text-green-600 mt-1">
              ELRA: {row.budgetPercentage}%
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      width: "w-32",
      renderer: (row) => {
        const statusInfo = getStatusInfo(row.status);
        const StatusIcon = statusInfo.icon;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      header: "Vendor",
      accessor: "vendorId",
      width: "w-48",
      renderer: (row) => (
        <div className="flex items-center max-w-xs">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          <div>
            {row.vendorId ? (
              <>
                <span
                  className="text-sm font-medium break-words block"
                  title={row.vendorId.name}
                >
                  {row.vendorId.name}
                </span>
                <span
                  className="text-xs text-gray-500 break-all block"
                  title={row.vendorId.email}
                >
                  {row.vendorId.email}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">No vendor</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Duration",
      accessor: "startDate",
      width: "w-40",
      renderer: (row) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{formatDate(row.startDate)}</span>
          </div>
          <div className="text-xs text-gray-500">
            to {formatDate(row.endDate)}
          </div>
        </div>
      ),
    },
  ];

  // Filter projects based on search and filters
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.clientName &&
        project.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.clientCompany &&
        project.clientCompany
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (project.code &&
        project.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.vendorId &&
        project.vendorId.name &&
        project.vendorId.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (project.vendorId &&
        project.vendorId.email &&
        project.vendorId.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case "in_progress":
        return {
          color: "text-green-600 bg-green-100",
          icon: CheckCircleIconSolid,
          label: "In Progress",
        };
      case "pending_approval":
        return {
          color: "text-yellow-600 bg-yellow-100",
          icon: ClockIconSolid,
          label: "Pending Approval",
        };
      case "pending_legal_compliance_approval":
        return {
          color: "text-orange-600 bg-orange-100",
          icon: ClockIconSolid,
          label: "Pending Legal Approval",
        };
      case "pending_vendor_assignment":
        return {
          color: "text-red-600 bg-red-100",
          icon: ClockIconSolid,
          label: "Pending Vendor Assignment",
        };
      case "approved":
        return {
          color: "text-blue-600 bg-blue-100",
          icon: CheckCircleIconSolid,
          label: "Approved",
        };
      case "implementation":
        return {
          color: "text-indigo-600 bg-indigo-100",
          icon: CheckCircleIconSolid,
          label: "Implementation",
        };
      case "completed":
        return {
          color: "text-purple-600 bg-purple-100",
          icon: CheckCircleIconSolid,
          label: "Completed",
        };
      case "rejected":
        return {
          color: "text-red-600 bg-red-100",
          icon: ClockIconSolid,
          label: "Rejected",
        };
      case "cancelled":
        return {
          color: "text-gray-600 bg-gray-100",
          icon: ClockIconSolid,
          label: "Cancelled",
        };
      default:
        return {
          color: "text-gray-600 bg-gray-100",
          icon: ClockIconSolid,
          label: status || "Unknown",
        };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Format currency (always Nigerian Naira)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const projectBudget = parseFormattedNumber(formData.budget) || 0;
  const budgetPercentage = parseFloat(formData.budgetPercentage) || 0;
  const totalItemsCost = projectItems.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );
  const elraContribution = (totalItemsCost * budgetPercentage) / 100;
  const clientContribution = totalItemsCost - elraContribution;

  const canUseBudgetAllocation =
    projectBudget > 0 && totalItemsCost <= projectBudget;
  const itemsExceedBudget = totalItemsCost > projectBudget;
  const itemsExceedElraContribution = false; // This validation is no longer needed

  const canToggleBudgetAllocation = projectBudget > 0;

  const elraWalletInsufficient =
    formData.requiresBudgetAllocation === "true" &&
    elraWalletBudget &&
    elraContribution > elraWalletBudget.available;

  const isBasicInfoComplete = Boolean(
    formData.name &&
      formData.category &&
      formData.budget &&
      formData.startDate &&
      formData.endDate &&
      (formData.category !== "other" || formData.customCategory)
  );

  const isClientInfoComplete = Boolean(
    formData.clientName && formData.clientEmail && formData.clientCompany
  );

  const hasValidProjectItems = projectItems.some(
    (item) =>
      item.name && item.unitPrice && item.quantity && item.deliveryTimeline
  );

  const isVendorInfoComplete = Boolean(
    !formData.hasVendor || (formData.vendorName && formData.vendorEmail)
  );

  const isBudgetAllocationComplete = Boolean(
    !formData.requiresBudgetAllocation ||
      (formData.requiresBudgetAllocation === "true" &&
        formData.budgetPercentage)
  );

  const allRequiredFieldsFilled =
    isBasicInfoComplete &&
    isClientInfoComplete &&
    hasValidProjectItems &&
    isVendorInfoComplete &&
    isBudgetAllocationComplete;

  // Determine if create button should be disabled
  const hasValidationErrors =
    itemsExceedBudget || itemsExceedElraContribution || elraWalletInsufficient;
  const isCreateButtonDisabled =
    hasValidationErrors || submitting || !allRequiredFieldsFilled;

  // Form handling functions
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProjectItemChange = (index, field, value) => {
    const updatedItems = [...projectItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate total price
    if (field === "quantity" || field === "unitPrice") {
      const quantity =
        field === "quantity"
          ? parseInt(value) || 0
          : updatedItems[index].quantity;
      const unitPrice =
        field === "unitPrice"
          ? parseFormattedNumber(value) || 0
          : parseFormattedNumber(updatedItems[index].unitPrice) || 0;
      updatedItems[index].totalPrice = quantity * unitPrice;
    }

    setProjectItems(updatedItems);
  };

  const addProjectItem = () => {
    setProjectItems([
      ...projectItems,
      {
        name: "",
        description: "",
        quantity: 1,
        unitPrice: "",
        totalPrice: 0,
        deliveryTimeline: "",
      },
    ]);
  };

  const removeProjectItem = (index) => {
    if (projectItems.length > 1) {
      setProjectItems(projectItems.filter((_, i) => i !== index));
    }
  };

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

  const closeModal = () => {
    setShowCreateModal(false);
    setCurrentStep(1);
    setFormData({
      name: "",
      description: "",
      category: "",
      startDate: "",
      endDate: "",
      budget: "",
      projectManager: "",
      priority: "medium",
      projectScope: "external",
      vendorId: "",
      vendorName: "",
      vendorEmail: "",
      vendorPhone: "",
      requiresBudgetAllocation: "",
      clientName: "",
      clientEmail: "",
      clientCompany: "",
      clientPhone: "",
      clientAddress: "",
      budgetPercentage: "",
      hasVendor: false,
      customCategory: "",
    });
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
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      vendor: "",
      budget: "",
      startDate: "",
      endDate: "",
      priority: "medium",
      category: "",
      requiresBudgetAllocation: false,
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    console.log("🚀 [CREATE] ===== FORM SUBMISSION STARTED =====");
    console.log("🚀 [CREATE] Event:", e);
    console.log("🚀 [CREATE] Current submitting state:", submitting);
    console.log("🚀 [CREATE] Form data:", JSON.stringify(formData, null, 2));
    console.log(
      "🚀 [CREATE] Project items:",
      JSON.stringify(projectItems, null, 2)
    );
    console.log(
      "🚀 [CREATE] All required fields filled:",
      allRequiredFieldsFilled
    );
    console.log("🚀 [CREATE] Has validation errors:", hasValidationErrors);
    console.log("🚀 [CREATE] Is button disabled:", isCreateButtonDisabled);

    // Prevent multiple submissions
    if (submitting) {
      console.log("🚀 [CREATE] Already submitting, returning...");
      return;
    }

    console.log("🚀 [CREATE] Setting submitting to true...");
    setSubmitting(true);

    try {
      // Create project data
      const projectData = {
        name: formData.name,
        description: formData.description,
        category:
          formData.category === "other"
            ? formData.customCategory
            : formData.category,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFormattedNumber(formData.budget),
        code: nextProjectCode, // Use the pre-generated external project code
        // Don't send projectManager for external projects unless user is HR HOD
        ...(user?.department?.name === "Human Resources" &&
        formData.projectManager
          ? { projectManager: formData.projectManager }
          : {}),
        priority: formData.priority,
        projectScope: "external",
        vendorName: formData.vendorName,
        vendorEmail: formData.vendorEmail,
        vendorPhone: formData.vendorPhone,
        vendorAddress: formData.vendorAddress,
        deliveryAddress: formData.deliveryAddress,
        vendorCategory: formData.category,
        requiresBudgetAllocation: formData.requiresBudgetAllocation,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientCompany: formData.clientCompany,
        clientPhone: formData.clientPhone,
        clientAddress: formData.clientAddress,
        budgetPercentage: formData.budgetPercentage || 100,
        hasVendor: formData.hasVendor,
        projectItems: projectItems.filter(
          (item) => item.name && item.unitPrice
        ),
      };

      console.log(
        "🚀 [CREATE] Creating external project:",
        JSON.stringify(projectData, null, 2)
      );
      console.log("🚀 [CREATE] Budget Percentage Debug:", {
        formDataBudgetPercentage: formData.budgetPercentage,
        projectDataBudgetPercentage: projectData.budgetPercentage,
        type: typeof formData.budgetPercentage,
      });
      console.log("🚀 [CREATE] About to call createProject API...");

      const response = await createProject(projectData);

      console.log(
        "🚀 [CREATE] API Response:",
        JSON.stringify(response, null, 2)
      );

      if (response.success) {
        console.log("🚀 [CREATE] SUCCESS! Project created successfully");
        toast.success("External project created successfully!");
        setShowCreateModal(false);
        resetForm();
        refreshProjects();
      } else {
        console.log(
          "🚀 [CREATE] FAILED! API returned error:",
          response.message
        );
        toast.error(response.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);

      let errorMessage = "Failed to create project";

      if (error.response?.data) {
        const errorData = error.response.data;
        console.log("🔍 [ERROR] Backend error data:", errorData);

        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join("; ");
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        if (errorData.fieldErrors) {
          const fieldErrors = Object.values(errorData.fieldErrors).join("; ");
          if (fieldErrors) {
            errorMessage += ` (${fieldErrors})`;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleAddVendor = (project) => {
    console.log(
      "➕ [ADD VENDOR] Add vendor button clicked for project:",
      project
    );
    setSelectedProject(project);
    setVendorFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      deliveryAddress: "",
    });
    setShowAddVendorModal(true);
  };

  const handleVendorInputChange = (e) => {
    const { name, value } = e.target;
    setVendorFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitVendor = async (e) => {
    e.preventDefault();

    if (!selectedProject) return;

    try {
      setSubmitting(true);
      console.log("➕ [ADD VENDOR] Submitting vendor data:", vendorFormData);

      const result = await addVendorToProject(
        selectedProject._id,
        vendorFormData
      );

      if (result.success) {
        console.log("✅ [ADD VENDOR] Vendor added successfully");
        setShowAddVendorModal(false);
        setVendorFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          deliveryAddress: "",
        });
        await refreshProjects();
        alert(
          "Vendor added successfully! Project status updated to pending approval."
        );
      } else {
        console.error("❌ [ADD VENDOR] Failed to add vendor:", result.message);
        alert(`Failed to add vendor: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ [ADD VENDOR] Error adding vendor:", error);
      alert("Error adding vendor. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const projectsResponse = await fetchProjects({
        projectScope: "external",
      });
      if (projectsResponse.success) {
        const externalProjects =
          projectsResponse.data.projects || projectsResponse.data || [];
        setProjects(externalProjects);
        toast.success("Projects refreshed successfully");
      } else {
        toast.error("Failed to refresh projects");
      }
    } catch (error) {
      console.error("Error refreshing projects:", error);
      toast.error("Failed to refresh projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchElraWalletBudget = async () => {
    try {
      const response = await fetch("/api/projects/budget", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setElraWalletBudget(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching ELRA wallet budget:", error);
    }
  };

  // Document upload functions
  const handleUploadDocument = (project) => {
    console.log(
      "📄 [UPLOAD DOCUMENT] Upload document button clicked for project:",
      project
    );
    setSelectedProjectForDocument(project);
    setDocumentFormData({
      title: "",
      description: "",
      category: "Project Documentation",
      documentType: "",
      priority: "Medium",
      tags: "",
      isConfidential: false,
    });
    setSelectedFiles([]);
    setShowDocumentModal(true);
  };

  const closeDocumentModal = async () => {
    setShowDocumentModal(false);
    setSelectedProjectForDocument(null);
    setSelectedFiles([]);
    setDocumentFormData({
      title: "",
      description: "",
      category: "Project Documentation",
      documentType: "",
      priority: "Medium",
      tags: "",
      isConfidential: false,
    });
    setIsUploadingDocument(false);
    setUploadProgress(0);
  };

  const handleDocumentUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
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

      // Upload each file
      for (const fileWrapper of selectedFiles) {
        const file = fileWrapper.file || fileWrapper;
        const uploadData = new FormData();
        uploadData.append("document", file);
        uploadData.append("title", documentFormData.title || file.name);
        uploadData.append("description", documentFormData.description);
        uploadData.append("documentType", documentFormData.documentType);
        uploadData.append("projectId", selectedProjectForDocument.id);
        uploadData.append("isConfidential", documentFormData.isConfidential);
        uploadData.append("category", documentFormData.category);
        uploadData.append("priority", documentFormData.priority);

        const result = await uploadDocument(uploadData);
        if (!result.success) {
          throw new Error(result.message || "Failed to upload document");
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(
        `${selectedFiles.length} document(s) uploaded successfully for project "${selectedProjectForDocument.name}"!`
      );

      await refreshData();
      closeDocumentModal();
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setIsUploadingDocument(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            External Project Management
          </h1>
          <p className="text-white/80">
            Create and manage external projects for clients and vendors
          </p>
        </div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[var(--elra-primary)]/10 rounded-xl flex items-center justify-center">
                <GlobeAltIcon className="h-6 w-6 text-[var(--elra-primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  External Projects
                </h2>
                <p className="text-gray-600 text-sm">
                  Manage client projects and vendor relationships
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowCreateModal(true);
                setShowBubbles(true);
                setTimeout(() => setShowBubbles(false), 2000);
              }}
              className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-[var(--elra-primary-dark)] transition-colors font-semibold shadow-lg"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create External Project</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  Total Projects
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {projects.length}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* In Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">
                  In Progress
                </p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {projects.filter((p) => p.status === "in_progress").length}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Pending Approval */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border border-yellow-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">
                  Pending Approval
                </p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">
                  {
                    projects.filter((p) => p.status === "pending_approval")
                      .length
                  }
                </p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Total Budget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
                  Total Budget
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-2">
                  {formatCurrency(
                    projects.reduce((sum, p) => sum + p.budget, 0)
                  )}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, clients, or project codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="lg:w-48">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshProjects}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </motion.div>

        {/* Projects DataTable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-full overflow-hidden"
        >
          <DataTable
            data={filteredProjects}
            columns={columns}
            loading={loading}
            searchable={true}
            sortable={true}
            pagination={true}
            itemsPerPage={10}
            actions={{
              onEdit: null,
              onDelete: null,
              onToggle: null,
              showEdit: false,
              showDelete: false,
              showToggle: false,
              customActions: (row) => (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewProject(row)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  {row.status === "pending_vendor_assignment" &&
                    (user?.department?.name === "Project Management" ||
                      user?.role?.level >= 1000) && (
                      <button
                        onClick={() => handleAddVendor(row)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Add Vendor"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </button>
                    )}
                  <button
                    onClick={() => handleUploadDocument(row)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Upload Document"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                  </button>
                </div>
              ),
            }}
            emptyState={{
              icon: <GlobeAltIcon className="h-12 w-12 text-gray-400" />,
              title: "No external projects found",
              description:
                searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first external project",
              actionButton:
                !searchTerm &&
                statusFilter === "all" &&
                priorityFilter === "all" ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                  >
                    Create External Project
                  </button>
                ) : null,
            }}
          />
        </motion.div>

        {/* Project Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedProject && (
            <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 w-full max-w-7xl max-h-[95vh] overflow-y-auto modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
                {/* ELRA Branded Header */}
                <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl -m-8 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                        <GlobeAltIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {selectedProject.name}
                        </h2>
                        <p className="text-white/80 text-sm">
                          Project Code: {selectedProject.code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Project Info */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Project Code
                      </label>
                      <p className="text-gray-900 font-mono">
                        {selectedProject.code}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Category
                      </label>
                      <p className="text-gray-900">
                        {selectedProject.category}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Priority
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          selectedProject.priority
                        )}`}
                      >
                        {selectedProject.priority.charAt(0).toUpperCase() +
                          selectedProject.priority.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusInfo(selectedProject.status).color
                        }`}
                      >
                        {getStatusInfo(selectedProject.status).label}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Budget
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {formatCurrency(selectedProject.budget)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Progress
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${selectedProject.progress || 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {selectedProject.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                      Client Information
                    </h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Client Name
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedProject.clientName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Company
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedProject.clientCompany}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Email
                        </label>
                        <p className="text-gray-900">
                          {selectedProject.clientEmail}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Phone
                        </label>
                        <p className="text-gray-900">
                          {selectedProject.clientPhone || "Not provided"}
                        </p>
                      </div>
                      {selectedProject.clientAddress && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-600">
                            Address
                          </label>
                          <p className="text-gray-900">
                            {selectedProject.clientAddress}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vendor Information */}
                  {selectedProject.vendorId ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Vendor Information
                      </h4>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Vendor Name
                          </label>
                          <p className="text-gray-900 font-medium">
                            {selectedProject.vendorId?.name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Email
                          </label>
                          <p className="text-gray-900">
                            {selectedProject.vendorId?.email}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Phone
                          </label>
                          <p className="text-gray-900">
                            {selectedProject.vendorId?.phone || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Address
                          </label>
                          <p className="text-gray-900">
                            {selectedProject.vendorId?.address
                              ? typeof selectedProject.vendorId.address ===
                                "string"
                                ? selectedProject.vendorId.address
                                : `${
                                    selectedProject.vendorId.address.street ||
                                    ""
                                  }, ${
                                    selectedProject.vendorId.address.city || ""
                                  }, ${
                                    selectedProject.vendorId.address.state || ""
                                  }, ${
                                    selectedProject.vendorId.address.country ||
                                    ""
                                  }`
                                    .replace(/^,\s*|,\s*$/g, "")
                                    .replace(/,\s*,/g, ",")
                              : "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        No Vendor Assigned
                      </h4>
                      <p className="text-red-700">
                        This project requires a vendor to be assigned before it
                        can proceed with the approval process.
                      </p>
                    </div>
                  )}

                  {/* Budget Allocation Information */}
                  {selectedProject.requiresBudgetAllocation &&
                    selectedProject.budgetPercentage && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Budget Allocation Agreement
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              ELRA Handles
                            </label>
                            <p className="text-green-700 font-semibold">
                              {selectedProject.budgetPercentage}%
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Client Handles
                            </label>
                            <p className="text-blue-700 font-semibold">
                              {100 - selectedProject.budgetPercentage}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Description */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Project Description
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedProject.description}
                    </p>
                  </div>

                  {/* Project Items */}
                  {selectedProject.projectItems &&
                    selectedProject.projectItems.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Project Items
                        </h4>
                        <div className="space-y-4">
                          {selectedProject.projectItems.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-start p-4 bg-white rounded-lg border border-purple-100 shadow-sm"
                            >
                              <div className="flex-1">
                                <div className="flex items-start space-x-3">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg
                                      className="w-4 h-4 text-purple-600"
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
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-lg">
                                      {item.name}
                                    </p>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {item.description}
                                      </p>
                                    )}
                                    <div className="flex items-center space-x-4 mt-2">
                                      <span className="text-sm text-gray-500">
                                        <span className="font-medium">
                                          Qty:
                                        </span>{" "}
                                        {item.quantity}
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        <span className="font-medium">
                                          Unit Price:
                                        </span>{" "}
                                        {formatCurrency(item.unitPrice)}
                                      </span>
                                      {item.deliveryTimeline && (
                                        <span className="text-sm text-gray-500">
                                          <span className="font-medium">
                                            Delivery:
                                          </span>{" "}
                                          {item.deliveryTimeline}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-purple-600">
                                  {formatCurrency(item.totalPrice)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Create External Project Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col border border-gray-100 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Animated Bubbles */}
                <AnimatedBubbles isVisible={showBubbles} />

                {/* Header - Fixed Position */}
                <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 rounded-t-3xl flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                          <GlobeAltIcon className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                            Create External Project
                          </h2>
                          <p className="text-white/90 mt-2 text-lg">
                            Set up a new external project with client and vendor
                            information
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
                      >
                        <svg
                          className="w-6 h-6"
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
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Project Code Display */}
                  {nextProjectCode && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleCreateProject} className="space-y-6">
                    {/* SECTION 1: BASIC PROJECT INFORMATION */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Basic Project Information
                      </h3>

                      <div className="space-y-4">
                        {/* Project Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            placeholder="e.g., Dangote Group - Training System Implementation"
                            required
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            placeholder="Describe the project objectives, scope, and deliverables..."
                          />
                        </div>

                        {/* Category, Priority, Budget, Dates in one row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Category <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="category"
                              value={formData.category}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              required
                            >
                              <option value="">Select Category</option>
                              {projectCategories && projectCategories.length > 0
                                ? projectCategories
                                    .filter((cat) => cat.value !== "all")
                                    .map((category) => (
                                      <option
                                        key={category.value}
                                        value={category.value}
                                      >
                                        {category.label}
                                      </option>
                                    ))
                                : UNIFIED_CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                      {CATEGORY_DISPLAY_NAMES[category] ||
                                        category}
                                    </option>
                                  ))}
                            </select>
                          </div>

                          {/* Custom Category Input - appears when "Other" is selected */}
                          {formData.category === "other" && (
                            <div className="col-span-full">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Specify Category{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="customCategory"
                                value={formData.customCategory}
                                onChange={handleInputChange}
                                placeholder="e.g., Custom Software Solution, Specialized Equipment, etc."
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                required
                              />
                              <p className="mt-1 text-sm text-gray-600">
                                Please specify the exact category for this
                                project.
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Priority <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="priority"
                              value={formData.priority}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              required
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                              <option value="urgent">Urgent Priority</option>
                              <option value="critical">
                                Critical Priority
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Budget (₦) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="budget"
                              value={formData.budget}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  budget: formatNumberWithCommas(
                                    e.target.value
                                  ),
                                })
                              }
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              placeholder="e.g., 25,000,000"
                              required
                            />
                            {formData.budget &&
                              getApprovalLevelText(formData.budget) && (
                                <p
                                  className={`mt-1 text-xs font-medium ${
                                    getApprovalLevelText(formData.budget).color
                                  }`}
                                >
                                  {getApprovalLevelText(formData.budget).text}
                                </p>
                              )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              required
                            />
                          </div>
                        </div>

                        {/* End Date */}
                        <div className="max-w-xs">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            min={
                              formData.startDate ||
                              new Date().toISOString().split("T")[0]
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Project Items Section */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Project Items & Specifications
                      </h3>
                      <p className="text-sm text-purple-600 mb-4">
                        List all items, services, or deliverables required for
                        this project.
                      </p>

                      {projectItems.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white border border-purple-300 rounded-lg p-4 mb-4"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-md font-semibold text-gray-800">
                              Item #{index + 1}
                            </h4>
                            {projectItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeProjectItem(index)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 group"
                                title="Remove this item"
                              >
                                <svg
                                  className="h-4 w-4"
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
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Item Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                  handleProjectItemChange(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Laptop, Software License, Consulting Hours"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Description
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  handleProjectItemChange(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Brief description of the item"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Quantity <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleProjectItemChange(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                min="1"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Unit Price (₦){" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleProjectItemChange(
                                    index,
                                    "unitPrice",
                                    formatNumberWithCommas(e.target.value)
                                  )
                                }
                                placeholder="e.g., 1,500,000"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Delivery Timeline
                              </label>
                              <input
                                type="text"
                                value={item.deliveryTimeline}
                                onChange={(e) =>
                                  handleProjectItemChange(
                                    index,
                                    "deliveryTimeline",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., 2 weeks, 1 month"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              />
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="mt-3 p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">
                              Total for this item:
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addProjectItem}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                        title="Add another project item"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span>Add Item</span>
                      </button>

                      {/* Overall Project Total */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-300 rounded-xl">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xl font-bold text-purple-800">
                            Total Project Cost:
                          </h4>
                          <span className="text-2xl font-extrabold text-purple-900">
                            {formatCurrency(
                              projectItems.reduce(
                                (sum, item) => sum + item.totalPrice,
                                0
                              )
                            )}
                          </span>
                        </div>

                        {/* Budget Balance Info */}
                        {formData.budget &&
                          projectItems.some(
                            (item) => item.name && item.unitPrice
                          ) && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-purple-700 font-medium">
                                  Project Budget:
                                </span>
                                <span className="text-purple-800 font-semibold">
                                  {formatCurrency(
                                    parseFormattedNumber(formData.budget)
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-purple-700 font-medium">
                                  Remaining Budget:
                                </span>
                                <span
                                  className={`font-semibold ${
                                    parseFormattedNumber(formData.budget) -
                                      projectItems.reduce(
                                        (sum, item) => sum + item.totalPrice,
                                        0
                                      ) >=
                                    0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatCurrency(
                                    parseFormattedNumber(formData.budget) -
                                      projectItems.reduce(
                                        (sum, item) => sum + item.totalPrice,
                                        0
                                      )
                                  )}
                                </span>
                              </div>
                              {parseFormattedNumber(formData.budget) -
                                projectItems.reduce(
                                  (sum, item) => sum + item.totalPrice,
                                  0
                                ) <
                                0 && (
                                <p className="text-xs text-red-600 mt-2 font-medium">
                                  ⚠️ Items cost exceeds project budget
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Client Information Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-6"
                    >
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        Client Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Client Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleInputChange}
                            placeholder="e.g., John Doe"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Client Company{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="clientCompany"
                            value={formData.clientCompany}
                            onChange={handleInputChange}
                            placeholder="e.g., Dangote Group"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Client Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="clientEmail"
                            value={formData.clientEmail}
                            onChange={handleInputChange}
                            placeholder="e.g., john.doe@dangote.com"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Client Phone
                          </label>
                          <input
                            type="tel"
                            name="clientPhone"
                            value={formData.clientPhone}
                            onChange={handleInputChange}
                            placeholder="e.g., +234 801 234 5678"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Client Address
                        </label>
                        <textarea
                          name="clientAddress"
                          value={formData.clientAddress}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Enter client's business address..."
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                        />
                      </div>
                    </motion.div>

                    {/* Budget Allocation and Vendor Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      className="space-y-4"
                    >
                      {/* Budget Allocation */}
                      <div
                        className={`border rounded-xl p-4 ${
                          !canUseBudgetAllocation
                            ? "bg-red-50 border-red-200"
                            : "bg-green-50 border-green-200"
                        }`}
                      >
                        {/* Budget Validation Messages */}
                        {itemsExceedBudget && (
                          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-red-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                  Budget Allocation Not Available
                                </h3>
                                <div className="mt-1 text-sm text-red-700">
                                  <p>
                                    Project items cost (₦
                                    {totalItemsCost.toLocaleString()}) exceeds
                                    total budget (₦
                                    {projectBudget.toLocaleString()}).
                                  </p>
                                  <p className="mt-1">
                                    Please reduce items cost or increase budget
                                    to enable budget allocation.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {itemsExceedElraContribution && (
                          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-yellow-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                  ELRA Contribution Insufficient
                                </h3>
                                <div className="mt-1 text-sm text-yellow-700">
                                  <p>
                                    Project items cost (₦
                                    {totalItemsCost.toLocaleString()}) exceeds
                                    ELRA's contribution (₦
                                    {elraContribution.toLocaleString()}).
                                  </p>
                                  <p className="mt-1">
                                    Please increase ELRA percentage or reduce
                                    items cost.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {elraWalletInsufficient && (
                          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-red-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                  Insufficient ELRA Project Budget
                                </h3>
                                <div className="mt-1 text-sm text-red-700">
                                  <p>
                                    ELRA wallet has ₦
                                    {elraWalletBudget?.available?.toLocaleString() ||
                                      "0"}{" "}
                                    available for projects.
                                  </p>
                                  <p>
                                    Required for this project: ₦
                                    {elraContribution.toLocaleString()}
                                  </p>
                                  <p className="mt-1 font-medium">
                                    Contact Finance HOD to allocate more project
                                    budget.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="requiresBudgetAllocation"
                            checked={
                              formData.requiresBudgetAllocation === "true"
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requiresBudgetAllocation: e.target.checked
                                  ? "true"
                                  : "false",
                              })
                            }
                            disabled={!canToggleBudgetAllocation}
                            className={`h-5 w-5 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded ${
                              !canToggleBudgetAllocation
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          />
                          <span
                            className={`ml-3 block text-sm font-semibold ${
                              !canToggleBudgetAllocation
                                ? "text-gray-400"
                                : "text-gray-700"
                            }`}
                          >
                            Request Budget Allocation for this project
                            {!canToggleBudgetAllocation &&
                              " (Not available - no budget set)"}
                          </span>
                        </label>
                        <p
                          className={`mt-2 text-sm ${
                            !canUseBudgetAllocation
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {formData.requiresBudgetAllocation === "true"
                            ? "Project will go through Legal → Finance Review → Executive → Budget Allocation approval."
                            : "Project will go through Legal → Executive approval (using existing budget)."}
                        </p>

                        {/* Budget Breakdown Display */}
                        {formData.requiresBudgetAllocation === "true" &&
                          projectBudget > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="text-sm font-semibold text-blue-800 mb-3">
                                💰 Budget Breakdown
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-blue-700 font-medium">
                                    Total Budget:
                                  </span>
                                  <div className="text-blue-900 font-semibold">
                                    ₦{projectBudget.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-blue-700 font-medium">
                                    Items Cost:
                                  </span>
                                  <div className="text-blue-900 font-semibold">
                                    ₦{totalItemsCost.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-green-700 font-medium">
                                    ELRA Pays ({budgetPercentage}%):
                                  </span>
                                  <div className="text-green-900 font-semibold">
                                    ₦{elraContribution.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-purple-700 font-medium">
                                    Client Pays ({100 - budgetPercentage}%):
                                  </span>
                                  <div className="text-purple-900 font-semibold">
                                    ₦{clientContribution.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Budget Percentage - Only show when budget allocation is TRUE */}
                        {formData.requiresBudgetAllocation === "true" && (
                          <div className="mt-4 p-4 bg-white border border-green-300 rounded-lg">
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              ELRA Budget Handling Percentage{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                name="budgetPercentage"
                                value={formData.budgetPercentage}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  if (inputValue === "") {
                                    setFormData({
                                      ...formData,
                                      budgetPercentage: "",
                                    });
                                  } else {
                                    const value = Math.max(
                                      0,
                                      Math.min(100, parseInt(inputValue) || 0)
                                    );
                                    setFormData({
                                      ...formData,
                                      budgetPercentage: value,
                                    });
                                  }
                                }}
                                min="0"
                                max="100"
                                step="1"
                                placeholder="100"
                                className="w-24 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                required
                              />
                              <span className="text-sm text-gray-600">
                                % of items cost
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-green-600">
                              Specify what percentage of the actual project
                              items cost ELRA will be responsible for handling
                              and managing.
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Note: The percentage is applied to the actual
                              items cost (₦{totalItemsCost.toLocaleString()}),
                              not the total budget (₦
                              {projectBudget.toLocaleString()}
                              ). This ensures you only pay for what's actually
                              being delivered.
                            </p>
                            {formData.budget &&
                              formData.budgetPercentage &&
                              formData.budgetPercentage > 0 && (
                                <div className="mt-2 p-2 bg-green-100 rounded-lg">
                                  <p className="text-sm font-medium text-green-800">
                                    ELRA will handle:{" "}
                                    <strong>
                                      ₦
                                      {formatNumberWithCommas(
                                        (totalItemsCost *
                                          formData.budgetPercentage) /
                                          100
                                      )}
                                    </strong>
                                  </p>
                                  {formData.budgetPercentage &&
                                    formData.budgetPercentage < 100 && (
                                      <p className="text-sm font-medium text-green-800">
                                        Client will handle:{" "}
                                        <strong>
                                          ₦
                                          {formatNumberWithCommas(
                                            (totalItemsCost *
                                              (100 -
                                                formData.budgetPercentage)) /
                                              100
                                          )}
                                        </strong>
                                      </p>
                                    )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Vendor Information */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Vendor Information
                        </h3>

                        <div className="mb-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="hasVendor"
                              checked={formData.hasVendor}
                              onChange={handleInputChange}
                              className="mr-2 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] rounded"
                            />
                            <span className="text-sm font-semibold">
                              Client has a preferred vendor/supplier
                            </span>
                          </label>
                        </div>

                        {formData.hasVendor && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Vendor Name
                              </label>
                              <input
                                type="text"
                                name="vendorName"
                                value={formData.vendorName}
                                onChange={handleInputChange}
                                placeholder="e.g., Microsoft, Oracle, etc."
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Vendor Email
                              </label>
                              <input
                                type="email"
                                name="vendorEmail"
                                value={formData.vendorEmail}
                                onChange={handleInputChange}
                                placeholder="e.g., contact@microsoft.com"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Vendor Phone
                              </label>
                              <input
                                type="tel"
                                name="vendorPhone"
                                value={formData.vendorPhone}
                                onChange={handleInputChange}
                                placeholder="e.g., +1 555 123 4567"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Vendor Address
                              </label>
                              <textarea
                                name="vendorAddress"
                                value={formData.vendorAddress}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="Enter vendor's address..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Delivery Address
                              </label>
                              <textarea
                                name="deliveryAddress"
                                value={formData.deliveryAddress}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="Enter delivery address for project items..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Form Footer with Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        disabled={submitting}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        Cancel
                      </button>
                      <div className="relative">
                        <button
                          type="submit"
                          disabled={isCreateButtonDisabled}
                          className="px-8 py-3 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-xl font-semibold hover:from-[var(--elra-primary-dark)] hover:to-[var(--elra-primary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                          title={
                            hasValidationErrors
                              ? "Please fix budget validation errors before creating project"
                              : !allRequiredFieldsFilled
                              ? "Please fill in all required fields before creating project"
                              : "Create the external project"
                          }
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Creating...</span>
                            </>
                          ) : (
                            <>
                              <span>Create Project</span>
                            </>
                          )}
                        </button>
                        {hasValidationErrors && (
                          <div className="absolute -top-12 left-0 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                            Fix budget errors to continue
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Vendor Modal */}
        {showAddVendorModal && selectedProject && (
          <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
              {/* ELRA Branded Header */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl -m-8 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Add Vendor to Project
                      </h2>
                      <p className="text-white/80 text-sm">
                        {selectedProject.name} - {selectedProject.code}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddVendorModal(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmitVendor} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={vendorFormData.name}
                      onChange={handleVendorInputChange}
                      placeholder="Enter vendor company name..."
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={vendorFormData.email}
                      onChange={handleVendorInputChange}
                      placeholder="vendor@company.com"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={vendorFormData.phone}
                      onChange={handleVendorInputChange}
                      placeholder="e.g., +1 555 123 4567"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Vendor Address
                    </label>
                    <textarea
                      name="address"
                      value={vendorFormData.address}
                      onChange={handleVendorInputChange}
                      rows={2}
                      placeholder="Enter vendor's business address..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Delivery Address
                    </label>
                    <textarea
                      name="deliveryAddress"
                      value={vendorFormData.deliveryAddress}
                      onChange={handleVendorInputChange}
                      rows={2}
                      placeholder="Enter delivery address for project items..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddVendorModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !vendorFormData.name ||
                      !vendorFormData.email
                    }
                    className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Adding Vendor...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span>Add Vendor</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Upload Modal */}
        {showDocumentModal && selectedProjectForDocument && (
          <div className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-6xl max-h-[95vh] overflow-y-auto modal-shadow-enhanced border border-gray-100 transform transition-all duration-300 ease-out">
              {/* ELRA Branded Header */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl -m-8 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <ELRALogo variant="dark" size="sm" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Upload Documents for Project
                    </h2>
                    <p className="text-white/80 text-sm">
                      {selectedProjectForDocument.name} -{" "}
                      {selectedProjectForDocument.code}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDocumentModal}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Document Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={documentFormData.title}
                      onChange={(e) =>
                        setDocumentFormData({
                          ...documentFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      placeholder="Enter document title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      value={documentFormData.documentType}
                      onChange={(e) =>
                        setDocumentFormData({
                          ...documentFormData,
                          documentType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    >
                      <option value="">Select document type</option>
                      <option value="Contract">Contract</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Report">Report</option>
                      <option value="Specification">Specification</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={documentFormData.priority}
                      onChange={(e) =>
                        setDocumentFormData({
                          ...documentFormData,
                          priority: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={documentFormData.category}
                      onChange={(e) =>
                        setDocumentFormData({
                          ...documentFormData,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    >
                      <option value="Project Documentation">
                        Project Documentation
                      </option>
                      <option value="Legal Documents">Legal Documents</option>
                      <option value="Financial Documents">
                        Financial Documents
                      </option>
                      <option value="Technical Specifications">
                        Technical Specifications
                      </option>
                      <option value="Reports">Reports</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={documentFormData.description}
                    onChange={(e) =>
                      setDocumentFormData({
                        ...documentFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    placeholder="Enter document description"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isConfidential"
                    checked={documentFormData.isConfidential}
                    onChange={(e) =>
                      setDocumentFormData({
                        ...documentFormData,
                        isConfidential: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isConfidential"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Mark as confidential
                  </label>
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Documents
                  </label>
                  <SmartFileUpload
                    files={selectedFiles}
                    onFilesChange={setSelectedFiles}
                    maxFiles={10}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6"
                  />
                </div>

                {/* Upload Progress */}
                {isUploadingDocument && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        Uploading documents...
                      </span>
                      <span className="text-sm text-blue-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeDocumentModal}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isUploadingDocument}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDocumentUpload}
                    disabled={selectedFiles.length === 0 || isUploadingDocument}
                    className="px-6 py-2 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isUploadingDocument ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2 inline-block" />
                        Upload Documents
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalProjectManagement;
