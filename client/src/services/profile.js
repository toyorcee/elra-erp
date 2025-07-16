import api from "./api.js";

// Get user profile
export const getProfile = async () => {
  try {
    const response = await api.get("/profile");
    return response.data;
  } catch (error) {
    console.error("Get profile error:", error);
    throw error;
  }
};

// Update user profile (text fields only)
export const updateProfile = async (profileData) => {
  try {
    console.log("🔄 Updating profile with data:", profileData);

    const response = await api.put("/profile", profileData);

    console.log("✅ Profile update response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Profile update error:", error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (file) => {
  try {
    console.log("📁 Uploading profile picture:", file.name, file.size, "bytes");

    const formData = new FormData();
    formData.append("profilePicture", file);

    const response = await api.put("/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Profile picture upload response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Profile picture upload error:", error);
    throw error;
  }
};

// Delete profile picture
export const deleteProfilePicture = async () => {
  try {
    console.log("🗑️ Deleting profile picture");

    const response = await api.delete("/profile/avatar");

    console.log("✅ Profile picture deletion response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Profile picture deletion error:", error);
    throw error;
  }
};
