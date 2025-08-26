import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Document Utility Functions
 * Handles document operations and PDF generation
 */

/**
 * Generate PDF from document data with ELRA branding
 * @param {Object} document - Document data
 * @returns {jsPDF} PDF document
 */
export const generateDocumentPDF = (document) => {
  const doc = new jsPDF();

  // ELRA Brand Colors (Green theme)
  const elraPrimary = [13, 100, 73];
  const elraSecondary = [245, 245, 245];

  // Add ELRA header with proper branding
  doc.setFillColor(...elraPrimary);
  doc.rect(0, 0, 220, 35, "F");

  // ELRA Logo/Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, "bold");
  doc.text("ELRA", 20, 18);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Equipment Leasing Registration Authority", 20, 28);

  // Reset text color for content
  doc.setTextColor(0, 0, 0);

  // Add document title with proper wrapping
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");

  // Split title into multiple lines if too long
  const titleLines = doc.splitTextToSize(document.title, 170);
  let currentY = 50;

  titleLines.forEach((line) => {
    doc.text(line, 20, currentY);
    currentY += 8;
  });

  // Add document info table with better formatting
  const docInfo = [
    [
      "Document Type",
      document.documentType?.replace("_", " ").toUpperCase() || "N/A",
    ],
    ["Category", document.category?.toUpperCase() || "N/A"],
    ["Status", document.status?.replace("_", " ").toUpperCase() || "N/A"],
    ["Created By", document.createdBy?.name || "System"],
    ["Department", document.department?.name || "N/A"],
    ["Created Date", new Date(document.createdAt).toLocaleDateString()],
    ["File Size", formatFileSize(document.fileSize)],
  ];

  if (document.project) {
    docInfo.push(["Project Code", document.project.code || "N/A"]);
    docInfo.push(["Project Name", document.project.name || "N/A"]);
    docInfo.push([
      "Project Budget",
      `NGN ${document.project.budget?.toLocaleString() || "0"}`,
    ]);
  }

  autoTable(doc, {
    head: [["Property", "Value"]],
    body: docInfo,
    startY: currentY + 10,
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: elraPrimary,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 11,
    },
    alternateRowStyles: {
      fillColor: elraSecondary,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 120 },
    },
    margin: { left: 20, right: 20 },
  });

  // Add content if it's a template document
  if (document.metadata?.generatedContent) {
    const contentY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Document Content:", 20, contentY);

    // Split content into lines and add to PDF with proper wrapping
    const lines = document.metadata.generatedContent.split("\n");
    let currentContentY = contentY + 10;

    lines.forEach((line) => {
      if (currentContentY > 280) {
        doc.addPage();
        currentContentY = 20;
      }

      if (line.trim().startsWith("#")) {
        // Headers
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        const headerText = line.replace(/^#+\s*/, "");
        const headerLines = doc.splitTextToSize(headerText, 170);
        headerLines.forEach((headerLine) => {
          doc.text(headerLine, 20, currentContentY);
          currentContentY += 6;
        });
        currentContentY += 2;
      } else if (line.trim().startsWith("-")) {
        // List items
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        const listText = line.trim();
        const listLines = doc.splitTextToSize(listText, 160);
        listLines.forEach((listLine) => {
          doc.text(listLine, 25, currentContentY);
          currentContentY += 5;
        });
      } else if (line.trim()) {
        // Regular text
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        const textLines = doc.splitTextToSize(line.trim(), 170);
        textLines.forEach((textLine) => {
          doc.text(textLine, 20, currentContentY);
          currentContentY += 5;
        });
      } else {
        // Empty lines
        currentContentY += 3;
      }
    });
  }

  return doc;
};

/**
 * Download document as PDF
 * @param {Object} document - Document data
 * @param {string} fileName - Optional custom filename
 */
export const downloadDocumentPDF = (document, fileName = null) => {
  try {
    const doc = generateDocumentPDF(document);
    const defaultFileName = `${document.title.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}.pdf`;
    doc.save(fileName || defaultFileName);
    return { success: true, message: "PDF download started!" };
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF");
  }
};

/**
 * View document in new tab
 * @param {Object} document - Document data
 */
export const viewDocument = (document) => {
  try {
    if (document.fileUrl) {
      // For uploaded documents, open the file URL
      window.open(document.fileUrl, "_blank");
      return { success: true, message: "Opening document in new tab..." };
    } else if (document.metadata?.generatedContent) {
      // For template documents, generate and open PDF
      const doc = generateDocumentPDF(document);
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
      return { success: true, message: "Opening document in new tab..." };
    } else {
      throw new Error("Document not available for viewing");
    }
  } catch (error) {
    console.error("Error viewing document:", error);
    throw error;
  }
};

/**
 * Download document file
 * @param {Object} document - Document data
 */
