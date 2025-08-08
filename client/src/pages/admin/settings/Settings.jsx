import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

import {
  MdPerson,
  MdNotifications,
  MdSecurity,
  MdSettings,
  MdSave,
  MdEdit,
  MdVisibility,
  MdVisibilityOff,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdLanguage,
  MdPalette,
  MdStorage,
  MdSpeed,
  MdAdminPanelSettings,
  MdBusiness,
  MdGroup,
} from "react-icons/md";
import { toast } from "react-toastify";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../../../services/admin/systemSettings";

import {
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from "../../../services/profile";
import { useProfile } from "../../../hooks/useProfile";

// Helper function to get full image URL
const getImageUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;

  const baseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace("/api", "");
  return `${baseUrl}${avatarPath}`;
};

const Settings = () => {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const {
    uploadProfilePicture: uploadProfilePictureMutation,
    isUploadingPicture,
  } = useProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("system");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    bio: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
    },
    employeeId: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department?.name || "",
        position: user.position || "",
        bio: user.bio || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          postalCode: user.address?.postalCode || "",
        },
        employeeId: user.employeeId || "",
      });
      setProfilePicture(user.avatar || null);
    }
  }, [user]);

  // Profile Picture State - now using React Query
  const [profilePicture, setProfilePicture] = useState(user?.avatar || null);

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    documentApprovals: true,
    systemUpdates: true,
    weeklyReports: false,
    dailyDigest: false,
  });

  // Security Settings
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false,
    sessionTimeout: 30,
  });

  // System Preferences
  const [systemPreferences, setSystemPreferences] = useState({
    theme: "auto",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    autoSave: true,
    compactMode: false,
  });

  // System Settings (SUPER_ADMIN only)
  const [systemSettings, setSystemSettings] = useState({
    allowPublicRegistration: true,
    requireDepartmentSelection: true,
    requireEmailVerification: true,
    defaultDepartment: "",
    maxFileSize: 10, // MB
    allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
    sessionTimeout: 30, // minutes
    enableTwoFactorAuth: false,
    enableAuditLogs: true,
    enableEmailNotifications: true,
  });

  // Handler for department selection toggle
  const handleDepartmentSelectionToggle = (newValue) => {
    console.log("🎯 DEPARTMENT SELECTION TOGGLE CLICKED!");
    console.log(
      "📊 Previous value:",
      systemSettings.requireDepartmentSelection
    );
    console.log("🔄 New value:", newValue);
    console.log("👤 User:", user?.username, "(", user?.email, ")");
    console.log("⏰ Timestamp:", new Date().toISOString());

    setSystemSettings((prev) => ({
      ...prev,
      requireDepartmentSelection: newValue,
    }));

    console.log("✅ State updated successfully");
    console.log("---");
  };

  const tabs = [
    { id: "system", label: "System Settings", icon: MdAdminPanelSettings },
    { id: "profile", label: "Profile", icon: MdPerson },
    { id: "notifications", label: "Notifications", icon: MdNotifications },
    { id: "security", label: "Security", icon: MdSecurity },
    { id: "preferences", label: "Preferences", icon: MdSettings },
  ];

  // Fetch system settings on component mount
  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const response = await getSystemSettings();

      // Map backend settings to frontend state
      const backendSettings = response.data.settings;
      setSystemSettings({
        allowPublicRegistration:
          backendSettings.registration.allowPublicRegistration,
        requireDepartmentSelection:
          backendSettings.registration.requireDepartmentSelection,
        requireEmailVerification:
          backendSettings.registration.requireEmailVerification,
        defaultDepartment: backendSettings.registration.defaultDepartment,
        maxFileSize: backendSettings.fileUpload.maxFileSize,
        allowedFileTypes: backendSettings.fileUpload.allowedFileTypes,
        sessionTimeout: backendSettings.security.sessionTimeout,
        enableTwoFactorAuth: backendSettings.security.passwordRequireUppercase, // Placeholder
        enableAuditLogs: true, // Placeholder
        enableEmailNotifications:
          backendSettings.notifications.emailNotifications,
      });
    } catch (error) {
      console.error("Error fetching system settings:", error);
      toast.error("Failed to fetch system settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsSave = async () => {
    try {
      console.log("🚀 SAVE BUTTON CLICKED!");
      console.log("👤 User:", user?.username, "(", user?.email, ")");
      console.log("📝 Current system settings state:", systemSettings);

      setSaving(true);
      console.log("🔄 Setting saving state to true...");

      // Map frontend settings to backend format
      const backendSettings = {
        registration: {
          allowPublicRegistration: systemSettings.allowPublicRegistration,
          requireDepartmentSelection: systemSettings.requireDepartmentSelection,
          requireEmailVerification: systemSettings.requireEmailVerification,
          defaultDepartment: systemSettings.defaultDepartment,
        },
        fileUpload: {
          maxFileSize: systemSettings.maxFileSize,
          allowedFileTypes: systemSettings.allowedFileTypes,
        },
        security: {
          sessionTimeout: systemSettings.sessionTimeout,
        },
        notifications: {
          emailNotifications: systemSettings.enableEmailNotifications,
        },
      };

      console.log("🔄 Backend settings format:", backendSettings);
      console.log("🌐 Making API call to updateSystemSettings...");
      console.log("📡 API URL: /system-settings");
      console.log("📤 Request method: PUT");

      const response = await updateSystemSettings(backendSettings);

      console.log("✅ API Response received:", response);
      console.log("📊 Response data:", response.data);

      // Show success toast with details
      toast.success(
        `System settings updated successfully! Updated by ${response.data.updatedBy.username}`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      console.log("🎉 Toast notification shown");

      // Log the update details
      console.log("✅ System Settings Updated Successfully:", {
        updatedBy: response.data.updatedBy,
        timestamp: response.data.timestamp,
        settings: response.data.settings,
      });
      console.log("---");
    } catch (error) {
      console.error("❌ Error updating system settings:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });

      toast.error(
        error.response?.data?.message || "Failed to update system settings",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    } finally {
      setSaving(false);
      console.log("🔄 Setting saving state to false");
    }
  };

  const handleProfileSave = async () => {
    try {
      console.log("🔄 Saving profile data:", profileData);
      setSaving(true);

      // Remove department from profileData since it's not editable by users
      const { department, ...updateData } = profileData;

      const response = await updateProfile(updateData);

      console.log("✅ Profile update response:", response);
      toast.success("Profile updated successfully");
      updateAuthProfile(response.data.user);
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    setLoading(true);
    try {
      // API call to update security settings
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Security settings updated successfully!");
      setSecurityData({
        ...securityData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to update security settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSave = async () => {
    setLoading(true);
    try {
      // API call to update preferences
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Preferences updated successfully!");
    } catch (error) {
      toast.error("Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  // Profile Picture Upload Handler - now using React Query
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
        );
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      try {
        console.log(
          "📁 Uploading profile picture:",
          file.name,
          file.size,
          "bytes"
        );

        // Use React Query mutation
        uploadProfilePictureMutation(file, {
          onSuccess: (response) => {
            console.log("✅ Profile picture upload response:", response);
            setProfilePicture(response.data.user.avatar);
            toast.success("Profile picture updated successfully!");
          },
          onError: (error) => {
            console.error("❌ Profile picture upload error:", error);
            toast.error(
              error.response?.data?.message ||
                "Failed to upload profile picture"
            );
          },
        });
      } catch (error) {
        console.error("❌ Profile picture upload error:", error);
        toast.error(
          error.response?.data?.message || "Failed to upload profile picture"
        );
      }
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      await handleProfilePictureUpload(event);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <div className="bg-white/80 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <MdPerson className="mr-2 text-blue-600" />
          Profile Picture
        </h3>

        <div className="flex items-center space-x-6">
          {/* Profile Picture Display */}
          <div className="relative group">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-500 p-1">
              {profilePicture ? (
                <img
                  src={getImageUrl(profilePicture)}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full rounded-full bg-gray-200 flex items-center justify-center ${
                  profilePicture ? "hidden" : ""
                }`}
              >
                <MdPerson className="w-12 h-12 text-gray-400" />
              </div>

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <MdEdit className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Upload Button */}
            <input
              type="file"
              id="profile-picture-upload"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
            <label
              htmlFor="profile-picture-upload"
              className="absolute inset-0 cursor-pointer"
              title="Click to upload or drag and drop an image"
            />
          </div>

          {/* Upload Info */}
          <div className="flex-1">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Update Profile Picture
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Click the image above or drag and drop a new photo. Supported
              formats: JPEG, PNG, GIF, WebP (max 5MB)
            </p>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <MdEdit className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {isUploadingPicture
                  ? "Uploading..."
                  : "Drag and drop an image here"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white/80 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MdPerson className="mr-2 text-blue-600" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) =>
                setProfileData({ ...profileData, firstName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) =>
                setProfileData({ ...profileData, lastName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) =>
                setProfileData({ ...profileData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID
            </label>
            <input
              type="text"
              value={profileData.employeeId}
              onChange={(e) =>
                setProfileData({ ...profileData, employeeId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="EMP001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              type="text"
              value={profileData.department}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <input
              type="text"
              value={profileData.position}
              onChange={(e) =>
                setProfileData({ ...profileData, position: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="System Administrator"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={profileData.address.street}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, street: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={profileData.address.city}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, city: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Province
            </label>
            <input
              type="text"
              value={profileData.address.state}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, state: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="State"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={profileData.address.postalCode}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  address: {
                    ...profileData.address,
                    postalCode: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ZIP/Postal Code"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={profileData.bio}
            onChange={(e) =>
              setProfileData({ ...profileData, bio: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="mt-6">
          <button
            onClick={handleProfileSave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <MdSave className="mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MdNotifications className="mr-2 text-blue-600" />
          Notification Preferences
        </h3>

        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="font-medium text-gray-900 capitalize">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </h4>
                <p className="text-sm text-gray-500">
                  {key === "emailNotifications" &&
                    "Receive notifications via email"}
                  {key === "pushNotifications" &&
                    "Receive push notifications in browser"}
                  {key === "documentApprovals" &&
                    "Get notified about document approval requests"}
                  {key === "systemUpdates" &&
                    "Receive system update notifications"}
                  {key === "weeklyReports" && "Get weekly summary reports"}
                  {key === "dailyDigest" &&
                    "Receive daily digest of activities"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      [key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={() => toast.success("Notification preferences saved!")}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MdSave className="mr-2" />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MdSecurity className="mr-2 text-blue-600" />
          Security Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={securityData.currentPassword}
                onChange={(e) =>
                  setSecurityData({
                    ...securityData,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <MdVisibilityOff className="text-gray-400" />
                ) : (
                  <MdVisibility className="text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={securityData.newPassword}
                onChange={(e) =>
                  setSecurityData({
                    ...securityData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <MdVisibilityOff className="text-gray-400" />
                ) : (
                  <MdVisibility className="text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={securityData.confirmPassword}
                onChange={(e) =>
                  setSecurityData({
                    ...securityData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <MdVisibilityOff className="text-gray-400" />
                ) : (
                  <MdVisibility className="text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">
                Two-Factor Authentication
              </h4>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securityData.twoFactorAuth}
                onChange={(e) =>
                  setSecurityData({
                    ...securityData,
                    twoFactorAuth: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSecuritySave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <MdSave className="mr-2" />
            {loading ? "Saving..." : "Update Security Settings"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MdSettings className="mr-2 text-blue-600" />
          System Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={systemPreferences.theme}
              onChange={(e) =>
                setSystemPreferences({
                  ...systemPreferences,
                  theme: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="auto">Auto (System)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={systemPreferences.language}
              onChange={(e) =>
                setSystemPreferences({
                  ...systemPreferences,
                  language: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={systemPreferences.timezone}
              onChange={(e) =>
                setSystemPreferences({
                  ...systemPreferences,
                  timezone: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="GMT">GMT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={systemPreferences.dateFormat}
              onChange={(e) =>
                setSystemPreferences({
                  ...systemPreferences,
                  dateFormat: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Auto Save</h4>
              <p className="text-sm text-gray-500">
                Automatically save your work
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemPreferences.autoSave}
                onChange={(e) =>
                  setSystemPreferences({
                    ...systemPreferences,
                    autoSave: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Compact Mode</h4>
              <p className="text-sm text-gray-500">
                Use compact layout for better space utilization
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemPreferences.compactMode}
                onChange={(e) =>
                  setSystemPreferences({
                    ...systemPreferences,
                    compactMode: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handlePreferencesSave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <MdSave className="mr-2" />
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      {/* Tab Navigation */}
      <div className="bg-white/80 rounded-xl p-2 shadow-sm mb-6">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon className="mr-2" size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="bg-white/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MdAdminPanelSettings className="mr-2 text-blue-600" />
                System Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allow Public Registration
                  </label>
                  <p className="text-sm text-gray-500">
                    Allow users to register without an invitation.
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.allowPublicRegistration}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          allowPublicRegistration: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Require Department Selection
                  </label>
                  <p className="text-sm text-gray-500">
                    Force users to select a department during registration.
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.requireDepartmentSelection}
                      onChange={(e) =>
                        handleDepartmentSelectionToggle(e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Require Email Verification
                  </label>
                  <p className="text-sm text-gray-500">
                    Force users to verify their email addresses.
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.requireEmailVerification}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          requireEmailVerification: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Department
                  </label>
                  <p className="text-sm text-gray-500">
                    Set the default department for new users.
                  </p>
                  <input
                    type="text"
                    value={systemSettings.defaultDepartment}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        defaultDepartment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max File Size (MB)
                  </label>
                  <p className="text-sm text-gray-500">
                    Set the maximum file size for uploads.
                  </p>
                  <input
                    type="number"
                    value={systemSettings.maxFileSize}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxFileSize: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed File Types
                  </label>
                  <p className="text-sm text-gray-500">
                    Comma-separated list of allowed file extensions.
                  </p>
                  <input
                    type="text"
                    value={systemSettings.allowedFileTypes.join(", ")}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        allowedFileTypes: e.target.value
                          .split(",")
                          .map((type) => type.trim()),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <p className="text-sm text-gray-500">
                    Set the session timeout for users.
                  </p>
                  <input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        sessionTimeout: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enable Two-Factor Authentication
                  </label>
                  <p className="text-sm text-gray-500">
                    Enable two-factor authentication for all users.
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.enableTwoFactorAuth}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          enableTwoFactorAuth: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enable Audit Logs
                  </label>
                  <p className="text-sm text-gray-500">
                    Enable detailed logging of user activities.
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.enableAuditLogs}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          enableAuditLogs: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enable Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Enable email notifications for all users.
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.enableEmailNotifications}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          enableEmailNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => {
                    console.log("🔘 SAVE BUTTON CLICKED - VERIFICATION!");
                    handleSystemSettingsSave();
                  }}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <MdSave className="mr-2" />
                  {saving ? "Saving..." : "Save System Settings"}
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "notifications" && renderNotificationsTab()}
        {activeTab === "security" && renderSecurityTab()}
        {activeTab === "preferences" && renderPreferencesTab()}
      </div>
    </div>
  );
};

export default Settings;
