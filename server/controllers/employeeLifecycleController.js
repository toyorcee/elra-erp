import EmployeeLifecycle from "../models/EmployeeLifecycle.js";
import TaskTemplate from "../models/TaskTemplate.js";
import ChecklistTemplate from "../models/ChecklistTemplate.js";
import DocumentType from "../models/DocumentType.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllLifecycles = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    type,
    department,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Apply filters
  if (status) query.status = status;
  if (type) query.type = type;
  if (department) query.department = department;

  // Search functionality
  if (search) {
    query.$or = [
      { "employee.firstName": { $regex: search, $options: "i" } },
      { "employee.lastName": { $regex: search, $options: "i" } },
      { "employee.email": { $regex: search, $options: "i" } },
    ];
  }

  // Role-based access control
  const user = req.user;

  // Super Admin (level 1000+) can see all lifecycles
  if (user.role.level >= 1000) {
    // No department restriction
  }
  // HR HOD (level 700+ in Human Resources department) can see all lifecycles
  else if (user.role.level >= 700) {
    // Check if user is in Human Resources department
    const userWithDept = await User.findById(user._id).populate("department");
    if (
      userWithDept.department &&
      userWithDept.department.name !== "Human Resources"
    ) {
      // Non-HR HODs can only see their own department
      query.department = user.department;
    }
    // HR HODs can see all departments (no restriction)
  } else {
    query.department = user.department;
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build the query with populate
  let lifecyclesQuery = EmployeeLifecycle.find(query)
    .populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId",
      },
      { path: "department", select: "name" },
      { path: "assignedHR", select: "firstName lastName email" },
      { path: "initiatedBy", select: "firstName lastName email" },
    ])
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
    .skip(skip)
    .limit(limitNum);

  // Execute query and get total count
  const [lifecycles, total] = await Promise.all([
    lifecyclesQuery.exec(),
    EmployeeLifecycle.countDocuments(query),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  const paginatedData = {
    docs: lifecycles,
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
    message: "Lifecycles retrieved successfully",
  });
});

// Get lifecycle by ID
const getLifecycleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lifecycle = await EmployeeLifecycle.findById(id).populate([
    { path: "employee", select: "firstName lastName email avatar employeeId" },
    { path: "department", select: "name" },
    { path: "assignedHR", select: "firstName lastName email" },
    { path: "initiatedBy", select: "firstName lastName email" },
    { path: "tasks.assignedTo", select: "firstName lastName email" },
    { path: "tasks.completedBy", select: "firstName lastName email" },
    { path: "checklist.completedBy", select: "firstName lastName email" },
    { path: "timeline.performedBy", select: "firstName lastName email" },
    { path: "processSteps.conductedBy", select: "firstName lastName email" },
  ]);

  if (!lifecycle) {
    return res.status(404).json({
      success: false,
      message: "Lifecycle not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: lifecycle,
    message: "Lifecycle retrieved successfully",
  });
});

// Create new lifecycle
const createLifecycle = asyncHandler(async (req, res) => {
  const {
    employeeId,
    type,
    departmentId,
    roleId,
    assignedHR,
    targetCompletionDate,
    notes,
  } = req.body;

  // Validate required fields
  if (!employeeId || !type || !departmentId || !assignedHR) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  // Check if employee already has an active lifecycle of this type
  const existingLifecycle = await EmployeeLifecycle.findOne({
    employee: employeeId,
    type,
    status: { $in: ["Initiated", "In Progress"] },
  });

  if (existingLifecycle) {
    return res.status(400).json({
      success: false,
      message: "Employee already has an active lifecycle of this type",
    });
  }

  // Create lifecycle using streamlined 5-task system
  const lifecycle = await EmployeeLifecycle.createStandardLifecycle(
    employeeId,
    type,
    departmentId,
    roleId,
    req.user._id,
    assignedHR
  );

  // Update target completion date if provided
  if (targetCompletionDate) {
    lifecycle.targetCompletionDate = new Date(targetCompletionDate);
  }

  // Add notes if provided
  if (notes) {
    lifecycle.notes = notes;
  }

  await lifecycle.save();

  // Add initial timeline entry
  await lifecycle.addTimelineEntry(
    "Lifecycle Created",
    `${type} lifecycle initiated for employee`,
    req.user._id
  );

  const populatedLifecycle = await EmployeeLifecycle.findById(
    lifecycle._id
  ).populate([
    { path: "employee", select: "firstName lastName email avatar employeeId" },
    { path: "department", select: "name" },
    { path: "assignedHR", select: "firstName lastName email" },
    { path: "initiatedBy", select: "firstName lastName email" },
  ]);

  return res.status(201).json({
    success: true,
    data: populatedLifecycle,
    message: "Lifecycle created successfully",
  });
});

