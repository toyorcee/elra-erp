import api from "./api";

// Approval Levels
export const getApprovalLevels = () => api.get("/approval-levels");
export const getApprovalLevel = (id) => api.get(`/approval-levels/${id}`);
export const createApprovalLevel = (data) => api.post("/approval-levels", data);
export const updateApprovalLevel = (id, data) =>
  api.put(`/approval-levels/${id}`, data);
export const deleteApprovalLevel = (id) => api.delete(`/approval-levels/${id}`);
export const getApprovalLevelsByDocumentType = (documentType) =>
  api.get(`/approval-levels/document-type/${documentType}`);

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
