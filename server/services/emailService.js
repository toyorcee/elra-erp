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
        <h1>ELRA</h1>
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
        <p>Hello <strong>${userName}</strong>,</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
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
        <p>Hello <strong>${userName}</strong>,</p>
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
              <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" class="logo-image">
                <rect width="60" height="60" rx="8" fill="#ffffff" opacity="0.1"/>
                <text x="30" y="35" font-family="Poppins, sans-serif" font-size="24" font-weight="800" text-anchor="middle" fill="#ffffff">ELRA</text>
              </svg>
            <div class="logo-text">ELRA</div>
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
               <div class="logo-text">ELRA</div>
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

    const htmlContent = createEmailTemplate(
      "Thank You for Partnering with ELRA!",
      `
        <p>Hello <strong>${vendorData.name}</strong>,</p>
        <p>🎉 Thank you for trusting ELRA with your business partnership!</p>
        <p>We're excited to work with you on our upcoming project and look forward to a successful collaboration.</p>
        <p>Your vendor registration has been received and is currently being processed. We'll be in touch soon with next steps.</p>
        <p>If you have any questions, please don't hesitate to reach out to our procurement team.</p>
      `,
      null, // No action button needed
      null,
      "Thank you for choosing ELRA as your business partner"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: vendorData.email,
      subject: "Welcome to ELRA - Vendor Registration Confirmation",
      html: htmlContent,
    };

    // Add PDF attachment if provided
    if (pdfBuffer) {
      mailOptions.attachments = [
        {
          filename: `vendor_receipt_${vendorData.name.replace(
            /\s+/g,
            "_"
          )}.pdf`,
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
};
