import mongoose from "mongoose";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

class WorkflowTaskService {
  /**
   * Create tasks for Operations phase (Inventory Creation)
   */
  static async createOperationsTasks(projectId) {
    try {
      console.log(
        "🔧 [WORKFLOW TASKS] Creating Operations tasks for project:",
        projectId
      );

      const project = await Project.findById(projectId).populate(
        "projectManager"
      );
      const operationsDept = await Department.findOne({ name: "Operations" });
      const operationsUsers = await User.find({
        department: operationsDept._id,
        isActive: true,
      });

      const operationsTasks = [
        {
          title: "Create Equipment Inventory Records",
          description: `Create actual inventory items for ${project.name} based on project specifications.`,
          category: "inventory_creation",
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          project: projectId,
          assignedTo: operationsUsers[0]._id,
          createdBy: project.projectManager._id,
          department: operationsDept._id,
          workflowPhase: "operations",
          workflowStep: 1,
          estimatedHours: 4,
          tags: ["inventory", "equipment", "creation"],
          actionItems: [
            "Review project equipment specifications",
            "Create inventory item: CAT320 Excavator",
            "Assign inventory code: INV-2025-001",
            "Set specifications: Brand, Model, Year",
            "Assign location: Warehouse A-15",
          ],
        },
        {
          title: "Set Up Asset Tracking System",
          description: `Configure asset tracking and monitoring for ${project.name} inventory.`,
          category: "asset_tracking",
          priority: "medium",
          status: "pending",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          project: projectId,
          assignedTo: operationsUsers[0]._id,
          createdBy: project.projectManager._id,
          department: operationsDept._id,
          workflowPhase: "operations",
          workflowStep: 2,
          estimatedHours: 4,
          tags: ["asset-tracking", "monitoring", "setup"],
          actionItems: [
            "Generate unique asset codes",
            "Assign storage locations",
            "Set up monitoring alerts",
            "Configure status tracking",
          ],
        },
      ];

      const createdTasks = await Task.insertMany(operationsTasks);
      console.log(
        `✅ [WORKFLOW TASKS] Created ${createdTasks.length} Operations tasks`
      );
      return createdTasks;
    } catch (error) {
      console.error(
        "❌ [WORKFLOW TASKS] Error creating Operations tasks:",
        error
      );
      throw error;
    }
  }

  /**
   * Create tasks for Procurement phase
   */
  static async createProcurementTasks(projectId) {
    try {
      console.log(
        "🛒 [WORKFLOW TASKS] Creating Procurement tasks for project:",
        projectId
      );

      const project = await Project.findById(projectId).populate(
        "projectManager"
      );
      const procurementDept = await Department.findOne({ name: "Procurement" });
      const procurementUsers = await User.find({
        department: procurementDept._id,
        isActive: true,
      });

      const procurementTasks = [
        {
          title: "Vendor Evaluation and Selection",
          description: `Evaluate and select vendors for ${project.name} equipment and materials.`,
          category: "vendor_selection",
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          project: projectId,
          assignedTo: procurementUsers[0]._id,
          createdBy: project.projectManager._id,
          department: procurementDept._id,
          workflowPhase: "procurement",
          workflowStep: 1,
          estimatedHours: 8,
          tags: ["vendor", "evaluation", "selection"],
          actionItems: [
            "Review vendor quotes for CAT320 Excavator",
            "Compare vendor pricing and terms",
            "Evaluate vendor reliability and delivery time",
            "Select preferred vendors for each item",
          ],
        },
        {
          title: "Create Purchase Orders",
          description: `Generate purchase orders for ${project.name} equipment and materials.`,
          category: "purchase_orders",
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          project: projectId,
          assignedTo: procurementUsers[0]._id,
          createdBy: project.projectManager._id,
          department: procurementDept._id,
          workflowPhase: "procurement",
          workflowStep: 2,
          estimatedHours: 6,
          tags: ["purchase", "orders", "creation"],
          actionItems: [
            "Create PO for Caterpillar CAT320 Excavator",
            "Create PO for construction materials",
            "Set payment terms and delivery schedule",
            "Send PO to selected vendors",
          ],
        },
        {
          title: "Vendor Contract Management",
          description: `Manage vendor contracts and agreements for ${project.name}.`,
          category: "contract_management",
          priority: "medium",
          status: "pending",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          project: projectId,
          assignedTo: procurementUsers[0]._id,
          createdBy: project.projectManager._id,
          department: procurementDept._id,
          workflowPhase: "procurement",
          workflowStep: 3,
          estimatedHours: 8,
          tags: ["contract", "management", "agreements"],
          actionItems: [
            "Negotiate contract terms with vendors",
            "Finalize vendor agreements",
            "Set up contract monitoring",
            "Establish vendor performance metrics",
          ],
        },
      ];

      const createdTasks = await Task.insertMany(procurementTasks);
      console.log(
        `✅ [WORKFLOW TASKS] Created ${createdTasks.length} Procurement tasks`
      );
      return createdTasks;
    } catch (error) {
      console.error(
        "❌ [WORKFLOW TASKS] Error creating Procurement tasks:",
        error
      );
      throw error;
    }
  }

