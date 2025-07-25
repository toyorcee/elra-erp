import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiCheckCircle, HiXCircle, HiClock } from "react-icons/hi";
import { verifySubscriptionPayment } from "../../services/subscriptions.js";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get("reference");
        const trxref = searchParams.get("trxref");

        if (!reference && !trxref) {
          setStatus("error");
          setMessage("No payment reference found. Please contact support.");
          return;
        }

        const paymentRef = reference || trxref;

        const response = await verifySubscriptionPayment({
          reference: paymentRef,
          paymentProvider: "paystack",
        });

        if (response.success) {
          setStatus("success");
          setMessage(
            "Payment successful! Your subscription has been activated."
          );

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
    switch (status) {
      case "success":
        return <HiCheckCircle className="w-16 h-16 text-green-400" />;
      case "error":
        return <HiXCircle className="w-16 h-16 text-red-400" />;
      default:
        return <HiClock className="w-16 h-16 text-blue-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md w-full text-center"
      >
        <div className="flex flex-col items-center space-y-6">
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
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 w-full">
              <p className="text-green-400 text-sm">
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
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 text-sm">
                  Please wait while we verify your payment. This may take a few
                  moments.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
