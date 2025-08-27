const User = require("../models/user.model");
const Counter = require("../models/counter.model");
const Kyc = require("../models/Kyc");
const { validatePassword, allowedSelfRoles } = require("../utils/validators");
const { sendOtpMail, sendWelcomeMail } = require("../services/mail.service");
const {
  generateTokens,
  hashRefresh,
  verifyRefresh,
} = require("../services/token.service");
const bcrypt = require("bcrypt");

/** helpers **/
const rolePrefixes = {
  superadmin: "SUP",
  admin: "ADM",
  salesperson: "SAL",
  seller: "SEL",
  user: "USR",
};

const makeCustomId = async (role) => {
  console.log("role is", role);
  const prefix = rolePrefixes[role];
  console.log("prefix", prefix);
  if (!prefix) throw new Error("Invalid role for customId");

  const n = await Counter.next(role); // each role has its own counter
  return `${prefix}${String(n).padStart(3, "0")}`;
};

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const handleDuplicateKey = (err, res) => {
  if (err?.code === 11000) {
    const key = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(400).json({ message: `${key} already exists` });
  }
  return res.status(500).json({ message: err.message });
};

/** 1) Super Admin bootstrap (no OTP) **/
const registerSuperAdmin = async (req, res) => {
  try {
    const exists = await User.exists({ role: "superadmin" });
    if (exists)
      return res.status(400).json({ message: "Super admin already exists" });

    const { firstname, lastname, email, phone, password, confirmPassword } =
      req.body;
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });
    if (!validatePassword(password))
      return res.status(400).json({ message: "Password too weak" });

    const customId = await makeCustomId("superadmin");
    const user = await User.create({
      customId,
      firstname,
      lastname,
      email,
      phone,
      password,
      role: "superadmin",
      isVerified: true,
    });

    res
      .status(201)
      .json({ message: "Super admin created", customId: user.customId });
  } catch (err) {
    handleDuplicateKey(err, res);
  }
};

/** 2) SELF register (only seller/user) => sends OTP **/
const registerSelf = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      password,
      confirmPassword,
      role,
    } = req.body;

    if (!allowedSelfRoles.includes(role)) {
      return res
        .status(403)
        .json({ message: "Only seller/user can self-register" });
    }
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });
    if (!validatePassword(password))
      return res.status(400).json({ message: "Password too weak" });

    const customId = await makeCustomId(role);
    const user = await User.create({
      customId,
      firstname,
      lastname,
      email,
      phone,
      password,
      role,
      isVerified: false,
    });

    const otp = createOtp();
    await user.setOtp(otp);
    await user.save();
    await sendOtpMail(email, otp);

    res.status(201).json({ message: "OTP sent to email", customId });
  } catch (err) {
    handleDuplicateKey(err, res);
  }
};

/** 3) SuperAdmin creates Admin (OTP) **/
const superCreateAdmin = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, password, confirmPassword } =
      req.body;

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });
    if (!validatePassword(password))
      return res.status(400).json({ message: "Password too weak" });

    // ✅ pass role explicitly
    const customId = await makeCustomId("admin");

    const user = await User.create({
      customId,
      firstname,
      lastname,
      email,
      phone,
      password,
      role: "admin",
      isVerified: false,
    });

    const otp = createOtp();
    await user.setOtp(otp);
    await user.save();
    await sendOtpMail(email, otp);

    res.status(201).json({
      message: "Admin created, OTP sent",
      customId,
      user,
    });
  } catch (err) {
    handleDuplicateKey(err, res);
  }
};
/** 4) Admin creates Sales Person (OTP) **/
const adminCreateSalesPerson = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, password, confirmPassword } =
      req.body;

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });
    if (!validatePassword(password))
      return res.status(400).json({ message: "Password too weak" });

    const customId = await makeCustomId("salesperson");
    const user = await User.create({
      customId,
      firstname,
      lastname,
      email,
      phone,
      password,
      role: "salesperson",
      isVerified: false,
    });

    const otp = createOtp();
    await user.setOtp(otp);
    await user.save();
    await sendOtpMail(email, otp);

    res
      .status(201)
      .json({ message: "Sales person created, OTP sent", customId, user });
  } catch (err) {
    handleDuplicateKey(err, res);
  }
};

/** OTP verify **/
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select("+otpHash +password");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "Already verified" });

    const ok = await user.verifyOtp(otp);
    if (!ok) return res.status(400).json({ message: "OTP invalid or expired" });

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();

    // ✅ Send welcome mail after verification
    await sendWelcomeMail(user.email, user.firstname);

    res.json({ message: "Account verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Resend OTP **/
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("+otpHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "Already verified" });

    const otp = createOtp();
    await user.setOtp(otp);
    await user.save();
    await sendOtpMail(email, otp);

    res.json({ message: "New OTP sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Login **/
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // super admin also goes through login (but had no OTP step)
    const user = await User.findOne({ email }).select(
      "+password +refreshHash +refreshExpires"
    );
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await user.matchPassword(password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role !== "superadmin" && !user.isVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // rotate refresh
    user.refreshHash = await hashRefresh(refreshToken);
    user.refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      role: user.role,
      customId: user.customId,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Refresh token rotation **/
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refresh token" });

    const decoded = verifyRefresh(refreshToken);
    if (!decoded)
      return res.status(401).json({ message: "Invalid refresh token" });

    const user = await User.findById(decoded.id).select(
      "+refreshHash +refreshExpires"
    );
    if (!user || !user.refreshHash || !user.refreshExpires) {
      return res.status(401).json({ message: "Refresh not valid" });
    }
    if (user.refreshExpires.getTime() < Date.now()) {
      user.refreshHash = undefined;
      user.refreshExpires = undefined;
      await user.save();
      return res.status(401).json({ message: "Refresh expired" });
    }

    const match = await bcrypt.compare(refreshToken, user.refreshHash);
    if (!match) return res.status(401).json({ message: "Refresh mismatch" });

    // issue new pair + rotate
    const { accessToken, refreshToken: newRefresh } = generateTokens(user);
    user.refreshHash = await hashRefresh(newRefresh);
    user.refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Logout (invalidate refresh) **/
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "+refreshHash +refreshExpires"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    user.refreshHash = undefined;
    user.refreshExpires = undefined;
    await user.save();

    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




// get all seller list

const getAllSellers = async (req, res) => {
  try {
    const sellers = await Kyc.find()
      .populate('user', 'firstname lastname email phone role') // show basic user info
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, sellers });
  } catch (error) {
    console.error('Get All Sellers Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// delete seller

const DeleteSeller=async(req,res)=>{
  const {userId}=req.params;
  try{

    if(!userId){
      return res.status(400).json({
        error:true,
        message:"Something went wrong || Id is required"
      })
    }

    const deldata=await User.findByIdAndUpdate(userId,{is_deletd:1},{new:true});

    if(!deldata){
      return res.status(404).json({
        error:true,
        message:"Seller Not deleted"
      })
    }

    return res.status(200).json({
      error:false,
      message:"Seller Deleted Successfully"
    })


  }
  catch(error){
    return res.status(500).json({
      error:true,
      message:"Internal server error"
    })
  }
}









module.exports = {
  registerSuperAdmin,
  registerSelf,
  superCreateAdmin,
  adminCreateSalesPerson,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  getAllSellers
};
