import {
  getPlanLimits,
  isFeatureAvailable,
  isLimitExceeded,
} from "../utils/planLimits.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import ApprovalLevel from "../models/ApprovalLevel.js";
import WorkflowTemplate from "../models/WorkflowTemplate.js";

// Middleware to check if user can perform action based on plan limits
const checkPlanLimits = (action) => {
  return async (req, res, next) => {
    try {
      const companyId = req.user?.company || req.body.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "Company ID required" });
      }

      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const planName = company.subscription?.plan || "starter";
      const planLimits = getPlanLimits(planName);

      switch (action) {
        case "createUser":
          const userCount = await User.countDocuments({ company: companyId });
          if (isLimitExceeded(planName, "maxUsers", userCount)) {
            return res.status(403).json({
              message: `User limit exceeded. Your ${planName} plan allows maximum ${planLimits.maxUsers} users.`,
              limit: planLimits.maxUsers,
              current: userCount,
              upgradeRequired: true,
            });
          }
          break;

        case "createDepartment":
          const deptCount = await Department.countDocuments({
            company: companyId,
          });
          if (isLimitExceeded(planName, "maxDepartments", deptCount)) {
            return res.status(403).json({
              message: `Department limit exceeded. Your ${planName} plan allows maximum ${planLimits.maxDepartments} departments.`,
              limit: planLimits.maxDepartments,
              current: deptCount,
              upgradeRequired: true,
            });
          }
          break;

        case "createApprovalLevel":
          const approvalCount = await ApprovalLevel.countDocuments({
            company: companyId,
          });
          if (isLimitExceeded(planName, "maxApprovalLevels", approvalCount)) {
            return res.status(403).json({
              message: `Approval level limit exceeded. Your ${planName} plan allows maximum ${planLimits.maxApprovalLevels} approval levels.`,
              limit: planLimits.maxApprovalLevels,
              current: approvalCount,
              upgradeRequired: true,
            });
          }
          break;

        case "createWorkflow":
          const workflowCount = await WorkflowTemplate.countDocuments({
            company: companyId,
          });
          if (isLimitExceeded(planName, "maxWorkflows", workflowCount)) {
            return res.status(403).json({
              message: `Workflow limit exceeded. Your ${planName} plan allows maximum ${planLimits.maxWorkflows} workflows.`,
              limit: planLimits.maxWorkflows,
              current: workflowCount,
              upgradeRequired: true,
            });
          }
          break;

        case "useAnalytics":
          if (!isFeatureAvailable(planName, "analytics")) {
            return res.status(403).json({
              message: "Analytics feature not available in your current plan.",
              upgradeRequired: true,
              availablePlans: ["professional", "business", "enterprise"],
            });
          }
          break;

        case "useAPI":
          if (!isFeatureAvailable(planName, "apiAccess")) {
            return res.status(403).json({
              message: "API access not available in your current plan.",
              upgradeRequired: true,
              availablePlans: ["business", "enterprise"],
            });
          }
          break;

        case "uploadDocument":
          const fileExtension = req.file?.originalname
            ?.split(".")
            .pop()
            ?.toLowerCase();
          const allowedTypes = planLimits.documentTypes;

          if (
            allowedTypes[0] !== "*" &&
            !allowedTypes.includes(fileExtension)
          ) {
            return res.status(403).json({
              message: `File type .${fileExtension} not allowed in your current plan.`,
              allowedTypes: allowedTypes,
              upgradeRequired: true,
            });
          }
          break;

        default:
          break;
      }

      // Add plan info to request for use in controllers
      req.planLimits = planLimits;
      req.planName = planName;
      next();
    } catch (error) {
      console.error("Plan limits middleware error:", error);
      res.status(500).json({ message: "Error checking plan limits" });
    }
  };
};

// Middleware to check storage limits
const checkStorageLimit = async (req, res, next) => {
  try {
    const companyId = req.user?.company || req.body.companyId;
    if (!companyId) {
      return res.status(400).json({ message: "Company ID required" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const planName = company.subscription?.plan || "starter";
    const planLimits = getPlanLimits(planName);

    // Calculate current storage usage (you'll need to implement this based on your document storage)
    const currentStorage = 0; // TODO: Calculate from documents
    const fileSize = req.file?.size || 0;
    const fileSizeGB = fileSize / (1024 * 1024 * 1024);

    if (isLimitExceeded(planName, "maxStorage", currentStorage + fileSizeGB)) {
      return res.status(403).json({
        message: `Storage limit exceeded. Your ${planName} plan allows maximum ${planLimits.maxStorage}GB storage.`,
        limit: planLimits.maxStorage,
        current: currentStorage,
        fileSize: fileSizeGB,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    console.error("Storage limit middleware error:", error);
    res.status(500).json({ message: "Error checking storage limits" });
  }
};

export { checkPlanLimits, checkStorageLimit };
