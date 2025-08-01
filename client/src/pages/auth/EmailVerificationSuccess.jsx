import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  HiCheckCircle,
  HiArrowRight,
  HiSparkles,
  HiShieldCheck,
  HiOfficeBuilding,
  HiUser,
} from "react-icons/hi";
import { authAPI } from "../../services/api";
import EDMSLogo from "../../components/EDMSLogo";
import { GradientSpinner } from "../../components/common";

const EmailVerificationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("No verification token found");
        setVerifying(false);
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);

        if (response.data.success) {
          setSuccess(true);
          toast.success(
            "Email verified successfully! You can now log in to your account."
          );
        } else {
          setError(response.data.message || "Verification failed");
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setError(
          error.response?.data?.message ||
            "Verification failed. Please try again."
        );
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <GradientSpinner size="xl" variant="secondary" />
          <h2 className="text-2xl font-bold text-white mt-6 mb-2">
            Verifying Your Email
          </h2>
          <p className="text-white/70">
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
            <HiShieldCheck className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Verification Failed
          </h2>
          <p className="text-white/70 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              to="/verify-email"
              className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Try Again
            </Link>
            <Link
              to="/login"
              className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900" />
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
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Success Animation with Lottie */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-center mb-4"
        >
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Email Verified Successfully!
            </h1>
            <p className="text-lg text-white/70 mb-4">
              Your account has been activated. You can now log in and start
              using EDMS.
            </p>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-xl mb-3">
              <HiSparkles className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Welcome to EDMS
            </h3>
            <p className="text-white/70 text-xs">
              Your account is now ready. Start exploring the powerful document
              management features.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-xl mb-3">
              <HiOfficeBuilding className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Company Setup
            </h3>
            <p className="text-white/70 text-xs">
              Your company workspace is configured and ready for document
              management.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-xl mb-3">
              <HiUser className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Super Admin Access
            </h3>
            <p className="text-white/70 text-xs">
              You have full administrative control to manage users, departments,
              and workflows.
            </p>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            to="/login"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span>Login to Your Account</span>
            <HiArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center"
          >
            Back to Home
          </Link>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-6"
        >
          <EDMSLogo variant="light" className="h-6" />
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerificationSuccess;
