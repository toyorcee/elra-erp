import mongoose from "mongoose";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import TeamMember from "../models/TeamMember.js";
import Approval from "../models/Approval.js";
import { checkDepartmentAccess } from "../middleware/auth.js";
import NotificationService from "../services/notificationService.js";
import ProjectAuditService from "../services/projectAuditService.js";

// Create notification service instance
const notificationService = new NotificationService();

// Helper function to format currency
const formatCurrency = (amount, currency = "NGN") => {
  if (!amount) return "₦0";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to get next project code with department-based numbering
const generateNextProjectCode = async (departmentId) => {
  try {
    const department = await Department.findById(departmentId);

    if (!department) {
      throw new Error("Department not found");
    }

    const currentYear = new Date().getFullYear();
    const deptPrefix = department.name.substring(0, 3).toUpperCase();

    // Count projects for this department in current year
    const count = await Project.countDocuments({
      department: departmentId,
      createdAt: {
        $gte: new Date(currentYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 1),
      },
      isActive: true,
    });

    const nextCode = `${deptPrefix}${currentYear}${String(count + 1).padStart(
      4,
      "0"
    )}`;

    return {
      success: true,
      data: {
        nextCode,
        currentDate: new Date().toISOString().split("T")[0],
        department: department.name,
      },
    };
  } catch (error) {
    console.error("Error generating project code:", error);
    return {
      success: false,
      message: "Failed to generate project code",
    };
  }
};

// Helper function to determine budget threshold (department-aware)
const getBudgetThreshold = (budget, departmentName) => {
  if (budget <= 1000000) return "hod_auto_approve";

  if (budget <= 5000000) {
    // For Finance department, skip finance approval
    if (departmentName === "Finance & Accounting") {
      return "executive_approval";
    }
    return "department_approval";
  }

  if (budget <= 25000000) {
    // For Finance department, skip finance approval
    if (departmentName === "Finance & Accounting") {
      return "executive_approval";
    }
    return "finance_approval";
  }

  return "executive_approval";
};

// Helper function to send notifications
const sendProjectNotification = async (req, notificationData) => {
  try {
    await notificationService.createNotification(notificationData);
    console.log(
      `📧 [NOTIFICATION] Sent: ${notificationData.type} to ${notificationData.recipient}`
    );
  } catch (error) {
    console.error("❌ [NOTIFICATION] Error sending notification:", error);
  }
};

// ============================================================================
// PROJECT CONTROLLERS
// ============================================================================

// @desc    Get next project code for department
// @route   GET /api/projects/next-code
// @access  Private (HOD+)
export const getNextProjectCode = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to create projects
    if (currentUser.role.level < 300) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only STAFF and above can create projects.",
      });
    }

    const departmentId = currentUser.department?._id;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "User must be assigned to a department to create projects.",
      });
    }

    const result = await generateNextProjectCode(departmentId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error getting next project code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get next project code",
    });
  }
};

