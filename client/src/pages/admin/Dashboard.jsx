import React, { useState, useEffect } from "react";
import {
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiOutlineChartBar,
  HiOutlineEye,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { getSystemOverview } from "../../services/superAdmin";
import { Link } from "react-router-dom";
import { StatsSkeleton, GridSkeleton } from "../../components/skeleton";

const AdminDashboard = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await getSystemOverview();
      setOverviewData(response.data);
    } catch (error) {
      toast.error("Failed to fetch system overview");
      console.error("Error fetching overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      title: "User Management",
      description: "Manage system users, roles, and permissions",
      icon: HiOutlineUsers,
      path: "/dashboard/admin/users",
      color: "bg-blue-500",
      stats: overviewData?.overview?.totalUsers || 0,
      statLabel: "Total Users",
    },
    {
      title: "Department Management",
      description: "Create and manage organizational departments",
      icon: HiOutlineBuildingOffice2,
      path: "/dashboard/admin/departments",
      color: "bg-green-500",
      stats: overviewData?.overview?.totalDepartments || 0,
      statLabel: "Departments",
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings and policies",
      icon: HiOutlineCog,
      path: "/dashboard/admin/settings",
      color: "bg-purple-500",
      stats: "Configure",
      statLabel: "Settings",
    },
  ];

  const quickStats = [
    {
      label: "Total Users",
      value: overviewData?.overview?.totalUsers || 0,
      icon: HiOutlineUsers,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Departments",
      value: overviewData?.overview?.totalDepartments || 0,
      icon: HiOutlineBuildingOffice2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Documents",
      value: overviewData?.overview?.totalDocuments || 0,
      icon: HiOutlineDocumentText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Active Roles",
      value: overviewData?.overview?.totalRoles || 0,
      icon: HiOutlineShieldCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <StatsSkeleton items={4} className="mb-8" />
        <GridSkeleton items={3} columns={3} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <HiOutlineShieldCheck className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              System administration and management
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Modules */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Administration Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module, index) => (
            <Link
              key={index}
              to={module.path}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 ${module.color} rounded-lg group-hover:scale-110 transition-transform`}
                >
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <HiOutlineEye className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {module.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{module.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {module.statLabel}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {module.stats}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {overviewData?.recentActivity && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Users
            </h3>
            <div className="space-y-3">
              {overviewData.recentActivity.users
                ?.slice(0, 5)
                .map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Documents
            </h3>
            <div className="space-y-3">
              {overviewData.recentActivity.documents
                ?.slice(0, 5)
                .map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{doc.title}</p>
                      <p className="text-sm text-gray-600">
                        by {doc.uploadedBy?.name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
