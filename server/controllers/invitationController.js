import mongoose from "mongoose";
import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import { sendInvitationEmail } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";

const notificationService = new NotificationService();

const checkExistingHOD = async (departmentId, roleId) => {
  try {
    console.log(
      `🔍 [CHECK_HOD] Checking for existing HOD - Department: ${departmentId}, Role: ${roleId}`
    );

    const role = await Role.findById(roleId);
    if (!role) {
      console.log(`❌ [CHECK_HOD] Role not found for ID: ${roleId}`);
      return null;
    }

    console.log(
      `🎭 [CHECK_HOD] Role found: ${role.name} (Level: ${role.level})`
    );

    // Check if the role is HOD level (level >= 700 or name === "HOD")
    const isHODRole = role.level >= 700 || role.name === "HOD";
    console.log(`🎯 [CHECK_HOD] Is HOD role: ${isHODRole}`);

    if (!isHODRole) {
      console.log(`ℹ️ [CHECK_HOD] Not a HOD role - skipping HOD check`);
      return null;
    }

    console.log(`🔍 [CHECK_HOD] Searching for existing HOD in department...`);

    const hodRole = await Role.findOne({
      $or: [{ name: "HOD" }, { level: { $gte: 700 } }],
    });

    if (!hodRole) {
      console.log(`❌ [CHECK_HOD] No HOD role found in system`);
      return null;
    }

    console.log(
      `🎭 [CHECK_HOD] Found HOD role: ${hodRole.name} (Level: ${hodRole.level})`
    );

    const existingHOD = await User.findOne({
      department: departmentId,
      role: hodRole._id,
      isActive: true,
      status: { $nin: ["INACTIVE", "SUSPENDED", "PENDING_OFFBOARDING"] },
    }).populate("role department");

    if (existingHOD) {
      console.log(
        `👤 [CHECK_HOD] Existing HOD found: ${existingHOD.fullName} (${existingHOD.email}) - Status: ${existingHOD.status}`
      );
    } else {
      console.log(`✅ [CHECK_HOD] No existing HOD found in department`);
    }

    return existingHOD;
  } catch (error) {
    console.error("❌ [CHECK_HOD] Error checking existing HOD:", error);
    return null;
  }
};

// Helper function to check if department has an offboarding HOD
const checkOffboardingHOD = async (departmentId, roleId) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) return null;

    // Check if the role is HOD level (level >= 700 or name === "HOD")
    const isHODRole = role.level >= 700 || role.name === "HOD";

    if (!isHODRole) return null;

    // Find HOD in offboarding process (for replacement)
    const offboardingHOD = await User.findOne({
      department: departmentId,
      $or: [{ "role.name": "HOD" }, { "role.level": { $gte: 700 } }],
      isActive: true,
      status: { $in: ["INACTIVE", "SUSPENDED", "PENDING_OFFBOARDING"] },
    }).populate("role department");

    return offboardingHOD;
  } catch (error) {
    console.error("Error checking offboarding HOD:", error);
    return null;
  }
};

const validateEmails = (emails) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let emailList;
  if (Array.isArray(emails)) {
    emailList = emails.map((email) => email.trim()).filter((email) => email);
  } else {
    emailList = emails
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email);
  }

  const validEmails = [];
  const invalidEmails = [];

  emailList.forEach((email) => {
    if (emailRegex.test(email)) {
      validEmails.push(email.toLowerCase());
    } else {
      invalidEmails.push(email);
    }
  });

  return { validEmails, invalidEmails };
};

// Salary grade configuration
const SALARY_GRADES = [
  "Grade 01",
  "Grade 02",
  "Grade 03",
  "Grade 04",
  "Grade 05",
  "Grade 06",
  "Grade 07",
  "Grade 08",
  "Grade 09",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Grade 13",
  "Grade 14",
  "Grade 15",
  "Grade 16",
  "Grade 17",
  "Grade 18",
  "Grade 19",
  "Grade 20",
];

