import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../hooks/useProfile";

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
  MdAccountCircle,
  MdCameraAlt,
  MdDelete,
} from "react-icons/md";
import { toast } from "react-toastify";

const getImageUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  const baseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace("/api", "");
  return `${baseUrl}${avatarPath}`;
};

const Settings = () => {
  const { user } = useAuth();
  const {
    updateProfile,
    uploadProfilePicture,
    isUpdatingProfile,
    isUploadingPicture,
  } = useProfile();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department?.name || "",
    position: user?.position || "",
    bio: user?.bio || "",
    address: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      postalCode: user?.address?.postalCode || "",
    },
    employeeId: user?.employeeId || "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    documentApprovals: true,
    systemUpdates: true,
    weeklyReports: false,
    dailyDigest: false,
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false,
  });

  const [preferences, setPreferences] = useState({
    theme: "auto",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    autoSave: true,
    compactMode: false,
    emailDigest: "weekly",
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
    }
  }, [user]);

  const tabs = [
    { id: "profile", label: "Profile", icon: MdPerson },
    { id: "notifications", label: "Notifications", icon: MdNotifications },
    { id: "security", label: "Security", icon: MdSecurity },
    { id: "preferences", label: "Preferences", icon: MdSettings },
  ];

  const handleProfileSave = async () => {
    try {
      const { department, ...updateData } = profileData;
      await updateProfile(updateData);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      await uploadProfilePicture(file);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to upload profile picture"
      );
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      await handleProfilePictureUpload(event);
    }
  };

  const handleSecuritySave = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Security settings updated successfully!");
      setSecurityData({
        ...securityData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to update security settings");
    }
  };

  const handlePreferencesSave = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Preferences updated successfully!");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <MdCameraAlt className="mr-2 text-blue-600" />
          Profile Picture
        </h3>

        <div className="flex items-center space-x-6">
          <div className="relative group">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-500 p-1">
              {user?.avatar ? (
                <img
                  src={getImageUrl(user.avatar)}
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
                  user?.avatar ? "hidden" : ""
                }`}
              >
                <MdPerson className="w-12 h-12 text-gray-400" />
              </div>

              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <MdEdit className="w-6 h-6 text-white" />
              </div>
            </div>

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
            />
          </div>

          <div className="flex-1">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Update Profile Picture
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Click the image above or drag and drop a new photo. Supported
              formats: JPEG, PNG, GIF, WebP (max 5MB)
            </p>

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
              placeholder="Software Engineer"
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
            disabled={isUpdatingProfile}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <MdSave className="mr-2" />
            {isUpdatingProfile ? "Saving..." : "Save Changes"}
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
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MdSave className="mr-2" />
            Update Security Settings
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
          Personal Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={preferences.theme}
              onChange={(e) =>
                setPreferences({ ...preferences, theme: e.target.value })
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
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value })
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
              value={preferences.timezone}
              onChange={(e) =>
                setPreferences({ ...preferences, timezone: e.target.value })
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
              value={preferences.dateFormat}
              onChange={(e) =>
                setPreferences({ ...preferences, dateFormat: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <select
              value={preferences.timeFormat}
              onChange={(e) =>
                setPreferences({ ...preferences, timeFormat: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Digest
            </label>
            <select
              value={preferences.emailDigest}
              onChange={(e) =>
                setPreferences({ ...preferences, emailDigest: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
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
                checked={preferences.autoSave}
                onChange={(e) =>
                  setPreferences({ ...preferences, autoSave: e.target.checked })
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
                checked={preferences.compactMode}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
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
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MdSave className="mr-2" />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );

  if (isUpdatingProfile) {
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

      <div className="min-h-[600px]">
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "notifications" && renderNotificationsTab()}
        {activeTab === "security" && renderSecurityTab()}
        {activeTab === "preferences" && renderPreferencesTab()}
      </div>
    </div>
  );
};

export default Settings;
