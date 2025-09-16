import React from "react";

const AnimatedBubbles = ({
  isVisible = false,
  className = "",
  variant = "bubbles",
}) => {
  if (!isVisible) return null;

  if (variant === "spinner") {
    return (
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center ${className}`}
      >
        <div className="relative">
          {/* Main spinner */}
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

          {/* Inner pulse */}
          <div
            className="absolute inset-2 border-2 border-green-200 border-t-green-500 rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Default: Beautiful line of colored bubbles
  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center ${className}`}
    >
      <div className="flex items-center space-x-3">
        {/* Red Bubble */}
        <div
          className="w-4 h-4 bg-red-500 rounded-full shadow-lg animate-bounce"
          style={{
            animationDelay: "0s",
            animationDuration: "1.2s",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
          }}
        ></div>

        {/* Green Bubble */}
        <div
          className="w-4 h-4 bg-green-500 rounded-full shadow-lg animate-bounce"
          style={{
            animationDelay: "0.2s",
            animationDuration: "1.4s",
            boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
          }}
        ></div>

        {/* Blue Bubble */}
        <div
          className="w-4 h-4 bg-blue-500 rounded-full shadow-lg animate-bounce"
          style={{
            animationDelay: "0.4s",
            animationDuration: "1.6s",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
          }}
        ></div>

        {/* Yellow Bubble */}
        <div
          className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg animate-bounce"
          style={{
            animationDelay: "0.6s",
            animationDuration: "1.8s",
            boxShadow: "0 0 20px rgba(234, 179, 8, 0.5)",
          }}
        ></div>

        {/* Purple Bubble */}
        <div
          className="w-4 h-4 bg-purple-500 rounded-full shadow-lg animate-bounce"
          style={{
            animationDelay: "0.8s",
            animationDuration: "2s",
            boxShadow: "0 0 20px rgba(147, 51, 234, 0.5)",
          }}
        ></div>
      </div>
    </div>
  );
};

export default AnimatedBubbles;
