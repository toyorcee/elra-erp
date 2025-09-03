import mongoose from "mongoose";
import BudgetAllocation from "../models/BudgetAllocation.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

/**
 *
 * Budget Allocation Controller
 * Handles all budget allocation operations for projects, payroll, and other funding needs
 */

// ============================================================================
// CREATE BUDGET ALLOCATION
// ============================================================================

/**
 * Create a new budget allocation
 * POST /api/budget-allocations
 */
export const createBudgetAllocation = async (req, res) => {
  try {
    const {
      projectId,
      allocationType = "project_budget",
      allocatedAmount,
      notes,
      currency = "NGN",
    } = req.body;

    const allocatedBy = req.user._id;

    // Validate allocation amount (allow 0 for no extra funding)
    if (
      allocatedAmount === undefined ||
      allocatedAmount === null ||
      allocatedAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid allocation amount",
      });
    }

    // Validate required fields based on allocation type
    if (allocationType === "project_budget" && !projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required for project budget allocation",
      });
    }

    // Get project details if it's a project budget allocation
    let project = null;
    let entityName = "";
    let entityCode = "";
    let entityType = "project";

    if (allocationType === "project_budget") {
      project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      // Check if project requires budget allocation
      if (!project.requiresBudgetAllocation) {
        return res.status(400).json({
          success: false,
          message: "This project does not require budget allocation",
        });
      }

      // Check if project is in the correct status for budget allocation
      if (project.status !== "pending_budget_allocation") {
        return res.status(400).json({
          success: false,
          message: `Project is not ready for budget allocation. Current status: ${project.status}`,
        });
      }

      entityName = project.name;
      entityCode = project.code;
      entityType = "project";
    }

    // For project budget allocations, use project budget if no amount provided
    let finalAllocatedAmount = allocatedAmount || 0;

    if (allocationType === "project_budget" && project) {
      // If no extra funding provided, use the project's budget as the allocation amount
      if (!allocatedAmount || allocatedAmount === 0) {
        finalAllocatedAmount = project.budget;
        console.log(
          `💰 [BUDGET ALLOCATION] Using project budget as allocation amount: ₦${finalAllocatedAmount.toLocaleString()}`
        );
      }
    }

    // Calculate budget details
    const projectItemsTotal =
      project?.projectItems?.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      ) || 0;
    const previousBudget = project ? project.budget : 0;

    // If items total < budget: use items total as base
    // If items total = budget: use budget as base (since they match)
    const baseAmount =
      projectItemsTotal < previousBudget ? projectItemsTotal : previousBudget;
    const newBudget = baseAmount + finalAllocatedAmount;

    // Create budget allocation
    const budgetAllocation = new BudgetAllocation({
      project: projectId,
      projectCode: project?.code,
      projectName: project?.name,
      allocationType,
      allocatedAmount: finalAllocatedAmount,
      previousBudget: baseAmount,
      newBudget,
      allocatedBy,
      notes,
      currency,
      entityType,
      entityName,
      entityCode,
    });

    // Generate approval chain based on allocation type and amount
    await budgetAllocation.generateApprovalChain();

    // Save the allocation
    await budgetAllocation.save();

    // Auto-approve the budget allocation for project_budget type
    if (allocationType === "project_budget" && project) {
      console.log("🚀 [BUDGET ALLOCATION] Auto-approving budget allocation...");

      // Approve the allocation
      await budgetAllocation.approveAllocation(
        allocatedBy,
        "Auto-approved by Finance HOD"
      );

      // Update project budget and status
      project.budget = budgetAllocation.newBudget;
      project.status = "approved";
      await project.save();

      console.log("✅ [BUDGET ALLOCATION] Budget allocation auto-approved");
      console.log("✅ [BUDGET ALLOCATION] Project status updated to approved");

      // Send approval notifications (this will trigger procurement)
      await sendBudgetAllocationApprovalNotifications(
        budgetAllocation,
        "approved"
      );
    } else {
      // Send notifications to relevant approvers for non-auto-approved allocations
      console.log(
        `💰 [BUDGET ALLOCATION] Allocation created with amount: ${budgetAllocation.allocatedAmount}`
      );
      console.log(
        `💰 [BUDGET ALLOCATION] Formatted amount: ${budgetAllocation.formattedAmount}`
      );
      await sendBudgetAllocationNotifications(budgetAllocation);

      // Update project status if it's a project budget allocation
      if (project) {
        project.status = "pending_budget_allocation";
        await project.save();
      }
    }

    // Notify Finance HOD that allocation was created successfully
    console.log(
      "📧 [BUDGET ALLOCATION] Notifying Finance HOD of successful allocation creation..."
    );
    const financeDept = await mongoose.model("Department").findOne({
      name: "Finance & Accounting",
    });

    if (financeDept) {
      const financeHODs = await User.find({
        department: financeDept._id,
        "role.name": "HOD",
      });

      for (const financeHOD of financeHODs) {
        const notification = new Notification({
          recipient: financeHOD._id,
          type: "BUDGET_ALLOCATION_CREATED",
          title: "Budget Allocation Created Successfully",
          message: `A new budget allocation of ${
            budgetAllocation.formattedAmount
          } has been created for project: ${
            project?.name || "Unknown Project"
          }. Please review and approve.`,
          data: {
            budgetAllocationId: budgetAllocation._id,
            projectId: project?._id,
            projectName: project?.name,
            allocatedAmount: budgetAllocation.allocatedAmount,
          },
          priority: "medium",
        });
        await notification.save();
        console.log(
          `✅ [BUDGET ALLOCATION] Finance HOD notification sent to: ${financeHOD.email}`
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Budget allocation created successfully",
      data: {
        budgetAllocation: await budgetAllocation.populate([
          { path: "project", select: "name code budget projectScope" },
          { path: "allocatedBy", select: "firstName lastName email" },
        ]),
      },
    });
  } catch (error) {
    console.error(
      "❌ [BUDGET ALLOCATION] Create Budget Allocation Error:",
      error
    );
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to create budget allocation",
    });
  }
};

