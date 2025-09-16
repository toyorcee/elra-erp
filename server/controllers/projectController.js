import mongoose from "mongoose";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import TeamMember from "../models/TeamMember.js";
import Approval from "../models/Approval.js";
import Vendor from "../models/Vendor.js";
import { checkDepartmentAccess } from "../middleware/auth.js";
import NotificationService from "../services/notificationService.js";
import ProjectAuditService from "../services/projectAuditService.js";
import emailService from "../services/emailService.js";
import { generateVendorReceiptPDF } from "../utils/pdfUtils.js";

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

// Helper function to format approval level text
const formatApprovalLevel = (level) => {
  if (!level) return level;
  return level.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
const getBudgetThreshold = (
  budget,
  departmentName,
  requiresBudgetAllocation
) => {
  // For projects with budget allocation, use the new logic
  if (requiresBudgetAllocation === true) {
    if (budget < 5000000) {
      return "legal_finance_approval";
    } else {
      return "executive_approval";
    }
  }

  // For self-funded projects, use the old logic
  if (budget <= 1000000) return "hod_auto_approve";

  if (budget <= 5000000) {
    // For Finance department, skip finance approval
    if (departmentName === "Finance & Accounting") {
      return "executive_approval";
    }
    return "project_management_approval";
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
// @route   GET /api/projects
// @access  Private (VIEWER+)
export const getAllProjects = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = { isActive: true };

    // SUPER_ADMIN (1000) - see all projects across all departments
    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [PROJECTS] Super Admin - showing all projects across all departments"
      );
      // No additional filters needed - see everything
    } else {
      // Non-SUPER_ADMIN users - apply role-based filtering
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view projects",
        });
      }

      if (currentUser.role.level >= 700) {
        // HOD (700+) - see personal and departmental projects from their department
        const isProjectManagementDepartment =
          currentUser.department?.name === "Project Management";
        const isProcurementDepartment =
          currentUser.department?.name === "Procurement";

        if (isProjectManagementDepartment) {
          query.$or = [
            { projectScope: "personal", createdBy: currentUser._id },
            {
              projectScope: "departmental",
              department: currentUser.department,
            },
            {
              projectScope: "external",
              department: currentUser.department,
            },
          ];
          console.log(
            `🔍 [PROJECTS] Project Management HOD - showing personal, departmental, and external projects from department: ${currentUser.department.name}`
          );
        } else if (isProcurementDepartment) {
          // Procurement HOD can see ALL projects for creating POs
          console.log(
            `🔍 [PROJECTS] Procurement HOD - showing ALL projects for procurement purposes`
          );
        } else {
          // ALL other HODs can see personal and departmental projects from their department
          query.$or = [
            { projectScope: "personal", createdBy: currentUser._id },
            {
              projectScope: "departmental",
              department: currentUser.department,
            },
          ];
          console.log(
            `🔍 [PROJECTS] ${currentUser.role.name} - showing personal and departmental projects from department: ${currentUser.department.name}`
          );
        }
      } else if (currentUser.role.level >= 600) {
        // MANAGER (600) - see personal and departmental projects from their department
        query.$or = [
          { projectScope: "personal", createdBy: currentUser._id },
          {
            projectScope: "departmental",
            department: currentUser.department,
          },
        ];
        console.log(
          `🔍 [PROJECTS] ${currentUser.role.name} - showing personal and departmental projects from department: ${currentUser.department.name}`
        );
      } else {
        query.$or = [
          { projectScope: "personal", createdBy: currentUser._id },
          {
            projectScope: "departmental",
            department: currentUser.department,
          },
        ];
        console.log(
          `🔍 [PROJECTS] ${currentUser.role.name} - showing personal projects created by user and all departmental projects from department: ${currentUser.department.name}`
        );
      }
    }

    const projects = await Project.find(query)
      .populate("projectManager", "firstName lastName email")
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
// @access  Private (STAFF+)
export const createProject = async (req, res) => {
  try {
    const currentUser = req.user;

    if (currentUser.role.level < 300) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only STAFF and above can create projects.",
      });
    }

    // Validate that frontend is not trying to set status (security measure)
    if (req.body.status) {
      return res.status(400).json({
        success: false,
        message:
          "Project status is managed by the system and cannot be set by users",
        errors: ["Status field should not be sent from frontend"],
        fieldErrors: {
          status: "Status is managed by backend workflow system",
        },
      });
    }

    const requiredFields = [
      "name",
      "category",
      "budget",
      "startDate",
      "endDate",
    ];

    // Description is only required for non-external projects
    if (req.body.projectScope !== "external") {
      requiredFields.push("description");
    }

    // Add budget allocation requirement for personal/departmental projects
    if (req.body.projectScope !== "external") {
      if (
        req.body.requiresBudgetAllocation === undefined ||
        req.body.requiresBudgetAllocation === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Budget allocation option is required for personal/departmental projects",
          errors: [
            "Budget allocation option is required for personal/departmental projects",
          ],
          fieldErrors: {
            requiresBudgetAllocation:
              "Budget allocation option is required for personal/departmental projects",
          },
        });
      }
    }

    // Add project items requirements for external projects
    if (req.body.projectScope === "external") {
      // Validate project items
      if (
        !req.body.projectItems ||
        !Array.isArray(req.body.projectItems) ||
        req.body.projectItems.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Project items are required for external projects",
          errors: [
            "At least one project item is required for external projects",
          ],
          fieldErrors: {
            projectItems: "Project items are required for external projects",
          },
        });
      }

      // Validate each project item
      req.body.projectItems.forEach((item, index) => {
        if (
          !item.name ||
          !item.quantity ||
          !item.unitPrice ||
          !item.deliveryTimeline
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid project item data",
            errors: [
              `Item ${
                index + 1
              }: Missing required fields (name, quantity, unitPrice, deliveryTimeline)`,
            ],
            fieldErrors: {
              [`projectItems.${index}`]: "Missing required fields",
            },
          });
        }
      });

      // Validate total items cost doesn't exceed budget
      const totalItemsCost = req.body.projectItems.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      );
      const projectBudget = parseFloat(req.body.budget) || 0;
      if (totalItemsCost > projectBudget) {
        return res.status(400).json({
          success: false,
          message: "Project items cost exceeds budget",
          errors: ["Total project items cost cannot exceed project budget"],
          fieldErrors: { projectItems: "Items cost exceeds budget" },
        });
      }

      // Validate vendor information for external projects
      if (!req.body.vendorName || !req.body.vendorName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Vendor information is required for external projects",
          errors: ["Vendor name is required for external projects"],
          fieldErrors: { vendorName: "Vendor name is required" },
        });
      }

      // Email validation (optional)
      if (req.body.vendorEmail && req.body.vendorEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.vendorEmail)) {
          return res.status(400).json({
            success: false,
            message: "Invalid vendor email format",
            errors: ["Please enter a valid vendor email address"],
            fieldErrors: { vendorEmail: "Invalid email format" },
          });
        }
      }
    }

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

    // Vendor validation is handled in the vendor creation/finding logic above

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

    // Role-based project scope validation
    console.log(
      "🔍 [PROJECT] ELRA Regulatory Authority - Project creation validation"
    );
    console.log(`   User Department: ${currentUser.department?.name}`);
    console.log(`   User Role Level: ${currentUser.role.level}`);
    console.log(`   Requested Project Scope: ${projectScope}`);

    // Validate project scope based on user role
    const isProjectManagementDepartment =
      currentUser.department?.name === "Project Management";

    let allowedScopes = [];

    if (currentUser.role.level >= 1000) {
      // SUPER_ADMIN can create all types
      allowedScopes = ["personal", "departmental", "external"];
    } else if (currentUser.role.level >= 700 && isProjectManagementDepartment) {
      // Project Management HOD can create personal, departmental, and external projects
      allowedScopes = ["personal", "departmental", "external"];
    } else if (currentUser.role.level >= 700) {
      // ALL HODs can create personal and departmental projects
      allowedScopes = ["personal", "departmental"];
    } else if (currentUser.role.level >= 600) {
      // MANAGER can create personal and departmental projects
      allowedScopes = ["personal", "departmental"];
    } else if (currentUser.role.level >= 300) {
      // STAFF can only create personal projects
      allowedScopes = ["personal"];
    }

    if (!allowedScopes.includes(projectScope)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only create ${allowedScopes.join(
          ", "
        )} projects.`,
        errors: [
          `You don't have permission to create ${projectScope} projects`,
        ],
        fieldErrors: {
          projectScope: `You don't have permission to create ${projectScope} projects`,
        },
      });
    }

    console.log(
      "   ✅ [PROJECT] ELRA allows all departments to create any project category"
    );

    // Set budget threshold based on budget amount
    const budgetThreshold = getBudgetThreshold(
      req.body.budget,
      currentUser.department?.name,
      req.body.requiresBudgetAllocation
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

    let projectStatus = "pending_approval";

    if (currentUser.role.level === 1000) {
      projectStatus = "approved";
    } else if (budgetThreshold === "hod_auto_approve") {
      // For personal/departmental projects, check if budget allocation is required
      if (req.body.projectScope !== "external") {
        if (req.body.requiresBudgetAllocation === false) {
          // No budget allocation needed - but personal projects still need approval workflow
          if (req.body.projectScope === "personal") {
            projectStatus = "pending_approval";
            console.log(
              `⏸️ [PROJECT STATUS] Pending approval: Personal project with no budget allocation (budget: ${req.body.budget}) - needs HOD + Project Management approval`
            );
          } else {
            // Departmental projects with no budget allocation can be auto-approved
            projectStatus = "approved";
            console.log(
              `✅ [PROJECT STATUS] Auto-approved: Departmental project with no budget allocation (budget: ${req.body.budget})`
            );
          }
        } else {
          // Budget allocation required - go through approval workflow
          projectStatus = "pending_approval";
        }
      } else {
        // External projects always need approval
        projectStatus = "pending_approval";
      }
    } else {
      // For budgets >₦1M, also check budget allocation for personal/departmental projects
      if (req.body.projectScope !== "external") {
        if (req.body.requiresBudgetAllocation === false) {
          if (req.body.projectScope === "personal") {
            projectStatus = "pending_approval";
            console.log(
              `⏸️ [PROJECT STATUS] Pending approval: Personal project with no budget allocation (budget: ${req.body.budget}) - needs HOD + Project Management approval`
            );
          } else {
            // Departmental projects with no budget allocation can be auto-approved
            projectStatus = "approved";
            console.log(
              `✅ [PROJECT STATUS] Auto-approved: Departmental project with no budget allocation (budget: ${req.body.budget})`
            );
          }
        } else {
          // Budget allocation required - go through approval workflow
          projectStatus = "pending_approval";
          console.log(
            `⏸️ [PROJECT STATUS] Pending approval: ${req.body.projectScope} project with budget allocation (budget: ${req.body.budget})`
          );
        }
      } else {
        // External projects always need approval
        projectStatus = "pending_approval";
        console.log(
          `⏸️ [PROJECT STATUS] Pending approval: External project (budget: ${req.body.budget})`
        );
      }
    }

    console.log(`🎯 [PROJECT STATUS] Final status: ${projectStatus}`);
    console.log(
      `🔍 [PROJECT SCOPE] Requested scope: ${req.body.projectScope}, Budget allocation: ${req.body.requiresBudgetAllocation}`
    );

    // Validate project manager assignment based on role hierarchy and department
    let projectManager = req.body.projectManager || currentUser._id;

    // If a specific project manager is provided, validate the assignment
    if (
      req.body.projectManager &&
      req.body.projectManager !== currentUser._id.toString()
    ) {
      const assignedManager = await User.findById(req.body.projectManager)
        .populate("role")
        .populate("department");

      if (!assignedManager) {
        return res.status(400).json({
          success: false,
          message: "Invalid project manager selected",
          errors: ["Selected project manager does not exist"],
          fieldErrors: {
            projectManager: "Selected project manager does not exist",
          },
        });
      }

      // Check role hierarchy - users can only assign managers at their level or below
      if (assignedManager.role.level > currentUser.role.level) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
          errors: [
            "You can only assign project managers at your level or below",
          ],
          fieldErrors: {
            projectManager:
              "You can only assign project managers at your level or below",
          },
        });
      }

      // Check department access for departmental projects
      if (projectScope === "departmental") {
        if (
          !assignedManager.department ||
          assignedManager.department._id.toString() !==
            currentUser.department._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: "Access denied",
            errors: [
              "You can only assign project managers from your department for departmental projects",
            ],
            fieldErrors: {
              projectManager:
                "You can only assign project managers from your department",
            },
          });
        }
      }

      // Special case for external projects - Project Management HOD can assign Project Management department managers
      if (projectScope === "external") {
        const isProjectManagementDepartment =
          currentUser.department?.name === "Project Management";

        const isUserFromProjectManagementDepartment =
          assignedManager.department?.name === "Project Management";

        // Project Management HOD can assign themselves or Project Management department users at levels 700, 600, 300
        if (isProjectManagementDepartment && currentUser.role.level === 700) {
          if (!isUserFromProjectManagementDepartment) {
            return res.status(403).json({
              success: false,
              message: "Access denied",
              errors: [
                "For external projects, you can only assign project managers from the Project Management department",
              ],
              fieldErrors: {
                projectManager:
                  "You can only assign Project Management department managers for external projects",
              },
            });
          }

          // Check if assigned manager has appropriate role level (700, 600, 300)
          if (![700, 600, 300].includes(assignedManager.role.level)) {
            return res.status(403).json({
              success: false,
              message: "Access denied",
              errors: [
                "For external projects, you can only assign HR department managers at levels 700, 600, or 300",
              ],
              fieldErrors: {
                projectManager:
                  "You can only assign HR managers at levels 700, 600, or 300",
              },
            });
          }
        } else {
          // Non-HR users cannot assign project managers for external projects
          return res.status(403).json({
            success: false,
            message: "Access denied",
            errors: [
              "Only HR HOD can assign project managers for external projects",
            ],
            fieldErrors: {
              projectManager:
                "Only HR HOD can assign project managers for external projects",
            },
          });
        }
      }

      // For personal projects, users can only assign themselves
      if (
        projectScope === "personal" &&
        req.body.projectManager !== currentUser._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
          errors: [
            "You can only assign yourself as project manager for personal projects",
          ],
          fieldErrors: {
            projectManager:
              "You can only assign yourself for personal projects",
          },
        });
      }
    }

    let vendorId = null;
    if (projectScope === "external" && req.body.vendorName) {
      try {
        let vendor = await Vendor.findOne({
          name: { $regex: new RegExp(req.body.vendorName, "i") },
        });

        if (!vendor) {
          // Create vendor with proper data handling
          const vendorData = {
            name: req.body.vendorName,
            contactPerson: "To be updated",
            address: {
              street: "To be updated",
              city: "To be updated",
              state: "To be updated",
              country: "Nigeria",
            },
            servicesOffered: [req.body.vendorCategory || "other"],
            status: "pending",
            createdBy: currentUser._id,
          };

          // Add email and phone only if provided
          if (req.body.vendorEmail && req.body.vendorEmail.trim()) {
            vendorData.email = req.body.vendorEmail.trim().toLowerCase();
            console.log(`📧 [VENDOR] Email provided: ${vendorData.email}`);
          } else {
            console.log(`📧 [VENDOR] No email provided - will use placeholder`);
          }

          if (req.body.vendorPhone && req.body.vendorPhone.trim()) {
            vendorData.phone = req.body.vendorPhone.trim();
            console.log(`📞 [VENDOR] Phone provided: ${vendorData.phone}`);
          } else {
            console.log(`📞 [VENDOR] No phone provided - will use placeholder`);
          }

          vendor = new Vendor(vendorData);

          await vendor.save();
          console.log(
            `🏢 [VENDOR] Created new vendor: ${vendor.name} (ID: ${vendor._id})`
          );
          console.log(`📋 [VENDOR] Details:`, {
            name: vendor.name,
            email: vendor.email || "Not provided",
            phone: vendor.phone || "Not provided",
            services: vendor.servicesOffered,
            status: vendor.status,
          });
        } else {
          console.log(
            `🏢 [VENDOR] Found existing vendor: ${vendor.name} (ID: ${vendor._id})`
          );
        }

        try {
          // Fetch project manager name if ID is provided
          let projectManagerName = "Not assigned";
          if (
            req.body.projectManager &&
            req.body.projectManager !== "Not assigned"
          ) {
            try {
              const projectManager = await User.findById(
                req.body.projectManager
              ).select("firstName lastName");
              if (projectManager) {
                projectManagerName = `${projectManager.firstName} ${projectManager.lastName}`;
              }
            } catch (error) {
              console.log(
                "⚠️ Could not fetch project manager name:",
                error.message
              );
              projectManagerName = req.body.projectManager; // Fallback to ID
            }
          }

          const projectData = {
            name: req.body.name,
            budget: parseFloat(req.body.budget),
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            projectItems: req.body.projectItems || [],
            category: req.body.category || "Not specified",
            projectManager: projectManagerName,
            priority: req.body.priority || "medium",
            projectScope: req.body.projectScope || "external",
            requiresBudgetAllocation:
              req.body.requiresBudgetAllocation || false,
            vendorCategory: req.body.vendorCategory || "Not specified",
          };

          // Debug logging for budget allocation
          console.log("🔍 [PDF DEBUG] Budget allocation data:");
          console.log(
            "  - req.body.requiresBudgetAllocation:",
            req.body.requiresBudgetAllocation
          );
          console.log(
            "  - projectData.requiresBudgetAllocation:",
            projectData.requiresBudgetAllocation
          );
          console.log("  - Type:", typeof projectData.requiresBudgetAllocation);

          console.log(
            `📄 [VENDOR PDF] Generating receipt for vendor: ${vendor.name}`
          );
          const pdfBuffer = await generateVendorReceiptPDF(vendor, projectData);
          console.log(`📄 [VENDOR PDF] Receipt generated successfully`);

          // Only send email if vendor has an email address
          if (vendor.email && vendor.email.trim()) {
            console.log(
              `📧 [VENDOR EMAIL] Sending notification to: ${vendor.email}`
            );
            const emailResult = await emailService.sendVendorNotificationEmail(
              vendor,
              projectData,
              pdfBuffer
            );

            if (emailResult.success) {
              console.log(
                `📧 [VENDOR EMAIL] ✅ Welcome email with PDF sent successfully to ${vendor.email}`
              );
            } else {
              console.error(
                `📧 [VENDOR EMAIL] ❌ Failed to send email to ${vendor.email}: ${emailResult.error}`
              );
            }
          } else {
            console.log(
              `📧 [VENDOR EMAIL] ⚠️ No email address provided - skipping email notification`
            );
          }
        } catch (emailError) {
          console.error("❌ [VENDOR EMAIL] Failed to send email:", emailError);
        }

        vendorId = vendor._id;
      } catch (error) {
        console.error("❌ [VENDOR] Error handling vendor:", error);
        return res.status(400).json({
          success: false,
          message: "Error processing vendor information",
          errors: ["Failed to process vendor data"],
        });
      }
    }

    const projectData = {
      ...req.body,
      projectManager,
      createdBy: currentUser._id,
      department: currentUser.department,
      budgetThreshold,
      requiredDocuments,
      status: projectStatus,
      vendorId: vendorId, // Set the vendor ID for external projects
    };

    const project = new Project(projectData);
    console.log(
      `🔍 [PROJECT CREATED] Scope: ${project.projectScope}, Status: ${project.status}`
    );

    // Only generate approval chain if project needs approval
    if (projectStatus === "pending_approval") {
      await project.generateApprovalChain();

      if (project.approvalChain && project.approvalChain.length > 0) {
        // Auto-approve steps where the creator is the approver
        let hasAutoApproved = false;

        for (let i = 0; i < project.approvalChain.length; i++) {
          const step = project.approvalChain[i];

          if (step.status === "pending") {
            let shouldAutoApprove = false;

            // Auto-approve logic based on project scope and creator's department
            const creatorDepartment = currentUser.department?.name;
            const isCreatorHOD = currentUser.role.level === 700;

            if (project.projectScope === "personal") {
              // Personal projects: Auto-approve if creator is from approval department
              if (
                step.level === "finance" &&
                creatorDepartment === "Finance & Accounting"
              ) {
                shouldAutoApprove = true;
              } else if (
                step.level === "executive" &&
                creatorDepartment === "Executive Office"
              ) {
                shouldAutoApprove = true;
              }
            } else if (project.projectScope === "departmental") {
              // Departmental projects: Auto-approve HOD step if creator is HOD of same department
              if (step.level === "hod") {
                shouldAutoApprove =
                  isCreatorHOD &&
                  currentUser.department &&
                  (currentUser.department._id?.toString() ===
                    step.department.toString() ||
                    currentUser.department.toString() ===
                      step.department.toString());
              } else if (
                step.level === "finance" &&
                creatorDepartment === "Finance & Accounting"
              ) {
                shouldAutoApprove = true;
              } else if (
                step.level === "executive" &&
                creatorDepartment === "Executive Office"
              ) {
                shouldAutoApprove = true;
              }
            } else if (project.projectScope === "external") {
              // External projects: Auto-approve if creator is from approval department
              const isProjectManagementDepartment =
                currentUser.department?.name === "Project Management";

              if (step.level === "hod") {
                shouldAutoApprove =
                  isCreatorHOD && isProjectManagementDepartment;
              } else if (
                step.level === "legal_compliance" &&
                creatorDepartment === "Legal & Compliance"
              ) {
                shouldAutoApprove = true;
              } else if (
                step.level === "finance" &&
                creatorDepartment === "Finance & Accounting"
              ) {
                shouldAutoApprove = true;
              } else if (
                step.level === "executive" &&
                creatorDepartment === "Executive Office"
              ) {
                shouldAutoApprove = true;
              }
            }

            if (shouldAutoApprove) {
              step.status = "approved";
              step.approver = currentUser._id;
              step.comments = `Auto-approved by project creator (${currentUser.department?.name} ${currentUser.role?.name})`;
              step.approvedAt = new Date();
              hasAutoApproved = true;
              console.log(
                `✅ [AUTO-APPROVE] Auto-approved ${step.level} step for ${currentUser.department?.name} ${currentUser.role?.name}`
              );
            } else {
              console.log(
                `⏸️ [AUTO-APPROVE] Stopping auto-approval at ${step.level} step - requires manual approval`
              );
              break;
            }
          }
        }

        if (hasAutoApproved) {
          const nextPendingStep = project.approvalChain.find(
            (step) => step.status === "pending"
          );

          console.log("🔍 [DEBUG] Next pending step:", nextPendingStep?.level);

          if (nextPendingStep) {
            switch (nextPendingStep.level) {
              case "project_management":
                project.status = "pending_project_management_approval";
                console.log(
                  "🔍 [DEBUG] Setting status to pending_project_management_approval"
                );
                break;
              case "legal_compliance":
                project.status = "pending_legal_compliance_approval";
                console.log(
                  "🔍 [DEBUG] Setting status to pending_legal_compliance_approval"
                );
                break;
              case "executive":
                project.status = "pending_executive_approval";
                console.log(
                  "🔍 [DEBUG] Setting status to pending_executive_approval"
                );
                break;
              case "finance":
                project.status = "pending_finance_approval";
                console.log(
                  "🔍 [DEBUG] Setting status to pending_finance_approval"
                );
                break;
              case "budget_allocation":
                project.status = "pending_budget_allocation";
                console.log(
                  "🔍 [DEBUG] Setting status to pending_budget_allocation"
                );
                break;
              default:
                project.status = "pending_approval";
                console.log(
                  "🔍 [DEBUG] Setting status to pending_approval (default)"
                );
            }
          } else {
            project.status = "approved";
            console.log(
              "🔍 [DEBUG] Setting status to approved (no pending steps)"
            );
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

                // Send notification to approver with special handling for Project Management HOD
                try {
                  // Special notification for Project Management HOD when PM staff create projects
                  const isProjectManagementHOD =
                    approver.department?.name === "Project Management";
                  const isCreatorFromPM =
                    currentUser.department?.name === "Project Management";
                  const isCreatorPMStaff =
                    isCreatorFromPM && currentUser.role.level < 700;

                  let notificationTitle = "Project Approval Required";
                  let notificationMessage = `A new ${project.projectScope} project "${project.name}" requires your approval.`;
                  let notificationType = "PROJECT_READY_FOR_APPROVAL";

                  if (isProjectManagementHOD && isCreatorPMStaff) {
                    notificationTitle =
                      "Project Management Staff Project - Approval Required";
                    notificationMessage = `A ${project.projectScope} project "${project.name}" created by Project Management staff (${currentUser.firstName} ${currentUser.lastName}) requires your approval. This project has been routed directly to you, skipping the department HOD approval step.`;
                    notificationType = "PROJECT_MANAGEMENT_STAFF_APPROVAL";
                    console.log(
                      `📧 [NOTIFICATION] Special PM HOD notification for PM staff project: ${project.name}`
                    );
                  }

                  await sendProjectNotification(req, {
                    recipient: approver._id,
                    type: notificationType,
                    title: notificationTitle,
                    message: notificationMessage,
                    data: {
                      projectId: project._id,
                      projectName: project.name,
                      projectCode: project.code,
                      approvalLevel: nextApproval.level,
                      projectScope: project.projectScope,
                      budget: project.budget,
                      category: project.category,
                      creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
                      creatorDepartment: currentUser.department?.name,
                      isSpecialPMCase:
                        isProjectManagementHOD && isCreatorPMStaff,
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

    // Handle auto-approved projects (no budget allocation needed)
    if (projectStatus === "approved") {
      // For auto-approved projects, set status to implementation and notify creator
      project.status = "implementation";
      await project.save();

      console.log(
        `✅ [PROJECT] Auto-approved project ${project.code} - moving directly to implementation`
      );

      // Notify project creator about auto-approval
      try {
        await sendProjectNotification(req, {
          recipient: currentUser._id,
          type: "project_auto_approved",
          title: "Project Auto-Approved",
          message: `Your ${project.projectScope} project "${project.name}" (${
            project.code
          }) has been auto-approved and is now in implementation phase. Budget and funds will be handled by ${
            project.projectScope === "personal" ? "you" : "your department"
          }.`,
          data: {
            projectId: project._id,
            projectName: project.name,
            projectCode: project.code,
            projectScope: project.projectScope,
            budget: project.budget,
            category: project.category,
            autoApprovedAt: new Date().toISOString(),
            actionUrl: `/dashboard/modules/projects/${project._id}`,
          },
        });

        console.log(
          `📧 [NOTIFICATION] Auto-approval notification sent to project creator`
        );
      } catch (notificationError) {
        console.error(
          "❌ [NOTIFICATION] Error sending auto-approval notification:",
          notificationError
        );
      }
    }

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

    // Only notify the project creator about pending approval if project is NOT auto-approved
    if (projectStatus === "pending_approval") {
      try {
        console.log(
          `📧 [CREATOR] Sending pending approval notification to creator`
        );
        await sendProjectNotification(req, {
          recipient: currentUser._id,
          type: "PROJECT_READY_FOR_APPROVAL",
          title: "Project Created Successfully",
          message: `Your project "${project.name}" (${project.code}) has been created successfully and is now pending approval. Please upload the required documents for approval.`,
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
    }

    // Notify department users for departmental projects (but not for personal projects)
    if (project.projectScope === "departmental") {
      try {
        console.log(
          `🔍 [DEPARTMENTAL] Looking for users in department: ${currentUser.department?.name} (${currentUser.department?._id})`
        );

        // Find all users in the same department (excluding the creator)
        const departmentUsers = await User.find({
          department: currentUser.department._id,
          _id: { $ne: currentUser._id }, // Exclude creator
          isActive: true,
        });

        console.log(
          `🔍 [DEPARTMENTAL] Found ${departmentUsers.length} users in department (excluding creator)`
        );
        departmentUsers.forEach((user) => {
          console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
        });

        // Send notification to all department users
        for (const user of departmentUsers) {
          try {
            await sendProjectNotification(req, {
              recipient: user._id,
              type: "DEPARTMENTAL_PROJECT_CREATED",
              title: "New Departmental Project Created",
              message: `A new departmental project "${project.name}" (${project.code}) has been created by ${currentUser.firstName} ${currentUser.lastName}.`,
              data: {
                projectId: project._id,
                projectName: project.name,
                projectCode: project.code,
                projectScope: project.projectScope,
                status: project.status,
                budget: project.budget,
                category: project.category,
                creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
                actionUrl: `/dashboard/modules/projects/${project._id}`,
              },
            });
            console.log(
              `📧 [NOTIFICATION] Departmental project notification sent to: ${user.firstName} ${user.lastName}`
            );
          } catch (userNotificationError) {
            console.error(
              `❌ [NOTIFICATION] Error sending notification to ${user.firstName}:`,
              userNotificationError
            );
          }
        }
      } catch (departmentNotificationError) {
        console.error(
          "❌ [NOTIFICATION] Error sending department notifications:",
          departmentNotificationError
        );
      }
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

  // For external projects, only Project Management HOD can edit
  if (project.projectScope === "external") {
    const isProjectManagementDepartment =
      user.department?.name === "Project Management";

    return user.role.level >= 700 && isProjectManagementDepartment;
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
      const isProjectManagementDepartment =
        currentUser.department?.name === "Project Management";

      if (!isProjectManagementDepartment || currentUser.role.level < 700) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only Project Management HOD can manage external project teams.",
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

    // Log progress after approval
    console.log(
      `📊 [PROGRESS] Project ${project.name} progress after ${level} approval: ${project.progress}%`
    );

    // Send notification to the approver confirming their approval
    try {
      const nextPendingStep = project.approvalChain.find(
        (step) => step.status === "pending"
      );

      let approverMessage = `You have successfully approved project "${
        project.name
      }" at ${formatApprovalLevel(level)} level.`;

      if (nextPendingStep) {
        if (
          nextPendingStep.level === "budget_allocation" &&
          currentUser.department?.name === "Finance & Accounting"
        ) {
          approverMessage += ` You can now proceed to allocate budget for this project.`;
        } else {
          // Normal case: different approver for next step
          let nextStage = "";
          switch (nextPendingStep.level) {
            case "project_management":
              nextStage = "Project Management HOD";
              break;
            case "legal_compliance":
              nextStage = "Legal & Compliance HOD";
              break;
            case "finance":
              nextStage = "Finance HOD";
              break;
            case "executive":
              nextStage = "Executive HOD";
              break;
            case "budget_allocation":
              nextStage = "Finance HOD for budget allocation";
              break;
            default:
              nextStage = "next approver";
          }
          approverMessage += ` The project has been forwarded to ${nextStage} for the next approval stage.`;
        }
      } else {
        approverMessage += ` The project has been fully approved and is ready for implementation.`;
      }

      await sendProjectNotification(req, {
        recipient: currentUser._id,
        type: "project_approval_confirmed",
        title: "Project Approval Confirmed",
        message: approverMessage,
        data: {
          projectId: project._id,
          projectName: project.name,
          approvalLevel: level,
          nextStage: nextPendingStep ? nextPendingStep.level : "completed",
        },
      });

      console.log(
        `📧 [APPROVER NOTIFICATION] Sent approval confirmation to ${currentUser.firstName} ${currentUser.lastName}`
      );
    } catch (error) {
      console.error(
        "❌ [APPROVER NOTIFICATION] Error sending approval confirmation:",
        error
      );
    }

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

    // Get next department name for creator notification
    let nextDepartmentName = "";
    const nextPendingStep = project.approvalChain.find(
      (step) => step.status === "pending"
    );

    if (nextPendingStep) {
      if (nextPendingStep.level === "legal_compliance") {
        nextDepartmentName = "Legal & Compliance";
      } else if (nextPendingStep.level === "finance") {
        nextDepartmentName = "Finance & Accounting";
      } else if (nextPendingStep.level === "executive") {
        nextDepartmentName = "Executive Office";
      } else if (nextPendingStep.level === "hod") {
        nextDepartmentName = project.department?.name || "Department HOD";
      }
    }

    // Send notification to project creator
    let creatorMessage = `Your project "${
      project.name
    }" has been approved at ${formatApprovalLevel(level)} level by ${
      currentUser.firstName
    } ${currentUser.lastName} (${currentUser.department?.name}).`;

    // Add next department information if there's a next step
    if (
      project.status !== "approved" &&
      project.status !== "pending_budget_allocation" &&
      nextDepartmentName
    ) {
      creatorMessage += ` Awaiting approval from ${nextDepartmentName}.`;
    } else if (project.status === "approved") {
      creatorMessage += ` Project fully approved and ready for implementation.`;
    } else if (project.status === "pending_budget_allocation") {
      creatorMessage += ` Project approved! Finance department will now allocate budget and initiate procurement.`;
    }

    await sendProjectNotification(req, {
      recipient: project.createdBy,
      type: "project_approved",
      title: "Project Approved",
      message: creatorMessage,
      data: {
        projectId: project._id,
        projectName: project.name,
        approvalLevel: level,
        approverName: `${currentUser.firstName} ${currentUser.lastName}`,
        approverDepartment: currentUser.department?.name,
        nextDepartment: nextDepartmentName,
        comments: comments || "No comments provided",
        approvedAt: new Date().toISOString(),
      },
    });

    // Send notification to next approver if there is one
    if (project.status !== "approved") {
      // Special case: Send budget allocation notification when status is pending_budget_allocation
      if (project.status === "pending_budget_allocation") {
        try {
          console.log(
            `🔍 [BUDGET ALLOCATION] Looking for Finance HOD for budget allocation`
          );

          const financeDept = await mongoose
            .model("Department")
            .findOne({ name: "Finance & Accounting" });

          const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });

          if (financeDept && hodRole) {
            const financeHOD = await User.findOne({
              role: hodRole._id,
              department: financeDept._id,
              isActive: true,
            }).populate("department");

            if (financeHOD) {
              const budgetAllocationMessage = `You have a pending budget allocation for project: ${
                project.name
              } (${formatCurrency(project.budget)})`;

              const notificationData = {
                recipient: financeHOD._id,
                type: "PROJECT_READY_FOR_APPROVAL",
                title: "Budget Allocation Required",
                message: budgetAllocationMessage,
                priority: "high",
                data: {
                  projectId: project._id,
                  projectName: project.name,
                  approvalLevel: "budget_allocation",
                  amount: project.budget,
                  creatorDepartment: project.department?.name,
                  creatorName: `${project.createdBy?.firstName} ${project.createdBy?.lastName}`,
                  actionUrl: "/dashboard/modules/finance",
                },
              };

              console.log(
                `📧 [BUDGET ALLOCATION NOTIFICATION] Creating notification:`,
                JSON.stringify(notificationData, null, 2)
              );

              await notificationService.createNotification(notificationData);

              console.log(
                `📧 [BUDGET ALLOCATION NOTIFICATION] Sent to ${financeHOD.firstName} ${financeHOD.lastName} (${financeHOD.department?.name}) for budget allocation`
              );
            } else {
              console.log(
                `❌ [BUDGET ALLOCATION] No Finance HOD found for budget allocation`
              );
            }
          }
        } catch (error) {
          console.error(
            "❌ [BUDGET ALLOCATION NOTIFICATION] Error sending budget allocation notification:",
            error
          );
        }
      } else {
        if (nextPendingStep) {
          try {
            console.log(
              `🔍 [NEXT APPROVER] Looking for approver for level: ${nextPendingStep.level}`
            );

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
                  isActive: true,
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
                  isActive: true,
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
                  isActive: true,
                };
              }
            } else if (nextPendingStep.level === "project_management") {
              const hodRole = await mongoose
                .model("Role")
                .findOne({ name: "HOD" });

              const projectManagementDept = await mongoose
                .model("Department")
                .findOne({ name: "Project Management" });

              if (projectManagementDept && hodRole) {
                nextApproverQuery = {
                  role: hodRole._id,
                  department: projectManagementDept._id,
                  isActive: true,
                };
              }
            } else if (nextPendingStep.level === "department") {
              // Legacy case - should not happen with new logic
              const hodRole = await mongoose
                .model("Role")
                .findOne({ name: "HOD" });

              const projectManagementDept = await mongoose
                .model("Department")
                .findOne({ name: "Project Management" });

              if (projectManagementDept && hodRole) {
                nextApproverQuery = {
                  role: hodRole._id,
                  department: projectManagementDept._id,
                  isActive: true,
                };
              }
            } else if (nextPendingStep.level === "hod") {
              const hodRole = await mongoose
                .model("Role")
                .findOne({ name: "HOD" });

              if (project.department && hodRole) {
                nextApproverQuery = {
                  role: hodRole._id,
                  department: project.department._id,
                  isActive: true,
                };
              }
            }

            if (Object.keys(nextApproverQuery).length > 0) {
              console.log(
                `🔍 [NEXT APPROVER] Query:`,
                JSON.stringify(nextApproverQuery, null, 2)
              );

              const nextApprover = await User.findOne(
                nextApproverQuery
              ).populate("department");

              console.log(
                `🔍 [NEXT APPROVER] Found approver:`,
                nextApprover
                  ? `${nextApprover.firstName} ${nextApprover.lastName} (${nextApprover.department?.name})`
                  : "None"
              );

              // Skip notification if next approver is the project creator (to avoid duplicate notifications)
              if (
                nextApprover &&
                nextApprover._id.toString() !== project.createdBy.toString()
              ) {
                // Create more descriptive approval messages based on level
                let approvalMessage = "";
                let actionUrl = "/dashboard/modules/projects";

                switch (nextPendingStep.level) {
                  case "hod":
                    approvalMessage = `You have a pending HOD approval for project: ${
                      project.name
                    } (${formatCurrency(project.budget)})`;
                    actionUrl = "/dashboard/modules/department-management";
                    break;
                  case "project_management":
                    // This is always Project Management HOD for cross-departmental approval
                    approvalMessage = `You have a pending cross-departmental approval for project: ${
                      project.name
                    } (${formatCurrency(project.budget)}) - Created by ${
                      project.department?.name
                    } staff`;
                    actionUrl = "/dashboard/modules/projects";
                    break;
                  case "department":
                    // Legacy case - should not happen with new logic
                    approvalMessage = `You have a pending department approval for project: ${
                      project.name
                    } (${formatCurrency(project.budget)})`;
                    actionUrl = "/dashboard/modules/department-management";
                    break;
                  case "legal_compliance":
                    approvalMessage = `You have a pending legal compliance approval for project: ${
                      project.name
                    } (${formatCurrency(project.budget)})`;
                    actionUrl = "/dashboard/modules/legal";
                    break;
                  case "finance":
                    approvalMessage = `You have a pending finance approval for project: ${
                      project.name
                    } (${formatCurrency(project.budget)})`;
                    actionUrl = "/dashboard/modules/finance";
                    break;
                  case "executive":
                    approvalMessage = `You have a pending executive approval for project: ${
                      project.name
                    } (${formatCurrency(project.budget)})`;
                    actionUrl = "/dashboard/modules/executive";
                    break;
                  case "budget_allocation":
                    approvalMessage = `You have a pending budget allocation for project: ${
                      project.name
                    } (${formatCurrency(project.budget)})`;
                    actionUrl = "/dashboard/modules/finance";
                    break;
                  default:
                    approvalMessage = `You have a pending ${formatApprovalLevel(
                      nextPendingStep.level
                    )} approval for project: ${project.name} (${formatCurrency(
                      project.budget
                    )})`;
                }

                const notificationData = {
                  recipient: nextApprover._id,
                  type: "PROJECT_READY_FOR_APPROVAL",
                  title: "Project Approval Required",
                  message: approvalMessage,
                  priority: "high",
                  data: {
                    projectId: project._id,
                    projectName: project.name,
                    approvalLevel: nextPendingStep.level,
                    amount: project.budget,
                    creatorDepartment: project.department?.name,
                    creatorName: `${project.createdBy?.firstName} ${project.createdBy?.lastName}`,
                    actionUrl: actionUrl,
                  },
                };

                console.log(
                  `📧 [NEXT APPROVER NOTIFICATION] Creating notification:`,
                  JSON.stringify(notificationData, null, 2)
                );

                await notificationService.createNotification(notificationData);

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

    await project.rejectProject(currentUser._id, level, comments);

    project.status = "revision_required";
    await project.save();

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
      message: `Your project "${project.name}" has been rejected at ${level} level by ${currentUser.firstName} ${currentUser.lastName} (${currentUser.department?.name}).\n\nReason: ${comments}`,
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

// @desc    Resubmit rejected project
// @route   POST /api/projects/:id/resubmit
// @access  Private (Project Creator)
export const resubmitProject = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("department", "name");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is the project creator
    if (project.createdBy._id.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the project creator can resubmit the project",
      });
    }

    // Check if project is in revision_required status
    if (project.status !== "revision_required") {
      return res.status(400).json({
        success: false,
        message: "Project is not in revision required status",
      });
    }

    // Resubmit the project
    await project.resubmitProject(currentUser._id);

    // Always notify the project creator about successful resubmission
    try {
      await sendProjectNotification(req, {
        recipient: currentUser._id,
        type: "PROJECT_RESUBMITTED",
        title: "Project Resubmitted Successfully",
        message: `Your project "${project.name}" (${project.code}) has been resubmitted successfully and is now pending approval.`,
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
        `📧 [NOTIFICATION] Project resubmission notification sent to creator: ${currentUser.firstName} ${currentUser.lastName}`
      );
    } catch (creatorNotificationError) {
      console.error(
        "❌ [NOTIFICATION] Error sending creator resubmission notification:",
        creatorNotificationError
      );
    }

    // Notify department users for departmental projects (but not for personal projects)
    if (project.projectScope === "departmental") {
      try {
        // Find all users in the same department (excluding the creator)
        const departmentUsers = await User.find({
          department: currentUser.department._id,
          _id: { $ne: currentUser._id }, // Exclude creator
          isActive: true,
        });

        // Send notification to all department users
        for (const user of departmentUsers) {
          try {
            await sendProjectNotification(req, {
              recipient: user._id,
              type: "DEPARTMENTAL_PROJECT_RESUBMITTED",
              title: "Departmental Project Resubmitted",
              message: `A departmental project "${project.name}" (${project.code}) has been resubmitted by ${currentUser.firstName} ${currentUser.lastName}.`,
              data: {
                projectId: project._id,
                projectName: project.name,
                projectCode: project.code,
                projectScope: project.projectScope,
                status: project.status,
                budget: project.budget,
                category: project.category,
                resubmittedBy: `${currentUser.firstName} ${currentUser.lastName}`,
                actionUrl: `/dashboard/modules/projects/${project._id}`,
              },
            });
            console.log(
              `📧 [NOTIFICATION] Departmental project resubmission notification sent to: ${user.firstName} ${user.lastName}`
            );
          } catch (userNotificationError) {
            console.error(
              `❌ [NOTIFICATION] Error sending resubmission notification to ${user.firstName}:`,
              userNotificationError
            );
          }
        }
      } catch (departmentNotificationError) {
        console.error(
          "❌ [NOTIFICATION] Error sending department resubmission notifications:",
          departmentNotificationError
        );
      }
    }

    // Send notification to approvers that project has been resubmitted
    const approvers = project.approvalChain
      .filter((step) => step.required)
      .map((step) => step.approver)
      .filter(Boolean);

    for (const approverId of approvers) {
      try {
        await sendProjectNotification(req, {
          recipient: approverId,
          type: "PROJECT_READY_FOR_APPROVAL",
          title: "Project Resubmitted - Approval Required",
          message: `Project "${project.name}" (${project.code}) has been resubmitted by ${currentUser.firstName} ${currentUser.lastName} and requires your review.`,
          data: {
            projectId: project._id,
            projectName: project.name,
            projectCode: project.code,
            approvalLevel: "resubmitted",
            projectScope: project.projectScope,
            budget: project.budget,
            category: project.category,
            resubmittedBy: `${currentUser.firstName} ${currentUser.lastName}`,
            actionUrl: `/dashboard/modules/projects/${project._id}`,
          },
        });
        console.log(
          `📧 [NOTIFICATION] Project resubmission approval notification sent to approver: ${approverId}`
        );
      } catch (error) {
        console.error(
          "❌ [NOTIFICATION] Error sending resubmission approval notification:",
          error
        );
      }
    }

    // Audit logging for project resubmission
    try {
      await ProjectAuditService.logProjectResubmitted(project, currentUser);
    } catch (error) {
      console.error("❌ [AUDIT] Error logging project resubmission:", error);
    }

    res.status(200).json({
      success: true,
      message: "Project resubmitted successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error resubmitting project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resubmit project",
      error: error.message,
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

// @desc    Get projects pending cross-departmental approval (for Project Management module)
// @route   GET /api/projects/pending-approval
// @access  Private (Cross-departmental Approvers)
export const getPendingApprovalProjects = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check access level
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. HOD level (700) or higher required for approval access.",
      });
    }

    // Define cross-departmental approval statuses (exclude department-specific approvals)
    // Note: pending_budget_allocation is handled in Finance module, not cross-departmental approvals
    let query = {
      status: {
        $in: [
          "pending_project_management_approval",
          "pending_legal_compliance_approval",
          "pending_finance_approval",
          "pending_executive_approval",
          "pending_procurement",
          "resubmitted",
        ],
      },
      isActive: true,
    };

    // For Super Admins, show all cross-departmental approvals
    if (currentUser.role.level >= 1000) {
      // Super Admin - showing all cross-departmental pending approvals
    } else {
      // For HODs, exclude projects from their own department (those go to Department Management module)
      query.department = { $ne: currentUser.department._id };
    }

    const projects = await Project.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name")
      .populate("approvalChain.approver", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Filter projects where current user is the next approver (for cross-departmental approvals)
    const filteredProjects = projects.filter((project) => {
      if (!project.approvalChain || project.approvalChain.length === 0) {
        return false;
      }

      // Find the next pending approval step
      const nextPendingStep = project.approvalChain.find(
        (step) => step.status === "pending"
      );

      if (!nextPendingStep) {
        return false;
      }

      // For Super Admins, show all cross-departmental approvals
      if (currentUser.role.level >= 1000) {
        return true;
      }

      // For HODs, check if they are responsible for the next approval step
      const userDepartment = currentUser.department?.name;

      // Project Management HOD approves project_management level (Project Management approval)
      if (
        nextPendingStep.level === "project_management" &&
        userDepartment === "Project Management"
      ) {
        return true;
      }

      // Legacy case - Project Management HOD approves department level (should not happen with new logic)
      if (
        nextPendingStep.level === "department" &&
        userDepartment === "Project Management"
      ) {
        return true;
      }

      // Legal & Compliance HOD approves legal_compliance level
      if (
        nextPendingStep.level === "legal_compliance" &&
        userDepartment === "Legal & Compliance"
      ) {
        return true;
      }

      // Finance & Accounting HOD approves finance level only
      // Note: budget_allocation is handled in Finance module, not cross-departmental approvals
      if (
        nextPendingStep.level === "finance" &&
        userDepartment === "Finance & Accounting"
      ) {
        return true;
      }

      // Executive Office HOD approves executive level
      if (
        nextPendingStep.level === "executive" &&
        userDepartment === "Executive Office"
      ) {
        return true;
      }

      return false;
    });

    // Get document counts for each project
    const Document = await import("../models/Document.js");
    const projectsWithDocumentCounts = await Promise.all(
      filteredProjects.map(async (project) => {
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

    console.log(
      `✅ [CROSS-DEPARTMENTAL APPROVALS] Found ${
        projectsWithDocumentCounts.length
      } projects pending cross-departmental approval for ${
        currentUser.department?.name || "Super Admin"
      }`
    );

    res.status(200).json({
      success: true,
      data: projectsWithDocumentCounts,
      count: projectsWithDocumentCounts.length,
    });
  } catch (error) {
    console.error("Error getting pending approval projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending approval projects",
    });
  }
};

// @desc    Get department-specific projects pending HOD approval
// @route   GET /api/projects/department-pending-approval
// @access  Private (HODs only)
export const getDepartmentPendingApprovalProjects = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is HOD level
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. HOD level (700) or higher required.",
      });
    }

    // Get projects from the HOD's department that are pending their approval
    const query = {
      department: currentUser.department._id,
      status: {
        $in: ["pending_approval", "pending_department_approval", "resubmitted"],
      },
      isActive: true,
    };

    // Find projects where the current user is the next approver in the approval chain
    const projects = await Project.find(query)
      .populate("createdBy", "firstName lastName email employeeId")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name code")
      .populate("approvalChain.approver", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Filter projects where current user is the next pending approver
    const filteredProjects = projects.filter((project) => {
      if (!project.approvalChain || project.approvalChain.length === 0) {
        return false;
      }

      // Find the next pending approval step
      const nextPendingStep = project.approvalChain.find(
        (step) => step.status === "pending"
      );

      if (!nextPendingStep) {
        return false;
      }

      // For HOD level approval, check if the current user is the HOD of the project's department
      if (nextPendingStep.level === "hod") {
        return (
          project.department._id.toString() ===
          currentUser.department._id.toString()
        );
      }

      // For other approval levels, check if the current user is the specific approver
      if (nextPendingStep.approver) {
        return (
          nextPendingStep.approver.toString() === currentUser._id.toString()
        );
      }

      return false;
    });

    // Get document counts for each project
    const Document = await import("../models/Document.js");
    const projectsWithDocumentCounts = await Promise.all(
      filteredProjects.map(async (projectDoc) => {
        const uploadedDocuments = await Document.default.find({
          project: projectDoc._id,
          isActive: true,
        });

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
          "resubmitted",
        ].includes(projectDoc.status);

        return projectDoc;
      })
    );

    console.log(
      `✅ [DEPARTMENT APPROVALS] Found ${projectsWithDocumentCounts.length} projects pending HOD approval for department: ${currentUser.department.name}`
    );

    res.status(200).json({
      success: true,
      data: projectsWithDocumentCounts,
      count: projectsWithDocumentCounts.length,
    });
  } catch (error) {
    console.error(
      "❌ [DEPARTMENT APPROVALS] Error fetching department pending approvals:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch department pending approval projects",
      error: error.message,
    });
  }
};

// @desc    Get projects pending Project Management HOD approval
// @route   GET /api/projects/project-management-pending-approval
// @access  Private (Project Management HOD only)
export const getProjectManagementPendingApprovalProjects = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is HOD level
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. HOD level (700) or higher required.",
      });
    }

    // Check if user is Project Management HOD
    if (currentUser.department?.name !== "Project Management") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Project Management HOD can access this endpoint.",
      });
    }

    // Get projects from ALL departments that are pending Project Management approval
    const query = {
      status: "pending_project_management_approval",
      isActive: true,
    };

    // Find projects where the current user is the next approver in the approval chain
    const projects = await Project.find(query)
      .populate("createdBy", "firstName lastName email employeeId")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name code")
      .populate("approvalChain.approver", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Filter projects where current user is the next pending approver
    const filteredProjects = projects.filter((project) => {
      const nextPendingStep = project.approvalChain.find(
        (step) => step.status === "pending"
      );

      // Check if the next pending step is "department" level and the current user is the approver
      return (
        nextPendingStep &&
        nextPendingStep.level === "department" &&
        nextPendingStep.department &&
        nextPendingStep.department.toString() ===
          currentUser.department._id.toString()
      );
    });

    const Document = await import("../models/Document.js");
    const projectsWithDocumentCounts = await Promise.all(
      filteredProjects.map(async (projectDoc) => {
        const uploadedDocuments = await Document.default.find({
          project: projectDoc._id,
          isActive: true,
        });

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

        projectDoc.approvalStatus = projectDoc.status;
        projectDoc.isPendingApproval = [
          "pending_project_management_approval",
        ].includes(projectDoc.status);

        return projectDoc;
      })
    );

    console.log(
      `✅ [PROJECT MANAGEMENT APPROVALS] Found ${projectsWithDocumentCounts.length} projects pending Project Management HOD approval`
    );

    res.status(200).json({
      success: true,
      data: projectsWithDocumentCounts,
      count: projectsWithDocumentCounts.length,
    });
  } catch (error) {
    console.error(
      "❌ [PROJECT MANAGEMENT APPROVALS] Error fetching project management pending approvals:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch project management pending approval projects",
      error: error.message,
    });
  }
};

