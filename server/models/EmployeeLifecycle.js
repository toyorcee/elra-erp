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
    taskTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskTemplate",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
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
    if (status === "Completed" && completedBy) {
      task.completedBy = completedBy;
      task.completedAt = new Date();
    }
    return this.save();
  }
  throw new Error("Task not found");
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

// Static method to create lifecycle from templates
employeeLifecycleSchema.statics.createFromTemplates = async function (
  employeeId,
  type,
  departmentId,
  roleId,
  initiatedBy,
  assignedHR
) {
  const TaskTemplate = mongoose.model("TaskTemplate");
  const ChecklistTemplate = mongoose.model("ChecklistTemplate");
  const DocumentType = mongoose.model("DocumentType");

  // Get templates based on department and role
  const taskTemplates = await TaskTemplate.findByDepartmentAndType(
    departmentId,
    type
  );
  const checklistTemplates = await ChecklistTemplate.findByDepartmentAndType(
    departmentId,
    type
  );
  const documentTypes = await DocumentType.findByDepartmentAndCategory(
    departmentId,
    "Employment"
  );

  // Create tasks from templates
  const tasks = taskTemplates.map((template) => ({
    title: template.name,
    description: template.description,
    taskTemplate: template._id,
    category: template.department || departmentId,
    priority: template.defaultPriority,
    assignedTo: assignedHR,
    dueDate: new Date(
      Date.now() + template.defaultDueDateOffset * 24 * 60 * 60 * 1000
    ),
    notes: template.instructions,
  }));

  // Create checklist from templates
  const checklist = checklistTemplates.flatMap((template) =>
    template.items.map((item) => ({
      item: item.item,
      checklistTemplate: template._id,
      category: item.category || departmentId,
      isRequired: item.isRequired,
      notes: item.instructions,
    }))
  );

  // Create documents from document types
  const documents = documentTypes.map((docType) => ({
    name: docType.name,
    documentTemplate: docType._id,
    documentType: docType._id,
    status: docType.isRequired ? "Required" : "Missing",
    notes: docType.instructions,
  }));

  // Create process steps based on type
  const processSteps = [];
  if (type === "Onboarding") {
    processSteps.push(
      {
        stepName: "Orientation Session",
        stepType: "Orientation",
        scheduled: false,
        isRequired: true,
      },
      {
        stepName: "Equipment Assignment",
        stepType: "Equipment",
        scheduled: false,
        isRequired: true,
      },
      {
        stepName: "Training Program",
        stepType: "Training",
        scheduled: false,
        isRequired: true,
      }
    );
  } else if (type === "Offboarding") {
    processSteps.push(
      {
        stepName: "Exit Interview",
        stepType: "Interview",
        scheduled: false,
        isRequired: true,
      },
      {
        stepName: "Equipment Return",
        stepType: "Equipment",
        scheduled: false,
        isRequired: true,
      },
      {
        stepName: "Access Revocation",
        stepType: "Custom",
        scheduled: false,
        isRequired: true,
      }
    );
  }

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
    checklist,
    documents,
    processSteps,
  });

  return lifecycle.save();
};

// Pre-save middleware to update status based on progress
employeeLifecycleSchema.pre("save", function (next) {
  if (this.checklist && this.checklist.length > 0) {
    const completedCount = this.checklist.filter(
      (item) => item.isCompleted
    ).length;
    const totalCount = this.checklist.length;

    if (completedCount === totalCount && this.status !== "Completed") {
      this.status = "Completed";
      this.actualCompletionDate = new Date();
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
