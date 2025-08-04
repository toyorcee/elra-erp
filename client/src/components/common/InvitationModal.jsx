import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  MdSend,
  MdClose,
  MdPerson,
  MdSecurity,
  MdBusiness,
  MdEmail,
  MdWork,
  MdLocationOn,
} from "react-icons/md";
import { sendInvitation } from "../../services/invitations";

const InvitationModal = ({
  isOpen,
  onClose,
  onSuccess,
  userPermissions = {},
  isSuperAdmin = false,
}) => {
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

  // NAIC-specific position to department mapping
  const positionDepartmentMapping = {
    "Claims Officer": "CLAIMS",
    "Claims Manager": "CLAIMS",
    Underwriter: "UNDERWRITE",
    "Senior Underwriter": "UNDERWRITE",
    "Regional Manager": "REGIONAL",
    "Compliance Officer": "COMPLIANCE",
    Auditor: "COMPLIANCE",
    "Finance Officer": "FINANCE",
    Accountant: "FINANCE",
    "HR Officer": "HR",
    "IT Support": "IT",
    "IT Manager": "IT",
    "Executive Director": "EXECUTIVE",
    "General Staff": "CLAIMS",
    "Junior Staff": "CLAIMS",
  };

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const sendInvitationMutation = useMutation({
    mutationFn: sendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries(["invitations"]);
      queryClient.invalidateQueries(["users"]);
      toast.success("NAIC Staff invitation sent successfully!");
      onSuccess && onSuccess();
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
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
      position: "",
      role: "",
      department: "",
      notes: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find the role ID based on role name
      const selectedRole = roles.find((r) => r.name === formData.role);
      const selectedDepartment = departments.find(
        (d) => d.code === formData.department
      );

      if (!selectedRole || !selectedDepartment) {
        throw new Error("Invalid role or department selection");
      }

      const invitationData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        position: formData.position,
        roleId: selectedRole._id,
        departmentId: selectedDepartment._id,
        notes: formData.notes,
      };

      await sendInvitationMutation.mutateAsync(invitationData);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = (position) => {
    const role = positionRoleMapping[position];
    const department = positionDepartmentMapping[position];

    setFormData({
      ...formData,
      position,
      role: role || "",
      department: department || "",
    });
  };

  // Check permissions
  const canInviteUsers = isSuperAdmin || userPermissions.canManageUsers;
  const canAssignRoles = isSuperAdmin || userPermissions.canManageRoles;

  if (!isOpen) return null;

  if (!canInviteUsers) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to invite users.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Invite NAIC Staff
            </h2>
            <p className="text-sm text-gray-600">
              Send invitation to new NAIC staff member
            </p>
          </div>
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
              Staff Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="First Name"
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
                  placeholder="Last Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position/Title *
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => handlePositionChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Position</option>
                  <option value="Claims Officer">Claims Officer</option>
                  <option value="Claims Manager">Claims Manager</option>
                  <option value="Underwriter">Underwriter</option>
                  <option value="Senior Underwriter">Senior Underwriter</option>
                  <option value="Regional Manager">Regional Manager</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Finance Officer">Finance Officer</option>
                  <option value="Accountant">Accountant</option>
                  <option value="HR Officer">HR Officer</option>
                  <option value="IT Support">IT Support</option>
                  <option value="IT Manager">IT Manager</option>
                  <option value="Executive Director">Executive Director</option>
                  <option value="General Staff">General Staff</option>
                  <option value="Junior Staff">Junior Staff</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role and Department Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MdSecurity className="w-5 h-5" />
              Role & Department (Auto-assigned)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Role
                </label>
                <input
                  type="text"
                  value={formData.role}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                  placeholder="Will be auto-assigned based on position"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                  placeholder="Will be auto-assigned based on position"
                />
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MdEmail className="w-5 h-5" />
              Invitation Message
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md"
              rows="4"
              placeholder="Welcome to NAIC! You have been invited to join our Electronic Document Management System. Please complete your registration to access the platform."
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <MdSend className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvitationModal;
