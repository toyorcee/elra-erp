import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineUsers,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineEnvelope,
  HiOutlineInformationCircle,
  HiXMark,
} from "react-icons/hi2";
import InvitationModal from "../../../components/common/InvitationModal";
import SendInviteButton from "../../../components/common/SendInviteButton";
import { useAuth } from "../../../context/AuthContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../../services/users";
import { getRoles } from "../../../services/roles";
import { getDepartments } from "../../../services/departments";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import GradientSpinner from "../../../components/common/GradientSpinner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalDataLoading, setModalDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    department: "",
    isActive: true,
  });
  const [selectedRoleDetails, setSelectedRoleDetails] = useState(null);
  const [selectedDepartmentDetails, setSelectedDepartmentDetails] =
    useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRolesAndDepartments();
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showModal) {
          closeModal();
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setDeletingUser(null);
        }
      }
    };

    if (showModal || showDeleteModal) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showModal, showDeleteModal]);

  const fetchRolesAndDepartments = async () => {
    try {
      setModalDataLoading(true);
      const [rolesData, departmentsData] = await Promise.all([
        getRoles(),
        getDepartments(),
      ]);
      console.log("🔍 Roles from DB:", rolesData);
      console.log("🔍 Departments from DB:", departmentsData);
      setRoles(rolesData.data || []);
      setDepartments(departmentsData.data?.departments || []);
      console.log("🔍 Roles state set:", rolesData.data || []);
      console.log(
        "🔍 Departments state set:",
        departmentsData.data?.departments || []
      );
    } catch (error) {
      console.error("Error fetching roles and departments:", error);
      toast.error("Failed to load roles and departments");
    } finally {
      setModalDataLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();

      console.log("🔍 Raw users data:", data);
      console.log("🔍 Users array:", data.data);

      const filteredUsers =
        data.data?.filter(
          (user) =>
            !user.email?.includes("platformadmin") &&
            (user.status === "PENDING_REGISTRATION" ||
              user.status === "INVITED" ||
              user.status === "ACTIVE")
        ) || [];

      console.log("🔍 Filtered users:", filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        await updateUser(editingUser._id, formData);

        if (
          editingUser.status === "PENDING_REGISTRATION" &&
          formData.role &&
          formData.department
        ) {
          toast.success(
            "User updated successfully! 🎉 Now you can send them an invitation to complete their account setup."
          );
        } else {
          toast.success("User updated successfully");
        }
      } else {
        console.log("🆕 Creating new user...");
        await createUser(formData);
        console.log("✅ User created successfully");
        toast.success("User created successfully");
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error);
      if (error.message === "You cannot change your own role") {
        toast.error(
          "You cannot change your own role. Please ask another administrator to make this change."
        );
      } else {
        toast.error(error.message || "Failed to save user");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (user) => {
    if (modalDataLoading) {
      toast.error("Please wait for roles and departments to load");
      return;
    }

    console.log("🔍 handleEdit called with user:", user);
    console.log("🔍 User department:", user.department);
    console.log("🔍 User role:", user.role);

    try {
      setModalDataLoading(true);
      const [rolesData, departmentsData] = await Promise.all([
        getRoles(),
        getDepartments(),
      ]);

      console.log("🔍 Fresh Roles from DB:", rolesData);
      console.log("🔍 Fresh Departments from DB:", departmentsData);

      setRoles(rolesData.data || []);
      setDepartments(departmentsData.data?.departments || []);

      const freshRole = (rolesData.data || []).find(
        (r) => r._id === user.role?._id
      );
      const freshDepartment = (departmentsData.data?.departments || []).find(
        (d) => d._id === user.department?._id
      );

      console.log("🔍 Fresh role found:", freshRole);
      console.log("🔍 Fresh department found:", freshDepartment);

      setEditingUser(user);
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role?._id || "",
        department: user.department?._id || "",
        isActive: user.isActive !== false,
      });

      setSelectedRoleDetails(freshRole || user.role || null);
      setSelectedDepartmentDetails(freshDepartment || user.department || null);

      console.log("🔍 Form data set:", {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role?._id || "",
        department: user.department?._id || "",
        isActive: user.isActive !== false,
      });

      setShowModal(true);
    } catch (error) {
      console.error("Error fetching fresh data for modal:", error);
      toast.error("Failed to load role and department data");
    } finally {
      setModalDataLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    const userToDelete = users.find((u) => u._id === userId);
    setDeletingUser(userToDelete);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(deletingUser._id);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      department: "",
      isActive: true,
    });
    setEditingUser(null);
  };

  const openCreateModal = async () => {
    if (modalDataLoading) {
      toast.error("Please wait for roles and departments to load");
      return;
    }

    try {
      setModalDataLoading(true);
      const [rolesData, departmentsData] = await Promise.all([
        getRoles(),
        getDepartments(),
      ]);

      console.log("🔍 Fresh Roles for Create Modal:", rolesData);
      console.log("🔍 Fresh Departments for Create Modal:", departmentsData);

      setRoles(rolesData.data || []);
      setDepartments(departmentsData.data?.departments || []);

      resetForm();
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching fresh data for create modal:", error);
      toast.error("Failed to load role and department data");
    } finally {
      setModalDataLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setSelectedRoleDetails(null);
    setSelectedDepartmentDetails(null);
  };

  const handleRoleChange = (roleId) => {
    setFormData({ ...formData, role: roleId });
    const selectedRole = roles.find((role) => role._id === roleId);
    setSelectedRoleDetails(selectedRole || null);
  };

  const handleDepartmentChange = (deptId) => {
    setFormData({ ...formData, department: deptId });
    const selectedDept = departments.find((dept) => dept._id === deptId);
    setSelectedDepartmentDetails(selectedDept || null);
  };

  // Utility function to format role and department names
  const formatName = (name) => {
    if (!name) return "";
    return name
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/-/g, " ") // Replace hyphens with spaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getRoleCapabilities = (role) => {
    if (!role) return [];

    const permissions = role.permissions || [];
    if (!Array.isArray(permissions)) {
      return [];
    }

    const capabilities = [];
    if (permissions.includes("document.upload"))
      capabilities.push("Upload documents");
    if (permissions.includes("document.view"))
      capabilities.push("View documents");
    if (permissions.includes("document.edit"))
      capabilities.push("Edit documents");
    if (permissions.includes("document.delete"))
      capabilities.push("Delete documents");
    if (permissions.includes("document.approve"))
      capabilities.push("Approve documents");
    if (permissions.includes("document.reject"))
      capabilities.push("Reject documents");
    if (permissions.includes("document.share"))
      capabilities.push("Share documents");
    if (permissions.includes("document.export"))
      capabilities.push("Export documents");
    if (permissions.includes("document.archive"))
      capabilities.push("Archive documents");
    if (permissions.includes("workflow.create"))
      capabilities.push("Create workflows");
    if (permissions.includes("workflow.start"))
      capabilities.push("Start workflows");
    if (permissions.includes("workflow.approve"))
      capabilities.push("Approve workflows");
    if (permissions.includes("workflow.reject"))
      capabilities.push("Reject workflows");
    if (permissions.includes("workflow.delegate"))
      capabilities.push("Delegate workflows");
    if (permissions.includes("workflow.view"))
      capabilities.push("View workflows");
    if (permissions.includes("user.view")) capabilities.push("View users");
    if (permissions.includes("user.create")) capabilities.push("Create users");
    if (permissions.includes("user.edit")) capabilities.push("Edit users");
    if (permissions.includes("user.view_permissions"))
      capabilities.push("View user permissions");
    if (permissions.includes("user.assign_role"))
      capabilities.push("Assign roles to users");
    if (permissions.includes("system.settings"))
      capabilities.push("System settings access");
    if (permissions.includes("system.reports"))
      capabilities.push("View reports");
    if (permissions.includes("system.audit"))
      capabilities.push("Access audit logs");

    return capabilities;
  };

  const calculateMetrics = () => {
    const totalUsers = users.length;

    const pendingUsers = users.filter(
      (u) => u.status === "PENDING_REGISTRATION"
    ).length;
    const invitedUsers = users.filter((u) => u.status === "INVITED").length;
    const activeUsers = users.filter(
      (u) => u.status === "ACTIVE" || (u.isActive === true && !u.status)
    ).length;
    const inactiveUsers = users.filter(
      (u) =>
        u.isActive === false &&
        u.status !== "PENDING_REGISTRATION" &&
        u.status !== "INVITED"
    ).length;

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      invitedUsers,
      inactiveUsers,
    };
  };

  const metrics = calculateMetrics();

  const userStatusData = {
    labels: ["Active", "Pending", "Invited", "Inactive"],
    datasets: [
      {
        data: [
          metrics.activeUsers,
          metrics.pendingUsers,
          metrics.invitedUsers,
          metrics.inactiveUsers,
        ],
        backgroundColor: ["#10B981", "#F59E0B", "#3B82F6", "#EF4444"],
        borderWidth: 0,
      },
    ],
  };

  // User Onboarding Funnel Data
  const onboardingFunnelData = {
    labels: ["Registered", "Role Assigned", "Invited", "Activated"],
    datasets: [
      {
        label: "Users",
        data: [
          metrics.totalUsers,
          metrics.totalUsers - metrics.pendingUsers,
          metrics.invitedUsers + metrics.activeUsers,
          metrics.activeUsers,
        ],
        backgroundColor: ["#6B7280", "#F59E0B", "#3B82F6", "#10B981"],
        borderWidth: 0,
      },
    ],
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if current user is super admin
  const isSuperAdmin = user?.role?.name === "SUPER_ADMIN";
  const userPermissions = user?.role?.permissions || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Metrics Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Search Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-4 sm:p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Invitation Modal */}
      <InvitationModal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        onSuccess={fetchUsers}
        userPermissions={userPermissions}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600">
              Manage NAIC staff members and their permissions
            </p>
            {modalDataLoading && (
              <div className="flex items-center mt-2 text-sm text-blue-600">
                <GradientSpinner size="sm" />
                <span className="ml-2">Loading roles and departments...</span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowInvitationModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <HiOutlineEnvelope className="w-4 h-4 mr-2" />
              Invite Staff
            </button>
            <button
              onClick={openCreateModal}
              disabled={modalDataLoading}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                modalDataLoading
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {modalDataLoading ? (
                <GradientSpinner size="sm" />
              ) : (
                <HiOutlinePlus className="w-4 h-4" />
              )}
              {modalDataLoading ? "Loading..." : "Add User"}
            </button>
          </div>
        </div>

        {/* Guidance for Pending Users */}
        {users.some(
          (u) => u.status === "PENDING_REGISTRATION" || u.status === "INVITED"
        ) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-3">
              <HiOutlineInformationCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  User Status Guide
                </h3>
                <p className="text-xs sm:text-sm text-blue-700">
                  <strong>PENDING_REGISTRATION:</strong> Users who registered
                  but need role/department assignment. Click the edit icon (✏️)
                  to assign these values.
                  <br />
                  <strong>INVITED:</strong> Users who have been sent invitations
                  but haven't completed registration yet. You can resend
                  invitations if needed.
                  <br />
                  <strong>ACTIVE:</strong> Users who are fully active in the
                  system and can access all features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Users
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {metrics.totalUsers}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <HiOutlineUsers className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {metrics.activeUsers}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <HiOutlineCheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Pending Registration
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  {metrics.pendingUsers}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
                <HiOutlineClock className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Invited Users
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {metrics.invitedUsers}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <HiOutlineEnvelope className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Inactive Users
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                  {metrics.inactiveUsers}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                <HiOutlineXCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              User Status Distribution
            </h3>
            <div className="h-48 sm:h-64">
              <Pie
                data={userStatusData}
                options={{ maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              User Onboarding Funnel
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Track user progression from registration to activation
            </p>
            <div className="h-48 sm:h-64">
              <Bar
                data={onboardingFunnelData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Users Display - Cards on md/sm, Table on lg+ */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Desktop Table View (lg and above) */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                              <HiOutlineUser className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {formatName(user.role?.name) || "No Role"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">
                          {formatName(user.department?.name) || "No Department"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status === "PENDING_REGISTRATION" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                            Pending Registration
                          </span>
                        ) : user.status === "INVITED" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                            Invited
                          </span>
                        ) : user.isActive !== false ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {(user.status === "PENDING_REGISTRATION" ||
                            user.status === "INVITED") && (
                            <SendInviteButton
                              user={user}
                              userPermissions={userPermissions}
                              isSuperAdmin={isSuperAdmin}
                              onSuccess={fetchUsers}
                            />
                          )}
                          <button
                            onClick={() => handleEdit(user)}
                            disabled={modalDataLoading}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              modalDataLoading
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            }`}
                            title={
                              modalDataLoading
                                ? "Loading roles and departments..."
                                : user.status === "PENDING_REGISTRATION"
                                ? "Assign role and department"
                                : "Edit user"
                            }
                          >
                            {modalDataLoading ? (
                              <GradientSpinner size="sm" />
                            ) : (
                              <HiOutlinePencil className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile/Tablet Card View (md and below) */}
          <div className="lg:hidden">
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200"
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14">
                          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                            <HiOutlineUser className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-lg sm:text-xl font-bold text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm sm:text-base text-gray-600">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(user.status === "PENDING_REGISTRATION" ||
                          user.status === "INVITED") && (
                          <SendInviteButton
                            user={user}
                            userPermissions={userPermissions}
                            isSuperAdmin={isSuperAdmin}
                            onSuccess={fetchUsers}
                          />
                        )}
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={modalDataLoading}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            modalDataLoading
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                          }`}
                          title={
                            modalDataLoading
                              ? "Loading roles and departments..."
                              : user.status === "PENDING_REGISTRATION"
                              ? "Assign role and department"
                              : "Edit user"
                          }
                        >
                          {modalDataLoading ? (
                            <GradientSpinner size="sm" />
                          ) : (
                            <HiOutlinePencil className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {formatName(user.role?.name) || "No Role"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {formatName(user.department?.name) ||
                              "No Department"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </div>
                        <div>
                          {user.status === "PENDING_REGISTRATION" ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                              Pending Registration
                            </span>
                          ) : user.status === "INVITED" ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                              Invited
                            </span>
                          ) : user.isActive !== false ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingUser && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingUser(null);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ease-out border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <HiOutlineTrash className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Delete User
                  </h2>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  Are you sure you want to delete{" "}
                  <strong>
                    {deletingUser.firstName} {deletingUser.lastName}
                  </strong>{" "}
                  ({deletingUser.email})?
                </p>
                <p className="text-red-700 text-xs mt-2">
                  This will permanently remove the user and all associated data
                  from the system.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit User Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingUser ? "Edit User" : "Create User"}
                  </h2>
                  {editingUser && editingUser._id === user?._id && (
                    <p className="text-sm text-blue-600 mt-1">
                      ⚠️ You are editing your own profile
                    </p>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>

              {/* Loading State for Modal Data */}
              {modalDataLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <GradientSpinner size="lg" />
                  <p className="mt-4 text-gray-600 text-center">
                    Loading roles and departments...
                  </p>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Please wait while we fetch the latest data
                  </p>
                </div>
              ) : (
                <>
                  {/* Guidance for pending users */}
                  {editingUser?.status === "PENDING_REGISTRATION" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <HiOutlineInformationCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-yellow-800 mb-1">
                            Pending User Setup Required
                          </h3>
                          <p className="text-sm text-yellow-700">
                            This user is pending registration. Please assign a
                            role and department to enable invitation sending.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        className={`w-full p-2 border border-gray-300 rounded-md ${
                          editingUser?.status === "PENDING_REGISTRATION"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        readOnly={
                          editingUser?.status === "PENDING_REGISTRATION"
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className={`w-full p-2 border border-gray-300 rounded-md ${
                          editingUser?.status === "PENDING_REGISTRATION"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        readOnly={
                          editingUser?.status === "PENDING_REGISTRATION"
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={`w-full p-2 border border-gray-300 rounded-md ${
                          editingUser?.status === "PENDING_REGISTRATION"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        readOnly={
                          editingUser?.status === "PENDING_REGISTRATION"
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role *
                        {editingUser && editingUser._id === user?._id && (
                          <span className="text-xs text-blue-600 ml-2">
                            (Cannot change your own role)
                          </span>
                        )}
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className={`w-full p-2 border border-gray-300 rounded-md ${
                          editingUser && editingUser._id === user?._id
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={editingUser && editingUser._id === user?._id}
                        required
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role._id} value={role._id}>
                            {role.name} (Level {role.level}) -{" "}
                            {role.description}
                          </option>
                        ))}
                      </select>

                      {/* Role Capabilities Display */}
                      {selectedRoleDetails && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">
                            🎯 {selectedRoleDetails.name} Capabilities (Level{" "}
                            {selectedRoleDetails.level})
                          </h4>
                          <div className="text-sm text-blue-700">
                            <p className="mb-2">
                              <strong>
                                What this user will be able to do:
                              </strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {getRoleCapabilities(selectedRoleDetails).map(
                                (capability, index) => (
                                  <li key={index} className="text-blue-600">
                                    • {capability}
                                  </li>
                                )
                              )}
                            </ul>
                            {getRoleCapabilities(selectedRoleDetails).length ===
                              0 && (
                              <p className="text-blue-600 italic">
                                • Basic access only
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department *
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name} (Level {dept.level}) -{" "}
                            {dept.description}
                          </option>
                        ))}
                      </select>

                      {/* Department Details Display */}
                      {selectedDepartmentDetails && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="text-sm font-medium text-green-800 mb-2">
                            🏛️ {selectedDepartmentDetails.name} Details (Level{" "}
                            {selectedDepartmentDetails.level})
                          </h4>
                          <div className="text-sm text-green-700">
                            <p className="mb-2">
                              <strong>Department Information:</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              <li className="text-green-600">
                                • <strong>Code:</strong>{" "}
                                {selectedDepartmentDetails.code}
                              </li>
                              <li className="text-green-600">
                                • <strong>Level:</strong>{" "}
                                {selectedDepartmentDetails.level}
                              </li>
                              {selectedDepartmentDetails.description && (
                                <li className="text-green-600">
                                  • <strong>Description:</strong>{" "}
                                  {selectedDepartmentDetails.description}
                                </li>
                              )}
                              {selectedDepartmentDetails.settings
                                ?.allowDocumentUpload && (
                                <li className="text-green-600">
                                  • <strong>Document Upload:</strong> Allowed
                                </li>
                              )}
                              {selectedDepartmentDetails.settings
                                ?.requireApproval && (
                                <li className="text-green-600">
                                  • <strong>Approval Required:</strong> Yes
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={submitting}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <GradientSpinner size="sm" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>{editingUser ? "Update" : "Create"}</span>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
