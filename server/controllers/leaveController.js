import { asyncHandler } from "../utils/asyncHandler.js";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";

// Helper function to get user role name
const getRoleName = (roleLevel) => {
  switch (roleLevel) {
    case 1000:
      return "SUPER_ADMIN";
    case 700:
      return "HOD";
    case 600:
      return "MANAGER";
    case 300:
      return "STAFF";
    case 100:
      return "VIEWER";
    default:
      return "Unknown";
  }
};

// Helper function to check if user can approve based on role
const canApprove = (userRole, requestLevel) => {
  // Super Admin can approve any level
  if (userRole === 1000) return true;

  // HOD can approve level 1 and 2 (Staff and Manager requests)
  if (userRole === 700 && requestLevel <= 2) return true;

  // Manager can approve level 1 (Staff requests)
  if (userRole === 600 && requestLevel === 1) return true;

  return false;
};

// Helper function to get next approver
const getNextApprover = async (employeeRole, departmentId) => {
  if (employeeRole === 700) {
    // HOD's request goes to Super Admin
    return await User.findOne({
      role: 1000,
    });
  } else if (employeeRole === 600) {
    // Manager's request goes to HOD
    return await User.findOne({
      role: 700,
      department: departmentId,
    });
  } else if (employeeRole === 300) {
    // Staff's request goes to Manager
    return await User.findOne({
      role: 600,
      department: departmentId,
    });
  }
  return null;
};

// Create leave request
const createLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, days, reason } = req.body;
  const userId = req.user._id;

  // Check if user can request leave
  if (req.user.role.level === 100) {
    return res.status(403).json({
      success: false,
      message: "Viewers cannot request leave",
    });
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: "End date must be after start date",
    });
  }

  if (start < new Date()) {
    return res.status(400).json({
      success: false,
      message: "Cannot request leave for past dates",
    });
  }

  // Check for overlapping leave requests
  const overlappingLeave = await LeaveRequest.findOne({
    employee: userId,
    status: { $in: ["Pending", "Approved"] },
    $or: [
      {
        startDate: { $lte: end },
        endDate: { $gte: start },
      },
    ],
  });

  if (overlappingLeave) {
    return res.status(400).json({
      success: false,
      message: "You have an overlapping leave request",
    });
  }

  // Get next approver
  const nextApprover = await getNextApprover(
    req.user.role.level,
    req.user.department
  );

  if (!nextApprover) {
    return res.status(400).json({
      success: false,
      message: "No approver found for your request",
    });
  }

  // Create leave request
  const leaveRequest = await LeaveRequest.create({
    employee: userId,
    leaveType,
    startDate: start,
    endDate: end,
    days,
    reason,
    department: req.user.department,
    currentApprover: nextApprover._id,
    approvalLevel:
      req.user.role.level === 700 ? 3 : req.user.role.level === 600 ? 2 : 1,
  });

  // Add initial approval entry
  await leaveRequest.addApproval(
    nextApprover._id,
    getRoleName(nextApprover.role),
    "Pending"
  );

  // Send notification to approver
  await Notification.create({
    recipient: nextApprover._id,
    type: "leave_request",
    title: "New Leave Request",
    message: `${req.user.firstName} ${req.user.lastName} has submitted a leave request`,
    data: {
      leaveRequestId: leaveRequest._id,
      employeeName: `${req.user.firstName} ${req.user.lastName}`,
      leaveType,
      startDate: start,
      endDate: end,
    },
  });

  // Populate employee and department details
  await leaveRequest.populate([
    { path: "employee", select: "firstName lastName email avatar employeeId" },
    { path: "department", select: "name" },
    { path: "currentApprover", select: "firstName lastName email" },
  ]);

  return res.status(201).json({
    success: true,
    data: leaveRequest,
    message: "Leave request submitted successfully",
  });
});

