import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiArrowRight,
  HiSparkles,
  HiShieldCheck,
  HiOfficeBuilding,
  HiUser,
  HiKey,
  HiCog,
  HiChartBar,
  HiMail,
  HiLockClosed,
} from "react-icons/hi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import ELRALogo from "../../components/ELRALogo";
import { GradientSpinner } from "../../components/common";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, error, clearError, initialized, user } =
    useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

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

  const slideInVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
      },
    },
  };

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

  // Safety check - wait for auth to be initialized
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-green-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

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
      password: formData.password.trim(), // Trim whitespace to prevent leading/trailing spaces
    });
    setLoading(false);

    if (result.success) {
      toast.success("Login successful! Welcome back.");
      // Navigation will be handled by the useEffect above
    } else {
      toast.error(result.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0">
        {/* White Background */}
        <div className="absolute inset-0 bg-white" />

        {/* Animated Circles */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Brand & Info - Fixed */}
        <motion.div
          className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-8 fixed left-0 top-0 h-full bg-gradient-to-br from-green-600 via-green-700 to-emerald-700"
          variants={slideInVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-md mx-auto">
            {/* Logo */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ELRALogo variant="light" size="lg" />
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-5xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Welcome to{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                ELRA ERP
              </span>
            </motion.h1>

            <motion.p
              className="text-xl text-white/80 mb-12 leading-relaxed"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Your complete enterprise resource planning solution. Manage HR,
              payroll, procurement, and more from one powerful platform.
            </motion.p>

            {/* Feature Cards */}
            <div className="space-y-6">
              {[
                {
                  icon: <HiShieldCheck className="w-6 h-6" />,
                  title: "Enterprise Security",
                  description: "Bank-level encryption and compliance",
                  color: "from-green-500/20 to-green-600/20",
                  iconColor: "text-green-400",
                },
                {
                  icon: <HiChartBar className="w-6 h-6" />,
                  title: "Smart Analytics",
                  description: "AI-powered insights and reporting",
                  color: "from-emerald-500/20 to-emerald-600/20",
                  iconColor: "text-emerald-400",
                },
                {
                  icon: <HiCog className="w-6 h-6" />,
                  title: "Seamless Integration",
                  description: "Connect all your business processes",
                  color: "from-green-500/20 to-emerald-500/20",
                  iconColor: "text-green-400",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center ${feature.iconColor}`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form - Scrollable */}
        <motion.div
          className="w-full lg:w-1/2 lg:ml-auto flex items-start justify-center px-6 py-8 min-h-screen"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="w-full max-w-md my-8"
            variants={fadeInVariants}
          >
            {/* Mobile Logo */}
            <motion.div
              className="lg:hidden text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ELRALogo variant="light" size="md" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            </motion.div>

            {/* Login Card */}
            <motion.div
              className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 backdrop-blur-xl border border-green-500/20 rounded-3xl p-8 shadow-2xl"
              variants={fadeInVariants}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
                <p className="text-white/90">Access your ELRA ERP workspace</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center backdrop-blur-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Email Field */}
                <motion.div variants={fadeInVariants}>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white mb-3"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiMail className="h-5 w-5 text-white/50 group-focus-within:text-green-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm transition-all duration-300 ${
                        errors.email ? "border-red-400/50" : ""
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                  )}
                </motion.div>

                {/* Password Field */}
                <motion.div variants={fadeInVariants}>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white mb-3"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiLockClosed className="h-5 w-5 text-white/50 group-focus-within:text-green-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-12 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm transition-all duration-300 ${
                        errors.password ? "border-red-400/50" : ""
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showPassword ? (
                        <MdVisibilityOff className="h-5 w-5 text-white/50 hover:text-white/70 transition-colors" />
                      ) : (
                        <MdVisibility className="h-5 w-5 text-white/50 hover:text-white/70 transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.password}
                    </p>
                  )}
                </motion.div>

                {/* Forgot Password Link */}
                <motion.div variants={fadeInVariants} className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-300"
                  >
                    Forgot your password?
                  </Link>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                  variants={fadeInVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <GradientSpinner size="sm" variant="white-green" />
                  ) : (
                    <>
                      <span>Sign In to ELRA</span>
                      <HiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {/* Internal System Notice */}
                <motion.div variants={fadeInVariants} className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-white/50">
                      Internal System
                    </span>
                  </div>
                </motion.div>

                {/* Ministry Notice */}
                <motion.div variants={fadeInVariants}>
                  <div className="w-full bg-white/10 border border-white/20 text-white py-4 px-6 rounded-xl text-center">
                    <HiShieldCheck className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                    <span className="text-sm">Federal Ministry of Finance</span>
                    <p className="text-xs text-white/70 mt-1">
                      ELRA - Equipment Leasing Registration Authority
                    </p>
                  </div>
                </motion.div>
              </form>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="text-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} ELRA - Equipment Leasing
                Registration Authority
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