// Update lifecycle status
const updateLifecycleStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const lifecycle = await EmployeeLifecycle.findById(id);
  if (!lifecycle) {
    return res.status(404).json({
      success: false,
      message: "Lifecycle not found",
    });
  }

  const oldStatus = lifecycle.status;
  lifecycle.status = status;

  if (status === "Completed") {
    lifecycle.actualCompletionDate = new Date();
  }

  if (notes) {
    lifecycle.notes = notes;
  }

  await lifecycle.save();

  // Add timeline entry
  await lifecycle.addTimelineEntry(
    "Status Updated",
    `Status changed from ${oldStatus} to ${status}`,
    req.user._id
  );

  return res.status(200).json({
    success: true,
    data: lifecycle,
    message: "Lifecycle status updated successfully",
  });
});

// Complete checklist item
const completeChecklistItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { itemIndex, notes } = req.body;

  const lifecycle = await EmployeeLifecycle.findById(id);
  if (!lifecycle) {
    return res.status(404).json({
      success: false,
      message: "Lifecycle not found",
    });
  }

  await lifecycle.completeChecklistItem(itemIndex, req.user._id, notes);

  return res.status(200).json({
    success: true,
    data: lifecycle,
    message: "Checklist item completed successfully",
  });
});

// Update task status (Start/Complete tasks)
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { taskId, action, notes } = req.body; // action: "start" or "complete"

  if (!taskId) {
    return res.status(400).json({
      success: false,
      message: "Task ID is required",
    });
  }

  const lifecycle = await EmployeeLifecycle.findById(id);
  if (!lifecycle) {
    return res.status(404).json({
      success: false,
      message: "Lifecycle not found",
    });
  }

  // Convert taskId to string for comparison (handles both ObjectId and string)
  const taskIdString = taskId.toString();

  // Find the specific task using find() with explicit _id matching
  const taskIndex = lifecycle.tasks.findIndex(
    (task) => task._id.toString() === taskIdString
  );

  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  const task = lifecycle.tasks[taskIndex];

  // Validate task status before action
  if (task.status === "Completed" && action === "start") {
    return res.status(400).json({
      success: false,
      message: "Task is already completed",
    });
  }

  if (task.status === "Completed" && action === "complete") {
    return res.status(400).json({
      success: false,
      message: "Task is already completed",
    });
  }

  let status;
  let message;

  // Update the specific task using array index
  if (action === "start") {
    lifecycle.tasks[taskIndex].status = "In Progress";
    lifecycle.tasks[taskIndex].startedAt = new Date();
    status = "In Progress";
    message = "Task started successfully";
  } else if (action === "complete") {
    lifecycle.tasks[taskIndex].status = "Completed";
    lifecycle.tasks[taskIndex].completedBy = req.user._id;
    lifecycle.tasks[taskIndex].completedAt = new Date();
    if (notes) {
      lifecycle.tasks[taskIndex].notes = notes;
    }
    status = "Completed";
    message = "Task completed successfully";
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid action. Use 'start' or 'complete'",
    });
  }

  lifecycle.markModified("tasks");

  await lifecycle.save();

  await lifecycle.addTimelineEntry(
    "Task Updated",
    `Task "${task.title}" ${action}ed by HR`,
    req.user._id
  );

  const updatedLifecycle = await EmployeeLifecycle.findById(id).populate([
    { path: "employee", select: "firstName lastName email avatar fullName" },
    { path: "department", select: "name" },
    { path: "assignedHR", select: "firstName lastName email" },
    { path: "initiatedBy", select: "firstName lastName email" },
    { path: "tasks.assignedTo", select: "firstName lastName email" },
    { path: "tasks.completedBy", select: "firstName lastName email" },
  ]);

  return res.status(200).json({
    success: true,
    data: updatedLifecycle,
    message: message,
    progress: updatedLifecycle.getProgressPercentage(),
  });
});

