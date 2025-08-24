import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { HiMail, HiLockClosed, HiKey } from "react-icons/hi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import ELRALogo from "../../components/ELRALogo";
import rectLight from "../../assets/rect-light.svg";
import elraImage from "../../assets/ELRA.png";

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
        // Redirect to welcome page with the code
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
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 fixed left-0 top-0 h-full">
        <img
          src={rectLight}
          alt="ELRA Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center px-6 py-8 relative overflow-y-auto">
        <div className="absolute top-8 left-8 z-20 hidden lg:block">
          <ELRALogo size="lg" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={elraImage}
            alt="ELRA Decorative"
            className="w-[60%] max-w-[400px] opacity-15 object-contain"
          />
        </div>

        <div className="absolute inset-0 bg-white/85"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden text-center mb-8">
            <ELRALogo size="xl" className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-[var(--elra-primary)] mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-[var(--elra-secondary-1)] font-medium tracking-wide">
              Enterprise Resource Planning Platform
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-[var(--elra-border-primary)] p-8 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none">
              <div className="text-[var(--elra-primary)] transform rotate-12 scale-150">
                <ELRALogo size="xl" />
              </div>
            </div>

            <div className="text-center mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-[var(--elra-primary)] mb-3">
                Login to your account
              </h2>
              <p className="text-[var(--elra-text-secondary)] text-lg mb-2">
                Access your ELRA workspace
              </p>
              <p className="text-sm text-[var(--elra-secondary-1)] font-medium tracking-wide">
                Enterprise Resource Planning System
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center shadow-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-3"
                >
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-[var(--elra-secondary-2)]" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                      errors.email
                        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                        : "border-[var(--elra-border-primary)]"
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-3"
                >
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-[var(--elra-secondary-2)]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-4 bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                      errors.password
                        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                        : "border-[var(--elra-border-primary)]"
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--elra-primary-dark)] hover:bg-[var(--elra-primary)] text-white py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-xs">Signing in...</span>
                  </div>
                ) : (
                  "Login"
                )}
              </button>
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

            {/* Join with Code Section */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowJoinWithCode(true)}
                className="w-full flex items-center justify-center space-x-2 text-[var(--elra-primary)] font-medium py-2 px-4 rounded-lg  transition-all duration-300 cursor-pointer text-sm"
              >
                <HiKey className="h-5 w-5" />
                <span>Join with Invitation Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Code Modal Overlay */}
      {showJoinWithCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowJoinWithCode(false);
                setInvitationCode("");
              }}
              className="absolute top-4 right-4 text-[var(--elra-text-secondary)] hover:text-[var(--elra-primary)] transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <ELRALogo size="lg" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--elra-primary)] mb-2">
                Enter Invitation Code
              </h2>
              <p className="text-[var(--elra-text-secondary)]">
                Enter the invitation code you received via email
              </p>
            </div>

            {/* Invitation Code Form */}
            <form onSubmit={handleJoinWithCode} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-3">
                  Invitation Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiKey className="h-5 w-5 text-[var(--elra-secondary-2)]" />
                  </div>
                  <input
                    type="text"
                    value={invitationCode}
                    onChange={(e) =>
                      setInvitationCode(e.target.value.toUpperCase())
                    }
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[var(--elra-border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                    placeholder="Enter your invitation code"
                    maxLength={16}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyingCode || !invitationCode.trim()}
                className="w-full bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {verifyingCode ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Verifying Code...
                  </div>
                ) : (
                  "Join with Code"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowJoinWithCode(false);
                  setInvitationCode("");
                }}
                className="w-full text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-semibold py-3 px-6 rounded-xl border-2 border-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white transition-all duration-300"
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
