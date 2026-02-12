const express = require("express");
const router = express.Router();

const {
  registerUser,
  resendVerificationOtp,
  verifyEmail,
  loginUser,
  refreshToken,
  logoutUser,
  getProfile,
} = require("../controllers/authController");

const { registerValidator } = require("../validators/authValidator");
const { protect } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

// If you have validators, ensure they call next() and are used as middlewares
// const { registerValidator, loginValidator } = require("../validators/authValidator");

router.post("/register", registerValidator, asyncHandler(registerUser));
router.post("/resend-otp", asyncHandler(resendVerificationOtp));
router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/login", /* loginValidator, */ asyncHandler(loginUser));
router.post("/refresh", asyncHandler(refreshToken));
router.post("/logout", asyncHandler(logoutUser));
router.get("/me", asyncHandler(protect), asyncHandler(getProfile));

module.exports = router;