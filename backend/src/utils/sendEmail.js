import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (options) => {
  // ✅ FIX: We changed these to match your .env file exactly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
     throw new Error("Credentials missing! Check .env for EMAIL_USER and EMAIL_PASS");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER, // Matches .env
      pass: process.env.EMAIL_PASS, // Matches .env
    },
  });

  const mailOptions = {
    from: `Dopals Dashboard <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;