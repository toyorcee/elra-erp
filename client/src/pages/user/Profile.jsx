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

  // Debug avatarPreview changes
  useEffect(() => {
    console.log(
      "🔄 [Avatar] avatarPreview state changed to:",
      avatarPreview ? "data URL" : "null"
    );
  }, [avatarPreview]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
    loadDepartmentsAndRoles();
  }, [user]); // Only reload when user changes

  // Update avatarPreview when user avatar changes
  useEffect(() => {
    console.log("🔄 [Avatar] User avatar changed in context:", user?.avatar);
    console.log(
      "🔄 [Avatar] Current avatarPreview before clearing:",
      avatarPreview ? "has data URL" : "null"
    );
    if (user?.avatar) {
      console.log("🔄 [Avatar] Clearing avatarPreview to use context avatar");
      setAvatarPreview(null); // Clear any old preview
    }
  }, [user?.avatar]);

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

        // Handle emergency contact - parse if it's a string
        if (
          userData.emergencyContact &&
          typeof userData.emergencyContact === "string"
        ) {
          try {
            userData.emergencyContact = JSON.parse(userData.emergencyContact);
          } catch (e) {
            userData.emergencyContact = {
              name: "",
              relationship: "",
              phone: "",
            };
          }
        }

        // Handle other fields that might be strings
        if (userData.skills && typeof userData.skills === "string") {
          try {
            userData.skills = JSON.parse(userData.skills);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }

        if (
          userData.certifications &&
          typeof userData.certifications === "string"
        ) {
          try {
            userData.certifications = JSON.parse(userData.certifications);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }

        if (
          userData.workExperience &&
          typeof userData.workExperience === "string"
        ) {
          try {
            userData.workExperience = JSON.parse(userData.workExperience);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }

        if (userData.education && typeof userData.education === "string") {
          try {
            userData.education = JSON.parse(userData.education);
          } catch (e) {}
        }

        setProfile(userData);
        if (userData.avatar) {
          setAvatarPreview(userData.avatar);
        }
      } else {
        if (user) {
          setProfile({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            dateOfBirth: user.dateOfBirth || "",
            bio: user.bio || "",
            address: user.address || "",
            city: user.city || "",
            state: user.state || "",
            zipCode: user.zipCode || "",
            emergencyContact: user.emergencyContact || {
              name: "",
              relationship: "",
              phone: "",
            },
            skills: user.skills || "",
            certifications: user.certifications || "",
            workExperience: user.workExperience || "",
            education: user.education || "",
            department: user.department?.name || user.department || "",
            role: user.role?.name || user.role || "",
            position: user.position || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // If API fails, still pre-fill with user data from invitation
      if (user) {
        setProfile({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          dateOfBirth: user.dateOfBirth || "",
          bio: user.bio || "",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
          zipCode: user.zipCode || "",
          emergencyContact: user.emergencyContact || {
            name: "",
            relationship: "",
            phone: "",
          },
          skills: user.skills || "",
          certifications: user.certifications || "",
          workExperience: user.workExperience || "",
          education: user.education || "",
          department: user.department?.name || user.department || "",
          role: user.role?.name || user.role || "",
          position: user.position || "",
        });
      }
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
      console.log("🔄 [Avatar] File selected:", file.name, "Size:", file.size);
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("🔄 [Avatar] Setting avatarPreview to data URL");
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      handleAvatarUpload(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Only send fields that were actually changed
      const updateData = {};

      console.log("🔍 [Profile] Original user data:", {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        bio: user.bio,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        emergencyContact: user.emergencyContact,
        skills: user.skills,
        certifications: user.certifications,
        workExperience: user.workExperience,
        education: user.education,
      });

      console.log("🔍 [Profile] Current profile data:", {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        bio: profile.bio,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        emergencyContact: profile.emergencyContact,
        skills: profile.skills,
        certifications: profile.certifications,
        workExperience: profile.workExperience,
        education: profile.education,
      });

      // Check each field and only include if it's different from the original user data
      if (profile.firstName !== user.firstName) {
        updateData.firstName = profile.firstName;
        console.log(
          "✅ [Profile] firstName changed:",
          user.firstName,
          "→",
          profile.firstName
        );
      }
      if (profile.lastName !== user.lastName) {
        updateData.lastName = profile.lastName;
        console.log(
          "✅ [Profile] lastName changed:",
          user.lastName,
          "→",
          profile.lastName
        );
      }
      if (profile.email !== user.email) {
        updateData.email = profile.email;
        console.log(
          "✅ [Profile] email changed:",
          user.email,
          "→",
          profile.email
        );
      }
      if (profile.phone !== user.phone) {
        updateData.phone = profile.phone;
        console.log(
          "✅ [Profile] phone changed:",
          user.phone,
          "→",
          profile.phone
        );
      }
      if (profile.dateOfBirth !== user.dateOfBirth) {
        updateData.dateOfBirth = profile.dateOfBirth;
        console.log(
          "✅ [Profile] dateOfBirth changed:",
          user.dateOfBirth,
          "→",
          profile.dateOfBirth
        );
      }
      if (profile.bio !== user.bio) {
        updateData.bio = profile.bio;
        console.log("✅ [Profile] bio changed:", user.bio, "→", profile.bio);
      }
      if (profile.address !== user.address) {
        updateData.address = profile.address;
        console.log(
          "✅ [Profile] address changed:",
          user.address,
          "→",
          profile.address
        );
      }
      if (profile.city !== user.city) {
        updateData.city = profile.city;
        console.log("✅ [Profile] city changed:", user.city, "→", profile.city);
      }
      if (profile.state !== user.state) {
        updateData.state = profile.state;
        console.log(
          "✅ [Profile] state changed:",
          user.state,
          "→",
          profile.state
        );
      }
      if (profile.zipCode !== user.zipCode) {
        updateData.zipCode = profile.zipCode;
        console.log(
          "✅ [Profile] zipCode changed:",
          user.zipCode,
          "→",
          profile.zipCode
        );
      }
      if (
        JSON.stringify(profile.emergencyContact) !==
        JSON.stringify(user.emergencyContact)
      ) {
        updateData.emergencyContact = profile.emergencyContact;
        console.log(
          "✅ [Profile] emergencyContact changed:",
          user.emergencyContact,
          "→",
          profile.emergencyContact
        );
      }
      if (profile.skills !== user.skills) {
        updateData.skills = profile.skills || "";
        console.log(
          "✅ [Profile] skills changed:",
          user.skills,
          "→",
          profile.skills
        );
      }
      if (profile.certifications !== user.certifications) {
        updateData.certifications = profile.certifications || "";
        console.log(
          "✅ [Profile] certifications changed:",
          user.certifications,
          "→",
          profile.certifications
        );
      }
      if (profile.workExperience !== user.workExperience) {
        updateData.workExperience = profile.workExperience || "";
        console.log(
          "✅ [Profile] workExperience changed:",
          user.workExperience,
          "→",
          profile.workExperience
        );
      }
      if (profile.education !== user.education) {
        updateData.education = profile.education || "";
        console.log(
          "✅ [Profile] education changed:",
          user.education,
          "→",
          profile.education
        );
      }

      console.log("🔄 [Profile] Final update data being sent:", updateData);
      console.log(
        "🔄 [Profile] Number of fields being updated:",
        Object.keys(updateData).length
      );

      const response = await userModulesAPI.profile.updateProfileData(
        updateData
      );

      if (response.success) {
        toast.success("Profile updated successfully!");
        setEditing(false);

        console.log("🔄 Profile update response:", response);

        if (response.data && response.data.user) {
          const updatedUser = {
            ...user,
            ...response.data.user,
          };
          console.log("🔄 Updating global user state:", updatedUser);
          updateProfile(updatedUser);
        }

        // Reload profile data to show all updated fields
        await loadProfile();
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

  const handleAvatarUpload = async (file) => {
    try {
      console.log("🔄 [Profile] Uploading avatar:", file.name);

      const response = await userModulesAPI.profile.uploadAvatar(file);

      if (response.success) {
        toast.success("Profile picture updated successfully!");

        console.log("🔄 [Avatar] Upload successful, response:", response.data);

        // Clear the preview since the upload is complete
        console.log(
          "🔄 [Avatar] Clearing avatarPreview after successful upload"
        );
        setAvatarPreview(null);
        console.log(
          "🔄 [Avatar] avatarPreview cleared, should now use user.avatar"
        );

        if (response.data && response.data.user) {
          const updatedUser = {
            ...user,
            avatar: response.data.user.avatar,
          };
          console.log(
            "🔄 [Avatar] Updating global user state with new avatar:",
            response.data.user.avatar
          );
          updateProfile(updatedUser);
        }

        // Reload profile data
        await loadProfile();
      } else {
        setError(response.message || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setError(
        error.response?.data?.message || "Failed to upload profile picture"
      );
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

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    const fullUrl = `${baseUrl}${avatarPath}`;
    console.log("🖼️ [getImageUrl] Input:", avatarPath, "Output:", fullUrl);
    return fullUrl;
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
                  className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium cursor-pointer"
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
                        user?.avatar
                          ? getImageUrl(user.avatar)
                          : getDefaultAvatar()
                      }
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                      onError={(e) => {
                        console.log(
                          "❌ [Avatar] Image failed to load:",
                          e.target.src
                        );
                        e.target.src = getDefaultAvatar();
                      }}
                      onLoad={(e) => {
                        console.log(
                          "✅ [Avatar] Image loaded successfully:",
                          e.target.src
                        );
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
                  {profile.position || "Position not assigned"}
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
                      className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white "></div>
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
                      value={profile.position || "Not assigned"}
                      onChange={handleInputChange}
                      disabled={true}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      title="Position is set during invitation and cannot be edited"
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

              {/* Professional Details */}
              <div className="mt-8">
                <h4 className="text-md font-semibold text-[var(--elra-text-primary)] mb-4">
                  Professional Details
                </h4>
                {editing ? (
                  <div className="space-y-6">
                    {/* Step 1: Skills */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-[var(--elra-text-primary)]">
                          Step 1: Skills
                        </label>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          1/4
                        </span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Enter a skill (e.g., Project Management)"
                          className="flex-1 p-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && e.target.value.trim()) {
                              e.preventDefault();
                              const newSkill = e.target.value.trim();
                              const currentSkills = profile.skills
                                ? profile.skills.split(", ")
                                : [];
                              if (!currentSkills.includes(newSkill)) {
                                setProfile((prev) => ({
                                  ...prev,
                                  skills:
                                    currentSkills.length > 0
                                      ? `${prev.skills}, ${newSkill}`
                                      : newSkill,
                                }));
                              }
                              e.target.value = "";
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            if (input.value.trim()) {
                              const newSkill = input.value.trim();
                              const currentSkills = profile.skills
                                ? profile.skills.split(", ")
                                : [];
                              if (!currentSkills.includes(newSkill)) {
                                setProfile((prev) => ({
                                  ...prev,
                                  skills:
                                    currentSkills.length > 0
                                      ? `${prev.skills}, ${newSkill}`
                                      : newSkill,
                                }));
                              }
                              input.value = "";
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      {profile.skills && (
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.split(", ").map((skill, index) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => {
                                  const skills = profile.skills
                                    .split(", ")
                                    .filter((_, i) => i !== index);
                                  setProfile((prev) => ({
                                    ...prev,
                                    skills: skills.join(", "),
                                  }));
                                }}
                                className="text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step 2: Certifications */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-[var(--elra-text-primary)]">
                          Step 2: Certifications
                        </label>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          2/4
                        </span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Enter a certification (e.g., PMP, ACCA)"
                          className="flex-1 p-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && e.target.value.trim()) {
                              e.preventDefault();
                              const newCert = e.target.value.trim();
                              const currentCerts = profile.certifications
                                ? profile.certifications.split(", ")
                                : [];
                              if (!currentCerts.includes(newCert)) {
                                setProfile((prev) => ({
                                  ...prev,
                                  certifications:
                                    currentCerts.length > 0
                                      ? `${prev.certifications}, ${newCert}`
                                      : newCert,
                                }));
                              }
                              e.target.value = "";
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            if (input.value.trim()) {
                              const newCert = input.value.trim();
                              const currentCerts = profile.certifications
                                ? profile.certifications.split(", ")
                                : [];
                              if (!currentCerts.includes(newCert)) {
                                setProfile((prev) => ({
                                  ...prev,
                                  certifications:
                                    currentCerts.length > 0
                                      ? `${prev.certifications}, ${newCert}`
                                      : newCert,
                                }));
                              }
                              input.value = "";
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      {profile.certifications && (
                        <div className="flex flex-wrap gap-2">
                          {profile.certifications
                            .split(", ")
                            .map((cert, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                              >
                                {cert}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const certs = profile.certifications
                                      .split(", ")
                                      .filter((_, i) => i !== index);
                                    setProfile((prev) => ({
                                      ...prev,
                                      certifications: certs.join(", "),
                                    }));
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Step 3: Work Experience */}
                    <div className="border border-[var(--elra-border-primary)] p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-[var(--elra-text-primary)]">
                          Step 3: Work Experience
                        </label>
                        <span className="text-xs bg-[var(--elra-primary)] text-white px-2 py-1 rounded">
                          3/4
                        </span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Enter work experience (e.g., Finance Director at Financial Services Ltd (2020-2023))"
                          className="flex-1 p-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && e.target.value.trim()) {
                              e.preventDefault();
                              const newExp = e.target.value.trim();
                              const currentExp = profile.workExperience
                                ? profile.workExperience.split(", ")
                                : [];
                              if (!currentExp.includes(newExp)) {
                                setProfile((prev) => ({
                                  ...prev,
                                  workExperience:
                                    currentExp.length > 0
                                      ? `${prev.workExperience}, ${newExp}`
                                      : newExp,
                                }));
                              }
                              e.target.value = "";
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            if (input.value.trim()) {
                              const newExp = input.value.trim();
                              const currentExp = profile.workExperience
                                ? profile.workExperience.split(", ")
                                : [];
                              if (!currentExp.includes(newExp)) {
                                setProfile((prev) => ({
                                  ...prev,
                                  workExperience:
                                    currentExp.length > 0
                                      ? `${prev.workExperience}, ${newExp}`
                                      : newExp,
                                }));
                              }
                              input.value = "";
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      {profile.workExperience && (
                        <div className="flex flex-wrap gap-2">
                          {profile.workExperience
                            .split(", ")
                            .map((exp, index) => (
                              <span
                                key={index}
                                className="bg-[var(--elra-primary)] text-white px-2 py-1 rounded-full text-sm flex items-center gap-1"
                              >
                                {exp}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const expList = profile.workExperience
                                      .split(", ")
                                      .filter((_, i) => i !== index);
                                    setProfile((prev) => ({
                                      ...prev,
                                      workExperience: expList.join(", "),
                                    }));
                                  }}
                                  className="text-white hover:text-gray-200"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Step 4: Education */}
                    <div className="border border-[var(--elra-border-primary)] p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-[var(--elra-text-primary)]">
                          Step 4: Education
                        </label>
                        <span className="text-xs bg-[var(--elra-primary)] text-white px-2 py-1 rounded">
                          4/4
                        </span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Enter education (e.g., Bachelor of Science - Accounting, University of Nigeria (2014))"
                          className="flex-1 p-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && e.target.value.trim()) {
                              e.preventDefault();
                              const newEdu = e.target.value.trim();
                              const currentEdu = profile.education
                                ? profile.education.split(", ")
                                : [];
                              if (!currentEdu.includes(newEdu)) {
                                setProfile((prev) => ({
                                  ...prev,
                                  education:
                                    currentEdu.length > 0
                                      ? `${prev.education}, ${newEdu}`
                                      : newEdu,
                                }));
                              }
                              e.target.value = "";
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            if (input.value.trim()) {
                              const newEdu = input.value.trim();
                              const currentEdu = profile.education
                                ? profile.education.split(", ")
                                : [];
                              if (!currentEdu.includes(newEdu)) {
                                setProfile((prev) => ({
                                  ...prev,
                                  education:
                                    currentEdu.length > 0
                                      ? `${prev.education}, ${newEdu}`
                                      : newEdu,
                                }));
                              }
                              input.value = "";
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      {profile.education && (
                        <div className="flex flex-wrap gap-2">
                          {profile.education.split(", ").map((edu, index) => (
                            <span
                              key={index}
                              className="bg-[var(--elra-primary)] text-white px-2 py-1 rounded-full text-sm flex items-center gap-1"
                            >
                              {edu}
                              <button
                                type="button"
                                onClick={() => {
                                  const eduList = profile.education
                                    .split(", ")
                                    .filter((_, i) => i !== index);
                                  setProfile((prev) => ({
                                    ...prev,
                                    education: eduList.join(", "),
                                  }));
                                }}
                                className="text-white hover:text-gray-200"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                        Skills
                      </label>
                      <div className="p-3 border border-[var(--elra-border-primary)] rounded-lg bg-gray-50">
                        {profile.skills ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.split(", ").map((skill, index) => (
                              <span
                                key={index}
                                className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No skills added</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                        Certifications
                      </label>
                      <div className="p-3 border border-[var(--elra-border-primary)] rounded-lg bg-gray-50">
                        {profile.certifications ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.certifications
                              .split(", ")
                              .map((cert, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                                >
                                  {cert}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            No certifications added
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                        Work Experience
                      </label>
                      <div className="p-3 border border-[var(--elra-border-primary)] rounded-lg">
                        {profile.workExperience ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.workExperience
                              .split(", ")
                              .map((exp, index) => (
                                <span
                                  key={index}
                                  className="bg-[var(--elra-primary)] text-white px-2 py-1 rounded-full text-sm"
                                >
                                  {exp}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            No work experience added
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                        Education
                      </label>
                      <div className="p-3 border border-[var(--elra-border-primary)] rounded-lg">
                        {profile.education ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.education.split(", ").map((edu, index) => (
                              <span
                                key={index}
                                className="bg-[var(--elra-primary)] text-white px-2 py-1 rounded-full text-sm"
                              >
                                {edu}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            No education added
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
