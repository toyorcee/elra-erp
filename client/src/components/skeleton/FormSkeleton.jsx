import React from "react";
import BaseSkeleton from "./BaseSkeleton";

const FormSkeleton = ({
  fields = 4,
  showTitle = true,
  showButtons = true,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {showTitle && (
        <div className="mb-6">
          <BaseSkeleton width="w-48" height="h-6" className="mb-2" />
          <BaseSkeleton width="w-64" height="h-4" />
        </div>
      )}

      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <BaseSkeleton width="w-24" height="h-4" className="mb-2" />
            <BaseSkeleton width="w-full" height="h-10" rounded="rounded-lg" />
          </div>
        ))}
      </div>

      {showButtons && (
        <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <BaseSkeleton width="w-20" height="h-10" rounded="rounded-lg" />
          <BaseSkeleton width="w-24" height="h-10" rounded="rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default FormSkeleton;
