import React from "react";
import {
  BaseSkeleton,
  CardSkeleton,
  TableSkeleton,
  GridSkeleton,
  StatsSkeleton,
  FormSkeleton,
} from "./skeleton";

const SkeletonLoader = ({
  className = "",
  children,
  type = "base",
  ...props
}) => {
  switch (type) {
    case "card":
      return <CardSkeleton className={className} {...props} />;
    case "table":
      return <TableSkeleton className={className} {...props} />;
    case "grid":
      return <GridSkeleton className={className} {...props} />;
    case "stats":
      return <StatsSkeleton className={className} {...props} />;
    case "form":
      return <FormSkeleton className={className} {...props} />;
    default:
      return (
        <div
          className={`animate-pulse bg-gradient-to-r from-blue-100/60 via-cyan-100/60 to-white/60 rounded-xl shadow ${className}`}
        >
          {children}
        </div>
      );
  }
};

// Export all skeleton components for direct use
SkeletonLoader.Base = BaseSkeleton;
SkeletonLoader.Card = CardSkeleton;
SkeletonLoader.Table = TableSkeleton;
SkeletonLoader.Grid = GridSkeleton;
SkeletonLoader.Stats = StatsSkeleton;
SkeletonLoader.Form = FormSkeleton;

export default SkeletonLoader;
