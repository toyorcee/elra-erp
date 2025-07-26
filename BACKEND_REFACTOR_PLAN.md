# Backend Refactor Plan - Dynamic Approval Levels

## 🏛️ **Court System Backend Architecture**

### **Current Problem:**

- Hardcoded approval levels (10, 30, 50, 70, 90)
- Inflexible role hierarchy
- Cannot adapt to different organizational structures
- Limited customization for different industries

### **Solution:**

- Dynamic approval level configuration
- Flexible workflow engine
- Configurable role hierarchies
- Industry-specific templates

## 📋 **New Database Schema**

### **1. ApprovalLevel Model**

```javascript
// server/models/ApprovalLevel.js
const approvalLevelSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  description: {
    type: String,
    required: true,
  },
  permissions: {
    canApprove: { type: Boolean, default: false },
    canReject: { type: Boolean, default: false },
    canRoute: { type: Boolean, default: false },
    canView: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
  },
  documentTypes: [
    {
      type: String,
      enum: [
        "case_filing",
        "legal_document",
        "administrative",
        "evidence",
        "settlement",
      ],
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
```

### **2. WorkflowTemplate Model**

```javascript
// server/models/WorkflowTemplate.js
const workflowTemplateSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  documentType: {
    type: String,
    required: true,
    enum: [
      "case_filing",
      "legal_document",
      "administrative",
      "evidence",
      "settlement",
    ],
  },
  steps: [
    {
      order: { type: Number, required: true },
      approvalLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApprovalLevel",
        required: true,
      },
      isRequired: { type: Boolean, default: true },
      canSkip: { type: Boolean, default: false },
      autoApprove: { type: Boolean, default: false },
      conditions: {
        amount: { type: Number },
        documentType: [String],
        department: [String],
        priority: { type: String, enum: ["low", "medium", "high", "critical"] },
      },
      actions: [
        {
          type: {
            type: String,
            enum: ["approve", "reject", "route", "notify", "escalate"],
          },
          target: { type: String },
          message: { type: String },
        },
      ],
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
```

### **3. DocumentWorkflow Model**

```javascript
// server/models/DocumentWorkflow.js
const documentWorkflowSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  workflowTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkflowTemplate",
    required: true,
  },
  currentStep: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  steps: [
    {
      stepNumber: { type: Number, required: true },
      approvalLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApprovalLevel",
        required: true,
      },
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "skipped"],
        default: "pending",
      },
      comments: { type: String },
      actionDate: { type: Date },
      actionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  history: [
    {
      action: { type: String, required: true },
      fromStep: { type: Number },
      toStep: { type: Number },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      performedAt: { type: Date, default: Date.now },
      comments: { type: String },
      metadata: { type: mongoose.Schema.Types.Mixed },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
```

## 🏛️ **Court System Implementation**

### **1. Court-Specific Approval Levels**

```javascript
// server/config/courtApprovalLevels.js
const courtApprovalLevels = [
  {
    name: "Court Clerk",
    level: 10,
    description: "Document intake and initial review",
    permissions: {
      canApprove: false,
      canReject: true,
      canRoute: true,
      canView: true,
      canEdit: false,
      canDelete: false,
    },
    documentTypes: ["case_filing", "legal_document", "administrative"],
  },
  {
    name: "Senior Clerk",
    level: 20,
    description: "Document completeness and procedural compliance",
    permissions: {
      canApprove: false,
      canReject: true,
      canRoute: true,
      canView: true,
      canEdit: true,
      canDelete: false,
    },
    documentTypes: ["case_filing", "legal_document", "administrative"],
  },
  {
    name: "Court Administrator",
    level: 30,
    description: "Administrative oversight and resource allocation",
    permissions: {
      canApprove: true,
      canReject: true,
      canRoute: true,
      canView: true,
      canEdit: true,
      canDelete: false,
    },
    documentTypes: ["case_filing", "legal_document", "administrative"],
  },
  {
    name: "Magistrate Judge",
    level: 50,
    description: "Preliminary hearings and discovery disputes",
    permissions: {
      canApprove: true,
      canReject: true,
      canRoute: true,
      canView: true,
      canEdit: true,
      canDelete: false,
    },
    documentTypes: ["case_filing", "legal_document", "settlement"],
  },
  {
    name: "District Judge",
    level: 70,
    description: "Case management and trial proceedings",
    permissions: {
      canApprove: true,
      canReject: true,
      canRoute: true,
      canView: true,
      canEdit: true,
      canDelete: false,
    },
    documentTypes: ["case_filing", "legal_document", "settlement", "evidence"],
  },
  {
    name: "Chief Judge",
    level: 90,
    description: "Court policy decisions and administrative orders",
    permissions: {
      canApprove: true,
      canReject: true,
      canRoute: true,
      canView: true,
      canEdit: true,
      canDelete: true,
    },
    documentTypes: [
      "case_filing",
      "legal_document",
      "administrative",
      "settlement",
      "evidence",
    ],
  },
];
```

