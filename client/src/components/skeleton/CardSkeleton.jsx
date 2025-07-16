import React from "react";
import BaseSkeleton from "./BaseSkeleton";

const CardSkeleton = ({
  showHeader = true,
  showContent = true,
  showFooter = false,
  lines = 2,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {showHeader && (
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <BaseSkeleton width="w-10" height="h-10" rounded="rounded-full" />
            <div className="flex-1">
              <BaseSkeleton width="w-3/4" height="h-4" className="mb-2" />
              <BaseSkeleton width="w-1/2" height="h-3" />
            </div>
          </div>
        </div>
      )}

      {showContent && (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <BaseSkeleton
              key={index}
              width={
                index === 0 ? "w-full" : index === lines - 1 ? "w-2/3" : "w-4/5"
              }
              height="h-3"
            />
          ))}
        </div>
      )}

      {showFooter && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <BaseSkeleton width="w-20" height="h-3" />
            <BaseSkeleton width="w-16" height="h-3" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSkeleton;
