import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  FaHeadset,
  FaTicketAlt,
  FaChartBar,
  FaFileAlt,
  FaPlus,
} from "react-icons/fa";

const CustomerCareModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCustomerCareUser =
    user?.department?.name === "Customer Service" ||
    user?.department?.name === "Customer Care";

  const customerCareFeatures = [
    {
      title: "Overview",
      description: "Customer care overview and key metrics",
      icon: FaChartBar,
      path: "/dashboard/modules/customer-care/overview",
      badge: "Overview",
    },
    {
      title: "All Complaints",
      description: "View and manage all staff complaints",
      icon: FaTicketAlt,
      path: "/dashboard/modules/customer-care/complaints",
      badge: "Complaints",
      hidden: !isCustomerCareUser,
    },
    {
      title: "Complaint Management",
      description: "Manage and assign complaints to team members",
      icon: FaHeadset,
      path: "/dashboard/modules/customer-care/management",
      badge: "Management",
      hidden: !isCustomerCareUser,
    },
    {
      title: "Submit Complaint",
      description: "Submit a new complaint or service request",
      icon: FaPlus,
      path: "/dashboard/modules/customer-care/submit-complaint",
      badge: "Submit",
      hidden: isCustomerCareUser,
    },
    {
      title: "My Complaints",
      description: "View your submitted complaints and their status",
      icon: FaTicketAlt,
      path: "/dashboard/modules/customer-care/my-complaints",
      badge: "My Tickets",
      hidden: isCustomerCareUser,
    },
    {
      title: "Reports",
      description: "View customer care reports and analytics",
      icon: FaFileAlt,
      path: "/dashboard/modules/customer-care/reports",
      badge: "Reports",
      hidden: !isCustomerCareUser,
    },
  ].filter((feature) => !feature.hidden);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-lg mb-6">
            <FaHeadset className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Customer Care
          </h1>
          <p className="text-lg text-gray-600">
            {isCustomerCareUser
              ? "Manage customer support, tickets, and service requests"
              : "Submit complaints and get help from our Customer Care team"}
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customerCareFeatures.map((feature) => {
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

export default CustomerCareModule;
