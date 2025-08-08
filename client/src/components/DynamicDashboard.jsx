import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaUsers,
  FaMoneyCheckAlt,
  FaShoppingCart,
  FaChartLine,
  FaComments,
  FaUserTie,
  FaClipboardList,
  FaCog,
  FaChartBar,
  FaBell,
  FaFileAlt,
  FaShieldAlt,
  FaSignInAlt,
  FaCompass,
  FaBoxes,
  FaArrowLeft,
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaClock,
  FaCalendar,
  FaUser,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

// Module configurations with role-based access
const MODULE_CONFIGS = {
  hr: {
    title: "Human Resources",
    icon: FaUsers,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    features: [
      { name: "Employee Management", icon: FaUsers, path: "/hr/employees" },
      { name: "Recruitment", icon: FaUserTie, path: "/hr/recruitment" },
      { name: "Performance", icon: FaChartBar, path: "/hr/performance" },
      { name: "Leave Management", icon: FaCalendar, path: "/hr/leave" },
      { name: "Onboarding", icon: FaSignInAlt, path: "/hr/onboarding" },
      { name: "HR Reports", icon: FaFileAlt, path: "/hr/reports" },
    ],
    stats: [
      { label: "Total Employees", value: "1,247", change: "+12%", trend: "up" },
      { label: "Active Recruitments", value: "23", change: "+5", trend: "up" },
      { label: "Pending Approvals", value: "8", change: "-2", trend: "down" },
      { label: "Leave Requests", value: "15", change: "+3", trend: "up" },
    ],
    quickActions: [
      { name: "Add Employee", icon: FaPlus, action: "add-employee" },
      { name: "Process Leave", icon: FaCheck, action: "process-leave" },
      { name: "Generate Report", icon: FaDownload, action: "generate-report" },
    ],
  },
  payroll: {
    title: "Payroll Management",
    icon: FaMoneyCheckAlt,
    color: "from-teal-500 to-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-700",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    features: [
      {
        name: "Salary Processing",
        icon: FaMoneyCheckAlt,
        path: "/payroll/salary",
      },
      {
        name: "Benefits Management",
        icon: FaShieldAlt,
        path: "/payroll/benefits",
      },
      { name: "Tax Management", icon: FaChartLine, path: "/payroll/tax" },
      { name: "Deductions", icon: FaMinus, path: "/payroll/deductions" },
      { name: "Payment Tracking", icon: FaClock, path: "/payroll/payments" },
      { name: "Payroll Reports", icon: FaFileAlt, path: "/payroll/reports" },
    ],
    stats: [
      { label: "Total Payroll", value: "$2.4M", change: "+8%", trend: "up" },
      { label: "Pending Payments", value: "45", change: "-5", trend: "down" },
      { label: "Tax Liabilities", value: "$180K", change: "+2%", trend: "up" },
      { label: "Benefits Cost", value: "$320K", change: "+6%", trend: "up" },
    ],
    quickActions: [
      { name: "Process Payroll", icon: FaCheck, action: "process-payroll" },
      { name: "Add Deduction", icon: FaMinus, action: "add-deduction" },
      { name: "Export Report", icon: FaDownload, action: "export-report" },
    ],
  },
  procurement: {
    title: "Procurement",
    icon: FaShoppingCart,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    features: [
      {
        name: "Purchase Orders",
        icon: FaClipboardList,
        path: "/procurement/orders",
      },
      {
        name: "Vendor Management",
        icon: FaBuilding,
        path: "/procurement/vendors",
      },
      { name: "Inventory", icon: FaBoxes, path: "/procurement/inventory" },
      { name: "Approvals", icon: FaCheck, path: "/procurement/approvals" },
      { name: "Contracts", icon: FaFileAlt, path: "/procurement/contracts" },
      {
        name: "Procurement Reports",
        icon: FaChartBar,
        path: "/procurement/reports",
      },
    ],
    stats: [
      { label: "Active POs", value: "156", change: "+18", trend: "up" },
      { label: "Total Vendors", value: "89", change: "+3", trend: "up" },
      { label: "Pending Approvals", value: "12", change: "-4", trend: "down" },
      { label: "Monthly Spend", value: "$450K", change: "+15%", trend: "up" },
    ],
    quickActions: [
      { name: "Create PO", icon: FaPlus, action: "create-po" },
      { name: "Add Vendor", icon: FaBuilding, action: "add-vendor" },
      { name: "Approve Request", icon: FaCheck, action: "approve-request" },
    ],
  },
  accounts: {
    title: "Accounting",
    icon: FaChartLine,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    features: [
      { name: "General Ledger", icon: FaChartBar, path: "/accounts/ledger" },
      {
        name: "Accounts Payable",
        icon: FaMoneyCheckAlt,
        path: "/accounts/payable",
      },
      {
        name: "Accounts Receivable",
        icon: FaChartLine,
        path: "/accounts/receivable",
      },
      {
        name: "Expense Management",
        icon: FaClipboardList,
        path: "/accounts/expenses",
      },
      { name: "Financial Reports", icon: FaFileAlt, path: "/accounts/reports" },
      { name: "Budget Management", icon: FaCog, path: "/accounts/budget" },
    ],
    stats: [
      { label: "Total Revenue", value: "$5.2M", change: "+12%", trend: "up" },
      {
        label: "Outstanding Invoices",
        value: "234",
        change: "-15",
        trend: "down",
      },
      { label: "Monthly Expenses", value: "$890K", change: "+8%", trend: "up" },
      { label: "Cash Flow", value: "$1.2M", change: "+18%", trend: "up" },
    ],
    quickActions: [
      { name: "Create Invoice", icon: FaPlus, action: "create-invoice" },
      {
        name: "Record Expense",
        icon: FaClipboardList,
        action: "record-expense",
      },
      { name: "Generate Report", icon: FaDownload, action: "generate-report" },
    ],
  },
  communication: {
    title: "Communication",
    icon: FaComments,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF", "VIEWER"],
    features: [
      {
        name: "Internal Messages",
        icon: FaEnvelope,
        path: "/communication/messages",
      },
      {
        name: "Announcements",
        icon: FaBell,
        path: "/communication/announcements",
      },
      { name: "Team Chat", icon: FaComments, path: "/communication/chat" },
      {
        name: "Email Templates",
        icon: FaFileAlt,
        path: "/communication/templates",
      },
      {
        name: "Notifications",
        icon: FaBell,
        path: "/communication/notifications",
      },
      {
        name: "Communication Reports",
        icon: FaChartBar,
        path: "/communication/reports",
      },
    ],
    stats: [
      { label: "Active Chats", value: "45", change: "+8", trend: "up" },
      { label: "Unread Messages", value: "23", change: "-5", trend: "down" },
      { label: "Announcements", value: "12", change: "+2", trend: "up" },
      { label: "Email Templates", value: "18", change: "+1", trend: "up" },
    ],
    quickActions: [
      { name: "Send Message", icon: FaEnvelope, action: "send-message" },
      {
        name: "Create Announcement",
        icon: FaBell,
        action: "create-announcement",
      },
      { name: "Schedule Email", icon: FaClock, action: "schedule-email" },
    ],
  },
};

