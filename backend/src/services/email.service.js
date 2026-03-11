import nodemailer from 'nodemailer';

/**
 * Configure the SMTP transporter for Brevo.
 * These variables should be set in your Render environment settings.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your Brevo login: 930a1e002@smtp-brevo.com
    pass: process.env.SMTP_PASSWORD, // The SMTP Key you generated (e.g., DOPALSSMTP)
  },
});

/**
 * Sends an email using the verified Dopals Tech domain.
 * @param {Object} options - Email options (to, subject, html, text)
 */
export const sendEmail = async ({ email, subject, html, text }) => {
  try {
    const mailOptions = {
      // Use your verified authenticated domain from Brevo
      from: '"Dopals Tech" <dopalstechnologies@octapus.org>',
      to: email,
      subject: subject,
      text: text || '', // Plain text version of the message
      html: html,       // HTML version of the message
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Brevo Email Sent successfully:', info.messageId);
    return info;
  } catch (error) {
    // Detailed logging for debugging production connection issues
    console.error('❌ Brevo SMTP Error:', error.message);
    throw new Error(`Email dispatch failed: ${error.message}`);
  }
};