import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Payslip from "../models/Payslip.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to load certificate images
const loadPayslipImage = (imageName) => {
  try {
    const imagePath = path.resolve(__dirname, "../assets/images", imageName);
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      return `data:image/png;base64,${imageBuffer.toString("base64")}`;
    }
  } catch (error) {
    console.warn(`⚠️ Could not load image ${imageName}:`, error.message);
  }
  return null;
};

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
   * Save payslip to database
   */
  async savePayslipToDatabase(
    payrollData,
    employeeData,
    payslipFile,
    createdBy
  ) {
    try {
      // Handle both name formats (firstName/lastName vs name)
      const employeeName =
        employeeData.firstName && employeeData.lastName
          ? `${employeeData.firstName} ${employeeData.lastName}`
          : employeeData.name || "Unknown Employee";

      const payroll = payrollData.payrolls[0];

      if (!employeeData || (!employeeData._id && !employeeData.id)) {
        throw new Error(
          `Invalid employee data: ${JSON.stringify(employeeData)}`
        );
      }

      const baseSalary =
        typeof payroll.baseSalary === "object"
          ? payroll.baseSalary.effectiveBaseSalary
          : payroll.baseSalary || 0;

      const grossSalary = payroll.summary?.grossPay || payroll.grossSalary || 0;
      const netSalary = payroll.summary?.netPay || payroll.netSalary || 0;
      const totalDeductions =
        payroll.summary?.totalDeductions || payroll.totalDeductions || 0;
      const taxableIncome =
        payroll.summary?.taxableIncome || payroll.taxableIncome || 0;

      const paye = payroll.deductions?.paye || payroll.paye || 0;

      let pension = 0;
      let nhis = 0;

      const voluntaryDeductions = payroll.voluntaryDeductions || [];
      voluntaryDeductions.forEach((item) => {
        if (item.category === "pension") {
          pension = item.amount;
        } else if (item.category === "nhis") {
          nhis = item.amount;
        }
      });

      // If not found in voluntaryDeductions, check in deductions.items
      if (pension === 0 || nhis === 0) {
        const deductionsItems = payroll.deductions?.items || [];
        deductionsItems.forEach((item) => {
          if (item.category === "pension" && pension === 0) {
            pension = item.amount;
          } else if (item.category === "nhis" && nhis === 0) {
            nhis = item.amount;
          }
        });
      }

      // Fallback to direct values if not found in items
      const fallbackPension =
        payroll.deductions?.pension || payroll.pension || 0;
      const fallbackNhis = payroll.deductions?.nhis || payroll.nhis || 0;

      pension = pension || fallbackPension;
      nhis = nhis || fallbackNhis;

      // Map payroll items to payslip format (fixing type field)
      const mapPayrollItems = (items) => {
        return items.map((item) => ({
          name: item.name,
          amount: item.amount,
          type: item.calculationType === "percentage" ? "percentage" : "fixed",
        }));
      };

      const personalAllowances = mapPayrollItems(
        payroll.allowances?.items || payroll.personalAllowances || []
      );
      const personalBonuses = mapPayrollItems(
        payroll.bonuses?.items || payroll.personalBonuses || []
      );
      const mappedVoluntaryDeductions = mapPayrollItems(
        payroll.deductions?.items || payroll.voluntaryDeductions || []
      );

      const nonTaxableAllowances =
        payroll.allowances?.nonTaxable || payroll.nonTaxableAllowances || 0;

      const payslipData = {
        payrollId: payrollData.payrollId,
        employee: employeeData._id || employeeData.id,
        period: {
          month: payrollData.period.month,
          year: payrollData.period.year,
          monthName: payrollData.period.monthName,
          frequency: payrollData.period.frequency || "monthly",
        },
        scope: payrollData.scope.type || payrollData.scope,
        baseSalary: baseSalary,
        grossSalary: grossSalary,
        netSalary: netSalary,
        totalDeductions: totalDeductions,
        taxableIncome: taxableIncome,
        nonTaxableAllowances: nonTaxableAllowances,
        paye: paye,
        pension: pension,
        nhis: nhis,
        personalAllowances: personalAllowances,
        personalBonuses: personalBonuses,
        voluntaryDeductions: mappedVoluntaryDeductions,
        summary: {
          grossPay: grossSalary,
          netPay: netSalary,
          totalDeductions: totalDeductions,
          taxableIncome: taxableIncome,
        },
        payslipFile: {
          fileName: payslipFile.fileName,
          filePath: payslipFile.filePath,
          fileUrl: payslipFile.url,
        },
        status: "generated",
        createdBy: createdBy,
        processedBy: createdBy,
      };

      const payslip = new Payslip(payslipData);
      await payslip.save();

      return payslip;
    } catch (error) {
      console.error(
        "❌ [PAYSLIP SERVICE] Error saving payslip to database:",
        error
      );
      throw error;
    }
  }

  /**
   * Get payslips by filters
   */
  async getPayslipsByFilters(filters = {}) {
    try {
      let query = { isActive: true };

      // Apply filters
      if (filters.month && filters.month !== "all") {
        query["period.month"] = parseInt(filters.month);
      }

      if (filters.year && filters.year !== "all") {
        query["period.year"] = parseInt(filters.year);
      }

      if (filters.scope && filters.scope !== "all") {
        query.scope = filters.scope;
      }

      if (filters.frequency && filters.frequency !== "all") {
        query["period.frequency"] = filters.frequency;
      }

      if (filters.status && filters.status !== "all") {
        query.status = filters.status;
      }

      if (filters.department && filters.department !== "all") {
        // This will need to be handled with population
        query["employee.department"] = filters.department;
      }

      // Build population options
      const populateOptions = [
        {
          path: "employee",
          select: "firstName lastName employeeId email avatar department role",
          populate: [
            {
              path: "department",
              select: "name code",
            },
            {
              path: "role",
              select: "name level description",
            },
          ],
        },
        {
          path: "payrollId",
          select: "month year scope frequency",
        },
        {
          path: "createdBy",
          select: "firstName lastName",
        },
      ];

      // Handle search term
      if (filters.searchTerm) {
        const searchRegex = { $regex: filters.searchTerm, $options: "i" };
        query.$or = [
          { "employee.firstName": searchRegex },
          { "employee.lastName": searchRegex },
          { "employee.employeeId": searchRegex },
        ];
      }

      // Handle employee ID filter
      if (filters.employeeId) {
        query["employee.employeeId"] = {
          $regex: filters.employeeId,
          $options: "i",
        };
      }

      // Handle employee name filter
      if (filters.employeeName) {
        query.$or = [
          {
            "employee.firstName": {
              $regex: filters.employeeName,
              $options: "i",
            },
          },
          {
            "employee.lastName": {
              $regex: filters.employeeName,
              $options: "i",
            },
          },
        ];
      }

      const payslips = await Payslip.find(query)
        .populate(populateOptions)
        .sort({ createdAt: -1 });

      return payslips;
    } catch (error) {
      console.error(
        "❌ [PAYSLIP SERVICE] Error getting payslips by filters:",
        error
      );
      throw error;
    }
  }

  /**
   * Get payslip by ID
   */
  async getPayslipById(payslipId) {
    try {
      const payslip = await Payslip.findById(payslipId)
        .populate({
          path: "employee",
          select: "firstName lastName employeeId email avatar department role",
          populate: [
            {
              path: "department",
              select: "name code",
            },
            {
              path: "role",
              select: "name level description",
            },
          ],
        })
        .populate("payrollId")
        .populate("createdBy", "firstName lastName");

      return payslip;
    } catch (error) {
      console.error("❌ [PAYSLIP SERVICE] Error getting payslip by ID:", error);
      throw error;
    }
  }

  /**
   * Mark payslip as viewed
   */
  async markPayslipAsViewed(payslipId) {
    try {
      const payslip = await Payslip.findById(payslipId);
      if (payslip) {
        await payslip.markAsViewed();
      }
      return payslip;
    } catch (error) {
      console.error(
        "❌ [PAYSLIP SERVICE] Error marking payslip as viewed:",
        error
      );
      throw error;
    }
  }

  /**
   * Mark payslip as downloaded
   */
  async markPayslipAsDownloaded(payslipId) {
    try {
      const payslip = await Payslip.findById(payslipId);
      if (payslip) {
        await payslip.markAsDownloaded();
      }
      return payslip;
    } catch (error) {
      console.error(
        "❌ [PAYSLIP SERVICE] Error marking payslip as downloaded:",
        error
      );
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

    // Try to add ELRA logo image
    const elraLogo = loadPayslipImage("elra-logo.png");
    if (elraLogo) {
      try {
        doc.addImage(elraLogo, "PNG", 85, 15, 20, 20);
        doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
        doc.setFontSize(32);
        doc.setFont("helvetica", "bold");
        doc.text("ELRA", 110, 30, { align: "center" });
      } catch (error) {
        console.warn(
          "⚠️ Could not add ELRA logo to payslip, falling back to text:",
          error.message
        );
        doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
        doc.setFontSize(32);
        doc.setFont("helvetica", "bold");
        doc.text("ELRA", 105, 25, { align: "center" });
      }
    } else {
      // Fallback to text-only
      doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      doc.text("ELRA", 105, 25, { align: "center" });
    }

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
    doc.setTextColor(100, 100, 100);
    const employeeName =
      employeeData.firstName && employeeData.lastName
        ? `${employeeData.firstName} ${employeeData.lastName}`
        : employeeData.name || "Unknown Employee";

    doc.text(`Employee: ${employeeName}`, 20, startY);
    doc.text(
      `Employee ID: ${employeeData.employeeId || employeeData._id || "N/A"}`,
      20,
      startY + 7
    );

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

    doc.text(
      `Period: ${payroll.period?.monthName || "N/A"} ${
        payroll.period?.year || "N/A"
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

    // Get base salary - handle both object and number formats
    const baseSalary =
      typeof payroll.baseSalary === "object"
        ? payroll.baseSalary.effectiveBaseSalary ||
          payroll.baseSalary.actualBaseSalary ||
          0
        : payroll.baseSalary || 0;

    const earningsData = [["Basic Salary", this.formatCurrency(baseSalary)]];

    const allowances =
      payroll.allowances?.items ||
      payroll.personalAllowances ||
      payroll.allowances ||
      [];
    if (allowances && allowances.length > 0) {
      allowances.forEach((allowance) => {
        earningsData.push([
          allowance.name,
          this.formatCurrency(allowance.amount),
        ]);
      });
    }

    const bonuses =
      payroll.bonuses?.items ||
      payroll.personalBonuses ||
      payroll.bonuses ||
      [];
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

    // Statutory Deductions - get from deductions object
    const paye = payroll.deductions?.paye || payroll.paye || 0;
    const pension = payroll.deductions?.pension || payroll.pension || 0;
    const nhis = payroll.deductions?.nhis || payroll.nhis || 0;

    if (paye > 0) {
      deductionsData.push(["PAYE Tax", this.formatCurrency(paye)]);
    }

    if (pension > 0) {
      deductionsData.push(["Pension (8%)", this.formatCurrency(pension)]);
    }

    if (nhis > 0) {
      deductionsData.push(["NHIS (5%)", this.formatCurrency(nhis)]);
    }

    const voluntaryDeductions =
      payroll.deductions?.items ||
      payroll.voluntaryDeductions ||
      payroll.deductions ||
      [];
    if (voluntaryDeductions && voluntaryDeductions.length > 0) {
      const nonStatutoryDeductions = voluntaryDeductions.filter((deduction) => {
        const category = deduction.category?.toLowerCase();
        const name = deduction.name?.toLowerCase();

        return !(
          category === "pension" ||
          category === "nhis" ||
          category === "paye" ||
          name?.includes("pension") ||
          name?.includes("nhis") ||
          name?.includes("paye") ||
          name?.includes("tax")
        );
      });

      nonStatutoryDeductions.forEach((deduction) => {
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

    // Summary Table - get from summary object
    const grossPay = payroll.summary?.grossPay || payroll.grossSalary || 0;
    const totalDeductions =
      payroll.summary?.totalDeductions || payroll.totalDeductions || 0;
    const netPay = payroll.summary?.netPay || payroll.netSalary || 0;

    const summaryData = [
      ["Total Earnings", this.formatCurrency(grossPay)],
      ["Total Deductions", this.formatCurrency(totalDeductions)],
      ["Net Pay", this.formatCurrency(netPay)],
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

      await notificationService.createNotification({
        recipient: employeeData._id || employeeData.id,
        type: "PAYSLIP_GENERATED",
        title: "Payslip Available",
        message: `Your payslip for ${payrollData.period.monthName} ${payrollData.period.year} is now available.`,
        priority: "medium",
        data: {
          payrollId: payrollData.payrollId,
          period: payrollData.period,
          payslipUrl: payslipFile.url,
          actionUrl: `/dashboard/modules/self-service/payslips`,
        },
      });

      // Send email with payslip attachment
      const employeeName =
        employeeData.firstName && employeeData.lastName
          ? `${employeeData.firstName} ${employeeData.lastName}`
          : employeeData.name || "Unknown Employee";

      // Get employee email - try from employeeData first, then fetch from database
      let employeeEmail = employeeData.email;
      if (!employeeEmail) {
        try {
          const User = (await import("../models/User.js")).default;
          const user = await User.findById(
            employeeData._id || employeeData.id
          ).select("email");
          employeeEmail = user?.email;
        } catch (fetchError) {
          console.error(
            "❌ [PAYSLIP SERVICE] Failed to fetch email from database:",
            fetchError
          );
        }
      }

      if (!employeeEmail) {
        throw new Error(
          `No email found for employee ${employeeName} (ID: ${
            employeeData._id || employeeData.id
          })`
        );
      }

      const payroll = payrollData.payrolls[0];
      const netPay =
        payroll.summary?.netPay || payroll.netSalary || payroll.netPay || 0;

      await emailService.sendPayslipEmail({
        to: employeeEmail,
        employeeName: employeeName,
        period: `${payrollData.period.monthName} ${payrollData.period.year}`,
        netPay: netPay,
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
