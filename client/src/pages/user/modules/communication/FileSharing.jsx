import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { motion } from "framer-motion";
import {
  DocumentIcon,
  CloudArrowUpIcon,
  FolderIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const FileSharing = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user || user.role.level < 300) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h1>
            <p className="text-red-600">
              You need Staff level (300) or higher to access file sharing.
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
                File Sharing
              </h1>
              <p className="text-gray-600">
                Share files and documents with your colleagues through the
                messaging system.
              </p>
            </div>
            <button className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors flex items-center">
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload File
            </button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                />
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent">
                <option>All Files</option>
                <option>Documents</option>
                <option>Images</option>
                <option>Videos</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* File Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <DocumentIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Documents
                </h3>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <FolderIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Images</h3>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <CloudArrowUpIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Videos</h3>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <DocumentIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Other</h3>
                <p className="text-2xl font-bold text-orange-600">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Shared Files
            </h2>

            <div className="text-center py-12">
              <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Files Shared Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Files shared through the messaging system will appear here.
                Start sharing files by attaching them to your messages.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h4 className="text-lg font-semibold text-green-900 mb-3">
                  How to Share Files:
                </h4>
                <ul className="text-left text-green-800 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Use the message dropdown in the top navigation
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Attach files when composing messages
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Files will automatically appear in this section
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Organize and search through shared files
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSharing;
