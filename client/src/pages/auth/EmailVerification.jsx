import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiMail,
  HiArrowRight,
  HiSparkles,
  HiShieldCheck,
  HiOfficeBuilding,
  HiUser,
  HiArrowLeft,
  HiRefresh,
} from "react-icons/hi";
import { authAPI } from "../../services/api";
import EDMSLogo from "../../components/EDMSLogo";
import { GradientSpinner } from "../../components/common";

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  useEffect(() => {
    window.scrollTo(0, 0);

    // Get email from location state or URL params
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    }

    // Auto-slide background images
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [location.state, backgroundImages.length]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setResendLoading(true);
    try {
      const response = await authAPI.resendVerification({ email });

      if (response.data.success) {
        toast.success(
          "Verification email sent successfully! Please check your inbox."
        );
      } else {
        toast.error(
          response.data.message || "Failed to send verification email"
        );
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900" />
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-20" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        ))}
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pt-20">
        {/* Centered Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12 w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="flex justify-center mb-6 sm:mb-8"
            variants={cardVariants}
          >
            <EDMSLogo variant="light" className="h-12 sm:h-14" />
          </motion.div>
          <motion.h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4"
            variants={cardVariants}
          >
            Verify Your Email
          </motion.h1>
          <motion.p
            className="text-white/70 text-sm sm:text-base"
            variants={cardVariants}
          >
            We've sent a verification link to your email address
          </motion.p>
        </motion.div>

        {/* Form and Features Container */}
        <motion.div
          className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Side - Verification Form */}
          <motion.div className="flex-1 flex items-center justify-center order-2 lg:order-1">
            <motion.div
              className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl"
              variants={cardVariants}
            >
              <div className="space-y-6">
                {/* Email Icon */}
                <motion.div variants={inputVariants} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                    <HiMail className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-white/70 text-sm">
                    We've sent a verification link to your email address. Please
                    check your inbox and click the link to activate your
                    account.
                  </p>
                </motion.div>

                {/* Email Display */}
                <motion.div variants={inputVariants}>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiMail className="h-5 w-5 text-white/50" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                      placeholder="Enter your email address"
                    />
                  </div>
                </motion.div>

                {/* Resend Button */}
                <motion.button
                  onClick={handleResendVerification}
                  disabled={resendLoading || !email}
                  variants={inputVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <GradientSpinner size="sm" variant="light" />
                  ) : (
                    <HiRefresh className="w-5 h-5" />
                  )}
                  <span>
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </span>
                </motion.button>

                {/* Divider */}
                <motion.div variants={inputVariants} className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-white/50">
                      Already verified?
                    </span>
                  </div>
                </motion.div>

                {/* Login Link */}
                <motion.div variants={inputVariants}>
                  <Link
                    to="/login"
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <HiArrowRight className="w-5 h-5" />
                    <span>Go to Login</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Features */}
          <motion.div className="flex-1 flex items-center justify-center order-1 lg:order-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
              {/* Feature Cards */}
              <motion.div
                variants={slideVariants}
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4">
                  <HiShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Secure Verification
                </h3>
                <p className="text-white/70 text-sm">
                  Your account is protected with email verification to ensure
                  only you can access it.
                </p>
              </motion.div>

              <motion.div
                variants={slideVariants}
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-xl mb-4">
                  <HiSparkles className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Quick Setup
                </h3>
                <p className="text-white/70 text-sm">
                  Once verified, you'll have instant access to all EDMS features
                  and your workspace.
                </p>
              </motion.div>

              <motion.div
                variants={slideVariants}
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-xl mb-4">
                  <HiOfficeBuilding className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Company Ready
                </h3>
                <p className="text-white/70 text-sm">
                  Your company workspace is already set up and waiting for you
                  to start managing documents.
                </p>
              </motion.div>

              <motion.div
                variants={slideVariants}
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-xl mb-4">
                  <HiUser className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Super Admin Access
                </h3>
                <p className="text-white/70 text-sm">
                  As the first user, you'll have full administrative control
                  over your EDMS system.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Back to Register Link */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span>Back to Registration</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerification;
