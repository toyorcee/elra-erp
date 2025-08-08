// ELRA ERP Permission System
// Comprehensive role-based access control for all ERP modules

// ============================================================================
// PERMISSION LEVELS (Hierarchy)
// ============================================================================
export const PERMISSION_LEVELS = {
  SUPER_ADMIN: 1000, // Full system access
  HOD: 700, // Department management
  MANAGER: 600, // Team management
  SUPERVISOR: 500, // Supervisory access
  SENIOR_STAFF: 400, // Senior staff access
  STAFF: 300, // Regular staff access
  JUNIOR_STAFF: 200, // Junior staff access
  VIEWER: 100, // Read-only access
  GUEST: 50, // Limited access
};

// ============================================================================
// MODULE PERMISSIONS
// ============================================================================

// HR Module Permissions
export const HR_PERMISSIONS = {
  // Employee Management
  EMPLOYEE_VIEW: "hr.employee.view",
  EMPLOYEE_CREATE: "hr.employee.create",
  EMPLOYEE_EDIT: "hr.employee.edit",
  EMPLOYEE_DELETE: "hr.employee.delete",
  EMPLOYEE_APPROVE: "hr.employee.approve",

  // Recruitment
  RECRUITMENT_VIEW: "hr.recruitment.view",
  RECRUITMENT_CREATE: "hr.recruitment.create",
  RECRUITMENT_EDIT: "hr.recruitment.edit",
  RECRUITMENT_DELETE: "hr.recruitment.delete",
  RECRUITMENT_APPROVE: "hr.recruitment.approve",

  // Onboarding
  ONBOARDING_VIEW: "hr.onboarding.view",
  ONBOARDING_CREATE: "hr.onboarding.create",
  ONBOARDING_EDIT: "hr.onboarding.edit",
  ONBOARDING_DELETE: "hr.onboarding.delete",
  ONBOARDING_APPROVE: "hr.onboarding.approve",

  // Performance Management
  PERFORMANCE_VIEW: "hr.performance.view",
  PERFORMANCE_CREATE: "hr.performance.create",
  PERFORMANCE_EDIT: "hr.performance.edit",
  PERFORMANCE_DELETE: "hr.performance.delete",
  PERFORMANCE_APPROVE: "hr.performance.approve",

  // Leave Management
  LEAVE_VIEW: "hr.leave.view",
  LEAVE_CREATE: "hr.leave.create",
  LEAVE_EDIT: "hr.leave.edit",
  LEAVE_DELETE: "hr.leave.delete",
  LEAVE_APPROVE: "hr.leave.approve",

  // HR Reports
  HR_REPORTS_VIEW: "hr.reports.view",
  HR_REPORTS_CREATE: "hr.reports.create",
  HR_REPORTS_EXPORT: "hr.reports.export",
};

// Payroll Module Permissions
export const PAYROLL_PERMISSIONS = {
  // Salary Management
  SALARY_VIEW: "payroll.salary.view",
  SALARY_CREATE: "payroll.salary.create",
  SALARY_EDIT: "payroll.salary.edit",
  SALARY_DELETE: "payroll.salary.delete",
  SALARY_APPROVE: "payroll.salary.approve",

  // Payroll Processing
  PAYROLL_PROCESS_VIEW: "payroll.process.view",
  PAYROLL_PROCESS_CREATE: "payroll.process.create",
  PAYROLL_PROCESS_EDIT: "payroll.process.edit",
  PAYROLL_PROCESS_DELETE: "payroll.process.delete",
  PAYROLL_PROCESS_APPROVE: "payroll.process.approve",

  // Deductions
  DEDUCTION_VIEW: "payroll.deduction.view",
  DEDUCTION_CREATE: "payroll.deduction.create",
  DEDUCTION_EDIT: "payroll.deduction.edit",
  DEDUCTION_DELETE: "payroll.deduction.delete",
  DEDUCTION_APPROVE: "payroll.deduction.approve",

  // Tax Management
  TAX_VIEW: "payroll.tax.view",
  TAX_CREATE: "payroll.tax.create",
  TAX_EDIT: "payroll.tax.edit",
  TAX_DELETE: "payroll.tax.delete",
  TAX_APPROVE: "payroll.tax.approve",

  // Payment Tracking
  PAYMENT_VIEW: "payroll.payment.view",
  PAYMENT_CREATE: "payroll.payment.create",
  PAYMENT_EDIT: "payroll.payment.edit",
  PAYMENT_DELETE: "payroll.payment.delete",
  PAYMENT_APPROVE: "payroll.payment.approve",

  // Payroll Reports
  PAYROLL_REPORTS_VIEW: "payroll.reports.view",
  PAYROLL_REPORTS_CREATE: "payroll.reports.create",
  PAYROLL_REPORTS_EXPORT: "payroll.reports.export",
};

