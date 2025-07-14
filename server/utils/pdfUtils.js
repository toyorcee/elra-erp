import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
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
