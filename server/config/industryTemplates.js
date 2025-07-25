// Industry Templates - Define default configurations for each industry type

export const industryTemplates = {
  court_system: {
    name: "Court System",
    description:
      "Document management and approval workflows for judicial systems",
    defaultConfig: {
      maxUsers: 200,
      features: [
        "document_management",
        "approval_workflows",
        "audit_trails",
        "compliance_reporting",
        "user_management",
        "role_based_access",
        "notifications",
      ],
    },
    approvalLevels: [
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
        documentTypes: [
          "case_filing",
          "legal_document",
          "settlement",
          "evidence",
        ],
      },
    ],
    workflowTemplates: [
      {
        name: "Criminal Case Filing",
        description: "Standard workflow for criminal case filings",
        documentType: "case_filing",
        steps: [
          { order: 1, approvalLevel: "Court Clerk", isRequired: true },
          { order: 2, approvalLevel: "Senior Clerk", isRequired: true },
          { order: 3, approvalLevel: "Magistrate Judge", isRequired: true },
          { order: 4, approvalLevel: "District Judge", isRequired: true },
        ],
      },
      {
        name: "Civil Settlement",
        description: "Workflow for civil case settlements",
        documentType: "settlement",
        steps: [
          { order: 1, approvalLevel: "Court Clerk", isRequired: true },
          { order: 2, approvalLevel: "Magistrate Judge", isRequired: true },
          { order: 3, approvalLevel: "District Judge", isRequired: true },
        ],
      },
    ],
    documentTypes: [
      "case_filing",
      "legal_document",
      "administrative",
      "evidence",
      "settlement",
    ],
  },

  banking_system: {
    name: "Banking System",
    description:
      "Document management and approval workflows for financial institutions",
    defaultConfig: {
      maxUsers: 500,
      features: [
        "document_management",
        "approval_workflows",
        "audit_trails",
        "compliance_reporting",
        "user_management",
        "role_based_access",
        "notifications",
        "analytics",
      ],
    },
    approvalLevels: [
      {
        name: "Teller",
        level: 10,
        description: "Customer transaction processing",
        permissions: {
          canApprove: false,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: false,
          canDelete: false,
        },
        documentTypes: ["transaction", "customer_document", "compliance"],
      },
      {
        name: "Senior Teller",
        level: 20,
        description: "Complex transaction approval",
        permissions: {
          canApprove: false,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: ["transaction", "customer_document", "compliance"],
      },
      {
        name: "Branch Manager",
        level: 30,
        description: "Large transaction approval",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: ["transaction", "loan_application", "compliance"],
      },
      {
        name: "Regional Manager",
        level: 50,
        description: "Multi-branch oversight",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: [
          "transaction",
          "loan_application",
          "compliance",
          "policy",
        ],
      },
    ],
    workflowTemplates: [
      {
        name: "Loan Application",
        description: "Standard workflow for loan applications",
        documentType: "loan_application",
        steps: [
          { order: 1, approvalLevel: "Teller", isRequired: true },
          { order: 2, approvalLevel: "Senior Teller", isRequired: true },
          { order: 3, approvalLevel: "Branch Manager", isRequired: true },
          { order: 4, approvalLevel: "Regional Manager", isRequired: false },
        ],
      },
    ],
    documentTypes: [
      "transaction",
      "customer_document",
      "loan_application",
      "compliance",
      "policy",
    ],
  },

  healthcare_system: {
    name: "Healthcare System",
    description:
      "Document management and approval workflows for healthcare facilities",
    defaultConfig: {
      maxUsers: 300,
      features: [
        "document_management",
        "approval_workflows",
        "audit_trails",
        "compliance_reporting",
        "user_management",
        "role_based_access",
        "notifications",
        "mobile_access",
      ],
    },
    approvalLevels: [
      {
        name: "Nurse",
        level: 10,
        description: "Patient care documentation",
        permissions: {
          canApprove: false,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: ["patient_record", "medical_report", "prescription"],
      },
      {
        name: "Senior Nurse",
        level: 20,
        description: "Patient care oversight",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: ["patient_record", "medical_report", "prescription"],
      },
      {
        name: "Doctor",
        level: 50,
        description: "Medical decision making",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: [
          "patient_record",
          "medical_report",
          "prescription",
          "treatment_plan",
        ],
      },
      {
        name: "Chief of Medicine",
        level: 70,
        description: "Department oversight",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: true,
        },
        documentTypes: [
          "patient_record",
          "medical_report",
          "prescription",
          "treatment_plan",
          "policy",
        ],
      },
    ],
    workflowTemplates: [
      {
        name: "Treatment Plan Approval",
        description: "Workflow for treatment plan approval",
        documentType: "treatment_plan",
        steps: [
          { order: 1, approvalLevel: "Nurse", isRequired: true },
          { order: 2, approvalLevel: "Senior Nurse", isRequired: true },
          { order: 3, approvalLevel: "Doctor", isRequired: true },
          { order: 4, approvalLevel: "Chief of Medicine", isRequired: false },
        ],
      },
    ],
    documentTypes: [
      "patient_record",
      "medical_report",
      "prescription",
      "treatment_plan",
      "policy",
    ],
  },

  manufacturing_system: {
    name: "Manufacturing System",
    description:
      "Document management and approval workflows for manufacturing facilities",
    defaultConfig: {
      maxUsers: 400,
      features: [
        "document_management",
        "approval_workflows",
        "audit_trails",
        "compliance_reporting",
        "user_management",
        "role_based_access",
        "notifications",
        "analytics",
      ],
    },
    approvalLevels: [
      {
        name: "Production Worker",
        level: 10,
        description: "Production documentation",
        permissions: {
          canApprove: false,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: ["production_report", "quality_check", "safety_report"],
      },
      {
        name: "Supervisor",
        level: 20,
        description: "Production oversight",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: ["production_report", "quality_check", "safety_report"],
      },
      {
        name: "Manager",
        level: 30,
        description: "Department management",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: [
          "production_report",
          "quality_check",
          "safety_report",
          "budget",
        ],
      },
      {
        name: "Plant Director",
        level: 50,
        description: "Plant-wide decisions",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: true,
        },
        documentTypes: [
          "production_report",
          "quality_check",
          "safety_report",
          "budget",
          "policy",
        ],
      },
    ],
    workflowTemplates: [
      {
        name: "Quality Control",
        description: "Workflow for quality control approval",
        documentType: "quality_check",
        steps: [
          { order: 1, approvalLevel: "Production Worker", isRequired: true },
          { order: 2, approvalLevel: "Supervisor", isRequired: true },
          { order: 3, approvalLevel: "Manager", isRequired: true },
          { order: 4, approvalLevel: "Plant Director", isRequired: false },
        ],
      },
    ],
    documentTypes: [
      "production_report",
      "quality_check",
      "safety_report",
      "budget",
      "policy",
    ],
  },
};

// Helper function to get template by industry type
export const getIndustryTemplate = (industryType) => {
  return industryTemplates[industryType] || null;
};

// Helper function to get all available industry types
export const getAvailableIndustries = () => {
  return Object.keys(industryTemplates).map((key) => ({
    value: key,
    label: industryTemplates[key].name,
    description: industryTemplates[key].description,
  }));
};
