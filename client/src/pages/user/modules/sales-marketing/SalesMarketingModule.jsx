import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { FaChartBar, FaDollarSign, FaCheckCircle } from "react-icons/fa";

const SalesMarketingModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

    if (item.hidden && typeof item.hidden === "function") {
      return !item.hidden(user);
    }

    return true;
  };

  const salesMarketingFeatures = [
    {
      title: "Overview",
      description: "Overview of sales and marketing performance",
      icon: FaChartBar,
      path: "/dashboard/modules/sales/overview",
      badge: "Overview",
      required: { minLevel: 300 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSalesMarketing = userDepartment === "Sales & Marketing";
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";
        const isExecutive =
          user?.role?.level === 700 && userDepartment === "Executive Office";

        return !(
          isSalesMarketing ||
          isSuperAdmin ||
          isFinanceHOD ||
          isExecutive
        );
      },
    },
    {
      title: "Transactions",
      description: "Create and manage sales & marketing transactions",
      icon: FaDollarSign,
      path: "/dashboard/modules/sales/transactions",
      badge: "Transactions",
      required: { minLevel: 300 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSalesMarketing = userDepartment === "Sales & Marketing";
        const isSuperAdmin = user?.role?.level === 1000;

        return !(isSalesMarketing || isSuperAdmin);
      },
    },
    {
      title: "Approvals",
      description: "Review and approve sales & marketing transactions",
      icon: FaCheckCircle,
      path: "/dashboard/modules/sales/approvals",
      badge: "Approvals",
      required: { minLevel: 700 },
      hidden: (user) => {
        const userDepartment = user?.department?.name;
        const isSuperAdmin = user?.role?.level === 1000;
        const isFinanceHOD =
          user?.role?.level === 700 &&
          userDepartment === "Finance & Accounting";
        const isSalesMarketingHOD =
          user?.role?.level === 700 && userDepartment === "Sales & Marketing";

        return !(isSuperAdmin || isFinanceHOD || isSalesMarketingHOD);
      },
    },
  ].filter(hasAccess);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-lg mb-6">
            <FaChartBar className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sales & Marketing
          </h1>
          <p className="text-lg text-gray-600">
            Manage sales transactions, track marketing campaigns, and build
            strong customer relationships.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesMarketingFeatures.map((feature) => {
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

export default SalesMarketingModule;
