import React from "react";
import elraLogo from "../assets/elra-logo.png";

const ELRALogo = ({ variant = "dark", className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "h-8 w-12",
    md: "h-12 w-16",
    lg: "h-16 w-20",
    xl: "h-20 w-24",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div
        className={`relative ${sizeClasses[size]} flex items-center justify-center`}
      >
        <img
          src={elraLogo}
          alt="ELRA Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default ELRALogo;
