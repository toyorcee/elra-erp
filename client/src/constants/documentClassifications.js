// client/src/constants/documentClassifications.js

export const documentClassifications = {
  General: ["Other", "Miscellaneous", "Notes", "Drafts"],

  Policy: [
    "HR Policy",
    "IT Policy",
    "Finance Policy",
    "Security Policy",
    "Environmental Policy",
    "Quality Policy",
    "Other",
  ],

  Report: [
    "Financial Report",
    "Annual Report",
    "Incident Report",
    "Monthly Report",
    "Quarterly Report",
    "Performance Report",
    "Audit Report",
    "Research Report",
    "Other",
  ],

  Invoice: [
    "Sales Invoice",
    "Purchase Invoice",
    "Service Invoice",
    "Tax Invoice",
    "Credit Note",
    "Debit Note",
    "Other",
  ],

  Contract: [
    "Employment Contract",
    "Vendor Contract",
    "Client Contract",
    "Service Agreement",
    "Lease Agreement",
    "Partnership Agreement",
    "NDA",
    "Other",
  ],

  Legal: [
    "Court Filing",
    "Legal Opinion",
    "Compliance Document",
    "Regulatory Filing",
    "License",
    "Permit",
    "Certificate",
    "Other",
  ],

  Financial: [
    "Bank Statement",
    "Tax Return",
    "Budget Document",
    "Expense Report",
    "Receipt",
    "Payment Voucher",
    "Financial Statement",
    "Other",
  ],

  HR: [
    "Employee Record",
    "Performance Review",
    "Training Certificate",
    "Job Description",
    "Resume",
    "Application Form",
    "Other",
  ],

  Operations: [
    "SOP Document",
    "Process Manual",
    "Work Instruction",
    "Quality Control",
    "Maintenance Record",
    "Inventory Report",
    "Other",
  ],

  Marketing: [
    "Marketing Plan",
    "Campaign Brief",
    "Brand Guidelines",
    "Press Release",
    "Advertisement",
    "Market Research",
    "Other",
  ],

  Technical: [
    "Technical Specification",
    "Design Document",
    "User Manual",
    "API Documentation",
    "System Architecture",
    "Code Documentation",
    "Other",
  ],

  Other: ["Other", "Uncategorized"],
};

// Document sections for better organization
export const documentSections = {
  Header: ["Title", "Date", "Reference Number", "Author", "Department"],
  Body: ["Content", "Main Text", "Details", "Description"],
  Footer: ["Signature", "Approval", "Contact Information", "Notes"],
  Metadata: ["Tags", "Category", "Priority", "Status", "Version"],
  Attachments: ["Supporting Documents", "Images", "References"],
};

// Priority levels
export const priorityLevels = [
  { value: "Low", color: "green", description: "Not urgent" },
  { value: "Medium", color: "yellow", description: "Normal priority" },
  { value: "High", color: "orange", description: "Urgent" },
  {
    value: "Critical",
    color: "red",
    description: "Immediate attention required",
  },
];

// Status options
export const documentStatuses = [
  { value: "DRAFT", color: "gray", description: "Work in progress" },
  {
    value: "PENDING_APPROVAL",
    color: "yellow",
    description: "Awaiting approval",
  },
  { value: "APPROVED", color: "green", description: "Approved and active" },
  { value: "REJECTED", color: "red", description: "Rejected" },
  { value: "ARCHIVED", color: "blue", description: "Archived" },
  { value: "EXPIRED", color: "purple", description: "No longer valid" },
];

export const categories = Object.keys(documentClassifications);
export const documentTypes = [
  ...new Set(Object.values(documentClassifications).flat()),
];
