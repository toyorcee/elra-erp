import express from "express";
import {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  cancelLeaveRequest,
  getLeaveStats,
  getPendingApprovals,
  getLeaveTypes,
} from "../controllers/leaveController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", checkRole(300), createLeaveRequest);

router.get("/", checkRole(100), getLeaveRequests);

router.get("/:id", checkRole(100), getLeaveRequestById);

router.put("/:id/approve", checkRole(600), approveLeaveRequest);

router.put("/:id/cancel", checkRole(300), cancelLeaveRequest);

router.get("/stats/overview", checkRole(100), getLeaveStats);

router.get("/pending/approvals", checkRole(600), getPendingApprovals);

router.get("/types/available", checkRole(100), getLeaveTypes);

export default router;