const DynamicDashboard = () => {
  const { module } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const moduleConfig = MODULE_CONFIGS[module];

  // Check if user has access to this module
  const hasAccess =
    moduleConfig &&
    moduleConfig.requiredRoles.some(
      (role) => user?.roles?.includes(role) || user?.role === role
    );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const slideInVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
      },
    },
  };

  useEffect(() => {
    if (!moduleConfig) {
      navigate("/modules");
      return;
    }

    if (!hasAccess) {
      navigate("/unauthorized");
      return;
    }
  }, [module, moduleConfig, hasAccess, navigate]);

  const handleQuickAction = (action) => {
    setLoading(true);
    // Simulate action processing
    setTimeout(() => {
      setLoading(false);
      // Handle different actions
      switch (action) {
        case "add-employee":
          navigate("/hr/employees/new");
          break;
        case "process-payroll":
          navigate("/payroll/process");
          break;
        case "create-po":
          navigate("/procurement/orders/new");
          break;
        case "create-invoice":
          navigate("/accounts/invoices/new");
          break;
        case "send-message":
          navigate("/communication/messages/new");
          break;
        default:
          console.log(`Action: ${action}`);
      }
    }, 1000);
  };

  if (!moduleConfig || !hasAccess) {
    return null;
  }

  const IconComponent = moduleConfig.icon;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <motion.div
        variants={slideInVariants}
        className={`bg-gradient-to-r ${moduleConfig.color} text-white shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/modules")}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-white/20">
                  <IconComponent className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{moduleConfig.title}</h1>
                  <p className="text-white/80">
                    Welcome back, {user?.name || "User"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <FaBell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                <FaUser className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {user?.role || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        variants={slideInVariants}
        className="bg-white border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {["overview", "features", "reports", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? `border-${moduleConfig.color.split("-")[1]}-500 text-${
                        moduleConfig.color.split("-")[1]
                      }-600`
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-8"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {moduleConfig.stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInVariants}
                    className={`${moduleConfig.bgColor} ${moduleConfig.borderColor} border rounded-lg p-6 hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`flex items-center space-x-1 ${
                          stat.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stat.trend === "up" ? (
                          <FaArrowUp className="w-4 h-4" />
                        ) : (
                          <FaArrowDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <motion.div
                variants={fadeInVariants}
                className={`${moduleConfig.bgColor} ${moduleConfig.borderColor} border rounded-lg p-6`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {moduleConfig.quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action)}
                      disabled={loading}
                      className={`flex items-center space-x-3 p-4 rounded-lg bg-white border border-gray-200 hover:border-${
                        moduleConfig.color.split("-")[1]
                      }-300 hover:shadow-md transition-all ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <action.icon
                        className={`w-5 h-5 ${moduleConfig.textColor}`}
                      />
                      <span className="font-medium text-gray-700">
                        {action.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                variants={fadeInVariants}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50"
                    >
                      <div
                        className={`p-2 rounded-full ${moduleConfig.bgColor}`}
                      >
                        <IconComponent
                          className={`w-4 h-4 ${moduleConfig.textColor}`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {moduleConfig.title} activity #{item}
                        </p>
                        <p className="text-sm text-gray-500">
                          Updated 2 hours ago
                        </p>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "features" && (
            <motion.div
              key="features"
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">
                Module Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moduleConfig.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInVariants}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(feature.path)}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-full ${moduleConfig.bgColor}`}
                      >
                        <feature.icon
                          className={`w-6 h-6 ${moduleConfig.textColor}`}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {feature.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Manage {feature.name.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div
              key="reports"
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">
                Reports & Analytics
              </h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">
                  Reports functionality coming soon...
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">
                Module Settings
              </h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">
                  Settings functionality coming soon...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DynamicDashboard;
