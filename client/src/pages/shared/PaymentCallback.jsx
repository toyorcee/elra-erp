import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiXCircle } from "react-icons/hi";
import { verifySubscriptionPayment } from "../../services/subscriptions.js";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Verifying your payment...");
  const [paymentProvider, setPaymentProvider] = useState("paystack");

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
      urlParams: ["reference", "trxref"],
    },
    stripe: {
      name: "Stripe",
      icon: "💳",
      colors: "from-purple-500 to-purple-600",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-400",
      description: "Secure payment with credit/debit cards",
      urlParams: ["payment_intent", "payment_intent_client_secret"],
    },
    paypal: {
      name: "PayPal",
      icon: "🔵",
      colors: "from-blue-500 to-blue-600",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
      description: "Pay with your PayPal account",
      urlParams: ["token", "PayerID"],
    },
  };

  // Detect payment provider from URL parameters
  const detectPaymentProvider = () => {
    for (const [provider, config] of Object.entries(paymentProviders)) {
      for (const param of config.urlParams) {
        if (searchParams.get(param)) {
          return provider;
        }
      }
    }
    // Fallback: try to get from localStorage if available
    const storedProvider = localStorage.getItem("selectedPaymentProvider");
    if (storedProvider && paymentProviders[storedProvider]) {
      return storedProvider;
    }
    return "paystack"; // Default fallback
  };

  // Get payment reference based on provider
  const getPaymentReference = (provider) => {
    const config = paymentProviders[provider];
    for (const param of config.urlParams) {
      const value = searchParams.get(param);
      if (value) return value;
    }
    return null;
  };

  useEffect(() => {
    const detectedProvider = detectPaymentProvider();
    setPaymentProvider(detectedProvider);

    const verifyPayment = async () => {
      try {
        const paymentRef = getPaymentReference(detectedProvider);

        if (!paymentRef) {
          setStatus("error");
          setMessage("No payment reference found. Please contact support.");
          return;
        }

        const response = await verifySubscriptionPayment({
          reference: paymentRef,
          paymentProvider: detectedProvider,
        });

        if (response.success) {
          setStatus("success");
          setMessage(
            `Payment successful! Your subscription has been activated via ${paymentProviders[detectedProvider].name}.`
          );

          // Clear stored payment provider
          localStorage.removeItem("selectedPaymentProvider");

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(response.message || "Payment verification failed.");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please contact support.");
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    const provider = paymentProviders[paymentProvider];

    switch (status) {
      case "success":
        return (
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-r ${provider.colors} flex items-center justify-center text-white text-2xl font-bold`}
          >
            {provider.icon}
          </div>
        );
      case "error":
        return <HiXCircle className="w-16 h-16 text-red-400" />;
      default:
        return (
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-r ${provider.colors} flex items-center justify-center text-white text-2xl font-bold animate-pulse`}
          >
            {provider.icon}
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return paymentProviders[paymentProvider].textColor;
      case "error":
        return "text-red-400";
      default:
        return paymentProviders[paymentProvider].textColor;
    }
  };

  const currentProvider = paymentProviders[paymentProvider];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md w-full text-center"
      >
        <div className="flex flex-col items-center space-y-6">
          {/* Payment Provider Badge */}
          <div
            className={`px-4 py-2 rounded-full bg-gradient-to-r ${currentProvider.colors} text-white text-sm font-semibold`}
          >
            {currentProvider.name}
          </div>

          {getStatusIcon()}

          <div>
            <h1 className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
              {status === "success" && "Payment Successful!"}
              {status === "error" && "Payment Failed"}
              {status === "processing" && "Processing Payment"}
            </h1>
            <p className="text-white/80 leading-relaxed">{message}</p>
          </div>

          {status === "success" && (
            <div
              className={`${currentProvider.bgColor} border ${currentProvider.borderColor} rounded-xl p-4 w-full`}
            >
              <p className={`${currentProvider.textColor} text-sm`}>
                You will be redirected to the login page shortly. Check your
                email for login credentials.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 w-full">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm">
                  If you believe this is an error, please contact our support
                  team.
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-300"
              >
                Return to Home
              </button>
            </div>
          )}

          {status === "processing" && (
            <div className="w-full">
              <div
                className={`${currentProvider.bgColor} border ${currentProvider.borderColor} rounded-xl p-4`}
              >
                <p className={`${currentProvider.textColor} text-sm`}>
                  Please wait while we verify your payment with{" "}
                  {currentProvider.name}. This may take a few moments.
                </p>
              </div>
            </div>
          )}

          {/* Payment Provider Info */}
          <div className="text-white/60 text-xs">
            Powered by {currentProvider.name} • {currentProvider.description}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