// Mark all tasks as complete for a single employee
const markAllTasksComplete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lifecycle = await EmployeeLifecycle.findById(id);
  if (!lifecycle) {
    return res.status(404).json({
      success: false,
      message: "Lifecycle not found",
    });
  }

  // Check if there are any incomplete tasks
  const incompleteTasks = lifecycle.tasks.filter(
    (task) => task.status !== "Completed"
  );

  if (incompleteTasks.length === 0) {
    return res.status(400).json({
      success: false,
      message: "All tasks are already completed",
    });
  }

  // Mark all incomplete tasks as completed
  const now = new Date();
  incompleteTasks.forEach((task) => {
    const originalStatus = task.status;
    task.status = "Completed";
    task.completedBy = req.user._id;
    task.completedAt = now;
    if (originalStatus === "Pending" && !task.startedAt) {
      task.startedAt = now;
    }
  });

  lifecycle.markModified("tasks");
  await lifecycle.save();

  // Add timeline entry
  await lifecycle.addTimelineEntry(
    "All Tasks Completed",
    `All ${incompleteTasks.length} remaining tasks marked as complete by HR`,
    req.user._id
  );

  const updatedLifecycle = await EmployeeLifecycle.findById(id).populate([
    { path: "employee", select: "firstName lastName email avatar fullName" },
    { path: "department", select: "name" },
    { path: "assignedHR", select: "firstName lastName email" },
    { path: "initiatedBy", select: "firstName lastName email" },
    { path: "tasks.assignedTo", select: "firstName lastName email" },
    { path: "tasks.completedBy", select: "firstName lastName email" },
  ]);

  return res.status(200).json({
    success: true,
    data: updatedLifecycle,
    message: `All ${incompleteTasks.length} tasks marked as complete successfully`,
    progress: updatedLifecycle.getProgressPercentage(),
  });
});

// Mark all tasks as complete for all employees with incomplete onboarding
const markAllTasksCompleteForAll = asyncHandler(async (req, res) => {
  const user = req.user;

  // Only allow HR HOD and Super Admin
  if (user.role.level < 700) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only HOD and Super Admin can perform this action.",
    });
  }

  // Get all active onboarding lifecycles that are not completed
  const activeOnboardings = await EmployeeLifecycle.find({
    type: "Onboarding",
    status: { $in: ["Initiated", "In Progress"] },
  }).populate("employee", "firstName lastName email");

  if (activeOnboardings.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      message: "No active onboarding processes found",
      updatedCount: 0,
    });
  }

  const now = new Date();
  const updatedLifecycles = [];
  let totalTasksCompleted = 0;

  for (const lifecycle of activeOnboardings) {
    const incompleteTasks = lifecycle.tasks.filter(
      (task) => task.status !== "Completed"
    );

    if (incompleteTasks.length > 0) {
      // Mark all incomplete tasks as completed
      incompleteTasks.forEach((task) => {
        const originalStatus = task.status;
        task.status = "Completed";
        task.completedBy = user._id;
        task.completedAt = now;
        if (originalStatus === "Pending" && !task.startedAt) {
          task.startedAt = now;
        }
      });

      lifecycle.markModified("tasks");
      await lifecycle.save();

      // Add timeline entry
      await lifecycle.addTimelineEntry(
        "All Tasks Completed",
        `All ${incompleteTasks.length} remaining tasks marked as complete by HR (Bulk Action)`,
        user._id
      );

      totalTasksCompleted += incompleteTasks.length;

      const updatedLifecycle = await EmployeeLifecycle.findById(
        lifecycle._id
      ).populate([
        {
          path: "employee",
          select: "firstName lastName email avatar fullName",
        },
        { path: "department", select: "name" },
        { path: "assignedHR", select: "firstName lastName email" },
        { path: "initiatedBy", select: "firstName lastName email" },
        { path: "tasks.assignedTo", select: "firstName lastName email" },
        { path: "tasks.completedBy", select: "firstName lastName email" },
      ]);

      updatedLifecycles.push(updatedLifecycle);
    }
  }

  return res.status(200).json({
    success: true,
    data: updatedLifecycles,
    message: `Successfully marked all tasks complete for ${updatedLifecycles.length} employee(s). Total ${totalTasksCompleted} tasks completed.`,
    updatedCount: updatedLifecycles.length,
    totalTasksCompleted,
  });
});

