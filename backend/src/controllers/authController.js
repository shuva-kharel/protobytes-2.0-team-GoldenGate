// src/controllers/authController.js
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Session = require("../models/Session");

const { signAccessToken, signRefreshToken } = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const logger = require("../utils/logger");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function createOtp(minutes = 10) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + minutes * 60 * 1000);
  return { otpCode, otpExpiry };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function set2FACookie(res, userId) {
  const token = jwt.sign(
    { id: userId, purpose: "2fa" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

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

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({ email: (email || "").toLowerCase() });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const { otpCode, otpExpiry } = createOtp(10);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
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
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      message: "Registered. Please verify your email OTP.",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RESEND EMAIL VERIFY OTP
// ─────────────────────────────────────────────
const resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: (email || "").toLowerCase() });
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
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    res.json({ message: "Verification OTP resent" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isEmailVerified) return res.json({ message: "Email already verified" });

    const now = new Date();
    if (!user.otp?.code || user.otp.code !== otp || user.otp.expiresAt < now) {
      user.otp = { ...(user.otp || {}), attempts: (user.otp?.attempts || 0) + 1 };
      await user.save();
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.otp = { code: null, expiresAt: null, attempts: 0 };
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// LOGIN STEP 1: password check, send 2FA OTP
// Supports {login,password} OR legacy {email,password}
// ─────────────────────────────────────────────
const loginUser = async (req, res, next) => {
  try {
    const { login, email, password } = req.body;

    const loginValue = (login || email || "").trim();
    if (!loginValue || !password) {
      return res.status(400).json({ message: "Login (email/username) and password are required" });
    }

    const looksLikeEmail = loginValue.includes("@");

    const user = await User.findOne({
      $or: [
        ...(looksLikeEmail ? [{ email: loginValue.toLowerCase() }] : []),
        { username: loginValue },
      ],
    });

    if (!user) return res.status(401).json({ message: "Invalid login or password" });
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: "Please verify your email before logging in" });
    }

    const ok = await user.matchPassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid login or password" });

    // generate 2FA OTP
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

    set2FACookie(res, user._id.toString());

    res.json({
      message: "2FA code sent to your email. Verify to complete login.",
      requires2FA: true,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// LOGIN STEP 2: verify 2FA OTP, create session, issue cookies
// ─────────────────────────────────────────────
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

    // clear 2FA state
    user.twoFactor = { code: null, expiresAt: null, attempts: 0 };
    await user.save();
    clear2FACookie(res);

    // Create session (device recognition via req.deviceId)
    const session = await Session.create({
      user: user._id,
      deviceId: req.deviceId,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
      refreshTokenHash: "temp",
      lastUsedAt: new Date(),
    });

    // Issue tokens with sessionId (sid)
    const accessToken = signAccessToken({ id: user._id, role: user.role, sid: session._id.toString() });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role, sid: session._id.toString() });

    session.refreshTokenHash = hashToken(refreshToken);
    await session.save();

    setAuthCookies(res, accessToken, refreshToken);

    logger.info("Login successful + session created", {
      userId: user._id,
      sessionId: session._id,
      deviceId: req.deviceId,
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: accessToken,
      message: "Login successful",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RESEND 2FA OTP
// ─────────────────────────────────────────────
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

      logger.info("2FA code sent", { userId: user._id, email: user.email });
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    res.json({ message: "A new 2FA code has been sent" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// REFRESH: validates session + rotates refresh token
// ─────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const session = await Session.findById(decoded.sid);
    if (!session || session.revokedAt) return res.status(401).json({ message: "Session revoked" });

    const incomingHash = hashToken(token);
    if (incomingHash !== session.refreshTokenHash) {
      session.revokedAt = new Date();
      session.revokeReason = "Refresh token reuse detected";
      await session.save();

      logger.warn("Refresh token reuse detected", { sid: decoded.sid, userId: decoded.id });

      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Invalid refresh token" });

    const newAccessToken = signAccessToken({ id: user._id, role: user.role, sid: session._id.toString() });
    const newRefreshToken = signRefreshToken({ id: user._id, role: user.role, sid: session._id.toString() });

    session.refreshTokenHash = hashToken(newRefreshToken);
    session.lastUsedAt = new Date();
    session.ip = req.ip;
    session.userAgent = req.headers["user-agent"] || session.userAgent;
    await session.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({ token: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: (email || "").toLowerCase() });
    // Do not leak whether email exists
    if (!user) return res.json({ message: "If that email exists, a reset mail has been sent." });

    const resetTokenPlain = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashToken(resetTokenPlain);

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetTokenPlain}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendEmail(user.email, "Reset your password", "resetPassword", {
        username: user.username,
        resetLink,
        title: "Password Reset",
      });
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    res.json({ message: "If that email exists, a reset mail has been sent." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;

    const user = await User.findOne({
      email: (email || "").toLowerCase(),
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    // revoke all sessions after password reset
    await Session.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "Password reset" } }
    );

    clearAuthCookies(res);

    res.json({ message: "Password reset successful. Please login again." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// UPDATE PASSWORD (settings page)
// - verifies current password
// - updates password
// - revokes all sessions
// - creates a new session for current device and logs user in again
// ─────────────────────────────────────────────
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    // revoke all old sessions
    await Session.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "Password changed" } }
    );

    // create fresh session and re-issue tokens
    const session = await Session.create({
      user: user._id,
      deviceId: req.deviceId,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
      refreshTokenHash: "temp",
      lastUsedAt: new Date(),
    });

    const accessToken = signAccessToken({ id: user._id, role: user.role, sid: session._id.toString() });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role, sid: session._id.toString() });

    session.refreshTokenHash = hashToken(refreshToken);
    await session.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.json({ message: "Password updated successfully", token: accessToken });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// LOGOUT (revoke current session if possible)
// ─────────────────────────────────────────────
const logoutUser = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        await Session.findByIdAndUpdate(decoded.sid, {
          revokedAt: new Date(),
          revokeReason: "User logout",
        });
      } catch (_) {
        // ignore decode errors
      }
    }

    clearAuthCookies(res);
    clear2FACookie(res);

    res.json({ message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// SESSION MANAGEMENT (user can view & revoke devices)
// ─────────────────────────────────────────────
const listSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .sort({ lastUsedAt: -1 })
      .select("-refreshTokenHash");

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ _id: sessionId, user: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.revokedAt = new Date();
    session.revokeReason = "User revoked";
    await session.save();

    res.json({ message: "Session revoked" });
  } catch (err) {
    next(err);
  }
};

const revokeAllSessions = async (req, res, next) => {
  try {
    await Session.updateMany(
      { user: req.user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "User revoked all sessions" } }
    );

    clearAuthCookies(res);

    res.json({ message: "All sessions revoked" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  resendVerificationOtp,
  verifyEmail,

  loginUser,
  verify2FA: verify2FA, // keep name consistent with routes below
  resend2FA,

  refreshToken,
  forgotPassword,
  resetPassword,
  updatePassword,

  logoutUser,
  getProfile,

  listSessions,
  revokeSession,
  revokeAllSessions,
};