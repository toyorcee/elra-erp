import React from "react";

const BaseSkeleton = ({
  className = "",
  width = "w-full",
  height = "h-4",
  rounded = "rounded",
  animate = true,
  animationType = "shimmer", 
}) => {
  const getAnimationClass = () => {
    if (!animate) return "";

    switch (animationType) {
      case "shimmer":
        return "animate-shimmer";
      case "pulse-shimmer":
        return "animate-pulse-shimmer";
      case "wave":
        return "animate-wave";
      case "modern":
        return "skeleton-modern";
      case "glass":
        return "skeleton-glass";
      case "gradient":
        return "skeleton-gradient";
      default:
        return "animate-shimmer";
    }
  };

  return (
    <div
      className={`
        bg-gray-200 
        ${width} 
        ${height} 
        ${rounded}
        ${getAnimationClass()}
        ${className}
      `}
    />
  );
};

export default BaseSkeleton;