// Mark all tasks as complete for all employees with incomplete offboarding
const markAllTasksCompleteForAllOffboarding = asyncHandler(async (req, res) => {
  const user = req.user;

  // Only allow HR HOD and Super Admin
  if (user.role.level < 700) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only HOD and Super Admin can perform this action.",
    });
  }

  // Get all active offboarding lifecycles that are not completed
  const activeOffboardings = await EmployeeLifecycle.find({
    type: "Offboarding",
    status: { $in: ["Initiated", "In Progress"] },
  }).populate("employee", "firstName lastName email");

  if (activeOffboardings.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      message: "No active offboarding processes found",
      updatedCount: 0,
    });
  }

  const now = new Date();
  const updatedLifecycles = [];
  let totalTasksCompleted = 0;

  for (const lifecycle of activeOffboardings) {
    const incompleteTasks = lifecycle.tasks.filter(
      (task) => task.status !== "Completed"
    );

    if (incompleteTasks.length > 0) {
      // Mark all incomplete tasks as completed
      incompleteTasks.forEach((task) => {
        const originalStatus = task.status;
        task.status = "Completed";
        task.completedBy = user._id;
        task.completedAt = now;
        if (originalStatus === "Pending" && !task.startedAt) {
          task.startedAt = now;
        }
      });

      lifecycle.markModified("tasks");
      await lifecycle.save();

      // Add timeline entry
      await lifecycle.addTimelineEntry(
        "All Tasks Completed",
        `All ${incompleteTasks.length} remaining tasks marked as complete by HR (Bulk Action)`,
        user._id
      );

      totalTasksCompleted += incompleteTasks.length;

      const updatedLifecycle = await EmployeeLifecycle.findById(
        lifecycle._id
      ).populate([
        {
          path: "employee",
          select: "firstName lastName email avatar fullName",
        },
        { path: "department", select: "name" },
        { path: "assignedHR", select: "firstName lastName email" },
        { path: "initiatedBy", select: "firstName lastName email" },
        { path: "tasks.assignedTo", select: "firstName lastName email" },
        { path: "tasks.completedBy", select: "firstName lastName email" },
      ]);

      updatedLifecycles.push(updatedLifecycle);
    }
  }

  return res.status(200).json({
    success: true,
    data: updatedLifecycles,
    message: `Successfully marked all tasks complete for ${updatedLifecycles.length} employee(s). Total ${totalTasksCompleted} tasks completed.`,
    updatedCount: updatedLifecycles.length,
    totalTasksCompleted,
  });
});

const getActiveLifecycles = asyncHandler(async (req, res) => {
  const lifecycles = await EmployeeLifecycle.findActive();

  return res.status(200).json({
    success: true,
    data: lifecycles,
    message: "Active lifecycles retrieved successfully",
  });
});

// Get overdue lifecycles
const getOverdueLifecycles = asyncHandler(async (req, res) => {
  const lifecycles = await EmployeeLifecycle.findOverdue();

  return res.status(200).json({
    success: true,
    data: lifecycles,
    message: "Overdue lifecycles retrieved successfully",
  });
});

