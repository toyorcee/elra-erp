import mongoose from "mongoose";
import {
  UNIFIED_CATEGORIES,
  mapToUnifiedCategory,
} from "../constants/unifiedCategories.js";
import ProjectAuditService from "../services/projectAuditService.js";
import ProjectDocumentService from "../services/projectDocumentService.js";

// ============================================================================
// SPECIAL CASE HODS - HODs who can skip their own approval when creating projects in their department
// ============================================================================
const SPECIAL_CASE_HODS = [
  "Project Management", // Project Management HOD
  "Finance & Accounting", // Finance HOD
  "Legal & Compliance", // Legal HOD
  "Executive Office", // Executive HOD
];

// Helper function to check if a HOD is a special case
const isSpecialCaseHOD = (departmentName, userRoleLevel) => {
  return userRoleLevel >= 700 && SPECIAL_CASE_HODS.includes(departmentName);
};

const projectSchema = new mongoose.Schema(
  {
    // Basic Project Information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: function () {
        return this.projectScope !== "external";
      },
      trim: true,
      maxlength: 1000,
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    // Project Status and Priority
    status: {
      type: String,
      enum: [
        "planning",
        "pending_approval",
        "pending_department_approval",
        "pending_project_management_approval",
        "pending_legal_compliance_approval",
        "pending_finance_approval",
        "pending_executive_approval",
        "pending_budget_allocation",
        "pending_vendor_assignment",
        "pending_procurement",
        "approved",
        "in_progress",
        "implementation",
        "active",
        "on_hold",
        "completed",
        "cancelled",
        "rejected",
        "revision_required",
        "resubmitted",
      ],
      default: "planning",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent", "critical"],
      default: "medium",
      required: true,
    },

    // Project Timeline
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    actualStartDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },

    // Project Budget (in Naira)
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Budget Approval Thresholds
    budgetThreshold: {
      type: String,
      enum: [
        "hod_auto_approve",
        "department_approval",
        "project_management_approval",
        "legal_finance_approval",
        "legal_executive_approval",
        "finance_approval",
        "executive_approval",
      ],
      default: "hod_auto_approve",
    },

    // Project Team
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: function () {
        return this.name ? `${this.name} Team` : "Project Team";
      },
    },
    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          required: true,
          enum: [
            "developer",
            "designer",
            "analyst",
            "tester",
            "consultant",
            "manager",
            "coordinator",
            "other",
          ],
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Project Department (which department owns this project)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // Project Categories - Professional & Wide (Common for Internal & External)
    category: {
      type: String,
      required: true,
      enum: UNIFIED_CATEGORIES,
    },

    // Project Scope (Personal, Departmental, External)
    projectScope: {
      type: String,
      enum: ["personal", "departmental", "external"],
      required: true,
      default: "personal",
    },

    // Budget Allocation (for personal/departmental projects)
    requiresBudgetAllocation: {
      type: Boolean,
      default: false,
      required: function () {
        return this.projectScope !== "external";
      },
    },

    // Budget Percentage (for external projects - what percentage ELRA handles)
    budgetPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
      required: function () {
        return this.projectScope === "external";
      },
    },

    // External Project Details (if applicable)
    externalProjectDetails: {
      targetIndustry: {
        type: String,
        enum: [
          "leasing_companies",
          "equipment_owners",
          "financial_institutions",
          "government_agencies",
          "other",
        ],
      },
      complianceType: {
        type: String,
        enum: [
          "equipment_registration",
          "safety_compliance",
          "financial_compliance",
          "operational_compliance",
          "other",
        ],
      },
      affectedCompanies: {
        type: Number,
        min: 0,
      },
      regulatoryImpact: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
    },

    // Vendor Information (OPTIONAL for external projects)
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: undefined,
    },

    // Compliance Program (for legal approval)
    complianceProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ComplianceProgram",
      default: undefined,
    },

    // Delivery Address (for external projects with vendors)
    deliveryAddress: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Client Information (REQUIRED for external projects)
    clientName: {
      type: String,
      required: function () {
        return this.projectScope === "external";
      },
      trim: true,
      maxlength: 200,
    },
    clientEmail: {
      type: String,
      required: function () {
        return this.projectScope === "external";
      },
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    clientCompany: {
      type: String,
      required: function () {
        return this.projectScope === "external";
      },
      trim: true,
      maxlength: 200,
    },
    clientPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    clientAddress: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Project Items (REQUIRED for external projects)
    projectItems: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        // Currency is always NGN - removed for simplicity
        deliveryTimeline: {
          type: String,
          required: function () {
            return this.projectScope === "external";
          },
          trim: true,
        },
      },
    ],

    // Equipment Requirements
    equipmentRequirements: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },
        description: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        category: {
          type: String,
          enum: [
            "construction_equipment",
            "office_equipment",
            "medical_equipment",
            "agricultural_equipment",
            "industrial_equipment",
            "passenger_vehicle",
            "commercial_vehicle",
            "construction_vehicle",
            "agricultural_vehicle",
            "office_space",
            "warehouse",
            "residential",
            "commercial_space",
            "furniture",
            "electronics",
            "tools",
            "other",
          ],
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        estimatedCost: {
          type: Number,
          min: 0,
          default: 0,
        },
        specifications: {
          brand: String,
          model: String,
          year: Number,
          capacity: String,
          power: String,
          dimensions: String,
          weight: String,
          additionalSpecs: String,
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        isRequired: {
          type: Boolean,
          default: true,
        },
        specifications: {
          brand: String,
          model: String,
          year: Number,
          capacity: String,
          power: String,
          dimensions: String,
          weight: String,
          additionalSpecs: String,
        },
        notes: String,
      },
    ],

    // Project Progress (Overall - combines approval and implementation)
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Approval Progress (0-100% for approval phase only)
    approvalProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Implementation Progress (0-100% for implementation phase only)
    implementationProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Implementation Tracking (for Personal Projects)
    implementation: {
      startDate: {
        type: Date,
      },
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      milestones: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
          dueDate: {
            type: Date,
            required: true,
          },
          completed: {
            type: Boolean,
            default: false,
          },
          completedDate: {
            type: Date,
          },
          priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
          },
        },
      ],
      implementationNotes: {
        type: String,
        trim: true,
      },
      closureRequested: {
        type: Boolean,
        default: false,
      },
      closureApproved: {
        type: Boolean,
        default: false,
      },
      closureRequestedAt: {
        type: Date,
      },
      closureRequestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      closureApprovedAt: {
        type: Date,
      },
      closureApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // Workflow Tracking Fields (Phase 1 Enhancement)
    workflowPhase: {
      type: String,
      enum: [
        "planning",
        "approval",
        "implementation",
        "execution",
        "completion",
      ],
      default: "planning",
    },
    workflowStep: {
      type: Number,
      default: 1,
      min: 1,
    },
    isAutoGenerated: {
      type: Boolean,
      default: false,
    },
    workflowTriggers: {
      inventoryCreated: { type: Boolean, default: false },
      inventoryCompleted: { type: Boolean, default: false },
      procurementInitiated: { type: Boolean, default: false },
      procurementCompleted: { type: Boolean, default: false },
      regulatoryComplianceInitiated: { type: Boolean, default: false },
      regulatoryComplianceCompleted: { type: Boolean, default: false },
      regulatoryComplianceInitiatedAt: { type: Date },
      regulatoryComplianceInitiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      regulatoryComplianceCompletedAt: { type: Date },
      regulatoryComplianceCompletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      complianceDetails: { type: mongoose.Schema.Types.Mixed },
      inventoryCompletedAt: { type: Date },
      inventoryCompletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      procurementCompletedAt: { type: Date },
      procurementCompletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    workflowHistory: [
      {
        phase: { type: String, required: true },
        action: { type: String, required: true },
        triggeredBy: {
          type: String,
          enum: ["manual", "auto"],
          default: "manual",
        },
        triggeredByUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        metadata: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Approval Workflow
    approvalChain: [
      {
        level: {
          type: String,
          enum: [
            "hod",
            "department",
            "project_management",
            "finance",
            "executive",
            "legal_compliance",
            "budget_allocation",
          ],
          required: true,
        },
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        department: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "skipped"],
          default: "pending",
        },
        comments: {
          type: String,
          trim: true,
        },
        approvedAt: {
          type: Date,
        },
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Documents for Project Approval
    requiredDocuments: [
      {
        documentType: {
          type: String,
          enum: [
            "project_proposal",
            "budget_breakdown",
            "technical_specifications",
            "risk_assessment",
            "timeline_detailed",
            "team_structure",
            "vendor_quotes",
            "legal_review",
            "financial_analysis",
            "other",
          ],
          required: true,
        },
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document",
        },
        fileName: {
          type: String,
          trim: true,
        },
        fileUrl: {
          type: String,
        },
        isRequired: {
          type: Boolean,
          default: true,
        },
        isSubmitted: {
          type: Boolean,
          default: false,
        },
        submittedAt: {
          type: Date,
        },
        submittedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        // Document approval tracking through the chain
        approvalStatus: {
          type: String,
          enum: ["pending", "approved", "rejected", "skipped"],
          default: "pending",
        },
        approvalHistory: [
          {
            level: {
              type: String,
              enum: ["hod", "finance", "executive", "legal_compliance"],
              required: true,
            },
            approver: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            department: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Department",
            },
            status: {
              type: String,
              enum: ["pending", "approved", "rejected", "skipped"],
              default: "pending",
            },
            comments: {
              type: String,
              trim: true,
            },
            approvedAt: {
              type: Date,
            },
            // Document version at this approval level
            documentVersion: {
              type: Number,
              default: 1,
            },
            // Track if document was modified during this approval
            documentModified: {
              type: Boolean,
              default: false,
            },
            // Track document content hash for integrity
            documentHash: {
              type: String,
              trim: true,
            },
          },
        ],
        // Current approval level
        currentApprovalLevel: {
          type: String,
          enum: ["hod", "finance", "executive", "legal_compliance"],
          default: "hod",
        },
        // Track document modifications through approval chain
        documentVersions: [
          {
            version: {
              type: Number,
              required: true,
            },
            documentId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Document",
            },
            fileName: {
              type: String,
              trim: true,
            },
            fileUrl: {
              type: String,
            },
            modifiedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            modifiedAt: {
              type: Date,
              default: Date.now,
            },
            approvalLevel: {
              type: String,
              enum: ["hod", "finance", "executive", "legal_compliance"],
            },
            comments: {
              type: String,
              trim: true,
            },
            // Document content hash for integrity verification
            contentHash: {
              type: String,
              trim: true,
            },
          },
        ],
      },
    ],

    // Project Notes
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isPrivate: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Finance Reimbursement Tracking
    financeStatus: {
      type: String,
      enum: ["pending", "approved", "reimbursed", "rejected"],
      default: "pending",
    },
    financeReimbursedAt: { type: Date },
    financeReimbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    financeReimbursementAmount: { type: Number },
    financeReimbursementNotes: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
projectSchema.index({ status: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ "teamMembers.user": 1 });
projectSchema.index({ code: 1 }, { unique: true });
projectSchema.index({ startDate: 1, endDate: 1 });

