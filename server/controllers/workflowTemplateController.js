import mongoose from "mongoose";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import WorkflowTemplateService from "../services/workflowTemplateService.js";
import ProjectAuditService from "../services/projectAuditService.js";

// @desc    Get all workflow templates
// @route   GET /api/workflow-templates
// @access  Private (HOD+)
export const getAllWorkflowTemplates = async (req, res) => {
  try {
    const currentUser = req.user;

    const templates = await WorkflowTemplateService.getAllWorkflowTemplates();

    res.status(200).json({
      success: true,
      data: {
        templates: templates,
        totalTemplates: templates.length,
      },
    });
  } catch (error) {
    console.error("Error getting workflow templates:", error);
    res.status(500).json({
        success: false,
      message: "Failed to get workflow templates",
      error: error.message,
    });
  }
};

// @desc    Get workflow template by ID
// @route   GET /api/workflow-templates/:id
// @access  Private (HOD+)
export const getWorkflowTemplateById = async (req, res) => {
  try {
  const { id } = req.params;
    const currentUser = req.user;

    const template = await WorkflowTemplate.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("steps.approvalLevel");

  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Workflow template not found",
    });
  }

    res.status(200).json({
    success: true,
    data: template,
  });
  } catch (error) {
    console.error("Error getting workflow template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get workflow template",
      error: error.message,
    });
  }
};

// @desc    Create workflow template
// @route   POST /api/workflow-templates
// @access  Private (HOD+)
export const createWorkflowTemplate = async (req, res) => {
  try {
    const currentUser = req.user;
    const templateData = req.body;

    const template =
      await WorkflowTemplateService.createProjectWorkflowTemplate(
        templateData,
        currentUser
      );

    res.status(201).json({
      success: true,
      message: "Workflow template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error creating workflow template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create workflow template",
      error: error.message,
    });
  }
};

// @desc    Create regulatory compliance template
// @route   POST /api/workflow-templates/compliance
// @access  Private (HOD+)
export const createComplianceTemplate = async (req, res) => {
  try {
    const currentUser = req.user;
    const { complianceType } = req.body;

    if (!complianceType) {
        return res.status(400).json({
          success: false,
        message: "Compliance type is required",
      });
    }

    const template =
      await WorkflowTemplateService.createRegulatoryComplianceTemplate(
        complianceType,
        currentUser
      );

    res.status(201).json({
      success: true,
      message: "Regulatory compliance template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error creating compliance template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create compliance template",
      error: error.message,
    });
  }
};

// @desc    Update workflow template
// @route   PUT /api/workflow-templates/:id
// @access  Private (HOD+)
export const updateWorkflowTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const updates = req.body;

    const template = await WorkflowTemplateService.updateWorkflowTemplate(
      id,
      updates,
      currentUser
    );

    res.status(200).json({
    success: true,
    message: "Workflow template updated successfully",
    data: template,
  });
  } catch (error) {
    console.error("Error updating workflow template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update workflow template",
      error: error.message,
    });
  }
};

// @desc    Delete workflow template
// @route   DELETE /api/workflow-templates/:id
// @access  Private (HOD+)
export const deleteWorkflowTemplate = async (req, res) => {
  try {
  const { id } = req.params;
    const currentUser = req.user;

    const template = await WorkflowTemplateService.deleteWorkflowTemplate(
      id,
      currentUser
    );

    res.status(200).json({
      success: true,
      message: "Workflow template deleted successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error deleting workflow template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete workflow template",
      error: error.message,
    });
  }
};

// @desc    Get workflow template for project
// @route   GET /api/workflow-templates/project/:projectId
// @access  Private (HOD+)
export const getWorkflowTemplateForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Get project details
    const Project = mongoose.model("Project");
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Get project department
    const projectDept = await mongoose
      .model("Department")
      .findById(project.department);
    const projectDeptName = projectDept ? projectDept.name : "Unknown";

    // Get appropriate workflow template
    const template =
      await WorkflowTemplateService.getWorkflowTemplateForProject(
        project.category,
        project.budget,
        projectDeptName
      );

    res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.name,
        projectCode: project.code,
        projectCategory: project.category,
        projectBudget: project.budget,
        projectDepartment: projectDeptName,
        template: template,
      },
    });
  } catch (error) {
    console.error("Error getting workflow template for project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get workflow template for project",
      error: error.message,
    });
  }
};

// @desc    Apply workflow template to project
// @route   POST /api/workflow-templates/:id/apply/:projectId
// @access  Private (HOD+)
export const applyWorkflowTemplateToProject = async (req, res) => {
  try {
    const { id: templateId, projectId } = req.params;
    const currentUser = req.user;

    // Get template and project
    const template = await WorkflowTemplate.findById(templateId);
  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Workflow template not found",
    });
  }

    const Project = mongoose.model("Project");
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Apply template to project
    const approvalChain =
      await WorkflowTemplateService.applyWorkflowTemplateToProject(
        project,
        template,
        currentUser
      );

    res.status(200).json({
      success: true,
      message: "Workflow template applied successfully",
      data: {
        projectId: project._id,
        projectName: project.name,
        projectCode: project.code,
        templateId: template._id,
        templateName: template.name,
        approvalChain: approvalChain,
      },
    });
  } catch (error) {
    console.error("Error applying workflow template to project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply workflow template to project",
      error: error.message,
    });
  }
};

// @desc    Get workflow template statistics
// @route   GET /api/workflow-templates/stats
// @access  Private (HOD+)
export const getWorkflowTemplateStats = async (req, res) => {
  try {
    const currentUser = req.user;

    // Get template statistics
    const totalTemplates = await WorkflowTemplate.countDocuments({
    isActive: true,
  });
    const projectTemplates = await WorkflowTemplate.countDocuments({
      isActive: true,
      documentType: "project_workflow",
    });
    const complianceTemplates = await WorkflowTemplate.countDocuments({
      isActive: true,
      documentType: "regulatory_compliance",
    });

    // Get templates by category
    const categoryStats = await WorkflowTemplate.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$documentType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTemplates,
        projectTemplates,
        complianceTemplates,
        categoryStats,
      },
    });
  } catch (error) {
    console.error("Error getting workflow template stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get workflow template statistics",
      error: error.message,
    });
  }
};

// @desc    Get available compliance types
// @route   GET /api/workflow-templates/compliance-types
// @access  Private (HOD+)
export const getComplianceTypes = async (req, res) => {
  try {
    const complianceTypes = [
      {
        type: "equipment_lease_registration",
        name: "Equipment Lease Registration",
        description: "Workflow for equipment lease registration compliance",
        category: "equipment_lease",
      },
      {
        type: "vehicle_lease_registration",
        name: "Vehicle Lease Registration",
        description: "Workflow for vehicle lease registration compliance",
        category: "vehicle_lease",
      },
      {
        type: "financial_lease_registration",
        name: "Financial Lease Registration",
        description: "Workflow for financial lease registration compliance",
        category: "financial_lease",
      },
      {
        type: "software_development_registration",
        name: "Software Development Registration",
        description: "Workflow for software development project compliance",
        category: "software_development",
      },
    ];

    res.status(200).json({
    success: true,
      data: {
        complianceTypes: complianceTypes,
        totalTypes: complianceTypes.length,
      },
    });
  } catch (error) {
    console.error("Error getting compliance types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get compliance types",
      error: error.message,
    });
  }
};
