import mongoose from "mongoose";

const documentTemplateSchema = new mongoose.Schema(
  {
    // Basic Template Information
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
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Template Type and Category
    templateType: {
      type: String,
      enum: [
        "project_proposal",
        "budget_breakdown",
        "technical_specifications",
        "risk_assessment",
        "vendor_quotes",
        "legal_review",
        "financial_analysis",
        "contract_template",
        "invoice_template",
        "policy_template",
        "procedure_template",
        "report_template",
        "form_template",
        "certificate_template",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "project_document",
        "financial_document",
        "legal_document",
        "technical_document",
        "administrative_document",
        "hr_document",
        "compliance_document",
      ],
      required: true,
    },

    // Template Content
    content: {
      type: String, // HTML/Markdown content
      required: true,
    },
    variables: [
      {
        name: String,
        type: {
          type: String,
          enum: ["text", "number", "date", "select", "boolean"],
        },
        required: Boolean,
        defaultValue: String,
        options: [String], // For select type
        description: String,
      },
    ],

    // File Template
    fileTemplate: {
      type: String, // URL to template file (Word, Excel, PDF)
    },
    fileType: {
      type: String,
      enum: ["docx", "xlsx", "pdf", "html"],
      default: "docx",
    },

    // Access Control
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowedDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    requiredRoleLevel: {
      type: Number,
      default: 300,
      enum: [0, 100, 300, 600, 700, 1000],
    },

    // Usage Tracking
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
    },

    // Metadata
    tags: [String],
    version: {
      type: Number,
      default: 1,
    },
    // Dynamic triggers for template selection
    triggers: {
      projectCategories: {
        type: [String],
        default: ["all"],
        enum: [
          "all",
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
      budgetThresholds: {
        type: [Number],
        default: [0],
      },
      userRoles: {
        type: [String],
        default: ["all"],
        enum: ["all", "HOD", "MANAGER", "STAFF", "VIEWER"],
      },
      approvalLevels: {
        type: [String],
        default: ["all"],
        enum: ["all", "department", "finance", "executive"],
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make it optional for system-generated templates
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
documentTemplateSchema.index({ templateType: 1, category: 1 });
documentTemplateSchema.index({ isActive: 1, allowedDepartments: 1 });
documentTemplateSchema.index({ code: 1 });

// Static method to get templates by project category
documentTemplateSchema.statics.getTemplatesForProject = async function (
  projectCategory,
  budget,
  userRole = "HOD",
  approvalLevel = "department"
) {
  console.log(`🔍 [DocumentTemplate] Getting templates for:`, {
    projectCategory,
    budget,
    userRole,
    approvalLevel,
  });

  // Get all active templates
  const allTemplates = await this.find({ isActive: true });
  const matchingTemplates = [];

  for (const template of allTemplates) {
    let shouldInclude = true;

    // Check project category trigger
    if (
      !template.triggers?.projectCategories?.includes("all") &&
      !template.triggers?.projectCategories?.includes(projectCategory)
    ) {
      shouldInclude = false;
    }

    // Check budget threshold trigger
    if (
      template.triggers?.budgetThresholds?.length > 0 &&
      !template.triggers.budgetThresholds.includes(0)
    ) {
      const budgetMet = template.triggers.budgetThresholds.some(
        (threshold) => budget >= threshold
      );
      if (!budgetMet) {
        shouldInclude = false;
      }
    }

    // Check user role trigger
    if (
      !template.triggers?.userRoles?.includes("all") &&
      !template.triggers?.userRoles?.includes(userRole)
    ) {
      shouldInclude = false;
    }

    // Check approval level trigger
    if (
      !template.triggers?.approvalLevels?.includes("all") &&
      !template.triggers?.approvalLevels?.includes(approvalLevel)
    ) {
      shouldInclude = false;
    }

    if (shouldInclude) {
      matchingTemplates.push(template);
      console.log(`   ✅ Template matched: ${template.name}`);
    }
  }

  console.log(
    `📄 [DocumentTemplate] Found ${matchingTemplates.length} matching templates`
  );
  return matchingTemplates;
};

// Method to generate document from template
documentTemplateSchema.methods.generateDocument = async function (
  project,
  user,
  variables = {}
) {
  let content = this.content;

  // Replace variables in content
  for (const variable of this.variables) {
    const value =
      variables[variable.name] || variable.defaultValue || `[${variable.name}]`;
    const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");
    content = content.replace(regex, value);
  }

  // Replace project-specific variables
  const projectVars = {
    "{{PROJECT_NAME}}": project.name,
    "{{PROJECT_CODE}}": project.code,
    "{{PROJECT_CATEGORY}}": project.category,
    "{{PROJECT_BUDGET}}": project.budget?.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    }),
    "{{PROJECT_DESCRIPTION}}": project.description,
    "{{CREATED_BY}}": `${user.firstName} ${user.lastName}`,
    "{{DEPARTMENT}}": user.department?.name,
    "{{CREATED_DATE}}": new Date().toLocaleDateString("en-NG"),
  };

  for (const [key, value] of Object.entries(projectVars)) {
    content = content.replace(new RegExp(key, "g"), value || "");
  }

  return {
    title: `${this.name} - ${project.name}`,
    content: content,
    templateId: this._id,
    templateVersion: this.version,
  };
};

const DocumentTemplate = mongoose.model(
  "DocumentTemplate",
  documentTemplateSchema
);

export default DocumentTemplate;
