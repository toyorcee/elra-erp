import mongoose from "mongoose";

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

    // Project Categories (relevant for leasing business)
    category: {
      type: String,
      required: true,
      enum: [
        "equipment_lease",
        "vehicle_lease",
        "property_lease",
        "financial_lease",
        "training_equipment_lease",
        "compliance_lease",
        "service_equipment_lease",
        "strategic_lease",
        "software_development",
        "system_maintenance",
        "consulting",
        "training",
        "other",
      ],
    },
    customCategory: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Project Progress
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Approval Workflow
    approvalChain: [
      {
        level: {
          type: String,
          enum: ["hod", "department", "finance", "executive"],
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

    // Set budget threshold based on budget amount
    if (this.budget && !this.budgetThreshold) {
      if (this.budget <= 1000000) {
        // 1M NGN
        this.budgetThreshold = "hod_auto_approve";
      } else if (this.budget <= 5000000) {
        // 5M NGN
        this.budgetThreshold = "department_approval";
      } else if (this.budget <= 25000000) {
        // 25M NGN
        this.budgetThreshold = "finance_approval";
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

// Instance method to generate approval chain with smart cross-department routing
projectSchema.methods.generateApprovalChain = async function () {
  const approvalChain = [];

  // HOD approval (always first)
  approvalChain.push({
    level: "hod",
    department: this.department,
    status: "pending",
    required: true,
  });

  // Get the project creator's department name
  const projectDept = await mongoose
    .model("Department")
    .findById(this.department);
  const projectDeptName = projectDept ? projectDept.name : "Unknown";

  console.log(`🏢 [APPROVAL] Project Department: ${projectDeptName}`);
  console.log(`💰 [APPROVAL] Project Budget: ${this.budget}`);

  // Smart cross-department routing based on budget and creator department
  if (this.budget <= 1000000) {
    // ≤ 1M: HOD auto-approves, no additional approvals needed
    console.log("✅ [APPROVAL] Budget ≤ 1M - HOD auto-approval only");
  } else if (this.budget <= 5000000) {
    // 1M - 5M: Smart routing based on creator department
    if (projectDeptName === "Finance & Accounting") {
      // Finance HOD → Executive (skip department approval)
      console.log("📋 [APPROVAL] Finance HOD → Executive (1M-5M)");
      const execDept = await mongoose
        .model("Department")
        .findOne({ name: "Executive Office" });
      if (execDept) {
        approvalChain.push({
          level: "executive",
          department: execDept._id,
          status: "pending",
          required: true,
        });
      }
    } else {
      // All other HODs → Finance → Executive
      console.log("📋 [APPROVAL] Other HOD → Finance → Executive (1M-5M)");
      const financeDept = await mongoose
        .model("Department")
        .findOne({ name: "Finance & Accounting" });
      if (financeDept) {
        approvalChain.push({
          level: "finance",
          department: financeDept._id,
          status: "pending",
          required: true,
        });
      }
      const execDept = await mongoose
        .model("Department")
        .findOne({ name: "Executive Office" });
      if (execDept) {
        approvalChain.push({
          level: "executive",
          department: execDept._id,
          status: "pending",
          required: true,
        });
      }
    }
  } else if (this.budget <= 25000000) {
    // 5M - 25M: Smart routing based on creator department
    if (projectDeptName === "Finance & Accounting") {
      // Finance HOD → Executive (skip department approval)
      console.log("💰 [APPROVAL] Finance HOD → Executive (5M-25M)");
      const execDept = await mongoose
        .model("Department")
        .findOne({ name: "Executive Office" });
      if (execDept) {
        approvalChain.push({
          level: "executive",
          department: execDept._id,
          status: "pending",
          required: true,
        });
      }
    } else {
      // All other HODs → Finance → Executive
      console.log("💰 [APPROVAL] Other HOD → Finance → Executive (5M-25M)");
      const financeDept = await mongoose
        .model("Department")
        .findOne({ name: "Finance & Accounting" });
      if (financeDept) {
        approvalChain.push({
          level: "finance",
          department: financeDept._id,
          status: "pending",
          required: true,
        });
      }
      const execDept = await mongoose
        .model("Department")
        .findOne({ name: "Executive Office" });
      if (execDept) {
        approvalChain.push({
          level: "executive",
          department: execDept._id,
          status: "pending",
          required: true,
        });
      }
    }
  } else {
    // > 25M: Smart routing based on creator department
    if (projectDeptName === "Finance & Accounting") {
      // Finance HOD → Executive (skip department approval)
      console.log("👔 [APPROVAL] Finance HOD → Executive (>25M)");
      const execDept = await mongoose
        .model("Department")
        .findOne({ name: "Executive Office" });
      if (execDept) {
        approvalChain.push({
          level: "executive",
          department: execDept._id,
          status: "pending",
          required: true,
        });
      }
    } else if (projectDeptName === "Executive Office") {
      // Executive HOD → Finance → Self-approval
      console.log(
        "👔 [APPROVAL] Executive HOD → Finance → Self-approval (>25M)"
      );
      const financeDept = await mongoose
        .model("Department")
        .findOne({ name: "Finance & Accounting" });
      if (financeDept) {
        approvalChain.push({
          level: "finance",
          department: financeDept._id,
          status: "pending",
          required: true,
        });
      }
      // Self-approval step
      approvalChain.push({
        level: "executive",
        department: this.department,
        status: "pending",
        required: true,
      });
    } else {
      // All other HODs → Finance → Executive
      console.log("👔 [APPROVAL] Other HOD → Finance → Executive (>25M)");
      const financeDept = await mongoose
        .model("Department")
        .findOne({ name: "Finance & Accounting" });
      if (financeDept) {
        approvalChain.push({
          level: "finance",
          department: financeDept._id,
          status: "pending",
          required: true,
        });
      }
      const execDept = await mongoose
        .model("Department")
        .findOne({ name: "Executive Office" });
      if (execDept) {
        approvalChain.push({
          level: "executive",
          department: execDept._id,
          status: "pending",
          required: true,
        });
      }
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

const Project = mongoose.model("Project", projectSchema);

export default Project;
