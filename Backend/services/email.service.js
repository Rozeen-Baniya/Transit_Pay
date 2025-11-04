const nodemailer = require('nodemailer');

// Simple email sender that falls back to console log when nodemailer transport is not configured.
// For production, set SMTP configuration in environment variables and create a real transporter.

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  try {
    // If SMTP env vars exist, create a transporter
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  } catch (e) {
    console.warn('Could not configure nodemailer transporter, falling back to console logging:', e.message);
  }
  return transporter;
}

async function sendPasswordResetEmail(to, resetUrl, token) {
  const transport = getTransporter();
  const subject = 'TransitPay — Password reset request';
  const text = `You requested a password reset. To reset your password:\n\n1. Go to: ${resetUrl}\n2. Enter this secure code when prompted: ${token}\n\nThis reset code will expire in 1 hour.\n\nIf you didn't request this, ignore this message.`;

  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.EMAIL_FROM || 'no-reply@transitpay.local',
        to,
        subject,
        text
      });

      // Always log a minimal sent message. In non-production (or when explicitly enabled)
      // include the reset url and token so developers can test without an SMTP inbox.
      if (process.env.NODE_ENV !== 'production' || process.env.LOG_EMAILS === 'true') {
        console.log('Password reset email (sent) ->', { to, resetUrl, token });
      } else {
        console.log('Password reset email sent to', to);
      }

      return;
    } catch (e) {
      console.error('Failed to send email via transporter, falling back to console:', e.message);
    }
  }

  // Fallback: log the reset URL and token to console so devs can copy them
  console.log('Password reset (console) ->', { to, resetUrl, token });
}

module.exports = {
  sendPasswordResetEmail
};

// Send transaction receipt (development-friendly)
module.exports.sendTransactionReceipt = async function(to, receipt) {
  const transport = getTransporter();
  const subject = `TransitPay — Receipt ${receipt.id || ''}`;
  const text = `Thank you. Your transaction receipt:\n\n${JSON.stringify(receipt, null, 2)}`;

  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.EMAIL_FROM || 'no-reply@transitpay.local',
        to,
        subject,
        text
      });
      if (process.env.NODE_ENV !== 'production' || process.env.LOG_EMAILS === 'true') {
        console.log('Transaction receipt email (sent) ->', { to, receipt });
      }
      return;
    } catch (e) {
      console.error('Failed to send receipt via transporter, falling back to console:', e.message);
    }
  }

  console.log('Transaction receipt (console) ->', { to, receipt });
};
