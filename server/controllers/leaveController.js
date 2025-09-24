import { asyncHandler } from "../utils/asyncHandler.js";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";
import mongoose from "mongoose";

const notificationService = new NotificationService();

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

// Helper function to check if user can approve based on role and department
const canApprove = (
  userRole,
  userDepartment,
  requestLevel,
  requestDepartment
) => {
  // Super Admin can approve all requests
  if (userRole === 1000) return true;

  // HR HOD can approve ALL requests across the company (ELRA regulatory role)
  if (userRole === 700 && userDepartment?.name === "Human Resources")
    return true;

  // Other HODs can approve requests from their department
  if (userRole === 700 && userDepartment.equals(requestDepartment)) return true;

  // Manager can approve requests from their department (for direct reports)
  if (userRole === 600 && userDepartment.equals(requestDepartment)) return true;

  return false;
};

/*
 * CORRECTED LEAVE APPROVAL FLOW:
 *
 * 1. STAFF (300) → Department HOD → HR HOD → APPROVED
 *    SPECIAL CASE: HR Staff → HR HOD → APPROVED (no double approval)
 * 2. MANAGER (600) → Department HOD → HR HOD → APPROVED
 *    SPECIAL CASE: HR Manager → HR HOD → APPROVED (no double approval)
 * 3. HOD (700, not HR) → HR HOD → APPROVED (no Super Admin required)
 * 4. HR HOD (700) → Super Admin → APPROVED (can't self-approve)
 * 5. SUPER_ADMIN (1000) → Auto-approved + notifies HR HOD
 *
 * Benefits:
 * - Department HODs see their team's requests first
 * - HR HOD provides regulatory oversight
 * - HR staff avoid redundant approval steps
 * - HOD requests stop at HR HOD (no unnecessary escalation)
 * - Super Admin can approve ANY request but not required
 * - Clear approval chain for all users
 */

// Helper function to get complete approval chain for a role
const getApprovalChain = (employeeRole, employeeDepartment) => {
  if (employeeRole === 1000) {
    return ["Auto-approved"];
  } else if (employeeRole === 700) {
    return ["HR HOD"];
  } else if (employeeRole === 600) {
    // SPECIAL CASE: HR staff go directly to HR HOD
    if (employeeDepartment?.name === "Human Resources") {
      return ["HR HOD"];
    }
    return ["Department HOD", "HR HOD"];
  } else if (employeeRole === 300) {
    // SPECIAL CASE: HR staff go directly to HR HOD
    if (employeeDepartment?.name === "Human Resources") {
      return ["HR HOD"];
    }
    return ["Department HOD", "HR HOD"];
  }
  return ["Unknown"];
};

// Helper function to get next approver based on employee role and department
const getNextApprover = async (
  employeeRole,
  departmentId,
  employeeDepartment
) => {
  console.log("🔍 [getNextApprover] Input params:", {
    employeeRole,
    departmentId,
    employeeDepartment: employeeDepartment?.name || employeeDepartment?._id,
    employeeDepartmentType: typeof employeeDepartment,
  });

  // Get the HOD role first (like project controller does)
  const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });
  if (!hodRole) {
    console.log("❌ [getNextApprover] HOD role not found in database");
    return null;
  }
  console.log("🔍 [getNextApprover] HOD role found:", hodRole._id);

  if (employeeRole === 1000) {
    console.log("✅ [getNextApprover] Super Admin - auto-approves");
    return null;
  } else if (employeeRole === 700) {
    console.log("🔍 [getNextApprover] HOD - looking for HR HOD");
    const hrHOD = await User.findOne({
      role: hodRole._id,
      "department.name": "Human Resources",
    }).populate("role");
    console.log(
      "🔍 [getNextApprover] HR HOD found:",
      hrHOD ? `${hrHOD.firstName} ${hrHOD.lastName}` : "NOT FOUND"
    );
    return hrHOD;
  } else if (employeeRole === 600) {
    console.log(
      "🔍 [getNextApprover] Manager - looking for Department HOD first"
    );
    const deptHOD = await User.findOne({
      role: hodRole._id,
      department: employeeDepartment,
    }).populate("role");
    console.log(
      "🔍 [getNextApprover] Department HOD found:",
      deptHOD ? `${deptHOD.firstName} ${deptHOD.lastName}` : "NOT FOUND"
    );
    if (deptHOD) {
      return deptHOD;
    }
    console.log(
      "🔍 [getNextApprover] No Department HOD, falling back to HR HOD"
    );
    const hrHOD = await User.findOne({
      role: hodRole._id,
      "department.name": "Human Resources",
    }).populate("role");
    console.log(
      "🔍 [getNextApprover] HR HOD fallback found:",
      hrHOD ? `${hrHOD.firstName} ${hrHOD.lastName}` : "NOT FOUND"
    );
    return hrHOD;
  } else if (employeeRole === 300) {
    console.log(
      "🔍 [getNextApprover] Staff - checking department:",
      employeeDepartment?.name
    );

    if (employeeDepartment?.name === "Human Resources") {
      console.log("🔍 [getNextApprover] HR Staff - going directly to HR HOD");
      const hrHOD = await User.findOne({
        role: hodRole._id,
        "department.name": "Human Resources",
      }).populate("role");
      console.log(
        "🔍 [getNextApprover] HR HOD found:",
        hrHOD ? `${hrHOD.firstName} ${hrHOD.lastName}` : "NOT FOUND"
      );
      return hrHOD;
    }

    console.log(
      "🔍 [getNextApprover] Non-HR Staff - looking for Department HOD first"
    );
    const deptHOD = await User.findOne({
      role: hodRole._id,
      department: employeeDepartment,
    }).populate("role");
    console.log(
      "🔍 [getNextApprover] Department HOD found:",
      deptHOD ? `${deptHOD.firstName} ${deptHOD.lastName}` : "NOT FOUND"
    );
    if (deptHOD) {
      return deptHOD;
    }
    console.log(
      "🔍 [getNextApprover] No Department HOD, falling back to HR HOD"
    );
    // Fallback to HR HOD if no department HOD
    const hrHOD = await User.findOne({
      role: hodRole._id,
      "department.name": "Human Resources",
    }).populate("role");
    console.log(
      "🔍 [getNextApprover] HR HOD fallback found:",
      hrHOD ? `${hrHOD.firstName} ${hrHOD.lastName}` : "NOT FOUND"
    );
    return hrHOD;
  }
  console.log("❌ [getNextApprover] No approver found for role:", employeeRole);
  return null;
};

