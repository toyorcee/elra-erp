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

export default router;
