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
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      // For development, you can use ethereal.email for testing
      // or configure a real SMTP server
    });
    return { provider: 'smtp', client: transporter };
  }
}

const emailService = initializeEmailService();

async function sendEmail({ to, subject, html, text }) {
  try {
    if (process.env.EMAIL_ENABLED !== 'true') {
      console.log('[Email Service] Email disabled. Would send:', { to, subject });
      return { success: true, message: 'Email disabled (development mode)' };
    }

    const from = process.env.EMAIL_FROM || 'noreply@smartformvalidator.com';

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
      await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });
    }

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    // Don't throw - email failures shouldn't break the main flow
    return { success: false, message: error.message };
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

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendSubmissionNotificationEmail,
  sendSubmissionConfirmationEmail,
};

