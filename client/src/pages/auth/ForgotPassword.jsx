import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiMail,
  HiArrowRight,
  HiSparkles,
  HiShieldCheck,
  HiOfficeBuilding,
  HiUser,
  HiArrowLeft,
  HiKey,
  HiCog,
  HiCheckCircle,
} from "react-icons/hi";
import { authAPI, handleApiError } from "../../services/api";
import ELRALogo from "../../components/ELRALogo";
import { GradientSpinner } from "../../components/common";
import loginImage from "../../assets/login.jpg";
import signupImage from "../../assets/signup.jpg";
import hero1Image from "../../assets/hero1.jpg";
import hero2Image from "../../assets/hero2.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

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

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.post("/auth/forgot-password", { email });

      if (response.data.success) {
        setSuccess(true);
        toast.success("Password reset link sent successfully!");
      } else {
        setError(response.data.message || "Failed to send reset link");
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError("");
    }
  };

  // Success State
  if (success) {
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
                Reset{" "}
                <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                  Password
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-white/80 mb-12 leading-relaxed"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                We've sent you a secure password reset link. Check your email to
                continue.
              </motion.p>

              {/* Feature Cards */}
              <div className="space-y-6">
                {[
                  {
                    icon: <HiShieldCheck className="w-6 h-6" />,
                    title: "Secure Reset",
                    description: "Encrypted link with automatic expiration",
                    color: "from-purple-500/20 to-purple-600/20",
                    iconColor: "text-purple-400",
                  },
                  {
                    icon: <HiMail className="w-6 h-6" />,
                    title: "Instant Delivery",
                    description: "Link sent immediately to your email",
                    color: "from-teal-500/20 to-teal-600/20",
                    iconColor: "text-teal-400",
                  },
                  {
                    icon: <HiKey className="w-6 h-6" />,
                    title: "Easy Recovery",
                    description: "Simple step-by-step password reset",
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

          {/* Right Side - Success Message - Scrollable */}
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
                <h2 className="text-2xl font-bold text-white">
                  Reset Link Sent
                </h2>
              </motion.div>

              {/* Success Card */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
                variants={fadeInVariants}
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                    className="mx-auto mb-6 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
                  >
                    <HiCheckCircle className="w-8 h-8 text-green-400" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-2xl font-bold text-white mb-4"
                  >
                    Reset Link Sent!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-white/70 mb-8 leading-relaxed"
                  >
                    We've sent a password reset link to{" "}
                    <strong className="text-white">{email}</strong>. Please
                    check your email and click the link to reset your password.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="space-y-4"
                  >
                    <Link
                      to="/login"
                      className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center space-x-2"
                    >
                      <HiArrowLeft className="w-5 h-5" />
                      <span>Back to Login</span>
                    </Link>

                    <button
                      onClick={() => setSuccess(false)}
                      className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      Try Another Email
                    </button>
                  </motion.div>
                </div>
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
              Forgot{" "}
              <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                Password?
              </span>
            </motion.h1>

            <motion.p
              className="text-xl text-white/80 mb-12 leading-relaxed"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              No worries! Enter your email and we'll send you a secure password
              reset link.
            </motion.p>

            {/* Feature Cards */}
            <div className="space-y-6">
              {[
                {
                  icon: <HiShieldCheck className="w-6 h-6" />,
                  title: "Secure Reset",
                  description: "Bank-level encryption for your reset link",
                  color: "from-purple-500/20 to-purple-600/20",
                  iconColor: "text-purple-400",
                },
                {
                  icon: <HiMail className="w-6 h-6" />,
                  title: "Instant Delivery",
                  description: "Receive your reset link immediately",
                  color: "from-teal-500/20 to-teal-600/20",
                  iconColor: "text-teal-400",
                },
                {
                  icon: <HiKey className="w-6 h-6" />,
                  title: "Easy Recovery",
                  description: "Simple step-by-step password reset process",
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

        {/* Right Side - Form - Scrollable */}
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
              <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
            </motion.div>

            {/* Form Card */}
            <motion.div
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
              variants={fadeInVariants}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Reset Password
                </h2>
                <p className="text-white/70">
                  Enter your email to receive a reset link
                </p>
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
                    className="block text-sm font-medium text-white/90 mb-3"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiMail className="h-5 w-5 text-white/50 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={handleEmailChange}
                      className={`w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 backdrop-blur-sm transition-all duration-300 ${
                        emailError ? "border-red-400/50" : ""
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {emailError && (
                    <p className="mt-2 text-sm text-red-400">{emailError}</p>
                  )}
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                  variants={fadeInVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <GradientSpinner size="sm" variant="light" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <HiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {/* Back to Login */}
                <motion.div variants={fadeInVariants} className="text-center">
                  <Link
                    to="/login"
                    className="text-sm text-teal-400 hover:text-teal-300 transition-colors duration-300"
                  >
                    ← Back to Login
                  </Link>
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

export default ForgotPassword;
