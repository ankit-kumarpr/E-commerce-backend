const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use your SMTP provider
  auth: {
    user: process.env.MAIL_USER, // your email
    pass: process.env.MAIL_PASS  // your app password
  }
});

exports.sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Your Company" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Mail error:', err);
  }
};
