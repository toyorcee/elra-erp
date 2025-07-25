import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import loginBg from "../../assets/login.jpg";
import message2 from "../../assets/message2.jpg";
import message3 from "../../assets/message3.jpg";
import message4 from "../../assets/message4.jpg";
import message5 from "../../assets/message5.jpg";
import messaging from "../../assets/messaging.jpg";
import notification from "../../assets/notification.jpg";
import notification2 from "../../assets/notification2.jpg";
import EDMSLogo from "../../components/EDMSLogo";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { GradientSpinner } from "../../components/common";
import "../../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, error, clearError, initialized, user } =
    useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Background images for sliding effect
  const backgroundImages = [
    { src: message2, alt: "Messaging Interface" },
    { src: message3, alt: "Team Communication" },
    { src: message4, alt: "Document Collaboration" },
    { src: message5, alt: "Real-time Chat" },
    { src: messaging, alt: "Messaging Hub" },
    { src: notification, alt: "Smart Notifications" },
    { src: notification2, alt: "Alert System" },
  ];

  const handleNavigate = useCallback(() => {
    if (isAuthenticated && initialized) {
      navigate("/app");
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

  // Auto-slide for background images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(timer);
  }, [backgroundImages.length]);

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
    <div className="h-screen flex bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900 overflow-hidden relative">
      {/* Sliding Background Images */}
      <div className="absolute inset-0 w-full h-full">
        {backgroundImages.map((image, index) => (
          <img
            key={index}
            src={image.src}
            alt={image.alt}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-20" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-cyan-800/80 to-purple-900/80" />

      {/* Main Container - Full Height with Centered Modal */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl h-full max-h-[90vh] flex flex-col">
          {/* Modal Card with Fixed Height */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex flex-col h-full overflow-hidden">
            {/* Fixed Header */}
            <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 p-6 sm:p-8 text-center flex-shrink-0">
              <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-full bg-white/20 mb-4 sm:mb-6 shadow-lg backdrop-blur-sm">
                <svg
                  className="h-8 w-8 sm:h-10 sm:w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <EDMSLogo variant="light" className="mb-3" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-blue-100 text-sm sm:text-base">
                Sign in to your account to continue
              </p>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Display */}
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
                          : "border-gray-300 bg-white focus:border-blue-400"
                      } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                            : "border-gray-300 bg-white focus:border-blue-400"
                        } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <HiOutlineEyeOff className="h-5 w-5" />
                        ) : (
                          <HiOutlineEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:from-blue-700 hover:via-cyan-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
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
                    className="text-blue-600 hover:text-blue-700 text-sm transition-colors hover:underline"
                  >
                    Forgot your password?
                  </Link>
                  <div className="text-gray-600 text-sm">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 p-4 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200/50">
              <p className="text-center text-xs text-gray-500">
                © {new Date().getFullYear()} EDMS. Secure Document Management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
