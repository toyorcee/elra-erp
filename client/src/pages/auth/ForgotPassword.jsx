import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { authAPI, handleApiError } from "../../services/api";
import loginBg from "../../assets/login.jpg";
import EDMSLogo from "../../components/EDMSLogo";
import { GradientSpinner } from "../../components/common";
import "../../styles/Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) return;

    setLoading(true);
    console.log("Submitting email:", email);
    try {
      const response = await authAPI.forgotPassword({ email });

      // Always show the backend message as a success toast
      setSuccess(true);
      toast.success(
        response.message ||
          "If an account with that email exists, a password reset link has been sent."
      );
    } catch (error) {
      const errorData = handleApiError(error);
      setError(errorData.message);
      toast.error(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
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
                Check Your Email
              </h2>
              <p className="text-white/70 text-base">
                Password reset link sent successfully
              </p>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="bg-green-500/10 border border-green-400/30 text-green-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  <p className="font-medium mb-2">Reset link sent to:</p>
                  <p className="font-mono text-green-400">{email}</p>
                </div>
              </div>

              <div className="text-white/70 text-sm mb-6">
                <p className="mb-2">
                  We've sent a password reset link to your email address.
                </p>
                <p className="mb-2">
                  Click the link in the email to reset your password.
                </p>
                <p className="text-xs text-white/50">
                  The link will expire in 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  to="/login"
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:via-cyan-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 inline-block text-center transform hover:scale-105"
                >
                  Back to Login
                </Link>

                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                    setError("");
                  }}
                  className="w-full py-3 px-6 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                  Send Another Email
                </button>
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
            <EDMSLogo variant="light" className="mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Forgot Password
            </h2>
            <p className="text-white/70 text-base">
              Enter your email address to receive a password reset link.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-white/90 font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 backdrop-blur-sm ${
                  emailError
                    ? "border-red-400 bg-red-500/10"
                    : "border-white/20 bg-white/5 focus:border-blue-400"
                } text-white placeholder-white/40`}
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                required
              />
              {emailError && (
                <p className="text-red-400 text-sm mt-1">{emailError}</p>
              )}
              {/* No error shown for non-existent email, always show generic message */}
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:from-blue-700 hover:via-cyan-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <GradientSpinner size="sm" variant="white" />
                  <span className="ml-2">Sending...</span>
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
            <div className="flex justify-between items-center mt-4">
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 hover:underline text-sm transition-colors"
              >
                Back to Login
              </Link>
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300 hover:underline text-sm transition-colors"
              >
                Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
