import React from "react";
import { Outlet } from "react-router-dom";

const SelfServiceLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Self-Service</h1>
              <p className="text-gray-600 mt-1">
                Manage your personal information and access your data
              </p>
            </div>
            <div className="p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfServiceLayout;

