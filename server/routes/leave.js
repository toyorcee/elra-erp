import express from "express";
import {
  createLeaveRequest,
  getLeaveRequests,
  getMyLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  approveLeaveRequest,
  cancelLeaveRequest,
  deleteLeaveRequest,
  getLeaveStats,
  getPendingApprovals,
  getLeaveTypes,
  getDepartmentLeaveRequests,
} from "../controllers/leaveController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", checkRole(300), createLeaveRequest);

router.get("/", checkRole(100), getLeaveRequests);

// Personal leave requests for logged-in user only
router.get("/my-requests", checkRole(100), getMyLeaveRequests);

// Department leave requests for HODs only
router.get("/department-requests", checkRole(700), getDepartmentLeaveRequests);

router.get("/stats/overview", checkRole(100), getLeaveStats);

router.get("/pending/approvals", checkRole(600), getPendingApprovals);

router.get("/types/available", checkRole(100), getLeaveTypes);

// Parameterized routes must come AFTER specific routes
router.get("/:id", checkRole(100), getLeaveRequestById);

// Update and delete own leave requests (only pending ones)
router.put("/:id", checkRole(300), updateLeaveRequest);
router.delete("/:id", checkRole(300), deleteLeaveRequest);

router.put("/:id/approve", checkRole(600), approveLeaveRequest);

router.put("/:id/cancel", checkRole(300), cancelLeaveRequest);

export default router;
