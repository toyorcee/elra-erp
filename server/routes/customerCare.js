import express from "express";
import { protect, checkCustomerCareAccess } from "../middleware/auth.js";
import {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  addComplaintNote,
  getComplaintStatistics,
  getComplaintTrends,
  getDepartmentBreakdown,
  getCategoryBreakdown,
  submitFeedback,
  getTeamMembers,
  assignComplaint,
  saveSession,
  getSessionsByComplaint,
  getSessionsByResponder,
  getActiveSessions,
  sendReminderNotification,
} from "../controllers/customerCareController.js";

const router = express.Router();

router.use(protect);

router.get("/complaints", checkCustomerCareAccess, getComplaints);

router.get("/complaints/:id", checkCustomerCareAccess, getComplaintById);

router.post("/complaints", checkCustomerCareAccess, createComplaint);

router.put(
  "/complaints/:id/status",
  checkCustomerCareAccess,
  updateComplaintStatus
);

router.post("/complaints/:id/notes", checkCustomerCareAccess, addComplaintNote);

router.get("/statistics", checkCustomerCareAccess, getComplaintStatistics);

router.get("/trends", checkCustomerCareAccess, getComplaintTrends);

router.get(
  "/department-breakdown",
  checkCustomerCareAccess,
  getDepartmentBreakdown
);

router.get(
  "/category-breakdown",
  checkCustomerCareAccess,
  getCategoryBreakdown
);

router.post(
  "/complaints/:id/feedback",
  checkCustomerCareAccess,
  submitFeedback
);

router.get("/team-members", checkCustomerCareAccess, getTeamMembers);

router.post("/complaints/:id/assign", checkCustomerCareAccess, assignComplaint);

router.post("/sessions", checkCustomerCareAccess, saveSession);

router.get(
  "/sessions/complaint/:complaintId",
  checkCustomerCareAccess,
  getSessionsByComplaint
);

// Get sessions by responder
router.get(
  "/sessions/responder/:responderId",
  checkCustomerCareAccess,
  getSessionsByResponder
);

// Get active sessions
router.get("/sessions/active", checkCustomerCareAccess, getActiveSessions);

// Send reminder notification for complaint
router.post("/complaints/:complaintId/reminder", checkCustomerCareAccess, sendReminderNotification);

export default router;
