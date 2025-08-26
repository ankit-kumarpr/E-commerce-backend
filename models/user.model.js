const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const roles = ['superadmin','admin','salesperson','seller','user'];

const userSchema = new mongoose.Schema({
  customId: { type: String,
     unique: true, 
     index: true },
  firstname: { type: String, required: true, trim: true },
  lastname: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: roles, required: true },
  isVerified: { type: Boolean, default: false },

  // OTP (hashed)
  otpHash: { type: String, select: false },
  otpExpires: { type: Date },

  // Refresh token rotation (hashed)
  refreshHash: { type: String, select: false },
  refreshExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.matchPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.setOtp = async function(otp) {
  const salt = await bcrypt.genSalt(10);
  this.otpHash = await bcrypt.hash(otp, salt);
  this.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
};

userSchema.methods.verifyOtp = function(otp) {
  if (!this.otpHash || !this.otpExpires) return false;
  if (this.otpExpires.getTime() < Date.now()) return false;
  return bcrypt.compare(otp, this.otpHash);
};

module.exports = mongoose.model('User', userSchema);
module.exports.roles = roles;
