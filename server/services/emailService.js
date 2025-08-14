import nodemailer from "nodemailer";

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
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
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
                background: #0d6449;
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            
            .logo-container {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
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
                color: white;
                margin: 0;
            }
            
            .logo-subtitle {
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
                color: #0d6449;
                margin-bottom: 24px;
                text-align: center;
            }
            
            .message {
                font-size: 16px;
                color: #000000;
                margin-bottom: 32px;
                line-height: 1.7;
            }
            
            .message strong {
                color: #0d6449;
                font-weight: 600;
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
            
            .footer {
                background: #ffffff;
                padding: 24px 30px;
                text-align: center;
                color: #000000;
                font-size: 14px;
                border-top: 1px solid #e5e7eb;
            }
            
            .footer-text {
                font-weight: 600;
                color: #0d6449;
                margin-bottom: 8px;
            }
            
            .footer-date {
                font-size: 12px;
                color: #000000;
            }
            
            .brand-section {
                background: #ffffff;
                border: 2px solid #0d6449;
                border-radius: 8px;
                padding: 20px;
                margin: 24px 0;
                text-align: center;
            }
            
            .brand-name {
                font-weight: 700;
                color: #0d6449;
                font-size: 20px;
                margin-bottom: 4px;
            }
            
            .brand-tagline {
                color: #000000;
                font-size: 14px;
                font-style: italic;
            }
            
            @media (max-width: 600px) {
                body { padding: 10px; }
                .email-container { border-radius: 6px; }
                .header { padding: 20px 15px; }
                .content { padding: 30px 20px; }
                .title { font-size: 24px; }
                .action-button { padding: 14px 28px; font-size: 15px; }
                .logo-text { font-size: 36px; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo-container">
                    <img src="${
                      process.env.CLIENT_URL
                    }/src/assets/ELRA.png" alt="ELRA Logo" class="logo-image" />
                    <div class="logo-text">ELRA</div>
                </div>
                <div class="logo-subtitle">Enterprise Resource Planning</div>
            </div>
            
            <div class="content">
                <h1 class="title">${title}</h1>
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
                
                <div class="brand-section">
                    <div class="brand-name">Century Info Systems</div>
                    <div class="brand-tagline">Empowering Digital Transformation</div>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">${footerText}</div>
                <div class="footer-date">${currentYear}</div>
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
        <p>Hello <strong>${userName}</strong>,</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
        <p>🎉 Congratulations! Your ELRA account has been successfully activated.</p>
        <p>You now have full access to our comprehensive Enterprise Resource Planning (ERP) platform with advanced features including HR management, payroll processing, procurement, finance, inventory management, and secure document workflows.</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
        <p>🎉 Welcome to ELRA! We're excited to have you join our comprehensive Enterprise Resource Planning (ERP) platform.</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
        <p>🎉 Welcome to the <strong>${companyName}</strong> ELRA platform!</p>
        <p>Your account has been created as a <strong>Super Administrator</strong> for the ${industryType.replace(
          "_",
          " "
        )} system with full control over all ERP modules including HR, payroll, procurement, finance, and document workflows.</p>
        
        <p>🔐 <strong>Your Login Credentials:</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        
        <p>⚠️ <strong>Security Note:</strong> Please change your password immediately after your first login to ensure account security.</p>
        <p>You can now access the platform and start configuring your ERP system!</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
        <p>You've been invited to join ELRA's Enterprise Resource Planning (ERP) system.</p>
        
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
          <li style="margin: 12px 0;">Click the "Join ELRA" button below</li>
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
          <li>Configure your ERP system settings</li>
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
      subject: `🎉 New EDMS Subscription - ${
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
        <p>Hello <strong>${userName}</strong>,</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
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
            <div class="logo">
              <img src="${process.env.CLIENT_URL}/elra-logo.png" alt="ELRA Logo" />
            </div>
            <div class="logo-text">ELRA</div>
            <div class="subtitle">Enterprise Resource Planning System</div>
          </div>
          
          <div class="content">
            <div class="status-icon">⏳</div>
            <h1 class="title">Registration Received!</h1>
            <p class="message">
              Hello <strong>${firstName}</strong>,<br><br>
              Thank you for registering with ELRA! 🎉<br><br>
              Your registration has been received and is currently under review by our Super Administrator for access to our comprehensive ERP platform.
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
                4. Start using ELRA ERP! 🚀
              </div>
            </div>
            
            <p class="message">
              We'll notify you as soon as your account is ready. Thank you for your patience!
            </p>
            
            <div class="company-info">
              <div class="company-name">Century Info Systems</div>
              <div class="company-tagline">Empowering Digital Transformation</div>
              <div class="company-tagline-secondary">Enterprise Resource Planning Solutions</div>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">Thank you for choosing ELRA</p>
            <p class="footer-subtitle">Powered by ELRA - Enterprise Resource Planning</p>
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
};
