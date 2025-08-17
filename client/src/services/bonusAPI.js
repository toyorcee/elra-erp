import api from "./api";

// Get all bonuses
export const fetchBonuses = async () => {
  try {
    const response = await api.get("/bonuses");
    return response.data;
  } catch (error) {
    console.error("Error fetching bonuses:", error);
    throw error;
  }
};

// Get bonus categories
export const fetchBonusCategories = async () => {
  try {
    const response = await api.get("/bonuses/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching bonus categories:", error);
    throw error;
  }
};

// Get bonus types
export const fetchBonusTypes = async () => {
  try {
    const response = await api.get("/bonuses/types");
    return response.data;
  } catch (error) {
    console.error("Error fetching bonus types:", error);
    throw error;
  }
};

// Create new bonus
export const createBonus = async (bonusData) => {
  try {
    const response = await api.post("/bonuses", bonusData);
    return response.data;
  } catch (error) {
    console.error("Error creating bonus:", error);
    throw error;
  }
};

// Update bonus
export const updateBonus = async (id, bonusData) => {
  try {
    const response = await api.put(`/bonuses/${id}`, bonusData);
    return response.data;
  } catch (error) {
    console.error("Error updating bonus:", error);
    throw error;
  }
};

// Delete bonus
export const deleteBonus = async (id) => {
  try {
    const response = await api.delete(`/bonuses/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting bonus:", error);
    throw error;
  }
};

// Get bonus by ID
export const getBonusById = async (id) => {
  try {
    const response = await api.get(`/bonuses/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bonus:", error);
    throw error;
  }
};
