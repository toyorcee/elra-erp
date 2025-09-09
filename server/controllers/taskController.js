import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import NotificationService from "../services/notificationService.js";

// Create notification service instance
const notificationService = new NotificationService();

// ============================================================================
// TASK CONTROLLERS
// ============================================================================

// @desc    Get all tasks (with role-based filtering)
// @route   GET /api/tasks
// @access  Private (HOD+)
export const getAllTasks = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // SUPER_ADMIN (1000) - see all tasks across all departments
    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [TASKS] Super Admin - showing all tasks across all departments"
      );
    }
    // HOD (700) - see tasks in their department or where they're assigned
    else if (currentUser.role.level >= 700) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view tasks",
        });
      }

      query.$or = [
        { assignedTo: currentUser._id },
        { assignedBy: currentUser._id },
      ];

      console.log(
        "🔍 [TASKS] HOD - showing tasks for department:",
        currentUser.department.name
      );
    }
    // STAFF (300) - see tasks they're assigned to
    else if (currentUser.role.level >= 300) {
      query.$or = [
        { assignedTo: currentUser._id },
        { assignedBy: currentUser._id },
      ];

      console.log("🔍 [TASKS] Staff - showing assigned tasks only");
    }
    // Others - no access
    else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions to view tasks.",
      });
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "firstName lastName email")
      .populate("assignedBy", "firstName lastName email")
      .populate("project", "name code")
      .populate("createdBy", "firstName lastName")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error("❌ [TASKS] Get all tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private (HOD+)
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const task = await Task.findById(id)
      .populate("assignedTo", "firstName lastName email")
      .populate("assignedBy", "firstName lastName email")
      .populate("project", "name code")
      .populate("createdBy", "firstName lastName")
      .populate("comments.author", "firstName lastName");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkTaskAccess(currentUser, task);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to view this task.",
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("❌ [TASKS] Get task by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching task",
      error: error.message,
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (HOD+)
export const createTask = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user can create tasks
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and above can create tasks.",
      });
    }

    const taskData = {
      ...req.body,
      assignedBy: currentUser._id,
      createdBy: currentUser._id,
    };

    const task = new Task(taskData);
    await task.save();

    // Populate the created task
    await task.populate("assignedTo", "firstName lastName email");
    await task.populate("assignedBy", "firstName lastName email");
    await task.populate("project", "name code");
    await task.populate("createdBy", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("❌ [TASKS] Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (HOD+)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check access permissions
    const canEdit = await checkTaskEditAccess(currentUser, task);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to edit this task.",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: currentUser._id,
      },
      { new: true, runValidators: true }
    )
      .populate("assignedTo", "firstName lastName email")
      .populate("assignedBy", "firstName lastName email")
      .populate("project", "name code")
      .populate("createdBy", "firstName lastName");

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("❌ [TASKS] Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (HOD+)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check access permissions
    const canDelete = await checkTaskDeleteAccess(currentUser, task);
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to delete this task.",
      });
    }

    // Soft delete
    task.isActive = false;
    task.updatedBy = currentUser._id;
    await task.save();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("❌ [TASKS] Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private (HOD+)
export const getTaskStats = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD - tasks in their department or where they're assigned
        query.$or = [
          { assignedTo: currentUser._id },
          { assignedBy: currentUser._id },
        ];
      } else {
        // STAFF - only their assigned tasks
        query.$or = [
          { assignedTo: currentUser._id },
          { assignedBy: currentUser._id },
        ];
      }
    }

    const stats = await Task.getTaskStats();
    const totalTasks = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        stats,
        totalTasks,
      },
    });
  } catch (error) {
    console.error("❌ [TASKS] Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching task statistics",
      error: error.message,
    });
  }
};

