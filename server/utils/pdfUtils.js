import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

/**
 * Generate PDF from data with jsPDF
 * @param {Object} data - Data to include in PDF
 * @param {string} title - PDF title
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table data
 * @returns {Buffer}
 */
export const generatePDF = async (
  data,
  title = "Document",
  headers = [],
  rows = []
) => {
  try {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text(title, 20, 20);

    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);

    // Add table if headers and rows provided
    if (headers.length > 0 && rows.length > 0) {
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
        },
      });
    }

    // Add metadata
    doc.setProperties({
      title: title,
      subject: "EDMS Document",
      author: "EDMS System",
      creator: "EDMS PDF Generator",
    });

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF");
  }
};

/**
 * Generate PDF report with charts and data
 * @param {Object} reportData - Report data object
 * @param {string} reportType - Type of report
 * @returns {Buffer}
 */
/**
 * Generate vendor receipt PDF
 * @param {Object} vendorData - Vendor information
 * @param {Object} projectData - Project information
 * @returns {Buffer}
 */
export const generateVendorReceiptPDF = async (vendorData, projectData) => {
  try {
    // Debug logging for PDF generation
    console.log("🔍 [PDF DEBUG] Generating PDF with data:");
    console.log(
      "  - requiresBudgetAllocation:",
      projectData.requiresBudgetAllocation
    );
    console.log("  - Type:", typeof projectData.requiresBudgetAllocation);
    console.log("  - projectManager:", projectData.projectManager);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Helper function to add new page if needed
    const addPageIfNeeded = (requiredSpace) => {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 45;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;

      if (currentY + requiredSpace > pageHeight - margin) {
        doc.addPage();

        // Add watermark to new page
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(100);
        const pageWidth = doc.internal.pageSize.width;
        const newPageHeight = doc.internal.pageSize.height;
        doc.text("ELRA", pageWidth / 2, newPageHeight / 2, {
          align: "center",
          angle: 30,
          renderingMode: "fill",
        });
        doc.setGState(new doc.GState({ opacity: 1 }));

        return 20; // Reset Y position to top of new page
      }
      return currentY;
    };

    // Set watermark with reduced opacity and size (same as payslip)
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(100);

    // Calculate the center of the page
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Position watermark
    doc.text("ELRA", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 30,
      renderingMode: "fill",
    });

    // Reset opacity for rest of the content
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Header (same branding as payslip)
    const elraGreen = [13, 100, 73];
    doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("ELRA", 105, 25, { align: "center" });

    // Reset to black for other text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Vendor Registration Receipt", 105, 35, {
      align: "center",
    });

    // Add date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

    let yPosition = 55;

    // Vendor Information Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Vendor Information", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Company Name: ${vendorData.name}`, 20, yPosition);
    yPosition += 7;

    // Add email if available
    if (vendorData.email) {
      doc.text(`Email: ${vendorData.email}`, 20, yPosition);
      yPosition += 7;
    }

    // Add phone if available
    if (vendorData.phone) {
      doc.text(`Phone: ${vendorData.phone}`, 20, yPosition);
      yPosition += 7;
    }

    doc.text(
      `Services: ${vendorData.servicesOffered.join(", ")}`,
      20,
      yPosition
    );
    yPosition += 7;

    if (
      projectData.vendorCategory &&
      projectData.vendorCategory !== "Not specified"
    ) {
      const formattedVendorCategory = projectData.vendorCategory.replace(
        /_/g,
        " "
      );
      doc.text(`Category: ${formattedVendorCategory}`, 20, yPosition);
      yPosition += 7;
    }

    doc.text(`Status: Pending Approval`, 20, yPosition);
    yPosition += 7;
    doc.text(
      `Registration Date: ${new Date().toLocaleDateString()}`,
      20,
      yPosition
    );
    yPosition += 15;

    // Project Information Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Project Information", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Project Name: ${projectData.name}`, 20, yPosition);
    yPosition += 7;

    // Add project category if available
    if (projectData.category && projectData.category !== "Not specified") {
      const formattedCategory = projectData.category.replace(/_/g, " ");
      doc.text(`Category: ${formattedCategory}`, 20, yPosition);
      yPosition += 7;
    }

    // Add project manager if available
    if (
      projectData.projectManager &&
      projectData.projectManager !== "Not assigned"
    ) {
      doc.text(`Project Manager: ${projectData.projectManager}`, 20, yPosition);
      yPosition += 7;
    }

    // Add project priority if available
    if (projectData.priority && projectData.priority !== "medium") {
      const priorityText =
        projectData.priority.charAt(0).toUpperCase() +
        projectData.priority.slice(1);
      doc.text(`Priority: ${priorityText}`, 20, yPosition);
      yPosition += 7;
    }

    // Add project scope
    const projectScopeText =
      projectData.projectScope.charAt(0).toUpperCase() +
      projectData.projectScope.slice(1);
    doc.text(`Scope: ${projectScopeText}`, 20, yPosition);
    yPosition += 7;

    doc.text(
      `Budget: NGN ${projectData.budget.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      20,
      yPosition
    );
    yPosition += 7;
    doc.text(
      `Start Date: ${new Date(projectData.startDate).toLocaleDateString()}`,
      20,
      yPosition
    );
    yPosition += 7;
    doc.text(
      `End Date: ${new Date(projectData.endDate).toLocaleDateString()}`,
      20,
      yPosition
    );
    yPosition += 7;

    // Add budget allocation information only if requested
    if (
      projectData.requiresBudgetAllocation === "true" ||
      projectData.requiresBudgetAllocation === true
    ) {
      doc.text(`Budget Allocation: Requested`, 20, yPosition);
      yPosition += 7;
    }

    yPosition += 8;

    // Project Items Table
    if (projectData.projectItems && projectData.projectItems.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Project Items", 20, yPosition);
      yPosition += 10;

      const headers = [
        "Item",
        "Description",
        "Quantity",
        "Unit Price",
        "Total",
      ];
      const rows = projectData.projectItems.map((item) => [
        item.name || "N/A",
        item.description || "N/A",
        item.quantity || 0,
        `NGN ${(item.unitPrice || 0).toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        `NGN ${((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString(
          "en-NG",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`,
      ]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: yPosition,
        theme: "grid",
        headStyles: {
          fillColor: [13, 100, 73],
          fontSize: 10,
          fontStyle: "bold",
          textColor: [255, 255, 255],
          cellPadding: 5,
        },
        styles: {
          fontSize: 9,
          cellPadding: 5,
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: "auto", cellPadding: 5 }, // Item
          1: { cellWidth: "auto", cellPadding: 5 }, // Description
          2: { halign: "center", cellWidth: "auto", cellPadding: 5 }, // Quantity
          3: { halign: "right", cellWidth: "auto", cellPadding: 5 }, // Unit Price
          4: { halign: "right", cellWidth: "auto", cellPadding: 5 }, // Total
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
        tableWidth: "auto",
        pageBreak: "auto",
        showFoot: "lastPage",
        didParseCell: function (data) {
          if (data.column.index === 1) {
            const text = data.cell.text.join(" ");
            const words = text.split(" ");
            const maxWordsPerLine = 6;
            const lines = [];

            for (let i = 0; i < words.length; i += maxWordsPerLine) {
              lines.push(words.slice(i, i + maxWordsPerLine).join(" "));
            }

            data.cell.text = lines;
          }
        },
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Add project summary
      const totalProjectValue = projectData.projectItems.reduce(
        (total, item) => {
          return total + (item.quantity || 0) * (item.unitPrice || 0);
        },
        0
      );

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Project Summary", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Total Project Value: NGN ${totalProjectValue.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        20,
        yPosition
      );
      yPosition += 15;
    }

    // Approval Workflow Section
    yPosition += 10;

    // Check if we need a new page for the approval workflow
    const approvalWorkflowSpace = 50; // Estimate space needed
    yPosition = addPageIfNeeded(approvalWorkflowSpace);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Approval Workflow", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Add project scope information
    const scopeText =
      projectData.projectScope.charAt(0).toUpperCase() +
      projectData.projectScope.slice(1);
    doc.text(`Project Type: ${scopeText} Project`, 20, yPosition);
    yPosition += 6;

    // Determine approval workflow based on project scope and budget allocation
    let approvalSteps = [];
    let workflowDescription = "";

    if (projectData.projectScope === "external") {
      if (
        projectData.requiresBudgetAllocation === "true" ||
        projectData.requiresBudgetAllocation === true
      ) {
        approvalSteps = [
          "1. Head of Department (HOD) Approval",
          "2. Legal & Compliance Review",
          "3. Finance Department Approval",
          "4. Executive Management Approval",
        ];
        workflowDescription =
          "This external project requires new budget allocation and will go through a comprehensive 4-level approval process.";
      } else {
        approvalSteps = [
          "1. Head of Department (HOD) Approval",
          "2. Legal & Compliance Review",
          "3. Executive Management Approval",
        ];
        workflowDescription =
          "This external project will use existing budget and requires 3-level approval process.";
      }
    } else if (projectData.projectScope === "departmental") {
      if (
        projectData.requiresBudgetAllocation === "true" ||
        projectData.requiresBudgetAllocation === true
      ) {
        approvalSteps = [
          "1. Head of Department (HOD) Approval",
          "2. Finance Department Approval",
        ];
        workflowDescription =
          "This departmental project requires new budget allocation and will go through 2-level approval process.";
      } else {
        approvalSteps = ["1. Head of Department (HOD) Approval"];
        workflowDescription =
          "This departmental project will use existing department budget and requires HOD approval only.";
      }
    } else if (projectData.projectScope === "personal") {
      if (
        projectData.requiresBudgetAllocation === "true" ||
        projectData.requiresBudgetAllocation === true
      ) {
        approvalSteps = ["1. Finance Department Approval"];
        workflowDescription =
          "This personal project requires new budget allocation and will go through Finance approval.";
      } else {
        approvalSteps = ["1. Auto-Approval (No additional approvals required)"];
        workflowDescription =
          "This personal project will use existing personal budget and will be auto-approved.";
      }
    }

    // Add workflow description
    doc.text(workflowDescription, 20, yPosition);
    yPosition += 8;

    // Add approval steps with bullet points
    approvalSteps.forEach((step, index) => {
      doc.text(`• ${step}`, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Footer - Check if we need a new page
    const footerSpace = 20;
    yPosition = addPageIfNeeded(footerSpace);

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(
      "This is an official vendor registration receipt from ELRA.",
      20,
      yPosition
    );
    yPosition += 7;
    doc.text("Please keep this document for your records.", 20, yPosition);

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Add metadata
    doc.setProperties({
      title: "Vendor Registration Receipt",
      subject: "ELRA Vendor Registration",
      author: "ELRA System",
      creator: "ELRA PDF Generator",
    });

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error("Vendor receipt PDF generation error:", error);
    throw new Error("Failed to generate vendor receipt PDF");
  }
};

export const generateReportPDF = async (reportData, reportType = "general") => {
  try {
    const doc = new jsPDF();

    // Add header
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.text("EDMS Report", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Report Type: ${reportType}`, 20, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);

    let yPosition = 60;

    // Add summary statistics
    if (reportData.summary) {
      doc.setFontSize(16);
      doc.text("Summary", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPosition);
        yPosition += 7;
      });
      yPosition += 10;
    }

    // Add detailed data table
    if (reportData.data && reportData.data.length > 0) {
      doc.setFontSize(16);
      doc.text("Detailed Data", 20, yPosition);
      yPosition += 10;

      const headers = Object.keys(reportData.data[0]);
      const rows = reportData.data.map((item) => Object.values(item));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("Report PDF generation error:", error);
    throw new Error("Failed to generate report PDF");
  }
};

/**
 * Merge multiple PDFs into one
 * @param {Array} pdfBuffers - Array of PDF buffers
 * @returns {Buffer}
 */
export const mergePDFs = async (pdfBuffers) => {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  } catch (error) {
    console.error("PDF merge error:", error);
    throw new Error("Failed to merge PDFs");
  }
};

/**
 * Add watermark to PDF
 * @param {Buffer} pdfBuffer - Original PDF buffer
 * @param {string} watermarkText - Watermark text
 * @param {Object} options - Watermark options
 * @returns {Buffer}
 */
export const addWatermark = async (pdfBuffer, watermarkText, options = {}) => {
  try {
    const {
      opacity = 0.3,
      fontSize = 50,
      color = rgb(0.5, 0.5, 0.5),
      rotation = -45,
    } = options;

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();

      page.drawText(watermarkText, {
        x: width / 2 - 100,
        y: height / 2,
        size: fontSize,
        color: color,
        opacity: opacity,
        rotate: { angle: rotation, type: "degrees" },
      });
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error("Watermark error:", error);
    throw new Error("Failed to add watermark");
  }
};

/**
 * Extract text from PDF
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {string}
 */
export const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    // Note: pdf-lib doesn't support text extraction
    // You would need to use a different library like pdf-parse
    // This is a placeholder for the concept
    return "Text extraction not implemented with current library";
  } catch (error) {
    console.error("Text extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

/**
 * Create PDF from HTML content
 * @param {string} htmlContent - HTML content
 * @param {Object} options - PDF options
 * @returns {Buffer}
 */
export const createPDFFromHTML = async (htmlContent, options = {}) => {
  try {
    const doc = new jsPDF();

    // Add HTML content (simplified - you might want to use html2pdf or puppeteer for complex HTML)
    doc.setFontSize(12);
    doc.text("HTML Content PDF", 20, 20);

    // For complex HTML, consider using:
    // - html2pdf.js
    // - puppeteer with page.pdf()
    // - jsPDF with html2canvas

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("HTML to PDF error:", error);
    throw new Error("Failed to create PDF from HTML");
  }
};

/**
 * Add digital signature placeholder to PDF
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {Object} signatureData - Signature data
 * @returns {Buffer}
 */
export const addDigitalSignature = async (pdfBuffer, signatureData) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const { width, height } = lastPage.getSize();

    // Add signature field
    lastPage.drawText("Digital Signature:", {
      x: 20,
      y: height - 50,
      size: 12,
      color: rgb(0, 0, 0),
    });

    lastPage.drawText(`Signed by: ${signatureData.signerName}`, {
      x: 20,
      y: height - 65,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });

    lastPage.drawText(`Date: ${signatureData.signatureDate}`, {
      x: 20,
      y: height - 80,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error("Digital signature error:", error);
    throw new Error("Failed to add digital signature");
  }
};

/**
 * Validate PDF file
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {boolean}
 */
export const validatePDF = async (pdfBuffer) => {
  try {
    await PDFDocument.load(pdfBuffer);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get PDF metadata
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {Object}
 */
export const getPDFMetadata = async (pdfBuffer) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    return {
      pageCount: pages.length,
      pageSizes: pages.map((page) => page.getSize()),
      creationDate: new Date(),
      // Note: pdf-lib has limited metadata access
      // For full metadata, consider using pdf-parse
    };
  } catch (error) {
    console.error("PDF metadata error:", error);
    throw new Error("Failed to get PDF metadata");
  }
};
