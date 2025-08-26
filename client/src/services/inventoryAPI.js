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
