// Module-specific sidebar navigation configurations
// This file defines the sidebar items that appear when a specific module is selected

export const moduleSidebarConfig = {
  // ===== HR MANAGEMENT MODULE =====
  hr: {
    label: "HR Management",
    icon: "UsersIcon",
    path: "/dashboard/modules/hr",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    sections: [
      {
        title: "Employee Management",
        items: [
          {
            label: "Employee Directory",
            icon: "UsersIcon",
            path: "/dashboard/modules/hr/employees",
            required: { minLevel: 300 },
            description: "View and manage employee records",
          },
          {
            label: "Add Employee",
            icon: "UserPlusIcon",
            path: "/dashboard/modules/hr/employees/add",
            required: { minLevel: 600 },
            description: "Create new employee profiles",
          },
          {
            label: "Employee Profiles",
            icon: "IdentificationIcon",
            path: "/dashboard/modules/hr/employees/profiles",
            required: { minLevel: 300 },
            description: "Detailed employee information",
          },
        ],
      },
      {
        title: "Recruitment",
        items: [
          {
            label: "Job Postings",
            icon: "BriefcaseIcon",
            path: "/dashboard/modules/hr/recruitment/jobs",
            required: { minLevel: 600 },
            description: "Manage job openings and requirements",
          },
          {
            label: "Applications",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/hr/recruitment/applications",
            required: { minLevel: 600 },
            description: "Review candidate applications",
          },
          {
            label: "Interviews",
            icon: "CalendarDaysIcon",
            path: "/dashboard/modules/hr/recruitment/interviews",
            required: { minLevel: 600 },
            description: "Schedule and manage interviews",
          },
        ],
      },
      {
        title: "Performance & Training",
        items: [
          {
            label: "Performance Reviews",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/hr/performance/reviews",
            required: { minLevel: 600 },
            description: "Conduct performance evaluations",
          },
          {
            label: "Training Programs",
            icon: "AcademicCapIcon",
            path: "/dashboard/modules/hr/training/programs",
            required: { minLevel: 600 },
            description: "Manage training initiatives",
          },
          {
            label: "Skills Assessment",
            icon: "ClipboardDocumentCheckIcon",
            path: "/dashboard/modules/hr/performance/skills",
            required: { minLevel: 600 },
            description: "Evaluate employee skills",
          },
        ],
      },
      {
        title: "Leave & Attendance",
        items: [
          {
            label: "Leave Management",
            icon: "CalendarIcon",
            path: "/dashboard/modules/hr/leave/requests",
            required: { minLevel: 300 },
            description: "Handle leave requests and approvals",
          },
          {
            label: "Attendance Tracking",
            icon: "ClockIcon",
            path: "/dashboard/modules/hr/attendance",
            required: { minLevel: 600 },
            description: "Monitor employee attendance",
          },
          {
            label: "Time Sheets",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/hr/attendance/timesheets",
            required: { minLevel: 300 },
            description: "Manage employee time tracking",
          },
        ],
      },
      {
        title: "HR Operations",
        items: [
          {
            label: "HR Reports",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/hr/reports",
            required: { minLevel: 600 },
            description: "Generate HR analytics and reports",
          },
          {
            label: "Policy Management",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/hr/policies",
            required: { minLevel: 700 },
            description: "Manage HR policies and procedures",
          },
          {
            label: "Compliance",
            icon: "ShieldCheckIcon",
            path: "/dashboard/modules/hr/compliance",
            required: { minLevel: 700 },
            description: "Ensure HR compliance standards",
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
        title: "Payroll Processing",
        items: [
          {
            label: "Salary Processing",
            icon: "CalculatorIcon",
            path: "/dashboard/modules/payroll/processing",
            required: { minLevel: 600 },
            description: "Process monthly salary payments",
          },
          {
            label: "Payroll Reports",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/payroll/reports",
            required: { minLevel: 600 },
            description: "Generate payroll reports",
          },
          {
            label: "Pay Slips",
            icon: "DocumentIcon",
            path: "/dashboard/modules/payroll/payslips",
            required: { minLevel: 300 },
            description: "View and download pay slips",
          },
        ],
      },
      {
        title: "Tax & Benefits",
        items: [
          {
            label: "Tax Management",
            icon: "ReceiptPercentIcon",
            path: "/dashboard/modules/payroll/tax",
            required: { minLevel: 600 },
            description: "Handle tax calculations and filings",
          },
          {
            label: "Benefits Administration",
            icon: "GiftIcon",
            path: "/dashboard/modules/payroll/benefits",
            required: { minLevel: 600 },
            description: "Manage employee benefits",
          },
          {
            label: "Deductions",
            icon: "MinusCircleIcon",
            path: "/dashboard/modules/payroll/deductions",
            required: { minLevel: 600 },
            description: "Configure salary deductions",
          },
        ],
      },
      {
        title: "Time & Attendance",
        items: [
          {
            label: "Time Tracking",
            icon: "ClockIcon",
            path: "/dashboard/modules/payroll/time",
            required: { minLevel: 600 },
            description: "Track employee work hours",
          },
          {
            label: "Overtime Management",
            icon: "ClockIcon",
            path: "/dashboard/modules/payroll/overtime",
            required: { minLevel: 600 },
            description: "Handle overtime calculations",
          },
          {
            label: "Leave Integration",
            icon: "CalendarIcon",
            path: "/dashboard/modules/payroll/leave",
            required: { minLevel: 600 },
            description: "Integrate with leave management",
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
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    sections: [
      {
        title: "Purchase Management",
        items: [
          {
            label: "Purchase Requests",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/procurement/requests",
            required: { minLevel: 300 },
            description: "Create and manage purchase requests",
          },
          {
            label: "Purchase Orders",
            icon: "DocumentIcon",
            path: "/dashboard/modules/procurement/orders",
            required: { minLevel: 600 },
            description: "Generate and track purchase orders",
          },
          {
            label: "Approval Workflows",
            icon: "CheckCircleIcon",
            path: "/dashboard/modules/procurement/approvals",
            required: { minLevel: 600 },
            description: "Manage approval processes",
          },
        ],
      },
      {
        title: "Vendor Management",
        items: [
          {
            label: "Vendor Directory",
            icon: "BuildingStorefrontIcon",
            path: "/dashboard/modules/procurement/vendors",
            required: { minLevel: 600 },
            description: "Manage supplier information",
          },
          {
            label: "Vendor Evaluation",
            icon: "StarIcon",
            path: "/dashboard/modules/procurement/vendors/evaluation",
            required: { minLevel: 600 },
            description: "Evaluate vendor performance",
          },
          {
            label: "Contract Management",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/procurement/contracts",
            required: { minLevel: 600 },
            description: "Manage vendor contracts",
          },
        ],
      },
      {
        title: "Procurement Analytics",
        items: [
          {
            label: "Spend Analysis",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/procurement/analytics/spend",
            required: { minLevel: 600 },
            description: "Analyze procurement spending",
          },
          {
            label: "Cost Reports",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/procurement/reports",
            required: { minLevel: 600 },
            description: "Generate cost reports",
          },
          {
            label: "Budget Tracking",
            icon: "ChartPieIcon",
            path: "/dashboard/modules/procurement/budget",
            required: { minLevel: 600 },
            description: "Track procurement budgets",
          },
        ],
      },
    ],
  },

  // ===== FINANCE MODULE =====
  finance: {
    label: "Finance",
    icon: "CalculatorIcon",
    path: "/dashboard/modules/finance",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    sections: [
      {
        title: "Financial Management",
        items: [
          {
            label: "General Ledger",
            icon: "BookOpenIcon",
            path: "/dashboard/modules/finance/ledger",
            required: { minLevel: 600 },
            description: "Manage general ledger accounts",
          },
          {
            label: "Accounts Payable",
            icon: "MinusCircleIcon",
            path: "/dashboard/modules/finance/payable",
            required: { minLevel: 600 },
            description: "Manage accounts payable",
          },
          {
            label: "Accounts Receivable",
            icon: "PlusCircleIcon",
            path: "/dashboard/modules/finance/receivable",
            required: { minLevel: 600 },
            description: "Manage accounts receivable",
          },
        ],
      },
      {
        title: "Budgeting & Planning",
        items: [
          {
            label: "Budget Management",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/finance/budget",
            required: { minLevel: 600 },
            description: "Create and manage budgets",
          },
          {
            label: "Financial Planning",
            icon: "ChartPieIcon",
            path: "/dashboard/modules/finance/planning",
            required: { minLevel: 600 },
            description: "Financial planning and forecasting",
          },
          {
            label: "Cost Centers",
            icon: "BuildingOfficeIcon",
            path: "/dashboard/modules/finance/cost-centers",
            required: { minLevel: 600 },
            description: "Manage cost center allocations",
          },
        ],
      },
      {
        title: "Financial Reporting",
        items: [
          {
            label: "Financial Statements",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/finance/statements",
            required: { minLevel: 600 },
            description: "Generate financial statements",
          },
          {
            label: "Cash Flow Analysis",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/finance/cash-flow",
            required: { minLevel: 600 },
            description: "Analyze cash flow patterns",
          },
          {
            label: "Audit Trails",
            icon: "DocumentMagnifyingGlassIcon",
            path: "/dashboard/modules/finance/audit",
            required: { minLevel: 700 },
            description: "Track financial transactions",
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

  // ===== PROJECTS MODULE =====
  projects: {
    label: "Projects",
    icon: "FolderIcon",
    path: "/dashboard/modules/projects",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    sections: [
      {
        title: "Project Management",
        items: [
          {
            label: "Project Planning",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/projects/planning",
            required: { minLevel: 600 },
            description: "Plan and define project scope",
          },
          {
            label: "Task Management",
            icon: "CheckCircleIcon",
            path: "/dashboard/modules/projects/tasks",
            required: { minLevel: 300 },
            description: "Manage project tasks and assignments",
          },
          {
            label: "Project Dashboard",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/projects/dashboard",
            required: { minLevel: 300 },
            description: "View project overview and progress",
          },
        ],
      },
      {
        title: "Team & Resources",
        items: [
          {
            label: "Team Assignment",
            icon: "UsersIcon",
            path: "/dashboard/modules/projects/teams",
            required: { minLevel: 600 },
            description: "Assign team members to projects",
          },
          {
            label: "Resource Allocation",
            icon: "CogIcon",
            path: "/dashboard/modules/projects/resources",
            required: { minLevel: 600 },
            description: "Manage resource allocation",
          },
          {
            label: "Time Tracking",
            icon: "ClockIcon",
            path: "/dashboard/modules/projects/time",
            required: { minLevel: 300 },
            description: "Track time spent on projects",
          },
        ],
      },
      {
        title: "Project Analytics",
        items: [
          {
            label: "Progress Tracking",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/projects/progress",
            required: { minLevel: 600 },
            description: "Monitor project progress",
          },
          {
            label: "Project Reports",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/projects/reports",
            required: { minLevel: 600 },
            description: "Generate project reports",
          },
          {
            label: "Milestone Management",
            icon: "FlagIcon",
            path: "/dashboard/modules/projects/milestones",
            required: { minLevel: 600 },
            description: "Track project milestones",
          },
        ],
      },
    ],
  },

  // ===== INVENTORY MODULE =====
  inventory: {
    label: "Inventory",
    icon: "CubeIcon",
    path: "/dashboard/modules/inventory",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    sections: [
      {
        title: "Stock Management",
        items: [
          {
            label: "Stock Overview",
            icon: "CubeIcon",
            path: "/dashboard/modules/inventory/stock",
            required: { minLevel: 300 },
            description: "View current stock levels",
          },
          {
            label: "Stock Alerts",
            icon: "ExclamationTriangleIcon",
            path: "/dashboard/modules/inventory/alerts",
            required: { minLevel: 600 },
            description: "Manage low stock alerts",
          },
          {
            label: "Stock Transfers",
            icon: "ArrowPathIcon",
            path: "/dashboard/modules/inventory/transfers",
            required: { minLevel: 600 },
            description: "Handle stock transfers",
          },
        ],
      },
      {
        title: "Asset Management",
        items: [
          {
            label: "Asset Tracking",
            icon: "TagIcon",
            path: "/dashboard/modules/inventory/assets",
            required: { minLevel: 600 },
            description: "Track company assets",
          },
          {
            label: "Asset Maintenance",
            icon: "WrenchScrewdriverIcon",
            path: "/dashboard/modules/inventory/maintenance",
            required: { minLevel: 600 },
            description: "Schedule asset maintenance",
          },
          {
            label: "Asset Reports",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/inventory/asset-reports",
            required: { minLevel: 600 },
            description: "Generate asset reports",
          },
        ],
      },
      {
        title: "Warehouse Operations",
        items: [
          {
            label: "Warehouse Management",
            icon: "BuildingOfficeIcon",
            path: "/dashboard/modules/inventory/warehouses",
            required: { minLevel: 600 },
            description: "Manage warehouse locations",
          },
          {
            label: "Inventory Reports",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/inventory/reports",
            required: { minLevel: 600 },
            description: "Generate inventory reports",
          },
          {
            label: "Stock Counts",
            icon: "ClipboardDocumentCheckIcon",
            path: "/dashboard/modules/inventory/counts",
            required: { minLevel: 600 },
            description: "Conduct stock counts",
          },
        ],
      },
    ],
  },

  // ===== CUSTOMER CARE MODULE =====
  "customer-care": {
    label: "Customer Care",
    icon: "SupportIcon",
    path: "/dashboard/modules/customer-care",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    sections: [
      {
        title: "Support Management",
        items: [
          {
            label: "Support Tickets",
            icon: "TicketIcon",
            path: "/dashboard/modules/customer-care/tickets",
            required: { minLevel: 300 },
            description: "Manage customer support tickets",
          },
          {
            label: "Service Requests",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/customer-care/requests",
            required: { minLevel: 300 },
            description: "Handle service requests",
          },
          {
            label: "Customer Database",
            icon: "UsersIcon",
            path: "/dashboard/modules/customer-care/customers",
            required: { minLevel: 600 },
            description: "Manage customer information",
          },
        ],
      },
      {
        title: "Knowledge & Resources",
        items: [
          {
            label: "Knowledge Base",
            icon: "BookOpenIcon",
            path: "/dashboard/modules/customer-care/knowledge",
            required: { minLevel: 600 },
            description: "Maintain knowledge base",
          },
          {
            label: "FAQ Management",
            icon: "QuestionMarkCircleIcon",
            path: "/dashboard/modules/customer-care/faqs",
            required: { minLevel: 600 },
            description: "Manage frequently asked questions",
          },
          {
            label: "Training Materials",
            icon: "AcademicCapIcon",
            path: "/dashboard/modules/customer-care/training",
            required: { minLevel: 600 },
            description: "Access training materials",
          },
        ],
      },
      {
        title: "Customer Analytics",
        items: [
          {
            label: "Customer Reports",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/customer-care/reports",
            required: { minLevel: 600 },
            description: "Generate customer reports",
          },
          {
            label: "SLA Management",
            icon: "ClockIcon",
            path: "/dashboard/modules/customer-care/sla",
            required: { minLevel: 600 },
            description: "Manage service level agreements",
          },
          {
            label: "Feedback Management",
            icon: "ChatBubbleLeftRightIcon",
            path: "/dashboard/modules/customer-care/feedback",
            required: { minLevel: 600 },
            description: "Collect and analyze feedback",
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
      if (roleLevel === 1000) return true;

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
