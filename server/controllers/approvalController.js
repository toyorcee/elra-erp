import mongoose from "mongoose";
import Approval from "../models/Approval.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

// ============================================================================
// APPROVAL CONTROLLERS
// ============================================================================

// @desc    Create new approval request
// @route   POST /api/approvals
// @access  Private (Manager+)
export const createApproval = async (req, res) => {
  try {
    const currentUser = req.user;
    const {
      title,
      description,
      type,
      entityType,
      entityId,
      entityModel,
      priority = "medium",
      amount,
      currency = "NGN",
      dueDate,
      approvalChain,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !type ||
      !entityType ||
      !entityId ||
      !entityModel ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if user has permission to create approvals
    if (currentUser.role.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Manager level required to create approvals.",
      });
    }

    // Validate entity exists
    let entity;
    try {
      entity = await mongoose.model(entityModel).findById(entityId);
      if (!entity) {
        return res.status(404).json({
          success: false,
          message: `${entityModel} not found`,
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid entity model",
      });
    }

    // Create approval chain if not provided
    let finalApprovalChain = approvalChain;
    if (!approvalChain || approvalChain.length === 0) {
      finalApprovalChain = await generateApprovalChain(
        type,
        currentUser.department,
        amount
      );
    }

    // Create approval
    const approval = new Approval({
      title,
      description,
      type,
      entityType,
      entityId,
      entityModel,
      priority,
      department: currentUser.department,
      requestedBy: currentUser._id,
      approvalChain: finalApprovalChain,
      amount,
      currency,
      dueDate: new Date(dueDate),
      budgetYear: new Date().getFullYear().toString(),
      createdBy: currentUser._id,
    });

    await approval.save();

    // Populate references
    await approval.populate([
      { path: "requestedBy", select: "firstName lastName email" },
      { path: "department", select: "name" },
      { path: "approvalChain.approver", select: "firstName lastName email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Approval request created successfully",
      data: approval,
    });
  } catch (error) {
    console.error("❌ [APPROVALS] Create approval error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating approval request",
      error: error.message,
    });
  }
};

// @desc    Get all approvals (with role-based filtering)
// @route   GET /api/approvals
// @access  Private (Manager+)
export const getAllApprovals = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status, type, priority, department } = req.query;

    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level >= 1000) {
      // SUPER_ADMIN - see all approvals
      console.log("🔍 [APPROVALS] Super Admin - showing all approvals");
    } else if (currentUser.role.level >= 700) {
      // HOD - see approvals in their department or where they're approver
      query.$or = [
        { department: currentUser.department },
        { "approvalChain.approver": currentUser._id },
      ];
    } else if (currentUser.role.level >= 600) {
      // MANAGER - see approvals they requested or where they're approver
      query.$or = [
        { requestedBy: currentUser._id },
        { "approvalChain.approver": currentUser._id },
      ];
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions to view approvals.",
      });
    }

    // Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (department) query.department = department;

    const approvals = await Approval.find(query)
      .populate("requestedBy", "firstName lastName email")
      .populate("department", "name")
      .populate("approvalChain.approver", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: approvals,
      total: approvals.length,
    });
  } catch (error) {
    console.error("❌ [APPROVALS] Get approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approvals",
      error: error.message,
    });
  }
};

// @desc    Get approval by ID
// @route   GET /api/approvals/:id
// @access  Private (Manager+)
export const getApprovalById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const approval = await Approval.findById(id)
      .populate("requestedBy", "firstName lastName email")
      .populate("department", "name")
      .populate("approvalChain.approver", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .populate("comments.user", "firstName lastName email");

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: "Approval not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkApprovalAccess(currentUser, approval);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to view this approval.",
      });
    }

    res.status(200).json({
      success: true,
      data: approval,
    });
  } catch (error) {
    console.error("❌ [APPROVALS] Get approval error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approval",
      error: error.message,
    });
  }
};

