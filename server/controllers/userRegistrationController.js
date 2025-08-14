import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AuditService from "../services/auditService.js";

// @desc    Register user from invitation code
// @route   POST /api/user-registration/register
// @access  Public
export const registerFromInvitation = asyncHandler(async (req, res) => {
  const {
    invitationCode,
    firstName,
    lastName,
    phone,
    password,
    confirmPassword,
  } = req.body;

  // Validate required fields
  if (
    !invitationCode ||
    !firstName ||
    !lastName ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invitation code, first name, last name, and password are required",
    });
  }

  // Validate password match
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match",
    });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  // Find and validate invitation
  const invitation = await Invitation.findOne({
    code: invitationCode.toUpperCase(),
    status: "active",
    expiresAt: { $gt: new Date() },
  }).populate("department role");

  console.log("🔍 Found invitation:", {
    id: invitation?._id,
    code: invitation?.code,
    email: invitation?.email,
    status: invitation?.status,
    role: invitation?.role?._id,
    department: invitation?.department?._id,
  });

  if (!invitation) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired invitation code",
    });
  }

  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(invitation.email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  // Generate username from email
  const username = invitation.email.split("@")[0];

  // Create user with invitation data
  let user;

  const userData = {
    username: username,
    firstName: firstName,
    lastName: lastName,
    email: invitation.email,
    password: password,
    phone: phone || invitation.phone,
    role: invitation.role._id,
    department: invitation.department._id,
    position: invitation.position,
    jobTitle: invitation.jobTitle,
    salaryGrade: invitation.salaryGrade,
    employeeId: invitation.employeeId,
    status: "ACTIVE",
    isEmailVerified: true,
  };

  console.log("👤 Creating user with data:", {
    username: userData.username,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    department: userData.department,
  });

  try {
    user = await User.create(userData);

    console.log("✅ User created successfully:", {
      userId: user._id,
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user account. Please try again.",
      error: error.message,
    });
  }

  // Verify user was created
  if (!user || !user._id) {
    console.error("❌ User creation failed - no user object returned");
    return res.status(500).json({
      success: false,
      message: "Failed to create user account. Please try again.",
    });
  }

  // Mark invitation as used
  try {
    invitation.status = "used";
    invitation.usedBy = user._id;
    invitation.usedAt = new Date();
    await invitation.save();

    console.log("✅ Invitation marked as used:", {
      invitationId: invitation._id,
      usedBy: user._id,
      usedAt: invitation.usedAt,
    });
  } catch (error) {
    console.error("❌ Error marking invitation as used:", error);
    // Continue anyway since user was created successfully
  }

  // Log audit
  await AuditService.logUserAction(
    user._id,
    "USER_REGISTERED_FROM_INVITATION",
    invitation._id,
    {
      email: invitation.email,
      role: invitation.role.name,
      department: invitation.department.name,
      salaryGrade: invitation.salaryGrade,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    }
  );

  res.status(201).json({
    success: true,
    message:
      "🎉 Welcome to ELRA! Your account has been created successfully. You can now proceed to login.",
    data: {
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: invitation.role.name,
        department: invitation.department.name,
        salaryGrade: invitation.salaryGrade,
      },
      invitation: {
        code: invitation.code,
        role: invitation.role.name,
        department: invitation.department.name,
        salaryGrade: invitation.salaryGrade,
      },
      nextSteps: {
        message: "You can now log in to your ELRA account",
        loginUrl: `${process.env.CLIENT_URL}/login`,
        action: "proceed_to_login",
      },
    },
  });
});

// @desc    Get invitation details for registration form
// @route   GET /api/user-registration/invitation/:code
// @access  Public
export const getInvitationDetails = asyncHandler(async (req, res) => {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Invitation code is required",
    });
  }

  // Find invitation
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

  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(invitation.email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  res.json({
    success: true,
    data: {
      invitation: {
        code: invitation.code,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: {
          name: invitation.role.name,
          description: invitation.role.description,
        },
        department: {
          name: invitation.department.name,
          description: invitation.department.description,
        },
        salaryGrade: invitation.salaryGrade,
        expiresAt: invitation.expiresAt,
      },
    },
  });
});

// @desc    Validate invitation code
// @route   POST /api/user-registration/validate-code
// @access  Public
export const validateInvitationCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Invitation code is required",
    });
  }

  // Find invitation
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

  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(invitation.email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  res.json({
    success: true,
    message: "✅ Invitation code verified successfully!",
    data: {
      email: invitation.email,
      role: invitation.role.name,
      department: invitation.department.name,
      salaryGrade: invitation.salaryGrade,
      expiresAt: invitation.expiresAt,
      invitationDetails: {
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        position: invitation.position,
      },
    },
  });
});
