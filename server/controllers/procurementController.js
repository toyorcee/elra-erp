import Procurement from "../models/Procurement.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { sendEmail } from "../services/emailService.js";
import { generateProcurementOrderPDF } from "../utils/pdfUtils.js";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import NotificationService from "../services/notificationService.js";
import AuditService from "../services/auditService.js";

// ============================================================================

// EMAIL FUNCTIONS

// ============================================================================

// Send procurement order email to supplier

const sendProcurementEmailToSupplier = async (procurement, currentUser) => {
  const { supplier, items, poNumber, title, totalAmount, priority } =
    procurement;

  let pdfBuffer = null;

  try {
    console.log(`📄 [PROCUREMENT] Generating PDF for PO: ${poNumber}...`);

    pdfBuffer = await generateProcurementOrderPDF(procurement, currentUser);

    console.log(
      `✅ [PROCUREMENT] PDF generated successfully for PO: ${poNumber}`
    );

    console.log(`   - PDF Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    console.log(`   - Filename: Purchase_Order_${poNumber}.pdf`);
  } catch (pdfError) {
    console.error(
      `❌ [PROCUREMENT] PDF generation failed for PO: ${poNumber}:`,

      pdfError
    );

    console.error(`   - Error: ${pdfError.message}`);

    // Continue without PDF if generation fails
  }

  // Items details are in the PDF attachment, not in email body

  const emailSubject = `Purchase Order ${poNumber} - ${title}`;

  const emailHtml = `

    <!DOCTYPE html>

    <html>

    <head>

      <meta charset="utf-8">

      <title>Purchase Order ${poNumber}</title>

      <style>

        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }

        .header { background: linear-gradient(135deg, #0D6449 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }

        .header h1 { margin: 0 0 5px 0; font-size: 32px; font-weight: bold; }

        .tagline { margin: 0 0 15px 0; }

        .tagline p { margin: 0; font-size: 16px; opacity: 0.9; font-weight: 300; letter-spacing: 1px; }

        .header h2 { margin: 0; font-size: 20px; opacity: 0.9; }

        .content { padding: 20px; }

        .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }

        .total-section { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }

        .contact-info { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }

        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }

        .priority-high { color: #dc2626; font-weight: bold; }

        .priority-urgent { color: #ea580c; font-weight: bold; }

        .priority-critical { color: #991b1b; font-weight: bold; }
        
        

      </style>

    </head>

    <body>

      <div class="header">

        <h1>ELRA</h1>

        <div class="tagline">

          <p>You Lease, We Regulate</p>

        </div>

        <h2>Purchase Order ${poNumber}</h2>

      </div>

      
      
      <div class="content">

        <p>Dear ${supplier.name},</p>

        
        
        <p>We are pleased to send you the following purchase order for your review and processing:</p>

        
        
        <div class="order-details">

          <h3>Order Information</h3>

          <p><strong>PO Number:</strong> ${poNumber}</p>

          <p><strong>Title:</strong> ${title}</p>

          <p><strong>Priority:</strong> <span class="priority-${priority}">${priority.toUpperCase()}</span></p>

          <p><strong>Total Amount:</strong> ₦${totalAmount.toLocaleString()}</p>

          <p><strong>Currency:</strong> NGN (Nigerian Naira)</p>

        </div>

        
        
        <p><strong>Items:</strong> ${
          items.length
        } item(s) - See attached PDF for detailed item specifications.</p>

        
        
        <div class="total-section">

          <h3>Order Summary</h3>

          <p><strong>Subtotal:</strong> ₦${procurement.subtotal.toLocaleString()}</p>

          <p><strong>Total Amount:</strong> ₦${totalAmount.toLocaleString()}</p>

        </div>

        
        
        <div class="contact-info">

          <h3>Contact Information & Next Steps</h3>

          <p><strong>For inquiries and order confirmation, please contact:</strong></p>

          <ul>

            <li><strong>Procurement HOD:</strong> ${currentUser.firstName} ${
    currentUser.lastName
  }</li>

            <li><strong>Email:</strong> ${currentUser.email}</li>

            <li><strong>Phone:</strong> +234 800 ELRA (3572)</li>

            <li><strong>Company:</strong> ELRA (Equipment Leasing Registration Authority)</li>

            <li><strong>Human Resources Department:</strong></li>

            <li><strong>Email:</strong> hod.hr@elra.com</li>

            <li><strong>Name:</strong> Lisa Davis</li>

            <li><strong>Procurement Department:</strong></li>

            <li><strong>Email:</strong> hod.proc@elra.com</li>

          </ul>

          
          
          <div class="contact-info">

            <h3>Next Steps</h3>

            <p><strong>Please respond within 48 hours with:</strong></p>

            <p>• Confirmation of order acceptance<br>

            • Expected delivery timeline<br>

            • Any questions or clarifications needed<br>

            • Invoice for payment processing<br>

            • <strong>Signed copy of this purchase order</strong></p>

            
            
            <p><strong>For inquiries and support:</strong></p>

            <p><strong>Human Resources Department:</strong> For any personnel-related queries<br>

            <strong>Procurement Department:</strong> For order modifications or clarifications</p>

            <p>Both departments will work together to ensure smooth order processing.</p>

          </div>

        </div>

        <p>We look forward to a successful business relationship.</p>
        
        <p>Best regards,<br>

        <strong>${currentUser.firstName} ${currentUser.lastName}</strong><br>

        Procurement HOD<br>

        ELRA (Equipment Leasing Registration Authority)</p>

      </div>
      
      <div class="footer">

        <p>This is an automated message from ELRA Procurement System. Please do not reply to this email.</p>

        <p>For support, contact: support@elra.com</p>

      </div>

    </body>

    </html>

  `;

  const emailOptions = {
    to: supplier.email,

    subject: emailSubject,

    html: emailHtml,
  };

  if (pdfBuffer) {
    emailOptions.attachments = [
      {
        filename: `Purchase_Order_${poNumber}.pdf`,

        content: pdfBuffer,

        contentType: "application/pdf",
      },
    ];
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",

    auth: {
      user: process.env.EMAIL_USER,

      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,

    to: emailOptions.to,

    subject: emailOptions.subject,

    html: emailOptions.html,

    attachments: emailOptions.attachments || [],
  };

  console.log(`📧 [PROCUREMENT] Sending email to supplier...`);

  console.log(`   - From: ${process.env.EMAIL_FROM}`);

  console.log(`   - To: ${supplier.email}`);

  console.log(`   - Subject: ${emailSubject}`);

  console.log(`   - Has PDF Attachment: ${pdfBuffer ? "Yes" : "No"}`);

  console.log(`   - Items in email: ${items.length}`);

  const result = await transporter.sendMail(mailOptions);

  console.log(`✅ [PROCUREMENT] Email sent successfully!`);

  console.log(`   - Message ID: ${result.messageId}`);

  console.log(`   - Response: ${result.response}`);

  console.log(`   - Accepted: ${result.accepted}`);

  console.log(`   - Rejected: ${result.rejected}`);

  return { success: true, messageId: result.messageId };
};

// ============================================================================

// PROCUREMENT CONTROLLERS

// ============================================================================

// @desc    Get all procurement (with role-based filtering)

// @route   GET /api/procurement

// @access  Private (HOD+)

export const getAllProcurement = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = { isActive: true };

    // SUPER_ADMIN (1000) - see all procurement across all departments

    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [PROCUREMENT] Super Admin - showing all procurement across all departments"
      );
    }

    // HOD (700) - see procurement in their department
    else if (currentUser.role.level >= 700) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,

          message: "You must be assigned to a department to view procurement",
        });
      }

      // Note: company field is commented out in Procurement model, so we show all procurement for HODs

      console.log(
        "🔍 [PROCUREMENT] HOD - showing all procurement (company field not implemented)"
      );
    }

    // STAFF (300) - see procurement they created
    else if (currentUser.role.level >= 300) {
      query.createdBy = currentUser._id;

      console.log("🔍 [PROCUREMENT] Staff - showing created procurement only");
    }

    // Others - no access
    else {
      return res.status(403).json({
        success: false,

        message: "Access denied. Insufficient permissions to view procurement.",
      });
    }

    const procurement = await Procurement.find(query)

      .populate("createdBy", "firstName lastName email")

      .populate("approvedBy", "firstName lastName email")

      .populate("markedAsIssuedBy", "firstName lastName email")

      .populate("markedAsPaidBy", "firstName lastName email")

      .populate("markedAsDeliveredBy", "firstName lastName email")

      .populate("relatedProject", "name code")

      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,

      data: procurement,

      total: procurement.length,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get all procurement error:", error);

    res.status(500).json({
      success: false,

      message: "Error fetching procurement",

      error: error.message,
    });
  }
};

// @desc    Get procurement by ID

// @route   GET /api/procurement/:id

// @access  Private (HOD+)

export const getProcurementById = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUser = req.user;

    const procurement = await Procurement.findById(id)

      .populate("createdBy", "firstName lastName email")

      .populate("approvedBy", "firstName lastName email")

      .populate("markedAsIssuedBy", "firstName lastName email")

      .populate("markedAsPaidBy", "firstName lastName email")

      .populate("markedAsDeliveredBy", "firstName lastName email")

      .populate("relatedProject", "name code")

      .populate("notes.author", "firstName lastName");

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement not found",
      });
    }

    // Check access permissions

    const hasAccess = await checkProcurementAccess(currentUser, procurement);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,

        message:
          "Access denied. You don't have permission to view this procurement.",
      });
    }

    res.status(200).json({
      success: true,

      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get procurement by ID error:", error);

    res.status(500).json({
      success: false,

      message: "Error fetching procurement",

      error: error.message,
    });
  }
};

// @desc    Create new procurement

// @route   POST /api/procurement

// @access  Private (HOD+)

export const createProcurement = async (req, res) => {
  try {
    const currentUser = req.user;

    const count = await Procurement.countDocuments();

    const poNumber = `PO${String(count + 1).padStart(4, "0")}`;

    const procurementData = {
      ...req.body,

      createdBy: currentUser._id,

      poNumber: poNumber,

      status: "pending",
    };

    console.log("🔢 [PO-NUMBER] Generated PO number:", poNumber);

    const procurement = new Procurement(procurementData);

    await procurement.save();

    await procurement.populate("createdBy", "firstName lastName email");

    // Notifications to stakeholders removed as requested

    console.log(
      `\n✅ [PROCUREMENT] Order created successfully - No emails sent`
    );
    console.log(`   - PO Number: ${procurement.poNumber}`);
    console.log(`   - Title: ${procurement.title}`);
    console.log(`   - Supplier: ${procurement.supplier.name}`);
    console.log(
      `   - Total Amount: ₦${procurement.totalAmount?.toLocaleString()}`
    );
    console.log(`   - Status: ${procurement.status}`);
    console.log(`\n🏢 [PROCUREMENT] Supplier Information:`);
    console.log(`   - Name: ${procurement.supplier.name}`);
    console.log(`   - Email: ${procurement.supplier.email}`);
    console.log(`   - Phone: ${procurement.supplier.phone}`);
    console.log(`   - Address: ${procurement.supplier.address}`);
    console.log(`\n🚚 [PROCUREMENT] Delivery Information:`);
    console.log(`   - Delivery Address: ${procurement.deliveryAddress}`);
    console.log(`\n💾 [PROCUREMENT] Database Save Status:`);
    console.log(`   - Document saved successfully`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    console.log(`   - Version: ${procurement.__v}`);

    // Audit: PROCUREMENT_CREATED
    try {
      await AuditService.logActivity({
        userId: currentUser._id,
        action: "PROCUREMENT_CREATED",
        resourceType: "PROCUREMENT",
        resourceId: procurement._id,
        details: {
          poNumber: procurement.poNumber,
          title: procurement.title,
          totalAmount: procurement.totalAmount,
          supplier: procurement.supplier?.name,
          standalone: !procurement.relatedProject,
        },
      });
    } catch (auditError) {
      console.error(
        "⚠️ [AUDIT] Failed to log PROCUREMENT_CREATED:",
        auditError
      );
    }

    res.status(201).json({
      success: true,

      message: "Procurement created successfully",
      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Create procurement error:", error);

    res.status(500).json({
      success: false,

      message: "Error creating procurement",

      error: error.message,
    });
  }
};

// @desc    Complete draft procurement order (add supplier details and send to supplier)

// @route   PUT /api/procurement/:id/complete

// @access  Private (HOD+)

export const completeProcurementOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUser = req.user;

    const { supplier, deliveryAddress, expectedDeliveryDate, notes } = req.body;

    // Access control handled by middleware

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement order not found",
      });
    }

    if (procurement.status !== "draft") {
      return res.status(400).json({
        success: false,

        message: "Only draft orders can be completed",
      });
    }

    procurement.supplier = {
      name: supplier.name,

      contactPerson: supplier.contactPerson,

      email: supplier.email,

      phone: supplier.phone,

      address: supplier.address || {},
    };

    procurement.deliveryAddress = deliveryAddress || {};

    procurement.expectedDeliveryDate = expectedDeliveryDate;

    procurement.status = "pending";

    procurement.approvedBy = currentUser._id;

    procurement.approvedDate = new Date();

    procurement.approvalNotes = notes || "Order completed by Procurement HOD";

    procurement.notes.push({
      content: `Order completed by ${currentUser.firstName} ${currentUser.lastName}.`,

      author: currentUser._id,

      createdAt: new Date(),

      isPrivate: false,
    });

    await procurement.save();

    await procurement.populate([
      { path: "createdBy", select: "firstName lastName email" },

      { path: "approvedBy", select: "firstName lastName email" },

      { path: "relatedProject", select: "name code" },
    ]);

    console.log(
      `\n🚀 [PROCUREMENT] Starting completion process for PO: ${procurement.poNumber}`
    );

    console.log(`📋 [PROCUREMENT] Order Details:`);

    console.log(`   - PO Number: ${procurement.poNumber}`);

    console.log(`   - Title: ${procurement.title}`);

    console.log(
      `   - Total Amount: ₦${procurement.totalAmount?.toLocaleString()}`
    );

    console.log(`   - Items Count: ${procurement.items?.length || 0}`);

    console.log(`   - Priority: ${procurement.priority}`);

    console.log(
      `   - Project: ${procurement.relatedProject?.name || "No Project"}`
    );

    console.log(`\n👤 [PROCUREMENT] Supplier Information:`);

    console.log(`   - Company: ${supplier.name}`);

    console.log(
      `   - Contact Person: ${supplier.contactPerson || "Not specified"}`
    );

    console.log(`   - Email: ${supplier.email}`);

    console.log(`   - Phone: ${supplier.phone || "Not specified"}`);

    console.log(`   - Expected Delivery: ${expectedDeliveryDate}`);

    console.log(
      `\n✅ [PROCUREMENT] Order completed successfully - No emails sent`
    );
    console.log(`   - Order status: ${procurement.status}`);
    console.log(`   - Supplier: ${supplier.name}`);
    console.log(`   - Expected delivery: ${expectedDeliveryDate}`);

    console.log(`\n📊 [PROCUREMENT] Model Data Verification:`);
    console.log(`   - Procurement ID: ${procurement._id}`);
    console.log(`   - PO Number: ${procurement.poNumber}`);
    console.log(`   - Title: ${procurement.title}`);
    console.log(
      `   - Total Amount: ₦${procurement.totalAmount?.toLocaleString()}`
    );
    console.log(`   - Status: ${procurement.status}`);
    console.log(`   - Priority: ${procurement.priority}`);
    console.log(
      `   - Created By: ${procurement.createdBy?.firstName} ${procurement.createdBy?.lastName}`
    );
    console.log(
      `   - Approved By: ${procurement.approvedBy?.firstName} ${procurement.approvedBy?.lastName}`
    );
    console.log(`   - Approved Date: ${procurement.approvedDate}`);
    console.log(
      `   - Related Project: ${
        procurement.relatedProject?.name || "No Project"
      }`
    );

    console.log(`\n🏢 [PROCUREMENT] Supplier Information Saved:`);
    console.log(`   - Name: ${procurement.supplier.name}`);
    console.log(`   - Contact Person: ${procurement.supplier.contactPerson}`);
    console.log(`   - Email: ${procurement.supplier.email}`);
    console.log(`   - Phone: ${procurement.supplier.phone}`);
    console.log(
      `   - Address: ${
        typeof procurement.supplier.address === "string"
          ? procurement.supplier.address
          : JSON.stringify(procurement.supplier.address)
      }`
    );

    console.log(`\n🚚 [PROCUREMENT] Delivery Information Saved:`);
    console.log(
      `   - Delivery Address: ${
        typeof procurement.deliveryAddress === "string"
          ? procurement.deliveryAddress
          : JSON.stringify(procurement.deliveryAddress)
      }`
    );
    console.log(
      `   - Expected Delivery Date: ${procurement.expectedDeliveryDate}`
    );

    console.log(`\n📝 [PROCUREMENT] Notes Added:`);
    console.log(`   - Approval Notes: ${procurement.approvalNotes}`);
    console.log(`   - Total Notes Count: ${procurement.notes.length}`);
    console.log(
      `   - Latest Note: ${
        procurement.notes[procurement.notes.length - 1]?.content
      }`
    );

    console.log(`\n💾 [PROCUREMENT] Database Save Status:`);
    console.log(`   - Document saved successfully`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    console.log(`   - Version: ${procurement.__v}`);

    console.log(`\n🎯 [PROCUREMENT] What happens next:`);

    console.log(`   1. Order is ready for supplier review`);
    console.log(`   2. Supplier can contact ELRA for clarifications`);
    console.log(`   3. Delivery scheduled for: ${expectedDeliveryDate}`);
    console.log(
      `   4. Order status will be updated to 'approved' upon supplier confirmation\n`
    );

    res.status(200).json({
      success: true,

      message: "Procurement order completed successfully",

      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Complete procurement order error:", error);

    res.status(500).json({
      success: false,

      message: "Error completing procurement order",

      error: error.message,
    });
  }
};

// @desc    Update procurement

// @route   PUT /api/procurement/:id

// @access  Private (HOD+)

export const updateProcurement = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUser = req.user;

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement not found",
      });
    }

    // Check access permissions

    const canEdit = await checkProcurementEditAccess(currentUser, procurement);

    if (!canEdit) {
      return res.status(403).json({
        success: false,

        message:
          "Access denied. You don't have permission to edit this procurement.",
      });
    }

    const updatedProcurement = await Procurement.findByIdAndUpdate(
      id,

      {
        ...req.body,

        updatedBy: currentUser._id,
      },

      { new: true, runValidators: true }
    )

      .populate("createdBy", "firstName lastName email")

      .populate("approvedBy", "firstName lastName email");

    res.status(200).json({
      success: true,

      message: "Procurement updated successfully",

      data: updatedProcurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Update procurement error:", error);

    res.status(500).json({
      success: false,

      message: "Error updating procurement",

      error: error.message,
    });
  }
};

// @desc    Delete procurement

// @route   DELETE /api/procurement/:id

// @access  Private (HOD+)

export const deleteProcurement = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUser = req.user;

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement not found",
      });
    }

    // Check access permissions

    const canDelete = await checkProcurementDeleteAccess(
      currentUser,

      procurement
    );

    if (!canDelete) {
      return res.status(403).json({
        success: false,

        message:
          "Access denied. You don't have permission to delete this procurement.",
      });
    }

    // Soft delete

    procurement.isActive = false;

    procurement.updatedBy = currentUser._id;

    await procurement.save();

    res.status(200).json({
      success: true,

      message: "Procurement deleted successfully",
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Delete procurement error:", error);

    res.status(500).json({
      success: false,

      message: "Error deleting procurement",

      error: error.message,
    });
  }
};

// @desc    Get procurement statistics

// @route   GET /api/procurement/stats

// @access  Private (HOD+)

export const getProcurementStats = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = { isActive: true };

    // Apply role-based filtering

    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD can see all procurement (no company filtering since it's ELRA system)

        console.log("🔍 [PROCUREMENT] HOD - showing all procurement");
      } else {
        query.createdBy = currentUser._id;
      }
    }

    const stats = await Procurement.getProcurementStats();

    const totalProcurement = await Procurement.countDocuments(query);

    res.status(200).json({
      success: true,

      data: {
        stats,

        totalProcurement,
      },
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get stats error:", error);

    res.status(500).json({
      success: false,

      message: "Error fetching procurement statistics",

      error: error.message,
    });
  }
};

// @desc    Get pending approvals

// @route   GET /api/procurement/pending-approvals

// @access  Private (HOD+)

export const getPendingApprovals = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = { isActive: true, status: "pending" };

    // Apply role-based filtering

    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD can see all procurement (no company filtering since it's ELRA system)

        console.log("🔍 [PROCUREMENT] HOD - showing all pending approvals");
      } else {
        query.createdBy = currentUser._id;
      }
    }

    const pendingApprovals = await Procurement.getPendingApprovals();

    res.status(200).json({
      success: true,

      data: pendingApprovals,

      total: pendingApprovals.length,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get pending approvals error:", error);

    res.status(500).json({
      success: false,

      message: "Error fetching pending approvals",

      error: error.message,
    });
  }
};

// @desc    Get overdue deliveries

// @route   GET /api/procurement/overdue-deliveries

// @access  Private (HOD+)

export const getOverdueDeliveries = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = { isActive: true };

    // Apply role-based filtering

    if (currentUser.role.level < 1000) {
      if (currentUser.role.level >= 700) {
        // HOD can see all procurement (no company filtering since it's ELRA system)

        console.log("🔍 [PROCUREMENT] HOD - showing all overdue deliveries");
      } else {
        query.createdBy = currentUser._id;
      }
    }

    const overdueDeliveries = await Procurement.getOverdueDeliveries();

    res.status(200).json({
      success: true,

      data: overdueDeliveries,

      total: overdueDeliveries.length,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Get overdue deliveries error:", error);

    res.status(500).json({
      success: false,

      message: "Error fetching overdue deliveries",

      error: error.message,
    });
  }
};

// @desc    Approve procurement

// @route   POST /api/procurement/:id/approve

// @access  Private (HOD+)

export const approve = async (req, res) => {
  try {
    const { id } = req.params;

    const { approvalNotes } = req.body;

    const currentUser = req.user;

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement not found",
      });
    }

    // Check access permissions

    const canApprove = await checkProcurementEditAccess(
      currentUser,

      procurement
    );

    if (!canApprove) {
      return res.status(403).json({
        success: false,

        message:
          "Access denied. You don't have permission to approve this procurement.",
      });
    }

    await procurement.approve(currentUser._id, approvalNotes);

    res.status(200).json({
      success: true,

      message: "Procurement approved successfully",

      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Approve procurement error:", error);

    res.status(500).json({
      success: false,

      message: "Error approving procurement",

      error: error.message,
    });
  }
};

// @desc    Receive items

// @route   POST /api/procurement/:id/receive

// @access  Private (HOD+)

export const receiveItems = async (req, res) => {
  try {
    const { id } = req.params;

    const { receivedItems, receiptNotes } = req.body;

    const currentUser = req.user;

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement not found",
      });
    }

    // Check access permissions

    const canReceive = await checkProcurementEditAccess(
      currentUser,

      procurement
    );

    if (!canReceive) {
      return res.status(403).json({
        success: false,

        message:
          "Access denied. You don't have permission to receive items for this procurement.",
      });
    }

    await procurement.receiveItems(
      receivedItems,

      receiptNotes,

      currentUser._id
    );

    res.status(200).json({
      success: true,

      message: "Items received successfully",

      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Receive items error:", error);

    res.status(500).json({
      success: false,

      message: "Error receiving items",

      error: error.message,
    });
  }
};

// @desc    Add note to procurement

// @route   POST /api/procurement/:id/notes

// @access  Private (HOD+)

export const addNote = async (req, res) => {
  try {
    const { id } = req.params;

    const { content, isPrivate = false } = req.body;

    const currentUser = req.user;

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement not found",
      });
    }

    // Check access permissions

    const hasAccess = await checkProcurementAccess(currentUser, procurement);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,

        message:
          "Access denied. You don't have permission to access this procurement.",
      });
    }

    await procurement.addNote(content, currentUser._id, isPrivate);

    res.status(200).json({
      success: true,

      message: "Note added successfully",

      data: procurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Add note error:", error);

    res.status(500).json({
      success: false,

      message: "Error adding note",

      error: error.message,
    });
  }
};

// ============================================================================

// HELPER FUNCTIONS

// ============================================================================

// Check if user has access to view procurement

const checkProcurementAccess = async (user, procurement) => {
  // SUPER_ADMIN can access everything

  if (user.role.level >= 1000) return true;

  // HOD can access all procurement (ELRA system)

  if (user.role.level >= 700) {
    return true;
  }

  // STAFF can access procurement they created

  if (user.role.level >= 300) {
    return procurement.createdBy.toString() === user._id.toString();
  }

  return false;
};

// Check if user can edit procurement

const checkProcurementEditAccess = async (user, procurement) => {
  // SUPER_ADMIN can edit everything

  if (user.role.level >= 1000) return true;

  // HOD can edit all procurement (ELRA system)

  if (user.role.level >= 700) {
    return true;
  }

  // STAFF can only edit procurement they created

  if (user.role.level >= 300) {
    return procurement.createdBy.toString() === user._id.toString();
  }

  return false;
};

// Check if user can delete procurement

const checkProcurementDeleteAccess = async (user, procurement) => {
  // SUPER_ADMIN can delete everything

  if (user.role.level >= 1000) return true;

  // HOD can delete any procurement (ELRA system)

  if (user.role.level >= 700) {
    return true;
  }

  return false;
};

// @desc    Resend procurement email to supplier

// @route   POST /api/procurement/:id/resend-email

// @access  Private (HOD+)

export const resendProcurementEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUser = req.user;

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement order not found",
      });
    }

    if (!procurement.supplier?.email) {
      return res.status(400).json({
        success: false,

        message: "No supplier email found for this procurement order",
      });
    }

    console.log(
      `\n🔄 [PROCUREMENT] Resending email for PO: ${procurement.poNumber}`
    );

    console.log(`   - Supplier: ${procurement.supplier.email}`);

    console.log(
      `   - Resent by: ${currentUser.firstName} ${currentUser.lastName}`
    );

    const emailResult = await sendProcurementEmailToSupplier(
      procurement,

      currentUser
    );

    if (emailResult.success) {
      console.log(`✅ [PROCUREMENT] Email resent successfully!`);

      console.log(`   - Recipient: ${procurement.supplier.email}`);

      console.log(`   - Message ID: ${emailResult.messageId || "N/A"}`);

      res.status(200).json({
        success: true,

        message: "Email resent successfully to supplier",

        data: {
          messageId: emailResult.messageId,

          recipient: procurement.supplier.email,

          resentAt: new Date(),

          resentBy: {
            id: currentUser._id,

            name: `${currentUser.firstName} ${currentUser.lastName}`,
          },
        },
      });
    } else {
      console.error(`❌ [PROCUREMENT] Email resend failed:`, emailResult.error);

      res.status(500).json({
        success: false,

        message: "Failed to resend email",

        error: emailResult.error,
      });
    }
  } catch (error) {
    console.error("❌ [PROCUREMENT] Resend email error:", error);

    res.status(500).json({
      success: false,

      message: "Error resending email",

      error: error.message,
    });
  }
};

// @desc    Mark procurement order as issued (supplier confirmed)

// @route   PUT /api/procurement/:id/mark-issued

// @access  Private (Procurement HOD+)

export const markAsIssued = async (req, res) => {
  try {
    const currentUser = req.user;

    const { id } = req.params;

    const { confirmationNotes } = req.body;

    console.log(
      `\n📋 [PROCUREMENT] Marking as issued - PO ID: ${id} by ${currentUser.firstName} ${currentUser.lastName}`
    );

    // Find the procurement order

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement order not found",
      });
    }

    // Check if already issued

    if (procurement.status === "issued") {
      return res.status(400).json({
        success: false,

        message: "This procurement order is already marked as issued",
      });
    }

    // Check if order is in a valid state to be marked as issued

    if (procurement.status !== "pending") {
      return res.status(400).json({
        success: false,

        message: "Only pending orders can be marked as issued",
      });
    }

    // Update the procurement order

    procurement.status = "issued";

    procurement.issuedDate = new Date();

    procurement.markedAsIssuedBy = currentUser._id;

    procurement.updatedBy = currentUser._id;

    // Add confirmation note if provided

    if (confirmationNotes) {
      procurement.notes.push({
        content: `Order confirmed by supplier: ${confirmationNotes}`,

        author: currentUser._id,

        isPrivate: false,
      });
    } else {
      procurement.notes.push({
        content: "Order confirmed by supplier and marked as issued",

        author: currentUser._id,

        isPrivate: false,
      });
    }

    await procurement.save();

    // Populate the updated procurement order

    const updatedProcurement = await Procurement.findById(id).populate([
      { path: "createdBy", select: "firstName lastName email" },

      { path: "approvedBy", select: "firstName lastName email" },

      { path: "markedAsIssuedBy", select: "firstName lastName email" },

      { path: "relatedProject", select: "name code" },
    ]);

    console.log(
      `✅ [PROCUREMENT] Order ${procurement.poNumber} marked as issued successfully`
    );

    // Audit: PROCUREMENT_MARKED_ISSUED
    try {
      await AuditService.logActivity({
        userId: currentUser._id,
        action: "PROCUREMENT_MARKED_ISSUED",
        resourceType: "PROCUREMENT",
        resourceId: procurement._id,
        details: {
          poNumber: procurement.poNumber,
          notes: confirmationNotes || null,
        },
      });
    } catch (auditError) {
      console.error(
        "⚠️ [AUDIT] Failed to log PROCUREMENT_MARKED_ISSUED:",
        auditError
      );
    }

    res.status(200).json({
      success: true,

      message: "Procurement order marked as issued successfully",

      data: updatedProcurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Error marking as issued:", error);

    res.status(500).json({
      success: false,

      message: "Internal server error",

      error: error.message,
    });
  }
};

// @desc    Mark procurement order as paid

// @route   PUT /api/procurement/:id/mark-paid

// @access  Private (Procurement HOD+)

export const markAsPaid = async (req, res) => {
  try {
    const currentUser = req.user;

    const { id } = req.params;

    const { paymentNotes, paymentMethod } = req.body;

    console.log(
      `\n💰 [PROCUREMENT] Marking as paid - PO ID: ${id} by ${currentUser.firstName} ${currentUser.lastName}`
    );

    // Find the procurement order

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement order not found",
      });
    }

    // Check if already paid

    if (procurement.status === "paid") {
      return res.status(400).json({
        success: false,

        message: "This procurement order is already marked as paid",
      });
    }

    // Check if order is in a valid state to be marked as paid

    if (!["issued"].includes(procurement.status)) {
      return res.status(400).json({
        success: false,

        message: "Only issued orders can be marked as paid",
      });
    }

    // Update the procurement order

    procurement.status = "paid";

    procurement.paidAmount = procurement.totalAmount;

    procurement.paymentDate = new Date();

    procurement.markedAsPaidBy = currentUser._id;

    procurement.updatedBy = currentUser._id;

    // Add payment note if provided

    if (paymentNotes) {
      procurement.notes.push({
        content: `Payment completed: ${paymentNotes}`,

        author: currentUser._id,

        isPrivate: false,
      });
    } else {
      procurement.notes.push({
        content: "Order marked as paid",

        author: currentUser._id,

        isPrivate: false,
      });
    }

    await procurement.save();

    // Move funds from reserved to used when procurement is marked as paid (ATOMIC)

    if (procurement.relatedProject) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          console.log(
            `💰 [PROCUREMENT] Moving funds from reserved to used for project ${
              procurement.relatedProject
            } - Amount: ₦${procurement.totalAmount.toLocaleString()}`
          );

          const ELRAWallet = (await import("../models/ELRAWallet.js")).default;

          const wallet = await ELRAWallet.findOne({
            elraInstance: "ELRA_MAIN",
          }).session(session);

          if (wallet) {
            // Find the project transaction in reserved funds

            const projectTransaction = wallet.transactions.find(
              (t) =>
                t.referenceId?.toString() ===
                  procurement.relatedProject.toString() &&
                t.referenceType === "project" &&
                t.type === "allocation"
            );

            if (projectTransaction) {
              const category = wallet.budgetCategories.projects;

              const amountToMove = Math.min(
                procurement.totalAmount,

                projectTransaction.amount
              );

              console.log(
                `💰 [PROCUREMENT] BEFORE: Available ₦${category.available.toLocaleString()}, Reserved ₦${category.reserved.toLocaleString()}, Used ₦${category.used.toLocaleString()}`
              );

              // Atomic fund movement

              category.reserved -= amountToMove;

              category.used += amountToMove;

              console.log(
                `💰 [PROCUREMENT] AFTER: Available ₦${category.available.toLocaleString()}, Reserved ₦${category.reserved.toLocaleString()}, Used ₦${category.used.toLocaleString()}`
              );

              // Add transaction record

              wallet.transactions.push({
                type: "withdrawal",

                amount: amountToMove,

                description: `Procurement Payment: ${procurement.poNumber} - Funds moved from reserved to used`,

                reference: procurement.poNumber,

                referenceId: procurement._id,

                referenceType: "project",

                createdBy: currentUser._id,

                balanceAfter: wallet.availableFunds,

                date: new Date(),
              });

              await wallet.save({ session });

              console.log(
                `✅ [PROCUREMENT] Successfully moved ₦${amountToMove.toLocaleString()} from reserved to used for PO ${
                  procurement.poNumber
                }`
              );

              // Notify Finance HOD about fund movement

              try {
                const NotificationService = (
                  await import("../services/notificationService.js")
                ).default;

                const notification = new NotificationService();

                // Find Finance HOD

                const User = (await import("../models/User.js")).default;

                const financeHOD = await User.findOne({
                  "department.name": "Finance & Accounting",

                  "role.level": { $gte: 700 },
                }).populate("role department");

                if (financeHOD) {
                  await notification.createNotification({
                    recipient: financeHOD._id,

                    type: "FUNDS_MOVED_TO_USED",

                    title: "Funds Moved from Reserved to Used",

                    message: `₦${amountToMove.toLocaleString()} has been moved from reserved to used for Procurement Order ${
                      procurement.poNumber
                    } (Project: ${procurement.relatedProject})`,

                    priority: "medium",

                    data: {
                      procurementId: procurement._id,

                      poNumber: procurement.poNumber,

                      projectId: procurement.relatedProject,

                      amount: amountToMove,

                      movedBy: currentUser._id,

                      movedAt: new Date(),
                    },
                  });

                  console.log(
                    `📧 [PROCUREMENT] Finance HOD notified about fund movement: ${financeHOD.firstName} ${financeHOD.lastName}`
                  );
                } else {
                  console.log(
                    `⚠️ [PROCUREMENT] Finance HOD not found to notify about fund movement`
                  );
                }
              } catch (notificationError) {
                console.error(
                  `❌ [PROCUREMENT] Error notifying Finance HOD:`,

                  notificationError
                );

                // Don't throw error to avoid breaking the transaction
              }
            } else {
              console.log(
                `⚠️ [PROCUREMENT] No reserved funds found for project ${procurement.relatedProject}`
              );
            }
          }
        });
      } catch (walletError) {
        console.error(
          `❌ [PROCUREMENT] Error moving funds from reserved to used:`,

          walletError
        );

        // Don't throw error to avoid breaking the payment process
      } finally {
        await session.endSession();
      }
    }

    // Create transaction record for audit trail

    try {
      const paymentData = {
        procurementOrder: procurement._id,

        amount: procurement.totalAmount,

        currency: procurement.currency || "NGN",

        description: `Payment for Procurement Order ${procurement.poNumber}`,

        paymentMethod: paymentMethod || "manual",

        supplier: {
          name: procurement.supplier.name,

          email: procurement.supplier.email,

          contactPerson: procurement.supplier.contactPerson,

          phone: procurement.supplier.phone,
        },

        processedBy: currentUser._id,

        notes: paymentNotes || "Payment marked as completed",
      };

      await Transaction.createProcurementPayment(paymentData);

      console.log(
        `✅ [TRANSACTION] Payment transaction created for PO: ${procurement.poNumber}`
      );
    } catch (transactionError) {
      console.error(
        "❌ [TRANSACTION] Error creating payment transaction:",

        transactionError
      );
    }

    const updatedProcurement = await Procurement.findById(id)

      .populate("createdBy", "firstName lastName email")

      .populate("approvedBy", "firstName lastName email")

      .populate("markedAsPaidBy", "firstName lastName email")

      .populate("relatedProject", "name code");

    console.log(
      `✅ [PROCUREMENT] Successfully marked as paid - PO: ${procurement.poNumber}`
    );

    // Audit: PROCUREMENT_MARKED_PAID
    try {
      await AuditService.logActivity({
        userId: currentUser._id,
        action: "PROCUREMENT_MARKED_PAID",
        resourceType: "PROCUREMENT",
        resourceId: procurement._id,
        details: {
          poNumber: procurement.poNumber,
          method: paymentMethod || "manual",
          amount: procurement.totalAmount,
        },
      });
    } catch (auditError) {
      console.error(
        "⚠️ [AUDIT] Failed to log PROCUREMENT_MARKED_PAID:",
        auditError
      );
    }

    res.status(200).json({
      success: true,

      message:
        "Procurement order marked as paid successfully. Funds have been moved from reserved to used in the ELRA wallet.",

      data: updatedProcurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Mark as paid error:", error);

    res.status(500).json({
      success: false,

      message: "Error marking procurement order as paid",

      error: error.message,
    });
  }
};

// @desc    Mark procurement order as delivered

// @route   PUT /api/procurement/:id/mark-delivered

// @access  Private (Procurement HOD+)

export const markAsDelivered = async (req, res) => {
  try {
    const currentUser = req.user;

    const { id } = req.params;

    const { deliveryNotes } = req.body;

    console.log(
      `\n📦 [PROCUREMENT] Marking as delivered - PO ID: ${id} by ${currentUser.firstName} ${currentUser.lastName}`
    );

    // Find the procurement order

    const procurement = await Procurement.findById(id);

    if (!procurement) {
      return res.status(404).json({
        success: false,

        message: "Procurement order not found",
      });
    }

    // Check if already delivered

    if (procurement.status === "delivered") {
      return res.status(400).json({
        success: false,

        message: "This procurement order is already marked as delivered",
      });
    }

    // Check if order is in a valid state to be marked as delivered

    if (!["paid", "issued"].includes(procurement.status)) {
      return res.status(400).json({
        success: false,

        message: "Only paid or issued orders can be marked as delivered",
      });
    }

    // Update the procurement order

    procurement.status = "delivered";

    procurement.actualDeliveryDate = new Date();

    procurement.markedAsDeliveredBy = currentUser._id;

    procurement.updatedBy = currentUser._id;

    // Add delivery note if provided

    if (deliveryNotes) {
      procurement.notes.push({
        content: `Delivery completed: ${deliveryNotes}`,

        author: currentUser._id,

        isPrivate: false,
      });
    } else {
      procurement.notes.push({
        content: "Order marked as delivered",

        author: currentUser._id,

        isPrivate: false,
      });
    }

    await procurement.save();

    // Populate the updated procurement order

    const updatedProcurement = await Procurement.findById(id)

      .populate("createdBy", "firstName lastName email")

      .populate("approvedBy", "firstName lastName email")

      .populate("markedAsPaidBy", "firstName lastName email")

      .populate("markedAsDeliveredBy", "firstName lastName email")

      .populate("relatedProject", "name code");

    console.log(
      `✅ [PROCUREMENT] Successfully marked as delivered - PO: ${procurement.poNumber}`
    );

    // Audit: PROCUREMENT_MARKED_DELIVERED
    try {
      await AuditService.logActivity({
        userId: currentUser._id,
        action: "PROCUREMENT_MARKED_DELIVERED",
        resourceType: "PROCUREMENT",
        resourceId: procurement._id,
        details: {
          poNumber: procurement.poNumber,
          notes: deliveryNotes || null,
          standalone: !procurement.relatedProject,
        },
      });
    } catch (auditError) {
      console.error(
        "⚠️ [AUDIT] Failed to log PROCUREMENT_MARKED_DELIVERED:",
        auditError
      );
    }

    if (procurement.relatedProject) {
      try {
        console.log(
          `📦 [INVENTORY] Triggering inventory creation for project: ${procurement.relatedProject}`
        );

        const Project = mongoose.model("Project");

        const project = await Project.findById(procurement.relatedProject);

        if (project) {
          console.log(
            `🔍 [DEBUG] Project before inventory creation: ${project.code} - Status: ${project.status}`
          );

          await project.createInventoryFromProcurement(
            procurement,
            currentUser
          );

          console.log(
            `✅ [INVENTORY] Inventory creation triggered successfully for project: ${project.name}`
          );

          // Reload project to check final status
          const updatedProject = await Project.findById(
            procurement.relatedProject
          );
          console.log(
            `🔍 [DEBUG] Project after inventory creation: ${updatedProject.code} - Status: ${updatedProject.status}`
          );
        }
      } catch (inventoryError) {
        console.error(
          "❌ [INVENTORY] Error triggering inventory creation:",

          inventoryError
        );
      }
    } else {
      // Handle standalone procurement - trigger inventory creation

      try {
        console.log(
          `📦 [INVENTORY] Triggering standalone inventory creation for PO: ${procurement.poNumber}`
        );

        // Import inventory controller dynamically to avoid circular dependency

        const { createInventoryFromProcurement } = await import(
          "./inventoryController.js"
        );

        await createInventoryFromProcurement(procurement, currentUser);

        console.log(
          `✅ [INVENTORY] Standalone inventory creation completed for PO: ${procurement.poNumber}`
        );
      } catch (inventoryError) {
        console.error(
          "❌ [INVENTORY] Error creating standalone inventory:",

          inventoryError
        );
      }
    }

    res.status(200).json({
      success: true,

      message: "Procurement order marked as delivered successfully",

      data: updatedProcurement,
    });
  } catch (error) {
    console.error("❌ [PROCUREMENT] Mark as delivered error:", error);

    res.status(500).json({
      success: false,

      message: "Error marking procurement order as delivered",

      error: error.message,
    });
  }
};

// @desc    Export procurement reports as PDF
// @route   GET /api/procurement/reports/export/pdf
// @access  Private (HOD+)
export const exportProcurementReport = async (req, res) => {
  try {
    const { reportType = "monthly", period } = req.query;
    const currentUser = req.user;

    // Get procurement data based on filters
    let query = { isActive: true };

    // Apply date filters based on period
    if (period) {
      if (reportType === "monthly") {
        const [month, year] = period.split("/");
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        query.createdAt = { $gte: startDate, $lte: endDate };
      } else if (reportType === "yearly") {
        const startDate = new Date(period, 0, 1);
        const endDate = new Date(period, 11, 31, 23, 59, 59);
        query.createdAt = { $gte: startDate, $lte: endDate };
      }
    }

    // Role-based filtering
    if (currentUser.role.level >= 1000) {
      // Super Admin - see all
    } else if (currentUser.role.level >= 700) {
      // HOD - see all procurement
    } else if (currentUser.role.level >= 300) {
      query.createdBy = currentUser._id;
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    const procurement = await Procurement.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("relatedProject", "name code")
      .sort({ createdAt: -1 });

    // Generate PDF using jsPDF
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // ELRA Branding
    const elraGreen = [13, 100, 73];

    // Try to add ELRA logo
    try {
      const fs = await import("fs");
      const path = await import("path");
      const logoPath = path.join(
        process.cwd(),
        "server",
        "assets",
        "images",
        "elra-logo.jpg"
      );

      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const base64Logo = logoData.toString("base64");
        doc.addImage(
          `data:image/jpeg;base64,${base64Logo}`,
          "JPEG",
          85,
          15,
          20,
          20
        );
      }
    } catch (logoError) {
      console.warn(
        "Could not add ELRA logo to procurement report:",
        logoError.message
      );
    }

    doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("ELRA", 105, 30, { align: "center" });

    // Reset to black for other text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Procurement Report", 105, 40, { align: "center" });

    // Report details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated for: ${currentUser.firstName} ${currentUser.lastName}`,
      20,
      55
    );
    doc.text(`Department: ${currentUser.department?.name || "N/A"}`, 20, 62);
    doc.text(`Position: ${currentUser.role?.name}`, 20, 69);
    doc.text(`Report Type: ${reportType.toUpperCase()}`, 20, 76);
    doc.text(`Period: ${period}`, 20, 83);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 90);

    let yPosition = 105;

    const totalPOs = procurement.length;
    const totalAmount = procurement.reduce(
      (sum, po) => sum + (parseFloat(po.totalAmount) || 0),
      0
    );
    const projectTiedPOs = procurement.filter((po) => po.relatedProject).length;
    const standalonePOs = procurement.filter((po) => !po.relatedProject).length;

    const summaryData = [
      ["Total Purchase Orders", totalPOs.toString()],
      ["Total Amount", `₦${totalAmount.toLocaleString()}`],
      ["Project-tied POs", projectTiedPOs.toString()],
      ["Standalone POs", standalonePOs.toString()],
    ];

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Summary Statistics", 20, yPosition);
    yPosition += 10;

    const formattedSummaryData = summaryData.map(([metric, value]) => [
      metric,
      metric.includes("Amount")
        ? `NGN ${parseInt(
            value.toString().replace(/[₦,]/g, "") || 0
          ).toLocaleString()}`
        : value,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Metric", "Value"]],
      body: formattedSummaryData,
      theme: "grid",
      headStyles: { fillColor: elraGreen },
      styles: { fontSize: 10 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Status Breakdown
    const statusBreakdown = {};
    procurement.forEach((po) => {
      statusBreakdown[po.status] = (statusBreakdown[po.status] || 0) + 1;
    });

    const statusData = Object.entries(statusBreakdown).map(
      ([status, count]) => [status.toUpperCase(), count.toString()]
    );

    doc.text("Status Breakdown", 20, yPosition);
    yPosition += 10;

    autoTable(doc, {
      startY: yPosition,
      head: [["Status", "Count"]],
      body: statusData,
      theme: "grid",
      headStyles: { fillColor: elraGreen },
      styles: { fontSize: 10 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Recent Purchase Orders Table
    if (procurement.length > 0) {
      doc.text("Recent Purchase Orders", 20, yPosition);
      yPosition += 10;

      const poData = procurement
        .slice(0, 20)
        .map((po) => [
          po.poNumber,
          po.title,
          po.supplier?.name || "N/A",
          `NGN ${(po.totalAmount || 0).toLocaleString()}`,
          po.status.toUpperCase(),
          new Date(po.createdAt).toLocaleDateString(),
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [
          ["PO Number", "Title", "Supplier", "Amount", "Status", "Created"],
        ],
        body: poData,
        theme: "grid",
        headStyles: { fillColor: elraGreen },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
        },
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount} - Generated by ELRA Procurement System`,
        105,
        290,
        { align: "center" }
      );
    }

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="procurement-report-${reportType}-${
        period || "all"
      }.pdf"`
    );

    const pdfBuffer = doc.output("arraybuffer");
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("❌ [PROCUREMENT] Export report error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating procurement report",
      error: error.message,
    });
  }
};