// @desc    Get overdue tasks
// @route   GET /api/tasks/overdue
// @access  Private (HOD+)
export const getOverdueTasks = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        query.$or = [
          { assignedTo: currentUser._id },
          { assignedBy: currentUser._id },
        ];
      } else {
        query.$or = [
          { assignedTo: currentUser._id },
          { assignedBy: currentUser._id },
        ];
      }
    }

    const overdueTasks = await Task.getOverdueTasks();

    res.status(200).json({
      success: true,
      data: overdueTasks,
      total: overdueTasks.length,
    });
  } catch (error) {
    console.error("❌ [TASKS] Get overdue tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching overdue tasks",
      error: error.message,
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private (HOD+)
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isPrivate = false } = req.body;
    const currentUser = req.user;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkTaskAccess(currentUser, task);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to access this task.",
      });
    }

    await task.addComment(content, currentUser._id, isPrivate);

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      data: task,
    });
  } catch (error) {
    console.error("❌ [TASKS] Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message,
    });
  }
};

// @desc    Add checklist item to task
// @route   POST /api/tasks/:id/checklist
// @access  Private (HOD+)
export const addChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item } = req.body;
    const currentUser = req.user;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check access permissions
    const canEdit = await checkTaskEditAccess(currentUser, task);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to edit this task.",
      });
    }

    await task.addChecklistItem(item);

    res.status(200).json({
      success: true,
      message: "Checklist item added successfully",
      data: task,
    });
  } catch (error) {
    console.error("❌ [TASKS] Add checklist item error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding checklist item",
      error: error.message,
    });
  }
};

// @desc    Complete checklist item
// @route   PUT /api/tasks/:id/checklist/:itemIndex/complete
// @access  Private (HOD+)
export const completeChecklistItem = async (req, res) => {
  try {
    const { id, itemIndex } = req.params;
    const currentUser = req.user;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check access permissions
    const canEdit = await checkTaskEditAccess(currentUser, task);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to edit this task.",
      });
    }

    await task.completeChecklistItem(parseInt(itemIndex), currentUser._id);

    res.status(200).json({
      success: true,
      message: "Checklist item completed successfully",
      data: task,
    });
  } catch (error) {
    console.error("❌ [TASKS] Complete checklist item error:", error);
    res.status(500).json({
      success: false,
      message: "Error completing checklist item",
      error: error.message,
    });
  }
};

