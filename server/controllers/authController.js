import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Company from "../models/Company.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import {
  sendPasswordResetEmail,
  sendPasswordChangeSuccessEmail,
} from "../services/emailService.js";
import WelcomeNotificationService from "../services/welcomeNotificationService.js";
import Invitation from "../models/Invitation.js";

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m",
  });
};

// Generate refresh token (longer-lived - 1 day)
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "1d",
  });
};

// Reusable cookie options function
const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: parseInt(process.env.COOKIE_EXPIRE || "7") * 24 * 60 * 60 * 1000,
  };

  return options;
};

// Set token cookies
const setTokenCookies = (res, accessToken, refreshToken, req = null) => {
  const isProd = process.env.NODE_ENV === "production";

  // Access token cookie (non-httpOnly for client access)
  const accessTokenOptions = {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  };

  const refreshTokenOptions = getCookieOptions();

  res.cookie("token", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);
};

const parseTimeToMs = (timeString) => {
  const unit = timeString.slice(-1);
  const value = parseInt(timeString.slice(0, -1));

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
};

// Clear token cookies
const clearTokenCookies = (res) => {
  const cookieOptions = getCookieOptions();

  res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
  res.clearCookie("refreshToken", { ...cookieOptions, maxAge: 0 });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findByEmailOrUsername(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    let userRole;
    let company;
    let defaultDepartment;

    const existingSuperAdmin = await User.findOne({ isSuperadmin: true });

    if (!existingSuperAdmin) {
      userRole = await Role.findOne({ name: "SUPER_ADMIN" });
      if (!userRole) {
        return res.status(500).json({
          success: false,
          message: "System configuration error. Please contact support.",
        });
      }
    } else {
      userRole = null;
    }

    // Check if this is the first user (first superadmin)
    const existingCompany = await Company.findOne();

    if (!existingCompany) {
      company = await Company.create({
        name: `${firstName} ${lastName}'s Company`,
        description: "Default company created for superadmin",
        industry: "Technology",
        size: "Small",
        address: "To be updated",
        phone: "To be updated",
        email: email,
        website: "To be updated",
        isActive: true,
        createdBy: null, // Will be set after user creation
      });

      // Create default department
      defaultDepartment = await Department.create({
        name: "General",
        description: "Default department for all users",
        company: company._id,
        manager: null, // Will be set after user creation
        isActive: true,
        createdBy: null, // Will be set after user creation
      });
    } else {
      // Use existing company and department
      company = existingCompany;
      defaultDepartment = await Department.findOne({ company: company._id });
      if (!defaultDepartment) {
        defaultDepartment = await Department.create({
          name: "General",
          description: "Default department for all users",
          company: company._id,
          manager: null,
          isActive: true,
          createdBy: null,
        });
      }
    }

    // Generate activation token (using normalized email)
    const activationToken = jwt.sign(
      { email: normalizedEmail, type: "activation" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const user = new User({
      username,
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      role: userRole?._id, // May be null for new users
      company: company?._id,
      department: defaultDepartment?._id,
      isSuperadmin: !existingSuperAdmin, // Only first user becomes superadmin
      isEmailVerified: false, // Email not verified yet
      isActive: false, // Account not active until Super Admin approves
      status: existingSuperAdmin ? "PENDING_REGISTRATION" : "ACTIVE", // New users are pending
      emailVerificationToken: activationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await user.save();

    // Update company and department with the created user as creator/manager
    if (company && defaultDepartment) {
      await Company.findByIdAndUpdate(company._id, {
        createdBy: user._id,
        updatedBy: user._id,
      });

      await Department.findByIdAndUpdate(defaultDepartment._id, {
        manager: user._id,
        createdBy: user._id,
        updatedBy: user._id,
      });
    }

    // Populate role, company, and department after saving
    await user.populate(["role", "company", "department"]);

    // Send appropriate email based on user status
    try {
      const { sendAccountActivationEmail, sendPendingRegistrationEmail } =
        await import("../services/emailService.js");

      if (existingSuperAdmin) {
        // New user - send pending registration email
        await sendPendingRegistrationEmail(
          user.email,
          user.firstName || user.username
        );

        // Send notification to all Super Admins
        try {
          const superAdmins = await User.find({ isSuperadmin: true }).select(
            "_id"
          );

          for (const superAdmin of superAdmins) {
            await Notification.create({
              recipient: superAdmin._id,
              type: "USER_REGISTRATION",
              title: "New User Registration",
              message: `New user ${user.firstName} ${user.lastName} (${user.email}) has registered and is waiting for approval.`,
              data: {
                newUserId: user._id,
                newUserEmail: user.email,
                newUserName: `${user.firstName} ${user.lastName}`,
                registrationDate: user.createdAt,
              },
              isRead: false,
              priority: "medium",
            });
          }
        } catch (notificationError) {
          console.error(
            "Error sending Super Admin notification:",
            notificationError
          );
        }
      } else {
        // First user (Super Admin) - send activation email
        await sendAccountActivationEmail(
          user.email,
          user.firstName || user.username,
          activationToken
        );
      }
    } catch (error) {
      console.error("Error sending email:", error);
    }

    // Return user data (without password) - NO TOKENS GENERATED
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      position: user.position,
      bio: user.bio,
      address: user.address,
      employeeId: user.employeeId,
      department: user.department,
      company: user.company,
      role: user.role,
      isSuperadmin: user.isSuperadmin,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      avatar: user.avatar,
      needsSetup: true,
    };

    res.status(201).json({
      success: true,
      message: existingSuperAdmin
        ? "Account created successfully! Please wait for the Super Admin to approve your registration and send you an invitation code."
        : "Account created successfully! Please check your email to activate your account before logging in.",
      data: {
        user: userResponse,
        requiresEmailVerification: !existingSuperAdmin,
        requiresSuperAdminApproval: existingSuperAdmin,
      },
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { identifier, password } = req.body;

    // Find user by email or username and include password
    let user = await User.findByEmailOrUsername(identifier)
      .select("+password")
      .populate("role department");

    // If not found, try without isActive filter for debugging
    if (!user) {
      user = await User.findOne({
        $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
      })
        .select("+password")
        .populate("role department");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Check if user is pending registration
    if (user.status === "PENDING_REGISTRATION") {
      return res.status(401).json({
        success: false,
        message:
          "Your account is pending approval. Please wait for the Super Administrator to send you an invitation code.",
        requiresSuperAdminApproval: true,
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message:
          "Please verify your email address before logging in. Check your inbox for the verification link.",
        requiresEmailVerification: true,
      });
    }

    // Check password
    const isPasswordCorrect = await user.correctPassword(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Clean expired refresh tokens
    await user.cleanExpiredRefreshTokens();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Calculate refresh token expiration
    const refreshTokenExpiresAt = new Date();
    const refreshTokenExpiryMs = process.env.REFRESH_TOKEN_EXPIRE
      ? parseTimeToMs(process.env.REFRESH_TOKEN_EXPIRE)
      : 24 * 60 * 60 * 1000; // 1 day default
    refreshTokenExpiresAt.setTime(
      refreshTokenExpiresAt.getTime() + refreshTokenExpiryMs
    );

    // Save refresh token to user
    await user.addRefreshToken(refreshToken, refreshTokenExpiresAt);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken, req);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      position: user.position,
      bio: user.bio,
      address: user.address,
      employeeId: user.employeeId,
      department: user.department,
      role: user.role,
      permissions: user.role?.permissions || [],
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      avatar: user.avatar,
      // Add temporary password info
      isTemporaryPassword: user.isTemporaryPassword,
      passwordChangeRequired: user.passwordChangeRequired,
      temporaryPasswordExpiry: user.temporaryPasswordExpiry,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Remove refresh token from user
      const user = await User.findById(req.user.id);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }

    // Clear cookies
    clearTokenCookies(res);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const token = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    const cookieOptions = getCookieOptions();
    res.cookie("token", token, {
      ...cookieOptions,
      httpOnly: false,
    });
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 604800000,
    });

    res.status(200).json({
      success: true,
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("role department");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      position: user.position,
      bio: user.bio,
      address: user.address,
      employeeId: user.employeeId,
      department: user.department,
      role: user.role,
      permissions: user.role?.permissions || [],
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      avatar: user.avatar,
    };

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isTemporaryPassword) {
      const isCurrentPasswordCorrect = await user.correctPassword(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // Update password
    user.password = newPassword;

    if (user.isTemporaryPassword) {
      user.isTemporaryPassword = false;
      user.temporaryPasswordExpiry = null;
      user.passwordChangeRequired = false;
      user.lastPasswordChange = new Date();
      user.passwordChangedAt = new Date();
    }

    await user.save();

    if (user.isTemporaryPassword) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      await user.addRefreshToken(
        refreshToken,
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      setTokenCookies(res, accessToken, refreshToken, req);

      res.status(200).json({
        success: true,
        message: "Password changed successfully! Welcome to your dashboard.",
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isTemporaryPassword: false,
            passwordChangeRequired: false,
          },
          accessToken,
        },
      });
    } else {
      // For regular password changes, clear tokens and force re-login
      user.refreshTokens = [];
      await user.save();

      // Clear cookies
      clearTokenCookies(res);

      res.status(200).json({
        success: true,
        message: "Password changed successfully. Please login again.",
      });
    }
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Password reset validation failed:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    if (!user.isActive) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.PASSWORD_RESET_EXPIRE || "1h",
    });

    // Save reset token to user (hashed)
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedResetToken = await bcrypt.hash(resetToken, saltRounds);
    user.passwordResetToken = hashedResetToken;

    // Set reset token expiration (configurable, default 1 hour)
    const resetTokenExpiry = process.env.PASSWORD_RESET_EXPIRE
      ? parseTimeToMs(process.env.PASSWORD_RESET_EXPIRE)
      : 60 * 60 * 1000; // 1 hour default
    user.passwordResetExpires = new Date(Date.now() + resetTokenExpiry);
    await user.save();

    // Send email with reset link
    const emailResult = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName || user.username
    );

    if (!emailResult.success) {
      console.error(
        "❌ Failed to send password reset email:",
        emailResult.error
      );
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    console.log("🔐 Reset password attempt:", {
      hasToken: !!req.body.token,
      hasPassword: !!req.body.newPassword,
      passwordLength: req.body.newPassword?.length,
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Reset password validation failed:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user with reset token
    const user = await User.findById(decoded.id).select(
      "+passwordResetToken +passwordResetExpires"
    );
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Check if reset token exists and is not expired
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (user.passwordResetExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    // Verify reset token
    const isTokenValid = await bcrypt.compare(token, user.passwordResetToken);
    if (!isTokenValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Clear all refresh tokens (force re-login)
    user.refreshTokens = [];

    await user.save();

    const emailResult = await sendPasswordChangeSuccessEmail(
      user.email,
      user.firstName || user.username
    );

    if (!emailResult.success) {
      console.error(
        "❌ Failed to send password change success email:",
        emailResult.error
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Join company with invitation code
// @route   POST /api/auth/join-company
// @access  Public
export const joinCompany = async (req, res) => {
  try {
    const { invitationCode, userData } = req.body;

    if (!invitationCode || !userData) {
      return res.status(400).json({
        success: false,
        message: "Invitation code and user data are required",
      });
    }

    // Find invitation by code
    const invitation = await Invitation.findOne({
      code: invitationCode,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).populate("company department role");

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired invitation code",
      });
    }

    let existingUser = await User.findOne({
      email: invitation.email,
    }).populate("role department company");

    if (!existingUser) {
      existingUser = await User.findOne({
        email: { $regex: new RegExp(`^${invitation.email}$`, "i") },
      }).populate("role department company");
    }

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: `No user found with email ${invitation.email}. Please ensure you have registered with this email address.`,
      });
    }

    // Check if user is in the correct status for invitation acceptance
    if (existingUser.status === "ACTIVE" && existingUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "This account is already active. You can log in directly.",
      });
    }

    if (existingUser.status === "INVITED") {
      // User has been invited but not yet activated - this is fine
    } else if (existingUser.status === "PENDING_REGISTRATION") {
      // User is pending registration - this is also fine
    } else {
      console.log(
        "⚠️ User found but with unexpected status:",
        existingUser.status
      );
    }

    // Always use the invitation's role/department as it represents the admin's intent
    existingUser.company = invitation.company._id;
    existingUser.department = invitation.department._id;
    existingUser.role = invitation.role._id;
    existingUser.isActive = true;
    existingUser.status = "ACTIVE";
    existingUser.isEmailVerified = true;

    const isPasswordCorrect = await existingUser.correctPassword(
      userData.password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials. Please check your username and password.",
      });
    }

    await existingUser.save();

    invitation.status = "used";
    invitation.usedBy = existingUser._id;
    invitation.usedAt = new Date();
    await invitation.save();

    await existingUser.populate("role department");

    // Generate tokens
    const accessToken = generateAccessToken(existingUser._id);
    const refreshToken = generateRefreshToken(existingUser._id);

    // Calculate refresh token expiration
    const refreshTokenExpiresAt = new Date();
    const refreshTokenExpiryMs = process.env.REFRESH_TOKEN_EXPIRE
      ? parseTimeToMs(process.env.REFRESH_TOKEN_EXPIRE)
      : 24 * 60 * 60 * 1000; // 1 day default
    refreshTokenExpiresAt.setTime(
      refreshTokenExpiresAt.getTime() + refreshTokenExpiryMs
    );

    // Save refresh token to user
    await existingUser.addRefreshToken(refreshToken, refreshTokenExpiresAt);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken, req);

    res.status(201).json({
      success: true,
      message: "Account verified and successfully joined company",
      data: {
        user: {
          id: existingUser._id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: invitation.role,
          company: invitation.company,
          department: existingUser.department,
          permissions: invitation.role?.permissions || [],
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error("Join company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join company",
      error: error.message,
    });
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "activation") {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    // Find user by email
    const user = await User.findOne({
      email: decoded.email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Activate the user
    user.isEmailVerified = true;
    user.isActive = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // 🔍 MINIMAL LOGGING: Track account activation
    console.log(
      `🔍 [ACCOUNT ACTIVATION] User: ${user.email} | Role: ${
        user.role?.name || "No Role"
      } | Department: ${user.department?.name || "No Department"} | Status: ${
        user.status || "ACTIVE"
      }`
    );

    // Send welcome notification and email after verification
    try {
      const welcomeService = new WelcomeNotificationService(global.io);
      welcomeService.sendWelcomeNotification(user).catch((error) => {
        console.error("❌ Error sending welcome notification:", error);
      });
    } catch (error) {
      console.error("❌ Error initializing welcome service:", error);
    }

    res.json({
      success: true,
      message:
        "Email verified successfully! You can now log in to your account.",
    });
  } catch (error) {
    console.error("Email verification failed:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Verification token has expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a verification email has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new activation token
    const activationToken = jwt.sign(
      { email, type: "activation" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Update user with new token
    user.emailVerificationToken = activationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send activation email
    try {
      const { sendAccountActivationEmail } = await import(
        "../services/emailService.js"
      );
      await sendAccountActivationEmail(
        user.email,
        user.firstName || user.username,
        activationToken
      );
    } catch (error) {
      console.error("Error sending verification email:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