// @desc    Create invitation (Super Admin or users with permissions)
// @route   POST /api/invitations
// @access  Private
export const createInvitation = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  const {
    email,
    firstName,
    lastName,
    position,
    departmentId,
    roleId,
    notes,
    isPendingUser = false,
    userId = null,
  } = req.body;
  // Validate required fields
  if (!email || !firstName || !lastName || !departmentId || !roleId) {
    return res.status(400).json({
      success: false,
      message:
        "Email, first name, last name, department, and role are required",
    });
  }

  if (isPendingUser && userId) {
    const pendingUser = await User.findById(userId);
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: "Pending user not found",
      });
    }

    if (pendingUser.status !== "PENDING_REGISTRATION") {
      return res.status(400).json({
        success: false,
        message: "User is not in pending registration status",
      });
    }
  } else {
    // Check for ANY existing user (active or inactive) with this email
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with email ${email} already exists in the system. Cannot create invitation for existing user.`,
      });
    }
  }

  // Check for any active invitation
  const existingInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    status: { $in: ["active", "sent", "pending_approval"] },
  });

  if (existingInvitation) {
    return res.status(400).json({
      success: false,
      message: `Active invitation already exists for this email (status: ${existingInvitation.status}). Please cancel or wait for it to expire before creating a new one.`,
      existingInvitation: {
        id: existingInvitation._id,
        status: existingInvitation.status,
        createdAt: existingInvitation.createdAt,
      },
    });
  }

  // Check for used invitation (means user already registered)
  const usedInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    status: "used",
  });

  if (usedInvitation) {
    return res.status(400).json({
      success: false,
      message: `An invitation for this email was already used. User has already registered. Cannot create a new invitation.`,
    });
  }

  // Validate department exists
  const department = await Department.findById(departmentId);

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
    createdBy: currentUser._id,
    notes,
    isPendingUser,
    userId: isPendingUser ? userId : null,
  });

  // If this is for a pending user, update their status
  if (isPendingUser && userId) {
    await User.findByIdAndUpdate(userId, {
      status: "INVITED",
      invitedAt: new Date(),
    });
  }

  // Send invitation email
  const emailResult = await sendInvitationEmail(
    invitation.email,
    `${invitation.firstName} ${invitation.lastName}`,
    invitation.code,
    role.name,
    department.name
  );

  if (!emailResult.success) {
    console.error(
      "❌ [INVITATION] Failed to send invitation email:",
      emailResult.error
    );
  }

  // Send in-app notification to the creator
  try {
    await notificationService.createNotification({
      recipient: currentUser._id,
      type: "INVITATION_CREATED",
      title: "Invitation Created Successfully",
      message: `Invitation sent to ${invitation.email} for ${role.name} role in ${department.name}`,
      priority: "medium",
      data: {
        invitationId: invitation._id,
        recipientEmail: invitation.email,
        role: role.name,
        department: department.name,
      },
    });
  } catch (notificationError) {
    console.error(
      "❌ [INVITATION] Failed to send in-app notification:",
      notificationError
    );
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
      statistics: {
        totalInvitations: 1,
        successfulInvitations: emailResult.success ? 1 : 0,
        failedInvitations: emailResult.success ? 0 : 1,
        isSingleInvitation: true,
      },
    },
  });
});

// @desc    Get all invitations for company (HOD and Super Admin)
// @route   GET /api/invitations
// @access  Private (HOD and Super Admin)
export const getInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  const { status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = {};
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

// @desc    Get invitations for current user (any user who can create invitations)
// @route   GET /api/invitations/user
// @access  Private
export const getUserInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  const canManageUsers =
    currentUser.role.level >= 700 ||
    currentUser.role.permissions?.includes("user.manage");

  if (!canManageUsers) {
    return res.status(403).json({
      success: false,
      message: "Access denied. User management privileges required.",
    });
  }

  const { status, page = 1, limit = 20 } = req.query;

  // Build filter - get invitations created by this user
  const filter = { createdBy: currentUser._id };
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

  const mappedInvitations = invitations.map((inv) => ({
    id: inv._id,
    email: inv.email,
    department: inv.department?.name,
    role: inv.role?.name,
    batchId: inv.batchId,
    createdAt: inv.createdAt,
    status: inv.status,
    emailSent: inv.emailSent,
    emailError: inv.emailError,
  }));

  res.json({
    success: true,
    data: {
      invitations: mappedInvitations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get invitation by ID (HOD and Super Admin)
// @route   GET /api/invitations/:id
// @access  Private (HOD and Super Admin)
export const getInvitation = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { id } = req.params;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  const invitation = await Invitation.findOne({
    _id: id,
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

// @desc    Resend invitation (HOD and Super Admin)
// @route   POST /api/invitations/:id/resend
// @access  Private (HOD and Super Admin)
export const resendInvitation = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { id } = req.params;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  const invitation = await Invitation.findOne({
    _id: id,
    status: "active",
  });

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: "Active invitation not found",
    });
  }

  // Generate new invitation code for security
  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  await Invitation.updateMany(
    {
      email: invitation.email,
      status: "active",
      _id: { $ne: invitation._id },
    },
    {
      status: "cancelled",
      updatedAt: new Date(),
    }
  );

  // Update invitation with new code and extend expiration
  invitation.code = newCode;
  invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  invitation.updatedAt = new Date();
  await invitation.save();

  // Send invitation email with new code
  const emailResult = await sendInvitationEmail(
    invitation.email,
    `${invitation.firstName} ${invitation.lastName}`,
    newCode, // Use the new code
    "ELRA"
  );

  if (!emailResult.success) {
    console.error("Failed to resend invitation email:", emailResult.error);
  }

  // Log the resend action for audit
  try {
    await AuditService.logUserAction(
      currentUser._id,
      "INVITATION_RESENT",
      invitation._id,
      {
        description: `Invitation resent to ${invitation.firstName} ${invitation.lastName} (${invitation.email}) with new code`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );
  } catch (auditError) {
    console.error("Audit logging error:", auditError);
    // Don't fail the main operation if audit logging fails
  }

  res.json({
    success: true,
    message: "Invitation resent successfully with new code",
    data: {
      invitation: {
        id: invitation._id,
        code: newCode, // Return the new code
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
      emailSent: emailResult.success,
    },
  });
});

// @desc    Cancel invitation (HOD and Super Admin)
// @route   DELETE /api/invitations/:id
// @access  Private (HOD and Super Admin)
export const cancelInvitation = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { id } = req.params;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  const invitation = await Invitation.findOne({
    _id: id,
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

// @desc    Verify invitation code and return preview data (Public)
// @route   POST /api/invitations/verify
// @access  Public
export const verifyInvitationCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Invitation code is required",
    });
  }

  // Find invitation by code
  const invitation = await Invitation.findOne({
    code: code.toUpperCase(),
    status: "active",
    expiresAt: { $gt: new Date() },
  }).populate("department role");

  if (!invitation) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired invitation code",
    });
  }

  const responseData = {
    success: true,
    message: "Invitation code verified successfully",
    data: {
      invitation: {
        id: invitation._id,
        code: invitation.code,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        position: invitation.position,
        notes: invitation.notes,
        expiresAt: invitation.expiresAt,

        department: {
          id: invitation.department._id,
          name: invitation.department.name,
          description: invitation.department.description,
        },
        role: {
          id: invitation.role._id,
          name: invitation.role.name,
          level: invitation.role.level,
          description: invitation.role.description,
        },
      },
    },
  };

  res.json(responseData);
});

// @desc    Get invitation statistics (HOD and Super Admin)
// @route   GET /api/invitations/stats
// @access  Private (HOD and Super Admin)
export const getInvitationStats = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  const stats = await Invitation.aggregate([
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

// @desc    Get available salary grades
// @route   GET /api/invitations/salary-grades
// @access  Private (HOD and Super Admin)
export const getSalaryGrades = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  res.json({
    success: true,
    data: { salaryGrades: SALARY_GRADES },
  });
});

// @desc    Create bulk invitations from email list
// @route   POST /api/invitations/bulk-create
// @access  Private (Super Admin)
// @desc    Create single invitation
// @route   POST /api/invitations/create-single
// @access  Private (Super Admin)
export const createSingleInvitation = asyncHandler(async (req, res) => {
  const { email, departmentId, roleId } = req.body;

  const currentUser = req.user;

  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: `User with email ${email} already exists in the system. Cannot create invitation for existing user.`,
    });
  }

  const existingInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    status: { $in: ["active", "sent", "pending_approval"] },
  });

  if (existingInvitation) {
    return res.status(400).json({
      success: false,
      message: `Active invitation already exists for ${email}`,
    });
  }

  // Check for used invitation (means user already registered)
  const usedInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    status: "used",
  });

  if (usedInvitation) {
    return res.status(400).json({
      success: false,
      message: `An invitation for ${email} was already used. User has already registered. Cannot create a new invitation.`,
    });
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    return res.status(400).json({
      success: false,
      message: "Invalid department",
    });
  }

  // Check if department already has a HOD and this is a HOD invitation
  const existingHOD = await checkExistingHOD(departmentId, roleId);
  const offboardingHOD = await checkOffboardingHOD(departmentId, roleId);

  if (existingHOD && !req.body.replaceExistingHOD) {
    return res.status(409).json({
      success: false,
      message: `Department ${department.name} already has a HOD: ${existingHOD.fullName}`,
      conflict: {
        type: "existing_hod",
        department: department.name,
        existingHOD: {
          id: existingHOD._id,
          name: existingHOD.fullName,
          email: existingHOD.email,
          avatar: existingHOD.avatar,
          employeeId: existingHOD.employeeId,
          phone: existingHOD.phone,
          status: existingHOD.status,
        },
      },
    });
  }

  // If replacing HOD, deactivate the existing one
  if (existingHOD && req.body.replaceExistingHOD) {
    existingHOD.isActive = false;
    existingHOD.status = "INACTIVE";
    existingHOD.deactivatedAt = new Date();
    existingHOD.deactivatedBy = currentUser._id;
    existingHOD.deactivationReason = "Replaced by new HOD invitation";
    await existingHOD.save();
  }

  // Validate role
  const role = await Role.findById(roleId);
  if (!role) {
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }

  // For single invitations, we don't generate names - user will set them during registration
  const firstName = "";
  const lastName = "";

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // Create invitation within transaction
    const invitation = await Invitation.create(
      [
        {
          email: email,
          firstName: firstName,
          lastName: lastName,
          department: departmentId,
          role: roleId,
          createdBy: currentUser._id,
        },
      ],
      { session }
    );

    const createdInvitation = invitation[0];

    // Send email BEFORE committing transaction
    const userName =
      createdInvitation.firstName && createdInvitation.lastName
        ? `${createdInvitation.firstName} ${createdInvitation.lastName}`
        : "New User";
    const emailResult = await sendInvitationEmail(
      createdInvitation.email,
      userName,
      createdInvitation.code,
      role.name,
      department.name
    );

    if (emailResult.success) {
      // Mark email as sent and commit transaction
      await createdInvitation.markEmailSent();
      await session.commitTransaction();

      // Log audit (outside transaction)
      await AuditService.logUserAction(
        currentUser._id,
        "SINGLE_INVITATION_CREATED",
        createdInvitation._id,
        {
          email: email,
          department: department.name,
          role: role.name,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );

      // Send in-app notification to the creator (outside transaction)
      try {
        const notificationService = new NotificationService();
        await notificationService.createNotification({
          recipient: currentUser._id,
          type: "INVITATION_CREATED",
          title: "Invitation Created Successfully",
          message: `Invitation sent to ${email} for ${role.name} role in ${department.name}`,
          priority: "medium",
          data: {
            invitationId: createdInvitation._id,
            recipientEmail: email,
            role: role.name,
            department: department.name,
          },
        });
      } catch (notificationError) {
        console.error(
          "❌ [SINGLE_INVITATION] Failed to send in-app notification:",
          notificationError
        );
      }

      return res.status(201).json({
        success: true,
        message: "Invitation created and sent successfully",
        data: {
          invitation: {
            id: createdInvitation._id,
            email: createdInvitation.email,
            firstName: createdInvitation.firstName,
            lastName: createdInvitation.lastName,
            code: createdInvitation.code,
            status: createdInvitation.status,
            emailSent: createdInvitation.emailSent,
          },
          statistics: {
            totalInvitations: 1,
            successfulInvitations: 1,
            failedInvitations: 0,
            isSingleInvitation: true,
          },
        },
      });
    } else {
      // Email failed - abort transaction to remove invitation record
      await session.abortTransaction();

      return res.status(500).json({
        success: false,
        message: "Failed to send invitation email",
        error: emailResult.error,
      });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error(`❌ [SINGLE_INVITATION] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to create invitation",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
});

