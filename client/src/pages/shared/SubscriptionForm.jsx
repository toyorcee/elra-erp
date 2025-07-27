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
  HiX,
} from "react-icons/hi";
import { initializeSubscriptionPayment } from "../../services/subscriptions";
import { useAuth } from "../../context/AuthContext";
import PaymentProviderSelector from "../../components/PaymentProviderSelector";
import RedirectionSpinner from "../../components/common/RedirectionSpinner";

const SubscriptionForm = ({
  isOpen,
  onClose,
  selectedPlan,
  flow = "company",
}) => {
  const { subscriptionPlans } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(selectedPlan);
  const [billingCycle, setBillingCycle] = useState(
    selectedPlan?.billingCycle || "monthly"
  );
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
  });
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [selectedPaymentProvider, setSelectedPaymentProvider] =
    useState("stripe");
  const [errors, setErrors] = useState({});
  const [showRedirectionSpinner, setShowRedirectionSpinner] = useState(false);

  // Function to get the correct price for current plan and currency
  const getPlanPriceDisplay = (plan, currency, cycle) => {
    if (!plan || !plan.price) return currency === "NGN" ? "₦99" : "$99";

    const price =
      plan.price[currency]?.[cycle] || plan.price[currency] || 99.99;

    if (currency === "NGN") {
      return `₦${price.toLocaleString()}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  useEffect(() => {
    if (selectedPlan) {
      setCurrentPlan(selectedPlan);
      setBillingCycle(selectedPlan.billingCycle || "monthly");
    }
  }, [selectedPlan]);

  // Auto-select payment provider based on currency
  useEffect(() => {
    if (selectedCurrency === "NGN") {
      setSelectedPaymentProvider("paystack");
    } else {
      setSelectedPaymentProvider("stripe");
    }
  }, [selectedCurrency]);

  // Store selected payment provider in localStorage
  useEffect(() => {
    localStorage.setItem("selectedPaymentProvider", selectedPaymentProvider);
  }, [selectedPaymentProvider]);

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
      const paymentData = {
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        adminName,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone,
        plan: currentPlan?.name || "professional",
        billingCycle: billingCycle,
        paymentProvider: selectedPaymentProvider,
        currency: selectedCurrency,
      };

      console.log("🚀 Frontend - Payment Data being sent:", paymentData);
      console.log("📋 Form Data:", formData);
      console.log("🎯 Current Plan:", currentPlan);
      console.log("💰 Billing Cycle:", billingCycle);
      console.log("💱 Selected Currency:", selectedCurrency);
      console.log("💳 Selected Payment Provider:", selectedPaymentProvider);
      console.log("🔍 Amount being sent:", {
        plan: currentPlan?.name,
        billingCycle,
        currency: selectedCurrency,
        amount:
          currentPlan?.price?.[selectedCurrency]?.[billingCycle] ||
          currentPlan?.price?.USD?.[billingCycle],
        expectedDisplay:
          selectedCurrency === "NGN"
            ? `₦${(
                currentPlan?.price?.[selectedCurrency]?.[billingCycle] ||
                currentPlan?.price?.USD?.[billingCycle]
              )?.toLocaleString()}`
            : `$${(
                currentPlan?.price?.[selectedCurrency]?.[billingCycle] ||
                currentPlan?.price?.USD?.[billingCycle]
              )?.toLocaleString()}`,
      });

      const response = await initializeSubscriptionPayment(paymentData);

      if (response.success) {
        setShowRedirectionSpinner(true);
        setIsLoading(false);

        setTimeout(() => {
          window.location.href = response.data.payment.authorization_url;
        }, 4000);
      } else {
        setErrors({
          submit: response.message || "Failed to initialize payment",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setErrors({ submit: "An error occurred. Please try again." });
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
          className="relative w-full max-w-4xl h-[90vh] bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
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
                key={`particle-${i}`}
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

          {/* Scrollable Content */}
          <div className="relative z-10 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30 transition-all duration-200">
            <div className="p-8 pb-12">
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
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Form Section */}
                <motion.div
                  className="flex-1 order-1 lg:order-2"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Information - Only show for company flow */}
                    {flow === "company" && (
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
                    )}

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
                            industry-standard SSL encryption to protect your
                            data.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Email Notification Notice */}
                    <motion.div
                      className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.55 }}
                    >
                      <div className="flex items-start space-x-3">
                        <HiMail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-blue-400 font-semibold mb-1">
                            Email Notifications
                          </h4>
                          <p className="text-white/70 text-sm">
                            <strong>Admin Email:</strong> Will receive
                            invitation with login credentials and account setup
                            instructions.
                            <br />
                            <strong>Company Email:</strong> Will receive billing
                            invoices, subscription management, and company-wide
                            announcements.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Currency Selection */}
                    <motion.div
                      className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.6 }}
                    >
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <HiCreditCard className="w-5 h-5 mr-2 text-purple-400" />
                        Payment Currency
                      </h4>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="currency"
                            value="USD"
                            checked={selectedCurrency === "USD"}
                            onChange={(e) =>
                              setSelectedCurrency(e.target.value)
                            }
                            className="w-4 h-4 text-blue-600 bg-white/5 border-white/20 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-white/90">USD ($)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="currency"
                            value="NGN"
                            checked={selectedCurrency === "NGN"}
                            onChange={(e) =>
                              setSelectedCurrency(e.target.value)
                            }
                            className="w-4 h-4 text-blue-600 bg-white/5 border-white/20 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-white/90">NGN (₦)</span>
                        </label>
                      </div>
                      <p className="text-white/60 text-sm mt-2">
                        Select your preferred payment currency. NGN is
                        recommended for Nigerian customers.
                      </p>
                    </motion.div>

                    {/* Payment Provider Selection */}
                    <PaymentProviderSelector
                      selectedCurrency={selectedCurrency}
                      selectedPaymentProvider={selectedPaymentProvider}
                      onPaymentProviderChange={setSelectedPaymentProvider}
                    />

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8 cursor-pointer"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.65 }}
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
                          <span>
                            Proceed to{" "}
                            {selectedPaymentProvider === "paystack"
                              ? "Paystack"
                              : selectedPaymentProvider === "stripe"
                              ? "Stripe"
                              : "PayPal"}
                          </span>
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
                  className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <HiSparkles className="w-5 h-5 mr-2 text-yellow-400" />
                        Plan Summary
                      </h3>
                      <button
                        onClick={() => setShowPlanSelector(!showPlanSelector)}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center"
                      >
                        <HiSparkles className="w-4 h-4 mr-1" />
                        Change Plan
                      </button>
                    </div>

                    {currentPlan ? (
                      <motion.div
                        key={`${currentPlan.name}-${selectedCurrency}-${billingCycle}`}
                        className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-xl p-4 mb-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {currentPlan.displayName || "Professional Plan"}
                        </h4>
                        <div className="text-3xl font-bold text-white mb-2">
                          {getPlanPriceDisplay(
                            currentPlan,
                            selectedCurrency,
                            billingCycle
                          )}
                          <span className="text-lg font-normal text-white/70">
                            /{billingCycle === "monthly" ? "month" : "year"}
                          </span>
                        </div>

                        {/* Currency Conversion Display */}
                        {selectedCurrency === "NGN" &&
                          currentPlan.price?.USD?.[billingCycle] && (
                            <div className="text-sm text-white/60 mb-2">
                              ≈{" "}
                              {currentPlan.price.USD[
                                billingCycle
                              ].toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}{" "}
                              USD
                              <span className="text-xs text-white/40 ml-1">
                                (converted at ₦1,500/USD)
                              </span>
                            </div>
                          )}
                        <p className="text-white/70 text-sm mb-4">
                          {currentPlan.description ||
                            "Perfect for growing businesses with advanced document management needs."}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-white/80">
                            <HiSparkles className="w-4 h-4 text-yellow-400 mr-2" />
                            Up to{" "}
                            {currentPlan.features?.maxUsers === -1
                              ? "Unlimited"
                              : currentPlan.features?.maxUsers || "50"}{" "}
                            users
                          </div>
                          <div className="flex items-center text-sm text-white/80">
                            <HiSparkles className="w-4 h-4 text-yellow-400 mr-2" />
                            {currentPlan.features?.maxStorage === -1
                              ? "Unlimited"
                              : currentPlan.features?.maxStorage || "500"}
                            GB storage
                          </div>
                          <div className="flex items-center text-sm text-white/80">
                            <HiSparkles className="w-4 h-4 text-yellow-400 mr-2" />
                            {currentPlan.features?.maxDepartments === -1
                              ? "Unlimited"
                              : currentPlan.features?.maxDepartments ||
                                "10"}{" "}
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

                    {/* Plan Selector Modal */}
                    <AnimatePresence>
                      {showPlanSelector && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-800 border border-white/20 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-semibold text-white">
                                Choose Your Plan
                              </h3>
                              <button
                                onClick={() => setShowPlanSelector(false)}
                                className="text-white/60 hover:text-white transition-colors"
                              >
                                <HiX className="w-6 h-6" />
                              </button>
                            </div>

                            {/* Billing Cycle Toggle */}
                            <div className="flex items-center justify-center bg-white/5 rounded-xl p-1 mb-4">
                              <button
                                onClick={() => setBillingCycle("monthly")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  billingCycle === "monthly"
                                    ? "bg-blue-600 text-white"
                                    : "text-white/60 hover:text-white"
                                }`}
                              >
                                Monthly
                              </button>
                              <button
                                onClick={() => setBillingCycle("yearly")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                                  billingCycle === "yearly"
                                    ? "bg-blue-600 text-white"
                                    : "text-white/60 hover:text-white"
                                }`}
                              >
                                Yearly
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                                  Save 20%
                                </div>
                              </button>
                            </div>

                            {/* Plan Options */}
                            <div className="space-y-3">
                              {Array.isArray(subscriptionPlans) &&
                              subscriptionPlans.length > 0 &&
                              subscriptionPlans.some(
                                (plan) => plan && plan.name
                              ) ? (
                                subscriptionPlans
                                  .filter((plan) => plan && plan.name)
                                  .map((plan, index) => (
                                    <motion.div
                                      key={
                                        plan?.name ||
                                        `plan-${index}` ||
                                        `fallback-${index}`
                                      }
                                      onClick={() => {
                                        const updatedPlan = {
                                          ...plan,
                                          billingCycle: billingCycle,
                                          price: plan.price || {},
                                        };
                                        setCurrentPlan(updatedPlan);
                                        setShowPlanSelector(false);
                                      }}
                                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                        currentPlan?.name === plan.name
                                          ? "border-blue-500 bg-blue-500/10"
                                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                      }`}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-white">
                                          {plan.displayName}
                                        </h4>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-white">
                                            {getPlanPriceDisplay(
                                              plan,
                                              selectedCurrency,
                                              billingCycle
                                            )}
                                          </div>
                                          <div className="text-xs text-white/60">
                                            /
                                            {billingCycle === "monthly"
                                              ? "month"
                                              : "year"}
                                          </div>
                                        </div>
                                      </div>
                                      <p className="text-sm text-white/70 mb-3">
                                        {plan.description}
                                      </p>
                                      <div className="space-y-1">
                                        <div className="flex items-center text-xs text-white/60">
                                          <HiSparkles className="w-3 h-3 text-yellow-400 mr-1" />
                                          Up to{" "}
                                          {plan.features?.maxUsers === -1
                                            ? "Unlimited"
                                            : plan.features?.maxUsers ||
                                              "N/A"}{" "}
                                          users
                                        </div>
                                        <div className="flex items-center text-xs text-white/60">
                                          <HiSparkles className="w-3 h-3 text-yellow-400 mr-1" />
                                          {plan.features?.maxStorage === -1
                                            ? "Unlimited"
                                            : plan.features?.maxStorage ||
                                              "N/A"}
                                          GB storage
                                        </div>
                                        <div className="flex items-center text-xs text-white/60">
                                          <HiSparkles className="w-3 h-3 text-yellow-400 mr-1" />
                                          {plan.features?.maxDepartments === -1
                                            ? "Unlimited"
                                            : plan.features?.maxDepartments ||
                                              "N/A"}{" "}
                                          departments
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))
                              ) : (
                                <div className="text-center text-white/60 py-8">
                                  <div className="w-16 h-16 mx-auto mb-4">
                                    <lottie-player
                                      src="https://assets2.lottiefiles.com/packages/lf20_usmfx6bp.json"
                                      background="transparent"
                                      speed="1"
                                      loop
                                      autoplay
                                    ></lottie-player>
                                  </div>
                                  <p>Loading plans...</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Redirection Spinner */}
      <RedirectionSpinner
        isVisible={showRedirectionSpinner}
        paymentProvider={selectedPaymentProvider}
        amount={
          currentPlan?.formattedPrices?.[selectedCurrency]?.[billingCycle]
            ?.amount ||
          currentPlan?.price?.[selectedCurrency]?.[billingCycle] ||
          currentPlan?.price?.USD?.[billingCycle] ||
          currentPlan?.price?.[billingCycle] ||
          99
        }
        currency={selectedCurrency}
        planName={currentPlan?.displayName || "Professional Plan"}
      />
    </AnimatePresence>
  );
};

export default SubscriptionForm;
