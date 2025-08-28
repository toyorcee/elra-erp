import api from "./api";

// Get all inventory items
export const fetchInventory = async (params = {}) => {
  try {
    const response = await api.get("/inventory", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    throw error;
  }
};

// Get inventory statistics
export const fetchInventoryStats = async () => {
  try {
    const response = await api.get("/inventory/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    throw error;
  }
};

// Get available items
export const fetchAvailableItems = async () => {
  try {
    const response = await api.get("/inventory/available");
    return response.data;
  } catch (error) {
    console.error("Error fetching available items:", error);
    throw error;
  }
};

// Get items by type
export const fetchItemsByType = async (type) => {
  try {
    const response = await api.get(`/inventory/type/${type}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching items by type:", error);
    throw error;
  }
};

// Get maintenance due items
export const fetchMaintenanceDueItems = async () => {
  try {
    const response = await api.get("/inventory/maintenance-due");
    return response.data;
  } catch (error) {
    console.error("Error fetching maintenance due items:", error);
    throw error;
  }
};

// Get inventory item by ID
export const getInventoryById = async (id) => {
  try {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    throw error;
  }
};

// Create new inventory item
export const createInventory = async (inventoryData) => {
  try {
    const dataToSend = {
      ...inventoryData,
      project: inventoryData.project || undefined,
    };
    const response = await api.post("/inventory", dataToSend);
    return response.data;
  } catch (error) {
    console.error("Error creating inventory item:", error);
    throw error;
  }
};

// Update inventory item
export const updateInventory = async (id, inventoryData) => {
  try {
    // Ensure project field is included if present
    const dataToSend = {
      ...inventoryData,
      project: inventoryData.project || undefined,
    };
    const response = await api.put(`/inventory/${id}`, dataToSend);
    return response.data;
  } catch (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }
};

// Delete inventory item
export const deleteInventory = async (id) => {
  try {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }
};

// Add maintenance record
export const addMaintenanceRecord = async (inventoryId, maintenanceData) => {
  try {
    const response = await api.post(
      `/inventory/${inventoryId}/maintenance`,
      maintenanceData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding maintenance record:", error);
    throw error;
  }
};

// Add note to inventory item
export const addInventoryNote = async (inventoryId, noteData) => {
  try {
    const response = await api.post(
      `/inventory/${inventoryId}/notes`,
      noteData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding inventory note:", error);
    throw error;
  }
};

// Update inventory status
export const updateInventoryStatus = async (inventoryId, status) => {
  try {
    const response = await api.patch(`/inventory/${inventoryId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating inventory status:", error);
    throw error;
  }
};

// Get workflow tasks for operations
export const fetchWorkflowTasks = async () => {
  try {
    const response = await api.get("/workflow-tasks/operations");
    return response.data;
  } catch (error) {
    console.error("Error fetching workflow tasks:", error);
    throw error;
  }
};

// ============================================================================
// PROJECT-SPECIFIC INVENTORY WORKFLOW API
// ============================================================================

// Get project inventory workflow data
export const getProjectInventoryWorkflow = async (projectId) => {
  try {
    const response = await api.get(`/inventory/project/${projectId}/workflow`);
    return response.data;
  } catch (error) {
    console.error("Error fetching project inventory workflow:", error);
    throw error;
  }
};

// Create equipment for specific project
export const createProjectEquipment = async (projectId, equipmentData) => {
  try {
    const response = await api.post(
      `/inventory/project/${projectId}/equipment`,
      equipmentData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating project equipment:", error);
    throw error;
  }
};

// Allocate budget for project equipment
export const allocateProjectBudget = async (
  projectId,
  equipmentId,
  allocatedAmount
) => {
  try {
    const response = await api.post(`/inventory/project/${projectId}/budget`, {
      equipmentId,
      allocatedAmount,
    });
    return response.data;
  } catch (error) {
    console.error("Error allocating project budget:", error);
    throw error;
  }
};

// Assign locations for project equipment
export const assignProjectLocations = async (
  projectId,
  equipmentId,
  location,
  specifications
) => {
  try {
    const response = await api.post(
      `/inventory/project/${projectId}/locations`,
      {
        equipmentId,
        location,
        specifications,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error assigning project locations:", error);
    throw error;
  }
};

// Complete project inventory phase
export const completeProjectInventory = async (projectId) => {
  try {
    const response = await api.post(`/inventory/project/${projectId}/complete`);
    return response.data;
  } catch (error) {
    console.error("Error completing project inventory:", error);
    throw error;
  }
};

// Get equipment categories for dropdowns
export const getEquipmentCategories = async () => {
  try {
    const response = await api.get("/inventory/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching equipment categories:", error);
    throw error;
  }
};
