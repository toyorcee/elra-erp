import api from './api';

// Get all allowances
export const fetchAllowances = async () => {
  try {
    const response = await api.get('/allowances');
    return response.data;
  } catch (error) {
    console.error('Error fetching allowances:', error);
    throw error;
  }
};

// Get allowance categories
export const fetchAllowanceCategories = async () => {
  try {
    const response = await api.get('/allowances/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching allowance categories:', error);
    throw error;
  }
};

// Create new allowance
export const createAllowance = async (allowanceData) => {
  try {
    const response = await api.post('/allowances', allowanceData);
    return response.data;
  } catch (error) {
    console.error('Error creating allowance:', error);
    throw error;
  }
};

// Update allowance
export const updateAllowance = async (id, allowanceData) => {
  try {
    const response = await api.put(`/allowances/${id}`, allowanceData);
    return response.data;
  } catch (error) {
    console.error('Error updating allowance:', error);
    throw error;
  }
};

// Delete allowance
export const deleteAllowance = async (id) => {
  try {
    const response = await api.delete(`/allowances/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting allowance:', error);
    throw error;
  }
};

// Get allowance by ID
export const getAllowanceById = async (id) => {
  try {
    const response = await api.get(`/allowances/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching allowance:', error);
    throw error;
  }
};