// ============================================================================
// GET BUDGET ALLOCATIONS
// ============================================================================

/**
 * Get all budget allocations (with filters)
 * GET /api/budget-allocations
 */
export const getBudgetAllocations = async (req, res) => {
  try {
    const {
      status,
      allocationType,
      projectId,
      departmentId,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const user = req.user;
    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (allocationType) query.allocationType = allocationType;
    if (projectId) query.project = projectId;
    if (departmentId) query.department = departmentId;

    // Apply user-based filtering
    const isFinanceHOD =
      user.department === "Finance & Accounting" && user.role?.level >= 700;

    if (!isFinanceHOD) {
      // Non-Finance HODs can only see their department's allocations
      if (user.department) {
        query.department = user.department;
      }
      // Project creators can see their project allocations
      if (user._id) {
        query.$or = [
          { allocatedBy: user._id },
          { "project.createdBy": user._id },
        ];
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Execute query
    const budgetAllocations = await BudgetAllocation.find(query)
      .populate("project", "name code budget projectScope")
      .populate("department", "name code")
      .populate("allocatedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await BudgetAllocation.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Budget allocations retrieved successfully",
      data: {
        budgetAllocations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get Budget Allocations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve budget allocations",
      error: error.message,
    });
  }
};

/**
 * Get budget allocation by ID
 * GET /api/budget-allocations/:id
 */
export const getBudgetAllocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const budgetAllocation = await BudgetAllocation.findById(id)
      .populate("project", "name code budget projectScope status")
      .populate("department", "name code")
      .populate("allocatedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email");

    if (!budgetAllocation) {
      return res.status(404).json({
        success: false,
        message: "Budget allocation not found",
      });
    }

    // Check access permissions
    const isFinanceHOD =
      user.department === "Finance & Accounting" && user.role?.level >= 700;

    const isOwner =
      budgetAllocation.allocatedBy.toString() === user._id.toString();
    const isProjectCreator =
      budgetAllocation.project?.createdBy?.toString() === user._id.toString();

    if (!isFinanceHOD && !isOwner && !isProjectCreator) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this budget allocation",
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget allocation retrieved successfully",
      data: { budgetAllocation },
    });
  } catch (error) {
    console.error("Get Budget Allocation by ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve budget allocation",
      error: error.message,
    });
  }
};

// ============================================================================
// APPROVE/REJECT BUDGET ALLOCATION
// ============================================================================

/**
 * Approve budget allocation
 * PUT /api/budget-allocations/:id/approve
 */
