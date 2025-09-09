import api from "./api";

// Get all tasks
export const fetchTasks = async (params = {}) => {
  try {
    const response = await api.get("/tasks", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

// Get task statistics
export const fetchTaskStats = async () => {
  try {
    const response = await api.get("/tasks/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching task stats:", error);
    throw error;
  }
};

// Get overdue tasks
export const fetchOverdueTasks = async () => {
  try {
    const response = await api.get("/tasks/overdue");
    return response.data;
  } catch (error) {
    console.error("Error fetching overdue tasks:", error);
    throw error;
  }
};

// Get task by ID
export const getTaskById = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching task:", error);
    throw error;
  }
};

// Create new task
export const createTask = async (taskData) => {
  try {
    const response = await api.post("/tasks", taskData);
    return response.data;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

// Update task
export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

// Delete task
export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// Add comment to task
export const addTaskComment = async (taskId, commentData) => {
  try {
    const response = await api.post(`/tasks/${taskId}/comments`, commentData);
    return response.data;
  } catch (error) {
    console.error("Error adding task comment:", error);
    throw error;
  }
};

// Add checklist item to task
export const addChecklistItem = async (taskId, itemData) => {
  try {
    const response = await api.post(`/tasks/${taskId}/checklist`, itemData);
    return response.data;
  } catch (error) {
    console.error("Error adding checklist item:", error);
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

// Get tasks by project ID
export const fetchProjectTasks = async (projectId) => {
  try {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    throw error;
  }
};

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await api.put(`/tasks/${taskId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};
