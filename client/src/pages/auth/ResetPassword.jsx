import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { authAPI, handleApiError } from "../../services/api";
import loginBg from "../../assets/login.jpg";
import EDMSLogo from "../../components/EDMSLogo";
import { GradientSpinner } from "../../components/common";
import "../../styles/Login.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Invalid reset link. Please request a new password reset.");
      toast.error("Invalid reset link. Please request a new password reset.");
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError(
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      );
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const validateConfirmPassword = (confirmPass) => {
    if (!confirmPass) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    } else if (confirmPass !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    } else {
      setConfirmPasswordError("");
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !validatePassword(newPassword) ||
      !validateConfirmPassword(confirmPassword)
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({
        token,
        newPassword,
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success("Password updated successfully! Redirecting to login...");
        try {
          await authAPI.sendPasswordChangeNotification({
            email: response.data.user?.email,
          });
        } catch (emailError) {
          console.log("Email notification failed:", emailError);
        }
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.data.message || "Something went wrong");
        toast.error(response.data.message || "Something went wrong");
      }
    } catch (error) {
      const errorData = handleApiError(error);

      // Handle validation errors specifically
      if (errorData.status === 400 && errorData.data?.errors) {
        const validationErrors = errorData.data.errors;
        const passwordError = validationErrors.find(
          (err) => err.path === "newPassword"
        );
        if (passwordError) {
          setPasswordError(passwordError.msg);
        }
        setError("Please fix the validation errors above");
      } else {
        setError(errorData.message);
      }

      toast.error(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) validateConfirmPassword(e.target.value);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
        {/* Fixed Background Image */}
        <img
          src={loginBg}
          alt="Login background"
          className="fixed inset-0 w-full h-full object-cover object-center opacity-20"
        />

        {/* Dark Overlay */}
        <div className="fixed inset-0 bg-slate-900/70" />

        {/* Gradient Overlay */}
        <div className="fixed inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/40 to-transparent" />

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-purple-600/20 backdrop-blur-xl border-b border-white/10 p-8 text-center">
              <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white/10 mb-6 shadow-lg border border-white/20">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <EDMSLogo variant="light" className="mb-3" />
              <h2 className="text-3xl font-bold text-white mb-2">
                Password Reset Success!
              </h2>
              <p className="text-white/70 text-base">
                Your password has been updated successfully
              </p>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="bg-green-500/10 border border-green-400/30 text-green-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  <p className="font-medium mb-2">✅ Password Updated</p>
                  <p>You can now log in with your new password.</p>
                </div>
              </div>

              <div className="text-white/70 text-sm mb-6">
                <p className="mb-2">
                  Redirecting you to the login page in a few seconds...
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  to="/login"
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:via-cyan-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 inline-block text-center transform hover:scale-105"
                >
                  Go to Login Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
        {/* Fixed Background Image */}
        <img
          src={loginBg}
          alt="Login background"
          className="fixed inset-0 w-full h-full object-cover object-center opacity-20"
        />

        {/* Dark Overlay */}
        <div className="fixed inset-0 bg-slate-900/70" />

        {/* Gradient Overlay */}
        <div className="fixed inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/40 to-transparent" />

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600/20 to-orange-500/20 backdrop-blur-xl border-b border-white/10 p-8 text-center">
              <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white/10 mb-6 shadow-lg border border-white/20">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <EDMSLogo variant="light" className="mb-3" />
              <h2 className="text-3xl font-bold text-white mb-2">
                Invalid Reset Link
              </h2>
              <p className="text-white/70 text-base">
                This reset link is invalid or has expired
              </p>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  <p className="font-medium mb-2">❌ Invalid or Expired Link</p>
                  <p>Please request a new password reset link.</p>
                </div>
              </div>

              <div className="space-y-4">
                <Link
                  to="/forgot-password"
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-semibold shadow-lg hover:from-red-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all duration-200 inline-block text-center transform hover:scale-105"
                >
                  Request New Reset Link
                </Link>

                <Link
                  to="/login"
                  className="w-full py-3 px-6 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 backdrop-blur-sm inline-block text-center"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
      {/* Fixed Background Image */}
      <img
        src={loginBg}
        alt="Login background"
        className="fixed inset-0 w-full h-full object-cover object-center opacity-20"
      />

      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-slate-900/70" />

      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/40 to-transparent" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md lg:max-w-lg xl:max-w-xl">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-purple-600/20 backdrop-blur-xl border-b border-white/10 p-8 text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white/10 mb-6 shadow-lg border border-white/20">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <EDMSLogo variant="light" className="mb-3" />
            <h2 className="text-3xl font-bold text-white mb-2">
              Reset Password
            </h2>
            <p className="text-white/70 text-base">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6">
                  <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center backdrop-blur-sm">
                    {error}
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-white/90 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 rounded-xl border text-white placeholder-white/40 transition-all duration-200 pr-10 backdrop-blur-sm ${
                      passwordError
                        ? "border-red-400 bg-red-500/10 focus:border-red-400 focus:ring-red-400/50"
                        : "border-white/20 bg-white/5 focus:border-blue-400 focus:ring-blue-400/50"
                    } focus:outline-none focus:ring-2`}
                    placeholder="Enter your new password"
                  />
                  <span
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <HiOutlineEyeOff className="h-5 w-5 text-white/40" />
                    ) : (
                      <HiOutlineEye className="h-5 w-5 text-white/40" />
                    )}
                  </span>
                </div>
                {passwordError && (
                  <p className="mt-1 text-sm text-red-400">{passwordError}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-white/90 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`w-full px-4 py-3 rounded-xl border text-white placeholder-white/40 transition-all duration-200 pr-10 backdrop-blur-sm ${
                      confirmPasswordError
                        ? "border-red-400 bg-red-500/10 focus:border-red-400 focus:ring-red-400/50"
                        : "border-white/20 bg-white/5 focus:border-blue-400 focus:ring-blue-400/50"
                    } focus:outline-none focus:ring-2`}
                    placeholder="Confirm your new password"
                  />
                  <span
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <HiOutlineEyeOff className="h-5 w-5 text-white/40" />
                    ) : (
                      <HiOutlineEye className="h-5 w-5 text-white/40" />
                    )}
                  </span>
                </div>
                {confirmPasswordError && (
                  <p className="mt-1 text-sm text-red-400">
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:via-cyan-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <GradientSpinner size="sm" variant="white" />
                      <span>Updating password...</span>
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>

              {/* Back to Login */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