// @desc    Create base tasks for personal project implementation
// @route   POST /api/tasks/personal/:projectId
// @access  Private (STAFF+)
export const createPersonalProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // Check if user can create tasks
    if (currentUser.role.level < 300) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only STAFF and above can create tasks.",
      });
    }

    // Get project details to calculate dynamic timelines
    const Project = mongoose.model("Project");
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Calculate dynamic timelines based on project start/end dates
    const projectStartDate = new Date(project.startDate);
    const projectEndDate = new Date(project.endDate);
    const totalDuration = projectEndDate.getTime() - projectStartDate.getTime();

    // AI-powered timeline distribution: 20% setup, 60% implementation, 20% review
    const setupDuration = totalDuration * 0.2;
    const implementationDuration = totalDuration * 0.6;
    const reviewDuration = totalDuration * 0.2;

    const setupEndDate = new Date(projectStartDate.getTime() + setupDuration);
    const implementationEndDate = new Date(
      setupEndDate.getTime() + implementationDuration
    );
    const reviewEndDate = new Date(
      implementationEndDate.getTime() + reviewDuration
    );

    // Dynamic base tasks with calculated timelines
    const baseTasks = [
      {
        title: "Project Setup & Planning",
        description:
          "Set up project workspace, gather resources, and create detailed implementation plan",
        category: "project_setup",
        priority: "high",
        status: "pending",
        startDate: projectStartDate,
        dueDate: setupEndDate,
        project: projectId,
        assignedTo: currentUser._id,
        createdBy: currentUser._id,
        estimatedHours: Math.ceil((setupDuration / (24 * 60 * 60 * 1000)) * 8), // Convert days to hours
        projectType: "personal",
        implementationPhase: "setup",
        milestoneOrder: 1,
        isBaseTask: true,
        tags: ["setup", "planning", "personal"],
        notes: `Timeline: ${setupEndDate.toLocaleDateString()} - Based on project duration: ${Math.ceil(
          totalDuration / (24 * 60 * 60 * 1000)
        )} days`,
      },
      {
        title: "Core Implementation",
        description: "Execute the main project work and deliverables",
        category: "core_implementation",
        priority: "high",
        status: "pending",
        startDate: setupEndDate,
        dueDate: implementationEndDate,
        project: projectId,
        assignedTo: currentUser._id,
        createdBy: currentUser._id,
        estimatedHours: Math.ceil(
          (implementationDuration / (24 * 60 * 60 * 1000)) * 8
        ), // Convert days to hours
        projectType: "personal",
        implementationPhase: "execution",
        milestoneOrder: 2,
        isBaseTask: true,
        tags: ["implementation", "core", "personal"],
        notes: `Timeline: ${implementationEndDate.toLocaleDateString()} - Main work phase`,
      },
      {
        title: "Quality Review & Project Closure",
        description:
          "Test deliverables, gather feedback, and complete project documentation",
        category: "quality_check",
        priority: "medium",
        status: "pending",
        startDate: implementationEndDate,
        dueDate: reviewEndDate,
        project: projectId,
        assignedTo: currentUser._id,
        createdBy: currentUser._id,
        estimatedHours: Math.ceil((reviewDuration / (24 * 60 * 60 * 1000)) * 8), // Convert days to hours
        projectType: "personal",
        implementationPhase: "closure",
        milestoneOrder: 3,
        isBaseTask: true,
        tags: ["review", "quality", "closure", "personal"],
        notes: `Timeline: ${reviewEndDate.toLocaleDateString()} - Final review and closure`,
      },
    ];

    const createdTasks = await Task.insertMany(baseTasks);

    res.status(201).json({
      success: true,
      message: "Base tasks created successfully",
      data: createdTasks,
    });
  } catch (error) {
    console.error("❌ [TASKS] Create personal project tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating base tasks",
      error: error.message,
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Check if user has access to view task
const checkTaskAccess = async (user, task) => {
  // SUPER_ADMIN can access everything
  if (user.role.level >= 1000) return true;

  // HOD can access tasks in their department or where they're assigned
  if (user.role.level >= 700) {
    return (
      task.assignedTo.toString() === user._id.toString() ||
      task.assignedBy.toString() === user._id.toString()
    );
  }

  // STAFF can access tasks they're assigned to
  if (user.role.level >= 300) {
    return (
      task.assignedTo.toString() === user._id.toString() ||
      task.assignedBy.toString() === user._id.toString()
    );
  }

  return false;
};

// Check if user can edit task
const checkTaskEditAccess = async (user, task) => {
  // SUPER_ADMIN can edit everything
  if (user.role.level >= 1000) return true;

  // HOD can edit tasks they manage or in their department
  if (user.role.level >= 700) {
    return (
      task.assignedTo.toString() === user._id.toString() ||
      task.assignedBy.toString() === user._id.toString() ||
      task.createdBy.toString() === user._id.toString()
    );
  }

  // STAFF can only edit tasks they're assigned to
  if (user.role.level >= 300) {
    return task.assignedTo.toString() === user._id.toString();
  }

  return false;
};

// Check if user can delete task
const checkTaskDeleteAccess = async (user, task) => {
  // SUPER_ADMIN can delete everything
  if (user.role.level >= 1000) return true;

  // HOD can delete tasks they created or manage
  if (user.role.level >= 700) {
    return (
      task.createdBy.toString() === user._id.toString() ||
      task.assignedBy.toString() === user._id.toString()
    );
  }

  return false;
};

// @desc    Get tasks by project ID (project creator only)
// @route   GET /api/tasks/project/:projectId
// @access  Private (Project creator only)
export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // First, verify the project exists and get its details
    const project = await Project.findById(projectId).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if current user is the project creator
    if (project.createdBy._id.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view tasks for your own projects.",
      });
    }

    // Get tasks for this project
    const tasks = await Task.find({
      project: projectId,
      isActive: true,
    })
      .populate("assignedTo", "firstName lastName email")
      .populate("assignedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    console.log(
      `🔍 [TASKS] Found ${tasks.length} tasks for project ${projectId} by user ${currentUser._id}`
    );

    res.status(200).json({
      success: true,
      data: {
        tasks,
        project: {
          id: project._id,
          name: project.name,
          code: project.code,
          createdBy: project.createdBy,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project tasks",
      error: error.message,
    });
  }
};