export const approveBudgetAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments = "" } = req.body;
    const approverId = req.user._id;

    const budgetAllocation = await BudgetAllocation.findById(id).populate(
      "project",
      "name code budget projectScope status"
    );

    if (!budgetAllocation) {
      return res.status(404).json({
        success: false,
        message: "Budget allocation not found",
      });
    }

    if (budgetAllocation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Budget allocation is not pending approval",
      });
    }

    // Approve the allocation
    await budgetAllocation.approveAllocation(approverId, comments);

    // Update project budget if it's a project allocation
    if (
      budgetAllocation.allocationType === "project_budget" &&
      budgetAllocation.project
    ) {
      const project = budgetAllocation.project;
      // Update project budget to the new total (items total + allocated amount)
      project.budget = budgetAllocation.newBudget;
      project.status = "approved";
      await project.save();
    }

    // Send notifications
    await sendBudgetAllocationApprovalNotifications(
      budgetAllocation,
      "approved"
    );

    res.status(200).json({
      success: true,
      message: "Budget allocation approved successfully",
      data: {
        budgetAllocation: await budgetAllocation.populate([
          { path: "project", select: "name code budget projectScope" },
          { path: "allocatedBy", select: "firstName lastName email" },
          { path: "approvedBy", select: "firstName lastName email" },
        ]),
      },
    });
  } catch (error) {
    console.error("Approve Budget Allocation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve budget allocation",
      error: error.message,
    });
  }
};

/**
 * Reject budget allocation
 * PUT /api/budget-allocations/:id/reject
 */
export const rejectBudgetAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body;
    const rejectorId = req.user._id;

    const budgetAllocation = await BudgetAllocation.findById(id).populate(
      "project",
      "name code budget projectScope status"
    );

    if (!budgetAllocation) {
      return res.status(404).json({
        success: false,
        message: "Budget allocation not found",
      });
    }

    if (budgetAllocation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Budget allocation is not pending approval",
      });
    }

    // Reject the allocation
    await budgetAllocation.rejectAllocation(rejectorId, reason);

    // Update project status if it's a project allocation
    if (
      budgetAllocation.allocationType === "project_budget" &&
      budgetAllocation.project
    ) {
      const project = budgetAllocation.project;
      project.status = "rejected";
      await project.save();
    }

    // Send notifications
    await sendBudgetAllocationApprovalNotifications(
      budgetAllocation,
      "rejected"
    );

    res.status(200).json({
      success: true,
      message: "Budget allocation rejected successfully",
      data: {
        budgetAllocation: await budgetAllocation.populate([
          { path: "project", select: "name code budget projectScope" },
          { path: "allocatedBy", select: "firstName lastName email" },
          { path: "rejectedBy", select: "firstName lastName email" },
        ]),
      },
    });
  } catch (error) {
    console.error("Reject Budget Allocation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject budget allocation",
      error: error.message,
    });
  }
};

// ============================================================================
// STATISTICS AND REPORTS
// ============================================================================

/**
 * Get budget allocation statistics
 * GET /api/budget-allocations/stats
 */
export const getBudgetAllocationStats = async (req, res) => {
  try {
    const { allocationType, startDate, endDate } = req.query;
    const user = req.user;

    const query = {};

    // Apply filters
    if (allocationType) query.allocationType = allocationType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Apply user-based filtering
    const isFinanceHOD =
      user.department === "Finance & Accounting" && user.role?.level >= 700;

    if (!isFinanceHOD && user.department) {
      query.department = user.department;
    }

    const stats = await BudgetAllocation.getStats();

    res.status(200).json({
      success: true,
      message: "Budget allocation statistics retrieved successfully",
      data: { stats },
    });
  } catch (error) {
    console.error("Get Budget Allocation Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve budget allocation statistics",
      error: error.message,
    });
  }
};

// ============================================================================
// PROJECTS NEEDING BUDGET ALLOCATION
// ============================================================================

/**
 * Get projects that need budget allocation
 * GET /api/budget-allocations/projects-needing-allocation
 */
export const getProjectsNeedingBudgetAllocation = async (req, res) => {
  try {
    const projects = await Project.find({
      requiresBudgetAllocation: true,
      $or: [{ status: "pending_budget_allocation" }, { status: "approved" }],
    })
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name code")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Projects needing budget allocation retrieved successfully",
      data: {
        projects,
        totalProjects: projects.length,
      },
    });
  } catch (error) {
    console.error("Get Projects Needing Budget Allocation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve projects needing budget allocation",
      error: error.message,
    });
  }
};

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Send budget allocation notifications
 */