// @desc    Get all projects (with role-based filtering)
// @access  Private (HOD+)
export const getAllProjects = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = { isActive: true };

    // SUPER_ADMIN (1000) - see all projects across all departments
    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [PROJECTS] Super Admin - showing all projects across all departments"
      );
    } else {
      // Non-SUPER_ADMIN users - only see projects from their department
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view projects",
        });
      }

      // Filter by department for all non-SUPER_ADMIN users
      query.department = currentUser.department;
      console.log(
        `🔍 [PROJECTS] User ${currentUser.role.name} - showing projects from department: ${currentUser.department}`
      );
    }

    const projects = await Project.find(query)
      .populate("projectManager", "firstName lastName email avatar")
      .populate("teamMembers.user", "firstName lastName email")
      .populate("createdBy", "firstName lastName")
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    // Enhance projects with team members from new TeamMember model
    const enhancedProjects = await Promise.all(
      projects.map(async (project) => {
        const projectObj = project.toObject();

        // Get team members from new TeamMember model
        const teamMembers = await TeamMember.find({
          project: project._id,
          isActive: true,
          status: "active",
        })
          .populate("user", "firstName lastName email avatar department role")
          .populate("assignedBy", "firstName lastName")
          .sort({ assignedDate: -1 });

        // Add new team members to the project object
        projectObj.enhancedTeamMembers = teamMembers;
        projectObj.teamMemberCount = teamMembers.length;

        return projectObj;
      })
    );

    res.status(200).json({
      success: true,
      data: enhancedProjects,
      total: enhancedProjects.length,
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get all projects error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message,
    });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private (HOD+)
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id)
      .populate("projectManager", "firstName lastName email avatar")
      .populate("teamMembers.user", "firstName lastName email")
      .populate("createdBy", "firstName lastName")
      .populate("notes.author", "firstName lastName");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Get team members from new TeamMember model
    const teamMembers = await TeamMember.find({
      project: project._id,
      isActive: true,
    })
      .populate("user", "firstName lastName email avatar department role")
      .populate("assignedBy", "firstName lastName")
      .sort({ assignedDate: -1 });

    const projectObj = project.toObject();
    projectObj.enhancedTeamMembers = teamMembers;
    projectObj.teamMemberCount = teamMembers.length;

    // Check access permissions
    const hasAccess = await checkProjectAccess(currentUser, project);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to view this project.",
      });
    }

    res.status(200).json({
      success: true,
      data: projectObj,
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get project by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project",
      error: error.message,
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (HOD+)
export const createProject = async (req, res) => {
  try {
    const currentUser = req.user;

    if (currentUser.role.level < 300) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only STAFF and above can create projects.",
      });
    }

    const requiredFields = [
      "name",
      "description",
      "category",
      "budget",
      "startDate",
      "endDate",
    ];

    const missingFields = requiredFields.filter(
      (field) => !req.body[field] || req.body[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        errors: missingFields.map((field) => `${field} is required`),
        fieldErrors: missingFields.reduce((acc, field) => {
          acc[field] = `${field} is required`;
          return acc;
        }, {}),
      });
    }

    if (req.body.budget && (isNaN(req.body.budget) || req.body.budget <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget amount",
        errors: ["Budget must be a positive number"],
        fieldErrors: { budget: "Budget must be a positive number" },
      });
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
        errors: ["Start date cannot be in the past"],
        fieldErrors: { startDate: "Start date cannot be in the past" },
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date",
        errors: ["End date must be after start date"],
        fieldErrors: { endDate: "End date must be after start date" },
      });
    }

    const projectScope = req.body.projectScope || "personal";

    console.log(
      "🔍 [PROJECT] ELRA Regulatory Authority - Project creation validation"
    );
    console.log(`   User Department: ${currentUser.department?.name}`);
    console.log(`   User Role Level: ${currentUser.role.level}`);
    console.log(`   Project Scope: ${req.body.projectScope || "internal"}`);
    console.log(`   Requested Category: ${req.body.category}`);

    console.log(
      "   ✅ [PROJECT] ELRA allows all departments to create any project category"
    );

    // Set budget threshold based on budget amount
    const budgetThreshold = getBudgetThreshold(
      req.body.budget,
      currentUser.department?.name
    );

    // Define 3 essential required documents for project approval
    const requiredDocuments = [
      {
        documentType: "project_proposal",
        title: "Project Proposal Document",
        description:
          "Complete project proposal with objectives, scope, and detailed description",
        isRequired: true,
        isSubmitted: false,
      },
      {
        documentType: "budget_breakdown",
        title: "Budget & Financial Plan",
        description:
          "Detailed budget breakdown, cost analysis, and financial justification",
        isRequired: true,
        isSubmitted: false,
      },
      {
        documentType: "technical_specifications",
        title: "Technical & Implementation Plan",
        description:
          "Technical specifications, timeline, milestones, and implementation strategy",
        isRequired: true,
        isSubmitted: false,
      },
    ];

    // Super Admin auto-approval logic
    let projectStatus = "pending_approval";

    if (currentUser.role.level === 1000) {
      projectStatus = "approved";
    } else if (budgetThreshold === "hod_auto_approve") {
      projectStatus = "approved";
    }

    // Set project manager to creator if not specified
    const projectManager = req.body.projectManager || currentUser._id;

    const projectData = {
      ...req.body,
      projectManager,
      createdBy: currentUser._id,
      department: currentUser.department,
      budgetThreshold,
      requiredDocuments,
      status: projectStatus,
    };

    const project = new Project(projectData);

    if (projectStatus === "pending_approval") {
      await project.generateApprovalChain();

      if (project.approvalChain && project.approvalChain.length > 0) {
        // Auto-approve steps where the creator is the approver
        let hasAutoApproved = false;

        for (let i = 0; i < project.approvalChain.length; i++) {
          const step = project.approvalChain[i];

          if (step.status === "pending") {
            let shouldAutoApprove = false;

            // Auto-approve logic based on project scope
            if (project.projectScope === "personal") {
              // Personal projects: No auto-approval, always go through Finance → Executive
              shouldAutoApprove = false;
            } else if (project.projectScope === "departmental") {
              // Departmental projects: Auto-approve HOD step if creator is HOD
              if (step.level === "hod") {
                shouldAutoApprove =
                  currentUser.role.level === 700 &&
                  currentUser.department &&
                  (currentUser.department._id?.toString() ===
                    step.department.toString() ||
                    currentUser.department.toString() ===
                      step.department.toString());
              }
            } else if (project.projectScope === "external") {
              const isHRDepartment =
                currentUser.department?.name === "Human Resources" ||
                currentUser.department?.name === "HR" ||
                currentUser.department?.name === "Human Resource Management";

              shouldAutoApprove =
                currentUser.role.level === 700 && isHRDepartment;
            }

            if (shouldAutoApprove) {
              step.status = "approved";
              step.approver = currentUser._id;
              step.comments = `Auto-approved by project creator (${currentUser.department?.name} HOD)`;
              step.approvedAt = new Date();
              hasAutoApproved = true;
            } else {
              break;
            }
          }
        }

        if (hasAutoApproved) {
          const nextPendingStep = project.approvalChain.find(
            (step) => step.status === "pending"
          );

          if (nextPendingStep) {
            switch (nextPendingStep.level) {
              case "legal_compliance":
                project.status = "pending_legal_compliance_approval";
                break;
              case "executive":
                project.status = "pending_executive_approval";
                break;
              case "finance":
                project.status = "pending_finance_approval";
                break;
              default:
                project.status = "pending_approval";
            }
          } else {
            project.status = "approved";
          }

          await project.save();
          console.log("✅ [AUTO-APPROVE] Auto-approval completed successfully");
        }
      }

      // Send smart notifications to the next approver in the chain
      if (project.approvalChain && project.approvalChain.length > 0) {
        // Find the next pending approval step
        const nextApproval = project.approvalChain.find(
          (step) => step.status === "pending"
        );

        if (nextApproval && nextApproval.department) {
          try {
            let approverQuery = {};

            console.log(
              `🔍 [DEBUG] Next approval level: ${nextApproval.level}`
            );

            if (nextApproval.level === "hod") {
              // Find HOD of the project's department
              console.log(
                "🔍 [DEBUG] Looking for HOD of project department..."
              );

              const hodRole = await mongoose
                .model("Role")
                .findOne({ name: "HOD" });

              if (hodRole && nextApproval.department) {
                approverQuery = {
                  role: hodRole._id,
                  department: nextApproval.department,
                };

                console.log(
                  `🔍 [DEBUG] HOD query: ${JSON.stringify(approverQuery)}`
                );
              }
            } else if (nextApproval.level === "finance") {
              // Find Finance HOD
              console.log("🔍 [DEBUG] Looking for Finance HOD...");

              const financeDept = await mongoose
                .model("Department")
                .findOne({ name: "Finance & Accounting" });

              const hodRole = await mongoose
                .model("Role")
                .findOne({ name: "HOD" });

              if (financeDept && hodRole) {
                approverQuery = {
                  role: hodRole._id,
                  department: financeDept._id,
                };

                console.log(
                  `🔍 [DEBUG] Finance HOD query: ${JSON.stringify(
                    approverQuery
                  )}`
                );
              }
            } else if (nextApproval.level === "executive") {
              // Find Executive HOD
              console.log("🔍 [DEBUG] Looking for Executive HOD...");

              const execDept = await mongoose
                .model("Department")
                .findOne({ name: "Executive Office" });

              const hodRole = await mongoose
                .model("Role")
                .findOne({ name: "HOD" });

              if (execDept && hodRole) {
                approverQuery = {
                  role: hodRole._id,
                  department: execDept._id,
                };

                console.log(
                  `🔍 [DEBUG] Executive HOD query: ${JSON.stringify(
                    approverQuery
                  )}`
                );
              }
            } else if (nextApproval.level === "legal_compliance") {
              // Find Legal & Compliance HOD
              console.log("🔍 [DEBUG] Looking for Legal & Compliance HOD...");

              const legalDept = await mongoose
                .model("Department")
                .findOne({ name: "Legal & Compliance" });

              const hodRole = await mongoose
                .model("Role")
                .findOne({ name: "HOD" });

              if (legalDept && hodRole) {
                approverQuery = {
                  role: hodRole._id,
                  department: legalDept._id,
                };

                console.log(
                  `🔍 [DEBUG] Legal & Compliance HOD query: ${JSON.stringify(
                    approverQuery
                  )}`
                );
                console.log(`🔍 [DEBUG] Legal Dept ID: ${legalDept._id}`);
                console.log(`🔍 [DEBUG] HOD Role ID: ${hodRole._id}`);
              } else {
                console.log(
                  `❌ [DEBUG] Legal Dept found: ${!!legalDept}, HOD Role found: ${!!hodRole}`
                );
              }
            }

            if (Object.keys(approverQuery).length > 0) {
              const approver = await User.findOne(approverQuery).populate(
                "department"
              );

              if (approver) {
                console.log(
                  `✅ [NOTIFICATION] Found approver: ${approver.firstName} ${approver.lastName} (${approver.department?.name})`
                );
                console.log(`🔍 [DEBUG] Approver ID: ${approver._id}`);
                console.log(`🔍 [DEBUG] Project ID: ${project._id}`);

                // Send notification to approver
                try {
                  await sendProjectNotification(req, {
                    recipient: approver._id,
                    type: "PROJECT_READY_FOR_APPROVAL",
                    title: "Project Approval Required",
                    message: `A new ${project.projectScope} project "${project.name}" requires your approval at ${nextApproval.level} level.`,
                    data: {
                      projectId: project._id,
                      projectName: project.name,
                      projectCode: project.code,
                      approvalLevel: nextApproval.level,
                      projectScope: project.projectScope,
                      budget: project.budget,
                      category: project.category,
                      actionUrl: `/dashboard/modules/projects/${project._id}`,
                    },
                  });

                  console.log(
                    `📧 [NOTIFICATION] Sent approval request to ${approver.firstName} ${approver.lastName}`
                  );
                } catch (notificationError) {
                  console.error(
                    `❌ [NOTIFICATION] Error sending notification to ${approver.firstName}:`,
                    notificationError
                  );
                }
              } else {
                console.log(
                  `❌ [NOTIFICATION] No approver found for query: ${JSON.stringify(
                    approverQuery
                  )}`
                );
              }
            }
          } catch (notificationError) {
            console.error(
              "❌ [NOTIFICATION] Error sending approval notification:",
              notificationError
            );
          }
        }
      }
    }

    await project.save();

    try {
      const TeamMember = mongoose.model("TeamMember");

      if (
        project.projectManager &&
        project.projectManager.toString() !== currentUser._id.toString()
      ) {
        const existingTeamMember = await TeamMember.findOne({
          project: project._id,
          user: project.projectManager,
          isActive: true,
        });

        if (!existingTeamMember) {
          const teamMember = new TeamMember({
            project: project._id,
            user: project.projectManager,
            role: "project_manager",
            assignedBy: currentUser._id,
            isActive: true,
          });

          await teamMember.save();
          console.log(
            `✅ [TEAM] Assigned project manager automatically added as team member: ${project.projectManager}`
          );
        }
      } else {
        // If no project manager was assigned or it's the creator, add creator as team member
        const existingTeamMember = await TeamMember.findOne({
          project: project._id,
          user: currentUser._id,
          isActive: true,
        });

        if (!existingTeamMember) {
          const teamMember = new TeamMember({
            project: project._id,
            user: currentUser._id,
            role: "project_manager",
            assignedBy: currentUser._id,
            isActive: true,
          });

          await teamMember.save();
          console.log(
            `✅ [TEAM] Project creator automatically added as team member: ${currentUser._id}`
          );
        }
      }
    } catch (teamMemberError) {
      console.error(
        "❌ [TEAM] Error adding project manager as team member:",
        teamMemberError
      );
    }

    // Always notify the project creator about project creation
    try {
      await sendProjectNotification(req, {
        recipient: currentUser._id,
        type: "PROJECT_READY_FOR_APPROVAL",
        title: "Project Created Successfully",
        message: `Your project "${project.name}" (${project.code}) has been created successfully and is now pending approval.`,
        data: {
          projectId: project._id,
          projectName: project.name,
          projectCode: project.code,
          projectScope: project.projectScope,
          status: project.status,
          budget: project.budget,
          category: project.category,
          actionUrl: `/dashboard/modules/projects/${project._id}`,
        },
      });
      console.log(
        `📧 [NOTIFICATION] Project creation notification sent to creator: ${currentUser.firstName} ${currentUser.lastName}`
      );
    } catch (creatorNotificationError) {
      console.error(
        "❌ [NOTIFICATION] Error sending creator notification:",
        creatorNotificationError
      );
    }

    console.log(
      `✅ [PROJECT] Project created successfully: ${project.name} (${project.code})`
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("❌ [PROJECT] Create project error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating project",
      error: error.message,
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (HOD+)
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const canEdit = await checkProjectEditAccess(currentUser, project);

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to edit this project.",
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: currentUser._id,
      },
      { new: true, runValidators: true }
    )
      .populate("projectManager", "firstName lastName email avatar")
      .populate("teamMembers.user", "firstName lastName email")
      .populate("createdBy", "firstName lastName");

    if (
      req.body.projectManager &&
      req.body.projectManager !== project.projectManager.toString()
    ) {
      try {
        const TeamMember = mongoose.model("TeamMember");

        const oldTeamMember = await TeamMember.findOne({
          project: project._id,
          user: project.projectManager,
          role: "project_manager",
          isActive: true,
        });

        if (oldTeamMember) {
          oldTeamMember.isActive = false;
          await oldTeamMember.save();
          console.log(
            `✅ [TEAM] Old project manager removed from team: ${project.projectManager}`
          );
        }

        // Add new project manager as team member
        const existingTeamMember = await TeamMember.findOne({
          project: project._id,
          user: req.body.projectManager,
          isActive: true,
        });

        if (!existingTeamMember) {
          const teamMember = new TeamMember({
            project: project._id,
            user: req.body.projectManager,
            role: "project_manager",
            assignedBy: currentUser._id,
            isActive: true,
          });

          await teamMember.save();
          console.log(
            `✅ [TEAM] New project manager automatically added as team member: ${req.body.projectManager}`
          );
        }
      } catch (teamMemberError) {
        console.error(
          "❌ [TEAM] Error updating team members after project manager change:",
          teamMemberError
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Update project error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating project",
      error: error.message,
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (HOD+)
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const canDelete = await checkProjectDeleteAccess(currentUser, project);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to delete this project.",
      });
    }

    // Soft delete
    project.isActive = false;
    project.updatedBy = currentUser._id;
    await project.save();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Delete project error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting project",
      error: error.message,
    });
  }
};

