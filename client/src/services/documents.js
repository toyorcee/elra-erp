import api from "./api";

// Document upload with approval workflow
export const uploadDocument = async (formData) => {
  try {
    const response = await api.post("/api/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user's documents
export const getUserDocuments = async (filters = {}) => {
  try {
    const response = await api.get("/api/documents/my-documents", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document by ID
export const getDocumentById = async (documentId) => {
  try {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update document
export const updateDocument = async (documentId, updateData) => {
  try {
    const response = await api.put(`/api/documents/${documentId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete document
export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/api/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Download document
export const downloadDocument = async (documentId) => {
  try {
    const response = await api.get(`/api/documents/${documentId}/download`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document metadata
export const getDocumentMetadata = async (documentId) => {
  try {
    const response = await api.get(`/api/documents/${documentId}/metadata`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Process OCR for document
export const processOCR = async (documentId) => {
  try {
    const response = await api.post(`/api/documents/${documentId}/ocr`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Search documents
export const searchDocuments = async (searchParams) => {
  try {
    const response = await api.get("/api/documents/search", {
      params: searchParams,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document categories
export const getDocumentCategories = async () => {
  try {
    const response = await api.get("/api/documents/categories");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document types
export const getDocumentTypes = async () => {
  try {
    const response = await api.get("/api/documents/types");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document statistics
export const getDocumentStats = async () => {
  try {
    const response = await api.get("/api/documents/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get pending approvals for documents
export const getPendingDocumentApprovals = async () => {
  try {
    const response = await api.get("/api/documents/pending-approvals");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Approve document
export const approveDocument = async (documentId, comments = "") => {
  try {
    const response = await api.post(`/api/documents/${documentId}/approve`, {
      comments,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Reject document
export const rejectDocument = async (documentId, comments = "") => {
  try {
    const response = await api.post(`/api/documents/${documentId}/reject`, {
      comments,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document approval history
export const getDocumentApprovalHistory = async (documentId) => {
  try {
    const response = await api.get(
      `/api/documents/${documentId}/approval-history`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Share document with users
export const shareDocument = async (documentId, userIds, permissions) => {
  try {
    const response = await api.post(`/api/documents/${documentId}/share`, {
      userIds,
      permissions,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get shared documents
export const getSharedDocuments = async () => {
  try {
    const response = await api.get("/api/documents/shared");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Archive document
export const archiveDocument = async (documentId) => {
  try {
    const response = await api.post(`/api/documents/${documentId}/archive`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Restore archived document
export const restoreDocument = async (documentId) => {
  try {
    const response = await api.post(`/api/documents/${documentId}/restore`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get archived documents
export const getArchivedDocuments = async (filters = {}) => {
  try {
    const response = await api.get("/api/documents/archived", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Bulk operations
export const bulkDeleteDocuments = async (documentIds) => {
  try {
    const response = await api.post("/api/documents/bulk-delete", {
      documentIds,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const bulkArchiveDocuments = async (documentIds) => {
  try {
    const response = await api.post("/api/documents/bulk-archive", {
      documentIds,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const bulkShareDocuments = async (documentIds, userIds, permissions) => {
  try {
    const response = await api.post("/api/documents/bulk-share", {
      documentIds,
      userIds,
      permissions,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Document workflow helpers
export const getDocumentWorkflowStatus = (document) => {
  if (document.status === "APPROVED") return "approved";
  if (document.status === "REJECTED") return "rejected";
  if (document.status === "PENDING_APPROVAL") return "pending";
  if (document.status === "DRAFT") return "draft";
  return "unknown";
};

export const canUserApproveDocument = (user, document) => {
  // Check if user is in the approval chain
  const pendingApproval = document.approvalChain?.find(
    (approval) => approval.status === "PENDING"
  );

  if (!pendingApproval) return false;

  // Check if current user is the next approver
  return pendingApproval.approver === user._id;
};

export const getDocumentStatusColor = (status) => {
  switch (status) {
    case "APPROVED":
      return "text-green-600 bg-green-50";
    case "REJECTED":
      return "text-red-600 bg-red-50";
    case "PENDING_APPROVAL":
      return "text-yellow-600 bg-yellow-50";
    case "DRAFT":
      return "text-gray-600 bg-gray-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIcon = (mimeType) => {
  if (mimeType.includes("pdf")) return "HiDocument";
  if (mimeType.includes("image")) return "HiPhoto";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "HiDocumentText";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "HiTableCells";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
    return "HiPresentationChartLine";
  return "HiDocument";
};
