import React, { useState, useEffect } from "react";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { userModulesAPI } from "../../../../services/userModules.js";
import { useMessageContext } from "../../../../context/MessageContext";
import defaultAvatar from "../../../../assets/defaulticon.jpg";
import { toast } from "react-toastify";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [salaryData, setSalaryData] = useState({
    salaryStep: "Step 1",
    yearsOfService: null,
  });
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [salaryGrades, setSalaryGrades] = useState([]);
  const { openChatWithUser } = useMessageContext();

  useEffect(() => {
    loadData();
  }, []);

  // Fetch fresh salary grades when modal opens
  useEffect(() => {
    if (showSalaryModal) {
      const fetchFreshSalaryGrades = async () => {
        try {
          const response =
            await userModulesAPI.salaryGrades.getAllSalaryGrades();

          if (response.success) {
            setSalaryGrades(response.data);
          }
        } catch (error) {
          console.error("Error fetching salary grades:", error);
        }
      };

      fetchFreshSalaryGrades();
    }
  }, [showSalaryModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        usersResponse,
        departmentsResponse,
        rolesResponse,
        salaryGradesResponse,
      ] = await Promise.all([
        userModulesAPI.users.getAllUsers(),
        userModulesAPI.departments.getAllDepartments(),
        userModulesAPI.roles.getAllRoles(),
        userModulesAPI.salaryGrades.getAllSalaryGrades(),
      ]);

      if (usersResponse.success) setUsers(usersResponse.data);
      if (departmentsResponse.success) setDepartments(departmentsResponse.data);
      if (rolesResponse.success) setRoles(rolesResponse.data);
      if (salaryGradesResponse.success)
        setSalaryGrades(salaryGradesResponse.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
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

  const handleMessageUser = (user) => {
    openChatWithUser(user);
  };

  const handleSalaryManagement = async (user) => {
    setIsOpeningModal(true);
    try {
      setSelectedUser(user);
      setSalaryData({
        salaryStep: user.salaryStep || "Step 1",
        yearsOfService: user.yearsOfService || null,
      });
      setShowSalaryModal(true);
    } finally {
      setIsOpeningModal(false);
    }
  };

  // Get salary grade information for a user
  const getUserSalaryGrade = (user) => {
    // Find the salary grade that has a role mapping for this user's role
    for (const grade of salaryGrades) {
      if (grade.roleMappings && grade.roleMappings.length > 0) {
        const roleMapping = grade.roleMappings.find(
          (mapping) =>
            mapping.role?._id?.toString() === user.role?._id?.toString() ||
            mapping.role?.name === user.role?.name
        );

        if (roleMapping) {
          return grade;
        }
      }
    }

    return null;
  };

  const getAvailableSteps = (user) => {
    const grade = getUserSalaryGrade(user);

    if (!grade || !grade.steps) {
      return [];
    }

    const availableSteps = grade.steps.filter(
      (step) => step.increment > 0 || step.step === "Step 1"
    );

    return availableSteps;
  };

  const getStepFromYearsOfService = (yearsOfService, steps) => {
    if (
      !steps ||
      steps.length === 0 ||
      yearsOfService === null ||
      yearsOfService === undefined ||
      yearsOfService < 0
    ) {
      return "Step 1";
    }

    const sortedSteps = [...steps].sort(
      (a, b) => a.yearsOfService - b.yearsOfService
    );

    for (let i = sortedSteps.length - 1; i >= 0; i--) {
      if (yearsOfService >= sortedSteps[i].yearsOfService) {
        return sortedSteps[i].step;
      }
    }

    return sortedSteps[0]?.step || "Step 1";
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingSalary(true);

    try {
      const availableSteps = getAvailableSteps(selectedUser);
      const autoStep = getStepFromYearsOfService(
        salaryData.yearsOfService,
        availableSteps
      );

      const updateData = {
        salaryStep: salaryData.salaryStep || autoStep,
        yearsOfService:
          salaryData.yearsOfService === null ? 0 : salaryData.yearsOfService,
      };

      const response = await userModulesAPI.users.updateUserSalary(
        selectedUser._id,
        updateData
      );

      if (response.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === selectedUser._id ? { ...user, ...updateData } : user
          )
        );

        toast.success("Salary information updated successfully!");
        setShowSalaryModal(false);
        setSelectedUser(null);
        setSalaryData({
          salaryStep: "Step 1",
          yearsOfService: null,
        });
      } else {
        toast.error(response.message || "Failed to update salary information");
      }
    } catch (error) {
      console.error("Error updating salary:", error);
      toast.error(
        error.response?.data?.message || "Failed to update salary information"
      );
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      !departmentFilter || user.department?.name === departmentFilter;
    const matchesRole = !roleFilter || user.role?.name === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-[var(--elra-secondary-3)] text-[var(--elra-primary)]";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (roleLevel) => {
    switch (roleLevel) {
      case 1000:
        return "bg-red-100 text-red-800";
      case 700:
        return "bg-purple-100 text-purple-800";
      case 600:
        return "bg-blue-100 text-blue-800";
      case 300:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[var(--elra-primary)] rounded-xl">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  User Management
                </h1>
                <p className="text-gray-600">
                  Manage all users across departments
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role._id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm("");
                setDepartmentFilter("");
                setRoleFilter("");
                setStatusFilter("");
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
            >
              {/* User Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getAvatarDisplay(user)}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleMessageUser(user)}
                    className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] rounded-lg transition-colors"
                    title={`Message ${user.firstName} ${user.lastName}`}
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleSalaryManagement(user)}
                    disabled={isOpeningModal}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Manage Salary"
                  >
                    {isOpeningModal ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    ) : (
                      <CurrencyDollarIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{user.email}</span>
                </div>

                {user.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{user.phone}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {user.department?.name || "No Department"}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                      user.role?.level
                    )}`}
                  >
                    {user.role?.name?.replace(/_/g, "") || "No Role"}
                  </span>
                </div>

                {/* Years of Service Information */}
                <div className="flex items-center space-x-2 text-sm">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 font-medium">
                    {user.yearsOfService === null ||
                    user.yearsOfService === undefined ||
                    user.yearsOfService === 0
                      ? "New employee"
                      : `${user.yearsOfService} year${
                          user.yearsOfService === 1 ? "" : "s"
                        }`}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      user.status
                    )}`}
                  >
                    {user.status || "Unknown"}
                  </span>
                </div>
              </div>

              {/* User Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
            <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || departmentFilter || roleFilter || statusFilter
                ? "Try adjusting your filters or search terms."
                : "No users have been added to the system yet."}
            </p>
            <button className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-colors">
              Add First User
            </button>
          </div>
        )}

        {/* Results Summary */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
            <p className="text-sm text-gray-600 text-center">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        )}
      </div>

      {/* Salary Management Modal */}
      {showSalaryModal && selectedUser && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Salary - {selectedUser.firstName}{" "}
                  {selectedUser.lastName}
                </h2>
                <button
                  onClick={() => {
                    setShowSalaryModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSalarySubmit} className="p-6 space-y-6">
              {salaryLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
                </div>
              )}

              {/* User Avatar */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img
                    src={getImageUrl(selectedUser.avatar)}
                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    className="w-20 h-20 rounded-full object-cover border-4 border-[var(--elra-primary)] shadow-lg"
                    onError={(e) => {
                      e.target.src = getDefaultAvatar();
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Employee ID:
                    </span>
                    <p className="text-gray-900">{selectedUser.employeeId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Department:
                    </span>
                    <p className="text-gray-900">
                      {selectedUser.department?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Role:</span>
                    <p className="text-gray-900">
                      {selectedUser.role?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Salary Grade:
                    </span>
                    <p className="text-gray-900">
                      {(() => {
                        const grade = getUserSalaryGrade(selectedUser);
                        console.log(
                          "🔍 [MODAL_DISPLAY] Salary grade display:",
                          {
                            grade,
                            result: grade
                              ? `${grade.grade} (${grade.name})`
                              : "N/A",
                          }
                        );
                        return grade ? `${grade.grade} (${grade.name})` : "N/A";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Salary Grade Information */}
              {(() => {
                console.log(
                  "🔍 [MODAL_DISPLAY] Rendering salary grade information for selectedUser:",
                  selectedUser
                );
                const grade = getUserSalaryGrade(selectedUser);
                console.log(
                  "🔍 [MODAL_DISPLAY] Grade for information section:",
                  grade
                );

                if (!grade) {
                  console.log(
                    "❌ [MODAL_DISPLAY] No grade found, showing no grade message"
                  );
                  return (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h3 className="font-medium text-yellow-900 mb-2">
                        ⚠️ Salary Grade Not Assigned
                      </h3>
                      <p className="text-yellow-800 text-sm">
                        This employee's role does not have a salary grade
                        assigned. Please assign a salary grade to their role in
                        the Salary Grade Management.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-medium text-green-900 mb-3">
                      📊 Salary Grade Information
                    </h3>

                    {/* Grade Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium text-green-700">
                          Grade Name:
                        </span>
                        <p className="text-green-900 font-semibold">
                          {grade.grade} - {grade.name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">
                          Description:
                        </span>
                        <p className="text-green-900 text-xs">
                          {grade.description || "No description available"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Years of Service Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Service
                </label>
                <input
                  type="number"
                  value={
                    salaryData.yearsOfService === null ||
                    salaryData.yearsOfService === undefined
                      ? ""
                      : salaryData.yearsOfService
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setSalaryData((prev) => ({
                        ...prev,
                        yearsOfService: null,
                      }));
                    } else {
                      const years = parseInt(value);
                      if (!isNaN(years) && years >= 0) {
                        setSalaryData((prev) => ({
                          ...prev,
                          yearsOfService: years,
                        }));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max="50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Years of service automatically determines salary steps &
                  calculation.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowSalaryModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={isSubmittingSalary}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSalary}
                  className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSubmittingSalary && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isSubmittingSalary ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
