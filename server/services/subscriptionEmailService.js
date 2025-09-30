import nodemailer from "nodemailer";
import Transaction from "../models/Transaction.js";

// Helper function to format currency amounts
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
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
                <div class="logo">ELRA</div>
                <div class="subtitle">Equipment Leasing Registration Authority</div>
            </div>
            
            <div class="content">
                <h1 class="title">${title}</h1>
                <div class="message">${content}</div>
                ${
                  actionText && actionUrl
                    ? `<a href="${actionUrl}" class="action-button">${actionText}</a>`
                    : ""
                }
            </div>
            
            <div class="footer">
                <div class="footer-text">${footerText}</div>
                <div class="company-info">
                    ELRA ERP Platform - Equipment Leasing Management
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send admin invitation email with login credentials
export const sendAdminInvitationEmail = async (
  adminEmail,
  adminName,
  companyName,
  tempPassword,
  transactionId
) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const htmlContent = createEmailTemplate(
      `Welcome to ${companyName} - ELRA ERP Platform`,
      `
        <p>Hello <strong>${adminName}</strong>,</p>
        <p>🎉 <strong>Congratulations!</strong> Your ELRA ERP subscription has been successfully activated!</p>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Your Admin Account is Ready</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Company:</strong> ${companyName}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Role:</strong> Super Administrator</p>
          <p style="margin: 15px 0 0 0; font-size: 16px;">You can now access your ELRA ERP platform!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${adminEmail}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="color: #e74c3c; font-weight: bold;">⚠️ Important: Please change your password after your first login for security.</p>
        </div>
        
        <p>🚀 <strong>What's Next?</strong></p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Login to your ELRA ERP platform</li>
          <li>Change your temporary password</li>
          <li>Set up your departments and user roles</li>
          <li>Configure your approval workflows</li>
          <li>Upload your first documents</li>
        </ul>
        
        <p>Need help getting started? Our support team is here to assist you!</p>
      `,
      "Login to ELRA ERP Platform",
      loginUrl,
      `Welcome to ${companyName} - Your ELRA ERP platform is ready!`
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `Welcome to ${companyName} - ELRA ERP Platform Access`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log email to transaction
    if (transactionId) {
      await Transaction.findByIdAndUpdate(transactionId, {
        $push: {
          emailsSent: {
            type: "admin_invitation",
            recipient: adminEmail,
            status: "sent",
            messageId: result.messageId,
          },
        },
      });
    }

    console.log(`✅ Admin invitation email sent to: ${adminEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending admin invitation email to ${adminEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send individual user invitation email with login credentials
export const sendIndividualUserInvitationEmail = async (
  userEmail,
  userName,
  tempPassword,
  transactionId
) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const htmlContent = createEmailTemplate(
      `Welcome to ELRA ERP - Your Account is Ready`,
      `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>🎉 <strong>Congratulations!</strong> Your ELRA ERP subscription has been successfully activated!</p>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Your ELRA ERP Account is Ready</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Account Type:</strong> Individual User</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Role:</strong> User</p>
          <p style="margin: 15px 0 0 0; font-size: 16px;">You can now access your ELRA ERP platform!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="color: #e74c3c; font-weight: bold;">⚠️ Important: Please change your password after your first login for security.</p>
        </div>
        
        <p>🚀 <strong>What's Next?</strong></p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Login to your ELRA ERP platform</li>
          <li>Change your temporary password</li>
          <li>Set up your profile</li>
          <li>Upload your first documents</li>
          <li>Explore the platform features</li>
        </ul>
        
        <p>Need help getting started? Our support team is here to assist you!</p>
      `,
      "Login to ELRA ERP Platform",
      loginUrl,
      "Welcome to ELRA ERP - Your account is ready!"
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `Welcome to ELRA ERP - Your Account is Ready`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log email to transaction
    if (transactionId) {
      await Transaction.findByIdAndUpdate(transactionId, {
        $push: {
          emailsSent: {
            type: "individual_user_invitation",
            recipient: userEmail,
            status: "sent",
            messageId: result.messageId,
          },
        },
      });
    }

    console.log(`✅ Individual user invitation email sent to: ${userEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending individual user invitation email to ${userEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send company billing/invoice email
export const sendCompanyBillingEmail = async (
  companyEmail,
  companyName,
  planName,
  billingCycle,
  amount,
  currency,
  transactionId,
  billingPeriod
) => {
  try {
    const transporter = createTransporter();
    const billingUrl = `${process.env.CLIENT_URL}/billing`;

    const formattedAmount = formatCurrency(amount, currency);

    const htmlContent = createEmailTemplate(
      `ELRA ERP Subscription Invoice - ${companyName}`,
      `
        <p>Hello <strong>${companyName}</strong> Team,</p>
        <p>Thank you for your ELRA ERP subscription! Here's your billing information.</p>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Subscription Invoice</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Billing Cycle:</strong> ${billingCycle}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${formattedAmount}</p>
          ${
            billingPeriod
              ? `<p style="margin: 5px 0; font-size: 16px;"><strong>Period:</strong> ${new Date(
                  billingPeriod.startDate
                ).toLocaleDateString()} - ${new Date(
                  billingPeriod.endDate
                ).toLocaleDateString()}</p>`
              : ""
          }
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">What's Included:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Full access to ELRA ERP platform</li>
            <li>Document management and workflow automation</li>
            <li>Team collaboration tools</li>
            <li>24/7 customer support</li>
            <li>Regular platform updates and improvements</li>
          </ul>
        </div>
        
        <p>📊 <strong>Manage Your Subscription:</strong></p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>View billing history and invoices</li>
          <li>Update payment methods</li>
          <li>Change subscription plans</li>
          <li>Download receipts and tax documents</li>
        </ul>
        
        <p>If you have any questions about your billing, please contact our support team.</p>
      `,
      "View Billing Dashboard",
      billingUrl,
      `Thank you for choosing ELRA ERP - Your subscription is active!`
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: companyEmail,
      subject: `ELRA ERP Subscription Invoice - ${companyName}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log email to transaction
    if (transactionId) {
      await Transaction.findByIdAndUpdate(transactionId, {
        $push: {
          emailsSent: {
            type: "company_billing",
            recipient: companyEmail,
            status: "sent",
            messageId: result.messageId,
          },
        },
      });
    }

    console.log(`✅ Company billing email sent to: ${companyEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending company billing email to ${companyEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send payment confirmation email
export const sendPaymentConfirmationEmail = async (
  adminEmail,
  companyEmail,
  companyName,
  planName,
  amount,
  currency,
  transactionId
) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const formattedAmount = formatCurrency(amount, currency);

    const htmlContent = createEmailTemplate(
      `Payment Confirmed - ${companyName}`,
      `
        <p>Hello <strong>${companyName}</strong> Team,</p>
        <p>🎉 <strong>Payment Successful!</strong> Your ELRA ERP subscription payment has been confirmed.</p>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Payment Confirmed</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${formattedAmount}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 15px 0 0 0; font-size: 16px;">Your subscription is now active!</p>
        </div>
        
        <p>✅ <strong>What's Next?</strong></p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Your admin will receive login credentials shortly</li>
          <li>Set up your departments and workflows</li>
          <li>Start managing your documents</li>
          <li>Invite team members to collaborate</li>
        </ul>
        
        <p>Thank you for choosing ELRA ERP! We're excited to help you streamline your document management.</p>
      `,
      "Access Your Platform",
      loginUrl,
      `Payment confirmed - Welcome to ELRA ERP!`
    );

    // Send to both admin and company emails
    const emails = [adminEmail, companyEmail].filter(Boolean);
    const results = [];

    for (const email of emails) {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Payment Confirmed - ${companyName} ELRA ERP Subscription`,
        html: htmlContent,
      };

      const result = await transporter.sendMail(mailOptions);
      results.push({ email, success: true, messageId: result.messageId });

      // Log email to transaction
      if (transactionId) {
        await Transaction.findByIdAndUpdate(transactionId, {
          $push: {
            emailsSent: {
              type: "payment_confirmation",
              recipient: email,
              status: "sent",
              messageId: result.messageId,
            },
          },
        });
      }
    }

    console.log(`✅ Payment confirmation emails sent to: ${emails.join(", ")}`);
    return { success: true, results };
  } catch (error) {
    console.error(
      `❌ Error sending payment confirmation emails:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send renewal reminder email
export const sendRenewalReminderEmail = async (
  companyEmail,
  companyName,
  planName,
  renewalDate,
  amount,
  currency,
  transactionId
) => {
  try {
    const transporter = createTransporter();
    const billingUrl = `${process.env.CLIENT_URL}/billing`;

    const formattedAmount = formatCurrency(amount, currency);

    const htmlContent = createEmailTemplate(
      `Subscription Renewal Reminder - ${companyName}`,
      `
        <p>Hello <strong>${companyName}</strong> Team,</p>
        <p>This is a friendly reminder that your ELRA ERP subscription will be renewed soon.</p>
        
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Renewal Reminder</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Renewal Date:</strong> ${new Date(
            renewalDate
          ).toLocaleDateString()}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${formattedAmount}</p>
        </div>
        
        <p>🔄 <strong>Auto-Renewal:</strong> Your subscription will automatically renew unless cancelled.</p>
        
        <p>📋 <strong>Need to make changes?</strong></p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Update payment method</li>
          <li>Change subscription plan</li>
          <li>Cancel auto-renewal</li>
          <li>Download invoices</li>
        </ul>
        
        <p>If you have any questions, please contact our support team.</p>
      `,
      "Manage Subscription",
      billingUrl,
      `Thank you for your continued trust in ELRA ERP!`
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: companyEmail,
      subject: `Subscription Renewal Reminder - ${companyName}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log email to transaction
    if (transactionId) {
      await Transaction.findByIdAndUpdate(transactionId, {
        $push: {
          emailsSent: {
            type: "renewal_reminder",
            recipient: companyEmail,
            status: "sent",
            messageId: result.messageId,
          },
        },
      });
    }

    console.log(`✅ Renewal reminder email sent to: ${companyEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending renewal reminder email to ${companyEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Send payment failed email
export const sendPaymentFailedEmail = async (
  companyEmail,
  companyName,
  planName,
  amount,
  currency,
  transactionId,
  retryUrl
) => {
  try {
    const transporter = createTransporter();

    const formattedAmount = formatCurrency(amount, currency);

    const htmlContent = createEmailTemplate(
      `Payment Failed - Action Required`,
      `
        <p>Hello <strong>${companyName}</strong> Team,</p>
        <p>⚠️ <strong>Payment Failed:</strong> We were unable to process your subscription payment.</p>
        
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Payment Failed</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ${formattedAmount}</p>
          <p style="margin: 15px 0 0 0; font-size: 16px;">Please update your payment method to continue service.</p>
        </div>
        
        <p>🔧 <strong>What to do:</strong></p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Check your payment method details</li>
          <li>Ensure sufficient funds are available</li>
          <li>Update your payment information</li>
          <li>Contact your bank if needed</li>
        </ul>
        
        <p>⏰ <strong>Important:</strong> Your service will be suspended if payment is not received within 3 days.</p>
        
        <p>Need help? Our support team is here to assist you.</p>
      `,
      "Update Payment Method",
      retryUrl,
      `Please update your payment method to continue using ELRA ERP.`
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: companyEmail,
      subject: `Payment Failed - Action Required - ${companyName}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log email to transaction
    if (transactionId) {
      await Transaction.findByIdAndUpdate(transactionId, {
        $push: {
          emailsSent: {
            type: "payment_failed",
            recipient: companyEmail,
            status: "sent",
            messageId: result.messageId,
          },
        },
      });
    }

    console.log(`✅ Payment failed email sent to: ${companyEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending payment failed email to ${companyEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

export default {
  sendAdminInvitationEmail,
  sendCompanyBillingEmail,
  sendPaymentConfirmationEmail,
  sendRenewalReminderEmail,
  sendPaymentFailedEmail,
};
