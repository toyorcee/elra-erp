import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PayslipService {
  constructor() {
    this.uploadsDir = path.join(__dirname, "../uploads/payslips");
    this.ensureUploadsDirectory();
  }

  ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate payslip PDF for an employee
   */
  async generatePayslipPDF(payrollData, employeeData) {
    try {
      const fileName = `payslip_${employeeData.employeeId}_${payrollData.period.month}_${payrollData.period.year}.pdf`;
      const filePath = path.join(this.uploadsDir, fileName);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      this.generatePayslipContent(doc, payrollData, employeeData);

      const pdfBytes = doc.output("arraybuffer");
      fs.writeFileSync(filePath, Buffer.from(pdfBytes));

      return {
        fileName,
        filePath,
        url: `/uploads/payslips/${fileName}`,
      };
    } catch (error) {
      console.error("❌ [PAYSLIP SERVICE] Error generating PDF:", error);
      throw error;
    }
  }

  /**
   * Generate payslip content
   */
  generatePayslipContent(doc, payrollData, employeeData) {
    const { period } = payrollData;
    const payroll = payrollData.payrolls[0];

    // Set watermark with reduced opacity and size
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

    // Header
    this.generateHeader(doc, employeeData, period);

    // Employee Information
    this.generateEmployeeInfo(doc, employeeData, payroll);

    // Earnings Section
    this.generateEarningsSection(doc, payroll);

    // Deductions Section
    this.generateDeductionsSection(doc, payroll);

    // Summary Section
    this.generateSummarySection(doc, payroll);

    // Footer
    this.generateFooter(doc);
  }

  /**
   * Generate payslip header
   */
  generateHeader(doc, employeeData, period) {
    const elraGreen = [13, 100, 73];

    doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("ELRA", 105, 25, { align: "center" });

    // Reset to black for other text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(`Payslip for ${period.monthName} ${period.year}`, 105, 35, {
      align: "center",
    });
  }

  /**
   * Generate employee information section
   */
  generateEmployeeInfo(doc, employeeData, payroll) {
    const startY = 45;

    // Employee Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Dark gray
    doc.text(
      `Employee: ${employeeData.firstName} ${employeeData.lastName}`,
      20,
      startY
    );
    doc.text(`Employee ID: ${employeeData.employeeId}`, 20, startY + 7);

    let departmentName = "N/A";
    if (employeeData.department) {
      if (
        typeof employeeData.department === "object" &&
        employeeData.department.name
      ) {
        departmentName = employeeData.department.name;
      } else if (typeof employeeData.department === "string") {
        departmentName = employeeData.department;
      }
    }
    doc.text(`Department: ${departmentName}`, 20, startY + 14);

    let position = "N/A";
    if (
      employeeData.role &&
      typeof employeeData.role === "object" &&
      employeeData.role.name
    ) {
      position = employeeData.role.name;
    } else if (employeeData.position) {
      position = employeeData.position;
    } else if (employeeData.jobTitle) {
      position = employeeData.jobTitle;
    } else if (employeeData.role) {
      position = employeeData.role;
    }
    doc.text(`Position: ${position}`, 20, startY + 21);

    // Pay period with better styling
    doc.text(
      `Period: ${payroll.period?.monthName || payrollData.period.monthName} ${
        payroll.period?.year || payrollData.period.year
      }`,
      20,
      startY + 28
    );
    doc.text(
      `Payment Date: ${new Date().toLocaleDateString()}`,
      20,
      startY + 35
    );
  }

  /**
   * Generate earnings section
   */
  generateEarningsSection(doc, payroll) {
    const startY = 100;

    // Use ELRA green color
    const elraGreen = [13, 100, 73];

    // Earnings Table
    const earningsData = [
      ["Basic Salary", this.formatCurrency(payroll.baseSalary)],
    ];

    // Personal Allowances - try multiple possible field names
    const allowances = payroll.personalAllowances || payroll.allowances || [];
    if (allowances && allowances.length > 0) {
      allowances.forEach((allowance) => {
        earningsData.push([
          allowance.name,
          this.formatCurrency(allowance.amount),
        ]);
      });
    }

    // Personal Bonuses - try multiple possible field names
    const bonuses = payroll.personalBonuses || payroll.bonuses || [];
    if (bonuses && bonuses.length > 0) {
      bonuses.forEach((bonus) => {
        earningsData.push([bonus.name, this.formatCurrency(bonus.amount)]);
      });
    }

    autoTable(doc, {
      head: [["Earnings", "Amount"]],
      body: earningsData,
      startY: startY,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
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
        0: { fontStyle: "bold", cellWidth: "auto", cellPadding: 5 },
        1: { halign: "right", cellWidth: "auto", cellPadding: 5 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });
  }

  /**
   * Generate deductions section
   */
  generateDeductionsSection(doc, payroll) {
    const startY = doc.lastAutoTable.finalY + 10;

    // Use ELRA green color
    const elraGreen = [13, 100, 73];

    // Deductions Table
    const deductionsData = [];

    // Statutory Deductions
    if (payroll.paye > 0) {
      deductionsData.push(["PAYE Tax", this.formatCurrency(payroll.paye)]);
    }

    if (payroll.pension > 0) {
      deductionsData.push([
        "Pension (8%)",
        this.formatCurrency(payroll.pension),
      ]);
    }

    if (payroll.nhis > 0) {
      deductionsData.push(["NHIS (5%)", this.formatCurrency(payroll.nhis)]);
    }

    // Voluntary Deductions - try multiple possible field names
    const voluntaryDeductions =
      payroll.voluntaryDeductions || payroll.deductions || [];
    if (voluntaryDeductions && voluntaryDeductions.length > 0) {
      voluntaryDeductions.forEach((deduction) => {
        deductionsData.push([
          deduction.name,
          this.formatCurrency(deduction.amount),
        ]);
      });
    }

    autoTable(doc, {
      head: [["Deductions", "Amount"]],
      body: deductionsData,
      startY: startY,
      theme: "grid",
      headStyles: {
        fillColor: elraGreen,
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
        0: { fontStyle: "bold", cellWidth: "auto", cellPadding: 5 },
        1: { halign: "right", cellWidth: "auto", cellPadding: 5 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });
  }

  /**
   * Generate summary section
   */
  generateSummarySection(doc, payroll) {
    const startY = doc.lastAutoTable.finalY + 10;

    // Use ELRA green color
    const elraGreen = [13, 100, 73];

    // Summary Table
    const summaryData = [
      ["Total Earnings", this.formatCurrency(payroll.grossSalary)],
      ["Total Deductions", this.formatCurrency(payroll.totalDeductions)],
      ["Net Pay", this.formatCurrency(payroll.netSalary)],
    ];

    autoTable(doc, {
      body: summaryData,
      startY: startY,
      theme: "grid",
      styles: {
        fontSize: 10,
        fontStyle: "bold",
        textColor: elraGreen,
        cellPadding: 5,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: "auto", cellPadding: 5 },
        1: { halign: "right", cellWidth: "auto", cellPadding: 5 },
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    });
  }

  /**
   * Generate footer
   */
  generateFooter(doc) {
    const footerY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("Generated on: " + new Date().toLocaleString(), 20, footerY);
    doc.setFontSize(7);
    doc.text("This is a computer generated document", 20, footerY + 5);
    doc.text(
      "© " +
        new Date().getFullYear() +
        " ELRA Enterprise Resource Management System",
      20,
      footerY + 10
    );
  }

  /**
   * Format currency - Simplified to use NGN
   */
  formatCurrency(amount) {
    const numAmount = parseFloat(amount) || 0;

    const formatted = `NGN ${numAmount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return formatted;
  }

  /**
   * Send payslip notification and email
   */
  async sendPayslipNotification(payrollData, employeeData, payslipFile) {
    try {
      // Import services
      const NotificationService = (await import("./notificationService.js"))
        .default;
      const emailService = (await import("./emailService.js")).default;

      const notificationService = new NotificationService();

      // Send in-app notification
      await notificationService.createNotification({
        recipient: employeeData._id,
        type: "PAYSLIP_GENERATED",
        title: "Payslip Available",
        message: `Your payslip for ${payrollData.period.monthName} ${payrollData.period.year} is now available.`,
        priority: "medium",
        data: {
          payrollId: payrollData.payrollId,
          period: payrollData.period,
          payslipUrl: payslipFile.url,
          actionUrl: `/dashboard/payslips/${payrollData.payrollId}`,
        },
      });

      // Send email with payslip attachment
      await emailService.sendPayslipEmail({
        to: employeeData.email,
        employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
        period: `${payrollData.period.monthName} ${payrollData.period.year}`,
        netPay: payrollData.payrolls[0].netSalary,
        payslipPath: payslipFile.filePath,
        payslipFileName: payslipFile.fileName,
      });

      return {
        success: true,
        notification: "Payslip notification sent successfully",
        email: "Payslip email sent successfully",
      };
    } catch (error) {
      console.error("Error sending payslip notification:", error);
      throw error;
    }
  }
}

export default PayslipService;
