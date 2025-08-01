import api from "./api";

// Get all approval levels
export const getApprovalLevels = async () => {
  const response = await api.get("/approval-levels");
  return response.data;
};

// Get single approval level
export const getApprovalLevel = async (id) => {
  const response = await api.get(`/approval-levels/${id}`);
  return response.data;
};

// Create approval level
export const createApprovalLevel = async (levelData) => {
  const response = await api.post("/approval-levels", levelData);
  return response.data;
};

// Update approval level
export const updateApprovalLevel = async (id, levelData) => {
  const response = await api.put(`/approval-levels/${id}`, levelData);
  return response.data;
};

// Delete approval level
export const deleteApprovalLevel = async (id) => {
  const response = await api.delete(`/approval-levels/${id}`);
  return response.data;
};

// Get approval levels by document type
export const getApprovalLevelsByDocumentType = async (documentType) => {
  const response = await api.get(
    `/approval-levels/document-type/${documentType}`
  );
  return response.data;
};

// Workflow Templates
export const getWorkflowTemplates = (documentType) =>
  api.get("/workflow-templates", { params: { documentType } });
export const getWorkflowTemplate = (id) => api.get(`/workflow-templates/${id}`);
export const createWorkflowTemplate = (data) =>
  api.post("/workflow-templates", data);
export const updateWorkflowTemplate = (id, data) =>
  api.put(`/workflow-templates/${id}`, data);
export const deleteWorkflowTemplate = (id) =>
  api.delete(`/workflow-templates/${id}`);
export const getWorkflowTemplatesByDocumentType = (documentType) =>
  api.get(`/workflow-templates/document-type/${documentType}`);
export const duplicateWorkflowTemplate = (id, data) =>
  api.post(`/workflow-templates/${id}/duplicate`, data);

// Document Workflows
export const initiateWorkflow = (data) =>
  api.post("/document-workflows/initiate", data);
export const processWorkflowStep = (workflowId, data) =>
  api.post(`/document-workflows/${workflowId}/process`, data);
export const getDocumentWorkflow = (workflowId) =>
  api.get(`/document-workflows/${workflowId}`);
export const getUserWorkflows = () =>
  api.get("/document-workflows/my-workflows");
export const getPendingWorkflows = () => api.get("/document-workflows/pending");
