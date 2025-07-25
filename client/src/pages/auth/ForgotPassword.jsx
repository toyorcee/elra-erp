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
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-center">
            <EDMSLogo variant="light" className="mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Forgot Password
            </h2>
            <p className="text-blue-100 text-base">
              Enter your email address to receive a password reset link.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  emailError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                required
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
              {/* No error shown for non-existent email, always show generic message */}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <GradientSpinner size="sm" className="mr-2" />
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
            <div className="flex justify-between items-center mt-4">
              <Link
                to="/login"
                className="text-blue-600 hover:underline text-sm"
              >
                Back to Login
              </Link>
              <Link
                to="/register"
                className="text-blue-600 hover:underline text-sm"
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
