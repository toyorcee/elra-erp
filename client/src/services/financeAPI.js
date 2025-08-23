import api from "./api";

// Get all financial transactions
export const fetchTransactions = async (params = {}) => {
  try {
    const response = await api.get("/finance/transactions", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

// Create new transaction
export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post("/finance/transactions", transactionData);
    return response.data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

// Update transaction
export const updateTransaction = async (id, transactionData) => {
  try {
    const response = await api.put(
      `/finance/transactions/${id}`,
      transactionData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

// Delete transaction
export const deleteTransaction = async (id) => {
  try {
    const response = await api.delete(`/finance/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

// Get all finance transactions
export const fetchFinance = async (params = {}) => {
  try {
    const response = await api.get("/finance", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching finance:", error);
    throw error;
  }
};

// Get financial statistics
export const fetchFinancialStats = async () => {
  try {
    const response = await api.get("/finance/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    throw error;
  }
};

// Get revenue statistics
export const fetchRevenueStats = async () => {
  try {
    const response = await api.get("/finance/revenue-stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    throw error;
  }
};

// Get expense statistics
export const fetchExpenseStats = async () => {
  try {
    const response = await api.get("/finance/expense-stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching expense stats:", error);
    throw error;
  }
};

// Get overdue transactions
export const fetchOverdueTransactions = async () => {
  try {
    const response = await api.get("/finance/overdue");
    return response.data;
  } catch (error) {
    console.error("Error fetching overdue transactions:", error);
    throw error;
  }
};

// Get pending approvals
export const fetchPendingApprovals = async () => {
  try {
    const response = await api.get("/finance/pending-approvals");
    return response.data;
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    throw error;
  }
};

// Get finance transaction by ID
export const getFinanceById = async (id) => {
  try {
    const response = await api.get(`/finance/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching finance transaction:", error);
    throw error;
  }
};

// Create new finance transaction
export const createFinance = async (financeData) => {
  try {
    const response = await api.post("/finance", financeData);
    return response.data;
  } catch (error) {
    console.error("Error creating finance transaction:", error);
    throw error;
  }
};

// Update finance transaction
export const updateFinance = async (id, financeData) => {
  try {
    const response = await api.put(`/finance/${id}`, financeData);
    return response.data;
  } catch (error) {
    console.error("Error updating finance transaction:", error);
    throw error;
  }
};

// Delete finance transaction
export const deleteFinance = async (id) => {
  try {
    const response = await api.delete(`/finance/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting finance transaction:", error);
    throw error;
  }
};

// Approve finance transaction
export const approveFinance = async (id, approvalData) => {
  try {
    const response = await api.post(`/finance/${id}/approve`, approvalData);
    return response.data;
  } catch (error) {
    console.error("Error approving finance transaction:", error);
    throw error;
  }
};

// Add payment to finance transaction
export const addPayment = async (id, paymentData) => {
  try {
    const response = await api.post(`/finance/${id}/payments`, paymentData);
    return response.data;
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

// Add note to finance transaction
export const addFinanceNote = async (id, noteData) => {
  try {
    const response = await api.post(`/finance/${id}/notes`, noteData);
    return response.data;
  } catch (error) {
    console.error("Error adding finance note:", error);
    throw error;
  }
};
