const express = require('express');
const router = express.Router();
const {
  createOrUpdateKyc,
  getKycByUser,
  verifyKyc,
  rejectKyc,
  getPendingKycs,
  getVerifiedKycs
} = require('../controllers/kycController');
const upload = require('../middlewares/upload');
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

// Seller: submit KYC
router.post('/submitkyc/:userId', upload.single('videoKyc'),createOrUpdateKyc);

// Seller: view KYC
router.get('/viewkyc/:userId', getKycByUser);

// Admin: verify KYC
router.put('/verifykyc/:userId', authenticate,
  authorizeRoles("admin"), verifyKyc);

// reject Kyc
  router.put('/reject/:userId', authenticate,
  authorizeRoles("admin"), rejectKyc);

router.get('/pendingkyc',authenticate,
  authorizeRoles("admin"), getPendingKycs);
router.get('/verifiedkyc', authenticate,
  authorizeRoles("admin"), getVerifiedKycs);
module.exports = router;
