export const adminSidebarConfig = [
  // Super Admin routes (level 100+)
  {
    label: "Super Admin Dashboard",
    icon: "HiOutlineShieldCheck",
    path: "/admin",
    required: { permission: "system.settings", minLevel: 100 },
  },
  {
    label: "Settings",
    icon: "HiOutlineCog6Tooth",
    path: "/admin/settings",
    required: { permission: "system.settings", minLevel: 100 },
  },
  {
    label: "Audit Logs",
    icon: "HiOutlineClipboardDocument",
    path: "/admin/audit",
    required: { permission: "system.settings", minLevel: 100 },
  },
  {
    label: "Department Management",
    icon: "HiOutlineBuildingOffice2",
    path: "/admin/departments",
    required: { permission: "system.settings", minLevel: 100 },
  },
  {
    label: "Role Management",
    icon: "HiOutlineKey",
    path: "/admin/roles",
    required: { permission: "system.settings", minLevel: 100 },
  },

  // Admin routes (level 90+)
  {
    label: "User Management",
    icon: "HiOutlineUsers",
    path: "/admin/users",
    required: { permission: "user.view", minLevel: 90 },
  },
  {
    label: "Document Management",
    icon: "HiOutlineDocumentText",
    path: "/admin/documents",
    required: { permission: "document.view", minLevel: 90 },
  },
  {
    label: "Approval Queue",
    icon: "HiOutlineCheckCircle",
    path: "/admin/approvals",
    required: { permission: "document.approve", minLevel: 90 },
  },
  {
    label: "Analytics",
    icon: "HiOutlineChartBar",
    path: "/admin/analytics",
    required: { permission: "analytics.view", minLevel: 90 },
  },

  // Common admin routes
  {
    label: "Profile",
    icon: "HiOutlineUser",
    path: "/admin/profile",
    required: {},
  },
  {
    label: "Switch to User View",
    icon: "HiOutlineArrowLeft",
    path: "/dashboard",
    required: {},
  },
];
