import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiShieldCheck,
  HiX,
} from "react-icons/hi";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const PasswordChangeModal = ({ isOpen, onClose, onSuccess, userData }) => {
  const { updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Check if user has temporary password (no current password required)
  const isTemporaryPassword = userData?.isTemporaryPassword || false;
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    color: "text-gray-400",
  });

  // Password strength checker
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

  useEffect(() => {
    if (formData.newPassword) {
      setPasswordStrength(checkPasswordStrength(formData.newPassword));
    }
  }, [formData.newPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Only require current password if not a temporary password
    if (!isTemporaryPassword && !formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (passwordStrength.score < 3) {
      newErrors.newPassword = "Password is too weak";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: isTemporaryPassword
          ? undefined
          : formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        toast.success(
          response.data?.message || "Password changed successfully!"
        );

        if (response.data?.user) {
          updateProfile(response.data.user);
        }

        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error("Password change error:", error);
      setErrors({
        currentPassword:
          error.response?.data?.message || "Failed to change password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthBar = () => {
    const width = (passwordStrength.score / 5) * 100;
    return (
      <div className="w-full bg-gray-700 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full transition-all duration-300 ${
            passwordStrength.score >= 4
              ? "bg-green-500"
              : passwordStrength.score >= 3
              ? "bg-yellow-500"
              : passwordStrength.score >= 2
              ? "bg-orange-500"
              : "bg-red-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <HiShieldCheck className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Security First!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300"
              >
                {isTemporaryPassword
                  ? "Please set your new password to continue"
                  : "Please change your password to continue"}
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password - Only show if not temporary password */}
              {!isTemporaryPassword && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                        errors.currentPassword
                          ? "border-red-400"
                          : "border-white/20"
                      }`}
                      placeholder="Enter current password"
                    />
                    <HiLockClosed className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showCurrentPassword ? (
                        <HiEyeOff className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.currentPassword}
                    </p>
                  )}
                </motion.div>
              )}

              {/* New Password */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                      errors.newPassword ? "border-red-400" : "border-white/20"
                    }`}
                    placeholder="Enter new password"
                  />
                  <HiLockClosed className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showNewPassword ? (
                      <HiEyeOff className="w-5 h-5" />
                    ) : (
                      <HiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Password Strength</span>
                      <span className={passwordStrength.color}>
                        {passwordStrength.score}/5
                      </span>
                    </div>
                    {getStrengthBar()}
                    {passwordStrength.feedback && (
                      <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                        {passwordStrength.feedback}
                      </p>
                    )}
                  </div>
                )}

                {errors.newPassword && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.newPassword}
                  </p>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                      errors.confirmPassword
                        ? "border-red-400"
                        : "border-white/20"
                    }`}
                    placeholder="Confirm new password"
                  />
                  <HiLockClosed className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <HiEyeOff className="w-5 h-5" />
                    ) : (
                      <HiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Changing Password...
                  </div>
                ) : (
                  "Change Password & Continue"
                )}
              </motion.button>
            </form>

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <HiX className="w-6 h-6" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordChangeModal;