// Virtual for project duration
projectSchema.virtual("duration").get(function () {
  if (this.actualStartDate && this.actualEndDate) {
    return Math.ceil(
      (this.actualEndDate - this.actualStartDate) / (1000 * 60 * 60 * 24)
    );
  }
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

projectSchema.virtual("budgetVariance").get(function () {
  return this.budget - this.actualCost;
});

projectSchema.virtual("isOverdue").get(function () {
  if (this.status === "completed" || this.status === "cancelled") return false;
  return new Date() > this.endDate;
});

projectSchema.pre("save", async function (next) {
  try {
    if (!this.code) {
      // Department-based project numbering
      const currentYear = new Date().getFullYear();

      // Get department prefix
      const department = await mongoose
        .model("Department")
        .findById(this.department);
      const deptPrefix = department
        ? department.name.substring(0, 3).toUpperCase()
        : "PRJ";

      // Count projects for this department in current year
      const count = await this.constructor.countDocuments({
        department: this.department,
        createdAt: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1),
        },
        isActive: true,
      });

      this.code = `${deptPrefix}${currentYear}${String(count + 1).padStart(
        4,
        "0"
      )}`;
    }

    // Set budget threshold based on budget amount and budget allocation requirement
    if (
      this.budget &&
      (!this.budgetThreshold || this.budgetThreshold === "department_approval")
    ) {
      if (this.requiresBudgetAllocation === true) {
        // Personal Projects with Budget Allocation = TRUE
        if (this.budget < 5000000) {
          // < ₦5M: HOD → Project Management → Legal → Finance → Budget Allocation
          this.budgetThreshold = "legal_finance_approval";
        } else {
          // ≥ ₦5M: HOD → Project Management → Legal → Finance → Executive → Budget Allocation
          this.budgetThreshold = "executive_approval";
        }
      } else {
        // Self-funded Projects (Budget Allocation = FALSE)
        if (this.budget < 5000000) {
          // < ₦5M: HOD → Project Management HOD (stops here)
          this.budgetThreshold = "project_management_approval";
        } else {
          // ≥ ₦5M: HOD → Project Management → Legal → Executive
          this.budgetThreshold = "legal_executive_approval";
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware for audit logging
projectSchema.post("save", async function (doc) {
  try {
    // Only log if this is a new project (not an update)
    if (doc.isNew) {
      // Get the user who created the project (from the request context)
      // This will be set by the controller
      const user = doc._createdBy;
      if (user) {
        await ProjectAuditService.logProjectCreated(doc, user);
      }
    }
  } catch (error) {
    console.error("❌ [AUDIT] Error in post-save audit logging:", error);
  }
});

projectSchema.statics.getProjectStats = async function () {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalBudget: { $sum: "$budget" },
        totalActualCost: { $sum: "$actualCost" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalBudget: stat.totalBudget,
      totalActualCost: stat.totalActualCost,
    };
    return acc;
  }, {});
};

// Static method to get active projects
projectSchema.statics.getActiveProjects = function () {
  return this.find({ isActive: true, status: "active" })
    .populate("projectManager", "firstName lastName email")
    .populate("teamMembers.user", "firstName lastName email")
    .sort({ startDate: 1 });
};

// Static method to get projects by category
projectSchema.statics.getByCategory = function (category) {
  return this.find({ isActive: true, category })
    .populate("projectManager", "firstName lastName email")
    .sort({ startDate: 1 });
};

// Instance method to add team member
projectSchema.methods.addTeamMember = async function (userId, role) {
  const existingMember = this.teamMembers.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (existingMember) {
    existingMember.isActive = true;
    existingMember.role = role;
  } else {
    this.teamMembers.push({
      user: userId,
      role: role,
      assignedDate: new Date(),
      isActive: true,
    });
  }

  await this.save();
};

// Instance method to remove team member
projectSchema.methods.removeTeamMember = async function (userId) {
  const memberIndex = this.teamMembers.findIndex(
    (member) => member.user.toString() === userId.toString()
  );

  if (memberIndex !== -1) {
    this.teamMembers[memberIndex].isActive = false;
    await this.save();
  }
};

// Instance method to add note
projectSchema.methods.addNote = async function (
  content,
  authorId,
  isPrivate = false
) {
  this.notes.push({
    content,
    author: authorId,
    isPrivate,
    createdAt: new Date(),
  });

  await this.save();
};

// Instance method to get project summary
projectSchema.methods.getSummary = function () {
  const activeTeamMembers = this.teamMembers.filter(
    (member) => member.isActive
  ).length;

  return {
    id: this._id,
    name: this.name,
    code: this.code,
    status: this.status,
    progress: this.progress,
    budget: this.budget,
    actualCost: this.actualCost,
    budgetVariance: this.budgetVariance,
    duration: this.duration,
    isOverdue: this.isOverdue,
    teamSize: activeTeamMembers,
    startDate: this.startDate,
    endDate: this.endDate,
    budgetThreshold: this.budgetThreshold,
  };
};

// Instance method to progress workflow to next phase
projectSchema.methods.progressWorkflow = async function (
  newPhase,
  action,
  triggeredBy = "manual",
  triggeredByUser = null,
  metadata = {}
) {
  const phaseOrder = [
    "planning",
    "approval",
    "implementation",
    "execution",
    "completion",
  ];
  const currentPhaseIndex = phaseOrder.indexOf(this.workflowPhase);
  const newPhaseIndex = phaseOrder.indexOf(newPhase);

  if (newPhaseIndex < currentPhaseIndex) {
    throw new Error(
      `Cannot move backwards in workflow. Current: ${this.workflowPhase}, Attempted: ${newPhase}`
    );
  }

  // Update workflow state
  this.workflowPhase = newPhase;
  this.workflowStep = this.workflowStep + 1;

  // Add to workflow history
  this.workflowHistory.push({
    phase: newPhase,
    action: action,
    triggeredBy: triggeredBy,
    triggeredByUser: triggeredByUser,
    metadata: metadata,
    timestamp: new Date(),
  });

  await this.save();

  // Audit logging for phase change
  if (triggeredByUser) {
    try {
      await ProjectAuditService.logPhaseChanged(
        this,
        triggeredByUser,
        this.workflowPhase,
        newPhase
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging phase change:", error);
    }
  }

  return this;
};

// Instance method to trigger post-approval workflow
projectSchema.methods.triggerPostApprovalWorkflow = async function (
  triggeredByUser
) {
  if (this.status !== "approved") {
    throw new Error(
      "Project must be approved before triggering post-approval workflow"
    );
  }

  console.log("🚀 [WORKFLOW] ========================================");
  console.log("🚀 [WORKFLOW] POST-APPROVAL WORKFLOW TRIGGERED");
  console.log("🚀 [WORKFLOW] ========================================");

  // Audit logging for workflow trigger
  if (triggeredByUser) {
    try {
      await ProjectAuditService.logWorkflowTriggered(
        this,
        triggeredByUser,
        "implementation"
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging workflow trigger:", error);
    }
  }
  console.log(`📋 [WORKFLOW] Project: ${this.name} (${this.code})`);
  console.log(`📋 [WORKFLOW] Category: ${this.category}`);
  console.log(`📋 [WORKFLOW] Budget: ${this.budget}`);

  try {
    // Move to implementation phase
    await this.progressWorkflow(
      "implementation",
      "post_approval_triggered",
      "auto",
      triggeredByUser,
      {
        projectCode: this.code,
        budget: this.budget,
        category: this.category,
      }
    );

    // Set status to implementation (will be overridden for personal projects with budget allocation)
    this.status = "implementation";
    await this.save();

    // Handle workflow based on project scope
    if (this.projectScope === "external") {
      // External projects: Check if this is budget allocation approval
      console.log(
        "🌐 [WORKFLOW] External project detected - checking approval type"
      );

      // Check if this is the budget allocation approval step
      const budgetAllocationStep = this.approvalChain.find(
        (step) =>
          step.level === "budget_allocation" && step.status === "approved"
      );

      if (this.requiresBudgetAllocation === true && budgetAllocationStep) {
        // Budget allocation just approved - proceed with procurement
        console.log(
          "💰 [WORKFLOW] Budget allocation approved - proceeding with procurement"
        );
        console.log(
          "🛒 [WORKFLOW] Triggering Procurement for external project"
        );
        await this.triggerProcurementCreation(triggeredByUser);

        // Send notification to Operations HOD about pending inventory
        await this.notifyOperationsHOD(triggeredByUser);
      } else if (this.requiresBudgetAllocation === false) {
        // No budget allocation required - proceed with procurement
        console.log(
          "💰 [WORKFLOW] No budget allocation required - proceeding with procurement"
        );
        console.log(
          "🛒 [WORKFLOW] Triggering Procurement for external project"
        );
        await this.triggerProcurementCreation(triggeredByUser);

        // Send notification to Operations HOD about pending inventory
        await this.notifyOperationsHOD(triggeredByUser);
      } else {
        // Still waiting for budget allocation
        console.log(
          "⏸️ [WORKFLOW] Waiting for budget allocation before procurement"
        );
        console.log(
          "📋 [WORKFLOW] Budget allocation must be approved before procurement can proceed"
        );
      }

      console.log("✅ [WORKFLOW] External project workflow triggered");
      console.log(
        "📦 [WORKFLOW] Inventory will be created after procurement delivery"
      );
    } else if (this.projectScope === "departmental") {
      console.log(
        "🏢 [WORKFLOW] Departmental project detected - checking budget allocation requirement"
      );

      if (this.requiresBudgetAllocation === true) {
        console.log(
          "💰 [WORKFLOW] Departmental project with budget allocation - will trigger procurement and inventory AFTER budget allocation"
        );
        console.log(
          "📋 [WORKFLOW] Budget allocation must be approved before procurement can proceed"
        );
      } else {
        console.log(
          "💰 [WORKFLOW] Departmental project without budget allocation - will be handled by finance reimbursement after implementation"
        );
      }
    } else {
      console.log(
        "👤 [WORKFLOW] Personal project detected - checking budget allocation requirement"
      );
      console.log(
        `💰 [WORKFLOW] Budget allocation required: ${this.requiresBudgetAllocation}`
      );

      if (this.requiresBudgetAllocation === true) {
        console.log(
          "💰 [WORKFLOW] Personal project requires budget allocation - setting status to pending_budget_allocation"
        );
        this.status = "pending_budget_allocation";
        console.log(
          "📋 [WORKFLOW] Finance HOD will be notified to create budget allocation"
        );
        console.log(
          "🛒 [WORKFLOW] Procurement will be triggered after budget allocation approval"
        );

        try {
          const NotificationService = await import(
            "../services/notificationService.js"
          );
          const notificationService = new NotificationService.default();

          const financeDept = await mongoose
            .model("Department")
            .findOne({ name: "Finance & Accounting" });
          const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });

          if (financeDept && hodRole) {
            const financeHOD = await mongoose.model("User").findOne({
              role: hodRole._id,
              department: financeDept._id,
              isActive: true,
            });

            if (financeHOD) {
              await notificationService.createNotification({
                recipient: financeHOD._id,
                type: "BUDGET_ALLOCATION_REQUIRED",
                title: "Budget Allocation Required",
                message: `Personal project "${this.name}" (${
                  this.code
                }) has been approved and requires budget allocation of ₦${this.projectItems
                  .reduce(
                    (sum, item) =>
                      sum + (item.quantity || 1) * (item.unitPrice || 0),
                    0
                  )
                  .toLocaleString()} for procurement items. Please create budget allocation to proceed with procurement.`,
                priority: "high",
                data: {
                  projectId: this._id,
                  projectCode: this.code,
                  projectName: this.name,
                  budget: this.budget,
                  category: this.category,
                  actionUrl: "/dashboard/modules/budget-allocations",
                  triggeredBy: triggeredByUser?._id,
                },
              });
              console.log(
                `✅ [WORKFLOW] Budget allocation notification sent to Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName}`
              );
            }
          }
        } catch (notificationError) {
          console.error(
            "❌ [WORKFLOW] Error sending budget allocation notification:",
            notificationError
          );
        }
      } else {
        // Personal project without budget allocation - go directly to implementation
        console.log(
          "💰 [WORKFLOW] Personal project without budget allocation - going directly to implementation"
        );
        console.log(
          "📋 [WORKFLOW] Creating implementation tasks for personal project"
        );
        await this.createImplementationTasks(triggeredByUser);
      }
    }

    // Save the project with updated workflow triggers
    await this.save();
    console.log("💾 [WORKFLOW] Project saved with updated workflow triggers");

    // Notify Executive about the notifications sent to both parties
    if (triggeredByUser) {
      try {
        const NotificationService = await import(
          "../services/notificationService.js"
        );
        const notification = new NotificationService.default();

        let notificationMessage = "";
        let notificationsSent = {};

        if (this.projectScope === "external") {
          if (this.requiresBudgetAllocation !== false) {
            notificationMessage = `Project "${this.name}" approved! Finance will review budget calculations, then Executive will approve. After Executive approval, Finance will allocate budget and procurement will be initiated.`;
          } else {
            notificationMessage = `Project "${this.name}" approved! Legal review completed. Project will proceed to Executive approval, then procurement will be initiated.`;
          }
          notificationsSent.operationsHOD = "Inventory setup notification sent";
          notificationsSent.procurementHOD =
            "Procurement initiation notification sent";
        } else if (this.projectScope === "departmental") {
          if (this.requiresBudgetAllocation === true) {
            notificationMessage = `Project "${this.name}" approved! Finance will review budget calculations, then Executive will approve. After Executive approval, Finance will allocate budget and procurement will be initiated.`;
            // No procurement/inventory notifications yet - will be sent after budget allocation
          } else {
            notificationMessage = `Congratulations! Your project "${this.name}" with reimbursement has been approved. Finance will handle reimbursement for implementation.`;
            notificationsSent.financeReimbursement =
              "Finance reimbursement will be handled before implementation";
          }
        } else {
          // Personal project
          if (this.requiresBudgetAllocation === true) {
            notificationMessage = `Congratulations! Your project "${this.name}" with reimbursement has been approved. Finance will handle reimbursement for implementation.`;
            notificationsSent.financeReimbursement =
              "Finance reimbursement will be handled before implementation";
          } else {
            notificationMessage = `Congratulations! Your project "${this.name}" has been approved and is ready for implementation!`;
            notificationsSent.implementation =
              "Project ready for implementation";
          }
        }
      } catch (notifError) {
        console.error(
          "❌ [WORKFLOW] Error notifying Executive about notifications:",
          notifError
        );
      }
    }

    // Move to execution phase
    await this.progressWorkflow(
      "execution",
      "implementation_ready",
      "auto",
      triggeredByUser,
      {
        projectCode: this.code,
        implementationPhase: "ready",
      }
    );

    // Notify all stakeholders about workflow completion
    try {
      const NotificationService = await import(
        "../services/notificationService.js"
      );
      const notification = new NotificationService.default();

      // 1. Notify project creator
      console.log(
        `📧 [WORKFLOW] Sending notification to project creator: ${this.createdBy}`
      );

      // Create message based on project scope
      let creatorMessage = "";
      if (this.projectScope === "external") {
        if (this.requiresBudgetAllocation !== false) {
          creatorMessage = `Project "${this.name}" approved! Finance will review budget calculations, then Executive will approve. After Executive approval, Finance will allocate budget and procurement will be initiated.`;
        } else {
          creatorMessage = `Project "${this.name}" approved! Legal review completed. Project will proceed to Executive approval, then procurement will be initiated.`;
        }
      } else if (this.projectScope === "departmental") {
        if (this.requiresBudgetAllocation === true) {
          creatorMessage = `Project "${this.name}" approved! Finance will review budget calculations, then Executive will approve. After Executive approval, Finance will allocate budget and procurement will be initiated.`;
        } else {
          creatorMessage = `Congratulations! Your project "${this.name}" with reimbursement has been approved. Finance will handle reimbursement for implementation.`;
        }
      } else {
        // Personal project
        if (this.requiresBudgetAllocation === true) {
          creatorMessage = `Congratulations! Your project "${this.name}" with reimbursement has been approved. Finance will handle reimbursement for implementation.`;
        } else {
          creatorMessage = `Congratulations! Your project "${this.name}" has been approved and is ready for implementation!`;
        }
      }

      await notification.createNotification({
        recipient: this.createdBy,
        type: "PROJECT_IMPLEMENTATION_READY",
        title: "Project Implementation Ready",
        message: creatorMessage,
        priority: "high",
        data: {
          projectId: this._id,
          projectName: this.name,
          projectCode: this.code,
          budget: this.budget,
          category: this.category,
          projectScope: this.projectScope,
          actionUrl: "/dashboard/modules/projects",
          implementationPhase: "ready",
          triggeredBy: triggeredByUser ? triggeredByUser._id : null,
        },
      });
      console.log(
        `✅ [WORKFLOW] Notification sent to project creator successfully`
      );

      // 2. Notify Finance HOD (who approved earlier) - ONLY if budget allocation is required
      if (
        this.requiresBudgetAllocation === true ||
        this.projectScope === "external" ||
        this.projectScope === "departmental"
      ) {
        console.log(`📧 [WORKFLOW] Looking for Finance HOD to notify...`);
        const financeDept = await mongoose.model("Department").findOne({
          name: "Finance & Accounting",
        });
        if (financeDept) {
          console.log(
            `📧 [WORKFLOW] Found Finance department: ${financeDept.name}`
          );
          // Get HOD role ID for Finance query
          const hodRoleForFinance = await mongoose
            .model("Role")
            .findOne({ name: "HOD" });
          if (!hodRoleForFinance) {
            console.log("❌ [WORKFLOW] HOD role not found in system");
            return;
          }

          let financeHOD = await mongoose
            .model("User")
            .findOne({
              department: financeDept._id,
              "role.name": "HOD",
              isActive: true,
            })
            .populate("role");

          if (!financeHOD) {
            financeHOD = await mongoose
              .model("User")
              .findOne({
                department: financeDept._id,
                "role.level": { $gte: 700 },
                isActive: true,
              })
              .populate("role");
          }

          if (financeHOD) {
            console.log(
              `📧 [WORKFLOW] Found Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName} (${financeHOD.email})`
            );
            console.log(
              `📧 [WORKFLOW] Finance HOD ID: ${financeHOD._id}, Triggered By: ${
                triggeredByUser?._id || triggeredByUser
              }`
            );

            if (
              financeHOD._id.toString() !==
              (triggeredByUser?._id || triggeredByUser).toString()
            ) {
              console.log(
                `📧 [WORKFLOW] Finance HOD is different from Executive HOD - sending notification`
              );
              // Create appropriate message based on project scope
              let financeMessage = "";
              if (this.projectScope === "external") {
                financeMessage = `Project "${this.name}" (${this.code}) that you reviewed has been fully approved and is now in implementation phase. Budget allocation will be required before procurement can proceed.`;
              } else if (this.projectScope === "departmental") {
                if (this.requiresBudgetAllocation === true) {
                  financeMessage = `Project "${this.name}" (${this.code}) that you approved has been fully approved and is now in implementation phase. Budget allocation will be required before procurement can proceed.`;
                } else {
                  financeMessage = `Project "${this.name}" (${this.code}) that you approved has been fully approved and is now in implementation phase. Finance will handle reimbursement for implementation.`;
                }
              } else {
                // Personal project
                if (this.requiresBudgetAllocation === true) {
                  financeMessage = `Project "${this.name}" (${this.code}) that you approved has been fully approved and is now in implementation phase. Finance will handle reimbursement for implementation.`;
                } else {
                  financeMessage = `Project "${this.name}" (${this.code}) has been fully approved and is now in implementation phase. No budget allocation required.`;
                }
              }

              await notification.createNotification({
                recipient: financeHOD._id,
                type: "PROJECT_IMPLEMENTATION_READY",
                title: "Project Implementation Started",
                message: financeMessage,
                priority: "medium",
                data: {
                  projectId: this._id,
                  projectName: this.name,
                  projectCode: this.code,
                  budget: this.budget,
                  category: this.category,
                  actionUrl: "/dashboard/modules/projects",
                  implementationPhase: "ready",
                  triggeredBy: triggeredByUser ? triggeredByUser._id : null,
                },
              });
              console.log(
                `✅ [WORKFLOW] Notification sent to Finance HOD successfully`
              );
            } else {
              console.log(
                `⚠️ [WORKFLOW] Finance HOD is same as Executive HOD - skipping duplicate notification`
              );
            }
          } else {
            console.log(`⚠️ [WORKFLOW] No Finance HOD found`);
          }
        } else {
          console.log(`⚠️ [WORKFLOW] Finance department not found`);
        }
      } else {
        console.log(
          `ℹ️ [WORKFLOW] Skipping Finance notification - no budget allocation required for personal project`
        );
      }

      // 3. Notify Executive HOD (who just approved)
      if (triggeredByUser && triggeredByUser._id) {
        console.log(
          `📧 [WORKFLOW] Sending notification to Executive HOD (who just approved): ${triggeredByUser.firstName} ${triggeredByUser.lastName}`
        );
        // Create appropriate message based on project scope
        let executiveMessage = "";
        if (this.projectScope === "external") {
          if (this.requiresBudgetAllocation !== false) {
            executiveMessage = `Project "${this.name}" (${this.code}) that you just approved is now in implementation phase. Finance will allocate budget before procurement can proceed.`;
          } else {
            executiveMessage = `Project "${this.name}" (${this.code}) that you just approved is now in implementation phase. Procurement will be initiated.`;
          }
        } else if (this.projectScope === "departmental") {
          if (this.requiresBudgetAllocation === true) {
            executiveMessage = `Project "${this.name}" (${this.code}) that you just approved is now in implementation phase. Budget allocation will be required before procurement can proceed.`;
          } else {
            executiveMessage = `Project "${this.name}" (${this.code}) that you just approved is now in implementation phase. Finance will handle reimbursement for implementation.`;
          }
        } else {
          // Personal project
          if (this.requiresBudgetAllocation === true) {
            executiveMessage = `Project "${this.name}" (${this.code}) that you just approved is now in implementation phase. Finance will handle reimbursement for implementation.`;
          } else {
            executiveMessage = `Project "${this.name}" (${this.code}) that you just approved is now in implementation phase. No budget allocation required.`;
          }
        }

        await notification.createNotification({
          recipient: triggeredByUser._id,
          type: "PROJECT_IMPLEMENTATION_READY",
          title: "Project Implementation Initiated",
          message: executiveMessage,
          priority: "medium",
          data: {
            projectId: this._id,
            projectName: this.name,
            projectCode: this.code,
            budget: this.budget,
            category: this.category,
            actionUrl: "/dashboard/modules/projects",
            implementationPhase: "ready",
            triggeredBy: triggeredByUser._id,
          },
        });
        console.log(
          `✅ [WORKFLOW] Notification sent to Executive HOD successfully`
        );
      } else {
        console.log(
          `⚠️ [WORKFLOW] No triggeredByUser provided - skipping Executive HOD notification`
        );
      }

      console.log(
        `📧 [WORKFLOW] Notifications sent to all stakeholders about implementation readiness`
      );
    } catch (notifError) {
      console.error("❌ [WORKFLOW] Error sending notifications:", notifError);
    }

    console.log("✅ [WORKFLOW] Post-approval workflow completed successfully");
    console.log("🚀 [WORKFLOW] ========================================");

    return this;
  } catch (error) {
    console.error("❌ [WORKFLOW] Error in post-approval workflow:", error);
    throw error;
  }
};

// Instance method to trigger inventory creation
projectSchema.methods.triggerInventoryCreation = async function (
  triggeredByUser
) {
  try {
    console.log(
      "📦 [INVENTORY] Creating inventory items for project:",
      this.code
    );

    // Mark inventory as created
    this.workflowTriggers.inventoryCreated = true;

    // Create standard inventory items for ANY project category
    if (triggeredByUser) {
      try {
        await this.createStandardInventoryItems(triggeredByUser);
        await ProjectAuditService.logInventoryCreated(this, triggeredByUser);
      } catch (error) {
        console.error(
          "❌ [AUDIT] Error creating standard inventory items:",
          error
        );
      }
    }

    // Notify Operations HOD about inventory creation
    try {
      console.log(
        `📧 [INVENTORY] Looking for Operations HOD to notify about inventory creation...`
      );
      const NotificationService = await import(
        "../services/notificationService.js"
      );
      const notification = new NotificationService.default();

      // Find Operations HOD
      const operationsDept = await mongoose.model("Department").findOne({
        name: "Operations",
      });

      if (operationsDept) {
        console.log(
          `📧 [INVENTORY] Found Operations department: ${operationsDept.name}`
        );
        let approverUsers = await mongoose
          .model("User")
          .find({
            department: operationsDept._id,
            "role.name": "HOD",
            isActive: true,
          })
          .populate("department")
          .populate("role");

        console.log(
          `🔍 [INVENTORY] Found ${approverUsers.length} HOD users by role name in department ${operationsDept.name}`
        );

        // If not found by role name, try by role level as backup
        if (approverUsers.length === 0) {
          console.log(
            `⚠️ [INVENTORY] No HOD found by role name, trying by role level...`
          );

          approverUsers = await mongoose
            .model("User")
            .find({
              department: operationsDept._id,
              "role.level": { $gte: 700 },
              isActive: true,
            })
            .populate("department")
            .populate("role");

          console.log(
            `🔍 [INVENTORY] Found ${approverUsers.length} approver users by role level in department ${operationsDept.name}`
          );
        }

        if (approverUsers.length > 0) {
          const operationsHOD = approverUsers[0];
          console.log(
            `📧 [INVENTORY] Found Operations HOD: ${operationsHOD.firstName} ${operationsHOD.lastName} (${operationsHOD.email})`
          );
          console.log(
            `📧 [INVENTORY] Sending inventory creation notification to Operations HOD...`
          );

          await notification.createNotification({
            recipient: operationsHOD._id,
            type: "INVENTORY_CREATION_REQUIRED",
            title: "Inventory Creation Required",
            message: `Project "${this.name}" (${this.code}) has been approved and requires inventory setup. Please review and create inventory items for this project.`,
            priority: "high",
            data: {
              projectId: this._id,
              projectName: this.name,
              projectCode: this.code,
              budget: this.budget,
              category: this.category,
              actionUrl: "/dashboard/modules/inventory",
              triggeredBy: triggeredByUser ? triggeredByUser._id : null,
            },
          });

          console.log(
            `✅ [INVENTORY] Notification sent to Operations HOD: ${operationsHOD.firstName} ${operationsHOD.lastName} (${operationsHOD.email})`
          );
        } else {
          console.log("⚠️ [INVENTORY] No Operations HOD found to notify");
        }
      } else {
        console.log("⚠️ [INVENTORY] Operations department not found");
      }
    } catch (notifError) {
      console.error("❌ [INVENTORY] Error sending notification:", notifError);
    }

    console.log("✅ [INVENTORY] Inventory creation triggered successfully");
    return true;
  } catch (error) {
    console.error("❌ [INVENTORY] Error creating inventory:", error);
    throw error;
  }
};

// Standardized method to create basic inventory items for ANY project category
projectSchema.methods.createStandardInventoryItems = async function (
  createdBy
) {
  try {
    console.log(
      `📦 [INVENTORY] Creating standard inventory items for project: ${this.code}`
    );

    const Inventory = mongoose.model("Inventory");

    // Map project categories to inventory categories (matching Inventory.js enum exactly)
    const getInventoryCategory = (projectCategory) => {
      return mapToUnifiedCategory(projectCategory);
    };

    const totalBudget = this.budget || 0;

    console.log(
      `💰 [INVENTORY] Project budget: ₦${totalBudget.toLocaleString()} - Operations HOD will allocate`
    );
    console.log(
      `📦 [INVENTORY] Project category: ${
        this.category
      } → Inventory category: ${getInventoryCategory(this.category)}`
    );

    // Generate inventory code
    const inventoryCount = await Inventory.countDocuments();
    const inventoryCode = `INV${String(inventoryCount + 1).padStart(4, "0")}`;

    const standardItems = [
      {
        name: `${this.name} - Project Inventory`,
        description: `Complete inventory allocation for project: ${
          this.name
        } (Total Budget: ₦${totalBudget.toLocaleString()}) - Operations HOD to allocate`,
        code: inventoryCode,
        type: "equipment",
        category: getInventoryCategory(this.category),
        status: "available",
        specifications: {
          brand: "ELRA",
          model: "Standard",
          year: new Date().getFullYear(),
          totalProjectBudget: totalBudget,
          budgetAllocated: 0,
          projectCategory: this.category,
        },
        purchasePrice: totalBudget,
        currentValue: totalBudget,
        location: "TBD",
        project: this._id,
        createdBy: createdBy._id,
      },
    ];

    // Create the standard inventory items
    const createdItems = await Inventory.insertMany(standardItems);

    console.log(
      `✅ [INVENTORY] Created ${
        createdItems.length
      } inventory item with ₦${totalBudget.toLocaleString()} budget for Operations HOD to allocate - Project: ${
        this.code
      }`
    );

    return createdItems;
  } catch (error) {
    console.error(
      "❌ [INVENTORY] Error creating standard inventory items:",
      error
    );
    throw error;
  }
};

// Instance method to trigger procurement creation
projectSchema.methods.triggerProcurementCreation = async function (
  triggeredByUser
) {
  try {
    console.log(
      "🛒 [PROCUREMENT] Creating procurement orders for project:",
      this.code
    );

    if (this.workflowTriggers.procurementInitiated) {
      console.log(
        "⚠️ [PROCUREMENT] Procurement already initiated for this project, skipping duplicate creation"
      );
      return;
    }

    this.workflowTriggers.procurementInitiated = true;
    await this.save();

    if (triggeredByUser) {
      try {
        console.log(
          `🛒 [PROCUREMENT] Starting PO creation for project: ${this.name} (${this.code})`
        );
        console.log(
          `🛒 [PROCUREMENT] Triggered by: ${triggeredByUser.firstName} ${triggeredByUser.lastName} (${triggeredByUser.email})`
        );
        console.log(
          `🛒 [PROCUREMENT] Project budget: ₦${this.budget?.toLocaleString()}`
        );
        console.log(
          `🛒 [PROCUREMENT] Project items count: ${
            this.projectItems?.length || 0
          }`
        );

        const createdPO = await this.createStandardProcurementOrder(
          triggeredByUser
        );
        console.log(
          `✅ [PROCUREMENT] PO created successfully: ${createdPO.poNumber}`
        );
        console.log(
          `✅ [PROCUREMENT] PO total amount: ₦${createdPO.totalAmount?.toLocaleString()}`
        );
        console.log(
          `✅ [PROCUREMENT] PO items count: ${createdPO.items?.length || 0}`
        );

        await ProjectAuditService.logProcurementInitiated(
          this,
          triggeredByUser
        );
        console.log(
          `✅ [PROCUREMENT] Audit log created for procurement initiation`
        );
      } catch (error) {
        console.error(
          "❌ [PROCUREMENT] Error creating standard procurement order:",
          error
        );
        console.error("❌ [PROCUREMENT] Error details:", error.message);
        console.error("❌ [PROCUREMENT] Error stack:", error.stack);
      }
    }

    try {
      console.log(
        `📧 [PROCUREMENT] Looking for Procurement HOD to notify about procurement initiation...`
      );
      const NotificationService = await import(
        "../services/notificationService.js"
      );
      const notification = new NotificationService.default();

      const procurementDept = await mongoose.model("Department").findOne({
        name: "Procurement",
      });

      if (procurementDept) {
        console.log(
          `📧 [PROCUREMENT] Found Procurement department: ${procurementDept.name}`
        );
        // Get HOD role ID first
        const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });
        if (!hodRole) {
          console.log("❌ [PROCUREMENT] HOD role not found in system");
          return;
        }

        const procurementHOD = await mongoose
          .model("User")
          .findOne({
            department: procurementDept._id,
            role: hodRole._id,
            isActive: true,
          })
          .populate("role");

        if (procurementHOD) {
          console.log(
            `📧 [PROCUREMENT] Found Procurement HOD: ${procurementHOD.firstName} ${procurementHOD.lastName} (${procurementHOD.email})`
          );
          console.log(
            `📧 [PROCUREMENT] Sending procurement initiation notification to Procurement HOD...`
          );

          await notification.createNotification({
            recipient: procurementHOD._id,
            type: "PROCUREMENT_INITIATION_REQUIRED",
            title: "Procurement Initiation Required",
            message: `Project "${this.name}" (${this.code}) requires procurement setup. Please review and initiate procurement processes for this project.`,
            priority: "high",
            data: {
              projectId: this._id,
              projectName: this.name,
              projectCode: this.code,
              budget: this.budget,
              category: this.category,
              actionUrl: "/dashboard/modules/procurement",
              triggeredBy: triggeredByUser ? triggeredByUser._id : null,
            },
          });

          console.log(
            `✅ [PROCUREMENT] Notification sent to Procurement HOD: ${procurementHOD.firstName} ${procurementHOD.lastName} (${procurementHOD.email})`
          );
        } else {
          console.log("⚠️ [PROCUREMENT] No Procurement HOD found to notify");
        }
      } else {
        console.log("⚠️ [PROCUREMENT] Procurement department not found");
      }
    } catch (notifError) {
      console.error("❌ [PROCUREMENT] Error sending notification:", notifError);
    }

    console.log("✅ [PROCUREMENT] Procurement creation triggered successfully");
    return true;
  } catch (error) {
    console.error("❌ [PROCUREMENT] Error creating procurement:", error);
    throw error;
  }
};

// Standardized method to create basic procurement order for ANY project category
projectSchema.methods.createStandardProcurementOrder = async function (
  createdBy
) {
  try {
    console.log(
      `🛒 [PROCUREMENT] Creating standard procurement order for project: ${this.code}`
    );

    const Procurement = mongoose.model("Procurement");

    // Map project categories to procurement categories using unified system
    const getProcurementCategory = (projectCategory) => {
      return mapToUnifiedCategory(projectCategory);
    };

    const totalBudget = this.budget || 0;
    const procurementCategory = getProcurementCategory(this.category);

    // Calculate actual budget from project items if available
    let actualBudget = totalBudget;
    if (this.projectItems && this.projectItems.length > 0) {
      actualBudget = this.projectItems.reduce((sum, item) => {
        return sum + (item.quantity || 1) * (item.unitPrice || 0);
      }, 0);

      // Log budget discrepancy if any
      if (actualBudget !== totalBudget) {
        console.log(`⚠️ [PROCUREMENT] Budget discrepancy detected:`);
        console.log(`  - Project Budget: ₦${totalBudget.toLocaleString()}`);
        console.log(`  - Items Total: ₦${actualBudget.toLocaleString()}`);
        console.log(
          `  - Difference: ₦${(totalBudget - actualBudget).toLocaleString()}`
        );
        console.log(
          `  - Procurement will use Items Total: ₦${actualBudget.toLocaleString()}`
        );
      }
    }

    console.log(
      `🛒 [PROCUREMENT] Project category: ${this.category} → Procurement category: ${procurementCategory}`
    );
    console.log(
      `💰 [PROCUREMENT] Project budget: ₦${totalBudget.toLocaleString()} → Actual items budget: ₦${actualBudget.toLocaleString()}`
    );

    // Generate PO number
    const poCount = await Procurement.countDocuments();
    const poNumber = `PO${String(poCount + 1).padStart(4, "0")}`;

    // Create procurement order with actual project items (if available)
    let procurementItems = [];
    let calculatedSubtotal = 0;

    console.log(
      `🛒 [PROCUREMENT] Processing ${
        this.projectItems?.length || 0
      } project items for PO creation...`
    );

    if (this.projectItems && this.projectItems.length > 0) {
      console.log(
        `🛒 [PROCUREMENT] Found ${this.projectItems.length} project items to convert to ONE procurement order`
      );

      procurementItems = this.projectItems.map((item, index) => {
        const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
        calculatedSubtotal += itemTotal;

        console.log(
          `🛒 [PROCUREMENT] Converting project item ${index + 1}: ${
            item.name
          } - Qty: ${
            item.quantity
          } x ₦${item.unitPrice?.toLocaleString()} = ₦${itemTotal.toLocaleString()}`
        );

        return {
          name: item.name || `Project Item ${index + 1}`,
          description: item.description || `Item from project: ${this.name}`,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: itemTotal,
          category: procurementCategory,
          specifications: {
            brand: "TBD",
            model: "TBD",
            year: new Date().getFullYear(),
            deliveryTimeline: item.deliveryTimeline || "TBD",
            projectItemId: index + 1,
          },
        };
      });

      console.log(
        `🛒 [PROCUREMENT] Converted ${procurementItems.length} project items into ONE procurement order`
      );
    } else {
      // Fallback to generic item for non-external projects
      procurementItems = [
        {
          name: `${this.name} - Project Items`,
          description: `Procurement items for project: ${this.name}`,
          quantity: 1,
          unitPrice: totalBudget,
          totalPrice: totalBudget,
          category: procurementCategory,
          specifications: {
            brand: "TBD",
            model: "TBD",
            year: new Date().getFullYear(),
          },
        },
      ];
      calculatedSubtotal = totalBudget;
    }

    // Check if project has vendor information to pre-populate
    let supplierInfo = {
      name: "TBD - Procurement HOD to assign",
      contactPerson: "TBD",
      email: "tbd@supplier.com",
      phone: "TBD",
    };

    // Pre-populate vendor information if available
    console.log(
      `🔍 [PROCUREMENT] Checking vendor for project: ${this.name} (${this.code})`
    );
    console.log(`🔍 [PROCUREMENT] Project vendorId: ${this.vendorId}`);

    if (this.vendorId) {
      try {
        const Vendor = mongoose.model("Vendor");
        const vendor = await Vendor.findById(this.vendorId);

        if (vendor) {
          console.log(
            `🏢 [PROCUREMENT] Pre-populating vendor information from project: ${vendor.name}`
          );
          supplierInfo = {
            name: vendor.name,
            contactPerson: vendor.contactPerson,
            email: vendor.email,
            phone: vendor.phone,
            address: vendor.address || "",
          };

          console.log(
            `✅ [PROCUREMENT] Vendor pre-populated: ${vendor.name} (${
              vendor.email || "No email"
            })`
          );
        } else {
          console.log(
            `⚠️ [PROCUREMENT] Vendor ID exists but vendor not found: ${this.vendorId}`
          );
        }
      } catch (vendorError) {
        console.error(
          `❌ [PROCUREMENT] Error fetching vendor information:`,
          vendorError
        );
        console.log(`⚠️ [PROCUREMENT] Continuing with default supplier info`);
      }
    } else {
      console.log(
        `ℹ️ [PROCUREMENT] No vendor assigned to project - using default supplier info`
      );
    }

    console.log(`🔍 [PROCUREMENT] Final supplier info:`, supplierInfo);

    // Calculate correct budget for external projects
    let finalBudget = calculatedSubtotal;
    let budgetDescription = `Procurement order for project: ${
      this.name
    } (Budget: ₦${totalBudget.toLocaleString()}) - Procurement HOD to process`;

    if (
      this.projectScope === "external" &&
      this.budgetPercentage &&
      this.budgetPercentage < 100
    ) {
      // For external projects with client contribution
      const elraContribution =
        (calculatedSubtotal * this.budgetPercentage) / 100;
      const clientContribution = calculatedSubtotal - elraContribution;

      finalBudget = elraContribution; // Only ELRA's portion
      budgetDescription = `Procurement order for ${
        this.projectScope
      } project: ${this.name} - ELRA handles ${
        this.budgetPercentage
      }% (₦${elraContribution.toLocaleString()}) | Client handles ${
        100 - this.budgetPercentage
      }% (₦${clientContribution.toLocaleString()}) - Total: ₦${calculatedSubtotal.toLocaleString()}`;

      console.log(`💰 [PROCUREMENT] External project budget breakdown:`);
      console.log(
        `  - Total Project Cost: ₦${calculatedSubtotal.toLocaleString()}`
      );
      console.log(
        `  - ELRA Contribution (${
          this.budgetPercentage
        }%): ₦${elraContribution.toLocaleString()}`
      );
      console.log(
        `  - Client Contribution (${
          100 - this.budgetPercentage
        }%): ₦${clientContribution.toLocaleString()}`
      );
      console.log(
        `  - Procurement will use ELRA's portion: ₦${finalBudget.toLocaleString()}`
      );
    }

    const procurementOrder = new Procurement({
      poNumber: poNumber,
      title: `${this.name} - Procurement Order`,
      description: budgetDescription,
      status: "draft",
      priority: this.priority,
      supplier: supplierInfo,
      items: procurementItems,
      subtotal: finalBudget,
      tax: 0,
      shipping: 0,
      totalAmount: finalBudget,
      paidAmount: 0,
      relatedProject: this._id,
      vendorId: this.vendorId || null, // Link to vendor if available
      requestedBy: createdBy._id,
      approvedBy: createdBy._id,
      createdBy: createdBy._id,
    });

    console.log(`🛒 [PROCUREMENT] Saving procurement order to database...`);
    console.log(`🛒 [PROCUREMENT] PO Number: ${poNumber}`);
    console.log(
      `🛒 [PROCUREMENT] Total Amount: ₦${finalBudget.toLocaleString()}`
    );
    console.log(`🛒 [PROCUREMENT] Items: ${procurementItems.length} items`);

    const savedOrder = await procurementOrder.save();

    console.log(
      `✅ [PROCUREMENT] Procurement order saved successfully to database!`
    );
    console.log(`✅ [PROCUREMENT] Saved PO ID: ${savedOrder._id}`);

    console.log(
      `✅ [PROCUREMENT] Created procurement order ${poNumber} with ₦${finalBudget.toLocaleString()} budget for project: ${
        this.code
      }`
    );
    console.log(`✅ [PROCUREMENT] PO Details:`);
    console.log(`   - PO Number: ${poNumber}`);
    console.log(`   - Total Amount: ₦${finalBudget.toLocaleString()}`);
    console.log(`   - Items Count: ${procurementItems.length}`);
    console.log(`   - Category: ${procurementCategory}`);
    if (this.vendorId) {
      console.log(`   - Vendor Pre-populated: Yes`);
      console.log(`   - Vendor Name: ${supplierInfo.name}`);
      console.log(`   - Vendor Email: ${supplierInfo.email}`);
      console.log(`   - Vendor Phone: ${supplierInfo.phone}`);
      console.log(`   - Vendor Address: ${supplierInfo.address}`);
    } else {
      console.log(`   - Vendor Pre-populated: No`);
      console.log(`   - Supplier: ${supplierInfo.name}`);
    }
    console.log(`   - Status: ${savedOrder.status}`);
    console.log(`   - Related Project: ${this.name} (${this.code})`);
    console.log(
      `   - Created By: ${createdBy.firstName} ${createdBy.lastName}`
    );

    return savedOrder;
  } catch (error) {
    console.error(
      "❌ [PROCUREMENT] Error creating standard procurement order:",
      error
    );
    throw error;
  }
};

// Instance method to create inventory from procurement when goods are delivered
projectSchema.methods.createInventoryFromProcurement = async function (
  procurementOrder,
  triggeredByUser
) {
  try {
    console.log(
      `📦 [INVENTORY] Creating inventory from procurement order: ${procurementOrder.poNumber}`
    );

    this.workflowTriggers.inventoryCreated = true;

    const Inventory = mongoose.model("Inventory");
    const inventoryItems = [];

    // Create inventory items from procurement items
    for (const procurementItem of procurementOrder.items) {
      const inventoryCount = await Inventory.countDocuments();
      const inventoryCode = `INV${String(inventoryCount + 1).padStart(4, "0")}`;

      // Map project category to valid inventory category
      const getInventoryCategory = (projectCategory) => {
        const categoryMap = {
          equipment_lease: "industrial_equipment",
          vehicle_lease: "passenger_vehicle",
          property_lease: "office_space",
          financial_lease: "office_equipment",
          training_equipment_lease: "office_equipment",
          compliance_lease: "office_equipment",
          service_equipment_lease: "industrial_equipment",
          strategic_lease: "industrial_equipment",

          software_development: "software_development",
          system_maintenance: "it_equipment",

          consulting: "office_equipment",
          training: "office_equipment",

          other: "other",
        };

        return categoryMap[projectCategory] || "office_equipment";
      };

      const inventoryItem = {
        name: procurementItem.name,
        description: procurementItem.description,
        code: inventoryCode,
        type: "equipment",
        category: getInventoryCategory(this.category),
        status: "available",
        specifications: {
          brand: procurementItem.specifications?.brand || "TBD",
          model: procurementItem.specifications?.model || "TBD",
          year:
            procurementItem.specifications?.year || new Date().getFullYear(),
          deliveryTimeline:
            procurementItem.specifications?.deliveryTimeline || "TBD",
          procurementOrder: procurementOrder.poNumber,
        },
        purchasePrice: procurementItem.totalPrice,
        currentValue: procurementItem.totalPrice,
        location: "TBD",
        project: this._id,
        procurementId: procurementOrder._id,
        createdBy: triggeredByUser._id,
        quantity: procurementItem.quantity,
        unitPrice: procurementItem.unitPrice,
      };

      inventoryItems.push(inventoryItem);
    }

    const createdItems = await Inventory.insertMany(inventoryItems);

    procurementOrder.createdInventoryItems = createdItems.map(
      (item) => item._id
    );
    await procurementOrder.save();
    await this.save();

    console.log(
      `✅ [INVENTORY] Created ${createdItems.length} inventory items from procurement order ${procurementOrder.poNumber}`
    );

    if (this.requiresBudgetAllocation === true) {
      console.log(
        `🚀 [INVENTORY] ${this.projectScope} project with budget allocation - setting to implementation status`
      );
      this.status = "implementation";

      try {
        await this.createImplementationTasks(triggeredByUser);
        console.log(
          `✅ [INVENTORY] Implementation tasks created for ${this.projectScope} project`
        );
      } catch (taskError) {
        console.error(
          `❌ [INVENTORY] Error creating implementation tasks:`,
          taskError
        );
      }

      // Save the project with updated status
      await this.save();
      console.log(
        `✅ [INVENTORY] Project status updated to 'implementation' for project: ${this.code}`
      );
    }

    await this.notifyOperationsHODForInventory(
      procurementOrder,
      triggeredByUser
    );

    await this.notifyProcurementHODOfDeliveryCompletion(
      procurementOrder,
      triggeredByUser
    );

    return createdItems;
  } catch (error) {
    console.error(
      "❌ [INVENTORY] Error creating inventory from procurement:",
      error
    );
    throw error;
  }
};

// Instance method to notify Operations HOD about pending inventory
projectSchema.methods.notifyOperationsHOD = async function (triggeredByUser) {
  try {
    console.log("📧 [NOTIFICATION] Sending notification to Operations HOD...");

    const NotificationService = await import(
      "../services/notificationService.js"
    );
    const notification = new NotificationService.default();

    // Find Operations HOD
    const Department = mongoose.model("Department");
    const User = mongoose.model("User");

    const operationsDept = await Department.findOne({ name: "Operations" });
    if (!operationsDept) {
      console.log("⚠️ [NOTIFICATION] Operations department not found");
      return;
    }

    // Try to find Operations HOD by role name first, then fall back to role level
    let operationsHOD = await User.findOne({
      department: operationsDept._id,
      "role.name": "HOD",
      isActive: true,
    });

    // If not found by role name, try by role level as backup
    if (!operationsHOD) {
      operationsHOD = await User.findOne({
        department: operationsDept._id,
        "role.level": { $gte: 700 }, // HOD level or higher
        isActive: true,
      });
    }

    if (operationsHOD) {
      console.log(
        `📧 [NOTIFICATION] Found Operations HOD: ${operationsHOD.firstName} ${operationsHOD.lastName} (${operationsHOD.email})`
      );

      await notification.createNotification({
        recipient: operationsHOD._id,
        type: "INVENTORY_PENDING_FOR_PROJECT",
        title: "Inventory Setup Pending",
        message: `Project "${this.name}" (${this.code}) has been approved. Procurement will be initiated first. You will be notified when goods arrive for inventory setup.`,
        priority: "medium",
        data: {
          projectId: this._id,
          projectName: this.name,
          projectCode: this.code,
          budget: this.budget,
          category: this.category,
          actionUrl: "/dashboard/modules/inventory",
          triggeredBy: triggeredByUser ? triggeredByUser._id : null,
          workflowPhase: "procurement_pending",
        },
      });

      console.log(
        `✅ [NOTIFICATION] Operations HOD notified: ${operationsHOD.firstName} ${operationsHOD.lastName}`
      );
    } else {
      console.log("⚠️ [NOTIFICATION] No Operations HOD found to notify");
    }
  } catch (error) {
    console.error("❌ [NOTIFICATION] Error notifying Operations HOD:", error);
  }
};

// Instance method to notify Operations HOD when goods are delivered
projectSchema.methods.notifyOperationsHODForInventory = async function (
  procurementOrder,
  deliveredBy
) {
  try {
    console.log(
      "📧 [NOTIFICATION] Notifying Operations HOD for inventory setup..."
    );

    const NotificationService = await import(
      "../services/notificationService.js"
    );
    const notification = new NotificationService.default();

    // Find Operations HOD
    const Department = mongoose.model("Department");
    const User = mongoose.model("User");

    const operationsDept = await Department.findOne({ name: "Operations" });
    if (!operationsDept) {
      console.log("⚠️ [NOTIFICATION] Operations department not found");
      return;
    }

    const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });
    if (!hodRole) {
      console.log("❌ [NOTIFICATION] HOD role not found in system");
      return;
    }

    const operationsHOD = await User.findOne({
      department: operationsDept._id,
      role: hodRole._id,
      isActive: true,
    })
      .populate("role")
      .populate("department");

    if (operationsHOD) {
      console.log(
        `📧 [NOTIFICATION] Found Operations HOD: ${operationsHOD.firstName} ${operationsHOD.lastName} (${operationsHOD.email})`
      );

      await notification.createNotification({
        recipient: operationsHOD._id,
        type: "INVENTORY_SETUP_REQUIRED",
        title: "Inventory Setup Required",
        message: `${
          this.name
            ? `Goods have been delivered for project "${this.name}" (${this.code}).`
            : "Goods have been delivered."
        } Procurement order ${
          procurementOrder.poNumber
        } is ready for inventory setup.`,
        priority: "high",
        data: {
          projectId: this._id,
          projectName: this.name,
          projectCode: this.code,
          procurementOrderId: procurementOrder._id,
          procurementOrderNumber: procurementOrder.poNumber,
          budget: this.budget,
          category: this.category,
          actionUrl: "/dashboard/modules/inventory",
          deliveredBy: deliveredBy ? deliveredBy._id : null,
          workflowPhase: "inventory_setup_required",
        },
      });

      console.log(
        `✅ [NOTIFICATION] Operations HOD notified for inventory setup: ${operationsHOD.firstName} ${operationsHOD.lastName}`
      );
    } else {
      console.log("⚠️ [NOTIFICATION] No Operations HOD found to notify");
    }
  } catch (error) {
    console.error(
      "❌ [NOTIFICATION] Error notifying Operations HOD for inventory:",
      error
    );
  }
};

