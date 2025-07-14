import { body, validationResult } from "express-validator";

// Permission levels hierarchy (similar to Django admin)
export const PERMISSION_LEVELS = {
  SUPER_ADMIN: 100,
  ADMIN: 90,
  MANAGER: 80,
  SUPERVISOR: 70,
  SENIOR_STAFF: 60,
  STAFF: 50,
  JUNIOR_STAFF: 40,
  EXTERNAL_USER: 30,
  GUEST: 20,
  READ_ONLY: 10,
};

// Permission types
export const PERMISSION_TYPES = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  APPROVE: "approve",
  REJECT: "reject",
  SHARE: "share",
  EXPORT: "export",
  IMPORT: "import",
  ASSIGN: "assign",
  DELEGATE: "delegate",
};

// Document-specific permissions
export const DOCUMENT_PERMISSIONS = {
  UPLOAD: "document.upload",
  VIEW: "document.view",
  EDIT: "document.edit",
  DELETE: "document.delete",
  APPROVE: "document.approve",
  REJECT: "document.reject",
  SHARE: "document.share",
  EXPORT: "document.export",
  ASSIGN: "document.assign",
};

// Workflow permissions
export const WORKFLOW_PERMISSIONS = {
  CREATE_WORKFLOW: "workflow.create",
  START_WORKFLOW: "workflow.start",
  APPROVE_STEP: "workflow.approve",
  REJECT_STEP: "workflow.reject",
  DELEGATE_TASK: "workflow.delegate",
  VIEW_WORKFLOW: "workflow.view",
};

// User management permissions
export const USER_PERMISSIONS = {
  CREATE_USER: "user.create",
  VIEW_USER: "user.view",
  EDIT_USER: "user.edit",
  DELETE_USER: "user.delete",
  ASSIGN_ROLE: "user.assign_role",
  VIEW_PERMISSIONS: "user.view_permissions",
};

/**
 * Check if user has permission for a specific action
 * @param {Object} user - User object with role and permissions
 * @param {string} permission - Permission to check
 * @param {Object} resource - Resource object (optional)
 * @returns {boolean}
 */
export const hasPermission = (user, permission, resource = null) => {
  if (!user || !user.role) return false;

  // Super admin has all permissions
  if (user.role.level >= PERMISSION_LEVELS.SUPER_ADMIN) return true;

  // Check if user has the specific permission
  if (user.permissions && user.permissions.includes(permission)) return true;

  // Check role-based permissions
  if (user.role.permissions && user.role.permissions.includes(permission))
    return true;

  // Check resource-specific permissions
  if (resource && resource.permissions) {
    const resourcePermission = resource.permissions.find(
      (p) => p.userId === user._id && p.permission === permission
    );
    if (resourcePermission) return true;
  }

  return false;
};

/**
 * Check if user can perform action on another user (hierarchical check)
 * @param {Object} currentUser - Current user
 * @param {Object} targetUser - Target user
 * @param {string} action - Action to perform
 * @returns {boolean}
 */
export const canManageUser = (currentUser, targetUser, action) => {
  if (!currentUser || !targetUser) return false;

  // Super admin can manage anyone
  if (currentUser.role.level >= PERMISSION_LEVELS.SUPER_ADMIN) return true;

  // Users can't manage users with higher or equal role levels
  if (targetUser.role.level >= currentUser.role.level) return false;

  // Check specific permissions
  const permissionMap = {
    edit: USER_PERMISSIONS.EDIT_USER,
    delete: USER_PERMISSIONS.DELETE_USER,
    assign_role: USER_PERMISSIONS.ASSIGN_ROLE,
    view: USER_PERMISSIONS.VIEW_USER,
  };

  return hasPermission(currentUser, permissionMap[action]);
};

/**
 * Get users that current user can manage
 * @param {Object} currentUser - Current user
 * @param {Array} allUsers - All users in system
 * @returns {Array}
 */