// @desc    Start departmental project implementation after finance reimbursement
// @route   POST /api/projects/:id/start-implementation
// @access  Private (HOD+)
export const startDepartmentalProjectImplementation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { actualCost, completionNotes } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if project is departmental
    if (project.projectScope !== "departmental") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for departmental projects",
      });
    }

    // Check if project is approved and in implementation
    if (project.status !== "approved" && project.status !== "implementation") {
      return res.status(400).json({
        success: false,
        message:
          "Project must be approved and in implementation for completion",
      });
    }

    // Update project completion details
    project.status = "completed";
    project.actualEndDate = new Date();
    project.actualCost = actualCost || 0;
    project.completionNotes = completionNotes;
    project.completedBy = currentUser._id;

    // Set finance status to pending reimbursement
    project.financeStatus = "pending";

    await project.save();

    // Notify Finance HOD about reimbursement requirement
    try {
      const financeDept = await mongoose
        .model("Department")
        .findOne({ name: "Finance & Accounting" });

      const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });

      if (financeDept && hodRole) {
        const financeHOD = await User.findOne({
          role: hodRole._id,
          department: financeDept._id,
        }).populate("department");

        if (financeHOD) {
          await sendProjectNotification(req, {
            recipient: financeHOD._id,
            type: "project_reimbursement_required",
            title: "Departmental Project Reimbursement Required",
            message: `Departmental project "${project.name}" (${project.code}) has been completed and requires finance reimbursement processing.`,
            data: {
              projectId: project._id,
              projectName: project.name,
              projectCode: project.code,
              projectScope: project.projectScope,
              budget: project.budget,
              actualCost: project.actualCost,
              department: project.department?.name,
              actionUrl: `/dashboard/modules/projects/${project._id}`,
            },
          });

          console.log(
            `📧 [REIMBURSEMENT] Finance HOD notified about reimbursement for project: ${project.name}`
          );
        }
      }
    } catch (notificationError) {
      console.error(
        "❌ [REIMBURSEMENT] Error sending notification:",
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Departmental project implementation completed successfully. Finance HOD has been notified for reimbursement processing.",
      data: {
        projectId: project._id,
        projectName: project.name,
        status: project.status,
        financeStatus: project.financeStatus,
      },
    });
  } catch (error) {
    console.error(
      "❌ [COMPLETION] Error completing project implementation:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error completing project implementation",
      error: error.message,
    });
  }
};

