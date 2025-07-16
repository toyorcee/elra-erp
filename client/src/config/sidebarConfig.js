// Role-based sidebar navigation config for EDMS
// Role Levels: SUPER_ADMIN(100), ADMIN(90), MANAGER(80), SUPERVISOR(70), SENIOR_STAFF(60), STAFF(50), JUNIOR_STAFF(40), EXTERNAL_USER(30), GUEST(20), READ_ONLY(10)

export const sidebarConfig = [
  // ===== COMMON SECTIONS (All Users) =====
  {
    label: "Dashboard",
    icon: "HiOutlineHome",
    path: "/dashboard",
    required: { minLevel: 10 },
    section: "common",
  },

  // ===== DOCUMENT MANAGEMENT =====
  {
    label: "My Documents",
    icon: "HiOutlineDocumentText",
    path: "/dashboard/documents",
    required: { minLevel: 50 },
    section: "documents",
  },
  {
    label: "Upload Document",
    icon: "HiOutlineUpload",
    path: "/dashboard/upload",
    required: { minLevel: 50 },
    section: "documents",
  },
  {
    label: "Document Approvals",
    icon: "HiOutlineCheckCircle",
    path: "/dashboard/approvals",
    required: { minLevel: 70 },
    section: "documents",
  },
  {
    label: "Document Analytics",
    icon: "HiOutlineChartBar",
    path: "/dashboard/analytics",
    required: { minLevel: 60 },
    section: "documents",
  },

  // ===== WORKFLOW MANAGEMENT =====
  {
    label: "Workflows",
    icon: "HiOutlineClipboardDocumentList",
    path: "/dashboard/workflows",
    required: { minLevel: 60 },
    section: "workflow",
  },
  {
    label: "Pending Tasks",
    icon: "HiOutlineClock",
    path: "/dashboard/tasks",
    required: { minLevel: 50 },
    section: "workflow",
  },

  // ===== USER MANAGEMENT (Admin Only) =====
  {
    label: "User Management",
    icon: "HiOutlineUsers",
    path: "/admin/users",
    required: { minLevel: 90 },
    section: "admin",
  },
  {
    label: "Department Management",
    icon: "HiOutlineBuildingOffice2",
    path: "/admin/departments",
    required: { minLevel: 90 },
    section: "admin",
  },
  {
    label: "Role Management",
    icon: "HiOutlineShieldCheck",
    path: "/admin/roles",
    required: { minLevel: 100 },
    section: "admin",
  },

  // ===== SYSTEM MANAGEMENT (Super Admin Only) =====
  {
    label: "System Settings",
    icon: "HiOutlineCog6Tooth",
    path: "/admin/settings",
    required: { minLevel: 100 },
    section: "system",
  },
  {
    label: "System Reports",
    icon: "HiOutlineDocumentChartBar",
    path: "/admin/reports",
    required: { minLevel: 100 },
    section: "system",
  },
  {
    label: "Audit Logs",
    icon: "HiOutlineClipboardDocument",
    path: "/admin/audit",
    required: { minLevel: 100 },
    section: "system",
  },

  // ===== COMMUNICATION =====
  {
    label: "Messages",
    icon: "HiOutlineChatBubbleLeftRight",
    path: "/dashboard/messages",
    required: { minLevel: 30 },
    section: "communication",
  },
  {
    label: "Notifications",
    icon: "HiOutlineBell",
    path: "/dashboard/notifications",
    required: { minLevel: 30 },
    section: "communication",
  },

  // ===== USER PROFILE =====
  {
    label: "My Profile",
    icon: "HiOutlineUser",
    path: "/dashboard/profile",
    required: { minLevel: 10 },
    section: "profile",
  },
];

// Role-specific navigation sections
export const roleSections = {
  // SUPER_ADMIN (100) - Full access
  100: {
    sections: [
      "common",
      "documents",
      "workflow",
      "admin",
      "system",
      "communication",
      "profile",
    ],
    title: "Super Administrator",
  },

  // ADMIN (90) - Administrative access
  90: {
    sections: [
      "common",
      "documents",
      "workflow",
      "admin",
      "communication",
      "profile",
    ],
    title: "Administrator",
  },

  // MANAGER (80) - Department management
  80: {
    sections: ["common", "documents", "workflow", "communication", "profile"],
    title: "Manager",
  },

  // SUPERVISOR (70) - Document approval
  70: {
    sections: ["common", "documents", "workflow", "communication", "profile"],
    title: "Supervisor",
  },

  // SENIOR_STAFF (60) - Senior staff
  60: {
    sections: ["common", "documents", "workflow", "communication", "profile"],
    title: "Senior Staff",
  },

  // STAFF (50) - Regular staff
  50: {
    sections: ["common", "documents", "workflow", "communication", "profile"],
    title: "Staff",
  },

  // JUNIOR_STAFF (40) - Junior staff
  40: {
    sections: ["common", "documents", "communication", "profile"],
    title: "Junior Staff",
  },

  // EXTERNAL_USER (30) - External user
  30: {
    sections: ["common", "documents", "communication", "profile"],
    title: "External User",
  },

  // GUEST (20) - Guest user
  20: {
    sections: ["common", "documents", "communication", "profile"],
    title: "Guest",
  },

  // READ_ONLY (10) - Read-only access
  10: {
    sections: ["common", "documents", "communication", "profile"],
    title: "Read Only",
  },
};

// Helper function to get navigation items for a specific role level
export const getNavigationForRole = (roleLevel) => {
  const roleConfig = roleSections[roleLevel] || roleSections[10]; // Default to READ_ONLY
  const allowedSections = roleConfig.sections;

  return sidebarConfig.filter((item) => {
    // Check if user meets minimum level requirement
    if (item.required.minLevel && roleLevel < item.required.minLevel) {
      return false;
    }

    // Check if section is allowed for this role
    if (!allowedSections.includes(item.section)) {
      return false;
    }

    return true;
  });
};

// Helper function to get role title
export const getRoleTitle = (roleLevel) => {
  return roleSections[roleLevel]?.title || "User";
};
