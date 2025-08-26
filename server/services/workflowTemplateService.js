import WorkflowTemplate from "../models/WorkflowTemplate.js";
import Project from "../models/Project.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import ProjectAuditService from "./projectAuditService.js";

class WorkflowTemplateService {
  /**
   * Create project-specific workflow template
   */
  static async createProjectWorkflowTemplate(templateData, createdBy) {
    try {
      console.log(
        "📋 [WORKFLOW TEMPLATE] Creating project workflow template:",
        templateData.name
      );

      const template = new WorkflowTemplate({
        ...templateData,
        createdBy: createdBy._id,
      });

      await template.save();

      console.log(`✅ [WORKFLOW TEMPLATE] Created template: ${template.name}`);
      return template;
    } catch (error) {
      console.error("❌ [WORKFLOW TEMPLATE] Error creating template:", error);
      throw error;
    }
  }

  /**
   * Get workflow template for project category and budget
   */
  static async getWorkflowTemplateForProject(
    projectCategory,
    projectBudget,
    department
  ) {
    try {
      console.log(
        `🔍 [WORKFLOW TEMPLATE] Finding template for ${projectCategory} project (${projectBudget} NGN)`
      );

      // Find templates that match the project criteria
      const templates = await WorkflowTemplate.find({
        isActive: true,
        documentType: "project_workflow",
        $or: [
          { "steps.conditions.projectCategory": projectCategory },
          { "steps.conditions.projectCategory": "all" },
        ],
      }).populate("steps.approvalLevel");

      // Filter templates based on budget and department conditions
      const matchingTemplates = templates.filter((template) => {
        return template.steps.every((step) => {
          const conditions = step.conditions;

          // Check budget conditions
          if (conditions.minBudget && projectBudget < conditions.minBudget)
            return false;
          if (conditions.maxBudget && projectBudget > conditions.maxBudget)
            return false;

          // Check department conditions
          if (conditions.departments && conditions.departments.length > 0) {
            if (!conditions.departments.includes(department)) return false;
          }

          return true;
        });
      });

      if (matchingTemplates.length === 0) {
        console.log(
          "⚠️ [WORKFLOW TEMPLATE] No matching template found, using default"
        );
        return await this.getDefaultProjectTemplate();
      }

      // Return the most specific template (most conditions matched)
      const bestTemplate = matchingTemplates.sort((a, b) => {
        const aSpecificity = this.calculateTemplateSpecificity(
          a,
          projectCategory,
          projectBudget,
          department
        );
        const bSpecificity = this.calculateTemplateSpecificity(
          b,
          projectCategory,
          projectBudget,
          department
        );
        return bSpecificity - aSpecificity;
      })[0];

      console.log(
        `✅ [WORKFLOW TEMPLATE] Selected template: ${bestTemplate.name}`
      );
      return bestTemplate;
    } catch (error) {
      console.error("❌ [WORKFLOW TEMPLATE] Error getting template:", error);
      throw error;
    }
  }

  /**
   * Calculate template specificity score
   */
  static calculateTemplateSpecificity(
    template,
    projectCategory,
    projectBudget,
    department
  ) {
    let score = 0;

    template.steps.forEach((step) => {
      const conditions = step.conditions;

      // Category specificity
      if (conditions.projectCategory === projectCategory) score += 10;
      else if (conditions.projectCategory === "all") score += 1;

      // Budget specificity
      if (conditions.minBudget && conditions.maxBudget) score += 5;
      else if (conditions.minBudget || conditions.maxBudget) score += 3;

      // Department specificity
      if (conditions.departments && conditions.departments.includes(department))
        score += 5;

      // Priority specificity
      if (conditions.priority) score += 2;
    });

    return score;
  }

  /**
   * Get default project template
   */
  static async getDefaultProjectTemplate() {
    try {
      const defaultTemplate = await WorkflowTemplate.findOne({
        isActive: true,
        documentType: "project_workflow",
        name: "Default Project Workflow",
      });

      if (defaultTemplate) {
        return defaultTemplate;
      }

      // Create default template if it doesn't exist
      console.log("📋 [WORKFLOW TEMPLATE] Creating default project template");
      return await this.createDefaultProjectTemplate();
    } catch (error) {
      console.error(
        "❌ [WORKFLOW TEMPLATE] Error getting default template:",
        error
      );
      throw error;
    }
  }

