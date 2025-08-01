import api from "./api";

// Get all workflow templates
export const getWorkflowTemplates = async (documentType = null) => {
  const params = documentType ? { documentType } : {};
  const response = await api.get("/workflow-templates", { params });
  return response.data;
};

// Get single workflow template
export const getWorkflowTemplate = async (id) => {
  const response = await api.get(`/workflow-templates/${id}`);
  return response.data;
};

// Create workflow template
export const createWorkflowTemplate = async (templateData) => {
  const response = await api.post("/workflow-templates", templateData);
  return response.data;
};

// Update workflow template
export const updateWorkflowTemplate = async (id, templateData) => {
  const response = await api.put(`/workflow-templates/${id}`, templateData);
  return response.data;
};

// Delete workflow template
export const deleteWorkflowTemplate = async (id) => {
  const response = await api.delete(`/workflow-templates/${id}`);
  return response.data;
};

// Duplicate workflow template
export const duplicateWorkflowTemplate = async (id, name, description) => {
  const response = await api.post(`/workflow-templates/${id}/duplicate`, {
    name,
    description,
  });
  return response.data;
};