// @desc    Approve or reject approval
// @route   PUT /api/approvals/:id/action
// @access  Private (Approver)
export const takeApprovalAction = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { action, comments = "" } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'reject'",
      });
    }

    const approval = await Approval.findById(id);
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: "Approval not found",
      });
    }

    // Check if user is the current approver
    const currentApproval = approval.approvalChain.find(
      (level) => level.level === approval.currentLevel
    );

    if (
      !currentApproval ||
      currentApproval.approver.toString() !== currentUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You are not the current approver for this level.",
      });
    }

    // Check if approval is in valid state
    if (!["pending", "under_review"].includes(approval.status)) {
      return res.status(400).json({
        success: false,
        message: "Approval is not in a valid state for action",
      });
    }

    // Take action
    console.log(
      "🎯 [APPROVAL] Taking action:",
      action,
      "for approval:",
      approval._id
    );
    console.log("🎯 [APPROVAL] Current approval status:", approval.status);
    console.log("🎯 [APPROVAL] Entity type:", approval.entityType);

    if (action === "approve") {
      await approval.approve(currentUser._id, comments);

      if (approval.status === "approved" && approval.entityType === "project") {
        try {
          const project = await Project.findById(approval.entityId);
          if (project) {
            project.status = "active";
            await project.save();
            console.log(
              "✅ [APPROVAL] Project status updated to 'active' after final approval"
            );

            const notificationController = req.app.get(
              "notificationController"
            );
            if (notificationController && project.projectManager) {
              await notificationController.createNotification({
                recipient: project.projectManager,
                type: "project_approved",
                title: "Project Approved",
                message: `Your project "${project.name}" has been approved and is now active. You can now upload project documents.`,
                data: {
                  projectId: project._id,
                  projectName: project.name,
                  approvalId: approval._id,
                },
              });
              console.log(
                "📧 [APPROVAL] Notification sent to project manager about approval"
              );
            }
          }
        } catch (error) {
          console.error("❌ [APPROVAL] Error updating project status:", error);
        }
      }
    } else {
      await approval.reject(currentUser._id, comments);

      if (approval.entityType === "project") {
        try {
          const project = await Project.findById(approval.entityId);
          if (project) {
            project.status = "cancelled";
            await project.save();
            console.log(
              "❌ [APPROVAL] Project status updated to 'cancelled' after rejection"
            );

            // Send notification to project manager
            const notificationController = req.app.get(
              "notificationController"
            );
            if (notificationController && project.projectManager) {
              await notificationController.createNotification({
                recipient: project.projectManager,
                type: "project_rejected",
                title: "Project Rejected",
                message: `Your project "${project.name}" has been rejected.`,
                data: {
                  projectId: project._id,
                  projectName: project.name,
                  approvalId: approval._id,
                  rejectionReason: comments,
                },
              });
              console.log(
                "📧 [APPROVAL] Notification sent to project manager about rejection"
              );
            }
          }
        } catch (error) {
          console.error(
            "❌ [APPROVAL] Error updating project status after rejection:",
            error
          );
        }
      }
    }

    // Populate references
    await approval.populate([
      { path: "requestedBy", select: "firstName lastName email" },
      { path: "department", select: "name" },
      { path: "approvalChain.approver", select: "firstName lastName email" },
      { path: "approvedBy", select: "firstName lastName email" },
      { path: "rejectedBy", select: "firstName lastName email" },
    ]);

    res.status(200).json({
      success: true,
      message: `Approval ${action}d successfully`,
      data: approval,
    });
  } catch (error) {
    console.error("❌ [APPROVALS] Take action error:", error);
    res.status(500).json({
      success: false,
      message: "Error taking approval action",
      error: error.message,
    });
  }
};

// @desc    Add comment to approval
// @route   POST /api/approvals/:id/comments
// @access  Private (Manager+)
export const addApprovalComment = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { content, isInternal = false } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const approval = await Approval.findById(id);
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: "Approval not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkApprovalAccess(currentUser, approval);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to comment on this approval.",
      });
    }

    await approval.addComment(currentUser._id, content.trim(), isInternal);

    // Populate the new comment
    await approval.populate("comments.user", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      data: approval,
    });
  } catch (error) {
    console.error("❌ [APPROVALS] Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message,
    });
  }
};

