/**
 * Project Management Access Middleware
 * Controls access to Project Management functions (External Projects, etc.)
 *
 * Access Levels:
 * - Super Admin (1000+): Full access to everything
 * - Project Management HOD (700+ in Project Management department): Full access to Project Management functions
 */

export const checkProjectManagementAccess = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Super Admin can access everything
  if (user.isSuperadmin || user.role.level >= 1000) {
    return next();
  }

  // Project Management HOD can access everything in Project Management
  if (
    user.role.level >= 700 &&
    user.department?.name === "Project Management"
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message:
      "Access denied. Only Project Management HOD or Super Admin can access external projects.",
  });
};

/**
 * Check if user can create external projects
 * Only Project Management HOD and Super Admin can create external projects
 */
export const checkExternalProjectCreateAccess = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Super Admin can do everything
  if (user.isSuperadmin || user.role.level >= 1000) {
    return next();
  }

  // Project Management HOD can create external projects
  if (
    user.role.level >= 700 &&
    user.department?.name === "Project Management"
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message:
      "Access denied. Only Project Management HOD or Super Admin can create external projects.",
  });
};
