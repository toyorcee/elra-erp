import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiArrowRight, HiShieldCheck, HiCreditCard } from "react-icons/hi";

const RedirectionSpinner = ({
  isVisible,
  paymentProvider = "paystack",
  amount,
  currency = "USD",
  planName,
  onComplete,
}) => {
  // Payment provider configurations
  const paymentProviders = {
    paystack: {
      name: "Paystack",
      icon: "₦",
      colors: "from-green-500 to-green-600",
      borderColor: "border-green-500/30",
      bgColor: "bg-green-500/10",
      textColor: "text-green-400",
      description: "Secure payment for Nigerian customers",
    },
    stripe: {
      name: "Stripe",
      icon: "💳",
      colors: "from-purple-500 to-purple-600",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-400",
      description: "Secure payment with credit/debit cards",
    },
    paypal: {
      name: "PayPal",
      icon: "🔵",
      colors: "from-blue-500 to-blue-600",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
      description: "Pay with your PayPal account",
    },
  };

  const currentProvider =
    paymentProviders[paymentProvider] || paymentProviders.paystack;
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");

  const steps = React.useMemo(
    () => [
      {
        title: "Preparing Your Payment",
        description: "Setting up secure payment gateway...",
        icon: HiShieldCheck,
        color: "text-blue-400",
      },
      {
        title: "Redirecting to Payment",
        description: `Redirecting to ${currentProvider.name} secure payment page...`,
        icon: HiCreditCard,
        color: currentProvider.textColor,
      },
      {
        title: "Almost There",
        description:
          "Please complete your payment to activate your subscription...",
        icon: HiArrowRight,
        color: "text-purple-400",
      },
    ],
    [currentProvider.name, currentProvider.textColor]
  );

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [isVisible, steps.length]);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setDots("");
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10 animate-pulse"></div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            {/* Payment Provider Badge */}
            <div
              className={`px-4 py-2 rounded-full bg-gradient-to-r ${currentProvider.colors} text-white text-sm font-semibold mb-6 inline-block`}
            >
              {currentProvider.name}
            </div>

            {/* Main spinner with enhanced animations */}
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto relative">
                {/* Multi-layered spinning rings */}
                <motion.div
                  className="absolute inset-0 border-4 border-white/10 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-2 border-4 border-transparent border-t-blue-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-4 border-4 border-transparent border-t-purple-500 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute inset-6 border-4 border-transparent border-t-green-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Center icon overlay */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {React.createElement(steps[currentStep].icon, {
                    className: `w-10 h-10 ${steps[currentStep].color} drop-shadow-lg`,
                  })}
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-white/60 mb-6">
                {steps[currentStep].description}
                <span className="inline-block w-4">{dots}</span>
              </p>
            </motion.div>

            {/* Payment details */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Plan:</span>
                <span className="text-white font-medium">{planName}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-white/60">Amount:</span>
                <span className="text-white font-medium">
                  {typeof amount === "number"
                    ? amount.toLocaleString(
                        currency === "NGN" ? "en-NG" : "en-US",
                        {
                          style: "currency",
                          currency: currency,
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }
                      )
                    : amount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-white/60">Provider:</span>
                <span className="text-white font-medium">
                  {currentProvider.name}
                </span>
              </div>
            </motion.div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {steps.map((step, index) => (
                <motion.div
                  key={`step-${index}-${step.title}`}
                  className={`w-3 h-3 rounded-full ${
                    index <= currentStep ? "bg-blue-500" : "bg-white/20"
                  }`}
                  animate={{
                    scale: index === currentStep ? [1, 1.3, 1] : 1,
                    boxShadow:
                      index === currentStep
                        ? [
                            "0 0 0 0 rgba(59, 130, 246, 0.4)",
                            "0 0 0 10px rgba(59, 130, 246, 0)",
                            "0 0 0 0 rgba(59, 130, 246, 0)",
                          ]
                        : "0 0 0 0 rgba(59, 130, 246, 0)",
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: index === currentStep ? Infinity : 0,
                  }}
                />
              ))}
            </div>

            {/* Security notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center space-x-2 text-xs text-white/40"
            >
              <HiShieldCheck className="w-4 h-4" />
              <span>Secure SSL Connection</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RedirectionSpinner;
