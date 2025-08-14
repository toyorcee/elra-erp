import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export const userModulesAPI = {
  // Fetch available modules for the current user
  getUserModules: async () => {
    try {
      console.log("🔍 [userModulesAPI] Fetching user modules...");
      const response = await api.get("/auth/user-modules");
      console.log(
        "✅ [userModulesAPI] User modules fetched successfully:",
        response.data
      );
      console.log("📦 [userModulesAPI] Raw modules data:", response.data.data);
      return response.data;
    } catch (error) {
      console.error("❌ [userModulesAPI] Error fetching user modules:", error);
      throw error;
    }
  },

  // Invitation Management API
  invitations: {
    // Get salary grades
    getSalaryGrades: async () => {
      try {
        const response = await api.get("/invitations/salary-grades");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error fetching salary grades:",
          error
        );
        throw error;
      }
    },

    getNextBatchNumber: async () => {
      try {
        const response = await api.get("/invitations/next-batch-number");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error fetching next batch number:",
          error
        );
        throw error;
      }
    },
    retryFailedEmails: async (batchId) => {
      try {
        const response = await api.post(
          `/invitations/batch/${batchId}/retry-emails`
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error retrying failed emails:",
          error
        );
        throw error;
      }
    },
    retrySingleEmail: async (invitationId) => {
      try {
        const response = await api.post(
          `/invitations/${invitationId}/retry-email`
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error retrying single email:",
          error
        );
        throw error;
      }
    },

    // Create bulk invitations
    createBulkInvitations: async (invitationData) => {
      try {
        const response = await api.post(
          "/invitations/bulk-create",
          invitationData
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error creating bulk invitations:",
          error
        );
        throw error;
      }
    },

    // Create CSV bulk invitations
    createCSVBulkInvitations: async (csvData) => {
      try {
        const response = await api.post("/invitations/bulk-csv", csvData);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error creating CSV bulk invitations:",
          error
        );
        throw error;
      }
    },

    // Get pending approval invitations
    getPendingApprovalInvitations: async (params = {}) => {
      try {
        const response = await api.get("/invitations/pending-approval", {
          params,
        });
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error fetching pending approval invitations:",
          error
        );
        throw error;
      }
    },

    // Approve bulk invitations
    approveBulkInvitations: async (batchId, approvalData) => {
      try {
        const response = await api.post(
          `/invitations/batch/${batchId}/approve`,
          approvalData
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error approving bulk invitations:",
          error
        );
        throw error;
      }
    },

    // Get batch invitations
    getBatchInvitations: async (batchId) => {
      try {
        const response = await api.get(`/invitations/batch/${batchId}`);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error fetching batch invitations:",
          error
        );
        throw error;
      }
    },

    searchBatches: async (query, page = 1, limit = 10, type = "batch") => {
      try {
        const response = await api.get("/invitations/search-batches", {
          params: { query, page, limit, type },
        });
        return response.data;
      } catch (error) {
        console.error("❌ [invitationsAPI] Error searching batches:", error);
        throw error;
      }
    },

    // Get all invitations
    getAllInvitations: async (params = {}) => {
      try {
        const response = await api.get("/invitations", { params });
        return response.data;
      } catch (error) {
        console.error("❌ [invitationsAPI] Error fetching invitations:", error);
        throw error;
      }
    },

    // Create single invitation
    createInvitation: async (invitationData) => {
      try {
        const response = await api.post("/invitations", invitationData);
        return response.data;
      } catch (error) {
        console.error("❌ [invitationsAPI] Error creating invitation:", error);
        throw error;
      }
    },

    // Resend invitation
    resendInvitation: async (invitationId) => {
      try {
        const response = await api.post(`/invitations/${invitationId}/resend`);
        return response.data;
      } catch (error) {
        console.error("❌ [invitationsAPI] Error resending invitation:", error);
        throw error;
      }
    },

    // Cancel invitation
    cancelInvitation: async (invitationId) => {
      try {
        const response = await api.delete(`/invitations/${invitationId}`);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error cancelling invitation:",
          error
        );
        throw error;
      }
    },

    // Get invitation statistics
    getInvitationStats: async () => {
      try {
        const response = await api.get("/invitations/stats");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error fetching invitation stats:",
          error
        );
        throw error;
      }
    },
  },

  // Department Management API
  departments: {
    getAllDepartments: async () => {
      try {
        const response = await api.get("/departments");
        return response.data;
      } catch (error) {
        console.error("❌ [departmentsAPI] Error fetching departments:", error);
        return { success: false, error: error.message };
      }
    },

    createDepartment: async (departmentData) => {
      try {
        const response = await api.post("/departments", departmentData);
        return response.data;
      } catch (error) {
        console.error("❌ [departmentsAPI] Error creating department:", error);
        throw error;
      }
    },

    updateDepartment: async (departmentId, departmentData) => {
      try {
        const response = await api.put(
          `/departments/${departmentId}`,
          departmentData
        );
        return response.data;
      } catch (error) {
        console.error("❌ [departmentsAPI] Error updating department:", error);
        throw error;
      }
    },

    deleteDepartment: async (departmentId) => {
      try {
        const response = await api.delete(`/departments/${departmentId}`);
        return response.data;
      } catch (error) {
        console.error("❌ [departmentsAPI] Error deleting department:", error);
        throw error;
      }
    },
  },

  // User Management API
  users: {
    getAllUsers: async () => {
      try {
        const response = await api.get("/users");
        return response.data;
      } catch (error) {
        console.error("❌ [usersAPI] Error fetching users:", error);
        throw error;
      }
    },

    getUserById: async (userId) => {
      try {
        const response = await api.get(`/users/${userId}`);
        return response.data;
      } catch (error) {
        console.error("❌ [usersAPI] Error fetching user:", error);
        throw error;
      }
    },

    updateUser: async (userId, userData) => {
      try {
        const response = await api.put(`/users/${userId}`, userData);
        return response.data;
      } catch (error) {
        console.error("❌ [usersAPI] Error updating user:", error);
        throw error;
      }
    },

    deleteUser: async (userId) => {
      try {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
      } catch (error) {
        console.error("❌ [usersAPI] Error deleting user:", error);
        throw error;
      }
    },
  },

  // Salary Grade Management API
  salaryGrades: {
    getAllSalaryGrades: async () => {
      try {
        const response = await api.get("/salary-grades");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [salaryGradesAPI] Error fetching salary grades:",
          error
        );
        throw error;
      }
    },

    getSalaryGradeById: async (id) => {
      try {
        const response = await api.get(`/salary-grades/${id}`);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [salaryGradesAPI] Error fetching salary grade:",
          error
        );
        throw error;
      }
    },

    createSalaryGrade: async (salaryGradeData) => {
      try {
        const response = await api.post("/salary-grades", salaryGradeData);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [salaryGradesAPI] Error creating salary grade:",
          error
        );
        throw error;
      }
    },

    updateSalaryGrade: async (id, salaryGradeData) => {
      try {
        const response = await api.put(`/salary-grades/${id}`, salaryGradeData);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [salaryGradesAPI] Error updating salary grade:",
          error
        );
        throw error;
      }
    },

    deleteSalaryGrade: async (id) => {
      try {
        const response = await api.delete(`/salary-grades/${id}`);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [salaryGradesAPI] Error deleting salary grade:",
          error
        );
        throw error;
      }
    },

    getSalaryGradesForDropdown: async () => {
      try {
        const response = await api.get("/salary-grades/dropdown");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [salaryGradesAPI] Error fetching dropdown data:",
          error
        );
        throw error;
      }
    },
  },

  // Role Management API
  roles: {
    getAllRoles: async () => {
      try {
        const response = await api.get("/roles");
        return response.data;
      } catch (error) {
        console.error("❌ [rolesAPI] Error fetching roles:", error);
        return { success: false, error: error.message };
      }
    },

    createRole: async (roleData) => {
      try {
        const response = await api.post("/roles", roleData);
        return response.data;
      } catch (error) {
        console.error("❌ [rolesAPI] Error creating role:", error);
        throw error;
      }
    },

    updateRole: async (roleId, roleData) => {
      try {
        const response = await api.put(`/roles/${roleId}`, roleData);
        return response.data;
      } catch (error) {
        console.error("❌ [rolesAPI] Error updating role:", error);
        throw error;
      }
    },

    deleteRole: async (roleId) => {
      try {
        const response = await api.delete(`/roles/${roleId}`);
        return response.data;
      } catch (error) {
        console.error("❌ [rolesAPI] Error deleting role:", error);
        throw error;
      }
    },
  },

  // Fetch all available modules (for unauthenticated users)
  getAllModules: async () => {
    try {
      console.log("🔍 [userModulesAPI] Fetching all modules...");
      const response = await api.get("/auth/all-modules");
      console.log(
        "✅ [userModulesAPI] All modules fetched successfully:",
        response.data
      );
      console.log("📦 [userModulesAPI] Raw modules data:", response.data.data);
      return response.data;
    } catch (error) {
      console.error("❌ [userModulesAPI] Error fetching all modules:", error);
      throw error;
    }
  },

  // Transform backend modules to frontend format
  transformModules: (backendModules) => {
    console.log("🔄 [userModulesAPI] Transforming modules:", backendModules);
    const iconMap = {
      CurrencyDollarIcon: "FaMoneyCheckAlt",
      ShoppingCartIcon: "FaShoppingCart",
      ChatBubbleLeftRightIcon: "FaComments",
      DocumentIcon: "FaFileAlt",
      ClipboardDocumentListIcon: "FaClipboardList",
      CubeIcon: "FaBoxes",
      UsersIcon: "FaUsers",
      ChartBarIcon: "FaChartBar",
      CustomerServiceIcon: "FaHeadset",
    };

    const colorMap = {
      "#10B981": "from-green-500 to-green-600",
      "#F59E0B": "from-amber-500 to-amber-600",
      "#3B82F6": "from-blue-500 to-blue-600",
      "#8B5CF6": "from-purple-500 to-purple-600",
      "#EC4899": "from-pink-500 to-pink-600",
      "#06B6D4": "from-cyan-500 to-cyan-600",
    };

    const bgColorMap = {
      "#10B981": "bg-green-50",
      "#F59E0B": "bg-amber-50",
      "#3B82F6": "bg-blue-50",
      "#8B5CF6": "bg-purple-50",
      "#EC4899": "bg-pink-50",
      "#06B6D4": "bg-cyan-50",
    };

    const borderColorMap = {
      "#10B981": "border-green-200",
      "#F59E0B": "border-amber-200",
      "#3B82F6": "border-blue-200",
      "#8B5CF6": "border-purple-200",
      "#EC4899": "border-pink-200",
      "#06B6D4": "border-cyan-200",
    };

    const transformedModules = backendModules.map((module) => ({
      id: module._id,
      title: module.name,
      description: module.description,
      icon: iconMap[module.icon] || "FaCog",
      path: `/dashboard/modules/${module.code.toLowerCase()}`,
      isReady: true,
      color: colorMap[module.color] || "from-gray-500 to-gray-600",
      bgColor: bgColorMap[module.color] || "bg-gray-50",
      borderColor: borderColorMap[module.color] || "border-gray-200",
      permissions: module.permissions || [],
      code: module.code,
      order: module.order,
    }));

    console.log("✅ [userModulesAPI] Transformed modules:", transformedModules);
    return transformedModules;
  },
};
