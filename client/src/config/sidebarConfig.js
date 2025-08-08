<<<<<<< HEAD
// Unified sidebar navigation config for ELRA ERP System
// All roles and modules in one single configuration
=======
// Role-based and Department-specific sidebar navigation config for EDMS
// Role Levels: SUPER_ADMIN(100), MANAGER(50), SUPERVISOR(40), SENIOR_STAFF(30), STAFF(20), JUNIOR_STAFF(15), EXTERNAL_USER(10)
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4

export const sidebarConfig = [
  // ===== MAIN DASHBOARD =====
  {
    label: "Dashboard",
    icon: "HiOutlineHome",
    path: "/dashboard",
<<<<<<< HEAD
    required: { minLevel: 300 },
    section: "main",
  },

  // ===== ERP MODULES =====
  {
    label: "HR Management",
    icon: "HiOutlineUsers",
    path: "/dashboard/hr",
    required: { minLevel: 300 },
    section: "erp",
    badge: "HR",
  },
  {
    label: "Payroll Management",
    icon: "HiOutlineCurrencyDollar",
    path: "/dashboard/payroll",
    required: { minLevel: 300 },
    section: "erp",
    badge: "Payroll",
  },
  {
    label: "Procurement",
    icon: "HiOutlineShoppingCart",
    path: "/dashboard/procurement",
    required: { minLevel: 300 },
    section: "erp",
    badge: "Procurement",
  },
  {
    label: "Accounting",
    icon: "HiOutlineCalculator",
    path: "/dashboard/accounts",
    required: { minLevel: 300 },
    section: "erp",
    badge: "Accounts",
  },
  {
    label: "Communication",
    icon: "HiOutlineChat",
    path: "/dashboard/communication",
    required: { minLevel: 300 },
    section: "erp",
    badge: "Comm",
  },

  // ===== SYSTEM MANAGEMENT =====
=======
    required: { minLevel: 10, maxLevel: 89 },
    section: "common",
    departments: ["all"],
  },
  {
    label: "Admin Dashboard",
    icon: "HiOutlineHome",
    path: "/admin/dashboard",
    required: { minLevel: 90, maxLevel: 109 },
    section: "common",
    departments: ["all"],
  },
  {
    label: "Platform Dashboard",
    icon: "HiOutlineHome",
    path: "/platform-admin/dashboard",
    required: { minLevel: 110 },
    section: "common",
    departments: ["all"],
  },

  // ===== DOCUMENT MANAGEMENT (Department-Specific) =====
  {
    label: "My Documents",
    icon: "HiOutlineDocumentText",
    path: "/dashboard/documents",
    required: { minLevel: 10, maxLevel: 89 },
    section: "documents",
    departments: ["all"],
  },
  {
    label: "Upload Documents",
    icon: "HiOutlineCloudUpload",
    path: "/dashboard/upload",
    required: { minLevel: 10, maxLevel: 89 },
    section: "documents",
    departments: ["all"],
    permissions: ["document.upload"],
  },
  {
    label: "Scan Documents",
    icon: "HiOutlineDocumentScan",
    path: "/dashboard/scan",
    required: { minLevel: 10, maxLevel: 89 },
    section: "documents",
    departments: ["all"],
    permissions: ["document.scan"],
  },
  {
    label: "Document Archive",
    icon: "HiOutlineArchiveBox",
    path: "/dashboard/archive",
    required: { minLevel: 10, maxLevel: 89 }, // Everyone (EXTERNAL_USER and above)
    section: "documents",
    departments: ["all"],
    permissions: ["document.archive"],
  },

  // ===== DEPARTMENT-SPECIFIC DOCUMENT MANAGEMENT =====
  {
    label: "Claims Documents",
    icon: "HiOutlineDocumentReport",
    path: "/dashboard/documents",
    required: { minLevel: 20, maxLevel: 89 },
    section: "documents",
    departments: ["CLAIMS"],
    permissions: ["document.view", "document.upload"],
  },
  {
    label: "Underwriting Documents",
    icon: "HiOutlineDocumentCheck",
    path: "/dashboard/documents",
    required: { minLevel: 20, maxLevel: 89 },
    section: "documents",
    departments: ["UNDERWRITE"],
    permissions: ["document.view", "document.upload"],
  },
  {
    label: "Financial Reports",
    icon: "HiOutlineDocumentChartBar",
    path: "/dashboard/documents",
    required: { minLevel: 20, maxLevel: 89 },
    section: "documents",
    departments: ["FINANCE"],
    permissions: ["document.view", "document.upload"],
  },
  {
    label: "Compliance Documents",
    icon: "HiOutlineShieldCheck",
    path: "/dashboard/documents",
    required: { minLevel: 25, maxLevel: 89 },
    section: "documents",
    departments: ["COMPLIANCE"],
    permissions: ["document.view", "document.upload"],
  },
  {
    label: "HR Documents",
    icon: "HiOutlineUserGroup",
    path: "/dashboard/documents",
    required: { minLevel: 35, maxLevel: 89 },
    section: "documents",
    departments: ["HR"],
    permissions: ["document.view", "document.upload"],
  },

  // ===== WORKFLOW MANAGEMENT (Department-Specific) =====
  {
    label: "My Workflows",
    icon: "HiOutlineClipboardList",
    path: "/dashboard/workflows",
    required: { minLevel: 15, maxLevel: 89 },
    section: "workflow",
    departments: ["all"],
  },
  {
    label: "Claims Processing",
    icon: "HiOutlineClipboardCheck",
    path: "/dashboard/workflows/claims",
    required: { minLevel: 20, maxLevel: 89 },
    section: "workflow",
    departments: ["CLAIMS"],
    permissions: ["workflow.approve"],
  },
  {
    label: "Policy Approvals",
    icon: "HiOutlineClipboardDocument",
    path: "/dashboard/workflows/policies",
    required: { minLevel: 30, maxLevel: 89 },
    section: "workflow",
    departments: ["UNDERWRITE"],
    permissions: ["workflow.approve"],
  },
  {
    label: "Financial Approvals",
    icon: "HiOutlineClipboardDocumentCheck",
    path: "/dashboard/workflows/finance",
    required: { minLevel: 30, maxLevel: 89 },
    section: "workflow",
    departments: ["FINANCE"],
    permissions: ["workflow.approve"],
  },

  // ===== SUPER ADMIN UNIFIED PAGES =====
  {
    label: "All Documents",
    icon: "HiOutlineDocumentText",
    path: "/admin/documents",
    required: { minLevel: 90, maxLevel: 109 },
    section: "documents",
    departments: ["all"],
  },
  {
    label: "Upload Documents",
    icon: "HiOutlineCloudUpload",
    path: "/admin/upload",
    required: { minLevel: 90, maxLevel: 109 },
    section: "documents",
    departments: ["all"],
    permissions: ["document.upload"],
  },
  {
    label: "Scan Documents",
    icon: "HiOutlineDocumentScan",
    path: "/admin/scan",
    required: { minLevel: 90, maxLevel: 109 },
    section: "documents",
    departments: ["all"],
    permissions: ["document.scan"],
  },
  {
    label: "Document Archive",
    icon: "HiOutlineArchiveBox",
    path: "/admin/archive",
    required: { minLevel: 90, maxLevel: 109 },
    section: "documents",
    departments: ["all"],
  },
  {
    label: "All Workflows",
    icon: "HiOutlineClipboardList",
    path: "/admin/workflows",
    required: { minLevel: 90, maxLevel: 109 },
    section: "workflow",
    departments: ["all"],
  },
  {
    label: "All Staff",
    icon: "HiOutlineUserGroup",
    path: "/admin/staff",
    required: { minLevel: 90, maxLevel: 109 },
    section: "department",
    departments: ["all"],
  },

  // ===== USER MANAGEMENT (Admin Only) =====
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
  {
    label: "User Management",
    icon: "HiOutlineUserGroup",
    path: "/admin/users",
<<<<<<< HEAD
    required: { minLevel: 600 },
    section: "system",
=======
    required: { minLevel: 90 },
    section: "admin",
    departments: ["all"],
  },
  {
    label: "Department Management",
    icon: "HiOutlineBuildingOffice2",
    path: "/admin/departments",
    required: { minLevel: 90 },
    section: "admin",
    departments: ["all"],
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
  },
  {
    label: "Role Management",
    icon: "HiOutlineShieldCheck",
    path: "/admin/roles",
<<<<<<< HEAD
    required: { minLevel: 1000 },
    section: "system",
  },
  {
    label: "Department Management",
    icon: "HiOutlineBuildingOffice2",
    path: "/admin/departments",
    required: { minLevel: 700 },
    section: "system",
  },
  {
    label: "Company Settings",
    icon: "HiOutlineBuildingOffice",
    path: "/admin/company",
    required: { minLevel: 1000 },
    section: "system",
  },
  {
=======
    required: { minLevel: 100 },
    section: "admin",
    departments: ["all"],
  },
  {
    label: "Approval Levels",
    icon: "HiOutlineClipboardCheck",
    path: "/admin/approval-levels",
    required: { minLevel: 100 },
    section: "admin",
    departments: ["all"],
  },
  {
    label: "Workflow Templates",
    icon: "HiOutlineCog",
    path: "/admin/workflow-templates",
    required: { minLevel: 100 },
    section: "admin",
    departments: ["all"],
  },

  // ===== DEPARTMENT MANAGEMENT (Manager/Supervisor) =====
  {
    label: "Department Staff",
    icon: "HiOutlineUserGroup",
    path: "/dashboard/department/staff",
    required: { minLevel: 40 },
    section: "department",
    departments: [
      "CLAIMS",
      "UNDERWRITE",
      "REGIONAL",
      "COMPLIANCE",
      "FINANCE",
      "HR",
      "IT",
      "EXECUTIVE",
    ],
    permissions: ["user.view"],
  },
  {
    label: "Department Reports",
    icon: "HiOutlineChartBar",
    path: "/dashboard/department/reports",
    required: { minLevel: 40 },
    section: "department",
    departments: [
      "CLAIMS",
      "UNDERWRITE",
      "REGIONAL",
      "COMPLIANCE",
      "FINANCE",
      "HR",
      "IT",
      "EXECUTIVE",
    ],
    permissions: ["report.view"],
  },

  // ===== PLATFORM ADMIN UNIFIED PAGES =====
  {
    label: "All Documents",
    icon: "HiOutlineDocumentText",
    path: "/platform-admin/documents",
    required: { minLevel: 110 },
    section: "documents",
    departments: ["all"],
  },
  {
    label: "Upload Documents",
    icon: "HiOutlineCloudUpload",
    path: "/platform-admin/upload",
    required: { minLevel: 110 },
    section: "documents",
    departments: ["all"],
    permissions: ["document.upload"],
  },
  {
    label: "Scan Documents",
    icon: "HiOutlineDocumentScan",
    path: "/platform-admin/scan",
    required: { minLevel: 110 },
    section: "documents",
    departments: ["all"],
    permissions: ["document.scan"],
  },
  {
    label: "Document Archive",
    icon: "HiOutlineArchiveBox",
    path: "/platform-admin/archive",
    required: { minLevel: 110 },
    section: "documents",
    departments: ["all"],
  },
  {
    label: "All Workflows",
    icon: "HiOutlineClipboardList",
    path: "/platform-admin/workflows",
    required: { minLevel: 110 },
    section: "workflow",
    departments: ["all"],
  },
  {
    label: "All Staff",
    icon: "HiOutlineUserGroup",
    path: "/platform-admin/staff",
    required: { minLevel: 110 },
    section: "department",
    departments: ["all"],
  },

  // ===== PLATFORM MANAGEMENT (Platform Admin Only) =====
  {
    label: "Industry Instances",
    icon: "HiOutlineBuildingOffice",
    path: "/platform-admin/instances",
    required: { minLevel: 110 },
    section: "platform",
    departments: ["all"],
  },
  {
    label: "Create Instance",
    icon: "HiOutlinePlusCircle",
    path: "/platform-admin/create-instance",
    required: { minLevel: 110 },
    section: "platform",
    departments: ["all"],
  },
  {
    label: "Pricing Management",
    icon: "HiOutlineCurrencyDollar",
    path: "/platform-admin/pricing",
    required: { minLevel: 110 },
    section: "platform",
    departments: ["all"],
  },
  {
    label: "Subscription Management",
    icon: "HiOutlineCreditCard",
    path: "/platform-admin/subscriptions",
    required: { minLevel: 110 },
    section: "platform",
    departments: ["all"],
  },

  // ===== SYSTEM MANAGEMENT (Super Admin Only) =====
  {
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    label: "System Settings",
    icon: "HiOutlineCog6Tooth",
    path: "/admin/settings",
    required: { minLevel: 1000 },
    section: "system",
    departments: ["all"],
  },
  {
    label: "Audit Logs",
    icon: "HiOutlineClipboardDocument",
    path: "/admin/audit",
    required: { minLevel: 1000 },
    section: "system",
    departments: ["all"],
  },
  {
    label: "Workflow Templates",
    icon: "HiOutlineCog",
    path: "/admin/workflow-templates",
    required: { minLevel: 1000 },
    section: "system",
  },
  {
    label: "Approval Levels",
    icon: "HiOutlineCheckCircle",
    path: "/admin/approval-levels",
    required: { minLevel: 1000 },
    section: "system",
  },

  // ===== DOCUMENT MANAGEMENT =====
  {
    label: "Documents",
    icon: "HiOutlineDocumentText",
    path: "/documents",
    required: { minLevel: 300 },
    section: "documents",
  },
  {
    label: "Workflows",
    icon: "HiOutlineClipboardCheck",
    path: "/workflows",
    required: { minLevel: 300 },
    section: "documents",
  },
  {
    label: "Document Archive",
    icon: "HiOutlineArchiveBox",
    path: "/documents/archive",
    required: { minLevel: 600 },
    section: "documents",
  },

  // ===== COMMUNICATION =====
  {
<<<<<<< HEAD
    label: "Messages",
    icon: "HiOutlineChatBubbleLeftRight",
    path: "/messages",
    required: { minLevel: 300 },
=======
    label: "Notifications",
    icon: "HiOutlineBell",
    path: "/dashboard/notifications",
    required: { minLevel: 10, maxLevel: 89 },
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    section: "communication",
    departments: ["all"],
  },
  {
    label: "Notifications",
    icon: "HiOutlineBell",
<<<<<<< HEAD
    path: "/notifications",
    required: { minLevel: 300 },
=======
    path: "/admin/notifications",
    required: { minLevel: 90, maxLevel: 109 },
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    section: "communication",
    departments: ["all"],
  },
  {
    label: "Notifications",
    icon: "HiOutlineBell",
    path: "/platform-admin/notifications",
    required: { minLevel: 110 },
    section: "communication",
    departments: ["all"],
  },

  // ===== USER PROFILE =====
  {
    label: "Settings",
    icon: "HiOutlineCog",
    path: "/dashboard/settings",
    required: { minLevel: 10 },
    section: "profile",
    departments: ["all"],
  },

  // ===== REPORTS & ANALYTICS =====
  {
    label: "Reports",
    icon: "HiOutlineChartBar",
    path: "/reports",
    required: { minLevel: 600 },
    section: "reports",
  },
  {
    label: "Analytics",
    icon: "HiOutlineChartPie",
    path: "/analytics",
    required: { minLevel: 600 },
    section: "reports",
  },
  {
    label: "System Reports",
    icon: "HiOutlineDocumentMagnifyingGlass",
    path: "/admin/reports",
    required: { minLevel: 700 },
    section: "reports",
  },
];