export const getManageableUsers = (currentUser, allUsers) => {
  if (!currentUser || !allUsers) return [];

  return allUsers.filter(
    (user) =>
      user.role.level < currentUser.role.level &&
      hasPermission(currentUser, USER_PERMISSIONS.VIEW_USER)
  );
};

/**
 * Create hierarchical permission structure
 * @param {Object} user - User object
 * @param {Array} departments - Available departments
 * @returns {Object}
 */
export const createPermissionStructure = (user, departments = []) => {
  const structure = {
    canManageUsers: hasPermission(user, USER_PERMISSIONS.CREATE_USER),
    canAssignRoles: hasPermission(user, USER_PERMISSIONS.ASSIGN_ROLE),
    canCreateWorkflows: hasPermission(
      user,
      WORKFLOW_PERMISSIONS.CREATE_WORKFLOW
    ),
    canApproveDocuments: hasPermission(user, DOCUMENT_PERMISSIONS.APPROVE),
    manageableDepartments: [],
    manageableRoles: [],
  };

  // Determine manageable departments based on user's role
  if (user.department) {
    structure.manageableDepartments = departments.filter(
      (dept) => dept.level <= user.department.level
    );
  }

  // Determine manageable roles based on user's role level
  structure.manageableRoles = Object.entries(PERMISSION_LEVELS)
    .filter(([_, level]) => level < user.role.level)
    .map(([role, level]) => ({ role, level }));

  return structure;
};

/**
 * Validate permission assignment
 */
export const validatePermissionAssignment = [
  body("userId").isMongoId().withMessage("Valid user ID required"),
  body("permissions").isArray().withMessage("Permissions must be an array"),
  body("permissions.*")
    .isString()
    .withMessage("Each permission must be a string"),
  body("resourceType")
    .optional()
    .isString()
    .withMessage("Resource type must be a string"),
  body("resourceId")
    .optional()
    .isMongoId()
    .withMessage("Valid resource ID required"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

/**
 * Generate permission audit log
 * @param {Object} user - User performing action
 * @param {string} action - Action performed
 * @param {Object} target - Target of action
 * @param {Object} changes - Changes made
 * @returns {Object}
 */
export const generatePermissionAudit = (user, action, target, changes = {}) => {
  return {
    timestamp: new Date(),
    userId: user._id,
    userEmail: user.email,
    action,
    targetType: target.type || "user",
    targetId: target._id,
    changes,
    ipAddress: user.lastIpAddress,
    userAgent: user.lastUserAgent,
  };
};

/**
 * Check if user can delegate tasks
 * @param {Object} user - Current user
 * @param {Object} task - Task to delegate
 * @param {Object} targetUser - User to delegate to
 * @returns {boolean}
 */
export const canDelegateTask = (user, task, targetUser) => {
  // Check if user has delegation permission
  if (!hasPermission(user, WORKFLOW_PERMISSIONS.DELEGATE_TASK)) return false;

  // Check if target user can handle the task
  if (!hasPermission(targetUser, task.requiredPermission)) return false;

  // Check hierarchical relationship
  return targetUser.role.level <= user.role.level;
};

/**
 * Get effective permissions for a user
 * @param {Object} user - User object
 * @returns {Array}
 */
export const getEffectivePermissions = (user) => {
  const permissions = new Set();

  // Add role permissions
  if (user.role && user.role.permissions) {
    user.role.permissions.forEach((p) => permissions.add(p));
  }

  // Add user-specific permissions
  if (user.permissions) {
    user.permissions.forEach((p) => permissions.add(p));
  }

  // Add inherited permissions based on role level
  Object.entries(PERMISSION_LEVELS).forEach(([role, level]) => {
    if (level <= user.role.level) {
      // Add basic permissions for this level
      permissions.add(`${role.toLowerCase()}.read`);
      permissions.add(`${role.toLowerCase()}.view`);
    }
  });

  return Array.from(permissions);
};
