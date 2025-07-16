import React from "react";

const DocumentIcon = ({
  size = "md",
  variant = "primary",
  className = "",
  showText = false,
}) => {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const variantClasses = {
    primary: "text-blue-600",
    secondary: "text-green-600",
    light: "text-white",
    dark: "text-gray-800",
    gradient:
      "text-transparent bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        className={`${sizeClasses[size]} ${variantClasses[variant]}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {showText && <span className="ml-2 font-bold text-lg">EDMS</span>}
    </div>
  );
};

export default DocumentIcon;