// Create leave request
const createLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, days, reason } = req.body;
  const userId = req.user._id;

  console.log("🚀 [leaveController] Creating leave request:", {
    userId,
    userRole: req.user.role?.level,
    userRoleName: getRoleName(req.user.role?.level),
    leaveType,
    startDate,
    endDate,
    days,
    reason,
  });

  // Check if user can request leave
  if (req.user.role?.level === 100) {
    return res.status(403).json({
      success: false,
      message: "Viewers cannot request leave",
    });
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: "End date must be after start date",
    });
  }

  if (start < now) {
    return res.status(400).json({
      success: false,
      message: "Cannot request leave for past dates",
    });
  }

  const activeLeave = await LeaveRequest.findOne({
    employee: userId,
    status: "Approved",
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  if (activeLeave) {
    return res.status(400).json({
      success: false,
      message:
        "You currently have an active approved leave. You can create a new request after your current leave ends.",
      data: {
        currentLeave: {
          id: activeLeave._id,
          leaveType: activeLeave.leaveType,
          startDate: activeLeave.startDate,
          endDate: activeLeave.endDate,
        },
      },
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

  const isSuperAdminRequest = req.user.role?.level === 1000;

  let nextApprover = null;
  let approvalLevel = 1;
  let initialStatus = "Pending";

  if (isSuperAdminRequest) {
    initialStatus = "Approved";
    approvalLevel = 3;
  } else {
    console.log("🔍 [createLeaveRequest] Calling getNextApprover with:", {
      userRole: req.user.role?.level,
      userDepartment: req.user.department,
      userDepartmentName: req.user.department?.name,
      userDepartmentId: req.user.department?._id,
    });

    nextApprover = await getNextApprover(
      req.user.role?.level,
      req.user.department,
      req.user.department
    );

    if (!nextApprover) {
      return res.status(400).json({
        success: false,
        message: "No approver found for your request",
      });
    }

    // Set approval level based on role hierarchy
    if (req.user.role?.level === 700) {
      // HOD: Department HOD → HR HOD → Super Admin (if needed)
      approvalLevel = 2;
    } else if (req.user.role?.level === 600) {
      // Manager: Department HOD → HR HOD
      approvalLevel = 2;
    } else {
      // Staff: Department HOD → HR HOD
      approvalLevel = 2;
    }
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
    currentApprover: nextApprover?._id || null,
    approvalLevel: approvalLevel,
    approvalChain: getApprovalChain(req.user.role?.level, req.user.department),
    totalApprovalSteps: getApprovalChain(
      req.user.role?.level,
      req.user.department
    ).length,
    status: initialStatus,
    approvedAt: isSuperAdminRequest ? new Date() : null,
  });

  if (isSuperAdminRequest) {
    // Add auto-approval entry for Super Admin
    await leaveRequest.addApproval(
      userId,
      getRoleName(req.user.role?.level),
      "Approved",
      "Auto-approved by Super Admin"
    );

    const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });
    const hrHOD = await User.findOne({
      role: hodRole._id,
      "department.name": "Human Resources",
    }).populate("role");

    if (hrHOD) {
      await Notification.create({
        recipient: hrHOD._id,
        type: "LEAVE_REQUEST",
        title: "Super Admin Leave Request",
        message: `${req.user.firstName} ${req.user.lastName} (Super Admin) has taken leave`,
        data: {
          leaveRequestId: leaveRequest._id,
          employeeName: `${req.user.firstName} ${req.user.lastName}`,
          employeeRole: "SUPER_ADMIN",
          employeeDepartment: "System Administration",
          leaveType,
          startDate: start,
          endDate: end,
          status: "Auto-approved",
          isSuperAdminRequest: true,
        },
      });
    }
  } else {
    // Add initial approval entry for other roles
    await leaveRequest.addApproval(
      nextApprover._id,
      getRoleName(nextApprover.role?.level),
      "Pending"
    );

    // Notify Super Admin about ALL leave requests (as requested)
    const superAdminRole = await mongoose
      .model("Role")
      .findOne({ name: "SUPER_ADMIN" });
    const superAdmin = await User.findOne({ role: superAdminRole._id });
    if (superAdmin) {
      await Notification.create({
        recipient: superAdmin._id,
        type: "LEAVE_REQUEST",
        title: "New Leave Request",
        message: `${req.user.firstName} ${req.user.lastName} has submitted a leave request`,
        data: {
          leaveRequestId: leaveRequest._id,
          employeeName: `${req.user.firstName} ${req.user.lastName}`,
          employeeRole: getRoleName(req.user.role?.level),
          employeeDepartment: req.user.department?.name || "Unknown",
          leaveType,
          startDate: start,
          endDate: end,
          status: "Pending",
          isSuperAdminNotification: true,
        },
      });
    }
  }

  // Send notification based on request type
  if (isSuperAdminRequest) {
    console.log(
      "🔔 [leaveController] Creating auto-approval notification for Super Admin"
    );
    await Notification.create({
      recipient: userId,
      type: "LEAVE_RESPONSE",
      title: "Leave Request Auto-Approved",
      message: `Your leave request has been automatically approved`,
      data: {
        leaveRequestId: leaveRequest._id,
        status: "Approved",
        approverName: `${req.user.firstName} ${req.user.lastName}`,
        comment: "Auto-approved by Super Admin",
      },
    });
    console.log(
      "✅ [leaveController] Auto-approval notification created successfully"
    );
  } else {
    console.log(
      "🔔 [leaveController] Creating approval request notification for:",
      nextApprover._id
    );
    await Notification.create({
      recipient: nextApprover._id,
      type: "LEAVE_REQUEST",
      title: "New Leave Request",
      message: `${req.user.firstName} ${req.user.lastName} submitted a ${leaveType} leave request (${days} days). Please review and approve.`,
      data: {
        leaveRequestId: leaveRequest._id,
        employeeName: `${req.user.firstName} ${req.user.lastName}`,
        employeeRole: getRoleName(req.user.role?.level),
        employeeDepartment: req.user.department?.name || "Unknown",
        leaveType,
        startDate: start,
        endDate: end,
        approverName: `${nextApprover.firstName} ${nextApprover.lastName}`,
        approverRole: getRoleName(nextApprover.role?.level),
        approverDepartment: nextApprover.department?.name || "Unknown",
        approvalLevel: approvalLevel,
        isFirstApproval: true,
        approvalChain: getApprovalChain(
          req.user.role?.level,
          req.user.department
        ),
        totalApprovalSteps: getApprovalChain(
          req.user.role?.level,
          req.user.department
        ).length,
      },
    });
    console.log(
      "✅ [leaveController] Approval request notification created successfully"
    );

    // Create a simple message for the requester
    let requesterTitle = "Leave Request Submitted";
    let requesterMessage = `Your ${leaveType} leave request (${days} days) has been submitted and is pending approval.`;

    await Notification.create({
      recipient: userId,
      type: "LEAVE_REQUEST",
      title: requesterTitle,
      message: requesterMessage,
      data: {
        leaveRequestId: leaveRequest._id,
        leaveType,
        startDate: start,
        endDate: end,
        days,
        status: "Pending",
        currentApprover: nextApprover._id,
        approverName: `${nextApprover.firstName} ${nextApprover.lastName}`,
        approverRole: getRoleName(nextApprover.role?.level),
        approverDepartment: nextApprover.department?.name || "Unknown",
        approvalLevel: approvalLevel,
        isFirstApproval: true,
        approvalChain: getApprovalChain(
          req.user.role?.level,
          req.user.department
        ),
        totalApprovalSteps: getApprovalChain(
          req.user.role?.level,
          req.user.department
        ).length,
      },
    });
    console.log(
      "✅ [leaveController] Requester notification created successfully"
    );
  }

  // Populate employee and department details
  await leaveRequest.populate([
    { path: "employee", select: "firstName lastName email avatar employeeId" },
    { path: "department", select: "name" },
    { path: "currentApprover", select: "firstName lastName email" },
  ]);

  // Log audit for leave request creation
  try {
    await AuditService.logLeaveAction(
      userId,
      "LEAVE_REQUEST_CREATED",
      leaveRequest._id,
      {
        leaveType,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: initialStatus,
        employeeName: `${req.user.firstName} ${req.user.lastName}`,
        department: req.user.department,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );
    console.log(
      "✅ [leaveController] Audit log created for leave request creation"
    );
  } catch (auditError) {
    console.error("❌ [leaveController] Audit logging error:", auditError);
  }

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
  if (userRole?.level === 1000) {
    // Super Admin: can see all requests
  } else if (userRole?.level === 700) {
    // HR HOD: can see ALL requests across the company (ELRA regulatory role)
    if (req.user.department?.name === "Human Resources") {
      // HR HOD can see all requests - no department filter
    } else {
      // Other HODs: can see requests from their department
      query.department = req.user.department;
    }
  } else if (userRole?.level === 600) {
    // Manager: can see requests from their department and their own requests
    query.$or = [{ department: req.user.department }, { employee: userId }];
  } else {
    // Staff/Viewer: can only see their own requests
    query.employee = userId;
  }

  // Apply filters
  if (status) query.status = status;
  if (department && userRole?.level >= 700) query.department = department;
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
      {
        path: "approvals.approver",
        select: "firstName lastName email",
      },
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

// Get leave requests for the logged-in user only
const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  console.log("🔍 [leaveController] Getting leave requests for user:", userId);

  try {
    const leaveRequests = await LeaveRequest.find({ employee: userId })
      .populate([
        {
          path: "employee",
          select: "firstName lastName email avatar employeeId",
        },
        { path: "department", select: "name" },
        { path: "currentApprover", select: "firstName lastName email" },
      ])
      .sort({ createdAt: -1 });

    console.log(
      "✅ [leaveController] Found",
      leaveRequests.length,
      "leave requests for user"
    );

    return res.status(200).json({
      success: true,
      data: leaveRequests,
      message: "Leave requests retrieved successfully",
    });
  } catch (error) {
    console.error(
      "❌ [leaveController] Error getting user leave requests:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve leave requests",
    });
  }
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
    userRole?.level === 1000 ||
    leaveRequest.employee._id.equals(userId) ||
    (userRole?.level === 700 &&
      req.user.department?.name === "Human Resources") ||
    (userRole?.level >= 600 &&
      leaveRequest.department._id.equals(req.user.department)) ||
    leaveRequest.currentApprover?._id.equals(userId);

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

  // Initialize variables for approval flow
  let nextApprover = null;

  // Check if user can approve this request
  if (
    !canApprove(
      userRole.level,
      req.user.department,
      leaveRequest.approvalLevel,
      leaveRequest.department
    )
  ) {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to approve this request",
    });
  }

  const isCurrentApprover =
    leaveRequest.currentApprover && leaveRequest.currentApprover.equals(userId);

  const canOverride =
    userRole?.level >= 1000 ||
    (userRole?.level === 700 && leaveRequest.approvalLevel <= 2) ||
    (userRole?.level === 600 && leaveRequest.approvalLevel === 1);

  if (!isCurrentApprover && !canOverride) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to approve this request",
    });
  }

  await leaveRequest.addApproval(
    userId,
    getRoleName(userRole?.level),
    action === "approve" ? "Approved" : "Rejected",
    comment
  );

  // Update request status
  if (action === "approve") {
    // Check if this is the final approval
    const employee = await User.findById(leaveRequest.employee).populate([
      "role",
      "department",
    ]);

    // Determine if this is final approval based on new flow
    let isFinalApproval = false;

    if (userRole?.level === 1000) {
      // Super Admin approval is always final
      isFinalApproval = true;
    } else if (
      userRole?.level === 700 &&
      req.user.department?.name === "Human Resources"
    ) {
      // HR HOD approval - check if needs Super Admin
      if (employee.role?.level === 700) {
        // HOD request approved by HR HOD is final (no Super Admin required)
        isFinalApproval = true;
      } else {
        // Staff/Manager request approved by HR HOD is final
        isFinalApproval = true;
      }
    } else if (
      userRole?.level === 700 &&
      req.user.department?.name !== "Human Resources"
    ) {
      const hodRole = await Role.findOne({ name: "HOD" });
      if (!hodRole) {
        throw new Error("HOD role not found");
      }

      const hrDepartment = await Department.findOne({
        name: "Human Resources",
      });
      if (!hrDepartment) {
        throw new Error("Human Resources department not found");
      }

      nextApprover = await User.findOne({
        role: hodRole._id,
        department: hrDepartment._id,
        isActive: true,
      });

      if (nextApprover) {
        leaveRequest.currentApprover = nextApprover._id;
        leaveRequest.approvalLevel += 1;

        // Add next approval entry
        await leaveRequest.addApproval(nextApprover._id, "HOD", "Pending");

        // Send notification to HR HOD
        await Notification.create({
          recipient: nextApprover._id,
          type: "LEAVE_REQUEST",
          title: "Leave Request Ready for HR Approval",
          message: `${employee.firstName} ${employee.lastName}'s ${leaveRequest.leaveType} leave request (${leaveRequest.days} days) has been approved by Department HOD. Ready for your final approval.`,
          data: {
            leaveRequestId: leaveRequest._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeRole: getRoleName(employee.role?.level),
            employeeDepartment: employee.department?.name || "Unknown",
            leaveType: leaveRequest.leaveType,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
            approverName: `${nextApprover.firstName} ${nextApprover.lastName}`,
            approverRole: "HR HOD",
            approverDepartment: "Human Resources",
            approvalLevel: leaveRequest.approvalLevel,
            isFirstApproval: false,
            previousApprover: `${req.user.firstName} ${req.user.lastName}`,
            previousApproverRole: "Department HOD",
            previousApproverDepartment: req.user.department?.name || "Unknown",
          },
        });

        // Also notify the employee about Department HOD approval
        await Notification.create({
          recipient: leaveRequest.employee._id,
          type: "LEAVE_RESPONSE",
          title: "Department Approval Granted! 🎉",
          message: `Great news! Your leave request has been approved by ${req.user.firstName} ${req.user.lastName} (${req.user.department?.name} Department Head).

✅ Department Approval: COMPLETED
⏳ Final Approval: Pending HR Department Head

Your request is now with ${nextApprover.firstName} ${nextApprover.lastName} (HR Department Head) for final company approval.

📋 What Happens Next:
• HR will review your request for company policy compliance
• This is the final approval step
• You'll be notified once HR makes their decision

💡 Tip: Department approval means your immediate supervisor supports your leave request.`,
          data: {
            leaveRequestId: leaveRequest._id,
            status: "Pending",
            approverName: `${req.user.firstName} ${req.user.lastName}`,
            approverRole: "Department HOD",
            approverDepartment: req.user.department?.name || "Unknown",
            nextApprover: `${nextApprover.firstName} ${nextApprover.lastName}`,
            nextApproverRole: "HR HOD",
            nextApproverDepartment: "Human Resources",
            isFirstApproval: true,
            comment: "Approved by Department Head, pending HR approval",
          },
        });
      }
    }

    if (isFinalApproval) {
      leaveRequest.status = "Approved";
      leaveRequest.approvedAt = new Date();
      leaveRequest.currentApprover = null;

      // If this is HR HOD final approval, send a special notification to the employee
      if (
        userRole?.level === 700 &&
        req.user.department?.name === "Human Resources"
      ) {
        await Notification.create({
          recipient: leaveRequest.employee._id,
          type: "LEAVE_RESPONSE",
          title: "Leave Request Approved",
          message: `Your leave request has been fully approved. Enjoy your time off!`,
          data: {
            leaveRequestId: leaveRequest._id,
            status: "Approved",
            approverName: `${req.user.firstName} ${req.user.lastName}`,
            approverRole: "HR HOD",
            approverDepartment: "Human Resources",
            isFinalApproval: true,
            comment: "Final approval granted by HR Department Head",
          },
        });

        if (leaveRequest.approvals && leaveRequest.approvals.length > 0) {
          const departmentHODApproval = leaveRequest.approvals.find(
            (approval) =>
              approval.status === "Approved" &&
              approval.role === "HOD" &&
              approval.approver.toString() !== req.user._id.toString()
          );

          if (departmentHODApproval) {
            await Notification.create({
              recipient: departmentHODApproval.approver,
              type: "LEAVE_REQUEST_UPDATE",
              title: "Leave Request Finalized by HR",
              message: `A leave request you approved has received final HR approval.`,
              data: {
                leaveRequestId: leaveRequest._id,
                employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
                employeeRole: getRoleName(leaveRequest.employee.role?.level),
                employeeDepartment: leaveRequest.department?.name || "Unknown",
                leaveType: leaveRequest.leaveType,
                startDate: leaveRequest.startDate,
                endDate: leaveRequest.endDate,
                days: leaveRequest.days,
                status: "Approved",
                hrHODName: `${req.user.firstName} ${req.user.lastName}`,
                isFinalApproval: true,
              },
            });
          }
        }
      }
    }
  } else {
    // Rejected
    leaveRequest.status = "Rejected";
    leaveRequest.rejectedAt = new Date();
    leaveRequest.currentApprover = null;
  }

  await leaveRequest.save();

  // Clean up any redundant approval entries
  await leaveRequest.cleanupApprovals();

  // Send notification to employee
  let employeeTitle = `Leave Request ${
    action === "approve" ? "Approved" : "Rejected"
  }`;
  let employeeMessage = "";

  if (action === "approve") {
    if (nextApprover) {
      // First level approval - notify about progress
      if (
        userRole?.level === 700 &&
        req.user.department?.name !== "Human Resources"
      ) {
      } else {
        // Other first level approvals
        employeeTitle = "First Level Approval Granted! 🎉";
        employeeMessage = `Great news! Your leave request has been approved by ${
          req.user.firstName
        } ${req.user.lastName} (${getRoleName(req.user.role?.level)}).

✅ First approval: COMPLETED
⏳ Final approval: Pending HR Department Head

Your request is now with ${nextApprover.firstName} ${
          nextApprover.lastName
        } for final approval. You'll be notified once it's fully approved.`;
      }
    } else {
      // Final approval
      if (
        userRole?.level === 700 &&
        req.user.department?.name === "Human Resources"
      ) {
        // HR HOD final approval - skip duplicate notification and continue to response
      } else {
        // Other final approvals
        employeeTitle = "Leave Request Approved";
        employeeMessage = `Your leave request has been approved. Enjoy your time off!`;
      }
    }
  } else {
    // Rejected - Different messages based on who rejected and at what level
    if (
      userRole?.level === 700 &&
      req.user.department?.name === "Human Resources"
    ) {
      // HR HOD rejection (final rejection)
      employeeTitle = "Leave Request Rejected";
      employeeMessage = `Your leave request has been rejected. Reason: ${
        comment || "No reason provided"
      }`;
    } else if (
      userRole?.level === 700 &&
      req.user.department?.name !== "Human Resources"
    ) {
      // Department HOD rejection (first level rejection)
      employeeTitle = "Leave Request Rejected";
      employeeMessage = `Your leave request has been rejected by your Department Head. Reason: ${
        comment || "No reason provided"
      }`;
    } else {
      employeeTitle = "Leave Request Rejected";
      employeeMessage = `Your leave request has been rejected. Reason: ${
        comment || "No reason provided"
      }`;
    }
  }

  if (employeeMessage && employeeMessage.trim().length > 0) {
    await Notification.create({
      recipient: leaveRequest.employee._id,
      type: "LEAVE_RESPONSE",
      title: employeeTitle,
      message: employeeMessage,
      data: {
        leaveRequestId: leaveRequest._id,
        status: leaveRequest.status,
        approverName: `${req.user.firstName} ${req.user.lastName}`,
        approverRole: getRoleName(req.user.role?.level),
        approverDepartment: req.user.department?.name || "Unknown",
        comment,
        isFinalApproval: leaveRequest.status === "Approved",
        nextApprover: nextApprover
          ? `${nextApprover.firstName} ${nextApprover.lastName}`
          : null,
        nextApproverRole: nextApprover
          ? getRoleName(nextApprover.role?.level)
          : null,
      },
    });
  }

  if (
    action === "reject" &&
    userRole?.level === 700 &&
    req.user.department?.name === "Human Resources" &&
    leaveRequest.approvals &&
    leaveRequest.approvals.length > 0
  ) {
    // Find the Department HOD who approved this request
    const departmentHODApproval = leaveRequest.approvals.find(
      (approval) =>
        approval.status === "Approved" &&
        approval.role === "HOD" &&
        approval.approver.toString() !== req.user._id.toString()
    );

    if (departmentHODApproval) {
      await Notification.create({
        recipient: departmentHODApproval.approver,
        type: "LEAVE_REQUEST_UPDATE",
        title: "Leave Request Rejected by HR",
        message: `A leave request that you previously approved has been rejected by ${
          req.user.firstName
        } ${req.user.lastName} (HR Department Head).

📋 Request Details:
• Employee: ${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}
• Leave Type: ${leaveRequest.leaveType}
• Duration: ${leaveRequest.days} day(s)
• Period: ${new Date(leaveRequest.startDate).toLocaleDateString()} - ${new Date(
          leaveRequest.endDate
        ).toLocaleDateString()}

❌ Rejection Reason: ${comment || "No reason provided"}

The employee has been notified and can submit a new request with the necessary changes.`,
        data: {
          leaveRequestId: leaveRequest._id,
          employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
          employeeRole: getRoleName(leaveRequest.employee.role?.level),
          employeeDepartment: leaveRequest.department?.name || "Unknown",
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          days: leaveRequest.days,
          rejectionReason: comment,
          hrHODName: `${req.user.firstName} ${req.user.lastName}`,
          isHRRejection: true,
        },
      });
    }
  }

  // Notify Super Admin about ALL leave request updates (as requested)
  // First find the Super Admin role by level
  const superAdminRole = await Role.findOne({ level: 1000 });
  if (superAdminRole) {
    const superAdmin = await User.findOne({ role: superAdminRole._id });
    if (superAdmin && !req.user.role?.level === 1000) {
      // Don't notify if Super Admin is the one acting
      await Notification.create({
        recipient: superAdmin._id,
        type: "LEAVE_REQUEST_UPDATE",
        title: "Leave Request Updated",
        message: `Leave request from ${leaveRequest.employee.firstName} ${
          leaveRequest.employee.lastName
        } has been ${action === "approve" ? "approved" : "rejected"}`,
        data: {
          leaveRequestId: leaveRequest._id,
          employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
          employeeRole: getRoleName(leaveRequest.employee.role?.level),
          employeeDepartment:
            leaveRequest.employee.department?.name || "Unknown",
          action: action === "approve" ? "Approved" : "Rejected",
          approverName: `${req.user.firstName} ${req.user.lastName}`,
          approverRole: getRoleName(userRole?.level),
          approverDepartment: req.user.department?.name || "Unknown",
          comment,
          status: leaveRequest.status,
          isFinalApproval: leaveRequest.status === "Approved",
        },
      });
    }
  }

  try {
    const auditAction =
      action === "approve"
        ? "LEAVE_REQUEST_APPROVED"
        : "LEAVE_REQUEST_REJECTED";
    await AuditService.logLeaveAction(userId, auditAction, leaveRequest._id, {
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      days: leaveRequest.days,
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      approverName: `${req.user.firstName} ${req.user.lastName}`,
      comment,
      employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
      department: leaveRequest.department,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
    console.log(
      `✅ [leaveController] Audit log created for leave request ${action}`
    );
  } catch (auditError) {
    console.error("❌ [leaveController] Audit logging error:", auditError);
    // Don't fail the main operation if audit logging fails
  }

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

// Update leave request (only for pending requests by the creator)
const updateLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { leaveType, startDate, endDate, days, reason } = req.body;
  const userId = req.user._id;

  console.log("🔧 [leaveController] Updating leave request:", {
    requestId: id,
    userId,
    updates: { leaveType, startDate, endDate, days, reason },
  });

  const leaveRequest = await LeaveRequest.findById(id);

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found",
    });
  }

  // Check if user can edit this request
  if (!leaveRequest.employee.equals(userId)) {
    return res.status(403).json({
      success: false,
      message: "You can only edit your own leave requests",
    });
  }

  // Check if request can be edited (only pending requests, not approved/rejected)
  if (leaveRequest.status !== "Pending") {
    return res.status(400).json({
      success: false,
      message: "Only pending requests can be edited",
    });
  }

  // Check if request has been approved (final approval)
  const hasFinalApproval =
    leaveRequest.approvals &&
    leaveRequest.approvals.some(
      (approval) => approval.status === "Approved" && approval.level === "final"
    );

  if (hasFinalApproval) {
    return res.status(400).json({
      success: false,
      message: "Cannot edit leave request that has been finally approved",
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
      message: "Cannot set leave for past dates",
    });
  }

  // Check for overlapping leave requests (excluding current request)
  const overlappingLeave = await LeaveRequest.findOne({
    employee: userId,
    status: { $in: ["Pending", "Approved"] },
    _id: { $ne: id },
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

  // Update the request
  leaveRequest.leaveType = leaveType;
  leaveRequest.startDate = start;
  leaveRequest.endDate = end;
  leaveRequest.days = days;
  leaveRequest.reason = reason;
  leaveRequest.updatedAt = new Date();

  await leaveRequest.save();

  try {
    if (leaveRequest.approvals && leaveRequest.approvals.length > 0) {
      const approvers = leaveRequest.approvals
        .filter((approval) => approval.status === "Pending")
        .map((approval) => approval.approver);

      for (const approverId of approvers) {
        await notificationService.createNotification({
          recipient: approverId,
          type: "LEAVE_REQUEST_UPDATED",
          title: "Leave Request Updated",
          message: `${req.user.firstName} ${req.user.lastName} has updated their leave request. Please review the changes.`,
          data: {
            leaveRequestId: leaveRequest._id,
            employeeId: userId,
            action: "updated",
            changes: {
              leaveType,
              startDate: start,
              endDate: end,
              days,
              reason,
            },
          },
          priority: "medium",
        });
      }
      console.log(
        "✅ [leaveController] Notified approvers about leave request update"
      );
    }
  } catch (notificationError) {
    console.error(
      "❌ [leaveController] Error notifying approvers:",
      notificationError
    );
  }

  // Log audit for leave request update
  try {
    await AuditService.logLeaveAction(
      userId,
      "LEAVE_REQUEST_UPDATED",
      leaveRequest._id,
      {
        leaveType,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: leaveRequest.status,
        employeeName: `${req.user.firstName} ${req.user.lastName}`,
        department: req.user.department,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );
    console.log(
      "✅ [leaveController] Audit log created for leave request update"
    );
  } catch (auditError) {
    console.error("❌ [leaveController] Audit logging error:", auditError);
  }

  // Populate for response
  await leaveRequest.populate([
    { path: "employee", select: "firstName lastName email avatar employeeId" },
    { path: "department", select: "name" },
    { path: "currentApprover", select: "firstName lastName email" },
  ]);

  return res.status(200).json({
    success: true,
    data: leaveRequest,
    message: "Leave request updated successfully",
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
    req.user.role?.level === 1000 || leaveRequest.employee.equals(userId);

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
      type: "LEAVE_CANCELLED",
      title: "Leave Request Cancelled",
      message: `A leave request has been cancelled by ${req.user.firstName} ${req.user.lastName}`,
      data: {
        leaveRequestId: leaveRequest._id,
        cancelledBy: `${req.user.firstName} ${req.user.lastName}`,
        reason,
      },
    });
  }

  // Log audit for leave request cancellation
  try {
    await AuditService.logLeaveAction(
      userId,
      "LEAVE_REQUEST_CANCELLED",
      leaveRequest._id,
      {
        leaveType: leaveRequest.leaveType,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        days: leaveRequest.days,
        reason: leaveRequest.reason,
        status: leaveRequest.status,
        comment: reason,
        employeeName: `${req.user.firstName} ${req.user.lastName}`,
        department: leaveRequest.department,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );
    console.log(
      "✅ [leaveController] Audit log created for leave request cancellation"
    );
  } catch (auditError) {
    console.error("❌ [leaveController] Audit logging error:", auditError);
    // Don't fail the main operation if audit logging fails
  }

  return res.status(200).json({
    success: true,
    data: leaveRequest,
    message: "Leave request cancelled successfully",
  });
});

// Delete leave request (only for pending requests by the creator)
const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  console.log("🗑️ [leaveController] Deleting leave request:", {
    requestId: id,
    userId,
  });

  const leaveRequest = await LeaveRequest.findById(id);

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found",
    });
  }

  // Check if user can delete this request
  if (!leaveRequest.employee.equals(userId)) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own leave requests",
    });
  }

  // Check if request can be deleted (only pending requests)
  if (leaveRequest.status !== "Pending") {
    return res.status(400).json({
      success: false,
      message: "Only pending requests can be deleted",
    });
  }

  // Delete the request
  await LeaveRequest.findByIdAndDelete(id);

  // Log audit for leave request deletion
  try {
    await AuditService.logLeaveAction(userId, "LEAVE_REQUEST_DELETED", id, {
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      days: leaveRequest.days,
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      employeeName: `${req.user.firstName} ${req.user.lastName}`,
      department: req.user.department,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
    console.log(
      "✅ [leaveController] Audit log created for leave request deletion"
    );
  } catch (auditError) {
    console.error("❌ [leaveController] Audit logging error:", auditError);
  }

  return res.status(200).json({
    success: true,
    message: "Leave request deleted successfully",
  });
});

