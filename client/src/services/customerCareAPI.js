import api from "./api";

export const complaintAPI = {
  getComplaints: async (params = {}) => {
    try {
      const response = await api.get("/customer-care/complaints", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching complaints:", error);
      throw error;
    }
  },

  getComplaintById: async (id) => {
    try {
      const response = await api.get(`/customer-care/complaints/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching complaint:", error);
      throw error;
    }
  },

  createComplaint: async (complaintData) => {
    try {
      const response = await api.post(
        "/customer-care/complaints",
        complaintData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating complaint:", error);
      throw error;
    }
  },

  updateComplaintStatus: async (id, statusData) => {
    try {
      const response = await api.put(
        `/customer-care/complaints/${id}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating complaint status:", error);
      throw error;
    }
  },

  addComplaintNote: async (id, noteData) => {
    try {
      const response = await api.post(
        `/customer-care/complaints/${id}/notes`,
        noteData
      );
      return response.data;
    } catch (error) {
      console.error("Error adding complaint note:", error);
      throw error;
    }
  },

  submitFeedback: async (id, feedbackData) => {
    try {
      const response = await api.post(
        `/customer-care/complaints/${id}/feedback`,
        feedbackData
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  },

  getTeamMembers: async () => {
    try {
      const response = await api.get("/customer-care/team-members");
      return response.data;
    } catch (error) {
      console.error("Error fetching team members:", error);
      throw error;
    }
  },

  getDepartmentsWithHODs: async () => {
    try {
      const response = await api.get("/customer-care/departments-with-hods");
      return response.data;
    } catch (error) {
      console.error("Error fetching departments with HODs:", error);
      throw error;
    }
  },

  sendComplaintToHOD: async (complaintId, data) => {
    try {
      const response = await api.post(
        `/customer-care/complaints/${complaintId}/send-to-hod`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error sending complaint to HOD:", error);
      throw error;
    }
  },

  assignComplaint: async (complaintId, assignmentData) => {
    try {
      const response = await api.post(
        `/customer-care/complaints/${complaintId}/assign`,
        assignmentData
      );
      return response.data;
    } catch (error) {
      console.error("Error assigning complaint:", error);
      throw error;
    }
  },

  sendReminderNotification: async (complaintId) => {
    try {
      const response = await api.post(
        `/customer-care/complaints/${complaintId}/reminder`
      );
      return response.data;
    } catch (error) {
      console.error("Error sending reminder notification:", error);
      throw error;
    }
  },
};

export const statisticsAPI = {
  getStatistics: async (params = {}) => {
    try {
      const response = await api.get("/customer-care/statistics", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  },

  getTrends: async (params = {}) => {
    try {
      const response = await api.get("/customer-care/trends", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching trends:", error);
      throw error;
    }
  },

  getDepartmentBreakdown: async () => {
    try {
      const response = await api.get("/customer-care/department-breakdown");
      return response.data;
    } catch (error) {
      console.error("Error fetching department breakdown:", error);
      throw error;
    }
  },

  getCategoryBreakdown: async () => {
    try {
      const response = await api.get("/customer-care/category-breakdown");
      return response.data;
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      throw error;
    }
  },

  getPriorityBreakdown: async () => {
    try {
      const response = await api.get("/customer-care/priority-breakdown");
      return response.data;
    } catch (error) {
      console.error("Error fetching priority breakdown:", error);
      throw error;
    }
  },

  getTrendCalculations: async (params = {}) => {
    try {
      const response = await api.get("/customer-care/trends", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching trend calculations:", error);
      throw error;
    }
  },

  exportCustomerCareReport: async (format, params = {}) => {
    try {
      const response = await api.get(
        `/customer-care/reports/export/${format}`,
        {
          params,
          responseType: "blob", 
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error exporting report:", error);
      throw error;
    }
  },
};

export const complaintUtils = {
  formatStatus: (status) => {
    const statusMap = {
      pending: {
        label: "Pending",
        color: "yellow",
        bgColor: "bg-yellow-100 text-yellow-800",
      },
      in_progress: {
        label: "In Progress",
        color: "blue",
        bgColor: "bg-blue-100 text-blue-800",
      },
      resolved: {
        label: "Resolved",
        color: "green",
        bgColor: "bg-green-100 text-green-800",
      },
      closed: {
        label: "Closed",
        color: "gray",
        bgColor: "bg-gray-100 text-gray-800",
      },
      rejected: {
        label: "Rejected",
        color: "red",
        bgColor: "bg-red-100 text-red-800",
      },
    };
    return (
      statusMap[status] || {
        label: status,
        color: "gray",
        bgColor: "bg-gray-100 text-gray-800",
      }
    );
  },

  formatPriority: (priority) => {
    const priorityMap = {
      low: {
        label: "Low",
        color: "green",
        bgColor: "bg-green-100 text-green-800",
      },
      medium: {
        label: "Medium",
        color: "yellow",
        bgColor: "bg-yellow-100 text-yellow-800",
      },
      high: { label: "High", color: "red", bgColor: "bg-red-100 text-red-800" },
    };
    return (
      priorityMap[priority] || {
        label: priority,
        color: "gray",
        bgColor: "bg-gray-100 text-gray-800",
      }
    );
  },

  formatCategory: (category) => {
    const categoryMap = {
      technical: { label: "Technical Issues", icon: "💻" },
      payroll: { label: "Payroll & Finance", icon: "💰" },
      equipment: { label: "Equipment Request", icon: "🖥️" },
      access: { label: "Access Issues", icon: "🔐" },
      hr: { label: "HR Related", icon: "👥" },
      other: { label: "Other", icon: "📝" },
    };
    return categoryMap[category] || { label: category, icon: "📝" };
  },

  calculateAge: (submittedAt) => {
    const now = new Date();
    const submitted = new Date(submittedAt);
    const diffTime = Math.abs(now - submitted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  isOverdue: (slaDeadline, status) => {
    if (!slaDeadline || status === "resolved" || status === "closed")
      return false;
    return new Date() > new Date(slaDeadline);
  },

  updateComplaintStatus: async (complaintId, status) => {
    try {
      const response = await api.put(
        `/customer-care/complaints/${complaintId}/status`,
        {
          status,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating complaint status:", error);
      throw error;
    }
  },

  saveSession: async (sessionData) => {
    try {
      const response = await api.post("/customer-care/sessions", sessionData);
      return response.data;
    } catch (error) {
      console.error("Error saving session:", error);
      throw error;
    }
  },

  getSessionsByComplaint: async (complaintId) => {
    try {
      const response = await api.get(
        `/customer-care/sessions/complaint/${complaintId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting sessions by complaint:", error);
      throw error;
    }
  },

  // Get sessions by responder
  getSessionsByResponder: async (responderId) => {
    try {
      const response = await api.get(
        `/customer-care/sessions/responder/${responderId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting sessions by responder:", error);
      throw error;
    }
  },

  getActiveSessions: async () => {
    try {
      const response = await api.get("/customer-care/sessions/active");
      return response.data;
    } catch (error) {
      console.error("Error getting active sessions:", error);
      throw error;
    }
  },
};