  /**
   * Create default project template
   */
  static async createDefaultProjectTemplate() {
    try {
      const defaultTemplate = {
        name: "Default Project Workflow",
        description: "Standard workflow for all projects",
        documentType: "project_workflow",
        steps: [
          {
            order: 1,
            approvalLevel: null, // Will be set dynamically
            isRequired: true,
            canSkip: false,
            autoApprove: false,
            conditions: {
              projectCategory: "all",
              minBudget: 0,
              maxBudget: 1000000, // 1M NGN
            },
            actions: [
              {
                type: "notify",
                target: "project_manager",
                message: "Project requires HOD approval",
              },
            ],
          },
          {
            order: 2,
            approvalLevel: null, // Will be set dynamically
            isRequired: true,
            canSkip: false,
            autoApprove: false,
            conditions: {
              projectCategory: "all",
              minBudget: 1000000, // 1M+ NGN
            },
            actions: [
              {
                type: "notify",
                target: "finance_hod",
                message: "Project requires Finance approval",
              },
            ],
          },
          {
            order: 3,
            approvalLevel: null, // Will be set dynamically
            isRequired: true,
            canSkip: false,
            autoApprove: false,
            conditions: {
              projectCategory: "all",
              minBudget: 5000000, // 5M+ NGN
            },
            actions: [
              {
                type: "notify",
                target: "executive_hod",
                message: "Project requires Executive approval",
              },
            ],
          },
        ],
      };

      // Create the template (we'll need a system user for this)
      const systemUser = await User.findOne({ username: "system" });
      if (!systemUser) {
        throw new Error("System user not found for creating default template");
      }

      return await this.createProjectWorkflowTemplate(
        defaultTemplate,
        systemUser
      );
    } catch (error) {
      console.error(
        "❌ [WORKFLOW TEMPLATE] Error creating default template:",
        error
      );
      throw error;
    }
  }

  /**
   * Create regulatory compliance workflow template
   */
  static async createRegulatoryComplianceTemplate(complianceType, createdBy) {
    try {
      console.log(
        `📋 [WORKFLOW TEMPLATE] Creating regulatory compliance template for: ${complianceType}`
      );

      const complianceTemplates = {
        equipment_lease_registration: {
          name: "Equipment Lease Registration Compliance",
          description: "Workflow for equipment lease registration compliance",
          steps: [
            {
              order: 1,
              approvalLevel: null,
              isRequired: true,
              canSkip: false,
              autoApprove: false,
              conditions: {
                projectCategory: "equipment_lease",
                priority: "high",
              },
              actions: [
                {
                  type: "notify",
                  target: "legal_hod",
                  message: "Equipment lease requires legal review",
                },
              ],
            },
            {
              order: 2,
              approvalLevel: null,
              isRequired: true,
              canSkip: false,
              autoApprove: false,
              conditions: {
                projectCategory: "equipment_lease",
                priority: "high",
              },
              actions: [
                {
                  type: "notify",
                  target: "compliance_officer",
                  message: "Equipment lease requires compliance review",
                },
              ],
            },
          ],
        },
        vehicle_lease_registration: {
          name: "Vehicle Lease Registration Compliance",
          description: "Workflow for vehicle lease registration compliance",
          steps: [
            {
              order: 1,
              approvalLevel: null,
              isRequired: true,
              canSkip: false,
              autoApprove: false,
              conditions: {
                projectCategory: "vehicle_lease",
                priority: "high",
              },
              actions: [
                {
                  type: "notify",
                  target: "legal_hod",
                  message: "Vehicle lease requires legal review",
                },
              ],
            },
            {
              order: 2,
              approvalLevel: null,
              isRequired: true,
              canSkip: false,
              autoApprove: false,
              conditions: {
                projectCategory: "vehicle_lease",
                priority: "high",
              },
              actions: [
                {
                  type: "notify",
                  target: "transport_officer",
                  message: "Vehicle lease requires transport review",
                },
              ],
            },
          ],
        },
        financial_lease_registration: {
          name: "Financial Lease Registration Compliance",
          description: "Workflow for financial lease registration compliance",
          steps: [
            {
              order: 1,
              approvalLevel: null,
              isRequired: true,
              canSkip: false,
              autoApprove: false,
              conditions: {
                projectCategory: "financial_lease",
                priority: "critical",
              },
              actions: [
                {
                  type: "notify",
                  target: "finance_hod",
                  message: "Financial lease requires finance review",
                },
              ],
            },
            {
              order: 2,
              approvalLevel: null,
              isRequired: true,
              canSkip: false,
              autoApprove: false,
              conditions: {
                projectCategory: "financial_lease",
                priority: "critical",
              },
              actions: [
                {
                  type: "notify",
                  target: "legal_hod",
                  message: "Financial lease requires legal review",
                },
              ],
            },
            {
              order: 3,
              approvalLevel: null,
              isRequired: true,
              canSkip: false,
              autoApprove: false,
              conditions: {
                projectCategory: "financial_lease",
                priority: "critical",
              },
              actions: [
                {
                  type: "notify",
                  target: "executive_hod",
                  message: "Financial lease requires executive approval",
                },
              ],
            },
          ],
        },
      };

      const templateData = complianceTemplates[complianceType];
      if (!templateData) {
        throw new Error(`Unknown compliance type: ${complianceType}`);
      }

      const template = await this.createProjectWorkflowTemplate(
        templateData,
        createdBy
      );
      console.log(
        `✅ [WORKFLOW TEMPLATE] Created compliance template: ${template.name}`
      );
      return template;
    } catch (error) {
      console.error(
        "❌ [WORKFLOW TEMPLATE] Error creating compliance template:",
        error
      );
      throw error;
    }
  }

