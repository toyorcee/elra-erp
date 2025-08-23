import api from "./api";

// ============================================================================
// APPROVAL APIs
// ============================================================================

// Create new approval request
export const createApproval = async (approvalData) => {
  try {
    const response = await api.post("/approvals", approvalData);
    return response.data;
  } catch (error) {
    console.error("Error creating approval:", error);
    throw error;
  }
};

// Get all approvals (with role-based filtering)
export const fetchAllApprovals = async (params = {}) => {
  try {
    const response = await api.get("/approvals", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching approvals:", error);
    throw error;
  }
};

// Get approval by ID
export const fetchApprovalById = async (id) => {
  try {
    const response = await api.get(`/approvals/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching approval:", error);
    throw error;
  }
};

// Take approval action (approve/reject)
export const takeApprovalAction = async (id, action, comments = "") => {
  try {
    const response = await api.put(`/approvals/${id}/action`, {
      action,
      comments,
    });
    return response.data;
  } catch (error) {
    console.error("Error taking approval action:", error);
    throw error;
  }
};

// Add comment to approval
export const addApprovalComment = async (id, content, isInternal = false) => {
  try {
    const response = await api.post(`/approvals/${id}/comments`, {
      content,
      isInternal,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding approval comment:", error);
    throw error;
  }
};

// Get approvals pending user's action
export const fetchPendingApprovals = async () => {
  try {
    const response = await api.get("/approvals/pending");
    return response.data;
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    throw error;
  }
};

// Get approval statistics
export const fetchApprovalStats = async (params = {}) => {
  try {
    const response = await api.get("/approvals/stats", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching approval stats:", error);
    throw error;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get approval type display name
export const getApprovalTypeDisplayName = (type) => {
  const typeMap = {
    lease_application: "Lease Application",
    credit_risk_assessment: "Credit Risk Assessment",
    asset_acquisition: "Asset Acquisition",
    client_onboarding: "Client Onboarding",
    contract_modification: "Contract Modification",
    budget_allocation: "Budget Allocation",
    project_creation: "Project Creation",
    team_assignment: "Team Assignment",
  };
  return typeMap[type] || type;
};

// Get department level display name (Leasing Company Context)
export const getDepartmentLevelDisplayName = (level) => {
  const levelMap = {
    100: "Executive Office (Board/CEO)",
    90: "Human Resources (Risk Management)",
    85: "Information Technology (Credit & Underwriting)",
    80: "Finance & Accounting (Finance & Treasury)",
    75: "Operations (Asset Management)",
    70: "Sales & Marketing (Business Development)",
    65: "Customer Service (Client Services)",
    60: "Legal & Compliance (Legal & Documentation)",
    50: "System Administration (IT Support)",
  };
  return levelMap[level] || `Level ${level}`;
};

// Get priority display name and color
export const getPriorityDisplay = (priority) => {
  const priorityMap = {
    low: { name: "Low", color: "text-gray-600", bgColor: "bg-gray-100" },
    medium: { name: "Medium", color: "text-blue-600", bgColor: "bg-blue-100" },
    high: { name: "High", color: "text-orange-600", bgColor: "bg-orange-100" },
    urgent: { name: "Urgent", color: "text-red-600", bgColor: "bg-red-100" },
    critical: {
      name: "Critical",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  };
  return priorityMap[priority] || priorityMap.medium;
};

// Get status display name and color
export const getStatusDisplay = (status) => {
  const statusMap = {
    pending: {
      name: "Pending",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    under_review: {
      name: "Under Review",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    approved: {
      name: "Approved",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    rejected: {
      name: "Rejected",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    cancelled: {
      name: "Cancelled",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  };
  return statusMap[status] || statusMap.pending;
};

// Format currency amount
export const formatCurrency = (amount, currency = "NGN") => {
  if (!amount) return "₦0";

  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};

// Check if approval is overdue
export const isApprovalOverdue = (dueDate) => {
  return new Date(dueDate) < new Date();
};

// Get approval progress percentage
export const getApprovalProgress = (approval) => {
  if (!approval.approvalChain || approval.approvalChain.length === 0) return 0;

  const approvedLevels = approval.approvalChain.filter(
    (level) => level.status === "approved"
  ).length;
  const totalLevels = approval.approvalChain.length;

  return Math.round((approvedLevels / totalLevels) * 100);
};

// Get current approver
export const getCurrentApprover = (approval) => {
  if (!approval.approvalChain) return null;

  const currentApproval = approval.approvalChain.find(
    (level) => level.level === approval.currentLevel
  );
  return currentApproval ? currentApproval.approver : null;
};

// Check if user can take action on approval
export const canTakeAction = (approval, userId) => {
  const currentApprover = getCurrentApprover(approval);
  return currentApprover && currentApprover._id === userId;
};

// Get approval chain display
export const getApprovalChainDisplay = (approval) => {
  if (!approval.approvalChain) return [];

  return approval.approvalChain.map((level) => ({
    level: level.level,
    role: level.role,
    approver: level.approver,
    status: level.status,
    comments: level.comments,
    approvedAt: level.approvedAt,
    isCurrent: level.level === approval.currentLevel,
  }));
};
