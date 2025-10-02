import SalesMarketingFinancialService from "../services/salesMarketingFinancialService.js";
import ELRAWallet from "../models/ELRAWallet.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to load certificate images
const loadSalesMarketingImage = (imageName) => {
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

// ===== DASHBOARD =====
export const getSalesMarketingDashboard = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.getDashboardData();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== TRANSACTIONS =====
export const getSalesMarketingTransactions = async (req, res) => {
  try {
    const { module, status } = req.query;
    const result = await SalesMarketingFinancialService.getTransactions(
      module,
      status
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting transactions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createSalesMarketingTransaction = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.createTransaction(
      req.body,
      req.user.id
    );

    if (result.success) {
      console.log(
        "✅ [SALES_MARKETING_CONTROLLER] Transaction created successfully:",
        {
          transactionId: result.data.transaction._id,
          status: result.data.transaction.status,
          amount: req.body.amount,
        }
      );

      res.status(201).json({
        success: true,
        data: result.data,
        message: "Transaction created successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error(
      "❌ [SALES_MARKETING_CONTROLLER] Error creating transaction:",
      error.message
    );
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create transaction",
    });
  }
};

// ===== APPROVALS =====
export const getSalesMarketingApprovals = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.getPendingApprovals();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting approvals:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Sales & Marketing approval history
export const getSalesMarketingApprovalHistory = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.getApprovalHistory();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting approval history:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const approveSalesMarketingTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const result = await SalesMarketingFinancialService.approveTransaction(
      id,
      req.user.id,
      comments
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Transaction approved successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error approving transaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const rejectSalesMarketingTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const result = await SalesMarketingFinancialService.rejectTransaction(
      id,
      req.user.id,
      comments
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: "Transaction rejected successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error rejecting transaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== REPORTS =====
export const getSalesMarketingReports = async (req, res) => {
  try {
    const { dateRange = "30d", departmentFilter = "all" } = req.query;
    const result = await SalesMarketingFinancialService.getReportsData(
      dateRange,
      departmentFilter
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== CATEGORIES =====
export const getSalesCategories = async (req, res) => {
  try {
    const result = await SalesMarketingFinancialService.getSalesCategories();

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error getting sales categories:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMarketingCategories = async (req, res) => {
  try {
    const result =
      await SalesMarketingFinancialService.getMarketingCategories();

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error getting marketing categories:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== BUDGET INFORMATION =====
export const getOperationalBudget = async (req, res) => {
  try {
    const wallet = await ELRAWallet.findOne();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "ELRA wallet not found",
      });
    }

    const operationalBudget = wallet.budgetCategories.operational;

    res.status(200).json({
      success: true,
      data: {
        available: operationalBudget.available,
        allocated: operationalBudget.allocated,
        used: operationalBudget.used,
        reserved: operationalBudget.reserved || 0,
        total: operationalBudget.allocated,
        isLow: operationalBudget.available < 5000000,
        isVeryLow: operationalBudget.available < 1000000,
        threshold: 5000000,
      },
    });
  } catch (error) {
    console.error("Error getting operational budget:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== EXPORT REPORTS =====
export const exportSalesMarketingReport = async (req, res) => {
  try {
    const { format } = req.params;
    const { dateRange = "30", departmentFilter = "all" } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    // Get dashboard data for the report
    const dashboardData =
      await SalesMarketingFinancialService.getDashboardData();

    if (!dashboardData.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to fetch report data",
      });
    }

    if (format.toLowerCase() === "pdf") {
      // Use jsPDF like other modules
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // ELRA Branding - Professional header like payslip
      const elraGreen = [13, 100, 73];

      // Try to add ELRA logo image
      const elraLogo = loadSalesMarketingImage("elra-logo.png");
      if (elraLogo) {
        try {
          doc.addImage(elraLogo, "PNG", 85, 15, 20, 20);
          doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
          doc.setFontSize(32);
          doc.setFont("helvetica", "bold");
          doc.text("ELRA", 110, 30, { align: "center" });
        } catch (error) {
          console.warn(
            "⚠️ Could not add ELRA logo to sales marketing report, falling back to text:",
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
      doc.text("Sales & Marketing Financial Report", 105, 35, {
        align: "center",
      });

      // Report details
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated for: ${req.user.firstName} ${req.user.lastName}`,
        20,
        45
      );
      doc.text(`Department: ${req.user.department?.name}`, 20, 52);
      doc.text(`Position: ${req.user.role?.name}`, 20, 59);
      doc.text(`Report Period: Last ${dateRange} days`, 20, 66);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 73);

      let yPosition = 85;

      // Executive Summary Table
      const summaryData = [
        [
          "Total Revenue",
          `NGN ${
            dashboardData.data.combined.totalRevenue?.toLocaleString() || 0
          }`,
        ],
        [
          "Total Expenses",
          `NGN ${
            dashboardData.data.combined.totalExpenses?.toLocaleString() || 0
          }`,
        ],
        [
          "Net Profit",
          `NGN ${dashboardData.data.combined.netProfit?.toLocaleString() || 0}`,
        ],
        [
          "Total Transactions",
          `${dashboardData.data.combined.totalTransactions || 0}`,
        ],
        [
          "Pending Approvals",
          `${dashboardData.data.combined.pendingApprovals || 0}`,
        ],
      ];

      autoTable(doc, {
        head: [["Executive Summary", "Amount"]],
        body: summaryData,
        startY: yPosition,
        theme: "grid",
        headStyles: {
          fillColor: elraGreen,
          fontSize: 12,
          fontStyle: "bold",
          textColor: [255, 255, 255],
          cellPadding: 6,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Sales Breakdown Table
      const salesData = [
        [
          "Sales Revenue",
          `NGN ${dashboardData.data.sales.totalRevenue?.toLocaleString() || 0}`,
        ],
        [
          "Sales Expenses",
          `NGN ${
            dashboardData.data.sales.totalExpenses?.toLocaleString() || 0
          }`,
        ],
        [
          "Sales Net",
          `NGN ${
            (
              dashboardData.data.sales.totalRevenue -
              dashboardData.data.sales.totalExpenses
            )?.toLocaleString() || 0
          }`,
        ],
        [
          "Completed Transactions",
          `${dashboardData.data.sales.completedTransactions || 0}`,
        ],
        [
          "Pending Transactions",
          `${dashboardData.data.sales.pendingTransactions || 0}`,
        ],
      ];

      autoTable(doc, {
        head: [["Sales Breakdown", "Amount"]],
        body: salesData,
        startY: yPosition,
        theme: "grid",
        headStyles: {
          fillColor: elraGreen,
          fontSize: 12,
          fontStyle: "bold",
          textColor: [255, 255, 255],
          cellPadding: 6,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Marketing Breakdown Table
      const marketingData = [
        [
          "Marketing Revenue",
          `NGN ${
            dashboardData.data.marketing.totalRevenue?.toLocaleString() || 0
          }`,
        ],
        [
          "Marketing Expenses",
          `NGN ${
            dashboardData.data.marketing.totalExpenses?.toLocaleString() || 0
          }`,
        ],
        [
          "Marketing Net",
          `NGN ${
            (
              dashboardData.data.marketing.totalRevenue -
              dashboardData.data.marketing.totalExpenses
            )?.toLocaleString() || 0
          }`,
        ],
        [
          "Completed Transactions",
          `${dashboardData.data.marketing.completedTransactions || 0}`,
        ],
        [
          "Pending Transactions",
          `${dashboardData.data.marketing.pendingTransactions || 0}`,
        ],
      ];

      autoTable(doc, {
        head: [["Marketing Breakdown", "Amount"]],
        body: marketingData,
        startY: yPosition,
        theme: "grid",
        headStyles: {
          fillColor: elraGreen,
          fontSize: 12,
          fontStyle: "bold",
          textColor: [255, 255, 255],
          cellPadding: 6,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Recent Transactions Table (if any exist)
      if (
        dashboardData.data.recentTransactions &&
        dashboardData.data.recentTransactions.length > 0
      ) {
        const recentTransactionsData = dashboardData.data.recentTransactions
          .slice(0, 10)
          .map((transaction) => [
            transaction.reference || "N/A",
            transaction.type || "N/A",
            `NGN ${transaction.amount?.toLocaleString() || 0}`,
            transaction.status || "N/A",
            new Date(
              transaction.requestedAt || transaction.createdAt
            ).toLocaleDateString(),
          ]);

        autoTable(doc, {
          head: [["Reference", "Type", "Amount", "Status", "Date"]],
          body: recentTransactionsData,
          startY: yPosition,
          theme: "grid",
          headStyles: {
            fillColor: elraGreen,
            fontSize: 10,
            fontStyle: "bold",
            textColor: [255, 255, 255],
            cellPadding: 4,
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 3,
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
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

      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sales-marketing-report-${
          new Date().toISOString().split("T")[0]
        }.pdf"`
      );
      res.send(Buffer.from(pdfBuffer));
    } else if (format.toLowerCase() === "csv") {
      // Generate comprehensive CSV content
      let csvContent = "ELRA Sales & Marketing Financial Report\n";
      csvContent += `Generated for: ${req.user.firstName} ${req.user.lastName}\n`;
      csvContent += `Department: ${req.user.department?.name}\n`;
      csvContent += `Position: ${req.user.role?.name}\n`;
      csvContent += `Report Period: Last ${dateRange} days\n`;
      csvContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

      // Executive Summary
      csvContent += "EXECUTIVE SUMMARY\n";
      csvContent += "Metric,Amount\n";
      csvContent += `Total Revenue,NGN ${
        dashboardData.data.combined.totalRevenue?.toLocaleString() || 0
      }\n`;
      csvContent += `Total Expenses,NGN ${
        dashboardData.data.combined.totalExpenses?.toLocaleString() || 0
      }\n`;
      csvContent += `Net Profit,NGN ${
        dashboardData.data.combined.netProfit?.toLocaleString() || 0
      }\n`;
      csvContent += `Total Transactions,${
        dashboardData.data.combined.totalTransactions || 0
      }\n`;
      csvContent += `Pending Approvals,${
        dashboardData.data.combined.pendingApprovals || 0
      }\n\n`;

      // Sales Breakdown
      csvContent += "SALES BREAKDOWN\n";
      csvContent += "Metric,Amount\n";
      csvContent += `Sales Revenue,NGN ${
        dashboardData.data.sales.totalRevenue?.toLocaleString() || 0
      }\n`;
      csvContent += `Sales Expenses,NGN ${
        dashboardData.data.sales.totalExpenses?.toLocaleString() || 0
      }\n`;
      csvContent += `Sales Net,NGN ${
        (
          dashboardData.data.sales.totalRevenue -
          dashboardData.data.sales.totalExpenses
        )?.toLocaleString() || 0
      }\n`;
      csvContent += `Completed Transactions,${
        dashboardData.data.sales.completedTransactions || 0
      }\n`;
      csvContent += `Pending Transactions,${
        dashboardData.data.sales.pendingTransactions || 0
      }\n\n`;

      // Marketing Breakdown
      csvContent += "MARKETING BREAKDOWN\n";
      csvContent += "Metric,Amount\n";
      csvContent += `Marketing Revenue,NGN ${
        dashboardData.data.marketing.totalRevenue?.toLocaleString() || 0
      }\n`;
      csvContent += `Marketing Expenses,NGN ${
        dashboardData.data.marketing.totalExpenses?.toLocaleString() || 0
      }\n`;
      csvContent += `Marketing Net,NGN ${
        (
          dashboardData.data.marketing.totalRevenue -
          dashboardData.data.marketing.totalExpenses
        )?.toLocaleString() || 0
      }\n`;
      csvContent += `Completed Transactions,${
        dashboardData.data.marketing.completedTransactions || 0
      }\n`;
      csvContent += `Pending Transactions,${
        dashboardData.data.marketing.pendingTransactions || 0
      }\n\n`;

      // Recent Transactions (if any exist)
      if (
        dashboardData.data.recentTransactions &&
        dashboardData.data.recentTransactions.length > 0
      ) {
        csvContent += "RECENT TRANSACTIONS\n";
        csvContent += "Reference,Type,Amount,Status,Date\n";
        dashboardData.data.recentTransactions
          .slice(0, 10)
          .forEach((transaction) => {
            csvContent += `${transaction.reference || "N/A"},${
              transaction.type || "N/A"
            },NGN ${transaction.amount?.toLocaleString() || 0},${
              transaction.status || "N/A"
            },${new Date(
              transaction.requestedAt || transaction.createdAt
            ).toLocaleDateString()}\n`;
          });
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sales-marketing-report-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.send(csvContent);
    } else if (format.toLowerCase() === "word") {
      // Generate comprehensive HTML content that can be opened in Word
      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ELRA Sales & Marketing Financial Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; color: #0d6449; margin-bottom: 30px; }
        .header h1 { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .header h2 { font-size: 18px; color: #333; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #0d6449; border-bottom: 2px solid #0d6449; padding-bottom: 5px; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #0d6449; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-item { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #0d6449; }
        .summary-item strong { color: #0d6449; font-size: 14px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
        .report-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ELRA</h1>
        <h2>Sales & Marketing Financial Report</h2>
    </div>

    <div class="report-info">
        <p><strong>Generated for:</strong> ${req.user.firstName} ${
        req.user.lastName
      }</p>
        <p><strong>Department:</strong> ${req.user.department?.name}</p>
        <p><strong>Position:</strong> ${req.user.role?.name}</p>
        <p><strong>Report Period:</strong> Last ${dateRange} days</p>
        <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Total Revenue</strong></td>
                    <td>NGN ${
                      dashboardData.data.combined.totalRevenue?.toLocaleString() ||
                      0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Total Expenses</strong></td>
                    <td>NGN ${
                      dashboardData.data.combined.totalExpenses?.toLocaleString() ||
                      0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Net Profit</strong></td>
                    <td>NGN ${
                      dashboardData.data.combined.netProfit?.toLocaleString() ||
                      0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Total Transactions</strong></td>
                    <td>${
                      dashboardData.data.combined.totalTransactions || 0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Pending Approvals</strong></td>
                    <td>${
                      dashboardData.data.combined.pendingApprovals || 0
                    }</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Sales Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Sales Revenue</strong></td>
                    <td>NGN ${
                      dashboardData.data.sales.totalRevenue?.toLocaleString() ||
                      0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Sales Expenses</strong></td>
                    <td>NGN ${
                      dashboardData.data.sales.totalExpenses?.toLocaleString() ||
                      0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Sales Net</strong></td>
                    <td>NGN ${
                      (
                        dashboardData.data.sales.totalRevenue -
                        dashboardData.data.sales.totalExpenses
                      )?.toLocaleString() || 0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Completed Transactions</strong></td>
                    <td>${
                      dashboardData.data.sales.completedTransactions || 0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Pending Transactions</strong></td>
                    <td>${
                      dashboardData.data.sales.pendingTransactions || 0
                    }</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Marketing Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Marketing Revenue</strong></td>
                    <td>NGN ${
                      dashboardData.data.marketing.totalRevenue?.toLocaleString() ||
                      0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Marketing Expenses</strong></td>
                    <td>NGN ${
                      dashboardData.data.marketing.totalExpenses?.toLocaleString() ||
                      0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Marketing Net</strong></td>
                    <td>NGN ${
                      (
                        dashboardData.data.marketing.totalRevenue -
                        dashboardData.data.marketing.totalExpenses
                      )?.toLocaleString() || 0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Completed Transactions</strong></td>
                    <td>${
                      dashboardData.data.marketing.completedTransactions || 0
                    }</td>
                </tr>
                <tr>
                    <td><strong>Pending Transactions</strong></td>
                    <td>${
                      dashboardData.data.marketing.pendingTransactions || 0
                    }</td>
                </tr>
            </tbody>
        </table>
    </div>

    ${
      dashboardData.data.recentTransactions &&
      dashboardData.data.recentTransactions.length > 0
        ? `
    <div class="section">
        <h2>Recent Transactions</h2>
        <table>
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${dashboardData.data.recentTransactions
                  .slice(0, 10)
                  .map(
                    (transaction) => `
                <tr>
                    <td>${transaction.reference || "N/A"}</td>
                    <td>${transaction.type || "N/A"}</td>
                    <td>NGN ${transaction.amount?.toLocaleString() || 0}</td>
                    <td>${transaction.status || "N/A"}</td>
                    <td>${new Date(
                      transaction.requestedAt || transaction.createdAt
                    ).toLocaleDateString()}</td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    </div>
    `
        : ""
    }

    <div class="footer">
        <p><strong>Report generated by ELRA Sales & Marketing System</strong></p>
        <p>For support, contact: support@elra.com</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
`;

      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sales-marketing-report-${
          new Date().toISOString().split("T")[0]
        }.html"`
      );
      res.send(htmlContent);
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported export format",
      });
    }
  } catch (error) {
    console.error("Error exporting Sales & Marketing report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export report",
      error: error.message,
    });
  }
};
