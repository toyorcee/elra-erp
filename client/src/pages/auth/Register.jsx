import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  HiUser,
  HiMail,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiArrowRight,
  HiSparkles,
  HiShieldCheck,
  HiOfficeBuilding,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import EDMSLogo from "../../components/EDMSLogo";
import "../../styles/Register.css";
import { toast } from "react-toastify";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { register, isAuthenticated, error, clearError, initialized } =
    useAuth();
  const navigate = useNavigate();

  // Safety check - wait for auth to be initialized
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Background images for the animated background
  const backgroundImages = [
    "/src/assets/login.jpg",
    "/src/assets/signup.jpg",
    "/src/assets/hero1.jpg",
    "/src/assets/hero2.jpg",
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.6,
      },
    },
  };

  const slideVariants = {
    hidden: { x: 300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.6,
      },
    },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
        duration: 0.5,
      },
    },
  };

  // Background image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const userData = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      const response = await register(userData);
      setSubmitting(false);

      if (response.success) {
        toast.success(
          "Account created successfully! Please check your email to verify your account."
        );
        navigate("/verify-email", {
          state: {
            email: formData.email,
            message:
              "Please check your email and click the verification link to activate your account.",
          },
        });
      } else {
        toast.error(response.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      setSubmitting(false);
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </AnimatePresence>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-900/70"></div>

        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden">
        {Array.from({ length: 15 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pt-20">
        {/* Centered Header - OUTSIDE flex containers */}
        <motion.div
          className="text-center mb-8 sm:mb-12 w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="flex justify-center mb-6 sm:mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <EDMSLogo variant="light" className="h-12 sm:h-14" />
          </motion.div>

          <motion.h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Create Your Account
          </motion.h1>

          <motion.p
            className="text-white/70 text-sm sm:text-base"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Join EDMS and revolutionize your document management
          </motion.p>
        </motion.div>

        {/* Form and Features Container */}
        <motion.div
          className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Side - Form */}
          <motion.div
            className="flex-1 flex items-center justify-center order-2 lg:order-1"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="w-full max-w-md mx-auto"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Form */}
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Username */}
                <motion.div variants={inputVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-12 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                        errors.username ? "border-red-400" : "border-white/20"
                      }`}
                      placeholder="Enter username"
                    />
                    <HiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  </div>
                  {errors.username && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.username}
                    </p>
                  )}
                </motion.div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={inputVariants}>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                        errors.firstName ? "border-red-400" : "border-white/20"
                      }`}
                      placeholder="First name"
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={inputVariants}>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                        errors.lastName ? "border-red-400" : "border-white/20"
                      }`}
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Email */}
                <motion.div variants={inputVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-12 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                        errors.email ? "border-red-400" : "border-white/20"
                      }`}
                      placeholder="Enter email address"
                    />
                    <HiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </motion.div>

                {/* Password */}
                <motion.div variants={inputVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                        errors.password ? "border-red-400" : "border-white/20"
                      }`}
                      placeholder="Enter password"
                    />
                    <HiLockClosed className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? (
                        <HiEyeOff className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={inputVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                        errors.confirmPassword
                          ? "border-red-400"
                          : "border-white/20"
                      }`}
                      placeholder="Confirm password"
                    />
                    <HiLockClosed className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <HiEyeOff className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </motion.div>

                {/* Security Notice */}
                <motion.div
                  className="bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-xl p-3 sm:p-4"
                  variants={inputVariants}
                >
                  <div className="flex items-start space-x-3">
                    <HiShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-green-400 font-semibold mb-1 text-sm sm:text-base">
                        Secure Registration
                      </h4>
                      <p className="text-white/70 text-xs sm:text-sm">
                        Your data is encrypted and secure. We use
                        industry-standard security measures to protect your
                        information.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  variants={inputVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <HiSparkles className="w-5 h-5" />
                      <span>Create Account</span>
                      <HiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {/* Sign In Link */}
                <motion.div className="text-center" variants={inputVariants}>
                  <p className="text-white/70">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </motion.div>
              </motion.form>
            </motion.div>
          </motion.div>

          {/* Right Side - Features */}
          <motion.div
            className="flex-1 flex items-center justify-center order-1 lg:order-2"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="w-full max-w-md space-y-4 sm:space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6"
                variants={cardVariants}
              >
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <HiOfficeBuilding className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Professional Workspace
                  </h3>
                </div>
                <p className="text-white/70 text-sm">
                  Get access to a complete document management system with
                  advanced workflows and team collaboration.
                </p>
              </motion.div>

              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6"
                variants={cardVariants}
              >
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <HiShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Enterprise Security
                  </h3>
                </div>
                <p className="text-white/70 text-sm">
                  Bank-level encryption and security protocols ensure your
                  documents are always protected.
                </p>
              </motion.div>

              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6"
                variants={cardVariants}
              >
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <HiSparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Smart Features
                  </h3>
                </div>
                <p className="text-white/70 text-sm">
                  AI-powered document organization, automated workflows, and
                  intelligent search capabilities.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
