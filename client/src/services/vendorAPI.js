import api from "./api";

// Get vendor categories
export const fetchVendorCategories = async () => {
  try {
    const response = await api.get("/vendors/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching vendor categories:", error);
    throw error;
  }
};

// Get all approved vendors
export const fetchApprovedVendors = async () => {
  try {
    const response = await api.get("/vendors/approved");
    return response.data;
  } catch (error) {
    console.error("Error fetching approved vendors:", error);
    throw error;
  }
};

// Get vendors by service category
export const fetchVendorsByCategory = async (category) => {
  try {
    const response = await api.get(`/vendors/category/${category}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vendors by category:", error);
    throw error;
  }
};

// Get vendor by ID
export const fetchVendorById = async (vendorId) => {
  try {
    const response = await api.get(`/vendors/${vendorId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vendor:", error);
    throw error;
  }
};

// Create new vendor (HOD+ only)
export const createVendor = async (vendorData) => {
  try {
    const response = await api.post("/vendors", vendorData);
    return response.data;
  } catch (error) {
    console.error("Error creating vendor:", error);
    throw error;
  }
};

// Update vendor (HR HOD only)
export const updateVendor = async (vendorId, vendorData) => {
  try {
    const response = await api.put(`/vendors/${vendorId}`, vendorData);
    return response.data;
  } catch (error) {
    console.error("Error updating vendor:", error);
    throw error;
  }
};

// Approve vendor (HR HOD only)
export const approveVendor = async (vendorId) => {
  try {
    const response = await api.patch(`/vendors/${vendorId}/approve`);
    return response.data;
  } catch (error) {
    console.error("Error approving vendor:", error);
    throw error;
  }
};

// Reject vendor (HR HOD only)
export const rejectVendor = async (vendorId, rejectionReason) => {
  try {
    const response = await api.patch(`/vendors/${vendorId}/reject`, {
      rejectionReason,
    });
    return response.data;
  } catch (error) {
    console.error("Error rejecting vendor:", error);
    throw error;
  }
};

// Get all vendors with filters (HR HOD only)
export const fetchAllVendors = async (filters = {}, page = 1) => {
  try {
    const response = await api.get("/vendors", {
      params: { page, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all vendors:", error);
    throw error;
  }
};

// Get vendor statistics (HR HOD only)
export const fetchVendorStats = async () => {
  try {
    const response = await api.get("/vendors/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching vendor statistics:", error);
    throw error;
  }
};
