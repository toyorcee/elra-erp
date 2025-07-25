import ApprovalLevel from "../models/ApprovalLevel.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new approval level (Super Admin only)
export const createApprovalLevel = asyncHandler(async (req, res) => {
  const { name, level, description, permissions, documentTypes } = req.body;

  // Check if level already exists for this company
  const existingLevel = await ApprovalLevel.findOne({
    company: req.user.company,
    level: level,
  });

  if (existingLevel) {
    return res.status(400).json({
      success: false,
      message: `Approval level ${level} already exists`,
    });
  }

  const approvalLevel = await ApprovalLevel.create({
    company: req.user.company,
    name,
    level,
    description,
    permissions,
    documentTypes,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Approval level created successfully",
    data: approvalLevel,
  });
});

// Get all approval levels for the company
export const getApprovalLevels = asyncHandler(async (req, res) => {
  const approvalLevels = await ApprovalLevel.find({
    company: req.user.company,
    isActive: true,
  }).sort({ level: 1 });

  res.json({
    success: true,
    data: approvalLevels,
  });
});

// Get single approval level
export const getApprovalLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const approvalLevel = await ApprovalLevel.findOne({
    _id: id,
    company: req.user.company,
    isActive: true,
  });

  if (!approvalLevel) {
    return res.status(404).json({
      success: false,
      message: "Approval level not found",
    });
  }

  res.json({
    success: true,
    data: approvalLevel,
  });
});

// Update approval level
export const updateApprovalLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const approvalLevel = await ApprovalLevel.findOneAndUpdate(
    { _id: id, company: req.user.company },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!approvalLevel) {
    return res.status(404).json({
      success: false,
      message: "Approval level not found",
    });
  }

  res.json({
    success: true,
    message: "Approval level updated successfully",
    data: approvalLevel,
  });
});

// Delete approval level (soft delete)
export const deleteApprovalLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const approvalLevel = await ApprovalLevel.findOneAndUpdate(
    { _id: id, company: req.user.company },
    { isActive: false, updatedAt: Date.now() },
    { new: true }
  );

  if (!approvalLevel) {
    return res.status(404).json({
      success: false,
      message: "Approval level not found",
    });
  }

  res.json({
    success: true,
    message: "Approval level deactivated successfully",
  });
});

// Get approval levels by document type
export const getApprovalLevelsByDocumentType = asyncHandler(
  async (req, res) => {
    const { documentType } = req.params;

    const approvalLevels = await ApprovalLevel.find({
      company: req.user.company,
      isActive: true,
      documentTypes: documentType,
    }).sort({ level: 1 });

    res.json({
      success: true,
      data: approvalLevels,
    });
  }
);