projectSchema.methods.notifyProcurementHODOfDeliveryCompletion =
  async function (procurementOrder, deliveredBy) {
    try {
      console.log(
        "📧 [NOTIFICATION] Notifying Procurement HOD of delivery completion..."
      );

      const NotificationService = await import(
        "../services/notificationService.js"
      );
      const notification = new NotificationService.default();

      // Find Procurement HOD
      const Department = mongoose.model("Department");
      const User = mongoose.model("User");

      const procurementDept = await Department.findOne({ name: "Procurement" });
      if (!procurementDept) {
        console.log("⚠️ [NOTIFICATION] Procurement department not found");
        return;
      }

      // Get HOD role ID first (same approach as other HOD queries)
      const hodRole = await mongoose.model("Role").findOne({ name: "HOD" });
      if (!hodRole) {
        console.log("❌ [NOTIFICATION] HOD role not found in system");
        return;
      }

      const procurementHOD = await User.findOne({
        department: procurementDept._id,
        role: hodRole._id,
        isActive: true,
      })
        .populate("role")
        .populate("department");

      if (procurementHOD) {
        console.log(
          `📧 [NOTIFICATION] Found Procurement HOD: ${procurementHOD.firstName} ${procurementHOD.lastName} (${procurementHOD.email})`
        );

        await notification.createNotification({
          recipient: procurementHOD._id,
          type: "PROCUREMENT_DELIVERY_COMPLETED",
          title: "Procurement Delivery Completed",
          message: `Procurement order ${procurementOrder.poNumber} has been successfully delivered and inventory has been created. Operations HOD has been notified for inventory setup.`,
          priority: "medium",
          data: {
            projectId: this._id,
            projectName: this.name,
            projectCode: this.code,
            procurementOrderId: procurementOrder._id,
            procurementOrderNumber: procurementOrder.poNumber,
            budget: this.budget,
            category: this.category,
            actionUrl: "/dashboard/modules/procurement",
            deliveredBy: deliveredBy ? deliveredBy._id : null,
            workflowPhase: "delivery_completed",
          },
        });

        console.log(
          `✅ [NOTIFICATION] Procurement HOD notified of delivery completion: ${procurementHOD.firstName} ${procurementHOD.lastName}`
        );
      } else {
        console.log("⚠️ [NOTIFICATION] No Procurement HOD found to notify");
      }
    } catch (error) {
      console.error(
        "❌ [NOTIFICATION] Error notifying Procurement HOD of delivery completion:",
        error
      );
    }
  };

