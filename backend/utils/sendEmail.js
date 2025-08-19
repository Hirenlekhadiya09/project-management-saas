const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Gmail-specific configuration for better compatibility with Render
    const transportConfig = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Helps with certain Render deployments
      },
      debug: true, // Enable for troubleshooting, can be removed in production
    };
    
    // Create a transporter with Gmail-specific settings
    const transporter = nodemailer.createTransport(transportConfig);

    // Message object
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message
    };

    // Send email
    await transporter.sendMail(message);
  } catch (error) {
    throw error; // Re-throw for handling in the calling function
  }
};

module.exports = sendEmail;
