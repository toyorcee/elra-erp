import React from "react";
import CardSkeleton from "./CardSkeleton";

const GridSkeleton = ({
  items = 6,
  columns = 3,
  cardProps = {},
  className = "",
}) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6 ${className}`}
    >
      {Array.from({ length: items }).map((_, index) => (
        <CardSkeleton key={index} {...cardProps} />
      ))}
    </div>
  );
};

export default GridSkeleton;
