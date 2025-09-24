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

// ===== ELRA WALLET API =====

// Get ELRA wallet overview
export const getELRAWallet = async () => {
  try {
    const response = await api.get("/elra-wallet");
    return response.data;
  } catch (error) {
    console.error("Error fetching ELRA wallet:", error);
    throw error;
  }
};

// Add funds to ELRA wallet
export const addFundsToWallet = async (fundsData) => {
  try {
    const response = await api.post("/elra-wallet/add-funds", fundsData);
    return response.data;
  } catch (error) {
    console.error("Error adding funds to wallet:", error);
    throw error;
  }
};

// Set budget allocation in ELRA wallet
export const setBudgetAllocation = async (budgetData) => {
  try {
    const response = await api.post("/elra-wallet/set-budget", budgetData);
    return response.data;
  } catch (error) {
    console.error("Error setting budget allocation:", error);
    throw error;
  }
};

// Get wallet transaction history
export const getWalletTransactions = async (params = {}) => {
  try {
    const response = await api.get("/elra-wallet/transactions", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    throw error;
  }
};

// Export transaction history as PDF
export const exportTransactionHistoryPDF = async (filters = {}) => {
  try {
    const response = await api.post(
      "/elra-wallet/transactions/export/pdf",
      filters,
      {
        responseType: "blob",
      }
    );

    // Create blob and download
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `transaction_history_${timestamp}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "PDF exported successfully" };
  } catch (error) {
    console.error("Error exporting transaction history PDF:", error);
    throw error;
  }
};

// Export transaction history as Word/HTML
export const exportTransactionHistoryWord = async (filters = {}) => {
  try {
    const response = await api.post(
      "/elra-wallet/transactions/export/word",
      filters,
      {
        responseType: "blob",
      }
    );

    // Create blob and download
    const blob = new Blob([response.data], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `transaction_history_${timestamp}.html`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Word report exported successfully" };
  } catch (error) {
    console.error("Error exporting transaction history Word report:", error);
    throw error;
  }
};

// Export transaction history as CSV
export const exportTransactionHistoryCSV = async (filters = {}) => {
  try {
    const response = await api.post(
      "/elra-wallet/transactions/export/csv",
      filters,
      {
        responseType: "blob",
      }
    );

    // Create blob and download
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `transaction_history_${timestamp}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "CSV report exported successfully" };
  } catch (error) {
    console.error("Error exporting transaction history CSV report:", error);
    throw error;
  }
};

// Get wallet allocations
export const getWalletAllocations = async (params = {}) => {
  try {
    const response = await api.get("/elra-wallet/allocations", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching wallet allocations:", error);
    throw error;
  }
};

// Get financial reports
export const getFinancialReports = async (params = {}) => {
  try {
    const response = await api.get("/elra-wallet/reports", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    throw error;
  }
};

// Update wallet settings
export const updateWalletSettings = async (settingsData) => {
  try {
    const response = await api.put("/elra-wallet/settings", settingsData);
    return response.data;
  } catch (error) {
    console.error("Error updating wallet settings:", error);
    throw error;
  }
};

// ===== PAYROLL APPROVALS API =====

// Get pending payroll approvals
export const getPendingPayrollApprovals = async () => {
  try {
    const response = await api.get("/payroll/approvals/pending");
    return response.data;
  } catch (error) {
    console.error("Error fetching pending payroll approvals:", error);
    throw error;
  }
};

// Approve payroll
export const approvePayroll = async (approvalId, approvalData = {}) => {
  try {
    const response = await api.post(
      `/payroll/approvals/${approvalId}/approve`,
      approvalData
    );
    return response.data;
  } catch (error) {
    console.error("Error approving payroll:", error);
    throw error;
  }
};

// Reject payroll
export const rejectPayroll = async (approvalId, rejectionData = {}) => {
  try {
    const response = await api.post(
      `/payroll/approvals/${approvalId}/reject`,
      rejectionData
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting payroll:", error);
    throw error;
  }
};

// ===== SALES & MARKETING APPROVALS API =====

// Get Sales & Marketing pending approvals (Finance HOD only)
export const getSalesMarketingApprovals = async () => {
  try {
    const response = await api.get(
      "/finance/sales-marketing/pending-approvals"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching Sales & Marketing pending approvals:", error);
    throw error;
  }
};

// Get Sales & Marketing approval history (Finance HOD only)
export const getSalesMarketingApprovalHistory = async () => {
  try {
    const response = await api.get("/finance/sales-marketing/approval-history");
    return response.data;
  } catch (error) {
    console.error("Error fetching Sales & Marketing approval history:", error);
    throw error;
  }
};

// Approve Sales & Marketing transaction (Finance HOD only)
export const approveSalesMarketingTransaction = async (transactionId, data) => {
  try {
    const response = await api.post(
      `/finance/sales-marketing/${transactionId}/approve`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error approving Sales & Marketing transaction:", error);
    throw error;
  }
};

// Reject Sales & Marketing transaction (Finance HOD only)
export const rejectSalesMarketingTransaction = async (transactionId, data) => {
  try {
    const response = await api.post(
      `/finance/sales-marketing/${transactionId}/reject`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting Sales & Marketing transaction:", error);
    throw error;
  }
};

// ===== FINANCIAL REPORTS API =====

// Get comprehensive financial reports
export const getFinancialReportsData = async (params = {}) => {
  try {
    const response = await api.get("/finance/reports/comprehensive", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    throw error;
  }
};

// Get financial trends and projections
export const getFinancialTrends = async (params = {}) => {
  try {
    const response = await api.get("/finance/reports/trends", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching financial trends:", error);
    throw error;
  }
};

// Get budget performance data
export const getBudgetPerformance = async (params = {}) => {
  try {
    const response = await api.get("/finance/reports/budget-performance", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching budget performance:", error);
    throw error;
  }
};

// Get financial KPIs
export const getFinancialKPIs = async (params = {}) => {
  try {
    const response = await api.get("/finance/reports/kpis", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching financial KPIs:", error);
    throw error;
  }
};

// Get financial alerts
export const getFinancialAlerts = async (params = {}) => {
  try {
    const response = await api.get("/finance/reports/alerts", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching financial alerts:", error);
    throw error;
  }
};

// Export financial reports as PDF
export const exportFinancialReportsPDF = async (params = {}) => {
  try {
    const response = await api.post("/finance/reports/export/pdf", params, {
      responseType: "blob",
    });

    // Create blob and download
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `financial_reports_${timestamp}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "Financial reports PDF exported successfully",
    };
  } catch (error) {
    console.error("Error exporting financial reports PDF:", error);
    throw error;
  }
};

// Export financial reports as Word/HTML
export const exportFinancialReportsWord = async (params = {}) => {
  try {
    const response = await api.post("/finance/reports/export/word", params, {
      responseType: "blob",
    });

    // Create blob and download
    const blob = new Blob([response.data], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `financial_reports_${timestamp}.html`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "Financial reports Word document exported successfully",
    };
  } catch (error) {
    console.error("Error exporting financial reports Word document:", error);
    throw error;
  }
};

// Export financial reports as CSV
export const exportFinancialReportsCSV = async (params = {}) => {
  try {
    const response = await api.post("/finance/reports/export/csv", params, {
      responseType: "blob",
    });

    // Create blob and download
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `financial_reports_${timestamp}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "Financial reports CSV exported successfully",
    };
  } catch (error) {
    console.error("Error exporting financial reports CSV:", error);
    throw error;
  }
};
