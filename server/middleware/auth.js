import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Helper function to set token cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";

  // Access token cookie (non-httpOnly for client access)
  res.cookie("token", accessToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token cookie (httpOnly for security)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: parseInt(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000,
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

// Alias for checkRole - authorize function for backward compatibility
export const authorize = (minLevel) => {
  return checkRole(minLevel);
};
