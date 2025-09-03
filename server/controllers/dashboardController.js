import Document from "../models/Document.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Invitation from "../models/Invitation.js";
import Compliance from "../models/Compliance.js";
import Policy from "../models/Policy.js";
import Payslip from "../models/Payslip.js";
import Project from "../models/Project.js";
import AuditService from "../services/auditService.js";

// Get dashboard data based on user role
export const getDashboardData = async (req, res) => {
  try {
    const currentUser = req.user;

    // Get basic counts
    const totalDocuments = await Document.countDocuments({ isActive: true });
    const myDocuments = await Document.countDocuments({
      uploadedBy: currentUser.userId,
      isActive: true,
    });

    // Get pending approvals (if user can approve)
    let pendingApprovals = 0;
    if (currentUser.role.level >= 70) {
      // Supervisor and above
      pendingApprovals = await Document.countDocuments({
        currentApprover: currentUser.userId,
        status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
        isActive: true,
      });
    }

    // Get recent documents
    const recentDocuments = await Document.find({ isActive: true })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get documents by status
    const documentsByStatus = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get documents by category
    const documentsByCategory = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalDocuments,
        myDocuments,
        pendingApprovals,
        recentDocuments,
        documentsByStatus,
        documentsByCategory,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

// Get user's documents
export const getMyDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    let query = {
      uploadedBy: currentUser.userId,
      isActive: true,
    };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const documents = await Document.find(query)
      .populate("currentApprover", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};

// Get pending approvals for user
export const getMyPendingApprovals = async (req, res) => {
  try {
    const currentUser = req.user;

    // Only supervisors and above can have pending approvals
    if (currentUser.role.level < 70) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const documents = await Document.find({
      currentApprover: currentUser.userId,
      status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
      isActive: true,
    })
      .populate("uploadedBy", "name email department")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending approvals",
    });
  }
};

// Get system stats for super admin
export const getSystemStats = async () => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments({ isActive: true });

    // Get total documents
    const totalDocuments = await Document.countDocuments({ isActive: true });

    // Get documents by status
    const documentsByStatus = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get total departments
    const totalDepartments = await Department.countDocuments();

    // Get total roles
    const totalRoles = await Role.countDocuments();

    // Get recent audit logs
    const recentAuditLogs = await AuditLog.find()
      .populate("user", "firstName lastName email")
      .populate("document", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get system activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await AuditLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get pending approvals
    const pendingApprovals = await Document.countDocuments({
      status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
      isActive: true,
    });

    return {
      totalUsers,
      totalDocuments,
      totalDepartments,
      totalRoles,
      pendingApprovals,
      recentActivity,
      documentsByStatus,
      recentAuditLogs,
    };
  } catch (error) {
    console.error("Get system stats error:", error);
    throw error;
  }
};

// ==================== HR DASHBOARD METHODS ====================

