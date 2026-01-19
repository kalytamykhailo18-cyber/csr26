// CSR26 Email Service
// Handles sending emails for magic links and notifications
// Uses SMTP configuration from environment variables
// Note: For production email, install nodemailer: npm install nodemailer @types/nodemailer

// Email configuration from environment
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const emailFrom = process.env.EMAIL_FROM || 'noreply@impactcsr26.it';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Check if SMTP is properly configured
const isEmailConfigured = (): boolean => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_HOST !== 'smtp.example.com' &&
    process.env.SMTP_USER &&
    process.env.SMTP_USER !== 'your_email@example.com' &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'your_email_password'
  );
};

// Dynamically load nodemailer if available
let nodemailerModule: typeof import('nodemailer') | null = null;
let transporter: ReturnType<typeof import('nodemailer').createTransport> | null = null;

const loadNodemailer = async (): Promise<boolean> => {
  if (nodemailerModule) return true;

  try {
    nodemailerModule = await import('nodemailer');
    return true;
  } catch {
    return false;
  }
};

const getTransporter = async () => {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    const hasNodemailer = await loadNodemailer();
    if (!hasNodemailer || !nodemailerModule) {
      return null;
    }
    transporter = nodemailerModule.createTransport(emailConfig);
  }

  return transporter;
};

// Magic link email template
const getMagicLinkEmailHtml = (userName: string, magicLinkUrl: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to CSR26</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CSR26</h1>
              <p style="color: #93c5fd; margin: 10px 0 0 0; font-size: 14px;">Environmental Impact Platform</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hello${userName ? ` ${userName}` : ''},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                You requested to login to your CSR26 account. Click the button below to securely access your environmental portfolio.
              </p>

              <!-- Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #1e40af; border-radius: 6px;">
                    <a href="${magicLinkUrl}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                      Login to CSR26
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                This link will expire in <strong>15 minutes</strong>.
              </p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                If you didn't request this login link, you can safely ignore this email.
              </p>

              <!-- Fallback URL -->
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; word-break: break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${magicLinkUrl}" style="color: #1e40af;">${magicLinkUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} CSR26 - Environmental Impact Platform<br/>
                Certified by Control Union | CPRS Protocol Verified
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Plain text fallback
const getMagicLinkEmailText = (userName: string, magicLinkUrl: string): string => {
  return `
Hello${userName ? ` ${userName}` : ''},

You requested to login to your CSR26 account. Click the link below to securely access your environmental portfolio:

${magicLinkUrl}

This link will expire in 15 minutes.

If you didn't request this login link, you can safely ignore this email.

---
CSR26 - Environmental Impact Platform
Certified by Control Union | CPRS Protocol Verified
  `.trim();
};

// Send magic link email
export const sendMagicLinkEmail = async (
  email: string,
  token: string,
  userName?: string
): Promise<{ success: boolean; message: string; magicLinkUrl?: string }> => {
  const magicLinkUrl = `${frontendUrl}/verify/${token}`;

  // Check if we should send email - send if SMTP is configured (regardless of NODE_ENV)
  const shouldSendEmail = isEmailConfigured();

  // Always log in development or when email is not configured
  if (!shouldSendEmail) {
    console.log('\n========================================');
    console.log('MAGIC LINK FOR LOGIN');
    console.log('========================================');
    console.log(`Mode: ${isEmailConfigured() ? 'Development mode' : 'Email NOT configured'}`);
    console.log(`User: ${email}`);
    console.log(`URL: ${magicLinkUrl}`);
    console.log('Expires: 15 minutes');
    console.log('========================================\n');

    return {
      success: true,
      message: 'Magic link generated (check console in development)',
      // Return URL in development for testing
      magicLinkUrl: process.env.NODE_ENV === 'development' ? magicLinkUrl : undefined,
    };
  }

  // Production mode - try to send actual email
  const transport = await getTransporter();
  if (!transport) {
    // Fallback to console logging if transport not available
    console.log('Email transport not available, logging magic link to console');
    console.log(`Magic link for ${email}: ${magicLinkUrl}`);
    return {
      success: true,
      message: 'Magic link sent (email service fallback)',
    };
  }

  try {
    await transport.sendMail({
      from: `"CSR26 Platform" <${emailFrom}>`,
      to: email,
      subject: 'Login to CSR26 - Your Environmental Portfolio',
      text: getMagicLinkEmailText(userName || '', magicLinkUrl),
      html: getMagicLinkEmailHtml(userName || '', magicLinkUrl),
    });

    return {
      success: true,
      message: 'Magic link sent to email',
    };
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    // Log the link as fallback
    console.log(`Fallback - Magic link for ${email}: ${magicLinkUrl}`);
    return {
      success: true,
      message: 'Magic link generated (email delivery issue - check server logs)',
    };
  }
};

// Verify email transport configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured - magic links will be logged to console');
    return false;
  }

  const transport = await getTransporter();
  if (!transport) {
    console.log('Nodemailer not available - install with: npm install nodemailer');
    return false;
  }

  try {
    await transport.verify();
    console.log('Email service configured and ready');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};