// @desc    Update task status (task assignee or project creator only)
// @route   PUT /api/tasks/:id/status
// @access  Private (Task assignee or project creator only)
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUser = req.user;

    // Validate status
    if (!["pending", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be 'pending', 'in_progress', or 'completed'",
      });
    }

    // Find the task and populate project details
    const task = await Task.findById(id).populate("project", "createdBy");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if current user is the task assignee or project creator
    const isAssignee =
      task.assignedTo.toString() === currentUser._id.toString();
    const isProjectCreator =
      task.project.createdBy.toString() === currentUser._id.toString();

    if (!isAssignee && !isProjectCreator) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only update tasks assigned to you or tasks from your projects.",
      });
    }

    // Update task status
    task.status = status;

    // Set completion date if task is completed
    if (status === "completed") {
      task.completedDate = new Date();
    } else if (status === "pending") {
      task.completedDate = null;
    }

    await task.save();

    // Update project progress if task is completed
    if (status === "completed") {
      await task.project.updateTwoPhaseProgress();
    }

    // Send notifications for task status updates
    try {
      const project = await Project.findById(task.project).populate(
        "createdBy",
        "firstName lastName email"
      );
      console.log(
        `🔔 [NOTIFICATIONS] Sending task notification for project: ${project.name}, status: ${status}`
      );

      if (status === "in_progress") {
        // Notify project creator that task has started
        console.log(
          `🔔 [NOTIFICATIONS] Creating task_started notification for user: ${project.createdBy._id}`
        );
        const notification = await notificationService.createNotification({
          recipient: project.createdBy._id,
          type: "task_started",
          title: "Task Started",
          message: `Task "${task.title}" has been started for project "${project.name}"`,
          priority: "medium",
          metadata: {
            taskId: task._id,
            projectId: project._id,
            projectName: project.name,
            taskTitle: task.title,
            startedBy: currentUser._id,
          },
        });
        console.log(
          `✅ [NOTIFICATIONS] Task started notification created:`,
          notification
        );
      } else if (status === "completed") {
        // Notify project creator that task is completed
        console.log(
          `🔔 [NOTIFICATIONS] Creating task_completed notification for user: ${project.createdBy._id}`
        );
        const notification = await notificationService.createNotification({
          recipient: project.createdBy._id,
          type: "task_completed",
          title: "Task Completed",
          message: `Task "${task.title}" has been completed for project "${project.name}". Project progress updated!`,
          priority: "high",
          metadata: {
            taskId: task._id,
            projectId: project._id,
            projectName: project.name,
            taskTitle: task.title,
            completedBy: currentUser._id,
          },
        });
        console.log(
          `✅ [NOTIFICATIONS] Task completed notification created:`,
          notification
        );
      }
    } catch (notificationError) {
      console.error(
        "❌ [NOTIFICATIONS] Error sending task notification:",
        notificationError
      );
      // Don't fail the request if notification fails
    }

    console.log(
      `✅ [TASKS] Task ${id} status updated to ${status} by user ${currentUser._id}`
    );

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      data: {
        task: {
          id: task._id,
          title: task.title,
          status: task.status,
          completedDate: task.completedDate,
        },
      },
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating task status",
      error: error.message,
    });
  }
};
