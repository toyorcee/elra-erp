import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiX,
  HiEye,
  HiEyeOff,
  HiKey,
  HiUser,
  HiLockClosed,
} from "react-icons/hi";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const JoinCompanyModal = ({ isOpen, onClose, onSuccess, initialCode = "" }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Invitation Code
  const [invitationCode, setInvitationCode] = useState(initialCode);

  // Update invitation code when initialCode prop changes
  useEffect(() => {
    if (initialCode && initialCode !== invitationCode) {
      setInvitationCode(initialCode);
      // Auto-verify the code if it's provided
      if (isOpen && initialCode) {
        handleInvitationCodeSubmit({ preventDefault: () => {} });
      }
    }
  }, [initialCode, isOpen]);

  // Step 2: User Details
  const [userData, setUserData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();

  const handleInvitationCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.joinCompany({ invitationCode });

      if (response.data.success) {
        setSuccess(
          "Invitation code verified! Please complete your account setup."
        );
        setStep(2);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to verify invitation code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUserSetupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (userData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.joinCompany({
        invitationCode,
        userData: {
          ...userData,
          password: userData.password,
        },
      });

      if (response.data.success) {
        setSuccess("Account created successfully! Logging you in...");

        // Auto-login the user
        await login(userData.username, userData.password);

        // Close modal and redirect
        setTimeout(() => {
          onSuccess && onSuccess(response.data.data);
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setInvitationCode("");
    setUserData({ username: "", password: "", confirmPassword: "" });
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-white/10">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <HiX className="w-6 h-6" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <HiKey className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {step === 1
                      ? "Enter Invitation Code"
                      : "Complete Account Setup"}
                  </h2>
                  <p className="text-white/60 text-sm">
                    {step === 1
                      ? "Join your organization"
                      : "Set up your password"}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step >= 1
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    1
                  </div>
                  <div
                    className={`w-8 h-1 ${
                      step >= 2 ? "bg-blue-500" : "bg-white/10"
                    }`}
                  ></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step >= 2
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    2
                  </div>
                </div>
              </div>

              {/* Step 1: Invitation Code */}
              {step === 1 && (
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleInvitationCodeSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Invitation Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={invitationCode}
                        onChange={(e) =>
                          setInvitationCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter your invitation code"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                        maxLength={16}
                        required
                      />
                      <HiKey className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                    </div>
                    <p className="text-white/50 text-xs mt-2">
                      Enter the 8-character code provided by your administrator
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !invitationCode.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </motion.form>
              )}

              {/* Step 2: User Setup */}
              {step === 2 && (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleUserSetupSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={userData.username}
                        onChange={(e) =>
                          setUserData({ ...userData, username: e.target.value })
                        }
                        placeholder="Choose a username"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                      <HiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={userData.password}
                        onChange={(e) =>
                          setUserData({ ...userData, password: e.target.value })
                        }
                        placeholder="Create a password"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                      >
                        {showPassword ? (
                          <HiEyeOff className="w-5 h-5" />
                        ) : (
                          <HiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={userData.confirmPassword}
                        onChange={(e) =>
                          setUserData({
                            ...userData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm your password"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                      >
                        {showConfirmPassword ? (
                          <HiEyeOff className="w-5 h-5" />
                        ) : (
                          <HiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400 text-sm">{success}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !userData.username ||
                        !userData.password ||
                        !userData.confirmPassword
                      }
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JoinCompanyModal;
