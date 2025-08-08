// User Role Levels (aligned with actual database)
export const USER_ROLE_LEVELS = {
  SUPER_ADMIN: 1000,
  HOD: 700,
  MANAGER: 600,
  STAFF: 300,
  VIEWER: 100, // Missing in DB, needs to be added
};

// ERP Module Permissions (aligned with actual database)
export const ERP_MODULES = {
  HR: "hr",
  PAYROLL: "payroll",
  PROCUREMENT: "procurement",
  FINANCE: "finance", // Actual module name in DB
  COMMUNICATION: "communication",
  DOCUMENTS: "documents", // Actual module in DB
  PROJECTS: "projects", // Actual module in DB
  INVENTORY: "inventory", // Actual module in DB
  CUSTOMER_CARE: "customer_care", // Missing in DB, needs to be added
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

  // HR Module permissions
  HR_EMPLOYEE_CREATE: "hr.employee.create",
  HR_EMPLOYEE_VIEW: "hr.employee.view",
  HR_EMPLOYEE_EDIT: "hr.employee.edit",
  HR_EMPLOYEE_DELETE: "hr.employee.delete",
  HR_RECRUITMENT: "hr.recruitment",
  HR_PERFORMANCE: "hr.performance",
  HR_LEAVE_MANAGEMENT: "hr.leave.management",
  HR_TRAINING: "hr.training",

  // Payroll Module permissions
  PAYROLL_CALCULATE: "payroll.calculate",
  PAYROLL_VIEW: "payroll.view",
  PAYROLL_APPROVE: "payroll.approve",
  PAYROLL_PROCESS: "payroll.process",
  PAYROLL_REPORTS: "payroll.reports",

  // Procurement Module permissions
  PROCUREMENT_CREATE: "procurement.create",
  PROCUREMENT_VIEW: "procurement.view",
  PROCUREMENT_APPROVE: "procurement.approve",
  PROCUREMENT_PROCESS: "procurement.process",
  PROCUREMENT_VENDOR: "procurement.vendor",

  // Finance Module permissions (replaces ACCOUNTS)
  FINANCE_BILLING: "finance.billing",
  FINANCE_VIEW: "finance.view",
  FINANCE_APPROVE: "finance.approve",
  FINANCE_REPORTS: "finance.reports",

  // Communication Module permissions
  COMMUNICATION_SEND: "communication.send",
  COMMUNICATION_VIEW: "communication.view",
  COMMUNICATION_MANAGE: "communication.manage",

  // Customer Care Module permissions
  CUSTOMER_CARE_VIEW: "customer_care.view",
  CUSTOMER_CARE_CREATE: "customer_care.create",
  CUSTOMER_CARE_EDIT: "customer_care.edit",
  CUSTOMER_CARE_RESOLVE: "customer_care.resolve",

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

// Role level checks helper functions
export const isSuperAdmin = (user) =>
  user?.role?.level === USER_ROLE_LEVELS.SUPER_ADMIN;
export const isHOD = (user) => user?.role?.level === USER_ROLE_LEVELS.HOD;
export const isManager = (user) =>
  user?.role?.level === USER_ROLE_LEVELS.MANAGER;
export const isStaff = (user) => user?.role?.level === USER_ROLE_LEVELS.STAFF;
export const isViewer = (user) => user?.role?.level === USER_ROLE_LEVELS.VIEWER;

// Module access checks (aligned with actual DB structure)
export const canAccessModule = (user, module) => {
  const modulePermissions = {
    [ERP_MODULES.HR]: [
      PERMISSIONS.HR_EMPLOYEE_VIEW,
      PERMISSIONS.HR_EMPLOYEE_CREATE,
    ],
    [ERP_MODULES.PAYROLL]: [
      PERMISSIONS.PAYROLL_VIEW,
      PERMISSIONS.PAYROLL_CALCULATE,
    ],
    [ERP_MODULES.PROCUREMENT]: [
      PERMISSIONS.PROCUREMENT_VIEW,
      PERMISSIONS.PROCUREMENT_CREATE,
    ],
    [ERP_MODULES.FINANCE]: [
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_BILLING,
    ],
    [ERP_MODULES.COMMUNICATION]: [
      PERMISSIONS.COMMUNICATION_VIEW,
      PERMISSIONS.COMMUNICATION_SEND,
    ],
    [ERP_MODULES.DOCUMENTS]: [
      PERMISSIONS.DOCUMENT_VIEW,
      PERMISSIONS.DOCUMENT_UPLOAD,
    ],
    [ERP_MODULES.PROJECTS]: ["projects.view", "projects.create"],
    [ERP_MODULES.INVENTORY]: ["inventory.view", "inventory.create"],
    [ERP_MODULES.CUSTOMER_CARE]: [
      PERMISSIONS.CUSTOMER_CARE_VIEW,
      PERMISSIONS.CUSTOMER_CARE_CREATE,
    ],
  };

  const requiredPermissions = modulePermissions[module] || [];
  return requiredPermissions.some((permission) =>
    hasPermission(user, permission)
  );
};

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

// Role descriptions for UI (updated for ERP system)
export const ROLE_DESCRIPTIONS = {
  [USER_ROLE_LEVELS.SUPER_ADMIN]:
    "Full access to all ERP modules and system administration features",
  [USER_ROLE_LEVELS.HOD]:
    "Head of Department with HR management, limited procurement approval, and communication tools",
  [USER_ROLE_LEVELS.MANAGER]:
    "Department manager with approval workflows and department-specific module access",
  [USER_ROLE_LEVELS.STAFF]:
    "Staff member with basic module access and self-service features",
  [USER_ROLE_LEVELS.VIEWER]: "Read-only access to reports and announcements",
};

// Module descriptions for UI
export const MODULE_DESCRIPTIONS = {
  [ERP_MODULES.HR]:
    "Employee lifecycle management, recruitment, performance, and training",
  [ERP_MODULES.PAYROLL]:
    "Salary processing, deductions, tax management, and payroll reporting",
  [ERP_MODULES.PROCUREMENT]:
    "Purchase requests, vendor management, and contract handling",
  [ERP_MODULES.FINANCE]: "Financial reporting, billing, and budget tracking",
  [ERP_MODULES.COMMUNICATION]:
    "Internal messaging, notifications, and collaboration tools",
  [ERP_MODULES.DOCUMENTS]: "Document storage, sharing, and workflow management",
  [ERP_MODULES.PROJECTS]:
    "Project planning, task management, and progress tracking",
  [ERP_MODULES.INVENTORY]:
    "Stock management, asset tracking, and inventory control",
  [ERP_MODULES.CUSTOMER_CARE]:
    "Customer support, ticket management, and service requests",
};