// @desc    Process project reimbursement
// @route   POST /api/projects/:id/reimburse
// @access  Private (Finance HOD+)
export const processProjectReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes, paymentMethod } = req.body;
    const currentUser = req.user;

    // Check if user is Finance HOD
    if (
      currentUser.role.level < 700 ||
      currentUser.department?.name !== "Finance & Accounting"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Finance HOD can process reimbursements.",
      });
    }

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid reimbursement amount",
      });
    }

    const project = await Project.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("department", "name code");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if project is eligible for reimbursement
    if (project.status !== "implementation" && project.status !== "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Project must be in implementation or completed status for reimbursement",
      });
    }

    if (project.financeStatus === "reimbursed") {
      return res.status(400).json({
        success: false,
        message: "Project has already been reimbursed",
      });
    }

    // Check if reimbursement amount is within budget
    if (amount > project.budget) {
      return res.status(400).json({
        success: false,
        message: "Reimbursement amount cannot exceed project budget",
      });
    }

    // Update project finance status
    project.financeStatus = "reimbursed";
    project.financeReimbursedAt = new Date();
    project.financeReimbursedBy = currentUser._id;
    project.financeReimbursementAmount = amount;
    project.financeReimbursementNotes = notes;

    // Add to workflow history
    project.workflowHistory.push({
      phase: "finance",
      action: "reimbursement_processed",
      triggeredBy: "manual",
      triggeredByUser: currentUser._id,
      metadata: {
        projectCode: project.code,
        amount: amount,
        paymentMethod: paymentMethod,
        notes: notes,
      },
      timestamp: new Date(),
    });

    await project.save();

    // Send notification to project creator
    try {
      await sendProjectNotification(req, {
        recipient: project.createdBy._id,
        type: "PROJECT_REIMBURSEMENT_PROCESSED",
        title: "Project Reimbursement Processed",
        message: `Your project "${project.name}" (${
          project.code
        }) has been reimbursed for ₦${amount.toLocaleString()}. Payment method: ${paymentMethod}.`,
        priority: "high",
        data: {
          projectId: project._id,
          projectName: project.name,
          projectCode: project.code,
          amount: amount,
          paymentMethod: paymentMethod,
          notes: notes,
          actionUrl: "/dashboard/modules/projects",
        },
      });
    } catch (notifError) {
      console.error(
        "❌ [REIMBURSEMENT] Error sending notification:",
        notifError
      );
    }

    console.log(
      `💰 [REIMBURSEMENT] Project ${
        project.code
      } reimbursed for ₦${amount.toLocaleString()}`
    );

    res.status(200).json({
      success: true,
      message: "Project reimbursement processed successfully",
      data: {
        projectId: project._id,
        projectCode: project.code,
        amount: amount,
        paymentMethod: paymentMethod,
        processedBy: currentUser._id,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ [REIMBURSEMENT] Error processing reimbursement:", error);
    res.status(500).json({
      success: false,
      message: "Error processing reimbursement",
      error: error.message,
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Check if user has access to view project
const checkProjectAccess = async (user, project) => {
  // SUPER_ADMIN can access everything
  if (user.role.level >= 1000) return true;

  // HOD can access projects in their department or where they're manager
  if (user.role.level >= 700) {
    return (
      project.projectManager.toString() === user._id.toString() ||
      project.teamMembers.some(
        (member) =>
          member.user.toString() === user._id.toString() && member.isActive
      ) ||
      project.company.toString() === user.company.toString()
    );
  }

  // STAFF can access projects they're assigned to
  if (user.role.level >= 300) {
    return (
      project.projectManager.toString() === user._id.toString() ||
      project.teamMembers.some(
        (member) =>
          member.user.toString() === user._id.toString() && member.isActive
      )
    );
  }

  return false;
};

// Check if user can edit project
const checkProjectEditAccess = async (user, project) => {
  if (user.role.level >= 1000) return true;

  // For external projects, only HR HOD can edit
  if (project.projectScope === "external") {
    const isHRDepartment =
      user.department?.name === "Human Resources" ||
      user.department?.name === "HR" ||
      user.department?.name === "Human Resource Management";

    return user.role.level >= 700 && isHRDepartment;
  }

  // HOD can edit projects they manage or in their department
  if (user.role.level >= 700) {
    return (
      project.projectManager.toString() === user._id.toString() ||
      project.createdBy.toString() === user._id.toString() ||
      project.department.toString() === user.department.toString()
    );
  }

  // STAFF can edit projects they manage or created
  if (user.role.level >= 300) {
    return (
      project.projectManager.toString() === user._id.toString() ||
      project.createdBy.toString() === user._id.toString()
    );
  }

  return false;
};

// Check if user can delete project
const checkProjectDeleteAccess = async (user, project) => {
  // SUPER_ADMIN can delete everything
  if (user.role.level >= 1000) return true;

  // HOD can delete projects they created, manage, or in their department
  if (user.role.level >= 700) {
    return (
      project.createdBy.toString() === user._id.toString() ||
      project.projectManager.toString() === user._id.toString() ||
      project.department.toString() === user.department.toString()
    );
  }

  return false;
};

// ============================================================================
// TEMP STUB EXPORTS TO SATISFY ROUTES (TO BE FILLED WITH FULL LOGIC)
// ============================================================================

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Private (HOD+)
export const getProjectStats = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD - projects in their department or where they're manager
        query.$or = [
          { projectManager: currentUser._id },
          { "teamMembers.user": currentUser._id },
        ];
      } else {
        // STAFF - only their assigned projects
        query.$or = [
          { projectManager: currentUser._id },
          { "teamMembers.user": currentUser._id },
        ];
      }
    }

    const stats = await Project.getProjectStats();
    const totalProjects = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        stats,
        totalProjects,
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project statistics",
      error: error.message,
    });
  }
};

// @desc    Get comprehensive project data (SUPER_ADMIN only)
// @route   GET /api/projects/comprehensive-data
// @access  Private (SUPER_ADMIN)
export const getComprehensiveProjectData = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is SUPER_ADMIN
    if (currentUser.role.level < 1000) {
      return res.status(403).json({
        success: false,
        message: "Access denied. SUPER_ADMIN level required.",
      });
    }

    const { page = 1, limit = 50, status, scope, department } = req.query;

    let query = { isActive: true };

    // Apply filters
    if (status) query.status = status;
    if (scope) query.scope = scope;
    if (department) query.department = department;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: "createdBy", select: "firstName lastName email" },
        { path: "projectManager", select: "firstName lastName email" },
        { path: "department", select: "name code" },
        { path: "approvalChain.approver", select: "firstName lastName email" },
      ],
      sort: { createdAt: -1 },
    };

    const projects = await Project.paginate(query, options);

    // Get additional statistics
    const totalStats = await Project.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalBudget: { $sum: "$budget" },
          avgBudget: { $avg: "$budget" },
        },
      },
    ]);

    const statusStats = await Project.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const scopeStats = await Project.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$scope",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects: projects.docs,
        pagination: {
          page: projects.page,
          limit: projects.limit,
          totalPages: projects.totalPages,
          totalDocs: projects.totalDocs,
        },
        statistics: {
          total: totalStats[0] || {
            totalProjects: 0,
            totalBudget: 0,
            avgBudget: 0,
          },
          byStatus: statusStats,
          byScope: scopeStats,
        },
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get comprehensive data error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching comprehensive project data",
      error: error.message,
    });
  }
};

// @desc    Get projects available for team assignment
// @route   GET /api/projects/available-for-teams
// @access  Private (HOD+)
export const getProjectsAvailableForTeams = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to assign teams
    if (currentUser.role.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Access denied. MANAGER level (600) or higher required.",
      });
    }

    const { status = "approved", projectScope } = req.query;

    let query = {
      isActive: true,
      status: status,
    };

    if (projectScope) {
      query.projectScope = projectScope;
    }

    if (currentUser.role.level < 1000) {
      query.$or = [
        { projectManager: currentUser._id },
        { department: currentUser.department },
      ];
    }

    const projects = await Project.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name code")
      .populate("teamMembers.user", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Filter out projects that already have full teams (if applicable)
    const availableProjects = projects.filter((project) => {
      // For now, return all projects. You can add team size limits here if needed
      return true;
    });

    res.status(200).json({
      success: true,
      data: {
        projects: availableProjects,
        totalAvailable: availableProjects.length,
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get available for teams error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects available for teams",
      error: error.message,
    });
  }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private (MANAGER+)
export const addTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions using middleware logic
    const canManage = await checkProjectEditAccess(currentUser, project);

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to manage this project.",
      });
    }

    // Additional validation for external projects
    if (project.projectScope === "external") {
      const isHRDepartment =
        currentUser.department?.name === "Human Resources" ||
        currentUser.department?.name === "HR" ||
        currentUser.department?.name === "Human Resource Management";

      if (!isHRDepartment || currentUser.role.level < 700) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only HR HOD can manage external project teams.",
        });
      }
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // For external projects, ensure user is from HR department
    if (project.projectScope === "external") {
      const isUserFromHRDepartment =
        user.department?.name === "Human Resources" ||
        user.department?.name === "HR" ||
        user.department?.name === "Human Resource Management";

      if (!isUserFromHRDepartment) {
        return res.status(400).json({
          success: false,
          message:
            "External projects can only have team members from the HR department.",
        });
      }
    }

    // Add team member using project method
    await project.addTeamMember(userId, role);

    // Send notification to added team member
    try {
      await sendProjectNotification(req, {
        recipient: userId,
        type: "TEAM_MEMBER_ASSIGNED",
        title: "Added to Project Team",
        message: `You have been added to the project "${project.name}" (${project.code}) as ${role}.`,
        data: {
          projectId: project._id,
          projectName: project.name,
          projectCode: project.code,
          role: role,
          addedBy: currentUser._id,
          actionUrl: `/dashboard/modules/projects/${project._id}`,
        },
      });
    } catch (notificationError) {
      console.error(
        "❌ [NOTIFICATION] Error sending team member notification:",
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message: "Team member added successfully",
      data: {
        projectId: project._id,
        projectName: project.name,
        userId: userId,
        role: role,
        addedBy: currentUser._id,
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Add team member error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding team member",
      error: error.message,
    });
  }
};