// Get lifecycle statistics
const getLifecycleStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const query = {};

  if (user.role.level >= 1000) {
  } else if (user.role.level >= 700) {
    const userWithDept = await User.findById(user._id).populate("department");
    if (
      userWithDept.department &&
      userWithDept.department.name !== "Human Resources"
    ) {
      query.department = user.department;
    }
  } else {
    query.department = user.department;
  }

  const [
    totalLifecycles,
    activeLifecycles,
    completedLifecycles,
    overdueLifecycles,
    onboardingCount,
    offboardingCount,
  ] = await Promise.all([
    EmployeeLifecycle.countDocuments(query),
    EmployeeLifecycle.countDocuments({
      ...query,
      status: { $in: ["Initiated", "In Progress"] },
    }),
    EmployeeLifecycle.countDocuments({ ...query, status: "Completed" }),
    EmployeeLifecycle.countDocuments({
      ...query,
      status: { $in: ["Initiated", "In Progress"] },
      targetCompletionDate: { $lt: new Date() },
    }),
    EmployeeLifecycle.countDocuments({ ...query, type: "Onboarding" }),
    EmployeeLifecycle.countDocuments({ ...query, type: "Offboarding" }),
  ]);

  const stats = {
    total: totalLifecycles,
    active: activeLifecycles,
    completed: completedLifecycles,
    overdue: overdueLifecycles,
    onboarding: onboardingCount,
    offboarding: offboardingCount,
    completionRate:
      totalLifecycles > 0
        ? Math.round((completedLifecycles / totalLifecycles) * 100)
        : 0,
  };

  return res.status(200).json({
    success: true,
    data: stats,
    message: "Lifecycle statistics retrieved successfully",
  });
});

// Initiate offboarding for an employee
const initiateOffboarding = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID is required",
    });
  }

  // Get employee details
  const employee = await User.findById(employeeId).populate("role department");
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  // Check if offboarding lifecycle already exists
  const existingOffboarding = await EmployeeLifecycle.findOne({
    employee: employeeId,
    type: "Offboarding",
  });

  if (existingOffboarding) {
    // Check if offboarding is already active
    if (
      existingOffboarding.status === "Initiated" ||
      existingOffboarding.status === "In Progress"
    ) {
      return res.status(400).json({
        success: false,
        message: "Offboarding is already active for this employee",
      });
    }

    existingOffboarding.status = "Initiated";
    existingOffboarding.startDate = new Date();
    existingOffboarding.notes = `Offboarding re-initiated by ${req.user.firstName} ${req.user.lastName}`;

    await existingOffboarding.save();

    await existingOffboarding.addTimelineEntry(
      "Offboarding Re-initiated",
      `Offboarding process re-started by ${req.user.firstName} ${req.user.lastName}`,
      req.user._id
    );

    const populatedLifecycle = await EmployeeLifecycle.findById(
      existingOffboarding._id
    ).populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId",
      },
      { path: "department", select: "name" },
      { path: "assignedHR", select: "firstName lastName email" },
      { path: "initiatedBy", select: "firstName lastName email" },
    ]);

    return res.status(200).json({
      success: true,
      data: populatedLifecycle,
      message: "Offboarding re-initiated successfully",
    });
  }

  try {
    const offboardingLifecycle =
      await EmployeeLifecycle.createStandardLifecycle(
        employeeId,
        "Offboarding",
        employee.department,
        employee.role,
        req.user._id,
        req.user._id
      );

    const populatedLifecycle = await EmployeeLifecycle.findById(
      offboardingLifecycle._id
    ).populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId",
      },
      { path: "department", select: "name" },
      { path: "assignedHR", select: "firstName lastName email" },
      { path: "initiatedBy", select: "firstName lastName email" },
      { path: "tasks.assignedTo", select: "firstName lastName email" },
    ]);

    return res.status(200).json({
      success: true,
      data: populatedLifecycle,
      message: "Offboarding initiated successfully with 5 tasks created",
    });
  } catch (error) {
    console.error(
      "❌ [OFFBOARDING] Error creating offboarding lifecycle:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to initiate offboarding",
      error: error.message,
    });
  }
});

