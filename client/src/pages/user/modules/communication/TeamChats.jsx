import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { motion } from "framer-motion";
import {
  UsersIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const TeamChats = () => {
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
              You need Staff level (300) or higher to access team chats.
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
                Team Chats
              </h1>
              <p className="text-gray-600">
                Collaborate in team chat rooms with your department and project
                teams.
              </p>
            </div>
            <button className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary)]/90 transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Team Chat
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Chats List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Team Chats
                </h2>

                <div className="space-y-3">
                  {/* Department Chat */}
                  <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <UsersIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {user.department?.name || "Department"} Chat
                      </h3>
                      <p className="text-sm text-gray-500">
                        Department-wide communication
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>

                  {/* Project Chats */}
                  <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        Project Alpha Team
                      </h3>
                      <p className="text-sm text-gray-500">
                        Project collaboration
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>

                  {/* Empty State */}
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      No other team chats yet
                    </p>
                    <p className="text-gray-400 text-xs">
                      Create or join team chats to collaborate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-96">
              <div className="p-6">
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Select a Team Chat
                  </h2>
                  <p className="text-gray-600">
                    Choose a team chat from the sidebar to start collaborating
                    with your team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <UsersIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Team Chats Coming Soon
                </h3>
                <p className="text-sm text-yellow-600">
                  Full team chat functionality will be available in the next
                  update. For now, use the message dropdown for direct
                  messaging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChats;
