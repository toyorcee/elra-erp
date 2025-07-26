const planLimits = {
  starter: {
    maxUsers: 5,
    maxStorage: 10,
    maxDepartments: 3,
    maxApprovalLevels: 2,
    maxWorkflows: 3,
    features: {
      analytics: false,
      apiAccess: false,
      whiteLabel: false,
      customIntegrations: false,
      prioritySupport: false,
      advancedSecurity: false,
    },
    documentTypes: ["pdf", "doc", "docx", "xls", "xlsx"],
  },
  professional: {
    maxUsers: 50,
    maxStorage: 500, // GB
    maxDepartments: 10,
    maxApprovalLevels: 5,
    maxWorkflows: 10,
    features: {
      analytics: true,
      apiAccess: false,
      whiteLabel: false,
      customIntegrations: false,
      prioritySupport: false,
      advancedSecurity: true,
    },
    documentTypes: [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
    ],
  },
  business: {
    maxUsers: 200,
    maxStorage: 2000, // GB
    maxDepartments: -1, // Unlimited
    maxApprovalLevels: -1, // Unlimited
    maxWorkflows: -1, // Unlimited
    features: {
      analytics: true,
      apiAccess: true,
      whiteLabel: false,
      customIntegrations: true,
      prioritySupport: false,
      advancedSecurity: true,
    },
    documentTypes: [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
      "zip",
      "rar",
      "jpg",
      "png",
      "gif",
    ],
  },
  enterprise: {
    maxUsers: -1, // Unlimited
    maxStorage: -1, // Unlimited
    maxDepartments: -1, // Unlimited
    maxApprovalLevels: -1, // Unlimited
    maxWorkflows: -1, // Unlimited
    features: {
      analytics: true,
      apiAccess: true,
      whiteLabel: true,
      customIntegrations: true,
      prioritySupport: true,
      advancedSecurity: true,
    },
    documentTypes: ["*"], // All file types
  },
};

// Helper function to check if a feature is available for a plan
const isFeatureAvailable = (planName, feature) => {
  const plan = planLimits[planName];
  if (!plan) return false;
  return plan.features[feature] || false;
};

// Helper function to check if a limit is exceeded
const isLimitExceeded = (planName, limitType, currentValue) => {
  const plan = planLimits[planName];
  if (!plan) return true;

  const limit = plan[limitType];
  if (limit === -1) return false; // Unlimited
  return currentValue >= limit;
};

// Helper function to get plan limits
const getPlanLimits = (planName) => {
  return planLimits[planName] || planLimits.starter;
};

// Helper function to get available document types for a plan
const getAvailableDocumentTypes = (planName) => {
  const plan = planLimits[planName];
  if (!plan) return planLimits.starter.documentTypes;
  return plan.documentTypes;
};

export {
  planLimits,
  isFeatureAvailable,
  isLimitExceeded,
  getPlanLimits,
  getAvailableDocumentTypes,
};
