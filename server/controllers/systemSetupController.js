import { asyncHandler } from "../utils/asyncHandler.js";
import Company from "../models/Company.js";
import ApprovalLevel from "../models/ApprovalLevel.js";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import { getIndustryTemplate } from "../config/industryTemplates.js";

// Save system setup configuration
export const saveSystemSetup = asyncHandler(async (req, res) => {
  const { industryType, setupMethod, customConfig } = req.body;
  const { companyId } = req.params;

  try {
    // Verify user has access to this company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check if user is superadmin of this company
    if (req.user.company.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only configure your own company.",
      });
    }

    let approvalLevels = [];
    let workflowTemplates = [];

    if (setupMethod === "template" && industryType !== "custom") {
      // Use industry template
      const template = getIndustryTemplate(industryType);
      if (!template) {
        return res.status(400).json({
          success: false,
          message: "Invalid industry type",
        });
      }

      // Create approval levels from template
      for (const levelTemplate of template.approvalLevels) {
        const approvalLevel = await ApprovalLevel.create({
          company: companyId,
          name: levelTemplate.name,
          level: levelTemplate.level,
          description: levelTemplate.description,
          permissions: levelTemplate.permissions,
          documentTypes: levelTemplate.documentTypes,
          createdBy: req.user._id,
        });
        approvalLevels.push(approvalLevel);
      }

      // Create workflow templates from template
      for (const workflowTemplate of template.workflowTemplates) {
        // Map approval level names to IDs
        const steps = workflowTemplate.steps.map((step) => {
          const approvalLevel = approvalLevels.find(
            (level) => level.name === step.approvalLevel
          );
          return {
            ...step,
            approvalLevel: approvalLevel._id,
          };
        });

        const workflow = await WorkflowTemplate.create({
          company: companyId,
          name: workflowTemplate.name,
          description: workflowTemplate.description,
          documentType: workflowTemplate.documentType,
          steps,
          createdBy: req.user._id,
        });
        workflowTemplates.push(workflow);
      }

      // Update company with industry type
      await Company.findByIdAndUpdate(companyId, {
        industryType: industryType,
        setupCompleted: true,
        updatedBy: req.user._id,
      });
    } else if (setupMethod === "manual" || industryType === "custom") {
      // Manual setup - create basic approval levels
      const basicLevels = [
        {
          name: "Department Head",
          level: 30,
          description: "Department-level approvals",
          permissions: {
            canApprove: true,
            canReject: true,
            canRoute: true,
            canView: true,
            canEdit: false,
            canDelete: false,
          },
          documentTypes: ["general", "administrative"],
        },
        {
          name: "Manager",
          level: 50,
          description: "Manager-level approvals",
          permissions: {
            canApprove: true,
            canReject: true,
            canRoute: true,
            canView: true,
            canEdit: true,
            canDelete: false,
          },
          documentTypes: ["general", "administrative", "policy"],
        },
        {
          name: "Director",
          level: 70,
          description: "Director-level approvals",
          permissions: {
            canApprove: true,
            canReject: true,
            canRoute: true,
            canView: true,
            canEdit: true,
            canDelete: true,
          },
          documentTypes: ["general", "administrative", "policy", "financial"],
        },
      ];

      for (const levelTemplate of basicLevels) {
        const approvalLevel = await ApprovalLevel.create({
          company: companyId,
          ...levelTemplate,
          createdBy: req.user._id,
        });
        approvalLevels.push(approvalLevel);
      }

      // Create basic workflow template
      const basicWorkflow = await WorkflowTemplate.create({
        company: companyId,
        name: "Standard Document Approval",
        description: "Basic workflow for document approval",
        documentType: "general",
        steps: [
          {
            order: 1,
            approvalLevel: approvalLevels[0]._id, // Department Head
            isRequired: true,
            canSkip: false,
          },
          {
            order: 2,
            approvalLevel: approvalLevels[1]._id, // Manager
            isRequired: true,
            canSkip: false,
          },
          {
            order: 3,
            approvalLevel: approvalLevels[2]._id, // Director
            isRequired: false,
            canSkip: true,
          },
        ],
        createdBy: req.user._id,
      });
      workflowTemplates.push(basicWorkflow);

      // Update company
      await Company.findByIdAndUpdate(companyId, {
        industryType: "custom",
        setupCompleted: true,
        updatedBy: req.user._id,
      });
    }

    // If custom config provided, apply it
    if (customConfig) {
      // Apply custom configuration
      if (customConfig.approvalLevels) {
        // Update existing approval levels or create new ones
        for (const customLevel of customConfig.approvalLevels) {
          if (customLevel._id) {
            // Update existing
            await ApprovalLevel.findByIdAndUpdate(customLevel._id, {
              ...customLevel,
              updatedBy: req.user._id,
            });
          } else {
            // Create new
            await ApprovalLevel.create({
              company: companyId,
              ...customLevel,
              createdBy: req.user._id,
            });
          }
        }
      }

      if (customConfig.workflowTemplates) {
        // Update existing workflow templates or create new ones
        for (const customWorkflow of customConfig.workflowTemplates) {
          if (customWorkflow._id) {
            // Update existing
            await WorkflowTemplate.findByIdAndUpdate(customWorkflow._id, {
              ...customWorkflow,
              updatedBy: req.user._id,
            });
          } else {
            // Create new
            await WorkflowTemplate.create({
              company: companyId,
              ...customWorkflow,
              createdBy: req.user._id,
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "System setup completed successfully",
      data: {
        industryType,
        setupMethod,
        approvalLevels: approvalLevels.length,
        workflowTemplates: workflowTemplates.length,
      },
    });
  } catch (error) {
    console.error("System setup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete system setup",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get available industry templates
export const getIndustryTemplates = asyncHandler(async (req, res) => {
  const templates = [
    {
      id: "court_system",
      name: "Court System",
      description:
        "Document management and approval workflows for judicial systems",
      features: [
        "Case Filing Workflows",
        "Legal Document Management",
        "Judge Approval System",
        "Evidence Tracking",
        "Settlement Processing",
      ],
      approvalLevels: [
        "Court Clerk",
        "Senior Clerk",
        "Magistrate Judge",
        "District Judge",
      ],
    },
    {
      id: "banking_system",
      name: "Banking System",
      description: "Financial document management and compliance workflows",
      features: [
        "Loan Application Processing",
        "Transaction Documentation",
        "Compliance Reporting",
        "Customer Document Management",
        "Audit Trail System",
      ],
      approvalLevels: [
        "Teller",
        "Senior Teller",
        "Branch Manager",
        "Regional Manager",
      ],
    },
    {
      id: "healthcare_system",
      name: "Healthcare System",
      description: "Medical document management and patient care workflows",
      features: [
        "Patient Record Management",
        "Medical Report Processing",
        "Treatment Plan Approval",
        "Prescription Tracking",
        "HIPAA Compliance",
      ],
      approvalLevels: ["Nurse", "Senior Nurse", "Doctor", "Chief of Medicine"],
    },
    {
      id: "manufacturing_system",
      name: "Manufacturing System",
      description:
        "Production document management and quality control workflows",
      features: [
        "Production Documentation",
        "Quality Control Processes",
        "Safety Report Management",
        "Budget Approval Workflows",
        "Policy Management",
      ],
      approvalLevels: [
        "Production Worker",
        "Supervisor",
        "Manager",
        "Plant Director",
      ],
    },
    {
      id: "custom",
      name: "Custom Setup",
      description: "Create your own approval levels and workflow templates",
      features: [
        "Custom Approval Levels",
        "Flexible Workflow Design",
        "Department-Specific Rules",
        "Role-Based Permissions",
        "Tailored Document Types",
      ],
      approvalLevels: [
        "Define Your Own",
        "Custom Hierarchy",
        "Flexible Permissions",
        "Adaptive Workflows",
      ],
    },
  ];

  res.json({
    success: true,
    data: templates,
  });
});

// Get current system setup status
export const getSystemSetupStatus = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const company = await Company.findById(companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      message: "Company not found",
    });
  }

  const approvalLevels = await ApprovalLevel.find({
    company: companyId,
    isActive: true,
  });

  const workflowTemplates = await WorkflowTemplate.find({
    company: companyId,
    isActive: true,
  });

  res.json({
    success: true,
    data: {
      company: {
        id: company._id,
        name: company.name,
        industryType: company.industryType,
        setupCompleted: company.setupCompleted,
      },
      approvalLevels: approvalLevels.length,
      workflowTemplates: workflowTemplates.length,
      isConfigured: approvalLevels.length > 0 && workflowTemplates.length > 0,
    },
  });
});
