import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { HiMail, HiLockClosed, HiKey } from "react-icons/hi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import ELRALogo from "../../components/ELRALogo";
import elraImage from "../../assets/Office4.jpg";

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
      const response = await fetch("/api/invitations/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: invitationCode.trim().toUpperCase() }),
      });

      const data = await response.json();

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
      className="h-[120vh] flex flex-col items-center justify-center px-6 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${elraImage})` }}
    >
      {/* White overlay for better contrast */}
      <div className="absolute inset-0 bg-white/30"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo big on top with its own white backing */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <ELRALogo size="3xl" />
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-[var(--elra-primary)] mb-6">
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
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
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
                  className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                    errors.password
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[var(--elra-border-primary)]"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
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
              className="w-full bg-[var(--elra-primary-dark)] hover:bg-[var(--elra-primary)] text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg"
            >
              {loading ? "Signing in..." : "Login"}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => {
                setShowJoinWithCode(false);
                setInvitationCode("");
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-[var(--elra-primary)]"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <ELRALogo size="lg" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[var(--elra-primary)]">
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
                  className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  placeholder="Enter your invitation code"
                  maxLength={16}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={verifyingCode || !invitationCode.trim()}
                className="w-full bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
              >
                {verifyingCode ? "Verifying..." : "Join with Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowJoinWithCode(false);
                  setInvitationCode("");
                }}
                className="w-full border-2 border-[var(--elra-primary)] text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white py-3 rounded-xl font-semibold transition-all duration-300"
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