const sendBudgetAllocationNotifications = async (budgetAllocation) => {
  try {
    console.log(
      `📧 [BUDGET ALLOCATION] Sending notifications for allocation: ${budgetAllocation.allocationCode}`
    );

    // Get the first pending approval
    const pendingApproval = budgetAllocation.approvalChain.find(
      (step) => step.status === "pending"
    );

    if (!pendingApproval) {
      console.log(
        `⚠️ [BUDGET ALLOCATION] No pending approval found for allocation: ${budgetAllocation.allocationCode}`
      );
      return;
    }

    console.log(
      `📋 [BUDGET ALLOCATION] Pending approval level: ${pendingApproval.level}`
    );

    // Find approvers based on approval level
    let approvers = [];

    if (pendingApproval.level === "finance_hod") {
      console.log(
        `🔍 [BUDGET ALLOCATION] Looking for Finance HOD approvers...`
      );

      // First find the Finance department
      const financeDept = await mongoose.model("Department").findOne({
        name: "Finance & Accounting",
      });

      if (!financeDept) {
        console.error(
          `❌ [BUDGET ALLOCATION] Finance & Accounting department not found`
        );
        return;
      }

      console.log(
        `🏢 [BUDGET ALLOCATION] Found Finance department: ${financeDept._id}`
      );

      // Find Finance HOD by role name
      approvers = await User.find({
        department: financeDept._id,
        "role.name": "HOD",
      });

      console.log(
        `👥 [BUDGET ALLOCATION] Found ${approvers.length} Finance HOD(s) by role name`
      );

      // Fallback to role level if no HOD found
      if (approvers.length === 0) {
        console.log(
          `🔄 [BUDGET ALLOCATION] No HOD found by name, trying role level fallback...`
        );
        approvers = await User.find({
          department: financeDept._id,
          "role.level": { $gte: 700 },
        });
        console.log(
          `👥 [BUDGET ALLOCATION] Found ${approvers.length} Finance HOD(s) by role level`
        );
      }
    }

    // Send notifications to approvers
    for (const approver of approvers) {
      console.log(
        `📧 [BUDGET ALLOCATION] Sending notification to approver: ${approver.firstName} ${approver.lastName} (${approver.email})`
      );

      const notification = new Notification({
        recipient: approver._id,
        type: "BUDGET_ALLOCATION_PENDING",
        title: "Budget Allocation Pending Approval",
        message: `A ${budgetAllocation.allocationType.replace(
          "_",
          " "
        )} allocation of ${
          budgetAllocation.formattedAmount
        } requires your approval.`,
        data: {
          budgetAllocationId: budgetAllocation._id,
          allocationType: budgetAllocation.allocationType,
          allocatedAmount: budgetAllocation.allocatedAmount,
          entityName: budgetAllocation.entityName,
        },
        priority: "high",
      });

      await notification.save();
      console.log(
        `✅ [BUDGET ALLOCATION] Notification sent to approver: ${approver.email}`
      );
    }

    // Notify the person who created the allocation
    console.log(
      `📧 [BUDGET ALLOCATION] Sending notification to allocation creator...`
    );
    const notificationMessage = `Your budget allocation request of ${budgetAllocation.formattedAmount} has been submitted for approval.`;
    console.log(
      `📧 [BUDGET ALLOCATION] Notification message: ${notificationMessage}`
    );

    const notification = new Notification({
      recipient: budgetAllocation.allocatedBy,
      type: "BUDGET_ALLOCATION_PENDING",
      title: "Budget Allocation Submitted",
      message: notificationMessage,
      data: {
        budgetAllocationId: budgetAllocation._id,
        allocationType: budgetAllocation.allocationType,
        allocatedAmount: budgetAllocation.allocatedAmount,
      },
      priority: "medium",
    });

    await notification.save();
    console.log(
      `✅ [BUDGET ALLOCATION] Notification sent to allocation creator`
    );

    console.log(
      `✅ [BUDGET ALLOCATION] All notifications sent successfully for allocation: ${budgetAllocation.allocationCode}`
    );
  } catch (error) {
    console.error(
      "❌ [BUDGET ALLOCATION] Send Budget Allocation Notifications Error:",
      error
    );
  }
};

/**
 * Send budget allocation approval/rejection notifications
 */