<<<<<<< HEAD
// Role-based access configuration - ACTUAL ROLES FROM DATABASE
export const roleConfig = {
  // SUPER_ADMIN (1000) - Full access to everything
  1000: {
    title: "Super Administrator",
    sections: [
      "main",
      "erp",
      "system",
      "documents",
      "communication",
      "reports",
    ],
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },

  // HOD (700) - Head of Department
  700: {
    title: "Head of Department",
    sections: [
      "main",
      "erp",
      "system",
      "documents",
      "communication",
      "reports",
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },

  // MANAGER (600) - Manager
  600: {
    title: "Manager",
    sections: ["main", "erp", "documents", "communication", "reports"],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },

  // STAFF (300) - Regular staff
  300: {
    title: "Staff",
    sections: ["main", "erp", "documents", "communication"],
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

// Helper function to get navigation items for a specific role level
export const getNavigationForRole = (roleLevel) => {
  const roleConfig = roleConfig[roleLevel] || roleConfig[300]; // Default to STAFF
=======
// Role-specific navigation sections
export const roleSections = {
  // SUPER_ADMIN (100) - Full access
  100: {
    sections: [
      "common",
      "documents",
      "workflow",
      "admin",
      "department",
      "system",
      "communication",
      "profile",
    ],
    title: "Super Administrator",
    canAccessAllDepartments: true,
  },

  // MANAGER (50) - Department management
  50: {
    sections: [
      "common",
      "documents",
      "workflow",
      "department",
      "communication",
      "profile",
    ],
    title: "Manager",
    canAccessAllDepartments: false,
  },

  // SUPERVISOR (40) - Document approval
  40: {
    sections: [
      "common",
      "documents",
      "workflow",
      "department",
      "communication",
      "profile",
    ],
    title: "Supervisor",
    canAccessAllDepartments: false,
  },

  // SENIOR_STAFF (30) - Senior staff
  30: {
    sections: ["common", "documents", "workflow", "communication", "profile"],
    title: "Senior Staff",
    canAccessAllDepartments: false,
  },

  // STAFF (20) - Regular staff
  20: {
    sections: ["common", "documents", "workflow", "communication", "profile"],
    title: "Staff",
    canAccessAllDepartments: false,
  },

  // JUNIOR_STAFF (15) - Junior staff
  15: {
    sections: ["common", "documents", "communication", "profile"],
    title: "Junior Staff",
    canAccessAllDepartments: false,
  },

  // EXTERNAL_USER (10) - External user
  10: {
    sections: ["common", "documents", "communication", "profile"],
    title: "External User",
    canAccessAllDepartments: false,
  },
};

// Department configurations
export const departmentConfig = {
  CLAIMS: {
    name: "Claims Department",
    level: 10,
    code: "CLAIMS",
    color: "blue",
    icon: "HiOutlineDocumentReport",
  },
  UNDERWRITE: {
    name: "Underwriting Department",
    level: 15,
    code: "UNDERWRITE",
    color: "green",
    icon: "HiOutlineDocumentCheck",
  },
  REGIONAL: {
    name: "Regional Operations",
    level: 20,
    code: "REGIONAL",
    color: "purple",
    icon: "HiOutlineGlobeAlt",
  },
  COMPLIANCE: {
    name: "Compliance & Audit",
    level: 25,
    code: "COMPLIANCE",
    color: "red",
    icon: "HiOutlineShieldCheck",
  },
  FINANCE: {
    name: "Finance & Accounting",
    level: 30,
    code: "FINANCE",
    color: "emerald",
    icon: "HiOutlineDocumentChartBar",
  },
  HR: {
    name: "Human Resources",
    level: 35,
    code: "HR",
    color: "pink",
    icon: "HiOutlineUserGroup",
  },
  IT: {
    name: "Information Technology",
    level: 40,
    code: "IT",
    color: "indigo",
    icon: "HiOutlineChip",
  },
  EXECUTIVE: {
    name: "Executive Management",
    level: 50,
    code: "EXECUTIVE",
    color: "amber",
    icon: "HiOutlineCrown",
  },
};

// Helper function to get navigation items for a specific role level and department
export const getNavigationForRole = (
  roleLevel,
  userDepartment = null,
  userPermissions = []
) => {
  const roleConfig = roleSections[roleLevel] || roleSections[10];
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
  const allowedSections = roleConfig.sections;

  return sidebarConfig.filter((item) => {
    // Check if user meets minimum level requirement
    if (item.required.minLevel && roleLevel < item.required.minLevel) {
      return false;
    }

    // Check if user meets maximum level requirement
    if (item.required.maxLevel && roleLevel > item.required.maxLevel) {
      return false;
    }

    // Check if section is allowed for this role
    if (!allowedSections.includes(item.section)) {
      return false;
    }

    // Check department access
    if (item.departments && !item.departments.includes("all")) {
      if (!userDepartment) {
        return item.departments.includes("all");
      }

      if (roleConfig.canAccessAllDepartments) {
        return false;
      }

      // Check if user's department is in the allowed departments
      if (!item.departments.includes(userDepartment)) {
        return false;
      }
    }

    // Check permissions if specified
    if (item.permissions && item.permissions.length > 0) {
      const hasPermission = item.permissions.some((permission) =>
        userPermissions.includes(permission)
      );
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  });
};

// Helper function to get role title and styling
export const getRoleInfo = (roleLevel) => {
  return roleConfig[roleLevel] || roleConfig[300];
};

// Helper function to get role title
export const getRoleTitle = (roleLevel) => {
  return roleConfig[roleLevel]?.title || "Staff";
};

// Helper function to get sections for a role
export const getRoleSections = (roleLevel) => {
  return (
    roleConfig[roleLevel]?.sections || [
      "main",
      "erp",
      "documents",
      "communication",
    ]
  );
};

// Helper function to check if user has access to a specific section
export const hasSectionAccess = (userRoleLevel, section) => {
  const sections = getRoleSections(userRoleLevel);
  return sections.includes(section);
};

// Helper function to get filtered navigation by section
export const getNavigationBySection = (roleLevel, section) => {
  const allNav = getNavigationForRole(roleLevel);
  return allNav.filter((item) => item.section === section);
};

// Helper function to get department info
export const getDepartmentInfo = (departmentCode) => {
  return departmentConfig[departmentCode] || null;
};

// Helper function to check if user can access all departments
export const canAccessAllDepartments = (roleLevel) => {
  return roleSections[roleLevel]?.canAccessAllDepartments || false;
};

// Helper function to get department-specific menu items
export const getDepartmentSpecificItems = (
  userDepartment,
  roleLevel,
  userPermissions = []
) => {
  if (!userDepartment) return [];

  const departmentInfo = getDepartmentInfo(userDepartment);
  if (!departmentInfo) return [];

  // Get all items for the user's role and department
  const allItems = getNavigationForRole(
    roleLevel,
    userDepartment,
    userPermissions
  );

  // Filter for department-specific items (exclude "all" department items)
  return allItems.filter(
    (item) =>
      item.departments &&
      item.departments.includes(userDepartment) &&
      !item.departments.includes("all")
  );
};
