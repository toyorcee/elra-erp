import express from "express";
import { protect } from "../middleware/auth.js";
import { hasPermission } from "../utils/permissionUtils.js";
import * as dashboardController from "../controllers/dashboardController.js";
import User from "../models/User.js";
import Document from "../models/Document.js";
import Department from "../models/Department.js";
import Invitation from "../models/Invitation.js";

const router = express.Router();

// @desc    Get system statistics for dashboard
// @route   GET /api/dashboard/system-stats
// @access  Private
router.get("/system-stats", protect, async (req, res) => {
  try {
    const currentUser = req.user;

    // Get user counts by status
    const totalUsers = await User.countDocuments({
      email: { $not: /platformadmin/i },
      company: currentUser.company,
    });

    const pendingUsers = await User.countDocuments({
      status: "PENDING_REGISTRATION",
      email: { $not: /platformadmin/i },
      company: currentUser.company,
    });

    const invitedUsers = await User.countDocuments({
      status: "INVITED",
      email: { $not: /platformadmin/i },
      company: currentUser.company,
    });

    const activeUsers = await User.countDocuments({
      $or: [
        { status: "ACTIVE" },
        { isActive: true, status: { $exists: false } },
      ],
      email: { $not: /platformadmin/i },
      company: currentUser.company,
    });

    const inactiveUsers = await User.countDocuments({
      isActive: false,
      status: { $nin: ["PENDING_REGISTRATION", "INVITED"] },
      email: { $not: /platformadmin/i },
      company: currentUser.company,
    });

    // Get document counts
    const totalDocuments = await Document.countDocuments({
      company: currentUser.company,
    });

    const pendingDocuments = await Document.countDocuments({
      company: currentUser.company,
      status: "pending",
    });

    const approvedDocuments = await Document.countDocuments({
      company: currentUser.company,
      status: "approved",
    });

    const rejectedDocuments = await Document.countDocuments({
      company: currentUser.company,
      status: "rejected",
    });

    // Get department count
    const totalDepartments = await Department.countDocuments({
      company: currentUser.company,
    });

    // Get invitation counts
    const activeInvitations = await Invitation.countDocuments({
      company: currentUser.company,
      status: "active",
    });

    const usedInvitations = await Invitation.countDocuments({
      company: currentUser.company,
      status: "used",
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
          invited: invitedUsers,
          inactive: inactiveUsers,
        },
        documents: {
          total: totalDocuments,
          pending: pendingDocuments,
          approved: approvedDocuments,
          rejected: rejectedDocuments,
        },
        departments: {
          total: totalDepartments,
        },
        invitations: {
          active: activeInvitations,
          used: usedInvitations,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard system stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system statistics",
    });
  }
});

// Get user dashboard data
router.get("/", protect, dashboardController.getDashboardData);

// Get dashboard data for specific days
router.get("/:days", protect, dashboardController.getDashboardData);

// ==================== HR DASHBOARD ROUTES ====================

// Get HR dashboard data
router.get("/hr/overview", protect, dashboardController.getHRDashboardData);

// Get HR department-specific data
router.get(
  "/hr/department/:departmentId",
  protect,
  dashboardController.getHRDepartmentData
);

// ==================== SELF-SERVICE DASHBOARD ROUTES ====================

// Get Self-Service dashboard data
router.get(
  "/self-service/overview",
  protect,
  dashboardController.getSelfServiceDashboardData
);

export default router;
