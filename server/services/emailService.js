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

// Beautiful email template with brand colors
const createEmailTemplate = (
  title,
  content,
  actionText,
  actionUrl,
  footerText
) => {
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
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .subtitle {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .title {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .message {
                font-size: 16px;
                color: #666;
                margin-bottom: 30px;
                line-height: 1.8;
            }
            
            .action-button {
                display: inline-block;
                background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 50px;
                font-weight: bold;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
            }
            
            .action-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
            }
            
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            
            .footer-text {
                margin-bottom: 15px;
            }
            
            .company-info {
                color: #999;
                font-size: 12px;
            }
            
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, #ddd, transparent);
                margin: 30px 0;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 10px;
                    border-radius: 15px;
                }
                
                .header, .content, .footer {
                    padding: 20px;
                }
                
                .title {
                    font-size: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">EDMS</div>
                <div class="subtitle">Electronic Document Management System</div>
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
                
                <div class="divider"></div>
                
                <div style="font-size: 14px; color: #666; text-align: center;">
                    <p>If you didn't request this action, please ignore this email.</p>
                    <p>This link will expire in 1 hour for security reasons.</p>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">${
                  footerText || "Thank you for using EDMS"
                }</div>
                <div class="company-info">
                    © 2024 EDMS System. All rights reserved.<br>
                    Secure Document Management Solution
                </div>
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
      "Reset Your Password",
      `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>We received a request to reset your password for your EDMS account. If you made this request, please click the button below to create a new password.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      `,
      "Reset Password",
      resetUrl,
      "Your password reset request"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "EDMS - Password Reset Request",
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
      "Welcome to EDMS!",
      `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Welcome to EDMS - Your Electronic Document Management System!</p>
        <p>Your account has been successfully created. You can now log in to access the system and start managing your documents securely.</p>
        <p>We're excited to have you on board!</p>
      `,
      "Login to EDMS",
      loginUrl,
      "Welcome to the EDMS family"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Welcome to EDMS - Your Account is Ready!",
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
    const transporter = createTransporter();

    const activationUrl = `${process.env.CLIENT_URL}/activate-account?token=${activationToken}`;

    const htmlContent = createEmailTemplate(
      "Activate Your EDMS Account",
      `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Thank you for registering with EDMS! To complete your account setup, please click the button below to activate your account.</p>
        <p>Once activated, you'll have full access to all EDMS features.</p>
      `,
      "Activate Account",
      activationUrl,
      "Complete your account setup"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "EDMS - Activate Your Account",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Activation email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending activation email:", error);
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
        <p>Your EDMS account password has been successfully changed.</p>
        <p>If you did not make this change, please contact your system administrator immediately.</p>
        <p>You can now log in to your account with your new password.</p>
      `,
      "Login to EDMS",
      loginUrl,
      "Your password has been updated"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "EDMS - Password Changed Successfully",
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
      `Welcome to ${companyName} - EDMS Platform`,
      `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Welcome to the <strong>${companyName}</strong> EDMS platform!</p>
        <p>Your account has been created as a <strong>Super Administrator</strong> for the ${industryType.replace(
          "_",
          " "
        )} system.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after your first login for security.</p>
        <p>If you lose this email, you can retrieve your credentials at any time using the credentials retrieval page.</p>
      `,
      "Login to EDMS",
      loginUrl,
      `Welcome to ${companyName} - Your EDMS platform is ready!`
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to ${companyName} - EDMS Platform Access`,
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
      "🎉 Your EDMS Subscription is Active!",
      `
        <p>Hello <strong>${companyName}</strong> Team,</p>
        <p>🎊 <strong>Congratulations!</strong> Your EDMS subscription has been successfully activated!</p>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Subscription Details</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Billing Cycle:</strong> ${billingCycle}</p>
          <p style="margin: 15px 0 0 0; font-size: 16px;">Your platform is now ready for use!</p>
        </div>
        
        <p>🚀 <strong>What's Next?</strong></p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Set up your approval workflows</li>
          <li>Create departments and user roles</li>
          <li>Upload your first documents</li>
          <li>Configure your system settings</li>
        </ul>
        
        <p>Need help getting started? Our support team is here to assist you!</p>
      `,
      "Access Your EDMS Platform",
      loginUrl,
      "Welcome to the EDMS family - Your subscription is active!"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "🎉 Your EDMS Subscription is Now Active!",
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
        } has subscribed to EDMS!</p>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">New Subscription Details</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>${
            subscriptionData.isCompany ? "Company" : "User"
          }:</strong> ${
        subscriptionData.companyName || subscriptionData.userName
      }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Email:</strong> ${
            subscriptionData.adminEmail || subscriptionData.userEmail
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${
            subscriptionData.planName
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Billing Cycle:</strong> ${
            subscriptionData.billingCycle
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${
            subscriptionData.currency
          } ${subscriptionData.amount}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Payment Provider:</strong> ${
            subscriptionData.paymentProvider
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Type:</strong> ${
            subscriptionData.isCompany
              ? "Company Subscription"
              : "Individual User"
          }</p>
        </div>
        
        <p>💰 <strong>Revenue Impact:</strong> This subscription adds to your monthly recurring revenue!</p>
        <p>📊 <strong>Next Steps:</strong> Monitor their usage and ensure they have a great onboarding experience.</p>
      `,
      "View Dashboard",
      dashboardUrl,
      "New subscription alert - EDMS Platform"
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
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Renewal Details</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>${
            subscriptionData.isCompany ? "Company" : "User"
          }:</strong> ${
        subscriptionData.companyName || subscriptionData.userName
      }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${
            subscriptionData.planName
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Billing Cycle:</strong> ${
            subscriptionData.billingCycle
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${
            subscriptionData.currency
          } ${subscriptionData.amount}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Next Billing:</strong> ${
            subscriptionData.nextBillingDate
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Type:</strong> ${
            subscriptionData.isCompany
              ? "Company Subscription"
              : "Individual User"
          }</p>
        </div>
        
        <p>💰 <strong>Revenue Impact:</strong> Recurring revenue confirmed!</p>
        <p>📈 <strong>Customer Retention:</strong> This shows strong product-market fit!</p>
      `,
      "View Dashboard",
      dashboardUrl,
      "Subscription renewal alert - EDMS Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: platformAdminEmail,
      subject: `🔄 EDMS Subscription Renewed - ${
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
        
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Cancellation Details</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>${
            subscriptionData.isCompany ? "Company" : "User"
          }:</strong> ${
        subscriptionData.companyName || subscriptionData.userName
      }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Email:</strong> ${
            subscriptionData.adminEmail || subscriptionData.userEmail
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${
            subscriptionData.planName
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Reason:</strong> ${
            subscriptionData.cancellationReason || "Not specified"
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Cancelled Date:</strong> ${
            subscriptionData.cancelledDate
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Type:</strong> ${
            subscriptionData.isCompany
              ? "Company Subscription"
              : "Individual User"
          }</p>
        </div>
        
        <p>📊 <strong>Action Required:</strong> Consider reaching out to understand their needs.</p>
        <p>💡 <strong>Opportunity:</strong> This could be a chance to improve the product or offer better support.</p>
      `,
      "View Dashboard",
      dashboardUrl,
      "Subscription cancellation alert - EDMS Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: platformAdminEmail,
      subject: `⚠️ EDMS Subscription Cancelled - ${
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
        
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Payment Failure Details</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>${
            subscriptionData.isCompany ? "Company" : "User"
          }:</strong> ${
        subscriptionData.companyName || subscriptionData.userName
      }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Email:</strong> ${
            subscriptionData.adminEmail || subscriptionData.userEmail
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${
            subscriptionData.planName
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${
            subscriptionData.currency
          } ${subscriptionData.amount}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Payment Provider:</strong> ${
            subscriptionData.paymentProvider
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Error:</strong> ${
            subscriptionData.errorMessage || "Unknown error"
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Type:</strong> ${
            subscriptionData.isCompany
              ? "Company Subscription"
              : "Individual User"
          }</p>
        </div>
        
        <p>⚠️ <strong>Action Required:</strong> The subscription may be suspended if payment is not resolved.</p>
        <p>📧 <strong>Next Steps:</strong> Consider reaching out to the customer to resolve payment issues.</p>
      `,
      "View Dashboard",
      dashboardUrl,
      "Payment failure alert - EDMS Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: platformAdminEmail,
      subject: `❌ EDMS Payment Failed - ${
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
        <p>✅ <strong>Great news!</strong> Your EDMS subscription has been successfully renewed!</p>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Renewal Confirmation</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${subscriptionData.planName}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Billing Cycle:</strong> ${subscriptionData.billingCycle}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${subscriptionData.currency} ${subscriptionData.amount}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Next Billing:</strong> ${subscriptionData.nextBillingDate}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Transaction ID:</strong> ${subscriptionData.transactionId}</p>
        </div>
        
        <p>🚀 <strong>Your EDMS platform continues to be fully active!</strong></p>
        <p>📊 <strong>What's Next:</strong> Continue using all your features and enjoy uninterrupted service.</p>
      `,
      "Access Your Dashboard",
      dashboardUrl,
      "Subscription renewed successfully - EDMS Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "🔄 Your EDMS Subscription Has Been Renewed!",
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
        <p>⚠️ <strong>Important Notice:</strong> Your EDMS subscription has been cancelled.</p>
        
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Cancellation Details</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${
            subscriptionData.planName
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Cancelled Date:</strong> ${
            subscriptionData.cancelledDate
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Reason:</strong> ${
            subscriptionData.cancellationReason || "Not specified"
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Access Until:</strong> ${
            subscriptionData.accessUntil || "End of current billing period"
          }</p>
        </div>
        
        <p>📊 <strong>What This Means:</strong> Your access will continue until the end of your current billing period.</p>
        <p>💡 <strong>Need Help?</strong> If this was a mistake or you'd like to reactivate, please contact our support team.</p>
      `,
      "Contact Support",
      `${process.env.CLIENT_URL}/support`,
      "Subscription cancelled - EDMS Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "⚠️ Your EDMS Subscription Has Been Cancelled",
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
        
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Payment Failure Details</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${
            subscriptionData.planName
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${
            subscriptionData.currency
          } ${subscriptionData.amount}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Payment Provider:</strong> ${
            subscriptionData.paymentProvider
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Error:</strong> ${
            subscriptionData.errorMessage || "Unknown error"
          }</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Next Retry:</strong> ${
            subscriptionData.nextRetryDate || "Within 24 hours"
          }</p>
        </div>
        
        <p>⚠️ <strong>Action Required:</strong> Please update your payment method to avoid service interruption.</p>
        <p>🔧 <strong>Quick Fix:</strong> Log into your dashboard to update your billing information.</p>
      `,
      "Update Payment Method",
      dashboardUrl,
      "Payment failed - Action required - EDMS Platform"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "❌ Payment Failed - Action Required - EDMS",
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

export default {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountActivationEmail,
  sendPasswordChangeSuccessEmail,
  sendEmail,
  sendIndustryInstanceInvitation,
  sendSubscriptionEmail,
  sendPlatformAdminNewSubscriptionEmail,
  sendPlatformAdminRenewalEmail,
  sendPlatformAdminCancellationEmail,
  sendPlatformAdminPaymentFailureEmail,
  sendUserRenewalEmail,
  sendUserCancellationEmail,
  sendUserPaymentFailureEmail,
};