// @desc    Get cross-departmental approval history (for Project Management HOD)
// @route   GET /api/projects/cross-departmental-approval-history
// @access  Private (Cross-departmental Approvers)
export const getCrossDepartmentalApprovalHistory = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is HOD level
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. HOD level (700) or higher required.",
      });
    }

    // Find projects where the current user has approved at cross-departmental levels
    // Include both fully approved projects and projects currently in budget allocation
    const projects = await Project.find({
      $or: [
        {
          "approvalChain.status": "approved",
          "approvalChain.approver": currentUser._id,
          isActive: true,
        },
        {
          "approvalChain.status": "approved",
          "approvalChain.approver": currentUser._id,
          status: "pending_budget_allocation",
          isActive: true,
        },
      ],
    })
      .populate("createdBy", "firstName lastName email employeeId")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name code")
      .populate("approvalChain.approver", "firstName lastName email")
      .sort({ updatedAt: -1 });

    const approvalHistory = [];

    for (const project of projects) {
      const userApprovalStep = project.approvalChain.find(
        (step) =>
          step.status === "approved" &&
          step.approver &&
          step.approver._id.toString() === currentUser._id.toString()
      );

      if (userApprovalStep) {
        // Get document counts from requiredDocuments array
        const totalDocuments = project.requiredDocuments?.length || 0;
        const submittedDocuments =
          project.requiredDocuments?.filter((doc) => doc.isSubmitted).length ||
          0;

        approvalHistory.push({
          _id: project._id,
          name: project.name,
          code: project.code,
          description: project.description,
          budget: project.budget,
          startDate: project.startDate,
          endDate: project.endDate,
          priority: project.priority,
          status: project.status,
          projectScope: project.projectScope,
          requiresBudgetAllocation: project.requiresBudgetAllocation,
          createdBy: project.createdBy,
          projectManager: project.projectManager,
          department: project.department,
          approvalLevel: userApprovalStep.level,
          approvalComments: userApprovalStep.comments,
          approvedAt: userApprovalStep.approvedAt,
          approver: userApprovalStep.approver,
          requiredDocuments: project.requiredDocuments,
          projectItems: project.projectItems,
          approvalChain: project.approvalChain,
          documentStats: {
            submitted: submittedDocuments,
            total: totalDocuments,
            percentage:
              totalDocuments > 0
                ? Math.round((submittedDocuments / totalDocuments) * 100)
                : 0,
          },
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        });
      }
    }

    console.log(
      `✅ [CROSS-DEPARTMENTAL APPROVAL HISTORY] Found ${approvalHistory.length} projects approved by ${currentUser.department?.name} HOD`
    );
    console.log("🔍 [CROSS-DEPARTMENTAL APPROVAL HISTORY] Current User:", {
      id: currentUser._id,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      department: currentUser.department?.name,
      roleLevel: currentUser.role?.level,
    });
    console.log(
      "🔍 [CROSS-DEPARTMENTAL APPROVAL HISTORY] Approval History:",
      approvalHistory.map((p) => ({
        id: p._id,
        name: p.name,
        approvalLevel: p.approvalLevel,
        approvedAt: p.approvedAt,
      }))
    );

    res.status(200).json({
      success: true,
      data: approvalHistory,
      count: approvalHistory.length,
    });
  } catch (error) {
    console.error(
      "❌ [CROSS-DEPARTMENTAL APPROVAL HISTORY] Error fetching cross-departmental approval history:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch cross-departmental approval history",
      error: error.message,
    });
  }
};