### **2. Court Workflow Templates**

```javascript
// server/config/courtWorkflowTemplates.js
const courtWorkflowTemplates = [
  {
    name: "Criminal Case Filing",
    description: "Standard workflow for criminal case filings",
    documentType: "case_filing",
    steps: [
      {
        order: 1,
        approvalLevel: "Court Clerk",
        isRequired: true,
        canSkip: false,
        conditions: {
          documentType: ["criminal_complaint"],
          priority: "medium",
        },
      },
      {
        order: 2,
        approvalLevel: "Senior Clerk",
        isRequired: true,
        canSkip: false,
        conditions: {
          documentType: ["criminal_complaint"],
        },
      },
      {
        order: 3,
        approvalLevel: "Court Administrator",
        isRequired: true,
        canSkip: false,
      },
      {
        order: 4,
        approvalLevel: "Magistrate Judge",
        isRequired: true,
        canSkip: false,
        conditions: {
          priority: ["high", "critical"],
        },
      },
      {
        order: 5,
        approvalLevel: "District Judge",
        isRequired: true,
        canSkip: false,
      },
    ],
  },
  {
    name: "Civil Settlement",
    description: "Workflow for civil case settlements",
    documentType: "settlement",
    steps: [
      {
        order: 1,
        approvalLevel: "Court Clerk",
        isRequired: true,
        canSkip: false,
      },
      {
        order: 2,
        approvalLevel: "Magistrate Judge",
        isRequired: true,
        canSkip: false,
      },
      {
        order: 3,
        approvalLevel: "District Judge",
        isRequired: true,
        canSkip: false,
      },
    ],
  },
  {
    name: "Administrative Document",
    description: "Workflow for administrative documents",
    documentType: "administrative",
    steps: [
      {
        order: 1,
        approvalLevel: "Court Clerk",
        isRequired: true,
        canSkip: false,
      },
      {
        order: 2,
        approvalLevel: "Court Administrator",
        isRequired: true,
        canSkip: false,
      },
      {
        order: 3,
        approvalLevel: "Chief Judge",
        isRequired: false,
        canSkip: true,
        conditions: {
          amount: { $gt: 10000 },
        },
      },
    ],
  },
];
```

## 🔧 **Backend Controllers**

### **1. ApprovalLevel Controller**

```javascript
// server/controllers/approvalLevelController.js
import ApprovalLevel from "../models/ApprovalLevel.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createApprovalLevel = asyncHandler(async (req, res) => {
  const { name, level, description, permissions, documentTypes } = req.body;

  // Check if level already exists for this company
  const existingLevel = await ApprovalLevel.findOne({
    company: req.user.company,
    level: level,
  });

  if (existingLevel) {
    return res.status(400).json({
      message: `Approval level ${level} already exists`,
    });
  }

  const approvalLevel = await ApprovalLevel.create({
    company: req.user.company,
    name,
    level,
    description,
    permissions,
    documentTypes,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: approvalLevel,
  });
});

export const getApprovalLevels = asyncHandler(async (req, res) => {
  const approvalLevels = await ApprovalLevel.find({
    company: req.user.company,
    isActive: true,
  }).sort({ level: 1 });

  res.json({
    success: true,
    data: approvalLevels,
  });
});

export const updateApprovalLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const approvalLevel = await ApprovalLevel.findOneAndUpdate(
    { _id: id, company: req.user.company },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!approvalLevel) {
    return res.status(404).json({
      message: "Approval level not found",
    });
  }

  res.json({
    success: true,
    data: approvalLevel,
  });
});

export const deleteApprovalLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const approvalLevel = await ApprovalLevel.findOneAndUpdate(
    { _id: id, company: req.user.company },
    { isActive: false, updatedAt: Date.now() },
    { new: true }
  );

  if (!approvalLevel) {
    return res.status(404).json({
      message: "Approval level not found",
    });
  }

  res.json({
    success: true,
    message: "Approval level deactivated successfully",
  });
});
```

