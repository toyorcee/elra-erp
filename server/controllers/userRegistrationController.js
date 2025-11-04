import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import EmployeeLifecycle from "../models/EmployeeLifecycle.js";
import Department from "../models/Department.js";
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

  const invitation = await Invitation.findOne({
    code: invitationCode.toUpperCase(),
    status: "active",
    expiresAt: { $gt: new Date() },
  }).populate("department role");

  if (!invitation) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired invitation code",
    });
  }

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

  try {
    user = await User.create(userData);
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
  } catch (error) {
    console.error("❌ Error marking invitation as used:", error);
  }

  try {
    // Create Onboarding lifecycle
    const onboardingLifecycle = await EmployeeLifecycle.createStandardLifecycle(
      user._id,
      "Onboarding",
      invitation.department._id,
      invitation.role._id,
      invitation.createdBy || user._id,
      invitation.createdBy || user._id
    );

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
  } catch (notificationError) {
    console.error("❌ Error creating welcome notification:", notificationError);
  }

  try {
    const hrDepartment = await Department.findOne({
      name: "Human Resources",
    });

    if (hrDepartment) {
      const hrHODs = await User.find({
        department: hrDepartment._id,
        "role.level": 700,
        isActive: true,
      })
        .populate("role")
        .populate("department");

      for (const hrHOD of hrHODs) {
        try {
          await notificationService.createNotification({
            recipient: hrHOD._id,
            type: "WELCOME_ONBOARDING",
            title: "👤 New Employee Joined ELRA",
            message: `${user.firstName} ${user.lastName} (${
              user.email
            }) has successfully joined ELRA as ${invitation.role.name} in ${
              invitation.department.name
            } department. Employee ID: ${
              employeeId || "Pending"
            }. Onboarding tasks have been created and assigned.`,
            priority: "medium",
            category: "ONBOARDING",
            actionUrl: "/modules/hr/onboarding",
            data: {
              newEmployeeId: user._id,
              employeeId: employeeId,
              employeeName: `${user.firstName} ${user.lastName}`,
              employeeEmail: user.email,
              department: invitation.department.name,
              role: invitation.role.name,
              onboardingRequired: true,
            },
          });
        } catch (hodNotificationError) {
          console.error(
            `❌ Error sending notification to HR HOD ${hrHOD.email}:`,
            hodNotificationError
          );
          // Continue with other HODs even if one fails
        }
      }
    }
  } catch (hrNotificationError) {
    console.error(
      "❌ Error sending HR HOD notifications:",
      hrNotificationError
    );
    // Don't fail the registration if HR notification fails
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