// Get HR dashboard data with role-based access
export const getHRDashboardData = async (req, res) => {
  try {
    const currentUser = req.user;
    const userRole = currentUser.role?.level;
    const userDepartment = currentUser.department;

    console.log("🚀 [HR Dashboard] Getting data for user:", {
      userId: currentUser._id,
      role: userRole,
      department: userDepartment,
    });

    // Check if user has access to HR dashboard
    if (userRole < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HOD and Super Admin can access HR dashboard.",
      });
    }

    // Build department filter based on role
    let departmentFilter = {};
    let userDepartmentFilter = {};
    if (userRole === 700) {
      // HOD: Only their department
      departmentFilter = { department: userDepartment };
      userDepartmentFilter = { department: userDepartment };
    }
    // Super Admin (1000): No filter (sees all departments)

    // ==================== SUMMARY METRICS ====================

    // 1. Total Staff Count - Active users from User model
    const totalStaffQuery = {
      isActive: true,
      status: "ACTIVE",
      ...userDepartmentFilter,
    };
    const totalStaff = await User.countDocuments(totalStaffQuery);

    // 2. New Hires - Track from invitation completion flow
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get users who completed onboarding in last 30 days
    const newHiresQuery = {
      isActive: true,
      status: "ACTIVE",
      createdAt: { $gte: thirtyDaysAgo },
      ...userDepartmentFilter,
    };
    const newHires = await User.countDocuments(newHiresQuery);

    // Alternative: Track from completed invitations (more accurate for onboarding flow)
    const completedInvitationsQuery = {
      status: "used",
      onboardingCompleted: true,
      onboardingCompletedAt: { $gte: thirtyDaysAgo },
      ...departmentFilter,
    };
    const completedInvitations = await Invitation.countDocuments(
      completedInvitationsQuery
    );

    // Use the higher count between actual user creation and completed invitations
    const actualNewHires = Math.max(newHires, completedInvitations);

    // 3. Staff on Leave - Current approved leave requests
    const currentDate = new Date();
    const onLeaveQuery = {
      status: "Approved",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      ...departmentFilter,
    };
    const onLeave = await LeaveRequest.countDocuments(onLeaveQuery);

    // 4. Total Departments - Active departments from Department model
    const totalDepartmentsQuery = { isActive: true };
    const totalDepartments =
      userRole === 1000
        ? await Department.countDocuments(totalDepartmentsQuery)
        : 1; // HOD sees only their department

    // ==================== LEAVE STATISTICS ====================

    // Pending Leave Requests
    const pendingLeaveQuery = {
      status: "Pending",
      ...departmentFilter,
    };
    const pendingLeaveRequests = await LeaveRequest.countDocuments(
      pendingLeaveQuery
    );

    // Leave requests by status
    const leaveByStatus = await LeaveRequest.aggregate([
      { $match: departmentFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Leave requests by type
    const leaveByType = await LeaveRequest.aggregate([
      { $match: departmentFilter },
      { $group: { _id: "$leaveType", count: { $sum: 1 } } },
    ]);

    // ==================== RECENT ACTIVITY ====================

    // Get recent HR-related audit logs performed by the current user
    const recentActivityQuery = {
      userId: currentUser._id,
      resourceType: { $in: ["USER", "LEAVE_REQUEST", "DEPARTMENT"] },
    };

    const recentActivity = await AuditLog.find(recentActivityQuery)
      .populate("userId", "firstName lastName email")
      .populate("resourceId")
      .sort({ timestamp: -1 })
      .limit(10);

    // ==================== QUICK ACTIONS ====================

    // Determine available quick actions based on role
    const quickActions = [];

    if (userRole >= 700) {
      quickActions.push({
        id: "add_staff",
        title: "Add Staff",
        description: "Register new employee",
        icon: "UserPlusIcon",
        action: "navigate",
        path: "/dashboard/modules/hr/user-management",
        permission: userRole >= 700,
      });
    }

    if (userRole >= 300) {
      quickActions.push({
        id: "leave_requests",
        title: "Leave Requests",
        description: "Manage time off",
        icon: "ClockIcon",
        action: "navigate",
        path: "/dashboard/modules/hr/leave/requests",
        permission: userRole >= 300,
      });
    }

    if (userRole >= 600) {
      quickActions.push({
        id: "leave_management",
        title: "Leave Management",
        description: "Approve leave requests",
        icon: "ClipboardDocumentCheckIcon",
        action: "navigate",
        path: "/dashboard/modules/hr/leave/management",
        permission: userRole >= 600,
      });
    }

    if (userRole >= 700) {
      quickActions.push({
        id: "department_management",
        title: "Department Management",
        description: "Manage departments",
        icon: "BuildingOfficeIcon",
        action: "navigate",
        path: "/dashboard/modules/hr/department-management",
        permission: userRole >= 700,
      });
    }

    if (userRole >= 1000) {
      quickActions.push({
        id: "role_management",
        title: "Role Management",
        description: "Manage user roles",
        icon: "ShieldCheckIcon",
        action: "navigate",
        path: "/dashboard/modules/hr/role-management",
        permission: userRole >= 1000,
      });
    }

    // ==================== RECENT STAFF ACTIVITY ====================

    // Get recent user management activities performed by current user
    const recentStaffActivity = await AuditLog.find({
      userId: currentUser._id,
      resourceType: "USER",
      action: {
        $in: [
          "USER_CREATED",
          "USER_UPDATED",
          "USER_ROLE_CHANGED",
          "USER_DEPARTMENT_CHANGED",
        ],
      },
    })
      .populate("userId", "firstName lastName email")
      .populate("resourceId", "firstName lastName email department")
      .sort({ timestamp: -1 })
      .limit(5);

    // ==================== LEAVE CALENDAR OVERVIEW ====================

    // Get upcoming approved leaves
    const upcomingLeaves = await LeaveRequest.find({
      status: "Approved",
      startDate: { $gte: currentDate },
      ...departmentFilter,
    })
      .populate("employee", "firstName lastName email")
      .populate("department", "name")
      .sort({ startDate: 1 })
      .limit(10);

    // ==================== ADDITIONAL METRICS ====================

    // Pending invitations (for onboarding tracking)
    const pendingInvitationsQuery = {
      status: { $in: ["active", "sent", "pending_approval"] },
      ...departmentFilter,
    };
    const pendingInvitations = await Invitation.countDocuments(
      pendingInvitationsQuery
    );

    // Recent onboarding completions
    const recentOnboardings = await Invitation.find({
      status: "used",
      onboardingCompleted: true,
      onboardingCompletedAt: { $gte: thirtyDaysAgo },
      ...departmentFilter,
    })
      .populate("usedBy", "firstName lastName email")
      .populate("department", "name")
      .sort({ onboardingCompletedAt: -1 })
      .limit(5);

    // Compliance Counts
    const totalCompliances = await Compliance.countDocuments();
    const pendingCompliances = await Compliance.countDocuments({
      status: "Pending",
      ...departmentFilter,
    });
    const completedCompliances = await Compliance.countDocuments({
      status: "Completed",
      ...departmentFilter,
    });

    // Policy Counts
    const totalPolicies = await Policy.countDocuments();
    const pendingPolicies = await Policy.countDocuments({
      status: "Pending",
      ...departmentFilter,
    });
    const approvedPolicies = await Policy.countDocuments({
      status: "Approved",
      ...departmentFilter,
    });

    res.json({
      success: true,
      data: {
        // Summary Metrics
        summary: {
          totalStaff,
          newHires: actualNewHires,
          onLeave,
          totalDepartments,
          pendingInvitations,
          totalCompliances,
          pendingCompliances,
          completedCompliances,
          totalPolicies,
          pendingPolicies,
          approvedPolicies,
        },

        // Leave Statistics
        leaveStats: {
          pendingRequests: pendingLeaveRequests,
          byStatus: leaveByStatus,
          byType: leaveByType,
        },

        // Quick Actions
        quickActions: quickActions.filter((action) => action.permission),

        // Recent Activity
        recentActivity,

        // Staff Activity
        recentStaffActivity,

        // Leave Calendar
        upcomingLeaves,

        // Onboarding Data
        recentOnboardings,

        // User permissions
        permissions: {
          canAddStaff: userRole >= 700,
          canManageLeave: userRole >= 600,
          canManageDepartments: userRole >= 700,
          canManageRoles: userRole >= 1000,
          canViewAllDepartments: userRole === 1000,
        },
      },
    });
  } catch (error) {
    console.error("❌ [HR Dashboard] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load HR dashboard data",
    });
  }
};

