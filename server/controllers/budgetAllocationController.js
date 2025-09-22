import mongoose from "mongoose";
import BudgetAllocation from "../models/BudgetAllocation.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Helper function to notify employee about budget allocation
const notifyEmployeeAboutBudgetAllocation = async (
  project,
  budgetAllocation
) => {
  try {
    console.log(
      `📧 [BUDGET NOTIFICATION] Notifying employee about budget allocation...`
    );

    // Get employee details
    const employee = await User.findById(project.createdBy);
    if (!employee) {
      console.log("⚠️ [BUDGET NOTIFICATION] Employee not found");
      return;
    }

    const message = `Your project "${
      project.name
    }" has been allocated ₦${budgetAllocation.allocatedAmount.toLocaleString()}. The procurement process will now begin automatically.`;

    const notificationData = {
      budgetAllocationId: budgetAllocation._id,
      projectId: project._id,
      projectName: project.name,
      projectCode: project.code,
      allocatedAmount: budgetAllocation.allocatedAmount,
      projectStatus: project.status,
    };

    const notification = new Notification({
      recipient: project.createdBy,
      type: "BUDGET_ALLOCATED",
      title: "Project Budget Allocated",
      message: message,
      data: notificationData,
      priority: "high",
    });

    await notification.save();
    console.log(
      `✅ [BUDGET NOTIFICATION] Notification sent to employee: ${employee.email}`
    );
  } catch (error) {
    console.error(
      "❌ [BUDGET NOTIFICATION] Error sending notification:",
      error
    );
  }
};

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

    const allocatedBy = req.user;

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

    let finalAllocatedAmount = allocatedAmount || 0;

    if (allocationType === "project_budget" && project) {
      if (!allocatedAmount || allocatedAmount === 0) {
        finalAllocatedAmount = 0;
        console.log(
          `💰 [BUDGET ALLOCATION] No extra funding provided, will use project items cost as base allocation`
        );
      } else {
        console.log(
          `💰 [BUDGET ALLOCATION] Extra funding amount: ₦${finalAllocatedAmount.toLocaleString()}`
        );
      }
    }

    const projectItemsTotal =
      project?.projectItems?.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      ) || 0;
    const previousBudget = project ? project.budget : 0;

    const baseAmount = projectItemsTotal;
    const newBudget = baseAmount;

    console.log(`💰 [BUDGET ALLOCATION] Allocation breakdown:`);
    console.log(
      `   - Project Items Cost (Allocated): ₦${baseAmount.toLocaleString()}`
    );
    console.log(`   - Total Allocation: ₦${newBudget.toLocaleString()}`);

    try {
      const ELRAWallet = await import("../models/ELRAWallet.js");
      const elraWallet = await ELRAWallet.default.getOrCreateWallet(
        "ELRA_MAIN",
        allocatedBy
      );

      if (elraWallet.availableFunds < newBudget) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ELRA funds. Available: ₦${elraWallet.availableFunds.toLocaleString()}, Required: ₦${newBudget.toLocaleString()}`,
        });
      }

      console.log(
        `💳 [ELRA WALLET] Sufficient funds available: ₦${elraWallet.availableFunds.toLocaleString()}`
      );
    } catch (walletError) {
      console.error("❌ [ELRA WALLET] Error checking wallet:", walletError);
      return res.status(500).json({
        success: false,
        message: "Error checking ELRA funds availability",
      });
    }

    const budgetAllocation = new BudgetAllocation({
      project: projectId,
      projectCode: project?.code,
      projectName: project?.name,
      allocationType,
      allocatedAmount: newBudget,
      baseAmount: baseAmount,
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

    // Reserve funds in ELRA wallet
    try {
      const ELRAWallet = await import("../models/ELRAWallet.js");
      const elraWallet = await ELRAWallet.default.getOrCreateWallet(
        "ELRA_MAIN",
        allocatedBy
      );

      await elraWallet.allocateFunds(
        newBudget,
        `Budget allocation for project: ${project.name}`,
        budgetAllocation._id,
        allocationType,
        allocatedBy
      );

      console.log(
        `✅ [ELRA WALLET] Reserved ₦${newBudget.toLocaleString()} for project allocation`
      );
    } catch (walletError) {
      console.error("❌ [ELRA WALLET] Error reserving funds:", walletError);
      // Don't fail the allocation, but log the error
    }

    // Always notify employee about budget allocation
    await notifyEmployeeAboutBudgetAllocation(project, budgetAllocation);

    // Auto-approve the budget allocation for project_budget type
    if (allocationType === "project_budget" && project) {
      console.log("🚀 [BUDGET ALLOCATION] Auto-approving budget allocation...");
      console.log(
        "📊 [STATS TRANSFORM] Before allocation - Project status:",
        project.status
      );
      console.log(
        "📊 [STATS TRANSFORM] Before allocation - BudgetAllocation status:",
        budgetAllocation.status
      );

      await budgetAllocation.approveAllocation(
        allocatedBy,
        "Approved by Finance HOD"
      );

      console.log(
        "📊 [STATS TRANSFORM] After allocation approval - BudgetAllocation status:",
        budgetAllocation.status
      );

      // Update project budget and status
      project.budget = budgetAllocation.newBudget;
      console.log(
        "📊 [STATS TRANSFORM] Updated project budget to:",
        project.budget
      );

      const budgetAllocationStep = project.approvalChain.find(
        (step) => step.level === "budget_allocation"
      );
      if (budgetAllocationStep) {
        budgetAllocationStep.status = "approved";
        budgetAllocationStep.approvedAt = new Date();
        budgetAllocationStep.approver = allocatedBy._id;
        budgetAllocationStep.comments =
          "Budget allocated and approved by Finance & Accounting HOD";
        console.log(
          "✅ [BUDGET ALLOCATION] Updated approval chain - budget_allocation marked as approved"
        );
      }

      await project.save();
      console.log(
        "✅ [BUDGET ALLOCATION] Project saved with updated approval chain"
      );

      if (project.requiresBudgetAllocation === true) {
        console.log(
          "🛒 [BUDGET ALLOCATION] ${project.projectScope} project with budget allocation - triggering procurement workflow"
        );
        project.status = "pending_procurement";
        await project.save();
        console.log(
          "📊 [STATS TRANSFORM] Project status set to pending_procurement"
        );

        try {
          await project.triggerProcurementCreation(allocatedBy);
          console.log(
            "✅ [BUDGET ALLOCATION] Procurement triggered for ${project.projectScope} project"
          );
          console.log(
            "📊 [STATS TRANSFORM] After procurement creation - Project status:",
            project.status
          );
        } catch (procurementError) {
          console.error(
            "❌ [BUDGET ALLOCATION] Error triggering procurement:",
            procurementError
          );
        }
      } else {
        project.status = "approved";
        await project.save();
        console.log(
          "✅ [BUDGET ALLOCATION] Project status updated to approved"
        );
      }

      console.log("✅ [BUDGET ALLOCATION] Budget allocation auto-approved");

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
            budgetAllocation.projectName || "Unknown Project"
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
// GET BUDGET ALLOCATION HISTORY
// ============================================================================

/**
 * Get budget allocation history for the current user
 * GET /api/budget-allocations/history
 */
export const getBudgetAllocationHistory = async (req, res) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 50, status } = req.query;

    // Build query for allocations created by current user
    const query = {
      allocatedBy: currentUser._id,
    };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get budget allocations with pagination
    const allocations = await BudgetAllocation.find(query)
      .populate("project", "name code department")
      .populate("allocatedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await BudgetAllocation.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        allocations,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching budget allocation history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch budget allocation history",
      error: error.message,
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
    const isExecutiveHOD =
      user.department === "Executive Office" && user.role?.level >= 700;

    if (!isFinanceHOD && !isExecutiveHOD) {
      if (user.department) {
        query.department = user.department;
      }
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
    const isExecutiveHOD =
      user.department === "Executive Office" && user.role?.level >= 700;

    const isOwner =
      budgetAllocation.allocatedBy.toString() === user._id.toString();
    const isProjectCreator =
      budgetAllocation.project?.createdBy?.toString() === user._id.toString();

    if (!isFinanceHOD && !isExecutiveHOD && !isOwner && !isProjectCreator) {
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

    // Approve allocation in ELRA wallet
    try {
      const ELRAWallet = await import("../models/ELRAWallet.js");
      const elraWallet = await ELRAWallet.default.getOrCreateWallet(
        "ELRA_MAIN",
        approverId
      );

      await elraWallet.approveAllocation(budgetAllocation._id, approverId);

      console.log(
        `✅ [ELRA WALLET] Approved allocation of ₦${budgetAllocation.allocatedAmount.toLocaleString()}`
      );
    } catch (walletError) {
      console.error(
        "❌ [ELRA WALLET] Error approving allocation:",
        walletError
      );
    }

    // Reserve funds for personal and departmental projects after Finance HOD approval
    if (
      budgetAllocation.allocationType === "project_budget" &&
      budgetAllocation.project &&
      (budgetAllocation.project.projectScope === "personal" ||
        budgetAllocation.project.projectScope === "departmental")
    ) {
      console.log(
        `💰 [ELRA WALLET] Reserving funds for ${budgetAllocation.project.projectScope} project after Finance HOD approval...`
      );

      try {
        const ELRAWallet = await import("../models/ELRAWallet.js");
        const wallet = await ELRAWallet.default.findOne({
          elraInstance: "ELRA_MAIN",
        });

        if (!wallet) {
          throw new Error("ELRA wallet not found");
        }

        // Calculate the amount to reserve (full project budget for personal/departmental projects)
        const amountToReserve = budgetAllocation.project.budget;

        console.log(
          `💰 [ELRA WALLET] BEFORE RESERVATION - Projects budget: Available ₦${wallet.budgetCategories.projects.available.toLocaleString()}, Reserved ₦${wallet.budgetCategories.projects.reserved.toLocaleString()}`
        );

        console.log(
          `💰 [ELRA WALLET] Reserving ₦${amountToReserve.toLocaleString()} for ${
            budgetAllocation.project.projectScope
          } project: ${budgetAllocation.project.name} (${
            budgetAllocation.project.code
          })`
        );

        // Reserve funds from projects budget category
        await wallet.reserveFromCategory(
          "projects",
          amountToReserve,
          `${
            budgetAllocation.project.projectScope === "personal"
              ? "Personal"
              : "Departmental"
          } Project: ${budgetAllocation.project.name} (${
            budgetAllocation.project.code
          }) - ELRA Contribution (Approved by Finance HOD)`,
          budgetAllocation.project.code,
          budgetAllocation.project._id,
          "project",
          approverId
        );

        console.log(
          `✅ [ELRA WALLET] Successfully reserved ₦${amountToReserve.toLocaleString()} for ${
            budgetAllocation.project.projectScope
          } project ${budgetAllocation.project.code} after Finance HOD approval`
        );
      } catch (walletError) {
        console.error(
          `❌ [ELRA WALLET] Error reserving funds for ${budgetAllocation.project.projectScope} project:`,
          walletError
        );
        // Don't throw error here to avoid breaking the approval process
        // The funds reservation is important but shouldn't block the approval
      }
    }

    // Update project budget if it's a project allocation
    if (
      budgetAllocation.allocationType === "project_budget" &&
      budgetAllocation.project
    ) {
      const project = budgetAllocation.project;
      // Update project budget to the new total (items total + allocated amount)
      project.budget = budgetAllocation.newBudget;

      // For any project with budget allocation, trigger procurement workflow
      if (project.requiresBudgetAllocation === true) {
        console.log(
          "🛒 [BUDGET ALLOCATION] ${project.projectScope} project with budget allocation - triggering procurement workflow"
        );
        project.status = "pending_procurement";
        await project.save();

        // Procurement creation is handled in the main allocation creation logic
        console.log(
          "ℹ️ [BUDGET ALLOCATION] Procurement creation handled in main allocation logic"
        );
      } else {
        // For other project types, set to approved
        project.status = "approved";
        await project.save();
      }
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

    // Reject allocation in ELRA wallet
    try {
      const ELRAWallet = await import("../models/ELRAWallet.js");
      const elraWallet = await ELRAWallet.default.getOrCreateWallet(
        "ELRA_MAIN",
        rejectorId
      );

      await elraWallet.rejectAllocation(
        budgetAllocation._id,
        reason,
        rejectorId
      );

      console.log(
        `✅ [ELRA WALLET] Rejected allocation of ₦${budgetAllocation.allocatedAmount.toLocaleString()}`
      );
    } catch (walletError) {
      console.error(
        "❌ [ELRA WALLET] Error rejecting allocation:",
        walletError
      );
    }

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
    console.log("📊 [CONTROLLER] Getting budget allocation stats...");
    const { allocationType, startDate, endDate } = req.query;
    const user = req.user;

    console.log("📊 [CONTROLLER] User:", {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      department: user.department,
      roleLevel: user.role?.level,
    });

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

    console.log("📊 [CONTROLLER] Is Finance HOD:", isFinanceHOD);

    if (!isFinanceHOD && user.department) {
      query.department = user.department;
    }

    const ELRAWallet = await import("../models/ELRAWallet.js");
    const wallet = await ELRAWallet.default.findOne();

    let stats = {
      pendingAllocations: 0,
      allocatedAllocations: 0,
      totalAllocated: 0,
      pendingProjects: 0,
      allocatedProjects: 0,
      totalProjectItemsCost: 0,
    };

    // Get actual project data for accurate stats
    const pendingProjects = await Project.find({
      requiresBudgetAllocation: true,
      status: "pending_budget_allocation",
    });

    const allocatedProjects = await Project.find({
      requiresBudgetAllocation: true,
      status: { $in: ["approved", "pending_procurement", "implementation"] },
    });

    // Get budget allocations for projects
    const projectAllocations = await BudgetAllocation.find({
      allocationType: "project_budget",
      status: "allocated",
    });

    const pendingAllocations = await BudgetAllocation.find({
      allocationType: "project_budget",
      status: "pending",
    });

    // Calculate total project items cost
    const totalProjectItemsCost = allocatedProjects.reduce((sum, project) => {
      return (
        sum +
        (project.projectItems?.reduce(
          (itemSum, item) => itemSum + (item.totalPrice || 0),
          0
        ) || 0)
      );
    }, 0);

    // Calculate total allocated amount for projects
    const totalAllocatedForProjects = projectAllocations.reduce(
      (sum, allocation) => {
        return sum + (allocation.allocatedAmount || 0);
      },
      0
    );

    stats = {
      pendingAllocations: pendingAllocations.length,
      allocatedAllocations: projectAllocations.length,
      totalAllocated: totalAllocatedForProjects,
      pendingProjects: pendingProjects.length,
      allocatedProjects: allocatedProjects.length,
      totalProjectItemsCost: totalProjectItemsCost,
    };

    // Add wallet balance information if available
    if (wallet && wallet.budgetCategories) {
      stats.walletBalance = {
        projects: {
          allocated: wallet.budgetCategories.projects?.allocated || 0,
          available: wallet.budgetCategories.projects?.available || 0,
          reserved: wallet.budgetCategories.projects?.reserved || 0,
          used: wallet.budgetCategories.projects?.used || 0,
        },
      };
    }

    console.log("📊 [CONTROLLER] Stats retrieved from ELRA wallet:", stats);

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
      message: `Budget allocation for project "${
        budgetAllocation.projectName || "Unknown Project"
      }" has been ${actionText} and can be used for the purchase order.`,
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
  } catch (error) {
    console.error(
      "Send Budget Allocation Approval Notifications Error:",
      error
    );
  }
};
