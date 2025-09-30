import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";
import {
  createProject,
  fetchProjects,
  getNextProjectCode,
  fetchProjectCategories,
} from "../../../../services/projectAPI";
import { uploadDocument } from "../../../../services/documents";
import {
  PlusIcon,
  UserGroupIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  XMarkIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { HiDocument } from "react-icons/hi2";
import SmartFileUpload from "../../../../components/common/SmartFileUpload";
import { motion, AnimatePresence } from "framer-motion";
import DataTable from "../../../../components/common/DataTable";
import {
  formatNumberWithCommas,
  parseFormattedNumber,
  formatCurrency,
} from "../../../../utils/formatters.js";

const DepartmentProjects = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nextProjectCode, setNextProjectCode] = useState("");
  const [projectCategories, setProjectCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Document upload states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDocumentViewModal, setShowDocumentViewModal] = useState(false);
  const [selectedProjectForDocument, setSelectedProjectForDocument] =
    useState(null);

  // Project details modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documentFormData, setDocumentFormData] = useState({
    title: "",
    description: "",
    category: "project",
    documentType: "",
    priority: "Medium",
    tags: "",
    isConfidential: false,
  });
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentDocumentStep, setCurrentDocumentStep] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [wizardFormData, setWizardFormData] = useState({});

  // Required documents for departmental projects
  const requiredDocuments = [
    {
      documentType: "project_proposal",
      title: "Project Proposal Document",
      description:
        "Complete project proposal with objectives, scope, and detailed description",
      category: "project",
      priority: "High",
    },
    {
      documentType: "budget_breakdown",
      title: "Budget & Financial Plan",
      description:
        "Detailed budget breakdown, cost analysis, and financial justification",
      category: "financial",
      priority: "High",
    },
    {
      documentType: "technical_specifications",
      title: "Technical & Implementation Plan",
      description:
        "Technical specifications, implementation timeline, and resource requirements",
      category: "technical",
      priority: "High",
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    startDate: "",
    endDate: "",
    priority: "medium",
    category: "",
    requiresBudgetAllocation: false,
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
    vendorAddress: "",
    projectItems: [
      {
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        category: "office_equipment",
      },
    ],
  });

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      loadNextProjectCode();
    }
  }, [showCreateModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetchProjects({ projectScope: "departmental" });
      if (response.success) {
        setProjects(response.data || []);
      } else {
        console.error(
          "Failed to fetch departmental projects:",
          response.message
        );
        setProjects([]);
      }
    } catch (error) {
      console.error("Error loading departmental projects:", error);
      toast.error("Failed to load departmental projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetchProjectCategories();
      if (response.success) {
        setProjectCategories(response.categories || []);
      } else {
        console.warn("Failed to fetch categories:", response.message);
        // Fallback categories for departmental projects
        setProjectCategories([
          { value: "internal_training", label: "Internal Training" },
          { value: "department_development", label: "Department Development" },
          { value: "process_improvement", label: "Process Improvement" },
          { value: "team_building", label: "Team Building" },
          { value: "skill_development", label: "Skill Development" },
          { value: "research_development", label: "Research & Development" },
          { value: "system_upgrade", label: "System Upgrade" },
          { value: "compliance_training", label: "Compliance Training" },
          { value: "leadership_development", label: "Leadership Development" },
          { value: "innovation_projects", label: "Innovation Projects" },
          { value: "department_equipment", label: "Department Equipment" },
          { value: "workspace_improvement", label: "Workspace Improvement" },
          { value: "technology_adoption", label: "Technology Adoption" },
          { value: "quality_improvement", label: "Quality Improvement" },
          {
            value: "sustainability_projects",
            label: "Sustainability Projects",
          },
          { value: "other", label: "Other" },
        ]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setProjectCategories([
        { value: "internal_training", label: "Internal Training" },
        { value: "department_development", label: "Department Development" },
        { value: "process_improvement", label: "Process Improvement" },
        { value: "team_building", label: "Team Building" },
        { value: "skill_development", label: "Skill Development" },
        { value: "research_development", label: "Research & Development" },
        { value: "system_upgrade", label: "System Upgrade" },
        { value: "compliance_training", label: "Compliance Training" },
        { value: "leadership_development", label: "Leadership Development" },
        { value: "innovation_projects", label: "Innovation Projects" },
        { value: "department_equipment", label: "Department Equipment" },
        { value: "workspace_improvement", label: "Workspace Improvement" },
        { value: "technology_adoption", label: "Technology Adoption" },
        { value: "quality_improvement", label: "Quality Improvement" },
        { value: "sustainability_projects", label: "Sustainability Projects" },
        { value: "other", label: "Other" },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadNextProjectCode = async () => {
    try {
      const response = await getNextProjectCode();
      if (response.success) {
        setNextProjectCode(response.data.nextCode);
      }
    } catch (error) {
      console.error("Error fetching next project code:", error);
    }
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleInputChange = (field, value) => {
    if (field === "budget") {
      // Format budget with commas
      setFormData((prev) => ({
        ...prev,
        [field]: formatNumberWithCommas(value),
      }));
    } else if (field === "startDate" || field === "endDate") {
      // Validate dates
      const today = new Date().toISOString().split("T")[0];
      if (field === "startDate" && value < today) {
        toast.error("Start date cannot be in the past");
        return;
      }
      if (
        field === "endDate" &&
        formData.startDate &&
        value < formData.startDate
      ) {
        toast.error("End date cannot be before start date");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.projectItems];

    if (field === "unitPrice") {
      // Format unit price with commas
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: formatNumberWithCommas(value),
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
    }

    // Calculate total price for this item
    if (field === "quantity" || field === "unitPrice") {
      const quantity =
        field === "quantity"
          ? value === ""
            ? 0
            : parseInt(value) || 0
          : updatedItems[index].quantity === ""
          ? 0
          : parseInt(updatedItems[index].quantity) || 0;
      const unitPrice =
        field === "unitPrice"
          ? parseFormattedNumber(value) || 0
          : parseFormattedNumber(updatedItems[index].unitPrice);
      updatedItems[index].totalPrice = quantity * unitPrice;
    }

    setFormData((prev) => ({
      ...prev,
      projectItems: updatedItems,
    }));
  };

  const addProjectItem = () => {
    setFormData((prev) => ({
      ...prev,
      projectItems: [
        ...prev.projectItems,
        {
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          category: "office_equipment",
        },
      ],
    }));
  };

  const removeProjectItem = (index) => {
    if (formData.projectItems.length > 1) {
      const updatedItems = formData.projectItems.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        projectItems: updatedItems,
      }));
    }
  };

  const calculateTotalCost = () => {
    return formData.projectItems.reduce((total, item) => {
      return (
        total +
        (parseFormattedNumber(item.unitPrice) || 0) *
          (item.quantity === "" ? 0 : parseInt(item.quantity) || 0)
      );
    }, 0);
  };

  const isItemValid = (item) => {
    const hasName = item.name && item.name.trim() !== "";
    const hasValidQuantity = item.quantity > 0;
    const hasValidPrice = parseFormattedNumber(item.unitPrice) > 0;
    return hasName && hasValidQuantity && hasValidPrice;
  };

  const isFormValid = () => {
    // Basic field validation
    const basicFieldsValid =
      formData.name &&
      formData.description &&
      formData.startDate &&
      formData.endDate &&
      formData.budget &&
      formData.category &&
      formData.priority;

    // Project items validation - check each item individually
    const itemsValid = formData.projectItems.every((item, index) => {
      const hasName = item.name && item.name.trim() !== "";
      const hasValidQuantity = item.quantity > 0;
      const hasValidPrice = parseFormattedNumber(item.unitPrice) > 0;

      if (!hasName) {
        console.log(`❌ [VALIDATION] Item ${index + 1}: Missing name`);
      }
      if (!hasValidQuantity) {
        console.log(
          `❌ [VALIDATION] Item ${index + 1}: Invalid quantity (${
            item.quantity
          })`
        );
      }
      if (!hasValidPrice) {
        console.log(
          `❌ [VALIDATION] Item ${index + 1}: Invalid unit price (${
            item.unitPrice
          })`
        );
      }

      return hasName && hasValidQuantity && hasValidPrice;
    });

    // Budget validation
    const totalItemsCost = calculateTotalCost();
    const budgetAmount = parseFormattedNumber(formData.budget) || 0;
    const budgetValid = totalItemsCost <= budgetAmount;

    // Date validation
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const dateValid = endDate > startDate;

    console.log("🔍 [VALIDATION] Form validation check:", {
      basicFieldsValid,
      itemsValid,
      budgetValid,
      dateValid,
      totalItemsCost,
      budgetAmount,
    });

    return basicFieldsValid && itemsValid && budgetValid && dateValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      const totalItemsCost = calculateTotalCost();
      const budgetAmount = parseFormattedNumber(formData.budget) || 0;

      if (totalItemsCost > budgetAmount) {
        toast.error(
          `Items cost (${formatCurrency(
            totalItemsCost
          )}) exceeds budget (${formatCurrency(
            budgetAmount
          )}). Please reduce items cost or increase budget.`
        );
      } else {
        toast.error(
          "Please fill in all required fields and ensure all project items have valid names, quantities, and prices."
        );
      }
      return;
    }

    setCreating(true);

    try {
      const totalItemsCost = calculateTotalCost();

      const projectData = {
        ...formData,
        budget: parseFormattedNumber(formData.budget) || totalItemsCost,
        projectScope: "departmental",
        department: user.department?._id,
        requiresBudgetAllocation: formData.requiresBudgetAllocation,
        totalItemsCost,
        elraFundingAmount: formData.requiresBudgetAllocation
          ? totalItemsCost
          : 0,
      };

      console.log("Creating departmental project:", projectData);

      const response = await createProject(projectData);

      if (response.success) {
        toast.success("Departmental project created successfully!");
        setShowCreateModal(false);
        resetForm();
        loadData();
      } else {
        toast.error(
          response.message || "Failed to create departmental project"
        );
      }
    } catch (error) {
      console.error("Error creating departmental project:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create departmental project";
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      budget: "",
      startDate: "",
      endDate: "",
      priority: "medium",
      category: "",
      requiresBudgetAllocation: false,
      vendorName: "",
      vendorEmail: "",
      vendorPhone: "",
      vendorAddress: "",
      projectItems: [
        {
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          category: "office_equipment",
        },
      ],
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  // Document handling functions
  const handleUploadDocument = (project) => {
    console.log(
      "📄 [UPLOAD DOCUMENT] Upload document button clicked for project:",
      project
    );
    setSelectedProjectForDocument(project);
    setCurrentDocumentStep(0);
    setUploadedDocuments([]);
    setWizardFormData({});
    setDocumentFormData({
      title: "",
      description: "",
      category: "project",
      documentType: "",
      priority: "Medium",
      tags: "",
      isConfidential: false,
    });
    setSelectedFiles([]);
    setIsUploadingDocument(false);
    setUploadProgress(0);
    setShowDocumentModal(true);
  };

  const handleViewDocuments = (project) => {
    console.log(
      "📄 [VIEW DOCUMENTS] View documents button clicked for project:",
      project
    );
    console.log(
      "📄 [REQUIRED DOCUMENTS] Required documents array:",
      project.requiredDocuments
    );
    console.log(
      "📄 [DOCUMENT COUNT] Total required documents:",
      project.requiredDocuments?.length || 0
    );
    console.log(
      "📄 [SUBMITTED DOCUMENTS] Submitted documents:",
      project.requiredDocuments?.filter((doc) => doc.isSubmitted)?.length || 0
    );
    setSelectedProjectForDocument(project);
    setShowDocumentViewModal(true);
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      setDownloadingDocumentId(documentId);
      const url = `/api/documents/${documentId}/view`;
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    } finally {
      setTimeout(() => {
        setDownloadingDocumentId(null);
      }, 1000);
    }
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedProjectForDocument(null);
    setSelectedFiles([]);
    setDocumentFormData({
      title: "",
      description: "",
      category: "project",
      documentType: "",
      priority: "Medium",
      tags: "",
      isConfidential: false,
    });
    setCurrentDocumentStep(0);
    setUploadedDocuments([]);
    setWizardFormData({});
    setIsUploadingDocument(false);
    setUploadProgress(0);
  };

  const handleViewProject = (project) => {
    console.log(
      "👁️ [VIEW PROJECT] View project button clicked for project:",
      project
    );
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleDocumentUpload = async () => {
    const allDocuments = [...uploadedDocuments];

    if (selectedFiles.length > 0) {
      const currentDoc = {
        ...requiredDocuments[currentDocumentStep],
        ...wizardFormData,
        files: selectedFiles,
        isConfidential: false, // Departmental projects are not confidential
      };
      allDocuments.push(currentDoc);
    }

    if (allDocuments.length === 0) {
      toast.error("Please upload at least one document");
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

      for (const doc of allDocuments) {
        if (doc.files && doc.files.length > 0) {
          for (const fileWrapper of doc.files) {
            const file = fileWrapper.file || fileWrapper;
            const uploadData = new FormData();
            uploadData.append("document", file);
            uploadData.append("title", doc.title || file.name);
            uploadData.append("description", doc.description);
            uploadData.append("documentType", doc.documentType || "");
            uploadData.append("projectId", selectedProjectForDocument.id);
            uploadData.append("isConfidential", false);
            uploadData.append("category", doc.category);
            uploadData.append("priority", doc.priority);

            const result = await uploadDocument(uploadData);
            if (!result.success) {
              throw new Error(result.message || "Failed to upload document");
            }
          }
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Documents uploaded successfully!");
      closeDocumentModal();
      loadData(); // Refresh projects
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error(error.message || "Failed to upload documents");
    } finally {
      setIsUploadingDocument(false);
      setUploadProgress(0);
    }
  };

  const projectColumns = [
    {
      header: "Project",
      accessor: "name",
      width: "w-80",
      renderer: (project) => (
        <div className="max-w-xs">
          <div
            className="font-semibold text-gray-900 break-words"
            title={project.name}
          >
            {project.name}
          </div>
          <div
            className="text-sm text-gray-500 break-words"
            title={project.description}
          >
            {project.description?.substring(0, 50)}...
          </div>
          <div className="text-xs text-gray-400 mt-1">{project.code}</div>
        </div>
      ),
    },
    {
      header: "Budget",
      accessor: "budget",
      width: "w-32",
      renderer: (project) => (
        <div>
          <span className="font-semibold text-gray-900">
            {formatCurrency(project.budget)}
          </span>
          {project.requiresBudgetAllocation && (
            <div className="text-xs text-green-600 mt-1">
              ELRA Funding: {formatCurrency(project.elraFundingAmount || 0)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      width: "w-40",
      renderer: (project) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        };

        const getStatusColor = (status) => {
          if (status === "implementation" || status === "in_progress") {
            return "bg-green-100 text-green-800";
          } else if (status === "completed") {
            return "bg-blue-100 text-blue-800";
          } else if (status.includes("pending")) {
            return "bg-yellow-100 text-yellow-800";
          } else {
            return "bg-gray-100 text-gray-800";
          }
        };

        return (
          <div className="flex flex-col space-y-1">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                project.status
              )}`}
            >
              {formatStatus(project.status)}
            </span>
            {project.status === "pending_approval" && (
              <span className="text-xs text-blue-600 font-medium">
                • Pending Review
              </span>
            )}
            {project.status === "pending_finance_approval" && (
              <span className="text-xs text-yellow-600 font-medium">
                • Finance Review
              </span>
            )}
            {project.status === "pending_executive_approval" && (
              <span className="text-xs text-purple-600 font-medium">
                • Executive Review
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Vendor",
      accessor: "vendorId",
      width: "w-48",
      renderer: (project) => (
        <div className="flex items-center max-w-xs">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          <div>
            {project.vendorId ? (
              <>
                <span
                  className="text-sm font-medium break-words block"
                  title={project.vendorId.name}
                >
                  {project.vendorId.name}
                </span>
                <span
                  className="text-xs text-gray-500 break-all block"
                  title={project.vendorId.email}
                >
                  {project.vendorId.email}
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
      renderer: (project) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{new Date(project.startDate).toLocaleDateString()}</span>
          </div>
          <div className="text-xs text-gray-500">
            to {new Date(project.endDate).toLocaleDateString()}
          </div>
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
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Department Projects</h1>
                <p className="text-lg text-white/90">
                  Manage internal departmental projects and initiatives
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateProject}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Project</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Projects
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {projects.length || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Projects
              </p>
              <p className="text-3xl font-bold text-green-600">
                {projects.filter(
                  (p) =>
                    p.status === "implementation" || p.status === "in_progress"
                ).length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-purple-600">
                {projects.filter((p) => p.status === "completed").length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-3xl font-bold text-orange-600">
                ₦
                {projects
                  .reduce((total, p) => total + (p.budget || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Projects List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Department Projects
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and track your department's internal projects
          </p>
        </div>

        <DataTable
          data={projects}
          columns={projectColumns}
          loading={loading}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
            customActions: (project) => (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewProject(project)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                {/* Documents Icon - Always show for document management */}
                <button
                  onClick={() => {
                    if (
                      project.requiredDocuments &&
                      project.requiredDocuments.length > 0
                    ) {
                      const submittedCount = project.requiredDocuments.filter(
                        (doc) => doc.isSubmitted
                      ).length;
                      const totalCount = project.requiredDocuments.length;

                      if (submittedCount === totalCount) {
                        // All documents uploaded - show view modal
                        handleViewDocuments(project);
                      } else {
                        // Some or no documents uploaded - show upload wizard
                        handleUploadDocument(project);
                      }
                    } else {
                      // No required documents - show upload wizard
                      handleUploadDocument(project);
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
                    project.requiredDocuments &&
                    project.requiredDocuments.filter((doc) => doc.isSubmitted)
                      .length === project.requiredDocuments.length
                      ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                      : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  }`}
                  title={
                    project.requiredDocuments &&
                    project.requiredDocuments.length > 0
                      ? (() => {
                          const submittedCount =
                            project.requiredDocuments.filter(
                              (doc) => doc.isSubmitted
                            ).length;
                          const totalCount = project.requiredDocuments.length;
                          if (submittedCount === totalCount) {
                            return `View ${submittedCount}/${totalCount} uploaded documents`;
                          } else {
                            return `Upload remaining ${
                              totalCount - submittedCount
                            } of ${totalCount} required documents`;
                          }
                        })()
                      : "Upload Required Documents"
                  }
                >
                  <HiDocument className="h-4 w-4" />
                  {project.requiredDocuments &&
                    project.requiredDocuments.some(
                      (doc) => doc.isSubmitted
                    ) && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {
                          project.requiredDocuments.filter(
                            (doc) => doc.isSubmitted
                          ).length
                        }
                      </span>
                    )}
                </button>
              </div>
            ),
          }}
          emptyState={{
            icon: <UserGroupIcon className="h-12 w-12 text-white" />,
            title: "No projects found",
            description: "No departmental projects have been created yet",
            actionButton: (
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                Create First Project
              </button>
            ),
          }}
        />
      </motion.div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col"
            >
              {/* Branded Modal Header */}
              <div className="relative bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-8 text-white flex-shrink-0">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <BuildingOfficeIcon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">
                          Create Department Project
                        </h3>
                        <p className="text-white/90 mt-1">
                          Create a new internal project for your department
                        </p>
                        {nextProjectCode && (
                          <div className="mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                            <span className="font-medium">Project Code:</span>{" "}
                            {nextProjectCode}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-3 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  {/* Project Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-[var(--elra-primary)]/10 rounded-lg mr-4">
                        <DocumentTextIcon className="h-6 w-6 text-[var(--elra-primary)]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Project Information
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Basic details about your departmental project
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                          placeholder="Enter project name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) =>
                            handleInputChange("category", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        >
                          <option value="" disabled>
                            {loadingCategories
                              ? "Loading categories..."
                              : "Select category"}
                          </option>
                          {projectCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) =>
                            handleInputChange("priority", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <input
                            type="checkbox"
                            id="requiresBudgetAllocation"
                            checked={formData.requiresBudgetAllocation}
                            onChange={(e) =>
                              handleInputChange(
                                "requiresBudgetAllocation",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                          />
                          <div>
                            <label
                              htmlFor="requiresBudgetAllocation"
                              className="text-sm font-medium text-gray-900"
                            >
                              Request ELRA Budget Allocation
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                              Check this if your department needs ELRA to fund
                              this project. This will require Finance HOD
                              approval and budget allocation.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Budget (₦)
                        </label>
                        <input
                          type="text"
                          value={formData.budget}
                          onChange={(e) =>
                            handleInputChange("budget", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                          placeholder="e.g., 1,500,000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            handleInputChange("startDate", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          min={
                            formData.startDate ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            handleInputChange("endDate", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Description *
                      </label>
                      <textarea
                        required
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Describe the project objectives and scope"
                      />
                    </div>
                  </div>

                  {/* Project Items */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-500/10 rounded-lg mr-4">
                          <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Project Items
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Items and resources needed for this project
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addProjectItem}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    {formData.projectItems.map((item, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 mb-4 ${
                          isItemValid(item)
                            ? "border-gray-200 bg-white"
                            : "border-red-300 bg-red-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            Item {index + 1}
                          </h4>
                          {formData.projectItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProjectItem(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Item Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, "name", e.target.value)
                              }
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] text-sm ${
                                item.name && item.name.trim() !== ""
                                  ? "border-gray-300"
                                  : "border-red-300"
                              }`}
                              placeholder="Enter item name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value === ""
                                    ? ""
                                    : parseInt(e.target.value) || 1
                                )
                              }
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] text-sm ${
                                item.quantity > 0
                                  ? "border-gray-300"
                                  : "border-red-300"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit Price (₦) *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., 1,500,000"
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] text-sm ${
                                parseFormattedNumber(item.unitPrice) > 0
                                  ? "border-gray-300"
                                  : "border-red-300"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <select
                              value={item.category}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "category",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] text-sm"
                            >
                              <option value="it_equipment">IT Equipment</option>
                              <option value="software_licenses">
                                Software Licenses
                              </option>
                              <option value="department_equipment">
                                Department Equipment
                              </option>
                              <option value="workspace_improvement">
                                Workspace Improvement
                              </option>
                              <option value="technology_adoption">
                                Technology Adoption
                              </option>
                              <option value="system_upgrade">
                                System Upgrade
                              </option>
                              <option value="training_materials">
                                Training Materials
                              </option>
                              <option value="office_supplies">
                                Office Supplies
                              </option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] text-sm"
                            placeholder="Describe this item"
                          />
                        </div>

                        <div className="mt-2 text-sm text-gray-600">
                          Total:{" "}
                          {formatCurrency(
                            (parseFormattedNumber(item.unitPrice) || 0) *
                              (parseInt(item.quantity) || 1)
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          Total Project Cost:
                        </span>
                        <span className="text-lg font-bold text-[var(--elra-primary)]">
                          {formatCurrency(calculateTotalCost())}
                        </span>
                      </div>

                      {/* Budget validation */}
                      {calculateTotalCost() > 0 && (
                        <div className="mt-3 p-3 rounded-lg border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Project Budget:
                            </span>
                            <span className="text-sm font-semibold">
                              {formatCurrency(
                                parseFormattedNumber(formData.budget || 0)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Items Cost:
                            </span>
                            <span className="text-sm font-semibold">
                              {formatCurrency(calculateTotalCost())}
                            </span>
                          </div>
                          {calculateTotalCost() >
                          parseFormattedNumber(formData.budget || 0) ? (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mr-2" />
                                <span className="text-sm text-amber-700">
                                  Items cost exceeds budget by{" "}
                                  {formatCurrency(
                                    calculateTotalCost() -
                                      parseFormattedNumber(formData.budget || 0)
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm text-green-700">
                                  Budget covers all items with{" "}
                                  {formatCurrency(
                                    parseFormattedNumber(formData.budget || 0) -
                                      calculateTotalCost()
                                  )}{" "}
                                  remaining
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Department Information */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 shadow-sm">
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-green-500/10 rounded-lg mr-4">
                        <UserIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Department Information
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Internal project management details
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          value={user.department?.name || ""}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project Manager
                        </label>
                        <input
                          type="text"
                          value={`${user.firstName} ${user.lastName}`}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vendor Information */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200 shadow-sm">
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-purple-500/10 rounded-lg mr-4">
                        <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Vendor Information
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Supplier details for procurement and inventory
                          tracking
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor Name
                        </label>
                        <input
                          type="text"
                          value={formData.vendorName || ""}
                          onChange={(e) =>
                            handleInputChange("vendorName", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                          placeholder="Enter vendor/supplier name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor Email
                        </label>
                        <input
                          type="email"
                          value={formData.vendorEmail || ""}
                          onChange={(e) =>
                            handleInputChange("vendorEmail", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                          placeholder="vendor@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.vendorPhone || ""}
                          onChange={(e) =>
                            handleInputChange("vendorPhone", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                          placeholder="+234 123 456 7890"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor Address
                        </label>
                        <input
                          type="text"
                          value={formData.vendorAddress || ""}
                          onChange={(e) =>
                            handleInputChange("vendorAddress", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                          placeholder="Enter vendor address"
                        />
                      </div>
                    </div>

                    <div className="mt-6 p-6 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border border-purple-200">
                      <div className="flex items-start">
                        <div className="p-2 bg-purple-500/20 rounded-lg mr-4">
                          <ExclamationTriangleIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-purple-800 text-lg mb-2">
                            📦 Procurement & Inventory Notice
                          </p>
                          <p className="text-purple-700">
                            Vendor information is required for procurement and
                            inventory tracking. This ensures proper supplier
                            management and delivery coordination.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Departmental Project Notice */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 shadow-sm">
                    <div className="mt-6 p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
                      <div className="flex items-start">
                        <div className="p-2 bg-green-500/20 rounded-lg mr-4">
                          <ExclamationTriangleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-green-800 text-lg mb-2">
                            🎯 Departmental Project Notice
                          </p>
                          {formData.requiresBudgetAllocation ? (
                            <>
                              <p className="text-green-700">
                                This project requires ELRA budget allocation.
                                ELRA will fund the items cost (
                                {formatCurrency(calculateTotalCost())}) and this
                                will go through the full approval chain
                                including Finance and Executive approval.
                              </p>
                              <div className="mt-3 flex items-center text-sm text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span>
                                  ELRA funds:{" "}
                                  {formatCurrency(calculateTotalCost())}
                                </span>
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 ml-4"></div>
                                <span>Full approval chain</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-green-700">
                                This project will be managed internally by your
                                department. No external approvals or budget
                                allocation is required.
                              </p>
                              <div className="mt-3 flex items-center text-sm text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span>Internal project management</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 ml-4"></div>
                                <span>No external approvals needed</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branded Form Actions */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t border-gray-200 flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span>{" "}
                        {user.department?.name || "N/A"}
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium"
                          disabled={creating}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creating}
                          className="px-8 py-3 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 font-semibold"
                        >
                          {creating ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Creating Project...</span>
                            </>
                          ) : (
                            <>
                              <PlusIcon className="h-5 w-5" />
                              <span>Create Department Project</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Document Upload Modal */}
        <AnimatePresence>
          {showDocumentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-8 text-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <DocumentTextIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">
                          Required Documents Upload
                        </h2>
                        <p className="text-white/80 text-sm">
                          {selectedProjectForDocument?.name} -{" "}
                          {selectedProjectForDocument?.code}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-white/80 text-sm">
                              Step {currentDocumentStep + 1} of 3
                            </span>
                            <div className="flex space-x-1">
                              {[0, 1, 2].map((step) => (
                                <div
                                  key={step}
                                  className={`w-2 h-2 rounded-full ${
                                    step <= currentDocumentStep
                                      ? "bg-white"
                                      : "bg-white/30"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={closeDocumentModal}
                      className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                  {/* Current Document Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      {requiredDocuments[currentDocumentStep]?.title}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      {requiredDocuments[currentDocumentStep]?.description}
                    </p>
                    <div className="mt-3 flex items-center text-sm text-blue-600">
                      <span className="font-medium">Category:</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 rounded-full text-xs">
                        {requiredDocuments[currentDocumentStep]?.category}
                      </span>
                      <span className="ml-4 font-medium">Priority:</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 rounded-full text-xs">
                        {requiredDocuments[currentDocumentStep]?.priority}
                      </span>
                    </div>
                  </div>

                  {/* Document Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Title
                      </label>
                      <input
                        type="text"
                        value={
                          wizardFormData.title ||
                          requiredDocuments[currentDocumentStep]?.title ||
                          ""
                        }
                        onChange={(e) =>
                          setWizardFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter document title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={
                          wizardFormData.description ||
                          requiredDocuments[currentDocumentStep]?.description ||
                          ""
                        }
                        onChange={(e) =>
                          setWizardFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter document description"
                      />
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Document (1 file only)
                    </label>
                    <SmartFileUpload
                      files={selectedFiles}
                      onFilesChange={setSelectedFiles}
                      maxFiles={1}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6"
                    />
                  </div>

                  {/* Upload Progress */}
                  {isUploadingDocument && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading documents...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 flex justify-between items-center">
                  <button
                    onClick={closeDocumentModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex space-x-3">
                    {currentDocumentStep > 0 && (
                      <button
                        onClick={() => {
                          // Save current document to uploadedDocuments array if files are selected
                          if (selectedFiles.length > 0) {
                            const currentDoc = {
                              ...requiredDocuments[currentDocumentStep],
                              ...wizardFormData,
                              files: selectedFiles,
                              isConfidential: false,
                            };
                            setUploadedDocuments([
                              ...uploadedDocuments,
                              currentDoc,
                            ]);
                          }
                          // Go to previous step
                          const prevStep = currentDocumentStep - 1;
                          setCurrentDocumentStep(prevStep);
                          // Reset for previous step
                          setSelectedFiles([]);
                          setWizardFormData({});
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    {currentDocumentStep < requiredDocuments.length - 1 ? (
                      <button
                        onClick={() => {
                          // Save current document to uploadedDocuments array
                          const currentDoc = {
                            ...requiredDocuments[currentDocumentStep],
                            ...wizardFormData,
                            files: selectedFiles,
                            isConfidential: false, // Departmental projects are not confidential
                          };
                          setUploadedDocuments([
                            ...uploadedDocuments,
                            currentDoc,
                          ]);
                          setWizardFormData({});
                          setSelectedFiles([]);
                          setCurrentDocumentStep(currentDocumentStep + 1);
                        }}
                        disabled={selectedFiles.length === 0}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next Document
                      </button>
                    ) : (
                      <button
                        onClick={handleDocumentUpload}
                        disabled={
                          isUploadingDocument || selectedFiles.length === 0
                        }
                        className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingDocument
                          ? "Uploading..."
                          : "Upload Documents"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-8 text-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <BuildingOfficeIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Project Details</h2>
                        <p className="text-white/80 text-sm">
                          {selectedProject.name} - {selectedProject.code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-8 max-h-[calc(95vh-200px)] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Project Information */}
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
                          Project Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Name:
                            </span>
                            <p className="text-gray-900">
                              {selectedProject.name}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Code:
                            </span>
                            <p className="text-gray-900 font-mono">
                              {selectedProject.code}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Description:
                            </span>
                            <p className="text-gray-900">
                              {selectedProject.description}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Category:
                            </span>
                            <p className="text-gray-900 capitalize">
                              {selectedProject.category?.replace(/_/g, " ")}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Priority:
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                selectedProject.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : selectedProject.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {selectedProject.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Budget Information */}
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <BanknotesIcon className="h-5 w-5 text-blue-600 mr-2" />
                          Budget Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Total Budget:
                            </span>
                            <p className="text-gray-900 font-semibold">
                              {formatCurrency(selectedProject.budget)}
                            </p>
                          </div>
                          {selectedProject.requiresBudgetAllocation && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                ELRA Funding:
                              </span>
                              <p className="text-gray-900 font-semibold">
                                {formatCurrency(
                                  selectedProject.elraFundingAmount || 0
                                )}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Budget Allocation:
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                selectedProject.requiresBudgetAllocation
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {selectedProject.requiresBudgetAllocation
                                ? "ELRA Funding Required"
                                : "Department Funded"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Project Timeline & Status */}
                    <div className="space-y-6">
                      <div className="bg-green-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                          Timeline
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Start Date:
                            </span>
                            <p className="text-gray-900">
                              {new Date(
                                selectedProject.startDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              End Date:
                            </span>
                            <p className="text-gray-900">
                              {new Date(
                                selectedProject.endDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Duration:
                            </span>
                            <p className="text-gray-900">
                              {Math.ceil(
                                (new Date(selectedProject.endDate) -
                                  new Date(selectedProject.startDate)) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              days
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Project Status */}
                      <div className="bg-purple-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <ChartBarIcon className="h-5 w-5 text-purple-600 mr-2" />
                          Status & Progress
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Status:
                            </span>
                            <span
                              className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                selectedProject.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : selectedProject.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : selectedProject.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {selectedProject.status
                                ?.replace(/_/g, " ")
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Created:
                            </span>
                            <p className="text-gray-900">
                              {new Date(
                                selectedProject.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedProject.approvedAt && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Approved:
                              </span>
                              <p className="text-gray-900">
                                {new Date(
                                  selectedProject.approvedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Items */}
                  {selectedProject.projectItems &&
                    selectedProject.projectItems.length > 0 && (
                      <div className="mt-8">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ArrowTrendingUpIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
                            Project Items
                          </h3>
                          <div className="space-y-4">
                            {selectedProject.projectItems.map((item, index) => (
                              <div
                                key={index}
                                className="bg-white rounded-lg p-4 border border-gray-200"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">
                                      {item.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {item.description}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                      <span>Qty: {item.quantity}</span>
                                      <span>
                                        Unit: {formatCurrency(item.unitPrice)}
                                      </span>
                                      <span className="font-medium">
                                        Total: {formatCurrency(item.totalPrice)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="bg-[var(--elra-primary)]/10 rounded-lg p-4 border border-[var(--elra-primary)]/20">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-900">
                                  Total Items Cost:
                                </span>
                                <span className="font-bold text-[var(--elra-primary)]">
                                  {formatCurrency(
                                    selectedProject.projectItems.reduce(
                                      (total, item) => total + item.totalPrice,
                                      0
                                    )
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Vendor Information */}
                  {selectedProject.vendor && (
                    <div className="mt-8">
                      <div className="bg-orange-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-orange-600 mr-2" />
                          Vendor Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Vendor Name:
                            </span>
                            <p className="text-gray-900">
                              {selectedProject.vendor.name}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Email:
                            </span>
                            <p className="text-gray-900">
                              {selectedProject.vendor.email}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Phone:
                            </span>
                            <p className="text-gray-900">
                              {selectedProject.vendor.phone}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Address:
                            </span>
                            <p className="text-gray-900">
                              {selectedProject.vendor.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document View Modal */}
        <AnimatePresence>
          {showDocumentViewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] p-8 text-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <DocumentTextIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">
                          Project Documents
                        </h2>
                        <p className="text-white/80 text-sm">
                          {selectedProjectForDocument?.name} -{" "}
                          {selectedProjectForDocument?.code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDocumentViewModal(false)}
                      className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-8 max-h-[calc(90vh-200px)] overflow-y-auto">
                  {!selectedProjectForDocument?.requiredDocuments ||
                  selectedProjectForDocument.requiredDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No documents uploaded yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Upload documents using the upload button
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedProjectForDocument?.requiredDocuments?.map(
                        (doc, index) => (
                          <div
                            key={index}
                            className={`border rounded-xl p-6 ${
                              doc.isSubmitted
                                ? "bg-green-50 border-green-200"
                                : "bg-yellow-50 border-yellow-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {doc.title || doc.documentType}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">
                                  {doc.description}
                                </p>
                                <div className="flex items-center space-x-4 mt-3">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      doc.isSubmitted
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {doc.isSubmitted ? "Submitted" : "Pending"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {doc.category} • {doc.priority}
                                  </span>
                                </div>
                              </div>
                              {doc.isSubmitted && doc.documentId && (
                                <button
                                  onClick={() =>
                                    handleDownloadDocument(doc.documentId)
                                  }
                                  disabled={
                                    downloadingDocumentId === doc.documentId
                                  }
                                  className="ml-4 px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50"
                                >
                                  {downloadingDocumentId === doc.documentId
                                    ? "Downloading..."
                                    : "Download"}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
};

export default DepartmentProjects;