export const downloadDocument = (document) => {
  try {
    if (document.fileUrl) {
      // For uploaded documents, download the actual file
      const link = document.createElement("a");
      link.href = document.fileUrl;
      link.download = document.originalFileName || document.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, message: "Document download started!" };
    } else if (document.metadata?.generatedContent) {
      // For template documents, generate and download PDF
      return downloadDocumentPDF(document);
    } else {
      throw new Error("Document not available for download");
    }
  } catch (error) {
    console.error("Error downloading document:", error);
    throw error;
  }
};

/**
 * Format file size
 * @param {number} size - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (size) => {
  if (!size) return "Unknown";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let fileSize = size;
  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024;
    index++;
  }
  return `${fileSize.toFixed(1)} ${units[index]}`;
};

/**
 * Get document status color
 * @param {string} status - Document status
 * @returns {string} CSS color classes
 */
export const getDocumentStatusColor = (status) => {
  switch (status) {
    case "draft":
      return "bg-yellow-100 text-yellow-800";
    case "pending_review":
      return "bg-blue-100 text-blue-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Get document category color
 * @param {string} category - Document category
 * @returns {string} CSS color classes
 */
export const getDocumentCategoryColor = (category) => {
  switch (category) {
    case "financial":
      return "bg-green-100 text-green-800";
    case "technical":
      return "bg-blue-100 text-blue-800";
    case "project":
      return "bg-purple-100 text-purple-800";
    case "legal":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Determine document content type
 * @param {Object} document - Document data
 * @returns {Object} Content type and content
 */
export const getDocumentContentType = (document) => {
  // For template documents with generated content, always treat as template
  if (document.metadata?.generatedContent) {
    return {
      type: "template",
      content: document.metadata.generatedContent,
    };
  }
  // For documents with PDF mime type or PDF file extension
  else if (
    document.mimeType?.includes("pdf") ||
    document.fileName?.endsWith(".pdf")
  ) {
    return {
      type: "pdf",
      content: document.fileUrl || "#",
    };
  }
  // For image documents
  else if (document.mimeType?.includes("image")) {
    return {
      type: "image",
      content: document.fileUrl || "#",
    };
  }
  // For text or document files
  else if (
    document.mimeType?.includes("text") ||
    document.mimeType?.includes("document")
  ) {
    return {
      type: "text",
      content: document.fileUrl || "#",
    };
  }
  // Default to template if no file URL (auto-generated documents)
  else if (!document.fileUrl) {
    return {
      type: "template",
      content: "Document content not available",
    };
  }
  // Unknown type
  else {
    return {
      type: "unknown",
      content: "Document preview not available",
    };
  }
};

/**
 * Validate document access permissions
 * @param {Object} document - Document data
 * @param {Object} user - Current user data
 * @returns {Object} Access permissions
 */
export const validateDocumentAccess = (document, user) => {
  if (!document || !user) {
    return {
      canView: false,
      canDownload: false,
      canEdit: false,
      canDelete: false,
    };
  }

  const isOwner =
    document.createdBy?.id === user.id || document.createdBy === user.id;
  const isSuperAdmin = user.role?.includes("SUPER_ADMIN");
  const isHOD = user.role?.includes("HOD");
  const isProjectMember =
    document.project &&
    document.project.teamMembers?.some((member) => member.user?.id === user.id);

  return {
    canView: isOwner || isSuperAdmin || isHOD || isProjectMember,
    canDownload: isOwner || isSuperAdmin || isHOD || isProjectMember,
    canEdit: isOwner || isSuperAdmin || isHOD,
    canDelete: isOwner || isSuperAdmin,
  };
};

/**
 * Get document summary statistics
 * @param {Array} documents - Array of documents
 * @returns {Object} Summary statistics
 */
export const getDocumentSummary = (documents) => {
  if (!documents || documents.length === 0) {
    return {
      total: 0,
      templates: 0,
      uploaded: 0,
      draft: 0,
      pending: 0,
      approved: 0,
      totalSize: 0,
    };
  }

  const total = documents.length;
  const templates = documents.filter(
    (d) => d.metadata?.generatedContent
  ).length;
  const uploaded = documents.filter((d) => d.fileUrl).length;
  const draft = documents.filter((d) => d.status === "draft").length;
  const pending = documents.filter((d) => d.status === "pending_review").length;
  const approved = documents.filter((d) => d.status === "approved").length;
  const totalSize = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);

  return {
    total,
    templates,
    uploaded,
    draft,
    pending,
    approved,
    totalSize,
  };
};

export default {
  generateDocumentPDF,
  downloadDocumentPDF,
  viewDocument,
  downloadDocument,
  formatFileSize,
  getDocumentStatusColor,
  getDocumentCategoryColor,
  getDocumentContentType,
  validateDocumentAccess,
  getDocumentSummary,
};
