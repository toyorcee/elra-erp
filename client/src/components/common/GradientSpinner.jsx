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
    primary: "from-green-600 to-blue-500",
    secondary: "from-blue-600 to-cyan-500",
    success: "from-green-500 to-emerald-500",
    warning: "from-yellow-500 to-orange-500",
    error: "from-red-500 to-pink-500",
    purple: "from-purple-500 to-pink-500",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-gray-200`}
        ></div>

        {/* Animated gradient ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r ${variantClasses[variant]} animate-spin`}
          style={{
            background: `conic-gradient(from 0deg, transparent, ${getGradientColors(
              variant
            )}, transparent)`,
            mask: "radial-gradient(circle at center, transparent 55%, black 56%)",
            WebkitMask:
              "radial-gradient(circle at center, transparent 55%, black 56%)",
          }}
        ></div>

        {/* Inner circle */}
        <div className="absolute inset-1 rounded-full bg-white"></div>

        {/* Center dot */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div
            className={`w-1 h-1 rounded-full bg-gradient-to-r ${variantClasses[variant]}`}
          ></div>
        </div>
      </div>

      {showText && text && (
        <p className="mt-3 text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
};

// Helper function to get gradient colors for conic gradient
const getGradientColors = (variant) => {
  const colors = {
    primary: "#10b981, #3b82f6",
    secondary: "#2563eb, #06b6d4",
    success: "#10b981, #059669",
    warning: "#f59e0b, #ea580c",
    error: "#ef4444, #ec4899",
    purple: "#8b5cf6, #ec4899",
  };
  return colors[variant] || colors.primary;
};

export default GradientSpinner;