export const createBulkInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  const { emails, departmentId, roleId, batchName } = req.body;

  if (!emails || !departmentId || !roleId) {
    return res.status(400).json({
      success: false,
      message: "Emails, department, and role are required",
    });
  }

  // Validate and process emails
  const { validEmails, invalidEmails } = validateEmails(emails);

  if (validEmails.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid email addresses provided",
    });
  }

  if (invalidEmails.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Some email addresses are invalid",
      invalidEmails: invalidEmails,
    });
  }

  // Validate department
  const department = await Department.findById(departmentId);

  if (!department) {
    return res.status(400).json({
      success: false,
      message: "Invalid department",
    });
  }

  const role = await Role.findById(roleId);
  if (!role) {
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }

  // Check if department already has a HOD and this is a HOD invitation
  const existingHOD = await checkExistingHOD(departmentId, roleId);
  const offboardingHOD = await checkOffboardingHOD(departmentId, roleId);

  if (existingHOD && !req.body.replaceExistingHOD) {
    return res.status(409).json({
      success: false,
      message: `Department ${department.name} already has a HOD: ${existingHOD.fullName}`,
      conflict: {
        type: "existing_hod",
        department: department.name,
        existingHOD: {
          id: existingHOD._id,
          name: existingHOD.fullName,
          email: existingHOD.email,
          avatar: existingHOD.avatar,
          employeeId: existingHOD.employeeId,
          phone: existingHOD.phone,
          status: existingHOD.status,
        },
      },
    });
  }

  // If replacing HOD, deactivate the existing one
  if (existingHOD && req.body.replaceExistingHOD) {
    existingHOD.isActive = false;
    existingHOD.status = "INACTIVE";
    existingHOD.deactivatedAt = new Date();
    existingHOD.deactivatedBy = currentUser._id;
    existingHOD.deactivationReason = "Replaced by new HOD invitation";
    await existingHOD.save();
  }

  // Generate sequential batch ID only for bulk invitations
  const batchId = await Invitation.generateSequentialBatchNumber();
  const batchNameFinal =
    batchName || `Batch_${new Date().toISOString().split("T")[0]}`;
  const invitations = [];
  const emailResults = [];
  const errors = [];

  for (let i = 0; i < validEmails.length; i++) {
    const email = validEmails[i];

    try {
      // Check for ANY existing user (active or inactive) with this email
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });
      if (existingUser) {
        const errorMsg = `User with email ${email} already exists in the system`;
        errors.push(errorMsg);
        continue;
      }

      // Check for any active invitation
      const existingInvitation = await Invitation.findOne({
        email: email.toLowerCase(),
        status: { $in: ["active", "sent", "pending_approval"] },
      });

      if (existingInvitation) {
        const errorMsg = `Active invitation already exists for ${email}`;
        errors.push(errorMsg);
        continue;
      }

      // Check for used invitation (means user already registered)
      const usedInvitation = await Invitation.findOne({
        email: email.toLowerCase(),
        status: "used",
      });

      if (usedInvitation) {
        const errorMsg = `An invitation for ${email} was already used. User has already registered.`;
        errors.push(errorMsg);
        continue;
      }

      // For bulk invitations, we don't generate names - user will set them during registration
      const firstName = "";
      const lastName = "";

      // Create invitation
      const invitation = await Invitation.create({
        email: email,
        firstName: firstName,
        lastName: lastName,
        department: department._id,
        role: role._id,
        createdBy: currentUser._id,
        batchId: batchId,
        batchName: batchNameFinal,
      });

      // Send invitation email
      const userName =
        invitation.firstName && invitation.lastName
          ? `${invitation.firstName} ${invitation.lastName}`
          : "New User";
      const emailResult = await sendInvitationEmail(
        invitation.email,
        userName,
        invitation.code,
        role.name,
        department.name
      );

      if (emailResult.success) {
        await invitation.markEmailSent();
        emailResults.push({
          email: email,
          status: "sent",
          messageId: emailResult.messageId,
        });
      } else {
        await invitation.markEmailFailed(emailResult.error);
        emailResults.push({
          email: email,
          status: "failed",
          error: emailResult.error,
        });
      }

      invitations.push(invitation);

      // Log audit
      await AuditService.logUserAction(
        currentUser._id,
        "BULK_INVITATION_CREATED",
        invitation._id,
        {
          email: email,
          batchId: batchId,
          department: department.name,
          role: role.name,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );
    } catch (error) {
      const errorMsg = `Error creating invitation for ${email}: ${error.message}`;
      errors.push(errorMsg);
    }
  }

  // Calculate statistics
  const successfulInvitations = invitations.length;
  const failedEmails = emailResults.filter((r) => r.status === "failed").length;
  const successfulEmails = emailResults.filter(
    (r) => r.status === "sent"
  ).length;

  try {
    await notificationService.createNotification({
      recipient: currentUser._id,
      type: "BULK_INVITATION_CREATED",
      title: "Bulk Invitations Created Successfully",
      message: `Successfully created ${successfulInvitations} invitations in batch ${batchId}. ${successfulEmails} emails sent, ${failedEmails} failed.`,
      priority: "medium",
      data: {
        batchId: batchId,
        batchName: batchNameFinal,
        totalEmails: validEmails.length,
        successfulInvitations: successfulInvitations,
        failedInvitations: errors.length,
        emailsSent: successfulEmails,
        emailsFailed: failedEmails,
        department: department.name,
        role: role.name,
      },
    });
  } catch (notificationError) {
    console.error(
      "❌ [BULK_INVITATION] Failed to send in-app notification:",
      notificationError
    );
  }

  res.status(201).json({
    success: true,
    message: `Bulk invitations created successfully`,
    data: {
      batchId: batchId,
      batchName: batchNameFinal,
      statistics: {
        totalEmails: validEmails.length,
        successfulInvitations: successfulInvitations,
        failedInvitations: errors.length,
        emailsSent: successfulEmails,
        emailsFailed: failedEmails,
        isSingleInvitation: false,
      },
      invitations: invitations.map((inv) => ({
        id: inv._id,
        email: inv.email,
        firstName: inv.firstName,
        lastName: inv.lastName,
        code: inv.code,
        status: inv.status,
        emailSent: inv.emailSent,
      })),
      errors: errors,
      emailResults: emailResults,
    },
  });
});

