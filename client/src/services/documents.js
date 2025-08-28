import api from "./api";

// Document upload with approval workflow
export const uploadDocument = async (formData) => {
  try {
    const response = await api.post("/documents/upload", formData, {
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
    const response = await api.get("/documents/my-documents", {
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
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get project documents
export const getProjectDocuments = async (projectId) => {
  try {
    const response = await api.get(`/documents/project/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update document
export const updateDocument = async (documentId, updateData) => {
  try {
    const response = await api.put(`/documents/${documentId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete document
export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Download document
export const downloadDocument = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}/download`, {
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
    const response = await api.get(`/documents/${documentId}/metadata`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Process OCR for document
export const processOCR = async (documentId) => {
  try {
    const response = await api.post(`/documents/${documentId}/ocr`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// View document using REST API
export const viewDocument = async (documentId) => {
  try {
    const response = await api.get(
      `/documents/${documentId}/view?t=${Date.now()}`,
      {
        responseType: "blob",
      }
    );

    // Create blob URL and open in new tab
    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);

    // Open in new tab
    const newWindow = window.open(url, "_blank");

    if (!newWindow) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 5000);

    return { success: true, message: "Document opened successfully" };
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Search documents
export const searchDocuments = async (searchParams) => {
  try {
    const response = await api.get("/documents/search", {
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
    const response = await api.get("/documents/categories");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document types
export const getDocumentTypes = async () => {
  try {
    const response = await api.get("/documents/types");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document statistics
export const getDocumentStats = async () => {
  try {
    const response = await api.get("/documents/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get pending approvals for documents
export const getPendingDocumentApprovals = async () => {
  try {
    const response = await api.get("/documents/pending-approvals");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Approve document
export const approveDocument = async (documentId, comments = "") => {
  try {
    const response = await api.post(`/documents/${documentId}/approve`, {
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
    const response = await api.post(`/documents/${documentId}/reject`, {
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
    const response = await api.get(`/documents/${documentId}/approval-history`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Share document with users
export const shareDocument = async (documentId, userIds, permissions) => {
  try {
    const response = await api.post(`/documents/${documentId}/share`, {
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
    const response = await api.get("/documents/shared");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Archive document
export const archiveDocument = async (documentId) => {
  try {
    const response = await api.post(`/documents/${documentId}/archive`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Restore archived document
export const restoreDocument = async (documentId) => {
  try {
    const response = await api.post(`/documents/${documentId}/restore`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get archived documents
export const getArchivedDocuments = async (filters = {}) => {
  try {
    const response = await api.get("/documents/archived", {
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
    const response = await api.post("/documents/bulk-delete", {
      documentIds,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const bulkArchiveDocuments = async (documentIds) => {
  try {
    const response = await api.post("/documents/bulk-archive", {
      documentIds,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const bulkShareDocuments = async (documentIds, userIds, permissions) => {
  try {
    const response = await api.post("/documents/bulk-share", {
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

// Scanning services
export const detectScanners = async () => {
  try {
    const response = await api.get("/scanning/scanners");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const scanDocument = async (scannerId, options = {}) => {
  try {
    const response = await api.post("/scanning/scan", {
      scannerId,
      options,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const processScannedDocument = async (scanResult, metadata) => {
  try {
    const response = await api.post("/scanning/process", {
      scanResult,
      metadata,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Document replacement/update
export const replaceDocument = async (documentId, formData) => {
  try {
    const response = await api.put(
      `/documents/${documentId}/replace`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const uploadProjectDocuments = async (formData) => {
  try {
    const response = await api.post(
      "/documents/upload-project-documents",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const replaceProjectDocument = async (formData) => {
  try {
    const response = await api.post(
      "/documents/replace-project-document",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
