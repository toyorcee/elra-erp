import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import TeamMember from "../models/TeamMember.js";
import Approval from "../models/Approval.js";
import { checkDepartmentAccess } from "../middleware/auth.js";
import { generateApprovalChain } from "./approvalController.js";

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

// ============================================================================
// PROJECT CONTROLLERS
// ============================================================================

// @desc    Get all projects (with role-based filtering)
// @route   GET /api/projects
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
    } else if (currentUser.role.level >= 700) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view projects",
        });
      }

      query.$or = [
        { department: currentUser.department._id },
        { projectManager: currentUser._id },
        { "teamMembers.user": currentUser._id },
      ];

      console.log(
        "🔍 [PROJECTS] HOD - showing projects for department:",
        currentUser.department.name
      );
    }
    // STAFF (300) - see projects they're assigned to
    else if (currentUser.role.level >= 300) {
      query.$or = [
        { projectManager: currentUser._id },
        { "teamMembers.user": currentUser._id },
      ];

      console.log("🔍 [PROJECTS] Staff - showing assigned projects only");
    }
    // VIEWER (100) - see projects they're assigned to
    else if (currentUser.role.level >= 100) {
      query.$or = [
        { projectManager: currentUser._id },
        { "teamMembers.user": currentUser._id },
      ];

      console.log("🔍 [PROJECTS] Viewer - showing assigned projects only");
    }
    // Others - no access
    else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions to view projects.",
      });
    }

    const projects = await Project.find(query)
      .populate("projectManager", "firstName lastName email avatar")
      .populate("teamMembers.user", "firstName lastName email")
      .populate("createdBy", "firstName lastName")
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

    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and above can create projects.",
      });
    }

    const requiredFields = [
      "title",
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

    console.log("🔍 [PROJECT] Validating department-category mapping...");
    console.log(`   User Department: ${currentUser.department?.name}`);
    console.log(`   Requested Category: ${req.body.category}`);

    const departmentCategoryMap = {
      Operations: [
        "equipment_lease",
        "software_development",
        "system_maintenance",
      ],
      "Sales & Marketing": ["vehicle_lease", "consulting", "training"],
      "Information Technology": [
        "property_lease",
        "software_development",
        "system_maintenance",
      ],
      "Finance & Accounting": ["financial_lease", "consulting"],
      "Human Resources": ["training_equipment_lease", "training", "consulting"],
      "Legal & Compliance": ["compliance_lease", "consulting"],
      "Customer Service": ["service_equipment_lease", "training"],
      "Executive Office": ["strategic_lease", "consulting", "other"],
    };

    const userDepartment = currentUser.department?.name;
    const projectCategory = req.body.category;

    if (userDepartment && departmentCategoryMap[userDepartment]) {
      const allowedCategories = departmentCategoryMap[userDepartment];
      console.log(
        `   Allowed Categories for ${userDepartment}: ${allowedCategories.join(
          ", "
        )}`
      );

      if (!allowedCategories.includes(projectCategory)) {
        console.log(
          `   ❌ [PROJECT] Category validation failed: ${projectCategory} not allowed for ${userDepartment}`
        );
        return res.status(400).json({
          success: false,
          message: `Invalid project category for ${userDepartment} department. Allowed categories: ${allowedCategories.join(
            ", "
          )}`,
        });
      }
      console.log(
        `   ✅ [PROJECT] Category validation passed: ${projectCategory} is allowed for ${userDepartment}`
      );
    } else {
      console.log(
        `   ⚠️ [PROJECT] No department mapping found for: ${userDepartment}`
      );
    }

    const projectData = {
      ...req.body,
      createdBy: currentUser._id,
      department: currentUser.department,
    };

    if (currentUser.role.level === 700 && currentUser.department) {
      console.log(
        "🔍 [PROJECTS] HOD creating project for department:",
        currentUser.department.name
      );
    }

    const project = new Project(projectData);
    await project.save();

    if (project.projectManager) {
      try {
        const teamMember = new TeamMember({
          project: project._id,
          user: project.projectManager,
          role: "project_manager",
          allocationPercentage: 100,
          permissions: {
            canEditProject: true,
            canManageTeam: true,
            canViewReports: true,
            canAddNotes: true,
          },
          assignedBy: currentUser._id,
        });
        await teamMember.save();
        console.log("🔍 [PROJECTS] Auto-assigned project manager to team");
      } catch (error) {
        console.error(
          "❌ [PROJECTS] Error auto-assigning project manager:",
          error
        );
      }
    }

    // Create approval request for project creation
    try {
      console.log("🚀 [APPROVAL] ========================================");
      console.log("🚀 [APPROVAL] PROJECT CREATION APPROVAL WORKFLOW");
      console.log("🚀 [APPROVAL] ========================================");
      console.log("📋 [APPROVAL] Project Details:");
      console.log(`   Name: ${project.name}`);
      console.log(`   Code: ${project.code}`);
      console.log(`   Category: ${project.category}`);
      console.log(`   Department: ${currentUser.department?.name}`);
      console.log(`   Budget: ${formatCurrency(project.budget)}`);
      console.log(`   Priority: ${project.priority}`);
      console.log("👤 [APPROVAL] Creator Details:");
      console.log(`   Name: ${currentUser.firstName} ${currentUser.lastName}`);
      console.log(
        `   Role: ${currentUser.role?.name} (Level: ${currentUser.role?.level})`
      );
      console.log(`   Department: ${currentUser.department?.name}`);
      console.log(`   Email: ${currentUser.email}`);

      const approvalChain = await generateApprovalChain(
        "project_creation",
        currentUser.department?._id,
        project.budget
      );

      console.log("📋 [APPROVAL] Generated Approval Chain:");
      console.log(`   Total Levels: ${approvalChain.length}`);
      approvalChain.forEach((level, index) => {
        console.log(
          `   Level ${index + 1}: ${level.role} (Level ${
            level.departmentLevel
          })`
        );
        if (level.approver) {
          console.log(
            `     Approver: ${level.approver.firstName} ${level.approver.lastName}`
          );
          console.log(`     Email: ${level.approver.email}`);
        }
      });

      const approval = new Approval({
        title: `Project Creation: ${project.name}`,
        description: `Approval request for new project: ${project.description}`,
        type: "project_creation",
        entityType: "project",
        entityId: project._id,
        entityModel: "Project",
        department: currentUser.department?._id,
        requestedBy: currentUser._id,
        createdBy: currentUser._id,
        amount: project.budget,
        currency: "NGN",
        priority:
          project.priority === "critical"
            ? "critical"
            : project.priority === "high"
            ? "high"
            : project.priority === "low"
            ? "low"
            : "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        approvalChain: approvalChain,
        budgetYear: new Date().getFullYear().toString(),
      });

      await approval.save();
      console.log("✅ [APPROVAL] Approval request created successfully");
      console.log(`   Approval ID: ${approval._id}`);
      console.log(`   Title: ${approval.title}`);
      console.log(`   Status: ${approval.status}`);
      console.log(`   Due Date: ${approval.dueDate.toDateString()}`);

      // Send notification to first approver
      try {
        const notificationController = req.app.get("notificationController");
        if (
          notificationController &&
          approvalChain.length > 0 &&
          approvalChain[0].approver
        ) {
          await notificationController.createNotification({
            recipient: approvalChain[0].approver,
            type: "approval_required",
            title: "Project Approval Required",
            message: `You have a pending approval for project: ${project.name}`,
            data: {
              approvalId: approval._id,
              projectId: project._id,
              projectName: project.name,
              amount: project.budget,
              type: "project_creation",
            },
          });
          console.log("📧 [APPROVAL] Notification sent successfully");
          console.log(
            `   Recipient: ${approvalChain[0].approver.firstName} ${approvalChain[0].approver.lastName}`
          );
          console.log(`   Email: ${approvalChain[0].approver.email}`);
        }
      } catch (notifError) {
        console.error("❌ [APPROVAL] Error sending notification:", notifError);
      }

      // Set project status based on user role
      if (currentUser.role.level < 1000) {
        project.status = "pending_approval";
        await project.save();
        console.log(
          "🔄 [APPROVAL] Project status updated to 'pending_approval'"
        );
      } else {
        console.log(
          "👑 [APPROVAL] SUPER_ADMIN created project - auto-approved"
        );
      }

      console.log("🎯 [APPROVAL] Approval workflow completed successfully");
      console.log("🚀 [APPROVAL] ========================================");
    } catch (error) {
      console.error("❌ [APPROVAL] Error creating approval request:", error);
      console.error("❌ [APPROVAL] Error details:", error.message);
      // Don't fail the project creation if approval creation fails
    }

    // Populate the created project
    await project.populate("projectManager", "firstName lastName email avatar");
    await project.populate("createdBy", "firstName lastName");

    res.status(201).json({
      success: true,
      message:
        currentUser.role.level >= 1000
          ? "Project created and auto-approved successfully"
          : "Project created successfully. Pending approval.",
      data: project,
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Create project error:", error);
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

// @desc    Get next project code
// @route   GET /api/projects/next-code
// @access  Private (HOD+)
export const getNextProjectCode = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user can create projects
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and above can create projects.",
      });
    }

    const count = await Project.countDocuments({ isActive: true });
    const currentYear = new Date().getFullYear();
    const nextCode = `PRJ${currentYear}${String(count + 1).padStart(4, "0")}`;
    const currentDate = new Date().toISOString().split("T")[0];

    res.status(200).json({
      success: true,
      data: {
        nextCode,
        currentDate,
        totalProjects: count,
      },
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get next code error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating next project code",
      error: error.message,
    });
  }
};

