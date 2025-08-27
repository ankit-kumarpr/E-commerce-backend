const Kyc = require("../models/Kyc");
const User = require("../models/user.model");
const { sendMail } = require("../utils/mailer");

// Create or update KYC (always pending first)
const createOrUpdateKyc = async (req, res) => {
  try {
    const { userId } = req.params;

    const kycData = {
      user: userId,
      aadhaar: req.body.aadhaar,
      pan: req.body.pan,
      streetAddress: req.body.streetAddress,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      landmark: req.body.landmark,
      shopName: req.body.shopName,
      gst: req.body.gst,
      shopAddress: req.body.shopAddress,
      msme: req.body.msme,
      bankName: req.body.bankName,
      accountHolder: req.body.accountHolder,
      ifsc: req.body.ifsc,
      branch: req.body.branch,
      shopCategory: req.body.shopCategory,
      otherCategory:
        req.body.shopCategory === "other" ? req.body.otherCategory : null,
      videoKyc: req.file ? req.file.path : undefined,
      status: "pending",
    };
console.log("userid",userId);
    const kyc = await Kyc.findOneAndUpdate({ user: userId }, kycData, {
      new: true,
      upsert: true,
    });

    console.log("Kyc",kyc);
    // Send mail to seller on submission
    const user = await User.findById(userId);
   if (user) {
  await sendMail(
    user.email,
    "KYC Submission Received",
    `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; padding:20px;">
      <h2 style="color:#4CAF50;">KYC Submission Confirmation</h2>
      <p>Dear ${user.firstname},</p>
      <p>Thank you for completing your KYC process with <strong>Grandeur Net</strong>.</p>
      <p>Your details have been successfully submitted and are now under review by our verification team.</p>
      <p>You can expect your KYC to be verified within <strong>24 to 48 working hours</strong>. 
      Our team may contact you if any additional information is required.</p>
      <br/>
      <p>We appreciate your cooperation.</p>
      <p style="margin-top:30px;">Best regards,<br/>
      <strong>Grandeur Net Team</strong></p>
      <hr style="margin-top:30px;"/>
      <p style="font-size:12px; color:#777;">This is an automated message. Please do not reply directly to this email.</p>
    </div>
    `
  );
}

    res.status(200).json({ success: true, kyc });
  } catch (error) {
    console.error("KYC Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get KYC by userId
const getKycByUser = async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ user: req.params.userId }).populate("user");
    if (!kyc)
      return res.status(404).json({ success: false, message: "KYC not found" });

    res.status(200).json({ success: true, kyc });
  } catch (error) {
    console.error("KYC Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Admin verifies KYC
const verifyKyc = async (req, res) => {
  try {
    const { userId } = req.params;

    const kyc = await Kyc.findOneAndUpdate(
      { user: userId },
      { status: "verified" },
      { new: true }
    ).populate("user");

    if (!kyc)
      return res.status(404).json({ success: false, message: "KYC not found" });

    // Send mail to seller when verified
    await sendMail(
  kyc.user.email,
  "✅ KYC Verification Successful",
  `
  <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
    <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:30px;">
      
      <div style="text-align:center;">
        <div style="font-size:50px; color:#4CAF50;">✔️</div>
        <h2 style="color:#4CAF50; margin-bottom:10px;">KYC Verification Successful</h2>
      </div>
      
      <p style="font-size:15px; color:#333;">Dear <strong>${kyc.user.firstname}</strong>,</p>
      
      <p style="font-size:15px; color:#333; line-height:1.6;">
        Congratulations! 🎉 Your <strong>KYC has been successfully verified</strong>.
      </p>

      <p style="font-size:15px; color:#333; line-height:1.6;">
        You now have full access to all <strong>seller features</strong> on our platform.  
        You can start listing products, managing orders, and growing your business with us.
      </p>

      <div style="text-align:center; margin:30px 0;">
        <a href="https://yourplatform.com/login" 
           style="background:#4CAF50; color:#fff; text-decoration:none; padding:12px 25px; border-radius:6px; font-size:16px; font-weight:bold;">
          Go to Dashboard
        </a>
      </div>

      <p style="font-size:14px; color:#555;">
        Our team is excited to have you onboard. If you need any help, feel free to reach out to our 
        <a href="https://yourplatform.com/support" style="color:#4CAF50; text-decoration:none;">support team</a>.
      </p>

      <p style="margin-top:30px; font-size:14px; color:#333;">
        Best regards, <br/>
        <strong>Your Company Team</strong>
      </p>
      
      <hr style="margin:30px 0; border:0; border-top:1px solid #eee;">
      <p style="font-size:12px; color:#999; text-align:center;">
        This is an automated message. Please do not reply directly to this email.
      </p>
    </div>
  </div>
  `
);


    res.status(200).json({ success: true, kyc });
  } catch (error) {
    console.error("KYC Verify Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//Reject KYC

const rejectKyc = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, message: 'Rejection note is required' });
    }

    const kyc = await Kyc.findOneAndUpdate(
      { user: userId },
      { status: 'rejected', rejectionNote: note },
      { new: true }
    ).populate('user');

    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found' });

    // Send rejection mail
    await sendMail(
      kyc.user.email,
      'KYC Rejected',
      `<p>Dear ${kyc.user.firstname},</p>
       <p>Your KYC has been <b>rejected</b> for the following reason:</p>
       <p style="color:red;">${note}</p>
       <p>Please update your details and resubmit.</p>`
    );

    res.status(200).json({ success: true, kyc });
  } catch (error) {
    console.error('KYC Reject Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// get all pending KYC

const getPendingKycs = async (req, res) => {
  try {
    const kycs = await Kyc.find({ status: 'pending' }).populate('user', 'firstname lastname email');
    res.status(200).json({ success: true, kycs });
  } catch (error) {
    console.error('Get Pending KYC Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// all verified lawyer list
const getVerifiedKycs = async (req, res) => {
  try {
    const kycs = await Kyc.find({ status: 'verified' }).populate('user', 'firstname lastname email');
    res.status(200).json({ success: true, kycs });
  } catch (error) {
    console.error('Get Verified KYC Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports={
  createOrUpdateKyc,
  getKycByUser,
  verifyKyc,
  rejectKyc,
  getPendingKycs,
  getVerifiedKycs
}