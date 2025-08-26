import AuditLog from "../models/AuditLog.js";
import Project from "../models/Project.js";

class ProjectAuditService {
  /**
   * Log project creation
   */
  static async logProjectCreated(project, user) {
    try {
      // Ensure user has department populated
      const populatedUser = await user.populate("department");

      // Determine risk level based on project priority and budget
      let riskLevel = "LOW";
      if (project.priority === "high" || project.priority === "critical") {
        riskLevel = "MEDIUM";
      }
      if (project.budget > 10000000) {
        // > 10M
        riskLevel = "HIGH";
      }
      if (project.budget > 50000000) {
        // > 50M
        riskLevel = "CRITICAL";
      }

      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: populatedUser.department?.name || "Not Assigned",
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: populatedUser.department?.name || "Not Assigned",
        },
        action: "PROJECT_CREATED",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          category: project.category,
          budget: project.budget,
          priority: project.priority,
          department: populatedUser.department?.name || "Not Assigned",
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: riskLevel,
      });

      console.log(
        `📋 [AUDIT] Project created: ${project.code} by ${user.firstName} ${
          user.lastName
        } (${populatedUser.department?.name || "Not Assigned"})`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging project creation:", error);
    }
  }

  /**
   * Log project approval
   */
  static async logProjectApproved(project, user, approvalLevel, comments) {
    try {
      // Ensure user has department populated
      const populatedUser = await user.populate("department");

      // Determine risk level based on project priority and budget
      let riskLevel = "MEDIUM";
      if (project.priority === "high" || project.priority === "critical") {
        riskLevel = "HIGH";
      }
      if (project.budget > 10000000) {
        // > 10M
        riskLevel = "HIGH";
      }
      if (project.budget > 50000000) {
        // > 50M
        riskLevel = "CRITICAL";
      }

      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: populatedUser.department?.name || "Not Assigned",
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: populatedUser.department?.name || "Not Assigned",
        },
        action: "PROJECT_APPROVED",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          approvalLevel: approvalLevel,
          comments: comments,
          approverDepartment: populatedUser.department?.name || "Not Assigned",
          budget: project.budget,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: riskLevel,
      });

      console.log(
        `✅ [AUDIT] Project approved: ${
          project.code
        } at ${approvalLevel} level by ${user.firstName} ${user.lastName} (${
          populatedUser.department?.name || "Not Assigned"
        })`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging project approval:", error);
    }
  }

  /**
   * Log project rejection
   */
  static async logProjectRejected(project, user, rejectionLevel, comments) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "PROJECT_REJECTED",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          rejectionLevel: rejectionLevel,
          comments: comments,
          rejecterDepartment: user.department?.name,
          budget: project.budget,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "HIGH",
      });

      console.log(
        `❌ [AUDIT] Project rejected: ${project.code} at ${rejectionLevel} level by ${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging project rejection:", error);
    }
  }

  /**
   * Log workflow trigger
   */
  static async logWorkflowTriggered(project, user, workflowPhase) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "PROJECT_WORKFLOW_TRIGGERED",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          workflowPhase: workflowPhase,
          triggeredBy: `${user.firstName} ${user.lastName}`,
          budget: project.budget,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "MEDIUM",
      });

      console.log(
        `🚀 [AUDIT] Workflow triggered: ${project.code} phase ${workflowPhase} by ${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging workflow trigger:", error);
    }
  }

  /**
   * Log phase change
   */
  static async logPhaseChanged(project, user, oldPhase, newPhase) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "PROJECT_PHASE_CHANGED",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          oldPhase: oldPhase,
          newPhase: newPhase,
          changedBy: `${user.firstName} ${user.lastName}`,
          budget: project.budget,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "MEDIUM",
      });

      console.log(
        `🔄 [AUDIT] Phase changed: ${project.code} ${oldPhase} → ${newPhase} by ${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging phase change:", error);
    }
  }

  /**
   * Log inventory creation
   */
  static async logInventoryCreated(project, user) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "PROJECT_INVENTORY_CREATED",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          category: project.category,
          triggeredBy: `${user.firstName} ${user.lastName}`,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "LOW",
      });

      console.log(`📦 [AUDIT] Inventory created for project: ${project.code}`);
    } catch (error) {
      console.error("❌ [AUDIT] Error logging inventory creation:", error);
    }
  }

  /**
   * Log procurement initiation
   */
  static async logProcurementInitiated(project, user) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "PROJECT_PROCUREMENT_INITIATED",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          budget: project.budget,
          triggeredBy: `${user.firstName} ${user.lastName}`,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "MEDIUM",
      });

      console.log(
        `🛒 [AUDIT] Procurement initiated for project: ${project.code}`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging procurement initiation:", error);
    }
  }

  /**
   * Log financial setup
   */
  static async logFinancialSetup(project, user) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "PROJECT_FINANCIAL_SETUP",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          budget: project.budget,
          triggeredBy: `${user.firstName} ${user.lastName}`,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "MEDIUM",
      });

      console.log(`💰 [AUDIT] Financial setup for project: ${project.code}`);
    } catch (error) {
      console.error("❌ [AUDIT] Error logging financial setup:", error);
    }
  }

  /**
   * Log tasks creation
   */
  static async logTasksCreated(project, user, taskCount) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "PROJECT_TASKS_CREATED",
        resourceType: "PROJECT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          taskCount: taskCount,
          triggeredBy: `${user.firstName} ${user.lastName}`,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "LOW",
      });

      console.log(
        `📋 [AUDIT] Tasks created for project: ${project.code} (${taskCount} tasks)`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging tasks creation:", error);
    }
  }

  /**
   * Log document approval
   */
  static async logDocumentApproved(document, user, comments) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: document.project,
        projectDetails: {
          name: document.project?.name || "N/A",
          code: document.project?.code || "N/A",
          category: document.project?.category || "N/A",
          budget: document.project?.budget || 0,
          department: document.project?.department?.name || "N/A",
        },
        action: "DOCUMENT_APPROVED",
        resourceType: "DOCUMENT",
        resourceId: document._id,
        details: {
          documentTitle: document.title,
          documentType: document.documentType,
          category: document.category,
          comments: comments,
          approvedBy: `${user.firstName} ${user.lastName}`,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "MEDIUM",
      });

      console.log(
        `✅ [AUDIT] Document approved: ${document.title} by ${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging document approval:", error);
    }
  }

  /**
   * Log document rejection
   */
  static async logDocumentRejected(document, user, comments) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: document.project,
        projectDetails: {
          name: document.project?.name || "N/A",
          code: document.project?.code || "N/A",
          category: document.project?.category || "N/A",
          budget: document.project?.budget || 0,
          department: document.project?.department?.name || "N/A",
        },
        action: "DOCUMENT_REJECTED",
        resourceType: "DOCUMENT",
        resourceId: document._id,
        details: {
          documentTitle: document.title,
          documentType: document.documentType,
          category: document.category,
          comments: comments,
          rejectedBy: `${user.firstName} ${user.lastName}`,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "HIGH",
      });

      console.log(
        `❌ [AUDIT] Document rejected: ${document.title} by ${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging document rejection:", error);
    }
  }

  /**
   * Log workflow template application
   */
  static async logWorkflowTemplateApplied(project, user, template) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "PROJECT_WORKFLOW_TEMPLATE_APPLIED",
        resourceType: "WORKFLOW_TEMPLATE",
        resourceId: template._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          templateName: template.name,
          templateDescription: template.description,
          appliedBy: `${user.firstName} ${user.lastName}`,
          budget: project.budget,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "MEDIUM",
      });

      console.log(
        `📋 [AUDIT] Workflow template applied: ${template.name} to project ${project.code}`
      );
    } catch (error) {
      console.error(
        "❌ [AUDIT] Error logging workflow template application:",
        error
      );
    }
  }

  /**
   * Get project audit trail
   */
  static async getProjectAuditTrail(projectId) {
    try {
      const auditTrail = await AuditLog.find({
        projectId: projectId,
        action: {
          $in: [
            "PROJECT_CREATED",
            "PROJECT_UPDATED",
            "PROJECT_APPROVED",
            "PROJECT_REJECTED",
            "PROJECT_WORKFLOW_TRIGGERED",
            "PROJECT_PHASE_CHANGED",
            "PROJECT_INVENTORY_CREATED",
            "PROJECT_PROCUREMENT_INITIATED",
            "PROJECT_FINANCIAL_SETUP",
            "PROJECT_TASKS_CREATED",
            "PROJECT_COMPLETED",
          ],
        },
      })
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 });

      return auditTrail;
    } catch (error) {
      console.error("❌ [AUDIT] Error getting project audit trail:", error);
      throw error;
    }
  }

  /**
   * Log document creation for project
   */
  static async logDocumentCreated(project, user, documentCount) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: project._id,
        projectDetails: {
          name: project.name,
          code: project.code,
          category: project.category,
          budget: project.budget,
          department: project.department?.name,
        },
        action: "DOCUMENT_CREATED",
        resourceType: "DOCUMENT",
        resourceId: project._id,
        details: {
          projectName: project.name,
          projectCode: project.code,
          documentCount: documentCount,
          createdBy: `${user.firstName} ${user.lastName}`,
          department: user.department?.name,
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "LOW",
      });

      console.log(
        `📄 [AUDIT] Documents created for project: ${project.code} (${documentCount} documents) by ${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging document creation:", error);
    }
  }

  /**
   * Log task status change
   */
  static async logTaskStatusChanged(task, user, oldStatus, newStatus) {
    try {
      await AuditLog.create({
        userId: user._id,
        userDetails: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name,
        },
        projectId: task.project,
        projectDetails: {
          name: task.project?.name || "N/A",
          code: task.project?.code || "N/A",
          category: task.project?.category || "N/A",
          budget: task.project?.budget || 0,
          department: task.project?.department?.name || "N/A",
        },
        action: "PROJECT_TASK_STATUS_CHANGED",
        resourceType: "TASK",
        resourceId: task._id,
        details: {
          taskTitle: task.title,
          taskDescription: task.description,
          oldStatus: oldStatus,
          newStatus: newStatus,
          changedBy: `${user.firstName} ${user.lastName}`,
          projectName: task.project?.name || "N/A",
          projectCode: task.project?.code || "N/A",
        },
        ipAddress: "system",
        userAgent: "system",
        riskLevel: "LOW",
      });

      console.log(
        `🔄 [AUDIT] Task status changed: ${task.title} ${oldStatus} → ${newStatus} by ${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging task status change:", error);
    }
  }
}

export default ProjectAuditService;
