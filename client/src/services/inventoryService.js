import api from "./api";

const inventoryService = {
  // Get all inventory items
  getAllInventory: async (params = {}) => {
    try {
      const response = await api.get("/inventory", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching inventory:", error);
      throw error;
    }
  },

  // Get inventory by ID
  getInventoryById: async (id) => {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      throw error;
    }
  },

  // Create new inventory item
  createInventory: async (inventoryData) => {
    try {
      const response = await api.post("/inventory", inventoryData);
      return response.data;
    } catch (error) {
      console.error("Error creating inventory item:", error);
      throw error;
    }
  },

  // Update inventory item
  updateInventory: async (id, inventoryData) => {
    try {
      const response = await api.put(`/inventory/${id}`, inventoryData);
      return response.data;
    } catch (error) {
      console.error("Error updating inventory item:", error);
      throw error;
    }
  },

  // Delete inventory item
  deleteInventory: async (id) => {
    try {
      const response = await api.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      throw error;
    }
  },

  // Get inventory statistics
  getInventoryStats: async () => {
    try {
      const response = await api.get("/inventory/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
      throw error;
    }
  },

  // Get available items
  getAvailableItems: async () => {
    try {
      const response = await api.get("/inventory/available");
      return response.data;
    } catch (error) {
      console.error("Error fetching available items:", error);
      throw error;
    }
  },

  // Get items by type
  getItemsByType: async (type) => {
    try {
      const response = await api.get(`/inventory/type/${type}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching items by type:", error);
      throw error;
    }
  },

  // Get maintenance due items
  getMaintenanceDue: async () => {
    try {
      const response = await api.get("/inventory/maintenance-due");
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance due items:", error);
      throw error;
    }
  },

  // Get equipment categories
  getEquipmentCategories: async () => {
    try {
      const response = await api.get("/inventory/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching equipment categories:", error);
      throw error;
    }
  },

  // Add maintenance record
  addMaintenanceRecord: async (id, maintenanceData) => {
    try {
      const response = await api.post(
        `/inventory/${id}/maintenance`,
        maintenanceData
      );
      return response.data;
    } catch (error) {
      console.error("Error adding maintenance record:", error);
      throw error;
    }
  },

  // Add note to inventory item
  addNote: async (id, noteData) => {
    try {
      const response = await api.post(`/inventory/${id}/notes`, noteData);
      return response.data;
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  },

  // Update inventory status
  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/inventory/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error("Error updating inventory status:", error);
      throw error;
    }
  },

  // Project-specific inventory workflow methods
  getProjectInventoryWorkflow: async (projectId) => {
    try {
      const response = await api.get(
        `/inventory/project/${projectId}/workflow`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching project inventory workflow:", error);
      throw error;
    }
  },

  createProjectEquipment: async (projectId, equipmentData) => {
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
  },

  allocateProjectBudget: async (projectId, budgetData) => {
    try {
      const response = await api.post(
        `/inventory/project/${projectId}/budget`,
        budgetData
      );
      return response.data;
    } catch (error) {
      console.error("Error allocating project budget:", error);
      throw error;
    }
  },

  assignProjectLocations: async (projectId, locationData) => {
    try {
      const response = await api.post(
        `/inventory/project/${projectId}/locations`,
        locationData
      );
      return response.data;
    } catch (error) {
      console.error("Error assigning project locations:", error);
      throw error;
    }
  },

  completeProjectInventory: async (projectId) => {
    try {
      const response = await api.post(
        `/inventory/project/${projectId}/complete`
      );
      return response.data;
    } catch (error) {
      console.error("Error completing project inventory:", error);
      throw error;
    }
  },

  // Resend inventory completion notifications
  resendNotifications: async (inventoryId) => {
    try {
      const response = await api.post(
        `/inventory/${inventoryId}/resend-notifications`
      );
      return response.data;
    } catch (error) {
      console.error("Error resending notifications:", error);
      throw error;
    }
  },

  // Export inventory reports
  exportInventoryReport: async (params = {}) => {
    try {
      const response = await api.get("/inventory/reports/export", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting inventory report:", error);
      throw error;
    }
  },
};

export default inventoryService;