// Get HR department-specific data
export const getHRDepartmentData = async (req, res) => {
  try {
    const currentUser = req.user;
    const { departmentId } = req.params;
    const userRole = currentUser.role?.level;

    // Check permissions
    if (userRole < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HOD and Super Admin can access department data.",
      });
    }

    // HOD can only access their own department
    if (
      userRole === 700 &&
      currentUser.department?.toString() !== departmentId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own department data.",
      });
    }

    const departmentFilter = { department: departmentId };

    // ==================== DEPARTMENT-SPECIFIC METRICS ====================

    const totalStaff = await User.countDocuments({
      isActive: true,
      status: "ACTIVE",
      ...departmentFilter,
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newHires = await User.countDocuments({
      isActive: true,
      status: "ACTIVE",
      createdAt: { $gte: thirtyDaysAgo },
      ...departmentFilter,
    });

    const completedInvitations = await Invitation.countDocuments({
      status: "used",
      onboardingCompleted: true,
      onboardingCompletedAt: { $gte: thirtyDaysAgo },
      ...departmentFilter,
    });

    const actualNewHires = Math.max(newHires, completedInvitations);

    const currentDate = new Date();
    const onLeave = await LeaveRequest.countDocuments({
      status: "Approved",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      ...departmentFilter,
    });

    const pendingLeaveRequests = await LeaveRequest.countDocuments({
      status: "Pending",
      ...departmentFilter,
    });

    const pendingInvitations = await Invitation.countDocuments({
      status: { $in: ["active", "sent", "pending_approval"] },
      ...departmentFilter,
    });

    const recentActivity = await AuditLog.find({
      userId: currentUser._id,
      resourceType: { $in: ["USER", "LEAVE_REQUEST"] },
    })
      .populate("userId", "firstName lastName email")
      .populate("resourceId")
      .sort({ timestamp: -1 })
      .limit(10);

    const recentOnboardings = await Invitation.find({
      status: "used",
      onboardingCompleted: true,
      onboardingCompletedAt: { $gte: thirtyDaysAgo },
      ...departmentFilter,
    })
      .populate("usedBy", "firstName lastName email")
      .populate("department", "name")
      .sort({ onboardingCompletedAt: -1 })
      .limit(5);

    const upcomingLeaves = await LeaveRequest.find({
      status: "Approved",
      startDate: { $gte: currentDate },
      ...departmentFilter,
    })
      .populate("employee", "firstName lastName email")
      .populate("department", "name")
      .sort({ startDate: 1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        // Summary Metrics
        summary: {
          totalStaff,
          newHires: actualNewHires,
          onLeave,
          pendingLeaveRequests,
          pendingInvitations,
        },

        // Recent Activity
        recentActivity,

        // Onboarding Data
        recentOnboardings,

        // Leave Calendar
        upcomingLeaves,

        // Department Info
        department: {
          id: departmentId,
          name: currentUser.department?.name || "Unknown Department",
        },
      },
    });
  } catch (error) {
    console.error("❌ [HR Department Data] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load department data",
    });
  }
};

