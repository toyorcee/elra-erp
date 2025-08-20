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
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
                position: relative;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: url(data:image/png;base64,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);
                background-size: cover;
                background-position: center;
                opacity: 0.1;
                z-index: 1;
            }
            
            .header > * {
                position: relative;
                z-index: 2;
            }
            
            .logo-container {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                flex-direction: column;
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
                            <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
            border: 2px solid #ffffff;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Poppins', sans-serif;
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            letter-spacing: 2px;
        ">ELRA</div>
                    <div class="logo-text">ELRA</div>
                </div>
                <div class="subtitle">Enterprise Resource Planning System</div>
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
            <div class="logo-container">
              <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" class="logo-image">
                <rect width="60" height="60" rx="8" fill="#ffffff" opacity="0.1"/>
                <text x="30" y="35" font-family="Poppins, sans-serif" font-size="24" font-weight="800" text-anchor="middle" fill="#ffffff">ELRA</text>
              </svg>
            <div class="logo-text">ELRA</div>
            </div>
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
            justify-content: space-between;
            margin: 15px 0;
            padding: 10px 0;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .payslip-detail {
            text-align: center;
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
               <div class="logo-text">ELRA</div>
             </div>
             <div class="subtitle">Enterprise Resource Planning System</div>
           </div>
          
          <div class="content">
            <h1 class="title">📄 Your Payslip is Ready!</h1>
            <p class="message">
              Hello <strong>${employeeName}</strong>,<br><br>
              Great news! Your payslip for <strong>${period}</strong> has been generated and is now available for download. 🎉
            </p>
            
            <div class="payslip-card">
              <div class="payslip-icon">💰</div>
              <div class="payslip-title">Payslip Summary</div>
              
              <div class="payslip-details">
                <div class="payslip-detail">
                  <div class="detail-label">Pay Period</div>
                  <div class="detail-value">${period}</div>
                </div>
                <div class="payslip-detail">
                  <div class="detail-label">Net Pay</div>
                  <div class="detail-value">${netPay}</div>
                </div>
              </div>
              
              <div class="net-pay">
                Net Pay: ${netPay}
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 15px 0;">
                Your detailed payslip is attached to this email. You can also view it anytime in your ELRA dashboard.
              </p>
            </div>
            
            <p class="message">
              If you have any questions about your payslip, please contact your HR department or Head of Department.
            </p>
            
            <div class="company-info">
              <div class="company-name">Century Info Systems</div>
              <div class="company-tagline">Empowering Digital Transformation</div>
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
};
