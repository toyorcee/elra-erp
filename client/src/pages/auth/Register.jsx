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
  HiKey,
  HiCog,
  HiChartBar,
  HiCheckCircle,
  HiSelector,
  HiBriefcase,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import ELRALogo from "../../components/ELRALogo";
import { toast } from "react-toastify";
import { registrationDataAPI } from "../../services/registrationData";
import ModernDropdown from "../../components/common/ModernDropdown";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    desiredRole: "",
    departmentId: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Format role names for display (remove underscores, capitalize properly)
  const formatDisplayName = (name) => {
    if (!name) return "";
    return name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const { register, isAuthenticated, error, clearError, initialized } =
    useAuth();
  const navigate = useNavigate();

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

  // Safety check - wait for auth to be initialized
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-teal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Fetch roles and departments for registration
  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        console.log("🔄 [Register] Starting to fetch registration data...");
        setLoadingData(true);
        const data = await registrationDataAPI.getRegistrationData();
        console.log("✅ [Register] Registration data received:", data);
        setRoles(data.roles);
        setDepartments(data.departments);
      } catch (error) {
        console.error("❌ [Register] Error fetching registration data:", error);
        toast.error(
          "Failed to load registration options. Please refresh the page."
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchRegistrationData();
  }, []);

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
    if (!formData.desiredRole) newErrors.desiredRole = "Please select a role";
    if (!formData.departmentId)
      newErrors.departmentId = "Please select a department";

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
        desiredRole: formData.desiredRole,
        departmentId: formData.departmentId,
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
      navigate("/modules");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-teal-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-teal-900" />

        {/* Animated Circles */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
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
          className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-8 fixed left-0 top-0 h-full"
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
              Join{" "}
              <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                ELRA ERP
              </span>
            </motion.h1>

            <motion.p
              className="text-xl text-white/80 mb-12 leading-relaxed"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Create your account and unlock the full potential of our
              enterprise resource planning platform.
            </motion.p>

            {/* Feature Cards */}
            <div className="space-y-6">
              {[
                {
                  icon: <HiShieldCheck className="w-6 h-6" />,
                  title: "Secure Registration",
                  description: "Bank-level encryption and data protection",
                  color: "from-purple-500/20 to-purple-600/20",
                  iconColor: "text-purple-400",
                },
                {
                  icon: <HiSparkles className="w-6 h-6" />,
                  title: "Instant Access",
                  description: "Get started immediately after verification",
                  color: "from-teal-500/20 to-teal-600/20",
                  iconColor: "text-teal-400",
                },
                {
                  icon: <HiOfficeBuilding className="w-6 h-6" />,
                  title: "Full ERP Access",
                  description: "All modules and features included",
                  color: "from-purple-500/20 to-teal-500/20",
                  iconColor: "text-purple-400",
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

        {/* Right Side - Registration Form - Scrollable */}
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
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
            </motion.div>

            {/* Registration Card */}
            <motion.div
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
              variants={fadeInVariants}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Join ELRA
                </h2>
                <p className="text-white/70">Create your enterprise account</p>
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

                {/* Username */}
                <motion.div variants={fadeInVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiUser className="h-5 w-5 text-white/50 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 backdrop-blur-sm transition-all duration-300 ${
                        errors.username ? "border-red-400/50" : ""
                      }`}
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.username}
                    </p>
                  )}
                </motion.div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fadeInVariants}>
                    <label className="block text-sm font-medium text-white/90 mb-3">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-4 rounded-xl border bg-white/10 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none text-white transition-all duration-300 ${
                        errors.firstName
                          ? "border-red-400/50"
                          : "border-white/20"
                      }`}
                      placeholder="First name"
                    />
                    {errors.firstName && (
                      <p className="mt-2 text-sm text-red-400">
                        {errors.firstName}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={fadeInVariants}>
                    <label className="block text-sm font-medium text-white/90 mb-3">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-4 rounded-xl border bg-white/10 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none text-white transition-all duration-300 ${
                        errors.lastName
                          ? "border-red-400/50"
                          : "border-white/20"
                      }`}
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="mt-2 text-sm text-red-400">
                        {errors.lastName}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Email */}
                <motion.div variants={fadeInVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiMail className="h-5 w-5 text-white/50 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 backdrop-blur-sm transition-all duration-300 ${
                        errors.email ? "border-red-400/50" : ""
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                  )}
                </motion.div>

                {/* Role Selection */}
                <motion.div variants={fadeInVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Desired Role
                  </label>
                  <ModernDropdown
                    options={roles.map((role) => ({
                      value: role.name,
                      label: role.name,
                      description: role.description,
                    }))}
                    value={formData.desiredRole}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, desiredRole: value }))
                    }
                    placeholder="Select a role"
                    loading={loadingData}
                    icon={HiBriefcase}
                    error={!!errors.desiredRole}
                  />
                  {errors.desiredRole && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.desiredRole}
                    </p>
                  )}
                </motion.div>

                {/* Department Selection */}
                <motion.div variants={fadeInVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Department
                  </label>
                  <ModernDropdown
                    options={departments.map((dept) => ({
                      value: dept._id,
                      label: dept.name,
                      description: dept.description,
                    }))}
                    value={formData.departmentId}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, departmentId: value }))
                    }
                    placeholder="Select a department"
                    loading={loadingData}
                    icon={HiOfficeBuilding}
                    error={!!errors.departmentId}
                  />
                  {errors.departmentId && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.departmentId}
                    </p>
                  )}
                </motion.div>

                {/* Password */}
                <motion.div variants={fadeInVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiLockClosed className="h-5 w-5 text-white/50 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 backdrop-blur-sm transition-all duration-300 ${
                        errors.password ? "border-red-400/50" : ""
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showPassword ? (
                        <HiEyeOff className="h-5 w-5 text-white/50 hover:text-white/70 transition-colors" />
                      ) : (
                        <HiEye className="h-5 w-5 text-white/50 hover:text-white/70 transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.password}
                    </p>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={fadeInVariants}>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiLockClosed className="h-5 w-5 text-white/50 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 backdrop-blur-sm transition-all duration-300 ${
                        errors.confirmPassword ? "border-red-400/50" : ""
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <HiEyeOff className="h-5 w-5 text-white/50 hover:text-white/70 transition-colors" />
                      ) : (
                        <HiEye className="h-5 w-5 text-white/50 hover:text-white/70 transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.confirmPassword}
                    </p>
                  )}
                </motion.div>

                {/* Approval Status Info */}
                {formData.desiredRole && (
                  <motion.div
                    className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl p-4"
                    variants={fadeInVariants}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-start space-x-3">
                      <HiSparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-blue-400 font-semibold mb-1">
                          {formData.desiredRole
                            ? `${formatDisplayName(
                                formData.desiredRole
                              )} Registration`
                            : "Registration Approval"}
                        </h4>
                        <p className="text-white/70 text-sm">
                          {formData.desiredRole === "STAFF" ||
                          formData.desiredRole === "JUNIOR_STAFF"
                            ? "Your registration will be auto-approved and you can start using the system immediately."
                            : formData.desiredRole === "MANAGER" ||
                              formData.desiredRole === "HOD"
                            ? "Your registration will need approval from your department head."
                            : formData.desiredRole === "COMPANY_ADMIN"
                            ? "Your registration will need approval from the Super Administrator."
                            : "Please select a role to see approval requirements."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Notice */}
                <motion.div
                  className="bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-xl p-4"
                  variants={fadeInVariants}
                >
                  <div className="flex items-start space-x-3">
                    <HiCheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-green-400 font-semibold mb-1">
                        Secure Registration
                      </h4>
                      <p className="text-white/70 text-sm">
                        Your data is encrypted and secure. We use
                        industry-standard security measures to protect your
                        information.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                  variants={fadeInVariants}
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
                      <span>Create ELRA Account</span>
                      <HiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {/* Sign In Link */}
                <motion.div className="text-center" variants={fadeInVariants}>
                  <p className="text-white/70">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
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
              <p className="text-white/50 text-sm">
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

export default Register;