// Get leave statistics
const getLeaveStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let filters = {};

  // Role-based filtering
  if (userRole?.level === 1000) {
    // Super Admin: all stats
  } else if (userRole?.level === 700) {
    // HR HOD: all stats across company (ELRA regulatory role)
    if (req.user.department?.name === "Human Resources") {
      // HR HOD can see all stats - no department filter
    } else {
      // Other HODs: department stats
      filters.department = req.user.department;
    }
  } else if (userRole?.level === 600) {
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

// Get available leave types
const getLeaveTypes = asyncHandler(async (req, res) => {
  const leaveTypes = [
    "Annual",
    "Sick",
    "Personal",
    "Maternity",
    "Paternity",
    "Study",
    "Bereavement",
  ];

  return res.status(200).json({
    success: true,
    data: leaveTypes,
    message: "Leave types retrieved successfully",
  });
});

// Get pending approvals for current user
const getPendingApprovals = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  // Only managers and above can have pending approvals
  if (userRole?.level < 600) {
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

  // HR HOD can see all requests, other HODs see department requests, Super Admin can see all
  if (userRole?.level === 700) {
    if (req.user.department?.name === "Human Resources") {
      // HR HOD can see all requests - no department filter
    } else {
      // Other HODs: department requests
      query.department = req.user.department;
    }
  }

  let pendingApprovalsQuery = LeaveRequest.find(query)
    .populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId role",
      },
      { path: "department", select: "name" },
      {
        path: "approvals.approver",
        select: "firstName lastName email",
      },
    ])
    .sort({ createdAt: -1 })
    .limit(50);

  const [pendingApprovals, total] = await Promise.all([
    pendingApprovalsQuery.exec(),
    LeaveRequest.countDocuments(query),
  ]);

  const paginatedData = {
    docs: pendingApprovals,
    totalDocs: 0,
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

// Get department leave requests for HODs (Pending only - primary approvals tab)
const getDepartmentLeaveRequests = asyncHandler(async (req, res) => {
  const user = req.user;

  // Only HODs can access this endpoint
  if (user.role?.level !== 700) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only Department Heads (HODs) can view department leave requests.",
    });
  }

  try {
    // Pending only for this endpoint
    let query = { status: "Pending" };

    // HR HOD can see all department requests
    if (user.department?.name === "Human Resources") {
      // No department filter - show all pending requests
    } else {
      // Other HODs only see their department requests
      query.department = user.department;
    }

    console.log("🔍 [getDepartmentLeaveRequests] Query:", query);
    console.log(
      "🔍 [getDepartmentLeaveRequests] User department:",
      user.department?.name
    );

    const departmentRequests = await LeaveRequest.find(query)
      .populate([
        {
          path: "employee",
          select: "firstName lastName email avatar employeeId role",
        },
        { path: "department", select: "name" },
        { path: "currentApprover", select: "firstName lastName role" },
        {
          path: "approvals.approver",
          select: "firstName lastName email",
        },
      ])
      .sort({ createdAt: -1 });

    console.log(
      "✅ [getDepartmentLeaveRequests] Found requests:",
      departmentRequests.length
    );

    return res.status(200).json({
      success: true,
      data: departmentRequests,
      message: `Department leave requests retrieved successfully. Found ${departmentRequests.length} pending requests.`,
    });
  } catch (error) {
    console.error("❌ [getDepartmentLeaveRequests] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve department leave requests",
      error: error.message,
    });
  }
});