// Procurement Module Permissions
export const PROCUREMENT_PERMISSIONS = {
  // Purchase Requisitions
  REQUISITION_VIEW: "procurement.requisition.view",
  REQUISITION_CREATE: "procurement.requisition.create",
  REQUISITION_EDIT: "procurement.requisition.edit",
  REQUISITION_DELETE: "procurement.requisition.delete",
  REQUISITION_APPROVE: "procurement.requisition.approve",

  // Purchase Orders
  PURCHASE_ORDER_VIEW: "procurement.purchase_order.view",
  PURCHASE_ORDER_CREATE: "procurement.purchase_order.create",
  PURCHASE_ORDER_EDIT: "procurement.purchase_order.edit",
  PURCHASE_ORDER_DELETE: "procurement.purchase_order.delete",
  PURCHASE_ORDER_APPROVE: "procurement.purchase_order.approve",

  // Vendor Management
  VENDOR_VIEW: "procurement.vendor.view",
  VENDOR_CREATE: "procurement.vendor.create",
  VENDOR_EDIT: "procurement.vendor.edit",
  VENDOR_DELETE: "procurement.vendor.delete",
  VENDOR_APPROVE: "procurement.vendor.approve",

  // Inventory Management
  INVENTORY_VIEW: "procurement.inventory.view",
  INVENTORY_CREATE: "procurement.inventory.create",
  INVENTORY_EDIT: "procurement.inventory.edit",
  INVENTORY_DELETE: "procurement.inventory.delete",
  INVENTORY_APPROVE: "procurement.inventory.approve",

  // Contract Management
  CONTRACT_VIEW: "procurement.contract.view",
  CONTRACT_CREATE: "procurement.contract.create",
  CONTRACT_EDIT: "procurement.contract.edit",
  CONTRACT_DELETE: "procurement.contract.delete",
  CONTRACT_APPROVE: "procurement.contract.approve",

  // Procurement Reports
  PROCUREMENT_REPORTS_VIEW: "procurement.reports.view",
  PROCUREMENT_REPORTS_CREATE: "procurement.reports.create",
  PROCUREMENT_REPORTS_EXPORT: "procurement.reports.export",
};

// Accounts Module Permissions
export const ACCOUNTS_PERMISSIONS = {
  // Expense Management
  EXPENSE_VIEW: "accounts.expense.view",
  EXPENSE_CREATE: "accounts.expense.create",
  EXPENSE_EDIT: "accounts.expense.edit",
  EXPENSE_DELETE: "accounts.expense.delete",
  EXPENSE_APPROVE: "accounts.expense.approve",

  // Revenue Management
  REVENUE_VIEW: "accounts.revenue.view",
  REVENUE_CREATE: "accounts.revenue.create",
  REVENUE_EDIT: "accounts.revenue.edit",
  REVENUE_DELETE: "accounts.revenue.delete",
  REVENUE_APPROVE: "accounts.revenue.approve",

  // Budget Management
  BUDGET_VIEW: "accounts.budget.view",
  BUDGET_CREATE: "accounts.budget.create",
  BUDGET_EDIT: "accounts.budget.edit",
  BUDGET_DELETE: "accounts.budget.delete",
  BUDGET_APPROVE: "accounts.budget.approve",

  // Financial Reports
  FINANCIAL_REPORTS_VIEW: "accounts.reports.view",
  FINANCIAL_REPORTS_CREATE: "accounts.reports.create",
  FINANCIAL_REPORTS_EXPORT: "accounts.reports.export",

  // Audit Management
  AUDIT_VIEW: "accounts.audit.view",
  AUDIT_CREATE: "accounts.audit.create",
  AUDIT_EDIT: "accounts.audit.edit",
  AUDIT_DELETE: "accounts.audit.delete",
  AUDIT_APPROVE: "accounts.audit.approve",
};

