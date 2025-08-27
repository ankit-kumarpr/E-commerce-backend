const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Personal details
  aadhaar: { type: String, required: true, trim: true,minlength:12,maxlength:12 },
  pan: { type: String, required: true, trim: true,minlength:10,maxlength:10 },
  streetAddress: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  landmark: { type: String, trim: true },

  // Business details
  shopName: { type: String, required: true, trim: true },
  gst: { type: String, trim: true },
  shopAddress: { type: String, trim: true },
  msme: { type: String, trim: true },

  // Bank details
  bankName: { type: String, required: true, trim: true },
  accountHolder: { type: String, required: true, trim: true },
  ifsc: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },

  // Shop category
  shopCategory: { type: String, required: true },
  otherCategory: { type: String },

  // Video KYC (stored as file path)
  videoKyc: { type: String },

  // Status
  status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
rejectionNote: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Kyc', kycSchema);
