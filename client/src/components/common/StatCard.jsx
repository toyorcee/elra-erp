import React from "react";
import * as HiIcons from "react-icons/hi";

export default function StatCard({
  title,
  value,
  icon,
  variant = "primary",
  trend,
  trendValue,
  loading = false,
  className = "",
}) {
  const variants = {
    primary: {
      gradient: "from-blue-500 via-cyan-500 to-purple-500",
      bg: "bg-emerald-50",
      text: "text-blue-600",
      shadow: "shadow-blue-100",
    },
    secondary: {
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      bg: "bg-green-50",
      text: "text-green-600",
      shadow: "shadow-green-100",
    },
    success: {
      gradient: "from-emerald-500 via-green-500 to-lime-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      shadow: "shadow-emerald-100",
    },
    warning: {
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      bg: "bg-orange-50",
      text: "text-orange-600",
      shadow: "shadow-orange-100",
    },
    danger: {
      gradient: "from-red-500 via-pink-500 to-rose-500",
      bg: "bg-red-50",
      text: "text-red-600",
      shadow: "shadow-red-100",
    },
    info: {
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      shadow: "shadow-cyan-100",
    },
    purple: {
      gradient: "from-purple-500 via-violet-500 to-indigo-500",
      bg: "bg-purple-50",
      text: "text-purple-600",
      shadow: "shadow-purple-100",
    },
  };

  const currentVariant = variants[variant] || variants.primary;
  const Icon = HiIcons[icon] || HiIcons.HiOutlineChartBar;

  if (loading) {
    return (
      <div
        className={`${currentVariant.bg} rounded-2xl p-6 border border-gray-200 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentVariant.gradient} animate-pulse`}
          ></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div
      className={`${currentVariant.bg} rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 group ${className}`}
    >
      {/* Icon with animated gradient background */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl bg-gradient-to-r ${currentVariant.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 relative overflow-hidden`}
        >
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Icon className="w-6 h-6 text-white relative z-10" />
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? (
              <HiIcons.HiOutlineTrendingUp className="w-4 h-4" />
            ) : (
              <HiIcons.HiOutlineTrendingDown className="w-4 h-4" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <h3 className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
      </div>

      {/* Title */}
      <p
        className={`text-sm font-medium ${
          currentVariant.text
        } group-hover:${currentVariant.text.replace(
          "600",
          "700"
        )} transition-colors duration-300`}
      >
        {title}
      </p>

      {/* Animated border on hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-current group-hover:border-opacity-20 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
}

// Enhanced StatCard with more features
export const AnimatedStatCard = ({
  title,
  value,
  icon,
  variant = "primary",
  trend,
  trendValue,
  loading = false,
  className = "",
  animation = "fade",
  size = "default",
}) => {
  const sizeClasses = {
    small: "p-4",
    default: "p-6",
    large: "p-8",
  };

  const animationClasses = {
    fade: "animate-fade-in",
    slide: "animate-slide-in",
    bounce: "animate-bounce-in",
    none: "",
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} ${animationClasses[animation]} ${className}`}
    >
      <StatCard
        title={title}
        value={value}
        icon={icon}
        variant={variant}
        trend={trend}
        trendValue={trendValue}
        loading={loading}
        className="w-full"
      />
    </div>
  );
};

// Stat Card Grid for easy layout
export const StatCardGrid = ({
  children,
  cols = 4,
  gap = 6,
  className = "",
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};
