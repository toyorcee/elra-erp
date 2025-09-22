import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { motion } from "framer-motion";
import {
  MegaphoneIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const Announcements = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user || user.role.level < 600) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h1>
            <p className="text-red-600">
              You need Manager level (600) or higher to access announcements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Announcements
              </h1>
              <p className="text-gray-600">
                Create and manage company-wide announcements and important
                updates.
              </p>
            </div>
            <button className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Announcement
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <MegaphoneIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Announcements
                </h3>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  This Month
                </h3>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <UserIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active</h3>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Announcements
            </h2>

            <div className="text-center py-12">
              <MegaphoneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Announcements Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first announcement to communicate important updates
                to your team.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3">
                  Announcement Features:
                </h4>
                <ul className="text-left text-yellow-800 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    Company-wide or department-specific announcements
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    Rich text formatting and media attachments
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    Scheduled announcements and expiration dates
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    Read receipts and engagement tracking
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    Priority levels and notification settings
                  </li>
                </ul>
              </div>

              <div className="mt-6">
                <button className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors flex items-center mx-auto">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Announcement
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <MegaphoneIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Announcement System Coming Soon
                </h3>
                <p className="text-sm text-blue-600">
                  Full announcement functionality will be available in the next
                  update. This will include rich text editing, scheduling, and
                  engagement tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
