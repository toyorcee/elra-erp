import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import loginBg from "../../assets/login.jpg";
import EDMSLogo from "../../components/EDMSLogo";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { GradientSpinner } from "../../components/common";
import "../../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, error, clearError, initialized } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleNavigate = useCallback(() => {
    if (isAuthenticated && initialized) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, initialized, navigate]);

  useEffect(() => {
    if (isAuthenticated && initialized) {
      handleNavigate();
    }
  }, [isAuthenticated, initialized, handleNavigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const result = await login({
      identifier: formData.email,
      password: formData.password,
    });
    setLoading(false);

    if (result.success) {
      toast.success("Login successful! Welcome back.");
      // Navigation will be handled by the useEffect above
    } else {
      toast.error(result.message || "Login failed. Please try again.");
    }
  };

  // Show loading while auth is being initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900">
        <GradientSpinner
          size="xl"
          variant="secondary"
          text="Initializing..."
          showText={true}
        />
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900">
        <GradientSpinner
          size="xl"
          variant="secondary"
          text="Redirecting to dashboard..."
          showText={true}
        />
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
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <EDMSLogo className="mx-auto h-16 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-blue-200">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  errors.email
                    ? "border-red-400 bg-red-50"
                    : "border-blue-300/30 bg-white/10 focus:border-blue-400"
                } text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 ${
                    errors.password
                      ? "border-red-400 bg-red-50"
                      : "border-blue-300/30 bg-white/10 focus:border-blue-400"
                  } text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-200 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="h-5 w-5" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-300">{errors.password}</p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <GradientSpinner size="sm" variant="white" />
                  <span className="ml-2">Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <Link
              to="/forgot-password"
              className="text-blue-200 hover:text-white text-sm transition-colors"
            >
              Forgot your password?
            </Link>
            <div className="text-blue-200 text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-white hover:text-blue-200 font-medium transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
