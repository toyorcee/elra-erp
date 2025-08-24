// Unified sidebar navigation config for ELRA ERP System
// All roles and modules in one single configuration

export const sidebarConfig = [
  // ===== MAIN DASHBOARD =====
  {
    label: "Dashboard",
    icon: "HiOutlineHome",
    path: "/dashboard",
    required: { minLevel: 0 },
    section: "main",
  },

  // ===== ERP MODULES =====
  {
    label: "Self-Service",
    icon: "HiOutlineUser",
    path: "/dashboard/modules/self-service",
    required: { minLevel: 0 },
    section: "erp",
    badge: "Personal",
    departments: ["all"], // Universal access
  },
  {
    label: "Customer Care",
    icon: "HiOutlineChatBubbleLeftRight",
    path: "/dashboard/modules/customer-care",
    required: { minLevel: 0 },
    section: "erp",
    badge: "Support",
    departments: ["all"], // Universal access
  },
  {
    label: "HR Management",
    icon: "HiOutlineUsers",
    path: "/dashboard/modules/hr",
    required: { minLevel: 300 },
    section: "erp",
    badge: "HR",
    departments: ["Human Resources", "HR", "Personnel"], // HR departments only
  },
  {
    label: "Finance Management",
    icon: "HiOutlineCalculator",
    path: "/dashboard/modules/finance",
    required: { minLevel: 300 },
    section: "erp",
    badge: "Finance",
    departments: [
      "Finance & Accounting",
      "Finance",
      "Accounting",
      "Financial Services",
    ], // Finance departments only
  },
  {
    label: "IT Management",
    icon: "HiOutlineCog6Tooth",
    path: "/dashboard/modules/it",
    required: { minLevel: 300 },
    section: "erp",
    badge: "IT",
    departments: ["IT", "Information Technology", "Technology"], // IT departments only
  },
  {
    label: "Operations Management",
    icon: "HiOutlineCog",
    path: "/dashboard/modules/operations",
    required: { minLevel: 300 },
    section: "erp",
    badge: "Ops",
    departments: ["Operations", "Production", "Manufacturing", "Finance"], // Operations and finance departments
  },
  {
    label: "Sales & Marketing",
    icon: "HiOutlineChartBar",
    path: "/dashboard/modules/sales",
    required: { minLevel: 300 },
    section: "erp",
    badge: "Sales",
    departments: ["Sales", "Marketing", "Business Development"], // Sales departments only
  },
  {
    label: "Legal & Compliance",
    icon: "HiOutlineShieldCheck",
    path: "/dashboard/modules/legal",
    required: { minLevel: 300 },
    section: "erp",
    badge: "Legal",
    departments: ["Legal", "Compliance", "Risk Management"], // Legal departments only
  },
  {
    label: "System Administration",
    icon: "HiOutlineCog6Tooth",
    path: "/dashboard/modules/system-admin",
    required: { minLevel: 700 },
    section: "erp",
    badge: "Admin",
    departments: ["System Administration", "IT", "Information Technology"], // System admin and IT departments
  },
  {
    label: "Payroll Management",
    icon: "HiOutlineCurrencyDollar",
    path: "/dashboard/modules/payroll",
    required: { minLevel: 700 },
    section: "erp",
    badge: "Payroll",
    departments: [
      "Finance & Accounting",
      "Finance",
      "Accounting",
      "Payroll",
      "HR",
    ], // Finance and HR departments
  },
  {
    label: "Document Management",
    icon: "HiOutlineDocumentText",
    path: "/dashboard/modules/documents",
    required: { minLevel: 0 },
    section: "erp",
    badge: "Docs",
    departments: ["all"], // Universal access
  },
  {
    label: "Procurement",
    icon: "HiOutlineShoppingCart",
    path: "/dashboard/modules/procurement",
    required: { minLevel: 600 },
    section: "erp",
    badge: "Proc",
    departments: [
      "Finance & Accounting",
      "Finance",
      "Procurement",
      "Supply Chain",
      "Operations",
    ], // Finance and operations departments
  },
  {
    label: "Project Management",
    icon: "HiOutlineFolder",
    path: "/dashboard/modules/projects",
    required: { minLevel: 600 },
    section: "erp",
    badge: "Proj",
    departments: ["all"], // Cross-functional - all departments can access
  },
  {
    label: "Inventory Management",
    icon: "HiOutlineCube",
    path: "/dashboard/modules/inventory",
    required: { minLevel: 600 },
    section: "erp",
    badge: "Inv",
    departments: [
      "Operations",
      "Production",
      "Manufacturing",
      "Finance & Accounting",
      "Finance",
      "Procurement",
    ], // Operations and finance departments
  },

  // ===== SYSTEM MANAGEMENT =====
  {
    label: "Company Settings",
    icon: "HiOutlineBuildingOffice",
    path: "/admin/company",
    required: { minLevel: 1000 },
    section: "system",
  },
  {
    label: "System Settings",
    icon: "HiOutlineCog6Tooth",
    path: "/admin/settings",
    required: { minLevel: 1000 },
    section: "system",
    departments: ["all"],
  },
  {
    label: "Audit Logs",
    icon: "HiOutlineDocumentText",
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
    icon: "HiOutlineCheck",
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
    label: "Messages",
    icon: "HiOutlineChatBubbleLeftRight",
    path: "/messages",
    required: { minLevel: 300 },
    section: "communication",
    departments: ["all"],
  },
  {
    label: "Notifications",
    icon: "HiOutlineBell",
    path: "/notifications",
    required: { minLevel: 300 },
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

  // VIEWER (100) - Read-only access
  100: {
    title: "Viewer",
    sections: ["main", "erp", "documents", "communication"],
    color: "text-gray-500",
    bgColor: "bg-gray-25",
    borderColor: "border-gray-100",
  },
};

export const getNavigationForRole = (
  roleLevel,
  userDepartment = null,
  userPermissions = [],
  userModuleAccess = []
) => {
  const userRoleConfig = roleConfig[roleLevel] || roleConfig[300];
  const allowedSections = userRoleConfig.sections;

  return sidebarConfig.filter((item) => {
    if (item.path === "/dashboard") {
      return true;
    }

    if (userModuleAccess && userModuleAccess.length > 0) {
      const moduleKey = item.path.split("/").pop();

      const hasModuleAccess = userModuleAccess.some((access) => {
        // Map path names to module codes
        const pathToModuleMap = {
          "self-service": "SELF_SERVICE",
          hr: "HR_MANAGEMENT",
          finance: "FINANCIAL_MANAGEMENT",
          it: "IT_MANAGEMENT",
          operations: "OPERATIONS_MANAGEMENT",
          sales: "SALES_MARKETING",
          legal: "LEGAL_COMPLIANCE",
          "system-admin": "SYSTEM_ADMINISTRATION",
          payroll: "PAYROLL_MANAGEMENT",
          documents: "DOCUMENT_MANAGEMENT",
          procurement: "PROCUREMENT",
          projects: "PROJECT_MANAGEMENT",
          inventory: "INVENTORY_MANAGEMENT",
          "customer-care": "CUSTOMER_CARE",
          communication: "COMMUNICATION",
        };

        const expectedModuleCode = pathToModuleMap[moduleKey];

        const hasAccess = access.module === expectedModuleCode;
        return hasAccess;
      });

      if (!hasModuleAccess) {
        return false;
      }
    }

    if (roleLevel === 1000) {
      return true;
    }

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
    if (item.departments) {
      // If item has "all" departments, allow access
      if (item.departments.includes("all")) {
        return true;
      }

      // If no user department, deny access (except for "all" which we already handled)
      if (!userDepartment) {
        return false;
      }

      // Super admin can access all departments
      if (roleLevel === 1000) {
        return true;
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
  // SUPER_ADMIN (1000) has access to all sections
  if (userRoleLevel === 1000) {
    return true;
  }

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

// NEW: Dynamic module filtering based on department and role
export const getModulesForUser = (user) => {
  if (!user) return [];

  const { role, department } = user;
  const roleLevel = role?.level || 300;
  const departmentName = department?.name || "";

  // Always include these modules (universal access - no role level checks)
  const baseModules = [
    {
      label: "Dashboard",
      icon: "HiOutlineHome",
      path: "/dashboard",
      required: { minLevel: 0 },
      section: "main",
    },
    {
      label: "Self-Service",
      icon: "HiOutlineUser",
      path: "/dashboard/modules/self-service",
      required: { minLevel: 0 },
      section: "erp",
      badge: "Personal",
    },
    {
      label: "Customer Care",
      icon: "HiOutlinePhone",
      path: "/dashboard/modules/customer-care",
      required: { minLevel: 0 },
      section: "erp",
      badge: "Care",
    },
  ];

  // Department-specific modules mapping
  const departmentModuleMapping = {
    "Finance & Accounting": [
      {
        label: "Finance Management",
        icon: "HiOutlineCalculator",
        path: "/dashboard/modules/finance",
        required: { minLevel: 300 },
        section: "erp",
        badge: "Finance",
      },
      {
        label: "Procurement",
        icon: "HiOutlineShoppingCart",
        path: "/dashboard/modules/procurement",
        required: { minLevel: 600 },
        section: "erp",
        badge: "Proc",
      },
      {
        label: "Payroll Management",
        icon: "HiOutlineCurrencyDollar",
        path: "/dashboard/modules/payroll",
        required: { minLevel: 700 },
        section: "erp",
        badge: "Payroll",
      },
      {
        label: "Project Management",
        icon: "HiOutlineFolder",
        path: "/dashboard/modules/projects",
        required: { minLevel: 600 },
        section: "erp",
        badge: "Proj",
      },
      {
        label: "Inventory Management",
        icon: "HiOutlineCube",
        path: "/dashboard/modules/inventory",
        required: { minLevel: 600 },
        section: "erp",
        badge: "Inv",
      },
    ],
    "Human Resources": [
      {
        label: "HR Management",
        icon: "HiOutlineUsers",
        path: "/dashboard/modules/hr",
        required: { minLevel: 300 },
        section: "erp",
        badge: "HR",
      },
      {
        label: "Payroll Management",
        icon: "HiOutlineCurrencyDollar",
        path: "/dashboard/modules/payroll",
        required: { minLevel: 700 },
        section: "erp",
        badge: "Payroll",
      },
    ],
    "Information Technology": [
      {
        label: "IT Management",
        icon: "HiOutlineCog6Tooth",
        path: "/dashboard/modules/it",
        required: { minLevel: 300 },
        section: "erp",
        badge: "IT",
      },
      {
        label: "System Administration",
        icon: "HiOutlineCog6Tooth",
        path: "/dashboard/modules/system-admin",
        required: { minLevel: 700 },
        section: "erp",
        badge: "Admin",
      },
    ],
    Operations: [
      {
        label: "Operations Management",
        icon: "HiOutlineCog",
        path: "/dashboard/modules/operations",
        required: { minLevel: 300 },
        section: "erp",
        badge: "Ops",
      },
      {
        label: "Project Management",
        icon: "HiOutlineFolder",
        path: "/dashboard/modules/projects",
        required: { minLevel: 600 },
        section: "erp",
        badge: "Proj",
      },
      {
        label: "Inventory Management",
        icon: "HiOutlineCube",
        path: "/dashboard/modules/inventory",
        required: { minLevel: 600 },
        section: "erp",
        badge: "Inv",
      },
    ],
    "Sales & Marketing": [
      {
        label: "Sales & Marketing",
        icon: "HiOutlineChartBar",
        path: "/dashboard/modules/sales",
        required: { minLevel: 300 },
        section: "erp",
        badge: "Sales",
      },
    ],
    "Legal & Compliance": [
      {
        label: "Legal & Compliance",
        icon: "HiOutlineShieldCheck",
        path: "/dashboard/modules/legal",
        required: { minLevel: 300 },
        section: "erp",
        badge: "Legal",
      },
    ],
    "Customer Service": [
      // Customer Care is already in baseModules
    ],
    "Executive Office": [
      {
        label: "System Administration",
        icon: "HiOutlineCog6Tooth",
        path: "/dashboard/modules/system-admin",
        required: { minLevel: 700 },
        section: "erp",
        badge: "Admin",
      },
    ],
    "System Administration": [
      {
        label: "System Administration",
        icon: "HiOutlineCog6Tooth",
        path: "/dashboard/modules/system-admin",
        required: { minLevel: 700 },
        section: "erp",
        badge: "Admin",
      },
    ],
  };

  // Get department-specific modules
  const departmentModules = departmentModuleMapping[departmentName] || [];

  // Filter modules based on role level
  const filteredDepartmentModules = departmentModules.filter((module) => {
    return roleLevel >= module.required.minLevel;
  });

  // SUPER_ADMIN gets access to everything
  if (roleLevel === 1000) {
    return sidebarConfig;
  }

  // Return base modules + department-specific modules
  return [...baseModules, ...filteredDepartmentModules];
};