// Communication Module Permissions
export const COMMUNICATION_PERMISSIONS = {
  // Messaging
  MESSAGE_VIEW: "communication.message.view",
  MESSAGE_CREATE: "communication.message.create",
  MESSAGE_EDIT: "communication.message.edit",
  MESSAGE_DELETE: "communication.message.delete",
  MESSAGE_APPROVE: "communication.message.approve",

  // Announcements
  ANNOUNCEMENT_VIEW: "communication.announcement.view",
  ANNOUNCEMENT_CREATE: "communication.announcement.create",
  ANNOUNCEMENT_EDIT: "communication.announcement.edit",
  ANNOUNCEMENT_DELETE: "communication.announcement.delete",
  ANNOUNCEMENT_APPROVE: "communication.announcement.approve",

  // File Sharing
  FILE_VIEW: "communication.file.view",
  FILE_CREATE: "communication.file.create",
  FILE_EDIT: "communication.file.edit",
  FILE_DELETE: "communication.file.delete",
  FILE_APPROVE: "communication.file.approve",

  // Meeting Management
  MEETING_VIEW: "communication.meeting.view",
  MEETING_CREATE: "communication.meeting.create",
  MEETING_EDIT: "communication.meeting.edit",
  MEETING_DELETE: "communication.meeting.delete",
  MEETING_APPROVE: "communication.meeting.approve",
};

// System Administration Permissions
export const SYSTEM_PERMISSIONS = {
  // User Management
  USER_VIEW: "system.user.view",
  USER_CREATE: "system.user.create",
  USER_EDIT: "system.user.edit",
  USER_DELETE: "system.user.delete",
  USER_APPROVE: "system.user.approve",

  // Role Management
  ROLE_VIEW: "system.role.view",
  ROLE_CREATE: "system.role.create",
  ROLE_EDIT: "system.role.edit",
  ROLE_DELETE: "system.role.delete",
  ROLE_APPROVE: "system.role.approve",

  // Department Management
  DEPARTMENT_VIEW: "system.department.view",
  DEPARTMENT_CREATE: "system.department.create",
  DEPARTMENT_EDIT: "system.department.edit",
  DEPARTMENT_DELETE: "system.department.delete",
  DEPARTMENT_APPROVE: "system.department.approve",

  // System Settings
  SETTINGS_VIEW: "system.settings.view",
  SETTINGS_CREATE: "system.settings.create",
  SETTINGS_EDIT: "system.settings.edit",
  SETTINGS_DELETE: "system.settings.delete",
  SETTINGS_APPROVE: "system.settings.approve",

  // Audit Logs
  AUDIT_LOG_VIEW: "system.audit.view",
  AUDIT_LOG_CREATE: "system.audit.create",
  AUDIT_LOG_EDIT: "system.audit.edit",
  AUDIT_LOG_DELETE: "system.audit.delete",
  AUDIT_LOG_APPROVE: "system.audit.approve",
};

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

// Super Admin Role (Full Access)
export const SUPER_ADMIN_ROLE = {
  name: "Super Administrator",
  level: PERMISSION_LEVELS.SUPER_ADMIN,
  description: "Full system access with all permissions",
  permissions: [
    // All permissions from all modules
    ...Object.values(HR_PERMISSIONS),
    ...Object.values(PAYROLL_PERMISSIONS),
    ...Object.values(PROCUREMENT_PERMISSIONS),
    ...Object.values(ACCOUNTS_PERMISSIONS),
    ...Object.values(COMMUNICATION_PERMISSIONS),
    ...Object.values(SYSTEM_PERMISSIONS),
  ],
};

