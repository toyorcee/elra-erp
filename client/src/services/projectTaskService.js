import api from "./api";

// Create base tasks for personal project implementation
export const createPersonalProjectTasks = async (projectId) => {
  try {
    const response = await api.post(`/tasks/personal/${projectId}`);
    return response.data;
  } catch (error) {
    console.error("Error creating personal project tasks:", error);
    throw error;
  }
};

// Get all tasks for a project
export const getProjectTasks = async (projectId) => {
  try {
    const response = await api.get(`/tasks?project=${projectId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    throw error;
  }
};

// Get personal project tasks
export const getPersonalProjectTasks = async (projectId) => {
  try {
    const response = await api.get(
      `/tasks?project=${projectId}&projectType=personal`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching personal project tasks:", error);
    throw error;
  }
};

// Update task progress
export const updateTaskProgress = async (taskId, progress, status) => {
  try {
    const response = await api.put(`/tasks/${taskId}`, {
      progress,
      status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating task progress:", error);
    throw error;
  }
};

// Complete checklist item
export const completeChecklistItem = async (taskId, itemIndex) => {
  try {
    const response = await api.put(
      `/tasks/${taskId}/checklist/${itemIndex}/complete`
    );
    return response.data;
  } catch (error) {
    console.error("Error completing checklist item:", error);
    throw error;
  }
};

// Add comment to task
export const addTaskComment = async (taskId, content, isPrivate = false) => {
  try {
    const response = await api.post(`/tasks/${taskId}/comments`, {
      content,
      isPrivate,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding task comment:", error);
    throw error;
  }
};

// Get task statistics
export const getTaskStats = async (projectId = null) => {
  try {
    const url = projectId
      ? `/tasks/stats?projectId=${projectId}`
      : `/tasks/stats`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching task stats:", error);
    throw error;
  }
};

// Get overdue tasks
export const getOverdueTasks = async () => {
  try {
    const response = await api.get(`/tasks/overdue`);
    return response.data;
  } catch (error) {
    console.error("Error fetching overdue tasks:", error);
    throw error;
  }
};

// Get my project tasks (user-specific tasks with optional project filter)
export const getMyProjectTasks = async (projectId = null) => {
  try {
    const url = projectId 
      ? `/projects/my-tasks?projectId=${projectId}`
      : `/projects/my-tasks`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching my project tasks:", error);
    throw error;
  }
};