// Get offboarding lifecycles (only active ones)
const getOffboardingLifecycles = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    department,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {
    type: "Offboarding",
    status: { $in: ["Initiated", "In Progress", "Completed"] }, // Only active offboarding
  };

  // Apply filters
  if (status) query.status = status;
  if (department) query.department = department;

  // Search functionality
  if (search) {
    query.$or = [
      { "employee.firstName": { $regex: search, $options: "i" } },
      { "employee.lastName": { $regex: search, $options: "i" } },
      { "employee.email": { $regex: search, $options: "i" } },
    ];
  }

  // Role-based access control
  const user = req.user;

  // Super Admin (level 1000+) can see all lifecycles
  if (user.role.level >= 1000) {
    // No department restriction
  }
  // HR HOD (level 700+ in Human Resources department) can see all lifecycles
  else if (user.role.level >= 700) {
    // Check if user is in Human Resources department
    const userWithDept = await User.findById(user._id).populate("department");
    if (
      userWithDept.department &&
      userWithDept.department.name !== "Human Resources"
    ) {
      // Non-HR HODs can only see their own department
      query.department = user.department;
    }
    // HR HODs can see all departments (no restriction)
  }
  // Other roles (level < 700) can only see their own department
  else {
    query.department = user.department;
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build the query with populate
  let lifecyclesQuery = EmployeeLifecycle.find(query)
    .populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId",
      },
      { path: "department", select: "name" },
      { path: "assignedHR", select: "firstName lastName email" },
      { path: "initiatedBy", select: "firstName lastName email" },
    ])
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
    .skip(skip)
    .limit(limitNum);

  // Execute query and get total count
  const [lifecycles, total] = await Promise.all([
    lifecyclesQuery.exec(),
    EmployeeLifecycle.countDocuments(query),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  const paginatedData = {
    docs: lifecycles,
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
    message: "Offboarding lifecycles retrieved successfully",
  });
});

