import api from "./api";

// Get all departments with optional filters
export const getDepartments = async (params = {}) => {
  const response = await api.get("/departments", { params });
  console.log("[departments.js] getDepartments response:", response.data);
  return response.data;
};

// Get department by ID
export const getDepartmentById = async (id) => {
  const response = await api.get(`/departments/${id}`);
  return response.data;
};

// Create new department
export const createDepartment = async (departmentData) => {
  const response = await api.post("/departments", departmentData);
  return response.data;
};

// Update department
export const updateDepartment = async (id, departmentData) => {
  const response = await api.put(`/departments/${id}`, departmentData);
  return response.data;
};

// Delete department
export const deleteDepartment = async (id) => {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
};

// Get department users
export const getDepartmentUsers = async (id) => {
  const response = await api.get(`/departments/${id}/users`);
  return response.data;
};

// Get department hierarchy
export const getDepartmentHierarchy = async () => {
  const response = await api.get("/departments/hierarchy");
  return response.data;
};

// Get department statistics
export const getDepartmentStats = async () => {
  const response = await api.get("/departments/stats");
  return response.data;
};

// Get active departments only
export const getActiveDepartments = async () => {
  const response = await api.get("/departments/active");
  return response.data;
};

// Bulk delete all departments (except External)
export const bulkDeleteDepartments = async () => {
  const response = await api.delete("/departments/bulk-delete");
  return response.data;
};

// Bulk create departments
export const bulkCreateDepartments = async (departments) => {
  const response = await api.post("/departments/bulk-create", { departments });
  return response.data;
};
