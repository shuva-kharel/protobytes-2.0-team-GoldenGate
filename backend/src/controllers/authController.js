// controllers/authController.js
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { signAccessToken, signRefreshToken } = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const logger = require("../utils/logger");

// ─── Helpers ─────────────────────────────────────────────────────────────────
function createOtp(minutes = 10) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + minutes * 60 * 1000);
  return { otpCode, otpExpiry };
}

function set2FACookie(res, userId) {
  const token = jwt.sign({ id: userId, purpose: "2fa" }, process.env.JWT_SECRET, { expiresIn: "10m" });
  res.cookie("2fa_token", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 1000 * 60 * 10,
    path: "/api/auth/2fa/verify",
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
}

function clear2FACookie(res) {
  res.clearCookie("2fa_token", { path: "/api/auth/2fa/verify" });
}

// ─── Register ────────────────────────────────────────────────────────────────
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const { otpCode, otpExpiry } = createOtp(10);
    const user = await User.create({
      username,
      email,
      password,
      role: role && ["admin", "user"].includes(role) ? role : "user",
      otp: { code: otpCode, expiresAt: otpExpiry, attempts: 0 },
      isEmailVerified: false,
      emailVerifiedAt: null,
    });

    try {
      await sendEmail(user.email, "Verify Your Email", "verifyEmail", {
        username: user.username,
        otpCode,
        expiresInMinutes: 10,
        title: "Verify your email",
      });
      logger.info("Verification OTP sent", { userId: user._id, email: user.email });
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
      // You can choose to continue or return 500 — continuing is friendlier in dev
    }

    // Optionally sign-in pending verification
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: accessToken,
      isEmailVerified: user.isEmailVerified,
      message: "User registered. Check your email for the OTP to verify your account.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── Resend Email Verification OTP ──────────────────────────────────────────
const resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isEmailVerified) return res.json({ message: "Email already verified" });

    const { otpCode, otpExpiry } = createOtp(10);
    user.otp = { code: otpCode, expiresAt: otpExpiry, attempts: 0 };
    await user.save();

    try {
      await sendEmail(user.email, "Your New Verification Code", "verifyEmail", {
        username: user.username,
        otpCode,
        expiresInMinutes: 10,
        title: "Verify your email",
      });
      logger.info("Verification OTP resent", { userId: user._id, email: user.email });
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    res.json({ message: "Verification code resent" });
  } catch (err) {
    next(err);
  }
};

// ─── Verify Email ───────────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isEmailVerified) return res.json({ message: "Email already verified" });

    const now = new Date();
    if (!user.otp?.code || user.otp.code !== otp || user.otp.expiresAt < now) {
      user.otp = { ...(user.otp || {}), attempts: (user.otp?.attempts || 0) + 1 };
      await user.save();
      logger.warn("Invalid email verification OTP", {
        userId: user._id,
        email: user.email,
        attempts: user.otp?.attempts,
      });
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.otp = { code: null, expiresAt: null, attempts: 0 };
    await user.save();

    res.json({ message: "Email verified successfully", isEmailVerified: true });
  } catch (err) {
    next(err);
  }
};

