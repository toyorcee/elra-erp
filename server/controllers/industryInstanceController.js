import IndustryInstance from "../models/IndustryInstance.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import ApprovalLevel from "../models/ApprovalLevel.js";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import { getIndustryTemplate } from "../config/industryTemplates.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendIndustryInstanceInvitation } from "../services/emailService.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Create a new industry instance (Platform Admin only)
export const createIndustryInstance = asyncHandler(async (req, res) => {
  const { industryType, name, description, config, superAdmin } = req.body;

  // Validate industry type
  const template = getIndustryTemplate(industryType);
  if (!template) {
    return res.status(400).json({
      success: false,
      message: "Invalid industry type",
    });
  }

  // Check if super admin email already exists
  const existingUser = await User.findOne({ email: superAdmin.email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Super admin email already exists",
    });
  }

  // Create company for this instance
  const company = await Company.create({
    name: name,
    description: description,
    industryType: industryType,
    status: "active",
    createdBy: req.user._id,
  });

  // Generate password for super admin
  const tempPassword = Math.random().toString(36).substring(2, 10);
  console.log("Generated temp password:", tempPassword);
  console.log("Password length:", tempPassword.length);

  // Find SUPER_ADMIN role
  const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
  if (!superAdminRole) {
    return res.status(500).json({
      success: false,
      message: "SUPER_ADMIN role not found in system",
    });
  }

  // Create super admin user
  const superAdminUser = await User.create({
    username: superAdmin.email.split("@")[0], // Use email prefix as username
    email: superAdmin.email,
    password: tempPassword, // Let the pre-save middleware hash it
    firstName: superAdmin.firstName,
    lastName: superAdmin.lastName,
    phone: superAdmin.phone,
    role: superAdminRole._id,
    company: company._id,
    isActive: true,
    createdBy: req.user._id,
    // Note: department is not required for SUPER_ADMIN users
  });

  // Create industry instance
  const instance = await IndustryInstance.create({
    createdBy: req.user._id,
    industryType,
    name,
    description,
    config: {
      ...template.defaultConfig,
      ...config,
    },
    superAdmin: {
      ...superAdmin,
      isActive: false,
      setupCompleted: false,
      credentialsBackup: {
        tempPassword: tempPassword, // Store plain text password for backup
        passwordChanged: false,
      },
    },
    status: "pending_setup",
  });

  // Create approval levels for this instance
  const approvalLevels = [];
  for (const levelTemplate of template.approvalLevels) {
    const approvalLevel = await ApprovalLevel.create({
      company: company._id,
      name: levelTemplate.name,
      level: levelTemplate.level,
      description: levelTemplate.description,
      permissions: levelTemplate.permissions,
      documentTypes: levelTemplate.documentTypes,
      createdBy: superAdminUser._id,
    });
    approvalLevels.push(approvalLevel);
  }

  // Create workflow templates
  const workflowTemplates = [];
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
      company: company._id,
      name: workflowTemplate.name,
      description: workflowTemplate.description,
      documentType: workflowTemplate.documentType,
      steps,
      createdBy: superAdminUser._id,
    });
    workflowTemplates.push(workflow);
  }

  // Send invitation email to super admin
  const emailResult = await sendIndustryInstanceInvitation(
    superAdmin.email,
    `${superAdmin.firstName} ${superAdmin.lastName}`,
    name,
    tempPassword,
    industryType
  );

  if (!emailResult.success) {
    console.error("Failed to send invitation email:", emailResult.error);
  }

  res.status(201).json({
    success: true,
    message: "Industry instance created successfully",
    data: {
      instance,
      company,
      superAdmin: {
        id: superAdminUser._id,
        email: superAdminUser.email,
        name: `${superAdminUser.firstName} ${superAdminUser.lastName}`,
      },
      approvalLevels: approvalLevels.length,
      workflowTemplates: workflowTemplates.length,
    },
  });
});

// Get all industry instances (Platform Admin only)
export const getIndustryInstances = asyncHandler(async (req, res) => {
  const { status, industryType } = req.query;

  const filter = {
    createdBy: req.user._id,
  };

  if (status) filter.status = status;
  if (industryType) filter.industryType = industryType;

  const instances = await IndustryInstance.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: instances,
  });
});

// Get single industry instance
export const getIndustryInstance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const instance = await IndustryInstance.findOne({
    _id: id,
    createdBy: req.user._id,
  });

  if (!instance) {
    return res.status(404).json({
      success: false,
      message: "Industry instance not found",
    });
  }

  res.json({
    success: true,
    data: instance,
  });
});

// Update industry instance
export const updateIndustryInstance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const instance = await IndustryInstance.findOneAndUpdate(
    { _id: id, createdBy: req.user._id },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!instance) {
    return res.status(404).json({
      success: false,
      message: "Industry instance not found",
    });
  }

  res.json({
    success: true,
    message: "Industry instance updated successfully",
    data: instance,
  });
});