// Platform Admin Role
export const PLATFORM_ADMIN_ROLE = {
  name: "Platform Administrator",
  level: PERMISSION_LEVELS.PLATFORM_ADMIN,
  description: "Platform-level management and configuration",
  permissions: [
    // System permissions
    ...Object.values(SYSTEM_PERMISSIONS),
    // Limited module access for oversight
    HR_PERMISSIONS.HR_REPORTS_VIEW,
    PAYROLL_PERMISSIONS.PAYROLL_REPORTS_VIEW,
    PROCUREMENT_PERMISSIONS.PROCUREMENT_REPORTS_VIEW,
    ACCOUNTS_PERMISSIONS.FINANCIAL_REPORTS_VIEW,
    COMMUNICATION_PERMISSIONS.ANNOUNCEMENT_VIEW,
  ],
};

// Company Admin Role
export const COMPANY_ADMIN_ROLE = {
  name: "Company Administrator",
  level: PERMISSION_LEVELS.COMPANY_ADMIN,
  description: "Company-level management and oversight",
  permissions: [
    // All HR permissions
    ...Object.values(HR_PERMISSIONS),
    // All Payroll permissions
    ...Object.values(PAYROLL_PERMISSIONS),
    // All Procurement permissions
    ...Object.values(PROCUREMENT_PERMISSIONS),
    // All Accounts permissions
    ...Object.values(ACCOUNTS_PERMISSIONS),
    // All Communication permissions
    ...Object.values(COMMUNICATION_PERMISSIONS),
    // Limited system permissions
    SYSTEM_PERMISSIONS.USER_VIEW,
    SYSTEM_PERMISSIONS.USER_CREATE,
    SYSTEM_PERMISSIONS.USER_EDIT,
    SYSTEM_PERMISSIONS.DEPARTMENT_VIEW,
    SYSTEM_PERMISSIONS.DEPARTMENT_CREATE,
    SYSTEM_PERMISSIONS.DEPARTMENT_EDIT,
    SYSTEM_PERMISSIONS.SETTINGS_VIEW,
    SYSTEM_PERMISSIONS.SETTINGS_EDIT,
    SYSTEM_PERMISSIONS.AUDIT_LOG_VIEW,
  ],
};

// HR Manager Role
export const HR_MANAGER_ROLE = {
  name: "HR Manager",
  level: PERMISSION_LEVELS.MANAGER,
  description: "Human Resources department management",
  permissions: [
    // All HR permissions
    ...Object.values(HR_PERMISSIONS),
    // Limited payroll view
    PAYROLL_PERMISSIONS.PAYROLL_PROCESS_VIEW,
    PAYROLL_PERMISSIONS.PAYROLL_REPORTS_VIEW,
    // Limited communication
    COMMUNICATION_PERMISSIONS.ANNOUNCEMENT_VIEW,
    COMMUNICATION_PERMISSIONS.ANNOUNCEMENT_CREATE,
    COMMUNICATION_PERMISSIONS.ANNOUNCEMENT_EDIT,
  ],
};

// Payroll Manager Role
export const PAYROLL_MANAGER_ROLE = {
  name: "Payroll Manager",
  level: PERMISSION_LEVELS.MANAGER,
  description: "Payroll and compensation management",
  permissions: [
    // All Payroll permissions
    ...Object.values(PAYROLL_PERMISSIONS),
    // Limited HR view
    HR_PERMISSIONS.EMPLOYEE_VIEW,
    HR_PERMISSIONS.HR_REPORTS_VIEW,
    // Limited accounts view
    ACCOUNTS_PERMISSIONS.EXPENSE_VIEW,
    ACCOUNTS_PERMISSIONS.FINANCIAL_REPORTS_VIEW,
  ],
};

// Procurement Manager Role
export const PROCUREMENT_MANAGER_ROLE = {
  name: "Procurement Manager",
  level: PERMISSION_LEVELS.MANAGER,
  description: "Procurement and vendor management",
  permissions: [
    // All Procurement permissions
    ...Object.values(PROCUREMENT_PERMISSIONS),
    // Limited accounts view
    ACCOUNTS_PERMISSIONS.EXPENSE_VIEW,
    ACCOUNTS_PERMISSIONS.BUDGET_VIEW,
    ACCOUNTS_PERMISSIONS.FINANCIAL_REPORTS_VIEW,
  ],
};