// Instance method to notify Finance HOD for budget review (not allocation)
projectSchema.methods.notifyFinanceHODForBudgetReview = async function (
  triggeredByUser
) {
  try {
    console.log(
      "📧 [NOTIFICATION] Sending budget review notification to Finance HOD..."
    );

    const NotificationService = await import(
      "../services/notificationService.js"
    );
    const notification = new NotificationService.default();

    // Find Finance HOD
    const Department = mongoose.model("Department");
    const User = mongoose.model("User");

    const financeDept = await Department.findOne({
      name: "Finance & Accounting",
    });
    if (!financeDept) {
      console.log("⚠️ [NOTIFICATION] Finance department not found");
      return;
    }

    // Try to find Finance HOD by role name first, then fall back to role level
    let financeHOD = await User.findOne({
      department: financeDept._id,
      "role.name": "HOD",
      isActive: true,
    });

    // If not found by role name, try by role level as backup
    if (!financeHOD) {
      financeHOD = await User.findOne({
        department: financeDept._id,
        "role.level": { $gte: 700 },
        isActive: true,
      });
    }

    if (financeHOD) {
      console.log(
        `📧 [NOTIFICATION] Found Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName} (${financeHOD.email})`
      );

      await notification.createNotification({
        recipient: financeHOD._id,
        type: "BUDGET_REVIEW_REQUIRED",
        title: "Budget Review Required",
        message: `External project "${this.name}" (${
          this.code
        }) requires your budget review and validation of ₦${this.budget.toLocaleString()}. This is a REVIEW step - you will validate budget calculations before Executive approval.`,
        priority: "high",
        data: {
          projectId: this._id,
          projectName: this.name,
          projectCode: this.code,
          budget: this.budget,
          category: this.category,
          actionUrl: "/dashboard/modules/finance",
          triggeredBy: triggeredByUser ? triggeredByUser._id : null,
          workflowPhase: "budget_review_required",
          requiresBudgetAllocation: this.requiresBudgetAllocation,
        },
      });

      console.log(
        `✅ [NOTIFICATION] Finance HOD notified for budget review: ${financeHOD.firstName} ${financeHOD.lastName}`
      );
    } else {
      console.log("⚠️ [NOTIFICATION] No Finance HOD found to notify");
    }
  } catch (error) {
    console.error("❌ [NOTIFICATION] Error notifying Finance HOD:", error);
  }
};

