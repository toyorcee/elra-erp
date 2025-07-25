import WorkflowTemplate from "../models/WorkflowTemplate.js";
import ApprovalLevel from "../models/ApprovalLevel.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new workflow template (Super Admin only)
export const createWorkflowTemplate = asyncHandler(async (req, res) => {
  const { name, description, documentType, steps } = req.body;

  // Validate that all approval levels exist
  for (const step of steps) {
    const approvalLevel = await ApprovalLevel.findOne({
      _id: step.approvalLevel,
      company: req.user.company,
      isActive: true,
    });

    if (!approvalLevel) {
      return res.status(400).json({
        success: false,
        message: `Approval level not found: ${step.approvalLevel}`,
      });
    }
  }

  const workflowTemplate = await WorkflowTemplate.create({
    company: req.user.company,
    name,
    description,
    documentType,
    steps,
    createdBy: req.user._id,
  });

  // Populate approval level details
  await workflowTemplate.populate("steps.approvalLevel");

  res.status(201).json({
    success: true,
    message: "Workflow template created successfully",
    data: workflowTemplate,
  });
});

// Get all workflow templates for the company
export const getWorkflowTemplates = asyncHandler(async (req, res) => {
  const { documentType } = req.query;

  const filter = {
    company: req.user.company,
    isActive: true,
  };

  if (documentType) {
    filter.documentType = documentType;
  }

  const templates = await WorkflowTemplate.find(filter)
    .populate("steps.approvalLevel")
    .sort({ name: 1 });

  res.json({
    success: true,
    data: templates,
  });
});

// Get single workflow template
export const getWorkflowTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await WorkflowTemplate.findOne({
    _id: id,
    company: req.user.company,
    isActive: true,
  }).populate("steps.approvalLevel");

  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Workflow template not found",
    });
  }

  res.json({
    success: true,
    data: template,
  });
});

// Update workflow template
export const updateWorkflowTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // If steps are being updated, validate approval levels
  if (updateData.steps) {
    for (const step of updateData.steps) {
      const approvalLevel = await ApprovalLevel.findOne({
        _id: step.approvalLevel,
        company: req.user.company,
        isActive: true,
      });

      if (!approvalLevel) {
        return res.status(400).json({
          success: false,
          message: `Approval level not found: ${step.approvalLevel}`,
        });
      }
    }
  }

  const template = await WorkflowTemplate.findOneAndUpdate(
    { _id: id, company: req.user.company },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).populate("steps.approvalLevel");

  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Workflow template not found",
    });
  }

  res.json({
    success: true,
    message: "Workflow template updated successfully",
    data: template,
  });
});

// Delete workflow template (soft delete)
export const deleteWorkflowTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await WorkflowTemplate.findOneAndUpdate(
    { _id: id, company: req.user.company },
    { isActive: false, updatedAt: Date.now() },
    { new: true }
  );

  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Workflow template not found",
    });
  }

  res.json({
    success: true,
    message: "Workflow template deactivated successfully",
  });
});

// Get workflow templates by document type
export const getWorkflowTemplatesByDocumentType = asyncHandler(
  async (req, res) => {
    const { documentType } = req.params;

    const templates = await WorkflowTemplate.find({
      company: req.user.company,
      documentType,
      isActive: true,
    }).populate("steps.approvalLevel");

    res.json({
      success: true,
      data: templates,
    });
  }
);

// Duplicate workflow template
export const duplicateWorkflowTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const originalTemplate = await WorkflowTemplate.findOne({
    _id: id,
    company: req.user.company,
    isActive: true,
  });

  if (!originalTemplate) {
    return res.status(404).json({
      success: false,
      message: "Workflow template not found",
    });
  }

  const newTemplate = await WorkflowTemplate.create({
    company: req.user.company,
    name: name || `${originalTemplate.name} (Copy)`,
    description: description || originalTemplate.description,
    documentType: originalTemplate.documentType,
    steps: originalTemplate.steps,
    createdBy: req.user._id,
  });

  await newTemplate.populate("steps.approvalLevel");

  res.status(201).json({
    success: true,
    message: "Workflow template duplicated successfully",
    data: newTemplate,
  });
});
