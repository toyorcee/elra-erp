// Role-based sidebar navigation config for EDMS
// Role Levels: PLATFORM_ADMIN(110), SUPER_ADMIN(100), ADMIN(90), MANAGER(80), SUPERVISOR(70), SENIOR_STAFF(60), STAFF(50), JUNIOR_STAFF(40), EXTERNAL_USER(30), GUEST(20), READ_ONLY(10)

export const sidebarConfig = [
  // ===== COMMON SECTIONS (All Users) =====
  {
    label: "Dashboard",
    icon: "HiOutlineHome",
    path: "/dashboard",
    required: { minLevel: 10, maxLevel: 89 },
    section: "common",
  },
  {
    label: "Admin Dashboard",
    icon: "HiOutlineHome",
    path: "/admin/dashboard",
    required: { minLevel: 90, maxLevel: 109 },
    section: "common",
  },
  {
    label: "Platform Dashboard",
    icon: "HiOutlineHome",
    path: "/platform-admin/dashboard",
    required: { minLevel: 110 },
    section: "common",
  },

  // ===== DOCUMENT MANAGEMENT =====
  {
    label: "My Documents",
    icon: "HiOutlineDocumentText",
    path: "/admin/documents",
    required: { minLevel: 50 },
    section: "documents",
  },

  // ===== WORKFLOW MANAGEMENT =====

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
  {
    label: "Approval Levels",
    icon: "HiOutlineClipboardCheck",
    path: "/admin/approval-levels",
    required: { minLevel: 100 },
    section: "admin",
  },
  {
    label: "Workflow Templates",
    icon: "HiOutlineCog",
    path: "/admin/workflow-templates",
    required: { minLevel: 100 },
    section: "admin",
  },

  // ===== PLATFORM MANAGEMENT (Platform Admin Only) =====
  {
    label: "Industry Instances",
    icon: "HiOutlineBuildingOffice",
    path: "/platform-admin/instances",
    required: { minLevel: 110 },
    section: "platform",
  },
  {
    label: "Create Instance",
    icon: "HiOutlinePlusCircle",
    path: "/platform-admin/create-instance",
    required: { minLevel: 110 },
    section: "platform",
  },
  {
    label: "Pricing Management",
    icon: "HiOutlineCurrencyDollar",
    path: "/platform-admin/pricing",
    required: { minLevel: 110 },
    section: "platform",
  },
  {
    label: "Subscription Management",
    icon: "HiOutlineCreditCard",
    path: "/platform-admin/subscriptions",
    required: { minLevel: 110 },
    section: "platform",
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
    path: "/admin/messages",
    required: { minLevel: 30 },
    section: "communication",
  },
  {
    label: "Notifications",
    icon: "HiOutlineBell",
    path: "/admin/notifications",
    required: { minLevel: 30 },
    section: "communication",
  },
];

// Role-specific navigation sections
export const roleSections = {
  // PLATFORM_ADMIN (110) - Platform management
  110: {
    sections: ["common", "platform", "communication"],
    title: "Platform Administrator",
  },

  // SUPER_ADMIN (100) - Full access
  100: {
    sections: [
      "common",
      "documents",
      "workflow",
      "admin",
      "system",
      "communication",
    ],
    title: "Super Administrator",
  },

  // ADMIN (90) - Administrative access
  90: {
    sections: ["common", "documents", "workflow", "admin", "communication"],
    title: "Administrator",
  },

  // MANAGER (80) - Department management
  80: {
    sections: ["common", "documents", "workflow", "communication"],
    title: "Manager",
  },

  // SUPERVISOR (70) - Document approval
  70: {
    sections: ["common", "documents", "workflow", "communication"],
    title: "Supervisor",
  },

  // SENIOR_STAFF (60) - Senior staff
  60: {
    sections: ["common", "documents", "workflow", "communication"],
    title: "Senior Staff",
  },

  // STAFF (50) - Regular staff
  50: {
    sections: ["common", "documents", "workflow", "communication"],
    title: "Staff",
  },

  // JUNIOR_STAFF (40) - Junior staff
  40: {
    sections: ["common", "documents", "communication"],
    title: "Junior Staff",
  },

  // EXTERNAL_USER (30) - External user
  30: {
    sections: ["common", "documents", "communication"],
    title: "External User",
  },

  // GUEST (20) - Guest user
  20: {
    sections: ["common", "documents", "communication"],
    title: "Guest",
  },

  // READ_ONLY (10) - Read-only access
  10: {
    sections: ["common", "documents", "communication"],
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

// Helper function to get role title
export const getRoleTitle = (roleLevel) => {
  return roleSections[roleLevel]?.title || "User";
};
