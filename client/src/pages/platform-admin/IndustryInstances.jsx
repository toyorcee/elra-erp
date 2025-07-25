import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  EyeIcon,
  TrashIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import {
  getIndustryInstances,
  deleteIndustryInstance,
  resendInvitation,
  getInstanceStats,
} from "../../services/industryInstances";

const IndustryInstances = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const response = await getIndustryInstances();

      // Check if response is successful and has data
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setInstances(response.data.data);

        const statsData = {};
        for (const instance of response.data.data) {
          try {
            const statsResponse = await getInstanceStats(instance._id);
            if (statsResponse.data && statsResponse.data.success) {
              statsData[instance._id] = statsResponse.data.data.stats;
            }
          } catch (error) {
            console.error("Error fetching stats for instance:", instance._id);
          }
        }
        setStats(statsData);
      } else {
        console.error("Invalid response structure:", response);
        setInstances([]);
      }
    } catch (error) {
      console.error("Error fetching instances:", error);
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to deactivate this instance?")) {
      try {
        await deleteIndustryInstance(id);
        fetchInstances();
      } catch (error) {
        console.error("Error deleting instance:", error);
      }
    }
  };

  const handleResendInvitation = async (id) => {
    try {
      await resendInvitation(id);
      alert("Invitation sent successfully!");
    } catch (error) {
      console.error("Error resending invitation:", error);
      alert("Error sending invitation");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "pending_setup":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "inactive":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getIndustryIcon = (industryType) => {
    switch (industryType) {
      case "court_system":
        return "⚖️";
      case "banking_system":
        return "🏦";
      case "healthcare_system":
        return "🏥";
      case "manufacturing_system":
        return "🏭";
      default:
        return "🏢";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">
                Industry Instances
              </h1>
              <p className="text-white/80 text-lg">
                Manage your created industry-specific EDMS platforms
              </p>
            </div>
            <Link to="/platform-admin/create-instance">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Instance</span>
              </motion.button>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/20 shadow-xl"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-300" />
                </div>
                <div className="ml-4">
                  <p className="text-white/70 font-medium">Total Instances</p>
                  <p className="text-3xl font-bold text-white">
                    {instances.length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/20 shadow-xl"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-green-300 text-xl font-bold">✓</span>
                </div>
                <div className="ml-4">
                  <p className="text-white/70 font-medium">Active</p>
                  <p className="text-3xl font-bold text-white">
                    {Array.isArray(instances)
                      ? instances.filter((i) => i.status === "active").length
                      : 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/20 shadow-xl"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-yellow-300 text-xl font-bold">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-white/70 font-medium">Pending Setup</p>
                  <p className="text-3xl font-bold text-white">
                    {Array.isArray(instances)
                      ? instances.filter((i) => i.status === "pending_setup")
                          .length
                      : 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/20 shadow-xl"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-purple-300" />
                </div>
                <div className="ml-4">
                  <p className="text-white/70 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-white">
                    {Object.values(stats).reduce(
                      (sum, stat) => sum + (stat?.totalUsers || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Instances List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white">All Instances</h3>
            </div>

            <div className="divide-y divide-white/10">
              {Array.isArray(instances) &&
                instances.map((instance, index) => (
                  <motion.div
                    key={instance._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-8 hover:bg-white/5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="text-4xl">
                          {getIndustryIcon(instance.industryType)}
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-white mb-2">
                            {instance.name}
                          </h4>
                          <p className="text-white/80 text-lg mb-4">
                            {instance.description}
                          </p>
                          <div className="flex items-center space-x-6">
                            <span
                              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                                instance.status
                              )}`}
                            >
                              {instance.status.replace("_", " ")}
                            </span>
                            <div className="flex items-center text-white/60">
                              <CalendarIcon className="h-5 w-5 mr-2" />
                              <span className="text-lg">
                                {new Date(
                                  instance.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Stats Display */}
                        {stats[instance._id] && (
                          <div className="text-right mr-6">
                            <div className="text-white/80 text-lg">
                              {stats[instance._id].totalUsers} users
                            </div>
                            <div className="text-white/80 text-lg">
                              {stats[instance._id].totalDocuments} documents
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleResendInvitation(instance._id)}
                            className="p-3 text-white/60 hover:text-blue-300 hover:bg-blue-500/20 rounded-xl transition-all duration-300"
                            title="Resend invitation"
                          >
                            <EnvelopeIcon className="h-6 w-6" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              window.open(
                                `/platform-admin/instances/${instance._id}`,
                                "_blank"
                              )
                            }
                            className="p-3 text-white/60 hover:text-green-300 hover:bg-green-500/20 rounded-xl transition-all duration-300"
                            title="View details"
                          >
                            <EyeIcon className="h-6 w-6" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(instance._id)}
                            className="p-3 text-white/60 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-300"
                            title="Delete instance"
                          >
                            <TrashIcon className="h-6 w-6" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Super Admin Info */}
                    <div className="mt-6 pl-16">
                      <div className="flex items-center text-white/80 text-lg">
                        <UserIcon className="h-5 w-5 mr-3" />
                        <span>
                          Super Admin: {instance.superAdmin.firstName}{" "}
                          {instance.superAdmin.lastName} (
                          {instance.superAdmin.email})
                        </span>
                        {instance.superAdmin.setupCompleted && (
                          <span className="ml-4 text-green-300 font-semibold">
                            ✓ Setup Complete
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>

            {instances.length === 0 && (
              <div className="p-16 text-center">
                <BuildingOfficeIcon className="h-20 w-20 text-white/40 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">
                  No instances created yet
                </h3>
                <p className="text-white/80 text-lg mb-8 max-w-md mx-auto">
                  Get started by creating your first industry instance and begin
                  managing documents for different organizations
                </p>
                <Link to="/platform-admin/create-instance">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Create First Instance</span>
                    <ArrowRightIcon className="h-5 w-5" />
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default IndustryInstances;
