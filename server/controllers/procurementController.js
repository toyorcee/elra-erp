import Procurement from "../models/Procurement.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { sendEmail } from "../services/emailService.js";
import { generateProcurementOrderPDF } from "../utils/pdfUtils.js";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

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

  // Generate items list for email
  const itemsList = items
    .map(
      (item, index) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${index + 1}</td>
      <td style="padding: 12px; text-align: left;">${item.name}</td>
      <td style="padding: 12px; text-align: left;">${item.description}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">₦${item.unitPrice.toLocaleString()}</td>
      <td style="padding: 12px; text-align: right;">₦${item.totalPrice.toLocaleString()}</td>
    </tr>
  `
    )
    .join("");

  const emailSubject = `Purchase Order ${poNumber} - ${title}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Purchase Order ${poNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #0D6449 0%, #059669 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #0D6449; color: white; padding: 12px; text-align: left; }
        .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
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
        <h1>ELRA Procurement System</h1>
        <h2>Purchase Order ${poNumber}</h2>
      </div>
      
      <div class="content">
        <p>Dear ${supplier.contactPerson || "Supplier"},</p>
        
        <p>We are pleased to send you the following purchase order for your review and processing:</p>
        
        <div class="order-details">
          <h3>Order Information</h3>
          <p><strong>PO Number:</strong> ${poNumber}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Priority:</strong> <span class="priority-${priority}">${priority.toUpperCase()}</span></p>
          <p><strong>Total Amount:</strong> ₦${totalAmount.toLocaleString()}</p>
          <p><strong>Currency:</strong> NGN (Nigerian Naira)</p>
        </div>
        
        <h3>Items Required</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Item Name</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
        
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

    // Access control handled by middleware

    const procurementData = {
      ...req.body,
      createdBy: currentUser._id,
    };

    const procurement = new Procurement(procurementData);
    await procurement.save();

    // Populate the created procurement
    await procurement.populate("createdBy", "firstName lastName email");

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
      `\n📧 [PROCUREMENT] Preparing to send email and PDF to supplier...`
    );

    try {
      const emailResult = await sendProcurementEmailToSupplier(
        procurement,
        currentUser
      );
      console.log(`✅ [PROCUREMENT] Email and PDF sent successfully!`);
      console.log(`   - Recipient: ${supplier.email}`);
      console.log(`   - Message ID: ${emailResult.messageId || "N/A"}`);
      console.log(
        `   - PDF Attachment: Purchase_Order_${procurement.poNumber}.pdf`
      );
    } catch (emailError) {
      console.error(`❌ [PROCUREMENT] Email/PDF sending failed:`, emailError);
      console.error(`   - Error details: ${emailError.message}`);
      console.error(`   - Supplier email: ${supplier.email}`);
    }

    console.log(`\n🎯 [PROCUREMENT] What happens next:`);
    console.log(`   1. Supplier receives email with PDF purchase order`);
    console.log(`   2. Supplier reviews items and pricing`);
    console.log(`   3. Supplier can contact ELRA for clarifications`);
    console.log(`   4. Supplier confirms order acceptance`);
    console.log(`   5. Delivery scheduled for: ${expectedDeliveryDate}`);
    console.log(
      `   6. Order status will be updated to 'approved' upon supplier confirmation\n`
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

    res.status(200).json({
      success: true,
      message: "Procurement order marked as paid successfully",
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

    if (procurement.relatedProject) {
      try {
        console.log(
          `📦 [INVENTORY] Triggering inventory creation for project: ${procurement.relatedProject}`
        );

        const Project = mongoose.model("Project");
        const project = await Project.findById(procurement.relatedProject);

        if (project) {
          await project.createInventoryFromProcurement(
            procurement,
            currentUser
          );
          console.log(
            `✅ [INVENTORY] Inventory creation triggered successfully for project: ${project.name}`
          );
        }
      } catch (inventoryError) {
        console.error(
          "❌ [INVENTORY] Error triggering inventory creation:",
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
