import React from "react";

const ProcurementSkeleton = () => {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="grid grid-cols-5 gap-4 py-4 border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcurementSkeleton;