// @desc    Get batch invitation statistics
// @route   GET /api/invitations/batch/:batchId
// @access  Private (HOD and Super Admin)
export const getBatchInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { batchId } = req.params;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  const invitations = await Invitation.find({
    batchId: batchId,
  }).populate("department role");

  if (invitations.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Batch not found",
    });
  }

  const statistics = {
    total: invitations.length,
    active: invitations.filter((inv) => inv.status === "active").length,
    sent: invitations.filter((inv) => inv.status === "sent").length,
    used: invitations.filter((inv) => inv.status === "used").length,
    expired: invitations.filter((inv) => inv.status === "expired").length,
    failed: invitations.filter((inv) => inv.status === "failed").length,
  };

  res.json({
    success: true,
    data: {
      batchId: batchId,
      batchName: invitations[0].batchName,
      statistics: statistics,
      invitations: invitations.map((inv) => ({
        id: inv._id,
        email: inv.email,
        firstName: inv.firstName,
        lastName: inv.lastName,
        code: inv.code,
        status: inv.status,
        emailSent: inv.emailSent,
        emailSentAt: inv.emailSentAt,
        usedAt: inv.usedAt,
        expiresAt: inv.expiresAt,
        department: inv.department?.name,
        role: inv.role?.name,
      })),
    },
  });
});

