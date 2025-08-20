import React from "react";

const Skeleton = ({
  className = "",
  width = "w-full",
  height = "h-4",
  rounded = "rounded",
  animate = true,
}) => {
  return (
    <div
      className={`
        ${width} 
        ${height} 
        ${rounded} 
        bg-gray-200 
        ${animate ? "animate-pulse" : ""} 
        ${className}
      `}
    />
  );
};

export default Skeleton;
