import api from "./api";

export const getDocuments = () => api.get("/documents");
export const getDocumentById = (id) => api.get(`/documents/${id}`);
export const createDocument = (documentData) =>
  api.post("/documents", documentData);
export const updateDocument = (id, documentData) =>
  api.put(`/documents/${id}`, documentData);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const uploadDocument = (formData) => {
  return api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const searchDocuments = (params) =>
  api.get("/documents/search", { params });
export const getPendingApprovals = () =>
  api.get("/documents/pending-approvals");
export const approveDocument = (id, data) =>
  api.post(`/documents/${id}/approve`, data);
export const rejectDocument = (id, data) =>
  api.post(`/documents/${id}/reject`, data);
export const submitForApproval = (id) => api.post(`/documents/${id}/submit`);

export const getDocumentMetadata = () => api.get("/documents/metadata");

export const processOCR = (formData) => {
  return api.post("/documents/ocr", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