// @desc    Get approvals pending user's action
// @route   GET /api/approvals/pending
// @access  Private (Approver)
export const fetchPendingApprovals = async (req, res) => {
  try {
    const currentUser = req.user;

    const approvals = await Approval.findPendingByUser(currentUser._id)
      .populate("requestedBy", "firstName lastName email")
      .populate("department", "name")
      .populate("approvalChain.approver", "firstName lastName email");

    res.status(200).json({
      success: true,
      data: approvals,
      total: approvals.length,
    });
  } catch (error) {
    console.error("❌ [APPROVALS] Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending approvals",
      error: error.message,
    });
  }
};

// @desc    Get approval statistics
// @route   GET /api/approvals/stats
// @access  Private (Manager+)
export const fetchApprovalStats = async (req, res) => {
  try {
    const currentUser = req.user;
    const { department } = req.query;

    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        query.department = currentUser.department;
      } else {
        query.$or = [
          { requestedBy: currentUser._id },
          { "approvalChain.approver": currentUser._id },
        ];
      }
    }

    if (department) {
      query.department = department;
    }

    const [total, pending, approved, rejected, overdue] = await Promise.all([
      Approval.countDocuments(query),
      Approval.countDocuments({ ...query, status: "pending" }),
      Approval.countDocuments({ ...query, status: "approved" }),
      Approval.countDocuments({ ...query, status: "rejected" }),
      Approval.countDocuments({
        ...query,
        status: "pending",
        dueDate: { $lt: new Date() },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        overdue,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("❌ [APPROVALS] Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approval statistics",
      error: error.message,
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate approval chain based on type, amount, and department hierarchy
export const generateApprovalChain = async (type, departmentId, amount = 0) => {
  console.log("🔗 [APPROVAL CHAIN] Starting chain generation");
  console.log("🔗 [APPROVAL CHAIN] Type:", type);
  console.log("🔗 [APPROVAL CHAIN] Department ID:", departmentId);
  console.log("🔗 [APPROVAL CHAIN] Amount:", amount);

  const chain = [];

  // Get the requesting department
  const requestingDept = await Department.findById(departmentId);
  if (!requestingDept) {
    console.error(
      "❌ [APPROVAL CHAIN] Department not found for ID:",
      departmentId
    );
    throw new Error("Department not found");
  }

  console.log(
    "🏢 [APPROVAL CHAIN] Requesting department:",
    requestingDept.name,
    "Level:",
    requestingDept.level
  );

  // Base approval - Department Manager (HOD)
  chain.push({
    level: 1,
    role: "DEPARTMENT_MANAGER",
    departmentLevel: requestingDept.level,
    required: true,
  });

  // Determine approval levels based on amount and type
  let approvalLevels = [];

  // Amount-based approvals (Leasing Company thresholds)
  if (amount > 500000) {
    // Above 500K NGN
    approvalLevels.push(80); // Finance & Accounting
  }

  if (amount > 2000000) {
    // Above 2M NGN
    approvalLevels.push(85); // Information Technology (Credit & Underwriting)
  }

  if (amount > 5000000) {
    // Above 5M NGN
    approvalLevels.push(90); // Human Resources (Risk Management)
  }

  if (amount > 10000000) {
    // Above 10M NGN
    approvalLevels.push(100); // Executive Office (Board/CEO)
  }

  // Type-based approvals for leasing company
  if (type === "lease_application") {
    if (!approvalLevels.includes(85)) approvalLevels.push(85); // IT (Credit & Underwriting)
    if (!approvalLevels.includes(80)) approvalLevels.push(80); // Finance & Accounting
  }

  if (type === "credit_risk_assessment") {
    if (!approvalLevels.includes(90)) approvalLevels.push(90); // HR (Risk Management)
    if (!approvalLevels.includes(85)) approvalLevels.push(85); // IT (Credit & Underwriting)
  }

  if (type === "asset_acquisition") {
    if (!approvalLevels.includes(75)) approvalLevels.push(75); // Operations (Asset Management)
    if (!approvalLevels.includes(80)) approvalLevels.push(80); // Finance & Accounting
  }

  if (type === "client_onboarding") {
    if (!approvalLevels.includes(65)) approvalLevels.push(65); // Customer Service
    if (!approvalLevels.includes(85)) approvalLevels.push(85); // IT (Credit & Underwriting)
  }

  // Remove duplicates and sort by level
  approvalLevels = [...new Set(approvalLevels)].sort((a, b) => a - b);

  // Add approval levels to chain
  approvalLevels.forEach((level, index) => {
    chain.push({
      level: index + 2, // Start from level 2
      role: "DEPARTMENT_APPROVER",
      departmentLevel: level,
      required: true,
    });
  });

  // Assign approvers based on department levels
  for (const level of chain) {
    const approver = await findApproverByDepartmentLevel(
      level.departmentLevel,
      departmentId
    );
    if (approver) {
      level.approver = approver._id;
    }
  }

  return chain;
};

// Find approver by department level
export const findApproverByDepartmentLevel = async (
  departmentLevel,
  requestingDepartmentId
) => {
  console.log(
    "👤 [FIND APPROVER] Looking for approver at department level:",
    departmentLevel
  );

  // Get department by level
  const department = await Department.findOne({
    level: departmentLevel,
    isActive: true,
  });
  if (!department) {
    console.log(
      `⚠️ [FIND APPROVER] No department found for level ${departmentLevel}`
    );
    return null;
  }

  console.log("🏢 [FIND APPROVER] Found department:", department.name);

  // Find users in that department with appropriate role levels
  const query = {
    department: department._id,
    isActive: true,
  };

  // Role level requirements based on department level (Leasing Company)
  let minRoleLevel;
  switch (departmentLevel) {
    case 100: // Executive Office - Board/CEO decisions
      minRoleLevel = 1000; // SUPER_ADMIN level
      break;
    case 90: // HR - Risk Management & Compliance
      minRoleLevel = 700; // HOD level
      break;
    case 85: // IT - Credit & Underwriting
      minRoleLevel = 700; // HOD level
      break;
    case 80: // Finance - Finance & Treasury
      minRoleLevel = 700; // HOD level
      break;
    case 75: // Operations - Asset Management
      minRoleLevel = 700; // HOD level
      break;
    case 70: // Sales - Sales & Business Development
      minRoleLevel = 700; // HOD level
      break;
    case 65: // Customer Service - Client Services
      minRoleLevel = 700; // HOD level
      break;
    case 60: // Legal - Legal & Documentation
      minRoleLevel = 700; // HOD level
      break;
    case 50: // System Administration - IT Support
      minRoleLevel = 600; // Manager level
      break;
    default:
      minRoleLevel = 700; // Default to HOD level
  }

  query["role.level"] = { $gte: minRoleLevel };

  // Find the highest-level user in that department
  const approver = await User.findOne(query).sort({ "role.level": -1 });

  if (!approver) {
    console.log(
      `⚠️ No approver found for department ${department.name} (level ${departmentLevel})`
    );
  }

  return approver;
};

// Check if user has access to approval
const checkApprovalAccess = async (user, approval) => {
  // SUPER_ADMIN can access everything
  if (user.role.level >= 1000) return true;

  // HOD can access approvals in their department or where they're approver
  if (user.role.level >= 700) {
    return (
      approval.department.toString() === user.department.toString() ||
      approval.approvalChain.some(
        (level) => level.approver?.toString() === user._id.toString()
      )
    );
  }

  // MANAGER can access approvals they requested or where they're approver
  if (user.role.level >= 600) {
    return (
      approval.requestedBy.toString() === user._id.toString() ||
      approval.approvalChain.some(
        (level) => level.approver?.toString() === user._id.toString()
      )
    );
  }

  return false;
};