// Get leave requests (role-based)
const getLeaveRequests = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    department,
    search,
    leaveType,
  } = req.query;
  const userId = req.user._id;
  const userRole = req.user.role;

  let query = {};

  // Role-based filtering
  if (userRole.level === 1000) {
    // Super Admin: can see all requests
  } else if (userRole.level === 700) {
    // HOD: can see requests from their department
    query.department = req.user.department;
  } else if (userRole.level === 600) {
    // Manager: can see requests from their department and their own requests
    query.$or = [{ department: req.user.department }, { employee: userId }];
  } else {
    // Staff/Viewer: can only see their own requests
    query.employee = userId;
  }

  // Apply filters
  if (status) query.status = status;
  if (department && userRole.level >= 700) query.department = department;
  if (leaveType) query.leaveType = leaveType;

  // Search functionality
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const employees = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
      ],
    }).select("_id");

    query.employee = { $in: employees.map((emp) => emp._id) };
  }

  // Calculate pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build the query with populate
  let leaveRequestsQuery = LeaveRequest.find(query)
    .populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId",
      },
      { path: "department", select: "name" },
      { path: "currentApprover", select: "firstName lastName email" },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Execute query and get total count
  const [leaveRequests, total] = await Promise.all([
    leaveRequestsQuery.exec(),
    LeaveRequest.countDocuments(query),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  const paginatedData = {
    docs: leaveRequests,
    totalDocs: total,
    limit: limitNum,
    page: pageNum,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? pageNum + 1 : null,
    prevPage: hasPrevPage ? pageNum - 1 : null,
  };

  return res.status(200).json({
    success: true,
    data: paginatedData,
    message: "Leave requests retrieved successfully",
  });
});

// Get leave request by ID
const getLeaveRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  const leaveRequest = await LeaveRequest.findById(id).populate([
    {
      path: "employee",
      select: "firstName lastName email avatar employeeId role",
    },
    { path: "department", select: "name" },
    { path: "currentApprover", select: "firstName lastName email role" },
    { path: "approvals.approver", select: "firstName lastName email role" },
  ]);

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found",
    });
  }

  // Check access permissions
  const canAccess =
    userRole.level === 1000 || // Super Admin
    leaveRequest.employee._id.equals(userId) || // Own request
    (userRole.level >= 600 &&
      leaveRequest.department._id.equals(req.user.department)) || // Same department
    leaveRequest.currentApprover?._id.equals(userId); // Current approver

  if (!canAccess) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  return res.status(200).json({
    success: true,
    data: leaveRequest,
    message: "Leave request retrieved successfully",
  });
});

// Approve/Reject leave request
const approveLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, comment } = req.body; // action: "approve" or "reject"
  const userId = req.user._id;
  const userRole = req.user.role;

  const leaveRequest = await LeaveRequest.findById(id).populate([
    { path: "employee", select: "firstName lastName email" },
    { path: "department", select: "name" },
  ]);

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found",
    });
  }

  // Check if user can approve this request
  if (!canApprove(userRole.level, leaveRequest.approvalLevel)) {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to approve this request",
    });
  }

  const isCurrentApprover = leaveRequest.currentApprover.equals(userId);

  const canOverride =
    userRole.level >= 1000 ||
    (userRole.level === 700 && leaveRequest.approvalLevel <= 2) ||
    (userRole.level === 600 && leaveRequest.approvalLevel === 1);

  if (!isCurrentApprover && !canOverride) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to approve this request",
    });
  }

  await leaveRequest.addApproval(
    userId,
    getRoleName(userRole),
    action === "approve" ? "Approved" : "Rejected",
    comment
  );

  // Update request status
  if (action === "approve") {
    // Check if this is the final approval
    const employee = await User.findById(leaveRequest.employee).populate(
      "role"
    );

    // Determine if this is final approval based on who is approving
    const isFinalApproval =
      userRole.level === 1000 || // Super Admin approval is always final
      (employee.role.level === 300 && userRole.level >= 600) || // Staff approved by Manager or higher
      (employee.role.level === 600 && userRole.level >= 700) || // Manager approved by HOD or higher
      (employee.role.level === 700 && userRole.level >= 1000); // HOD approved by Super Admin

    if (isFinalApproval) {
      leaveRequest.status = "Approved";
      leaveRequest.approvedAt = new Date();
      leaveRequest.currentApprover = null;
    } else {
      // Move to next approver
      const nextApprover = await getNextApprover(
        employee.role.level,
        leaveRequest.department
      );
      if (nextApprover) {
        leaveRequest.currentApprover = nextApprover._id;
        leaveRequest.approvalLevel += 1;

        // Add next approval entry
        await leaveRequest.addApproval(
          nextApprover._id,
          getRoleName(nextApprover.role),
          "Pending"
        );

        // Send notification to next approver
        await Notification.create({
          recipient: nextApprover._id,
          type: "leave_request",
          title: "Leave Request Requires Approval",
          message: `A leave request from ${employee.firstName} ${employee.lastName} requires your approval`,
          data: {
            leaveRequestId: leaveRequest._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            leaveType: leaveRequest.leaveType,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
          },
        });
      }
    }
  } else {
    // Rejected
    leaveRequest.status = "Rejected";
    leaveRequest.rejectedAt = new Date();
    leaveRequest.currentApprover = null;
  }

  await leaveRequest.save();

  // Send notification to employee
  await Notification.create({
    recipient: leaveRequest.employee._id,
    type: "leave_response",
    title: `Leave Request ${action === "approve" ? "Approved" : "Rejected"}`,
    message: `Your leave request has been ${
      action === "approve" ? "approved" : "rejected"
    } by ${req.user.firstName} ${req.user.lastName}`,
    data: {
      leaveRequestId: leaveRequest._id,
      status: leaveRequest.status,
      approverName: `${req.user.firstName} ${req.user.lastName}`,
      comment,
    },
  });

  // Populate for response
  await leaveRequest.populate([
    { path: "employee", select: "firstName lastName email avatar employeeId" },
    { path: "department", select: "name" },
    { path: "currentApprover", select: "firstName lastName email" },
    { path: "approvals.approver", select: "firstName lastName email role" },
  ]);

  return res.status(200).json({
    success: true,
    data: leaveRequest,
    message: `Leave request ${
      action === "approve" ? "approved" : "rejected"
    } successfully`,
  });
});

