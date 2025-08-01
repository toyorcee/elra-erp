import api from "./api";

// Send invitation to new user
export const sendInvitation = async (invitationData) => {
  const response = await api.post("/invitations", invitationData);
  return response.data;
};

// Get all invitations
export const getInvitations = async (params = {}) => {
  const response = await api.get("/invitations", { params });
  return response.data;
};

// Get invitation by ID
export const getInvitationById = async (id) => {
  const response = await api.get(`/invitations/${id}`);
  return response.data;
};

// Resend invitation
export const resendInvitation = async (id) => {
  const response = await api.post(`/invitations/${id}/resend`);
  return response.data;
};

// Cancel invitation
export const cancelInvitation = async (id) => {
  const response = await api.delete(`/invitations/${id}`);
  return response.data;
};

// Accept invitation (for users)
export const acceptInvitation = async (code) => {
  const response = await api.post("/invitations/accept", { code });
  return response.data;
};

// Validate invitation code
export const validateInvitationCode = async (code) => {
  const response = await api.post("/invitations/validate", { code });
  return response.data;
}; 