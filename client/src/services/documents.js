import api from "./api";

export const getDocuments = () => api.get("/documents");
export const getDocumentById = (id) => api.get(`/documents/${id}`);
export const createDocument = (documentData) =>
  api.post("/documents", documentData);
export const updateDocument = (id, documentData) =>
  api.put(`/documents/${id}`, documentData);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
