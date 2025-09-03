import api from "./api";

// Leave request operations
export const leaveRequests = {
  getAll: async (params = {}) => {
    const response = await api.get("/leave", { params });
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get("/leave/my-requests");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/leave/${id}`);
    return response.data;
  },

  getDepartmentRequests: async () => {
    const response = await api.get("/leave/department-requests");
    return response.data;
  },

  create: async (leaveData) => {
    const response = await api.post("/leave", leaveData);
    return response.data;
  },

  update: async (id, updateData) => {
    const response = await api.put(`/leave/${id}`, updateData);
    return response.data;
  },

  approve: async (id, action, comment) => {
    const response = await api.put(`/leave/${id}/approve`, { action, comment });
    return response.data;
  },

  cancel: async (id, reason) => {
    const response = await api.put(`/leave/${id}/cancel`, { reason });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/leave/${id}`);
    return response.data;
  },
};

export const leaveStats = {
  getOverview: async () => {
    const response = await api.get("/leave/stats/overview");
    return response.data;
  },

  getPendingApprovals: async () => {
    const response = await api.get("/leave/pending/approvals");
    return response.data;
  },

  getTypes: async () => {
    const response = await api.get("/leave/types/available");
    return response.data;
  },
};

export default {
  leaveRequests,
  leaveStats,
};
