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
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
            <FaMoneyBillWave className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payroll Management
            </h1>
            <p className="text-gray-600">
              Comprehensive payroll processing, management, and reporting system
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Payroll Management
        </h2>
        <p className="text-gray-600">
          Process payroll, manage employee compensation, and generate
          comprehensive reports for better financial management.
        </p>
      </div>

      {/* Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {payrollFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={feature.title}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 group"
              onClick={() => navigate(feature.path)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        feature.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : feature.status === "Available"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {feature.status}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {feature.badge}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <span>Access Feature</span>
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

      {/* Quick Actions Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.title}
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                onClick={() => (window.location.href = action.path)}
              >
                <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium group-hover:text-green-600 transition-colors">
                  {action.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;
