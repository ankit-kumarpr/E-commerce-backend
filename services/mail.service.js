const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

exports.sendOtpMail = async (to, otp) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
    <h2 style="text-align: center; color: #1a237e; margin-bottom: 5px;">Grandeur Net</h2>
    <p style="text-align: center; font-size: 16px; color: #555;">OTP Verification</p>
    <hr style="border: none; border-top: 2px solid #1a237e; margin: 20px 0;">
    <p style="font-size: 15px; color: #333;">Dear User,</p>
    <p style="font-size: 15px; color: #333; line-height: 1.6;">
      Thank you for signing up with <b>Grandeur Net</b>. Please use the following OTP to verify your email address:
    </p>
    <p style="text-align: center; font-size: 32px; font-weight: bold; color: #d32f2f; margin: 20px 0;">
      ${otp}
    </p>
    <p style="font-size: 14px; color: #333;">
      This OTP is valid for <b>5 minutes</b>. Please do not share it with anyone.
    </p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="font-size: 12px; text-align: center; color: #999;">
      This is an automated message from Grandeur Net. Please do not reply to this email.<br>
      © ${new Date().getFullYear()} Grandeur Net. All rights reserved.
    </p>
  </div>
  `;

  await transporter.sendMail({
    from: `"Grandeur Net" <${process.env.MAIL_USER}>`,
    to,
    subject: "OTP Verification - Grandeur Net",
    html,
  });
};

// ----------welcome email-----------------------

exports.sendWelcomeMail = async (to, firstname) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eaeaea; border-radius:10px; background:#f9f9f9;">
    
    <!-- Banner -->
    <div style="text-align:center; margin-bottom:20px;">
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQasbyWKEOchWuKlvfso2-yvvLMxdFj0rStpw&s" 
           alt="Welcome Banner" 
           style="max-width:100%; border-radius:10px;">
    </div>

    <!-- Heading -->
    <h2 style="color:#1a237e; text-align:center;">Welcome to Grandeur Net 🎉</h2>

    <!-- Intro -->
    <p style="font-size:15px; color:#333;">Hi <b>${firstname}</b>,</p>
    <p style="font-size:15px; color:#333; line-height:1.6;">
      We’re thrilled to have you join the <b>Grandeur Net</b> community! 🚀
    </p>

    <!-- Extra Content -->
    <div style="background:#fff; padding:15px; border-radius:8px; margin:20px 0;">
      <h3 style="color:#1a237e;">Here’s what you can do now:</h3>
      <ul style="font-size:14px; color:#444; line-height:1.6;">
        <li>✅ Explore premium Product listings</li>
        <li>✅ Save and compare your favorite options</li>
        <li>✅ Stay updated with our blogs</li>
        <li>✅ Connect with verified sellers</li>
      </ul>
    </div>

    <!-- Call to Action -->
    <div style="text-align:center; margin:20px 0;">
      <a href="https://grandeurnet.com" 
         style="background:#1a237e; color:#fff; padding:12px 25px; border-radius:5px; text-decoration:none; font-weight:bold;">
         Login Now
      </a>
    </div>

    <!-- Footer -->
    <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
    <p style="font-size:12px; text-align:center; color:#999;">
      © ${new Date().getFullYear()} Grandeur Net. All rights reserved.
    </p>
  </div>
  `;

  await transporter.sendMail({
    from: `"Grandeur Net" <${process.env.MAIL_USER}>`,
    to,
    subject: "🎉 Welcome to Grandeur Net",
    html,
  });
};