// @desc    Search batches by batch ID or name
// @route   GET /api/invitations/search-batches
// @access  Private (HOD and Super Admin)
export const searchBatches = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { query, type = "batch", page = 1, limit = 10 } = req.query;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  // Build search filter based on type
  let filter = {};

  if (type === "batch") {
    // Original batch search logic
    filter = {
      batchId: { $exists: true, $ne: null },
      $or: [
        { batchId: { $regex: query, $options: "i" } },
        { batchName: { $regex: query, $options: "i" } },
      ],
    };
  } else {
    // For other search types, search individual invitations
    switch (type) {
      case "email":
        filter.email = { $regex: query, $options: "i" };
        break;
      case "code":
        filter.code = { $regex: query, $options: "i" };
        break;
      case "department":
        // First find departments matching the query
        const departments = await Department.find({
          name: { $regex: query, $options: "i" },
        });
        const departmentIds = departments.map((d) => d._id);
        filter.department = { $in: departmentIds };
        break;
      case "role":
        // First find roles matching the query
        const roles = await Role.find({
          name: { $regex: query, $options: "i" },
        });
        const roleIds = roles.map((r) => r._id);
        filter.role = { $in: roleIds };
        break;
      default:
        // Search across multiple fields
        filter.$or = [
          { email: { $regex: query, $options: "i" } },
          { code: { $regex: query, $options: "i" } },
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
        ];
    }
  }

  // Pagination
  const skip = (page - 1) * limit;

  if (type === "batch") {
    // Original batch search logic
    const batches = await Invitation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$batchId",
          batchName: { $first: "$batchName" },
          totalInvitations: { $sum: 1 },
          activeInvitations: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          sentInvitations: {
            $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
          },
          usedInvitations: {
            $sum: { $cond: [{ $eq: ["$status", "used"] }, 1, 0] },
          },
          expiredInvitations: {
            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
          },
          failedInvitations: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          createdAt: { $first: "$createdAt" },
          department: { $first: "$department" },
          role: { $first: "$role" },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // Get total count for pagination
    const totalBatches = await Invitation.aggregate([
      { $match: filter },
      { $group: { _id: "$batchId" } },
      { $count: "total" },
    ]);

    const total = totalBatches.length > 0 ? totalBatches[0].total : 0;

    // Populate department and role names
    const populatedBatches = await Promise.all(
      batches.map(async (batch) => {
        const department = await Department.findById(batch.department);
        const role = await Role.findById(batch.role);

        return {
          ...batch,
          department: department ? department.name : "Unknown",
          role: role ? role.name : "Unknown",
        };
      })
    );

    res.json({
      success: true,
      data: {
        batches: populatedBatches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } else {
    // Individual invitation search
    const invitations = await Invitation.find(filter)
      .populate("department", "name")
      .populate("role", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invitation.countDocuments(filter);

    res.json({
      success: true,
      data: {
        invitations: invitations.map((inv) => ({
          _id: inv._id,
          email: inv.email,
          firstName: inv.firstName,
          lastName: inv.lastName,
          code: inv.code,
          status: inv.status,
          emailSent: inv.emailSent,
          emailSentAt: inv.emailSentAt,
          createdAt: inv.createdAt,
          batchId: inv.batchId,
          batchName: inv.batchName,
          department: inv.department,
          role: inv.role,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }
});

// @desc    Create bulk invitations from CSV with detailed employee data
// @route   POST /api/invitations/bulk-csv
// @access  Private (HOD and Super Admin)
export const createBulkInvitationsFromCSV = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  const { csvData, requiresApproval = false, batchName } = req.body;

  if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Valid CSV data is required",
    });
  }

  // Validate CSV structure
  const requiredFields = [
    "email",
    "firstName",
    "lastName",
    "department",
    "role",
  ];
  const missingFields = requiredFields.filter(
    (field) => !csvData[0] || !csvData[0].hasOwnProperty(field)
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required CSV fields: ${missingFields.join(", ")}`,
      requiredFields: [
        "email",
        "firstName",
        "lastName",
        "department",
        "role",
        "jobTitle",
        "phone",
        "employeeId",
      ],
    });
  }

  // Generate batch ID
  const batchId = await Invitation.generateSequentialBatchNumber();
  const batchNameFinal =
    batchName || `CSV_Batch_${new Date().toISOString().split("T")[0]}`;

  // Process CSV data
  const invitations = [];
  const errors = [];
  const validationResults = [];

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowNumber = i + 1;

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        const errorMsg = `Row ${rowNumber}: Invalid email format - ${row.email}`;
        errors.push(errorMsg);
        continue;
      }

      // Check for ANY existing user (active or inactive) with this email
      const existingUser = await User.findOne({
        email: row.email.toLowerCase(),
      });
      if (existingUser) {
        const errorMsg = `Row ${rowNumber}: User with email ${row.email} already exists in the system`;
        errors.push(errorMsg);
        continue;
      }

      // Check for any active invitation
      const existingInvitation = await Invitation.findOne({
        email: row.email.toLowerCase(),
        status: { $in: ["active", "sent", "pending_approval"] },
      });

      if (existingInvitation) {
        const errorMsg = `Row ${rowNumber}: Active invitation already exists for ${row.email}`;
        errors.push(errorMsg);
        continue;
      }

      // Check for used invitation (means user already registered)
      const usedInvitation = await Invitation.findOne({
        email: row.email.toLowerCase(),
        status: "used",
      });

      if (usedInvitation) {
        const errorMsg = `Row ${rowNumber}: An invitation for ${row.email} was already used. User has already registered.`;
        errors.push(errorMsg);
        continue;
      }

      // Validate department
      const department = await Department.findOne({
        name: { $regex: new RegExp(row.department, "i") },
      });

      if (!department) {
        const errorMsg = `Row ${rowNumber}: Department "${row.department}" not found`;
        errors.push(errorMsg);
        continue;
      }

      // Validate role
      const role = await Role.findOne({
        name: { $regex: new RegExp(row.role, "i") },
      });

      if (!role) {
        const errorMsg = `Row ${rowNumber}: Role "${row.role}" not found`;
        errors.push(errorMsg);
        continue;
      }

      // Check if department already has a HOD and this is a HOD invitation
      const existingHOD = await checkExistingHOD(department._id, role._id);
      const offboardingHOD = await checkOffboardingHOD(
        department._id,
        role._id
      );

      if (existingHOD && !req.body.replaceExistingHOD) {
        const errorMsg = `Row ${rowNumber}: Department "${department.name}" already has HOD: ${existingHOD.fullName}`;
        errors.push(errorMsg);
        continue;
      }

      // If replacing HOD, deactivate the existing one
      if (existingHOD && req.body.replaceExistingHOD) {
        existingHOD.isActive = false;
        existingHOD.status = "INACTIVE";
        existingHOD.deactivatedAt = new Date();
        existingHOD.deactivatedBy = currentUser._id;
        existingHOD.deactivationReason = "Replaced by new HOD invitation";
        await existingHOD.save();
      }

      // Determine invitation status based on approval requirements and role level
      let invitationStatus = "active";
      if (requiresApproval || role.level >= 80) {
        invitationStatus = "pending_approval";
      }

      // Create invitation
      const invitation = await Invitation.create({
        email: row.email.toLowerCase(),
        firstName: row.firstName,
        lastName: row.lastName,
        position: row.jobTitle || row.position || "",
        jobTitle: row.jobTitle || "",
        phone: row.phone || "",
        employeeId: row.employeeId || "",
        department: department._id,
        role: role._id,
        createdBy: currentUser._id,
        batchId: batchId,
        batchName: batchNameFinal,
        csvRowNumber: rowNumber,
        status: invitationStatus,
        requiresApproval: requiresApproval || role.level >= 80,
        approvalLevel: role.level,
      });

      invitations.push(invitation);

      // Send invitation email only if auto-approved
      if (invitationStatus === "active") {
        const emailResult = await sendInvitationEmail(
          invitation.email,
          `${invitation.firstName} ${invitation.lastName}`,
          invitation.code,
          role.name,
          department.name
        );

        if (emailResult.success) {
          await invitation.markEmailSent();
        } else {
          await invitation.markEmailFailed(emailResult.error);
        }
      }

      // Log audit
      await AuditService.logUserAction(
        currentUser._id,
        "CSV_BULK_INVITATION_CREATED",
        invitation._id,
        {
          email: row.email,
          batchId: batchId,
          department: department.name,
          role: role.name,
          status: invitationStatus,
          requiresApproval: invitation.requiresApproval,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );

      validationResults.push({
        row: rowNumber,
        email: row.email,
        status: "success",
        invitationId: invitation._id,
        invitationStatus: invitationStatus,
      });
    } catch (error) {
      const errorMsg = `Row ${rowNumber}: Error creating invitation for ${row.email}: ${error.message}`;
      errors.push(errorMsg);
      validationResults.push({
        row: rowNumber,
        email: row.email,
        status: "error",
        error: error.message,
      });
    }
  }

  // Calculate statistics
  const successfulInvitations = invitations.length;
  const pendingApproval = invitations.filter(
    (inv) => inv.status === "pending_approval"
  ).length;
  const autoApproved = invitations.filter(
    (inv) => inv.status === "active"
  ).length;

  // Send in-app notification to the creator
  try {
    await notificationService.createNotification({
      recipient: currentUser._id,
      type: "BULK_INVITATION_CREATED",
      title: "CSV Bulk Invitations Created Successfully",
      message: `Successfully processed ${successfulInvitations} invitations from CSV. ${pendingApproval} pending approval, ${autoApproved} auto-approved.`,
      priority: "medium",
      data: {
        batchId: batchId,
        batchName: batchNameFinal,
        totalRows: csvData.length,
        successfulInvitations: successfulInvitations,
        pendingApproval: pendingApproval,
        autoApproved: autoApproved,
        errors: errors.length,
        requiresApproval: requiresApproval,
      },
    });
  } catch (notificationError) {
    console.error(
      "❌ [CSV_BULK_INVITATION] Failed to send in-app notification:",
      notificationError
    );
  }

  res.status(201).json({
    success: true,
    message: `CSV bulk invitations processed successfully`,
    data: {
      batchId: batchId,
      batchName: batchNameFinal,
      requiresApproval: requiresApproval,
      statistics: {
        totalRows: csvData.length,
        successfulInvitations: successfulInvitations,
        pendingApproval: pendingApproval,
        autoApproved: autoApproved,
        errors: errors.length,
        isSingleInvitation: false,
      },
      invitations: invitations.map((inv) => ({
        id: inv._id,
        email: inv.email,
        firstName: inv.firstName,
        lastName: inv.lastName,
        code: inv.code,
        status: inv.status,
        requiresApproval: inv.requiresApproval,
        emailSent: inv.emailSent,
      })),
      errors: errors,
      validationResults: validationResults,
    },
  });
});

// @desc    Approve pending CSV bulk invitations
// @route   POST /api/invitations/batch/:batchId/approve
// @access  Private (HOD and Super Admin)
export const approveBulkInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { batchId } = req.params;
  const { invitationIds, approveAll = false } = req.body;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  // Find pending invitations
  let pendingInvitations;
  if (approveAll) {
    pendingInvitations = await Invitation.find({
      batchId: batchId,
      status: "pending_approval",
    }).populate("department role");
  } else {
    pendingInvitations = await Invitation.find({
      _id: { $in: invitationIds },
      batchId: batchId,
      status: "pending_approval",
    }).populate("department role");
  }

  if (pendingInvitations.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No pending invitations found for approval",
    });
  }

  const approvedInvitations = [];
  const emailResults = [];
  const errors = [];

  for (const invitation of pendingInvitations) {
    try {
      // Update invitation status
      invitation.status = "active";
      invitation.approvedBy = currentUser._id;
      invitation.approvedAt = new Date();
      await invitation.save();

      // Send invitation email
      const emailResult = await sendInvitationEmail(
        invitation.email,
        `${invitation.firstName} ${invitation.lastName}`,
        invitation.code,
        "ELRA",
        invitation.role.name,
        invitation.department.name
      );

      if (emailResult.success) {
        await invitation.markEmailSent();
        emailResults.push({
          email: invitation.email,
          status: "sent",
          messageId: emailResult.messageId,
        });
      } else {
        await invitation.markEmailFailed(emailResult.error);
        emailResults.push({
          email: invitation.email,
          status: "failed",
          error: emailResult.error,
        });
      }

      approvedInvitations.push(invitation);

      // Log audit
      await AuditService.logUserAction(
        currentUser._id,
        "BULK_INVITATION_APPROVED",
        invitation._id,
        {
          email: invitation.email,
          batchId: batchId,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );
    } catch (error) {
      const errorMsg = `Error approving invitation for ${invitation.email}: ${error.message}`;
      errors.push(errorMsg);
    }
  }

  const successfulApprovals = approvedInvitations.length;
  const emailsSent = emailResults.filter((r) => r.status === "sent").length;
  const emailsFailed = emailResults.filter((r) => r.status === "failed").length;

  res.json({
    success: true,
    message: `Bulk invitations approved successfully`,
    data: {
      batchId: batchId,
      statistics: {
        totalPending: pendingInvitations.length,
        successfulApprovals,
        emailsSent,
        emailsFailed,
        errors: errors.length,
      },
      approvedInvitations: approvedInvitations.map((inv) => ({
        id: inv._id,
        email: inv.email,
        firstName: inv.firstName,
        lastName: inv.lastName,
        code: inv.code,
        status: inv.status,
        emailSent: inv.emailSent,
      })),
      emailResults: emailResults,
      errors: errors,
    },
  });
});

// @desc    Get next batch number
// @route   GET /api/invitations/next-batch-number
// @access  Private (HOD level or higher)
export const getNextBatchNumber = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  // Check if user has permission (HOD level or higher)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD level or higher required.",
    });
  }

  try {
    const nextBatchNumber = await Invitation.generateSequentialBatchNumber();

    res.status(200).json({
      success: true,
      data: {
        nextBatchNumber,
      },
    });
  } catch (error) {
    console.error("Error generating batch number:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate next batch number",
    });
  }
});

// @desc    Get pending CSV bulk invitations for approval
// @route   GET /api/invitations/pending-approval
// @access  Private (HOD and Super Admin)
export const getPendingApprovalInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { page = 1, limit = 10, batchId } = req.query;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  // Build filter
  const filter = { status: "pending_approval" };
  if (batchId) {
    filter.batchId = batchId;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const pendingInvitations = await Invitation.find(filter)
    .populate("department", "name")
    .populate("role", "name level")
    .populate("createdBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invitation.countDocuments(filter);

  // Group by batch
  const batchGroups = {};
  pendingInvitations.forEach((invitation) => {
    if (!batchGroups[invitation.batchId]) {
      batchGroups[invitation.batchId] = {
        batchId: invitation.batchId,
        batchName: invitation.batchName,
        invitations: [],
        totalCount: 0,
        highPriorityCount: 0,
      };
    }
    batchGroups[invitation.batchId].invitations.push(invitation);
    batchGroups[invitation.batchId].totalCount++;
    if (invitation.approvalLevel >= 80) {
      batchGroups[invitation.batchId].highPriorityCount++;
    }
  });

  res.json({
    success: true,
    data: {
      pendingInvitations,
      batchGroups: Object.values(batchGroups),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Retry failed emails for a batch
// @route   POST /api/invitations/batch/:batchId/retry-emails
// @access  Private (HOD and Super Admin)
export const retryFailedEmails = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { batchId } = req.params;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  // Find all invitations in the batch that failed to send emails
  const failedInvitations = await Invitation.find({
    batchId: batchId,
    emailSent: false,
    status: { $in: ["active", "sent"] },
  }).populate("department role");

  if (failedInvitations.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No failed emails found to retry",
      data: {
        batchId: batchId,
        statistics: {
          totalFailed: 0,
          emailsSent: 0,
          emailsFailed: 0,
        },
      },
    });
  }

  const emailResults = [];
  const errors = [];

  for (let i = 0; i < failedInvitations.length; i++) {
    const invitation = failedInvitations[i];

    try {
      // Send invitation email
      const emailResult = await sendInvitationEmail(
        invitation.email,
        `${invitation.firstName} ${invitation.lastName}`,
        invitation.code,
        "ELRA",
        invitation.role?.name || "User",
        invitation.department?.name || "Department"
      );

      if (emailResult.success) {
        await invitation.markEmailSent();
        emailResults.push({
          email: invitation.email,
          status: "sent",
          messageId: emailResult.messageId,
        });
      } else {
        await invitation.markEmailFailed(emailResult.error);
        emailResults.push({
          email: invitation.email,
          status: "failed",
          error: emailResult.error,
        });
      }
    } catch (error) {
      const errorMsg = `Error retrying email for ${invitation.email}: ${error.message}`;
      errors.push(errorMsg);
      emailResults.push({
        email: invitation.email,
        status: "failed",
        error: error.message,
      });
    }
  }

  // Calculate statistics
  const emailsSent = emailResults.filter((r) => r.status === "sent").length;
  const emailsFailed = emailResults.filter((r) => r.status === "failed").length;

  res.status(200).json({
    success: true,
    message: `Email retry completed for batch ${batchId}`,
    data: {
      batchId: batchId,
      statistics: {
        totalFailed: failedInvitations.length,
        emailsSent: emailsSent,
        emailsFailed: emailsFailed,
      },
      emailResults: emailResults,
      errors: errors,
    },
  });
});

// @desc    Retry failed email for a single invitation
// @route   POST /api/invitations/:invitationId/retry-email
// @access  Private (HOD and Super Admin)
export const retrySingleEmail = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { invitationId } = req.params;

  // Check if user is HOD (700) or Super Admin (1000)
  if (currentUser.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HOD or Super Admin privileges required.",
    });
  }

  // Find the invitation
  const invitation = await Invitation.findById(invitationId).populate(
    "department role"
  );

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: "Invitation not found",
    });
  }

  try {
    // Send invitation email
    const emailResult = await sendInvitationEmail(
      invitation.email,
      `${invitation.firstName} ${invitation.lastName}`,
      invitation.code,
      "ELRA",
      invitation.role?.name || "User",
      invitation.department?.name || "Department"
    );

    if (emailResult.success) {
      await invitation.markEmailSent();

      res.status(200).json({
        success: true,
        message: `Email sent successfully to ${invitation.email}`,
        data: {
          invitation: {
            id: invitation._id,
            email: invitation.email,
            firstName: invitation.firstName,
            lastName: invitation.lastName,
            status: invitation.status,
            emailSent: true,
            emailSentAt: invitation.emailSentAt,
          },
          emailResult: {
            status: "sent",
            messageId: emailResult.messageId,
          },
        },
      });
    } else {
      await invitation.markEmailFailed(emailResult.error);

      res.status(400).json({
        success: false,
        message: `Failed to send email to ${invitation.email}`,
        data: {
          invitation: {
            id: invitation._id,
            email: invitation.email,
            status: invitation.status,
            emailSent: false,
            emailError: emailResult.error,
          },
          emailResult: {
            status: "failed",
            error: emailResult.error,
          },
        },
      });
    }
  } catch (error) {
    const errorMsg = `Error retrying email for ${invitation.email}: ${error.message}`;

    res.status(500).json({
      success: false,
      message: errorMsg,
      data: {
        invitation: {
          id: invitation._id,
          email: invitation.email,
          status: invitation.status,
          emailSent: false,
          emailError: error.message,
        },
      },
    });
  }
});