  /**
   * Create tasks for Finance phase
   */
  static async createFinanceTasks(projectId) {
    try {
      console.log(
        "💰 [WORKFLOW TASKS] Creating Finance tasks for project:",
        projectId
      );

      const project = await Project.findById(projectId).populate(
        "projectManager"
      );
      const financeDept = await Department.findOne({
        name: "Finance & Accounting",
      });
      const financeUsers = await User.find({
        department: financeDept._id,
        isActive: true,
      });

      const financeTasks = [
        {
          title: "Budget Allocation and Setup",
          description: `Set up budget allocation and financial tracking for ${project.name}.`,
          category: "budget_setup",
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
          project: projectId,
          assignedTo: financeUsers[0]._id,
          createdBy: project.projectManager._id,
          department: financeDept._id,
          workflowPhase: "finance",
          workflowStep: 1,
          estimatedHours: 8,
          tags: ["budget", "allocation", "setup"],
        },
        {
          title: "Payment Processing Setup",
          description: `Configure payment processing and approval workflows for ${project.name}.`,
          category: "payment_setup",
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
          project: projectId,
          assignedTo: financeUsers[0]._id,
          createdBy: project.projectManager._id,
          department: financeDept._id,
          workflowPhase: "finance",
          workflowStep: 2,
          estimatedHours: 6,
          tags: ["payment", "processing", "workflow"],
        },
      ];

      const createdTasks = await Task.insertMany(financeTasks);
      console.log(
        `✅ [WORKFLOW TASKS] Created ${createdTasks.length} Finance tasks`
      );
      return createdTasks;
    } catch (error) {
      console.error("❌ [WORKFLOW TASKS] Error creating Finance tasks:", error);
      throw error;
    }
  }

  /**
   * Complete all tasks for a workflow phase and trigger next phase
   */
  static async completeWorkflowPhase(projectId, phase) {
    try {
      console.log(
        `🔄 [WORKFLOW TASKS] Completing ${phase} phase for project:`,
        projectId
      );

      // Mark all tasks in the phase as completed
      await Task.updateMany(
        {
          project: projectId,
          workflowPhase: phase,
          status: { $ne: "completed" },
        },
        { status: "completed", completedAt: new Date() }
      );

      // Update project workflow triggers
      const project = await Project.findById(projectId);
      switch (phase) {
        case "operations":
          project.workflowTriggers.procurementInitiated = true;
          project.workflowStep = 3;
          break;
        case "procurement":
          project.workflowTriggers.financialSetup = true;
          project.workflowStep = 4;
          break;
        case "finance":
          project.workflowPhase = "execution";
          project.workflowStep = 5;
          break;
      }

      await project.save();
      console.log(
        `✅ [WORKFLOW TASKS] Completed ${phase} phase and triggered next phase`
      );
      return project;
    } catch (error) {
      console.error(
        `❌ [WORKFLOW TASKS] Error completing ${phase} phase:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all tasks for a project by workflow phase
   */
  static async getProjectTasksByPhase(projectId, phase) {
    try {
      const tasks = await Task.find({
        project: projectId,
        workflowPhase: phase,
      }).populate("assignedTo", "firstName lastName email");
      return tasks;
    } catch (error) {
      console.error(
        `❌ [WORKFLOW TASKS] Error getting tasks for ${phase}:`,
        error
      );
      throw error;
    }
  }
}

export default WorkflowTaskService;
