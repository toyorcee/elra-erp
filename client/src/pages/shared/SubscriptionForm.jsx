import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  HiX,
  HiOfficeBuilding,
  HiUser,
  HiCreditCard,
  HiShieldCheck,
} from "react-icons/hi";
import { initializeSubscriptionPayment } from "../../services/subscriptions.js";
import RedirectionSpinner from "../../components/common/RedirectionSpinner.jsx";

const SubscriptionForm = ({
  selectedPlan,
  billingCycle,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [showRedirection, setShowRedirection] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const paymentData = {
        ...formData,
        plan: selectedPlan.name,
        billingCycle,
        paymentProvider: "paystack",
      };

      const response = await initializeSubscriptionPayment(paymentData);

      if (response.success) {
        // Show redirection spinner
        setShowRedirection(true);

        // Redirect to payment page after a short delay
        setTimeout(() => {
          window.location.href = response.data.redirectUrl;
        }, 3000);
      } else {
        setError(response.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.companyName.trim() &&
      formData.companyEmail.trim() &&
      formData.adminFirstName.trim() &&
      formData.adminLastName.trim() &&
      formData.adminEmail.trim() &&
      formData.adminPhone.trim()
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Get Started with {selectedPlan.displayName}
            </h2>
            <p className="text-white/60 text-sm">
              $
              {billingCycle === "yearly"
                ? selectedPlan.price.yearly
                : selectedPlan.price.monthly}
              /{billingCycle === "yearly" ? "year" : "month"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors duration-300"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                step >= 1
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              1
            </div>
            <div
              className={`w-12 h-0.5 ${
                step >= 2
                  ? "bg-gradient-to-r from-blue-500 to-purple-500"
                  : "bg-white/10"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                step >= 2
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <HiOfficeBuilding className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Company Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                placeholder="Enter your company name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Company Email *
              </label>
              <input
                type="email"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                placeholder="company@example.com"
                required
              />
            </div>
          </div>

          {/* Admin Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <HiUser className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                Administrator Details
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="adminFirstName"
                  value={formData.adminFirstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="adminLastName"
                  value={formData.adminLastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="adminPhone"
                value={formData.adminPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                placeholder="+1234567890"
                required
              />
            </div>
          </div>

          {/* Plan Summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <HiCreditCard className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Plan Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Plan:</span>
                <span className="text-white font-medium">
                  {selectedPlan.displayName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Billing:</span>
                <span className="text-white font-medium capitalize">
                  {billingCycle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Price:</span>
                <span className="text-white font-medium">
                  $
                  {billingCycle === "yearly"
                    ? selectedPlan.price.yearly
                    : selectedPlan.price.monthly}
                  /{billingCycle === "yearly" ? "year" : "month"}
                </span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <HiShieldCheck className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-white/80">
              <p className="font-medium text-white mb-1">Secure Payment</p>
              <p>
                Your payment will be processed securely through Paystack. We
                never store your payment information.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 transform ${
              isFormValid() && !loading
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:scale-105"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Continue to Payment - $${
                billingCycle === "yearly"
                  ? selectedPlan.price.yearly
                  : selectedPlan.price.monthly
              }`
            )}
          </button>
        </form>
      </motion.div>

      {/* Redirection Spinner */}
      <RedirectionSpinner
        isVisible={showRedirection}
        paymentProvider="Paystack"
        amount={
          billingCycle === "yearly"
            ? selectedPlan.price.yearly
            : selectedPlan.price.monthly
        }
        planName={selectedPlan.displayName}
      />
    </motion.div>
  );
};

export default SubscriptionForm;