// @desc    Get HOD approval history
// @route   GET /api/projects/approval-history
// @access  Private (HODs only)
export const getHODApprovalHistory = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is HOD level
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. HOD level (700) or higher required.",
      });
    }

    // Find projects from the HOD's own department where they have approved
    const projects = await Project.find({
      department: currentUser.department._id, // Only projects from HOD's own department
      "approvalChain.status": "approved",
      "approvalChain.approver": currentUser._id,
      isActive: true,
    })
      .populate("createdBy", "firstName lastName email employeeId")
      .populate("projectManager", "firstName lastName email")
      .populate("department", "name code")
      .populate("approvalChain.approver", "firstName lastName email")
      .sort({ updatedAt: -1 });

    const approvalHistory = [];

    for (const project of projects) {
      const userApprovalStep = project.approvalChain.find(
        (step) =>
          step.status === "approved" &&
          step.approver &&
          step.approver._id.toString() === currentUser._id.toString()
      );

      if (userApprovalStep) {
        // Get document counts from requiredDocuments array
        const totalDocuments = project.requiredDocuments?.length || 0;
        const submittedDocuments =
          project.requiredDocuments?.filter((doc) => doc.isSubmitted).length ||
          0;

        approvalHistory.push({
          _id: project._id,
          name: project.name,
          code: project.code,
          description: project.description,
          budget: project.budget,
          startDate: project.startDate,
          endDate: project.endDate,
          priority: project.priority,
          status: project.status,
          projectScope: project.projectScope,
          requiresBudgetAllocation: project.requiresBudgetAllocation,
          createdBy: project.createdBy,
          projectManager: project.projectManager,
          department: project.department,
          approvalLevel: userApprovalStep.level,
          approvedAt: userApprovalStep.approvedAt,
          approvalComments: userApprovalStep.comments,
          projectItems: project.projectItems,
          requiredDocuments: project.requiredDocuments,
          documentStats: {
            submitted: submittedDocuments,
            total: totalDocuments,
            percentage:
              totalDocuments > 0
                ? Math.round((submittedDocuments / totalDocuments) * 100)
                : 0,
          },
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        });
      }
    }

    console.log(
      `✅ [DEPARTMENT APPROVAL HISTORY] Found ${approvalHistory.length} department projects approved by ${currentUser.firstName} ${currentUser.lastName} (${currentUser.department?.name})`
    );

    res.status(200).json({
      success: true,
      data: approvalHistory,
      count: approvalHistory.length,
    });
  } catch (error) {
    console.error(
      "❌ [APPROVAL HISTORY] Error fetching HOD approval history:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch approval history",
      error: error.message,
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

// @desc    Get my projects (role-based filtering)
// @route   GET /api/projects/my-projects
// @access  Private
export const getMyProjects = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = { isActive: true };

    // Apply role-based filtering
    if (currentUser.role.level >= 1000) {
      // SUPER_ADMIN - see all projects
      console.log("🔍 [MY PROJECTS] Super Admin - showing all projects");
    } else {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view projects",
        });
      }

      if (currentUser.role.level >= 700) {
        // HOD (700+) - see personal and departmental projects from their department
        const isProjectManagementDepartment =
          currentUser.department?.name === "Project Management";

        if (isProjectManagementDepartment) {
          // Project Management HOD can see personal, departmental, and external projects
          query.$or = [
            { projectScope: "personal", createdBy: currentUser._id },
            {
              projectScope: "departmental",
              department: currentUser.department,
            },
            {
              projectScope: "external",
              department: currentUser.department,
            },
          ];
          console.log(
            `🔍 [MY PROJECTS] HR HOD - showing personal, departmental, and external projects from department: ${currentUser.department.name}`
          );
        } else {
          // ALL HODs can see personal and departmental projects from their department
          query.$or = [
            { projectScope: "personal", createdBy: currentUser._id },
            {
              projectScope: "departmental",
              department: currentUser.department,
            },
          ];
          console.log(
            `🔍 [MY PROJECTS] ${currentUser.role.name} - showing personal and departmental projects from department: ${currentUser.department.name}`
          );
        }
      } else if (currentUser.role.level >= 600) {
        // MANAGER (600) - see personal and departmental projects from their department
        query.$or = [
          { projectScope: "personal", createdBy: currentUser._id },
          {
            projectScope: "departmental",
            department: currentUser.department,
          },
        ];
        console.log(
          `🔍 [MY PROJECTS] ${currentUser.role.name} - showing personal and departmental projects from department: ${currentUser.department.name}`
        );
      } else {
        // STAFF (300+) and VIEWER (100+) - see their own personal projects AND all departmental projects from their department
        query.$or = [
          { projectScope: "personal", createdBy: currentUser._id },
          {
            projectScope: "departmental",
            department: currentUser.department,
          },
        ];
        console.log(
          `🔍 [MY PROJECTS] ${currentUser.role.name} - showing personal projects created by user and all departmental projects from department: ${currentUser.department.name}`
        );
      }
    }

    const projects = await Project.find(query)
      .populate("department", "name code")
      .populate("createdBy", "firstName lastName email")
      .populate("projectManager", "firstName lastName email")
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
