import api from "../api.js";

// Get system settings
export const getSystemSettings = async () => {
  const response = await api.get("/system-settings");
  return response.data;
};

// Update system settings
export const updateSystemSettings = async (settingsData) => {
  const response = await api.put("/system-settings", settingsData);
  return response.data;
};

// Reset system settings to defaults
export const resetSystemSettings = async () => {
  const response = await api.post("/system-settings/reset");
  return response.data;
};

// Get registration settings (public)
export const getRegistrationSettings = async () => {
  const response = await api.get("/system-settings/registration");
  return response.data;
};

// Get available departments for registration (public)
export const getAvailableDepartments = async () => {
  const response = await api.get("/system-settings/departments");
  return response.data;
};
