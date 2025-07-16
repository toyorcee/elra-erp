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
    try {
      const response = await authAPI.forgotPassword({ email });

      if (response.success) {
        setSuccess(true);
        toast.success(
          "Password reset link sent successfully! Check your email."
        );
      } else {
        setError(response.message || "Something went wrong");
        toast.error(response.message || "Something went wrong");
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900 p-6">
        {/* Fixed Background Image */}
        <img
          src={loginBg}
          alt="Login background"
          className="fixed inset-0 w-full h-full object-cover object-center opacity-20"
        />

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-8 text-center">
              <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white/20 mb-6 shadow-lg">
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
              <p className="text-green-100 text-base">
                Password reset link sent successfully
              </p>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  <p className="font-medium mb-2">Reset link sent to:</p>
                  <p className="font-mono text-green-800">{email}</p>
                </div>
              </div>

              <div className="text-gray-600 text-sm mb-6">
                <p className="mb-2">
                  We've sent a password reset link to your email address.
                </p>
                <p className="mb-2">
                  Click the link in the email to reset your password.
                </p>
                <p className="text-xs text-gray-500">
                  The link will expire in 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  to="/login"
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-md hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 inline-block text-center"
                >
                  Back to Login
                </Link>

                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                    setError("");
                  }}
                  className="w-full py-3 px-6 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900 p-6">
      {/* Fixed Background Image */}
      <img
        src={loginBg}
        alt="Login background"
        className="fixed inset-0 w-full h-full object-cover object-center opacity-20"
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md lg:max-w-lg xl:max-w-xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white/20 mb-6 shadow-lg">
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
              Forgot Password?
            </h2>
            <p className="text-blue-100 text-base">
              Enter your email to reset your password
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
                    {error}
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                    emailError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your email address"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-md hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <GradientSpinner size="sm" variant="light" />
                      <span>Sending reset link...</span>
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>

              {/* Back to Login */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
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

export default ForgotPassword;