### **2. WorkflowTemplate Controller**

```javascript
// server/controllers/workflowTemplateController.js
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createWorkflowTemplate = asyncHandler(async (req, res) => {
  const { name, description, documentType, steps } = req.body;

  const workflowTemplate = await WorkflowTemplate.create({
    company: req.user.company,
    name,
    description,
    documentType,
    steps,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: workflowTemplate,
  });
});

export const getWorkflowTemplates = asyncHandler(async (req, res) => {
  const { documentType } = req.query;

  const filter = {
    company: req.user.company,
    isActive: true,
  };

  if (documentType) {
    filter.documentType = documentType;
  }

  const templates = await WorkflowTemplate.find(filter)
    .populate("steps.approvalLevel")
    .sort({ name: 1 });

  res.json({
    success: true,
    data: templates,
  });
});

export const setupCourtWorkflows = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  // Get approval levels for the company
  const approvalLevels = await ApprovalLevel.find({
    company: companyId,
    isActive: true,
  });

  // Create workflow templates
  const templates = [];

  for (const template of courtWorkflowTemplates) {
    const steps = template.steps.map((step) => {
      const approvalLevel = approvalLevels.find(
        (level) => level.name === step.approvalLevel
      );

      return {
        ...step,
        approvalLevel: approvalLevel._id,
      };
    });

    const workflowTemplate = await WorkflowTemplate.create({
      company: companyId,
      name: template.name,
      description: template.description,
      documentType: template.documentType,
      steps,
      createdBy: req.user._id,
    });

    templates.push(workflowTemplate);
  }

  res.status(201).json({
    success: true,
    message: "Court workflow templates created successfully",
    data: templates,
  });
});
```

### **3. Document Workflow Controller**

```javascript
// server/controllers/documentWorkflowController.js
import DocumentWorkflow from "../models/DocumentWorkflow.js";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const initiateWorkflow = asyncHandler(async (req, res) => {
  const { documentId, documentType } = req.body;

  // Find appropriate workflow template
  const template = await WorkflowTemplate.findOne({
    company: req.user.company,
    documentType,
    isActive: true,
  });

  if (!template) {
    return res.status(404).json({
      message: `No workflow template found for document type: ${documentType}`,
    });
  }

  // Create workflow steps
  const steps = template.steps.map((step) => ({
    stepNumber: step.order,
    approvalLevel: step.approvalLevel,
    status: "pending",
  }));

  // Create document workflow
  const workflow = await DocumentWorkflow.create({
    document: documentId,
    workflowTemplate: template._id,
    currentStep: 1,
    status: "pending",
    steps,
  });

  // Assign first step to appropriate user
  await assignStepToUser(workflow, 1);

  res.status(201).json({
    success: true,
    data: workflow,
  });
});

export const processWorkflowStep = asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const { action, comments, nextStep } = req.body;

  const workflow = await DocumentWorkflow.findById(workflowId)
    .populate("steps.approvalLevel")
    .populate("workflowTemplate");

  if (!workflow) {
    return res.status(404).json({
      message: "Workflow not found",
    });
  }

  const currentStep = workflow.steps.find(
    (step) => step.stepNumber === workflow.currentStep
  );

  if (!currentStep) {
    return res.status(400).json({
      message: "Invalid workflow step",
    });
  }

  // Update current step
  currentStep.status = action;
  currentStep.comments = comments;
  currentStep.actionDate = new Date();
  currentStep.actionBy = req.user._id;

  // Add to history
  workflow.history.push({
    action,
    fromStep: workflow.currentStep,
    toStep: nextStep || workflow.currentStep + 1,
    performedBy: req.user._id,
    comments,
    metadata: { action, nextStep },
  });

  // Update workflow status
  if (action === "approved") {
    if (workflow.currentStep === workflow.steps.length) {
      workflow.status = "approved";
    } else {
      workflow.currentStep = nextStep || workflow.currentStep + 1;
      await assignStepToUser(workflow, workflow.currentStep);
    }
  } else if (action === "rejected") {
    workflow.status = "rejected";
  }

  await workflow.save();

  res.json({
    success: true,
    data: workflow,
  });
});

const assignStepToUser = async (workflow, stepNumber) => {
  const step = workflow.steps.find((s) => s.stepNumber === stepNumber);
  if (!step) return;

  // Find users with the required approval level
  const users = await User.find({
    company: workflow.document.company,
    approvalLevel: step.approvalLevel,
    isActive: true,
  });

  // Assign to first available user (or implement more sophisticated assignment logic)
  if (users.length > 0) {
    step.assignedTo = users[0]._id;
    await workflow.save();
  }
};
```

