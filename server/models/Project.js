import mongoose from "mongoose";
import ProjectAuditService from "../services/projectAuditService.js";
import ProjectDocumentService from "../services/projectDocumentService.js";

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
      required: true,
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
        "pending_finance_approval",
        "pending_executive_approval",
        "approved",
        "implementation",
        "active",
        "on_hold",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "planning",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
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
      enum: [
        // SOFTWARE & TECHNOLOGY
        "software_development",
        "system_maintenance",
        "infrastructure_upgrade",
        "digital_transformation",
        "data_management",
        "security_enhancement",
        "process_automation",
        "integration_project",

        // EQUIPMENT & FACILITIES
        "equipment_purchase",
        "equipment_lease",
        "facility_improvement",
        "infrastructure_development",
        "equipment_maintenance",

        // TRAINING & DEVELOPMENT
        "training_program",
        "capacity_building",
        "skill_development",
        "professional_development",
        "industry_training",

        // CONSULTING & SERVICES
        "consulting_service",
        "advisory_service",
        "technical_support",
        "implementation_service",

        // REGULATORY & COMPLIANCE
        "regulatory_compliance",
        "compliance_audit",
        "regulatory_enforcement",
        "policy_development",
        "standards_implementation",

        // MONITORING & OVERSIGHT
        "monitoring_system",
        "oversight_program",
        "verification_service",
        "inspection_program",

        // FINANCIAL & ADMINISTRATIVE
        "financial_management",
        "budget_optimization",
        "cost_reduction",
        "administrative_improvement",

        // MARKETPLACE & EXCHANGE
        "marketplace_development",
        "exchange_platform",
        "trading_system",
        "market_analysis",

        // PUBLIC & COMMUNICATION
        "public_awareness",
        "communication_campaign",
        "stakeholder_engagement",
        "public_relations",

        // RESEARCH & ANALYSIS
        "research_project",
        "market_research",
        "feasibility_study",
        "impact_assessment",

        // OTHER
        "other",
      ],
    },

    // Project Scope (Personal, Departmental, External)
    projectScope: {
      type: String,
      enum: ["personal", "departmental", "external"],
      required: true,
      default: "personal",
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

    // Project Progress
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
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
            "finance",
            "executive",
            "legal_compliance",
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

    // Set budget threshold based on budget amount and department
    if (this.budget && !this.budgetThreshold) {
      // Get department name for smart threshold determination
      let departmentName = "Unknown";
      try {
        const dept = await mongoose
          .model("Department")
          .findById(this.department);
        departmentName = dept ? dept.name : "Unknown";
      } catch (error) {
        console.error("Error getting department for budget threshold:", error);
      }

      if (this.budget <= 1000000) {
        // 1M NGN
        this.budgetThreshold = "hod_auto_approve";
      } else if (this.budget <= 5000000) {
        // 5M NGN - For Finance department, skip finance approval
        if (departmentName === "Finance & Accounting") {
          this.budgetThreshold = "executive_approval";
        } else {
          this.budgetThreshold = "department_approval";
        }
      } else if (this.budget <= 25000000) {
        // 25M NGN - For Finance department, skip finance approval
        if (departmentName === "Finance & Accounting") {
          this.budgetThreshold = "executive_approval";
        } else {
          this.budgetThreshold = "finance_approval";
        }
      } else {
        // Above 25M NGN
        this.budgetThreshold = "executive_approval";
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

    // Set status to implementation
    this.status = "implementation";
    await this.save();

    // Handle workflow based on project scope
    if (this.projectScope === "external") {
      // External projects: Always trigger inventory and procurement
      console.log(
        "🌐 [WORKFLOW] External project detected - triggering inventory and procurement"
      );

      console.log("📦 [WORKFLOW] Triggering Inventory for external project");
      await this.triggerInventoryCreation(triggeredByUser);

      console.log("🛒 [WORKFLOW] Triggering Procurement for external project");
      await this.triggerProcurementCreation(triggeredByUser);

      console.log("✅ [WORKFLOW] External project workflow triggers completed");
    } else if (this.projectScope === "departmental") {
      // Departmental projects: No inventory/procurement triggers, go directly to implementation
      console.log(
        "🏢 [WORKFLOW] Departmental project detected - skipping inventory and procurement triggers"
      );
      console.log(
        "💰 [WORKFLOW] Departmental project will be handled by finance reimbursement after implementation"
      );
    } else {
      // Personal projects: No inventory/procurement triggers, go directly to implementation
      console.log(
        "👤 [WORKFLOW] Personal project detected - skipping inventory and procurement triggers"
      );
      console.log(
        "💰 [WORKFLOW] Personal project will be handled by finance reimbursement after implementation"
      );
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
          notificationMessage = `Project "${this.name}" approved! Inventory & procurement initiated.`;
          notificationsSent.operationsHOD = "Inventory setup notification sent";
          notificationsSent.procurementHOD =
            "Procurement initiation notification sent";
        } else if (this.projectScope === "departmental") {
          notificationMessage = `Project "${this.name}" approved! Ready for implementation.`;
          notificationsSent.financeReimbursement =
            "Finance reimbursement will be handled after implementation";
        } else {
          notificationMessage = `Project "${this.name}" approved! Ready for implementation.`;
          notificationsSent.financeReimbursement =
            "Finance reimbursement will be handled after implementation";
        }

        console.log(
          `📧 [WORKFLOW] Notifying Executive about project implementation...`
        );
        await notification.createNotification({
          recipient: triggeredByUser,
          type: "PROJECT_IMPLEMENTATION_READY",
          title: "Project Implementation Ready",
          message: notificationMessage,
          priority: "medium",
          data: {
            projectId: this._id,
            projectName: this.name,
            projectCode: this.code,
            budget: this.budget,
            category: this.category,
            projectScope: this.projectScope,
            actionUrl: "/dashboard/modules/projects",
            implementationPhase: "ready",
            triggeredBy: triggeredByUser,
            notificationsSent: notificationsSent,
          },
        });
        console.log(
          `✅ [WORKFLOW] Executive notified about notifications sent to both parties`
        );
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
        creatorMessage = `Project "${this.name}" approved! Inventory & procurement initiated.`;
      } else if (this.projectScope === "departmental") {
        creatorMessage = `Project "${this.name}" approved! Ready for implementation.`;
      } else {
        creatorMessage = `Project "${this.name}" approved! Ready for implementation.`;
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

      // 2. Notify Finance HOD (who approved earlier)
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

        const financeHOD = await mongoose
          .model("User")
          .findOne({
            department: financeDept._id,
            role: hodRoleForFinance._id,
            isActive: true,
          })
          .populate("role");

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
            await notification.createNotification({
              recipient: financeHOD._id,
              type: "PROJECT_IMPLEMENTATION_READY",
              title: "Project Implementation Started",
              message: `Project "${this.name}" (${this.code}) that you approved has been fully approved and is now in implementation phase. Inventory and procurement processes have been initiated.`,
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

      // 3. Notify Executive HOD (who just approved)
      if (triggeredByUser && triggeredByUser._id) {
        console.log(
          `📧 [WORKFLOW] Sending notification to Executive HOD (who just approved): ${triggeredByUser.firstName} ${triggeredByUser.lastName}`
        );
        await notification.createNotification({
          recipient: triggeredByUser._id,
          type: "PROJECT_IMPLEMENTATION_READY",
          title: "Project Implementation Initiated",
          message: `Project "${this.name}" (${this.code}) that you just approved is now in implementation phase. Inventory and procurement processes have been initiated.`,
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
        const approverUsers = await mongoose
          .model("User")
          .find({
            department: operationsDept._id,
            "role.level": { $gte: 700 },
          })
          .populate("department")
          .populate("role");

        console.log(
          `🔍 [INVENTORY] Found ${approverUsers.length} approver users in department ${operationsDept.name}`
        );

        if (approverUsers.length === 0) {
          console.log(
            `⚠️ [INVENTORY] No approver users found with role filter. Getting all users and filtering manually...`
          );

          const allDeptUsers = await mongoose
            .model("User")
            .find({
              department: operationsDept._id,
            })
            .populate("role");

          console.log(
            `🔍 [INVENTORY] Total users in department: ${allDeptUsers.length}`
          );

          // Filter users manually based on role level
          const manualFilteredUsers = allDeptUsers.filter((user) => {
            const hasValidRole = user.role && user.role.level >= 700;
            console.log(
              `  ${user.firstName} ${user.lastName} - Role: ${user.role?.name} (Level: ${user.role?.level}) - Valid: ${hasValidRole}`
            );
            return hasValidRole;
          });

          console.log(
            `🔍 [INVENTORY] Manual filtering found ${manualFilteredUsers.length} valid approvers`
          );

          // Use the manually filtered users
          approverUsers.length = 0; // Clear the array
          approverUsers.push(...manualFilteredUsers); // Add the filtered users
        }

        if (approverUsers.length > 0) {
          const operationsHOD = approverUsers[0]; // Use the first HOD found
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
      const categoryMap = {
        // Equipment leases → Equipment categories
        equipment_lease: "industrial_equipment",
        vehicle_lease: "passenger_vehicle",
        property_lease: "office_space",
        financial_lease: "office_equipment",
        training_equipment_lease: "office_equipment",
        compliance_lease: "office_equipment",
        service_equipment_lease: "industrial_equipment",
        strategic_lease: "industrial_equipment",

        // Development & IT → Electronics
        software_development: "electronics",
        system_maintenance: "electronics",

        // Services → Office equipment
        consulting: "office_equipment",
        training: "office_equipment",

        // Default
        other: "other",
      };

      // Ensure we only return valid inventory categories from Inventory.js enum
      const validInventoryCategories = [
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
      ];

      const mappedCategory = categoryMap[projectCategory] || "office_equipment";

      // Validate that the mapped category exists in Inventory model
      if (!validInventoryCategories.includes(mappedCategory)) {
        console.warn(
          `⚠️ [INVENTORY] Invalid category mapping: ${projectCategory} → ${mappedCategory}, using "office_equipment"`
        );
        return "office_equipment";
      }

      return mappedCategory;
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

    this.workflowTriggers.procurementInitiated = true;

    // Create standard procurement order for ANY project category
    if (triggeredByUser) {
      try {
        await this.createStandardProcurementOrder(triggeredByUser);
        await ProjectAuditService.logProcurementInitiated(
          this,
          triggeredByUser
        );
      } catch (error) {
        console.error(
          "❌ [AUDIT] Error creating standard procurement order:",
          error
        );
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

    // Map project categories to procurement categories
    const getProcurementCategory = (projectCategory) => {
      const categoryMap = {
        // Equipment leases → Equipment
        equipment_lease: "equipment",
        vehicle_lease: "vehicle",
        property_lease: "property",
        financial_lease: "equipment",
        training_equipment_lease: "equipment",
        compliance_lease: "equipment",
        service_equipment_lease: "equipment",
        strategic_lease: "equipment",

        // Development & IT → Electronics
        software_development: "electronics",
        system_maintenance: "electronics",

        // Services → Office supplies
        consulting: "office_supplies",
        training: "office_supplies",

        // Default
        other: "other",
      };

      // Ensure we only return valid procurement categories
      const validProcurementCategories = [
        "equipment",
        "vehicle",
        "property",
        "furniture",
        "electronics",
        "office_supplies",
        "maintenance_parts",
        "other",
      ];

      const mappedCategory = categoryMap[projectCategory] || "equipment";

      if (!validProcurementCategories.includes(mappedCategory)) {
        console.warn(
          `⚠️ [PROCUREMENT] Invalid category mapping: ${projectCategory} → ${mappedCategory}, using "equipment"`
        );
        return "equipment";
      }

      return mappedCategory;
    };

    const totalBudget = this.budget || 0;
    const procurementCategory = getProcurementCategory(this.category);

    console.log(
      `🛒 [PROCUREMENT] Project category: ${this.category} → Procurement category: ${procurementCategory}`
    );
    console.log(
      `💰 [PROCUREMENT] Project budget: ₦${totalBudget.toLocaleString()}`
    );

    // Generate PO number
    const poCount = await Procurement.countDocuments();
    const poNumber = `PO${String(poCount + 1).padStart(4, "0")}`;

    // Create standard procurement order
    const procurementOrder = new Procurement({
      poNumber: poNumber,
      title: `${this.name} - Procurement Order`,
      description: `Standard procurement order for project: ${
        this.name
      } (Budget: ₦${totalBudget.toLocaleString()}) - Procurement HOD to process`,
      status: "draft",
      priority: "high",
      supplier: {
        name: "TBD - Procurement HOD to assign",
        contactPerson: "TBD",
        email: "tbd@supplier.com",
        phone: "TBD",
      },
      items: [
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
      ],
      subtotal: totalBudget,
      tax: 0,
      shipping: 0,
      totalAmount: totalBudget,
      relatedProject: this._id,
      approvedBy: createdBy._id,
      createdBy: createdBy._id,
    });

    const savedOrder = await procurementOrder.save();

    console.log(
      `✅ [PROCUREMENT] Created procurement order ${poNumber} with ₦${totalBudget.toLocaleString()} budget for project: ${
        this.code
      }`
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

// Instance method to generate approval chain based on project scope
projectSchema.methods.generateApprovalChain = async function () {
  const approvalChain = [];

  console.log(`🏢 [APPROVAL] Project Scope: ${this.projectScope}`);
  console.log(`💰 [APPROVAL] Project Budget: ${this.budget}`);

  // Different approval chains based on project scope
  if (this.projectScope === "personal") {
    // Personal Project Workflow: Creator → Finance HOD → Executive HOD → Finance Reimbursement
    console.log("👤 [APPROVAL] Personal Project Workflow");

    // Finance HOD approval
    const financeDept = await mongoose
      .model("Department")
      .findOne({ name: "Finance & Accounting" });
    if (financeDept) {
      approvalChain.push({
        level: "finance",
        department: financeDept._id,
        status: "pending",
        required: true,
        type: "personal_reimbursement",
      });
    }

    // Executive HOD approval
    const execDept = await mongoose
      .model("Department")
      .findOne({ name: "Executive Office" });
    if (execDept) {
      approvalChain.push({
        level: "executive",
        department: execDept._id,
        status: "pending",
        required: true,
        type: "personal_approval",
      });
    }
  } else if (this.projectScope === "departmental") {
    console.log("🏢 [APPROVAL] Departmental Project Workflow");

    // HOD approval (if creator is not HOD)
    approvalChain.push({
      level: "hod",
      department: this.department,
      status: "pending",
      required: true,
      type: "departmental_approval",
    });

    // Finance HOD approval
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

    // Executive HOD approval
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
  } else if (this.projectScope === "external") {
    // External Project Workflow: HR HOD → Legal & Compliance → Executive → Finance → Implementation
    console.log("🌐 [APPROVAL] External Project Workflow");

    // Legal & Compliance approval (same department, one step)
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

    // Executive approval
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

    // Finance approval (LAST - for budget allocation and disbursement)
    const financeDept = await mongoose
      .model("Department")
      .findOne({ name: "Finance & Accounting" });
    if (financeDept) {
      approvalChain.push({
        level: "finance",
        department: financeDept._id,
        status: "pending",
        required: true,
        type: "external_finance",
      });
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
    (step) => step.required && step.status === "pending"
  );

  if (pendingApprovals.length === 0) {
    this.status = "approved";
  } else {
    // Set status based on next pending approval
    const nextApproval = pendingApprovals[0];
    switch (nextApproval.level) {
      case "department":
        this.status = "pending_department_approval";
        break;
      case "finance":
        this.status = "pending_finance_approval";
        break;
      case "executive":
        this.status = "pending_executive_approval";
        break;
    }
  }

  await this.save();

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

  this.status = "rejected";
  await this.save();

  await this.updateProgress();

  return this;
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
  let progress = 0;
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
  // For internal projects, this step is skipped
  if (this.category && this.category.includes("external")) {
    if (this.workflowTriggers?.regulatoryComplianceCompleted) {
      workflowProgress += 10;
    }
    workflowSteps += 10;
  } else {
    // For internal projects, redistribute the 10% to inventory and procurement
    // Inventory gets 5% extra, Procurement gets 5% extra
    workflowSteps += 0; // No additional steps for internal projects
  }

  progress += (workflowProgress / workflowSteps) * 40;
  totalSteps += 40;

  // Calculate final progress
  this.progress = totalSteps > 0 ? Math.round(progress) : 0;
  await this.save();

  console.log(
    `📊 [PROGRESS] Project ${this.code} progress updated to ${this.progress}%`
  );
  return this.progress;
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
    await this.updateProgress();

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
    await this.updateProgress();

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

    // Update progress
    await this.updateProgress();

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

    // Update progress
    await this.updateProgress();

    // Check if both inventory and procurement are completed to trigger compliance review
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

const Project = mongoose.model("Project", projectSchema);

export default Project;
