import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import { sendInvitationEmail } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc    Create invitation (Super Admin only)
// @route   POST /api/invitations
// @access  Private (Super Admin)
export const createInvitation = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { email, firstName, lastName, position, departmentId, roleId, notes } =
    req.body;

  // Check if user is super admin
  if (currentUser.role.level < 100) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  // Validate required fields
  if (!email || !firstName || !lastName || !departmentId || !roleId) {
    return res.status(400).json({
      success: false,
      message:
        "Email, first name, last name, department, and role are required",
    });
  }

  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  // Check if invitation already exists for this email
  const existingInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    status: "active",
  });

  if (existingInvitation) {
    return res.status(400).json({
      success: false,
      message: "Active invitation already exists for this email",
    });
  }

  // Validate department exists and belongs to company
  const department = await Department.findOne({
    _id: departmentId,
    company: currentUser.company,
  });

  if (!department) {
    return res.status(400).json({
      success: false,
      message: "Invalid department",
    });
  }

  // Validate role exists
  const role = await Role.findById(roleId);
  if (!role) {
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }

  // Create invitation
  const invitation = await Invitation.create({
    email: email.toLowerCase(),
    firstName,
    lastName,
    position,
    department: departmentId,
    role: roleId,
    company: currentUser.company,
    createdBy: currentUser._id,
    notes,
  });

  // Send invitation email
  const emailResult = await sendInvitationEmail(
    invitation.email,
    `${invitation.firstName} ${invitation.lastName}`,
    invitation.code,
    currentUser.company.name
  );

  if (!emailResult.success) {
    console.error("Failed to send invitation email:", emailResult.error);
  }

  res.status(201).json({
    success: true,
    message: "Invitation created successfully",
    data: {
      invitation: {
        id: invitation._id,
        code: invitation.code,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        position: invitation.position,
        department: department.name,
        role: role.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
      emailSent: emailResult.success,
    },
  });
});

// @desc    Get all invitations for company (Super Admin only)
// @route   GET /api/invitations
// @access  Private (Super Admin)
export const getInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  // Check if user is super admin
  if (currentUser.role.level < 100) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  const { status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = { company: currentUser.company };
  if (status) {
    filter.status = status;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const invitations = await Invitation.find(filter)
    .populate("department", "name")
    .populate("role", "name")
    .populate("usedBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invitation.countDocuments(filter);

  res.json({
    success: true,
    data: {
      invitations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get invitation by ID (Super Admin only)
// @route   GET /api/invitations/:id
// @access  Private (Super Admin)
export const getInvitation = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { id } = req.params;

  // Check if user is super admin
  if (currentUser.role.level < 100) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  const invitation = await Invitation.findOne({
    _id: id,
    company: currentUser.company,
  })
    .populate("department", "name")
    .populate("role", "name")
    .populate("usedBy", "firstName lastName email");

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: "Invitation not found",
    });
  }

  res.json({
    success: true,
    data: { invitation },
  });
});

// @desc    Resend invitation (Super Admin only)
// @route   POST /api/invitations/:id/resend
// @access  Private (Super Admin)
export const resendInvitation = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { id } = req.params;

  // Check if user is super admin
  if (currentUser.role.level < 100) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  const invitation = await Invitation.findOne({
    _id: id,
    company: currentUser.company,
    status: "active",
  });

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: "Active invitation not found",
    });
  }

  // Extend expiration date
  invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await invitation.save();

  // Send invitation email
  const emailResult = await sendInvitationEmail(
    invitation.email,
    `${invitation.firstName} ${invitation.lastName}`,
    invitation.code,
    currentUser.company.name
  );

  if (!emailResult.success) {
    console.error("Failed to resend invitation email:", emailResult.error);
  }

  res.json({
    success: true,
    message: "Invitation resent successfully",
    data: {
      invitation: {
        id: invitation._id,
        code: invitation.code,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
      emailSent: emailResult.success,
    },
  });
});

// @desc    Cancel invitation (Super Admin only)
// @route   DELETE /api/invitations/:id
// @access  Private (Super Admin)
export const cancelInvitation = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { id } = req.params;

  // Check if user is super admin
  if (currentUser.role.level < 100) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  const invitation = await Invitation.findOne({
    _id: id,
    company: currentUser.company,
    status: "active",
  });

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: "Active invitation not found",
    });
  }

  invitation.status = "cancelled";
  await invitation.save();

  res.json({
    success: true,
    message: "Invitation cancelled successfully",
  });
});

// @desc    Get invitation statistics (Super Admin only)
// @route   GET /api/invitations/stats
// @access  Private (Super Admin)
export const getInvitationStats = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  // Check if user is super admin
  if (currentUser.role.level < 100) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  const stats = await Invitation.aggregate([
    {
      $match: { company: currentUser.company },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {
    active: 0,
    used: 0,
    expired: 0,
    cancelled: 0,
  };

  stats.forEach((stat) => {
    statsMap[stat._id] = stat.count;
  });

  res.json({
    success: true,
    data: { stats: statsMap },
  });
});
