const adminSidebarConfig = [
  // ===== TOP TIER: WORKFLOW & APPROVAL MANAGEMENT (Most Critical) =====
  {
    label: "Dashboard",
    icon: "HiOutlineHome",
    path: "/admin/dashboard",
    required: { permission: "dashboard.view", minLevel: 90 },
  },
  {
    label: "Workflow Templates",
    icon: "HiOutlineCog",
    path: "/admin/workflow-templates",
    required: { permission: "workflow.create", minLevel: 100 },
  },
  {
    label: "Approval Levels",
    icon: "HiOutlineCheckCircle",
    path: "/admin/approval-levels",
    required: { permission: "workflow.create", minLevel: 100 },
  },

  // ===== SECOND TIER: CORE SYSTEM SETUP =====
  {
    label: "Department Management",
    icon: "HiOutlineBuildingOffice",
    path: "/admin/departments",
    required: { permission: "department.manage", minLevel: 100 },
  },
  {
    label: "Role Management",
    icon: "HiOutlineShieldCheck",
    path: "/admin/roles",
    required: { permission: "user.assign_role", minLevel: 100 },
  },
  {
    label: "User Management",
    icon: "HiOutlineUsers",
    path: "/admin/users",
    required: { permission: "user.manage", minLevel: 90 },
  },

  // ===== THIRD TIER: OPERATIONAL MANAGEMENT =====
  {
    label: "Audit Logs",
    icon: "HiOutlineDocumentMagnifyingGlass",
    path: "/admin/audit-logs",
    required: { permission: "system.audit", minLevel: 90 },
  },
  {
    label: "Notifications",
    icon: "HiOutlineBell",
    path: "/admin/notifications",
    required: { permission: "notification.manage", minLevel: 90 },
  },

  // ===== BOTTOM TIER: UTILITY & SETTINGS (Least Critical) =====
  {
    label: "System Settings",
    icon: "HiOutlineCog6Tooth",
    path: "/admin/settings",
    required: { permission: "system.settings", minLevel: 100 },
  },
  {
    label: "Archive",
    icon: "HiOutlineArchiveBox",
    path: "/admin/archive",
    required: { permission: "document.archive", minLevel: 90 },
  },
];

export default adminSidebarConfig;
