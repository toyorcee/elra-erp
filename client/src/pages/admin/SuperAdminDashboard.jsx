import React, { useState, useEffect } from "react";
import {
  GradientSpinner,
  StatCardGrid,
  StatCard,
} from "../../components/common";
import * as HiIcons from "react-icons/hi";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    totalDepartments: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        // const response = await superAdminAPI.getSystemStats();
        // setStats(response.data);

        // Mock data for now
        setTimeout(() => {
          setStats({
            totalUsers: 156,
            totalDocuments: 1247,
            totalDepartments: 8,
            pendingApprovals: 23,
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching system stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <GradientSpinner
          size="lg"
          variant="primary"
          text="Loading system stats..."
        />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: "HiOutlineUsers",
      color: "from-blue-500 to-cyan-500",
      trend: "up",
      trendValue: "+12%",
      description: "Active system users",
    },
    {
      title: "Total Documents",
      value: stats.totalDocuments,
      icon: "HiOutlineDocumentText",
      color: "from-green-500 to-emerald-500",
      trend: "up",
      trendValue: "+8%",
      description: "Documents in system",
    },
    {
      title: "Departments",
      value: stats.totalDepartments,
      icon: "HiOutlineBuildingOffice2",
      color: "from-purple-500 to-pink-500",
      description: "Active departments",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: "HiOutlineClock",
      color: "from-orange-500 to-red-500",
      trend: "down",
      trendValue: "-5%",
      description: "Awaiting approval",
    },
  ];

  const quickActions = [
    {
      title: "System Settings",
      description: "Configure system parameters",
      icon: "HiOutlineCog6Tooth",
      href: "/admin/settings",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Manage Departments",
      description: "Create and manage departments",
      icon: "HiOutlineBuildingOffice2",
      href: "/admin/departments",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "User Management",
      description: "Manage system users",
      icon: "HiOutlineUsers",
      href: "/admin/users",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Role Management",
      description: "Configure user roles",
      icon: "HiOutlineKey",
      href: "/admin/roles",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-6">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <HiIcons.HiOutlineShieldCheck className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Super Admin Dashboard</h1>
              <p className="text-slate-300 text-lg">
                System overview and management
              </p>
            </div>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300">System Online</span>
            </div>
            <div className="w-px h-4 bg-slate-600"></div>
            <span className="text-slate-400">Real-time monitoring active</span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-2xl"></div>
      </div>

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
                {(() => {
                  const IconComponent = HiIcons[stat.icon];
                  return <IconComponent className="w-6 h-6" />;
                })()}
              </div>
              {stat.trend && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <HiIcons.HiOutlineTrendingUp className="w-4 h-4" />
                  ) : (
                    <HiIcons.HiOutlineTrendingDown className="w-4 h-4" />
                  )}
                  {stat.trendValue}
                </div>
              )}
            </div>

            <div className="mb-2">
              <h3 className="text-2xl font-bold text-slate-800">
                {stat.value.toLocaleString()}
              </h3>
              <p className="text-slate-600 font-medium">{stat.title}</p>
            </div>

            <p className="text-sm text-slate-500">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
              <HiIcons.HiOutlineBolt className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="group p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white/50 hover:bg-white/80"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white shadow-md group-hover:shadow-lg transition-shadow duration-300`}
                  >
                    {(() => {
                      const IconComponent = HiIcons[action.icon];
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <HiIcons.HiOutlineServer className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">System Status</h3>
          </div>

          <div className="space-y-6">
            {[
              {
                name: "Database",
                status: "Online",
                color: "green",
                icon: "HiOutlineDatabase",
              },
              {
                name: "File Storage",
                status: "Healthy",
                color: "green",
                icon: "HiOutlineCloud",
              },
              {
                name: "Email Service",
                status: "Active",
                color: "green",
                icon: "HiOutlineMail",
              },
              {
                name: "API Gateway",
                status: "Operational",
                color: "green",
                icon: "HiOutlineGlobe",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {(() => {
                      const IconComponent = HiIcons[service.icon];
                      return (
                        <IconComponent className="w-5 h-5 text-slate-600" />
                      );
                    })()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{service.name}</p>
                    <p className="text-sm text-slate-500">Service status</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 bg-${service.color}-500 rounded-full animate-pulse`}
                  ></div>
                  <span
                    className={`text-${service.color}-600 font-medium text-sm`}
                  >
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <HiIcons.HiOutlineClock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Recent Activity</h3>
        </div>

        <div className="space-y-4">
          {[
            {
              action: "New user registered",
              time: "2 minutes ago",
              user: "john.doe@company.com",
            },
            {
              action: "Document uploaded",
              time: "5 minutes ago",
              user: "jane.smith@company.com",
            },
            {
              action: "Department created",
              time: "10 minutes ago",
              user: "admin@edms.com",
            },
            {
              action: "System backup completed",
              time: "1 hour ago",
              user: "System",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/50 border border-slate-200"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{activity.action}</p>
                <p className="text-sm text-slate-500">by {activity.user}</p>
              </div>
              <span className="text-sm text-slate-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
