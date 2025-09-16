import api from "./api";

// ===== DASHBOARD API =====
export const getSalesMarketingDashboard = async () => {
  try {
    const response = await api.get("/sales-marketing/dashboard");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

// ===== TRANSACTIONS API =====
export const createSalesMarketingTransaction = async (transactionData) => {
  try {
    const response = await api.post(
      "/sales-marketing/transactions",
      transactionData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const getSalesMarketingTransactions = async (params = {}) => {
  try {
    const response = await api.get("/sales-marketing/transactions", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export const getSalesMarketingTransactionById = async (transactionId) => {
  try {
    const response = await api.get(
      `/sales-marketing/transactions/${transactionId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

export const updateSalesMarketingTransaction = async (
  transactionId,
  updateData
) => {
  try {
    const response = await api.put(
      `/sales-marketing/transactions/${transactionId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteSalesMarketingTransaction = async (transactionId) => {
  try {
    const response = await api.delete(
      `/sales-marketing/transactions/${transactionId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

// ===== APPROVALS API =====
export const getSalesMarketingApprovals = async (params = {}) => {
  try {
    const response = await api.get("/sales-marketing/approvals", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching approvals:", error);
    throw error;
  }
};

export const approveSalesMarketingTransaction = async (
  transactionId,
  approvalData = {}
) => {
  try {
    const response = await api.post(
      `/sales-marketing/transactions/${transactionId}/approve`,
      approvalData
    );
    return response.data;
  } catch (error) {
    console.error("Error approving transaction:", error);
    throw error;
  }
};

export const rejectSalesMarketingTransaction = async (
  transactionId,
  rejectionData = {}
) => {
  try {
    const response = await api.post(
      `/sales-marketing/transactions/${transactionId}/reject`,
      rejectionData
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting transaction:", error);
    throw error;
  }
};

export const processSalesMarketingPayment = async (
  transactionId,
  paymentData = {}
) => {
  try {
    const response = await api.post(
      `/sales-marketing/transactions/${transactionId}/process-payment`,
      paymentData
    );
    return response.data;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

export const processSalesMarketingReceipt = async (
  transactionId,
  receiptData = {}
) => {
  try {
    const response = await api.post(
      `/sales-marketing/transactions/${transactionId}/process-receipt`,
      receiptData
    );
    return response.data;
  } catch (error) {
    console.error("Error processing receipt:", error);
    throw error;
  }
};

// ===== REPORTS API =====
export const getSalesMarketingReports = async (params = {}) => {
  try {
    const response = await api.get("/sales-marketing/reports", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

export const getSalesMarketingAnalytics = async (params = {}) => {
  try {
    const response = await api.get("/sales-marketing/analytics", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};

export const exportSalesMarketingReport = async (format, params = {}) => {
  try {
    const response = await api.get(
      `/sales-marketing/reports/export/${format}`,
      {
        params,
        responseType: "blob", // For file downloads
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error exporting report:", error);
    throw error;
  }
};

// ===== STATS API =====
export const getSalesMarketingStats = async (params = {}) => {
  try {
    const response = await api.get("/sales-marketing/stats", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
};

// ===== CATEGORIES API =====
export const getSalesCategories = async () => {
  try {
    const response = await api.get("/sales-marketing/categories/sales");
    return response.data;
  } catch (error) {
    console.error("Error fetching sales categories:", error);
    throw error;
  }
};

export const getMarketingCategories = async () => {
  try {
    const response = await api.get("/sales-marketing/categories/marketing");
    return response.data;
  } catch (error) {
    console.error("Error fetching marketing categories:", error);
    throw error;
  }
};

// ===== BUDGET API =====
export const getSalesMarketingBudgetInfo = async () => {
  try {
    const response = await api.get("/sales-marketing/budget");
    return response.data;
  } catch (error) {
    console.error("Error fetching budget info:", error);
    throw error;
  }
};

// ===== NOTIFICATIONS API =====
export const getSalesMarketingNotifications = async (params = {}) => {
  try {
    const response = await api.get("/sales-marketing/notifications", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(
      `/sales-marketing/notifications/${notificationId}/read`
    );
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};
