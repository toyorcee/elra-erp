import React, { useState, useEffect } from "react";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../../../services/admin/systemSettings";
import { toast } from "react-toastify";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await getSystemSettings();
      setSettings(response.data.settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch system settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSettings = async () => {
    try {
      setSaving(true);
      // This will create default settings
      const response = await getSystemSettings();
      setSettings(response.data.settings);
      toast.success("Settings initialized successfully");
    } catch (error) {
      console.error("Error initializing settings:", error);
      toast.error("Failed to initialize settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
          Settings
        </h1>
        <SkeletonLoader className="h-32" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="w-full max-w-2xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
          Settings
        </h1>
        <EmptyState
          title="No Settings Found"
          description="System settings have not been configured yet."
          icon="settings"
          actionText={saving ? "Initializing..." : "Initialize Settings"}
          onAction={handleInitializeSettings}
          disabled={saving}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
        Settings
      </h1>
      <div className="bg-white/80 rounded-xl shadow p-6">
        <div className="text-center text-blue-700">
          <p className="text-lg font-semibold mb-2">System Settings Loaded</p>
          <p className="text-sm text-gray-600">
            Settings are now available. You can configure them here.
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
            <h3 className="font-semibold mb-2">Current Settings:</h3>
            <ul className="text-sm space-y-1">
              <li>
                • Company: {settings?.systemInfo?.companyName || "Not set"}
              </li>
              <li>
                • Registration:{" "}
                {settings?.registration?.allowPublicRegistration
                  ? "Public"
                  : "Private"}
              </li>
              <li>
                • Department Selection:{" "}
                {settings?.registration?.requireDepartmentSelection
                  ? "Required"
                  : "Optional"}
              </li>
              <li>
                • Default Department:{" "}
                {settings?.registration?.defaultDepartment || "External"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
