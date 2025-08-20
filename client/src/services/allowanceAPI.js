import api from "./api";

// Get all allowances
export const fetchAllowances = async (params = {}) => {
  try {
    const response = await api.get("/allowances", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching allowances:", error);
    throw error;
  }
};

// Get allowance categories
export const fetchAllowanceCategories = async () => {
  try {
    const response = await api.get("/allowances/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching allowance categories:", error);
    throw error;
  }
};

// Get allowance types
export const fetchAllowanceTypes = async () => {
  try {
    const response = await api.get("/allowances/types");
    return response.data;
  } catch (error) {
    console.error("Error fetching allowance types:", error);
    throw error;
  }
};

// Create new allowance
export const createAllowance = async (allowanceData) => {
  try {
    const response = await api.post("/allowances", allowanceData);
    return response.data;
  } catch (error) {
    console.error("Error creating allowance:", error);
    throw error;
  }
};

// Update allowance
export const updateAllowance = async (id, allowanceData) => {
  try {
    const response = await api.put(`/allowances/${id}`, allowanceData);
    return response.data;
  } catch (error) {
    console.error("Error updating allowance:", error);
    throw error;
  }
};

// Delete allowance
export const deleteAllowance = async (id) => {
  try {
    const response = await api.delete(`/allowances/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting allowance:", error);
    throw error;
  }
};

// Get allowance by ID
export const getAllowanceById = async (id) => {
  try {
    const response = await api.get(`/allowances/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching allowance:", error);
    throw error;
  }
};

// Get employees by departments (for allowance assignment)
export const fetchEmployeesByDepartments = async (departmentIds) => {
  try {
    const response = await api.get(
      `/allowances/employees-by-departments?departmentIds=${departmentIds.join(
        ","
      )}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching employees by departments:", error);
    throw error;
  }
};

// Get taxable status for allowance type
export const getTaxableStatus = async (type) => {
  try {
    const response = await api.get(`/allowances/taxable-status?type=${type}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching taxable status:", error);
    throw error;
  }
};
