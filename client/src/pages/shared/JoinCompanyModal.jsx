import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiX,
  HiEye,
  HiEyeOff,
  HiKey,
  HiUser,
  HiSparkles,
} from "react-icons/hi";
import { authAPI, invitationAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import InvitationPreviewModal from "../../components/common/InvitationPreviewModal";

// Beautiful Loading Component for Verification
const VerificationLoading = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center p-8 space-y-6"
  >
    {/* Animated Logo */}
    <motion.div
      animate={{
        rotate: [0, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
        scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
      }}
      className="relative"
    >
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
        <HiSparkles className="w-8 h-8 text-white" />
      </div>
      {/* Orbiting dots */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full" />
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full" />
        <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-3 h-3 bg-indigo-400 rounded-full" />
        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full" />
      </motion.div>
    </motion.div>

    {/* Loading Text */}
    <div className="text-center space-y-2">
      <motion.h3
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-xl font-bold text-white"
      >
        Verifying Invitation
      </motion.h3>
      <motion.p
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        className="text-purple-200 text-sm"
      >
        Checking your invitation code...
      </motion.p>
    </div>

    {/* Progress Bar */}
    <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        animate={{ x: [-256, 256] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"
      />
    </div>

    {/* Status Steps */}
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 bg-green-400 rounded-full"
        />
        <span className="text-green-300 text-xs">Validating</span>
      </div>
      <div className="flex items-center space-x-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          className="w-2 h-2 bg-blue-400 rounded-full"
        />
        <span className="text-blue-300 text-xs">Loading</span>
      </div>
      <div className="flex items-center space-x-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
          className="w-2 h-2 bg-purple-400 rounded-full"
        />
        <span className="text-purple-300 text-xs">Preparing</span>
      </div>
    </div>
  </motion.div>
);

const JoinCompanyModal = ({ isOpen, onClose, onSuccess, initialCode = "" }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [invitationCode, setInvitationCode] = useState(initialCode);

  useEffect(() => {
    if (initialCode && initialCode !== invitationCode) {
      setInvitationCode(initialCode);
      if (isOpen && initialCode) {
        handleInvitationCodeSubmit(null, initialCode);
      }
    }
  }, [initialCode, isOpen]);

  useEffect(() => {
    if (isOpen && initialCode && !previewData) {
      setInvitationCode(initialCode);
      handleInvitationCodeSubmit(null, initialCode);
    }
  }, [isOpen, initialCode]);

  // Step 2: User Details
  const [userData, setUserData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();

  const handleInvitationCodeSubmit = async (e, code = null) => {
    if (e) e.preventDefault();
    setVerifying(true);
    setError("");

    const codeToVerify = code || invitationCode;

    try {
      // First, verify the invitation code and get preview data
      const previewResponse = await invitationAPI.verifyCode(codeToVerify);

      if (previewResponse.success) {
        setPreviewData(previewResponse);
        setShowPreview(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to verify invitation code"
      );
    } finally {
      setVerifying(false);
    }
  };

  const handlePreviewProceed = () => {
    setShowPreview(false);
    setStep(2);

    if (previewData?.data?.invitation) {
      const { firstName } = previewData.data.invitation;
      const username = firstName || "user"; 
      setUserData((prev) => ({
        ...prev,
        username: username,
      }));
    }
  };

  const handleUserSetupSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 handleUserSetupSubmit called");
    console.log("📝 Form data:", { invitationCode, userData });
    setLoading(true);
    setError("");

    // Validate all required fields
    if (!userData.username || !userData.password || !userData.confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      console.log("📡 Calling authAPI.joinCompany with:", {
        invitationCode,
        userData: {
          ...userData,
          password: userData.password,
        },
      });
      const response = await authAPI.joinCompany({
        invitationCode,
        userData: {
          ...userData,
          password: userData.password,
        },
      });

      if (response.data.success) {
        setSuccess(
          "Account verified and activated successfully! You can now log in with your credentials."
        );

        // Close modal and redirect
        setTimeout(() => {
          onSuccess && onSuccess(response.data.data);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Error in handleUserSetupSubmit:", err);
      console.error("❌ Error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setInvitationCode(initialCode || "");
    setUserData({ username: "", password: "", confirmPassword: "" });
    setError("");
    setSuccess("");
    setShowPreview(false);
    setPreviewData(null);
    setVerifying(false);
    onClose();
  };

  return (
    <>
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
                        : "Verify Your Account"}
                    </h2>
                    <p className="text-white/60 text-sm">
                      {step === 1
                        ? "Join your organization"
                        : "Confirm your credentials for security"}
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
                  <>
                    {verifying ? (
                      <VerificationLoading />
                    ) : (
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
                            {initialCode
                              ? "Code loaded from invitation link"
                              : "Enter the 8-character code provided by your administrator"}
                          </p>
                        </div>

                        {error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={!invitationCode?.trim()}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                        >
                          {initialCode ? "Continue with Code" : "Verify Code"}
                        </button>
                      </motion.form>
                    )}
                  </>
                )}

                {/* Step 2: User Setup */}
                {step === 2 && (
                  <motion.form
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleUserSetupSubmit}
                    className="space-y-4"
                  >
                    <div className="text-center mb-6">
                      <p className="text-purple-200 text-sm">
                        Please verify your existing credentials to activate your
                        account
                      </p>
                      <p className="text-yellow-200 text-xs mt-2">
                        🔒 This step ensures only you can activate your account
                      </p>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={userData.username}
                          readOnly
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white cursor-not-allowed"
                          required
                        />
                        <HiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                      </div>
                      <p className="text-white/50 text-xs mt-2">
                        Username is pre-filled from your invitation
                      </p>
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
                            setUserData({
                              ...userData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Enter your password"
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
                        {loading
                          ? "Verifying Credentials..."
                          : "Verify & Activate"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invitation Preview Modal */}
      <InvitationPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onProceed={handlePreviewProceed}
        invitationCode={invitationCode}
        previewData={previewData}
      />
    </>
  );
};

export default JoinCompanyModal;