  /**
   * Apply workflow template to project
   */
  static async applyWorkflowTemplateToProject(
    project,
    template,
    triggeredByUser
  ) {
    try {
      console.log(
        `📋 [WORKFLOW TEMPLATE] Applying template ${template.name} to project ${project.code}`
      );

      // Get departments and users for approval levels
      const departments = await Department.find({ isActive: true });
      const users = await User.find({ isActive: true }).populate(
        "role department"
      );

      // Apply template steps to project
      const approvalChain = [];

      for (const step of template.steps) {
        const stepApprovers = await this.getApproversForStep(
          step,
          project,
          departments,
          users
        );
        approvalChain.push(...stepApprovers);
      }

      // Update project with approval chain
      project.approvalChain = approvalChain;
      project.workflowTemplate = template._id;
      project.workflowPhase = "approval";
      project.status = "pending_approval";

      await project.save();

      // Audit logging
      try {
        await ProjectAuditService.logWorkflowTemplateApplied(
          project,
          triggeredByUser,
          template
        );
      } catch (error) {
        console.error(
          "❌ [AUDIT] Error logging workflow template application:",
          error
        );
      }

      console.log(
        `✅ [WORKFLOW TEMPLATE] Applied template with ${approvalChain.length} approval steps`
      );
      return approvalChain;
    } catch (error) {
      console.error("❌ [WORKFLOW TEMPLATE] Error applying template:", error);
      throw error;
    }
  }

  /**
   * Get approvers for a workflow step
   */
  static async getApproversForStep(step, project, departments, users) {
    const approvers = [];
    const conditions = step.conditions;

    // Determine approvers based on conditions
    if (conditions.departments) {
      for (const deptName of conditions.departments) {
        const department = departments.find((d) => d.name === deptName);
        if (department) {
          const hod = users.find(
            (u) =>
              u.department?._id.toString() === department._id.toString() &&
              u.role?.name === "HOD"
          );
          if (hod) {
            approvers.push({
              level: step.order,
              department: department._id,
              approver: hod._id,
              status: "pending",
              required: step.isRequired,
              canSkip: step.canSkip,
              autoApprove: step.autoApprove,
            });
          }
        }
      }
    }

    // Budget-based approvers
    if (project.budget > 25000000 && step.order === 3) {
      // Executive approval for >25M
      const execDept = departments.find((d) => d.name === "Executive Office");
      if (execDept) {
        const execHOD = users.find(
          (u) =>
            u.department?._id.toString() === execDept._id.toString() &&
            u.role?.name === "HOD"
        );
        if (execHOD) {
          approvers.push({
            level: step.order,
            department: execDept._id,
            approver: execHOD._id,
            status: "pending",
            required: step.isRequired,
            canSkip: step.canSkip,
            autoApprove: step.autoApprove,
          });
        }
      }
    }

    return approvers;
  }

  /**
   * Get all workflow templates
   */
  static async getAllWorkflowTemplates() {
    try {
      const templates = await WorkflowTemplate.find({ isActive: true })
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 });

      return templates;
    } catch (error) {
      console.error("❌ [WORKFLOW TEMPLATE] Error getting templates:", error);
      throw error;
    }
  }

  /**
   * Update workflow template
   */
  static async updateWorkflowTemplate(templateId, updates, updatedBy) {
    try {
      const template = await WorkflowTemplate.findByIdAndUpdate(
        templateId,
        {
          ...updates,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!template) {
        throw new Error("Workflow template not found");
      }

      console.log(`✅ [WORKFLOW TEMPLATE] Updated template: ${template.name}`);
      return template;
    } catch (error) {
      console.error("❌ [WORKFLOW TEMPLATE] Error updating template:", error);
      throw error;
    }
  }

  /**
   * Delete workflow template (soft delete)
   */
  static async deleteWorkflowTemplate(templateId, deletedBy) {
    try {
      const template = await WorkflowTemplate.findByIdAndUpdate(
        templateId,
        {
          isActive: false,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!template) {
        throw new Error("Workflow template not found");
      }

      console.log(`✅ [WORKFLOW TEMPLATE] Deleted template: ${template.name}`);
      return template;
    } catch (error) {
      console.error("❌ [WORKFLOW TEMPLATE] Error deleting template:", error);
      throw error;
    }
  }
}

export default WorkflowTemplateService;
