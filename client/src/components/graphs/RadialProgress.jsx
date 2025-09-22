import React from "react";

const RadialProgress = ({
  label,
  percentage = 0,
  size = 120,
  strokeWidth = 12,
  trackColor = "#E5E7EB", 
  progressColor = "#0d6449", 
  textColor = "#111827", 
}) => {
  const normalized = Math.max(0, Math.min(100, Number(percentage) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (normalized / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size * 0.18}
          fontWeight="700"
          fill={textColor}
        >
          {Math.round(normalized)}%
        </text>
      </svg>
      {label ? (
        <div className="mt-2 text-sm text-gray-600 text-center max-w-[12rem]">
          {label}
        </div>
      ) : null}
    </div>
  );
};

export default RadialProgress;
