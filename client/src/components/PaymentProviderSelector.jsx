import React from "react";
import { motion } from "framer-motion";

const PaymentProviderSelector = ({
  selectedCurrency,
  selectedPaymentProvider,
  onPaymentProviderChange,
}) => {
  // Payment provider options based on currency
  const getPaymentProviders = () => {
    if (selectedCurrency === "NGN") {
      return [
        {
          id: "paystack",
          name: "Paystack",
          description: "Secure payment for Nigerian customers",
          icon: "₦",
          colors: "from-green-500 to-green-600",
          borderColor: "border-green-500/30",
          bgColor: "bg-green-500/10",
        },
      ];
    } else {
      return [
        {
          id: "stripe",
          name: "Stripe",
          description: "Secure payment with credit/debit cards",
          icon: "💳",
          colors: "from-purple-500 to-purple-600",
          borderColor: "border-purple-500/30",
          bgColor: "bg-purple-500/10",
        },
        {
          id: "paypal",
          name: "PayPal",
          description: "Pay with your PayPal account",
          icon: "🔵",
          colors: "from-blue-500 to-blue-600",
          borderColor: "border-blue-500/30",
          bgColor: "bg-blue-500/10",
        },
      ];
    }
  };

  const paymentProviders = getPaymentProviders().filter(
    (provider) => provider && provider.id
  );

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
    >
      <h4 className="text-white font-semibold mb-3 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        Payment Method
      </h4>

      <div className="space-y-3">
        {paymentProviders.length > 0 &&
          paymentProviders.map((provider) => (
            <motion.label
              key={provider.id || `provider-${provider.name}`}
              className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedPaymentProvider === provider.id
                  ? `${provider.borderColor} ${provider.bgColor}`
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="radio"
                name="paymentProvider"
                value={provider.id}
                checked={selectedPaymentProvider === provider.id}
                onChange={(e) => onPaymentProviderChange(e.target.value)}
                className="sr-only"
              />
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-r ${provider.colors} flex items-center justify-center text-white mr-3 text-lg font-bold`}
              >
                {provider.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{provider.name}</div>
                <div className="text-sm text-white/60">
                  {provider.description}
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedPaymentProvider === provider.id
                    ? "border-white bg-white"
                    : "border-white/30"
                }`}
              >
                {selectedPaymentProvider === provider.id && (
                  <div className="w-2 h-2 bg-gray-800 rounded-full mx-auto mt-0.5" />
                )}
              </div>
            </motion.label>
          ))}
      </div>

      <p className="text-white/60 text-sm mt-3">
        {selectedCurrency === "NGN"
          ? "Paystack is the recommended payment method for Nigerian customers."
          : "Choose your preferred payment method for USD transactions."}
      </p>
    </motion.div>
  );
};

export default PaymentProviderSelector;
