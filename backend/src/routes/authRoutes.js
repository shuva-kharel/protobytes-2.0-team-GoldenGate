const express = require("express");
const router = express.Router();
const asyncHandler = require("../middlewares/asyncHandler");

const {
  registerUser,
  resendVerificationOtp,
  verifyEmail,
  loginUser,
  verify2FA,
  resend2FA,
  get2FASettings,
  enableEmail2FA,
  startAuthenticatorSetup,
  verifyAuthenticatorSetup,
  disable2FA,
  refreshToken,
  forgotPassword,
  resetPassword,
  logoutUser,
  getProfile,
  updatePassword,           // <-- ADD
  listSessions,
  revokeSession,
  revokeOtherSessions,
  revokeAllSessions,

} = require("../controllers/authController");

const { protect, requireRole } = require("../middlewares/authMiddleware");

const {
  registerValidator,
  loginValidator,
  emailOnlyValidator,
  verifyOtpValidator,
  verify2FAValidator,
  forgotValidator,          // <-- already exists
  resetValidator,           // <-- already exists
  updatePasswordValidator,  // <-- ADD (below)
} = require("../validators/authValidator");

// Auth
router.post("/register", registerValidator, asyncHandler(registerUser));
router.post("/resend-otp", emailOnlyValidator, asyncHandler(resendVerificationOtp));
router.post("/verify-email", verifyOtpValidator, asyncHandler(verifyEmail));

router.post("/login", loginValidator, asyncHandler(loginUser));
router.post("/2fa/verify", verify2FAValidator, asyncHandler(verify2FA));
router.post("/2fa/resend", asyncHandler(resend2FA));
router.get("/2fa/settings", asyncHandler(protect), asyncHandler(get2FASettings));
router.post("/2fa/email/enable", asyncHandler(protect), asyncHandler(enableEmail2FA));
router.post("/2fa/authenticator/setup", asyncHandler(protect), asyncHandler(startAuthenticatorSetup));
router.post("/2fa/authenticator/verify", verify2FAValidator, asyncHandler(protect), asyncHandler(verifyAuthenticatorSetup));
router.post("/2fa/disable", asyncHandler(protect), asyncHandler(disable2FA));

// --- NEW: Forgot / Reset password ---
router.post("/forgot-password", forgotValidator, asyncHandler(forgotPassword));
router.post("/reset-password", resetValidator, asyncHandler(resetPassword));

// --- NEW: Update password from settings (requires auth) ---
router.post("/update-password", asyncHandler(protect), updatePasswordValidator, asyncHandler(updatePassword));

router.post("/refresh", asyncHandler(refreshToken));
router.post("/logout", asyncHandler(logoutUser));

router.get("/me", asyncHandler(protect), asyncHandler(getProfile));

// Example admin-only route
router.get(
  "/admin/dashboard",
  asyncHandler(protect),
  asyncHandler(requireRole("admin")),
  (req, res) => {
    res.json({ message: `Welcome admin ${req.user.username}` });
  }
);


router.get("/sessions", asyncHandler(protect), asyncHandler(listSessions));
router.post("/sessions/revoke/:sessionId", asyncHandler(protect), asyncHandler(revokeSession));
router.delete("/sessions/:sessionId", asyncHandler(protect), asyncHandler(revokeSession));
router.post("/sessions/revoke-others", asyncHandler(protect), asyncHandler(revokeOtherSessions));
router.delete("/sessions", asyncHandler(protect), asyncHandler(revokeAllSessions));


module.exports = router;
