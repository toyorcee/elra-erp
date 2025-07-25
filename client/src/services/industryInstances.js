import api from "./api";

// Industry Instances (Platform Admin)
export const createIndustryInstance = (data) =>
  api.post("/industry-instances", data);
export const getIndustryInstances = (params) =>
  api.get("/industry-instances", { params });
export const getIndustryInstance = (id) => api.get(`/industry-instances/${id}`);
export const updateIndustryInstance = (id, data) =>
  api.put(`/industry-instances/${id}`, data);
export const deleteIndustryInstance = (id) =>
  api.delete(`/industry-instances/${id}`);
export const getInstanceStats = (id) =>
  api.get(`/industry-instances/${id}/stats`);
export const getAvailableIndustries = () =>
  api.get("/industry-instances/available-industries");
export const resendInvitation = (id) =>
  api.post(`/industry-instances/${id}/resend-invitation`);

// Super Admin Credentials (Public endpoint)
export const getSuperAdminCredentials = (email) =>
  api.get("/industry-instances/credentials", { params: { email } });

// Mark password as changed (called when Super Admin changes password)
export const markPasswordChanged = (email) =>
  api.post("/industry-instances/mark-password-changed", { email });