projectSchema.methods.notifyFinanceHODForBudgetAllocation = async function (
  triggeredByUser
) {
  try {
    console.log(
      "📧 [NOTIFICATION] Sending budget allocation notification to Finance HOD..."
    );
    console.log(`📧 [NOTIFICATION] Project: ${this.name} (${this.code})`);
    console.log(`📧 [NOTIFICATION] Project scope: ${this.projectScope}`);
    console.log(
      `📧 [NOTIFICATION] Requires budget allocation: ${this.requiresBudgetAllocation}`
    );
    console.log(
      `📧 [NOTIFICATION] Project items total: ₦${this.projectItems
        .reduce((sum, item) => sum + item.totalPrice, 0)
        .toLocaleString()}`
    );

    const NotificationService = await import(
      "../services/notificationService.js"
    );
    const notification = new NotificationService.default();

    // Find Finance HOD
    const Department = mongoose.model("Department");
    const User = mongoose.model("User");

    const financeDept = await Department.findOne({
      name: "Finance & Accounting",
    });
    if (!financeDept) {
      console.log("⚠️ [NOTIFICATION] Finance department not found");
      return;
    }

    // Try to find Finance HOD by role name first, then fall back to role level
    let financeHODs = await User.find({
      department: financeDept._id,
      "role.name": "HOD",
      isActive: true,
    });

    if (financeHODs.length === 0) {
      console.log(
        "⚠️ [NOTIFICATION] No Finance HOD found by role name, trying by role level"
      );
      financeHODs = await User.find({
        department: financeDept._id,
        "role.level": { $gte: 700 },
        isActive: true,
      });
    }

    if (financeHODs.length > 0) {
      const financeHOD = financeHODs[0];

      console.log(
        `📧 [NOTIFICATION] Found Finance HOD: ${financeHOD.firstName} ${financeHOD.lastName} (${financeHOD.email})`
      );

      await notification.createNotification({
        recipient: financeHOD._id,
        type: "BUDGET_ALLOCATION_REQUIRED",
        title: "Budget Allocation Required",
        message: `Project "${this.name}" (${
          this.code
        }) has been approved by Executive and now requires budget allocation of ₦${this.projectItems
          .reduce((sum, item) => sum + item.totalPrice, 0)
          .toLocaleString()} for procurement items.`,
        priority: "high",
        data: {
          projectId: this._id,
          projectName: this.name,
          projectCode: this.code,
          budget: this.budget,
          category: this.category,
          actionUrl: "/dashboard/modules/finance",
          triggeredBy: triggeredByUser ? triggeredByUser._id : null,
          workflowPhase: "budget_allocation_required",
          requiresBudgetAllocation: this.requiresBudgetAllocation,
        },
      });

      console.log(
        `✅ [NOTIFICATION] Finance HOD notified for budget allocation: ${financeHOD.firstName} ${financeHOD.lastName}`
      );
    } else {
      console.log("⚠️ [NOTIFICATION] No Finance HOD found to notify");
    }
  } catch (error) {
    console.error("❌ [NOTIFICATION] Error notifying Finance HOD:", error);
  }
};

// Instance method to create project documents for regulatory compliance
projectSchema.methods.createProjectDocuments = async function (
  triggeredByUser
) {
  try {
    console.log(
      "📄 [DOCUMENTS] Creating project documents for regulatory compliance"
    );

    // Get the user who triggered this (for audit purposes)
    const User = mongoose.model("User");
    const user = await User.findById(triggeredByUser).populate(
      "role department"
    );

    // Create required documents
    const documents = await ProjectDocumentService.createProjectDocuments(
      this,
      user
    );

    // Create approval workflows for each document
    for (const document of documents) {
      try {
        await ProjectDocumentService.createDocumentApprovalWorkflow(
          document,
          this
        );
        console.log(
          `📋 [DOCUMENT WORKFLOW] Created approval workflow for: ${document.title}`
        );
      } catch (error) {
        console.error(
          `❌ [DOCUMENT WORKFLOW] Error creating workflow for ${document.title}:`,
          error
        );
      }
    }

    console.log(
      `✅ [DOCUMENTS] Created ${documents.length} documents with approval workflows`
    );
    return documents;
  } catch (error) {
    console.error("❌ [DOCUMENTS] Error creating project documents:", error);
    throw error;
  }
};

// Instance method to create project tasks for execution phase
projectSchema.methods.createProjectTasks = async function (triggeredByUser) {
  try {
    console.log("📋 [TASKS] Creating project tasks for execution phase");

    // Get project team members
    const teamMembers = this.teamMembers || [];

    // Use standardized workflow for ALL project categories
    const taskTemplates = this.getStandardInventoryWorkflow();

    // Create tasks for each team member
    let totalTasksCreated = 0;
    for (const member of teamMembers) {
      const memberTasks = this.generateMemberTasks(member, taskTemplates);
      totalTasksCreated += memberTasks.length;
      console.log(
        `📋 [TASKS] Created ${memberTasks.length} tasks for team member: ${member.user}`
      );
    }

    // Audit logging for tasks creation
    if (triggeredByUser) {
      try {
        await ProjectAuditService.logTasksCreated(
          this,
          triggeredByUser,
          totalTasksCreated
        );
      } catch (error) {
        console.error("❌ [AUDIT] Error logging tasks creation:", error);
      }
    }

    console.log("✅ [TASKS] Project tasks created successfully");
    return true;
  } catch (error) {
    console.error("❌ [TASKS] Error creating project tasks:", error);
    throw error;
  }
};

// Standardized inventory creation workflow for ALL project categories
projectSchema.methods.getStandardInventoryWorkflow = function () {
  // Universal inventory tasks that work for ANY project category
  return {
    inventory: [
      "Review project requirements and specifications",
      "Create inventory item records",
      "Assign inventory codes and locations",
      "Set up asset tracking and monitoring",
      "Verify compliance and safety requirements",
      "Complete inventory documentation",
    ],
    procurement: [
      "Review vendor quotes and proposals",
      "Approve purchase orders and contracts",
      "Track delivery and installation timeline",
      "Verify quality and specifications",
      "Complete procurement documentation",
    ],
    finance: [
      "Set up cost tracking and monitoring",
      "Monitor budget utilization",
      "Generate financial reports",
      "Track payment schedules",
      "Complete financial documentation",
    ],
  };
};

// Helper method to generate tasks for a team member
projectSchema.methods.generateMemberTasks = function (member, templates) {
  const tasks = [];

  // Add inventory tasks
  templates.inventory.forEach((taskName) => {
    tasks.push({
      title: taskName,
      description: `${taskName} for project ${this.name}`,
      assignedTo: member.user,
      project: this._id,
      category: "inventory",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: "pending",
    });
  });

  // Add procurement tasks
  templates.procurement.forEach((taskName) => {
    tasks.push({
      title: taskName,
      description: `${taskName} for project ${this.name}`,
      assignedTo: member.user,
      project: this._id,
      category: "procurement",
      priority: "high",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      status: "pending",
    });
  });

  // Add finance tasks
  templates.finance.forEach((taskName) => {
    tasks.push({
      title: taskName,
      description: `${taskName} for project ${this.name}`,
      assignedTo: member.user,
      project: this._id,
      category: "finance",
      priority: "medium",
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
      status: "pending",
    });
  });

  return tasks;
};

// Instance method to apply workflow template based on project criteria
projectSchema.methods.applyWorkflowTemplate = async function () {
  try {
    console.log(
      "📋 [APPROVAL] Generating approval chain for project:",
      this.code
    );

    // Use the simple, direct approval chain generation
    const approvalChain = await this.generateApprovalChain();

    console.log(
      `✅ [APPROVAL] Generated approval chain with ${approvalChain.length} steps`
    );
    return approvalChain;
  } catch (error) {
    console.error("❌ [APPROVAL] Error generating approval chain:", error);
    throw error;
  }
};

