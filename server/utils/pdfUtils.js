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
// Generate client project details PDF
export const generateClientProjectPDF = async (clientData, projectData) => {
  try {
    console.log("🔍 [CLIENT PDF DEBUG] Generating PDF with data:");
    console.log("  - Project Name:", projectData.name);
    console.log("  - Client Name:", clientData.clientName);
    console.log("  - Project Items:", projectData.projectItems?.length || 0);
    console.log("  - Budget Percentage:", projectData.budgetPercentage);
    console.log("  - Budget:", projectData.budget);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

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
    doc.text("Project Partnership Agreement", 105, 35, {
      align: "center",
    });

    // Add date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

    let yPosition = 55;

    // Project Information Section - Using table format like payslip
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Project Information", 20, yPosition);
    yPosition += 15;

    // Create project information table
    const projectInfoData = [
      ["Project Name", projectData.name],
      ["Project Code", projectData.code || "TBD"],
      ["Category", projectData.category || "Not specified"],
      [
        "Priority",
        projectData.priority ? projectData.priority.toUpperCase() : "Medium",
      ],
      ["Start Date", new Date(projectData.startDate).toLocaleDateString()],
      ["End Date", new Date(projectData.endDate).toLocaleDateString()],
      [
        "Total Budget",
        `₦${new Intl.NumberFormat().format(projectData.budget)}`,
      ],
    ];

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: projectInfoData,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
        fontSize: 12,
        fontStyle: "bold",
        textColor: [255, 255, 255],
        cellPadding: 6,
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
        lineWidth: 0.5,
        lineColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Client Information Section - Using table format
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Client Information", 20, yPosition);
    yPosition += 15;

    // Create client information table
    const clientInfoData = [
      ["Client Name", clientData.clientName],
      ["Company", clientData.clientCompany],
      ["Email", clientData.clientEmail],
    ];

    if (clientData.clientPhone) {
      clientInfoData.push(["Phone", clientData.clientPhone]);
    }
    if (clientData.clientAddress) {
      clientInfoData.push(["Address", clientData.clientAddress]);
    }

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: clientInfoData,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
        fontSize: 12,
        fontStyle: "bold",
        textColor: [255, 255, 255],
        cellPadding: 6,
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
        lineWidth: 0.5,
        lineColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Budget Allocation Section - Using table format
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Budget Allocation Agreement", 20, yPosition);
    yPosition += 15;

    // Calculate budget allocation
    const elraPercentage = parseFloat(projectData.budgetPercentage) || 100;
    const clientPercentage = 100 - elraPercentage;
    const elraAmount = (parseFloat(projectData.budget) * elraPercentage) / 100;
    const clientAmount =
      (parseFloat(projectData.budget) * clientPercentage) / 100;

    console.log("🔍 [CLIENT PDF BUDGET DEBUG]:");
    console.log("  - Raw budgetPercentage:", projectData.budgetPercentage);
    console.log("  - Parsed elraPercentage:", elraPercentage);
    console.log("  - clientPercentage:", clientPercentage);
    console.log("  - elraAmount:", elraAmount);
    console.log("  - clientAmount:", clientAmount);

    // Create budget allocation table
    const budgetData = [
      [
        "Total Project Budget",
        `₦${new Intl.NumberFormat().format(projectData.budget)}`,
      ],
      [
        "ELRA Handles",
        `${elraPercentage}% (₦${new Intl.NumberFormat().format(elraAmount)})`,
      ],
    ];

    if (clientPercentage > 0) {
      budgetData.push([
        "Client Handles",
        `${clientPercentage}% (₦${new Intl.NumberFormat().format(
          clientAmount
        )})`,
      ]);
    }

    budgetData.push([
      "Budget Allocation",
      projectData.requiresBudgetAllocation ? "✅ Required" : "❌ Not Required",
    ]);

    autoTable(doc, {
      head: [["Item", "Amount"]],
      body: budgetData,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
        fontSize: 12,
        fontStyle: "bold",
        textColor: [255, 255, 255],
        cellPadding: 6,
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
        lineWidth: 0.5,
        lineColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 80 },
        1: { cellWidth: "auto", halign: "right" },
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
      pageBreak: "auto",
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Project Items Section - Using improved table format
    if (projectData.projectItems && projectData.projectItems.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Project Items & Deliverables", 20, yPosition);
      yPosition += 15;

      // Helper function to parse formatted numbers
      const parseFormattedNumber = (value) => {
        if (typeof value === "string") {
          return parseFloat(value.replace(/,/g, "")) || 0;
        }
        return parseFloat(value) || 0;
      };

      // Prepare table data
      const tableData = projectData.projectItems.map((item, index) => {
        const unitPrice = parseFormattedNumber(item.unitPrice);
        const quantity = parseInt(item.quantity) || 1;
        const total = unitPrice * quantity;

        return [
          index + 1,
          item.name,
          quantity,
          `₦${new Intl.NumberFormat().format(unitPrice)}`,
          `₦${new Intl.NumberFormat().format(total)}`,
          item.deliveryTimeline || "TBD",
        ];
      });

      // Add table with payslip-style formatting
      autoTable(doc, {
        head: [["#", "Item Name", "Qty", "Unit Price", "Total", "Timeline"]],
        body: tableData,
        startY: yPosition,
        theme: "grid",
        headStyles: {
          fillColor: elraGreen,
          fontSize: 12,
          fontStyle: "bold",
          textColor: [255, 255, 255],
          cellPadding: 6,
        },
        styles: {
          fontSize: 11,
          cellPadding: 6,
          lineWidth: 0.5,
          lineColor: [50, 50, 50],
        },
        columnStyles: {
          0: { cellWidth: 18, halign: "center" }, // #
          1: { fontStyle: "bold", cellWidth: 85 }, // Item Name
          2: { cellWidth: 25, halign: "center" }, // Qty
          3: { cellWidth: 40, halign: "right" }, // Unit Price
          4: { cellWidth: 40, halign: "right" }, // Total
          5: { cellWidth: 45 }, // Timeline
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        margin: { left: 20, right: 20 },
        tableWidth: "auto",
        showHead: "everyPage",
        pageBreak: "auto",
        didDrawPage: function (data) {
          // Add page number
          doc.setFontSize(10);
          doc.setTextColor(128, 128, 128);
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: "right" }
          );
        },
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Calculate and display total
      const grandTotal = projectData.projectItems.reduce((sum, item) => {
        const unitPrice = parseFormattedNumber(item.unitPrice);
        const quantity = parseInt(item.quantity) || 1;
        return sum + unitPrice * quantity;
      }, 0);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total Project Cost: ₦${new Intl.NumberFormat().format(grandTotal)}`,
        20,
        yPosition
      );
      yPosition += 15;
    }

    // Vendor Information Section (if vendor exists) - Using table format
    if (projectData.hasVendor && projectData.vendorName) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Vendor Information", 20, yPosition);
      yPosition += 15;

      // Create vendor information table
      const vendorInfoData = [["Vendor Name", projectData.vendorName]];

      if (projectData.vendorEmail) {
        vendorInfoData.push(["Vendor Email", projectData.vendorEmail]);
      }
      if (projectData.vendorPhone) {
        vendorInfoData.push(["Vendor Phone", projectData.vendorPhone]);
      }
      if (projectData.vendorAddress) {
        vendorInfoData.push(["Vendor Address", projectData.vendorAddress]);
      }
      if (projectData.deliveryAddress) {
        vendorInfoData.push(["Delivery Address", projectData.deliveryAddress]);
      }

      autoTable(doc, {
        head: [["Field", "Value"]],
        body: vendorInfoData,
        startY: yPosition,
        theme: "grid",
        headStyles: {
          fillColor: elraGreen,
          fontSize: 12,
          fontStyle: "bold",
          textColor: [255, 255, 255],
          cellPadding: 6,
        },
        styles: {
          fontSize: 11,
          cellPadding: 6,
          lineWidth: 0.5,
          lineColor: [50, 50, 50],
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 60 },
          1: { cellWidth: "auto" },
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        margin: { left: 20, right: 20 },
        tableWidth: "auto",
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Approval Process Section - Using table format
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Approval Process", 20, yPosition);
    yPosition += 15;

    const approvalFlow =
      projectData.requiresBudgetAllocation === "true"
        ? "Legal → Finance Review → Executive → Budget Allocation"
        : "Legal → Executive (using existing budget)";

    // Create approval process table
    const approvalData = [
      ["Approval Flow", approvalFlow],
      ["Status", "Project submitted and pending approval"],
      ["Next Steps", "Our team will review and process your project request"],
    ];

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: approvalData,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
        fontSize: 12,
        fontStyle: "bold",
        textColor: [255, 255, 255],
        cellPadding: 6,
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
        lineWidth: 0.5,
        lineColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    yPosition = addPageIfNeeded(80);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT ACKNOWLEDGMENT", 20, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Client Name: _________________________", 20, yPosition);
    yPosition += 12;

    doc.text("Authorized Signature: _________________________", 20, yPosition);
    yPosition += 12;

    doc.text("Date: _________________________", 20, yPosition);
    yPosition += 12;
    doc.text("Company Stamp/Seal:", 20, yPosition);
    yPosition += 20;

    // Signature box
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition, 80, 30);
    doc.text("Please sign and stamp here", 25, yPosition + 20);
    yPosition += 40;

    // Acknowledgment text
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      "By signing above, I acknowledge receipt of this project proposal and agree to the terms outlined.",
      20,
      yPosition
    );
    yPosition += 15;

    // Footer - Match payslip style
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This document serves as confirmation of your project partnership with ELRA.",
      20,
      yPosition
    );
    yPosition += 7;
    doc.text("Please keep this document for your records.", 20, yPosition);
    yPosition += 15;

    // Add footer like payslip
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("Generated on: " + new Date().toLocaleString(), 20, yPosition);
    doc.setFontSize(7);
    doc.text("This is a computer generated document", 20, yPosition + 5);
    doc.text(
      "© " +
        new Date().getFullYear() +
        " ELRA Enterprise Resource Management System",
      20,
      yPosition + 10
    );

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
      title: "Project Partnership Agreement",
      subject: "ELRA Project Partnership",
      author: "ELRA System",
      creator: "ELRA PDF Generator",
    });

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error("Client project PDF generation error:", error);
    throw new Error("Failed to generate client project PDF");
  }
};

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

    // Vendor Information Section - Using table format
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Vendor Information", 20, yPosition);
    yPosition += 15;

    // Create vendor information table
    const vendorInfoData = [
      ["Company Name", vendorData.name],
      ["Services", vendorData.servicesOffered.join(", ")],
      ["Status", "Pending Approval"],
      ["Registration Date", new Date().toLocaleDateString()],
    ];

    if (vendorData.email) {
      vendorInfoData.splice(1, 0, ["Email", vendorData.email]);
    }
    if (vendorData.phone) {
      vendorInfoData.splice(vendorData.email ? 2 : 1, 0, [
        "Phone",
        vendorData.phone,
      ]);
    }
    if (projectData.deliveryAddress) {
      vendorInfoData.splice(-2, 0, [
        "Delivery Address",
        projectData.deliveryAddress,
      ]);
    }
    if (
      projectData.vendorCategory &&
      projectData.vendorCategory !== "Not specified"
    ) {
      const formattedVendorCategory = projectData.vendorCategory.replace(
        /_/g,
        " "
      );
      vendorInfoData.splice(-2, 0, ["Category", formattedVendorCategory]);
    }

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: vendorInfoData,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
        fontSize: 12,
        fontStyle: "bold",
        textColor: [255, 255, 255],
        cellPadding: 6,
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
        lineWidth: 0.5,
        lineColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Project Information Section - Using table format
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Project Information", 20, yPosition);
    yPosition += 15;

    // Create project information table
    const projectInfoData = [
      ["Project Name", projectData.name],
      [
        "Scope",
        projectData.projectScope
          ? projectData.projectScope.charAt(0).toUpperCase() +
            projectData.projectScope.slice(1)
          : "External",
      ],
      [
        "Budget",
        `NGN ${projectData.budget.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      ],
      ["Start Date", new Date(projectData.startDate).toLocaleDateString()],
      ["End Date", new Date(projectData.endDate).toLocaleDateString()],
    ];

    if (projectData.category && projectData.category !== "Not specified") {
      const formattedCategory = projectData.category.replace(/_/g, " ");
      projectInfoData.splice(2, 0, ["Category", formattedCategory]);
    }
    if (
      projectData.projectManager &&
      projectData.projectManager !== "Not assigned"
    ) {
      projectInfoData.splice(-3, 0, [
        "Project Manager",
        projectData.projectManager,
      ]);
    }
    if (projectData.priority && projectData.priority !== "medium") {
      const priorityText =
        projectData.priority.charAt(0).toUpperCase() +
        projectData.priority.slice(1);
      projectInfoData.splice(-3, 0, ["Priority", priorityText]);
    }
    if (
      projectData.requiresBudgetAllocation === "true" ||
      projectData.requiresBudgetAllocation === true
    ) {
      projectInfoData.push(["Budget Allocation", "Requested"]);
    }

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: projectInfoData,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
        fontSize: 12,
        fontStyle: "bold",
        textColor: [255, 255, 255],
        cellPadding: 6,
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
        lineWidth: 0.5,
        lineColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    if (projectData.projectItems && projectData.projectItems.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Project Items", 20, yPosition);
      yPosition += 15;

      // Helper function to parse formatted numbers
      const parseFormattedNumber = (value) => {
        if (typeof value === "string") {
          return parseFloat(value.replace(/,/g, "")) || 0;
        }
        return parseFloat(value) || 0;
      };

      const rows = projectData.projectItems.map((item) => {
        const unitPrice = parseFormattedNumber(item.unitPrice);
        const quantity = parseInt(item.quantity) || 0;
        const total = unitPrice * quantity;

        return [
          item.name || "N/A",
          item.description || "N/A",
          quantity,
          `NGN ${unitPrice.toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          `NGN ${total.toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        ];
      });

      autoTable(doc, {
        head: [["Item", "Description", "Quantity", "Unit Price", "Total"]],
        body: rows,
        startY: yPosition,
        theme: "grid",
        headStyles: {
          fillColor: elraGreen,
          fontSize: 12,
          fontStyle: "bold",
          textColor: [255, 255, 255],
          cellPadding: 6,
        },
        styles: {
          fontSize: 11,
          cellPadding: 6,
          lineWidth: 0.5,
          lineColor: [50, 50, 50],
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 60 },
          1: { cellWidth: 80 },
          2: { halign: "center", cellWidth: 30 },
          3: { halign: "right", cellWidth: 40 },
          4: { halign: "right", cellWidth: 40 },
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        margin: { left: 20, right: 20 },
        tableWidth: "auto",
        pageBreak: "auto",
        showHead: "everyPage",
        didDrawPage: function (data) {
          // Add page number
          doc.setFontSize(10);
          doc.setTextColor(128, 128, 128);
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: "right" }
          );
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

    // Approval Workflow Section - Using table format
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Approval Workflow", 20, yPosition);
    yPosition += 15;

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
          "3. Finance Department Review (Budget Validation)",
          "4. Executive Management Approval",
          "5. Finance Department Budget Allocation",
        ];
        workflowDescription =
          "This external project requires new budget allocation and will go through a comprehensive 5-level approval process.";
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

    // Create approval workflow table
    const approvalData = [
      [
        "Project Type",
        projectData.projectScope
          ? projectData.projectScope.charAt(0).toUpperCase() +
            projectData.projectScope.slice(1) +
            " Project"
          : "External Project",
      ],
      ["Workflow Description", workflowDescription],
      ["Approval Steps", approvalSteps.join("\n")],
    ];

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: approvalData,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
        fontSize: 12,
        fontStyle: "bold",
        textColor: [255, 255, 255],
        cellPadding: 6,
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
        lineWidth: 0.5,
        lineColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Footer - Match payslip style
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This is an official vendor registration receipt from ELRA.",
      20,
      yPosition
    );
    yPosition += 7;
    doc.text("Please keep this document for your records.", 20, yPosition);
    yPosition += 15;

    // Add footer like payslip
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("Generated on: " + new Date().toLocaleString(), 20, yPosition);
    doc.setFontSize(7);
    doc.text("This is a computer generated document", 20, yPosition + 5);
    doc.text(
      "© " +
        new Date().getFullYear() +
        " ELRA Enterprise Resource Management System",
      20,
      yPosition + 10
    );

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

/**
 * Generate procurement order PDF for supplier
 * @param {Object} procurementData - Procurement order data
 * @param {Object} currentUser - Current user data
 * @returns {Buffer}
 */
/**
 * Generate inventory completion PDF
 * @param {Object} inventoryData - Inventory item data
 * @param {Object} projectData - Project data
 * @param {Object} procurementData - Procurement data
 * @param {Object} currentUser - Current user data
 * @returns {Buffer}
 */
export const generateInventoryCompletionPDF = async (
  inventoryData,
  projectData,
  procurementData,
  currentUser
) => {
  try {
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

        return 20;
      }
      return currentY;
    };

    // Set watermark with reduced opacity
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

    // Header with ELRA branding (centered like procurement PDF)
    const elraGreen = [13, 100, 73];
    doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("ELRA", 105, 30, { align: "center" });

    // Reset to black for other text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Inventory Completion Certificate", 105, 42, { align: "center" });

    // Add completion details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Item Code: ${inventoryData.code}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 57);

    // Document details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    let yPosition = 60;

    // Project Information
    doc.setFont("helvetica", "bold");
    doc.text("PROJECT INFORMATION", 20, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`Project Name: ${projectData.name}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Project Code: ${projectData.code}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Category: ${projectData.category}`, 20, yPosition);
    yPosition += 6;
    doc.text(
      `Budget: NGN ${projectData.budget?.toLocaleString() || "N/A"}`,
      20,
      yPosition
    );
    yPosition += 10;

    // Procurement Information
    doc.setFont("helvetica", "bold");
    doc.text("PROCUREMENT INFORMATION", 20, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`Purchase Order: ${procurementData.poNumber}`, 20, yPosition);
    yPosition += 6;
    doc.text(
      `Supplier: ${procurementData.supplier?.name || "N/A"}`,
      20,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Total Amount: NGN ${
        procurementData.totalAmount?.toLocaleString() || "N/A"
      }`,
      20,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Delivery Address: ${procurementData.deliveryAddress?.street || "N/A"}, ${
        procurementData.deliveryAddress?.city || "N/A"
      }, ${procurementData.deliveryAddress?.state || "N/A"}`,
      20,
      yPosition
    );
    yPosition += 10;

    // Inventory Item Details
    doc.setFont("helvetica", "bold");
    doc.text("INVENTORY ITEM DETAILS", 20, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`Item Name: ${inventoryData.name}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Item Code: ${inventoryData.code}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Description: ${inventoryData.description}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Type: ${inventoryData.type}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Category: ${inventoryData.category}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Status: ${inventoryData.status}`, 20, yPosition);
    yPosition += 6;
    if (inventoryData.location) {
      doc.text(`Location: ${inventoryData.location}`, 20, yPosition);
      yPosition += 6;
    }
    doc.text(
      `Purchase Price: NGN ${
        inventoryData.purchasePrice?.toLocaleString() || "N/A"
      }`,
      20,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Current Value: NGN ${
        inventoryData.currentValue?.toLocaleString() || "N/A"
      }`,
      20,
      yPosition
    );
    yPosition += 10;

    // Specifications Table
    if (inventoryData.specifications) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SPECIFICATIONS", 20, yPosition);
      yPosition += 10;

      const specData = [];

      if (inventoryData.specifications.brand) {
        specData.push(["Brand", inventoryData.specifications.brand]);
      }
      if (inventoryData.specifications.model) {
        specData.push(["Model", inventoryData.specifications.model]);
      }
      if (inventoryData.specifications.year) {
        specData.push(["Year", inventoryData.specifications.year]);
      }
      if (inventoryData.specifications.serialNumber) {
        specData.push([
          "Serial Number",
          inventoryData.specifications.serialNumber,
        ]);
      }
      if (inventoryData.specifications.licenseType) {
        specData.push([
          "License Type",
          inventoryData.specifications.licenseType,
        ]);
      }
      if (inventoryData.specifications.numberOfUsers) {
        specData.push([
          "Number of Users",
          inventoryData.specifications.numberOfUsers,
        ]);
      }

      // Dimensions
      if (inventoryData.specifications.dimensions) {
        const dims = inventoryData.specifications.dimensions;
        if (dims.length || dims.width || dims.height) {
          specData.push([
            "Dimensions",
            `${dims.length || "N/A"} × ${dims.width || "N/A"} × ${
              dims.height || "N/A"
            } ${dims.unit || "m"}`,
          ]);
        }
      }

      // Weight
      if (inventoryData.specifications.weight) {
        const weight = inventoryData.specifications.weight;
        if (weight.value) {
          specData.push([
            "Weight",
            `${weight.value.toLocaleString()} ${weight.unit || "kg"}`,
          ]);
        }
      }

      if (specData.length > 0) {
        autoTable(doc, {
          head: [["Specification", "Value"]],
          body: specData,
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
            0: { fontStyle: "bold", cellWidth: 60 },
            1: { cellWidth: "auto" },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { left: 20, right: 20 },
          tableWidth: "auto",
          pageBreak: "auto",
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }
    }

    // Delivery Information Table
    if (
      inventoryData.receivedBy ||
      inventoryData.receivedDate ||
      inventoryData.deliveryCondition
    ) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DELIVERY INFORMATION", 20, yPosition);
      yPosition += 10;

      const deliveryData = [];

      if (inventoryData.receivedBy) {
        deliveryData.push(["Received By", inventoryData.receivedBy]);
      }
      if (inventoryData.receivedDate) {
        deliveryData.push([
          "Received Date",
          new Date(inventoryData.receivedDate).toLocaleDateString(),
        ]);
      }
      if (inventoryData.deliveryCondition) {
        deliveryData.push([
          "Delivery Condition",
          inventoryData.deliveryCondition,
        ]);
      }

      if (deliveryData.length > 0) {
        autoTable(doc, {
          head: [["Field", "Value"]],
          body: deliveryData,
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
            0: { fontStyle: "bold", cellWidth: 60 },
            1: { cellWidth: "auto" },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { left: 20, right: 20 },
          tableWidth: "auto",
          pageBreak: "auto",
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }
    }

    // Maintenance Information Table
    if (inventoryData.maintenance) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("MAINTENANCE SCHEDULE", 20, yPosition);
      yPosition += 10;

      const maintenanceData = [];

      if (inventoryData.maintenance.lastServiceDate) {
        maintenanceData.push([
          "Last Service Date",
          new Date(
            inventoryData.maintenance.lastServiceDate
          ).toLocaleDateString(),
        ]);
      }
      if (inventoryData.maintenance.nextServiceDate) {
        maintenanceData.push([
          "Next Service Date",
          new Date(
            inventoryData.maintenance.nextServiceDate
          ).toLocaleDateString(),
        ]);
      }
      if (inventoryData.maintenance.serviceInterval) {
        maintenanceData.push([
          "Service Interval",
          `${inventoryData.maintenance.serviceInterval} days`,
        ]);
      }
      if (inventoryData.maintenance.maintenanceNotes) {
        maintenanceData.push([
          "Maintenance Notes",
          inventoryData.maintenance.maintenanceNotes,
        ]);
      }

      if (maintenanceData.length > 0) {
        autoTable(doc, {
          head: [["Field", "Value"]],
          body: maintenanceData,
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
            0: { fontStyle: "bold", cellWidth: 60 },
            1: { cellWidth: "auto" },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { left: 20, right: 20 },
          tableWidth: "auto",
          pageBreak: "auto",
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }
    }

    // Completion Information Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("COMPLETION INFORMATION", 20, yPosition);
    yPosition += 10;

    const completionData = [
      ["Completed By", `${currentUser.firstName} ${currentUser.lastName}`],
      ["Completion Date", new Date().toLocaleDateString()],
      ["Completion Time", new Date().toLocaleTimeString()],
    ];

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: completionData,
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
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
      pageBreak: "auto",
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Notes Table
    if (inventoryData.notes && inventoryData.notes.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("NOTES", 20, yPosition);
      yPosition += 10;

      const notesData = inventoryData.notes.map((note, index) => [
        `Note ${index + 1}`,
        note.text || "No content",
      ]);

      autoTable(doc, {
        head: [["Note", "Content"]],
        body: notesData,
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
          0: { fontStyle: "bold", cellWidth: 30 },
          1: { cellWidth: "auto" },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
        tableWidth: "auto",
        pageBreak: "auto",
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Add metadata
    doc.setProperties({
      title: `Inventory Completion Certificate - ${inventoryData.code}`,
      subject: "ELRA Inventory Completion",
      author: "ELRA System",
      creator: "ELRA PDF Generator",
    });

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error("Inventory completion PDF generation error:", error);
    throw new Error("Failed to generate inventory completion PDF");
  }
};

export const generateProcurementOrderPDF = async (
  procurementData,
  currentUser
) => {
  try {
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

        return 20;
      }
      return currentY;
    };

    // Set watermark with reduced opacity
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

    // Header with ELRA branding
    const elraGreen = [13, 100, 73];
    doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("ELRA", 105, 25, { align: "center" });

    // Add "We Regulate" tagline
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("You Lease, We Regulate", 105, 35, { align: "center" });

    // Reset to black for other text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Purchase Order", 105, 45, { align: "center" });

    // Add PO Number and date
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`PO Number: ${procurementData.poNumber}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 57);

    let yPosition = 70;

    // Supplier Information Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Supplier Information", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Company: ${procurementData.supplier.name}`, 20, yPosition);
    yPosition += 7;

    if (procurementData.supplier.contactPerson) {
      doc.text(
        `Contact Person: ${procurementData.supplier.contactPerson}`,
        20,
        yPosition
      );
      yPosition += 7;
    }

    if (procurementData.supplier.email) {
      doc.text(`Email: ${procurementData.supplier.email}`, 20, yPosition);
      yPosition += 7;
    }

    if (procurementData.supplier.phone) {
      doc.text(`Phone: ${procurementData.supplier.phone}`, 20, yPosition);
      yPosition += 7;
    }

    yPosition += 10;

    // Order Information Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Order Information", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Title: ${procurementData.title}`, 20, yPosition);
    yPosition += 7;

    doc.text(
      `Priority: ${procurementData.priority.toUpperCase()}`,
      20,
      yPosition
    );
    yPosition += 7;

    doc.text(
      `Total Amount: NGN ${procurementData.totalAmount.toLocaleString()}`,
      20,
      yPosition
    );
    yPosition += 7;

    doc.text(`Currency: ${procurementData.currency}`, 20, yPosition);
    yPosition += 7;

    if (procurementData.expectedDeliveryDate) {
      doc.text(
        `Expected Delivery: ${new Date(
          procurementData.expectedDeliveryDate
        ).toLocaleDateString()}`,
        20,
        yPosition
      );
      yPosition += 7;
    }

    yPosition += 10;

    // Items Table
    if (procurementData.items && procurementData.items.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Items Required", 20, yPosition);
      yPosition += 10;

      const headers = [
        "S/N",
        "Item Name",
        "Description",
        "Quantity",
        "Unit Price",
        "Total Price",
      ];

      const rows = procurementData.items.map((item, index) => [
        index + 1,
        item.name || "N/A",
        item.description || "N/A",
        item.quantity || 0,
        `NGN ${(item.unitPrice || 0).toLocaleString()}`,
        `NGN ${(item.totalPrice || 0).toLocaleString()}`,
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
          0: { halign: "center", cellWidth: "auto", cellPadding: 5 }, // S/N
          1: { fontStyle: "bold", cellWidth: "auto", cellPadding: 5 }, // Item Name
          2: { cellWidth: "auto", cellPadding: 5 }, // Description
          3: { halign: "center", cellWidth: "auto", cellPadding: 5 }, // Quantity
          4: { halign: "right", cellWidth: "auto", cellPadding: 5 }, // Unit Price
          5: { halign: "right", cellWidth: "auto", cellPadding: 5 }, // Total Price
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
        tableWidth: "auto",
        pageBreak: "auto",
        showFoot: "lastPage",
        didParseCell: function (data) {
          if (data.column.index === 2) {
            // Description column
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

      // Order Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Order Summary", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Subtotal: NGN ${procurementData.subtotal.toLocaleString()}`,
        20,
        yPosition
      );
      yPosition += 7;

      if (procurementData.tax > 0) {
        doc.text(
          `Tax: NGN ${procurementData.tax.toLocaleString()}`,
          20,
          yPosition
        );
        yPosition += 7;
      }

      if (procurementData.shipping > 0) {
        doc.text(
          `Shipping: NGN ${procurementData.shipping.toLocaleString()}`,
          20,
          yPosition
        );
        yPosition += 7;
      }

      doc.setFont("helvetica", "bold");
      doc.text(
        `Total Amount: NGN ${procurementData.totalAmount.toLocaleString()}`,
        20,
        yPosition
      );
      yPosition += 15;
    }

    // Contact Information Section - Check for page break
    yPosition += 10;
    yPosition = addPageIfNeeded(80);

    // Ensure text color is black
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Contact Information & Next Steps", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "For inquiries and order confirmation, please contact:",
      20,
      yPosition
    );
    yPosition += 7;

    doc.text(
      `Procurement HOD: ${currentUser.firstName} ${currentUser.lastName}`,
      20,
      yPosition
    );
    yPosition += 7;

    doc.text(`Email: ${currentUser.email}`, 20, yPosition);
    yPosition += 7;

    doc.text("Phone: +234 800 ELRA (3572)", 20, yPosition);
    yPosition += 7;

    doc.text(
      "Company: ELRA (Equipment Leasing Registration Authority)",
      20,
      yPosition
    );
    yPosition += 10;

    // Delivery Address Section
    if (
      procurementData.deliveryAddress &&
      procurementData.deliveryAddress.street
    ) {
      // Ensure text color is black
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Delivery Address", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Street: ${procurementData.deliveryAddress.street}`,
        20,
        yPosition
      );
      yPosition += 7;

      if (procurementData.deliveryAddress.city) {
        doc.text(
          `City: ${procurementData.deliveryAddress.city}`,
          20,
          yPosition
        );
        yPosition += 7;
      }

      if (procurementData.deliveryAddress.state) {
        doc.text(
          `State: ${procurementData.deliveryAddress.state}`,
          20,
          yPosition
        );
        yPosition += 7;
      }

      if (procurementData.deliveryAddress.postalCode) {
        doc.text(
          `Postal Code: ${procurementData.deliveryAddress.postalCode}`,
          20,
          yPosition
        );
        yPosition += 7;
      }

      if (procurementData.deliveryAddress.contactPerson) {
        doc.text(
          `Delivery Contact: ${procurementData.deliveryAddress.contactPerson}`,
          20,
          yPosition
        );
        yPosition += 7;
      }

      if (procurementData.deliveryAddress.phone) {
        doc.text(
          `Delivery Phone: ${procurementData.deliveryAddress.phone}`,
          20,
          yPosition
        );
        yPosition += 7;
      }

      yPosition += 10;
    }

    // Ensure text color is black for all remaining text
    doc.setTextColor(0, 0, 0);
    doc.text("Human Resources Department:", 20, yPosition);
    yPosition += 10; // Increased spacing

    doc.text("Email: hod.hr@elra.com", 20, yPosition);
    yPosition += 8; // Increased spacing

    doc.text("Name: Lisa Davis", 20, yPosition);
    yPosition += 8; // Increased spacing

    doc.text("Procurement Department:", 20, yPosition);
    yPosition += 8; // Increased spacing

    doc.text("Email: hod.proc@elra.com", 20, yPosition);
    yPosition += 20; // Increased spacing

    doc.text("Please respond within 48 hours with:", 20, yPosition);
    yPosition += 10; // Increased spacing

    doc.text("• Confirmation of order acceptance", 25, yPosition);
    yPosition += 8; // Increased spacing

    doc.text("• Expected delivery timeline", 25, yPosition);
    yPosition += 8; // Increased spacing

    doc.text("• Any questions or clarifications needed", 25, yPosition);
    yPosition += 8; // Increased spacing

    doc.text("• Invoice for payment processing", 25, yPosition);
    yPosition += 8; // Increased spacing

    doc.setFont("helvetica", "bold");
    doc.text("• Signed copy of this purchase order", 25, yPosition);
    yPosition += 12; // Increased spacing

    doc.setFont("helvetica", "normal");
    doc.text("To finalize this order, please contact:", 20, yPosition);
    yPosition += 10; // Increased spacing

    doc.text(
      "• Human Resources Department for any personnel-related queries",
      25,
      yPosition
    );
    yPosition += 8;

    doc.text(
      "• Procurement Department for order modifications or clarifications",
      25,
      yPosition
    );
    yPosition += 8;

    doc.text(
      "• Both departments will work together to ensure smooth order processing",
      25,
      yPosition
    );
    yPosition += 30; // Increased spacing after bullet points

    // Add some spacing after bullet points
    yPosition += 20;

    // Supplier Signature Section - Check for page break
    yPosition = addPageIfNeeded(80);

    // Ensure text color is black for supplier signature section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUPPLIER SIGNATURE", 20, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Supplier Name: _________________________", 20, yPosition);
    yPosition += 12;

    doc.text("Authorized Signature: _________________________", 20, yPosition);
    yPosition += 12;

    doc.text("Date: _________________________", 20, yPosition);
    yPosition += 12;
    doc.text("Company Stamp/Seal:", 20, yPosition);
    yPosition += 20;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition, 80, 30);
    doc.text("Please sign and stamp here", 25, yPosition + 20);
    yPosition += 40;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      "By signing above, I confirm that we can deliver the items listed above according to the specified timelines and quality standards.",
      20,
      yPosition
    );
    yPosition += 15;

    // Final closing section - Check if we need a new page
    yPosition = addPageIfNeeded(50); // Increased space for both sections

    // Ensure text color is black
    doc.setTextColor(0, 0, 0);

    // Best regards section
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Best regards,`, 20, yPosition);
    yPosition += 12;

    doc.setFont("helvetica", "bold");
    doc.text(`${currentUser.firstName} ${currentUser.lastName}`, 20, yPosition);
    yPosition += 12;

    doc.setFont("helvetica", "normal");
    doc.text("Procurement HOD", 20, yPosition);
    yPosition += 12;

    doc.text("ELRA (Equipment Leasing Registration Authority)", 20, yPosition);
    yPosition += 20;

    // We look forward message
    doc.setFont("helvetica", "italic");
    doc.text(
      "We look forward to a successful business relationship.",
      20,
      yPosition
    );

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Add metadata
    doc.setProperties({
      title: `Purchase Order ${procurementData.poNumber}`,
      subject: "ELRA Procurement Order",
      author: "ELRA System",
      creator: "ELRA PDF Generator",
    });

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error("Procurement order PDF generation error:", error);
    throw new Error("Failed to generate procurement order PDF");
  }
};
