import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BuildingOffice2Icon,
  PlusCircleIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { getPlatformStatistics } from "../../services/platformAdmin";

const PlatformAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    totalSuperadmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getPlatformStatistics();
      if (response.data.success) {
        setStats(response.data.data.overview);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Failed to fetch platform statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    fetchStats();
  };

  const statCards = [
    {
      title: "Total Companies",
      value: stats.totalCompanies,
      color: "from-blue-500 to-cyan-500",
      icon: BuildingOffice2Icon,
      description: "Registered companies",
    },
    {
      title: "Active Superadmins",
      value: stats.totalSuperadmins,
      color: "from-green-500 to-emerald-500",
      icon: UsersIcon,
      description: "Platform superadmins",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      color: "from-purple-500 to-pink-500",
      icon: ChartBarIcon,
      description: "All platform users",
    },
    {
      title: "Platform Usage",
      value: `${Math.round((stats.totalCompanies / 10) * 100)}%`,
      color: "from-orange-500 to-red-500",
      icon: ChartBarIcon,
      description: "Platform utilization",
    },
  ];

  const quickActions = [
    {
      title: "Industry Instances",
      description: "View and manage all industry instances",
      href: "/platform-admin/instances",
      color: "from-blue-500 to-cyan-500",
      icon: BuildingOffice2Icon,
    },
    {
      title: "Create Industry Instance",
      description: "Create a new industry-specific EDMS platform",
      href: "/platform-admin/create-instance",
      color: "from-green-500 to-emerald-500",
      icon: PlusCircleIcon,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading platform statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="w-10 h-10 bg-blue-400/20 rounded-lg"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Platform Admin Dashboard
                </h1>
                <p className="text-slate-300 text-lg">
                  Manage companies and superadmins for the EDMS platform
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
              title="Refresh dashboard"
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300">Platform Online</span>
            </div>
            <div className="w-px h-4 bg-slate-600"></div>
            <span className="text-slate-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-lg`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>

            <div className="mb-2">
              <h3 className="text-2xl font-bold text-slate-800">
                {stat.value}
              </h3>
              <p className="text-slate-600 font-medium">{stat.title}</p>
            </div>

            <p className="text-sm text-slate-500">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {action.title}
                </h3>
                <p className="text-slate-600 mb-4">{action.description}</p>
              </div>
              <div
                className={`p-4 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <action.icon className="h-8 w-8" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PlatformAdminDashboard;