const sendBudgetAllocationApprovalNotifications = async (
  budgetAllocation,
  action
) => {
  try {
    console.log(
      `📧 [BUDGET ALLOCATION] Sending ${action} notifications for allocation: ${budgetAllocation.allocationCode}`
    );

    const actionText = action === "approved" ? "approved" : "rejected";
    const notificationType =
      action === "approved"
        ? "BUDGET_ALLOCATION_APPROVED"
        : "BUDGET_ALLOCATION_REJECTED";

    // Notify the person who created the allocation
    console.log(
      `📧 [BUDGET ALLOCATION] Sending ${action} notification to allocation creator...`
    );
    const notification = new Notification({
      recipient: budgetAllocation.allocatedBy,
      type: notificationType,
      title: `Budget Allocation ${
        actionText.charAt(0).toUpperCase() + actionText.slice(1)
      }`,
      message: `Your budget allocation request of ${budgetAllocation.formattedAmount} has been ${actionText}.`,
      data: {
        budgetAllocationId: budgetAllocation._id,
        allocationType: budgetAllocation.allocationType,
        allocatedAmount: budgetAllocation.allocatedAmount,
        action,
      },
      priority: "high",
    });

    await notification.save();
    console.log(
      `✅ [BUDGET ALLOCATION] ${action} notification sent to allocation creator`
    );

    // If approved and it's a project allocation, trigger procurement
    console.log(`🔍 [BUDGET ALLOCATION] Checking trigger conditions:`);
    console.log(`🔍 [BUDGET ALLOCATION] action: "${action}"`);
    console.log(
      `🔍 [BUDGET ALLOCATION] allocationType: "${budgetAllocation.allocationType}"`
    );
    console.log(
      `🔍 [BUDGET ALLOCATION] action === "approved": ${action === "approved"}`
    );
    console.log(
      `🔍 [BUDGET ALLOCATION] allocationType === "project_budget": ${
        budgetAllocation.allocationType === "project_budget"
      }`
    );
    console.log(
      `🔍 [BUDGET ALLOCATION] Both conditions met: ${
        action === "approved" &&
        budgetAllocation.allocationType === "project_budget"
      }`
    );

    if (
      action === "approved" &&
      budgetAllocation.allocationType === "project_budget"
    ) {
      console.log(
        "🛒 [BUDGET ALLOCATION] =========================================="
      );
      console.log("🛒 [BUDGET ALLOCATION] TRIGGERING PROCUREMENT CREATION");
      console.log(
        "🛒 [BUDGET ALLOCATION] =========================================="
      );
      console.log(
        `🛒 [BUDGET ALLOCATION] Allocation Code: ${budgetAllocation.allocationCode}`
      );
      console.log(
        `🛒 [BUDGET ALLOCATION] Allocation Amount: ₦${budgetAllocation.allocatedAmount?.toLocaleString()}`
      );
      console.log(
        `🛒 [BUDGET ALLOCATION] Project ID: ${budgetAllocation.project}`
      );

      // Get the project and trigger procurement
      const project = await Project.findById(budgetAllocation.project);
      if (project) {
        console.log(
          `🛒 [BUDGET ALLOCATION] Found project: ${project.name} (${project.code})`
        );
        console.log(
          `🛒 [BUDGET ALLOCATION] Project budget: ₦${project.budget?.toLocaleString()}`
        );
        console.log(`🛒 [BUDGET ALLOCATION] Project status: ${project.status}`);
        console.log(
          `🛒 [BUDGET ALLOCATION] Project items count: ${
            project.projectItems?.length || 0
          }`
        );
        console.log(
          `🛒 [BUDGET ALLOCATION] Project items total: ₦${
            project.projectItems
              ?.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
              ?.toLocaleString() || 0
          }`
        );

        // Get the approver user for the procurement trigger
        const approver = await User.findById(budgetAllocation.approvedBy);
        if (approver) {
          console.log(
            `🛒 [BUDGET ALLOCATION] Using approver: ${approver.firstName} ${approver.lastName} (${approver.email}) for procurement trigger`
          );
          console.log(
            "🛒 [BUDGET ALLOCATION] Calling project.triggerProcurementCreation(approver)..."
          );
          try {
            await project.triggerProcurementCreation(approver);
            console.log(
              "✅ [BUDGET ALLOCATION] project.triggerProcurementCreation() completed successfully"
            );
          } catch (procurementError) {
            console.error(
              "❌ [BUDGET ALLOCATION] Error in project.triggerProcurementCreation():",
              procurementError
            );
            console.error(
              "❌ [BUDGET ALLOCATION] Error stack:",
              procurementError.stack
            );
          }
        } else {
          console.log(
            "⚠️ [BUDGET ALLOCATION] No approver found, using project creator for procurement trigger"
          );
          const projectCreator = await User.findById(project.createdBy);
          if (projectCreator) {
            console.log(
              `🛒 [BUDGET ALLOCATION] Using project creator: ${projectCreator.firstName} ${projectCreator.lastName} (${projectCreator.email}) for procurement trigger`
            );
            try {
              await project.triggerProcurementCreation(projectCreator);
              console.log(
                "✅ [BUDGET ALLOCATION] project.triggerProcurementCreation() completed successfully with project creator"
              );
            } catch (procurementError) {
              console.error(
                "❌ [BUDGET ALLOCATION] Error in project.triggerProcurementCreation() with project creator:",
                procurementError
              );
            }
          }
        }
      } else {
        console.error(
          "❌ [BUDGET ALLOCATION] Project not found for procurement trigger"
        );
      }
      console.log(
        "🛒 [BUDGET ALLOCATION] =========================================="
      );
      console.log("🛒 [BUDGET ALLOCATION] PROCUREMENT TRIGGER COMPLETED");
      console.log(
        "🛒 [BUDGET ALLOCATION] =========================================="
      );

      // Send direct notification to Procurement HOD
      console.log(
        "📧 [BUDGET ALLOCATION] Sending direct notification to Procurement HOD..."
      );
      try {
        // Find Procurement department
        const procurementDept = await mongoose.model("Department").findOne({
          name: "Procurement",
        });

        if (procurementDept) {
          console.log(
            `📧 [BUDGET ALLOCATION] Found Procurement department: ${procurementDept.name}`
          );

          // Get HOD role ID first
          const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });
          if (!hodRole) {
            console.log("❌ [BUDGET ALLOCATION] HOD role not found in system");
          } else {
            // Find Procurement HOD by role name first
            let procurementHOD = await mongoose
              .model("User")
              .findOne({
                department: procurementDept._id,
                role: hodRole._id,
                isActive: true,
              })
              .populate("role");

            // Fallback to role level if no HOD found by name
            if (!procurementHOD) {
              console.log(
                "🔄 [BUDGET ALLOCATION] No Procurement HOD found by name, trying role level fallback..."
              );
              procurementHOD = await mongoose
                .model("User")
                .findOne({
                  department: procurementDept._id,
                  "role.level": { $gte: 700 },
                  isActive: true,
                })
                .populate("role");
            }

            if (procurementHOD) {
              console.log(
                `📧 [BUDGET ALLOCATION] Found Procurement HOD: ${procurementHOD.firstName} ${procurementHOD.lastName} (${procurementHOD.email})`
              );

              const procurementNotification = new Notification({
                recipient: procurementHOD._id,
                type: "PROCUREMENT_INITIATION_REQUIRED",
                title: "Procurement Initiation Required",
                message: `Project "${project?.name || "Unknown Project"}" (${
                  project?.code || "Unknown Code"
                }) has been approved for budget allocation of ${
                  budgetAllocation.formattedAmount
                }. Please review and initiate procurement processes for this project.`,
                priority: "high",
                data: {
                  projectId: project?._id,
                  projectName: project?.name,
                  projectCode: project?.code,
                  budget: project?.budget,
                  category: project?.category,
                  actionUrl: "/dashboard/modules/procurement",
                  triggeredBy: budgetAllocation.approvedBy,
                  budgetAllocationId: budgetAllocation._id,
                  allocatedAmount: budgetAllocation.allocatedAmount,
                },
              });

              await procurementNotification.save();
              console.log(
                `✅ [BUDGET ALLOCATION] Direct notification sent to Procurement HOD: ${procurementHOD.firstName} ${procurementHOD.lastName} (${procurementHOD.email})`
              );
            } else {
              console.log(
                "⚠️ [BUDGET ALLOCATION] No Procurement HOD found to notify"
              );
            }
          }
        } else {
          console.log(
            "⚠️ [BUDGET ALLOCATION] Procurement department not found"
          );
        }
      } catch (notifError) {
        console.error(
          "❌ [BUDGET ALLOCATION] Error sending Procurement HOD notification:",
          notifError
        );
      }
    }
  } catch (error) {
    console.error(
      "Send Budget Allocation Approval Notifications Error:",
      error
    );
  }
};
