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
  getPriorityBreakdown,
  getTrendCalculations,
  exportCustomerCareReport,
  submitFeedback,
  getTeamMembers,
  getDepartmentsWithHODs,
  sendComplaintToHOD,
  assignComplaint,
  saveSession,
  getSessionsByComplaint,
  getSessionsByResponder,
  getActiveSessions,
  sendReminderNotification,
  forwardComplaintToHOD,
  getDepartments,
  getForwardedComplaints,
  getForwardedComplaintsCount,
} from "../controllers/customerCareController.js";

const router = express.Router();

router.use(protect);

// Get departments for forwarding
router.get("/departments", checkCustomerCareAccess, getDepartments);

// Get forwarded complaints for HODs
router.get("/forwarded-complaints", getForwardedComplaints);

// Get forwarded complaints count for HOD dashboard
router.get("/forwarded-complaints/count", getForwardedComplaintsCount);

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

router.get(
  "/priority-breakdown",
  checkCustomerCareAccess,
  getPriorityBreakdown
);

router.get("/trends", checkCustomerCareAccess, getTrendCalculations);

router.get(
  "/reports/export/:format",
  checkCustomerCareAccess,
  exportCustomerCareReport
);

router.post(
  "/complaints/:id/feedback",
  checkCustomerCareAccess,
  submitFeedback
);

router.get("/team-members", checkCustomerCareAccess, getTeamMembers);

router.get(
  "/departments-with-hods",
  checkCustomerCareAccess,
  getDepartmentsWithHODs
);

router.post(
  "/complaints/:id/send-to-hod",
  checkCustomerCareAccess,
  sendComplaintToHOD
);

router.post("/complaints/:id/assign", checkCustomerCareAccess, assignComplaint);

// Forward complaint to department HOD
router.post(
  "/complaints/:complaintId/forward-to-hod",
  checkCustomerCareAccess,
  forwardComplaintToHOD
);

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
router.post(
  "/complaints/:complaintId/reminder",
  checkCustomerCareAccess,
  sendReminderNotification
);

export default router;