const revertOffboarding = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lifecycle = await EmployeeLifecycle.findById(id);
  if (!lifecycle) {
    return res.status(404).json({
      success: false,
      message: "Lifecycle not found",
    });
  }

  // Verify this is an offboarding lifecycle
  if (lifecycle.type !== "Offboarding") {
    return res.status(400).json({
      success: false,
      message: "This endpoint is only for offboarding lifecycles",
    });
  }

  try {
    // Reset all tasks to Pending
    if (lifecycle.tasks && lifecycle.tasks.length > 0) {
      lifecycle.tasks.forEach((task) => {
        task.status = "Pending";
        task.startedAt = undefined;
        task.completedAt = undefined;
        task.completedBy = undefined;
        task.notes = "";
      });
    }

    lifecycle.status = "On Hold";
    lifecycle.actualCompletionDate = undefined;
    lifecycle.notes = `Offboarding reverted by ${req.user.firstName} ${
      req.user.lastName
    } on ${new Date().toLocaleString()}. Employee reactivated and all tasks reset.`;

    lifecycle.markModified("tasks");

    await lifecycle.save();

    const reactivatedEmployee = await User.findByIdAndUpdate(
      lifecycle.employee,
      {
        status: "ACTIVE",
        isActive: true,
      },
      { new: true }
    ).populate("role department");

    await lifecycle.addTimelineEntry(
      "Offboarding Reverted",
      `Offboarding process reverted by ${req.user.firstName} ${req.user.lastName}. All tasks reset to pending and user reactivated.`,
      req.user._id
    );

    // Send notifications
    try {
      const NotificationService = (
        await import("../services/notificationService.js")
      ).default;
      const notificationService = new NotificationService();

      await notificationService.createNotification({
        recipient: lifecycle.employee,
        type: "OFFBOARDING_REVERTED",
        title: "Offboarding Reverted - Account Reactivated",
        message: `Your offboarding process has been reverted by HR. Your account has been reactivated and all offboarding tasks have been reset. You can now continue working with ELRA.`,
        priority: "high",
        category: "OFFBOARDING",
        actionUrl: "/dashboard",
        data: {
          lifecycleId: lifecycle._id,
          revertedBy: req.user._id,
          revertedByName: `${req.user.firstName} ${req.user.lastName}`,
          revertedAt: new Date(),
        },
      });

      // Notify the assigned HR person (if different from the person who reverted)
      if (
        lifecycle.assignedHR &&
        lifecycle.assignedHR.toString() !== req.user._id.toString()
      ) {
        await notificationService.createNotification({
          recipient: lifecycle.assignedHR,
          type: "OFFBOARDING_REVERTED",
          title: "Offboarding Reverted",
          message: `The offboarding process for ${reactivatedEmployee.firstName} ${reactivatedEmployee.lastName} (${reactivatedEmployee.employeeId}) has been reverted by ${req.user.firstName} ${req.user.lastName}. All tasks have been reset to pending and the employee has been reactivated.`,
          priority: "medium",
          category: "OFFBOARDING",
          actionUrl: "/dashboard/modules/hr/offboarding",
          data: {
            lifecycleId: lifecycle._id,
            employeeId: reactivatedEmployee._id,
            employeeName: `${reactivatedEmployee.firstName} ${reactivatedEmployee.lastName}`,
            revertedBy: req.user._id,
            revertedByName: `${req.user.firstName} ${req.user.lastName}`,
            revertedAt: new Date(),
          },
        });
      }

      // Notify the initiator if different from current user and assigned HR
      if (
        lifecycle.initiatedBy &&
        lifecycle.initiatedBy.toString() !== req.user._id.toString() &&
        lifecycle.initiatedBy.toString() !== lifecycle.assignedHR?.toString()
      ) {
        await notificationService.createNotification({
          recipient: lifecycle.initiatedBy,
          type: "OFFBOARDING_REVERTED",
          title: "Offboarding Reverted",
          message: `The offboarding process you initiated for ${reactivatedEmployee.firstName} ${reactivatedEmployee.lastName} (${reactivatedEmployee.employeeId}) has been reverted by ${req.user.firstName} ${req.user.lastName}.`,
          priority: "medium",
          category: "OFFBOARDING",
          actionUrl: "/dashboard/modules/hr/offboarding",
          data: {
            lifecycleId: lifecycle._id,
            employeeId: reactivatedEmployee._id,
            employeeName: `${reactivatedEmployee.firstName} ${reactivatedEmployee.lastName}`,
            revertedBy: req.user._id,
            revertedByName: `${req.user.firstName} ${req.user.lastName}`,
            revertedAt: new Date(),
          },
        });
      }

      // Notify all Super Admins
      const superAdmins = await User.find({
        $or: [{ "role.level": 1000 }, { isSuperadmin: true }],
        isActive: true,
      })
        .populate("role")
        .populate("department");

      for (const superAdmin of superAdmins) {
        if (
          superAdmin._id.toString() !== req.user._id.toString() &&
          superAdmin._id.toString() !== lifecycle.assignedHR?.toString() &&
          superAdmin._id.toString() !== lifecycle.initiatedBy?.toString()
        ) {
          await notificationService.createNotification({
            recipient: superAdmin._id,
            type: "OFFBOARDING_REVERTED",
            title: "Offboarding Reverted",
            message: `The offboarding process for ${reactivatedEmployee.firstName} ${reactivatedEmployee.lastName} (${reactivatedEmployee.employeeId}) has been reverted by ${req.user.firstName} ${req.user.lastName}. All tasks have been reset and the employee has been reactivated.`,
            priority: "high",
            category: "OFFBOARDING",
            actionUrl: "/dashboard/modules/hr/offboarding",
            data: {
              lifecycleId: lifecycle._id,
              employeeId: reactivatedEmployee._id,
              employeeName: `${reactivatedEmployee.firstName} ${reactivatedEmployee.lastName}`,
              employeeEmail: reactivatedEmployee.email,
              revertedBy: req.user._id,
              revertedByName: `${req.user.firstName} ${req.user.lastName}`,
              revertedAt: new Date(),
            },
          });
        }
      }

      // Notify all HR HODs
      const hrDepartment = await Department.findOne({
        name: "Human Resources",
      });
      if (hrDepartment) {
        const hrHODs = await User.find({
          department: hrDepartment._id,
          "role.level": 700,
          isActive: true,
        })
          .populate("role")
          .populate("department");

        for (const hrHOD of hrHODs) {
          // Skip if this HR HOD is the one who reverted or already notified
          if (
            hrHOD._id.toString() !== req.user._id.toString() &&
            hrHOD._id.toString() !== lifecycle.assignedHR?.toString() &&
            hrHOD._id.toString() !== lifecycle.initiatedBy?.toString()
          ) {
            await notificationService.createNotification({
              recipient: hrHOD._id,
              type: "OFFBOARDING_REVERTED",
              title: "Offboarding Reverted",
              message: `The offboarding process for ${reactivatedEmployee.firstName} ${reactivatedEmployee.lastName} (${reactivatedEmployee.employeeId}) has been reverted by ${req.user.firstName} ${req.user.lastName}. All tasks have been reset and the employee has been reactivated.`,
              priority: "high",
              category: "OFFBOARDING",
              actionUrl: "/dashboard/modules/hr/offboarding",
              data: {
                lifecycleId: lifecycle._id,
                employeeId: reactivatedEmployee._id,
                employeeName: `${reactivatedEmployee.firstName} ${reactivatedEmployee.lastName}`,
                employeeEmail: reactivatedEmployee.email,
                revertedBy: req.user._id,
                revertedByName: `${req.user.firstName} ${req.user.lastName}`,
                revertedAt: new Date(),
              },
            });
          }
        }
      }
    } catch (notificationError) {
      console.error(
        "❌ [OFFBOARDING REVERT] Error sending notifications:",
        notificationError
      );
      // Don't fail the revert if notifications fail
    }

    // Get updated lifecycle with populated data
    const updatedLifecycle = await EmployeeLifecycle.findById(id).populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId",
      },
      { path: "department", select: "name" },
      { path: "assignedHR", select: "firstName lastName email" },
      { path: "initiatedBy", select: "firstName lastName email" },
      { path: "tasks.assignedTo", select: "firstName lastName email" },
      { path: "tasks.completedBy", select: "firstName lastName email" },
    ]);

    return res.status(200).json({
      success: true,
      data: updatedLifecycle,
      message:
        "Offboarding reverted successfully. All tasks reset and user reactivated.",
    });
  } catch (error) {
    console.error("Error reverting offboarding:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to revert offboarding",
      error: error.message,
    });
  }
});

