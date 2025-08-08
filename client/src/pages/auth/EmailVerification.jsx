import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import ELRALogo from "../../components/ELRALogo";
import { GradientSpinner } from "../../components/common";

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

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

  const inputVariants = {
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
    window.scrollTo(0, 0);

    // Get email from location state or URL params
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    }
  }, [location.state]);

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
        {/* Left Side - Brand/Info (Fixed) */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <ELRALogo variant="light" size="xl" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl font-bold text-white mb-6"
            >
              <span className="bg-gradient-to-r from-purple-300 to-teal-300 bg-clip-text text-transparent">
                Email Verification
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/80 text-lg mb-8"
            >
              Complete your account setup by verifying your email address. This
              ensures your account security and unlocks all ELRA ERP features.
            </motion.p>

            {/* Feature Cards */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl backdrop-blur-sm"
              >
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <HiShieldCheck className="w-5 h-5 text-purple-300" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">
                    Secure Verification
                  </h3>
                  <p className="text-white/60 text-sm">
                    Protect your account with email verification
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl backdrop-blur-sm"
              >
                <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <HiSparkles className="w-5 h-5 text-teal-300" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">Quick Setup</h3>
                  <p className="text-white/60 text-sm">
                    Get instant access to all ERP modules
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl backdrop-blur-sm"
              >
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <HiOfficeBuilding className="w-5 h-5 text-purple-300" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">Company Ready</h3>
                  <p className="text-white/60 text-sm">
                    Your workspace is waiting for you
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Side - Form (Scrollable) */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="space-y-6">
                {/* Email Icon */}
                <motion.div variants={inputVariants} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-teal-500/20 rounded-full mb-4">
                    <HiMail className="w-8 h-8 text-purple-300" />
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
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
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
                  className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
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

            {/* Back to Register Link */}
            <motion.div
              className="mt-6 text-center"
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

            {/* Footer */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-white/50 text-sm">
                © {new Date().getFullYear()} ELRA ERP System. All rights
                reserved.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
