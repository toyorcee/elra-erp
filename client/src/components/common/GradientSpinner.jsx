import React from "react";
import elraImage from "../../assets/ELRA.png";

const GradientSpinner = ({
  size = "md",
  className = "",
  text = "",
  showText = false,
  title = "ELRA Enterprise Resource Planning System",
  variant = "default",
}) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-40 h-40",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const titleSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  // Ensure white background regardless of variant
  const containerClasses = `GradientSpinner flex flex-col items-center justify-center gap-4 bg-white ${className}`;

  return (
    <div
      className={containerClasses}
      style={{
        backgroundColor: "white !important",
        background: "white !important",
      }}
    >
      <div className="flex items-center justify-center">
        <img
          src={elraImage}
          alt="ELRA Loading"
          className={`${sizeClasses[size]} object-contain`}
          style={{
            animation: "scale 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {title && (
        <h2
          className={`font-bold text-[var(--elra-primary)] ${titleSizeClasses[size]}`}
        >
          {title}
        </h2>
      )}

      {showText && text && (
        <p
          className={`text-[var(--elra-text-secondary)] ${textSizeClasses[size]} text-center`}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default GradientSpinner;
