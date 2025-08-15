import React, { useState, useRef, useCallback } from "react";
import {
  HiUser,
  HiLockClosed,
  HiBell,
  HiCog,
  HiShieldCheck,
  HiEye,
  HiEyeOff,
  HiPencil,
  HiPhotograph,
  HiX,
} from "react-icons/hi";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../hooks/useProfile";
import { authAPI } from "../../services/api";
import defaultAvatar from "../../assets/defaulticon.jpg";

const Settings = () => {
  const { user } = useAuth();
  const {
    updateProfile,
    uploadProfilePicture,
    isUpdatingProfile,
    isUploadingPicture,
  } = useProfile();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    color: "text-gray-400",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    systemUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  const tabs = [
    { id: "profile", name: "Profile", icon: HiUser },
    { id: "security", name: "Security", icon: HiLockClosed },
    { id: "notifications", name: "Notifications", icon: HiBell },
    { id: "preferences", name: "Preferences", icon: HiCog },
  ];

  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (emailError || phoneError || firstNameError || lastNameError) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully!");
    } catch (error) {
      if (error.response?.data?.message === "Email already exists") {
        toast.error(
          "This email address is already in use. Please choose a different email."
        );
        setEmailError("This email is already in use");
      } else {
        toast.error("Failed to update profile");
      }
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    uploadProfilePicture(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${avatarPath}`;
  };

  const getUserInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.name) return user.name[0].toUpperCase();
    return "U";
  };

  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push("At least 8 characters");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Lowercase letter");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Uppercase letter");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("Number");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push("Special character");

    let color = "text-red-400";
    if (score >= 4) color = "text-green-400";
    else if (score >= 3) color = "text-yellow-400";
    else if (score >= 2) color = "text-orange-400";

    return {
      score,
      feedback: feedback.join(", "),
      color,
    };
  };

  React.useEffect(() => {
    if (passwordData.newPassword) {
      setPasswordStrength(checkPasswordStrength(passwordData.newPassword));
    } else {
      setPasswordStrength({ score: 0, feedback: "", color: "text-gray-400" });
    }
  }, [passwordData.newPassword]);

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    } else if (passwordStrength.score < 3) {
      errors.newPassword =
        "Password is too weak. Please include uppercase, lowercase, numbers, and special characters";
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.currentPassword === passwordData.newPassword
    ) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length === 0) {
      return true;
    } else {
      return false;
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    // Validate form
    if (!validatePasswordForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success(response.message || "Password changed successfully!");

        // Clear form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Reset password strength
        setPasswordStrength({
          score: 0,
          feedback: "",
          color: "text-gray-400",
        });

        // If the response indicates user needs to login again
        if (response.message?.includes("login again")) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      } else {
        toast.error(response.message || "Failed to change password");
      }
    } catch (error) {
      // Handle specific error cases
      if (error.response?.data?.message === "Current password is incorrect") {
        setPasswordErrors((prev) => ({
          ...prev,
          currentPassword: "Current password is incorrect",
        }));
        toast.error("Current password is incorrect");
      } else if (error.response?.data?.message === "Validation failed") {
        const validationErrors = error.response.data.errors;
        const fieldErrors = {};

        validationErrors.forEach((err) => {
          if (err.path === "currentPassword") {
            fieldErrors.currentPassword = err.msg;
          } else if (err.path === "newPassword") {
            fieldErrors.newPassword = err.msg;
          }
        });

        setPasswordErrors((prev) => ({ ...prev, ...fieldErrors }));
        toast.error("Please check the form for validation errors");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to change password"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleNotificationSave = async () => {
    setLoading(true);

    try {
      // TODO: Implement notification settings API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Notification settings updated!");
    } catch (error) {
      toast.error("Failed to update notification settings");
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Profile Picture
          <HiPencil className="ml-2 w-4 h-4 text-[var(--elra-primary)]" />
        </h3>

        <div className="flex items-center space-x-6">
          {/* Current Profile Picture - Always show, with avatar or placeholder */}
          <div className="relative">
            <div className="w-24 h-24 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden border-4 border-white">
              <img
                src={
                  user?.avatar ? getImageUrl(user.avatar) : getDefaultAvatar()
                }
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.src = getDefaultAvatar();
                }}
              />
            </div>
            {isUploadingPicture && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {user?.avatar && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-200 cursor-pointer border-2 border-white"
                title="Change Profile Picture"
              >
                <HiPencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Upload Area */}
          <div className="flex-1">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                isDragOver
                  ? "border-[var(--elra-primary)] bg-[var(--elra-primary)]/5"
                  : "border-gray-300 hover:border-[var(--elra-primary)] hover:bg-gray-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingPicture ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-[var(--elra-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              ) : (
                <>
                  <HiPhotograph className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-[var(--elra-primary)]">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, WebP up to 5MB
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Personal Information
          <HiPencil className="ml-2 w-4 h-4 text-[var(--elra-primary)]" />
        </h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => {
                  const firstName = e.target.value;
                  setFormData((prev) => ({ ...prev, firstName }));

                  if (firstNameError) setFirstNameError("");

                  if (firstName && firstName.trim().length < 2) {
                    setFirstNameError(
                      "First name must be at least 2 characters"
                    );
                  } else if (firstName && firstName.trim().length > 50) {
                    setFirstNameError(
                      "First name must be less than 50 characters"
                    );
                  } else {
                    setFirstNameError("");
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  firstNameError ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {firstNameError && (
                <p className="text-xs text-red-500 mt-1">{firstNameError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => {
                  const lastName = e.target.value;
                  setFormData((prev) => ({ ...prev, lastName }));

                  // Clear error when user starts typing
                  if (lastNameError) setLastNameError("");

                  // Last name validation
                  if (lastName && lastName.trim().length < 2) {
                    setLastNameError("Last name must be at least 2 characters");
                  } else if (lastName && lastName.trim().length > 50) {
                    setLastNameError(
                      "Last name must be less than 50 characters"
                    );
                  } else {
                    setLastNameError("");
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  lastNameError ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {lastNameError && (
                <p className="text-xs text-red-500 mt-1">{lastNameError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                const email = e.target.value;
                setFormData((prev) => ({ ...prev, email }));

                if (emailError) setEmailError("");

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (email && !emailRegex.test(email)) {
                  setEmailError("Please enter a valid email address");
                } else {
                  setEmailError("");
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                emailError ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {emailError ? (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Email must be unique across all users
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const phone = e.target.value;
                setFormData((prev) => ({ ...prev, phone }));

                if (phoneError) setPhoneError("");

                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (
                  phone &&
                  !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))
                ) {
                  setPhoneError("Please enter a valid phone number");
                } else {
                  setPhoneError("");
                }
              }}
              placeholder="+1234567890"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                phoneError ? "border-red-500" : "border-gray-300"
              }`}
            />
            {phoneError ? (
              <p className="text-xs text-red-500 mt-1">{phoneError}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Enter your phone number (optional)
              </p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="bg-[var(--elra-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Change Password
          <HiPencil className="ml-2 w-4 h-4 text-[var(--elra-primary)]" />
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }));
                  // Clear error when user starts typing
                  if (passwordErrors.currentPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      currentPassword: "",
                    }));
                  }
                }}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  passwordErrors.currentPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <HiEyeOff className="h-5 w-5" />
                ) : (
                  <HiEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => {
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }));
                  // Clear error when user starts typing
                  if (passwordErrors.newPassword) {
                    setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
                  }
                }}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  passwordErrors.newPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <HiEyeOff className="h-5 w-5" />
                ) : (
                  <HiEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Password strength:</span>
                  <span className={passwordStrength.color}>
                    {passwordStrength.score === 0 && "Very Weak"}
                    {passwordStrength.score === 1 && "Weak"}
                    {passwordStrength.score === 2 && "Fair"}
                    {passwordStrength.score === 3 && "Good"}
                    {passwordStrength.score === 4 && "Strong"}
                    {passwordStrength.score === 5 && "Very Strong"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score >= 4
                        ? "bg-[var(--elra-primary)]"
                        : passwordStrength.score >= 3
                        ? "bg-[var(--elra-primary)]/70"
                        : passwordStrength.score >= 2
                        ? "bg-[var(--elra-primary)]/50"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                {passwordStrength.feedback && (
                  <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                    Missing: {passwordStrength.feedback}
                  </p>
                )}
              </div>
            )}
            {passwordErrors.newPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordErrors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => {
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }));
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                  }
                }}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  passwordErrors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <HiEyeOff className="h-5 w-5" />
                ) : (
                  <HiEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--elra-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Changing Password..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Notification Preferences
          <HiPencil className="ml-2 w-4 h-4 text-[var(--elra-primary)]" />
        </h3>
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
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
                    "Receive push notifications in the app"}
                  {key === "systemUpdates" &&
                    "Get notified about system updates and maintenance"}
                  {key === "securityAlerts" &&
                    "Receive security alerts and login notifications"}
                  {key === "marketingEmails" &&
                    "Receive promotional emails and newsletters"}
                </p>
              </div>
              <button
                onClick={() => handleNotificationToggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? "bg-[var(--elra-primary)]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}

          <div className="pt-4">
            <button
              onClick={handleNotificationSave}
              disabled={loading}
              className="bg-[var(--elra-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Notification Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Application Preferences
          <HiPencil className="ml-2 w-4 h-4 text-[var(--elra-primary)]" />
        </h3>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Theme</h4>
            <p className="text-sm text-gray-500 mb-3">
              Choose your preferred theme
            </p>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-[var(--elra-primary)] text-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-colors">
                Light
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-[var(--elra-primary)] hover:text-[var(--elra-primary)] transition-colors">
                Dark
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-[var(--elra-primary)] hover:text-[var(--elra-primary)] transition-colors">
                Auto
              </button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Language</h4>
            <p className="text-sm text-gray-500 mb-3">
              Select your preferred language
            </p>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Time Zone</h4>
            <p className="text-sm text-gray-500 mb-3">
              Set your local time zone
            </p>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]">
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="GMT">GMT</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="lg:w-64 border-r border-gray-200">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? "bg-[var(--elra-primary)] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === "profile" && renderProfileTab()}
              {activeTab === "security" && renderSecurityTab()}
              {activeTab === "notifications" && renderNotificationsTab()}
              {activeTab === "preferences" && renderPreferencesTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
