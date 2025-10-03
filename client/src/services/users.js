import api from "./api";

// Get all users
export const getUsers = async () => {
  try {
    const response = await api.get("/users");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get pending registration users (debug endpoint)
export const getPendingUsers = async () => {
  try {
    const response = await api.get("/users/pending");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get manageable users (filtered)
export const getManageableUsers = async () => {
  try {
    const response = await api.get("/users/manageable");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get department users
export const getDepartmentUsers = async () => {
  try {
    const response = await api.get("/users/department");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new user
export const createUser = async (userData) => {
  try {
    const response = await api.post("/users", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Send invitation to user
export const sendInvitation = async (userId, invitationData) => {
  try {
    const response = await api.post(`/users/${userId}/invite`, invitationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user status
export const updateUserStatus = async (userId, status) => {
  try {
    const response = await api.patch(`/users/${userId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user metrics
export const getUserMetrics = async () => {
  try {
    const response = await api.get("/users/metrics");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getUsers,
  getPendingUsers,
  getManageableUsers,
  getDepartmentUsers,
  createUser,
  updateUser,
  deleteUser,
  sendInvitation,
  getUserById,
  updateUserStatus,
  getUserMetrics,
};
