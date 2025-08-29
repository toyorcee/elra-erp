import { checkRole } from "./rbac.js";

// Middleware to ensure only HR HOD can access vendor management
export const requireHRHodAccess = async (req, res, next) => {
  try {
    // Check if user has HOD level (700) or higher
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HR HOD and above can manage vendors.",
      });
    }

    // Check if user is from HR department
    if (
      !req.user.department ||
      req.user.department.name !== "Human Resources"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HR HOD can manage vendors.",
      });
    }

    next();
  } catch (error) {
    console.error("HR HOD Access Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking HR HOD access",
      error: error.message,
    });
  }
};

// Middleware for vendor creation (any HOD can create, but only HR HOD can approve)
export const requireHodAccess = async (req, res, next) => {
  try {
    // Check if user has HOD level (700) or higher
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and above can create vendors.",
      });
    }

    next();
  } catch (error) {
    console.error("HOD Access Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking HOD access",
      error: error.message,
    });
  }
};