// ─── Login (Step 1: Password) ───────────────────────────────────────────────
const loginUser = async (req, res, next) => {
  try {
    const { email, password /* rememberMe */ } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: "Please verify your email before logging in" });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) return res.status(401).json({ message: "Invalid email or password" });

    // Create & send 2FA code
    const { otpCode, otpExpiry } = createOtp(10);
    user.twoFactor = { code: otpCode, expiresAt: otpExpiry, attempts: 0 };
    await user.save();

    try {
      await sendEmail(user.email, "Your Login Verification Code", "twoFactorOtp", {
        username: user.username,
        otpCode,
        expiresInMinutes: 10,
        title: "Two-Factor Authentication",
      });
      logger.info("2FA code sent", { userId: user._id, email: user.email });
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    // Set short-lived cookie that allows 2FA verification
    set2FACookie(res, user._id.toString());

    res.json({
      message: "2FA code sent to your email. Please verify to complete login.",
      requires2FA: true,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify 2FA (Step 2) ────────────────────────────────────────────────────
const verify2FA = async (req, res, next) => {
  try {
    const token = req.cookies?.["2fa_token"];
    if (!token) return res.status(401).json({ message: "Missing 2FA token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "2fa") return res.status(401).json({ message: "Invalid 2FA token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const { otp } = req.body;
    const now = new Date();

    if (!user.twoFactor?.code || user.twoFactor.code !== otp || user.twoFactor.expiresAt < now) {
      user.twoFactor = { ...(user.twoFactor || {}), attempts: (user.twoFactor?.attempts || 0) + 1 };
      await user.save();
      logger.warn("Invalid 2FA attempt", {
        userId: user._id,
        attempts: user.twoFactor?.attempts,
      });
      return res.status(400).json({ message: "Invalid or expired 2FA code" });
    }

    // Success: clear 2FA & cookie, issue tokens
    user.twoFactor = { code: null, expiresAt: null, attempts: 0 };
    await user.save();
    clear2FACookie(res);

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken);

    logger.info("Login successful", { userId: user._id, email: user.email });
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: accessToken,
      role: user.role,
      message: "Login successful",
    });
  } catch (err) {
    next(err);
  }
};

// ─── Resend 2FA ─────────────────────────────────────────────────────────────
const resend2FA = async (req, res, next) => {
  try {
    const token = req.cookies?.["2fa_token"];
    if (!token) return res.status(401).json({ message: "Missing 2FA token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "2fa") return res.status(401).json({ message: "Invalid 2FA token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const { otpCode, otpExpiry } = createOtp(10);
    user.twoFactor = { code: otpCode, expiresAt: otpExpiry, attempts: 0 };
    await user.save();

    try {
      await sendEmail(user.email, "Your New Login Code", "twoFactorOtp", {
        username: user.username,
        otpCode,
        expiresInMinutes: 10,
        title: "Two-Factor Authentication",
      });
      logger.info("2FA code resent", { userId: user._id, email: user.email });
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    res.json({ message: "A new 2FA code has been sent" });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Access Token ───────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Invalid refresh token" });

    const newAccessToken = signAccessToken({ id: user._id, role: user.role });

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 1000 * 60 * 15,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });

    res.json({ token: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// ─── Forgot Password ────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Always respond the same to avoid leaking which emails exist
    if (!user) return res.json({ message: "If that email exists, a reset mail has been sent." });

    const resetTokenPlain = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetTokenPlain).digest("hex");
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetTokenPlain}&email=${encodeURIComponent(email)}`;

    try {
      await sendEmail(user.email, "Reset your password", "resetPassword", {
        username: user.username,
        resetLink,
        title: "Password Reset",
      });
      logger.info("Password reset email sent", { userId: user._id, email: user.email });
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    res.json({ message: "If that email exists, a reset mail has been sent." });
  } catch (err) {
    next(err);
  }
};

// ─── Reset Password ─────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ message: "Token, email and new password are required" });
    }

    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    user.password = password; // hashed by pre-save
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken);

    logger.info("Password reset successful", { userId: user._id, email: user.email });
    res.json({ message: "Password reset successful", token: accessToken });
  } catch (err) {
    next(err);
  }
};

// ---- Update Password

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // req.user is set by protect middleware
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      logger.warn("Update password failed: wrong current password", { userId: user._id });
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    logger.info("Password updated successfully", { userId: user._id, email: user.email });

    // Optionally re-issue tokens to ensure new sessions
    const { signAccessToken, signRefreshToken } = require("../utils/generateToken");
    const { setAuthCookies } = require("../utils/cookies");

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ message: "Password updated successfully", token: accessToken });
  } catch (err) {
    next(err);
  }
};


// ─── Logout ─────────────────────────────────────────────────────────────────
const logoutUser = async (req, res, next) => {
  try {
    clearAuthCookies(res);
    clear2FACookie(res);
    logger.info("User logged out", { ip: req.ip });
    res.json({ message: "Logout successful. Client should also clear any localStorage token if used." });
  } catch (err) {
    next(err);
  }
};

// ─── Profile ────────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  resendVerificationOtp,
  verifyEmail,
  loginUser,
  verify2FA,
  resend2FA,
  refreshToken,
  forgotPassword,
  resetPassword,
  logoutUser,
  getProfile,
  updatePassword
};