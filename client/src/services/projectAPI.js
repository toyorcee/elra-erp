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
