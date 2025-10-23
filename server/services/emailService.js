import nodemailer from "nodemailer";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to load certificate images
const loadEmailImage = (imageName) => {
  try {
    const imagePath = path.resolve(__dirname, "../assets/images", imageName);
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      return `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    }
  } catch (error) {
    console.warn(`⚠️ Could not load image ${imageName}:`, error.message);
  }
  return null;
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Fetch admin emails from system
const fetchAdminEmails = async () => {
  try {
    const User = mongoose.model("User");
    const Department = mongoose.model("Department");

    const hrDept = await Department.findOne({ name: "Human Resources" });
    const projectDept = await Department.findOne({
      name: "Project Management",
    });

    const adminEmails = [];

    if (hrDept) {
      // Find ALL users with role level 700 in HR department
      const hrHods = await User.find({
        department: hrDept._id,
        "role.level": 700,
      }).populate("role");

      hrHods.forEach((hod) => {
        if (hod && hod.email) {
          adminEmails.push({ name: "HR HOD", email: hod.email });
        }
      });
    }

    if (projectDept) {
      // Find ALL users with role level 700 in Project Management department
      const projectHods = await User.find({
        department: projectDept._id,
        "role.level": 700,
      }).populate("role");

      projectHods.forEach((hod) => {
        if (hod && hod.email) {
          adminEmails.push({
            name: "Project Management HOD",
            email: hod.email,
          });
        }
      });
    }

    return adminEmails;
  } catch (error) {
    console.error("Error fetching admin emails:", error);
    return [];
  }
};

const createEmailTemplate = (
  title,
  content,
  actionText,
  actionUrl,
  footerText
) => {
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
        <title>${title}</title>
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
        .action-button {
          display: inline-block;
                background: #0d6449;
          color: white !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
                text-align: center;
          margin: 24px 0;
          border: none;
          cursor: pointer;
        }
            .info-box {
                background: #ffffff;
                border: 2px solid #0d6449;
                border-radius: 8px;
                padding: 24px;
                margin: 24px 0;
            }
            .info-title {
                font-weight: 600;
                color: #0d6449;
                font-size: 18px;
                margin-bottom: 16px;
            }
            .info-item {
                margin-bottom: 8px;
                font-size: 15px;
                color: #000000;
            }
            .info-item strong {
                color: #0d6449;
                font-weight: 600;
                min-width: 100px;
            }
        </style>
    </head>
    <body>
            <div class="header">
        <div style="text-align: center; margin-bottom: 8px;">
          ${(() => {
            const elraLogo = loadEmailImage("elra-logo.jpg");
            if (elraLogo) {
              return `<img src="${elraLogo}" alt="ELRA Logo" style="height: 40px; width: auto; max-width: 40px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)); margin-bottom: 8px;" />`;
            }
            return "";
          })()}
          <h1 style="margin: 0; font-size: 32px; font-weight: bold;">ELRA</h1>
        </div>
        <div class="tagline">
          <p>You Lease, We Regulate</p>
                </div>
        <h2>${title}</h2>
            </div>
            
            <div class="content">
                <div class="message">
                    ${content}
                </div>
                
                ${
                  actionText && actionUrl
                    ? `
                <div style="text-align: center;">
                    <a href="${actionUrl}" class="action-button">
                        ${actionText}
                    </a>
                </div>
                `
                    : ""
                }
            
            <div class="footer">
          <p><strong>${footerText}</strong></p>
          <p>© ${currentYear} ELRA. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const htmlContent = createEmailTemplate(
      "Reset Your ELRA Password",
      `
        <p>Hello,</p>
                  <p>🔐 We received a request to reset your ELRA account password.</p>
        <p>Click the button below to create a new secure password. This link will expire in 1 hour for your security.</p>
        <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
      `,
      "Reset Password",
      resetUrl,
      "Your password reset request"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "ELRA - Password Reset Request",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending password reset email to ${email}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const htmlContent = createEmailTemplate(
      "Welcome to ELRA!",
      `
        <p>Hello,</p>
        <p>🎉 Congratulations! Your ELRA account has been successfully activated.</p>
        <p>You now have full access to our comprehensive platform with advanced features including HR management, payroll processing, procurement, finance, inventory management, and secure document workflows.</p>
        <p>Ready to transform your business operations? Click the button below to get started!</p>
      `,
      "Login to ELRA",
      loginUrl,
      "Welcome to the ELRA family"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Welcome to ELRA - Your Account is Ready!",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};

// Send account activation email
export const sendAccountActivationEmail = async (
  email,
  userName,
  activationToken
) => {
  try {
    console.log(`📧 SENDING ACTIVATION EMAIL to: ${email}`);
    const transporter = createTransporter();

    const activationUrl = `${process.env.CLIENT_URL}/verify-email-success?token=${activationToken}`;

    const htmlContent = createEmailTemplate(
      "Activate Your ELRA Account",
      `
        <p>Hello,</p>
        <p>🎉 Welcome to ELRA! We're excited to have you join our comprehensive platform.</p>
        <p>To complete your account setup and unlock all the powerful business management features, please click the button below to activate your account.</p>
        <p>Once activated, you'll have full access to HR management, payroll processing, procurement, finance, inventory management, and secure document workflows.</p>
      `,
      "Activate Account",
      activationUrl,
      "Complete your account setup"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "ELRA - Activate Your Account",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ ACTIVATION EMAIL SENT to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending activation email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Send password change success email
export const sendPasswordChangeSuccessEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const htmlContent = createEmailTemplate(
      "Password Changed Successfully",
      `
        <p>Hello,</p>
        <p>✅ Your ELRA account password has been successfully updated.</p>
        <p>You can now log in to your account with your new secure password.</p>
        <p>If you did not make this change, please contact your system administrator immediately for security assistance.</p>
      `,
      "Login to ELRA",
      loginUrl,
      "Your password has been updated"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "ELRA - Password Changed Successfully",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Password change success email sent to: ${email}`);

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending password change success email to ${email}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send generic email (for industry instance invitations)
export const sendEmail = async (email, subject, htmlContent) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send industry instance invitation email
export const sendIndustryInstanceInvitation = async (
  email,
  userName,
  companyName,
  tempPassword,
  industryType
) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.CLIENT_URL}/login`;
    const credentialsUrl = `${process.env.CLIENT_URL}/retrieve-credentials`;

    const htmlContent = createEmailTemplate(
      `Welcome to ${companyName} - ELRA Platform`,
      `
        <p>Hello,</p>
        <p>🎉 Welcome to the <strong>${companyName}</strong> ELRA platform!</p>
        <p>Your account has been created as a <strong>Super Administrator</strong> for the ${industryType.replace(
          "_",
          " "
        )} system with full control over all ERP modules including HR, payroll, procurement, finance, and document workflows.</p>
        
        <p>🔐 <strong>Your Login Credentials:</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        
        <p>⚠️ <strong>Security Note:</strong> Please change your password immediately after your first login to ensure account security.</p>
        <p>You can now access the platform and start configuring your system!</p>
      `,
      "Login to ELRA",
      loginUrl,
      `Welcome to ${companyName} - Your ELRA platform is ready!`
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to ${companyName} - ELRA Platform Access`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Industry instance invitation sent to: ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending industry instance invitation to ${email}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send employee invitation email
export const sendInvitationEmail = async (
  email,
  userName,
  invitationCode,
  roleName = "STAFF",
  departmentName = "General"
) => {
  try {
    const transporter = createTransporter();
    const joinUrl = `${process.env.CLIENT_URL}/welcome?code=${invitationCode}`;

    const htmlContent = createEmailTemplate(
      `You're Invited to Join ELRA`,
      `
        <p>Hello,</p>
        <p>You've been invited to join ELRA's comprehensive platform.</p>
        
        <div class="info-box">
            <div class="info-title">📋 Your Assignment Details</div>
            <div class="info-item">
                <strong>Role:</strong> ${roleName}
            </div>
            <div class="info-item">
                <strong>Department:</strong> ${departmentName}
            </div>
        </div>
        
        <p><strong>Your Invitation Code:</strong></p>
        <div style="background: #0d6449; color: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 3px; margin: 0;">${invitationCode}</p>
        </div>
        
        <p><strong>How to Join:</strong></p>
        <ol style="margin: 20px 0; padding-left: 24px; line-height: 1.8;">
          <li style="margin: 12px 0;">Click the "Join ELRA" button below or use your invitation code on the website</li>
          <li style="margin: 12px 0;">Complete your account setup with your details</li>
          <li style="margin: 12px 0;">Start accessing your documents and workflows</li>
        </ol>
        
        <p style="color: #6b7280; font-size: 14px; font-style: italic; margin-top: 24px;">This invitation code expires in 7 days. If you have any questions, please contact your system administrator.</p>
      `,
      "Join ELRA",
      joinUrl,
      `You're invited to join ELRA Platform`
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `You're Invited to Join ELRA Platform`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Employee invitation sent to: ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending employee invitation to ${email}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send subscription activation email
export const sendSubscriptionEmail = async (
  email,
  companyName,
  planName,
  billingCycle
) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const htmlContent = createEmailTemplate(
      "🎉 Your ELRA Subscription is Active!",
      `
        <p>Hello <strong>${companyName}</strong> Team,</p>
        <p>🎊 <strong>Congratulations!</strong> Your ELRA subscription has been successfully activated!</p>
        
        <p>📋 <strong>Subscription Details:</strong></p>
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Billing Cycle:</strong> ${billingCycle}</p>
        
        <p>🚀 <strong>What's Next?</strong></p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li>Set up your HR and payroll modules</li>
          <li>Configure procurement and inventory management</li>
          <li>Set up approval workflows and document management</li>
          <li>Create departments and user roles</li>
                          <li>Configure your system settings</li>
        </ul>
        
        <p>Your ERP platform is now ready for use! Need help getting started? Our support team is here to assist you!</p>
      `,
      "Access Your ELRA Platform",
      loginUrl,
      "Welcome to the ELRA family - Your subscription is active!"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "🎉 Your ELRA Subscription is Now Active!",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Subscription activation email sent to: ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending subscription email to ${email}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send platform admin notification for new subscription
export const sendPlatformAdminNewSubscriptionEmail = async (
  platformAdminEmail,
  subscriptionData
) => {
  try {
    const transporter = createTransporter();
    const dashboardUrl = `${process.env.CLIENT_URL}/platform-admin/dashboard`;

    const htmlContent = createEmailTemplate(
      "🎉 New Subscription Alert!",
      `
        <p>Hello <strong>Platform Admin</strong>,</p>
        <p>🎊 <strong>Great news!</strong> A new ${
          subscriptionData.isCompany ? "company" : "user"
        } has subscribed to ELRA!</p>
        
        <p>📋 <strong>New Subscription Details:</strong></p>
        <p><strong>${
          subscriptionData.isCompany ? "Company" : "User"
        }:</strong> ${
        subscriptionData.companyName || subscriptionData.userName
      }</p>
        <p><strong>Email:</strong> ${
          subscriptionData.adminEmail || subscriptionData.userEmail
        }</p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Billing Cycle:</strong> ${subscriptionData.billingCycle}</p>
        <p><strong>Amount:</strong> ${subscriptionData.currency} ${
        subscriptionData.amount
      }</p>
        <p><strong>Payment Provider:</strong> ${
          subscriptionData.paymentProvider
        }</p>
        <p><strong>Type:</strong> ${
          subscriptionData.isCompany
            ? "Company Subscription"
            : "Individual User"
        }</p>
        
        <p>💰 <strong>Revenue Impact:</strong> This subscription adds to your monthly recurring revenue!</p>
        <p>📊 <strong>Next Steps:</strong> Monitor their usage and ensure they have a great onboarding experience.</p>
      `,
      "View Dashboard",
      dashboardUrl,
      "New subscription alert - ELRA Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: platformAdminEmail,
      subject: `🎉 New ELRA ERP Subscription - ${
        subscriptionData.companyName || subscriptionData.userName
      }`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Platform admin new subscription email sent to: ${platformAdminEmail}`
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending platform admin new subscription email to ${platformAdminEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send platform admin notification for subscription renewal
export const sendPlatformAdminRenewalEmail = async (
  platformAdminEmail,
  subscriptionData
) => {
  try {
    const transporter = createTransporter();
    const dashboardUrl = `${process.env.CLIENT_URL}/platform-admin/dashboard`;

    const htmlContent = createEmailTemplate(
      "🔄 Subscription Renewed!",
      `
        <p>Hello <strong>Platform Admin</strong>,</p>
        <p>✅ <strong>Excellent!</strong> A subscription has been successfully renewed!</p>
        
        <p>📋 <strong>Renewal Details:</strong></p>
        <p><strong>${
          subscriptionData.isCompany ? "Company" : "User"
        }:</strong> ${
        subscriptionData.companyName || subscriptionData.userName
      }</p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Billing Cycle:</strong> ${subscriptionData.billingCycle}</p>
        <p><strong>Amount:</strong> ${subscriptionData.currency} ${
        subscriptionData.amount
      }</p>
        <p><strong>Next Billing:</strong> ${
          subscriptionData.nextBillingDate
        }</p>
        <p><strong>Type:</strong> ${
          subscriptionData.isCompany
            ? "Company Subscription"
            : "Individual User"
        }</p>
        
        <p>💰 <strong>Revenue Impact:</strong> Recurring revenue confirmed!</p>
        <p>📈 <strong>Customer Retention:</strong> This shows strong product-market fit!</p>
      `,
      "View Dashboard",
      dashboardUrl,
      "Subscription renewal alert - ELRA Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: platformAdminEmail,
      subject: `🔄 ELRA Subscription Renewed - ${
        subscriptionData.companyName || subscriptionData.userName
      }`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Platform admin renewal email sent to: ${platformAdminEmail}`
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending platform admin renewal email to ${platformAdminEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send platform admin notification for subscription cancellation
export const sendPlatformAdminCancellationEmail = async (
  platformAdminEmail,
  subscriptionData
) => {
  try {
    const transporter = createTransporter();
    const dashboardUrl = `${process.env.CLIENT_URL}/platform-admin/dashboard`;

    const htmlContent = createEmailTemplate(
      "⚠️ Subscription Cancelled",
      `
        <p>Hello <strong>Platform Admin</strong>,</p>
        <p>⚠️ <strong>Alert:</strong> A subscription has been cancelled.</p>
        
        <p>📋 <strong>Cancellation Details:</strong></p>
        <p><strong>${
          subscriptionData.isCompany ? "Company" : "User"
        }:</strong> ${
        subscriptionData.companyName || subscriptionData.userName
      }</p>
        <p><strong>Email:</strong> ${
          subscriptionData.adminEmail || subscriptionData.userEmail
        }</p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Reason:</strong> ${
          subscriptionData.cancellationReason || "Not specified"
        }</p>
        <p><strong>Cancelled Date:</strong> ${
          subscriptionData.cancelledDate
        }</p>
        <p><strong>Type:</strong> ${
          subscriptionData.isCompany
            ? "Company Subscription"
            : "Individual User"
        }</p>
        
        <p>📊 <strong>Action Required:</strong> Consider reaching out to understand their needs.</p>
        <p>💡 <strong>Opportunity:</strong> This could be a chance to improve the product or offer better support.</p>
      `,
      "View Dashboard",
      dashboardUrl,
      "Subscription cancellation alert - ELRA Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: platformAdminEmail,
      subject: `⚠️ ELRA Subscription Cancelled - ${
        subscriptionData.companyName || subscriptionData.userName
      }`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Platform admin cancellation email sent to: ${platformAdminEmail}`
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending platform admin cancellation email to ${platformAdminEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send platform admin notification for payment failure
export const sendPlatformAdminPaymentFailureEmail = async (
  platformAdminEmail,
  subscriptionData
) => {
  try {
    const transporter = createTransporter();
    const dashboardUrl = `${process.env.CLIENT_URL}/platform-admin/dashboard`;

    const htmlContent = createEmailTemplate(
      "❌ Payment Failed",
      `
        <p>Hello <strong>Platform Admin</strong>,</p>
        <p>❌ <strong>Alert:</strong> A subscription payment has failed.</p>
        
        <p>📋 <strong>Payment Failure Details:</strong></p>
        <p><strong>${
          subscriptionData.isCompany ? "Company" : "User"
        }:</strong> ${
        subscriptionData.companyName || subscriptionData.userName
      }</p>
        <p><strong>Email:</strong> ${
          subscriptionData.adminEmail || subscriptionData.userEmail
        }</p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Amount:</strong> ${subscriptionData.currency} ${
        subscriptionData.amount
      }</p>
        <p><strong>Payment Provider:</strong> ${
          subscriptionData.paymentProvider
        }</p>
        <p><strong>Error:</strong> ${
          subscriptionData.errorMessage || "Unknown error"
        }</p>
        <p><strong>Type:</strong> ${
          subscriptionData.isCompany
            ? "Company Subscription"
            : "Individual User"
        }</p>
        
        <p>⚠️ <strong>Action Required:</strong> The subscription may be suspended if payment is not resolved.</p>
        <p>📧 <strong>Next Steps:</strong> Consider reaching out to the customer to resolve payment issues.</p>
      `,
      "View Dashboard",
      dashboardUrl,
      "Payment failure alert - ELRA Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: platformAdminEmail,
      subject: `❌ ELRA Payment Failed - ${
        subscriptionData.companyName || subscriptionData.userName
      }`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Platform admin payment failure email sent to: ${platformAdminEmail}`
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending platform admin payment failure email to ${platformAdminEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send user notification for their own subscription renewal
export const sendUserRenewalEmail = async (
  userEmail,
  userName,
  subscriptionData
) => {
  try {
    const transporter = createTransporter();
    const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`;

    const htmlContent = createEmailTemplate(
      "🔄 Your Subscription Has Been Renewed!",
      `
        <p>Hello,</p>
        <p>✅ <strong>Great news!</strong> Your ELRA subscription has been successfully renewed!</p>
        
        <p>📋 <strong>Renewal Confirmation:</strong></p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Billing Cycle:</strong> ${subscriptionData.billingCycle}</p>
        <p><strong>Amount:</strong> ${subscriptionData.currency} ${subscriptionData.amount}</p>
        <p><strong>Next Billing:</strong> ${subscriptionData.nextBillingDate}</p>
        <p><strong>Transaction ID:</strong> ${subscriptionData.transactionId}</p>
        
        <p>🚀 <strong>Your ELRA platform continues to be fully active!</strong></p>
        <p>📊 <strong>What's Next:</strong> Continue using all your features and enjoy uninterrupted service.</p>
      `,
      "Access Your Dashboard",
      dashboardUrl,
      "Subscription renewed successfully - ELRA Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "🔄 Your ELRA Subscription Has Been Renewed!",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ User renewal email sent to: ${userEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending user renewal email to ${userEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send user notification for their own subscription cancellation
export const sendUserCancellationEmail = async (
  userEmail,
  userName,
  subscriptionData
) => {
  try {
    const transporter = createTransporter();
    const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`;

    const htmlContent = createEmailTemplate(
      "⚠️ Your Subscription Has Been Cancelled",
      `
        <p>Hello,</p>
        <p>⚠️ <strong>Important Notice:</strong> Your ELRA subscription has been cancelled.</p>
        
        <p>📋 <strong>Cancellation Details:</strong></p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Cancelled Date:</strong> ${
          subscriptionData.cancelledDate
        }</p>
        <p><strong>Reason:</strong> ${
          subscriptionData.cancellationReason || "Not specified"
        }</p>
        <p><strong>Access Until:</strong> ${
          subscriptionData.accessUntil || "End of current billing period"
        }</p>
        
        <p>📊 <strong>What This Means:</strong> Your access will continue until the end of your current billing period.</p>
        <p>💡 <strong>Need Help?</strong> If this was a mistake or you'd like to reactivate, please contact our support team.</p>
      `,
      "Contact Support",
      `${process.env.CLIENT_URL}/support`,
      "Subscription cancelled - ELRA Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "⚠️ Your ELRA Subscription Has Been Cancelled",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ User cancellation email sent to: ${userEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending user cancellation email to ${userEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send user notification for payment failure
export const sendUserPaymentFailureEmail = async (
  userEmail,
  userName,
  subscriptionData
) => {
  try {
    const transporter = createTransporter();
    const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`;

    const htmlContent = createEmailTemplate(
      "❌ Payment Failed - Action Required",
      `
        <p>Hello,</p>
        <p>❌ <strong>Important:</strong> We were unable to process your subscription payment.</p>
        
        <p>📋 <strong>Payment Failure Details:</strong></p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Amount:</strong> ${subscriptionData.currency} ${
        subscriptionData.amount
      }</p>
        <p><strong>Payment Provider:</strong> ${
          subscriptionData.paymentProvider
        }</p>
        <p><strong>Error:</strong> ${
          subscriptionData.errorMessage || "Unknown error"
        }</p>
        <p><strong>Next Retry:</strong> ${
          subscriptionData.nextRetryDate || "Within 24 hours"
        }</p>
        
        <p>⚠️ <strong>Action Required:</strong> Please update your payment method to avoid service interruption.</p>
        <p>🔧 <strong>Quick Fix:</strong> Log into your dashboard to update your billing information.</p>
      `,
      "Update Payment Method",
      dashboardUrl,
      "Payment failed - Action required - ELRA Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "❌ Payment Failed - Action Required - ELRA",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ User payment failure email sent to: ${userEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending user payment failure email to ${userEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send inventory completion notification email
export const sendInventoryCompletionEmail = async (
  email,
  userName,
  inventoryData,
  projectData,
  pdfBuffer,
  isEdit = false
) => {
  try {
    const transporter = createTransporter();
    const dashboardUrl = `${process.env.CLIENT_URL}/dashboard/modules/inventory`;

    const actionText = isEdit ? null : "View Completed Inventory";
    const title = isEdit
      ? "Inventory Item Updated"
      : "Inventory Item Completed";
    const statusText = isEdit ? "updated" : "completed";
    const buttonText = isEdit
      ? ""
      : "<p>Click the button below to view the inventory item in the ELRA dashboard.</p>";

    const htmlContent = createEmailTemplate(
      title,
      `
        <p>Hello,</p>
        <p>📦 An inventory item has been ${statusText} in the ELRA system.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0d6449; margin-bottom: 15px;">📋 Inventory Details</h3>
          <p><strong>Item Name:</strong> ${inventoryData.name}</p>
          <p><strong>Item Code:</strong> ${inventoryData.code}</p>
          <p><strong>Description:</strong> ${inventoryData.description}</p>
          <p><strong>Type:</strong> ${inventoryData.type}</p>
          <p><strong>Category:</strong> ${
            inventoryData.category?.replace(/[-_]/g, " ") || "N/A"
          }</p>
          <p><strong>Status:</strong> ${inventoryData.status}</p>
          ${
            inventoryData.specifications?.brand
              ? `<p><strong>Brand:</strong> ${inventoryData.specifications.brand}</p>`
              : ""
          }
          ${
            inventoryData.specifications?.model
              ? `<p><strong>Model:</strong> ${inventoryData.specifications.model}</p>`
              : ""
          }
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0d6449; margin-bottom: 15px;">🏗️ Project Information</h3>
          <p><strong>Project Name:</strong> ${projectData.name}</p>
          <p><strong>Project Code:</strong> ${projectData.code}</p>
          <p><strong>Category:</strong> ${
            projectData.category?.replace(/[-_]/g, " ") || "N/A"
          }</p>
          <p><strong>Budget:</strong> ₦${
            projectData.budget?.toLocaleString() || "N/A"
          }</p>
        </div>

        ${
          inventoryData.maintenance
            ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0d6449; margin-bottom: 15px;">🔧 Maintenance Schedule</h3>
          ${
            inventoryData.maintenance.lastServiceDate
              ? `<p><strong>Last Service:</strong> ${new Date(
                  inventoryData.maintenance.lastServiceDate
                ).toLocaleDateString()}</p>`
              : ""
          }
          ${
            inventoryData.maintenance.nextServiceDate
              ? `<p><strong>Next Service:</strong> ${new Date(
                  inventoryData.maintenance.nextServiceDate
                ).toLocaleDateString()}</p>`
              : ""
          }
          ${
            inventoryData.maintenance.maintenanceInterval
              ? `<p><strong>Interval:</strong> ${inventoryData.maintenance.maintenanceInterval} days</p>`
              : ""
          }
        </div>
        `
            : ""
        }

        <p>📎 A detailed completion certificate has been attached to this email for your records.</p>
        ${buttonText}
      `,
      actionText,
      dashboardUrl,
      isEdit
        ? "Inventory item updated"
        : "Inventory item completed successfully"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `${title} - ${inventoryData.name} (${inventoryData.code})`,
      html: htmlContent,
      attachments: pdfBuffer
        ? [
            {
              filename: isEdit
                ? `Inventory_Completion_${inventoryData.code}_${
                    new Date().toISOString().split("T")[0]
                  }_Updated.pdf`
                : `Inventory_Completion_${inventoryData.code}_${
                    new Date().toISOString().split("T")[0]
                  }.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : [],
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Inventory completion email sent to: ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending inventory completion email to ${email}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// New email for pending registration
export const sendPendingRegistrationEmail = async (email, firstName) => {
  try {
    const transporter = createTransporter();
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Received - ELRA</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background: #f7f7fa;
            min-height: 100vh;
            padding: 20px;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            border: 1px solid #e7ebea;
          }
          
          .header {
            background: linear-gradient(135deg, #0D6449 0%, #059669 50%, #10b981 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
          }
          
          .logo {
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
          }
          
          .logo img {
            height: 60px;
            width: auto;
            max-width: 200px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }
          
          .logo-text {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
            color: white;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
            margin-bottom: 8px;
          }
          
          .subtitle-secondary {
            font-size: 14px;
            opacity: 0.8;
            font-weight: 300;
            letter-spacing: 0.3px;
          }
          
          .content {
            padding: 40px 30px;
            text-align: center;
            background: #ffffff;
            color: #1a1a1a;
          }
          
          .status-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 36px;
            color: white;
            box-shadow: 0 10px 25px rgba(251, 191, 36, 0.3);
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            color: #0D6449;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
          }
          
          .message {
            font-size: 16px;
            color: #1a1a1a;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          
          .message strong {
            color: #0D6449;
            font-weight: 600;
          }
          
          .info-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 1px solid #d1fae5;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            text-align: left;
          }
          
          .info-title {
            font-weight: 600;
            color: #0D6449;
            font-size: 18px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .info-list {
            color: #1a1a1a;
            font-size: 15px;
            line-height: 1.6;
          }
          
          .info-list li {
            color: #1a1a1a;
          }
          
          .info-list br {
            margin-bottom: 4px;
          }
          
          .footer {
            background: #f7f7fa;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e7ebea;
            color: #666666;
          }
          
          .footer-text {
            color: #0D6449;
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 600;
          }
          
          .footer-subtitle {
            color: #999999;
            font-size: 12px;
            margin-bottom: 8px;
          }
          
          .footer-date {
            color: #999999;
            font-size: 11px;
            font-style: italic;
          }
          
          .company-info {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 1px solid #d1fae5;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            text-align: center;
          }
          
          .company-name {
            font-weight: 700;
            color: #0D6449;
            font-size: 18px;
            margin-bottom: 4px;
          }
          
          .company-tagline {
            color: #059669;
            font-size: 14px;
            font-style: italic;
          }
          
          .company-tagline-secondary {
            color: #10b981;
            font-size: 12px;
            font-style: italic;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-container">
              <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
                ${(() => {
                  const elraLogo = loadEmailImage("elra-logo.jpg");
                  if (elraLogo) {
                    return `<img src="${elraLogo}" alt="ELRA Logo" style="height: 60px; width: auto; max-width: 60px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));" />`;
                  }
                  return "";
                })()}
            <div class="logo-text">ELRA</div>
              </div>
            </div>
            <div class="subtitle">You Lease, We Regulate...</div>
          </div>
          
          <div class="content">
            <div class="status-icon">⏳</div>
            <h1 class="title">Registration Received!</h1>
            <p class="message">
              Hello <strong>${firstName}</strong>,<br><br>
              Thank you for registering with ELRA! 🎉<br><br>
              Your registration has been received and is currently under review by our Super Administrator for access to our comprehensive platform.
            </p>
            
            <div class="info-card">
              <div class="info-title">
                <span>📋</span>
                What happens next?
              </div>
              <div class="info-list">
                1. Super Admin will review your registration<br>
                2. You'll receive an invitation email with a special code<br>
                3. Use the code to complete your account setup<br>
                4. Start using ELRA! 🚀
              </div>
            </div>
            
            <p class="message">
              We'll notify you as soon as your account is ready. Thank you for your patience!
            </p>
            
            <div class="company-info">
              <div class="company-name">Century Info Systems</div>
              <div class="company-tagline">Empowering Digital Transformation</div>
              <div class="company-tagline-secondary">Comprehensive Business Solutions</div>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">Thank you for choosing ELRA</p>
            <p class="footer-subtitle">Powered by ELRA</p>
            <p class="footer-date">${currentDate}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Registration Received - ELRA",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ PENDING REGISTRATION EMAIL SENT to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending pending registration email:", error);
    throw error;
  }
};

const sendPayslipEmail = async ({
  to,
  employeeName,
  period,
  netPay,
  payslipPath,
  payslipFileName,
}) => {
  try {
    const transporter = createTransporter();
    const currentDate = new Date().toLocaleDateString();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payslip Available - ELRA</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background: #ffffff;
            min-height: 100vh;
            padding: 20px;
            color: #000000;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
          
          .header {
            background: linear-gradient(135deg, #0d6449 0%, #059669 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
          }
          
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
          }
          
          .logo-image {
            height: 60px;
            width: auto;
            max-width: 200px;
          }
          
          .logo-text {
            font-size: 48px;
            font-weight: 800;
            letter-spacing: -2px;
            font-family: 'Poppins', sans-serif;
            color: white;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .subtitle {
            font-size: 16px;
            font-weight: 500;
            color: white;
            letter-spacing: 0.5px;
            margin-top: 8px;
          }
          
          .content {
            padding: 40px 30px;
            background: #ffffff;
            color: #000000;
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .message {
            font-size: 16px;
            color: #374151;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          
          .payslip-card {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
          }
          
          .payslip-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }
          
          .payslip-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
          }
          
          .payslip-details {
            display: flex;
            justify-content: center;
            margin: 15px 0;
            padding: 10px 0;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .payslip-detail {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          
          .detail-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
          }
          
          .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .net-pay {
            font-size: 24px;
            font-weight: 700;
            color: #059669;
            margin: 20px 0;
          }
          
          .action-button {
            display: inline-block;
            background: #0d6449;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          
          .action-button:hover {
            background: #0a4d3a;
          }
          
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 5px;
          }
          
          .footer-subtitle {
            font-size: 12px;
            color: #9ca3af;
            margin-bottom: 10px;
          }
          
          .footer-date {
            font-size: 11px;
            color: #9ca3af;
          }
          
          .company-info {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          
          .company-name {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
          }
          
          .company-tagline {
            color: #059669;
            font-size: 14px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
                 <div class="email-container">
           <div class="header">
             <div class="logo-container">
               <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
                 ${(() => {
                   const elraLogo = loadEmailImage("elra-logo.jpg");
                   if (elraLogo) {
                     return `<img src="${elraLogo}" alt="ELRA Logo" style="height: 60px; width: auto; max-width: 60px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));" />`;
                   }
                   return "";
                 })()}
               <div class="logo-text">ELRA</div>
               </div>
             </div>
             <div class="subtitle">You Lease, We Regulate...</div>
           </div>
          
          <div class="content">
            <h1 class="title">📄 Your Payslip is Ready!</h1>
            <p class="message">
              Hello <strong>${employeeName}</strong>,<br><br>
              Great news! Your payslip for <strong>${period}</strong> has been generated and is now available for download. 🎉
            </p>
            
            <div class="payslip-card">
              <div class="payslip-icon" style="text-align: center; margin: 0 auto 15px; font-size: 48px;">💰</div>
              <div class="payslip-title" style="text-align: center; font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 15px;">Payslip Summary</div>
              
              <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 28px; font-weight: 700; color: #059669; margin: 0;">₦${
                  netPay
                    ? netPay.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"
                }</div>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 15px 0;">
                Your detailed payslip is attached to this email. You can also view it anytime in your ELRA dashboard.
              </p>
            </div>
            
            <p class="message">
              If you have any questions about your payslip, please contact your Head of Department.
            </p>
            
            <div class="company-info">
              <div class="company-name">Century Info Systems</div>
              <div class="company-tagline">Empowering Digital Transformation</div>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">Thank you for choosing ELRA</p>
            <p class="footer-subtitle">Powered by ELRA</p>
            <p class="footer-date">${currentDate}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: `Payslip Available - ${period} - ELRA`,
      html: htmlContent,
      attachments: [
        {
          filename: payslipFileName,
          path: payslipPath,
          contentType: "application/pdf",
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ PAYSLIP EMAIL SENT to ${to} with attachment: ${payslipFileName}`
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending payslip email:", error);
    throw error;
  }
};

// Send vendor notification email with PDF attachment
export const sendVendorNotificationEmail = async (
  vendorData,
  projectData,
  pdfBuffer = null
) => {
  try {
    const transporter = createTransporter();

    // Fetch admin emails dynamically
    const adminEmails = await fetchAdminEmails();

    // Generate project items table for vendor
    const generateVendorItemsTable = (items) => {
      if (!items || items.length === 0) return "";

      let tableHtml = `
        <div class="info-box">
          <div class="info-title">📦 What You Need to Deliver - Project Items & Coordination</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">Item</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Qty</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Unit Price</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
      `;

      items.forEach((item, index) => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const quantity = parseInt(item.quantity) || 0;
        const total = unitPrice * quantity;

        tableHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
              <strong>${item.name}</strong>
              ${
                item.description
                  ? `<br><small style="color: #666;">${item.description}</small>`
                  : ""
              }
              ${
                item.deliveryTimeline
                  ? `<br><small style="color: #0d6449;">📅 ${item.deliveryTimeline}</small>`
                  : ""
              }
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${quantity}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${formatCurrency(
              unitPrice
            )}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;"><strong>${formatCurrency(
              total
            )}</strong></td>
          </tr>
        `;
      });

      const grandTotal = items.reduce((sum, item) => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + unitPrice * quantity;
      }, 0);

      tableHtml += `
            </tbody>
            <tfoot>
              <tr style="background-color: #e8f4fd; font-weight: bold;">
                <td colspan="3" style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Total Project Cost:</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${formatCurrency(
                  grandTotal
                )}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

      return tableHtml;
    };

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const htmlContent = createEmailTemplate(
      "Project Items Review Required - ELRA",
      `
        <p>Hello <strong>${vendorData.name}</strong>,</p>
        
        <p>We have a new project that requires your expertise and we need you to review the project items and revert back to us with your feedback and availability.</p>
        
        <div class="info-box">
          <div class="info-title">📋 Project Details</div>
          <div class="info-item"><strong>Project Name:</strong> ${
            projectData.name
          }</div>
          <div class="info-item"><strong>Project Code:</strong> ${
            projectData.code
          }</div>
          <div class="info-item"><strong>Total Budget:</strong> ${formatCurrency(
            projectData.budget
          )}</div>
          <div class="info-item"><strong>Start Date:</strong> ${new Date(
            projectData.startDate
          ).toLocaleDateString()}</div>
          <div class="info-item"><strong>End Date:</strong> ${new Date(
            projectData.endDate
          ).toLocaleDateString()}</div>
        </div>

        <div class="info-box">
          <div class="info-title">📦 Project Items Review Required</div>
          <p>We have attached a detailed PDF document containing all project items, quantities, pricing, and delivery timelines. Please review the attached PDF and revert back to us with:</p>
          <ul>
            <li>✅ Your availability for this project</li>
            <li>📋 Confirmation of your ability to deliver the specified items</li>
            <li>⏰ Any timeline adjustments or concerns</li>
            <li>💰 Pricing confirmation or negotiations</li>
            <li>📞 Your preferred communication method for project coordination</li>
          </ul>
        </div>

        <p><strong>What we need from you:</strong></p>
        <ul>
          <li>📧 Please review the attached project details PDF</li>
          <li>✍️ <strong>Sign the PDF</strong> in the signature section and return it to us</li>
          <li>📄 Attach your <strong>company invoice/quote</strong> for the project items</li>
          <li>📋 Include your <strong>delivery timeline confirmation</strong></li>
          <li>🔄 Revert back to us within 48 hours with your response</li>
          <li>📞 Contact us if you have any questions about the project requirements</li>
          <li>✅ Confirm your availability and delivery capabilities</li>
          <li>🤝 Let us know if you're interested in partnering on this project</li>
        </ul>

        <div class="info-box">
          <div class="info-title">📋 Required Documents to Return</div>
          <p><strong>Please include the following with your response:</strong></p>
          <ul>
            <li>✅ <strong>Signed PDF</strong> - Complete the signature section in the attached PDF</li>
            <li>💰 <strong>Company Invoice/Quote</strong> - Your official pricing for the project items</li>
            <li>📅 <strong>Delivery Timeline</strong> - Confirmed delivery dates for each item</li>
            <li>📞 <strong>Contact Information</strong> - Your project coordinator details</li>
          </ul>
        </div>

        <p>We value your partnership and look forward to your response regarding this project opportunity.</p>
        <p>Please get in touch with us as soon as possible to discuss the project details and next steps.</p>
        
        <div class="contact-info">
          <div class="info-title">📞 Contact Information</div>
          <p>For any questions or clarifications, please contact our team:</p>
          ${adminEmails
            .map(
              (admin) =>
                `<div class="info-item"><strong>${admin.name}:</strong> ${admin.email}</div>`
            )
            .join("")}
          <p><em>Our team will be in touch with you shortly to discuss the project details and next steps.</em></p>
        </div>
      `,
      null, // No action button needed
      null,
      "Thank you for your continued partnership with ELRA"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: vendorData.email,
      subject: `Project Items Review Required - ${projectData.code} - ${projectData.name}`,
      html: htmlContent,
    };

    // Add PDF attachment if provided
    if (pdfBuffer) {
      mailOptions.attachments = [
        {
          filename: `project_details_${
            projectData.code
          }_${projectData.name.replace(/\s+/g, "_")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Vendor notification email sent to: ${vendorData.email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending vendor notification email to ${vendorData.email}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send client notification email for external project creation
export const sendClientNotificationEmail = async (
  clientData,
  projectData,
  pdfBuffer = null
) => {
  try {
    const transporter = createTransporter();

    const adminEmails = await fetchAdminEmails();

    // Calculate budget allocation details based on actual items cost
    const totalBudget = parseFloat(projectData.budget) || 0;

    // Calculate actual items cost
    const actualItemsCost = (projectData.projectItems || []).reduce(
      (sum, item) => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + unitPrice * quantity;
      },
      0
    );

    // Calculate budget allocation based on requiresBudgetAllocation
    let elraPercentage;
    let clientPercentage;
    let elraAmount;
    let clientAmount;

    if (
      projectData.requiresBudgetAllocation === "true" ||
      projectData.requiresBudgetAllocation === true
    ) {
      // If budget allocation is requested, use the percentage (default 100% if empty)
      elraPercentage = parseFloat(projectData.budgetPercentage) || 100;
      clientPercentage = 100 - elraPercentage;
      elraAmount = (actualItemsCost * elraPercentage) / 100;
      clientAmount = actualItemsCost - elraAmount;
    } else {
      // If no budget allocation requested, CLIENT pays 100% (external project)
      elraPercentage = 0;
      clientPercentage = 100;
      elraAmount = 0;
      clientAmount = actualItemsCost;
    }

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    // Determine approval flow message
    const approvalFlow =
      projectData.requiresBudgetAllocation === "true" ||
      projectData.requiresBudgetAllocation === true
        ? "Legal > Finance Review > Executive > Budget Allocation"
        : "Legal > Executive (using existing budget)";

    // Generate project items table for client
    const generateItemsTable = (items) => {
      if (!items || items.length === 0) return "";

      let tableHtml = `
        <div class="info-box">
          <div class="info-title">📦 What You'll Receive - Project Items & Deliverables</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">Item</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Qty</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Unit Price</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
      `;

      items.forEach((item, index) => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const quantity = parseInt(item.quantity) || 0;
        const total = unitPrice * quantity;

        tableHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
              <strong>${item.name}</strong>
              ${
                item.description
                  ? `<br><small style="color: #666;">${item.description}</small>`
                  : ""
              }
              ${
                item.deliveryTimeline
                  ? `<br><small style="color: #0d6449;">📅 ${item.deliveryTimeline}</small>`
                  : ""
              }
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${quantity}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${formatCurrency(
              unitPrice
            )}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;"><strong>${formatCurrency(
              total
            )}</strong></td>
          </tr>
        `;
      });

      const grandTotal = items.reduce((sum, item) => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + unitPrice * quantity;
      }, 0);

      tableHtml += `
            </tbody>
            <tfoot>
              <tr style="background-color: #e8f4fd; font-weight: bold;">
                <td colspan="3" style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Total Project Cost:</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${formatCurrency(
                  grandTotal
                )}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

      return tableHtml;
    };

    const htmlContent = createEmailTemplate(
      "Thank You for Partnering with ELRA!",
      `
        <p>Hello <strong>${clientData.clientName}</strong>,</p>
        
        <p>🎉 <strong>Thank you for choosing ELRA!</strong> We're excited to partner with <strong>${
          clientData.clientCompany
        }</strong> and look forward to a successful collaboration on your project.</p>
        
        <div class="info-box">
          <div class="info-title">📋 Project Details</div>
          <div class="info-item"><strong>Project Name:</strong> ${
            projectData.name
          }</div>
          <div class="info-item"><strong>Project Code:</strong> ${
            projectData.code || "TBD"
          }</div>
          <div class="info-item"><strong>Category:</strong> ${
            projectData.category?.replace(/[-_]/g, " ") || "N/A"
          }</div>
          <div class="info-item"><strong>Priority:</strong> <span class="priority-${
            projectData.priority
          }">${projectData.priority.toUpperCase()}</span></div>
          <div class="info-item"><strong>Start Date:</strong> ${new Date(
            projectData.startDate
          ).toLocaleDateString()}</div>
          <div class="info-item"><strong>End Date:</strong> ${new Date(
            projectData.endDate
          ).toLocaleDateString()}</div>
        </div>

        <div class="info-box">
          <div class="info-title">📦 What You'll Receive</div>
          <p>We have attached a detailed PDF document containing all project items, quantities, pricing, and delivery timelines. Please refer to the attached PDF for complete project specifications and deliverables.</p>
        </div>

        <p><strong>What this partnership means for you:</strong></p>
        <ul>
          <li>✅ You'll receive all the items listed in the attached PDF</li>
          <li>📅 Each item has a specific delivery timeline that we'll coordinate</li>
          <li>💰 The total cost is included in your project budget allocation</li>
          <li>🔄 We'll keep you updated on the progress of each deliverable</li>
          <li>🤝 We're committed to delivering exceptional results for your project</li>
        </ul>

        <div class="info-box">
          <div class="info-title">💰 Budget Allocation Agreement</div>
          <div class="info-item"><strong>Total Project Budget:</strong> ${formatCurrency(
            totalBudget
          )}</div>
          <div class="info-item"><strong>Actual Items Cost:</strong> ${formatCurrency(
            actualItemsCost
          )}</div>
          <div class="info-item"><strong>ELRA Handles:</strong> ${elraPercentage}% (${formatCurrency(
        elraAmount
      )})</div>
          ${
            clientPercentage > 0
              ? `<div class="info-item"><strong>Client Handles:</strong> ${clientPercentage}% (${formatCurrency(
                  clientAmount
                )})</div>`
              : ""
          }
          <div class="info-item"><strong>Budget Allocation:</strong> ${
            projectData.requiresBudgetAllocation === "true" ||
            projectData.requiresBudgetAllocation === true
              ? "✅ Required - Budget allocation approval needed"
              : "❌ Not Required - Using existing budget"
          }</div>
        </div>

        ${
          projectData.vendor
            ? `
        <div class="info-box">
          <div class="info-title">🏢 Vendor Information</div>
          <div class="info-item"><strong>Vendor Name:</strong> ${
            projectData.vendor.name
          }</div>
          ${
            projectData.vendor.email
              ? `<div class="info-item"><strong>Vendor Email:</strong> ${projectData.vendor.email}</div>`
              : ""
          }
          ${
            projectData.vendor.phone
              ? `<div class="info-item"><strong>Vendor Phone:</strong> ${projectData.vendor.phone}</div>`
              : ""
          }
          ${
            projectData.vendor.address
              ? `<div class="info-item"><strong>Vendor Address:</strong> ${projectData.vendor.address}</div>`
              : ""
          }
          <div class="info-item"><strong>Note:</strong> This vendor has been selected for your project and will be involved in the procurement and delivery process.</div>
        </div>
        `
            : ""
        }

        <p><strong>What happens next?</strong></p>
        <ul>
          <li>✅ Your project has been successfully submitted to our system</li>
          <li>🔄 It will go through our internal approval process: <strong>${approvalFlow}</strong></li>
          <li>📧 You'll receive updates on the approval status</li>
          <li>🚀 Once approved, we'll begin project implementation</li>
          <li>📦 Project implementation and delivery processes will be initiated</li>
          ${
            projectData.vendor
              ? "<li>🏢 Our selected vendor will coordinate with you for project delivery and support</li>"
              : ""
          }
        </ul>

        <p>We're committed to delivering exceptional results for your project. Our team of experts will work closely with you to ensure success and we hope for a long-lasting partnership.</p>
        
        <div class="contact-info">
          <div class="info-title">📞 Contact Information</div>
          <p>If you have any questions or need to discuss any aspect of the project, please don't hesitate to get in touch with us:</p>
          ${adminEmails
            .map(
              (admin) =>
                `<div class="info-item"><strong>${admin.name}:</strong> ${admin.email}</div>`
            )
            .join("")}
          <p><em>Our team will be in touch with you shortly to discuss the project details and next steps.</em></p>
        </div>
      `,
      "View Project Portal",
      `${process.env.CLIENT_URL}/dashboard/modules/projects`,
      "Thank you for choosing ELRA as your trusted project partner"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: clientData.clientEmail,
      subject: `Thank You for Partnering with ELRA - ${projectData.code} - ${projectData.name}`,
      html: htmlContent,
    };

    // Add PDF attachment if provided (project details PDF)
    if (pdfBuffer) {
      mailOptions.attachments = [
        {
          filename: `project_details_${
            projectData.code
          }_${projectData.name.replace(/\s+/g, "_")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Client notification email sent to: ${clientData.clientEmail}`
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending client notification email to ${clientData.clientEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

export default {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountActivationEmail,
  sendPasswordChangeSuccessEmail,
  sendEmail,
  sendIndustryInstanceInvitation,
  sendInvitationEmail,
  sendPendingRegistrationEmail,
  sendSubscriptionEmail,
  sendPlatformAdminNewSubscriptionEmail,
  sendPlatformAdminRenewalEmail,
  sendPlatformAdminCancellationEmail,
  sendPlatformAdminPaymentFailureEmail,
  sendUserRenewalEmail,
  sendUserCancellationEmail,
  sendUserPaymentFailureEmail,
  sendPayslipEmail,
  sendVendorNotificationEmail,
  sendClientNotificationEmail,
};
