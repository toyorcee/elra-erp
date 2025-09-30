import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  EyeIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  CheckCircleIcon,
  PlusIcon,
  DocumentIcon,
  CurrencyDollarIcon,
  UserIcon,
  HeartIcon,
  RocketLaunchIcon,
  FireIcon,
  BellIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CubeIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import dashboardAPI from "../../services/dashboardAPI";

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching dashboard data...");

      // Fetch user dashboard data
      const userDashboardResponse = await dashboardAPI.getUserDashboard();
      console.log("✅ User dashboard response:", userDashboardResponse);

      const statsResponse = await dashboardAPI.getDashboardStats();
      console.log("✅ Stats response:", statsResponse);

      const activityResponse = await dashboardAPI.getRecentActivity();
      console.log("✅ Activity response:", activityResponse);

      setDashboardData(userDashboardResponse.data);
      setRecentActivity(activityResponse.data || []);

      console.log("✅ Dashboard data set:", userDashboardResponse.data);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      // Set fallback data to prevent infinite loading
      setDashboardData({
        userStats: {
          myDocuments: 0,
          myRequests: 0,
          myProjects: 0,
          myPayslips: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserRoleLevel = () => {
    if (!user) return 0;
    const roleValue = user.role?.name || user.role;
    switch (roleValue) {
      case "SUPER_ADMIN":
        return 1000;
      case "HOD":
        return 700;
      case "MANAGER":
        return 600;
      case "STAFF":
        return 300;
      case "VIEWER":
        return 100;
      default:
        return 100;
    }
  };

  const roleLevel = getUserRoleLevel();

  const getQuickActions = () => {
    const userDepartment = user?.department?.name;

    if (roleLevel >= 1000) {
      // Super Admin - Access to all modules
      return [
        {
          name: "HR Management",
          icon: UsersIcon,
          color: "bg-blue-500",
          href: "/dashboard/modules/hr/users",
        },
        {
          name: "Finance Management",
          icon: CurrencyDollarIcon,
          color: "bg-green-500",
          href: "/dashboard/modules/finance/elra-wallet",
        },
        {
          name: "Project Management",
          icon: ChartBarIcon,
          color: "bg-purple-500",
          href: "/dashboard/modules/projects/analytics",
        },
        {
          name: "System Health",
          icon: ShieldCheckIcon,
          color: "bg-red-500",
          href: "/dashboard",
        },
      ];
    } else if (roleLevel >= 700) {
      // HOD Level - Department-specific access
      const actions = [];

      // HR HOD
      if (userDepartment === "Human Resources") {
        actions.push(
          {
            name: "User Management",
            icon: UsersIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/hr/users",
          },
          {
            name: "Leave Management",
            icon: CalendarDaysIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/hr/leave/management",
          },
          {
            name: "Employee Invitation",
            icon: PlusIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/hr/invitation",
          },
          {
            name: "Department Management",
            icon: BuildingOfficeIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/hr/departments",
          }
        );
      }
      // Finance HOD
      else if (userDepartment === "Finance & Accounting") {
        actions.push(
          {
            name: "ELRA Wallet",
            icon: CurrencyDollarIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/finance/elra-wallet",
          },
          {
            name: "Budget Approvals",
            icon: CheckCircleIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/finance/budget-allocation",
          },
          {
            name: "Payroll Approvals",
            icon: CurrencyDollarIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/finance/payroll-approvals",
          },
          {
            name: "Transaction History",
            icon: ClockIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/finance/transaction-history",
          }
        );
      }
      // Sales & Marketing HOD
      else if (userDepartment === "Sales & Marketing") {
        actions.push(
          {
            name: "Sales Overview",
            icon: ChartBarIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/sales/overview",
          },
          {
            name: "Transactions",
            icon: DocumentTextIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/sales/transactions",
          },
          {
            name: "Approvals",
            icon: CheckCircleIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/sales/approvals",
          },
          {
            name: "Reports",
            icon: ChartBarIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/sales/reports",
          }
        );
      }
      // Operations HOD
      else if (userDepartment === "Operations") {
        actions.push(
          {
            name: "Inventory List",
            icon: CubeIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/inventory/list",
          },
          {
            name: "Inventory Tracking",
            icon: ClockIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/inventory/tracking",
          },
          {
            name: "Inventory Reports",
            icon: ChartBarIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/inventory/reports",
          },
          {
            name: "Department Management",
            icon: BuildingOfficeIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/department-management/users",
          }
        );
      }
      // Customer Care HOD
      else if (
        userDepartment === "Customer Service" ||
        userDepartment === "Customer Care"
      ) {
        actions.push(
          {
            name: "Customer Care Overview",
            icon: ChartBarIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/customer-care/overview",
          },
          {
            name: "All Complaints",
            icon: DocumentTextIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/customer-care/complaints",
          },
          {
            name: "Assign Complaints",
            icon: UsersIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/customer-care/assign-complaints",
          },
          {
            name: "Reports",
            icon: ChartBarIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/customer-care/reports",
          }
        );
      }
      // Project Management HOD
      else if (userDepartment === "Project Management") {
        actions.push(
          {
            name: "Project Dashboard",
            icon: ChartBarIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/projects/analytics",
          },
          {
            name: "Project Approvals",
            icon: CheckCircleIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/projects/approvals",
          },
          {
            name: "External Projects",
            icon: GlobeAltIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/projects/external",
          },
          {
            name: "Project Teams",
            icon: UsersIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/projects/teams",
          }
        );
      }
      // Legal HOD
      else if (userDepartment === "Legal") {
        actions.push(
          {
            name: "Legal Dashboard",
            icon: ChartBarIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/legal",
          },
          {
            name: "Legal Policies",
            icon: DocumentTextIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/legal/policies",
          },
          {
            name: "Compliance Programs",
            icon: ShieldCheckIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/legal/compliance-programs",
          },
          {
            name: "Compliance Items",
            icon: CheckCircleIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/legal/compliance-items",
          }
        );
      }
      // Procurement HOD
      else if (userDepartment === "Procurement") {
        actions.push(
          {
            name: "Purchase Orders",
            icon: DocumentTextIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/procurement/orders",
          },
          {
            name: "Procurement Tracking",
            icon: ClockIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/procurement/tracking",
          },
          {
            name: "Procurement Management",
            icon: BuildingOfficeIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/procurement",
          },
          {
            name: "Department Management",
            icon: UsersIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/department-management/users",
          }
        );
      }
      // Payroll HOD
      else if (userDepartment === "Payroll") {
        actions.push(
          {
            name: "Payroll Processing",
            icon: CurrencyDollarIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/payroll/processing",
          },
          {
            name: "Salary Grade Management",
            icon: ChartBarIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/payroll/salary-grades",
          },
          {
            name: "Deductions Management",
            icon: CheckCircleIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/payroll/deductions",
          },
          {
            name: "Pay Slips Management",
            icon: DocumentIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/payroll/payslips",
          }
        );
      }
      // Executive Office HOD (special finance access)
      else if (userDepartment === "Executive Office") {
        actions.push(
          {
            name: "ELRA Wallet",
            icon: CurrencyDollarIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/finance/elra-wallet",
          },
          {
            name: "Budget Approvals",
            icon: CheckCircleIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/finance/budget-allocation",
          },
          {
            name: "Transaction History",
            icon: ClockIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/finance/transaction-history",
          },
          {
            name: "Department Management",
            icon: BuildingOfficeIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/department-management/users",
          }
        );
      }
      // Default HOD actions for other departments
      else {
        actions.push(
          {
            name: "Department Management",
            icon: BuildingOfficeIcon,
            color: "bg-blue-500",
            href: "/dashboard/modules/department-management/users",
          },
          {
            name: "Team Management",
            icon: UsersIcon,
            color: "bg-green-500",
            href: "/dashboard/modules/department-management/team",
          },
          {
            name: "Announcements",
            icon: BellIcon,
            color: "bg-purple-500",
            href: "/dashboard/modules/communication/announcements",
          },
          {
            name: "Events Calendar",
            icon: CalendarDaysIcon,
            color: "bg-orange-500",
            href: "/dashboard/modules/communication/events",
          }
        );
      }

      return actions;
    } else if (roleLevel >= 300) {
      // Staff Level - Self-service modules
      return [
        {
          name: "My Payslips",
          icon: CurrencyDollarIcon,
          color: "bg-green-500",
          href: "/dashboard/modules/self-service/payslips",
        },
        {
          name: "My Documents",
          icon: DocumentIcon,
          color: "bg-blue-500",
          href: "/dashboard/modules/self-service/documents",
        },
        {
          name: "My Projects",
          icon: ChartBarIcon,
          color: "bg-purple-500",
          href: "/dashboard/modules/self-service/my-projects",
        },
        {
          name: "Leave Requests",
          icon: CalendarDaysIcon,
          color: "bg-orange-500",
          href: "/dashboard/modules/self-service/leave-requests",
        },
      ];
    } else {
      // Viewer Level
      return [
        {
          name: "View Documents",
          icon: DocumentIcon,
          color: "bg-blue-500",
          href: "/dashboard/modules/self-service/documents",
        },
        {
          name: "Announcements",
          icon: BellIcon,
          color: "bg-green-500",
          href: "/dashboard/modules/communication/announcements",
        },
        {
          name: "Events Calendar",
          icon: CalendarDaysIcon,
          color: "bg-purple-500",
          href: "/dashboard/modules/communication/events",
        },
        {
          name: "Help Center",
          icon: HeartIcon,
          color: "bg-orange-500",
          href: "/dashboard",
        },
      ];
    }
  };

  const getRoleDisplayName = () => {
    const roleMap = {
      SUPER_ADMIN: "Super Administrator",
      HOD: "Head of Department",
      MANAGER: "Manager",
      STAFF: "Staff Member",
      VIEWER: "Viewer",
    };
    return roleMap[user?.role?.name] || user?.role || "User";
  };

  const getWelcomeMessage = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getRoleIcon = () => {
    if (roleLevel >= 1000) return ShieldCheckIcon;
    if (roleLevel >= 700) return BuildingOfficeIcon;
    if (roleLevel >= 300) return BriefcaseIcon;
    return EyeIcon;
  };

  const getRoleColor = () => {
    if (roleLevel >= 1000) return "text-red-600";
    if (roleLevel >= 700) return "text-blue-600";
    if (roleLevel >= 300) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Main Content */}
      <div className="mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <ChartBarIcon className="w-7 h-7 text-[var(--elra-primary)]" />
                  <span>Quick Stats</span>
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4" />
                  <span>Last updated: {currentTime.toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardData?.userStats ? (
                  Object.entries(dashboardData.userStats).map(
                    ([key, value], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl flex items-center justify-center">
                            {index === 0 && (
                              <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                            )}
                            {index === 1 && (
                              <BoltIcon className="w-6 h-6 text-white" />
                            )}
                            {index === 2 && (
                              <CalendarDaysIcon className="w-6 h-6 text-white" />
                            )}
                            {index === 3 && (
                              <TrophyIcon className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {value}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">
                            +12%
                          </span>
                        </div>
                      </motion.div>
                    )
                  )
                ) : (
                  <div className="col-span-4 text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading stats...</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/50"
            >
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 mb-6">
                <RocketLaunchIcon className="w-7 h-7 text-[var(--elra-primary)]" />
                <span>Quick Actions</span>
              </h2>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {getQuickActions().map((action, index) => (
                  <motion.button
                    key={action.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${action.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <action.icon className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold text-sm text-center">
                        {action.name}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Activity & Notifications */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-gray-200/50"
            >
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3 mb-6">
                <FireIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                <span>Recent Activity</span>
              </h2>

              <div className="space-y-4">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity, index) => (
                    <motion.div
                      key={activity._id || index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                      className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-full flex items-center justify-center flex-shrink-0">
                        <DocumentTextIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.action || "System Activity"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.userDetails?.name || "System"} •{" "}
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-gray-200/50"
            >
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3 mb-6">
                <BellIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                <span>Notifications</span>
              </h2>

              <div className="space-y-4">
                <div className="text-center py-8">
                  <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No notifications at the moment
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    You'll see important updates here
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedDashboard;
