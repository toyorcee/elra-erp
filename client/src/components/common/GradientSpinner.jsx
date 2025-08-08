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
    primary: "from-purple-500 via-purple-600 to-teal-500",
    secondary: "from-teal-500 via-teal-600 to-purple-500",
    success: "from-green-500 via-emerald-500 to-teal-600",
    warning: "from-yellow-500 via-orange-500 to-red-600",
    error: "from-red-500 via-pink-500 to-rose-600",
    purple: "from-purple-400 via-purple-500 to-purple-600",
    teal: "from-teal-400 via-teal-500 to-teal-600",
    light: "from-white via-gray-100 to-gray-200",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const isLight = variant === "light";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer rotating ring with gradient */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r ${variantClasses[variant]} animate-spin`}
          style={{
            background: `conic-gradient(from 0deg, transparent, ${getGradientColors(
              variant
            )}, transparent)`,
            mask: "radial-gradient(circle at center, transparent 70%, black 71%)",
            WebkitMask:
              "radial-gradient(circle at center, transparent 70%, black 71%)",
          }}
        ></div>

        {/* Inner pulsing ring */}
        <div
          className={`absolute inset-1 rounded-full border border-transparent bg-gradient-to-r ${variantClasses[variant]} opacity-30 animate-pulse`}
          style={{
            background: `conic-gradient(from 180deg, transparent, ${getGradientColors(
              variant
            )}, transparent)`,
            mask: "radial-gradient(circle at center, transparent 60%, black 61%)",
            WebkitMask:
              "radial-gradient(circle at center, transparent 60%, black 61%)",
          }}
        ></div>

        {/* Center circle with subtle gradient */}
        <div
          className={`absolute inset-2 rounded-full bg-gradient-to-br ${
            isLight
              ? "from-white/20 to-white/10 border border-white/30"
              : "from-white/10 to-transparent border border-white/20"
          } shadow-sm backdrop-blur-sm`}
        ></div>

        {/* Animated center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-1 h-1 rounded-full bg-gradient-to-r ${variantClasses[variant]} animate-pulse`}
            style={{
              animationDuration: "1.5s",
              animationTimingFunction: "ease-in-out",
            }}
          ></div>
        </div>

        {/* Outer glow effect */}
        <div
          className={`absolute -inset-1 rounded-full bg-gradient-to-r ${variantClasses[variant]} opacity-20 blur-md animate-pulse`}
          style={{
            animationDuration: "2s",
            animationTimingFunction: "ease-in-out",
          }}
        ></div>

        {/* Additional sparkle effect */}
        <div className="absolute inset-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-0.5 h-0.5 rounded-full bg-gradient-to-r ${variantClasses[variant]} animate-ping`}
              style={{
                left: `${25 + i * 25}%`,
                top: `${25 + i * 25}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: "1.5s",
              }}
            ></div>
          ))}
        </div>
      </div>

      {showText && text && (
        <div className="text-center">
          <p
            className={`${textSizeClasses[size]} ${
              isLight ? "text-gray-800" : "text-white"
            } font-medium tracking-wide`}
          >
            {text}
          </p>
          {/* Animated dots for loading effect */}
          <div className="flex justify-center gap-1 mt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full bg-gradient-to-r ${variantClasses[variant]} animate-bounce`}
                style={{
                  animationDelay: `${i * 150}ms`,
                  animationDuration: "1s",
                }}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get gradient colors for conic gradient
const getGradientColors = (variant) => {
  const colors = {
    primary: "#8b5cf6, #7c3aed, #14b8a6",
    secondary: "#14b8a6, #0d9488, #8b5cf6",
    success: "#10b981, #059669, #14b8a6",
    warning: "#f59e0b, #d97706, #ef4444",
    error: "#ef4444, #dc2626, #f43f5e",
    purple: "#a78bfa, #8b5cf6, #7c3aed",
    teal: "#5eead4, #14b8a6, #0d9488",
    light: "#ffffff, #f3f4f6, #e5e7eb",
  };
  return colors[variant] || colors.primary;
};

export default GradientSpinner;