// Finance Manager Role
export const FINANCE_MANAGER_ROLE = {
  name: "Finance Manager",
  level: PERMISSION_LEVELS.MANAGER,
  description: "Financial management and accounting",
  permissions: [
    // All Accounts permissions
    ...Object.values(ACCOUNTS_PERMISSIONS),
    // Limited payroll view
    PAYROLL_PERMISSIONS.PAYROLL_REPORTS_VIEW,
    // Limited procurement view
    PROCUREMENT_PERMISSIONS.PROCUREMENT_REPORTS_VIEW,
  ],
};

// Department Head Role
export const HOD_ROLE = {
  name: "HOD",
  level: PERMISSION_LEVELS.HOD,
  description: "Department-level management and oversight",
  permissions: [
    // Limited HR permissions
    HR_PERMISSIONS.EMPLOYEE_VIEW,
    HR_PERMISSIONS.PERFORMANCE_VIEW,
    HR_PERMISSIONS.PERFORMANCE_CREATE,
    HR_PERMISSIONS.PERFORMANCE_EDIT,
    HR_PERMISSIONS.LEAVE_VIEW,
    HR_PERMISSIONS.LEAVE_APPROVE,
    HR_PERMISSIONS.HR_REPORTS_VIEW,
    // Limited expense permissions
    ACCOUNTS_PERMISSIONS.EXPENSE_VIEW,
    ACCOUNTS_PERMISSIONS.EXPENSE_CREATE,
    ACCOUNTS_PERMISSIONS.EXPENSE_APPROVE,
    // Limited procurement permissions
    PROCUREMENT_PERMISSIONS.REQUISITION_VIEW,
    PROCUREMENT_PERMISSIONS.REQUISITION_CREATE,
    PROCUREMENT_PERMISSIONS.REQUISITION_APPROVE,
    // Communication permissions
    COMMUNICATION_PERMISSIONS.ANNOUNCEMENT_VIEW,
    COMMUNICATION_PERMISSIONS.ANNOUNCEMENT_CREATE,
    COMMUNICATION_PERMISSIONS.MESSAGE_VIEW,
    COMMUNICATION_PERMISSIONS.MESSAGE_CREATE,
  ],
};

// Staff Role
export const STAFF_ROLE = {
  name: "Staff",
  level: PERMISSION_LEVELS.STAFF,
  description: "Regular staff member with basic access",
  permissions: [
    // Limited HR permissions
    HR_PERMISSIONS.EMPLOYEE_VIEW,
    HR_PERMISSIONS.LEAVE_VIEW,
    HR_PERMISSIONS.LEAVE_CREATE,
    HR_PERMISSIONS.PERFORMANCE_VIEW,
    // Limited payroll permissions
    PAYROLL_PERMISSIONS.SALARY_VIEW,
    PAYROLL_PERMISSIONS.PAYMENT_VIEW,
    // Limited expense permissions
    ACCOUNTS_PERMISSIONS.EXPENSE_VIEW,
    ACCOUNTS_PERMISSIONS.EXPENSE_CREATE,
    // Communication permissions
    COMMUNICATION_PERMISSIONS.MESSAGE_VIEW,
    COMMUNICATION_PERMISSIONS.MESSAGE_CREATE,
    COMMUNICATION_PERMISSIONS.ANNOUNCEMENT_VIEW,
    COMMUNICATION_PERMISSIONS.FILE_VIEW,
    COMMUNICATION_PERMISSIONS.FILE_CREATE,
  ],
};