// Cancel leave request
const cancelLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const leaveRequest = await LeaveRequest.findById(id);

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found",
    });
  }

  // Check if user can cancel this request
  const canCancel =
    req.user.role.level === 1000 || leaveRequest.employee.equals(userId);

  if (!canCancel) {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to cancel this request",
    });
  }

  // Check if request can be cancelled
  if (leaveRequest.status !== "Pending") {
    return res.status(400).json({
      success: false,
      message: "Only pending requests can be cancelled",
    });
  }

  leaveRequest.status = "Cancelled";
  leaveRequest.cancelledAt = new Date();
  leaveRequest.cancelledBy = userId;
  leaveRequest.cancellationReason = reason;
  leaveRequest.currentApprover = null;

  await leaveRequest.save();

  // Send notification to current approver if exists
  if (leaveRequest.currentApprover) {
    await Notification.create({
      recipient: leaveRequest.currentApprover,
      type: "leave_cancelled",
      title: "Leave Request Cancelled",
      message: `A leave request has been cancelled by ${req.user.firstName} ${req.user.lastName}`,
      data: {
        leaveRequestId: leaveRequest._id,
        cancelledBy: `${req.user.firstName} ${req.user.lastName}`,
        reason,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: leaveRequest,
    message: "Leave request cancelled successfully",
  });
});

// Get leave statistics
const getLeaveStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let filters = {};

  // Role-based filtering
  if (userRole.level === 1000) {
    // Super Admin: all stats
  } else if (userRole.level === 700) {
    // HOD: department stats
    filters.department = req.user.department;
  } else if (userRole.level === 600) {
    // Manager: department stats
    filters.department = req.user.department;
  } else {
    // Staff/Viewer: own stats
    filters.employee = userId;
  }

  const stats = await LeaveRequest.getStats(filters);

  return res.status(200).json({
    success: true,
    data: stats,
    message: "Leave statistics retrieved successfully",
  });
});

// Get pending approvals for current user
const getPendingApprovals = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  // Only managers and above can have pending approvals
  if (userRole.level < 600) {
    return res.status(200).json({
      success: true,
      data: { docs: [], totalDocs: 0 },
      message: "No pending approvals",
    });
  }

  const query = {
    currentApprover: userId,
    status: "Pending",
  };

  // HOD can see department requests, Super Admin can see all
  if (userRole.level === 700) {
    query.department = req.user.department;
  }

  let pendingApprovalsQuery = LeaveRequest.find(query)
    .populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId role",
      },
      { path: "department", select: "name" },
    ])
    .sort({ createdAt: -1 })
    .limit(50);

  const [pendingApprovals, total] = await Promise.all([
    pendingApprovalsQuery.exec(),
    LeaveRequest.countDocuments(query),
  ]);

  const paginatedData = {
    docs: pendingApprovals,
    totalDocs: total,
    limit: 50,
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
  };

  return res.status(200).json({
    success: true,
    data: paginatedData,
    message: "Pending approvals retrieved successfully",
  });
});

export {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  cancelLeaveRequest,
  getLeaveStats,
  getPendingApprovals,
};
