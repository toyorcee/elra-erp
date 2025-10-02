import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineUsers,
  HiOutlineUserPlus,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineTrash,
} from "react-icons/hi2";
import { useAuth } from "../../../../context/AuthContext";
import DataTable from "../../../../components/common/DataTable";
import { getImageUrl } from "../../../../utils/fileUtils.js";

const TeamManagement = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    employeeId: "",
    department: "",
    startDate: "",
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch department team members
      // For now, using mock data
      const mockTeam = [
        {
          id: "1",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@elra.com",
          phone: "08012345678",
          position: "Software Developer",
          employeeId: "IT001",
          department: "Information Technology",
          startDate: "2024-01-15",
          status: "active",
          avatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        },
        {
          id: "2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@elra.com",
          phone: "08023456789",
          position: "System Analyst",
          employeeId: "IT002",
          department: "Information Technology",
          startDate: "2024-03-20",
          status: "active",
          avatar:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        },
        {
          id: "3",
          firstName: "Mike",
          lastName: "Johnson",
          email: "mike.johnson@elra.com",
          phone: "08034567890",
          position: "Network Engineer",
          employeeId: "IT003",
          department: "Information Technology",
          startDate: "2024-06-10",
          status: "active",
          avatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        },
      ];
      setTeamMembers(mockTeam);
    } catch (error) {
      console.error("❌ [TeamManagement] Error fetching team members:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      employeeId: "",
      department: user.department?.name || "",
      startDate: "",
      status: "active",
    });
    setShowAddModal(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      position: member.position,
      employeeId: member.employeeId,
      department: member.department,
      startDate: member.startDate,
      status: member.status,
    });
    setShowEditModal(true);
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (showAddModal) {
        // TODO: Implement API call to add team member
        toast.success("Team member added successfully");
        setShowAddModal(false);
      } else {
        // TODO: Implement API call to update team member
        toast.success("Team member updated successfully");
        setShowEditModal(false);
      }
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        employeeId: "",
        department: "",
        startDate: "",
        status: "active",
      });
      setSelectedMember(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("❌ [TeamManagement] Error saving team member:", error);
      toast.error("Failed to save team member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      try {
        // TODO: Implement API call to delete team member
        toast.success("Team member removed successfully");
        fetchTeamMembers();
      } catch (error) {
        console.error("❌ [TeamManagement] Error deleting team member:", error);
        toast.error("Failed to remove team member");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns = [
    {
      header: "Employee",
      accessor: "firstName",
      skeletonRenderer: () => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      ),
      renderer: (row) => (
        <div className="flex items-center space-x-3">
          <img
            src={getImageUrl(row.avatar)}
            alt={`${row.firstName} ${row.lastName}`}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-gray-900">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Position",
      accessor: "position",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className="text-sm text-gray-900">{row.position}</span>
      ),
    },
    {
      header: "Employee ID",
      accessor: "employeeId",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className="text-sm font-mono text-gray-600">
          {row.employeeId}
        </span>
      ),
    },
    {
      header: "Phone",
      accessor: "phone",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className="text-sm text-gray-900">{row.phone}</span>
      ),
    },
    {
      header: "Start Date",
      accessor: "startDate",
      skeletonRenderer: () => (
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span className="text-sm text-gray-500">
          {formatDate(row.startDate)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      ),
      renderer: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      skeletonRenderer: () => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ),
      renderer: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewMember(row)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="View Details"
          >
            <HiOutlineEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditMember(row)}
            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="Edit Member"
          >
            <HiOutlinePencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteMember(row.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="Remove Member"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (!user || user.role.level < 700) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h1>
            <p className="text-red-600">
              You don't have permission to access this page. Only Department
              Heads (HODs) can manage team members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Team Management
          </h1>
          <p className="text-gray-600">
            Manage your department team members, their roles, and information.
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {user.department?.name} Department Team
              </h2>
              <p className="text-sm text-gray-500">
                {teamMembers.length} team member
                {teamMembers.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={handleAddMember}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              <HiOutlineUserPlus className="w-4 h-4 mr-2" />
              Add Team Member
            </button>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-lg shadow">
          <DataTable
            data={teamMembers}
            columns={columns}
            loading={loading}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
            }}
            emptyMessage={{
              title: "No team members found",
              description:
                "Start building your team by adding the first member",
            }}
          />
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showAddModal ? "Add Team Member" : "Edit Team Member"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setFormData({
                        firstName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        position: "",
                        employeeId: "",
                        department: "",
                        startDate: "",
                        status: "active",
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-md hover:bg-[var(--elra-primary-dark)] disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : showAddModal
                      ? "Add Member"
                      : "Update Member"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Team Member Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedMember(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
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

              <div className="flex items-start space-x-6">
                <img
                  src={getImageUrl(selectedMember.avatar)}
                  alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Full Name</h4>
                      <p className="text-gray-600">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Email</h4>
                      <p className="text-gray-600">{selectedMember.email}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Phone</h4>
                      <p className="text-gray-600">{selectedMember.phone}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Position</h4>
                      <p className="text-gray-600">{selectedMember.position}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Employee ID</h4>
                      <p className="text-gray-600 font-mono">
                        {selectedMember.employeeId}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Department</h4>
                      <p className="text-gray-600">
                        {selectedMember.department}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Start Date</h4>
                      <p className="text-gray-600">
                        {formatDate(selectedMember.startDate)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Status</h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedMember.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedMember.status.charAt(0).toUpperCase() +
                          selectedMember.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
