import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { HiMail, HiLockClosed, HiKey } from "react-icons/hi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import CachedELRALogo from "../../components/CachedELRALogo";
import elraImage from "../../assets/elrabg.jpeg";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, error, clearError, initialized } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showJoinWithCode, setShowJoinWithCode] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    if (isAuthenticated && initialized) {
      const redirectPath = localStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath);
      } else {
        navigate("/modules");
      }
    }
  }, [isAuthenticated, initialized, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isAuthenticated) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email.trim()))
      newErrors.email = "Email is invalid";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.trim().length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const result = await login({
      identifier: formData.email.trim(),
      password: formData.password.trim(),
    });
    setLoading(false);

    if (result.success) {
      toast.success("Login successful! Welcome back.");
    } else {
      toast.error(result.message || "Login failed. Please try again.");
    }
  };

  const handleJoinWithCode = async (e) => {
    e.preventDefault();
    if (!invitationCode.trim()) {
      toast.error("Please enter an invitation code");
      return;
    }

    setVerifyingCode(true);
    try {
      const data = await authAPI.verifyInvitation(
        invitationCode.trim().toUpperCase()
      );

      if (data.success) {
        navigate(`/welcome?code=${invitationCode.trim().toUpperCase()}`);
      } else {
        toast.error(data.message || "Invalid invitation code");
      }
    } catch (error) {
      console.error("Error verifying invitation code:", error);
      toast.error("Failed to verify invitation code. Please try again.");
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${elraImage})` }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/30 z-0"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg">
            <CachedELRALogo className="h-10 md:h-14 w-auto" />
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-center text-[var(--elra-primary)] mb-6">
            Login to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center shadow-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                Email
              </label>
              <div className="relative">
                <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                    errors.email
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[var(--elra-border-primary)]"
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                Password
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                    errors.password
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[var(--elra-border-primary)]"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--elra-primary)]"
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] hover:from-[var(--elra-primary-dark)] hover:to-[var(--elra-primary)] text-white py-3 px-4 text-base rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[var(--elra-primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                </>
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium transition-all duration-300 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--elra-border-primary)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[var(--elra-text-secondary)]">
                or
              </span>
            </div>
          </div>

          {/* Join with Code */}
          <button
            type="button"
            onClick={() => setShowJoinWithCode(true)}
            className="w-full flex items-center justify-center space-x-2 text-[var(--elra-primary)] font-medium py-2 rounded-lg transition-all duration-300 text-sm cursor-pointer"
          >
            <HiKey className="h-5 w-5" />
            <span>Join with Invitation Code</span>
          </button>
        </div>
      </div>

      {/* Invitation Code Modal */}
      {showJoinWithCode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowJoinWithCode(false);
                setInvitationCode("");
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-[var(--elra-primary)] text-lg"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="bg-white p-3 rounded-lg inline-block mb-4">
                <CachedELRALogo className="h-8 w-auto mx-auto" />
              </div>
              <h2 className="text-xl font-bold text-[var(--elra-primary)]">
                Enter Invitation Code
              </h2>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-6">
              <div className="relative">
                <HiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) =>
                    setInvitationCode(e.target.value.toUpperCase())
                  }
                  className="w-full pl-10 pr-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  placeholder="Enter your invitation code"
                  maxLength={16}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={verifyingCode || !invitationCode.trim()}
                className="w-full bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] hover:from-[var(--elra-primary-dark)] hover:to-[var(--elra-primary)] text-white py-3 text-base rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[var(--elra-primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-lg"
              >
                {verifyingCode ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Join with Code</span>
                    <HiKey className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowJoinWithCode(false);
                  setInvitationCode("");
                }}
                className="w-full border-2 border-[var(--elra-primary)] text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white py-3 text-base rounded-lg font-semibold transition-all duration-300"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
