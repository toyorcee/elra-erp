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
  FaHeadset,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import CachedELRALogo from "./CachedELRALogo";
import { userModulesAPI } from "../services/userModules.js";
import GradientSpinner from "./common/GradientSpinner";

const allModules = [
  {
    title: "Human Resources",
    description: "Employee management, recruitment, and HR workflows",
    icon: "FaUsers",
    path: "/dashboard/modules/hr",
    isReady: true,
    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF", "VIEWER"],
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
    icon: "FaMoneyCheckAlt",
    path: "/dashboard/modules/payroll",
    isReady: true,
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
    icon: "FaShoppingCart",
    path: "/dashboard/modules/procurement",
    isReady: true,
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
    icon: "FaChartLine",
    path: "/dashboard/modules/finance",
    isReady: true,

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
    icon: "FaComments",
    path: "/dashboard/modules/operations",
    isReady: true,

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
  {
    title: "Customer Care",
    description: "Customer support, ticket management, and service requests",
    icon: "FaHeadset",
    path: "/dashboard/modules/customer-care",
    isReady: true,

    requiredRoles: ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"],
    processFlow: {
      dataEntry: [
        "Support tickets",
        "Customer inquiries",
        "Service requests",
        "Feedback forms",
      ],
      processing: [
        "Ticket routing",
        "Issue resolution",
        "Escalation handling",
        "Response generation",
      ],
      output: [
        "Resolved tickets",
        "Customer satisfaction",
        "Service reports",
        "Knowledge base",
      ],
      approval: [
        "Ticket assignments",
        "Resolution approvals",
        "Escalation approvals",
        "Service level agreements",
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
  const [userModules, setUserModules] = React.useState([]);
  const [loadingModules, setLoadingModules] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const currentYear = new Date().getFullYear();

  // Fetch all modules (for everyone to see)
  React.useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoadingModules(true);

        if (user) {
          // For authenticated users, fetch their specific modules
          const response = await userModulesAPI.getUserModules();
          const transformedModules = userModulesAPI.transformModules(
            response.data
          );
          setUserModules(transformedModules);
        } else {
          const response = await userModulesAPI.getAllModules();
          const transformedModules = userModulesAPI.transformModules(
            response.data
          );
          setUserModules(transformedModules);
        }
      } catch (error) {
        console.error("❌ [ModuleSelector] Error fetching modules:", error);
        if (!user) {
          setUserModules(allModules);
        } else {
          console.warn(
            "⚠️ [ModuleSelector] Failed to load user modules, showing error state"
          );
        }
      } finally {
        setLoadingModules(false);
        setIsInitialLoad(false);
      }
    };

    if (user !== undefined) {
      fetchModules();
    }
  }, [user]);

  const getAccessibleModules = () => {
    if (loadingModules) {
      return [];
    }

    if (user && userModules.length > 0) {
      return userModules;
    }

    if (user && userModules.length === 0) {
      return [];
    }

    return allModules;
  };

  const modules = React.useMemo(() => {
    return getAccessibleModules();
  }, [user, userModules, loadingModules]);

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
      FaHeadset: FaHeadset,
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
  };

  const handleModuleClick = (module) => {
    if (!user) {
      localStorage.setItem("redirectAfterLogin", module.path);
      navigate("/login");
      return;
    }

    navigate(module.path);
  };

  const handleLogin = () => {
    localStorage.setItem("redirectAfterLogin", "/modules");
    setShowModal(false);
    navigate("/login");
  };

  const handleExploreMore = () => {
    setShowModal(false);
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

  // Show loading state when fetching modules
  if (loadingModules) {
    return (
      <div className="h-screen w-full bg-white flex flex-col items-center justify-center">
        <GradientSpinner
          size="lg"
          title="ELRA System"
          text="Loading modules..."
          showText={true}
        />
      </div>
    );
  }

  // Only show "no modules" when we're not loading and actually have no modules
  if (modules.length === 0) {
    return (
      <div className="h-screen w-full bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            No Modules Available
          </h1>
          <p className="text-gray-600 mb-8">
            Contact your administrator to get access to modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center overflow-hidden">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <h1 className="text-4xl font-bold text-[var(--elra-primary)] mb-2">
          ELRA ERP System
        </h1>
        <p className="text-lg text-[var(--elra-text-secondary)]">
          {user
            ? "Your accessible ERP modules"
            : "Choose an ERP module to get started"}
        </p>
      </div>

      {/* Error State for Authenticated Users */}
      {user &&
        !loadingModules &&
        userModules.length === 0 &&
        !isInitialLoad && (
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Unable to Load Modules
              </h3>
              <p className="text-red-600 mb-4">
                We couldn't load your personalized modules at this time. This
                might be due to a temporary connection issue.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

      {/* Module Selector */}
      <div className="relative w-full max-w-6xl flex items-center justify-center opacity-100 transition-opacity duration-500">
        <button
          onClick={() => navigateSlide(-1)}
          className="absolute left-4 z-30 p-4 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
        >
          <ChevronLeftIcon className="h-6 w-6 text-green-600" />
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
                    ${offset === 0 ? "ring-4 ring-green-300 shadow-3xl" : ""}
                    hover:shadow-3xl transition-all duration-300`}
                  onClick={() => handleModuleClick(module)}
                >
                  {/* Icon Container */}
                  <div
                    className="w-32 h-32 mb-6 rounded-full bg-[var(--elra-primary)] 
                    flex items-center justify-center border-4 border-white shadow-lg
                    group-hover:scale-110 transition-transform duration-300 relative"
                  >
                    <div
                      className={`text-white text-4xl transition-all duration-300 ${
                        offset === 0 ? "animate-spin" : ""
                      }`}
                      style={{
                        animation:
                          offset === 0 ? "spin 2s linear infinite" : "none",
                      }}
                    >
                      {getIconComponent(module.icon)}
                    </div>

                    {/* Animated Module Count Badge - Only for centered module */}
                    {offset === 0 && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-[var(--elra-primary)] shadow-lg flex items-center justify-center">
                        <motion.span
                          className="text-[var(--elra-primary)] font-bold text-sm"
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
                  <h2 className="text-2xl font-bold text-[var(--elra-text-primary)] mb-3 text-center">
                    {module.title}
                  </h2>
                  <p className="text-base text-[var(--elra-text-secondary)] text-center mb-4 leading-relaxed">
                    {module.description}
                  </p>

                  {/* Action Button */}
                  <button className="w-full max-w-[200px] py-4 rounded-xl bg-[var(--elra-primary)] text-white text-base font-semibold hover:bg-[var(--elra-primary-dark)] hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-white shadow-lg">
                    {module.isReady ? "Enter Module" : "Coming Soon"}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button
          onClick={() => navigateSlide(1)}
          className="absolute right-4 z-30 p-4 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow border border-[var(--elra-border-primary)]"
        >
          <ChevronRightIcon className="h-6 w-6 text-[var(--elra-primary)]" />
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
                ? "bg-[var(--elra-primary)] border-[var(--elra-primary)] scale-110 shadow-lg"
                : "bg-white border-[var(--elra-border-primary)] hover:border-[var(--elra-primary)] hover:scale-105"
            }`}
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 text-center w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mx-8 shadow-lg border border-[var(--elra-border-primary)]">
          <div className="flex items-center justify-center mb-2">
            <CachedELRALogo variant="dark" size="sm" />
          </div>
          <div className="text-sm text-[var(--elra-text-secondary)] font-medium">
            ELRA ERP System • Version 2.0
          </div>
          <div className="text-xs text-[var(--elra-text-muted)] mt-1">
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
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-green-100"
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
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <FaSignInAlt className="h-5 w-5" />
                      <span>Login to Access Module</span>
                    </div>
                  </button>

                  <button
                    onClick={handleExploreMore}
                    className="w-full py-4 px-6 bg-white border-2 border-green-200 text-green-700 font-semibold rounded-xl hover:bg-green-50 hover:border-green-300 transform hover:scale-105 transition-all duration-200"
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
