// Unified sidebar navigation config for ELRA ERP System
// All roles and modules in one single configuration

export const sidebarConfig = [
  // ===== MAIN DASHBOARD =====
  {
    label: "Dashboard",
    icon: "HiOutlineHome",
    path: "/dashboard",
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
  {
    label: "User Management",
    icon: "HiOutlineUserGroup",
    path: "/admin/users",
    required: { minLevel: 600 },
    section: "system",
  },
  {
    label: "Role Management",
    icon: "HiOutlineShieldCheck",
    path: "/admin/roles",
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
    label: "System Settings",
    icon: "HiOutlineCog6Tooth",
    path: "/admin/settings",
    required: { minLevel: 1000 },
    section: "system",
  },
  {
    label: "Audit Logs",
    icon: "HiOutlineClipboardDocument",
    path: "/admin/audit",
    required: { minLevel: 1000 },
    section: "system",
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
    label: "Messages",
    icon: "HiOutlineChatBubbleLeftRight",
    path: "/messages",
    required: { minLevel: 300 },
    section: "communication",
  },
  {
    label: "Notifications",
    icon: "HiOutlineBell",
    path: "/notifications",
    required: { minLevel: 300 },
    section: "communication",
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
};

// Helper function to get navigation items for a specific role level
export const getNavigationForRole = (roleLevel) => {
  const roleConfig = roleConfig[roleLevel] || roleConfig[300]; // Default to STAFF
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
