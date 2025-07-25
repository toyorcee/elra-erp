import React from "react";

const GradientSpinner = ({
  size = "md",
  className = "",
  variant = "primary",
  text = "",
  showText = false,
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const variantClasses = {
    primary: "from-green-400 via-blue-500 to-purple-600",
    secondary: "from-blue-400 via-cyan-500 to-teal-600",
    success: "from-green-400 via-emerald-500 to-teal-600",
    warning: "from-yellow-400 via-orange-500 to-red-600",
    error: "from-red-400 via-pink-500 to-rose-600",
    purple: "from-purple-400 via-pink-500 to-rose-600",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Main spinning ring */}
        <div
          className={`absolute inset-0 rounded-full border-3 border-transparent bg-gradient-to-r ${variantClasses[variant]} animate-spin`}
          style={{
            background: `conic-gradient(from 0deg, transparent, ${getGradientColors(
              variant
            )}, transparent)`,
            mask: "radial-gradient(circle at center, transparent 60%, black 61%)",
            WebkitMask:
              "radial-gradient(circle at center, transparent 60%, black 61%)",
          }}
        ></div>

        {/* Inner glow effect */}
        <div
          className={`absolute inset-1 rounded-full bg-gradient-to-r ${variantClasses[variant]} opacity-20 blur-sm`}
        ></div>

        {/* Inner circle with subtle border */}
        <div className="absolute inset-2 rounded-full bg-white border border-gray-100 shadow-sm"></div>

        {/* Pulsing center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${variantClasses[variant]} animate-pulse`}
          ></div>
        </div>

        {/* Outer glow for extra beauty */}
        <div
          className={`absolute -inset-1 rounded-full bg-gradient-to-r ${variantClasses[variant]} opacity-30 blur-md animate-pulse`}
        ></div>
      </div>

      {showText && text && (
        <div className="text-center">
          <p
            className={`${textSizeClasses[size]} text-white font-medium tracking-wide`}
          >
            {text}
          </p>
          {/* Animated dots for loading effect */}
          <div className="flex justify-center gap-1 mt-1">
            <div
              className="w-1 h-1 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-1 h-1 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-1 h-1 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get gradient colors for conic gradient
const getGradientColors = (variant) => {
  const colors = {
    primary: "#34d399, #3b82f6, #8b5cf6",
    secondary: "#60a5fa, #06b6d4, #14b8a6",
    success: "#34d399, #10b981, #14b8a6",
    warning: "#fbbf24, #f59e0b, #ef4444",
    error: "#f87171, #ec4899, #f43f5e",
    purple: "#a78bfa, #ec4899, #f43f5e",
  };
  return colors[variant] || colors.primary;
};

export default GradientSpinner;
