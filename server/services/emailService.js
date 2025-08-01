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
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 
                    0 25px 50px -12px rgba(0, 0, 0, 0.25),
                    0 0 0 1px rgba(255, 255, 255, 0.1),
                    0 0 40px rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .header {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);
                padding: 50px 30px;
                text-align: center;
                color: white;
                position: relative;
                overflow: hidden;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.4) 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 60% 60%, rgba(16, 185, 129, 0.2) 0%, transparent 50%);
                animation: float 8s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
                25% { transform: translateY(-8px) rotate(0.5deg) scale(1.02); }
                50% { transform: translateY(-15px) rotate(1deg) scale(1.05); }
                75% { transform: translateY(-8px) rotate(0.5deg) scale(1.02); }
            }
            
            .logo {
                font-size: 36px;
                font-weight: bold;
                margin-bottom: 16px;
                position: relative;
                z-index: 1;
                text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                letter-spacing: -1px;
            }
            
            .subtitle {
                font-size: 16px;
                opacity: 0.9;
                position: relative;
                z-index: 1;
                font-weight: 300;
                letter-spacing: 0.5px;
            }
            
            .content {
                padding: 50px 30px;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
            }
            
            .title {
                font-size: 28px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 25px;
                text-align: center;
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                position: relative;
            }
            
            .title::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 3px;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                border-radius: 2px;
            }
            
            .message {
                font-size: 16px;
                color: #475569;
                margin-bottom: 35px;
                line-height: 1.8;
                text-align: center;
            }
            
            .message strong {
                color: #1e293b;
                font-weight: 600;
            }
            
            .action-button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
                color: white;
                text-decoration: none;
                padding: 18px 36px;
                border-radius: 50px;
                font-weight: bold;
                font-size: 16px;
                text-align: center;
                transition: all 0.3s ease;
                box-shadow: 
                    0 10px 25px -5px rgba(59, 130, 246, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }
            
            .action-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s;
            }
            
            .action-button:hover::before {
                left: 100%;
            }
            
            .action-button:hover {
                transform: translateY(-2px);
                box-shadow: 
                    0 20px 40px -10px rgba(59, 130, 246, 0.6),
                    0 0 0 1px rgba(255, 255, 255, 0.2);
            }
            
            .footer {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);
                padding: 30px;
                text-align: center;
                color: #cbd5e1;
                font-size: 14px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }
            
            .footer-text {
                font-weight: 600;
                color: #e2e8f0;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .footer-subtitle {
                font-size: 12px;
                opacity: 0.8;
                color: #94a3b8;
            }
            
            .floating-elements {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                overflow: hidden;
            }
            
            .floating-element {
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                animation: float-particle 4s ease-in-out infinite;
            }
            
            .floating-element:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
            .floating-element:nth-child(2) { top: 60%; left: 80%; animation-delay: 1s; }
            .floating-element:nth-child(3) { top: 40%; left: 20%; animation-delay: 2s; }
            .floating-element:nth-child(4) { top: 80%; left: 70%; animation-delay: 3s; }
            
            @keyframes float-particle {
                0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(-10px) scale(1.1) rotate(90deg); opacity: 0.6; }
                50% { transform: translateY(-25px) scale(1.3) rotate(180deg); opacity: 0.9; }
                75% { transform: translateY(-10px) scale(1.1) rotate(270deg); opacity: 0.6; }
            }
            
            @media (max-width: 600px) {
                body { padding: 10px; }
                .email-container { border-radius: 16px; }
                .header { padding: 40px 20px; }
                .content { padding: 40px 20px; }
                .title { font-size: 24px; }
                .action-button { padding: 16px 32px; font-size: 15px; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="floating-elements">
                    <div class="floating-element"></div>
                    <div class="floating-element"></div>
                    <div class="floating-element"></div>
                    <div class="floating-element"></div>
                </div>
                <div class="logo">EDMS</div>
                <div class="subtitle">Electronic Document Management System</div>
            </div>
            
            <div class="content">
                <h1 class="title">${title}</h1>
                <div class="message">
                    ${content}
                </div>
                
                <div style="text-align: center;">
                    <a href="${actionUrl}" class="action-button">
                        ${actionText}
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">${footerText}</div>
                <div class="footer-subtitle">Powered by EDMS - Secure Document Management</div>
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
      "Reset Your EDMS Password",
      `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>🔐 We received a request to reset your EDMS account password.</p>
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
        <p>🎉 Congratulations! Your EDMS account has been successfully activated.</p>
        <p>You now have full access to our comprehensive document management platform with advanced features like workflow automation, team collaboration, and secure file storage.</p>
        <p>Ready to transform your document management experience? Click the button below to get started!</p>
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
    console.log(`📧 SENDING ACTIVATION EMAIL to: ${email}`);
    const transporter = createTransporter();

    const activationUrl = `${process.env.CLIENT_URL}/verify-email-success?token=${activationToken}`;

    const htmlContent = createEmailTemplate(
      "Activate Your EDMS Account",
      `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>🎉 Welcome to EDMS! We're excited to have you join our secure document management platform.</p>
        <p>To complete your account setup and unlock all the powerful features, please click the button below to activate your account.</p>
        <p>Once activated, you'll have full access to document management, workflow automation, and team collaboration tools.</p>
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
        <p>✅ Your EDMS account password has been successfully updated.</p>
        <p>You can now log in to your account with your new secure password.</p>
        <p>If you did not make this change, please contact your system administrator immediately for security assistance.</p>
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
        <p>🎉 Welcome to the <strong>${companyName}</strong> EDMS platform!</p>
        <p>Your account has been created as a <strong>Super Administrator</strong> for the ${industryType.replace(
          "_",
          " "
        )} system with full control over document management and workflows.</p>
        
        <p>🔐 <strong>Your Login Credentials:</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        
        <p>⚠️ <strong>Security Note:</strong> Please change your password immediately after your first login to ensure account security.</p>
        <p>You can now access the platform and start configuring your document management system!</p>
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

// Send employee invitation email
export const sendInvitationEmail = async (
  email,
  userName,
  invitationCode,
  companyName
) => {
  try {
    const transporter = createTransporter();
    const joinUrl = `${process.env.CLIENT_URL}/welcome?code=${invitationCode}`;

    const htmlContent = createEmailTemplate(
      `You're Invited to Join ${companyName} - EDMS Platform`,
      `
        <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(59, 130, 246, 0.1);">
            <p style="margin: 0 0 12px 0; font-size: 18px; color: #1e293b;">Hello <strong style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${userName}</strong>,</p>
            <p style="margin: 0 0 12px 0; font-size: 16px; color: #334155;">🎉 You've been invited to join the <strong style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${companyName}</strong> document management system!</p>
            <p style="margin: 0; font-size: 14px; color: #64748b;">Your administrator has created an account for you to access our secure internal document management platform.</p>
        </div>
        
        <p>🔑 <strong>Your Invitation Code:</strong></p>
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%); padding: 20px; border-radius: 16px; margin: 20px 0; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);">
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">${invitationCode}</p>
        </div>
        
        <p>📋 <strong>How to Join:</strong></p>
        <ol style="margin: 15px 0; padding-left: 20px;">
          <li style="margin: 8px 0; padding: 8px 12px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 8px; border-left: 3px solid #3b82f6;">Click the "Join Company" button below (your invitation code will be automatically filled)</li>
          <li style="margin: 8px 0; padding: 8px 12px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 8px; border-left: 3px solid #8b5cf6;">Complete your account setup</li>
          <li style="margin: 8px 0; padding: 8px 12px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 8px; border-left: 3px solid #06b6d4;">Start accessing your documents and workflows</li>
        </ol>
        
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46; font-weight: 600;">💡 <strong>Alternative:</strong> You can also manually enter your invitation code: <strong style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${invitationCode}</strong></p>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">⏰ <strong>Important:</strong> This invitation code expires in 7 days. Please complete your registration before then.</p>
        </div>
        <p>If you have any questions, please contact your system administrator.</p>
      `,
      "Join Company",
      joinUrl,
      `You're invited to join ${companyName} - EDMS Platform`
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `You're Invited to Join ${companyName} - EDMS Platform`,
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
      "🎉 Your EDMS Subscription is Active!",
      `
        <p>Hello <strong>${companyName}</strong> Team,</p>
        <p>🎊 <strong>Congratulations!</strong> Your EDMS subscription has been successfully activated!</p>
        
        <p>📋 <strong>Subscription Details:</strong></p>
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Billing Cycle:</strong> ${billingCycle}</p>
        
        <p>🚀 <strong>What's Next?</strong></p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li>Set up your approval workflows</li>
          <li>Create departments and user roles</li>
          <li>Upload your first documents</li>
          <li>Configure your system settings</li>
        </ul>
        
        <p>Your platform is now ready for use! Need help getting started? Our support team is here to assist you!</p>
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
        
        <p>📋 <strong>Renewal Confirmation:</strong></p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Billing Cycle:</strong> ${subscriptionData.billingCycle}</p>
        <p><strong>Amount:</strong> ${subscriptionData.currency} ${subscriptionData.amount}</p>
        <p><strong>Next Billing:</strong> ${subscriptionData.nextBillingDate}</p>
        <p><strong>Transaction ID:</strong> ${subscriptionData.transactionId}</p>
        
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

// New email for pending registration
export const sendPendingRegistrationEmail = async (email, firstName) => {
  try {
    const transporter = createTransporter();
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Received - EDMS</title>
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
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);
            min-height: 100vh;
            padding: 20px;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 0 40px rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);
            padding: 50px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 60% 60%, rgba(16, 185, 129, 0.2) 0%, transparent 50%);
            animation: float 8s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
            25% { transform: translateY(-8px) rotate(0.5deg) scale(1.02); }
            50% { transform: translateY(-15px) rotate(1deg) scale(1.05); }
            75% { transform: translateY(-8px) rotate(0.5deg) scale(1.02); }
          }
          
          .logo {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .subtitle {
            font-size: 18px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          
          .content {
            padding: 50px 30px;
            text-align: center;
          }
          
          .icon {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            font-size: 50px;
            color: white;
            box-shadow: 0 15px 35px rgba(245, 158, 11, 0.3);
          }
          
          .title {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
          }
          
          .message {
            font-size: 18px;
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          
          .highlight {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #fbbf24;
            border-radius: 16px;
            padding: 25px;
            margin: 30px 0;
            text-align: left;
          }
          
          .highlight-title {
            font-weight: bold;
            color: #92400e;
            font-size: 20px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .highlight-text {
            color: #78350f;
            font-size: 16px;
            line-height: 1.5;
          }
          
          .footer {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer-text {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .footer-logo {
            font-size: 20px;
            font-weight: bold;
            color: #3b82f6;
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
            <div class="icon">⏳</div>
            <h1 class="title">Registration Received!</h1>
            <p class="message">
              Hello <strong>${firstName}</strong>,<br><br>
              Thank you for registering with EDMS! 🎉<br><br>
              Your registration has been received and is currently under review by our Super Administrator.
            </p>
            
            <div class="highlight">
              <div class="highlight-title">
                <span>📋</span>
                What happens next?
              </div>
              <div class="highlight-text">
                1. Super Admin will review your registration<br>
                2. You'll receive an invitation email with a unique code<br>
                3. Use the code to complete your account setup<br>
                4. Get assigned to the appropriate department and role
              </div>
            </div>
            
            <p class="message">
              You'll receive an email notification once your account has been approved and your invitation code is ready.
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">Thank you for choosing EDMS</p>
            <div class="footer-logo">E 🗄️ MS</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Registration Received - EDMS",
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
