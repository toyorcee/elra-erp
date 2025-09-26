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

// Submit feedback for resolved complaint
router.post(
  "/complaints/:id/feedback",
  checkCustomerCareAccess,
  submitFeedback
);

// Get team members for assignment (HODs only)
router.get("/team-members", checkCustomerCareAccess, getTeamMembers);

// Assign complaint to team member (HODs only)
router.post("/complaints/:id/assign", checkCustomerCareAccess, assignComplaint);

export default router;
