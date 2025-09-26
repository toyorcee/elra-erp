import api from "./api";

// Complaint API functions
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

  // Get single complaint by ID
  getComplaintById: async (id) => {
    try {
      const response = await api.get(`/customer-care/complaints/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching complaint:", error);
      throw error;
    }
  },

  // Create new complaint
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

  // Update complaint status
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

  // Add note to complaint
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

  // Submit feedback for resolved complaint
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

  // Get team members for assignment (HODs only)
  getTeamMembers: async () => {
    try {
      const response = await api.get("/customer-care/team-members");
      return response.data;
    } catch (error) {
      console.error("Error fetching team members:", error);
      throw error;
    }
  },

  // Assign complaint to team member (HODs only)
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
};

// Statistics API functions
export const statisticsAPI = {
  // Get complaint statistics
  getStatistics: async (params = {}) => {
    try {
      const response = await api.get("/customer-care/statistics", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  },

  // Get complaint trends
  getTrends: async (params = {}) => {
    try {
      const response = await api.get("/customer-care/trends", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching trends:", error);
      throw error;
    }
  },

  // Get department breakdown
  getDepartmentBreakdown: async () => {
    try {
      const response = await api.get("/customer-care/department-breakdown");
      return response.data;
    } catch (error) {
      console.error("Error fetching department breakdown:", error);
      throw error;
    }
  },

  // Get category breakdown
  getCategoryBreakdown: async () => {
    try {
      const response = await api.get("/customer-care/category-breakdown");
      return response.data;
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      throw error;
    }
  },
};

// Utility functions
export const complaintUtils = {
  // Format complaint status for display
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

  // Format priority for display
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

  // Format category for display
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

  // Calculate age in days
  calculateAge: (submittedAt) => {
    const now = new Date();
    const submitted = new Date(submittedAt);
    const diffTime = Math.abs(now - submitted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  // Check if complaint is overdue
  isOverdue: (slaDeadline, status) => {
    if (!slaDeadline || status === "resolved" || status === "closed")
      return false;
    return new Date() > new Date(slaDeadline);
  },
};
