import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import { sendInvitationEmail } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";

const notificationService = new NotificationService();

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
  console.log("🚀 [INVITATION] Starting single invitation creation...");
  console.log("📋 [INVITATION] Request body:", req.body);

  const currentUser = req.user;
  console.log("👤 [INVITATION] Current user:", {
    id: currentUser._id,
    email: currentUser.email,
    roleLevel: currentUser.role?.level,
    roleName: currentUser.role?.name,
    company: currentUser.company,
  });

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

  console.log("📝 [INVITATION] Parsed invitation data:", {
    email,
    firstName,
    lastName,
    position,
    departmentId,
    roleId,
    notes,
    isPendingUser,
    userId,
  });

  // Check permissions - Super Admin or users with canManageUsers permission
  const canInviteUsers =
    currentUser.role.level >= 100 ||
    currentUser.role.permissions?.includes("user.manage");

  console.log("🔐 [INVITATION] Permission check:", {
    userRoleLevel: currentUser.role.level,
    hasUserManagePermission:
      currentUser.role.permissions?.includes("user.manage"),
    canInviteUsers,
  });

  if (!canInviteUsers) {
    console.log("❌ [INVITATION] Permission denied - user cannot invite");
    return res.status(403).json({
      success: false,
      message: "Access denied. User management privileges required.",
    });
  }

  // Validate required fields
  if (!email || !firstName || !lastName || !departmentId || !roleId) {
    console.log("❌ [INVITATION] Missing required fields:", {
      hasEmail: !!email,
      hasFirstName: !!firstName,
      hasLastName: !!lastName,
      hasDepartmentId: !!departmentId,
      hasRoleId: !!roleId,
    });
    return res.status(400).json({
      success: false,
      message:
        "Email, first name, last name, department, and role are required",
    });
  }

  console.log("✅ [INVITATION] All required fields present");

  if (isPendingUser && userId) {
    console.log("🔄 [INVITATION] Processing pending user invitation...");
    const pendingUser = await User.findById(userId);
    if (!pendingUser) {
      console.log("❌ [INVITATION] Pending user not found:", userId);
      return res.status(404).json({
        success: false,
        message: "Pending user not found",
      });
    }

    console.log("📋 [INVITATION] Pending user found:", {
      id: pendingUser._id,
      email: pendingUser.email,
      status: pendingUser.status,
    });

    if (pendingUser.status !== "PENDING_REGISTRATION") {
      console.log(
        "❌ [INVITATION] User not in pending registration status:",
        pendingUser.status
      );
      return res.status(400).json({
        success: false,
        message: "User is not in pending registration status",
      });
    }
  } else {
    console.log("🔍 [INVITATION] Checking for existing user...");
    const existingUser = await User.findByEmailOrUsername(email);
    if (existingUser) {
      console.log("❌ [INVITATION] User already exists:", {
        id: existingUser._id,
        email: existingUser.email,
        status: existingUser.status,
      });
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    console.log("✅ [INVITATION] No existing user found");
  }

  // Check if invitation already exists for this email
  console.log("🔍 [INVITATION] Checking for existing invitations...");
  const existingInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    status: "active",
  });

  if (existingInvitation) {
    console.log("❌ [INVITATION] Active invitation already exists:", {
      id: existingInvitation._id,
      email: existingInvitation.email,
      status: existingInvitation.status,
      createdAt: existingInvitation.createdAt,
    });
    return res.status(400).json({
      success: false,
      message: "Active invitation already exists for this email",
    });
  }
  console.log("✅ [INVITATION] No existing active invitations found");

  // Validate department exists
  console.log("🏢 [INVITATION] Validating department...");
  const department = await Department.findById(departmentId);

  if (!department) {
    console.log("❌ [INVITATION] Invalid department:", {
      departmentId,
    });
    return res.status(400).json({
      success: false,
      message: "Invalid department",
    });
  }
  console.log("✅ [INVITATION] Department validated:", {
    id: department._id,
    name: department.name,
  });

  // Validate role exists
  console.log("👥 [INVITATION] Validating role...");
  const role = await Role.findById(roleId);
  if (!role) {
    console.log("❌ [INVITATION] Invalid role:", roleId);
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }
  console.log("✅ [INVITATION] Role validated:", {
    id: role._id,
    name: role.name,
    level: role.level,
  });

  // Create invitation
  console.log("📝 [INVITATION] Creating invitation...");
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

  console.log("✅ [INVITATION] Invitation created successfully:", {
    id: invitation._id,
    code: invitation.code,
    email: invitation.email,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
  });

  // If this is for a pending user, update their status
  if (isPendingUser && userId) {
    console.log("🔄 [INVITATION] Updating pending user status...");
    await User.findByIdAndUpdate(userId, {
      status: "INVITED",
      invitedAt: new Date(),
    });
    console.log("✅ [INVITATION] Pending user status updated to INVITED");
  }

  // Send invitation email
  console.log("📧 [INVITATION] Sending invitation email...");
  const emailResult = await sendInvitationEmail(
    invitation.email,
    `${invitation.firstName} ${invitation.lastName}`,
    invitation.code,
    role.name,
    department.name
  );

  console.log("📧 [INVITATION] Email send result:", {
    success: emailResult.success,
    messageId: emailResult.messageId,
    error: emailResult.error,
  });

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
    console.log("✅ [INVITATION] In-app notification sent to creator");
  } catch (notificationError) {
    console.error(
      "❌ [INVITATION] Failed to send in-app notification:",
      notificationError
    );
  }

  console.log("🎉 [INVITATION] Invitation creation completed successfully");

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
// @access  Private (Super Admin)
export const getSalaryGrades = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  // Check if user is super admin
  if (currentUser.role.level < 1000) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
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
export const createBulkInvitations = asyncHandler(async (req, res) => {
  console.log("🚀 [BULK_INVITATION] Starting bulk invitation creation...");
  console.log("📋 [BULK_INVITATION] Request body:", req.body);

  const currentUser = req.user;
  console.log("👤 [BULK_INVITATION] Current user:", {
    id: currentUser._id,
    email: currentUser.email,
    roleLevel: currentUser.role?.level,
    roleName: currentUser.role?.name,
  });

  // Check if user is super admin
  if (currentUser.role.level < 1000) {
    console.log("❌ [BULK_INVITATION] Permission denied - not super admin");
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  const { emails, departmentId, roleId, batchName } = req.body;

  console.log("📝 [BULK_INVITATION] Parsed bulk invitation data:", {
    emailCount: emails ? emails.length : 0,
    departmentId,
    roleId,
    batchName,
  });

  if (!emails || !departmentId || !roleId) {
    console.log("❌ [BULK_INVITATION] Missing required fields:", {
      hasEmails: !!emails,
      hasDepartmentId: !!departmentId,
      hasRoleId: !!roleId,
    });
    return res.status(400).json({
      success: false,
      message: "Emails, department, and role are required",
    });
  }

  // Validate and process emails
  console.log("📧 [BULK_INVITATION] Processing emails...");
  const { validEmails, invalidEmails } = validateEmails(emails);

  console.log("📊 [BULK_INVITATION] Email validation results:", {
    totalEmails: emails.length,
    validEmails: validEmails.length,
    invalidEmails: invalidEmails.length,
    invalidEmailList: invalidEmails,
  });

  if (validEmails.length === 0) {
    console.log("❌ [BULK_INVITATION] No valid email addresses provided");
    return res.status(400).json({
      success: false,
      message: "No valid email addresses provided",
    });
  }

  if (invalidEmails.length > 0) {
    console.log(
      "⚠️ [BULK_INVITATION] Some email addresses are invalid:",
      invalidEmails
    );
    return res.status(400).json({
      success: false,
      message: "Some email addresses are invalid",
      invalidEmails: invalidEmails,
    });
  }

  // Validate department
  console.log("🏢 [BULK_INVITATION] Validating department...");
  const department = await Department.findById(departmentId);

  if (!department) {
    console.log("❌ [BULK_INVITATION] Invalid department:", {
      departmentId,
    });
    return res.status(400).json({
      success: false,
      message: "Invalid department",
    });
  }
  console.log("✅ [BULK_INVITATION] Department validated:", {
    id: department._id,
    name: department.name,
  });

  console.log("👥 [BULK_INVITATION] Validating role...");
  const role = await Role.findById(roleId);
  if (!role) {
    console.log("❌ [BULK_INVITATION] Invalid role:", roleId);
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }
  console.log("✅ [BULK_INVITATION] Role validated:", {
    id: role._id,
    name: role.name,
    level: role.level,
  });

  // Generate sequential batch ID only for bulk invitations
  console.log("🆔 [BULK_INVITATION] Generating batch ID...");
  const batchId = await Invitation.generateSequentialBatchNumber();
  const batchNameFinal =
    batchName || `Batch_${new Date().toISOString().split("T")[0]}`;

  console.log("🆔 [BULK_INVITATION] Batch info:", {
    batchId,
    batchName: batchNameFinal,
  });

  // Create invitations
  console.log(
    "📝 [BULK_INVITATION] Starting invitation creation for",
    validEmails.length,
    "emails..."
  );
  const invitations = [];
  const emailResults = [];
  const errors = [];

  for (let i = 0; i < validEmails.length; i++) {
    const email = validEmails[i];
    console.log(
      `📧 [BULK_INVITATION] Processing email ${i + 1}/${
        validEmails.length
      }: ${email}`
    );

    try {
      // Check if user already exists
      const existingUser = await User.findByEmailOrUsername(email);
      if (existingUser) {
        const errorMsg = `User with email ${email} already exists`;
        console.log(`❌ [BULK_INVITATION] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({
        email: email,
        status: { $in: ["active", "sent"] },
      });

      if (existingInvitation) {
        const errorMsg = `Active invitation already exists for ${email}`;
        console.log(`❌ [BULK_INVITATION] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      // Generate username from email
      const username = email.split("@")[0];
      const firstName = username.split(".")[0] || username;
      const lastName = username.split(".")[1] || "User";

      console.log(
        `📝 [BULK_INVITATION] Creating invitation for ${email} (${firstName} ${lastName})`
      );

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

      console.log(`✅ [BULK_INVITATION] Invitation created for ${email}:`, {
        id: invitation._id,
        code: invitation.code,
        status: invitation.status,
      });

      // Send invitation email
      console.log(`📧 [BULK_INVITATION] Sending email to ${email}...`);
      const emailResult = await sendInvitationEmail(
        invitation.email,
        `${invitation.firstName} ${invitation.lastName}`,
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
        console.log(`✅ [BULK_INVITATION] Email sent successfully to ${email}`);
      } else {
        await invitation.markEmailFailed(emailResult.error);
        emailResults.push({
          email: email,
          status: "failed",
          error: emailResult.error,
        });
        console.log(
          `❌ [BULK_INVITATION] Email failed for ${email}:`,
          emailResult.error
        );
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
      console.log(`📋 [BULK_INVITATION] Audit log created for ${email}`);
    } catch (error) {
      const errorMsg = `Error creating invitation for ${email}: ${error.message}`;
      console.log(`❌ [BULK_INVITATION] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // Calculate statistics
  const successfulInvitations = invitations.length;
  const failedEmails = emailResults.filter((r) => r.status === "failed").length;
  const successfulEmails = emailResults.filter(
    (r) => r.status === "sent"
  ).length;

  console.log("📊 [BULK_INVITATION] Final statistics:", {
    totalEmails: validEmails.length,
    successfulInvitations,
    failedInvitations: errors.length,
    emailsSent: successfulEmails,
    emailsFailed: failedEmails,
    batchId,
    batchName: batchNameFinal,
  });

  console.log("🎉 [BULK_INVITATION] Bulk invitation creation completed");

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
    console.log("✅ [BULK_INVITATION] In-app notification sent to creator");
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
// @access  Private (Super Admin)
export const getBatchInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { batchId } = req.params;

  // Check if user is super admin
  if (currentUser.role.level < 100) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
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
// @access  Private (Super Admin)
export const searchBatches = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { query, type = "batch", page = 1, limit = 10 } = req.query;

  // Check if user is super admin
  if (currentUser.role.level < 100) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
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
// @access  Private (Super Admin)
export const createBulkInvitationsFromCSV = asyncHandler(async (req, res) => {
  console.log(
    "🚀 [CSV_BULK_INVITATION] Starting CSV-based bulk invitation creation..."
  );
  console.log("📋 [CSV_BULK_INVITATION] Request body:", req.body);

  const currentUser = req.user;
  console.log("👤 [CSV_BULK_INVITATION] Current user:", {
    id: currentUser._id,
    email: currentUser.email,
    roleLevel: currentUser.role?.level,
    roleName: currentUser.role?.name,
  });

  // Check if user is super admin
  if (currentUser.role.level < 1000) {
    console.log("❌ [CSV_BULK_INVITATION] Permission denied - not super admin");
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  const { csvData, requiresApproval = false, batchName } = req.body;

  console.log("📝 [CSV_BULK_INVITATION] Parsed CSV invitation data:", {
    csvRowCount: csvData ? csvData.length : 0,
    requiresApproval,
    batchName,
  });

  if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
    console.log("❌ [CSV_BULK_INVITATION] Invalid CSV data");
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
    console.log(
      "❌ [CSV_BULK_INVITATION] Missing required CSV fields:",
      missingFields
    );
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

  console.log("🆔 [CSV_BULK_INVITATION] Batch info:", {
    batchId,
    batchName: batchNameFinal,
    requiresApproval,
  });

  // Process CSV data
  const invitations = [];
  const errors = [];
  const validationResults = [];

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowNumber = i + 1;

    console.log(
      `📧 [CSV_BULK_INVITATION] Processing row ${rowNumber}/${csvData.length}: ${row.email}`
    );

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        const errorMsg = `Row ${rowNumber}: Invalid email format - ${row.email}`;
        console.log(`❌ [CSV_BULK_INVITATION] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      // Check if user already exists
      const existingUser = await User.findByEmailOrUsername(row.email);
      if (existingUser) {
        const errorMsg = `Row ${rowNumber}: User with email ${row.email} already exists`;
        console.log(`❌ [CSV_BULK_INVITATION] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({
        email: row.email.toLowerCase(),
        status: { $in: ["active", "sent", "pending_approval"] },
      });

      if (existingInvitation) {
        const errorMsg = `Row ${rowNumber}: Active invitation already exists for ${row.email}`;
        console.log(`❌ [CSV_BULK_INVITATION] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      // Validate department
      const department = await Department.findOne({
        name: { $regex: new RegExp(row.department, "i") },
      });

      if (!department) {
        const errorMsg = `Row ${rowNumber}: Department "${row.department}" not found`;
        console.log(`❌ [CSV_BULK_INVITATION] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      // Validate role
      const role = await Role.findOne({
        name: { $regex: new RegExp(row.role, "i") },
      });

      if (!role) {
        const errorMsg = `Row ${rowNumber}: Role "${row.role}" not found`;
        console.log(`❌ [CSV_BULK_INVITATION] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      // Determine invitation status based on approval requirements and role level
      let invitationStatus = "active";
      if (requiresApproval || role.level >= 80) {
        invitationStatus = "pending_approval";
      }

      console.log(
        `📝 [CSV_BULK_INVITATION] Creating invitation for ${row.email} (${row.firstName} ${row.lastName}) - Status: ${invitationStatus}`
      );

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

      console.log(
        `✅ [CSV_BULK_INVITATION] Invitation created for ${row.email}:`,
        {
          id: invitation._id,
          code: invitation.code,
          status: invitation.status,
        }
      );

      invitations.push(invitation);

      // Send invitation email only if auto-approved
      if (invitationStatus === "active") {
        console.log(
          `📧 [CSV_BULK_INVITATION] Sending email to ${row.email}...`
        );
        const emailResult = await sendInvitationEmail(
          invitation.email,
          `${invitation.firstName} ${invitation.lastName}`,
          invitation.code,
          role.name,
          department.name
        );

        if (emailResult.success) {
          await invitation.markEmailSent();
          console.log(
            `✅ [CSV_BULK_INVITATION] Email sent successfully to ${row.email}`
          );
        } else {
          await invitation.markEmailFailed(emailResult.error);
          console.log(
            `❌ [CSV_BULK_INVITATION] Email failed for ${row.email}:`,
            emailResult.error
          );
        }
      } else {
        console.log(
          `⏳ [CSV_BULK_INVITATION] Invitation pending approval for ${row.email}`
        );
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
      console.log(`❌ [CSV_BULK_INVITATION] ${errorMsg}`);
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

  console.log("📊 [CSV_BULK_INVITATION] Final statistics:", {
    totalRows: csvData.length,
    successfulInvitations,
    pendingApproval,
    autoApproved,
    errors: errors.length,
    batchId,
    batchName: batchNameFinal,
  });

  console.log(
    "🎉 [CSV_BULK_INVITATION] CSV bulk invitation creation completed"
  );

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
    console.log("✅ [CSV_BULK_INVITATION] In-app notification sent to creator");
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
// @access  Private (Super Admin)
export const approveBulkInvitations = asyncHandler(async (req, res) => {
  console.log(
    "🚀 [APPROVE_BULK_INVITATION] Starting bulk invitation approval..."
  );

  const currentUser = req.user;
  const { batchId } = req.params;
  const { invitationIds, approveAll = false } = req.body;

  console.log("👤 [APPROVE_BULK_INVITATION] Current user:", {
    id: currentUser._id,
    email: currentUser.email,
    roleLevel: currentUser.role?.level,
  });

  // Check if user is super admin
  if (currentUser.role.level < 1000) {
    console.log(
      "❌ [APPROVE_BULK_INVITATION] Permission denied - not super admin"
    );
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
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
    console.log("❌ [APPROVE_BULK_INVITATION] No pending invitations found");
    return res.status(404).json({
      success: false,
      message: "No pending invitations found for approval",
    });
  }

  console.log(
    `📝 [APPROVE_BULK_INVITATION] Found ${pendingInvitations.length} pending invitations`
  );

  const approvedInvitations = [];
  const emailResults = [];
  const errors = [];

  for (const invitation of pendingInvitations) {
    try {
      console.log(
        `✅ [APPROVE_BULK_INVITATION] Approving invitation for ${invitation.email}`
      );

      // Update invitation status
      invitation.status = "active";
      invitation.approvedBy = currentUser._id;
      invitation.approvedAt = new Date();
      await invitation.save();

      // Send invitation email
      console.log(
        `📧 [APPROVE_BULK_INVITATION] Sending email to ${invitation.email}...`
      );
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
        console.log(
          `✅ [APPROVE_BULK_INVITATION] Email sent successfully to ${invitation.email}`
        );
      } else {
        await invitation.markEmailFailed(emailResult.error);
        emailResults.push({
          email: invitation.email,
          status: "failed",
          error: emailResult.error,
        });
        console.log(
          `❌ [APPROVE_BULK_INVITATION] Email failed for ${invitation.email}:`,
          emailResult.error
        );
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
      console.log(`❌ [APPROVE_BULK_INVITATION] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  const successfulApprovals = approvedInvitations.length;
  const emailsSent = emailResults.filter((r) => r.status === "sent").length;
  const emailsFailed = emailResults.filter((r) => r.status === "failed").length;

  console.log("📊 [APPROVE_BULK_INVITATION] Approval statistics:", {
    totalPending: pendingInvitations.length,
    successfulApprovals,
    emailsSent,
    emailsFailed,
    errors: errors.length,
  });

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
// @access  Private (Super Admin)
export const getNextBatchNumber = asyncHandler(async (req, res) => {
  console.log("🚀 [NEXT_BATCH] Getting next batch number...");

  const currentUser = req.user;
  console.log("👤 [NEXT_BATCH] Current user:", {
    id: currentUser._id,
    email: currentUser.email,
    roleLevel: currentUser.role?.level,
    roleName: currentUser.role?.name,
  });

  // Check if user is super admin
  if (currentUser.role.level < 1000) {
    console.log("❌ [NEXT_BATCH] Permission denied - not super admin");
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  try {
    const nextBatchNumber = await Invitation.generateSequentialBatchNumber();
    console.log(
      "✅ [NEXT_BATCH] Generated next batch number:",
      nextBatchNumber
    );

    res.status(200).json({
      success: true,
      data: {
        nextBatchNumber,
      },
    });
  } catch (error) {
    console.error("❌ [NEXT_BATCH] Error generating batch number:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate next batch number",
    });
  }
});

// @desc    Get pending CSV bulk invitations for approval
// @route   GET /api/invitations/pending-approval
// @access  Private (Super Admin)
export const getPendingApprovalInvitations = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { page = 1, limit = 10, batchId } = req.query;

  console.log("👤 [PENDING_APPROVAL] Current user:", {
    id: currentUser._id,
    email: currentUser.email,
    roleLevel: currentUser.role?.level,
  });

  // Check if user is super admin
  if (currentUser.role.level < 1000) {
    console.log("❌ [PENDING_APPROVAL] Permission denied - not super admin");
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
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

  console.log("📊 [PENDING_APPROVAL] Found pending invitations:", {
    total,
    batchGroups: Object.keys(batchGroups).length,
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
// @access  Private (Super Admin)
export const retryFailedEmails = asyncHandler(async (req, res) => {
  console.log("🔄 [RETRY_EMAILS] Starting email retry for batch...");

  const currentUser = req.user;
  const { batchId } = req.params;

  console.log("👤 [RETRY_EMAILS] Current user:", {
    id: currentUser._id,
    email: currentUser.email,
    roleLevel: currentUser.role?.level,
  });

  // Check if user is super admin
  if (currentUser.role.level < 1000) {
    console.log("❌ [RETRY_EMAILS] Permission denied - not super admin");
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  // Find all invitations in the batch that failed to send emails
  const failedInvitations = await Invitation.find({
    batchId: batchId,
    emailSent: false,
    status: { $in: ["active", "sent"] },
  }).populate("department role");

  if (failedInvitations.length === 0) {
    console.log("ℹ️ [RETRY_EMAILS] No failed emails found for batch:", batchId);
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

  console.log(
    `📧 [RETRY_EMAILS] Found ${failedInvitations.length} failed emails to retry`
  );

  const emailResults = [];
  const errors = [];

  for (let i = 0; i < failedInvitations.length; i++) {
    const invitation = failedInvitations[i];
    console.log(
      `📧 [RETRY_EMAILS] Retrying email ${i + 1}/${failedInvitations.length}: ${
        invitation.email
      }`
    );

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
        console.log(
          `✅ [RETRY_EMAILS] Email sent successfully to ${invitation.email}`
        );
      } else {
        await invitation.markEmailFailed(emailResult.error);
        emailResults.push({
          email: invitation.email,
          status: "failed",
          error: emailResult.error,
        });
        console.log(
          `❌ [RETRY_EMAILS] Email failed for ${invitation.email}:`,
          emailResult.error
        );
      }
    } catch (error) {
      const errorMsg = `Error retrying email for ${invitation.email}: ${error.message}`;
      console.log(`❌ [RETRY_EMAILS] ${errorMsg}`);
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

  console.log("📊 [RETRY_EMAILS] Retry statistics:", {
    totalFailed: failedInvitations.length,
    emailsSent,
    emailsFailed,
    batchId,
  });

  console.log("🎉 [RETRY_EMAILS] Email retry completed");

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
// @access  Private (Super Admin)
export const retrySingleEmail = asyncHandler(async (req, res) => {
  console.log("🔄 [RETRY_SINGLE_EMAIL] Starting single email retry...");

  const currentUser = req.user;
  const { invitationId } = req.params;

  console.log("👤 [RETRY_SINGLE_EMAIL] Current user:", {
    id: currentUser._id,
    email: currentUser.email,
    roleLevel: currentUser.role?.level,
  });

  // Check if user is super admin
  if (currentUser.role.level < 1000) {
    console.log("❌ [RETRY_SINGLE_EMAIL] Permission denied - not super admin");
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
  }

  // Find the invitation
  const invitation = await Invitation.findById(invitationId).populate(
    "department role"
  );

  if (!invitation) {
    console.log("❌ [RETRY_SINGLE_EMAIL] Invitation not found:", invitationId);
    return res.status(404).json({
      success: false,
      message: "Invitation not found",
    });
  }

  console.log(
    `📧 [RETRY_SINGLE_EMAIL] Retrying email for invitation: ${invitation.email}`
  );

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
      console.log(
        `✅ [RETRY_SINGLE_EMAIL] Email sent successfully to ${invitation.email}`
      );

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
      console.log(
        `❌ [RETRY_SINGLE_EMAIL] Email failed for ${invitation.email}:`,
        emailResult.error
      );

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
    console.log(`❌ [RETRY_SINGLE_EMAIL] ${errorMsg}`);

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
