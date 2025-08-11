import {
  UsersIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  CubeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

// Simple function to get accessible modules based on user role
export const getAccessibleModules = (user) => {
  if (!user) return [];

  const allModules = [
    {
      key: "hr",
      label: "Human Resources",
      icon: UsersIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      minLevel: 300,
      description: "Manage employees, recruitment, and HR processes",
    },
    {
      key: "payroll",
      label: "Payroll",
      icon: CurrencyDollarIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      minLevel: 600,
      description: "Handle payroll processing and salary management",
    },
    {
      key: "procurement",
      label: "Procurement",
      icon: ShoppingCartIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      minLevel: 600,
      description: "Manage purchasing and supplier relationships",
    },
    {
      key: "finance",
      label: "Finance",
      icon: CalculatorIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      minLevel: 600,
      description: "Financial management and accounting",
    },
    {
      key: "communication",
      label: "Communication",
      icon: ChatBubbleLeftRightIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      minLevel: 300,
      description: "Internal and external communication tools",
    },
    {
      key: "projects",
      label: "Projects",
      icon: FolderIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      minLevel: 300,
      description: "Project management and task tracking",
    },
    {
      key: "inventory",
      label: "Inventory",
      icon: CubeIcon,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      minLevel: 300,
      description: "Stock management and asset tracking",
    },
    {
      key: "customer-care",
      label: "Customer Care",
      icon: PhoneIcon,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      minLevel: 300,
      description: "Customer support and service management",
    },
  ];

  // Get user role level
  const getUserRoleLevel = (user) => {
    if (!user) return 0;

    const roleValue = user.role?.name || user.role;

    switch (roleValue) {
      case "SUPER_ADMIN":
        return 1000;
      case "ADMIN":
        return 800;
      case "MANAGER":
        return 600;
      case "SUPERVISOR":
        return 400;
      case "USER":
        return 300;
      case "GUEST":
        return 100;
      default:
        return 100;
    }
  };

  const roleLevel = getUserRoleLevel(user);

  // Check if user has access to a specific level
  const hasAccess = (minLevel) => {
    return roleLevel >= minLevel;
  };

  return allModules.filter((module) => hasAccess(module.minLevel));
};
