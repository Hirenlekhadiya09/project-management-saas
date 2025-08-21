const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('====== EMAIL WOULD BE SENT ======');
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log('Message:');
      console.log(options.message);
      console.log('================================');
      
      return { 
        messageId: `mock-email-${Date.now()}`,
        success: true
      };
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const message = {
      from: `${process.env.FROM_NAME || 'Task Management'} <${process.env.FROM_EMAIL || 'noreply@taskmanagement.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message
    };

    const info = await transporter.sendMail(message);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    return { messageId: `mock-email-${Date.now()}` };
  }
};

module.exports = sendEmail;
