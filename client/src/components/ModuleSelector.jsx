import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
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
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import ELRALogo from "./ELRALogo";
import { userModulesAPI } from "../services/userModules.js";

const allModules = [
  {
    title: "Human Resources",
    description: "Employee management, recruitment, and HR workflows",
    icon: <FaUsers className="w-full h-full" />,
    path: "/dashboard/hr",
    isReady: true,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    processFlow: {
      dataEntry: [
        "Employee profiles",
        "Recruitment applications",
        "Performance reviews",
        "Training records",
      ],
      processing: [
        "Candidate screening",
        "Performance calculations",
        "Training scheduling",
        "Workflow automation",
      ],
      output: [
        "Employee reports",
        "Performance analytics",
        "Training certificates",
        "HR dashboards",
      ],
      approval: [
        "Hiring decisions",
        "Performance ratings",
        "Training approvals",
        "Policy changes",
      ],
    },
  },
  {
    title: "Payroll Management",
    description: "Salary processing, benefits, and payroll reports",
    icon: <FaMoneyCheckAlt className="w-full h-full" />,
    path: "/dashboard/payroll",
    isReady: true,
    color: "from-teal-500 to-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    processFlow: {
      dataEntry: [
        "Time sheets",
        "Salary information",
        "Benefits data",
        "Deduction records",
      ],
      processing: [
        "Salary calculations",
        "Tax computations",
        "Benefit deductions",
        "Overtime calculations",
      ],
      output: [
        "Payroll reports",
        "Salary payments",
        "Tax filings",
        "Benefit statements",
      ],
      approval: [
        "Payroll approval",
        "Benefit changes",
        "Salary adjustments",
        "Tax submissions",
      ],
    },
  },
  {
    title: "Procurement",
    description: "Purchase orders, vendor management, and inventory",
    icon: <FaShoppingCart className="w-full h-full" />,
    path: "/dashboard/procurement",
    isReady: true,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    processFlow: {
      dataEntry: [
        "Purchase requests",
        "Vendor information",
        "Inventory needs",
        "Contract terms",
      ],
      processing: [
        "Vendor evaluation",
        "Price comparisons",
        "Inventory tracking",
        "Order processing",
      ],
      output: [
        "Purchase orders",
        "Vendor reports",
        "Inventory reports",
        "Cost analysis",
      ],
      approval: [
        "Purchase approvals",
        "Vendor selection",
        "Contract approvals",
        "Payment authorizations",
      ],
    },
  },
  {
    title: "Accounting",
    description: "Financial management, expenses, and reporting",
    icon: <FaChartLine className="w-full h-full" />,
    path: "/dashboard/accounts",
    isReady: true,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    processFlow: {
      dataEntry: [
        "Financial transactions",
        "Expense records",
        "Revenue data",
        "Budget information",
      ],
      processing: [
        "Journal entries",
        "Account reconciliation",
        "Budget calculations",
        "Financial analysis",
      ],
      output: [
        "Financial statements",
        "Budget reports",
        "Cash flow analysis",
        "Audit trails",
      ],
      approval: [
        "Financial approvals",
        "Budget approvals",
        "Expense approvals",
        "Audit approvals",
      ],
    },
  },
  {
    title: "Communication",
    description: "Internal messaging, announcements, and collaboration",
    icon: <FaComments className="w-full h-full" />,
    path: "/dashboard/communication",
    isReady: true,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF", "VIEWER"],
    processFlow: {
      dataEntry: [
        "Messages & announcements",
        "Meeting requests",
        "File uploads",
        "Collaboration data",
      ],
      processing: [
        "Message routing",
        "Notification generation",
        "File processing",
        "Thread management",
      ],
      output: [
        "Delivered messages",
        "Meeting schedules",
        "Shared files",
        "Communication logs",
      ],
      approval: [
        "Message approvals",
        "Announcement approvals",
        "File sharing permissions",
        "Meeting scheduling",
      ],
    },
  },
];

function ModuleSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedModule, setSelectedModule] = React.useState(null);
  const [spinningModule, setSpinningModule] = React.useState(null);
  const [userModules, setUserModules] = React.useState([]);
  const [loadingModules, setLoadingModules] = React.useState(false);
  const currentYear = new Date().getFullYear();

  // Fetch user modules when authenticated
  React.useEffect(() => {
    const fetchUserModules = async () => {
      if (user) {
        try {
          setLoadingModules(true);
          console.log("🔍 [ModuleSelector] Fetching user modules...");
          const response = await userModulesAPI.getUserModules();
          const transformedModules = userModulesAPI.transformModules(
            response.data
          );
          setUserModules(transformedModules);
          console.log(
            "✅ [ModuleSelector] User modules loaded:",
            transformedModules.length
          );
        } catch (error) {
          console.error(
            "❌ [ModuleSelector] Error fetching user modules:",
            error
          );
          // Fallback to all modules if API fails
          setUserModules(allModules);
        } finally {
          setLoadingModules(false);
        }
      }
    };

    fetchUserModules();
  }, [user]);

  const modules = React.useMemo(() => {
    if (!user) {
      // Show all modules for unauthenticated users
      return allModules;
    }

    // Show user's accessible modules for authenticated users
    if (userModules.length > 0) {
      return userModules;
    }

    // Fallback to all modules while loading
    return allModules;
  }, [user, userModules]);

  // Reset current index if it's out of bounds after filtering
  React.useEffect(() => {
    if (currentIndex >= modules.length && modules.length > 0) {
      setCurrentIndex(0);
    }
  }, [modules.length, currentIndex]);

  const getVisibleModules = () => {
    const visibleIndexes = [];
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + modules.length) % modules.length;
      visibleIndexes.push({ index, offset: i });
    }
    return visibleIndexes;
  };

  // Get icon component by name
  const getIconComponent = (iconName) => {
    const iconMap = {
      FaUsers: FaUsers,
      FaMoneyCheckAlt: FaMoneyCheckAlt,
      FaShoppingCart: FaShoppingCart,
      FaChartLine: FaChartLine,
      FaComments: FaComments,
      FaUserTie: FaUserTie,
      FaClipboardList: FaClipboardList,
      FaCog: FaCog,
      FaChartBar: FaChartBar,
      FaBell: FaBell,
      FaFileAlt: FaFileAlt,
      FaShieldAlt: FaShieldAlt,
      FaSignInAlt: FaSignInAlt,
      FaCompass: FaCompass,
      FaBoxes: FaBoxes,
    };

    const IconComponent = iconMap[iconName] || FaCog;
    return <IconComponent className="w-full h-full" />;
  };

  const navigateSlide = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const nextIndex = prev + newDirection;
      if (nextIndex < 0) return modules.length - 1;
      if (nextIndex >= modules.length) return 0;
      return nextIndex;
    });

    // Trigger spin animation for the new centered module
    const nextIndex =
      (currentIndex + newDirection + modules.length) % modules.length;
    setSpinningModule(modules[nextIndex]?.title);

    // Stop spinning after animation completes
    setTimeout(() => {
      setSpinningModule(null);
    }, 600);
  };

  const handleModuleClick = (module) => {
    if (!user) {
      // Store the intended destination and redirect to login
      localStorage.setItem("redirectAfterLogin", module.path);
      navigate("/login");
      return;
    }

    // Check if user has access to this module
    const hasAccess = module.requiredRoles.some(
      (role) => user.roles?.includes(role) || user.role?.name === role
    );

    if (!hasAccess) {
      setSelectedModule(module);
      setShowModal(true);
      return;
    }

    // Navigate to the module dashboard
    navigate(module.path);
  };

  const handleLogin = () => {
    if (selectedModule) {
      // Set redirect to dynamic dashboard
      const moduleKey = selectedModule.title.toLowerCase().replace(/\s+/g, "");
      let redirectPath = "/dashboard";
      if (moduleKey.includes("humanresources")) {
        redirectPath = "/dashboard/hr";
      } else if (moduleKey.includes("payroll")) {
        redirectPath = "/dashboard/payroll";
      } else if (moduleKey.includes("procurement")) {
        redirectPath = "/dashboard/procurement";
      } else if (moduleKey.includes("accounting")) {
        redirectPath = "/dashboard/accounts";
      } else if (moduleKey.includes("communication")) {
        redirectPath = "/dashboard/communication";
      } else {
        redirectPath = "/dashboard/" + moduleKey;
      }
      localStorage.setItem("redirectAfterLogin", redirectPath);
    }
    setShowModal(false);
    navigate("/login");
  };

  const handleExploreMore = () => {
    setShowModal(false);
    // Continue exploring modules
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
    }),
  };

  if (modules.length === 0) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-50 to-teal-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            No Modules Available
          </h1>
          <p className="text-gray-600 mb-8">
            Contact your administrator to get access to modules.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-purple-50 via-white to-teal-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          ELRA ERP System
        </h1>
        <p className="text-lg text-gray-600">
          {user
            ? "Your accessible ERP modules"
            : "Choose an ERP module to get started"}
        </p>
        {user && loadingModules && (
          <div className="mt-4 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-purple-600 font-medium">
              Loading your modules...
            </span>
          </div>
        )}
        {user && !loadingModules && userModules.length > 0 && (
          <div className="mt-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">
                      {userModules.length}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {userModules.length}/5 ERP modules available
                    </p>
                    <p className="text-xs text-green-600">
                      Based on your {user?.role || "User"} role
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600 font-medium">
                    Ready to access
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module Selector */}
      <div className="relative w-full max-w-6xl flex items-center justify-center">
        <button
          onClick={() => navigateSlide(-1)}
          className="absolute left-4 z-30 p-4 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
        >
          <ChevronLeftIcon className="h-6 w-6 text-purple-600" />
        </button>

        <div className="relative flex items-center justify-center w-full h-[500px] overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            {getVisibleModules().map(({ index, offset }) => {
              const module = modules[index];
              const xOffset = offset * 320;
              const zIndex = 20 - Math.abs(offset);
              const opacity = offset === 0 ? 1 : 0.5;
              const scale = offset === 0 ? 1 : 0.9;

              return (
                <motion.div
                  key={`${module.title}-${offset}`}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate={{
                    x: xOffset,
                    scale,
                    opacity,
                    zIndex,
                  }}
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                  }}
                  className={`absolute w-[350px] h-[450px] bg-white 
                    shadow-2xl rounded-3xl p-8 flex flex-col items-center 
                    justify-center border-2 cursor-pointer group
                    ${module.borderColor}
                    ${offset === 0 ? "ring-4 ring-purple-300 shadow-3xl" : ""}
                    hover:shadow-3xl transition-all duration-300`}
                  onClick={() => handleModuleClick(module)}
                >
                  {/* Icon Container */}
                  <div
                    className={`w-32 h-32 mb-6 rounded-full ${module.bgColor} 
                    flex items-center justify-center border-4 border-white shadow-lg
                    bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-300 relative`}
                  >
                    <div
                      className={`text-white text-4xl transition-all duration-300 ${
                        offset === 0 ? "group-hover:animate-spin" : ""
                      }`}
                      style={{
                        animation:
                          spinningModule === module.title && offset === 0
                            ? "spin 0.6s ease-out"
                            : "none",
                      }}
                    >
                      {getIconComponent(module.icon)}
                    </div>

                    {/* Animated Module Count Badge - Only for centered module */}
                    {offset === 0 && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-purple-200 shadow-lg flex items-center justify-center">
                        <motion.span
                          className="text-purple-600 font-bold text-sm"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 15,
                          }}
                        >
                          {index + 1}
                        </motion.span>
                      </div>
                    )}
                  </div>

                  {/* Module Info */}
                  <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
                    {module.title}
                  </h2>
                  <p className="text-base text-gray-600 text-center mb-4 leading-relaxed">
                    {module.description}
                  </p>

                  {/* Process Flow - Only show for centered module */}
                  {offset === 0 && module.processFlow && (
                    <div className="w-full mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">
                        Process Flow
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-purple-100 rounded p-2">
                          <div className="font-semibold text-purple-700 mb-1">
                            📝 Data Entry
                          </div>
                          <ul className="text-purple-600 space-y-1">
                            {module.processFlow.dataEntry
                              .slice(0, 2)
                              .map((item, idx) => (
                                <li key={idx} className="truncate">
                                  • {item}
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div className="bg-blue-100 rounded p-2">
                          <div className="font-semibold text-blue-700 mb-1">
                            ⚙️ Processing
                          </div>
                          <ul className="text-blue-600 space-y-1">
                            {module.processFlow.processing
                              .slice(0, 2)
                              .map((item, idx) => (
                                <li key={idx} className="truncate">
                                  • {item}
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div className="bg-green-100 rounded p-2">
                          <div className="font-semibold text-green-700 mb-1">
                            📊 Output
                          </div>
                          <ul className="text-green-600 space-y-1">
                            {module.processFlow.output
                              .slice(0, 2)
                              .map((item, idx) => (
                                <li key={idx} className="truncate">
                                  • {item}
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div className="bg-orange-100 rounded p-2">
                          <div className="font-semibold text-orange-700 mb-1">
                            ✅ Approval
                          </div>
                          <ul className="text-orange-600 space-y-1">
                            {module.processFlow.approval
                              .slice(0, 2)
                              .map((item, idx) => (
                                <li key={idx} className="truncate">
                                  • {item}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {user &&
                    module.permissions &&
                    module.permissions.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mb-6">
                        {module.permissions.map((permission, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Action Button */}
                  <button
                    className={`w-full max-w-[200px] py-4 rounded-xl
                    bg-gradient-to-r ${module.color} text-white text-base font-semibold 
                    hover:shadow-lg transform hover:scale-105 transition-all duration-200
                    border-2 border-white shadow-lg`}
                  >
                    {module.isReady ? "Enter Module" : "Coming Soon"}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button
          onClick={() => navigateSlide(1)}
          className="absolute right-4 z-30 p-4 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
        >
          <ChevronRightIcon className="h-6 w-6 text-purple-600" />
        </button>
      </div>

      {/* Module Indicators */}
      <div className="flex space-x-3 mt-8 mb-6">
        {modules.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-4 h-4 rounded-full transition-all duration-300 border-2 ${
              index === currentIndex
                ? "bg-purple-600 border-purple-600 scale-110 shadow-lg"
                : "bg-white border-gray-300 hover:border-purple-400 hover:scale-105"
            }`}
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 text-center w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mx-8 shadow-lg border border-purple-100">
          <div className="flex items-center justify-center mb-2">
            <ELRALogo variant="dark" size="sm" />
          </div>
          <div className="text-sm text-gray-600 font-medium">
            ELRA ERP System • Version 2.0
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Powered by Century Information Systems • © {currentYear}
          </div>
        </div>
      </footer>

      {/* Animated Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-purple-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>

              {/* Modal Content */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                  <div className="text-white text-3xl">
                    {selectedModule?.icon}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {selectedModule?.title}
                </h3>

                <p className="text-gray-600 mb-8 leading-relaxed">
                  {selectedModule?.description}
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleLogin}
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <FaSignInAlt className="h-5 w-5" />
                      <span>Login to Access Module</span>
                    </div>
                  </button>

                  <button
                    onClick={handleExploreMore}
                    className="w-full py-4 px-6 bg-white border-2 border-purple-200 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 hover:border-purple-300 transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <FaCompass className="h-5 w-5" />
                      <span>Explore More Modules</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ModuleSelector;