// Delete industry instance (soft delete)
export const deleteIndustryInstance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const instance = await IndustryInstance.findOneAndUpdate(
    { _id: id, createdBy: req.user._id },
    { status: "inactive", updatedAt: Date.now() },
    { new: true }
  );

  if (!instance) {
    return res.status(404).json({
      success: false,
      message: "Industry instance not found",
    });
  }

  res.json({
    success: true,
    message: "Industry instance deactivated successfully",
  });
});

// Get industry instance statistics
export const getInstanceStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const instance = await IndustryInstance.findOne({
    _id: id,
    createdBy: req.user._id,
  });

  if (!instance) {
    return res.status(404).json({
      success: false,
      message: "Industry instance not found",
    });
  }

  // Get company details
  const company = await Company.findOne({ name: instance.name });

  if (!company) {
    return res.status(404).json({
      success: false,
      message: "Company not found",
    });
  }

  // Get user count
  const userCount = await User.countDocuments({ company: company._id });

  // Get document count (if Document model exists)
  let documentCount = 0;
  try {
    const Document = mongoose.model("Document");
    documentCount = await Document.countDocuments({ company: company._id });
  } catch (error) {
    // Document model doesn't exist yet
  }

  res.json({
    success: true,
    data: {
      instance,
      stats: {
        totalUsers: userCount,
        totalDocuments: documentCount,
        activeWorkflows: instance.metrics.activeWorkflows,
        storageUsed: instance.metrics.storageUsed,
      },
    },
  });
});

// Get available industry types
export const getAvailableIndustries = asyncHandler(async (req, res) => {
  const { getAvailableIndustries } = await import(
    "../config/industryTemplates.js"
  );

  const industries = getAvailableIndustries();

  res.json({
    success: true,
    data: industries,
  });
});

// Get Super Admin credentials (for Super Admin access)
export const getSuperAdminCredentials = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const instance = await IndustryInstance.findOne({
    "superAdmin.email": email,
    "superAdmin.credentialsBackup.passwordChanged": false,
  });

  if (!instance) {
    return res.status(404).json({
      success: false,
      message: "Credentials not found or password already changed",
    });
  }

  // Verify the request is from the Super Admin (you might want to add additional verification)
  // For now, we'll just return the credentials if they exist and haven't been changed

  res.json({
    success: true,
    data: {
      email: instance.superAdmin.email,
      tempPassword: instance.superAdmin.credentialsBackup.tempPassword,
      companyName: instance.name,
      industryType: instance.industryType,
      createdAt: instance.createdAt,
    },
  });
});

// Mark password as changed (called when Super Admin changes password)
export const markPasswordChanged = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const instance = await IndustryInstance.findOneAndUpdate(
    { "superAdmin.email": email },
    {
      "superAdmin.credentialsBackup.passwordChanged": true,
      "superAdmin.credentialsBackup.passwordChangedAt": Date.now(),
      "superAdmin.isActive": true,
      "superAdmin.setupCompleted": true,
      status: "active",
    },
    { new: true }
  );

  if (!instance) {
    return res.status(404).json({
      success: false,
      message: "Instance not found",
    });
  }

  res.json({
    success: true,
    message: "Password change recorded successfully",
  });
});

// Resend invitation to super admin
export const resendInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const instance = await IndustryInstance.findOne({
    _id: id,
    createdBy: req.user._id,
  });

  if (!instance) {
    return res.status(404).json({
      success: false,
      message: "Industry instance not found",
    });
  }

  // Find super admin user
  const company = await Company.findOne({ name: instance.name });
  const superAdmin = await User.findOne({
    company: company._id,
    email: instance.superAdmin.email,
  });

  if (!superAdmin) {
    return res.status(404).json({
      success: false,
      message: "Super admin not found",
    });
  }

  // Generate new temporary password
  const tempPassword = Math.random().toString(36).substring(2, 10); // Ensure exactly 8 characters
  console.log("Generated new temp password:", tempPassword);

  // Update user password (let pre-save middleware hash it)
  superAdmin.password = tempPassword;
  await superAdmin.save();

  // Update instance with new credentials backup
  await IndustryInstance.findOneAndUpdate(
    { _id: id },
    {
      "superAdmin.credentialsBackup.tempPassword": tempPassword,
      "superAdmin.credentialsBackup.passwordChanged": false,
      "superAdmin.credentialsBackup.passwordChangedAt": null,
    }
  );

  // Send new invitation email
  const emailResult = await sendIndustryInstanceInvitation(
    superAdmin.email,
    `${instance.superAdmin.firstName} ${instance.superAdmin.lastName}`,
    instance.name,
    tempPassword,
    instance.industryType
  );

  if (!emailResult.success) {
    console.error("Failed to resend invitation email:", emailResult.error);
  }

  res.json({
    success: true,
    message: "Invitation sent successfully",
  });
});
