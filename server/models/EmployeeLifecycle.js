import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
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
    taskType: {
      type: String,
      enum: [
        // Onboarding Tasks
        "documentation_paperwork",
        "system_access_equipment",
        "department_orientation",
        "training_compliance",
        "final_review_activation",
        // Offboarding Tasks
        "exit_documentation",
        "access_equipment_return",
        "exit_interview",
        "knowledge_transfer",
        "final_clearance_deactivation",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Overdue", "Cancelled"],
      default: "Pending",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        filename: String,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const employeeLifecycleSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Onboarding", "Offboarding", "Transfer", "Promotion"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Initiated", "In Progress", "Completed", "Cancelled", "On Hold"],
      default: "Initiated",
    },
    startDate: {
      type: Date,
      required: true,
    },
    targetCompletionDate: {
      type: Date,
      required: true,
    },
    actualCompletionDate: {
      type: Date,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedHR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    position: {
      type: String,
      trim: true,
    },
    tasks: [taskSchema],
    checklist: [
      {
        item: {
          type: String,
          required: true,
          trim: true,
        },
        checklistTemplate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ChecklistTemplate",
        },
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
        isRequired: {
          type: Boolean,
          default: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        completedAt: {
          type: Date,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    documents: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        documentTemplate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "DocumentTemplate",
        },
        documentType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "DocumentType",
        },
        status: {
          type: String,
          enum: ["Required", "Submitted", "Verified", "Missing"],
          default: "Required",
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
        },
        filePath: {
          type: String,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    timeline: [
      {
        action: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        performedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["Success", "Warning", "Error"],
          default: "Success",
        },
      },
    ],
    processSteps: [
      {
        stepName: {
          type: String,
          required: true,
          trim: true,
        },
        stepType: {
          type: String,
          enum: [
            "Interview",
            "Training",
            "Documentation",
            "Equipment",
            "Orientation",
            "Custom",
          ],
          required: true,
        },
        scheduled: {
          type: Boolean,
          default: false,
        },
        scheduledDate: {
          type: Date,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
        },
        conductedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: {
          type: String,
          trim: true,
        },
        items: [
          {
            name: { type: String, trim: true },
            type: { type: String, trim: true },
            status: {
              type: String,
              enum: ["Assigned", "Returned", "Pending"],
              default: "Pending",
            },
            assignedAt: { type: Date },
            returnedAt: { type: Date },
            notes: { type: String, trim: true },
          },
        ],
      },
    ],
    // Final payroll data (for offboarding)
    finalPayrollData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
employeeLifecycleSchema.index({ employee: 1, type: 1 });
employeeLifecycleSchema.index({ status: 1 });
employeeLifecycleSchema.index({ department: 1 });
employeeLifecycleSchema.index({ initiatedBy: 1 });
employeeLifecycleSchema.index({ assignedHR: 1 });
employeeLifecycleSchema.index({ startDate: 1 });
employeeLifecycleSchema.index({ targetCompletionDate: 1 });

// Virtual for progress calculation
employeeLifecycleSchema.virtual("progress").get(function () {
  if (!this.checklist || this.checklist.length === 0) return 0;
  const completed = this.checklist.filter((item) => item.isCompleted).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Virtual for overdue status
employeeLifecycleSchema.virtual("isOverdue").get(function () {
  return (
    this.status === "In Progress" && new Date() > this.targetCompletionDate
  );
});

// Virtual for days remaining
employeeLifecycleSchema.virtual("daysRemaining").get(function () {
  if (this.status === "Completed" || this.status === "Cancelled") return 0;
  const now = new Date();
  const target = new Date(this.targetCompletionDate);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Instance method to add timeline entry
employeeLifecycleSchema.methods.addTimelineEntry = function (
  action,
  description,
  performedBy,
  status = "Success"
) {
  this.timeline.push({
    action,
    description,
    performedBy,
    status,
  });
  return this.save();
};

// Instance method to complete a checklist item
employeeLifecycleSchema.methods.completeChecklistItem = function (
  itemIndex,
  completedBy,
  notes = ""
) {
  if (this.checklist[itemIndex]) {
    this.checklist[itemIndex].isCompleted = true;
    this.checklist[itemIndex].completedBy = completedBy;
    this.checklist[itemIndex].completedAt = new Date();
    this.checklist[itemIndex].notes = notes;

    // Add timeline entry
    this.addTimelineEntry(
      "Checklist Item Completed",
      `Completed: ${this.checklist[itemIndex].item}`,
      completedBy
    );

    return this.save();
  }
  throw new Error("Checklist item not found");
};

// Instance method to add task
employeeLifecycleSchema.methods.addTask = function (taskData) {
  this.tasks.push(taskData);
  return this.save();
};

// Instance method to update task status
employeeLifecycleSchema.methods.updateTaskStatus = function (
  taskId,
  status,
  completedBy = null
) {
  const task = this.tasks.id(taskId);
  if (task) {
    task.status = status;

    if (status === "In Progress" && !task.startedAt) {
      task.startedAt = new Date();
    }

    if (status === "Completed" && completedBy) {
      task.completedBy = completedBy;
      task.completedAt = new Date();
    }

    return this.save();
  }
  throw new Error("Task not found");
};

// Instance method to start a task
employeeLifecycleSchema.methods.startTask = function (taskId, startedBy) {
  return this.updateTaskStatus(taskId, "In Progress", startedBy);
};

// Instance method to complete a task
employeeLifecycleSchema.methods.completeTask = function (
  taskId,
  completedBy,
  notes = ""
) {
  const task = this.tasks.id(taskId);
  if (task) {
    task.status = "Completed";
    task.completedBy = completedBy;
    task.completedAt = new Date();
    if (notes) {
      task.notes = notes;
    }
    return this.save();
  }
  throw new Error("Task not found");
};

// Instance method to get task by type
employeeLifecycleSchema.methods.getTaskByType = function (taskType) {
  return this.tasks.find((task) => task.taskType === taskType);
};

// Instance method to get progress percentage
employeeLifecycleSchema.methods.getProgressPercentage = function () {
  if (!this.tasks || this.tasks.length === 0) return 0;
  const completedTasks = this.tasks.filter(
    (task) => task.status === "Completed"
  ).length;
  return Math.round((completedTasks / this.tasks.length) * 100);
};

// Static method to get lifecycle by employee and type
employeeLifecycleSchema.statics.findByEmployeeAndType = function (
  employeeId,
  type
) {
  return this.findOne({ employee: employeeId, type }).populate([
    { path: "employee", select: "firstName lastName email avatar" },
    { path: "initiatedBy", select: "firstName lastName email" },
    { path: "assignedHR", select: "firstName lastName email" },
    { path: "department", select: "name" },
    { path: "tasks.assignedTo", select: "firstName lastName email" },
    { path: "tasks.completedBy", select: "firstName lastName email" },
    { path: "checklist.completedBy", select: "firstName lastName email" },
    { path: "timeline.performedBy", select: "firstName lastName email" },
  ]);
};

// Static method to get active lifecycles
employeeLifecycleSchema.statics.findActive = function () {
  return this.find({
    status: { $in: ["Initiated", "In Progress"] },
  }).populate([
    { path: "employee", select: "firstName lastName email avatar" },
    { path: "department", select: "name" },
    { path: "assignedHR", select: "firstName lastName email" },
  ]);
};

// Static method to get overdue lifecycles
employeeLifecycleSchema.statics.findOverdue = function () {
  return this.find({
    status: { $in: ["Initiated", "In Progress"] },
    targetCompletionDate: { $lt: new Date() },
  }).populate([
    { path: "employee", select: "firstName lastName email avatar" },
    { path: "department", select: "name" },
    { path: "assignedHR", select: "firstName lastName email" },
  ]);
};

// Static method to create standardized 5-task lifecycle
employeeLifecycleSchema.statics.createStandardLifecycle = async function (
  employeeId,
  type,
  departmentId,
  roleId,
  initiatedBy,
  assignedHR
) {
  console.log(
    `🚀 [LIFECYCLE] Creating ${type} lifecycle for employee: ${employeeId}`
  );

  // Define the 5 core tasks based on type
  const taskDefinitions =
    type === "Onboarding"
      ? [
          {
            title: "📄 Documentation & Paperwork",
            description:
              "Collect all required documents (ID, certificates, bank details, etc.)",
            taskType: "documentation_paperwork",
            priority: "High",
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
          },
          {
            title: "💻 System Access & Equipment",
            description:
              "Set up accounts, assign equipment, and provide system access",
            taskType: "system_access_equipment",
            priority: "High",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
          },
          {
            title: "🏢 Department Orientation",
            description:
              "Meet team, learn department processes, and understand role",
            taskType: "department_orientation",
            priority: "Medium",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
          {
            title: "📚 Training & Compliance",
            description:
              "Complete required training programs and compliance requirements",
            taskType: "training_compliance",
            priority: "High",
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          },
          {
            title: "✅ Final Review & Activation",
            description:
              "Final check and activate employee for full system access",
            taskType: "final_review_activation",
            priority: "Critical",
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
          },
        ]
      : [
          {
            title: "📋 Exit Documentation",
            description: "Complete exit forms and final paperwork",
            taskType: "exit_documentation",
            priority: "High",
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
          },
          {
            title: "🔒 Access & Equipment Return",
            description:
              "Revoke access, return equipment, and collect company assets",
            taskType: "access_equipment_return",
            priority: "Critical",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
          },
          {
            title: "💬 Exit Interview",
            description: "Conduct exit interview and gather feedback",
            taskType: "exit_interview",
            priority: "Medium",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
          {
            title: "📊 Knowledge Transfer",
            description:
              "Hand over responsibilities and knowledge to team members",
            taskType: "knowledge_transfer",
            priority: "High",
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          },
          {
            title: "✅ Final Clearance & Deactivation",
            description: "Final check and deactivate employee from all systems",
            taskType: "final_clearance_deactivation",
            priority: "Critical",
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
          },
        ];

  // Create tasks with HR assignment
  const tasks = taskDefinitions.map((taskDef) => ({
    ...taskDef,
    assignedTo: assignedHR,
    status: "Pending",
  }));

  // Create the lifecycle
  const lifecycle = new this({
    employee: employeeId,
    type,
    startDate: new Date(),
    targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    initiatedBy,
    assignedHR,
    department: departmentId,
    tasks,
    checklist: [], // Simplified - no complex checklist
    documents: [], // Simplified - no complex documents
    processSteps: [], // Simplified - no complex process steps
  });

  console.log(
    `✅ [LIFECYCLE] Created ${type} lifecycle with ${tasks.length} tasks`
  );
  return lifecycle.save();
};

// Pre-save middleware to update status based on task progress
employeeLifecycleSchema.pre("save", async function (next) {
  if (this.tasks && this.tasks.length > 0) {
    const completedCount = this.tasks.filter(
      (task) => task.status === "Completed"
    ).length;
    const totalCount = this.tasks.length;

    if (completedCount === totalCount && this.status !== "Completed") {
      this.status = "Completed";
      this.actualCompletionDate = new Date();
      console.log(
        `✅ [LIFECYCLE] ${this.type} lifecycle completed for employee: ${this.employee}`
      );

      // Update employee status based on lifecycle type
      if (this.type === "Offboarding") {
        try {
          const User = mongoose.model("User");
          await User.findByIdAndUpdate(this.employee, {
            status: "PENDING_OFFBOARDING",
            isActive: false,
          });
          console.log(
            `🔄 [LIFECYCLE] Employee status updated to PENDING_OFFBOARDING and deactivated`
          );

          // Trigger final payroll calculation
          try {
            const PayrollService = (
              await import("../services/payrollService.js")
            ).default;
            const currentDate = new Date();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();

            console.log(
              `💰 [FINAL PAYROLL] Triggering final payroll calculation for offboarded employee: ${this.employee}`
            );

            // Calculate final payroll (this will be stored for HR to review and process)
            const finalPayrollData = await PayrollService.calculateFinalPayroll(
              this.employee,
              month,
              year
            );

            // Store final payroll data in the lifecycle for HR review
            this.finalPayrollData = finalPayrollData;
            console.log(
              `✅ [FINAL PAYROLL] Final payroll calculated and stored for employee: ${this.employee}`
            );
          } catch (payrollError) {
            console.error(
              "❌ [FINAL PAYROLL] Error calculating final payroll:",
              payrollError
            );
            // Don't fail the offboarding process if payroll calculation fails
          }
        } catch (error) {
          console.error(
            "❌ [LIFECYCLE] Error updating employee status:",
            error
          );
        }
      }
    } else if (completedCount > 0 && this.status === "Initiated") {
      this.status = "In Progress";
    }
  }
  next();
});

const EmployeeLifecycle = mongoose.model(
  "EmployeeLifecycle",
  employeeLifecycleSchema
);

export default EmployeeLifecycle;
