import { Resend } from 'resend';

export const sendEmail = async ({ email, subject, html }) => {
  // 1. Check for the key BEFORE trying to use it
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ CRITICAL ERROR: RESEND_API_KEY is missing in backend/.env');
    throw new Error('Server configuration error: Missing Email API Key');
  }

  // 2. Initialize Resend here (safer)
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      // Use this specific sender for testing
      from: 'Dopals Test <onboarding@resend.dev>',
      to: [email], // MUST be your personal sign-up email for now
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Resend Error:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Test Email Sent successfully:', data.id);
    return data;
  } catch (err) {
    console.error('❌ Email dispatch failed:', err.message);
    throw err;
  }
};