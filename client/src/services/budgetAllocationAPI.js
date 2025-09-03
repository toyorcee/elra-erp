import api from "./api";

/**
 * Budget Allocation API Service
 * Handles all budget allocation operations from the frontend
 */

// Create a new budget allocation
export const createBudgetAllocation = async (allocationData) => {
  try {
    const response = await api.post("/budget-allocations", allocationData);
    return response.data;
  } catch (error) {
    console.error("Error creating budget allocation:", error);
    throw error;
  }
};

// Get all budget allocations with filters
export const getBudgetAllocations = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/budget-allocations?${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching budget allocations:", error);
    throw error;
  }
};

// Get budget allocation by ID
export const getBudgetAllocationById = async (id) => {
  try {
    const response = await api.get(`/budget-allocations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching budget allocation:", error);
    throw error;
  }
};

// Approve budget allocation
export const approveBudgetAllocation = async (id, comments = "") => {
  try {
    const response = await api.put(`/budget-allocations/${id}/approve`, {
      comments,
    });
    return response.data;
  } catch (error) {
    console.error("Error approving budget allocation:", error);
    throw error;
  }
};

// Reject budget allocation
export const rejectBudgetAllocation = async (id, reason = "") => {
  try {
    const response = await api.put(`/budget-allocations/${id}/reject`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error("Error rejecting budget allocation:", error);
    throw error;
  }
};

// Get budget allocation statistics
export const getBudgetAllocationStats = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/budget-allocations/stats?${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching budget allocation stats:", error);
    throw error;
  }
};

// Get projects that need budget allocation
export const getProjectsNeedingBudgetAllocation = async () => {
  try {
    const response = await api.get(
      "/budget-allocations/projects-needing-allocation"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching projects needing budget allocation:", error);
    throw error;
  }
};
