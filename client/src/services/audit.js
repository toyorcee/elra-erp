import api from "./api.js";

export const auditService = {
  // Get recent activity for dashboard
  getRecentActivity: async (limit = 10) => {
    const response = await api.get(`/audit/recent?limit=${limit}`);
    return response.data;
  },

  // Get audit dashboard data
  getAuditDashboard: async (days = 7) => {
    const response = await api.get(`/audit/dashboard?days=${days}`);
    return response.data;
  },

  // Get activity statistics
  getActivityStats: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/audit/stats?${params}`);
    return response.data;
  },

  // Get audit logs with filtering
  getAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/audit/logs?${params}`);
    return response.data;
  },

  // Get specific audit log
  getAuditLogById: async (id) => {
    const response = await api.get(`/audit/logs/${id}`);
    return response.data;
  },

  // Get document audit trail
  getDocumentAuditTrail: async (documentId) => {
    const response = await api.get(`/audit/documents/${documentId}`);
    return response.data;
  },

  // Get user activity summary
  getUserActivitySummary: async (userId, days = 30) => {
    const response = await api.get(`/audit/users/${userId}?days=${days}`);
    return response.data;
  },

  // Export audit logs
  exportAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/audit/export?${params}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Clean old audit logs (super admin only)
  cleanOldLogs: async (daysToKeep = 90) => {
    const response = await api.delete(`/audit/clean?daysToKeep=${daysToKeep}`);
    return response.data;
  },
};

export default auditService;
