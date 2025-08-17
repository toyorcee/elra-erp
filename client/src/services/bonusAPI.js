import api from "./api";

// Get all bonuses
export const fetchBonuses = async (params = {}) => {
  try {
    const response = await api.get("/bonuses", { params });
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

// Get employees by departments (for bonus assignment)
export const fetchEmployeesByDepartments = async (departmentIds) => {
  try {
    const response = await api.get(
      `/bonuses/employees-by-departments?departmentIds=${departmentIds.join(
        ","
      )}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching employees by departments:", error);
    throw error;
  }
};

// Get taxable status for bonus type
export const getTaxableStatus = async (type) => {
  try {
    const response = await api.get(`/bonuses/taxable-status?type=${type}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching taxable status:", error);
    throw error;
  }
};
