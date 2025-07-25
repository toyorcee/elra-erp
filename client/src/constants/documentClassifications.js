// client/src/constants/documentClassifications.js

export const documentClassifications = {
  General: ["Other"],
  Policy: ["HR Policy", "IT Policy", "Finance Policy", "Other"],
  Report: ["Financial Report", "Annual Report", "Incident Report", "Other"],
  Invoice: ["Sales Invoice", "Purchase Invoice", "Other"],
  Contract: ["Employment Contract", "Vendor Contract", "Other"],
  Legal: ["Court Filing", "Legal Opinion", "Other"],
  Other: ["Other"],
};

export const categories = Object.keys(documentClassifications);
export const documentTypes = [
  ...new Set(Object.values(documentClassifications).flat()),
];
