const nodemailer = require('nodemailer');

// Email service configuration
// Supports both development (nodemailer with SMTP) and production (SendGrid/SES)
let transporter = null;

function initializeEmailService() {
  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp'; // smtp, sendgrid, ses

  if (emailProvider === 'sendgrid') {
    try {
      // SendGrid configuration
      const sgMail = require('@sendgrid/mail');
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('[Email Service] SendGrid API key not found, falling back to SMTP');
        return initializeSmtp();
      }
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      return { provider: 'sendgrid', client: sgMail };
    } catch (err) {
      console.warn('[Email Service] SendGrid package not installed, falling back to SMTP:', err.message);
      return initializeSmtp();
    }
  } else if (emailProvider === 'ses') {
    try {
      // AWS SES configuration
      const aws = require('aws-sdk');
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.warn('[Email Service] AWS credentials not found, falling back to SMTP');
        return initializeSmtp();
      }
      const ses = new aws.SES({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      return { provider: 'ses', client: ses };
    } catch (err) {
      console.warn('[Email Service] AWS SDK not installed, falling back to SMTP:', err.message);
      return initializeSmtp();
    }
  } else {
    return initializeSmtp();
  }

  function initializeSmtp() {
    // Default: SMTP (for development/testing)
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    };

    // Only add auth if credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      smtpConfig.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    transporter = nodemailer.createTransport(smtpConfig);
    
    // Log configuration status
    if (process.env.EMAIL_ENABLED === 'true') {
      console.log('[Email Service] SMTP configured:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        hasAuth: !!smtpConfig.auth,
        user: smtpConfig.auth ? smtpConfig.auth.user : 'not set'
      });
    } else {
      console.log('[Email Service] Email service is DISABLED. Set EMAIL_ENABLED=true to enable.');
    }
    
    return { provider: 'smtp', client: transporter };
  }
}

const emailService = initializeEmailService();

// Verify SMTP connection on startup (only if email is enabled)
if (process.env.EMAIL_ENABLED === 'true' && emailService.provider === 'smtp') {
  if (transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter.verify(function(error, success) {
      if (error) {
        console.error('[Email Service] SMTP connection verification FAILED:', error.message);
        console.error('[Email Service] Please check your SMTP credentials in .env file');
        if (error.code === 'EAUTH') {
          console.error('[Email Service] Authentication failed. For Gmail, make sure you\'re using an App Password, not your regular password.');
        }
      } else {
        console.log('[Email Service] SMTP connection verified successfully ✓');
      }
    });
  } else {
    console.warn('[Email Service] SMTP credentials not configured. Email sending will fail.');
    console.warn('[Email Service] Set SMTP_USER and SMTP_PASS in .env file');
  }
}

async function sendEmail({ to, subject, html, text }) {
  try {
    if (process.env.EMAIL_ENABLED !== 'true') {
      console.log('[Email Service] Email disabled. Would send:', { to, subject });
      return { success: false, message: 'Email service is disabled. Set EMAIL_ENABLED=true in .env file to enable email sending.' };
    }

    const from = process.env.EMAIL_FROM || 'noreply@smartformvalidator.com';

    // Validate SMTP configuration for SMTP provider
    if (emailService.provider === 'smtp') {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        const errorMsg = 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in your .env file. For Gmail, use an App Password (not your regular password).';
        console.error('[Email Service]', errorMsg);
        return { success: false, message: errorMsg };
      }
      
      // Verify transporter is configured
      if (!transporter) {
        const errorMsg = 'SMTP transporter not initialized. Check your SMTP configuration.';
        console.error('[Email Service]', errorMsg);
        return { success: false, message: errorMsg };
      }
    }

    if (emailService.provider === 'sendgrid') {
      await emailService.client.send({
        to,
        from,
        subject,
        html,
        text,
      });
    } else if (emailService.provider === 'ses') {
      await emailService.client.sendEmail({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: html },
            Text: { Data: text || html.replace(/<[^>]*>/g, '') },
          },
        },
      }).promise();
    } else {
      // SMTP
      if (!transporter) {
        throw new Error('SMTP transporter not initialized');
      }
      
      // For Gmail, use the authenticated user's email as the from address
      // Gmail will override the from address to match the authenticated account
      const fromAddress = emailService.provider === 'smtp' && process.env.SMTP_USER 
        ? process.env.SMTP_USER 
        : from;
      
      const mailOptions = {
        from: `"Smart Form Validator" <${fromAddress}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('[Email Service] Email sent. Message ID:', info.messageId);
    }

    console.log('[Email Service] Email sent successfully to:', to);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    console.error('[Email Service] Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Check your SMTP_USER and SMTP_PASS. For Gmail, make sure you\'re using an App Password (not your regular password). Get one at: https://myaccount.google.com/apppasswords';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT settings.';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Invalid email address. Please check the recipient email.';
    } else if (error.responseCode === 535) {
      errorMessage = 'SMTP authentication failed. For Gmail, you must use an App Password. Enable 2-Step Verification and generate an App Password.';
    } else if (error.responseCode === 550) {
      errorMessage = 'Email address rejected by server. Check if the email address is valid.';
    }
    
    return { success: false, message: errorMessage, errorCode: error.code };
  }
}

async function sendRegistrationEmail(userEmail, role) {
  const subject = 'Welcome to Smart Form Validator';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Smart Form Validator!</h2>
      <p>Thank you for registering with Smart Form Validator.</p>
      <p><strong>Your account details:</strong></p>
      <ul>
        <li>Email: ${userEmail}</li>
        <li>Role: ${role === 'admin' ? 'Administrator' : 'User'}</li>
      </ul>
      <p>You can now start using the platform to ${role === 'admin' ? 'create and manage forms' : 'fill out forms'}.</p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">This is an automated email from Smart Form Validator.</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

async function sendSubmissionNotificationEmail(adminEmail, formTitle, submissionId, hasAiFlags) {
  const subject = `New Form Submission: ${formTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Form Submission</h2>
      <p>A new submission has been received for the form: <strong>${formTitle}</strong></p>
      <p><strong>Submission ID:</strong> #${submissionId}</p>
      ${hasAiFlags ? '<p style="color: #ef4444;"><strong>⚠️ This submission has been flagged by AI for review.</strong></p>' : ''}
      <p>Please log in to the admin dashboard to review this submission.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">This is an automated email from Smart Form Validator.</p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
}

async function sendSubmissionConfirmationEmail(userEmail, formTitle, submissionId) {
  const subject = `Form Submission Confirmation: ${formTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your Submission</h2>
      <p>Your form submission has been received successfully.</p>
      <p><strong>Form:</strong> ${formTitle}</p>
      <p><strong>Submission ID:</strong> #${submissionId}</p>
      <p>We appreciate your time and will review your submission shortly.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">This is an automated email from Smart Form Validator.</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

async function sendPasswordResetEmail(userEmail, resetUrl) {
  const subject = 'Password Reset Request - Smart Form Validator';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You have requested to reset your password for your Smart Form Validator account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">This is an automated email from Smart Form Validator. Please do not reply to this email.</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendSubmissionNotificationEmail,
  sendSubmissionConfirmationEmail,
  sendPasswordResetEmail,
};

