import React from "react";

const ELRALogo = ({ variant = "dark", className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-16 w-16",
    xl: "h-20 w-20"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl", 
    xl: "text-3xl"
  };

  const isLight = variant === "light";
  const textColor = isLight ? "text-white" : "text-gray-900";
  const accentColor = isLight ? "text-purple-300" : "text-purple-600";
  const bgColor = isLight ? "bg-white/10" : "bg-purple-50";

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`relative ${sizeClasses[size]} ${bgColor} rounded-2xl flex items-center justify-center border-2 border-purple-200/20 shadow-lg`}>
        {/* Geometric Pattern */}
        <div className="relative w-full h-full">
          {/* Main Circle */}
          <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full opacity-80"></div>
          
          {/* Inner Pattern */}
          <div className="absolute inset-3 bg-white/20 rounded-full"></div>
          
          {/* Center Element */}
          <div className="absolute inset-4 bg-gradient-to-br from-purple-600 to-teal-600 rounded-full flex items-center justify-center">
            <div className="w-1/2 h-1/2 bg-white/30 rounded-full"></div>
          </div>
          
          {/* Corner Accents */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-teal-300 rounded-full"></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-purple-300 rounded-full"></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-purple-300 rounded-full"></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-teal-300 rounded-full"></div>
        </div>
      </div>

      {/* Text Logo */}
      <div className="flex flex-col">
        <div className={`font-bold ${textSizes[size]} ${textColor} tracking-tight`}>
          <span className="bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
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