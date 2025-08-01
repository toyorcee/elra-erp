import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  MdSend,
  MdClose,
  MdPerson,
  MdSecurity,
  MdBusiness,
} from "react-icons/md";

// API function to send invitation
const sendInvitation = async (invitationData) => {
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(invitationData),
  });
  if (!response.ok) throw new Error("Failed to send invitation");
  return response.json();
};

const SendInvitationModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    position: "",
    role: "",
    department: "",
    notes: "",
  });

  // NAIC-specific position mappings to roles
  const positionRoleMapping = {
    "Claims Officer": "STAFF",
    "Claims Manager": "SUPERVISOR",
    Underwriter: "SENIOR_STAFF",
    "Senior Underwriter": "SUPERVISOR",
    "Regional Manager": "MANAGER",
    "Compliance Officer": "SENIOR_STAFF",
    Auditor: "SENIOR_STAFF",
    "Finance Officer": "STAFF",
    Accountant: "STAFF",
    "HR Officer": "STAFF",
    "IT Support": "STAFF",
    "IT Manager": "SUPERVISOR",
    "Executive Director": "MANAGER",
    "General Staff": "STAFF",
    "Junior Staff": "JUNIOR_STAFF",
  };

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const sendInvitationMutation = useMutation({
    mutationFn: sendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries(["invitations"]);
      toast.success("Invitation sent successfully!");
      onSuccess && onSuccess();
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Fetch departments and roles on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const deptResponse = await fetch("/api/departments", {
          credentials: "include",
        });
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData.data || []);
        }

        // Fetch roles
        const roleResponse = await fetch("/api/roles", {
          credentials: "include",
        });
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          setRoles(roleData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      role: "STAFF",
      department: "",
      permissions: {
        canUploadDocuments: true,
        canViewDocuments: true,
        canApproveDocuments: false,
        canManageUsers: false,
        canViewAllDepartments: false,
        canManageRoles: false,
      },
      customMessage: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendInvitationMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Error sending invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  const handleRoleChange = (roleId) => {
    setFormData((prev) => ({ ...prev, role: roleId }));

    // Auto-set permissions based on role
    const selectedRole = roles.find((r) => r._id === roleId);
    if (selectedRole) {
      const defaultPermissions = {
        canUploadDocuments:
          selectedRole.permissions?.includes("document.upload") || false,
        canViewDocuments:
          selectedRole.permissions?.includes("document.view") || false,
        canApproveDocuments:
          selectedRole.permissions?.includes("document.approve") || false,
        canManageUsers:
          selectedRole.permissions?.includes("user.manage") || false,
        canViewAllDepartments:
          selectedRole.permissions?.includes("department.view_all") || false,
        canManageRoles:
          selectedRole.permissions?.includes("user.assign_role") || false,
      };

      setFormData((prev) => ({
        ...prev,
        permissions: defaultPermissions,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Send Invitation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MdPerson className="w-5 h-5" />
              NAIC Staff Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="staff@naic.gov.ng"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="John"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Role Assignment */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MdSecurity className="w-5 h-5" />
              Role Assignment
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name.replace(/_/g, " ")} (Level {role.level})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Role determines base permissions. You can customize below.
              </p>
            </div>
          </div>

          {/* Custom Permissions */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MdBusiness className="w-5 h-5" />
              Custom Permissions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canUploadDocuments}
                    onChange={() =>
                      handlePermissionChange("canUploadDocuments")
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Can Upload Documents</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canViewDocuments}
                    onChange={() => handlePermissionChange("canViewDocuments")}
                    className="mr-2"
                  />
                  <span className="text-sm">Can View Documents</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canApproveDocuments}
                    onChange={() =>
                      handlePermissionChange("canApproveDocuments")
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Can Approve Documents</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canManageUsers}
                    onChange={() => handlePermissionChange("canManageUsers")}
                    className="mr-2"
                  />
                  <span className="text-sm">Can Manage Users</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canViewAllDepartments}
                    onChange={() =>
                      handlePermissionChange("canViewAllDepartments")
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Can View All Departments</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canManageRoles}
                    onChange={() => handlePermissionChange("canManageRoles")}
                    className="mr-2"
                  />
                  <span className="text-sm">Can Manage Roles</span>
                </label>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={formData.customMessage}
              onChange={(e) =>
                setFormData({ ...formData, customMessage: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="Add a personal message to the invitation email..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || sendInvitationMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <MdSend className="w-4 h-4" />
              {loading || sendInvitationMutation.isPending
                ? "Sending..."
                : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendInvitationModal;