// Instance method to generate approval chain based on project scope and budget threshold
projectSchema.methods.generateApprovalChain = async function () {
  const approvalChain = [];

  console.log(`🏢 [APPROVAL] Project Scope: ${this.projectScope}`);
  console.log(`💰 [APPROVAL] Project Budget: ${this.budget}`);
  console.log(`🎯 [APPROVAL] Budget Threshold: ${this.budgetThreshold}`);

  // Get creator's department info for special case handling
  const creator = await mongoose
    .model("User")
    .findById(this.createdBy)
    .populate("department");
  const creatorDepartment = creator?.department?.name;
  const isCreatorHOD = creator?.role?.level === 700;
  const isSpecialCase = isSpecialCaseHOD(
    creatorDepartment,
    creator?.role?.level
  );

  console.log(
    `👤 [APPROVAL] Creator Department: ${creatorDepartment}, Is HOD: ${isCreatorHOD}, Is Special Case: ${isSpecialCase}`
  );

  // Check budget threshold to determine approval levels needed
  // NEW LOGIC: Consider both budget threshold AND budget allocation requirement
  const needsFullApprovalChain =
    this.budgetThreshold === "legal_finance_approval" ||
    this.budgetThreshold === "legal_executive_approval" ||
    this.budgetThreshold === "finance_approval" ||
    this.budgetThreshold === "executive_approval" ||
    this.requiresBudgetAllocation;

  console.log(
    `🔍 [APPROVAL] Needs Full Approval Chain: ${needsFullApprovalChain}`
  );
  console.log(
    `💰 [APPROVAL] Budget Allocation Required: ${this.requiresBudgetAllocation}`
  );

  // Different approval chains based on project scope
  if (this.projectScope === "personal") {
    // Personal Project Workflow: Creator → Department HOD → Project Management HOD → Finance HOD → Executive HOD → Finance Reimbursement
    console.log("👤 [APPROVAL] Personal Project Workflow");

    // Department HOD approval first
    // Skip if creator is Super Admin (1000) or Special Case HOD of their own department
    if (creator?.role?.level === 1000) {
      console.log(
        "✅ [APPROVAL] Auto-approving Department HOD - creator is Super Admin"
      );
    } else if (isSpecialCase && creatorDepartment === this.department?.name) {
      console.log(
        `✅ [APPROVAL] Auto-approving Department HOD - creator is Special Case HOD (${creatorDepartment}) of their own department`
      );
    } else {
      approvalChain.push({
        level: "hod",
        department: this.department,
        status: "pending",
        required: true,
        type: "personal_department_approval",
      });
    }

    // Project Management HOD approval (ALWAYS required for personal projects)
    // For self-funded projects: HOD → Project Management HOD (stops here)
    // For budget allocation projects: HOD → Project Management HOD → Finance → Budget Allocation
    if (true) {
      // Always add Project Management approval for personal projects
      // Skip if creator is Super Admin (1000) or Special Case Project Management HOD
      if (creator?.role?.level === 1000) {
        console.log(
          "✅ [APPROVAL] Auto-approving Project Management - creator is Super Admin"
        );
      } else if (isSpecialCase && creatorDepartment === "Project Management") {
        console.log(
          "✅ [APPROVAL] Auto-approving Project Management - creator is Special Case Project Management HOD"
        );
      } else {
        // Need Project Management HOD approval
        const projectMgmtDept = await mongoose
          .model("Department")
          .findOne({ name: "Project Management" });
        if (projectMgmtDept) {
          approvalChain.push({
            level: "project_management",
            department: projectMgmtDept._id,
            status: "pending",
            required: true,
            type: "personal_project_management_approval",
          });
        }
      }
    }

    // Legal and Finance approval (only if budget allocation is required)
    if (this.requiresBudgetAllocation === true) {
      // Legal Compliance approval
      if (creator?.role?.level === 1000) {
        console.log(
          "✅ [APPROVAL] Auto-approving Legal Compliance - creator is Super Admin"
        );
      } else if (isSpecialCase && creatorDepartment === "Legal & Compliance") {
        console.log(
          "✅ [APPROVAL] Auto-approving Legal Compliance - creator is Special Case Legal HOD"
        );
      } else {
        const legalDept = await mongoose
          .model("Department")
          .findOne({ name: "Legal & Compliance" });
        if (legalDept) {
          approvalChain.push({
            level: "legal_compliance",
            department: legalDept._id,
            status: "pending",
            required: true,
            type: "personal_legal_compliance",
          });
        }
      }

      // Finance HOD approval after legal compliance
      if (creator?.role?.level === 1000) {
        console.log(
          "✅ [APPROVAL] Auto-approving Finance Budget - creator is Super Admin"
        );
      } else if (
        isSpecialCase &&
        creatorDepartment === "Finance & Accounting"
      ) {
        console.log(
          "✅ [APPROVAL] Auto-approving Finance Budget - creator is Special Case Finance HOD"
        );
      } else {
        // All other users need Finance approval
        const financeDept = await mongoose
          .model("Department")
          .findOne({ name: "Finance & Accounting" });
        if (financeDept) {
          approvalChain.push({
            level: "finance",
            department: financeDept._id,
            status: "pending",
            required: true,
            type: "personal_budget_allocation",
          });
        }
      }
    } else {
      // No budget allocation required OR budget threshold allows department HOD final approval
      console.log(
        "ℹ️ [APPROVAL] Skipping Legal and Finance approval - no budget allocation required (self-funded project)"
      );
    }

    // Executive HOD approval (only if budget allocation is required AND budget >= ₦5M)
    if (
      this.requiresBudgetAllocation === true &&
      this.budgetThreshold === "executive_approval"
    ) {
      // Budget allocation required - need Executive approval after Finance
      if (creator?.role?.level === 1000) {
        console.log(
          "✅ [APPROVAL] Auto-approving Executive - creator is Super Admin"
        );
      } else if (isSpecialCase && creatorDepartment === "Executive Office") {
        console.log(
          "✅ [APPROVAL] Auto-approving Executive - creator is Special Case Executive HOD"
        );
      } else {
        const execDept = await mongoose
          .model("Department")
          .findOne({ name: "Executive Office" });
        if (execDept) {
          approvalChain.push({
            level: "executive",
            department: execDept._id,
            status: "pending",
            required: true,
            type: "personal_executive_approval",
          });
        }
      }
    } else {
      // No budget allocation required OR budget threshold allows department HOD final approval
      console.log(
        "ℹ️ [APPROVAL] Skipping Executive approval - budget threshold allows department HOD final approval or no budget allocation required"
      );
    }

    // Budget allocation approval (only if budget allocation is required)
    if (this.requiresBudgetAllocation === true) {
      if (creator?.role?.level === 1000) {
        console.log(
          "✅ [APPROVAL] Auto-approving Budget Allocation - creator is Super Admin"
        );
      } else {
        // After Executive approval, Finance gets notification for budget allocation
        const financeDept = await mongoose
          .model("Department")
          .findOne({ name: "Finance & Accounting" });
        if (financeDept) {
          approvalChain.push({
            level: "budget_allocation",
            department: financeDept._id,
            status: "pending",
            required: true,
            type: "personal_budget_allocation",
          });
        }
      }
    } else {
      console.log(
        "ℹ️ [APPROVAL] Skipping Budget allocation - no budget allocation required (self-funded project)"
      );
    }
  } else if (this.projectScope === "departmental") {
    console.log("🏢 [APPROVAL] Departmental Project Workflow");

    // Department HOD approval (creator's department) - ALWAYS FIRST
    // Skip if creator is Special Case HOD of the same department
    if (!(isSpecialCase && creatorDepartment === this.department?.name)) {
      approvalChain.push({
        level: "hod",
        department: this.department,
        status: "pending",
        required: true,
        type: "departmental_approval",
      });
    } else {
      console.log(
        `✅ [APPROVAL] Auto-approving Department HOD - creator is Special Case HOD (${creatorDepartment}) of their own department`
      );
    }

    // Project Management HOD approval (only if budget threshold requires it)
    if (needsFullApprovalChain) {
      // Skip if creator is Special Case Project Management HOD
      if (isSpecialCase && creatorDepartment === "Project Management") {
        console.log(
          "✅ [APPROVAL] Auto-approving Project Management - creator is Special Case Project Management HOD"
        );
      } else {
        // Need Project Management HOD approval
        const projectMgmtDept = await mongoose
          .model("Department")
          .findOne({ name: "Project Management" });
        if (projectMgmtDept) {
          approvalChain.push({
            level: "project_management",
            department: projectMgmtDept._id,
            status: "pending",
            required: true,
            type: "departmental_project_management_approval",
          });
        }
      }
    } else {
      console.log(
        "ℹ️ [APPROVAL] Skipping Project Management approval - budget threshold allows department HOD final approval"
      );
    }

    // Finance HOD approval (only if budget threshold requires it)
    if (needsFullApprovalChain) {
      if (isSpecialCase && creatorDepartment === "Finance & Accounting") {
        console.log(
          "✅ [APPROVAL] Auto-approving Finance - creator is Special Case Finance HOD"
        );
      } else {
        const financeDept = await mongoose
          .model("Department")
          .findOne({ name: "Finance & Accounting" });
        if (financeDept) {
          approvalChain.push({
            level: "finance",
            department: financeDept._id,
            status: "pending",
            required: true,
            type: "departmental_finance",
          });
        }
      }
    } else {
      console.log(
        "ℹ️ [APPROVAL] Skipping Finance approval - budget threshold allows department HOD final approval"
      );
    }

    // Executive HOD approval (only if budget threshold requires it)
    if (needsFullApprovalChain) {
      if (isSpecialCase && creatorDepartment === "Executive Office") {
        console.log(
          "✅ [APPROVAL] Auto-approving Executive - creator is Special Case Executive HOD"
        );
      } else {
        const execDept = await mongoose
          .model("Department")
          .findOne({ name: "Executive Office" });
        if (execDept) {
          approvalChain.push({
            level: "executive",
            department: execDept._id,
            status: "pending",
            required: true,
            type: "departmental_executive",
          });
        }
      }
    } else {
      console.log(
        "ℹ️ [APPROVAL] Skipping Executive approval - budget threshold allows department HOD final approval"
      );
    }
  } else if (this.projectScope === "external") {
    // External Project Workflow: Project Management HOD → Legal → Finance → Executive → Implementation
    console.log("🌐 [APPROVAL] External Project Workflow");

    // Project Management HOD approval (only if budget threshold requires it)
    if (needsFullApprovalChain) {
      // Skip if creator is Special Case Project Management HOD
      if (isSpecialCase && creatorDepartment === "Project Management") {
        console.log(
          "✅ [APPROVAL] Auto-approving Project Management - creator is Special Case Project Management HOD"
        );
      } else {
        // Need Project Management HOD approval
        const projectMgmtDept = await mongoose
          .model("Department")
          .findOne({ name: "Project Management" });
        if (projectMgmtDept) {
          approvalChain.push({
            level: "project_management",
            department: projectMgmtDept._id,
            status: "pending",
            required: true,
            type: "external_project_management_approval",
          });
        }
      }
    } else {
      console.log(
        "ℹ️ [APPROVAL] Skipping Project Management approval - budget threshold allows department HOD final approval"
      );
    }

    // Legal & Compliance approval (ALWAYS required for external projects)
    // Only Project Management HOD can create external projects, so no auto-approval needed
    const legalDept = await mongoose
      .model("Department")
      .findOne({ name: "Legal & Compliance" });
    if (legalDept) {
      approvalChain.push({
        level: "legal_compliance",
        department: legalDept._id,
        status: "pending",
        required: true,
        type: "external_legal_compliance",
      });
    }

    // Finance approval (only if budget allocation is required)
    // Only Project Management HOD can create external projects, so no auto-approval needed
    if (this.requiresBudgetAllocation === true) {
      const financeDept = await mongoose
        .model("Department")
        .findOne({ name: "Finance & Accounting" });
      if (financeDept) {
        approvalChain.push({
          level: "finance",
          department: financeDept._id,
          status: "pending",
          required: true,
          type: "external_finance_review",
        });
      }
    } else {
      console.log(
        "ℹ️ [APPROVAL] Skipping Finance approval - no budget allocation required for external project"
      );
    }

    // Executive approval (ALWAYS required for external projects)
    // Only Project Management HOD can create external projects, so no auto-approval needed
    const execDept = await mongoose
      .model("Department")
      .findOne({ name: "Executive Office" });
    if (execDept) {
      approvalChain.push({
        level: "executive",
        department: execDept._id,
        status: "pending",
        required: true,
        type: "external_executive",
      });
    }

    // Budget allocation approval (only if budget allocation is required)
    if (this.requiresBudgetAllocation === true) {
      const financeDept = await mongoose
        .model("Department")
        .findOne({ name: "Finance & Accounting" });
      if (financeDept) {
        approvalChain.push({
          level: "budget_allocation",
          department: financeDept._id,
          status: "pending",
          required: true,
          type: "external_budget_allocation",
        });
        console.log(
          "💰 [APPROVAL] Added budget allocation step after Executive approval"
        );
      }
    } else {
      console.log(
        "💰 [APPROVAL] No budget allocation required for external project - skipping allocation step"
      );
    }
  }

  this.approvalChain = approvalChain;
  await this.save();

  console.log(
    `🎯 [APPROVAL] Generated chain with ${approvalChain.length} levels:`
  );
  approvalChain.forEach((step, index) => {
    console.log(`   Level ${index + 1}: ${step.level} (${step.department})`);
  });

  return approvalChain;
};

// Instance method to approve project
projectSchema.methods.approveProject = async function (
  approverId,
  level,
  comments = ""
) {
  const approvalStep = this.approvalChain.find(
    (step) => step.level === level && step.status === "pending"
  );

  if (!approvalStep) {
    throw new Error(`No pending approval found for level: ${level}`);
  }

  approvalStep.status = "approved";
  approvalStep.approver = approverId;
  approvalStep.comments = comments;
  approvalStep.approvedAt = new Date();

  // Check if all required approvals are complete
  const pendingApprovals = this.approvalChain.filter(
    (step) =>
      step.required &&
      step.status === "pending" &&
      step.level !== "budget_allocation"
  );

  console.log(
    `🔍 [APPROVAL] Checking approval status after ${level} approval:`
  );
  console.log(
    `🔍 [APPROVAL] Pending approvals (excluding budget_allocation):`,
    pendingApprovals.length
  );
  console.log(
    `🔍 [APPROVAL] Pending approvals details:`,
    pendingApprovals.map((p) => ({ level: p.level, status: p.status }))
  );

  if (pendingApprovals.length === 0) {
    console.log(
      `✅ [APPROVAL] All required approvals complete - setting status based on budget allocation requirement`
    );

    // Set status based on whether budget allocation is required
    if (this.requiresBudgetAllocation === true) {
      this.status = "pending_budget_allocation";
      console.log(
        `📋 [APPROVAL] Budget allocation required - setting status to pending_budget_allocation`
      );
    } else {
      this.status = "approved";
      console.log(
        `✅ [APPROVAL] No budget allocation required - setting status to approved`
      );
    }
  } else {
    // Set status based on next pending approval
    const nextApproval = pendingApprovals[0];
    console.log(
      `⏸️ [APPROVAL] Still pending approvals - setting status to pending_${nextApproval.level}_approval`
    );
    switch (nextApproval.level) {
      case "project_management":
        this.status = "pending_project_management_approval";
        break;
      case "legal_compliance":
        this.status = "pending_legal_compliance_approval";
        break;
      case "finance":
        this.status = "pending_finance_approval";
        break;
      case "executive":
        this.status = "pending_executive_approval";
        break;
      case "budget_allocation":
        this.status = "pending_budget_allocation";
        break;
    }
  }

  // Update project progress after approval
  console.log(`🔄 [PROGRESS] Updating progress after ${level} approval`);
  await this.updateTwoPhaseProgress();

  await this.save();

  // Send notifications based on approval level
  try {
    const NotificationService = await import(
      "../services/notificationService.js"
    );
    const notification = new NotificationService.default();

    // Get approver details
    const approver = await mongoose.model("User").findById(approverId);

    if (level === "legal_compliance" && this.projectScope === "external") {
      // Legal approved - notify Finance for budget review (if budget allocation required)
      if (this.requiresBudgetAllocation !== false) {
        console.log(
          "📧 [APPROVAL] Legal approved - notifying Finance for budget review"
        );
        await this.notifyFinanceHODForBudgetReview(approver);
      } else {
        console.log(
          "📧 [APPROVAL] Legal approved - no budget allocation required, proceeding to Executive"
        );
      }
    } else if (level === "executive") {
      console.log(
        `🔍 [APPROVAL] Executive approval detected - checking budget allocation requirement:`
      );
      console.log(
        `🔍 [APPROVAL] requiresBudgetAllocation: ${this.requiresBudgetAllocation}`
      );
      console.log(`🔍 [APPROVAL] projectScope: ${this.projectScope}`);

      if (this.requiresBudgetAllocation === true) {
        console.log(
          "📧 [APPROVAL] Executive approved - notifying Finance for budget allocation"
        );
        console.log(`📧 [APPROVAL] Project: ${this.name} (${this.code})`);
        console.log(`📧 [APPROVAL] Project scope: ${this.projectScope}`);
        console.log(`📧 [APPROVAL] Project status: ${this.status}`);
        console.log(
          `📧 [APPROVAL] Project items total: ₦${this.projectItems
            .reduce((sum, item) => sum + item.totalPrice, 0)
            .toLocaleString()}`
        );
        await this.notifyFinanceHODForBudgetAllocation(approver);
        console.log("✅ [APPROVAL] Finance HOD notification sent successfully");
      } else {
        console.log(
          "📧 [APPROVAL] Executive approved - no budget allocation required, proceeding to procurement"
        );
      }
    }
  } catch (notificationError) {
    console.error(
      "❌ [APPROVAL] Error sending notifications:",
      notificationError
    );
  }

  // Update project progress automatically
  await this.updateProgress();

  return this;
};

// Instance method to reject project
projectSchema.methods.rejectProject = async function (
  rejecterId,
  level,
  comments = ""
) {
  const approvalStep = this.approvalChain.find(
    (step) => step.level === level && step.status === "pending"
  );

  if (!approvalStep) {
    throw new Error(`No pending approval found for level: ${level}`);
  }

  approvalStep.status = "rejected";
  approvalStep.approver = rejecterId;
  approvalStep.comments = comments;
  approvalStep.approvedAt = new Date();

  this.status = "revision_required";
  await this.save();

  await this.updateProgress();

  return this;
};

