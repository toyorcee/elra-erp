// User Role Levels (for regular users, not Super Admin)
export const USER_ROLE_LEVELS = {
  MANAGER: 50,
  SUPERVISOR: 40,
  SENIOR_STAFF: 30,
  STAFF: 20,
  JUNIOR_STAFF: 15,
  EXTERNAL_USER: 10,
};

// Permission constants
export const PERMISSIONS = {
  // Document permissions
  DOCUMENT_UPLOAD: "document.upload",
  DOCUMENT_VIEW: "document.view",
  DOCUMENT_EDIT: "document.edit",
  DOCUMENT_DELETE: "document.delete",
  DOCUMENT_APPROVE: "document.approve",
  DOCUMENT_REJECT: "document.reject",
  DOCUMENT_SHARE: "document.share",
  DOCUMENT_EXPORT: "document.export",
  DOCUMENT_ARCHIVE: "document.archive",
  DOCUMENT_SCAN: "document.scan",

  // Workflow permissions
  WORKFLOW_CREATE: "workflow.create",
  WORKFLOW_START: "workflow.start",
  WORKFLOW_APPROVE: "workflow.approve",
  WORKFLOW_REJECT: "workflow.reject",
  WORKFLOW_DELEGATE: "workflow.delegate",
  WORKFLOW_VIEW: "workflow.view",

  // User management permissions
  USER_CREATE: "user.create",
  USER_VIEW: "user.view",
  USER_EDIT: "user.edit",
  USER_DELETE: "user.delete",
  USER_ASSIGN_ROLE: "user.assign_role",
  USER_VIEW_PERMISSIONS: "user.view_permissions",

  // System permissions
  SYSTEM_SETTINGS: "system.settings",
  SYSTEM_REPORTS: "system.reports",
  SYSTEM_AUDIT: "system.audit",
  SYSTEM_BACKUP: "system.backup",
};

// Role-based permission checks helper function
export const hasPermission = (user, permission) => {
  return user?.role?.permissions?.includes(permission) || false;
};

// Role level checks helper functions (based on actual system levels)
export const isManager = (user) =>
  user?.role?.level === USER_ROLE_LEVELS.MANAGER;
export const isSupervisor = (user) =>
  user?.role?.level === USER_ROLE_LEVELS.SUPERVISOR;
export const isSeniorStaff = (user) =>
  user?.role?.level === USER_ROLE_LEVELS.SENIOR_STAFF;
export const isStaff = (user) => user?.role?.level === USER_ROLE_LEVELS.STAFF;
export const isJuniorStaff = (user) =>
  user?.role?.level === USER_ROLE_LEVELS.JUNIOR_STAFF;
export const isExternalUser = (user) =>
  user?.role?.level === USER_ROLE_LEVELS.EXTERNAL_USER;

// Common permission checks
export const canUploadDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_UPLOAD);
export const canViewDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_VIEW);
export const canEditDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_EDIT);
export const canDeleteDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_DELETE);
export const canApproveDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_APPROVE);
export const canRejectDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_REJECT);
export const canShareDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_SHARE);
export const canExportDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_EXPORT);
export const canArchiveDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_ARCHIVE);
export const canScanDocuments = (user) =>
  hasPermission(user, PERMISSIONS.DOCUMENT_SCAN);

export const canCreateWorkflows = (user) =>
  hasPermission(user, PERMISSIONS.WORKFLOW_CREATE);
export const canStartWorkflows = (user) =>
  hasPermission(user, PERMISSIONS.WORKFLOW_START);
export const canApproveWorkflows = (user) =>
  hasPermission(user, PERMISSIONS.WORKFLOW_APPROVE);
export const canRejectWorkflows = (user) =>
  hasPermission(user, PERMISSIONS.WORKFLOW_REJECT);
export const canDelegateWorkflows = (user) =>
  hasPermission(user, PERMISSIONS.WORKFLOW_DELEGATE);
export const canViewWorkflows = (user) =>
  hasPermission(user, PERMISSIONS.WORKFLOW_VIEW);

export const canViewUsers = (user) =>
  hasPermission(user, PERMISSIONS.USER_VIEW);
export const canEditUsers = (user) =>
  hasPermission(user, PERMISSIONS.USER_EDIT);
export const canAssignRoles = (user) =>
  hasPermission(user, PERMISSIONS.USER_ASSIGN_ROLE);
export const canViewPermissions = (user) =>
  hasPermission(user, PERMISSIONS.USER_VIEW_PERMISSIONS);

export const canAccessSettings = (user) =>
  hasPermission(user, PERMISSIONS.SYSTEM_SETTINGS);
export const canViewReports = (user) =>
  hasPermission(user, PERMISSIONS.SYSTEM_REPORTS);
export const canViewAudit = (user) =>
  hasPermission(user, PERMISSIONS.SYSTEM_AUDIT);

// Role descriptions for UI (based on actual system descriptions)
export const ROLE_DESCRIPTIONS = {
  [USER_ROLE_LEVELS.MANAGER]:
    "Department manager with full document management, cross-department transfers, enhanced management features, scanning and upload capabilities",
  [USER_ROLE_LEVELS.SUPERVISOR]:
    "Department supervisor with full document management, limited cross-department transfers, scanning and upload capabilities",
  [USER_ROLE_LEVELS.SENIOR_STAFF]:
    "Ensures regulatory compliance, conducts document audits, scanning and upload capabilities",
  [USER_ROLE_LEVELS.STAFF]:
    "Manages local operations, client interactions, document updates, scanning and upload capabilities",
  [USER_ROLE_LEVELS.JUNIOR_STAFF]:
    "Performs day-to-day tasks with document access (no scanning or upload capabilities)",
  [USER_ROLE_LEVELS.EXTERNAL_USER]:
    "Interacts with NAIC through secure portals for document submission or retrieval (no scanning or upload capabilities)",
};
