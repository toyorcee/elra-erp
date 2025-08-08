import { ERP_ROLES, PERMISSION_LEVELS } from "../constants/erpPermissions.js";

/**
 * RBAC Middleware for ELRA ERP System
 * Provides role-based access control for all ERP modules
 */

// ============================================================================
// PERMISSION CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role and permissions
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;

  // Super admin has all permissions
  if (user.role.level >= PERMISSION_LEVELS.SUPER_ADMIN) return true;

  // Check user-specific permissions
  if (user.permissions && user.permissions.includes(permission)) return true;

  // Check role permissions
  if (user.role.permissions && user.role.permissions.includes(permission))
    return true;

  return false;
};

/**
 * Check if user has permission for a specific module action
 * @param {Object} user - User object
 * @param {string} module - Module name (hr, payroll, procurement, accounts, communication, system)
 * @param {string} action - Action (view, create, edit, delete, approve)
 * @returns {boolean} True if user has permission
 */
export const hasModulePermission = (user, module, action) => {
  const permission = `${module.toLowerCase()}.${action}`;
  return hasPermission(user, permission);
};

/**
 * Check if user has minimum role level
 * @param {Object} user - User object
 * @param {number} minLevel - Minimum required level
 * @returns {boolean} True if user meets minimum level
 */
export const hasRoleLevel = (user, minLevel) => {
  if (!user || !user.role) return false;
  return user.role.level >= minLevel;
};

/**
 * Get user's accessible modules
 * @param {Object} user - User object
 * @returns {Array} Array of accessible module names
 */
export const getUserAccessibleModules = (user) => {
  if (!user || !user.role) return [];

  const modules = [
    "hr",
    "payroll",
    "procurement",
    "accounts",
    "communication",
    "system",
  ];
  return modules.filter((module) => {
    return hasModulePermission(user, module, "view");
  });
};

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Middleware to check if user has specific permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!hasPermission(req.user, permission)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          requiredPermission: permission,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Middleware to check if user has module permission
 * @param {string} module - Module name
 * @param {string} action - Required action
 * @returns {Function} Express middleware
 */
