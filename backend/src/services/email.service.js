import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ email, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      // Use this exact sender for local testing
      from: 'Dopals Test <onboarding@resend.dev>', 
      to: [email], 
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
    console.error('❌ Email failed:', err.message);
    throw err;
  }
};