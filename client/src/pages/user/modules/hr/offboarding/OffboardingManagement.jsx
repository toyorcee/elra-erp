import React, { useState, useEffect, useMemo } from "react";
import { userModulesAPI } from "../../../../../services/userModules";
import {
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import defaultAvatar from "../../../../../assets/defaulticon.jpg";
import ELRALogo from "../../../../../components/ELRALogo";
import DataTable from "../../../../../components/common/DataTable";

const OffboardingManagement = () => {
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [updatingTasks, setUpdatingTasks] = useState({});
  const [markingAllTasks, setMarkingAllTasks] = useState(false);
  const [markingAllTasksForAll, setMarkingAllTasksForAll] = useState(false);
  const [revertingOffboarding, setRevertingOffboarding] = useState({});
  const [showRevertConfirmModal, setShowRevertConfirmModal] = useState(false);
  const [userToRevert, setUserToRevert] = useState(null);
  const [completedOffboardings, setCompletedOffboardings] = useState([]);
  const [completedOffboardingsLoading, setCompletedOffboardingsLoading] =
    useState(false);
  const [completedOffboardingsTotal, setCompletedOffboardingsTotal] =
    useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);

      const lifecyclesRes =
        await userModulesAPI.employeeLifecycle.getOffboarding();

      const lifecyclesData = lifecyclesRes.data.docs || [];
      setAllLifecycles(lifecyclesData);

      const grouped = groupLifecyclesByUser(lifecyclesData);
      setGroupedUsers(grouped);

      if (selectedUser && showDetailsModal) {
        const updatedSelectedUser = grouped.find(
          (userData) => userData.user._id === selectedUser.user._id
        );
        if (updatedSelectedUser) {
          setSelectedUser(updatedSelectedUser);
        }
      }
    } catch (error) {
      console.error("Error fetching offboarding lifecycle data:", error);
      toast.error("Failed to fetch offboarding lifecycle data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDepartments();
    fetchCompletedOffboardings();
  }, []);

  const fetchCompletedOffboardings = async () => {
    try {
      setCompletedOffboardingsLoading(true);
      const response =
        await userModulesAPI.employeeLifecycle.getCompletedOffboardings({
          page: 1,
          limit: 100,
        });
      if (response.success) {
        setCompletedOffboardings(response.data.docs || []);
        setCompletedOffboardingsTotal(response.data.totalDocs || 0);
      }
    } catch (error) {
      console.error("Error fetching completed offboardings:", error);
    } finally {
      setCompletedOffboardingsLoading(false);
    }
  };

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
      // Skip if employee is null or undefined
      if (!lifecycle.employee) {
        return false;
      }

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
        return "bg-[var(--elra-primary)] text-white";
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
        return;
      }

      const userId = lifecycle.employee._id;

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

  const handleRevertOffboarding = (userData) => {
    setUserToRevert(userData);
    setShowRevertConfirmModal(true);
  };

  const confirmRevertOffboarding = async () => {
    if (!userToRevert) return;

    const lifecycleId = userToRevert.lifecycles.Offboarding?._id;
    if (!lifecycleId) {
      toast.error("Offboarding lifecycle not found");
      setShowRevertConfirmModal(false);
      setUserToRevert(null);
      return;
    }

    const revertKey = lifecycleId.toString();
    if (revertingOffboarding[revertKey]) {
      return;
    }

    try {
      setRevertingOffboarding((prev) => ({ ...prev, [revertKey]: true }));

      const response = await userModulesAPI.employeeLifecycle.revertOffboarding(
        lifecycleId
      );

      if (response.success) {
        toast.success(
          `Offboarding reverted for ${userToRevert.user.firstName} ${userToRevert.user.lastName}`
        );

        await fetchData();

        setShowRevertConfirmModal(false);
        setUserToRevert(null);
      } else {
        toast.error("Failed to revert offboarding");
      }
    } catch (error) {
      console.error("Error reverting offboarding:", error);
      toast.error("Failed to revert offboarding");
    } finally {
      // Clear loading state
      setRevertingOffboarding((prev) => {
        const newState = { ...prev };
        delete newState[revertKey];
        return newState;
      });
    }
  };

  const cancelRevertOffboarding = () => {
    setShowRevertConfirmModal(false);
    setUserToRevert(null);
  };

  const handleMarkAllTasksComplete = async (lifecycleId) => {
    try {
      setMarkingAllTasks(true);

      const response =
        await userModulesAPI.employeeLifecycle.markAllTasksComplete(lifecycleId);

      if (response.success) {
        toast.success(response.message || "All tasks marked as complete");

        // Update the modal state immediately
        if (selectedUser && response.data) {
          const updatedLifecycle = response.data;

          const updatedGroupedUsers = groupedUsers.map((userData) => {
            if (
              userData.user._id === selectedUser.user._id &&
              userData.lifecycles.Offboarding?._id === lifecycleId
            ) {
              return {
                ...userData,
                lifecycles: {
                  ...userData.lifecycles,
                  Offboarding: updatedLifecycle,
                },
              };
            }
            return userData;
          });

          setGroupedUsers(updatedGroupedUsers);

          const updatedSelectedUser = updatedGroupedUsers.find(
            (userData) => userData.user._id === selectedUser.user._id
          );
          if (updatedSelectedUser) {
            setSelectedUser(updatedSelectedUser);
          }
        }

        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        toast.error(response.message || "Failed to mark all tasks as complete");
      }
    } catch (error) {
      console.error("Error marking all tasks complete:", error);
      toast.error("Failed to mark all tasks as complete");
    } finally {
      setMarkingAllTasks(false);
    }
  };

  const handleMarkAllTasksCompleteForAll = async () => {
    // Confirm action
    const confirmed = window.confirm(
      "Are you sure you want to mark all incomplete tasks as complete for ALL employees? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setMarkingAllTasksForAll(true);

      const response =
        await userModulesAPI.employeeLifecycle.markAllTasksCompleteForAllOffboarding();

      if (response.success) {
        toast.success(
          response.message ||
            `Successfully marked all tasks complete for ${response.updatedCount || 0} employee(s)`
        );

        // Refresh data to show updated status
        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        toast.error(
          response.message || "Failed to mark all tasks as complete"
        );
      }
    } catch (error) {
      console.error("Error marking all tasks complete for all:", error);
      toast.error("Failed to mark all tasks as complete for all employees");
    } finally {
      setMarkingAllTasksForAll(false);
    }
  };

  const handleTaskAction = async (lifecycleId, taskId, action) => {
    // Prevent multiple clicks on the same task
    const taskKey = `${lifecycleId}-${taskId}`;
    if (updatingTasks[taskKey]) {
      return;
    }

    try {
      // Set loading state for this specific task
      setUpdatingTasks((prev) => ({ ...prev, [taskKey]: true }));

      const response = await userModulesAPI.employeeLifecycle.updateTaskStatus(
        lifecycleId,
        { taskId, action }
      );

      if (response.success) {
        toast.success(`Task ${action}ed successfully`);

        // Update the modal state immediately with the response data
        if (selectedUser && response.data) {
          const updatedLifecycle = response.data;

          // Find the user in groupedUsers and update their offboarding lifecycle
          const updatedGroupedUsers = groupedUsers.map((userData) => {
            if (
              userData.user._id === selectedUser.user._id &&
              userData.lifecycles.Offboarding?._id === lifecycleId
            ) {
              return {
                ...userData,
                lifecycles: {
                  ...userData.lifecycles,
                  Offboarding: updatedLifecycle,
                },
              };
            }
            return userData;
          });

          setGroupedUsers(updatedGroupedUsers);

          // Update selectedUser in the modal - this keeps modal open and shows updated state
          const updatedSelectedUser = updatedGroupedUsers.find(
            (userData) => userData.user._id === selectedUser.user._id
          );
          if (updatedSelectedUser) {
            setSelectedUser(updatedSelectedUser);
          }
        }

        // Refresh all data in the background (modal stays open with updated data)
        fetchData();
      } else {
        toast.error(`Failed to ${action} task`);
      }
    } catch (error) {
      console.error(`Error ${action}ing task:`, error);
      toast.error(`Failed to ${action} task`);
    } finally {
      // Clear loading state
      setUpdatingTasks((prev) => {
        const newState = { ...prev };
        delete newState[taskKey];
        return newState;
      });
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--elra-bg-light)] p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  Offboarding Management
                </h1>
                <p className="text-[var(--elra-text-secondary)]">
                  Track and manage employee offboarding processes
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {groupedUsers.some((user) => {
                const offboarding = getLifecycleStatus(user, "Offboarding");
                const lifecycle = user.lifecycles?.Offboarding;
                return (
                  offboarding &&
                  offboarding.status !== "Completed" &&
                  offboarding.status !== "Cancelled" &&
                  lifecycle?.tasks?.some((task) => task.status !== "Completed")
                );
              }) && (
                <button
                  onClick={handleMarkAllTasksCompleteForAll}
                  disabled={markingAllTasksForAll}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingAllTasksForAll ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Marking All...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      <span>Mark All Tasks (All Employees)</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium cursor-pointer"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
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
                    const offboarding = getLifecycleStatus(user, "Offboarding");
                    return offboarding && offboarding.status === "In Progress";
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
                    const offboarding = getLifecycleStatus(user, "Offboarding");
                    return offboarding && offboarding.status === "Completed";
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
                    const offboarding = getLifecycleStatus(user, "Offboarding");
                    return offboarding && offboarding.isOverdue;
                  }).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Offboarded Employees
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedOffboardingsTotal || 0}
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
                Offboarding progress by department
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptUsers = groupedUsers.filter(
                (user) => user.department?._id === dept._id
              );
              const completedUsers = deptUsers.filter((user) => {
                const offboarding = getLifecycleStatus(user, "Offboarding");
                return offboarding && offboarding.status === "Completed";
              });
              const inProgressUsers = deptUsers.filter((user) => {
                const offboarding = getLifecycleStatus(user, "Offboarding");
                return offboarding && offboarding.status === "In Progress";
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
                      <span className="text-[var(--elra-primary)]">
                        Completed
                      </span>
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
                Search and filter offboarding processes
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
          {groupedUsers.map((userData) => {
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
                    {/* Offboarding Status */}
                    {offboardingStatus && (
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
                            className={`h-2 rounded-full transition-all duration-300 ${
                              offboardingStatus.progress === 100
                                ? "bg-[var(--elra-primary-dark)]"
                                : "bg-[var(--elra-primary)]"
                            }`}
                            style={{ width: `${offboardingStatus.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleRevertOffboarding(userData)}
                        disabled={
                          revertingOffboarding[
                            userData.lifecycles.Offboarding?._id?.toString()
                          ]
                        }
                        className="px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-all duration-200 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {revertingOffboarding[
                          userData.lifecycles.Offboarding?._id?.toString()
                        ] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                            <span>Reverting...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUturnLeftIcon className="h-4 w-4" />
                            <span>Revert Offboarding</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleViewDetails(userData)}
                        className="px-4 py-2 border-2 border-[var(--elra-primary)] text-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-all duration-200 font-medium cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Show overdue warning for offboarding */}
                {offboardingStatus && offboardingStatus.isOverdue && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Offboarding process is overdue
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
                <ArrowRightOnRectangleIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No offboarding processes found
                </h3>
                <p className="text-gray-600">
                  {filters.search || filters.status || filters.department
                    ? "Try adjusting your filters"
                    : "No employees are currently in offboarding"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Completed Offboardings Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--elra-text-primary)]">
                  Successfully Offboarded Employees
                </h2>
                <p className="text-[var(--elra-text-secondary)]">
                  View all employees who have completed the offboarding process
                </p>
              </div>
            </div>
            <button
              onClick={fetchCompletedOffboardings}
              disabled={completedOffboardingsLoading}
              className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completedOffboardingsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </button>
          </div>

          <DataTable
            data={completedOffboardings.map((lifecycle) => ({
              _id: lifecycle._id,
              employeeName: lifecycle.employee
                ? `${lifecycle.employee.firstName} ${lifecycle.employee.lastName}`
                : "N/A",
              employeeEmail: lifecycle.employee?.email || "N/A",
              employeeId: lifecycle.employee?.employeeId || "N/A",
              department: lifecycle.department?.name || "N/A",
              initiatedBy: lifecycle.initiatedBy
                ? `${lifecycle.initiatedBy.firstName} ${lifecycle.initiatedBy.lastName}`
                : "N/A",
              completedDate: lifecycle.actualCompletionDate
                ? formatDate(lifecycle.actualCompletionDate)
                : "N/A",
              completedDateTime: lifecycle.actualCompletionDate
                ? new Date(lifecycle.actualCompletionDate).toLocaleString()
                : "N/A",
            }))}
            columns={[
              {
                header: "Employee Name",
                accessor: "employeeName",
                width: "w-48",
              },
              {
                header: "Email",
                accessor: "employeeEmail",
                width: "w-64",
              },
              {
                header: "Employee ID",
                accessor: "employeeId",
                width: "w-32",
              },
              {
                header: "Department",
                accessor: "department",
                width: "w-40",
              },
              {
                header: "Initiated By",
                accessor: "initiatedBy",
                width: "w-48",
              },
              {
                header: "Completed Date",
                accessor: "completedDate",
                width: "w-40",
              },
              {
                header: "Completed Time",
                accessor: "completedDateTime",
                width: "w-48",
              },
            ]}
            loading={completedOffboardingsLoading}
            emptyState={{
              icon: <CheckCircleIcon className="w-12 h-12 text-white" />,
              title: "No completed offboardings",
              description:
                "No employees have completed the offboarding process yet.",
              actionButton: null,
            }}
            pagination={true}
            itemsPerPage={10}
            searchable={true}
            sortable={true}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
              showView: false,
            }}
          />
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
              {/* Offboarding Overview */}
              {selectedUser.lifecycles.Offboarding && (
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                      <ArrowRightOnRectangleIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Offboarding Progress
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">
                        Status
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedUser.lifecycles.Offboarding.status}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">
                        Progress
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {calculateProgress(selectedUser.lifecycles.Offboarding)}
                        %
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">
                        Started
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatDate(
                          selectedUser.lifecycles.Offboarding.startDate
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5-Task System */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-[var(--elra-primary)]" />
                        <h4 className="text-md font-semibold text-gray-900">
                          Offboarding Tasks (
                          {selectedUser.lifecycles.Offboarding.tasks?.filter(
                            (task) => task.status === "Completed"
                          ).length || 0}
                          /{selectedUser.lifecycles.Offboarding.tasks?.length || 0}
                          )
                        </h4>
                      </div>
                      {selectedUser.lifecycles.Offboarding.tasks?.some(
                        (task) => task.status !== "Completed"
                      ) && (
                        <button
                          onClick={() =>
                            handleMarkAllTasksComplete(
                              selectedUser.lifecycles.Offboarding._id
                            )
                          }
                          disabled={markingAllTasks}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {markingAllTasks ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Marking All...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Mark All Tasks</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {selectedUser.lifecycles.Offboarding.tasks?.map(
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
                                      selectedUser.lifecycles.Offboarding._id,
                                      task._id,
                                      "start"
                                    )
                                  }
                                  disabled={
                                    updatingTasks[
                                      `${selectedUser.lifecycles.Offboarding._id}-${task._id}`
                                    ]
                                  }
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updatingTasks[
                                    `${selectedUser.lifecycles.Offboarding._id}-${task._id}`
                                  ] ? (
                                    <span className="flex items-center">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                      Starting...
                                    </span>
                                  ) : (
                                    "Start"
                                  )}
                                </button>
                              )}
                              {task.status === "In Progress" && (
                                <button
                                  onClick={() =>
                                    handleTaskAction(
                                      selectedUser.lifecycles.Offboarding._id,
                                      task._id,
                                      "complete"
                                    )
                                  }
                                  disabled={
                                    updatingTasks[
                                      `${selectedUser.lifecycles.Offboarding._id}-${task._id}`
                                    ]
                                  }
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updatingTasks[
                                    `${selectedUser.lifecycles.Offboarding._id}-${task._id}`
                                  ] ? (
                                    <span className="flex items-center">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                      Completing...
                                    </span>
                                  ) : (
                                    "Complete"
                                  )}
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
                {selectedUser.lifecycles.Offboarding?.status ===
                  "Completed" && (
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-[var(--elra-primary)]" />
                    <span className="text-sm text-[var(--elra-primary)] font-medium">
                      Offboarding completed successfully
                    </span>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
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

      {/* Revert Confirmation Modal */}
      {showRevertConfirmModal && userToRevert && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ArrowUturnLeftIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Revert Offboarding
                  </h2>
                  <p className="text-sm text-gray-600">
                    Confirm reverting offboarding process
                  </p>
                </div>
              </div>
              <button
                onClick={cancelRevertOffboarding}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                {getAvatarDisplay(userToRevert.user)}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {userToRevert.user.firstName} {userToRevert.user.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {userToRevert.user.email}
                  </p>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {userToRevert.department?.name}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">
                      ID: {userToRevert.user.employeeId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      What will happen:
                    </h4>
                    <ul className="space-y-1 text-sm text-orange-800">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          All offboarding tasks will be reset to{" "}
                          <strong>Pending</strong>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          The employee's account will be{" "}
                          <strong>reactivated</strong>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Employee status will change to <strong>ACTIVE</strong>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          All stakeholders will be <strong>notified</strong>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong className="text-gray-900">Note:</strong> This action
                  cannot be undone. The offboarding process will need to be
                  re-initiated if needed again.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={cancelRevertOffboarding}
                disabled={
                  revertingOffboarding[
                    userToRevert.lifecycles.Offboarding?._id?.toString()
                  ]
                }
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevertOffboarding}
                disabled={
                  revertingOffboarding[
                    userToRevert.lifecycles.Offboarding?._id?.toString()
                  ]
                }
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {revertingOffboarding[
                  userToRevert.lifecycles.Offboarding?._id?.toString()
                ] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Reverting...</span>
                  </>
                ) : (
                  <>
                    <ArrowUturnLeftIcon className="w-4 h-4" />
                    <span>Confirm Revert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffboardingManagement;
