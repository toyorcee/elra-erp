import api from "./api";

// Get all projects
export const fetchProjects = async (params = {}) => {
  try {
    const response = await api.get("/projects", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// Get my projects
export const fetchMyProjects = async () => {
  try {
    const response = await api.get("/projects/my-projects");
    return response.data;
  } catch (error) {
    console.error("Error fetching my projects:", error);
    throw error;
  }
};

// Get project statistics
export const fetchProjectStats = async () => {
  try {
    const response = await api.get("/projects/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching project stats:", error);
    throw error;
  }
};

// Get comprehensive project data (SUPER_ADMIN only)
export const fetchComprehensiveProjectData = async () => {
  try {
    const response = await api.get("/projects/comprehensive");
    return response.data;
  } catch (error) {
    console.error("Error fetching comprehensive project data:", error);
    throw error;
  }
};

// Get projects available for team assignment (SUPER_ADMIN only)
export const fetchProjectsAvailableForTeams = async () => {
  try {
    const response = await api.get("/projects/available-for-teams");
    return response.data;
  } catch (error) {
    console.error("Error fetching available projects for teams:", error);
    throw error;
  }
};

// Get next project code
export const getNextProjectCode = async () => {
  try {
    const response = await api.get("/projects/next-code");
    return response.data;
  } catch (error) {
    console.error("Error fetching next project code:", error);
    throw error;
  }
};

// Get next external project code
export const getNextExternalProjectCode = async () => {
  try {
    const response = await api.get("/projects/next-external-code");
    return response.data;
  } catch (error) {
    console.error("Error fetching next external project code:", error);
    throw error;
  }
};

// Get project by ID
export const getProjectById = async (id) => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

// Get projects needing inventory workflow (Operations HOD only)
export const getProjectsNeedingInventory = async () => {
  try {
    const response = await api.get("/projects/inventory-workflow");
    return response.data;
  } catch (error) {
    console.error("Error fetching projects needing inventory:", error);
    throw error;
  }
};

// Create new project
export const createProject = async (projectData) => {
  try {
    const response = await api.post("/projects", projectData);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// Update project
export const updateProject = async (id, projectData) => {
  try {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

// Delete project
export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// Add team member to project
export const addTeamMember = async (projectId, teamMemberData) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/team`,
      teamMemberData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding team member:", error);
    throw error;
  }
};

// Remove team member from project
export const removeTeamMember = async (projectId, userId) => {
  try {
    const response = await api.delete(`/projects/${projectId}/team/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing team member:", error);
    throw error;
  }
};

// Add note to project
export const addProjectNote = async (projectId, noteData) => {
  try {
    const response = await api.post(`/projects/${projectId}/notes`, noteData);
    return response.data;
  } catch (error) {
    console.error("Error adding project note:", error);
    throw error;
  }
};

// Get projects pending approval
export const fetchPendingProjectApprovals = async () => {
  try {
    const response = await api.get("/projects/pending-approval");
    return response.data;
  } catch (error) {
    console.error("Error fetching pending project approvals:", error);
    throw error;
  }
};

// Get department-specific projects pending approval (HOD+ only)
export const fetchDepartmentPendingApprovalProjects = async () => {
  try {
    const response = await api.get("/projects/department-pending-approval");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching department pending approval projects:",
      error
    );
    throw error;
  }
};

// Get projects pending Project Management HOD approval (Project Management HOD only)
export const fetchProjectManagementPendingApprovalProjects = async () => {
  try {
    const response = await api.get(
      "/projects/project-management-pending-approval"
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching project management pending approval projects:",
      error
    );
    throw error;
  }
};

// Get HOD approval history (HOD+ only)
export const fetchHODApprovalHistory = async () => {
  try {
    const response = await api.get("/projects/approval-history");
    return response.data;
  } catch (error) {
    console.error("Error fetching HOD approval history:", error);
    throw error;
  }
};

// Get cross-departmental approval history (for Project Management HOD)
export const fetchCrossDepartmentalApprovalHistory = async () => {
  try {
    const response = await api.get(
      "/projects/cross-departmental-approval-history"
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching cross-departmental approval history:", error);
    throw error;
  }
};

// Get project approval reports for approvers
export const getProjectApprovalReports = async (params = {}) => {
  try {
    const response = await api.get("/projects/approval-reports", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching project approval reports:", error);
    throw error;
  }
};

// Approve project
export const approveProject = async (projectId, approvalData) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/approve`,
      approvalData
    );
    return response.data;
  } catch (error) {
    console.error("Error approving project:", error);
    throw error;
  }
};

// Legal approve project with compliance program
export const legalApproveProject = async (projectId, approvalData) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/legal-approve`,
      approvalData
    );
    return response.data;
  } catch (error) {
    console.error("Error legally approving project:", error);
    throw error;
  }
};

// Reject project
export const rejectProject = async (projectId, rejectionData) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/reject`,
      rejectionData
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting project:", error);
    throw error;
  }
};

export const resubmitProject = async (projectId) => {
  try {
    const response = await api.post(`/projects/${projectId}/resubmit`);
    return response.data;
  } catch (error) {
    console.error("Error resubmitting project:", error);
    throw error;
  }
};

// ============================================================================
// TEAM MEMBER APIs (New TeamMember Model)
// ============================================================================

// Get all team members (with role-based filtering)
export const fetchAllTeamMembers = async (params = {}) => {
  try {
    const response = await api.get("/team-members", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }
};

// Get team members by project
export const fetchTeamMembersByProject = async (projectId, params = {}) => {
  try {
    const response = await api.get(`/team-members/project/${projectId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching project team members:", error);
    throw error;
  }
};

// Get available users for team assignment
export const fetchAvailableUsers = async (projectId, params = {}) => {
  try {
    const response = await api.get(`/team-members/available/${projectId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching available users:", error);
    throw error;
  }
};

// Add team member to project (New API)
export const addTeamMemberNew = async (teamMemberData) => {
  try {
    const response = await api.post("/team-members", teamMemberData);
    return response.data;
  } catch (error) {
    console.error("Error adding team member:", error);
    throw error;
  }
};

// Update team member
export const updateTeamMember = async (teamMemberId, updateData) => {
  try {
    const response = await api.put(`/team-members/${teamMemberId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating team member:", error);
    throw error;
  }
};

// Remove team member from project (New API)
export const removeTeamMemberNew = async (teamMemberId) => {
  try {
    const response = await api.delete(`/team-members/${teamMemberId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing team member:", error);
    throw error;
  }
};

// ============================================================================
// ANALYTICS API
// ============================================================================

// Get project analytics for dashboard
export const fetchProjectAnalytics = async () => {
  try {
    const response = await api.get("/projects/analytics");
    return response.data;
  } catch (error) {
    console.error("Error fetching project analytics:", error);
    throw error;
  }
};

// Get project dashboard data
export const getProjectDashboard = async () => {
  try {
    const response = await api.get("/projects/dashboard");
    return response.data;
  } catch (error) {
    console.error("Error fetching project dashboard data:", error);
    throw error;
  }
};

// Get project budget info
export const getProjectBudget = async () => {
  try {
    const response = await api.get("/projects/budget");
    return response.data;
  } catch (error) {
    console.error("Error fetching project budget:", error);
    throw error;
  }
};

// Get regulatory compliance status for a project
export const getRegulatoryComplianceStatus = async (projectId) => {
  try {
    const response = await api.get(
      `/projects/${projectId}/regulatory-compliance`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching regulatory compliance status:", error);
    throw error;
  }
};

// Complete regulatory compliance for a project
export const completeRegulatoryCompliance = async (
  projectId,
  complianceData
) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/complete-regulatory-compliance`,
      {
        complianceData,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error completing regulatory compliance:", error);
    throw error;
  }
};

// ============================================================================
// WORKFLOW COMPLETION API
// ============================================================================

// Mark inventory as completed (Operations HOD)
export const completeInventory = async (projectId) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/complete-inventory`
    );
    return response.data;
  } catch (error) {
    console.error("Error completing inventory:", error);
    throw error;
  }
};

// Mark procurement as completed (Procurement HOD)
export const completeProcurement = async (projectId) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/complete-procurement`
    );
    return response.data;
  } catch (error) {
    console.error("Error completing procurement:", error);
    throw error;
  }
};

// Get workflow status for a project
export const getWorkflowStatus = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/workflow-status`);
    return response.data;
  } catch (error) {
    console.error("Error fetching workflow status:", error);
    throw error;
  }
};

// Get project categories
export const fetchProjectCategories = async () => {
  try {
    const response = await api.get("/projects/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching project categories:", error);
    throw error;
  }
};

export const addVendorToProject = async (projectId, vendorData) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/add-vendor`,
      vendorData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding vendor to project:", error);
    throw error;
  }
};

export const exportProjectApprovalReport = async (format, params = {}) => {
  try {
    const response = await api.get("/projects/approval-reports/export", {
      params: {
        format,
        ...params,
      },
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Set filename based on format
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `project-approval-reports-${timestamp}.${format.toLowerCase()}`;
    link.setAttribute("download", filename);

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  } catch (error) {
    console.error("Error exporting project approval report:", error);
    throw error;
  }
};

// Download project certificate
export const downloadProjectCertificate = async (projectId, projectCode) => {
  try {
    const response = await api.get(`/projects/${projectId}/certificate`, {
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ELRA-Certificate-${projectCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  } catch (error) {
    console.error("Error downloading project certificate:", error);
    throw error;
  }
};