// @desc    Get comprehensive project data for SUPER_ADMIN
// @route   GET /api/projects/comprehensive
// @access  Private (SUPER_ADMIN only)
export const getComprehensiveProjectData = async (req, res) => {
  try {
    const currentUser = req.user;

    // Only SUPER_ADMIN can access this endpoint
    if (currentUser.role.level < 1000) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only SUPER_ADMIN can access comprehensive project data.",
      });
    }

    // Get all projects with enhanced data
    const projects = await Project.find({ isActive: true })
      .populate("projectManager", "firstName lastName email avatar department")
      .populate("teamMembers.user", "firstName lastName email department")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });

    // Get all team members across all projects
    const allTeamMembers = await TeamMember.find({ isActive: true })
      .populate("project", "name code status")
      .populate("user", "firstName lastName email avatar department role")
      .populate("assignedBy", "firstName lastName")
      .sort({ assignedDate: -1 });

    // Get project statistics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const completedProjects = projects.filter(
      (p) => p.status === "completed"
    ).length;
    const totalTeamMembers = allTeamMembers.length;

    // Group team members by project
    const teamMembersByProject = {};
    allTeamMembers.forEach((member) => {
      const projectId = member.project._id.toString();
      if (!teamMembersByProject[projectId]) {
        teamMembersByProject[projectId] = [];
      }
      teamMembersByProject[projectId].push(member);
    });

    // Enhance projects with team data
    const enhancedProjects = projects.map((project) => {
      const projectObj = project.toObject();
      projectObj.enhancedTeamMembers =
        teamMembersByProject[project._id.toString()] || [];
      projectObj.teamMemberCount = projectObj.enhancedTeamMembers.length;
      return projectObj;
    });

    res.status(200).json({
      success: true,
      data: {
        projects: enhancedProjects,
        teamMembers: allTeamMembers,
        statistics: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTeamMembers,
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

// @desc    Get projects without team members (for adding new team members)
// @route   GET /api/projects/available-for-teams
// @access  Private (SUPER_ADMIN only)
export const getProjectsAvailableForTeams = async (req, res) => {
  try {
    const currentUser = req.user;

    // Only SUPER_ADMIN can access this endpoint
    if (currentUser.role.level < 1000) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only SUPER_ADMIN can access this endpoint.",
      });
    }

    // Get all projects
    const projects = await Project.find({ isActive: true })
      .populate("projectManager", "firstName lastName email avatar department")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });

    // Get all team members to check which projects already have members
    const allTeamMembers = await TeamMember.find({ isActive: true });

    // Create a set of project IDs that already have team members
    const projectsWithMembers = new Set();
    allTeamMembers.forEach((member) => {
      projectsWithMembers.add(member.project.toString());
    });

    // Filter out projects that already have team members
    const availableProjects = projects.filter((project) => {
      return !projectsWithMembers.has(project._id.toString());
    });

    res.status(200).json({
      success: true,
      data: availableProjects,
    });
  } catch (error) {
    console.error("❌ [PROJECTS] Get available projects error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available projects",
      error: error.message,
    });
  }
};

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

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private (HOD+)
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

    // Check access permissions
    const canManage = await checkProjectEditAccess(currentUser, project);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to manage this project.",
      });
    }

    await project.addTeamMember(userId, role);

    res.status(200).json({
      success: true,
      message: "Team member added successfully",
      data: project,
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
// @access  Private (HOD+)
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

    // Check access permissions
    const canManage = await checkProjectEditAccess(currentUser, project);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to manage this project.",
      });
    }

    await project.removeTeamMember(userId);

    res.status(200).json({
      success: true,
      message: "Team member removed successfully",
      data: project,
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
// @access  Private (HOD+)
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

  // HOD can edit projects they manage or in their department
  if (user.role.level >= 700) {
    return (
      project.projectManager.toString() === user._id.toString() ||
      project.createdBy.toString() === user._id.toString() ||
      project.company.toString() === user.company.toString()
    );
  }

  // STAFF can only edit projects they manage
  if (user.role.level >= 300) {
    return project.projectManager.toString() === user._id.toString();
  }

  return false;
};

// Check if user can delete project
const checkProjectDeleteAccess = async (user, project) => {
  // SUPER_ADMIN can delete everything
  if (user.role.level >= 1000) return true;

  // HOD can delete projects they created or manage
  if (user.role.level >= 700) {
    return (
      project.createdBy.toString() === user._id.toString() ||
      project.projectManager.toString() === user._id.toString()
    );
  }

  return false;
};
