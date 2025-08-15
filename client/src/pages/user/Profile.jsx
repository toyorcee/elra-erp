import React, { useState, useEffect } from "react";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { userModulesAPI } from "../../services/userModules.js";
import { useAuth } from "../../context/AuthContext";
import defaultAvatar from "../../assets/defaulticon.jpg";

const Profile = () => {
  const { user, updateProfile } = useAuth();

  console.log("🔄 Profile: User avatar updated:", user?.avatar);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    department: "",
    role: "",
    position: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    bio: "",
    skills: [],
    certifications: [],
    workExperience: [],
    education: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
    loadDepartmentsAndRoles();
  }, [user]); // Only reload when user changes

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.profile.getProfile();
      if (response.success && response.data && response.data.user) {
        // Handle address object properly
        const userData = response.data.user;
        if (userData.address && typeof userData.address === "object") {
          userData.address =
            userData.address.street || userData.address.address || "";
        }

        setProfile(userData);
        if (userData.avatar) {
          setAvatarPreview(userData.avatar);
        }
      } else {
        if (user) {
          setProfile((prev) => ({
            ...prev,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            department: user.department?.name || user.department || "",
            role: user.role?.name || user.role || "",
            position: user.position || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // If API fails, still pre-fill with user data from invitation
      if (user) {
        setProfile((prev) => ({
          ...prev,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          department: user.department?.name || user.department || "",
          role: user.role?.name || user.role || "",
          position: user.position || "",
        }));
      }
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentsAndRoles = async () => {
    try {
      const [deptResponse, rolesResponse] = await Promise.all([
        userModulesAPI.departments.getAllDepartments(),
        userModulesAPI.roles.getAllRoles(),
      ]);

      if (deptResponse.success) {
        setDepartments(deptResponse.data || []);
      }
      if (rolesResponse.success) {
        setRoles(rolesResponse.data || []);
      }
    } catch (error) {
      console.error("Error loading departments/roles:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfile((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();

      // Add basic profile data
      Object.keys(profile).forEach((key) => {
        if (key !== "avatar" && typeof profile[key] !== "object") {
          formData.append(key, profile[key]);
        }
      });

      // Add emergency contact
      formData.append(
        "emergencyContact",
        JSON.stringify(profile.emergencyContact)
      );

      // Add arrays
      formData.append("skills", JSON.stringify(profile.skills));
      formData.append("certifications", JSON.stringify(profile.certifications));
      formData.append("workExperience", JSON.stringify(profile.workExperience));
      formData.append("education", JSON.stringify(profile.education));

      // Add avatar if selected
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const response = await userModulesAPI.profile.updateProfile(formData);

      if (response.success) {
        toast.success("Profile updated successfully!");
        setEditing(false);

        console.log("🔄 Profile update response:", response);

        if (response.data && response.data.user) {
          const updatedUser = {
            ...user,
            ...response.data.user,
            avatar: response.data.user.avatar || user.avatar,
          };
          console.log("🔄 Updating global user state:", updatedUser);
          updateProfile(updatedUser);
        }
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const first = profile.firstName?.charAt(0) || "";
    const last = profile.lastName?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--elra-bg-light)] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
          <p className="mt-4 text-[var(--elra-text-secondary)]">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--elra-bg-light)] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-[var(--elra-text-secondary)]" />
              </button>
              <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  My Profile
                </h1>
                <p className="text-[var(--elra-text-secondary)]">
                  Manage your personal information and professional details
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-[var(--elra-primary)] flex items-center justify-center text-white text-3xl font-bold mb-4 mx-auto overflow-hidden">
                    <img
                      src={
                        avatarPreview ||
                        (profile.avatar
                          ? getImageUrl(profile.avatar)
                          : getDefaultAvatar())
                      }
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = getDefaultAvatar();
                      }}
                    />
                  </div>
                  {editing && (
                    <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <CameraIcon className="h-4 w-4 text-[var(--elra-primary)]" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-bold text-[var(--elra-text-primary)]">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-[var(--elra-text-secondary)]">
                  {profile.position}
                </p>
                <p className="text-sm text-[var(--elra-text-muted)]">
                  {profile.department?.name || profile.department || ""}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-[var(--elra-text-secondary)]" />
                  <span className="text-sm text-[var(--elra-text-primary)]">
                    {profile.email}
                  </span>
                </div>
                {profile.phone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-[var(--elra-text-secondary)]" />
                    <span className="text-sm text-[var(--elra-text-primary)]">
                      {profile.phone}
                    </span>
                  </div>
                )}
                {profile.employeeId && (
                  <div className="flex items-center space-x-3">
                    <IdentificationIcon className="h-5 w-5 text-[var(--elra-text-secondary)]" />
                    <span className="text-sm text-[var(--elra-text-primary)]">
                      ID: {profile.employeeId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--elra-text-primary)]">
                  Personal Information
                </h3>
                {editing && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      name="employeeId"
                      value={profile.employeeId || "Not assigned"}
                      onChange={handleInputChange}
                      disabled={true}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      title="Employee ID is automatically generated and cannot be edited"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={profile.position}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="e.g., Leasing Agent, Property Manager"
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={profile.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleInputChange}
                      disabled={!editing}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="mt-8">
                <h4 className="text-md font-semibold text-[var(--elra-text-primary)] mb-4 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={profile.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={profile.city}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={profile.state}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={profile.zipCode}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mt-8">
                <h4 className="text-md font-semibold text-[var(--elra-text-primary)] mb-4">
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={profile.emergencyContact?.name || ""}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyContact.relationship"
                      value={profile.emergencyContact?.relationship || ""}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="e.g., Spouse, Parent"
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={profile.emergencyContact?.phone || ""}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
