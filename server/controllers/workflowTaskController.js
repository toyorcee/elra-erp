import WorkflowTaskService from "../services/workflowTaskService.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Department from "../models/Department.js";

// @desc    Get all tasks for a project by workflow phase
// @route   GET /api/workflow-tasks/:projectId/:phase
// @access  Private
export const getProjectTasksByPhase = async (req, res) => {
  try {
    const { projectId, phase } = req.params;
    const currentUser = req.user;

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user has permission to view tasks for this phase
    const userDepartment = currentUser.department?.name;
    const allowedDepartments = {
      operations: ["Operations"],
      procurement: ["Procurement"],
      finance: ["Finance & Accounting"],
    };

    if (!allowedDepartments[phase]?.includes(userDepartment)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${allowedDepartments[phase]?.join(
          ", "
        )} can view ${phase} tasks.`,
      });
    }

    const tasks = await WorkflowTaskService.getProjectTasksByPhase(
      projectId,
      phase
    );

    res.json({
      success: true,
      data: {
        project: {
          _id: project._id,
          name: project.name,
          category: project.category,
          workflowPhase: project.workflowPhase,
          workflowStep: project.workflowStep,
        },
        phase,
        tasks,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task) => task.status === "completed")
          .length,
        pendingTasks: tasks.filter((task) => task.status === "pending").length,
      },
    });
  } catch (error) {
    console.error("❌ [WORKFLOW TASK] Error getting tasks by phase:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving tasks",
      error: error.message,
    });
  }
};

// @desc    Complete a workflow phase and trigger next phase
// @route   POST /api/workflow-tasks/:projectId/:phase/complete
// @access  Private
export const completeWorkflowPhase = async (req, res) => {
  try {
    const { projectId, phase } = req.params;
    const currentUser = req.user;

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user has permission to complete this phase
    const userDepartment = currentUser.department?.name;
    const allowedDepartments = {
      operations: ["Operations"],
      procurement: ["Procurement"],
      finance: ["Finance & Accounting"],
    };

    if (!allowedDepartments[phase]?.includes(userDepartment)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${allowedDepartments[phase]?.join(
          ", "
        )} can complete ${phase} phase.`,
      });
    }

    // Check if all tasks in the phase are completed
    const tasks = await Task.find({
      project: projectId,
      workflowPhase: phase,
      status: { $ne: "completed" },
    });

    if (tasks.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete ${phase} phase. ${tasks.length} tasks are still pending.`,
        pendingTasks: tasks.map((task) => ({
          _id: task._id,
          title: task.title,
          status: task.status,
        })),
      });
    }

    // Complete the phase and trigger next phase
    const updatedProject = await WorkflowTaskService.completeWorkflowPhase(
      projectId,
      phase
    );

    // Create tasks for the next phase if applicable
    let nextPhaseTasks = [];
    if (
      phase === "operations" &&
      updatedProject.workflowTriggers.procurementInitiated
    ) {
      try {
        nextPhaseTasks = await WorkflowTaskService.createProcurementTasks(
          projectId
        );
      } catch (taskError) {
        console.error(
          "⚠️ [WORKFLOW TASK] Error creating Procurement tasks:",
          taskError
        );
      }
    } else if (
      phase === "procurement" &&
      updatedProject.workflowTriggers.financialSetup
    ) {
      try {
        nextPhaseTasks = await WorkflowTaskService.createFinanceTasks(
          projectId
        );
      } catch (taskError) {
        console.error(
          "⚠️ [WORKFLOW TASK] Error creating Finance tasks:",
          taskError
        );
      }
    }

    res.json({
      success: true,
      message: `${phase} phase completed successfully`,
      data: {
        project: {
          _id: updatedProject._id,
          name: updatedProject.name,
          workflowPhase: updatedProject.workflowPhase,
          workflowStep: updatedProject.workflowStep,
          workflowTriggers: updatedProject.workflowTriggers,
        },
        completedPhase: phase,
        nextPhaseTasks: nextPhaseTasks.length,
      },
    });
  } catch (error) {
    console.error("❌ [WORKFLOW TASK] Error completing workflow phase:", error);
    res.status(500).json({
      success: false,
      message: "Error completing workflow phase",
      error: error.message,
    });
  }
};

// @desc    Complete a specific task
// @route   POST /api/workflow-tasks/:taskId/complete
// @access  Private
export const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user;

    // Find the task
    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user has permission to complete this task
    if (task.department.toString() !== currentUser.department._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only complete tasks assigned to your department.",
      });
    }

    // Update task status
    if (task.status === "pending") {
      task.status = "in_progress";
      task.startedAt = new Date();
    } else if (task.status === "in_progress") {
      task.status = "completed";
      task.completedAt = new Date();
      task.completedBy = currentUser._id;
    }

    await task.save();

    // Check if all tasks in this phase are completed
    const allPhaseTasks = await Task.find({
      project: task.project._id,
      workflowPhase: task.workflowPhase,
    });

    const allCompleted = allPhaseTasks.every(t => t.status === "completed");

    if (allCompleted) {
      // Trigger next phase
      await WorkflowTaskService.completeWorkflowPhase(task.project._id, task.workflowPhase);
    }

    res.json({
      success: true,
      data: {
        task,
        message: `Task ${task.status === "completed" ? "completed" : "started"} successfully`,
        allPhaseCompleted: allCompleted,
      },
    });
  } catch (error) {
    console.error("❌ [WORKFLOW TASK] Error completing task:", error);
    res.status(500).json({
      success: false,
      message: "Error completing task",
      error: error.message,
    });
  }
};

// @desc    Get all operations tasks for the current user's department
// @route   GET /api/workflow-tasks/operations
// @access  Private
export const getOperationsTasks = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is from Operations department
    if (currentUser.department?.name !== "Operations") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Operations department can view operations tasks.",
      });
    }

    // Get all projects that have inventoryCreated = true (approved projects)
    const approvedProjects = await Project.find({
      "workflowTriggers.inventoryCreated": true,
      status: "approved",
    });

    const projectIds = approvedProjects.map((project) => project._id);

    // Get all operations tasks for these projects
    const operationsTasks = await Task.find({
      project: { $in: projectIds },
      workflowPhase: "operations",
      department: currentUser.department._id,
    }).populate("project", "name category");

    res.json({
      success: true,
      data: {
        tasks: operationsTasks,
        totalTasks: operationsTasks.length,
        completedTasks: operationsTasks.filter(
          (task) => task.status === "completed"
        ).length,
        pendingTasks: operationsTasks.filter(
          (task) => task.status === "pending"
        ).length,
        inProgressTasks: operationsTasks.filter(
          (task) => task.status === "in_progress"
        ).length,
      },
    });
  } catch (error) {
    console.error("❌ [WORKFLOW TASK] Error getting operations tasks:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving operations tasks",
      error: error.message,
    });
  }
};

// @desc    Get workflow progress for a project
// @route   GET /api/workflow-tasks/:projectId/progress
// @access  Private
export const getWorkflowProgress = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Get tasks for all phases
    const operationsTasks = await Task.find({
      project: projectId,
      workflowPhase: "operations",
    });
    const procurementTasks = await Task.find({
      project: projectId,
      workflowPhase: "procurement",
    });
    const financeTasks = await Task.find({
      project: projectId,
      workflowPhase: "finance",
    });

    const progress = {
      operations: {
        total: operationsTasks.length,
        completed: operationsTasks.filter((task) => task.status === "completed")
          .length,
        pending: operationsTasks.filter((task) => task.status === "pending")
          .length,
        percentage:
          operationsTasks.length > 0
            ? Math.round(
                (operationsTasks.filter((task) => task.status === "completed")
                  .length /
                  operationsTasks.length) *
                  100
              )
            : 0,
      },
      procurement: {
        total: procurementTasks.length,
        completed: procurementTasks.filter(
          (task) => task.status === "completed"
        ).length,
        pending: procurementTasks.filter((task) => task.status === "pending")
          .length,
        percentage:
          procurementTasks.length > 0
            ? Math.round(
                (procurementTasks.filter((task) => task.status === "completed")
                  .length /
                  procurementTasks.length) *
                  100
              )
            : 0,
      },
      finance: {
        total: financeTasks.length,
        completed: financeTasks.filter((task) => task.status === "completed")
          .length,
        pending: financeTasks.filter((task) => task.status === "pending")
          .length,
        percentage:
          financeTasks.length > 0
            ? Math.round(
                (financeTasks.filter((task) => task.status === "completed")
                  .length /
                  financeTasks.length) *
                  100
              )
            : 0,
      },
    };

    res.json({
      success: true,
      data: {
        project: {
          _id: project._id,
          name: project.name,
          workflowPhase: project.workflowPhase,
          workflowStep: project.workflowStep,
          workflowTriggers: project.workflowTriggers,
        },
        progress,
        overallProgress: Math.round(
          (progress.operations.percentage +
            progress.procurement.percentage +
            progress.finance.percentage) /
            3
        ),
      },
    });
  } catch (error) {
    console.error("❌ [WORKFLOW TASK] Error getting workflow progress:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving workflow progress",
      error: error.message,
    });
  }
};
