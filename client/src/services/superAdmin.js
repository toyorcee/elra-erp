import api from "./api";

// Get system overview and statistics
export const getSystemOverview = async () => {
  const response = await api.get("/super-admin/overview");
  return response.data;
};

// Get all system users with advanced filtering
export const getAllSystemUsers = async (params = {}) => {
  const response = await api.get("/super-admin/users", { params });
  return response.data;
};

// Get system roles with user counts
export const getSystemRoles = async () => {
  const response = await api.get("/super-admin/roles");
  return response.data;
};

// Update system settings
export const updateSystemSettings = async (settings) => {
  const response = await api.put("/super-admin/settings", settings);
  return response.data;
};

// Get system audit log
export const getSystemAudit = async (params = {}) => {
  const response = await api.get("/super-admin/audit", { params });
  return response.data;
};

// Bulk user operations
export const bulkUserOperations = async (operation, userIds, data = {}) => {
  const response = await api.post("/super-admin/users/bulk", {
    operation,
    userIds,
    data,
  });
  return response.data;
};