## 🚀 **Implementation Steps**

### **Phase 1: Database Migration**

```javascript
// server/scripts/migrateToDynamicLevels.js
import mongoose from "mongoose";
import ApprovalLevel from "../models/ApprovalLevel.js";
import WorkflowTemplate from "../models/WorkflowTemplate.js";

const migrateToDynamicLevels = async () => {
  // Create approval levels for existing companies
  const companies = await Company.find();

  for (const company of companies) {
    // Create court-specific approval levels
    for (const level of courtApprovalLevels) {
      await ApprovalLevel.create({
        company: company._id,
        ...level,
        createdBy: company.createdBy,
      });
    }

    // Create workflow templates
    await setupCourtWorkflows(company._id);
  }

  console.log("Migration completed successfully");
};
```

### **Phase 2: API Routes**

```javascript
// server/routes/approvalLevels.js
import express from "express";
import { protect, checkRole } from "../middleware/auth.js";
import {
  createApprovalLevel,
  getApprovalLevels,
  updateApprovalLevel,
  deleteApprovalLevel,
} from "../controllers/approvalLevelController.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(checkRole({ minLevel: 100 }), createApprovalLevel)
  .get(getApprovalLevels);

router
  .route("/:id")
  .put(checkRole({ minLevel: 100 }), updateApprovalLevel)
  .delete(checkRole({ minLevel: 100 }), deleteApprovalLevel);

export default router;
```

### **Phase 3: Frontend Integration**

```javascript
// client/src/services/approvalLevels.js
import api from "./api";

export const getApprovalLevels = () => api.get("/approval-levels");
export const createApprovalLevel = (data) => api.post("/approval-levels", data);
export const updateApprovalLevel = (id, data) =>
  api.put(`/approval-levels/${id}`, data);
export const deleteApprovalLevel = (id) => api.delete(`/approval-levels/${id}`);

export const getWorkflowTemplates = (documentType) =>
  api.get("/workflow-templates", { params: { documentType } });

export const setupCourtWorkflows = (companyId) =>
  api.post(`/workflow-templates/setup-court/${companyId}`);
```

## 🎯 **Benefits of This Approach**

### **1. Flexibility**

- ✅ Configurable approval levels for any industry
- ✅ Customizable workflow templates
- ✅ Dynamic role assignments
- ✅ Conditional routing logic

### **2. Scalability**

- ✅ Easy to add new approval levels
- ✅ Simple to modify workflows
- ✅ Support for multiple document types
- ✅ Company-specific configurations

### **3. Maintainability**

- ✅ Clean separation of concerns
- ✅ Reusable components
- ✅ Easy to test and debug
- ✅ Clear audit trails

### **4. Business Value**

- ✅ Adapts to organizational changes
- ✅ Supports industry-specific requirements
- ✅ Reduces development time for new clients
- ✅ Improves user experience

This refactored backend system makes the EDMS platform truly flexible and adaptable to any industry, starting with the court system as our practical example!
