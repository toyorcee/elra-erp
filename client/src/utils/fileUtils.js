import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

export async function downloadAsPDF(documents) {
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(28);
  doc.setTextColor(34, 82, 160);
  doc.text("EDMS", 105, y, { align: "center" });
  y += 12;
  doc.setFontSize(16);
  doc.setTextColor(34, 82, 160);
  doc.text("Document Export", 105, y, { align: "center" });
  y += 10;
  documents.forEach((document, idx) => {
    if (idx > 0) {
      doc.addPage();
      y = 20;
      doc.setFontSize(28);
      doc.setTextColor(34, 82, 160);
      doc.text("EDMS", 105, y, { align: "center" });
      y += 12;
      doc.setFontSize(16);
      doc.setTextColor(34, 82, 160);
      doc.text("Document Export", 105, y, { align: "center" });
      y += 10;
    }
    doc.setFontSize(14);
    doc.setTextColor(34, 82, 160);
    doc.text(document.title || "Document", 14, y + 10);
    // Table of details
    const fields = [
      ["Description", document.description || ""],
      ["Category", document.category || ""],
      ["Type", document.documentType || ""],
      ["Priority", document.priority || ""],
      ["Status", document.status || ""],
      ["Tags", (document.tags || []).join(", ")],
      ["Uploaded By", document.uploadedBy?.email || ""],
      [
        "Created At",
        document.createdAt ? new Date(document.createdAt).toLocaleString() : "",
      ],
      ["File Size", document.fileSize ? formatFileSize(document.fileSize) : ""],
      ["Original Format", document.mimeType || ""],
    ];
    autoTable(doc, {
      startY: y + 16,
      head: [["Field", "Value"]],
      body: fields,
      theme: "grid",
      headStyles: { fillColor: [34, 82, 160] },
      styles: { fontSize: 11 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 130 } },
    });
    let tableEndY = doc.lastAutoTable.finalY || y + 40;
    // Approval chain if exists
    if (document.approvalChain && document.approvalChain.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(34, 160, 82);
      doc.text("Approval Chain:", 14, tableEndY + 10);
      const approvalRows = document.approvalChain.map((appr) => [
        `Level ${appr.level}`,
        appr.status,
        appr.approver?.email || "",
        appr.updatedAt ? new Date(appr.updatedAt).toLocaleString() : "",
      ]);
      autoTable(doc, {
        startY: tableEndY + 14,
        head: [["Level", "Status", "Approver", "Time"]],
        body: approvalRows,
        theme: "striped",
        headStyles: { fillColor: [34, 160, 82] },
        styles: { fontSize: 10 },
      });
    }
  });
  doc.save(`EDMS_Documents_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadAsCSV(documents) {
  // Accepts an array of documents
  const flatDocs = documents.map((document) => ({
    Title: document.title,
    Description: document.description,
    Category: document.category,
    Type: document.documentType,
    Priority: document.priority,
    Status: document.status,
    Tags: (document.tags || []).join(", "),
    UploadedBy: document.uploadedBy?.email,
    CreatedAt: document.createdAt,
  }));
  const csv = Papa.unparse(flatDocs);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    "download",
    `EDMS_Documents_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Single document utilities for dynamic format conversion
export async function convertDocumentToPDF(document) {
  console.log("📄 convertDocumentToPDF called with document:", {
    id: document._id,
    title: document.title,
    type: document.documentType,
  });

  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(28);
  doc.setTextColor(34, 82, 160);
  doc.text("EDMS", 105, y, { align: "center" });
  y += 12;
  doc.setFontSize(16);
  doc.setTextColor(34, 82, 160);
  doc.text("Document", 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(34, 82, 160);
  doc.text(document.title || "Document", 14, y + 10);
  // Table of details
  const fields = [
    ["Description", document.description || ""],
    ["Category", document.category || ""],
    ["Type", document.documentType || ""],
    ["Priority", document.priority || ""],
    ["Status", document.status || ""],
    ["Tags", (document.tags || []).join(", ")],
    ["Uploaded By", document.uploadedBy?.email || ""],
    [
      "Created At",
      document.createdAt ? new Date(document.createdAt).toLocaleString() : "",
    ],
    ["File Size", document.fileSize ? formatFileSize(document.fileSize) : ""],
    ["Original Format", document.mimeType || ""],
  ];
  autoTable(doc, {
    startY: y + 16,
    head: [["Field", "Value"]],
    body: fields,
    theme: "grid",
    headStyles: { fillColor: [34, 82, 160] },
    styles: { fontSize: 11 },
    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 130 } },
  });
  let tableEndY = doc.lastAutoTable.finalY || y + 40;
  // Approval chain if exists
  if (document.approvalChain && document.approvalChain.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(34, 160, 82);
    doc.text("Approval Chain:", 14, tableEndY + 10);
    const approvalRows = document.approvalChain.map((appr) => [
      `Level ${appr.level}`,
      appr.status,
      appr.approver?.email || "",
      appr.updatedAt ? new Date(appr.updatedAt).toLocaleString() : "",
    ]);
    autoTable(doc, {
      startY: tableEndY + 14,
      head: [["Level", "Status", "Approver", "Time"]],
      body: approvalRows,
      theme: "striped",
      headStyles: { fillColor: [34, 160, 82] },
      styles: { fontSize: 10 },
    });
  }
  console.log("✅ PDF document created successfully");
  return doc;
}

