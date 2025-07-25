import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  MdNotifications,
  MdNotificationsOff,
  MdEmail,
  MdEmailOff,
  MdPhone,
  MdPhoneOff,
  MdSchedule,
  MdScheduleOff,
  MdSave,
  MdRefresh,
} from "react-icons/md";
import notificationService from "../services/notifications";

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user preferences
  const {
    data: preferencesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: notificationService.getPreferences,
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: notificationService.updatePreferences,
    onSuccess: () => {
      toast.success("Notification preferences updated successfully");
      queryClient.invalidateQueries(["notificationPreferences"]);
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update preferences");
    },
  });

  // Test notification mutation
  const testMutation = useMutation({
    mutationFn: ({ type, priority }) => notificationService.testNotification(type, priority),
    onSuccess: () => {
      toast.success("Test notification sent successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send test notification");
    },
  });

  useEffect(() => {
    if (preferencesData?.data) {
      setPreferences(preferencesData.data);
    }
  }, [preferencesData]);

  const handleToggle = (section, field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleTypeToggle = (section, type, value) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        types: {
          ...prev[section].types,
          [type]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handlePriorityToggle = (priority, value) => {
    setPreferences((prev) => ({
      ...prev,
      priorityLevels: {
        ...prev.priorityLevels,
        [priority]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (preferences) {
      updateMutation.mutate(preferences);
    }
  };

  const handleReset = () => {
    if (preferencesData?.data) {
      setPreferences(preferencesData.data);
      setHasChanges(false);
    }
  };

  const handleTestNotification = (type, priority) => {
    testMutation.mutate({ type, priority });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Failed to load notification preferences
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  const notificationTypes = [
    { key: "DOCUMENT_APPROVAL", label: "Document Approval", description: "When documents need your approval" },
    { key: "DOCUMENT_REJECTED", label: "Document Rejected", description: "When your documents are rejected" },
    { key: "DOCUMENT_SUBMITTED", label: "Document Submitted", description: "When documents are submitted for approval" },
    { key: "APPROVAL_OVERDUE", label: "Approval Overdue", description: "When approvals are overdue" },
    { key: "DOCUMENT_SHARED", label: "Document Shared", description: "When documents are shared with you" },
    { key: "SYSTEM_ALERT", label: "System Alerts", description: "Important system notifications" },
    { key: "WORKFLOW_UPDATE", label: "Workflow Updates", description: "Updates to document workflows" },
  ];

  const priorityLevels = [
    { key: "urgent", label: "Urgent", color: "text-red-600" },
    { key: "high", label: "High", color: "text-orange-600" },
    { key: "medium", label: "Medium", color: "text-yellow-600" },
    { key: "low", label: "Low", color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-sm text-gray-600">
            Customize how and when you receive notifications
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdRefresh className="mr-1" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdSave className="mr-2" />
            {updateMutation.isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {preferences.inApp.enabled ? (
              <MdNotifications className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <MdNotificationsOff className="w-5 h-5 text-gray-400 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900">In-App Notifications</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.inApp.enabled}
              onChange={(e) => handleToggle("inApp", "enabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {preferences.inApp.enabled && (
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.inApp.types[type.key]}
                    onChange={(e) => handleTypeToggle("inApp", type.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {preferences.email.enabled ? (
              <MdEmail className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <MdEmailOff className="w-5 h-5 text-gray-400 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email.enabled}
              onChange={(e) => handleToggle("email", "enabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {preferences.email.enabled && (
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email.types[type.key]}
                    onChange={(e) => handleTypeToggle("email", type.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority Levels */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Priority Levels</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {priorityLevels.map((priority) => (
            <div key={priority.key} className="flex items-center justify-between">
              <span className={`text-sm font-medium ${priority.color}`}>
                {priority.label}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.priorityLevels[priority.key]}
                  onChange={(e) => handlePriorityToggle(priority.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {preferences.quietHours.enabled ? (
              <MdSchedule className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <MdScheduleOff className="w-5 h-5 text-gray-400 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900">Quiet Hours</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.quietHours.enabled}
              onChange={(e) => handleQuietHoursChange("enabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {preferences.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={preferences.quietHours.startTime}
                onChange={(e) => handleQuietHoursChange("startTime", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={preferences.quietHours.endTime}
                onChange={(e) => handleQuietHoursChange("endTime", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Test Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Notifications</h3>
        <div className="grid grid-cols-2 gap-4">
          {notificationTypes.slice(0, 4).map((type) => (
            <button
              key={type.key}
              onClick={() => handleTestNotification(type.key, "medium")}
              disabled={testMutation.isLoading}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Test {type.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences; 