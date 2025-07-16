import api from "../api.js";

// Get system settings
export const getSystemSettings = async () => {
  try {
    const response = await api.get("/system-settings");
    return response.data;
  } catch (error) {
    console.error("Error fetching system settings:", error);
    throw error;
  }
};

export const updateSystemSettings = async (settings) => {
  try {
    console.log("🔧 updateSystemSettings service called");
    console.log("📝 Settings to update:", settings);
    console.log("🌐 Making PUT request to /system-settings");

    const response = await api.put("/system-settings", settings);

    console.log("✅ API call successful");
    console.log("📊 Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ Error in updateSystemSettings service:", error);
    console.error("❌ Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config,
    });
    throw error;
  }
};

// Get registration settings (public)
export const getRegistrationSettings = async () => {
  try {
    const response = await api.get("/system-settings/registration");
    return response.data;
  } catch (error) {
    console.error("Error fetching registration settings:", error);
    throw error;
  }
};

// Get available departments for registration
export const getAvailableDepartments = async () => {
  try {
    const response = await api.get("/system-settings/departments");
    return response.data;
  } catch (error) {
    console.error("Error fetching available departments:", error);
    throw error;
  }
};

// Reset system settings to defaults
export const resetSystemSettings = async () => {
  try {
    const response = await api.post("/system-settings/reset");
    return response.data;
  } catch (error) {
    console.error("Error resetting system settings:", error);
    throw error;
  }
};