// Instance method to resubmit project after rejection
projectSchema.methods.resubmitProject = async function (resubmittedBy) {
  try {
    // Check if project is in revision_required status
    if (this.status !== "revision_required") {
      throw new Error("Project is not in revision required status");
    }

    // Find the rejection point in the approval chain
    const rejectedStep = this.approvalChain.find(
      (step) => step.status === "rejected"
    );

    if (!rejectedStep) {
      throw new Error("No rejected step found in approval chain");
    }

    console.log(
      `🔄 [RESUBMISSION] Found rejection at level: ${rejectedStep.level}`
    );

    // Find the index of the rejected step
    const rejectedStepIndex = this.approvalChain.findIndex(
      (step) => step.status === "rejected"
    );

    // Only reset steps from the rejection point forward (preserve already approved steps)
    for (let i = rejectedStepIndex; i < this.approvalChain.length; i++) {
      const step = this.approvalChain[i];
      step.status = "pending";
      step.approver = null;
      step.comments = "";
      step.approvedAt = null;
      console.log(`🔄 [RESUBMISSION] Reset step ${i + 1}: ${step.level}`);
    }

    // Determine the next approval status based on the first pending step after reset
    const firstPendingStep = this.approvalChain.find(
      (step) => step.status === "pending"
    );
    if (firstPendingStep) {
      // Map approval levels to status values
      const statusMapping = {
        hod: "pending_department_approval",
        department: "pending_department_approval",
        finance: "pending_finance_approval",
        executive: "pending_executive_approval",
        legal_compliance: "pending_legal_compliance_approval",
        general: "pending_approval",
      };

      this.status = statusMapping[firstPendingStep.level] || "pending_approval";
      console.log(`🔄 [RESUBMISSION] Set status to: ${this.status}`);
    } else {
      // Fallback to general pending approval
      this.status = "pending_approval";
      console.log(
        `🔄 [RESUBMISSION] Set status to: pending_approval (fallback)`
      );
    }

    // Add resubmission history with rejection point info
    this.workflowHistory.push({
      phase: "resubmission",
      action: "project_resubmitted",
      triggeredBy: "manual",
      triggeredByUser: resubmittedBy,
      metadata: {
        resubmittedAt: new Date(),
        resubmittedBy: resubmittedBy,
        rejectionPoint: rejectedStep.level,
        preservedApprovals: this.approvalChain
          .filter(
            (step, index) =>
              index < rejectedStepIndex && step.status === "approved"
          )
          .map((step) => step.level),
      },
      timestamp: new Date(),
    });

    await this.save();

    await this.updateTwoPhaseProgress();

    console.log(
      `✅ [PROJECT] Project ${this.code} resubmitted successfully from ${rejectedStep.level} onwards`
    );
    return this;
  } catch (error) {
    console.error(
      `❌ [PROJECT] Error resubmitting project ${this.code}:`,
      error
    );
    throw error;
  }
};

// Instance method to add required document
projectSchema.methods.addRequiredDocument = async function (
  documentType,
  documentId,
  fileName,
  fileUrl,
  submittedBy
) {
  const existingDoc = this.requiredDocuments.find(
    (doc) => doc.documentType === documentType
  );

  if (existingDoc) {
    existingDoc.documentId = documentId;
    existingDoc.fileName = fileName;
    existingDoc.fileUrl = fileUrl;
    existingDoc.isSubmitted = true;
    existingDoc.submittedAt = new Date();
    existingDoc.submittedBy = submittedBy;
  } else {
    this.requiredDocuments.push({
      documentType,
      documentId,
      fileName,
      fileUrl,
      isSubmitted: true,
      submittedAt: new Date(),
      submittedBy,
    });
  }

  await this.save();
  return this;
};

// Instance method to check if all required documents are submitted
projectSchema.methods.checkDocumentsComplete = function () {
  const requiredDocs = this.requiredDocuments.filter((doc) => doc.isRequired);
  const submittedDocs = requiredDocs.filter((doc) => doc.isSubmitted);
  return requiredDocs.length === submittedDocs.length;
};

// Instance method to update project progress automatically
projectSchema.methods.updateProgress = async function () {
  console.log(
    `🚀 [PROGRESS] Starting progress update for project: ${this.code}`
  );
  console.log(`📋 [PROGRESS] Project scope: ${this.projectScope}`);
  console.log(`📊 [PROGRESS] Current progress: ${this.progress}%`);

  let progress = 0;

  // Check if this is a personal project (uses 20-60-20 rule)
  const isPersonalProject = this.projectScope === "personal";
  console.log(`🎯 [PROGRESS] Is personal project: ${isPersonalProject}`);

  if (isPersonalProject) {
    // PERSONAL PROJECTS: 20% setup + 60% approval + 20% implementation
    let setupProgress = 0;
    let approvalProgress = 0;
    let implementationProgress = 0;
    let submittedDocs = 0;
    let approvedSteps = 0;
    let completedTasks = 0;
    let tasks = [];

    // 1. Setup Progress (20% weight) - Document submission
    if (this.requiredDocuments && this.requiredDocuments.length > 0) {
      submittedDocs = this.requiredDocuments.filter(
        (doc) => doc.isSubmitted
      ).length;
      setupProgress = (submittedDocs / this.requiredDocuments.length) * 20;
    }

    // 2. Approval Progress (60% weight) - All approvals completed
    if (this.approvalChain && this.approvalChain.length > 0) {
      approvedSteps = this.approvalChain.filter(
        (step) => step.status === "approved"
      ).length;
      approvalProgress = (approvedSteps / this.approvalChain.length) * 60;
    }

    // 3. Implementation Progress (20% weight) - Task completion
    // Import Task model dynamically to avoid circular dependency
    const TaskModule = await import("./Task.js");
    const Task = TaskModule.default;
    tasks = await Task.find({
      project: this._id,
      isActive: true,
    });

    if (tasks.length > 0) {
      completedTasks = tasks.filter(
        (task) => task.status === "completed"
      ).length;
      implementationProgress = (completedTasks / tasks.length) * 20;
    }

    progress = setupProgress + approvalProgress + implementationProgress;

    console.log(
      `📊 [PROGRESS] Personal project ${this.code} progress calculation:`
    );
    console.log(
      `  - Setup Progress: ${setupProgress}% (${submittedDocs}/${
        this.requiredDocuments?.length || 0
      } docs)`
    );
    console.log(
      `  - Approval Progress: ${approvalProgress}% (${approvedSteps}/${
        this.approvalChain?.length || 0
      } approvals)`
    );
    console.log(
      `  - Implementation Progress: ${implementationProgress}% (${completedTasks}/${tasks.length} tasks)`
    );
    console.log(`  - Total Progress: ${progress}%`);
  } else {
    // LEGACY PROJECTS: 25% documents + 35% approval + 40% workflow
    let totalSteps = 0;

    // 1. Document Submission Progress (25% weight)
    if (this.requiredDocuments && this.requiredDocuments.length > 0) {
      const submittedDocs = this.requiredDocuments.filter(
        (doc) => doc.isSubmitted
      ).length;
      const docProgress = (submittedDocs / this.requiredDocuments.length) * 25;
      progress += docProgress;
      totalSteps += 25;
    }

    // 2. Approval Progress (35% weight)
    if (this.approvalChain && this.approvalChain.length > 0) {
      const approvedSteps = this.approvalChain.filter(
        (step) => step.status === "approved"
      ).length;
      const approvalProgress = (approvedSteps / this.approvalChain.length) * 35;
      progress += approvalProgress;
      totalSteps += 35;
    }

    // 3. Workflow Progress (40% weight)
    let workflowProgress = 0;
    let workflowSteps = 0;

    // Check if this is an internal or external project
    const isInternalProject =
      !this.category || !this.category.includes("external");

    // Inventory creation and completion (20% for internal, 15% for external)
    const inventoryWeight = isInternalProject ? 20 : 15;
    if (this.workflowTriggers?.inventoryCreated) {
      workflowProgress += inventoryWeight * 0.33; // 33% of weight for creation
    }
    if (this.workflowTriggers?.inventoryCompleted) {
      workflowProgress += inventoryWeight * 0.67; // 67% of weight for completion
    }
    workflowSteps += inventoryWeight;

    // Procurement initiation and completion (20% for internal, 15% for external)
    const procurementWeight = isInternalProject ? 20 : 15;
    if (this.workflowTriggers?.procurementInitiated) {
      workflowProgress += procurementWeight * 0.33; // 33% of weight for initiation
    }
    if (this.workflowTriggers?.procurementCompleted) {
      workflowProgress += procurementWeight * 0.67; // 67% of weight for completion
    }
    workflowSteps += procurementWeight;

    // Regulatory compliance (10%) - Only for external projects
    if (this.category && this.category.includes("external")) {
      if (this.workflowTriggers?.regulatoryComplianceCompleted) {
        workflowProgress += 10;
      }
      workflowSteps += 10;
    }

    progress += (workflowProgress / workflowSteps) * 40;
    totalSteps += 40;

    // Calculate final progress for legacy projects
    progress = totalSteps > 0 ? progress : 0;
  }

  // Calculate final progress
  this.progress = Math.round(progress);
  await this.save();

  console.log(
    `📊 [PROGRESS] Project ${this.code} (${
      isPersonalProject ? "Personal" : "External"
    }) progress updated to ${this.progress}%`
  );

  // Log approval chain status for debugging
  console.log(
    `🔍 [PROGRESS] Approval chain status:`,
    this.approvalChain
      ? this.approvalChain.map((step) => ({
          level: step.level,
          status: step.status,
          required: step.required,
        }))
      : "No approval chain found"
  );

  return this.progress;
};

// Instance method to update project progress with two-phase system (approval + implementation)
projectSchema.methods.updateTwoPhaseProgress = async function () {
  console.log(
    `🚀 [TWO-PHASE PROGRESS] Starting progress update for project: ${this.code}`
  );
  console.log(`📋 [TWO-PHASE PROGRESS] Project scope: ${this.projectScope}`);
  console.log(`📊 [TWO-PHASE PROGRESS] Current progress: ${this.progress}%`);
  console.log(
    `📊 [TWO-PHASE PROGRESS] Current approval progress: ${this.approvalProgress}%`
  );
  console.log(
    `📊 [TWO-PHASE PROGRESS] Current implementation progress: ${this.implementationProgress}%`
  );

  // Check if this is a personal project
  const isPersonalProject = this.projectScope === "personal";
  console.log(
    `🎯 [TWO-PHASE PROGRESS] Is personal project: ${isPersonalProject}`
  );

  // ============================================================================
  // PHASE 1: APPROVAL PROGRESS (0-100%)
  // ============================================================================
  let approvalProgress = 0;
  let submittedDocs = 0;
  let approvedSteps = 0;

  // 1. Document Submission Progress (20% of approval phase)
  if (this.requiredDocuments && this.requiredDocuments.length > 0) {
    submittedDocs = this.requiredDocuments.filter(
      (doc) => doc.isSubmitted
    ).length;
    const docProgress = (submittedDocs / this.requiredDocuments.length) * 20;
    approvalProgress += docProgress;
  }

  // 2. Approval Chain Progress (80% of approval phase)
  if (this.approvalChain && this.approvalChain.length > 0) {
    approvedSteps = this.approvalChain.filter(
      (step) => step.status === "approved"
    ).length;
    const chainProgress = (approvedSteps / this.approvalChain.length) * 80;
    approvalProgress += chainProgress;
  }

  this.approvalProgress = Math.round(approvalProgress);

  // ============================================================================
  // PHASE 2: IMPLEMENTATION PROGRESS (0-100%)
  // ============================================================================
  let implementationProgress = 0;

  // Only calculate implementation progress if project is in implementation phase
  const isInImplementationPhase = [
    "implementation",
    "in_progress",
    "active",
    "completed",
  ].includes(this.status);

  if (isInImplementationPhase) {
    // Import Task model dynamically to avoid circular dependency
    const TaskModule = await import("./Task.js");
    const Task = TaskModule.default;
    const tasks = await Task.find({
      project: this._id,
      isActive: true,
    });

    if (tasks.length > 0) {
      const completedTasks = tasks.filter(
        (task) => task.status === "completed"
      ).length;
      implementationProgress = (completedTasks / tasks.length) * 100;
    } else {
      // If no tasks exist yet, implementation progress is 0
      implementationProgress = 0;
    }
  } else {
    // If not in implementation phase, implementation progress is 0
    implementationProgress = 0;
  }

  this.implementationProgress = Math.round(implementationProgress);

  // ============================================================================
  // OVERALL PROGRESS CALCULATION
  // ============================================================================
  let overallProgress = 0;

  if (isPersonalProject) {
    // PERSONAL PROJECTS: 20% setup + 60% approval + 20% implementation
    let setupProgress = 0;
    let approvalProgress = 0;
    let submittedDocs = 0;
    let approvedSteps = 0;

    // 1. Setup Progress (20% weight) - Document submission
    if (this.requiredDocuments && this.requiredDocuments.length > 0) {
      submittedDocs = this.requiredDocuments.filter(
        (doc) => doc.isSubmitted
      ).length;
      setupProgress = (submittedDocs / this.requiredDocuments.length) * 20;
    }

    // 2. Approval Progress (60% weight) - All approvals completed
    if (this.approvalChain && this.approvalChain.length > 0) {
      approvedSteps = this.approvalChain.filter(
        (step) => step.status === "approved"
      ).length;
      approvalProgress = (approvedSteps / this.approvalChain.length) * 60;
    }

    // 3. Implementation Progress (20% weight) - Task completion
    const implementationProgressWeight =
      (this.implementationProgress / 100) * 20;

    overallProgress =
      setupProgress + approvalProgress + implementationProgressWeight;

    // Log progress breakdown for personal projects
    console.log(`📊 [PERSONAL PROJECT] Progress breakdown:`);
    console.log(
      `  - Setup Progress: ${setupProgress}% (${submittedDocs}/${
        this.requiredDocuments?.length || 0
      } docs)`
    );
    console.log(
      `  - Approval Progress: ${approvalProgress}% (${approvedSteps}/${
        this.approvalChain?.length || 0
      } approvals)`
    );
    console.log(
      `  - Implementation Progress: ${implementationProgressWeight}% (${this.implementationProgress}% of tasks)`
    );
    console.log(`  - Total: ${overallProgress}%`);
  } else {
    // EXTERNAL PROJECTS: Keep existing logic for now
    let totalSteps = 0;

    // 1. Document Submission Progress (25% weight)
    if (this.requiredDocuments && this.requiredDocuments.length > 0) {
      const submittedDocs = this.requiredDocuments.filter(
        (doc) => doc.isSubmitted
      ).length;
      const docProgress = (submittedDocs / this.requiredDocuments.length) * 25;
      overallProgress += docProgress;
      totalSteps += 25;
    }

    // 2. Approval Progress (35% weight)
    if (this.approvalChain && this.approvalChain.length > 0) {
      const approvedSteps = this.approvalChain.filter(
        (step) => step.status === "approved"
      ).length;
      const approvalProgress = (approvedSteps / this.approvalChain.length) * 35;
      overallProgress += approvalProgress;
      totalSteps += 35;
    }

    // 3. Workflow Progress (40% weight)
    let workflowProgress = 0;
    let workflowSteps = 0;

    // Check if this is an internal or external project
    const isInternalProject =
      !this.category || !this.category.includes("external");

    // Inventory creation and completion (20% for internal, 15% for external)
    const inventoryWeight = isInternalProject ? 20 : 15;
    if (this.workflowTriggers?.inventoryCreated) {
      workflowProgress += inventoryWeight * 0.33; // 33% of weight for creation
    }
    if (this.workflowTriggers?.inventoryCompleted) {
      workflowProgress += inventoryWeight * 0.67; // 67% of weight for completion
    }
    workflowSteps += inventoryWeight;

    // Procurement initiation and completion (20% for internal, 15% for external)
    const procurementWeight = isInternalProject ? 20 : 15;
    if (this.workflowTriggers?.procurementInitiated) {
      workflowProgress += procurementWeight * 0.33; // 33% of weight for initiation
    }
    if (this.workflowTriggers?.procurementCompleted) {
      workflowProgress += procurementWeight * 0.67; // 67% of weight for completion
    }
    workflowSteps += procurementWeight;

    // Regulatory compliance (10%) - Only for external projects
    if (this.category && this.category.includes("external")) {
      if (this.workflowTriggers?.regulatoryComplianceCompleted) {
        workflowProgress += 10;
      }
      workflowSteps += 10;
    }

    overallProgress += (workflowProgress / workflowSteps) * 40;
    totalSteps += 40;

    // Calculate final progress for legacy projects
    overallProgress = totalSteps > 0 ? overallProgress : 0;
  }

  this.progress = Math.round(overallProgress);

  // Save the project with updated progress values
  await this.save();

  // Log detailed progress information
  console.log(
    `📊 [TWO-PHASE PROGRESS] Project ${this.code} (${
      isPersonalProject ? "Personal" : "External"
    }) progress updated:`
  );
  console.log(
    `  - Document Progress: ${submittedDocs}/${
      this.requiredDocuments?.length || 0
    } docs submitted`
  );
  console.log(
    `  - Approval Progress: ${this.approvalProgress}% (${approvedSteps}/${
      this.approvalChain?.length || 0
    } approvals)`
  );
  console.log(
    `  - Implementation Progress: ${this.implementationProgress}% (${
      isInImplementationPhase ? "in implementation phase" : "not started"
    })`
  );
  console.log(`  - Overall Progress: ${this.progress}%`);

  // Log approval chain status for debugging
  console.log(
    `🔍 [TWO-PHASE PROGRESS] Approval chain status:`,
    this.approvalChain
      ? this.approvalChain.map((step) => ({
          level: step.level,
          status: step.status,
          required: step.required,
        }))
      : "No approval chain found"
  );

  return {
    overall: this.progress,
    approval: this.approvalProgress,
    implementation: this.implementationProgress,
  };
};

