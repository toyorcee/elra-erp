import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import TeamMember from "../models/TeamMember.js";
import Document from "../models/Document.js";
import DocumentTemplate from "../models/DocumentTemplate.js";
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
    if (currentUser.role.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and above can create projects.",
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
        { createdBy: currentUser._id },
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

    console.log(
      "🔍 [PROJECT] ELRA Regulatory Authority - All departments can create any project type"
    );
    console.log(`   User Department: ${currentUser.department?.name}`);
    console.log(`   Requested Category: ${req.body.category}`);
    console.log(
      "   ✅ [PROJECT] ELRA allows all departments to create any project category"
    );

    // Set budget threshold based on budget amount
    const budgetThreshold = getBudgetThreshold(
      req.body.budget,
      currentUser.department?.name
    );

    // Get required documents for this project using DocumentTemplate with dynamic triggers
    const documentTemplates = await DocumentTemplate.getTemplatesForProject(
      req.body.category,
      req.body.budget,
      currentUser.role?.name || "HOD",
      budgetThreshold === "hod_auto_approve"
        ? "department"
        : budgetThreshold === "finance_approval"
        ? "finance"
        : "executive"
    );

    // Map templates to required documents format expected by Project model
    const requiredDocuments = documentTemplates.map((template) => ({
      documentType: template.templateType,
      isRequired: template.triggers?.isRequired !== false,
      isSubmitted: false,
    }));

    // Super Admin auto-approval logic
    let projectStatus = "pending_approval";
    if (currentUser.role.level === 1000) {
      projectStatus = "approved";
      console.log("👑 [PROJECTS] Super Admin creating project - Auto-approved");
    } else if (budgetThreshold === "hod_auto_approve") {
      projectStatus = "approved";
      console.log("✅ [PROJECTS] HOD auto-approval for budget ≤ 1M");
    }
    // Note: Finance HOD projects > 1M will go through normal approval chain (Executive approval)

    const projectData = {
      ...req.body,
      createdBy: currentUser._id,
      department: currentUser.department,
      budgetThreshold,
      requiredDocuments,
      status: projectStatus,
    };

    if (currentUser.role.level === 700 && currentUser.department) {
      console.log(
        "🔍 [PROJECTS] HOD creating project for department:",
        currentUser.department.name
      );
    }

    const project = new Project(projectData);

    if (projectStatus === "pending_approval") {
      await project.generateApprovalChain();

      if (project.approvalChain && project.approvalChain.length > 0) {
        const hodStep = project.approvalChain[0];
        if (hodStep.level === "hod" && hodStep.status === "pending") {
          if (
            currentUser.role.level === 700 &&
            currentUser.department &&
            currentUser.department._id.toString() ===
              hodStep.department.toString()
          ) {
            console.log(
              "✅ [AUTO-APPROVE] Auto-approving HOD step for project creator"
            );

            hodStep.status = "approved";
            hodStep.approver = currentUser._id;
            hodStep.comments = "Auto-approved by project creator (HOD)";
            hodStep.approvedAt = new Date();

            const nextPendingStep = project.approvalChain.find(
              (step) => step.status === "pending"
            );
            if (nextPendingStep) {
              switch (nextPendingStep.level) {
                case "finance":
                  project.status = "pending_finance_approval";
                  break;
                case "executive":
                  project.status = "pending_executive_approval";
                  break;
                default:
                  project.status = "pending_approval";
              }
            } else {
              // All approvals complete
              project.status = "approved";
            }

            await project.save();
            console.log(
              "✅ [AUTO-APPROVE] HOD step auto-approved successfully"
            );
          }
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

            if (nextApproval.level === "finance") {
              // Find Finance HOD by department ObjectId
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
                  `🔍 [DEBUG] Finance HOD query: role=${hodRole._id}, dept=${financeDept._id}`
                );
              }
            } else if (nextApproval.level === "executive") {
              // Find Executive HOD by department ObjectId
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
                  `🔍 [DEBUG] Executive HOD query: role=${hodRole._id}, dept=${execDept._id}`
                );
              }
            }

            console.log("🔍 [DEBUG] Checking for approvers...");
            console.log("🔍 [DEBUG] Approver query:", approverQuery);

            if (Object.keys(approverQuery).length > 0) {
              const approver = await User.findOne(approverQuery).populate(
                "department"
              );
              console.log(
                "🔍 [DEBUG] Found approver:",
                approver ? `${approver.firstName} ${approver.lastName}` : "None"
              );

              if (approver) {
                // Notify approver
                await notificationService.createNotification({
                  recipient: approver._id,
                  type: "project_approval_required",
                  title: "Project Approval Required",
                  message: `You have a pending ${
                    nextApproval.level
                  } approval for project: ${project.name} (${formatCurrency(
                    project.budget
                  )})`,
                  priority: "high",
                  data: {
                    projectId: project._id,
                    projectName: project.name,
                    approvalLevel: nextApproval.level,
                    amount: project.budget,
                    creatorDepartment: currentUser.department?.name,
                    creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
                    actionUrl: "/dashboard/modules/projects",
                  },
                });
                console.log(
                  `📧 [SMART NOTIFICATION] Sent to ${approver.firstName} ${approver.lastName} (${approver.department?.name}) for ${nextApproval.level} approval`
                );

                // Notify the project creator that their project has been sent for approval
                await notificationService.createNotification({
                  recipient: currentUser._id,
                  type: "project_sent_for_approval",
                  title: "Project Sent for Approval",
                  message: `Your project "${project.name}" has been sent for ${nextApproval.level} approval to ${approver.department?.name}`,
                  priority: "medium",
                  data: {
                    projectId: project._id,
                    projectName: project.name,
                    approvalLevel: nextApproval.level,
                    amount: project.budget,
                    approverDepartment: approver.department?.name,
                    approverName: `${approver.firstName} ${approver.lastName}`,
                    estimatedApprovalTime: "2-3 business days",
                    actionUrl: "/dashboard/modules/projects",
                  },
                });
                console.log(
                  `📧 [CREATOR NOTIFICATION] Sent to ${currentUser.firstName} ${currentUser.lastName} - project sent for ${nextApproval.level} approval`
                );
              }
            }
          } catch (notifError) {
            console.error(
              "❌ [SMART NOTIFICATION] Error sending notification:",
              notifError
            );
          }
        }
      }
    } else {
      console.log(
        "🚀 [PROJECTS] Skipping approval chain - Project auto-approved"
      );
      console.log("🔍 [DEBUG] About to send auto-approval notification...");

      // Notify the project creator that their project was auto-approved
      try {
        await notificationService.createNotification({
          recipient: currentUser._id,
          type: "project_auto_approved",
          title: "Project Auto-Approved",
          message: `Your project "${project.name}" has been automatically approved and is ready for implementation.`,
          priority: "medium",
          data: {
            projectId: project._id,
            projectName: project.name,
            amount: project.budget,
            approvalType: "auto",
            nextSteps: "Project is ready for implementation phase",
            actionUrl: "/dashboard/modules/projects",
          },
        });
        console.log(
          `📧 [CREATOR NOTIFICATION] Sent auto-approval notification to ${currentUser.firstName} ${currentUser.lastName}`
        );
      } catch (notifError) {
        console.error(
          "❌ [AUTO-APPROVAL NOTIFICATION] Error sending notification:",
          notifError
        );
      }
    }

    // Set the user for audit logging
    project._createdBy = currentUser;

    await project.save();

    // Audit logging for project creation
    try {
      await ProjectAuditService.logProjectCreated(project, currentUser);
    } catch (error) {
      console.error("❌ [AUDIT] Error logging project creation:", error);
    }

    // Auto-assign project manager to team members if project manager is selected
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

    // Create approval request for project creation (skip for Super Admin)
    if (projectStatus === "pending_approval") {
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
        console.log(
          `   Name: ${currentUser.firstName} ${currentUser.lastName}`
        );
        console.log(
          `   Role: ${currentUser.role?.name} (Level: ${currentUser.role?.level})`
        );
        console.log(`   Department: ${currentUser.department?.name}`);
        console.log(`   Email: ${currentUser.email}`);

        const projectApprovalChain = project.approvalChain;

        const approvalChain = projectApprovalChain.map((step, index) => {
          let levelNumber = index + 1;
          let role = "DEPARTMENT_MANAGER";

          if (step.level === "hod") {
            levelNumber = 1;
            role = "DEPARTMENT_MANAGER";
          } else if (step.level === "finance") {
            levelNumber = 2;
            role = "DEPARTMENT_APPROVER";
          } else if (step.level === "executive") {
            levelNumber = 3;
            role = "EXECUTIVE_APPROVER";
          }

          return {
            level: levelNumber,
            role: role,
            department: step.department,
            status: step.status || "pending",
            required: step.required || true,
            approver: step.approver || null,
          };
        });

        console.log("📋 [APPROVAL] Generated Approval Chain:");
        console.log(`   Total Levels: ${approvalChain.length}`);
        approvalChain.forEach((level, index) => {
          console.log(
            `   Level ${index + 1}: ${level.role} (Level ${level.level})`
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
          if (approvalChain.length > 0 && approvalChain[0].approver) {
            await notificationService.createNotification({
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
          console.error(
            "❌ [APPROVAL] Error sending notification:",
            notifError
          );
        }

        console.log(`📋 [APPROVAL] Project status: ${project.status}`);

        console.log("🎯 [APPROVAL] Approval workflow completed successfully");
        console.log("🚀 [APPROVAL] ========================================");
      } catch (error) {
        console.error("❌ [APPROVAL] Error creating approval request:", error);
        console.error("❌ [APPROVAL] Error details:", error.message);
      }
    } else {
      console.log(
        "👑 [APPROVAL] Skipping approval creation - Super Admin auto-approval"
      );
    }

    // Create required documents for the project
    try {
      console.log("📄 [DOCUMENTS] Creating required documents for project");
      console.log(`   Project: ${project.name} (${project.code})`);
      console.log(`   Required Documents: ${documentTemplates?.length || 0}`);

      if (documentTemplates && documentTemplates.length > 0) {
        const createdDocuments = [];

        for (const template of documentTemplates) {
          const generatedDoc = await template.generateDocument(
            project,
            currentUser
          );

          // Map template category to Document model category
          const mapCategory = (templateCategory) => {
            switch (templateCategory) {
              case "financial_document":
                return "financial";
              case "legal_document":
                return "legal";
              case "technical_document":
                return "technical";
              case "administrative_document":
                return "administrative";
              case "project_document":
                return "project";
              default:
                return "other";
            }
          };

          const document = new Document({
            title: generatedDoc.title,
            documentType: template.templateType,
            category: mapCategory(template.category),
            project: project._id,
            department: currentUser.department?._id,
            createdBy: currentUser._id,
            status: "draft",
            fileName: `${template.templateType}_${project.code}.docx`,
            originalFileName: `${template.templateType}_${project.code}.docx`,
            fileUrl: `/documents/generated/${template.templateType}_${project.code}.docx`,
            fileSize: 1024, // Default size for generated documents
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            description: `Required document for project ${project.code}: ${template.name}`,
            metadata: {
              projectCode: project.code,
              projectCategory: project.category,
              projectBudget: project.budget,
              templateId: template._id,
              templateVersion: template.version,
              generatedContent: generatedDoc.content,
            },
          });

          await document.save();
          createdDocuments.push(document);

          console.log(`   ✅ Created: ${document.title}`);
        }

        console.log(
          `📄 [DOCUMENTS] Successfully created ${createdDocuments.length} documents`
        );

        // Log document creation in audit
        try {
          await ProjectAuditService.logDocumentCreated(
            project,
            currentUser,
            createdDocuments.length
          );
        } catch (auditError) {
          console.error(
            "❌ [AUDIT] Error logging document creation:",
            auditError
          );
        }
      } else {
        console.log("📄 [DOCUMENTS] No required documents for this project");
      }
    } catch (docError) {
      console.error(
        "❌ [DOCUMENTS] Error creating project documents:",
        docError
      );
      // Don't fail the project creation if document creation fails
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

// ============================================================================
// APPROVAL WORKFLOW FUNCTIONS
// ============================================================================

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

    // Check if this was the final approval and trigger post-approval workflow
    if (project.status === "approved") {
      console.log(
        "🎯 [APPROVAL] Final approval received - triggering post-approval workflow"
      );
      try {
        await project.triggerPostApprovalWorkflow(currentUser._id);
        console.log(
          "✅ [APPROVAL] Post-approval workflow triggered successfully"
        );
      } catch (workflowError) {
        console.error(
          "❌ [APPROVAL] Error triggering post-approval workflow:",
          workflowError
        );
        // Don't fail the approval if workflow fails
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
        comments: comments || "No comments provided",
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
        ],
      },
      isActive: true,
    };

    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [PROJECT APPROVALS] Super Admin - showing all pending approvals"
      );
    } else if (currentUser.role.level >= 700) {
      console.log("🔍 [PROJECT APPROVALS] HOD - showing all pending approvals");
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

    res.status(200).json({
      success: true,
      data: projects,
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
// @access  Private (HOD+)
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
          "Access denied. You don't have permission to view this project's audit trail.",
      });
    }

    // Get audit trail
    const auditTrail = await ProjectAuditService.getProjectAuditTrail(
      project._id
    );

    res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.name,
        projectCode: project.code,
        auditTrail: auditTrail,
      },
    });
  } catch (error) {
    console.error("Error getting project audit trail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get project audit trail",
      error: error.message,
    });
  }
};

// @desc    Get my project tasks
// @route   GET /api/projects/my-tasks
// @access  Private
export const getMyProjectTasks = async (req, res) => {
  try {
    const currentUser = req.user;

    // Find tasks assigned to the current user
    const tasks = await Task.find({
      assignedTo: currentUser._id,
      isActive: true,
    })
      .populate("project", "name code category budget department")
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        tasks: tasks,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter((t) => t.status === "pending").length,
        completedTasks: tasks.filter((t) => t.status === "completed").length,
        overdueTasks: tasks.filter((t) => t.status === "overdue").length,
      },
    });
  } catch (error) {
    console.error("Error getting my project tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get project tasks",
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

// @desc    Update task status
// @route   PUT /api/projects/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUser = req.user;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this task",
      });
    }

    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();

    await task.save();

    // Log the status change
    try {
      await ProjectAuditService.logTaskStatusChanged(
        task,
        currentUser,
        oldStatus,
        status
      );
    } catch (error) {
      console.error("Error logging task status change:", error);
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: {
        task: task,
        oldStatus: oldStatus,
        newStatus: status,
      },
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
};
