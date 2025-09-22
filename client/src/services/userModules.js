import api from "./api.js";

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

  dashboard: {
    getHRDashboardData: async () => {
      try {
        console.log("🔍 [dashboardAPI] Fetching HR dashboard data...");
        const response = await api.get("/dashboard/hr/overview");
        console.log(
          "✅ [dashboardAPI] HR dashboard data fetched successfully:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [dashboardAPI] Error fetching HR dashboard data:",
          error
        );
        throw error;
      }
    },

    // Get HR department-specific data
    getHRDepartmentData: async (departmentId) => {
      try {
        console.log(
          "🔍 [dashboardAPI] Fetching HR department data for:",
          departmentId
        );
        const response = await api.get(
          `/dashboard/hr/department/${departmentId}`
        );
        console.log(
          "✅ [dashboardAPI] HR department data fetched successfully:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [dashboardAPI] Error fetching HR department data:",
          error
        );
        throw error;
      }
    },

    // Get Self-Service dashboard data
    getSelfServiceDashboardData: async () => {
      try {
        console.log(
          "🔍 [dashboardAPI] Fetching Self-Service dashboard data..."
        );
        const response = await api.get("/dashboard/self-service/overview");
        console.log(
          "✅ [dashboardAPI] Self-Service dashboard data fetched successfully:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [dashboardAPI] Error fetching Self-Service dashboard data:",
          error
        );
        throw error;
      }
    },
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
        const response = await api.get("/invitations/user", { params });
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

    createSingleInvitation: async (invitationData) => {
      try {
        console.log(
          "🚀 [invitationsAPI] Creating single invitation:",
          invitationData
        );
        console.log(
          "🔗 [invitationsAPI] Making POST request to /invitations/create-single"
        );

        const response = await api.post(
          "/invitations/create-single",
          invitationData
        );

        console.log(
          "✅ [invitationsAPI] Single invitation created successfully:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [invitationsAPI] Error creating single invitation:",
          error
        );
        console.error("🔍 [invitationsAPI] Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
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

    getOnboardedMembers: async (params) => {
      try {
        const response = await api.get("/users/onboarded", { params });
        return response.data;
      } catch (error) {
        console.error("❌ [usersAPI] Error fetching onboarded members:", error);
        throw error;
      }
    },

    updateUserSalary: async (userId, salaryData) => {
      try {
        const response = await api.put(`/users/${userId}/salary`, salaryData);
        return response.data;
      } catch (error) {
        console.error("❌ [usersAPI] Error updating user salary:", error);
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

  profile: {
    getProfile: async () => {
      try {
        const response = await api.get("/profile");
        return response.data;
      } catch (error) {
        console.error("❌ [profileAPI] Error fetching profile:", error);
        throw error;
      }
    },

    // Update profile form data (text fields only)
    updateProfileData: async (profileData) => {
      try {
        console.log("📝 [profileAPI] Updating profile data:", profileData);

        const response = await api.put("/profile", profileData, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("✅ [profileAPI] Profile data updated successfully");
        return response.data;
      } catch (error) {
        console.error("❌ [profileAPI] Error updating profile data:", error);
        throw error;
      }
    },

    // Upload profile avatar only
    uploadAvatar: async (avatarFile) => {
      try {
        console.log("📁 [profileAPI] Uploading avatar:", avatarFile.name);

        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const response = await api.put("/profile/avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("✅ [profileAPI] Avatar uploaded successfully");
        return response.data;
      } catch (error) {
        console.error("❌ [profileAPI] Error uploading avatar:", error);
        throw error;
      }
    },

    // Legacy function for backward compatibility
    updateProfile: async (profileData) => {
      try {
        const isFormData = profileData instanceof FormData;

        const config = isFormData
          ? {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          : {
              headers: {
                "Content-Type": "application/json",
              },
            };

        const response = await api.put("/profile", profileData, config);
        return response.data;
      } catch (error) {
        console.error("❌ [profileAPI] Error updating profile:", error);
        throw error;
      }
    },
  },

  employeeLifecycle: {
    getAll: async (params) => {
      try {
        const response = await api.get("/employee-lifecycle", { params });
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error fetching lifecycles:",
          error
        );
        throw error;
      }
    },
    getById: async (id) => {
      try {
        const response = await api.get(`/employee-lifecycle/${id}`);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error fetching lifecycle:",
          error
        );
        throw error;
      }
    },
    create: async (lifecycleData) => {
      try {
        const response = await api.post("/employee-lifecycle", lifecycleData);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error creating lifecycle:",
          error
        );
        throw error;
      }
    },
    updateStatus: async (id, statusData) => {
      try {
        const response = await api.patch(
          `/employee-lifecycle/${id}/status`,
          statusData
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error updating status:",
          error
        );
        throw error;
      }
    },
    completeChecklistItem: async (id, itemData) => {
      try {
        const response = await api.patch(
          `/employee-lifecycle/${id}/checklist`,
          itemData
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error completing checklist item:",
          error
        );
        throw error;
      }
    },
    updateTaskStatus: async (id, taskData) => {
      try {
        const response = await api.patch(
          `/employee-lifecycle/${id}/task`,
          taskData
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error updating task status:",
          error
        );
        throw error;
      }
    },
    getActive: async () => {
      try {
        const response = await api.get("/employee-lifecycle/active");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error fetching active lifecycles:",
          error
        );
        throw error;
      }
    },
    getOverdue: async () => {
      try {
        const response = await api.get("/employee-lifecycle/overdue");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error fetching overdue lifecycles:",
          error
        );
        throw error;
      }
    },
    getStats: async () => {
      try {
        const response = await api.get("/employee-lifecycle/stats");
        return response.data;
      } catch (error) {
        console.error("❌ [employeeLifecycleAPI] Error fetching stats:", error);
        throw error;
      }
    },
    initiateOffboarding: async (employeeId) => {
      try {
        const response = await api.post(
          "/employee-lifecycle/initiate-offboarding",
          { employeeId }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error initiating offboarding:",
          error
        );
        throw error;
      }
    },
    getOffboarding: async (params) => {
      try {
        const response = await api.get("/employee-lifecycle/offboarding", {
          params,
        });
        return response.data;
      } catch (error) {
        console.error(
          "❌ [employeeLifecycleAPI] Error fetching offboarding lifecycles:",
          error
        );
        throw error;
      }
    },
  },

  // Leave Management API
  leave: {
    // Create leave request
    createRequest: async (leaveData) => {
      try {
        const response = await api.post("/leave", leaveData);
        return response.data;
      } catch (error) {
        console.error("❌ [leaveAPI] Error creating leave request:", error);
        throw error;
      }
    },
    // Get leave requests (role-based)
    getRequests: async (params = {}) => {
      try {
        const response = await api.get("/leave", { params });
        return response.data;
      } catch (error) {
        console.error("❌ [leaveAPI] Error fetching leave requests:", error);
        throw error;
      }
    },
    // Get leave request by ID
    getRequestById: async (id) => {
      try {
        const response = await api.get(`/leave/${id}`);
        return response.data;
      } catch (error) {
        console.error("❌ [leaveAPI] Error fetching leave request:", error);
        throw error;
      }
    },
    // Approve/Reject leave request
    approveRequest: async (id, action, comment = "") => {
      try {
        const response = await api.put(`/leave/${id}/approve`, {
          action,
          comment,
        });
        return response.data;
      } catch (error) {
        console.error("❌ [leaveAPI] Error approving leave request:", error);
        throw error;
      }
    },
    // Cancel leave request
    cancelRequest: async (id, reason = "") => {
      try {
        const response = await api.put(`/leave/${id}/cancel`, { reason });
        return response.data;
      } catch (error) {
        console.error("❌ [leaveAPI] Error cancelling leave request:", error);
        throw error;
      }
    },
    // Get leave statistics
    getStats: async () => {
      try {
        const response = await api.get("/leave/stats/overview");
        return response.data;
      } catch (error) {
        console.error("❌ [leaveAPI] Error fetching leave stats:", error);
        throw error;
      }
    },
    // Get pending approvals
    getPendingApprovals: async () => {
      try {
        const response = await api.get("/leave/pending/approvals");
        return response.data;
      } catch (error) {
        console.error("❌ [leaveAPI] Error fetching pending approvals:", error);
        throw error;
      }
    },
    getLeaveTypes: async () => {
      try {
        const response = await api.get("/leave/types/available");
        return response.data;
      } catch (error) {
        console.error("❌ [leaveAPI] Error fetching leave types:", error);
        throw error;
      }
    },
  },

  // Policy Management API
  policies: {
    create: async (policyData) => {
      try {
        const response = await api.post("/policies", policyData);
        return response.data;
      } catch (error) {
        console.error("❌ [policiesAPI] Error creating policy:", error);
        throw error;
      }
    },
    getAll: async (params = {}) => {
      try {
        const response = await api.get("/policies", { params });
        return response.data;
      } catch (error) {
        console.error("❌ [policiesAPI] Error fetching policies:", error);
        throw error;
      }
    },
    getById: async (id) => {
      try {
        const response = await api.get(`/policies/${id}`);
        return response.data;
      } catch (error) {
        console.error("❌ [policiesAPI] Error fetching policy:", error);
        throw error;
      }
    },
    update: async (id, policyData) => {
      try {
        const response = await api.put(`/policies/${id}`, policyData);
        return response.data;
      } catch (error) {
        console.error("❌ [policiesAPI] Error updating policy:", error);
        throw error;
      }
    },
    delete: async (id) => {
      try {
        const response = await api.delete(`/policies/${id}`);
        return response.data;
      } catch (error) {
        console.error("❌ [policiesAPI] Error deleting policy:", error);
        throw error;
      }
    },
    getStats: async () => {
      try {
        const response = await api.get("/policies/stats/overview");
        return response.data;
      } catch (error) {
        console.error("❌ [policiesAPI] Error fetching policy stats:", error);
        throw error;
      }
    },
    updateVersion: async (id) => {
      try {
        const response = await api.put(`/policies/${id}/version`);
        return response.data;
      } catch (error) {
        console.error("❌ [policiesAPI] Error updating policy version:", error);
        throw error;
      }
    },
    getByDepartment: async (departmentId, params = {}) => {
      try {
        const response = await api.get(`/policies/department/${departmentId}`, {
          params,
        });
        return response.data;
      } catch (error) {
        console.error(
          "❌ [policiesAPI] Error fetching policies by department:",
          error
        );
        throw error;
      }
    },
    getOptions: async () => {
      try {
        const response = await api.get("/policies/options/available");
        return response.data;
      } catch (error) {
        console.error("❌ [policiesAPI] Error fetching policy options:", error);
        throw error;
      }
    },
  },

  // Compliance Management API
  compliance: {
    create: async (complianceData) => {
      try {
        const response = await api.post("/compliance", complianceData);
        return response.data;
      } catch (error) {
        console.error("❌ [complianceAPI] Error creating compliance:", error);
        throw error;
      }
    },
    getAll: async (params = {}) => {
      try {
        const response = await api.get("/compliance", { params });
        return response.data;
      } catch (error) {
        console.error("❌ [complianceAPI] Error fetching compliance:", error);
        throw error;
      }
    },
    getById: async (id) => {
      try {
        const response = await api.get(`/compliance/${id}`);
        return response.data;
      } catch (error) {
        console.error("❌ [complianceAPI] Error fetching compliance:", error);
        throw error;
      }
    },
    update: async (id, complianceData) => {
      try {
        const response = await api.put(`/compliance/${id}`, complianceData);
        return response.data;
      } catch (error) {
        console.error("❌ [complianceAPI] Error updating compliance:", error);
        throw error;
      }
    },
    delete: async (id) => {
      try {
        const response = await api.delete(`/compliance/${id}`);
        return response.data;
      } catch (error) {
        console.error("❌ [complianceAPI] Error deleting compliance:", error);
        throw error;
      }
    },
    getStats: async () => {
      try {
        const response = await api.get("/compliance/stats/overview");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [complianceAPI] Error fetching compliance stats:",
          error
        );
        throw error;
      }
    },
    getOverdueItems: async () => {
      try {
        const response = await api.get("/compliance/overdue/items");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [complianceAPI] Error fetching overdue items:",
          error
        );
        throw error;
      }
    },
    getDueSoonItems: async () => {
      try {
        const response = await api.get("/compliance/due-soon/items");
        return response.data;
      } catch (error) {
        console.error(
          "❌ [complianceAPI] Error fetching due soon items:",
          error
        );
        throw error;
      }
    },
    updateAuditDates: async (id, auditData) => {
      try {
        const response = await api.put(
          `/compliance/${id}/audit-dates`,
          auditData
        );
        return response.data;
      } catch (error) {
        console.error("❌ [complianceAPI] Error updating audit dates:", error);
        throw error;
      }
    },
    getByDepartment: async (departmentId, params = {}) => {
      try {
        const response = await api.get(
          `/compliance/department/${departmentId}`,
          { params }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [complianceAPI] Error fetching compliance by department:",
          error
        );
        throw error;
      }
    },
    getMyItems: async (params = {}) => {
      try {
        const response = await api.get("/compliance/my/items", { params });
        return response.data;
      } catch (error) {
        console.error(
          "❌ [complianceAPI] Error fetching my compliance items:",
          error
        );
        throw error;
      }
    },
  },

  // Payroll Management API
  payroll: {
    processPayroll: async (payrollData) => {
      try {
        console.log("📋 [payrollAPI] Processing payroll:", payrollData);
        const response = await api.post("/payroll/process", payrollData);
        console.log("✅ [payrollAPI] Process payroll response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error processing payroll:", error);
        throw error;
      }
    },

    calculateEmployeePayroll: async (employeeData) => {
      try {
        console.log(
          "📋 [payrollAPI] Calculating employee payroll:",
          employeeData
        );
        const response = await api.post(
          "/payroll/calculate-employee",
          employeeData
        );
        console.log(
          "✅ [payrollAPI] Calculate employee payroll response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [payrollAPI] Error calculating employee payroll:",
          error
        );
        throw error;
      }
    },

    getPayrollPreview: async (previewData) => {
      try {
        console.log("📋 [payrollAPI] Getting payroll preview:", previewData);
        const response = await api.post("/payroll/preview", previewData);
        console.log("✅ [payrollAPI] Payroll preview response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error getting payroll preview:", error);
        throw error;
      }
    },

    processPayrollWithData: async (payrollData) => {
      try {
        console.log(
          "📋 [payrollAPI] Processing payroll with data:",
          payrollData
        );
        const response = await api.post("/payroll/process-with-data", {
          payrollData,
        });
        console.log(
          "✅ [payrollAPI] Payroll processed with data response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [payrollAPI] Error processing payroll with data:",
          error
        );
        throw error;
      }
    },

    submitForApproval: async (payrollData) => {
      try {
        console.log(
          "📋 [payrollAPI] Submitting payroll for approval:",
          payrollData
        );
        const response = await api.post("/payroll/submit-for-approval", {
          payrollData,
        });
        console.log(
          "✅ [payrollAPI] Submit for approval response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error submitting for approval:", error);
        throw error;
      }
    },

    getPayrollPreviewForHR: async (approvalId) => {
      try {
        console.log(
          "📋 [payrollAPI] Getting payroll preview for HR:",
          approvalId
        );
        const response = await api.get(`/payroll/preview/${approvalId}`);
        console.log(
          "✅ [payrollAPI] Payroll preview for HR response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [payrollAPI] Error getting payroll preview for HR:",
          error
        );
        throw error;
      }
    },

    getPendingApprovals: async () => {
      try {
        console.log("📋 [payrollAPI] Getting pending payroll approvals...");
        const response = await api.get("/payroll/approvals/pending");
        console.log(
          "✅ [payrollAPI] Pending approvals response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [payrollAPI] Error getting pending approvals:",
          error
        );
        throw error;
      }
    },

    resendToFinance: async (approvalId) => {
      try {
        console.log("📋 [payrollAPI] Resending to finance:", approvalId);
        const response = await api.post(
          `/payroll/approvals/${approvalId}/resend`
        );
        console.log(
          "✅ [payrollAPI] Resend to finance response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error resending to finance:", error);
        throw error;
      }
    },

    processApprovedPayroll: async (approvalId) => {
      try {
        console.log("📋 [payrollAPI] Processing approved payroll:", approvalId);
        const response = await api.post(`/payroll/process/${approvalId}`);
        console.log(
          "✅ [payrollAPI] Process approved payroll response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [payrollAPI] Error processing approved payroll:",
          error
        );
        throw error;
      }
    },

    getPayrollSummary: async (month, year) => {
      try {
        console.log("📋 [payrollAPI] Getting payroll summary:", {
          month,
          year,
        });
        const response = await api.get(
          `/payroll/summary?month=${month}&year=${year}`
        );
        console.log("✅ [payrollAPI] Payroll summary response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error getting payroll summary:", error);
        throw error;
      }
    },

    getEmployeePayrollBreakdown: async (employeeId, month, year) => {
      try {
        console.log("📋 [payrollAPI] Getting employee payroll breakdown:", {
          employeeId,
          month,
          year,
        });
        const response = await api.get(
          `/payroll/breakdown/${employeeId}?month=${month}&year=${year}`
        );
        console.log(
          "✅ [payrollAPI] Employee payroll breakdown response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ [payrollAPI] Error getting employee payroll breakdown:",
          error
        );
        throw error;
      }
    },

    getEmployeesForPayroll: async () => {
      try {
        console.log("📋 [payrollAPI] Getting payroll-eligible employees");
        const response = await api.get("/users/payroll-eligible");

        if (response.data.success) {
          console.log(
            `✅ [payrollAPI] Found ${response.data.eligibleCount} payroll-eligible employees out of ${response.data.totalActive} active users`
          );
          return response.data.data;
        } else {
          throw new Error(
            response.data.message ||
              "Failed to fetch payroll-eligible employees"
          );
        }
      } catch (error) {
        console.error(
          "❌ [payrollAPI] Error getting payroll-eligible employees:",
          error
        );
        throw error;
      }
    },

    getDepartmentsForPayroll: async () => {
      try {
        console.log("📋 [payrollAPI] Getting departments for payroll");
        const response = await userModulesAPI.departments.getAllDepartments();
        console.log("✅ [payrollAPI] Departments for payroll:", response.data);
        return response.data;
      } catch (error) {
        console.error(
          "❌ [payrollAPI] Error getting departments for payroll:",
          error
        );
        throw error;
      }
    },

    getSavedPayrolls: async (filters = {}) => {
      try {
        console.log(
          "📋 [payrollAPI] Getting saved payrolls with filters:",
          filters
        );
        const response = await api.get("/payroll/saved", { params: filters });
        console.log("✅ [payrollAPI] Saved payrolls response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error getting saved payrolls:", error);
        throw error;
      }
    },

    getAllPayslips: async (searchParams = {}) => {
      try {
        console.log("📋 [payrollAPI] Getting all payslips:", searchParams);
        const response = await api.get("/payroll/payslips", {
          params: searchParams,
        });
        console.log("✅ [payrollAPI] All payslips response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error getting all payslips:", error);
        throw error;
      }
    },

    resendPayslips: async (payrollId, employeeIds = null) => {
      try {
        console.log("📋 [payrollAPI] Resending payslips:", {
          payrollId,
          employeeIds,
        });
        const response = await api.post("/payroll/resend-payslips", {
          payrollId,
          employeeIds,
        });
        console.log("✅ [payrollAPI] Resend payslips response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error resending payslips:", error);
        throw error;
      }
    },

    getPayslips: async (payrollId, employeeId = null) => {
      try {
        console.log("📋 [payrollAPI] Getting payslips:", {
          payrollId,
          employeeId,
        });
        const params = employeeId ? { employeeId } : {};
        const response = await api.get(`/payroll/payslips/${payrollId}`, {
          params,
        });
        console.log("✅ [payrollAPI] Get payslips response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error getting payslips:", error);
        throw error;
      }
    },

    searchPayslips: async (searchParams = {}) => {
      try {
        console.log("📋 [payrollAPI] Searching payslips:", searchParams);
        const response = await api.get("/payroll/search-payslips", {
          params: searchParams,
        });
        console.log("✅ [payrollAPI] Search payslips response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error searching payslips:", error);
        throw error;
      }
    },

    viewPayslip: async (payrollId, employeeId) => {
      try {
        console.log("📋 [payrollAPI] Viewing payslip:", {
          payrollId,
          employeeId,
        });
        const baseUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const payslipUrl = `${baseUrl}/payroll/payslips/${payrollId}/view/${employeeId}`;

        // Open PDF in new tab
        window.open(payslipUrl, "_blank");
        return { success: true, message: "Opening payslip in new tab..." };
      } catch (error) {
        console.error("❌ [payrollAPI] Error viewing payslip:", error);
        throw error;
      }
    },

    downloadPayslip: async (payrollId, employeeId) => {
      try {
        console.log("📋 [payrollAPI] Downloading payslip:", {
          payrollId,
          employeeId,
        });
        const response = await api.get(
          `/payroll/payslips/${payrollId}/download/${employeeId}`,
          {
            responseType: "blob",
          }
        );
        console.log(
          "✅ [payrollAPI] Download payslip response:",
          response.data
        );
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error downloading payslip:", error);
        throw error;
      }
    },

    resendPayslip: async (payrollId, employeeId) => {
      try {
        console.log("📋 [payrollAPI] Resending payslip:", {
          payrollId,
          employeeId,
        });
        const response = await api.post(
          `/payroll/payslips/${payrollId}/resend/${employeeId}`
        );
        console.log("✅ [payrollAPI] Resend payslip response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ [payrollAPI] Error resending payslip:", error);
        throw error;
      }
    },

    getPersonalPayslips: async (filters = {}) => {
      try {
        const params = new URLSearchParams();
        if (filters.month && filters.month !== "all")
          params.append("month", filters.month);
        if (filters.year && filters.year !== "all")
          params.append("year", filters.year);

        const response = await api.get(
          `/payroll/personal-payslips?${params.toString()}`
        );
        return response.data;
      } catch (error) {
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
      BuildingOfficeIcon: "FaBuilding",
      BuildingOffice2Icon: "FaBuilding",
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
