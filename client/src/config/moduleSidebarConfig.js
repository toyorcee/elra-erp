// Module-specific sidebar navigation configurations
// This file defines the sidebar items that appear when a specific module is selected

export const moduleSidebarConfig = {
  // ===== SELF-SERVICE MODULE =====
  selfService: {
    label: "Self-Service",
    icon: "UserIcon",
    path: "/dashboard/modules/self-service",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Personal",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "My Payslips",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/self-service/payslips",
            required: { minLevel: 300 },
            description: "View and download your personal payslips",
          },
          {
            label: "My Documents",
            icon: "DocumentIcon",
            path: "/dashboard/modules/self-service/documents",
            required: { minLevel: 300 },
            description: "View, upload, and scan documents with OCR processing",
          },
          {
            label: "My Projects",
            icon: "FolderIcon",
            path: "/dashboard/modules/self-service/projects",
            required: { minLevel: 300 },
            description: "View projects assigned to you",
          },
          {
            label: "My Leave Requests",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/self-service/leave-requests",
            required: { minLevel: 300 },
            description: "View your leave and other requests",
          },
        ],
      },
      {
        title: "Support & Requests",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Submit Ticket",
            icon: "TicketIcon",
            path: "/dashboard/modules/self-service/tickets",
            required: { minLevel: 300 },
            description: "Submit support tickets and service requests",
          },
          {
            label: "My Tickets",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/self-service/my-tickets",
            required: { minLevel: 300 },
            description: "View and track your support tickets",
          },
          {
            label: "IT Support",
            icon: "Cog6ToothIcon",
            path: "/dashboard/modules/self-service/it-support",
            required: { minLevel: 300 },
            description: "Request IT support and technical assistance",
          },
          {
            label: "Equipment Requests",
            icon: "CubeIcon",
            path: "/dashboard/modules/self-service/equipment",
            required: { minLevel: 300 },
            description: "Request office equipment and supplies",
          },
        ],
      },
    ],
  },

  // ===== HR MANAGEMENT MODULE =====
  hr: {
    label: "HR Management",
    icon: "UsersIcon",
    path: "/dashboard/modules/hr",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Recruitment & Invitations",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Employee Invitation",
            icon: "UserPlusIcon",
            path: "/dashboard/modules/hr/invitation",
            required: { minLevel: 700 },
            description: "Invite and onboard new employees",
          },
        ],
      },
      {
        title: "Employee Lifecycle",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Onboarding Management",
            icon: "ClipboardDocumentCheckIcon",
            path: "/dashboard/modules/hr/onboarding",
            required: { minLevel: 700 },
            description: "Manage onboarding tasks and checklists",
          },
          {
            label: "Offboarding Management",
            icon: "ArrowRightOnRectangleIcon",
            path: "/dashboard/modules/hr/offboarding",
            required: { minLevel: 700 },
            description: "Handle employee exit processes",
          },
        ],
      },
      {
        title: "Leave & Attendance",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Leave Requests",
            icon: "PlusIcon",
            path: "/dashboard/modules/hr/leave/requests",
            required: { minLevel: 300 },
            description: "Submit and manage your leave requests",
          },
          {
            label: "Leave Management",
            icon: "ClipboardDocumentCheckIcon",
            path: "/dashboard/modules/hr/leave/management",
            required: { minLevel: 600 },
            description: "Approve and manage leave requests",
          },
          // {
          //   label: "Attendance Tracking",
          //   icon: "ClockIcon",
          //   path: "/dashboard/modules/hr/attendance",
          //   required: { minLevel: 600 },
          //   description: "Monitor employee attendance and punctuality",
          // },
          // {
          //   label: "Time Sheets",
          //   icon: "DocumentTextIcon",
          //   path: "/dashboard/modules/hr/attendance/timesheets",
          //   required: { minLevel: 300 },
          //   description: "Manage employee time tracking and overtime",
          // },
          {
            label: "Leave Calendar",
            icon: "CalendarDaysIcon",
            path: "/dashboard/modules/hr/leave/calendar",
            required: { minLevel: 300 },
            description: "View leave calendar and availability",
          },
        ],
      },
      {
        title: "HR Administration",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "User Management",
            icon: "UserGroupIcon",
            path: "/dashboard/modules/hr/users",
            required: { minLevel: 700 },
            description: "View and manage all users across departments",
          },
          {
            label: "Department Management",
            icon: "BuildingOfficeIcon",
            path: "/dashboard/modules/hr/departments",
            required: { minLevel: 1000 },
            description: "Manage company departments and structure",
          },
          {
            label: "Role Management",
            icon: "ShieldCheckIcon",
            path: "/dashboard/modules/hr/roles",
            required: { minLevel: 700 },
            description: "Manage user roles and permissions",
          },
          // {
          //   label: "HR Reports",
          //   icon: "ChartBarIcon",
          //   path: "/dashboard/modules/hr/reports",
          //   required: { minLevel: 600 },
          //   description: "Generate HR analytics and reports",
          // },
          {
            label: "Policy Management",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/hr/policies",
            required: { minLevel: 100 },
            description: "Manage HR policies and procedures",
          },
          {
            label: "Compliance",
            icon: "ShieldCheckIcon",
            path: "/dashboard/modules/hr/compliance",
            required: { minLevel: 100 },
            description: "Ensure HR compliance and audit standards",
          },
        ],
      },
    ],
  },

  // ===== PAYROLL MANAGEMENT MODULE =====
  payroll: {
    label: "Payroll Management",
    icon: "CurrencyDollarIcon",
    path: "/dashboard/modules/payroll",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    sections: [
      {
        title: "Salary Structure",
        items: [
          {
            label: "Salary Grade Management",
            icon: "CurrencyDollarIcon",
            path: "/dashboard/modules/payroll/salary-grades",
            required: { minLevel: 600 },
            description: "Manage salary grades and compensation structure",
          },
          {
            label: "Performance Allowances",
            icon: "StarIcon",
            path: "/dashboard/modules/payroll/allowances",
            required: { minLevel: 600 },
            description: "Manage performance-based allowances",
          },
          {
            label: "Performance Bonuses",
            icon: "GiftIcon",
            path: "/dashboard/modules/payroll/bonuses",
            required: { minLevel: 600 },
            description: "Manage performance-based bonuses",
          },
        ],
      },
      {
        title: "Deductions & Benefits",
        items: [
          {
            label: "Deductions Management",
            icon: "MinusCircleIcon",
            path: "/dashboard/modules/payroll/deductions",
            required: { minLevel: 700 },
            description: "Manage both voluntary and statutory deductions",
          },
        ],
      },
      {
        title: "Payroll Processing",
        items: [
          {
            label: "Payroll Processing",
            icon: "CalculatorIcon",
            path: "/dashboard/modules/payroll/processing",
            required: { minLevel: 600 },
            description: "Process monthly salary payments",
          },
          {
            label: "Pay Slips Management",
            icon: "DocumentIcon",
            path: "/dashboard/modules/payroll/payslips",
            required: { minLevel: 600 },
            description: "View and manage all pay slips across departments",
          },
          {
            label: "Payroll Reports",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/payroll/reports",
            required: { minLevel: 600 },
            description: "Generate payroll reports",
          },
        ],
      },
    ],
  },

  // ===== PROJECT MANAGEMENT MODULE =====
  projects: {
    label: "Project Management",
    icon: "FolderIcon",
    path: "/dashboard/modules/projects",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Project Operations",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "All Projects",
            icon: "FolderIcon",
            path: "/dashboard/modules/projects/list",
            required: { minLevel: 600 },
            description: "View and manage all projects",
          },
          {
            label: "Approval Dashboard",
            icon: "CheckIcon",
            path: "/dashboard/modules/projects/approvals",
            required: { minLevel: 700 },
            description: "Review and approve project requests",
          },
        ],
      },
      {
        title: "Team & Resources",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Project Teams",
            icon: "UserGroupIcon",
            path: "/dashboard/modules/projects/teams",
            required: { minLevel: 600 },
            description: "Manage project teams and assignments",
          },
          {
            label: "Resource Allocation",
            icon: "CogIcon",
            path: "/dashboard/modules/projects/resources",
            required: { minLevel: 600 },
            description: "Manage resource allocation",
          },
        ],
      },
      {
        title: "Analytics & Reports",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Project Analytics",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/projects/analytics",
            required: { minLevel: 600 },
            description: "Project performance analytics and insights",
          },
          {
            label: "Progress Tracking",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/projects/progress",
            required: { minLevel: 600 },
            description: "Monitor project progress",
          },
          {
            label: "Project Reports",
            icon: "DocumentChartBarIcon",
            path: "/dashboard/modules/projects/reports",
            required: { minLevel: 600 },
            description: "Generate project reports and summaries",
          },
        ],
      },
    ],
  },

  // ===== TASK MANAGEMENT MODULE =====
  tasks: {
    label: "Task Management",
    icon: "ClipboardDocumentListIcon",
    path: "/dashboard/modules/tasks",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Task Operations",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Task List",
            icon: "ListBulletIcon",
            path: "/dashboard/modules/tasks/list",
            required: { minLevel: 600 },
            description: "View and manage all tasks",
          },
          {
            label: "Task Analytics",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/tasks/analytics",
            required: { minLevel: 600 },
            description: "Task performance analytics and insights",
          },
          {
            label: "Task Reports",
            icon: "DocumentChartBarIcon",
            path: "/dashboard/modules/tasks/reports",
            required: { minLevel: 600 },
            description: "Generate task reports and summaries",
          },
        ],
      },
      {
        title: "Task Management",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Task Assignments",
            icon: "UserGroupIcon",
            path: "/dashboard/modules/tasks/assignments",
            required: { minLevel: 600 },
            description: "Manage task assignments and workload",
          },
          {
            label: "Task Tracking",
            icon: "ClockIcon",
            path: "/dashboard/modules/tasks/tracking",
            required: { minLevel: 600 },
            description: "Track time spent on tasks",
          },
        ],
      },
    ],
  },

  // ===== INVENTORY MANAGEMENT MODULE =====
  inventory: {
    label: "Inventory Management",
    icon: "CubeIcon",
    path: "/dashboard/modules/inventory",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Stock Management",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Inventory List",
            icon: "ListBulletIcon",
            path: "/dashboard/modules/inventory/list",
            required: { minLevel: 600 },
            description: "View and manage all inventory items",
          },
          {
            label: "Available Items",
            icon: "CheckCircleIcon",
            path: "/dashboard/modules/inventory/available",
            required: { minLevel: 600 },
            description: "View available items for lease",
          },
          {
            label: "Inventory Reports",
            icon: "DocumentChartBarIcon",
            path: "/dashboard/modules/inventory/reports",
            required: { minLevel: 600 },
            description: "Generate inventory reports and analytics",
          },
        ],
      },
      {
        title: "Maintenance & Operations",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Maintenance Schedule",
            icon: "WrenchScrewdriverIcon",
            path: "/dashboard/modules/inventory/maintenance",
            required: { minLevel: 600 },
            description: "Manage equipment maintenance schedules",
          },
          {
            label: "Asset Tracking",
            icon: "TagIcon",
            path: "/dashboard/modules/inventory/assets",
            required: { minLevel: 600 },
            description: "Track company assets",
          },
        ],
      },
    ],
  },

  // ===== PROCUREMENT MODULE =====
  procurement: {
    label: "Procurement",
    icon: "ShoppingCartIcon",
    path: "/dashboard/modules/procurement",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Purchase Management",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Purchase Orders",
            icon: "ShoppingBagIcon",
            path: "/dashboard/modules/procurement/orders",
            required: { minLevel: 600 },
            description: "Create and manage purchase orders",
          },
          {
            label: "Pending Approvals",
            icon: "ExclamationTriangleIcon",
            path: "/dashboard/modules/procurement/approvals",
            required: { minLevel: 600 },
            description: "Review and approve pending requests",
          },
          {
            label: "Procurement Reports",
            icon: "DocumentChartBarIcon",
            path: "/dashboard/modules/procurement/reports",
            required: { minLevel: 600 },
            description: "Generate procurement reports and analytics",
          },
        ],
      },
      {
        title: "Supplier Management",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Supplier Management",
            icon: "BuildingStorefrontIcon",
            path: "/dashboard/modules/procurement/suppliers",
            required: { minLevel: 600 },
            description: "Manage suppliers and vendor relationships",
          },
          {
            label: "Vendor Directory",
            icon: "BuildingOfficeIcon",
            path: "/dashboard/modules/procurement/vendors",
            required: { minLevel: 600 },
            description: "View vendor directory and information",
          },
        ],
      },
    ],
  },

  // ===== FINANCE MANAGEMENT MODULE =====
  finance: {
    label: "Finance Management",
    icon: "CalculatorIcon",
    path: "/dashboard/modules/finance",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Financial Operations",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Financial Transactions",
            icon: "CurrencyDollarIcon",
            path: "/dashboard/modules/finance/transactions",
            required: { minLevel: 600 },
            description: "View and manage financial transactions",
          },
          {
            label: "Revenue Management",
            icon: "ArrowTrendingUpIcon",
            path: "/dashboard/modules/finance/revenue",
            required: { minLevel: 600 },
            description: "Track and manage revenue streams",
          },
          {
            label: "Expense Management",
            icon: "ArrowTrendingDownIcon",
            path: "/dashboard/modules/finance/expenses",
            required: { minLevel: 600 },
            description: "Track and manage expenses",
          },
          {
            label: "Financial Reports",
            icon: "DocumentChartBarIcon",
            path: "/dashboard/modules/finance/reports",
            required: { minLevel: 600 },
            description: "Generate financial reports and analytics",
          },
        ],
      },
      {
        title: "Financial Planning",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Budget Management",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/finance/budget",
            required: { minLevel: 600 },
            description: "Create and manage budgets",
          },
          {
            label: "Cash Flow Analysis",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/finance/cash-flow",
            required: { minLevel: 600 },
            description: "Analyze cash flow patterns",
          },
        ],
      },
    ],
  },

  // ===== COMMUNICATION MODULE =====
  communication: {
    label: "Communication",
    icon: "ChatBubbleLeftRightIcon",
    path: "/dashboard/modules/communication",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    sections: [
      {
        title: "Messaging & Collaboration",
        items: [
          {
            label: "Internal Messages",
            icon: "ChatBubbleLeftIcon",
            path: "/dashboard/modules/communication/messages",
            required: { minLevel: 300 },
            description: "Send and receive internal messages",
          },
          {
            label: "Team Chats",
            icon: "UsersIcon",
            path: "/dashboard/modules/communication/teams",
            required: { minLevel: 300 },
            description: "Collaborate in team chat rooms",
          },
          {
            label: "File Sharing",
            icon: "DocumentIcon",
            path: "/dashboard/modules/communication/files",
            required: { minLevel: 300 },
            description: "Share files and documents",
          },
        ],
      },
      {
        title: "Announcements & Meetings",
        items: [
          {
            label: "Announcements",
            icon: "MegaphoneIcon",
            path: "/dashboard/modules/communication/announcements",
            required: { minLevel: 600 },
            description: "Create and manage announcements",
          },
          {
            label: "Meeting Management",
            icon: "CalendarDaysIcon",
            path: "/dashboard/modules/communication/meetings",
            required: { minLevel: 300 },
            description: "Schedule and manage meetings",
          },
          {
            label: "Event Calendar",
            icon: "CalendarIcon",
            path: "/dashboard/modules/communication/events",
            required: { minLevel: 300 },
            description: "View and manage events",
          },
        ],
      },
      {
        title: "Communication Tools",
        items: [
          {
            label: "Notification Center",
            icon: "BellIcon",
            path: "/dashboard/modules/communication/notifications",
            required: { minLevel: 300 },
            description: "Manage notification preferences",
          },
          {
            label: "Communication Logs",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/communication/logs",
            required: { minLevel: 600 },
            description: "View communication history",
          },
          {
            label: "Broadcast Messages",
            icon: "MegaphoneIcon",
            path: "/dashboard/modules/communication/broadcast",
            required: { minLevel: 600 },
            description: "Send broadcast messages",
          },
        ],
      },
    ],
  },
};

// Helper function to get module sidebar configuration
export const getModuleSidebarConfig = (moduleKey) => {
  return moduleSidebarConfig[moduleKey] || null;
};

// Helper function to get all available modules
export const getAvailableModules = () => {
  return Object.keys(moduleSidebarConfig);
};

// Helper function to check if a module exists
export const moduleExists = (moduleKey) => {
  return moduleKey in moduleSidebarConfig;
};

// Helper function to get module navigation items for a specific role
export const getModuleNavigationForRole = (moduleKey, roleLevel) => {
  const moduleConfig = getModuleSidebarConfig(moduleKey);
  if (!moduleConfig) return [];

  const accessibleItems = [];

  moduleConfig.sections.forEach((section) => {
    const sectionItems = section.items.filter((item) => {
      // SUPER_ADMIN (1000) has access to everything
      if (roleLevel === 1000) {
        return true;
      }

      // Check minimum level requirement
      if (item.required.minLevel && roleLevel < item.required.minLevel) {
        return false;
      }

      return true;
    });

    if (sectionItems.length > 0) {
      accessibleItems.push({
        ...section,
        items: sectionItems,
      });
    }
  });
  return accessibleItems;
};
