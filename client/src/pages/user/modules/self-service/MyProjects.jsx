import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { HiDocument } from "react-icons/hi2";
import DataTable from "../../../../components/common/DataTable";
import ELRALogo from "../../../../components/ELRALogo.jsx";
import {
  createProject,
  updateProject,
  deleteProject,
  getNextProjectCode,
  fetchProjectCategories,
  fetchProjects,
} from "../../../../services/projectAPI.js";
import { formatNumberWithCommas } from "../../../../utils/formatters.js";

const MyProjects = () => {
  const { user } = useAuth();

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
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);

  // Document management state
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReplacingDocument, setIsReplacingDocument] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    budget: "",
    category: "",
    priority: "medium",
    projectScope: "personal",
    requiresBudgetAllocation: "false",
  });

  const [projectItems, setProjectItems] = useState([
    {
      name: "",
      description: "",
      quantity: 1,
      unitPrice: "",
      totalPrice: 0,
      currency: "NGN",
    },
  ]);
  const [nextProjectCode, setNextProjectCode] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [projectCategories, setProjectCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        setLoadingCategories(true);
        try {
          const categoriesResponse = await fetchProjectCategories();
          if (categoriesResponse.success) {
            setProjectCategories(categoriesResponse.categories);
          } else {
            console.warn(
              "Failed to fetch categories:",
              categoriesResponse.message
            );
            setProjectCategories([
              { value: "software_development", label: "Software Development" },
              { value: "system_maintenance", label: "System Maintenance" },
              {
                value: "infrastructure_upgrade",
                label: "Infrastructure Upgrade",
              },
              {
                value: "digital_transformation",
                label: "Digital Transformation",
              },
              { value: "data_management", label: "Data Management" },
              { value: "security_enhancement", label: "Security Enhancement" },
              { value: "process_automation", label: "Process Automation" },
              { value: "integration_project", label: "Integration Project" },
              { value: "equipment_purchase", label: "Equipment Purchase" },
              { value: "equipment_lease", label: "Equipment Lease" },
              { value: "facility_improvement", label: "Facility Improvement" },
              {
                value: "infrastructure_development",
                label: "Infrastructure Development",
              },
              {
                value: "equipment_maintenance",
                label: "Equipment Maintenance",
              },
              { value: "training_program", label: "Training Program" },
              { value: "capacity_building", label: "Capacity Building" },
              { value: "skill_development", label: "Skill Development" },
              {
                value: "professional_development",
                label: "Professional Development",
              },
              { value: "industry_training", label: "Industry Training" },
              { value: "consulting_service", label: "Consulting Service" },
              { value: "advisory_service", label: "Advisory Service" },
              { value: "technical_support", label: "Technical Support" },
              {
                value: "implementation_service",
                label: "Implementation Service",
              },
              {
                value: "regulatory_compliance",
                label: "Regulatory Compliance",
              },
              { value: "compliance_audit", label: "Compliance Audit" },
              {
                value: "regulatory_enforcement",
                label: "Regulatory Enforcement",
              },
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
              {
                value: "marketplace_development",
                label: "Marketplace Development",
              },
              { value: "exchange_platform", label: "Exchange Platform" },
              { value: "trading_system", label: "Trading System" },
              { value: "market_analysis", label: "Market Analysis" },
              { value: "public_awareness", label: "Public Awareness" },
              {
                value: "communication_campaign",
                label: "Communication Campaign",
              },
              {
                value: "stakeholder_engagement",
                label: "Stakeholder Engagement",
              },
              { value: "public_relations", label: "Public Relations" },
              { value: "research_project", label: "Research Project" },
              { value: "market_research", label: "Market Research" },
              { value: "feasibility_study", label: "Feasibility Study" },
              { value: "impact_assessment", label: "Impact Assessment" },
              { value: "other", label: "Other" },
            ]);
          }
        } catch (categoryError) {
          console.error("Error fetching categories:", categoryError);
          setProjectCategories([
            { value: "software_development", label: "Software Development" },
            { value: "system_maintenance", label: "System Maintenance" },
            {
              value: "infrastructure_upgrade",
              label: "Infrastructure Upgrade",
            },
            {
              value: "digital_transformation",
              label: "Digital Transformation",
            },
            { value: "data_management", label: "Data Management" },
            { value: "security_enhancement", label: "Security Enhancement" },
            { value: "process_automation", label: "Process Automation" },
            { value: "integration_project", label: "Integration Project" },
            { value: "equipment_purchase", label: "Equipment Purchase" },
            { value: "equipment_lease", label: "Equipment Lease" },
            { value: "facility_improvement", label: "Facility Improvement" },
            {
              value: "infrastructure_development",
              label: "Infrastructure Development",
            },
            { value: "equipment_maintenance", label: "Equipment Maintenance" },
            { value: "training_program", label: "Training Program" },
            { value: "capacity_building", label: "Capacity Building" },
            { value: "skill_development", label: "Skill Development" },
            {
              value: "professional_development",
              label: "Professional Development",
            },
            { value: "industry_training", label: "Industry Training" },
            { value: "consulting_service", label: "Consulting Service" },
            { value: "advisory_service", label: "Advisory Service" },
            { value: "technical_support", label: "Technical Support" },
            {
              value: "implementation_service",
              label: "Implementation Service",
            },
            { value: "regulatory_compliance", label: "Regulatory Compliance" },
            { value: "compliance_audit", label: "Compliance Audit" },
            {
              value: "regulatory_enforcement",
              label: "Regulatory Enforcement",
            },
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
            {
              value: "marketplace_development",
              label: "Marketplace Development",
            },
            { value: "exchange_platform", label: "Exchange Platform" },
            { value: "trading_system", label: "Trading System" },
            { value: "market_analysis", label: "Market Analysis" },
            { value: "public_awareness", label: "Public Awareness" },
            {
              value: "communication_campaign",
              label: "Communication Campaign",
            },
            {
              value: "stakeholder_engagement",
              label: "Stakeholder Engagement",
            },
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

        try {
          const projectsResponse = await fetchProjects({
            createdBy: user.id,
            projectScope: "personal",
          });

          if (projectsResponse.success) {
            setProjects(projectsResponse.data || []);
          } else {
            console.warn("Failed to fetch projects:", projectsResponse.message);
          }
        } catch (projectError) {
          console.error("Error fetching projects:", projectError);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoadingCategories(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  useEffect(() => {
    if (showCreateModal) {
      const fetchNextCode = async () => {
        try {
          const response = await getNextProjectCode();
          if (response.success) {
            setNextProjectCode(response.data.nextCode);
          }
        } catch (error) {
          console.error("Error fetching next project code:", error);
        }
      };

      fetchNextCode();
      setCurrentDate(new Date().toLocaleDateString());
    }
  }, [showCreateModal]);

  const getApprovalLevelText = (budget, requiresBudgetAllocation) => {
    const numBudget = parseFloat(budget.replace(/,/g, "")) || 0;

    if (!requiresBudgetAllocation || requiresBudgetAllocation === "false") {
      return {
        text: "HOD → Project Management (Self-funded Project)",
        color: "text-green-600",
        description:
          "Project will start after HOD and Project Management HOD approve",
      };
    } else {
      // Budget allocation requested - standard approval workflow with legal compliance
      if (numBudget <= 500000) {
        return {
          text: "HOD → Project Management → Legal → Finance → Executive",
          color: "text-blue-600",
          description:
            "Standard approval workflow with legal compliance for budget allocation",
        };
      } else {
        return {
          text: "HOD → Project Management → Legal → Finance → Executive → Budget Committee",
          color: "text-orange-600",
          description:
            "Extended approval workflow with legal compliance for large budget requests",
        };
      }
    }
  };

  // Form validation
  const isFormValid = () => {
    const basicFieldsValid =
      formData.name &&
      formData.description &&
      formData.startDate &&
      formData.endDate &&
      formData.budget &&
      formData.category &&
      formData.priority;

    // For ALL projects: check budget if items exist
    if (projectItems.length > 0) {
      const itemsValid = validateProjectItems();
      const budgetValid =
        getTotalItemsCost() <=
        parseFloat(formData.budget.replace(/,/g, "") || 0);
      return basicFieldsValid && itemsValid && budgetValid;
    }

    return basicFieldsValid;
  };

  const isBudgetExceeded = () => {
    if (formData.requiresBudgetAllocation === "true") {
      return (
        getTotalItemsCost() > parseFloat(formData.budget.replace(/,/g, "") || 0)
      );
    }
    return false;
  };

  const getCurrentApprovalText = () => {
    if (!formData.budget) return null;
    return getApprovalLevelText(
      formData.budget,
      formData.requiresBudgetAllocation
    );
  };

  const handleCreateProject = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // Prepare submit data exactly like ProjectList
      const submitData = {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFloat(formData.budget.replace(/,/g, "")) || 0,
        category: formData.category,
        projectScope: "personal",
        requiresBudgetAllocation:
          formData.requiresBudgetAllocation === "true" ? true : false,
        createdBy: user.id,
        department: user.department?._id || user.department,
      };

      // Add project items for all personal projects (planning and organization)
      if (projectItems.length > 0) {
        submitData.projectItems = projectItems.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice),
          currency: item.currency,
        }));
      }

      console.log("🚀 [DEBUG] Submitting personal project:", submitData);

      const response = await createProject(submitData);

      if (response.success) {
        toast.success("Personal project created successfully!");

        try {
          const projectsResponse = await fetchProjects({
            createdBy: user.id,
            projectScope: "personal",
          });

          if (projectsResponse.success) {
            setProjects(projectsResponse.data || []);
          }
        } catch (error) {
          console.error("Error refreshing projects:", error);
        }

        setShowCreateModal(false);
        resetForm();
      } else {
        toast.error(response.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      budget: "",
      category: "",
      projectScope: "personal",
      requiresBudgetAllocation: "false",
    });

    // Reset project items
    setProjectItems([
      {
        name: "",
        description: "",
        quantity: 1,
        unitPrice: "",
        totalPrice: 0,
        currency: "NGN",
      },
    ]);

    // Reset edit mode
    setIsEditMode(false);
    setSelectedProject(null);
  };

  // Function to refresh projects and categories
  const refreshData = async () => {
    try {
      setLoading(true);

      // Refresh categories
      setLoadingCategories(true);
      try {
        const categoriesResponse = await fetchProjectCategories();
        if (categoriesResponse.success) {
          setProjectCategories(categoriesResponse.categories);
        }
      } catch (categoryError) {
        console.error("Error refreshing categories:", categoryError);
      } finally {
        setLoadingCategories(false);
      }

      try {
        const projectsResponse = await fetchProjects({
          createdBy: user.id,
          projectScope: "personal",
        });

        if (projectsResponse.success) {
          setProjects(projectsResponse.data || []);
        } else {
          console.error("Failed to fetch projects:", projectsResponse.message);
        }
      } catch (projectError) {
        console.error("Error refreshing projects:", projectError);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Project items helper functions
  const addProjectItem = () => {
    setProjectItems([
      ...projectItems,
      {
        name: "",
        description: "",
        quantity: 1,
        unitPrice: "",
        totalPrice: 0,
        currency: "NGN",
      },
    ]);
  };

  const removeProjectItem = (index) => {
    if (projectItems.length > 1) {
      const newItems = projectItems.filter((_, i) => i !== index);
      setProjectItems(newItems);
    }
  };

  const updateProjectItem = (index, field, value) => {
    const newItems = [...projectItems];

    if (field === "unitPrice") {
      const cleanValue = value.replace(/,/g, "");
      newItems[index] = { ...newItems[index], [field]: cleanValue };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    if (field === "quantity" || field === "unitPrice") {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].totalPrice = quantity * unitPrice;
    }

    setProjectItems(newItems);
  };

  const getTotalItemsCost = () => {
    return projectItems.reduce(
      (sum, item) => sum + (parseFloat(item.totalPrice) || 0),
      0
    );
  };

  const validateProjectItems = () => {
    if (formData.requiresBudgetAllocation === "true") {
      // For funded projects, items are required
      if (projectItems.length === 0) return false;

      return projectItems.every(
        (item) =>
          item.name.trim() &&
          item.description.trim() &&
          item.quantity > 0 &&
          parseFloat(item.unitPrice) > 0
      );
    }
    return true; // For self-funded projects, items are optional
  };

  const handleEditProject = () => {
    if (!formData.title || !formData.description || !formData.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const updatedProjects = projects.map((project) =>
      project.id === selectedProject.id ? { ...project, ...formData } : project
    );

    setProjects(updatedProjects);
    setShowEditModal(false);
    setSelectedProject(null);
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      budget: "",
      priority: "medium",
      category: "personal",
    });
    toast.success("Project updated successfully!");
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteProject(projectToDelete.id);
      if (response.success) {
        toast.success("Project deleted successfully");
        // Refresh projects list
        fetchUserProjects();
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

  const openEditModal = (project) => {
    setSelectedProject(project);
    setIsEditMode(true);

    // Populate form data for editing
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
      category: project.category || "",
      projectScope: "personal",
      requiresBudgetAllocation: project.requiresBudgetAllocation
        ? "true"
        : "false",
    });

    if (project.projectItems && project.projectItems.length > 0) {
      setProjectItems(
        project.projectItems.map((item) => ({
          name: item.name || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || "",
          totalPrice: item.totalPrice || 0,
          currency: item.currency || "NGN",
        }))
      );
    }

    setShowCreateModal(true);
  };

  const openViewModal = (project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const openDocumentsModal = (project) => {
    setSelectedProjectForDocument(project);
    setShowDocumentModal(true);
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
    setIsReplacingDocument(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

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
    }
  };

  const handleDocumentUpload = async () => {
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

      // TODO: Implement actual document upload API call
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(
        `Document "${documentFormData.title}" uploaded successfully for project "${selectedProjectForDocument.name}"!`
      );

      // Reset form and close modal
      closeDocumentModal();
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setIsUploadingDocument(false);
      setUploadProgress(0);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "planning":
        return "bg-yellow-100 text-yellow-800";
      case "pending_approval":
        return "bg-orange-100 text-orange-800";
      case "pending_department_approval":
        return "bg-blue-100 text-blue-800";
      case "pending_legal_compliance_approval":
        return "bg-purple-100 text-purple-800";
      case "pending_finance_approval":
        return "bg-yellow-100 text-yellow-800";
      case "pending_executive_approval":
        return "bg-red-100 text-red-800";
      case "on-hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "in-progress":
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      case "planning":
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case "pending_approval":
      case "pending_department_approval":
      case "pending_legal_compliance_approval":
      case "pending_finance_approval":
      case "pending_executive_approval":
        return <ClockIcon className="w-5 h-5 text-orange-600" />;
      case "on-hold":
        return <XCircleIcon className="w-5 h-5 text-gray-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal projects and track their progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter((p) => p.status === "completed").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter((p) => p.status === "in-progress").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Planning</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter((p) => p.status === "planning").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Approval
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    projects.filter(
                      (p) =>
                        p.status === "pending_approval" ||
                        p.status === "pending_department_approval" ||
                        p.status === "pending_legal_compliance_approval" ||
                        p.status === "pending_finance_approval" ||
                        p.status === "pending_executive_approval"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            {/* Left side can have filters later */}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Project
          </button>
        </div>

        {/* Projects Table */}
        <div className="overflow-x-auto">
          <DataTable
            data={projects}
            columns={[
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
                        {project.name && project.name.length > 20
                          ? `${project.name.slice(0, 20)}...`
                          : project.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {project.description && project.description.length > 30
                          ? `${project.description.slice(0, 30)}...`
                          : project.description}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                header: "Status",
                accessor: "status",
                renderer: (project) => (
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(project.status)}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status === "pending_approval" &&
                        "Pending Approval"}
                      {project.status === "pending_department_approval" &&
                        "Pending Department Approval"}
                      {project.status === "pending_legal_compliance_approval" &&
                        "Pending Legal Approval"}
                      {project.status === "pending_finance_approval" &&
                        "Pending Finance Approval"}
                      {project.status === "pending_executive_approval" &&
                        "Pending Executive Approval"}
                      {project.status !== "pending_approval" &&
                        project.status !== "pending_department_approval" &&
                        project.status !==
                          "pending_legal_compliance_approval" &&
                        project.status !== "pending_finance_approval" &&
                        project.status !== "pending_executive_approval" &&
                        project.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ),
              },
              {
                header: "Priority",
                accessor: "priority",
                renderer: (project) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                      project.priority
                    )}`}
                  >
                    {project.priority}
                  </span>
                ),
              },
              {
                header: "Timeline",
                accessor: "timeline",
                renderer: (project) => (
                  <div className="text-sm">
                    <div className="text-gray-900">
                      {new Date(project.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-gray-500">
                      to {new Date(project.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ),
              },
              {
                header: "Budget",
                accessor: "budget",
                renderer: (project) => (
                  <span className="font-medium text-gray-900">
                    ${project.budget.toLocaleString()}
                  </span>
                ),
              },
              {
                header: "Progress",
                accessor: "progress",
                renderer: (project) => (
                  <div className="min-w-0 max-w-32">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ),
              },
              {
                header: "Actions",
                accessor: "actions",
                align: "center",
                renderer: (project) => (
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => openViewModal(project)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>

                    {/* Documents Icon - Always show for document management */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDocumentsModal(project);
                      }}
                      className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
                        project.documents && project.documents.length > 0
                          ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                          : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      }`}
                      title={
                        project.documents && project.documents.length > 0
                          ? `View ${project.documents.length} uploaded documents`
                          : "View Documents to Upload"
                      }
                    >
                      <HiDocument className="h-4 w-4" />
                      {project.documents && project.documents.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {project.documents.length}
                        </span>
                      )}
                    </button>

                    {/* Edit Project - Only show if project is still in planning stage */}
                    {project.status === "planning" && (
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

                    {/* Delete Project - Only show if project is still in planning stage */}
                    {project.status === "planning" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            loading={loading}
            onRowClick={openViewModal}
            rowClassName="cursor-pointer hover:bg-gray-50 transition-colors"
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
            }}
          />
        </div>
      </div>

      {/* Enhanced Create Project Modal with ELRA Branding - Exact Copy from ProjectList */}
      <AnimatePresence>
        {showCreateModal && (
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
                        {isEditMode
                          ? "Edit Personal Project"
                          : "Create New Personal Project"}
                      </h2>
                      <p className="text-white text-opacity-90 mt-1 text-sm">
                        {isEditMode
                          ? "Update your project information"
                          : "Create a personal project for development, learning, or small tasks"}
                      </p>
                      <p className="text-white text-opacity-75 mt-1 text-xs">
                        Self-funded projects need only HOD approval
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="bg-white text-[var(--elra-primary)] px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium border border-white"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowCreateModal(false)}
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateProject();
                  }}
                >
                  {/* Enhanced Project Code Display */}
                  {nextProjectCode && (
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

                  {/* Single-step form for personal projects */}
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
                              budget: formatNumberWithCommas(e.target.value),
                            })
                          }
                          placeholder="Enter total budget amount (e.g., 25,000,000)"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 text-lg font-semibold"
                          required
                          disabled={submitting}
                        />
                        {getCurrentApprovalText() && (
                          <div className="mt-2">
                            <p
                              className={`text-sm font-medium ${
                                getCurrentApprovalText().color
                              }`}
                            >
                              {getCurrentApprovalText().text}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {getCurrentApprovalText().description}
                            </p>
                          </div>
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
                          <option value="">Select Priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Project Name <span className="text-red-500">*</span>
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
                          placeholder="Enter project name (e.g., Personal Website Redesign)"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Category <span className="text-red-500">*</span>
                          {loadingCategories && (
                            <span className="ml-2 inline-flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--elra-primary)]"></div>
                            </span>
                          )}
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 ${
                            loadingCategories
                              ? "border-gray-200 bg-gray-50 text-gray-400"
                              : "border-gray-300"
                          }`}
                          required
                          disabled={submitting || loadingCategories}
                        >
                          <option value="">Select Category</option>
                          {loadingCategories ? (
                            <option value="" disabled>
                              Loading categories...
                            </option>
                          ) : (
                            projectCategories.map((category) => (
                              <option
                                key={category.value}
                                value={category.value}
                              >
                                {category.label}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Description Field */}
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Project Description{" "}
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
                        rows={4}
                        placeholder="Describe your project goals, objectives, and expected outcomes..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                        required
                        disabled={submitting}
                      />
                    </div>

                    {/* Budget Allocation - For Personal Projects */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Budget Allocation{" "}
                        <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
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
                            className="mr-2 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] rounded cursor-pointer"
                            disabled={submitting}
                          />
                          <span className="text-sm cursor-pointer">
                            Request budget allocation for this project
                          </span>
                        </label>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {formData.requiresBudgetAllocation === "true"
                          ? "Project will go through enhanced approval workflow: HOD → Project Management → Legal → Finance → Executive for budget allocation."
                          : "Project will go through: HOD → Project Management approval. You'll manage your own budget."}
                      </p>
                    </div>

                    {/* Project Items - For All Personal Projects (Planning & Organization) */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-lg font-semibold text-gray-800">
                          Project Items & Specifications
                        </label>
                        <button
                          type="button"
                          onClick={addProjectItem}
                          className="px-3 py-1 text-sm bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors cursor-pointer"
                          disabled={submitting}
                        >
                          + Add Item
                        </button>
                      </div>

                      {/* Info text */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          📋 <strong>Project Planning:</strong> List items
                          you'll need for your project. This helps with planning
                          and organization, even for self-funded projects.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {projectItems.map((item, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-blue-50 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-md font-semibold text-gray-800">
                                Item {index + 1}
                              </h4>
                              {projectItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeProjectItem(index)}
                                  className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                                  disabled={submitting}
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Item Name
                                </label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) =>
                                    updateProjectItem(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Training Software Licenses"
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                  disabled={submitting}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateProjectItem(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Software licenses for training"
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                  required
                                  disabled={submitting}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateProjectItem(
                                      index,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  min="1"
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                  required
                                  disabled={submitting}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Unit Price (₦)
                                </label>
                                <input
                                  type="text"
                                  value={formatNumberWithCommas(item.unitPrice)}
                                  onChange={(e) =>
                                    updateProjectItem(
                                      index,
                                      "unitPrice",
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.00"
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                                  required
                                  disabled={submitting}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Total Price (₦)
                                </label>
                                <input
                                  type="text"
                                  value={formatNumberWithCommas(
                                    item.totalPrice
                                  )}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-700"
                                  disabled
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Items Cost Summary */}
                      <div
                        className={`mt-4 p-4 border rounded-lg ${
                          getTotalItemsCost() > 0 &&
                          getTotalItemsCost() >
                            parseFloat(formData.budget.replace(/,/g, "") || 0)
                            ? "bg-red-50 border-red-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-sm font-medium ${
                              getTotalItemsCost() > 0 &&
                              getTotalItemsCost() >
                                parseFloat(
                                  formData.budget.replace(/,/g, "") || 0
                                )
                                ? "text-red-800"
                                : "text-blue-800"
                            }`}
                          >
                            Total Items Cost:
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              getTotalItemsCost() > 0 &&
                              getTotalItemsCost() >
                                parseFloat(
                                  formData.budget.replace(/,/g, "") || 0
                                )
                                ? "text-red-900"
                                : "text-blue-900"
                            }`}
                          >
                            ₦{formatNumberWithCommas(getTotalItemsCost())}
                          </span>
                        </div>

                        {/* Budget validation for ALL projects */}
                        {getTotalItemsCost() > 0 && (
                          <div className="mt-2 text-xs">
                            {getTotalItemsCost() >
                            parseFloat(
                              formData.budget.replace(/,/g, "") || 0
                            ) ? (
                              <span className="text-red-600 font-medium">
                                ⚠️ Items cost exceeds project budget - Cannot
                                create project. Please adjust your budget or
                                reduce item costs.
                              </span>
                            ) : (
                              <span className="text-green-600 font-medium">
                                ✅ Items cost within budget
                              </span>
                            )}
                          </div>
                        )}

                        {/* Info for self-funded projects when no items */}
                        {formData.requiresBudgetAllocation === "false" &&
                          getTotalItemsCost() === 0 && (
                            <div className="mt-2 text-xs text-green-700">
                              💡 Items listed for planning and personal resource
                              management
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Submit Button - Only show when creating or editing */}
                    {!selectedProject || isEditMode ? (
                      <div className="flex justify-end pt-6">
                        <button
                          type="submit"
                          className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                            isFormValid() && !isBudgetExceeded() && !submitting
                              ? "bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)]"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                          disabled={
                            submitting || !isFormValid() || isBudgetExceeded()
                          }
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>
                                {isEditMode
                                  ? "Updating Project..."
                                  : "Creating Project..."}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>
                                {isEditMode
                                  ? "Update Project"
                                  : "Create Project"}
                              </span>
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
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Details Modal */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Project Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
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
                          {selectedProject.name}
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
                          {selectedProject.code || "N/A"}
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
                          {selectedProject.department?.name ||
                            "Personal Project"}
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
                          {selectedProject.category?.replace(/_/g, " ") ||
                            "N/A"}
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
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              selectedProject.status
                            )}`}
                          >
                            {selectedProject.status?.replace(/_/g, " ") ||
                              "N/A"}
                          </span>
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
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${selectedProject.progress || 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-blue-600 font-semibold">
                            {selectedProject.progress || 0}%
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
                          ₦{formatNumberWithCommas(selectedProject.budget || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          $
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Budget Allocation
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedProject.requiresBudgetAllocation
                            ? "Required"
                            : "Self-funded"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-indigo-600 font-bold text-xl mr-2">
                      📋
                    </span>
                    Project Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Description
                      </label>
                      <p className="text-gray-900 text-sm leading-relaxed">
                        {selectedProject.description ||
                          "No description provided"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                          Start Date
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedProject.startDate
                            ? new Date(
                                selectedProject.startDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                          End Date
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedProject.endDate
                            ? new Date(
                                selectedProject.endDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Created
                      </label>
                      <p className="text-gray-900 font-medium">
                        {selectedProject.createdAt
                          ? new Date(
                              selectedProject.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project Items (if any) */}
                {selectedProject.projectItems &&
                  selectedProject.projectItems.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-purple-600 font-bold text-xl mr-2">
                          📦
                        </span>
                        Project Items
                      </h3>
                      <div className="space-y-3">
                        {selectedProject.projectItems.map((item, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {item.description}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>Qty: {item.quantity}</span>
                                  <span>
                                    Price: ₦
                                    {formatNumberWithCommas(item.unitPrice)}
                                  </span>
                                  <span>
                                    Total: ₦
                                    {formatNumberWithCommas(item.totalPrice)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && selectedProjectForDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="dark" size="sm" />
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
                      {selectedProjectForDocument.code || "Personal Project"}
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
                    <XMarkIcon className="w-6 h-6" />
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
                            {selectedProjectForDocument.code || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Department:
                          </span>
                          <p className="text-gray-600">
                            {selectedProjectForDocument.department?.name ||
                              "Personal Project"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Status:
                          </span>
                          <div className="mt-1">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                selectedProjectForDocument.status
                              )}`}
                            >
                              {selectedProjectForDocument.status?.replace(
                                /_/g,
                                " "
                              ) || "N/A"}
                            </span>
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
                        ? "border-[var(--elra-primary)] bg-blue-50 shadow-lg scale-105"
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
                        <ArrowUpTrayIcon className="w-8 h-8 text-white" />
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
                          : `Upload ${documentFormData.title || "Document"}`}
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
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
                              disabled={isUploadingDocument}
                            >
                              <XMarkIcon className="w-5 h-5" />
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
    </div>
  );
};

export default MyProjects;
