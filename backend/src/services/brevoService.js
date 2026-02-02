import { 
  TransactionalEmailsApi, 
  SendSmtpEmail,
  TransactionalEmailsApiApiKeys
} from '@getbrevo/brevo';

// 1. Instantiate the API Client
const apiInstance = new TransactionalEmailsApi();

// 2. Set the API Key properly
// Make sure your .env has BREVO_API_KEY set
apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// 3. Define and EXPORT the function
export const sendEmail = async ({ email, subject, html, text }) => {
  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = { name: "Dopals Tech Team", email: process.env.BREVO_SENDER_EMAIL }; 
  sendSmtpEmail.to = [{ email: email }];
  
  if (text) {
      sendSmtpEmail.textContent = text;
  }

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Brevo Email Sent successfully');
    return data;
  } catch (error) {
    console.error('❌ Brevo Error:', error.body || error);
    // We throw the error so the controller knows it failed
    throw new Error('Email could not be sent via Brevo');
  }
};