import React from "react";
import elraLogo from "../assets/elraimage.jpg";

const ELRALogo = ({ variant = "dark", className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const isLight = variant === "light";
  const textColor = isLight ? "text-white" : "text-gray-900";
  const accentColor = isLight ? "text-emerald-300" : "text-emerald-600";

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div
        className={`relative ${sizeClasses[size]} rounded-2xl overflow-hidden shadow-lg`}
      >
        <img
          src={elraLogo}
          alt="ELRA Logo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Text Logo */}
      <div className="flex flex-col">
        <div
          className={`font-bold ${textSizes[size]} ${textColor} tracking-tight`}
        >
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            ELRA
          </span>
        </div>
        <div className={`text-xs ${accentColor} font-medium tracking-wider`}>
          ERP SYSTEM
        </div>
      </div>
    </div>
  );
};

export default ELRALogo;
