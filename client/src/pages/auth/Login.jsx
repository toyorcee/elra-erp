import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { HiMail, HiLockClosed } from "react-icons/hi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import ELRALogo from "../../components/ELRALogo";
import ELRAHero3 from "../../assets/ELRAHero3.jpg";
import elraImage from "../../assets/ELRA.png";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, error, clearError, initialized } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={ELRAHero3}
          alt="ELRA Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 relative overflow-hidden">
        <div className="absolute top-8 left-8 z-20">
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
                    className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-red-400"
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
                    className={`w-full pl-12 pr-12 py-4 bg-white border-2 rounded-xl focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "border-red-400"
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
                className="w-full bg-[var(--elra-primary-dark)] hover:bg-[var(--elra-primary)] text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  "Login now"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
