export const moduleSidebarConfig = {
  // ===== DEPARTMENT MANAGEMENT MODULE =====
  departmentManagement: {
    label: "Department Management",
    icon: "BuildingOfficeIcon",
    path: "/dashboard/modules/department-management",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Department Analytics",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Analytics",
            icon: "ChartPieIcon",
            path: "/dashboard/modules/department-management/analytics",
            required: { minLevel: 700 },
            description: "Department overview and key metrics",
          },
        ],
      },
      // {
      //   title: "Departmental Projects Management",
      //   collapsible: true,
      //   defaultExpanded: true,
      //   items: [
      //     {
      //       label: "Department Projects",
      //       icon: "FolderIcon",
      //       path: "/dashboard/modules/department-management/projects",
      //       required: { minLevel: 700 },
      //       description: "Create and manage internal departmental projects",
      //     },
      //     {
      //       label: "Pending Approvals",
      //       icon: "ClockIcon",
      //       path: "/dashboard/modules/department-management/project-approvals",
      //       required: { minLevel: 700 },
      //       description: "Review and approve department project requests",
      //     },
      //     {
      //       label: "Approval History",
      //       icon: "DocumentCheckIcon",
      //       path: "/dashboard/modules/department-management/approval-history",
      //       required: { minLevel: 700 },
      //       description: "View all project approval decisions and history",
      //     },
      //   ],
      // },
      {
        title: "User Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Department Users",
            icon: "UserGroupIcon",
            path: "/dashboard/modules/department-management/users",
            required: { minLevel: 700 },
            description: "View and manage users in your department",
          },
        ],
      },
      {
        title: "Department Communication",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Announcements",
            icon: "MegaphoneIcon",
            path: "/dashboard/modules/department-management/announcements",
            required: { minLevel: 700 },
            description:
              "Create and manage department-specific announcements (HOD only)",
          },
        ],
      },
      {
        title: "Leave Management",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Leave Management",
            icon: "CalendarDaysIcon",
            path: "/dashboard/modules/department-management/leave-management",
            required: { minLevel: 700 },
            description: "Review and approve employee leave requests",
          },
          {
            label: "Department Leave Calendar",
            icon: "CalendarIcon",
            path: "/dashboard/modules/department-management/leave-calendar",
            required: { minLevel: 700 },
            description:
              "Visual calendar of approved leaves for your department",
          },
        ],
      },
    ],
  },

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
          // {
          //   label: "My Projects",
          //   icon: "FolderIcon",
          //   path: "/dashboard/modules/self-service/my-projects",
          //   required: { minLevel: 300 },
          //   description: "Create and manage your personal projects",
          // },
          {
            label: "My Leave Requests",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/self-service/leave-requests",
            required: { minLevel: 300 },
            description: "View your leave and other requests",
          },
          {
            label: "My Archive",
            icon: "ArchiveBoxIcon",
            path: "/dashboard/modules/self-service/my-archive",
            required: { minLevel: 300 },
            description:
              "Access your archived documents and historical records",
          },
          {
            label: "My Project Tasks",
            icon: "ClipboardDocumentCheckIcon",
            path: "/dashboard/modules/self-service/project-tasks",
            required: { minLevel: 300 },
            description: "View and manage your assigned project tasks",
          },
        ],
      },
      // {
      //   title: "Department Approvals",
      //   collapsible: true,
      //   defaultExpanded: false,
      //   items: [
      //     {
      //       label: "Leave Approvals",
      //       icon: "ClipboardDocumentCheckIcon",
      //       path: "/dashboard/modules/self-service/department-approvals",
      //       required: { minLevel: 700 },
      //       description: "Approve leave requests for your department team",
      //       hidden: (user) => {
      //         if (!user || !user.role || !user.department) return false;

      //         if (user.role.level !== 700) return false;

      //         const userDeptName =
      //           user.department?.name ||
      //           user.department?.departmentName ||
      //           user.department;
      //         const isHRHOD = userDeptName === "Human Resources";

      //         return isHRHOD; // Hide if user is HR HOD
      //       },
      //     },
      //   ],
      // },
    ],
  },

  // ===== CUSTOMER CARE MODULE =====
  customerCare: {
    label: "Customer Care",
    icon: "ChatBubbleLeftRightIcon",
    path: "/dashboard/modules/customer-care",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Dashboard & Overview",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Overview",
            icon: "HomeIcon",
            path: "/dashboard/modules/customer-care/overview",
            required: { minLevel: 0 },
            description: "Customer care overview and key metrics",
            hidden: (user) => {
              return false;
            },
          },
        ],
      },
      {
        title: "Complaint Submission",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Submit Complaint",
            icon: "PlusIcon",
            path: "/dashboard/modules/customer-care/submit-complaint",
            required: { minLevel: 300 },
            description: "Submit a new complaint or service request",
            hidden: (user) => {
              const isCustomerCareUser =
                user?.department?.name === "Customer Service" ||
                user?.department?.name === "Customer Care";
              return isCustomerCareUser;
            },
          },
          {
            label: "My Complaints",
            icon: "TicketIcon",
            path: "/dashboard/modules/customer-care/my-complaints",
            required: { minLevel: 300 },
            description: "View your submitted complaints and their status",
            hidden: (user) => {
              const isCustomerCareUser =
                user?.department?.name === "Customer Service" ||
                user?.department?.name === "Customer Care";
              return isCustomerCareUser;
            },
          },
        ],
      },
      {
        title: "Complaint Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "All Complaints",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/customer-care/complaints",
            required: { minLevel: 300 },
            description: "View all staff complaints",
            hidden: (user) => {
              const isCustomerCareUser =
                user?.department?.name === "Customer Service" ||
                user?.department?.name === "Customer Care";
              return !isCustomerCareUser;
            },
          },
          {
            label: "Complaint Management",
            icon: "Cog6ToothIcon",
            path: "/dashboard/modules/customer-care/management",
            required: { minLevel: 300 },
            description: "Manage complaint status, assignments, and updates",
            hidden: (user) => {
              const isCustomerCareUser =
                user?.department?.name === "Customer Service" ||
                user?.department?.name === "Customer Care";
              return !isCustomerCareUser;
            },
          },
          {
            label: "My Assignments",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/customer-care/assignments",
            required: { minLevel: 300 },
            description: "View complaints assigned to you by HODs",
            hidden: (user) => {
              const isCustomerCareUser =
                user?.department?.name === "Customer Service" ||
                user?.department?.name === "Customer Care";
              const isHOD = user?.role?.level >= 700;
              return !isCustomerCareUser || isHOD;
            },
          },
        ],
      },
      {
        title: "HOD Management",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Assign Complaints",
            icon: "UserGroupIcon",
            path: "/dashboard/modules/customer-care/assign-complaints",
            required: { minLevel: 700 },
            description: "Assign complaints to team members",
            hidden: (user) => {
              const isCustomerCareUser =
                user?.department?.name === "Customer Service" ||
                user?.department?.name === "Customer Care";
              const isHOD = user?.role?.level >= 700;
              return !(isCustomerCareUser && isHOD);
            },
          },
          {
            label: "Forwarded Complaints",
            icon: "PaperAirplaneIcon",
            path: "/dashboard/modules/customer-care/forwarded-complaints",
            required: { minLevel: 700 },
            description: "View complaints forwarded to you for awareness",
            hidden: (user) => {
              const isHOD = user?.role?.level >= 700;
              return !isHOD;
            },
          },
        ],
      },
      {
        title: "Reports & Analytics",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Reports",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/customer-care/reports",
            required: { minLevel: 300 },
            description: "View customer care analytics and reports",
            hidden: (user) => {
              const isCustomerCareUser =
                user?.department?.name === "Customer Service" ||
                user?.department?.name === "Customer Care";
              return !isCustomerCareUser;
            },
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
            required: { minLevel: 700, department: "Human Resources" },
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
            required: { minLevel: 700, department: "Human Resources" },
            description: "Manage onboarding tasks and checklists",
          },
          {
            label: "Offboarding Management",
            icon: "ArrowRightOnRectangleIcon",
            path: "/dashboard/modules/hr/offboarding",
            required: { minLevel: 700, department: "Human Resources" },
            description: "Handle employee exit processes",
          },
        ],
      },
      {
        title: "Leave & Attendance",
        collapsible: true,
        defaultExpanded: false,
        items: [
          // {
          //   label: "Leave Requests",
          //   icon: "PlusIcon",
          //   path: "/dashboard/modules/hr/leave/requests",
          //   required: { minLevel: 300 },
          //   description: "Submit and manage your leave requests",
          // },
          {
            label: "Leave Management",
            icon: "ClipboardDocumentCheckIcon",
            path: "/dashboard/modules/hr/leave/management",
            required: { minLevel: 700, department: "Human Resources" },
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
            required: { minLevel: 700, department: "Human Resources" },
            description: "View and manage all users across departments",
          },
          {
            label: "Department Management",
            icon: "BuildingOfficeIcon",
            path: "/dashboard/modules/hr/departments",
            required: { minLevel: 700, department: "Human Resources" },
            description: "Manage company departments and module access",
          },
          {
            label: "Role Management",
            icon: "ShieldCheckIcon",
            path: "/dashboard/modules/hr/roles",
            required: { minLevel: 700, department: "Human Resources" },
            description: "Manage user roles and permissions within modules",
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
          // {
          //   label: "Payroll Reports",
          //   icon: "DocumentTextIcon",
          //   path: "/dashboard/modules/payroll/reports",
          //   required: { minLevel: 600 },
          //   description: "Generate payroll reports",
          // },
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
        title: "Project Dashboard",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Project Dashboard",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/projects/analytics",
            required: { minLevel: 700, department: "Project Management" },
            description:
              "Project Management HOD dashboard - comprehensive overview of project performance and financial management",
          },
        ],
      },
      {
        title: "Project Operations",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Approval Management",
            icon: "CheckIcon",
            path: "/dashboard/modules/projects/approvals",
            required: { minLevel: 700 },
            description: "Review and approve project requests",
          },
        ],
      },
      {
        title: "External Project Management",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Manage External Projects",
            icon: "GlobeAltIcon",
            path: "/dashboard/modules/projects/external",
            required: { minLevel: 700, department: "Project Management" },
            description:
              "Create and manage external projects - Project Management HOD only",
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
            required: { minLevel: 700, department: "Project Management" },
            description: "Manage project teams and assignments",
          },
        ],
      },
      {
        title: "Reports & Analytics",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Project Reports",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/projects/reports",
            required: { minLevel: 700 },
            description: "Monthly project approval reports and analytics",
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
          // {
          //   label: "Task Reports",
          //   icon: "DocumentChartBarIcon",
          //   path: "/dashboard/modules/tasks/reports",
          //   required: { minLevel: 600 },
          //   description: "Generate task reports and summaries",
          // },
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
        title: "Inventory Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Project Workflows",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/inventory",
            required: { minLevel: 600 },
            description: "Manage inventory for approved projects",
          },
        ],
      },
    ],
  },

  // ===== PROCUREMENT MODULE =====
  // In the procurement module section
  procurement: {
    label: "Procurement",
    icon: "ShoppingCartIcon",
    path: "/dashboard/modules/procurement",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Procurement Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Purchase Orders",
            icon: "ShoppingBagIcon",
            path: "/dashboard/modules/procurement/orders",
            required: { minLevel: 600 },
            description: "Manage purchase orders",
          },
          {
            label: "Procurement Tracking",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/procurement/tracking",
            required: { minLevel: 600 },
            description:
              "Track procurement status and purchase orders by project",
          },
        ],
      },
      {
        title: "Reports & Analytics",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Procurement Reports",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/procurement/reports",
            required: { minLevel: 600 },
            description:
              "Generate comprehensive procurement reports and analytics",
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
        title: "ELRA Wallet Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "ELRA Wallet",
            icon: "WalletIcon",
            path: "/dashboard/modules/finance/elra-wallet",
            required: { minLevel: 700 },
            description: "Manage ELRA company funds and allocations",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isFinanceHOD =
                user?.role?.level === 700 &&
                userDepartment === "Finance & Accounting";
              const isExecutive =
                user?.role?.level === 700 &&
                userDepartment === "Executive Office";

              return !(isSuperAdmin || isFinanceHOD || isExecutive);
            },
          },
        ],
      },
      {
        title: "Project Finance",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Project Budget Approvals",
            icon: "CurrencyDollarIcon",
            path: "/dashboard/modules/finance/budget-allocation",
            required: { minLevel: 700 },
            description: "Approve and manage project budget allocations",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isFinanceHOD =
                user?.role?.level === 700 &&
                userDepartment === "Finance & Accounting";
              const isExecutive =
                user?.role?.level === 700 &&
                userDepartment === "Executive Office";

              return !(isSuperAdmin || isFinanceHOD || isExecutive);
            },
          },
        ],
      },
      {
        title: "Payroll Finance",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Payroll Approvals",
            icon: "CheckCircleIcon",
            path: "/dashboard/modules/finance/payroll-approvals",
            required: { minLevel: 700 },
            description: "Approve payroll allocations and manage funding",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isFinanceHOD =
                user?.role?.level === 700 &&
                userDepartment === "Finance & Accounting";
              const isExecutive =
                user?.role?.level === 700 &&
                userDepartment === "Executive Office";

              return !(isSuperAdmin || isFinanceHOD || isExecutive);
            },
          },
        ],
      },
      {
        title: "Sales & Marketing Finance",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Sales & Marketing Approvals",
            icon: "CheckCircleIcon",
            path: "/dashboard/modules/finance/sales-marketing-approvals",
            required: { minLevel: 700 },
            description: "Approve Sales & Marketing expense transactions",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isFinanceHOD =
                user?.role?.level === 700 &&
                userDepartment === "Finance & Accounting";

              return !(isSuperAdmin || isFinanceHOD);
            },
          },
        ],
      },
      {
        title: "Financial Reports & History",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Transaction History & Reports",
            icon: "ClockIcon",
            path: "/dashboard/modules/finance/transaction-history",
            required: { minLevel: 700 },
            description:
              "View detailed transaction history, audit trail, and export reports",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isFinanceHOD =
                user?.role?.level === 700 &&
                userDepartment === "Finance & Accounting";
              const isExecutive =
                user?.role?.level === 700 &&
                userDepartment === "Executive Office";

              return !(isSuperAdmin || isFinanceHOD || isExecutive);
            },
          },
        ],
      },
    ],
  },

  // ===== SALES & MARKETING MODULE =====
  salesMarketing: {
    label: "Sales & Marketing",
    icon: "MegaphoneIcon",
    path: "/dashboard/modules/sales",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Sales & Marketing Dashboard",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Overview",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/sales/overview",
            required: { minLevel: 300 },
            description: "Overview of sales and marketing performance",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSalesMarketing = userDepartment === "Sales & Marketing";
              const isSuperAdmin = user?.role?.level === 1000;
              const isFinanceHOD =
                user?.role?.level === 700 &&
                userDepartment === "Finance & Accounting";
              const isExecutive =
                user?.role?.level === 700 &&
                userDepartment === "Executive Office";

              return !(
                isSalesMarketing ||
                isSuperAdmin ||
                isFinanceHOD ||
                isExecutive
              );
            },
          },
        ],
      },
      {
        title: "Transaction Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Transactions",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/sales/transactions",
            required: { minLevel: 300 },
            description: "Create and manage sales & marketing transactions",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSalesMarketing = userDepartment === "Sales & Marketing";
              const isSuperAdmin = user?.role?.level === 1000;

              return !(isSalesMarketing || isSuperAdmin);
            },
          },
          {
            label: "Approvals",
            icon: "CheckIcon",
            path: "/dashboard/modules/sales/approvals",
            required: { minLevel: 700 },
            description: "Review and approve sales & marketing transactions",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isFinanceHOD =
                user?.role?.level === 700 &&
                userDepartment === "Finance & Accounting";
              const isSalesMarketingHOD =
                user?.role?.level === 700 &&
                userDepartment === "Sales & Marketing";

              return !(isSuperAdmin || isFinanceHOD || isSalesMarketingHOD);
            },
          },
        ],
      },
      {
        title: "Analytics & Reports",
        collapsible: true,
        defaultExpanded: false,
        items: [
          {
            label: "Reports",
            icon: "ChartPieIcon",
            path: "/dashboard/modules/sales/reports",
            required: { minLevel: 300 },
            description: "Sales & marketing analytics and performance reports",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSalesMarketing = userDepartment === "Sales & Marketing";
              const isSuperAdmin = user?.role?.level === 1000;
              const isFinanceHOD =
                user?.role?.level === 700 &&
                userDepartment === "Finance & Accounting";
              const isExecutive =
                user?.role?.level === 700 &&
                userDepartment === "Executive Office";

              return !(
                isSalesMarketing ||
                isSuperAdmin ||
                isFinanceHOD ||
                isExecutive
              );
            },
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
            hidden: () => true,
          },
        ],
      },
      {
        title: "Announcements & Events",
        items: [
          {
            label: "Announcements",
            icon: "MegaphoneIcon",
            path: "/dashboard/modules/communication/announcements",
            required: { minLevel: 100 },
            description:
              "Company announcements (HR HOD can create; all users can view)",
          },
          {
            label: "Events Calendar",
            icon: "CalendarIcon",
            path: "/dashboard/modules/communication/events",
            required: { minLevel: 100 },
            description:
              "Company events (HR HOD can create; all users can view)",
          },
        ],
      },
    ],
  },

  // ===== LEGAL & COMPLIANCE MODULE =====
  legal: {
    label: "Legal & Compliance",
    icon: "ShieldCheckIcon",
    path: "/dashboard/modules/legal",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Legal Policy Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Legal Policies",
            icon: "DocumentTextIcon",
            path: "/dashboard/modules/legal/policies",
            required: { minLevel: 100 },
            description: "Manage legal policies and procedures for projects",
          },
        ],
      },
      {
        title: "Compliance Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Compliance Programs",
            icon: "ClipboardDocumentListIcon",
            path: "/dashboard/modules/legal/compliance-programs",
            required: { minLevel: 100 },
            description: "Create and manage compliance program frameworks",
          },
          {
            label: "Compliance Items",
            icon: "ShieldCheckIcon",
            path: "/dashboard/modules/legal/compliance-items",
            required: { minLevel: 100 },
            description: "Track and manage individual compliance requirements",
          },
        ],
      },
    ],
  },

  // ===== INVENTORY MODULE =====
  inventory: {
    label: "Inventory Management",
    icon: "CubeIcon",
    path: "/dashboard/modules/inventory",
    color: "text-[var(--elra-primary)]",
    bgColor: "bg-[var(--elra-secondary-3)]",
    borderColor: "border-[var(--elra-primary)]",
    sections: [
      {
        title: "Inventory Management",
        collapsible: true,
        defaultExpanded: true,
        items: [
          {
            label: "Inventory List",
            icon: "CubeIcon",
            path: "/dashboard/modules/inventory/list",
            required: {
              minLevel: 700,
              department: "Operations",
            },
            description: "View and manage all inventory items",
            hidden: (user) => {
              // Only Super Admin and Operations HOD can access
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isOperationsHOD =
                user?.role?.level === 700 && userDepartment === "Operations";

              return !(isSuperAdmin || isOperationsHOD);
            },
          },
          {
            label: "Inventory Tracking",
            icon: "WrenchScrewdriverIcon",
            path: "/dashboard/modules/inventory/tracking",
            required: {
              minLevel: 700,
              department: "Operations",
            },
            description: "Track maintenance schedules and available items",
            hidden: (user) => {
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isOperationsHOD =
                user?.role?.level === 700 && userDepartment === "Operations";

              return !(isSuperAdmin || isOperationsHOD);
            },
          },
          {
            label: "Inventory Reports",
            icon: "ChartBarIcon",
            path: "/dashboard/modules/inventory/reports",
            required: {
              minLevel: 700,
              department: "Operations",
            },
            description: "Generate inventory reports and analytics",
            hidden: (user) => {
              // Only Super Admin and Operations HOD can access
              const userDepartment = user?.department?.name;
              const isSuperAdmin = user?.role?.level === 1000;
              const isOperationsHOD =
                user?.role?.level === 700 && userDepartment === "Operations";

              return !(isSuperAdmin || isOperationsHOD);
            },
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
  const exists = moduleKey in moduleSidebarConfig;
  if (!exists) {
    console.log(
      `❌ [ModuleConfig] Module '${moduleKey}' not found in moduleSidebarConfig`
    );
    console.log(
      `🔍 [ModuleConfig] Available modules:`,
      Object.keys(moduleSidebarConfig)
    );
  } else {
    console.log(`✅ [ModuleConfig] Module '${moduleKey}' found`);
  }
  return exists;
};

// Helper function to get module navigation items for a specific role
export const getModuleNavigationForRole = (
  moduleKey,
  roleLevel,
  userDepartment = null,
  user = null
) => {
  const moduleConfig = getModuleSidebarConfig(moduleKey);
  if (!moduleConfig) return [];

  console.log(
    `🔍 [ModuleNavigation] Processing module: ${moduleKey}, roleLevel: ${roleLevel}, userDepartment: ${userDepartment}`
  );

  const accessibleItems = [];

  moduleConfig.sections.forEach((section) => {
    const sectionItems = section.items.filter((item) => {
      console.log(
        `🔍 [ModuleNavigation] Checking item: ${item.label}, required: ${item.required?.minLevel}, userLevel: ${roleLevel}`
      );

      // SUPER_ADMIN (1000) has access to everything
      if (roleLevel === 1000) {
        console.log(
          `✅ [ModuleNavigation] SUPER_ADMIN access granted for: ${item.label}`
        );
        return true;
      }

      // Check minimum level requirement
      if (item.required.minLevel && roleLevel < item.required.minLevel) {
        console.log(
          `❌ [ModuleNavigation] Access denied for: ${item.label} - Level ${roleLevel} < ${item.required.minLevel}`
        );
        return false;
      }

      // Check department requirement
      if (item.required.department && userDepartment) {
        if (item.required.department !== userDepartment) {
          console.log(
            `❌ [ModuleNavigation] Access denied for: ${item.label} - Department mismatch`
          );
          return false;
        }
      }

      // Check hidden property (if it's a function, call it with user object)
      if (item.hidden && typeof item.hidden === "function") {
        if (item.hidden(user)) {
          console.log(
            `❌ [ModuleNavigation] Access denied for: ${item.label} - Hidden by function`
          );
          return false; // Hide this item
        }
      }

      console.log(`✅ [ModuleNavigation] Access granted for: ${item.label}`);
      return true;
    });

    if (sectionItems.length > 0) {
      accessibleItems.push({
        ...section,
        items: sectionItems,
      });
    }
  });

  console.log(
    `🔍 [ModuleNavigation] Final accessible items for ${moduleKey}:`,
    accessibleItems
  );
  return accessibleItems;
};
