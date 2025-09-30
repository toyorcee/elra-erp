import api from "./api.js";

const dashboardAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get("/dashboard/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // Get recent activity
  getRecentActivity: async (params = {}) => {
    try {
      const response = await api.get("/audit/recent-activity", {
        params: {
          limit: 10,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw error;
    }
  },

  // Get user-specific dashboard data
  getUserDashboard: async () => {
    try {
      const response = await api.get("/dashboard/user");
      return response.data;
    } catch (error) {
      console.error("Error fetching user dashboard:", error);
      throw error;
    }
  },

  // Get notifications
  getNotifications: async () => {
    try {
      const response = await api.get("/notifications");
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Get system health
  getSystemHealth: async () => {
    try {
      const response = await api.get("/dashboard/health");
      return response.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      throw error;
    }
  },

  // Get user's leave requests data
  getLeaveRequestsData: async () => {
    try {
      const response = await api.get("/leave/my-requests");
      return response.data;
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      throw error;
    }
  },

  // Get user's payslips data
  getPayslipsData: async () => {
    try {
      const response = await api.get("/payroll/personal-payslips");
      return response.data;
    } catch (error) {
      console.error("Error fetching payslips:", error);
      throw error;
    }
  },

  // Get user's projects data
  getProjectsData: async () => {
    try {
      const response = await api.get("/projects/my-projects");
      return response.data;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },
};

export default dashboardAPI;