const getCompletedOffboardings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    department,
    search,
    sortBy = "actualCompletionDate",
    sortOrder = "desc",
  } = req.query;

  const query = {
    type: "Offboarding",
    status: "Completed",
  };

  if (department) query.department = department;

  const user = req.user;

  if (user.role.level >= 1000) {
  } else if (user.role.level >= 700) {
    const userWithDept = await User.findById(user._id).populate("department");
    if (
      userWithDept.department &&
      userWithDept.department.name !== "Human Resources"
    ) {
      query.department = user.department;
    }
  } else {
    query.department = user.department;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  let lifecyclesQuery = EmployeeLifecycle.find(query)
    .populate([
      {
        path: "employee",
        select: "firstName lastName email avatar employeeId",
      },
      { path: "department", select: "name" },
      { path: "assignedHR", select: "firstName lastName email" },
      { path: "initiatedBy", select: "firstName lastName email" },
    ])
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
    .skip(skip)
    .limit(limitNum);

  const [lifecycles, total] = await Promise.all([
    lifecyclesQuery.exec(),
    EmployeeLifecycle.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  const paginatedData = {
    docs: lifecycles,
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
    message: "Completed offboarding lifecycles retrieved successfully",
  });
});

export {
  getAllLifecycles,
  getLifecycleById,
  createLifecycle,
  updateLifecycleStatus,
  completeChecklistItem,
  updateTaskStatus,
  markAllTasksComplete,
  markAllTasksCompleteForAll,
  markAllTasksCompleteForAllOffboarding,
  getActiveLifecycles,
  getOverdueLifecycles,
  getLifecycleStats,
  initiateOffboarding,
  getOffboardingLifecycles,
  revertOffboarding,
  getCompletedOffboardings,
};
