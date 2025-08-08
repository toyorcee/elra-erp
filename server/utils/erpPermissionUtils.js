import {
  ERP_ROLES,
  PERMISSION_LEVELS,
  HR_PERMISSIONS,
  PAYROLL_PERMISSIONS,
  PROCUREMENT_PERMISSIONS,
  ACCOUNTS_PERMISSIONS,
  COMMUNICATION_PERMISSIONS,
  SYSTEM_PERMISSIONS,
  hasModulePermission,
  getUserAccessibleModules,
} from "../constants/erpPermissions.js";

/**
 * Check if user has a specific permission (backward compatible)
 * @param {Object} user - User object with role populated
 * @param {string} permission - Permission string to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;

  // Check if user has the specific permission
  return user.role.permissions?.includes(permission) || false;
};

/**
 * Check if user has permission for a specific module action
 * @param {Object} user - User object with role populated
 * @param {string} module - Module name (HR, PAYROLL, etc.)
 * @param {string} action - Action (view, create, edit, delete, approve)
 * @returns {boolean} True if user has permission
 */
export const hasModulePermission = (user, module, action) => {
  if (!user || !user.role) return false;

  const permission = `${module.toLowerCase()}.${action}`;
  return hasPermission(user, permission);
};

/**
 * Get user's accessible modules
 * @param {Object} user - User object with role populated
 * @returns {Array} Array of accessible module names
 */
export const getUserAccessibleModules = (user) => {
  if (!user || !user.role) return [];

  const modules = [
    "HR",
    "PAYROLL",
    "PROCUREMENT",
    "ACCOUNTS",
    "COMMUNICATION",
    "SYSTEM",
    "DOCUMENTS",
  ];

  return modules.filter((module) => {
    return hasModulePermission(user, module, "view");
  });
};

/**
 * Check if user can approve registrations in their department
 * @param {Object} user - User object with role populated
 * @param {string} targetDepartment - Department of user being approved
 * @returns {boolean} True if user can approve
 */
export const canApproveDepartmentUser = (user, targetDepartment) => {
  if (!user || !user.role) return false;

  // Super Admin can approve anyone
  if (user.role.level >= PERMISSION_LEVELS.SUPER_ADMIN) return true;

  // Department Head can approve users in their department
  if (user.role.canApproveDepartment && user.department === targetDepartment) {
    return true;
  }

  // Check specific permission
  return hasPermission(user, "user.approve_department");
};

/**
 * Check if user registration should be auto-approved
 * @param {Object} role - Role object
 * @returns {boolean} True if role has auto-approval
 */
export const shouldAutoApprove = (role) => {
  if (!role) return false;

  // Basic roles get auto-approved
  const autoApproveRoles = ["STAFF", "JUNIOR_STAFF", "VIEWER"];

  return role.autoApproval || autoApproveRoles.includes(role.name);
};

/**
 * Get approval workflow for user registration
 * @param {Object} role - Role being assigned
 * @param {Object} currentUser - Current user making the request
 * @param {string} targetDepartment - Department of new user
 * @returns {Object} Approval workflow configuration
 */
export const getRegistrationApprovalWorkflow = (
  role,
  currentUser,
  targetDepartment
) => {
  // Auto-approval for basic roles
  if (shouldAutoApprove(role)) {
    return {
      requiresApproval: false,
      autoApprove: true,
      approver: null,
      message: "User will be auto-approved",
    };
  }

  // Department Head approval
  if (canApproveDepartmentUser(currentUser, targetDepartment)) {
    return {
      requiresApproval: true,
      autoApprove: false,
      approver: currentUser._id,
      message: "Department Head approval required",
    };
  }

  // Super Admin approval
  return {
    requiresApproval: true,
    autoApprove: false,
    approver: null, // Will be assigned to Super Admin
    message: "Super Admin approval required",
  };
};

/**
 * Get module-specific permissions for a user
 * @param {Object} user - User object with role populated
 * @param {string} module - Module name
 * @returns {Array} Array of permissions for the module
 */