export function convertDocumentToCSV(document) {
  console.log("📊 convertDocumentToCSV called with document:", {
    id: document._id,
    title: document.title,
    type: document.documentType,
  });

  // Convert single document to CSV format
  const documentData = {
    Title: document.title || "",
    Description: document.description || "",
    Category: document.category || "",
    Type: document.documentType || "",
    Priority: document.priority || "",
    Status: document.status || "",
    Tags: (document.tags || []).join(", "),
    UploadedBy: document.uploadedBy?.email || "",
    CreatedAt: document.createdAt
      ? new Date(document.createdAt).toLocaleString()
      : "",
    FileSize: document.fileSize ? formatFileSize(document.fileSize) : "",
    OriginalFormat: document.mimeType || "",
    Reference: document.reference || "",
    Version: document.version || "",
    IsConfidential: document.isConfidential ? "Yes" : "No",
  };

  // Add approval chain data
  if (document.approvalChain && document.approvalChain.length > 0) {
    document.approvalChain.forEach((appr, index) => {
      documentData[`ApprovalLevel${index + 1}`] = appr.status;
      documentData[`Approver${index + 1}`] = appr.approver?.email || "";
    });
  }

  const csv = Papa.unparse([documentData]);
  console.log("✅ CSV data generated successfully");
  return csv;
}

// Helper function for file size formatting
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Dynamic document viewer/downloader
export async function handleDocumentAction(docData, action) {
  console.log("🔧 handleDocumentAction called:", {
    action,
    documentId: docData._id,
    documentTitle: docData.title,
  });

  switch (action) {
    case "view-pdf":
      console.log("📄 Processing PDF generation...");
      const pdfDoc = await convertDocumentToPDF(docData);
      const pdfFileName = `${docData.title || "Document"}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      console.log("💾 Saving PDF as:", pdfFileName);
      pdfDoc.save(pdfFileName);
      console.log("✅ PDF saved successfully");
      break;

    case "view-csv":
      console.log("📊 Processing CSV generation...");
      const csvData = convertDocumentToCSV(docData);
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const csvFileName = `${docData.title || "Document"}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      link.setAttribute("download", csvFileName);
      console.log("💾 Downloading CSV as:", csvFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("✅ CSV downloaded successfully");
      break;

    case "view-original":
      console.log("👁️ Opening original file in new tab:", docData.fileUrl);
      // Open original file in new tab
      window.open(docData.fileUrl, "_blank");
      break;

    case "download-original":
      console.log("⬇️ Downloading original file:", docData.fileUrl);
      // Download original file
      const downloadLink = document.createElement("a");
      downloadLink.href = docData.fileUrl;
      downloadLink.download = docData.originalName || docData.filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      console.log("✅ Original file downloaded successfully");
      break;

    default:
      console.error("❌ Unknown action:", action);
      throw new Error(`Unknown action: ${action}`);
  }
}
