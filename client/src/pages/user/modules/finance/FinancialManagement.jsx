import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import {
  FaWallet,
  FaChartLine,
  FaMoneyBillWave,
  FaReceipt,
  FaHandHoldingUsd,
  FaCalculator,
  FaFileInvoiceDollar,
  FaCreditCard,
  FaPiggyBank,
  FaBalanceScale,
  FaCoins,
} from "react-icons/fa";

const FinancialManagement = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const hasAccess = (item) => {
    const userLevel = user?.role?.level || 0;
    const userDepartment = user?.department?.name;

    if (userLevel >= 1000) {
      return true;
    }

    if (item.required?.minLevel && userLevel < item.required.minLevel) {
      return false;
    }

    if (
      item.required?.department &&
      userDepartment !== item.required.department
    ) {
      return false;
    }

    // Check hidden function
    if (item.hidden && typeof item.hidden === "function") {
      return !item.hidden(user);
    }

    return true;
  };

  const financialFeatures = [
    {
      title: "ELRA Wallet",
      description: "Manage ELRA company funds and allocations",
      icon: FaWallet,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      path: "/dashboard/modules/finance/elra-wallet",
      status: "Active",
      badge: "Wallet",
      required: { minLevel: 700 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";
        const isExecutive =
          user?.role?.level === 700 && userDepartment === "Executive Office";

        return !(isSuperAdmin || isFinanceHOD || isExecutive);
      },
    },
    {
      title: "Project Budget Approvals",
      description: "Approve and manage project budget allocations",
      icon: FaMoneyBillWave,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
      path: "/dashboard/modules/finance/budget-allocation",
      status: "Active",
      badge: "Budget",
      required: { minLevel: 700 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";
        const isExecutive =
          user?.role?.level === 700 && userDepartment === "Executive Office";

        return !(isSuperAdmin || isFinanceHOD || isExecutive);
      },
    },
    {
      title: "Payroll Approvals",
      description: "Approve payroll allocations and manage funding",
      icon: FaReceipt,
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      path: "/dashboard/modules/finance/payroll-approvals",
      status: "Active",
      badge: "Payroll",
      required: { minLevel: 700 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";
        const isExecutive =
          user?.role?.level === 700 && userDepartment === "Executive Office";

        return !(isSuperAdmin || isFinanceHOD || isExecutive);
      },
    },
    {
      title: "Sales & Marketing Approvals",
      description: "Approve Sales & Marketing expense transactions",
      icon: FaHandHoldingUsd,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      path: "/dashboard/modules/finance/sales-marketing-approvals",
      status: "Active",
      badge: "Sales",
      required: { minLevel: 700 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";

        return !(isSuperAdmin || isFinanceHOD);
      },
    },
    {
      title: "Transaction History & Reports",
      description:
        "View detailed transaction history, audit trail, and export reports",
      icon: FaChartLine,
      color: "bg-gradient-to-br from-pink-500 to-rose-600",
      path: "/dashboard/modules/finance/transaction-history",
      status: "Active",
      badge: "Reports",
      required: { minLevel: 700 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";
        const isExecutive =
          user?.role?.level === 700 && userDepartment === "Executive Office";

        return !(isSuperAdmin || isFinanceHOD || isExecutive);
      },
    },
  ].filter(hasAccess); // Filter out items user doesn't have access to

  const quickActions = [
    {
      title: "View Wallet Balance",
      icon: FaWallet,
      color: "bg-green-500",
      path: "/dashboard/modules/finance/elra-wallet",
    },
    {
      title: "Generate Report",
      icon: FaChartLine,
      color: "bg-blue-500",
      path: "/dashboard/modules/finance/transaction-history",
    },
    {
      title: "Allocate Budget",
      icon: FaMoneyBillWave,
      color: "bg-purple-500",
      path: "/dashboard/modules/finance/budget-allocation",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner variant="white-green" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-400/15 to-sky-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-amber-400/15 to-orange-400/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="relative z-10 px-6 py-14">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl mb-6">
              <FaCalculator className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
              Financial Management
            </h1>
            <p className="text-gray-600 mt-3">
              Comprehensive financial tools and transaction management
            </p>
          </div>
        </div>
      </div>

      {/* Features - glass cards with dynamic palettes */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {financialFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            const palettes = [
              {
                bg: "from-emerald-50 to-teal-50",
                overlay: "from-emerald-500 via-teal-500 to-cyan-500",
                iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
                badge: "from-emerald-500 to-teal-500",
                text: "text-emerald-600",
              },
              {
                bg: "from-blue-50 to-indigo-50",
                overlay: "from-blue-500 via-indigo-500 to-purple-500",
                iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
                badge: "from-blue-500 to-indigo-500",
                text: "text-indigo-600",
              },
              {
                bg: "from-amber-50 to-orange-50",
                overlay: "from-amber-500 via-orange-500 to-rose-500",
                iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
                badge: "from-amber-500 to-orange-500",
                text: "text-orange-600",
              },
            ];
            const palette = palettes[index % palettes.length];
            return (
              <div
                key={feature.title}
                className="group cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div
                  className={`relative bg-gradient-to-br ${palette.bg} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 backdrop-blur-sm`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${palette.overlay} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`p-4 rounded-2xl ${palette.iconBg} shadow-lg`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                          {feature.status}
                        </span>
                        <span
                          className={`px-3 py-1 bg-gradient-to-r ${palette.badge} text-white rounded-full text-xs font-semibold`}
                        >
                          {feature.badge}
                        </span>
                      </div>
                    </div>
                    <h3
                      className={`text-2xl font-bold text-gray-900 mb-4 group-hover:${palette.text} transition-colors`}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <div
                      className={`flex items-center font-medium ${palette.text}`}
                    >
                      <span>Explore</span>
                      <svg
                        className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions - glass */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.title}
                  className="group flex items-center p-6 rounded-2xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 transform hover:scale-105"
                  onClick={() => navigate(action.path)}
                >
                  <div
                    className={`p-3 rounded-xl ${action.color} mr-4 shadow-lg`}
                  >
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-semibold group-hover:text-emerald-700 transition-colors">
                    {action.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement;