export const getModulePermissions = (user, module) => {
  if (!user || !user.role) return [];

  const modulePermissions = {
    HR: Object.values(HR_PERMISSIONS),
    PAYROLL: Object.values(PAYROLL_PERMISSIONS),
    PROCUREMENT: Object.values(PROCUREMENT_PERMISSIONS),
    ACCOUNTS: Object.values(ACCOUNTS_PERMISSIONS),
    COMMUNICATION: Object.values(COMMUNICATION_PERMISSIONS),
    SYSTEM: Object.values(SYSTEM_PERMISSIONS),
  };

  const allModulePermissions = modulePermissions[module] || [];

  return allModulePermissions.filter((permission) =>
    hasPermission(user, permission)
  );
};

/**
 * Check if user can manage documents in a specific module
 * @param {Object} user - User object with role populated
 * @param {string} module - Module name
 * @param {string} action - Document action (upload, view, edit, delete, approve)
 * @returns {boolean} True if user can perform action
 */
export const canManageModuleDocuments = (user, module, action) => {
  if (!user || !user.role) return false;

  // Check module-specific document permissions
  const moduleDocPermission = `${module.toLowerCase()}.document.${action}`;
  if (hasPermission(user, moduleDocPermission)) {
    return true;
  }

  // Check general document permissions (backward compatibility)
  const generalDocPermission = `document.${action}`;
  return hasPermission(user, generalDocPermission);
};

/**
 * Get role hierarchy level
 * @param {Object} role - Role object
 * @returns {number} Role level (higher = more privileges)
 */
export const getRoleLevel = (role) => {
  if (!role) return 0;

  return role.level || PERMISSION_LEVELS.GUEST;
};

/**
 * Check if user can assign a specific role
 * @param {Object} currentUser - Current user making the assignment
 * @param {Object} targetRole - Role being assigned
 * @returns {boolean} True if user can assign the role
 */
export const canAssignRole = (currentUser, targetRole) => {
  if (!currentUser || !currentUser.role || !targetRole) return false;

  const currentUserLevel = getRoleLevel(currentUser.role);
  const targetRoleLevel = getRoleLevel(targetRole);

  // Users can only assign roles lower than their own
  return currentUserLevel > targetRoleLevel;
};

/**
 * Get recommended role for department
 * @param {string} department - Department name
 * @returns {string} Recommended role name
 */
export const getRecommendedRoleForDepartment = (department) => {
  const departmentRoleMap = {
    HR: "HR_MANAGER",
    Payroll: "PAYROLL_MANAGER",
    Procurement: "PROCUREMENT_MANAGER",
    Finance: "FINANCE_MANAGER",
    Accounts: "FINANCE_MANAGER",
    IT: "HOD",
    Operations: "HOD",
    Marketing: "HOD",
    Sales: "HOD",
    Legal: "HOD",
  };

  return departmentRoleMap[department] || "STAFF";
};

/**
 * Validate permission assignment
 * @param {Array} permissions - Permissions to assign
 * @param {string} roleName - Role name
 * @returns {Object} Validation result
 */
export const validatePermissionAssignment = (permissions, roleName) => {
  const allValidPermissions = [
    ...Object.values(HR_PERMISSIONS),
    ...Object.values(PAYROLL_PERMISSIONS),
    ...Object.values(PROCUREMENT_PERMISSIONS),
    ...Object.values(ACCOUNTS_PERMISSIONS),
    ...Object.values(COMMUNICATION_PERMISSIONS),
    ...Object.values(SYSTEM_PERMISSIONS),
    // Legacy permissions
    "document.upload",
    "document.view",
    "document.edit",
    "document.delete",
    "document.approve",
    "document.reject",
    "document.share",
    "document.export",
    "user.create",
    "user.view",
    "user.edit",
    "user.delete",
    "user.assign_role",
    "workflow.create",
    "workflow.start",
    "workflow.approve",
    "workflow.reject",
    "system.settings",
    "system.reports",
    "system.audit",
  ];

  const invalidPermissions = permissions.filter(
    (permission) => !allValidPermissions.includes(permission)
  );

  return {
    isValid: invalidPermissions.length === 0,
    invalidPermissions,
    message:
      invalidPermissions.length > 0
        ? `Invalid permissions: ${invalidPermissions.join(", ")}`
        : "All permissions are valid",
  };
};
