import User from "../models/User.js";

// Middleware to check if user needs to change password
export const checkPasswordChangeRequired = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user._id);

    // Check if temporary password has expired
    if (
      user.isTemporaryPassword &&
      user.temporaryPasswordExpiry &&
      user.temporaryPasswordExpiry < new Date()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Temporary password has expired. Please use password reset to get new credentials.",
        code: "TEMPORARY_PASSWORD_EXPIRED",
      });
    }

    // Check if password change is required
    if (user.passwordChangeRequired) {
      return res.status(403).json({
        success: false,
        message:
          "Password change required. Please change your temporary password.",
        code: "PASSWORD_CHANGE_REQUIRED",
        data: {
          isTemporaryPassword: user.isTemporaryPassword,
          temporaryPasswordExpiry: user.temporaryPasswordExpiry,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Password security check error:", error);
    next();
  }
};

// Middleware to allow access to password change routes even with temporary password
export const allowPasswordChangeRoutes = (req, res, next) => {
  // Allow access to password change and logout routes even with temporary password
  const allowedRoutes = [
    "/change-password",
    "/logout",
    "/refresh",
    "/profile/change-password",
  ];

  // Check if the current route is in the allowed routes
  const isAllowedRoute = allowedRoutes.some((route) =>
    req.path.endsWith(route)
  );

  if (isAllowedRoute) {
    return next();
  }

  // For other routes, check password requirements
  return checkPasswordChangeRequired(req, res, next);
};

// Function to mark password as changed
export const markPasswordChanged = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isTemporaryPassword: false,
      temporaryPasswordExpiry: null,
      passwordChangeRequired: false,
      lastPasswordChange: new Date(),
      passwordChangedAt: new Date(),
    });
  } catch (error) {
    console.error("Error marking password as changed:", error);
  }
};

// Function to create temporary password
export const createTemporaryPassword = () => {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
};

// Function to set temporary password for user
export const setTemporaryPassword = async (
  userId,
  tempPassword,
  expiryHours = 24
) => {
  try {
    const expiryDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    await User.findByIdAndUpdate(userId, {
      password: tempPassword, // Will be hashed by pre-save middleware
      isTemporaryPassword: true,
      temporaryPasswordExpiry: expiryDate,
      passwordChangeRequired: true,
      isEmailVerified: true,
    });

    return {
      tempPassword,
      expiryDate,
    };
  } catch (error) {
    console.error("Error setting temporary password:", error);
    throw error;
  }
};