// ==================== SELF-SERVICE DASHBOARD METHODS ====================

// Get Self-Service dashboard data for current user
export const getSelfServiceDashboardData = async (req, res) => {
  try {
    const currentUser = req.user;
    const userId = currentUser._id;

    console.log("🚀 [Self-Service Dashboard] Getting data for user:", {
      userId: currentUser._id,
      role: currentUser.role?.level,
      department: currentUser.department?.name,
    });

    // ==================== SUMMARY METRICS ====================

    // 1. Total Payslips - Count user's payslips from Payslip model
    const totalPayslips = await Payslip.countDocuments({
      employee: userId,
    });

    // 2. Leave Requests - Count user's leave requests
    const totalLeaveRequests = await LeaveRequest.countDocuments({
      employee: userId,
    });

    // 3. Projects - Count user's projects (since no tickets yet)
    const totalProjects = await Project.countDocuments({
      $or: [{ createdBy: userId }, { "teamMembers.user": userId }],
    });

    // 4. Documents - Count user's documents
    const totalDocuments = await Document.countDocuments({
      uploadedBy: userId,
      isActive: true,
    });

    // ==================== DETAILED DATA ====================

    // Recent Leave Requests
    const recentLeaveRequests = await LeaveRequest.find({
      employee: userId,
    })
      .populate("department", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent Documents
    const recentDocuments = await Document.find({
      uploadedBy: userId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Pending Leave Requests
    const pendingLeaveRequests = await LeaveRequest.countDocuments({
      employee: userId,
      status: "Pending",
    });

    // Approved Leave Requests
    const approvedLeaveRequests = await LeaveRequest.countDocuments({
      employee: userId,
      status: "Approved",
    });

    // Rejected Leave Requests
    const rejectedLeaveRequests = await LeaveRequest.countDocuments({
      employee: userId,
      status: "Rejected",
    });

    // Recent Activity
    const recentActivity = await AuditLog.find({
      userId: userId,
      resourceType: {
        $in: ["DOCUMENT", "LEAVE_REQUEST", "PAYSLIP", "PROJECT"],
      },
    })
      .populate("resourceId")
      .sort({ timestamp: -1 })
      .limit(10);

    // Recent Payslips
    const recentPayslips = await Payslip.find({
      employee: userId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent Projects
    const recentProjects = await Project.find({
      $or: [{ createdBy: userId }, { "teamMembers.user": userId }],
    })
      .populate("teamMembers.user", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalPayslips,
          totalLeaveRequests,
          totalProjects,
          totalDocuments,
          pendingLeaveRequests,
          approvedLeaveRequests,
          rejectedLeaveRequests,
        },

        // Detailed Data
        recentLeaveRequests,
        recentDocuments,
        recentPayslips,
        recentProjects,
        recentActivity,

        // User Info
        user: {
          id: currentUser._id,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          role: currentUser.role?.name || "Staff",
          department: currentUser.department?.name || "Unknown Department",
        },
      },
    });
  } catch (error) {
    console.error("❌ [Self-Service Dashboard] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load Self-Service dashboard data",
    });
  }
};
