import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Create Transporter ONCE (Singleton pattern)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App Password, not Login Password
    }
});

// Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Email Service Error:", error.message);
    } else {
        console.log("✅ Email Service Ready");
    }
});

// 2. Reusable Send Function (SAFE VERSION - NO LOGO)
export const sendHtmlEmail = async ({ to, bcc, subject, html }) => {
    
    const mailOptions = {
        from: `"DOPALS TECHNOLOGIES" <${process.env.EMAIL_USER}>`,
        to: to || process.env.EMAIL_USER,
        bcc: bcc, 
        subject: subject,
        html: html
        // attachments: removed to prevent crash
    };

    return await transporter.sendMail(mailOptions);
};