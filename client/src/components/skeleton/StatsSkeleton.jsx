import React from "react";
import BaseSkeleton from "./BaseSkeleton";

const StatsSkeleton = ({ items = 4, className = "" }) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${items} gap-6 ${className}`}
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <BaseSkeleton width="w-20" height="h-4" className="mb-2" />
              <BaseSkeleton width="w-16" height="h-8" />
            </div>
            <BaseSkeleton width="w-12" height="h-12" rounded="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsSkeleton;
