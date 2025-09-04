import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Helper function to set token cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", accessToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: parseInt(process.env.COOKIE_EXPIRE || "7") * 24 * 60 * 60 * 1000,
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
      return 15 * 60 * 1000;
  }
};

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m",
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "1d",
  });
};

// Protect routes - verify access token with automatic refresh
export const protect = async (req, res, next) => {
  try {
    console.log("🔒 Auth middleware - checking request:", {
      url: req.url,
      method: req.method,
      hasCookies: !!req.cookies,
      cookies: req.cookies,
      hasAuthHeader: !!req.headers.authorization,
    });

    let token;

    if (req.cookies.token) {
      token = req.cookies.token;
      console.log("🔒 Using access token from cookies");
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log("🔒 Using access token from Authorization header");
    }

    if (!token) {
      console.log("❌ No access token found");
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    console.log("🔒 Access token found:", token.substring(0, 20) + "...");

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await User.findById(decoded.id).populate("role department");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Check if user changed password after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: "Password was changed recently. Please login again.",
        });
      }

      // Grant access to protected route
      req.user = user;
      next();
    } catch (tokenError) {
      // If token is expired, try to refresh it
      if (tokenError.name === "TokenExpiredError") {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
          return res.status(401).json({
            success: false,
            message: "Access token expired and no refresh token available",
          });
        }

        try {
          // Verify refresh token
          const refreshDecoded = jwt.verify(
            refreshToken,
            process.env.JWT_SECRET
          );

          // Check if user exists and refresh token is valid
          const user = await User.findById(refreshDecoded.id).populate(
            "role department"
          );
          if (!user || !user.isActive) {
            return res.status(401).json({
              success: false,
              message: "Invalid refresh token",
            });
          }

          // Check if refresh token exists in user's refresh tokens
          const refreshTokenExists = user.refreshTokens.find(
            (rt) => rt.token === refreshToken
          );

          if (
            !refreshTokenExists ||
            refreshTokenExists.expiresAt < new Date()
          ) {
            return res.status(401).json({
              success: false,
              message: "Refresh token expired or invalid",
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

          // Grant access with new tokens
          req.user = user;
          next();
        } catch (refreshError) {
          console.error("Token refresh error:", refreshError);
          return res.status(401).json({
            success: false,
            message: "Token refresh failed",
          });
        }
      } else {
        // Other token errors
        return res.status(401).json({
          success: false,
          message: "Invalid access token",
        });
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Restrict to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

// Optional auth - doesn't fail if no token, but adds user if token is valid
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies first, then Authorization header
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists and is active
      const user = await User.findById(decoded.id).populate("role department");
      if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
        req.user = user;
      }
    } catch (tokenError) {
      // If token is expired, try to refresh it silently
      if (tokenError.name === "TokenExpiredError") {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
          try {
            const refreshDecoded = jwt.verify(
              refreshToken,
              process.env.JWT_SECRET
            );
            const user = await User.findById(refreshDecoded.id).populate(
              "role department"
            );

            if (user && user.isActive) {
              const refreshTokenExists = user.refreshTokens.find(
                (rt) => rt.token === refreshToken
              );

              if (
                refreshTokenExists &&
                refreshTokenExists.expiresAt > new Date()
              ) {
                // Generate new tokens silently
                const newAccessToken = generateAccessToken(user._id);
                const newRefreshToken = generateRefreshToken(user._id);

                const newRefreshTokenExpiresAt = new Date();
                const refreshTokenExpiryMs = process.env.REFRESH_TOKEN_EXPIRE
                  ? parseTimeToMs(process.env.REFRESH_TOKEN_EXPIRE)
                  : 24 * 60 * 60 * 1000;
                newRefreshTokenExpiresAt.setTime(
                  newRefreshTokenExpiresAt.getTime() + refreshTokenExpiryMs
                );

                await user.removeRefreshToken(refreshToken);
                await user.addRefreshToken(
                  newRefreshToken,
                  newRefreshTokenExpiresAt
                );

                setTokenCookies(res, newAccessToken, newRefreshToken);
                req.user = user;
              }
            }
          } catch (refreshError) {
            // Silently fail - user will need to login again
          }
        }
      }
    }

    next();
  } catch (error) {
    // If any error occurs, just continue without user
    next();
  }
};

