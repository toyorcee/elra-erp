import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaUsers,
  FaChartLine,
  FaCog,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";

const PayrollManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const payrollFeatures = [
    {
      title: "Payroll Processing",
      description:
        "Process monthly payroll, calculate salaries, and generate payslips",
      icon: FaMoneyBillWave,
      path: "/dashboard/modules/payroll/processing",
      badge: "Core Feature",
    },
    {
      title: "Payslips",
      description:
        "View, generate, and manage employee payslips and salary statements",
      icon: FaFileInvoiceDollar,
      path: "/dashboard/modules/payroll/payslips",
      badge: "Documents",
    },
    {
      title: "Salary Grade Management",
      description: "Manage salary grades, scales, and compensation structures",
      icon: FaUsers,
      path: "/dashboard/modules/payroll/salary-grades",
      badge: "Management",
    },
    {
      title: "Performance Allowances",
      description: "Manage performance-based allowances and bonuses",
      icon: FaChartLine,
      path: "/dashboard/modules/payroll/allowances",
      badge: "Performance",
    },
    {
      title: "Performance Bonuses",
      description: "Calculate and manage performance bonuses and incentives",
      icon: FaCheckCircle,
      path: "/dashboard/modules/payroll/bonuses",
      badge: "Bonuses",
    },
    {
      title: "Deductions Management",
      description: "Manage salary deductions, taxes, and other withholdings",
      icon: FaCog,
      path: "/dashboard/modules/payroll/deductions",
      badge: "Deductions",
    },
    {
      title: "View Employee",
      description: "View detailed employee payroll information and history",
      icon: FaEye,
      path: "/dashboard/modules/payroll/view-employee",
      badge: "Information",
    },
    {
      title: "Payroll Alerts",
      description:
        "Monitor payroll deadlines, approvals, and important notifications",
      icon: FaExclamationTriangle,
      path: "/dashboard/modules/payroll/alerts",
      badge: "Monitoring",
    },
    {
      title: "Payroll Calendar",
      description: "Track payroll schedules, deadlines, and processing dates",
      icon: FaClock,
      path: "/dashboard/modules/payroll/calendar",
      badge: "Scheduling",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-lg mb-6">
            <FaMoneyBillWave className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Payroll Management
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive payroll processing, management, and reporting system
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payrollFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <IconComponent className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-semibold">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {feature.description}
                </p>
                <div className="flex items-center text-emerald-600 font-medium text-sm">
                  <span>Explore</span>
                  <svg
                    className="ml-2 h-4 w-4"
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;
