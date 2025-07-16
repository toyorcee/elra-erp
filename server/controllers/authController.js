import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Department from "../models/Department.js";
import {
  sendPasswordResetEmail,
  sendPasswordChangeSuccessEmail,
} from "../services/emailService.js";

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

// Set token cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  const accessTokenMaxAge = process.env.ACCESS_TOKEN_EXPIRE
    ? parseTimeToMs(process.env.ACCESS_TOKEN_EXPIRE)
    : 15 * 60 * 1000;

  const refreshTokenMaxAge = process.env.REFRESH_TOKEN_EXPIRE
    ? parseTimeToMs(process.env.REFRESH_TOKEN_EXPIRE)
    : 24 * 60 * 60 * 1000;
  // Access token cookie (httpOnly, secure in production)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: accessTokenMaxAge,
  });

  // Refresh token cookie (httpOnly, secure in production)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: refreshTokenMaxAge,
  });
};

// Helper function to parse time strings to milliseconds
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
      return 15 * 60 * 1000; // 15 minutes default
  }
};

// Clear token cookies
const clearTokenCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    console.log("Register attempt:", req.body);
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, email, password, firstName, lastName, department } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findByEmailOrUsername(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Handle department assignment
    let departmentId;
    if (department) {
      // If department name/code provided, find the department
      const dept = await Department.findOne({
        $or: [{ name: department }, { code: department.toUpperCase() }],
        isActive: true,
      });
      departmentId = dept?._id;
    }

    // If no department found or provided, get/create External department
    if (!departmentId) {
      let externalDept = await Department.findOne({
        code: "EXT",
        isActive: true,
      });

      if (!externalDept) {
        externalDept = new Department({
          name: "External",
          code: "EXT",
          description: "External users and contractors",
          level: 10,
          createdBy: null,
        });
        await externalDept.save();
      }
      departmentId = externalDept._id;
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      department: departmentId,
    });

    await user.save();
    console.log("Register success:", user.email);

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

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
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
    console.log("Login attempt:", req.body.identifier);
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
    const user = await User.findByEmailOrUsername(identifier).select(
      "+password"
    );
    if (!user) {
      console.log("Login failed: user not found");
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

    // Check password
    const isPasswordCorrect = await user.correctPassword(
      password,
      user.password
    );
    if (!isPasswordCorrect) {
      console.log("Login failed: incorrect password");
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
    console.log("Login success:", user.email);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
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
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Check if refresh token exists in user's refresh tokens
    const refreshTokenExists = user.refreshTokens.find(
      (rt) => rt.token === refreshToken
    );

    if (!refreshTokenExists) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check if refresh token is expired
    if (refreshTokenExists.expiresAt < new Date()) {
      // Remove expired token
      await user.removeRefreshToken(refreshToken);
      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Calculate new refresh token expiration
    const newRefreshTokenExpiresAt = new Date();
    const refreshTokenExpiryMs = process.env.REFRESH_TOKEN_EXPIRE
      ? parseTimeToMs(process.env.REFRESH_TOKEN_EXPIRE)
      : 24 * 60 * 60 * 1000; // 1 day default
    newRefreshTokenExpiresAt.setTime(
      newRefreshTokenExpiresAt.getTime() + refreshTokenExpiryMs
    );

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken, newRefreshTokenExpiresAt);

    // Set new cookies
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    console.log("🔍 /me endpoint called for user ID:", req.user.id);

    const user = await User.findById(req.user.id).populate("role department");

    if (!user) {
      console.log("❌ User not found for ID:", req.user.id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ User found:", {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.role?._id,
      roleName: user.role?.name,
      roleLevel: user.role?.level,
      department: user.department?.name,
    });

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };

    console.log("📤 Sending user response:", {
      roleName: userResponse.role?.name,
      roleLevel: userResponse.role?.level,
      roleId: userResponse.role?._id,
    });

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("❌ Get me error:", error);
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

    // Check current password
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

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear all refresh tokens (force re-login)
    user.refreshTokens = [];
    await user.save();

    // Clear cookies
    clearTokenCookies(res);

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
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

    console.log(`🔐 Password reset attempt for email: ${email}`);
    console.log(`📍 IP Address: ${clientIP}`);
    console.log(`🌐 User Agent: ${userAgent}`);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ Password reset failed: User not found - ${email}`);
      console.log(
        `🚨 Potential security threat: Unknown email attempting password reset`
      );
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    console.log(`✅ User found: ${user.username} (${user.email})`);
    console.log(`👤 User ID: ${user._id}`);

    // Check if user is active
    if (!user.isActive) {
      console.log(`❌ Password reset failed: Account deactivated - ${email}`);
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

    console.log(`🔑 Reset token generated for user: ${user._id}`);

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

    console.log(`💾 Reset token saved to database for user: ${user._id}`);
    console.log(`⏰ Token expires at: ${user.passwordResetExpires}`);

    // Send email with reset link
    console.log(`📧 Sending password reset email to: ${user.email}`);
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

    console.log(`✅ Password reset email sent successfully!`);
    console.log(`📧 Email Message ID: ${emailResult.messageId}`);
    console.log(`🎯 Reset link sent to: ${user.email}`);

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
    console.log("✅ Validation passed, processing reset...");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔑 Token verified for user:", decoded.id);

    // Find user with reset token
    const user = await User.findById(decoded.id).select(
      "+passwordResetToken +passwordResetExpires"
    );
    if (!user) {
      console.log("❌ User not found for token:", decoded.id);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Check if reset token exists and is not expired
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      console.log("❌ No reset token found for user:", user._id);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (user.passwordResetExpires < new Date()) {
      console.log("❌ Reset token expired for user:", user._id);
      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    // Verify reset token
    const isTokenValid = await bcrypt.compare(token, user.passwordResetToken);
    if (!isTokenValid) {
      console.log("❌ Invalid reset token for user:", user._id);
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    console.log("✅ Token validation successful, updating password...");

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Clear all refresh tokens (force re-login)
    user.refreshTokens = [];

    await user.save();
    console.log("✅ Password updated successfully for user:", user._id);

    const emailResult = await sendPasswordChangeSuccessEmail(
      user.email,
      user.firstName || user.username
    );

    if (!emailResult.success) {
      console.error(
        "❌ Failed to send password change success email:",
        emailResult.error
      );
    } else {
      console.log("✅ Password change success email sent to:", user.email);
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