// Check role level - restrict access based on role level
export const checkRole = (minLevel) => {
  return async (req, res, next) => {
    try {
      // First ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Populate role if not already populated
      if (!req.user.role || typeof req.user.role === "string") {
        await req.user.populate("role");
      }

      // Check if user's role level meets minimum requirement
      if (!req.user.role || req.user.role.level < minLevel) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions. Higher role level required.",
        });
      }

      next();
    } catch (error) {
      console.error("Check role middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

export const authorize = (minLevel) => {
  return checkRole(minLevel);
};

// Reusable department-based authorization middleware
export const checkDepartmentAccess = (options = {}) => {
  const {
    allowSuperAdmin = true,
    allowHOD = true,
    minLevel = 700,
    resourceField = "department",
    userDepartmentField = "department",
    errorMessage = "Access denied. Insufficient permissions.",
  } = options;

  return async (req, res, next) => {
    try {
      const user = req.user;

      // Check minimum role level (HOD = 700, SUPER_ADMIN = 1000)
      if (user.role.level < minLevel) {
        return res.status(403).json({
          success: false,
          message: errorMessage,
        });
      }

      // SUPER_ADMIN (level 1000) can access everything if allowed
      if (allowSuperAdmin && user.role.level >= 1000) {
        return next();
      }

      // HOD (level 700) can access their department if allowed
      if (allowHOD && user.role.level >= 700) {
        const userDepartmentId =
          user[userDepartmentField]?._id?.toString() ||
          user[userDepartmentField]?.toString();

        if (!userDepartmentId) {
          return res.status(403).json({
            success: false,
            message:
              "You must be assigned to a department to perform this action",
          });
        }

        // For GET requests, filter by department
        if (req.method === "GET") {
          req.departmentFilter = { [resourceField]: userDepartmentId };
        }

        // For other requests, check if the resource belongs to user's department
        if (["POST", "PUT", "DELETE"].includes(req.method)) {
          const resourceDepartmentId =
            req.body[resourceField] || req.params[resourceField];

          // HR HOD can invite users to any department
          if (
            resourceDepartmentId &&
            resourceDepartmentId !== userDepartmentId &&
            user.department?.name !== "Human Resources"
          ) {
            return res.status(403).json({
              success: false,
              message: `You can only manage ${resourceField} for your own department`,
            });
          }
        }

        return next();
      }

      // If we reach here, user doesn't have sufficient permissions
      return res.status(403).json({
        success: false,
        message: errorMessage,
      });
    } catch (error) {
      console.error("Department access check error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during authorization check",
      });
    }
  };
};

// Specific middleware for payroll modules (allowances, bonuses, etc.)
export const checkPayrollAccess = checkDepartmentAccess({
  allowSuperAdmin: true,
  allowHOD: true,
  minLevel: 700, // HOD level minimum
  resourceField: "department",
  userDepartmentField: "department",
  errorMessage:
    "Access denied. Only HOD (700) and Super Admin (1000) can manage payroll items.",
});

// Specific middleware for user management
export const checkUserManagementAccess = checkDepartmentAccess({
  allowSuperAdmin: true,
  allowHOD: true,
  minLevel: 700, // HOD level minimum
  resourceField: "department",
  userDepartmentField: "department",
  errorMessage:
    "Access denied. Only HOD (700) and Super Admin (1000) can manage users.",
});

// Specific middleware for leave management
export const checkLeaveAccess = checkDepartmentAccess({
  allowSuperAdmin: true,
  allowHOD: true,
  minLevel: 700, // HOD level minimum
  resourceField: "department",
  userDepartmentField: "department",
  errorMessage:
    "Access denied. Only HOD (700) and Super Admin (1000) can manage leave requests.",
});

// Specific middleware for document management
export const checkDocumentAccess = checkDepartmentAccess({
  allowSuperAdmin: true,
  allowHOD: true,
  minLevel: 700, // HOD level minimum
  resourceField: "department",
  userDepartmentField: "department",
  errorMessage:
    "Access denied. Only HOD (700) and Super Admin (1000) can manage documents.",
});

// Specific middleware for workflow tasks
export const checkWorkflowAccess = checkDepartmentAccess({
  allowSuperAdmin: true,
  allowHOD: true,
  minLevel: 700, // HOD level minimum
  resourceField: "department",
  userDepartmentField: "department",
  errorMessage:
    "Access denied. Only HOD (700) and Super Admin (1000) can manage workflow tasks.",
});

// Specific middleware for budget allocation (Finance HOD only)
export const checkBudgetAllocationAccess = async (req, res, next) => {
  try {
    const user = req.user;

    // Check minimum role level (HOD = 700, SUPER_ADMIN = 1000)
    if (user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Finance HOD can manage budget allocations.",
      });
    }

    // SUPER_ADMIN (level 1000) can access everything
    if (user.role.level >= 1000) {
      return next();
    }

    // HOD (level 700) can access only if they're in Finance department
    if (user.role.level >= 700) {
      const userDepartment = user.department?.name || user.department;

      if (userDepartment === "Finance & Accounting") {
        return next();
      }
    }

    // If we reach here, user doesn't have sufficient permissions
    return res.status(403).json({
      success: false,
      message: "Access denied. Only Finance HOD can manage budget allocations.",
    });
  } catch (error) {
    console.error("Budget allocation access check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authorization check",
    });
  }
};

// Specific middleware for any other module
export const checkModuleAccess = (moduleName) =>
  checkDepartmentAccess({
    allowSuperAdmin: true,
    allowHOD: true,
    minLevel: 700,
    resourceField: "department",
    userDepartmentField: "department",
    errorMessage: `Access denied. Only HOD (700) and Super Admin (1000) can manage ${moduleName}.`,
  });

// User operation authorization - checks if user can manage target user
export const checkUserAccess = (req, res, next) => {
  try {
    const currentUser = req.user;
    const targetUserId = req.params.id || req.body.userId;

    if (currentUser.role.level >= 1000) {
      return next();
    }

    if (currentUser.role.level >= 700) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to manage users",
        });
      }

      if (req.method === "POST" && req.body.department) {
        const userDepartmentId = currentUser.department._id.toString();
        const targetDepartmentId = req.body.department.toString();

        if (userDepartmentId !== targetDepartmentId) {
          return res.status(403).json({
            success: false,
            message: "You can only create users in your own department",
          });
        }
        return next();
      }

      if (targetUserId) {
        return next();
      }

      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. Only HOD and Super Admin can manage users",
    });
  } catch (error) {
    console.error("User access check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authorization check",
    });
  }
};
