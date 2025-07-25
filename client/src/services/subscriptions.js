import api from "./api.js";

// Get available subscription plans
export const getSubscriptionPlans = async () => {
  try {
    const response = await api.get("/subscriptions/plans");
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
};

// Initialize subscription payment
export const initializeSubscriptionPayment = async (paymentData) => {
  try {
    const response = await api.post(
      "/subscriptions/initialize-payment",
      paymentData
    );
    return response.data;
  } catch (error) {
    console.error("Error initializing subscription payment:", error);
    throw error;
  }
};

// Verify subscription payment
export const verifySubscriptionPayment = async (verificationData) => {
  try {
    const response = await api.post(
      "/subscriptions/verify-payment",
      verificationData
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying subscription payment:", error);
    throw error;
  }
};

// Get company subscription (Platform Admin only)
export const getCompanySubscription = async (companyId) => {
  try {
    const response = await api.get(`/subscriptions/company/${companyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching company subscription:", error);
    throw error;
  }
};

// Get all subscriptions (Platform Admin only)
export const getAllSubscriptions = async (params = {}) => {
  try {
    const response = await api.get("/subscriptions", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching all subscriptions:", error);
    throw error;
  }
};

// Cancel subscription (Platform Admin only)
export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await api.put(`/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw error;
  }
};

// Get subscription statistics (Platform Admin only)
export const getSubscriptionStatistics = async () => {
  try {
    const response = await api.get("/subscriptions/statistics");
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription statistics:", error);
    throw error;
  }
};

// Create trial subscription (Platform Admin only)
export const createTrialSubscription = async (trialData) => {
  try {
    const response = await api.post("/subscriptions/trial", trialData);
    return response.data;
  } catch (error) {
    console.error("Error creating trial subscription:", error);
    throw error;
  }
};
