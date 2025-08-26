const router = require("express").Router();
const {
  registerSuperAdmin,
  registerSelf,
  superCreateAdmin,
  adminCreateSalesPerson,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

// PUBLIC
router.post("/register-superadmin", registerSuperAdmin); // only if none exists
router.post("/register-self", registerSelf); // seller/user self
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/refresh", refresh);

// SUPERADMIN ONLY
router.post(
  "/create-admin",
  authenticate,
  authorizeRoles("superadmin"),
  superCreateAdmin
);

// ADMIN ONLY
router.post(
  "/create-salesperson",
  authenticate,
  authorizeRoles("admin"),
  adminCreateSalesPerson
);

// AUTHENTICATED
router.post("/logout", authenticate, logout);

module.exports = router;