// Viewer Role
export const VIEWER_ROLE = {
  name: "Viewer",
  level: PERMISSION_LEVELS.VIEWER,
  description: "Read-only access to assigned modules",
  permissions: [
    // View-only permissions
    HR_PERMISSIONS.EMPLOYEE_VIEW,
    HR_PERMISSIONS.HR_REPORTS_VIEW,
    PAYROLL_PERMISSIONS.PAYROLL_REPORTS_VIEW,
    PROCUREMENT_PERMISSIONS.PROCUREMENT_REPORTS_VIEW,
    ACCOUNTS_PERMISSIONS.FINANCIAL_REPORTS_VIEW,
    COMMUNICATION_PERMISSIONS.ANNOUNCEMENT_VIEW,
    COMMUNICATION_PERMISSIONS.MESSAGE_VIEW,
  ],
};

// ============================================================================
// ROLE COLLECTION
// ============================================================================
export const ERP_ROLES = {
  SUPER_ADMIN: SUPER_ADMIN_ROLE,
  PLATFORM_ADMIN: PLATFORM_ADMIN_ROLE,
  COMPANY_ADMIN: COMPANY_ADMIN_ROLE,
  HR_MANAGER: HR_MANAGER_ROLE,
  PAYROLL_MANAGER: PAYROLL_MANAGER_ROLE,
  PROCUREMENT_MANAGER: PROCUREMENT_MANAGER_ROLE,
  FINANCE_MANAGER: FINANCE_MANAGER_ROLE,
  HOD: HOD_ROLE,
  STAFF: STAFF_ROLE,
  VIEWER: VIEWER_ROLE,
};

// ============================================================================
// PERMISSION GROUPS (For UI Organization)
// ============================================================================
export const PERMISSION_GROUPS = {
  HR: {
    name: "Human Resources",
    permissions: HR_PERMISSIONS,
    icon: "users",
    color: "purple",
  },
  PAYROLL: {
    name: "Payroll",
    permissions: PAYROLL_PERMISSIONS,
    icon: "currency-dollar",
    color: "green",
  },
  PROCUREMENT: {
    name: "Procurement",
    permissions: PROCUREMENT_PERMISSIONS,
    icon: "shopping-cart",
    color: "blue",
  },
  ACCOUNTS: {
    name: "Accounts",
    permissions: ACCOUNTS_PERMISSIONS,
    icon: "chart-bar",
    color: "teal",
  },
  COMMUNICATION: {
    name: "Communication",
    permissions: COMMUNICATION_PERMISSIONS,
    icon: "chat",
    color: "pink",
  },
  SYSTEM: {
    name: "System Administration",
    permissions: SYSTEM_PERMISSIONS,
    icon: "cog",
    color: "gray",
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all permissions for a specific module
 * @param {string} module - Module name (HR, PAYROLL, etc.)
 * @returns {Array} Array of permission strings
 */
export const getModulePermissions = (module) => {
  const modulePermissions = {
    HR: HR_PERMISSIONS,
    PAYROLL: PAYROLL_PERMISSIONS,
    PROCUREMENT: PROCUREMENT_PERMISSIONS,
    ACCOUNTS: ACCOUNTS_PERMISSIONS,
    COMMUNICATION: COMMUNICATION_PERMISSIONS,
    SYSTEM: SYSTEM_PERMISSIONS,
  };

  return Object.values(modulePermissions[module] || {});
};

/**
 * Get role by name
 * @param {string} roleName - Role name
 * @returns {Object} Role object
 */
export const getRoleByName = (roleName) => {
  return ERP_ROLES[roleName] || null;
};

/**
 * Get all available roles
 * @returns {Array} Array of role objects
 */
export const getAllRoles = () => {
  return Object.values(ERP_ROLES);
};

/**
 * Check if user has permission for a specific module action
 * @param {Object} user - User object
 * @param {string} module - Module name
 * @param {string} action - Action (view, create, edit, delete, approve)
 * @returns {boolean} True if user has permission
 */
export const hasModulePermission = (user, module, action) => {
  if (!user || !user.role) return false;

  const permission = `${module.toLowerCase()}.${action}`;
  return user.role.permissions?.includes(permission) || false;
};

/**
 * Get user's accessible modules
 * @param {Object} user - User object
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
  ];
  return modules.filter((module) => {
    return hasModulePermission(user, module, "view");
  });
};