// @desc    Remove team member from project
// @route   DELETE /api/projects/:id/team/:userId
// @access  Private (MANAGER+)
export const removeTeamMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions using middleware logic
    const canManage = await checkProjectEditAccess(currentUser, project);

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to manage this project.",
      });
    }

    // Check if user is trying to remove themselves
    if (userId === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove yourself from the project team.",
      });
    }

    // Check if user is project manager
    if (project.projectManager.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the project manager from the team.",
      });
    }

    // Remove team member using project method
    await project.removeTeamMember(userId);

    // Send notification to removed team member
    try {
      await sendProjectNotification(req, {
        recipient: userId,
        type: "TEAM_MEMBER_REMOVED",
        title: "Removed from Project Team",
        message: `You have been removed from the project "${project.name}" (${project.code}).`,
        data: {
          projectId: project._id,
          projectName: project.name,
          projectCode: project.code,
          removedBy: currentUser._id,
          actionUrl: `/dashboard/modules/projects`,
        },
      });
    } catch (notificationError) {
      console.error(
        "❌ [NOTIFICATION] Error sending removal notification:",
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message: "Team member removed successfully",
      data: {
        projectId: project._id,
        projectName: project.name,
        userId: userId,
        removedBy: currentUser._id,
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Remove team member error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing team member",
      error: error.message,
    });
  }
};

// @desc    Add note to project
// @route   POST /api/projects/:id/notes
// @access  Private (STAFF+)
export const addProjectNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isPrivate = false } = req.body;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkProjectAccess(currentUser, project);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to access this project.",
      });
    }

    await project.addNote(content, currentUser._id, isPrivate);

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: project,
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Add note error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding note",
      error: error.message,
    });
  }
};

