/**
 * Legal Access Middleware
 * Controls access to Legal module functions (Project Compliance, Client Legal Matters, etc.)
 *
 * Access Levels:
 * - Super Admin (1000+): Full access to everything
 * - Legal HOD (700+ in Legal department): Full access to Legal functions
 * - Other HODs (700+): Read-only access to project compliance
 * - Staff/Viewer: Read-only access to published project policies
 *
 * Note: HR HOD handles HR-specific policies/compliance in HR module
 * Legal HOD handles project/client legal matters and regulatory compliance
 */

export const checkLegalAccess = (req, res, next) => {
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

  // Legal HOD can access everything in Legal module
  if (
    user.role.level >= 700 &&
    user.department?.name?.toLowerCase().includes("legal")
  ) {
    return next();
  }

  // HR HOD should use HR module for HR policies/compliance
  // Legal module is for project/client legal matters only

  // Other HODs can view project compliance (read-only)
  if (user.role.level >= 700) {
    return next();
  }

  // Staff and Viewer can only read published policies
  if (req.method === "GET") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Legal HOD or Super Admin access required.",
  });
};

/**
 * Check if user can create/edit project/client policies
 * Only Legal HOD and Super Admin can create/edit project policies
 */
export const checkPolicyWriteAccess = (req, res, next) => {
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

  // Legal HOD can create/edit all policies
  if (
    user.role.level >= 700 &&
    user.department?.name?.toLowerCase().includes("legal")
  ) {
    return next();
  }

  // Only Legal HOD can create/edit project policies
  // HR policies are handled in HR module

  return res.status(403).json({
    success: false,
    message:
      "Access denied. Only Legal HOD or Super Admin can create/edit project policies.",
  });
};

/**
 * Check if user can create/edit project compliance items
 * Only Legal HOD and Super Admin can create/edit project compliance
 */
export const checkComplianceWriteAccess = (req, res, next) => {
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

  // Legal HOD can create/edit all compliance items
  if (
    user.role.level >= 700 &&
    user.department?.name?.toLowerCase().includes("legal")
  ) {
    return next();
  }

  // Only Legal HOD can create/edit project compliance
  // HR compliance is handled in HR module

  return res.status(403).json({
    success: false,
    message:
      "Access denied. Only Legal HOD or Super Admin can manage project compliance.",
  });
};

/**
 * Check if user can delete policies/compliance
 * Only Super Admin and Legal HOD can delete
 */
export const checkLegalDeleteAccess = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Super Admin can delete everything
  if (user.isSuperadmin || user.role.level >= 1000) {
    return next();
  }

  // Legal HOD can delete legal items
  if (
    user.role.level >= 700 &&
    user.department?.name?.toLowerCase().includes("legal")
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message:
      "Access denied. Only Legal HOD or Super Admin can delete legal items.",
  });
};