export {
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
  getDepartmentLeaveHistory,
};

const getDepartmentLeaveHistory = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role?.level !== 700) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only Department Heads (HODs) can view department leave history.",
    });
  }

  try {
    const statusFilter = ["Approved", "Rejected", "Cancelled"];
    const query = { status: { $in: statusFilter } };

    if (user.department?.name !== "Human Resources") {
      query.department = user.department;
    }

    const history = await LeaveRequest.find(query)
      .populate([
        {
          path: "employee",
          select: "firstName lastName email avatar employeeId role",
        },
        { path: "department", select: "name" },
        { path: "approvals.approver", select: "firstName lastName email role" },
      ])
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: history,
      message: `Department leave history retrieved successfully. Found ${history.length} completed requests.`,
    });
  } catch (error) {
    console.error("❌ [getDepartmentLeaveHistory] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve department leave history",
      error: error.message,
    });
  }
});

// New: Department calendar view for HODs (date-range, approved-only by default)
const getDepartmentLeaveCalendar = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    startDate,
    endDate,
    status = "Approved",
    leaveType,
    employee,
    includeFirstLevel = "false",
  } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "startDate and endDate are required (ISO strings)",
    });
  }

  // Only HODs (>=700) should access; HR HOD sees all departments
  if (!user?.role || user.role.level < 700) {
    return res.status(403).json({
      success: false,
      message: "Access denied. HODs only.",
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Build overlap query
  const query = {
    startDate: { $lte: end },
    endDate: { $gte: start },
  };

  if (includeFirstLevel === "true") {
    query.$or = [
      { status: "Approved" },
      {
        status: "Pending",
        approvals: {
          $elemMatch: {
            approver: user._id,
            status: "Approved",
          },
        },
      },
    ];
  } else {
    query.status = status;
  }

  if (leaveType) query.leaveType = leaveType;
  if (employee) query.employee = employee;

  if (user.department?.name !== "Human Resources") {
    query.department = user.department;
  }

  try {
    const results = await LeaveRequest.find(query)
      .populate([
        {
          path: "employee",
          select: "firstName lastName employeeId avatar department role",
          populate: [
            { path: "department", select: "name" },
            { path: "role", select: "name level" },
          ],
        },
        { path: "department", select: "name" },
        { path: "approvals.approver", select: "firstName lastName role" },
      ])
      .sort({ startDate: 1 })
      .limit(1000);

    return res.status(200).json({
      success: true,
      data: results,
      message: "Department leave calendar retrieved successfully",
    });
  } catch (error) {
    console.error("❌ [getDepartmentLeaveCalendar] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve department leave calendar",
      error: error.message,
    });
  }
});

export { getDepartmentLeaveCalendar };
