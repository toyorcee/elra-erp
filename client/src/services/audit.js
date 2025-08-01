import api from "./api";

// Get recent activities for dashboard
export const getRecentActivities = async (params = {}) => {
  const response = await api.get("/audit/recent", { params });
  return response.data;
};

// Get user activity summary
export const getUserActivitySummary = async (userId, days = 30) => {
  const response = await api.get(`/audit/users/${userId}`, {
    params: { days },
  });
  return response.data;
};

// Get activity statistics for admin dashboard
export const getActivityStats = async (days = 30) => {
  const response = await api.get("/audit/stats", {
    params: { days },
  });
  return response.data;
};

// Get audit dashboard data
export const getAuditDashboard = async (days = 30) => {
  const response = await api.get("/audit/dashboard", {
    params: { days },
  });
  return response.data;
};

// Get document audit trail
export const getDocumentAuditTrail = async (documentId) => {
  const response = await api.get(`/audit/documents/${documentId}`);
  return response.data;
};

const auditService = {
  getRecentActivities,
  getUserActivitySummary,
  getActivityStats,
  getAuditDashboard,
  getDocumentAuditTrail,
};

export default auditService;
