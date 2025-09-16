import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { userModulesAPI } from "../../../../../services/userModules";
import {
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import defaultAvatar from "../../../../../assets/defaulticon.jpg";
import ELRALogo from "../../../../../components/ELRALogo";

const OnboardingManagement = () => {
  const { user } = useAuth();
  const [lifecycles, setLifecycles] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    department: "",
  });
  const [departments, setDepartments] = useState([]);
  const [allLifecycles, setAllLifecycles] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching lifecycle data");

      // Fetch all onboarding lifecycles without filters
      const onboardingFilters = { type: "Onboarding" };

      const [lifecyclesRes, statsRes] = await Promise.all([
        userModulesAPI.employeeLifecycle.getAll(onboardingFilters),
        userModulesAPI.employeeLifecycle.getStats(),
      ]);

      console.log("📊 Lifecycles response:", lifecyclesRes);
      console.log("📈 Stats response:", statsRes);

      const lifecyclesData = lifecyclesRes.data.docs || [];
      setAllLifecycles(lifecyclesData);
      setLifecycles(lifecyclesData);
      setStats(statsRes.data);

      // Group lifecycles by user
      const grouped = groupLifecyclesByUser(lifecyclesData);
      setGroupedUsers(grouped);
    } catch (error) {
      console.error("Error fetching lifecycle data:", error);
      toast.error("Failed to fetch lifecycle data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDepartments();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchDepartments = async () => {
    try {
      const response = await userModulesAPI.departments.getAllDepartments();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Filter lifecycles based on search criteria
  const filteredLifecycles = useMemo(() => {
    if (!allLifecycles.length) return [];

    return allLifecycles.filter((lifecycle) => {
      const employee = lifecycle.employee;
      const department = lifecycle.department;

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const employeeName =
          `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const employeeEmail = employee.email?.toLowerCase() || "";
        const employeeId = employee.employeeId?.toLowerCase() || "";

        if (
          !employeeName.includes(searchTerm) &&
          !employeeEmail.includes(searchTerm) &&
          !employeeId.includes(searchTerm)
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.status && lifecycle.status !== filters.status) {
        return false;
      }

      // Department filter
      if (filters.department && department?._id !== filters.department) {
        return false;
      }

      return true;
    });
  }, [allLifecycles, filters]);

  useEffect(() => {
    const grouped = groupLifecyclesByUser(filteredLifecycles);
    setGroupedUsers(grouped);
  }, [filteredLifecycles]);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
  };

  const handleSearchInputChange = (value) => {
    setFilters({ ...filters, search: value });

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      handleSearch();
    }, 500); // 500ms delay

    setSearchTimeout(newTimeout);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      search: "",
      department: "",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Initiated":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "On Hold":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Initiated":
        return <PlayIcon className="w-4 h-4" />;
      case "In Progress":
        return <ClockIcon className="w-4 h-4" />;
      case "Completed":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "On Hold":
        return <PauseIcon className="w-4 h-4" />;
      case "Cancelled":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateProgress = (lifecycle) => {
    if (!lifecycle.tasks || lifecycle.tasks.length === 0) return 0;
    const completed = lifecycle.tasks.filter(
      (task) => task.status === "Completed"
    ).length;
    return Math.round((completed / lifecycle.tasks.length) * 100);
  };

  const isOverdue = (lifecycle) => {
    return (
      new Date() > new Date(lifecycle.targetCompletionDate) &&
      lifecycle.status !== "Completed" &&
      lifecycle.status !== "Cancelled"
    );
  };

  // Group lifecycles by user
  const groupLifecyclesByUser = (lifecyclesData) => {
    const grouped = {};

    lifecyclesData.forEach((lifecycle) => {
      // Skip if employee is null or undefined
      if (!lifecycle.employee) {
        console.warn(
          "⚠️ [ONBOARDING] Skipping lifecycle with null employee:",
          lifecycle._id
        );
        return;
      }

      const userId = lifecycle.employee._id;
      const userName = `${lifecycle.employee.firstName} ${lifecycle.employee.lastName}`;

      if (!grouped[userId]) {
        grouped[userId] = {
          user: lifecycle.employee,
          lifecycles: {},
          department: lifecycle.department,
        };
      }

      grouped[userId].lifecycles[lifecycle.type] = lifecycle;
    });

    return Object.values(grouped);
  };

  const getLifecycleStatus = (userData, type) => {
    const lifecycle = userData.lifecycles[type];
    if (!lifecycle) return null;

    return {
      status: lifecycle.status,
      progress: calculateProgress(lifecycle),
      isOverdue: isOverdue(lifecycle),
      type: type,
    };
  };

  const handleViewDetails = (userData) => {
    setSelectedUser(userData);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const handleInitiateOffboarding = async (userData) => {
    try {
      // Call the new API to initiate offboarding
      await userModulesAPI.employeeLifecycle.initiateOffboarding(
        userData.user._id
      );

      toast.success(
        `Offboarding initiated for ${userData.user.firstName} ${userData.user.lastName}`
      );
      closeModal();
      // Refresh data after initiating offboarding
      fetchData();
    } catch (error) {
      console.error("Error initiating offboarding:", error);
      toast.error("Failed to initiate offboarding");
    }
  };

  const handleTaskAction = async (lifecycleId, taskId, action) => {
    try {
      console.log(`🚀 [TASK] ${action}ing task:`, {
        lifecycleId,
        taskId,
        action,
      });

      const response = await userModulesAPI.employeeLifecycle.updateTaskStatus(
        lifecycleId,
        { taskId, action }
      );

      if (response.success) {
        toast.success(`Task ${action}ed successfully`);
        // Refresh data to show updated progress
        fetchData();
      } else {
        toast.error(`Failed to ${action} task`);
      }
    } catch (error) {
      console.error(`Error ${action}ing task:`, error);
      toast.error(`Failed to ${action} task`);
    }
  };

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
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            e.target.src = getDefaultAvatar();
          }}
        />
      );
    }
    return (
      <div className="w-12 h-12 bg-[var(--elra-primary)] rounded-full flex items-center justify-center">
        <span className="text-white font-semibold text-lg">
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--elra-bg-light)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  Onboarding Management
                </h1>
                <p className="text-[var(--elra-text-secondary)]">
                  Track and manage employee onboarding processes
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium cursor-pointer"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Employees
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {groupedUsers.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groupedUsers.filter((user) => {
                    const onboarding = getLifecycleStatus(user, "Onboarding");
                    return onboarding && onboarding.status === "In Progress";
                  }).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groupedUsers.filter((user) => {
                    const onboarding = getLifecycleStatus(user, "Onboarding");
                    return onboarding && onboarding.status === "Completed";
                  }).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groupedUsers.filter((user) => {
                    const onboarding = getLifecycleStatus(user, "Onboarding");
                    return onboarding && onboarding.isOverdue;
                  }).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
              <BuildingOfficeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--elra-text-primary)]">
                Department Breakdown
              </h2>
              <p className="text-[var(--elra-text-secondary)]">
                Onboarding progress by department
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptUsers = groupedUsers.filter(
                (user) => user.department?._id === dept._id
              );
              const completedUsers = deptUsers.filter((user) => {
                const onboarding = getLifecycleStatus(user, "Onboarding");
                return onboarding && onboarding.status === "Completed";
              });
              const inProgressUsers = deptUsers.filter((user) => {
                const onboarding = getLifecycleStatus(user, "Onboarding");
                return onboarding && onboarding.status === "In Progress";
              });

              return (
                <div key={dept._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                    <span className="text-sm text-gray-500">
                      {deptUsers.length} employees
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Completed</span>
                      <span className="font-medium">
                        {completedUsers.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600">Pending</span>
                      <span className="font-medium">
                        {deptUsers.length - completedUsers.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
              <FunnelIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--elra-text-primary)]">
                Filter Lifecycles
              </h2>
              <p className="text-[var(--elra-text-secondary)]">
                Search and filter onboarding processes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Search Employee
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={filters.search}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full p-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
              >
                <option value="">All Statuses</option>
                <option value="Initiated">Initiated</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
                className="w-full p-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </button>

              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-[var(--elra-border-primary)] text-[var(--elra-text-secondary)] rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {groupedUsers.length} employee
              {groupedUsers.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {console.log(
            "🎯 Rendering grouped users:",
            groupedUsers.length,
            groupedUsers
          )}
          {groupedUsers.map((userData) => {
            const onboardingStatus = getLifecycleStatus(userData, "Onboarding");
            const offboardingStatus = getLifecycleStatus(
              userData,
              "Offboarding"
            );

            return (
              <div
                key={userData.user._id}
                className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getAvatarDisplay(userData.user)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {userData.user.firstName} {userData.user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {userData.user.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {userData.department?.name}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">
                          ID: {userData.user.employeeId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Onboarding Status */}
                    {onboardingStatus && (
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          Onboarding
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusIcon(onboardingStatus.status)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              onboardingStatus.status
                            )}`}
                          >
                            {onboardingStatus.status}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          {onboardingStatus.progress}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              onboardingStatus.progress === 100
                                ? "bg-[var(--elra-primary-dark)]"
                                : "bg-[var(--elra-primary)]"
                            }`}
                            style={{ width: `${onboardingStatus.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Offboarding Status (Hidden for now) */}
                    {offboardingStatus &&
                      offboardingStatus.status !== "Initiated" && (
                        <div className="text-center">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Offboarding
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(offboardingStatus.status)}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                offboardingStatus.status
                              )}`}
                            >
                              {offboardingStatus.status}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-700">
                            {offboardingStatus.progress}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${offboardingStatus.progress}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                    <button
                      onClick={() => handleViewDetails(userData)}
                      className="px-4 py-2 border-2 border-[var(--elra-primary)] text-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-all duration-200 font-medium cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Show overdue warning for onboarding */}
                {onboardingStatus && onboardingStatus.isOverdue && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Onboarding process is overdue
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {groupedUsers.length === 0 && !loading && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-[var(--elra-border-primary)]">
              <div className="text-gray-500">
                <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No employees found
                </h3>
                <p className="text-gray-600">
                  {filters.search || filters.status || filters.department
                    ? "Try adjusting your filters"
                    : "No employees are currently in the system"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <ELRALogo size="sm" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedUser.user.firstName} {selectedUser.user.lastName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedUser.user.email} • {selectedUser.department?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Onboarding Overview */}
              {selectedUser.lifecycles.Onboarding && (
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-[var(--elra-primary)] bg-opacity-10 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Onboarding Progress
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">
                        Status
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedUser.lifecycles.Onboarding.status}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">
                        Progress
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {calculateProgress(selectedUser.lifecycles.Onboarding)}%
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">
                        Started
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatDate(
                          selectedUser.lifecycles.Onboarding.startDate
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5-Task System */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <ClipboardDocumentCheckIcon className="w-5 h-5 text-[var(--elra-primary)]" />
                      <h4 className="text-md font-semibold text-gray-900">
                        Onboarding Tasks (
                        {selectedUser.lifecycles.Onboarding.tasks?.filter(
                          (task) => task.status === "Completed"
                        ).length || 0}
                        /5)
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {selectedUser.lifecycles.Onboarding.tasks?.map(
                        (task, index) => (
                          <div
                            key={task._id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              task.status === "Completed"
                                ? "bg-green-50 border-green-200"
                                : task.status === "In Progress"
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  task.status === "Completed"
                                    ? "bg-green-500"
                                    : task.status === "In Progress"
                                    ? "bg-yellow-500"
                                    : "bg-gray-300"
                                }`}
                              >
                                {task.status === "Completed" ? (
                                  <CheckCircleIcon className="w-4 h-4 text-white" />
                                ) : task.status === "In Progress" ? (
                                  <ClockIcon className="w-4 h-4 text-white" />
                                ) : (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {task.title}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {task.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Due: {formatDate(task.dueDate)}
                                  {task.status === "Completed" &&
                                    task.completedAt && (
                                      <span className="ml-2">
                                        • Completed:{" "}
                                        {formatDate(task.completedAt)}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>

                            {/* Task Action Buttons */}
                            <div className="flex items-center space-x-2">
                              {task.status === "Pending" && (
                                <button
                                  onClick={() =>
                                    handleTaskAction(
                                      selectedUser.lifecycles.Onboarding._id,
                                      task._id,
                                      "start"
                                    )
                                  }
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Start
                                </button>
                              )}
                              {task.status === "In Progress" && (
                                <button
                                  onClick={() =>
                                    handleTaskAction(
                                      selectedUser.lifecycles.Onboarding._id,
                                      task._id,
                                      "complete"
                                    )
                                  }
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Complete
                                </button>
                              )}
                              {task.status === "Completed" && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-lg font-medium">
                                  ✓ Done
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <div>
                {selectedUser.lifecycles.Onboarding?.status === "Completed" && (
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-[var(--elra-primary)]" />
                    <span className="text-sm text-[var(--elra-primary)] font-medium">
                      Onboarding completed successfully
                    </span>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                {selectedUser.lifecycles.Onboarding?.status === "Completed" && (
                  <button
                    onClick={() => handleInitiateOffboarding(selectedUser)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Initiate Offboarding
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingManagement;
