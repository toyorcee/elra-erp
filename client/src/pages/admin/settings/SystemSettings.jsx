import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../../../services/admin/systemSettings";
import { useAuth } from "../../../context/AuthContext";

const SystemSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await getSystemSettings();
      const fetchedSettings = response.data.settings;
      setSettings(fetchedSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(fetchedSettings))); // Deep copy
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to fetch system settings");
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate delta between current and original settings
  const calculateDelta = () => {
    if (!settings || !originalSettings) return {};

    const delta = {};

    // Compare registration settings
    if (
      JSON.stringify(settings.registration) !==
      JSON.stringify(originalSettings.registration)
    ) {
      delta.registration = settings.registration;
    }

    // Compare department settings
    if (
      JSON.stringify(settings.departments) !==
      JSON.stringify(originalSettings.departments)
    ) {
      delta.departments = settings.departments;
    }

    // Compare system info settings
    if (
      JSON.stringify(settings.systemInfo) !==
      JSON.stringify(originalSettings.systemInfo)
    ) {
      delta.systemInfo = settings.systemInfo;
    }

    return delta;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const delta = calculateDelta();

    if (Object.keys(delta).length === 0) {
      toast.info("No changes to save");
      return;
    }

    console.log("💾 SAVE BUTTON CLICKED!");
    console.log("📝 Delta to save:", delta);
    console.log("👤 User:", user?.username, "(", user?.email, ")");
    console.log("⏰ Timestamp:", new Date().toISOString());

    try {
      setSaving(true);
      console.log("🚀 Calling updateSystemSettings service with delta...");
      await updateSystemSettings(delta);
      console.log("✅ Settings saved successfully!");

      // Update original settings to current state
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);

      toast.success("System settings updated successfully");
    } catch (error) {
      console.error("❌ Error saving settings:", error);
      toast.error("Failed to update system settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUpdate = async (section, field, value) => {
    console.log(`🎯 TOGGLE UPDATE: ${section}.${field} = ${value}`);
    console.log("👤 User:", user?.username, "(", user?.email, ")");
    console.log("⏰ Timestamp:", new Date().toISOString());

    const delta = {
      [section]: {
        ...settings[section],
        [field]: value,
      },
    };

    console.log("📝 Delta being sent:", delta);

    try {
      console.log("🚀 Making immediate API call for toggle update...");
      await updateSystemSettings(delta);
      console.log("✅ Toggle update saved successfully!");

      // Update local state after successful API call
      setSettings((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));

      // Update original settings
      setOriginalSettings((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
      setHasChanges(false);

      toast.success(`${section}.${field} updated successfully`);
    } catch (error) {
      console.error("❌ Error updating toggle:", error);
      toast.error(`Failed to update ${section}.${field}`);

      // Don't update local state on error - keep the original value
    }
  };

  // Regular change handler for non-toggle fields
  const handleChange = (section, field, value) => {
    console.log(`📝 FIELD CHANGE: ${section}.${field} = ${value}`);

    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">
          Configure system-wide settings and registration behavior
        </p>
        {hasChanges && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ You have unsaved changes. Click "Save Settings" to apply all
              changes at once.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Registration Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Registration Settings
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Public Registration
                </label>
                <p className="text-sm text-gray-500">
                  Allow new users to register publicly
                </p>
              </div>
              <input
                type="checkbox"
                checked={
                  settings?.registration?.allowPublicRegistration || false
                }
                onChange={(e) =>
                  handleToggleUpdate(
                    "registration",
                    "allowPublicRegistration",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Require Department Selection
                </label>
                <p className="text-sm text-gray-500">
                  Show department dropdown in registration form
                </p>
              </div>
              <input
                type="checkbox"
                checked={
                  settings?.registration?.requireDepartmentSelection || false
                }
                onChange={(e) =>
                  handleToggleUpdate(
                    "registration",
                    "requireDepartmentSelection",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Department
              </label>
              <input
                type="text"
                value={settings?.registration?.defaultDepartment || "External"}
                onChange={(e) =>
                  handleChange(
                    "registration",
                    "defaultDepartment",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="External"
              />
              <p className="text-sm text-gray-500 mt-1">
                Department assigned when no selection is made
              </p>
            </div>
          </div>
        </div>

        {/* Department Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Department Settings
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow External Department
                </label>
                <p className="text-sm text-gray-500">
                  Allow users to be assigned to External department
                </p>
              </div>
              <input
                type="checkbox"
                checked={
                  settings?.departments?.allowExternalDepartment || false
                }
                onChange={(e) =>
                  handleToggleUpdate(
                    "departments",
                    "allowExternalDepartment",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Auto Create External
                </label>
                <p className="text-sm text-gray-500">
                  Automatically create External department if it doesn't exist
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings?.departments?.autoCreateExternal || false}
                onChange={(e) =>
                  handleToggleUpdate(
                    "departments",
                    "autoCreateExternal",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            System Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings?.systemInfo?.companyName || ""}
                onChange={(e) =>
                  handleChange("systemInfo", "companyName", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Name
              </label>
              <input
                type="text"
                value={settings?.systemInfo?.systemName || ""}
                onChange={(e) =>
                  handleChange("systemInfo", "systemName", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Electronic Document Management System"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Saving..."
              : hasChanges
              ? "Save All Changes"
              : "No Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;
