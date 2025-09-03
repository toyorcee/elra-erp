import api from "./api";

// Get all purchase orders with project details
export const fetchPurchaseOrders = async (params = {}) => {
  try {
    const response = await api.get("/procurement", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    throw error;
  }
};

// Get procurement statistics
export const fetchProcurementStats = async () => {
  try {
    const response = await api.get("/procurement/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching procurement stats:", error);
    throw error;
  }
};

// Get pending approvals
export const fetchPendingApprovals = async () => {
  try {
    const response = await api.get("/procurement/pending-approvals");
    return response.data;
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    throw error;
  }
};

// Get overdue deliveries
export const fetchOverdueDeliveries = async () => {
  try {
    const response = await api.get("/procurement/overdue-deliveries");
    return response.data;
  } catch (error) {
    console.error("Error fetching overdue deliveries:", error);
    throw error;
  }
};

// Get procurement by ID
export const getProcurementById = async (id) => {
  try {
    const response = await api.get(`/procurement/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching procurement:", error);
    throw error;
  }
};

// Create new procurement order
export const createProcurement = async (procurementData) => {
  try {
    const response = await api.post("/procurement", procurementData);
    return response.data;
  } catch (error) {
    console.error("Error creating procurement:", error);
    throw error;
  }
};

// Update procurement order
export const updateProcurement = async (id, procurementData) => {
  try {
    const response = await api.put(`/procurement/${id}`, procurementData);
    return response.data;
  } catch (error) {
    console.error("Error updating procurement:", error);
    throw error;
  }
};

// Update procurement status
export const updateProcurementStatus = async (id, status) => {
  try {
    const response = await api.patch(`/procurement/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating procurement status:", error);
    throw error;
  }
};

// Delete procurement order
export const deleteProcurement = async (id) => {
  try {
    const response = await api.delete(`/procurement/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting procurement:", error);
    throw error;
  }
};

// Approve procurement order
export const approveProcurement = async (id, approvalData) => {
  try {
    const response = await api.post(`/procurement/${id}/approve`, approvalData);
    return response.data;
  } catch (error) {
    console.error("Error approving procurement:", error);
    throw error;
  }
};

// Receive items for procurement order
export const receiveItems = async (id, receiptData) => {
  try {
    const response = await api.post(`/procurement/${id}/receive`, receiptData);
    return response.data;
  } catch (error) {
    console.error("Error receiving items:", error);
    throw error;
  }
};

// Add note to procurement order
export const addProcurementNote = async (id, noteData) => {
  try {
    const response = await api.post(`/procurement/${id}/notes`, noteData);
    return response.data;
  } catch (error) {
    console.error("Error adding procurement note:", error);
    throw error;
  }
};
