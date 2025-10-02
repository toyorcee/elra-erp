import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { GradientSpinner } from "../../../../components/common";
import {
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaUsers,
  FaChartLine,
  FaCog,
  FaPlus,
  FaEdit,
  FaEye,
  FaDownload,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";

const PayrollManagement = () => {
  const { user } = useAuth();
  const { module } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const payrollFeatures = [
    {
      title: "Payroll Processing",
      description:
        "Process monthly payroll, calculate salaries, and generate payslips",
      icon: FaMoneyBillWave,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      path: "/dashboard/modules/payroll/processing",
      status: "Active",
      badge: "Core Feature",
    },
    {
      title: "Payslips",
      description:
        "View, generate, and manage employee payslips and salary statements",
      icon: FaFileInvoiceDollar,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
      path: "/dashboard/modules/payroll/payslips",
      status: "Active",
      badge: "Documents",
    },
    {
      title: "Salary Grade Management",
      description: "Manage salary grades, scales, and compensation structures",
      icon: FaUsers,
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      path: "/dashboard/modules/payroll/salary-grades",
      status: "Active",
      badge: "Management",
    },
    {
      title: "Performance Allowances",
      description: "Manage performance-based allowances and bonuses",
      icon: FaChartLine,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      path: "/dashboard/modules/payroll/allowances",
      status: "Active",
      badge: "Performance",
    },
    {
      title: "Performance Bonuses",
      description: "Calculate and manage performance bonuses and incentives",
      icon: FaCheckCircle,
      color: "bg-gradient-to-br from-indigo-500 to-blue-600",
      path: "/dashboard/modules/payroll/bonuses",
      status: "Active",
      badge: "Bonuses",
    },
    {
      title: "Deductions Management",
      description: "Manage salary deductions, taxes, and other withholdings",
      icon: FaCog,
      color: "bg-gradient-to-br from-teal-500 to-green-600",
      path: "/dashboard/modules/payroll/deductions",
      status: "Active",
      badge: "Deductions",
    },
    {
      title: "View Employee",
      description: "View detailed employee payroll information and history",
      icon: FaEye,
      color: "bg-gradient-to-br from-cyan-500 to-blue-600",
      path: "/dashboard/modules/payroll/view-employee",
      status: "Active",
      badge: "Information",
    },
    {
      title: "Payroll Alerts",
      description:
        "Monitor payroll deadlines, approvals, and important notifications",
      icon: FaExclamationTriangle,
      color: "bg-gradient-to-br from-red-500 to-pink-600",
      path: "/dashboard/modules/payroll/alerts",
      status: "Active",
      badge: "Monitoring",
    },
    {
      title: "Payroll Calendar",
      description: "Track payroll schedules, deadlines, and processing dates",
      icon: FaClock,
      color: "bg-gradient-to-br from-amber-500 to-yellow-600",
      path: "/dashboard/modules/payroll/calendar",
      status: "Active",
      badge: "Scheduling",
    },
  ];

  // Quick Actions should match the available feature cards
  const quickActions = payrollFeatures.slice(0, 3).map((feature) => ({
    title: feature.title,
    icon: feature.icon,
    color: "bg-blue-500",
    path: feature.path,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner variant="white-green" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Hero - classy animated background */}
      <div className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-400/15 to-sky-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-amber-400/15 to-orange-400/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="relative z-10 px-6 py-14">
          <div className="w-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl mb-6">
              <FaMoneyBillWave className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
              Payroll Management
            </h1>
            <p className="text-gray-600 mt-3">
              Comprehensive payroll processing, management, and reporting system
            </p>
          </div>
        </div>
      </div>

      {/* Intro - centered */}
      <div className="px-6">
        <div className="w-full text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Payroll Management
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Process payroll, manage employee compensation, and generate
            comprehensive reports for better financial management.
          </p>
        </div>
      </div>

      {/* Core Features - glass cards with dynamic colors */}
      <div className="px-6">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {payrollFeatures.map((feature, index) => {
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
              {
                bg: "from-fuchsia-50 to-purple-50",
                overlay: "from-fuchsia-500 via-purple-500 to-violet-500",
                iconBg: "bg-gradient-to-br from-fuchsia-500 to-purple-600",
                badge: "from-fuchsia-500 to-purple-500",
                text: "text-purple-600",
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
        <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
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

export default PayrollManagement;