export const requireModulePermission = (module, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!hasModulePermission(req.user, module, action)) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions for ${module} ${action}`,
          requiredPermission: `${module}.${action}`,
        });
      }

      next();
    } catch (error) {
      console.error("Module permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Middleware to check minimum role level
 * @param {number} minLevel - Minimum required role level
 * @returns {Function} Express middleware
 */
export const requireRoleLevel = (minLevel) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!hasRoleLevel(req.user, minLevel)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient role level",
          requiredLevel: minLevel,
          userLevel: req.user.role?.level || 0,
        });
      }

      next();
    } catch (error) {
      console.error("Role level check error:", error);
      return res.status(500).json({
        success: false,
        message: "Role level check failed",
      });
    }
  };
};

/**
 * Middleware to check if user is super admin
 * @returns {Function} Express middleware
 */
export const requireSuperAdmin = () => {
  return requireRoleLevel(PERMISSION_LEVELS.SUPER_ADMIN);
};

/**
 * Middleware to check if user is platform admin or higher
 * @returns {Function} Express middleware
 */
export const requirePlatformAdmin = () => {
  return requireRoleLevel(PERMISSION_LEVELS.PLATFORM_ADMIN);
};

/**
 * Middleware to check if user is company admin or higher
 * @returns {Function} Express middleware
 */
export const requireCompanyAdmin = () => {
  return requireRoleLevel(PERMISSION_LEVELS.COMPANY_ADMIN);
};

/**
 * Middleware to check if user is manager or higher
 * @returns {Function} Express middleware
 */
export const requireManager = () => {
  return requireRoleLevel(PERMISSION_LEVELS.MANAGER);
};

// ============================================================================
// MODULE-SPECIFIC MIDDLEWARE
// ============================================================================

// HR Module Middleware
export const hrMiddleware = {
  view: requireModulePermission("hr", "view"),
  create: requireModulePermission("hr", "create"),
  edit: requireModulePermission("hr", "edit"),
  delete: requireModulePermission("hr", "delete"),
  approve: requireModulePermission("hr", "approve"),

  // Specific HR permissions
  employee: {
    view: requirePermission("hr.employee.view"),
    create: requirePermission("hr.employee.create"),
    edit: requirePermission("hr.employee.edit"),
    delete: requirePermission("hr.employee.delete"),
    approve: requirePermission("hr.employee.approve"),
  },

  recruitment: {
    view: requirePermission("hr.recruitment.view"),
    create: requirePermission("hr.recruitment.create"),
    edit: requirePermission("hr.recruitment.edit"),
    delete: requirePermission("hr.recruitment.delete"),
    approve: requirePermission("hr.recruitment.approve"),
  },

  performance: {
    view: requirePermission("hr.performance.view"),
    create: requirePermission("hr.performance.create"),
    edit: requirePermission("hr.performance.edit"),
    delete: requirePermission("hr.performance.delete"),
    approve: requirePermission("hr.performance.approve"),
  },

  leave: {
    view: requirePermission("hr.leave.view"),
    create: requirePermission("hr.leave.create"),
    edit: requirePermission("hr.leave.edit"),
    delete: requirePermission("hr.leave.delete"),
    approve: requirePermission("hr.leave.approve"),
  },
};

// Payroll Module Middleware
export const payrollMiddleware = {
  view: requireModulePermission("payroll", "view"),
  create: requireModulePermission("payroll", "create"),
  edit: requireModulePermission("payroll", "edit"),
  delete: requireModulePermission("payroll", "delete"),
  approve: requireModulePermission("payroll", "approve"),

  // Specific Payroll permissions
  salary: {
    view: requirePermission("payroll.salary.view"),
    create: requirePermission("payroll.salary.create"),
    edit: requirePermission("payroll.salary.edit"),
    delete: requirePermission("payroll.salary.delete"),
    approve: requirePermission("payroll.salary.approve"),
  },

  process: {
    view: requirePermission("payroll.process.view"),
    create: requirePermission("payroll.process.create"),
    edit: requirePermission("payroll.process.edit"),
    delete: requirePermission("payroll.process.delete"),
    approve: requirePermission("payroll.process.approve"),
  },

  deduction: {
    view: requirePermission("payroll.deduction.view"),
    create: requirePermission("payroll.deduction.create"),
    edit: requirePermission("payroll.deduction.edit"),
    delete: requirePermission("payroll.deduction.delete"),
    approve: requirePermission("payroll.deduction.approve"),
  },
};

// Procurement Module Middleware
export const procurementMiddleware = {
  view: requireModulePermission("procurement", "view"),
  create: requireModulePermission("procurement", "create"),
  edit: requireModulePermission("procurement", "edit"),
  delete: requireModulePermission("procurement", "delete"),
  approve: requireModulePermission("procurement", "approve"),

  // Specific Procurement permissions
  requisition: {
    view: requirePermission("procurement.requisition.view"),
    create: requirePermission("procurement.requisition.create"),
    edit: requirePermission("procurement.requisition.edit"),
    delete: requirePermission("procurement.requisition.delete"),
    approve: requirePermission("procurement.requisition.approve"),
  },

  purchaseOrder: {
    view: requirePermission("procurement.purchase_order.view"),
    create: requirePermission("procurement.purchase_order.create"),
    edit: requirePermission("procurement.purchase_order.edit"),
    delete: requirePermission("procurement.purchase_order.delete"),
    approve: requirePermission("procurement.purchase_order.approve"),
  },

  vendor: {
    view: requirePermission("procurement.vendor.view"),
    create: requirePermission("procurement.vendor.create"),
    edit: requirePermission("procurement.vendor.edit"),
    delete: requirePermission("procurement.vendor.delete"),
    approve: requirePermission("procurement.vendor.approve"),
  },
};

// Accounts Module Middleware
export const accountsMiddleware = {
  view: requireModulePermission("accounts", "view"),
  create: requireModulePermission("accounts", "create"),
  edit: requireModulePermission("accounts", "edit"),
  delete: requireModulePermission("accounts", "delete"),
  approve: requireModulePermission("accounts", "approve"),

  // Specific Accounts permissions
  expense: {
    view: requirePermission("accounts.expense.view"),
    create: requirePermission("accounts.expense.create"),
    edit: requirePermission("accounts.expense.edit"),
    delete: requirePermission("accounts.expense.delete"),
    approve: requirePermission("accounts.expense.approve"),
  },

  revenue: {
    view: requirePermission("accounts.revenue.view"),
    create: requirePermission("accounts.revenue.create"),
    edit: requirePermission("accounts.revenue.edit"),
    delete: requirePermission("accounts.revenue.delete"),
    approve: requirePermission("accounts.revenue.approve"),
  },

  budget: {
    view: requirePermission("accounts.budget.view"),
    create: requirePermission("accounts.budget.create"),
    edit: requirePermission("accounts.budget.edit"),
    delete: requirePermission("accounts.budget.delete"),
    approve: requirePermission("accounts.budget.approve"),
  },
};

// Communication Module Middleware
export const communicationMiddleware = {
  view: requireModulePermission("communication", "view"),
  create: requireModulePermission("communication", "create"),
  edit: requireModulePermission("communication", "edit"),
  delete: requireModulePermission("communication", "delete"),
  approve: requireModulePermission("communication", "approve"),

  // Specific Communication permissions
  message: {
    view: requirePermission("communication.message.view"),
    create: requirePermission("communication.message.create"),
    edit: requirePermission("communication.message.edit"),
    delete: requirePermission("communication.message.delete"),
    approve: requirePermission("communication.message.approve"),
  },

  announcement: {
    view: requirePermission("communication.announcement.view"),
    create: requirePermission("communication.announcement.create"),
    edit: requirePermission("communication.announcement.edit"),
    delete: requirePermission("communication.announcement.delete"),
    approve: requirePermission("communication.announcement.approve"),
  },
};

// System Module Middleware
export const systemMiddleware = {
  view: requireModulePermission("system", "view"),
  create: requireModulePermission("system", "create"),
  edit: requireModulePermission("system", "edit"),
  delete: requireModulePermission("system", "delete"),
  approve: requireModulePermission("system", "approve"),

  // Specific System permissions
  user: {
    view: requirePermission("system.user.view"),
    create: requirePermission("system.user.create"),
    edit: requirePermission("system.user.edit"),
    delete: requirePermission("system.user.delete"),
    approve: requirePermission("system.user.approve"),
  },

  role: {
    view: requirePermission("system.role.view"),
    create: requirePermission("system.role.create"),
    edit: requirePermission("system.role.edit"),
    delete: requirePermission("system.role.delete"),
    approve: requirePermission("system.role.approve"),
  },

  department: {
    view: requirePermission("system.department.view"),
    create: requirePermission("system.department.create"),
    edit: requirePermission("system.department.edit"),
    delete: requirePermission("system.department.delete"),
    approve: requirePermission("system.department.approve"),
  },
};

// ============================================================================
// UTILITY MIDDLEWARE
// ============================================================================

/**
 * Middleware to add user permissions to request
 * @returns {Function} Express middleware
 */
export const addUserPermissions = (req, res, next) => {
  try {
    if (req.user) {
      req.userPermissions = {
        accessibleModules: getUserAccessibleModules(req.user),
        hasPermission: (permission) => hasPermission(req.user, permission),
        hasModulePermission: (module, action) =>
          hasModulePermission(req.user, module, action),
        hasRoleLevel: (level) => hasRoleLevel(req.user, level),
      };
    }
    next();
  } catch (error) {
    console.error("Error adding user permissions:", error);
    next();
  }
};

/**
 * Middleware to log permission checks (for debugging)
 * @returns {Function} Express middleware
 */
export const logPermissionChecks = (req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (data.success === false && data.message === "Insufficient permissions") {
      console.log(
        `🔒 Permission denied: ${req.user?.email} - ${req.method} ${req.path}`
      );
      console.log(`   Required: ${data.requiredPermission}`);
      console.log(
        `   User role: ${req.user?.role?.name} (Level: ${req.user?.role?.level})`
      );
    }
    return originalJson.call(this, data);
  };
  next();
};

// ============================================================================
// EXPORT ALL MIDDLEWARE
// ============================================================================
export default {
  // Core functions
  hasPermission,
  hasModulePermission,
  hasRoleLevel,
  getUserAccessibleModules,

  // Basic middleware
  requirePermission,
  requireModulePermission,
  requireRoleLevel,
  requireSuperAdmin,
  requirePlatformAdmin,
  requireCompanyAdmin,
  requireManager,

  // Module-specific middleware
  hr: hrMiddleware,
  payroll: payrollMiddleware,
  procurement: procurementMiddleware,
  accounts: accountsMiddleware,
  communication: communicationMiddleware,
  system: systemMiddleware,

  // Utility middleware
  addUserPermissions,
  logPermissionChecks,
};
