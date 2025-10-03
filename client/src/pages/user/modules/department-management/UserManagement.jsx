import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ClockIcon as ClockIconSolid,
} from "@heroicons/react/24/solid";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import { formatDate } from "../../../../utils/formatters";
import { getDepartmentUsers } from "../../../../services/users";
import defaultAvatar from "../../../../assets/defaulticon.jpg";

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch department users
  const fetchDepartmentUsers = async () => {
    try {
      setLoading(true);
      const result = await getDepartmentUsers();

      if (result.success) {
        setUsers(result.data);
      } else {
        console.error("Failed to fetch department users:", result.message);
      }
    } catch (error) {
      console.error("Error fetching department users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentUsers();
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .modal-shadow-enhanced {
        box-shadow: 
          0 25px 50px -12px rgba(0, 0, 0, 0.25),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          0 0 40px rgba(0, 0, 0, 0.1);
        animation: modalAppear 0.3s ease-out;
      }
      .modal-backdrop-enhanced {
        backdrop-filter: blur(8px);
        background: rgba(0, 0, 0, 0.6);
        animation: backdropAppear 0.3s ease-out;
      }
      @keyframes modalAppear {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes backdropAppear {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Image utility functions
  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return getDefaultAvatar();
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${avatarPath}`;
  };

  const getAvatarDisplay = (user) => {
    if (user.avatar) {
      return (
        <img
          src={getImageUrl(user.avatar)}
          alt={`${user.firstName} ${user.lastName}`}
          className="h-10 w-10 rounded-full object-cover"
          onError={(e) => {
            e.target.src = getDefaultAvatar();
          }}
        />
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-[var(--elra-primary)] flex items-center justify-center">
        <UserIcon className="h-6 w-6 text-white" />
      </div>
    );
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    const matchesRole =
      roleFilter === "all" || user.role?.level === parseInt(roleFilter);

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case "ACTIVE":
        return {
          color: "text-green-600 bg-green-100",
          icon: CheckCircleIconSolid,
          label: "Active",
        };
      case "INACTIVE":
        return {
          color: "text-red-600 bg-red-100",
          icon: XCircleIconSolid,
          label: "Inactive",
        };
      case "PENDING_REGISTRATION":
        return {
          color: "text-yellow-600 bg-yellow-100",
          icon: ClockIconSolid,
          label: "Pending Registration",
        };
      case "SUSPENDED":
        return {
          color: "text-red-600 bg-red-100",
          icon: XCircleIconSolid,
          label: "Suspended",
        };
      case "PENDING_OFFBOARDING":
        return {
          color: "text-orange-600 bg-orange-100",
          icon: ClockIconSolid,
          label: "Pending Offboarding",
        };
      default:
        return {
          color: "text-gray-600 bg-gray-100",
          icon: ClockIconSolid,
          label: "Unknown",
        };
    }
  };

  // Get role level display
  const getRoleLevelDisplay = (level) => {
    switch (level) {
      case 1000:
        return "Super Admin";
      case 700:
        return "HOD";
      case 600:
        return "Manager";
      case 300:
        return "Staff";
      case 100:
        return "Viewer";
      default:
        return "Unknown";
    }
  };

  // Handle view user
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Table columns
  const columns = [
    {
      header: "User",
      accessor: "user",
      width: "w-64",
      renderer: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">{getAvatarDisplay(row)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {row.position || row.jobTitle || "No position"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: "contact",
      width: "w-48",
      renderer: (row) => (
        <div>
          <p className="text-sm text-gray-900 break-all">{row.email}</p>
          {row.phone && <p className="text-sm text-gray-500">{row.phone}</p>}
        </div>
      ),
    },
    {
      header: "Role",
      accessor: "role",
      width: "w-32",
      renderer: (row) => (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getRoleLevelDisplay(row.role?.level)}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      width: "w-32",
      renderer: (row) => {
        const statusInfo = getStatusInfo(row.status);
        const StatusIcon = statusInfo.icon;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      header: "Last Login",
      accessor: "lastLogin",
      width: "w-32",
      renderer: (row) => (
        <div className="text-sm text-gray-900">
          {row.lastLogin ? formatDate(row.lastLogin) : "Never"}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-gray-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                className="p-3 bg-[var(--elra-primary)] rounded-xl"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <UserGroupIcon className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Department Users
                </h1>
                <p className="text-gray-600">
                  View and manage users in{" "}
                  {user?.department?.name || "your department"}
                </p>
              </div>
            </div>
            <motion.div
              className="text-sm text-gray-500"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </motion.div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
              />
            </div>
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] appearance-none"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING_REGISTRATION">
                  Pending Registration
                </option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING_OFFBOARDING">Pending Offboarding</option>
              </select>
            </div>
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] appearance-none"
              >
                <option value="all">All Roles</option>
                <option value="700">HOD</option>
                <option value="600">Manager</option>
                <option value="300">Staff</option>
                <option value="100">Viewer</option>
              </select>
            </div>
            <motion.button
              onClick={fetchDepartmentUsers}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <DataTable
            data={filteredUsers}
            columns={columns}
            loading={loading}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
              customActions: (row) => (
                <div className="flex space-x-2">
                  <motion.button
                    onClick={() => handleViewUser(row)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </motion.button>
                </div>
              ),
            }}
            emptyState={{
              icon: <UserGroupIcon className="h-12 w-12 text-gray-400" />,
              title: "No users found",
              description: "No users match your current filters.",
            }}
          />
        </motion.div>

        {/* User Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedUser && (
            <motion.div
              className="fixed inset-0 modal-backdrop-enhanced flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto modal-shadow-enhanced border border-gray-100"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              >
                {/* ELRA Branded Header */}
                <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl -m-8 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                        {selectedUser.avatar ? (
                          <img
                            className="w-8 h-8 rounded-full object-cover"
                            src={getImageUrl(selectedUser.avatar)}
                            alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                            onError={(e) => {
                              e.target.src = getDefaultAvatar();
                            }}
                          />
                        ) : (
                          <UserIcon className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </h2>
                        <p className="text-white/80 text-sm">
                          {selectedUser.position ||
                            selectedUser.jobTitle ||
                            "No position"}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Basic Information */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Employee ID
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {selectedUser.employeeId || "Not assigned"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Username
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {selectedUser.username}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Status
                      </label>
                      <div className="mt-1">
                        {(() => {
                          const statusInfo = getStatusInfo(selectedUser.status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      <EnvelopeIcon className="w-5 h-5 mr-2" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Email
                        </label>
                        <p className="text-gray-900 break-all">
                          {selectedUser.email}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Phone
                        </label>
                        <p className="text-gray-900">
                          {selectedUser.phone || "Not provided"}
                        </p>
                      </div>
                      {selectedUser.address && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-600">
                            Address
                          </label>
                          <p className="text-gray-900">
                            {typeof selectedUser.address === "string"
                              ? selectedUser.address
                              : `${selectedUser.address.street || ""}, ${
                                  selectedUser.address.city || ""
                                }, ${selectedUser.address.state || ""}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role & Department Information */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                      <BriefcaseIcon className="w-5 h-5 mr-2" />
                      Role & Department
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Role Level
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {getRoleLevelDisplay(selectedUser.role?.level)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Department
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {selectedUser.department?.name || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Position
                        </label>
                        <p className="text-gray-900">
                          {selectedUser.position || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Job Title
                        </label>
                        <p className="text-gray-900">
                          {selectedUser.jobTitle || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Information */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      Activity Information
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Last Login
                        </label>
                        <p className="text-gray-900">
                          {selectedUser.lastLogin
                            ? formatDate(selectedUser.lastLogin)
                            : "Never"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Email Verified
                        </label>
                        <p className="text-gray-900">
                          {selectedUser.isEmailVerified ? (
                            <span className="text-green-600 font-semibold">
                              Yes
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              No
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Account Status
                        </label>
                        <p className="text-gray-900">
                          {selectedUser.isActive ? (
                            <span className="text-green-600 font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              Inactive
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Online Status
                        </label>
                        <p className="text-gray-900">
                          {selectedUser.isOnline ? (
                            <span className="text-green-600 font-semibold">
                              Online
                            </span>
                          ) : (
                            <span className="text-gray-600 font-semibold">
                              Offline
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(selectedUser.bio ||
                    selectedUser.skills ||
                    selectedUser.education) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <UserIcon className="w-5 h-5 mr-2" />
                        Additional Information
                      </h4>
                      <div className="space-y-4">
                        {selectedUser.bio && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Bio
                            </label>
                            <p className="text-gray-900 mt-1">
                              {selectedUser.bio}
                            </p>
                          </div>
                        )}
                        {selectedUser.skills && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Skills
                            </label>
                            <p className="text-gray-900 mt-1">
                              {selectedUser.skills}
                            </p>
                          </div>
                        )}
                        {selectedUser.education && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Education
                            </label>
                            <p className="text-gray-900 mt-1">
                              {selectedUser.education}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default UserManagement;
