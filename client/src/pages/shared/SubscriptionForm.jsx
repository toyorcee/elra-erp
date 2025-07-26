import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOfficeBuilding,
  HiUser,
  HiMail,
  HiPhone,
  HiArrowRight,
  HiSparkles,
  HiShieldCheck,
  HiCreditCard,
} from "react-icons/hi";
import { initializeSubscriptionPayment } from "../../services/subscriptions";
import RedirectionSpinner from "../../components/common/RedirectionSpinner";

const SubscriptionForm = ({ isOpen, onClose, selectedPlan }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
  });
  const [errors, setErrors] = useState({});

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.6,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: { duration: 0.3 },
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
    exit: {
      x: -300,
      opacity: 0,
      transition: { duration: 0.3 },
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
        damping: 20,
        stiffness: 300,
        duration: 0.5,
      },
    },
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.companyEmail.trim())
      newErrors.companyEmail = "Company email is required";
    if (!formData.adminFirstName.trim())
      newErrors.adminFirstName = "First name is required";
    if (!formData.adminLastName.trim())
      newErrors.adminLastName = "Last name is required";
    if (!formData.adminEmail.trim())
      newErrors.adminEmail = "Admin email is required";
    if (!formData.adminPhone.trim())
      newErrors.adminPhone = "Phone number is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.companyEmail && !emailRegex.test(formData.companyEmail)) {
      newErrors.companyEmail = "Invalid email format";
    }
    if (formData.adminEmail && !emailRegex.test(formData.adminEmail)) {
      newErrors.adminEmail = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const adminName = `${formData.adminFirstName} ${formData.adminLastName}`;
      const response = await initializeSubscriptionPayment({
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        adminName,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone,
        plan: selectedPlan || {
          name: "professional",
          displayName: "Professional Plan",
        },
        billingCycle: "monthly",
        paymentProvider: "paystack",
      });

      if (response.success) {
        // Redirect to payment gateway
        window.location.href = response.data.authorization_url;
      } else {
        setErrors({
          submit: response.message || "Failed to initialize payment",
        });
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setCurrentStep(0);
      setFormData({
        companyName: "",
        companyEmail: "",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        adminPhone: "",
      });
      setErrors({});
    }
  };

  // Auto-advance step for demo
  useEffect(() => {
    if (isOpen && currentStep < 2) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl shadow-2xl border border-white/20"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Background */}
          <div className="absolute inset-0">
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

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 15 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                initial={{
                  x: Math.random() * 800,
                  y: Math.random() * 600,
                }}
                animate={{
                  x: Math.random() * 800,
                  y: Math.random() * 600,
                }}
                transition={{
                  duration: 15 + Math.random() * 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-20 text-white/70 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div className="relative z-10 p-8">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="mx-auto w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <HiOfficeBuilding className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Start Your Company
              </h2>
              <p className="text-white/70">
                Complete your subscription to get started with EDMS
              </p>
            </motion.div>

            {/* Form Steps */}
            <div className="flex gap-8">
              {/* Form Section */}
              <motion.div
                className="flex-1"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Information */}
                  <motion.div
                    className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <HiOfficeBuilding className="w-5 h-5 mr-2 text-blue-400" />
                      Company Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                            errors.companyName
                              ? "border-red-400"
                              : "border-white/20"
                          }`}
                          placeholder="Enter company name"
                        />
                        {errors.companyName && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.companyName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Company Email
                        </label>
                        <input
                          type="email"
                          name="companyEmail"
                          value={formData.companyEmail}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                            errors.companyEmail
                              ? "border-red-400"
                              : "border-white/20"
                          }`}
                          placeholder="company@example.com"
                        />
                        {errors.companyEmail && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.companyEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Admin Information */}
                  <motion.div
                    className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <HiUser className="w-5 h-5 mr-2 text-green-400" />
                      Admin Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="adminFirstName"
                          value={formData.adminFirstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                            errors.adminFirstName
                              ? "border-red-400"
                              : "border-white/20"
                          }`}
                          placeholder="Enter first name"
                        />
                        {errors.adminFirstName && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.adminFirstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="adminLastName"
                          value={formData.adminLastName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                            errors.adminLastName
                              ? "border-red-400"
                              : "border-white/20"
                          }`}
                          placeholder="Enter last name"
                        />
                        {errors.adminLastName && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.adminLastName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="adminEmail"
                          value={formData.adminEmail}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                            errors.adminEmail
                              ? "border-red-400"
                              : "border-white/20"
                          }`}
                          placeholder="admin@example.com"
                        />
                        {errors.adminEmail && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.adminEmail}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="adminPhone"
                          value={formData.adminPhone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none text-white transition-all duration-200 ${
                            errors.adminPhone
                              ? "border-red-400"
                              : "border-white/20"
                          }`}
                          placeholder="+1234567890"
                        />
                        {errors.adminPhone && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.adminPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Security Notice */}
                  <motion.div
                    className="bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-4"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-start space-x-3">
                      <HiShieldCheck className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-green-400 font-semibold mb-1">
                          Secure Payment
                        </h4>
                        <p className="text-white/70 text-sm">
                          Your information is encrypted and secure. We use
                          industry-standard SSL encryption to protect your data.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <HiCreditCard className="w-5 h-5" />
                        <span>Proceed to Payment</span>
                        <HiArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>

                  {errors.submit && (
                    <motion.div
                      className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.submit}
                    </motion.div>
                  )}
                </form>
              </motion.div>

              {/* Plan Summary */}
              <motion.div
                className="w-80 flex-shrink-0"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ delay: 0.4 }}
              >
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 h-full">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <HiSparkles className="w-5 h-5 mr-2 text-yellow-400" />
                    Plan Summary
                  </h3>

                  {selectedPlan ? (
                    <motion.div
                      className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-xl p-4 mb-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {selectedPlan.displayName || "Professional Plan"}
                      </h4>
                      <div className="text-3xl font-bold text-white mb-2">
                        ${selectedPlan.price?.monthly || "99"}
                        <span className="text-lg font-normal text-white/70">
                          /month
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mb-4">
                        {selectedPlan.description ||
                          "Perfect for growing businesses with advanced document management needs."}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-white/80">
                          <HiSparkles className="w-4 h-4 text-yellow-400 mr-2" />
                          Up to {selectedPlan.features?.maxUsers || "50"} users
                        </div>
                        <div className="flex items-center text-sm text-white/80">
                          <HiSparkles className="w-4 h-4 text-yellow-400 mr-2" />
                          {selectedPlan.features?.maxStorage || "500"}GB storage
                        </div>
                        <div className="flex items-center text-sm text-white/80">
                          <HiSparkles className="w-4 h-4 text-yellow-400 mr-2" />
                          {selectedPlan.features?.maxDepartments || "10"}{" "}
                          departments
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-xl p-4 mb-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center justify-center h-20">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    </motion.div>
                  )}

                  <div className="text-white/60 text-sm">
                    <p>• 30-day money-back guarantee</p>
                    <p>• Cancel anytime</p>
                    <p>• 24/7 support</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionForm;