// @desc    Approve project
// @route   POST /api/projects/:id/approve
// @access  Private (Approvers)
export const approveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, comments } = req.body;
    const currentUser = req.user;

    const project = await Project.findById(id)
      .populate("department", "name")
      .populate("approvalChain.approver", "firstName lastName email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user can approve this level
    const approvalStep = project.approvalChain.find(
      (step) => step.level === level
    );

    if (!approvalStep) {
      return res.status(400).json({
        success: false,
        message: `No approval step found for level: ${level}`,
      });
    }

    // Check if user has permission to approve this level
    if (level === "hod" && currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Only HOD can approve at this level",
      });
    }

    // Check if required documents are submitted before approval
    const Document = await import("../models/Document.js");
    const uploadedDocuments = await Document.default.find({
      project: project._id,
      isActive: true,
    });

    // Set default required documents if not already set (for older projects)
    let requiredDocuments = project.requiredDocuments || [];
    if (requiredDocuments.length === 0) {
      requiredDocuments = [
        {
          documentType: "project_proposal",
          title: "Project Proposal Document",
          description:
            "Complete project proposal with objectives, scope, and detailed description",
          isRequired: true,
          isSubmitted: false,
        },
        {
          documentType: "budget_breakdown",
          title: "Budget & Financial Plan",
          description:
            "Detailed budget breakdown, cost analysis, and financial justification",
          isRequired: true,
          isSubmitted: false,
        },
        {
          documentType: "technical_specifications",
          title: "Technical & Implementation Plan",
          description:
            "Technical specifications, timeline, milestones, and implementation strategy",
          isRequired: true,
          isSubmitted: false,
        },
      ];
    }

    const submittedDocuments = requiredDocuments.filter((reqDoc) => {
      return uploadedDocuments.some(
        (uploaded) => uploaded.documentType === reqDoc.documentType
      );
    });

    if (submittedDocuments.length < requiredDocuments.length) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve project. ${
          requiredDocuments.length - submittedDocuments.length
        } required document(s) still need to be submitted.`,
        data: {
          required: requiredDocuments.length,
          submitted: submittedDocuments.length,
          missing: requiredDocuments.length - submittedDocuments.length,
        },
      });
    }

    if (level === "department" && currentUser.role.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Only Manager and above can approve at department level",
      });
    }

    if (
      level === "finance" &&
      currentUser.department?.name !== "Finance & Accounting"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Finance department can approve at finance level",
      });
    }

    if (
      level === "executive" &&
      currentUser.department?.name !== "Executive Office"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Executive Office can approve at executive level",
      });
    }

    if (
      level === "legal_compliance" &&
      currentUser.department?.name !== "Legal & Compliance"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Legal & Compliance department can approve at legal_compliance level",
      });
    }

    // Approve the project
    await project.approveProject(currentUser._id, level, comments);

    // Audit logging for project approval
    try {
      await ProjectAuditService.logProjectApproved(
        project,
        currentUser,
        level,
        comments
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging project approval:", error);
    }

    if (project.status === "approved") {
      console.log(
        "🎯 [APPROVAL] Final approval received - triggering post-approval workflow"
      );

      try {
        await project.triggerPostApprovalWorkflow(currentUser);
        console.log(
          "✅ [APPROVAL] Post-approval workflow triggered successfully"
        );
      } catch (workflowError) {
        console.error(
          "❌ [APPROVAL] Error triggering post-approval workflow:",
          workflowError
        );
      }
    }

    // Send notification to project creator
    await sendProjectNotification(req, {
      recipient: project.createdBy,
      type: "project_approved",
      title: "Project Approved",
      message: `Your project "${project.name}" has been approved at ${level} level by ${currentUser.firstName} ${currentUser.lastName} (${currentUser.department?.name}).`,
      data: {
        projectId: project._id,
        projectName: project.name,
        approvalLevel: level,
        approverName: `${currentUser.firstName} ${currentUser.lastName}`,
        approverDepartment: currentUser.department?.name,
        comments: comments || "No comments provided",
        approvedAt: new Date().toISOString(),
      },
    });

    // Send notification to next approver if there is one
    if (project.status !== "approved") {
      const nextPendingStep = project.approvalChain.find(
        (step) => step.status === "pending"
      );

      if (nextPendingStep) {
        try {
          let nextApproverQuery = {};

          if (nextPendingStep.level === "legal_compliance") {
            const legalDept = await mongoose
              .model("Department")
              .findOne({ name: "Legal & Compliance" });

            const hodRole = await mongoose
              .model("Role")
              .findOne({ name: "HOD" });

            if (legalDept && hodRole) {
              nextApproverQuery = {
                role: hodRole._id,
                department: legalDept._id,
              };
            }
          } else if (nextPendingStep.level === "executive") {
            const execDept = await mongoose
              .model("Department")
              .findOne({ name: "Executive Office" });

            const hodRole = await mongoose
              .model("Role")
              .findOne({ name: "HOD" });

            if (execDept && hodRole) {
              nextApproverQuery = {
                role: hodRole._id,
                department: execDept._id,
              };
            }
          } else if (nextPendingStep.level === "finance") {
            const financeDept = await mongoose
              .model("Department")
              .findOne({ name: "Finance & Accounting" });

            const hodRole = await mongoose
              .model("Role")
              .findOne({ name: "HOD" });

            if (financeDept && hodRole) {
              nextApproverQuery = {
                role: hodRole._id,
                department: financeDept._id,
              };
            }
          }

          if (Object.keys(nextApproverQuery).length > 0) {
            const nextApprover = await User.findOne(nextApproverQuery).populate(
              "department"
            );

            // Skip notification if next approver is the project creator (to avoid duplicate notifications)
            if (
              nextApprover &&
              nextApprover._id.toString() !== project.createdBy.toString()
            ) {
              await notificationService.createNotification({
                recipient: nextApprover._id,
                type: "PROJECT_READY_FOR_APPROVAL",
                title: "Project Approval Required",
                message: `You have a pending ${
                  nextPendingStep.level
                } approval for project: ${project.name} (${formatCurrency(
                  project.budget
                )})`,
                priority: "high",
                data: {
                  projectId: project._id,
                  projectName: project.name,
                  approvalLevel: nextPendingStep.level,
                  amount: project.budget,
                  creatorDepartment: project.department?.name,
                  creatorName: `${project.createdBy?.firstName} ${project.createdBy?.lastName}`,
                  actionUrl: "/dashboard/modules/projects",
                },
              });

              console.log(
                `📧 [NEXT APPROVER NOTIFICATION] Sent to ${nextApprover.firstName} ${nextApprover.lastName} (${nextApprover.department?.name}) for ${nextPendingStep.level} approval`
              );
            } else if (
              nextApprover &&
              nextApprover._id.toString() === project.createdBy.toString()
            ) {
              console.log(
                `📧 [NEXT APPROVER NOTIFICATION] Skipped notification to project creator (${nextApprover.firstName} ${nextApprover.lastName})`
              );
            }
          }
        } catch (notifError) {
          console.error(
            "❌ [NEXT APPROVER NOTIFICATION] Error sending notification:",
            notifError
          );
        }
      }
    } else {
      // Final approval - notify relevant stakeholders
      console.log(
        "🎉 [FINAL APPROVAL] Project fully approved - sending final notifications"
      );

      // Notify project manager if different from creator
      if (
        project.projectManager &&
        project.projectManager.toString() !== project.createdBy.toString()
      ) {
        try {
          await notificationService.createNotification({
            recipient: project.projectManager,
            type: "project_approved",
            title: "Project Fully Approved",
            message: `Project "${project.name}" has been fully approved and is ready for implementation.`,
            priority: "high",
            data: {
              projectId: project._id,
              projectName: project.name,
              amount: project.budget,
              approvalType: "final",
              nextSteps: "Project is ready for implementation phase",
              actionUrl: "/dashboard/modules/projects",
            },
          });

          console.log(
            "📧 [FINAL APPROVAL] Notification sent to project manager"
          );
        } catch (notifError) {
          console.error(
            "❌ [FINAL APPROVAL] Error notifying project manager:",
            notifError
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Project approved successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error approving project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve project",
    });
  }
};

// @desc    Reject project
// @route   POST /api/projects/:id/reject
// @access  Private (Approvers)
export const rejectProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, comments, rejectionReason } = req.body;
    const currentUser = req.user;

    const project = await Project.findById(id)
      .populate("department", "name")
      .populate("approvalChain.approver", "firstName lastName email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user can reject this level (same permission checks as approve)
    const approvalStep = project.approvalChain.find(
      (step) => step.level === level
    );

    if (!approvalStep) {
      return res.status(400).json({
        success: false,
        message: `No approval step found for level: ${level}`,
      });
    }

    // Validate rejection data
    if (!comments || !comments.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection comments are required",
      });
    }

    // Check if user has permission to reject this level
    if (level === "hod" && currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Only HOD can reject at this level",
      });
    }

    if (
      level === "finance" &&
      currentUser.department?.name !== "Finance & Accounting"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Finance department can reject at finance level",
      });
    }

    if (
      level === "executive" &&
      currentUser.department?.name !== "Executive Office"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Executive Office can reject at executive level",
      });
    }

    if (
      level === "legal_compliance" &&
      currentUser.department?.name !== "Legal & Compliance"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Legal & Compliance department can reject at legal_compliance level",
      });
    }

    // Reject the project
    await project.rejectProject(currentUser._id, level, comments);

    // Audit logging for project rejection
    try {
      await ProjectAuditService.logProjectRejected(
        project,
        currentUser,
        level,
        comments
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging project rejection:", error);
    }

    // Send notification to project creator
    await sendProjectNotification(req, {
      recipient: project.createdBy,
      type: "project_rejected",
      title: "Project Rejected",
      message: `Your project "${project.name}" has been rejected at ${level} level by ${currentUser.firstName} ${currentUser.lastName} (${currentUser.department?.name}).`,
      data: {
        projectId: project._id,
        projectName: project.name,
        rejectionLevel: level,
        rejecterName: `${currentUser.firstName} ${currentUser.lastName}`,
        rejecterDepartment: currentUser.department?.name,
        rejectionReason: rejectionReason || "No specific reason provided",
        comments: comments,
        rejectedAt: new Date().toISOString(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Project rejected successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error rejecting project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject project",
    });
  }
};

// @desc    Trigger post-approval workflow for a project
// @route   POST /api/projects/:id/trigger-workflow
// @access  Private (HOD+)
export const triggerPostApprovalWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if project is approved
    if (project.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Project must be approved before triggering post-approval workflow",
      });
    }

    // Check if workflow has already been triggered
    if (
      project.workflowPhase !== "planning" &&
      project.workflowPhase !== "approval"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Post-approval workflow has already been triggered for this project",
      });
    }

    // Trigger the post-approval workflow
    await project.triggerPostApprovalWorkflow(currentUser._id);

    // Audit logging for workflow trigger
    try {
      await ProjectAuditService.logWorkflowTriggered(
        project,
        currentUser,
        "implementation"
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging workflow trigger:", error);
    }

    res.status(200).json({
      success: true,
      message: "Post-approval workflow triggered successfully",
      data: {
        projectId: project._id,
        projectName: project.name,
        workflowPhase: project.workflowPhase,
        workflowStep: project.workflowStep,
        workflowTriggers: project.workflowTriggers,
      },
    });
  } catch (error) {
    console.error("Error triggering post-approval workflow:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger post-approval workflow",
      error: error.message,
    });
  }
};

// @desc    Get project workflow status
// @route   GET /api/projects/:id/workflow-status
// @access  Private (HOD+)
export const getProjectWorkflowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id)
      .populate("projectManager", "firstName lastName email")
      .populate("createdBy", "firstName lastName");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkProjectAccess(currentUser, project);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to view this project.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.name,
        status: project.status,
        workflowPhase: project.workflowPhase,
        workflowStep: project.workflowStep,
        workflowTriggers: project.workflowTriggers,
        workflowHistory: project.workflowHistory,
        isAutoGenerated: project.isAutoGenerated,
      },
    });
  } catch (error) {
    console.error("Error getting project workflow status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get project workflow status",
      error: error.message,
    });
  }
};

// @desc    Get projects pending approval
// @route   GET /api/projects/pending-approval
// @access  Private (Approvers)
export const getPendingApprovalProjects = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = {
      status: {
        $in: [
          "pending_approval",
          "pending_department_approval",
          "pending_finance_approval",
          "pending_executive_approval",
          "pending_legal_compliance_approval",
          "approved",
          "implementation",
        ],
      },
      isActive: true,
    };

    if (currentUser.role.level >= 1000) {
      // Super Admin - showing all pending approvals
    } else if (currentUser.role.level >= 700) {
      // HOD - showing all pending approvals
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. HOD level (700) or higher required for approval access.",
      });
    }

    const projects = await Project.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name")
      .populate("approvalChain.approver", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Get document counts for each project
    const Document = await import("../models/Document.js");
    const projectsWithDocumentCounts = await Promise.all(
      projects.map(async (project) => {
        const projectDoc = project.toObject();

        // Count actual uploaded documents for this project
        const uploadedDocuments = await Document.default.find({
          project: project._id,
          isActive: true,
        });

        // Set default required documents if not already set (for older projects)
        if (
          !projectDoc.requiredDocuments ||
          projectDoc.requiredDocuments.length === 0
        ) {
          projectDoc.requiredDocuments = [
            {
              documentType: "project_proposal",
              title: "Project Proposal Document",
              description:
                "Complete project proposal with objectives, scope, and detailed description",
              isRequired: true,
              isSubmitted: false,
            },
            {
              documentType: "budget_breakdown",
              title: "Budget & Financial Plan",
              description:
                "Detailed budget breakdown, cost analysis, and financial justification",
              isRequired: true,
              isSubmitted: false,
            },
            {
              documentType: "technical_specifications",
              title: "Technical & Implementation Plan",
              description:
                "Technical specifications, timeline, milestones, and implementation strategy",
              isRequired: true,
              isSubmitted: false,
            },
          ];
        }

        // Update the requiredDocuments array with submission status
        projectDoc.requiredDocuments = projectDoc.requiredDocuments.map(
          (reqDoc) => {
            const uploadedDoc = uploadedDocuments.find(
              (uploaded) => uploaded.documentType === reqDoc.documentType
            );

            return {
              ...reqDoc,
              isSubmitted: !!uploadedDoc,
              uploadedDocumentId: uploadedDoc?._id,
              uploadedAt: uploadedDoc?.createdAt,
            };
          }
        );

        // Add approval status indicator for frontend
        projectDoc.approvalStatus = projectDoc.status;
        projectDoc.isPendingApproval = [
          "pending_approval",
          "pending_department_approval",
          "pending_finance_approval",
          "pending_executive_approval",
          "pending_legal_compliance_approval",
        ].includes(projectDoc.status);
        projectDoc.isApproved = ["approved", "implementation"].includes(
          projectDoc.status
        );

        return projectDoc;
      })
    );

    res.status(200).json({
      success: true,
      data: projectsWithDocumentCounts,
    });
  } catch (error) {
    console.error("Error getting pending approval projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending approval projects",
    });
  }
};

// @desc    Get project audit trail
// @route   GET /api/projects/:id/audit-trail
// @access  Private
export const getProjectAuditTrail = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkProjectAccess(currentUser, project);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to access this project.",
      });
    }

    // Get audit logs for this project
    const AuditLog = await import("../models/AuditLog.js");
    const auditTrail = await AuditLog.default
      .find({
        entityType: "Project",
        entityId: project._id,
      })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project._id,
          name: project.name,
          code: project.code,
        },
        auditTrail,
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get audit trail error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project audit trail",
      error: error.message,
    });
  }
};

// @desc    Get my projects
// @route   GET /api/projects/my-projects
// @access  Private
export const getMyProjects = async (req, res) => {
  try {
    const currentUser = req.user;

    // Find projects where user is a team member or creator
    const projects = await Project.find({
      $or: [
        { createdBy: currentUser._id },
        { "teamMembers.user": currentUser._id },
      ],
      isActive: true,
    })
      .populate("department", "name code")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        projects: projects,
        totalProjects: projects.length,
      },
    });
  } catch (error) {
    console.error("Error getting my projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get projects",
      error: error.message,
    });
  }
};

// @desc    Get project analytics
// @route   GET /api/projects/analytics
// @access  Private (HOD+)
export const getProjectAnalytics = async (req, res) => {
  try {
    const currentUser = req.user;
    const { timeframe = "30d" } = req.query;

    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD - projects in their department or where they're manager
        query.$or = [
          { projectManager: currentUser._id },
          { "teamMembers.user": currentUser._id },
        ];
      } else {
        // STAFF - only their assigned projects
        query.$or = [
          { projectManager: currentUser._id },
          { "teamMembers.user": currentUser._id },
        ];
      }
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    query.createdAt = { $gte: startDate };

    const analytics = await Project.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalBudget: { $sum: "$budget" },
          avgBudget: { $avg: "$budget" },
        },
      },
    ]);

    const totalProjects = await Project.countDocuments(query);
    const totalBudget = await Project.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$budget" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        analytics,
        totalProjects,
        totalBudget: totalBudget[0]?.total || 0,
        timeframe,
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project analytics",
      error: error.message,
    });
  }
};

// @desc    Get project progress
// @route   GET /api/projects/:id/progress
// @access  Private
export const getProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkProjectAccess(currentUser, project);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to access this project.",
      });
    }

    // Calculate progress based on approval chain
    const totalSteps = project.approvalChain.length;
    const completedSteps = project.approvalChain.filter(
      (step) => step.status === "approved"
    ).length;

    const progressPercentage =
      totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    // Get current step
    const currentStep = project.approvalChain.find(
      (step) => step.status === "pending"
    );

    // Get workflow status for external projects
    let workflowStatus = null;
    if (project.scope === "external" && project.status === "approved") {
      workflowStatus = {
        inventory: project.inventoryStatus || "pending",
        procurement: project.procurementStatus || "pending",
      };
    }

    res.status(200).json({
      success: true,
      data: {
        project,
        progress: {
          percentage: Math.round(progressPercentage),
          completedSteps,
          totalSteps,
          currentStep,
          workflowStatus,
        },
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get progress error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project progress",
      error: error.message,
    });
  }
};

// @desc    Complete regulatory compliance for external project
// @route   POST /api/projects/:id/complete-compliance
// @access  Private (Legal/Compliance HOD)
export const completeRegulatoryCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const { complianceNotes } = req.body;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is Legal/Compliance HOD
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. HOD level required for compliance approval.",
      });
    }

    // Check if project is external and in legal compliance stage
    if (
      project.scope !== "external" ||
      project.status !== "pending_legal_compliance_approval"
    ) {
      return res.status(400).json({
        success: false,
        message: "Project is not in legal compliance approval stage.",
      });
    }

    // Update project status
    project.status = "approved";
    project.regulatoryComplianceStatus = "completed";
    project.regulatoryComplianceNotes = complianceNotes;
    project.regulatoryComplianceCompletedBy = currentUser._id;
    project.regulatoryComplianceCompletedAt = new Date();

    // Update approval chain
    const legalComplianceStep = project.approvalChain.find(
      (step) => step.role === "legal_compliance_hod"
    );
    if (legalComplianceStep) {
      legalComplianceStep.status = "approved";
      legalComplianceStep.approvedBy = currentUser._id;
      legalComplianceStep.approvedAt = new Date();
      legalComplianceStep.notes = complianceNotes;
    }

    await project.save();

    // Send notification to project creator and manager
    try {
      const notificationService = await import(
        "../services/notificationService.js"
      );
      await notificationService.default.sendNotification({
        recipientId: project.createdBy,
        type: "project_approved",
        title: "Project Approved - Regulatory Compliance Complete",
        message: `Your external project "${project.name}" has been approved by Legal & Compliance.`,
        data: { projectId: project._id },
      });

      if (
        project.projectManager &&
        project.projectManager.toString() !== project.createdBy.toString()
      ) {
        await notificationService.default.sendNotification({
          recipientId: project.projectManager,
          type: "project_approved",
          title: "Project Approved - Regulatory Compliance Complete",
          message: `External project "${project.name}" has been approved by Legal & Compliance.`,
          data: { projectId: project._id },
        });
      }
    } catch (notificationError) {
      console.error("❌ [PROJECTS] Notification error:", notificationError);
    }

    res.status(200).json({
      success: true,
      message: "Regulatory compliance completed successfully",
      data: project,
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Complete compliance error:", error);
    res.status(500).json({
      success: false,
      message: "Error completing regulatory compliance",
      error: error.message,
    });
  }
};

// @desc    Get regulatory compliance status
// @route   GET /api/projects/:id/compliance-status
// @access  Private
export const getRegulatoryComplianceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id).populate(
      "regulatoryComplianceCompletedBy",
      "firstName lastName email"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkProjectAccess(currentUser, project);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to access this project.",
      });
    }

    // Only external projects have regulatory compliance
    if (project.scope !== "external") {
      return res.status(400).json({
        success: false,
        message: "Regulatory compliance only applies to external projects.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project._id,
          name: project.name,
          code: project.code,
          scope: project.scope,
        },
        compliance: {
          status: project.regulatoryComplianceStatus || "pending",
          notes: project.regulatoryComplianceNotes,
          completedBy: project.regulatoryComplianceCompletedBy,
          completedAt: project.regulatoryComplianceCompletedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get compliance status error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching regulatory compliance status",
      error: error.message,
    });
  }
};

// @desc    Mark inventory as completed (Operations HOD)
// @route   POST /api/projects/:id/complete-inventory
// @access  Private (Operations HOD+)
export const completeInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Find the project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if inventory is already completed
    if (project.workflowTriggers?.inventoryCompleted) {
      return res.status(400).json({
        success: false,
        message: "Inventory is already completed for this project",
      });
    }

    // Mark inventory as completed
    await project.completeInventory(currentUser._id);

    res.status(200).json({
      success: true,
      message: "Inventory marked as completed successfully",
      data: {
        projectId: project._id,
        projectCode: project.code,
        projectName: project.name,
        inventoryCompleted: true,
        completedAt: project.workflowTriggers.inventoryCompletedAt,
        completedBy: currentUser._id,
        currentProgress: project.progress,
      },
    });
  } catch (error) {
    console.error("Error completing inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete inventory",
      error: error.message,
    });
  }
};

// @desc    Mark procurement as completed (Procurement HOD)
// @route   POST /api/projects/:id/complete-procurement
// @access  Private (Procurement HOD+)
export const completeProcurement = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Find the project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if procurement is already completed
    if (project.workflowTriggers?.procurementCompleted) {
      return res.status(400).json({
        success: false,
        message: "Procurement is already completed for this project",
      });
    }

    // Mark procurement as completed
    await project.completeProcurement(currentUser._id);

    res.status(200).json({
      success: true,
      message: "Procurement marked as completed successfully",
      data: {
        projectId: project._id,
        projectCode: project.code,
        projectName: project.name,
        procurementCompleted: true,
        completedAt: project.workflowTriggers.procurementCompletedAt,
        completedBy: currentUser._id,
        currentProgress: project.progress,
      },
    });
  } catch (error) {
    console.error("Error completing procurement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete procurement",
      error: error.message,
    });
  }
};

// @desc    Get workflow status for a project
// @route   GET /api/projects/:id/workflow-status
// @access  Private
export const getWorkflowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Find the project
    const project = await Project.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("department", "name")
      .populate(
        "workflowTriggers.inventoryCompletedBy",
        "firstName lastName email"
      )
      .populate(
        "workflowTriggers.procurementCompletedBy",
        "firstName lastName email"
      )
      .populate(
        "workflowTriggers.regulatoryComplianceCompletedBy",
        "firstName lastName email"
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const workflowStatus = {
      projectId: project._id,
      projectCode: project.code,
      projectName: project.name,
      currentProgress: project.progress,
      currentPhase: project.workflowPhase,
      currentStatus: project.status,

      // Inventory Status
      inventoryCreated: project.workflowTriggers?.inventoryCreated || false,
      inventoryCompleted: project.workflowTriggers?.inventoryCompleted || false,
      inventoryCompletedAt: project.workflowTriggers?.inventoryCompletedAt,
      inventoryCompletedBy: project.workflowTriggers?.inventoryCompletedBy
        ? {
            id: project.workflowTriggers.inventoryCompletedBy._id,
            name: `${project.workflowTriggers.inventoryCompletedBy.firstName} ${project.workflowTriggers.inventoryCompletedBy.lastName}`,
            email: project.workflowTriggers.inventoryCompletedBy.email,
          }
        : null,

      // Procurement Status
      procurementInitiated:
        project.workflowTriggers?.procurementInitiated || false,
      procurementCompleted:
        project.workflowTriggers?.procurementCompleted || false,
      procurementCompletedAt: project.workflowTriggers?.procurementCompletedAt,
      procurementCompletedBy: project.workflowTriggers?.procurementCompletedBy
        ? {
            id: project.workflowTriggers.procurementCompletedBy._id,
            name: `${project.workflowTriggers.procurementCompletedBy.firstName} ${project.workflowTriggers.procurementCompletedBy.lastName}`,
            email: project.workflowTriggers.procurementCompletedBy.email,
          }
        : null,

      // Regulatory Compliance Status
      regulatoryComplianceInitiated:
        project.workflowTriggers?.regulatoryComplianceInitiated || false,
      regulatoryComplianceCompleted:
        project.workflowTriggers?.regulatoryComplianceCompleted || false,
      regulatoryComplianceCompletedAt:
        project.workflowTriggers?.regulatoryComplianceCompletedAt,
      regulatoryComplianceCompletedBy: project.workflowTriggers
        ?.regulatoryComplianceCompletedBy
        ? {
            id: project.workflowTriggers.regulatoryComplianceCompletedBy._id,
            name: `${project.workflowTriggers.regulatoryComplianceCompletedBy.firstName} ${project.workflowTriggers.regulatoryComplianceCompletedBy.lastName}`,
            email:
              project.workflowTriggers.regulatoryComplianceCompletedBy.email,
          }
        : null,

      // Action Permissions
      canCompleteInventory:
        !project.workflowTriggers?.inventoryCompleted &&
        project.workflowTriggers?.inventoryCreated,

      canCompleteProcurement:
        !project.workflowTriggers?.procurementCompleted &&
        project.workflowTriggers?.procurementInitiated,

      canCompleteCompliance:
        !project.workflowTriggers?.regulatoryComplianceCompleted &&
        project.workflowTriggers?.regulatoryComplianceInitiated &&
        project.workflowTriggers?.inventoryCompleted &&
        project.workflowTriggers?.procurementCompleted,

      // Workflow History
      workflowHistory: project.workflowHistory || [],
    };

    res.status(200).json({
      success: true,
      data: workflowStatus,
    });
  } catch (error) {
    console.error("Error getting workflow status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get workflow status",
      error: error.message,
    });
  }
};

// @desc    Get projects needing inventory (Operations HOD)
// @route   GET /api/projects/needing-inventory
// @access  Private (Operations HOD)
export const getProjectsNeedingInventory = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is Operations HOD
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. HOD level (700) or higher required.",
      });
    }

    // Find external projects that are approved but inventory is pending
    const projects = await Project.find({
      scope: "external",
      status: "approved",
      inventoryStatus: { $in: ["pending", null] },
      isActive: true,
    })
      .populate("createdBy", "firstName lastName email")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        projects: projects,
        totalNeedingInventory: projects.length,
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get projects needing inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects needing inventory",
      error: error.message,
    });
  }
};

// @desc    Get project categories from model schema
// @route   GET /api/projects/categories
// @access  Private (All authenticated users)
export const getProjectCategories = async (req, res) => {
  try {
    const Project = mongoose.model("Project");
    const categoryPath = Project.schema.path("category");
    const categories = categoryPath.enumValues || [];

    // Transform categories to frontend format
    const formattedCategories = categories.map((category) => ({
      value: category,
      label: category
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }));

    res.status(200).json({
      success: true,
      message: "Project categories retrieved successfully",
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project categories",
      error: error.message,
    });
  }
};

export const completeDepartmentalProjectImplementation = async (req, res) => {
  // Deprecated in favor of startDepartmentalProjectImplementation, keep stub for compatibility
  return res.status(410).json({
    success: false,
    message: "Use /start-implementation endpoint instead",
  });
};