// Instance method to trigger regulatory compliance workflow
projectSchema.methods.triggerRegulatoryCompliance = async function (
  triggeredByUser
) {
  try {
    console.log(
      `📋 [REGULATORY] Starting regulatory compliance for project: ${this.name} (${this.code})`
    );

    // Update workflow triggers
    this.workflowTriggers.regulatoryComplianceInitiated = true;
    this.workflowTriggers.regulatoryComplianceInitiatedAt = new Date();
    this.workflowTriggers.regulatoryComplianceInitiatedBy = triggeredByUser;

    // Add to workflow history
    this.workflowHistory.push({
      phase: "regulatory_compliance",
      action: "regulatory_compliance_initiated",
      triggeredBy: "auto",
      triggeredByUser: triggeredByUser,
      metadata: {
        projectCode: this.code,
        category: this.category,
        budget: this.budget,
        complianceType:
          this.category === "equipment_lease"
            ? "equipment_registration"
            : "general_compliance",
      },
      timestamp: new Date(),
    });

    // Update progress
    await this.updateTwoPhaseProgress();

    // Notify Legal/Compliance HOD
    try {
      console.log(
        `📧 [REGULATORY] Looking for Legal/Compliance HOD to notify...`
      );
      const NotificationService = await import(
        "../services/notificationService.js"
      );
      const notification = new NotificationService.default();

      // Find Legal/Compliance department
      const legalDept = await mongoose.model("Department").findOne({
        name: { $regex: /legal|compliance/i },
      });

      if (legalDept) {
        console.log(
          `📧 [REGULATORY] Found Legal/Compliance department: ${legalDept.name}`
        );
        const hodRoleForLegal = await mongoose
          .model("Role")
          .findOne({ name: "HOD" });
        if (!hodRoleForLegal) {
          console.log("❌ [REGULATORY] HOD role not found in system");
          return;
        }

        const legalHOD = await mongoose
          .model("User")
          .findOne({
            department: legalDept._id,
            role: hodRoleForLegal._id,
            isActive: true,
          })
          .populate("role");

        if (legalHOD) {
          console.log(
            `📧 [REGULATORY] Found Legal HOD: ${legalHOD.firstName} ${legalHOD.lastName}`
          );

          await notification.createNotification({
            recipient: legalHOD._id,
            type: "REGULATORY_COMPLIANCE_REQUIRED",
            title: "Regulatory Compliance Required",
            message: `Project "${this.name}" (${this.code}) requires regulatory compliance review. Please verify equipment registration and regulatory requirements.`,
            priority: "high",
            data: {
              projectId: this._id,
              projectName: this.name,
              projectCode: this.code,
              category: this.category,
              actionUrl: "/dashboard/modules/projects/approval-dashboard",
              triggeredBy: triggeredByUser ? triggeredByUser._id : null,
            },
          });

          console.log(
            `✅ [REGULATORY] Notification sent to Legal HOD: ${legalHOD.firstName} ${legalHOD.lastName}`
          );
        } else {
          console.log("⚠️ [REGULATORY] No Legal HOD found to notify");
        }
      } else {
        console.log("⚠️ [REGULATORY] Legal/Compliance department not found");
      }
    } catch (notifError) {
      console.error("❌ [REGULATORY] Error sending notification:", notifError);
    }

    await this.save();
    console.log(
      `✅ [REGULATORY] Regulatory compliance workflow triggered successfully for project: ${this.code}`
    );

    return this;
  } catch (error) {
    console.error(
      "❌ [REGULATORY] Error triggering regulatory compliance:",
      error
    );
    throw error;
  }
};

// Instance method to complete regulatory compliance
projectSchema.methods.completeRegulatoryCompliance = async function (
  triggeredByUser,
  complianceData = {}
) {
  try {
    console.log(
      `✅ [REGULATORY] Completing regulatory compliance for project: ${this.name} (${this.code})`
    );

    // Update workflow triggers
    this.workflowTriggers.regulatoryComplianceCompleted = true;
    this.workflowTriggers.regulatoryComplianceCompletedAt = new Date();
    this.workflowTriggers.regulatoryComplianceCompletedBy = triggeredByUser;
    this.workflowTriggers.complianceDetails = complianceData;

    // Add to workflow history
    this.workflowHistory.push({
      phase: "regulatory_compliance",
      action: "regulatory_compliance_completed",
      triggeredBy: "manual",
      triggeredByUser: triggeredByUser,
      metadata: {
        projectCode: this.code,
        complianceData: complianceData,
        completionNotes:
          complianceData.notes || "Regulatory compliance completed",
      },
      timestamp: new Date(),
    });

    // Update progress
    await this.updateTwoPhaseProgress();

    // Notify project creator and relevant stakeholders
    try {
      const NotificationService = await import(
        "../services/notificationService.js"
      );
      const notification = new NotificationService.default();

      // Notify project creator
      await notification.createNotification({
        recipient: this.createdBy,
        type: "REGULATORY_COMPLIANCE_COMPLETED",
        title: "Regulatory Compliance Completed",
        message: `Regulatory compliance has been completed for project "${this.name}" (${this.code}). Project is ready for final implementation.`,
        priority: "medium",
        data: {
          projectId: this._id,
          projectName: this.name,
          projectCode: this.code,
          actionUrl: "/dashboard/modules/projects",
        },
      });

      console.log(`✅ [REGULATORY] Notification sent to project creator`);
    } catch (notifError) {
      console.error(
        "❌ [REGULATORY] Error sending completion notification:",
        notifError
      );
    }

    await this.save();
    console.log(
      `✅ [REGULATORY] Regulatory compliance completed successfully for project: ${this.code}`
    );

    return this;
  } catch (error) {
    console.error(
      "❌ [REGULATORY] Error completing regulatory compliance:",
      error
    );
    throw error;
  }
};

// Instance method to mark inventory as completed
projectSchema.methods.completeInventory = async function (triggeredByUser) {
  try {
    console.log(
      `✅ [INVENTORY] Marking inventory as completed for project: ${this.name} (${this.code})`
    );

    // Update workflow triggers
    this.workflowTriggers.inventoryCompleted = true;
    this.workflowTriggers.inventoryCompletedAt = new Date();
    this.workflowTriggers.inventoryCompletedBy = triggeredByUser;

    // Add to workflow history
    this.workflowHistory.push({
      phase: "inventory",
      action: "inventory_completed",
      triggeredBy: "manual",
      triggeredByUser: triggeredByUser,
      metadata: {
        projectCode: this.code,
        completionNotes:
          "Inventory allocation and setup completed by Operations HOD",
      },
      timestamp: new Date(),
    });

    await this.updateTwoPhaseProgress();

    if (this.requiresBudgetAllocation === true) {
      console.log(
        `🚀 [INVENTORY] ${this.projectScope} project with budget allocation - setting to implementation status`
      );
      this.status = "implementation";

      // Funds will be moved from reserved to used when procurement orders are marked as paid
      console.log(
        `💰 [INVENTORY] Funds will be moved from reserved to used when procurement orders are marked as paid`
      );

      try {
        await this.createImplementationTasks(triggeredByUser);
        console.log(
          `✅ [INVENTORY] Implementation tasks created for ${this.projectScope} project`
        );
      } catch (taskError) {
        console.error(
          "❌ [INVENTORY] Error creating implementation tasks:",
          taskError
        );
      }
    }

    // Check if both inventory and procurement are completed to trigger compliance review
    await this.checkComplianceReadiness();

    await this.save();
    console.log(
      `✅ [INVENTORY] Inventory completed successfully for project: ${this.code}`
    );

    return this;
  } catch (error) {
    console.error("❌ [INVENTORY] Error completing inventory:", error);
    throw error;
  }
};

// Instance method to mark procurement as completed
projectSchema.methods.completeProcurement = async function (triggeredByUser) {
  try {
    console.log(
      `✅ [PROCUREMENT] Marking procurement as completed for project: ${this.name} (${this.code})`
    );

    // Update workflow triggers
    this.workflowTriggers.procurementCompleted = true;
    this.workflowTriggers.procurementCompletedAt = new Date();
    this.workflowTriggers.procurementCompletedBy = triggeredByUser;

    // Add to workflow history
    this.workflowHistory.push({
      phase: "procurement",
      action: "procurement_completed",
      triggeredBy: "manual",
      triggeredByUser: triggeredByUser,
      metadata: {
        projectCode: this.code,
        completionNotes:
          "Procurement order completed and items received by Procurement HOD",
      },
      timestamp: new Date(),
    });

    await this.updateTwoPhaseProgress();

    if (this.requiresBudgetAllocation === true) {
      console.log(
        `📦 [PROCUREMENT] ${this.projectScope} project with budget allocation - triggering inventory creation`
      );
      try {
        await this.triggerInventoryCreation(triggeredByUser);
        console.log(
          `✅ [PROCUREMENT] Inventory creation triggered for ${this.projectScope} project`
        );
      } catch (inventoryError) {
        console.error(
          "❌ [PROCUREMENT] Error triggering inventory creation:",
          inventoryError
        );
      }
    }

    await this.checkComplianceReadiness();

    await this.save();
    console.log(
      `✅ [PROCUREMENT] Procurement completed successfully for project: ${this.code}`
    );

    return this;
  } catch (error) {
    console.error("❌ [PROCUREMENT] Error completing procurement:", error);
    throw error;
  }
};

// Instance method to check if compliance review is ready
projectSchema.methods.checkComplianceReadiness = async function () {
  try {
    const inventoryCompleted = this.workflowTriggers?.inventoryCompleted;
    const procurementCompleted = this.workflowTriggers?.procurementCompleted;

    if (inventoryCompleted && procurementCompleted) {
      console.log(
        `🎯 [COMPLIANCE] Both inventory and procurement completed for project: ${this.code} - Triggering compliance review`
      );

      // Notify Legal/Compliance HOD that both stages are ready for review
      try {
        const NotificationService = await import(
          "../services/notificationService.js"
        );
        const notification = new NotificationService.default();

        // Find Legal/Compliance department
        const legalDept = await mongoose.model("Department").findOne({
          name: { $regex: /legal|compliance/i },
        });

        if (legalDept) {
          const legalHOD = await mongoose
            .model("User")
            .findOne({
              department: legalDept._id,
              "role.name": "HOD",
              isActive: true,
            })
            .populate("role");

          if (legalHOD) {
            await notification.createNotification({
              recipient: legalHOD._id,
              type: "COMPLIANCE_REVIEW_REQUIRED",
              title: "Compliance Review Required",
              message: `Both inventory and procurement stages have been completed for project "${this.name}" (${this.code}). Legal/Compliance review is now required to proceed to 95% completion.`,
              priority: "high",
              data: {
                projectId: this._id,
                projectName: this.name,
                projectCode: this.code,
                actionUrl: "/dashboard/modules/projects",
                inventoryCompleted: true,
                procurementCompleted: true,
                currentProgress: this.progress,
              },
            });

            console.log(
              `✅ [COMPLIANCE] Compliance review notification sent to Legal HOD: ${legalHOD.firstName} ${legalHOD.lastName}`
            );
          }
        }
      } catch (notifError) {
        console.error(
          "❌ [COMPLIANCE] Error sending compliance review notification:",
          notifError
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ [COMPLIANCE] Error checking compliance readiness:",
      error
    );
  }
};

// Instance method to create implementation tasks for personal projects
projectSchema.methods.createImplementationTasks = async function (
  createdByUser
) {
  try {
    // Import Task model dynamically to avoid circular dependency
    const TaskModule = await import("./Task.js");
    const Task = TaskModule.default;

    // Check if tasks already exist for this project
    const existingTasks = await Task.find({
      project: this._id,
      isActive: true,
      isBaseTask: true,
    });

    if (existingTasks.length > 0) {
      console.log(
        `📋 [TASKS] Implementation tasks already exist for project ${this.code}`
      );
      return existingTasks;
    }

    // Calculate dynamic timelines based on project start/end dates
    const projectStartDate = new Date(this.startDate);
    const projectEndDate = new Date(this.endDate);
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

    // Create base implementation tasks
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
        project: this._id,
        assignedTo: this.createdBy,
        assignedBy: createdByUser || this.createdBy,
        createdBy: createdByUser || this.createdBy,
        estimatedHours: Math.ceil((setupDuration / (24 * 60 * 60 * 1000)) * 8),
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
        project: this._id,
        assignedTo: this.createdBy,
        assignedBy: createdByUser || this.createdBy,
        createdBy: createdByUser || this.createdBy,
        estimatedHours: Math.ceil(
          (implementationDuration / (24 * 60 * 60 * 1000)) * 8
        ),
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
        project: this._id,
        assignedTo: this.createdBy,
        assignedBy: createdByUser || this.createdBy,
        createdBy: createdByUser || this.createdBy,
        estimatedHours: Math.ceil((reviewDuration / (24 * 60 * 60 * 1000)) * 8),
        projectType: "personal",
        implementationPhase: "review",
        milestoneOrder: 3,
        isBaseTask: true,
        tags: ["review", "quality", "closure", "personal"],
        notes: `Timeline: ${reviewEndDate.toLocaleDateString()} - Final review and closure phase`,
      },
    ];

    // Create tasks in database with generated codes
    const createdTasks = [];
    for (let i = 0; i < baseTasks.length; i++) {
      const taskData = baseTasks[i];

      // Generate unique task code
      const taskCount = await Task.countDocuments();
      const taskCode = `TASK${String(taskCount + i + 1).padStart(4, "0")}`;

      const task = new Task({
        ...taskData,
        code: taskCode,
      });

      await task.save();
      createdTasks.push(task);
    }

    console.log(
      `✅ [TASKS] Created ${createdTasks.length} implementation tasks for project ${this.code}`
    );
    console.log(
      `📋 [TASKS] Tasks created: ${createdTasks.map((t) => t.title).join(", ")}`
    );

    return createdTasks;
  } catch (error) {
    console.error(
      `❌ [TASKS] Error creating implementation tasks for project ${this.code}:`,
      error
    );
    throw error;
  }
};

const Project = mongoose.model("Project", projectSchema);

export default Project;
