import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import EmployeeLifecycle from "../models/EmployeeLifecycle.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AuditService from "../services/auditService.js";
import { generateEmployeeId } from "../utils/employeeIdGenerator.js";
import NotificationService from "../services/notificationService.js";

const notificationService = new NotificationService();

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

  const username = invitation.email.split("@")[0];

  let employeeId;
  try {
    employeeId = await generateEmployeeId(invitation.department._id);
    console.log("🆔 Generated employee ID:", employeeId);
  } catch (error) {
    console.error("❌ Error generating employee ID:", error);
    employeeId = null;
  }

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
    employeeId: employeeId,
    status: "ACTIVE",
    isEmailVerified: true,
  };

  console.log("🔐 [PASSWORD] Password before user creation:", {
    originalPassword: password,
    passwordLength: password.length,
    passwordType: typeof password,
    willBeHashed: true,
  });

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

    console.log("🔐 [PASSWORD] Password after user creation:", {
      hashedPassword: user.password,
      hashedPasswordLength: user.password?.length,
      hashedPasswordType: typeof user.password,
      isHashed:
        user.password?.startsWith("$2b$") || user.password?.startsWith("$2a$"),
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
  }

  try {
    console.log(
      "🚀 [ONBOARDING] Starting onboarding lifecycle creation for user:",
      user.email
    );
    console.log("🚀 [ONBOARDING] Department ID:", invitation.department._id);
    console.log("🚀 [ONBOARDING] Role ID:", invitation.role._id);

    // Create Onboarding lifecycle
    const onboardingLifecycle = await EmployeeLifecycle.createStandardLifecycle(
      user._id,
      "Onboarding",
      invitation.department._id,
      invitation.role._id,
      invitation.createdBy || user._id,
      invitation.createdBy || user._id
    );

    console.log("✅ [ONBOARDING] Onboarding lifecycle created successfully:", {
      lifecycleId: onboardingLifecycle._id,
      employeeId: user._id,
      type: "Onboarding",
      status: onboardingLifecycle.status,
      tasksCount: onboardingLifecycle.tasks?.length || 0,
      tasks:
        onboardingLifecycle.tasks?.map((task) => ({
          title: task.title,
          status: task.status,
          assignedTo: task.assignedTo,
        })) || [],
    });

    // Create Offboarding lifecycle (for future use when employee leaves)
    const offboardingLifecycle =
      await EmployeeLifecycle.createStandardLifecycle(
        user._id,
        "Offboarding",
        invitation.department._id,
        invitation.role._id,
        invitation.createdBy || user._id,
        invitation.createdBy || user._id
      );

    // Mark offboarding as "On Hold" since employee is just starting
    offboardingLifecycle.status = "On Hold";
    offboardingLifecycle.notes =
      "Offboarding lifecycle created for future use when employee leaves the company";
    await offboardingLifecycle.save();

    console.log("✅ Offboarding lifecycle created:", {
      lifecycleId: offboardingLifecycle._id,
      employeeId: user._id,
      type: "Offboarding",
      status: "On Hold",
    });
  } catch (error) {
    console.error("❌ Error creating lifecycles:", error);
  }

  await AuditService.logUserAction(
    user._id,
    "USER_REGISTERED_FROM_INVITATION",
    invitation._id,
    {
      email: invitation.email,
      role: invitation.role.name,
      department: invitation.department.name,
      salaryGrade: invitation.salaryGrade,
      employeeIdString: employeeId,
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    }
  );

  try {
    await notificationService.createNotification({
      recipient: user._id,
      type: "WELCOME_ONBOARDING",
      title: "🎉 Welcome to ELRA!",
      message: `Welcome to ELRA! Your account has been created successfully. To get started, please complete your onboarding process. This will help you access all platform features and become eligible for payroll. Your onboarding tasks are now available in your dashboard.`,
      priority: "HIGH",
      category: "ONBOARDING",
      actionUrl: "/dashboard",
      metadata: {
        employeeId: employeeId,
        department: invitation.department.name,
        role: invitation.role.name,
        onboardingRequired: true,
      },
    });

    console.log("✅ Welcome notification created for new user:", user.email);
  } catch (notificationError) {
    console.error("❌ Error creating welcome notification:", notificationError);
    // Don't fail the registration if notification fails
  }

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
        employeeId: employeeId,
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
