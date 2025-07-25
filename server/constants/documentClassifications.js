// server/constants/documentClassifications.js

const documentClassifications = {
  General: ["Other"],
  Policy: ["HR Policy", "IT Policy", "Finance Policy", "Other"],
  Report: ["Financial Report", "Annual Report", "Incident Report", "Other"],
  Invoice: ["Sales Invoice", "Purchase Invoice", "Other"],
  Contract: ["Employment Contract", "Vendor Contract", "Other"],
  Legal: ["Court Filing", "Legal Opinion", "Other"],
  Other: ["Other"],
};

const categories = Object.keys(documentClassifications);
const documentTypes = [
  ...new Set(Object.values(documentClassifications).flat()),
];

export default documentClassifications;
export { categories, documentTypes };
