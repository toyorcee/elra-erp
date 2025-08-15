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
  if (user.role.level < 600) {
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

  // Create lifecycle from templates
  const lifecycle = await EmployeeLifecycle.createFromTemplates(
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

// Update task status
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { taskId, status, notes } = req.body;

  const lifecycle = await EmployeeLifecycle.findById(id);
  if (!lifecycle) {
    return res.status(404).json({
      success: false,
      message: "Lifecycle not found",
    });
  }

  await lifecycle.updateTaskStatus(taskId, status, req.user._id);

  // Add timeline entry
  await lifecycle.addTimelineEntry(
    "Task Updated",
    `Task status updated to ${status}`,
    req.user._id
  );

  return res.status(200).json({
    success: true,
    data: lifecycle,
    message: "Task status updated successfully",
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

  // Role-based filtering
  if (user.role.level < 600) {
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

  // Find existing offboarding lifecycle for this employee
  const existingOffboarding = await EmployeeLifecycle.findOne({
    employee: employeeId,
    type: "Offboarding",
  });

  if (!existingOffboarding) {
    return res.status(404).json({
      success: false,
      message: "Offboarding lifecycle not found for this employee",
    });
  }

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

  // Update the offboarding lifecycle to initiate it
  existingOffboarding.status = "Initiated";
  existingOffboarding.startDate = new Date();
  existingOffboarding.targetCompletionDate = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000
  ); // 14 days
  existingOffboarding.notes = "Offboarding initiated by HR";

  await existingOffboarding.save();

  // Add timeline entry
  await existingOffboarding.addTimelineEntry(
    "Offboarding Initiated",
    "Offboarding process started for employee",
    req.user._id
  );

  const populatedLifecycle = await EmployeeLifecycle.findById(
    existingOffboarding._id
  ).populate([
    { path: "employee", select: "firstName lastName email avatar employeeId" },
    { path: "department", select: "name" },
    { path: "assignedHR", select: "firstName lastName email" },
    { path: "initiatedBy", select: "firstName lastName email" },
  ]);

  return res.status(200).json({
    success: true,
    data: populatedLifecycle,
    message: "Offboarding initiated successfully",
  });
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
  if (user.role.level < 600) {
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

export {
  getAllLifecycles,
  getLifecycleById,
  createLifecycle,
  updateLifecycleStatus,
  completeChecklistItem,
  updateTaskStatus,
  getActiveLifecycles,
  getOverdueLifecycles,
  getLifecycleStats,
  initiateOffboarding,
  getOffboardingLifecycles,
};
