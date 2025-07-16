import React from "react";
import BaseSkeleton from "./BaseSkeleton";

const TableSkeleton = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {showHeader && (
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-6 py-3 text-left">
                    <BaseSkeleton width="w-20" height="h-4" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {colIndex === 0 ? (
                      <div className="flex items-center space-x-3">
                        <BaseSkeleton
                          width="w-8"
                          height="h-8"
                          rounded="rounded-full"
                        />
                        <div>
                          <BaseSkeleton
                            width="w-24"
                            height="h-4"
                            className="mb-1"
                          />
                          <BaseSkeleton width="w-32" height="h-3" />
                        </div>
                      </div>
                    ) : colIndex === columns - 1 ? (
                      <div className="flex space-x-2">
                        <BaseSkeleton
                          width="w-6"
                          height="h-6"
                          rounded="rounded"
                        />
                        <BaseSkeleton
                          width="w-6"
                          height="h-6"
                          rounded="rounded"
                        />
                      </div>
                    ) : (
                      <BaseSkeleton
                        width={colIndex === 1 ? "w-16" : "w-20"}
                        height="h-4"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
