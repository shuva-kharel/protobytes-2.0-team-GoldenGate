const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Session = require("../models/Session");

const { signAccessToken, signRefreshToken } = require("../utils/generateToken");
const { generateBase32Secret, verifyTotp, buildOtpAuthUrl } = require("../utils/totp");
const sendEmail = require("../utils/sendEmail");
const {
  setAuthCookies,
  clearAuthCookies,
  resolveCookieDomain,
} = require("../utils/cookies");
const logger = require("../utils/logger");

function createOtp(minutes = 10) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + minutes * 60 * 1000);
  return { otpCode, otpExpiry };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function set2FACookie(res, userId) {
  const token = jwt.sign({ id: userId, purpose: "2fa" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const domain = resolveCookieDomain();

  res.cookie("2fa_token", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 1000 * 60 * 10,
    path: "/api/auth/2fa",
    domain,
  });
}

function clear2FACookie(res) {
  const domain = resolveCookieDomain();
  res.clearCookie("2fa_token", {
    path: "/api/auth/2fa",
    domain,
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
  });
}

async function issueSessionTokens(req, res, user) {
  const session = await Session.create({
    user: user._id,
    deviceId: req.deviceId || "unknown-device",
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "",
    refreshTokenHash: "temp",
    lastUsedAt: new Date(),
  });

  const accessToken = signAccessToken({
    id: user._id,
    role: user.role,
    sid: session._id.toString(),
  });
  const refreshToken = signRefreshToken({
    id: user._id,
    role: user.role,
    sid: session._id.toString(),
  });

  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  setAuthCookies(res, accessToken, refreshToken);

  logger.info("Login successful + session created", {
    userId: user._id,
    sessionId: session._id,
    deviceId: req.deviceId,
  });

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    token: accessToken,
    accessToken,
  };
}

function getPublicTwoFactorConfig(user) {
  return {
    enabled: !!user?.twoFactor?.enabled,
    method: user?.twoFactor?.method || "email",
    hasAuthenticator: !!user?.twoFactor?.authenticatorSecret,
  };
}

const registerUser = async (req, res, next) => {
  try {
    const { username, fullName, email, password, role } = req.body;
    const userExists = await User.findOne({ email: (email || "").toLowerCase() });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const { otpCode, otpExpiry } = createOtp(10);

    const user = await User.create({
      username,
      fullName,
      email: email.toLowerCase(),
      password,
      role: role && ["admin", "user"].includes(role) ? role : "user",
      otp: { code: otpCode, expiresAt: otpExpiry, attempts: 0 },
      isEmailVerified: false,
      emailVerifiedAt: null,
      twoFactor: {
        enabled: false,
        method: "email",
      },
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
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      message: "Registered. Please verify your email OTP.",
    });
  } catch (err) {
    next(err);
  }
};

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

    const twoFactorEnabled = !!user.twoFactor?.enabled;
    const method = user.twoFactor?.method || "email";

    if (!twoFactorEnabled) {
      const payload = await issueSessionTokens(req, res, user);
      return res.json({
        ...payload,
        requires2FA: false,
        message: "Login successful",
      });
    }

    if (method === "email") {
      const { otpCode, otpExpiry } = createOtp(10);
      user.twoFactor = {
        ...(user.twoFactor || {}),
        loginChallenge: { code: otpCode, expiresAt: otpExpiry, attempts: 0 },
      };
      await user.save();

      try {
        await sendEmail(user.email, "Your Login Verification Code", "twoFactorOtp", {
          username: user.username,
          otpCode,
          expiresInMinutes: 10,
          title: "Two-Factor Authentication",
        });
      } catch (err) {
        logger.error("Email send failed", { error: err.message });
      }
    }

    set2FACookie(res, user._id.toString());

    return res.json({
      message:
        method === "email"
          ? "2FA code sent to your email. Verify to complete login."
          : "Enter your authenticator app code to complete login.",
      requires2FA: true,
      method,
    });
  } catch (err) {
    next(err);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const token = req.cookies?.["2fa_token"];
    if (!token) return res.status(401).json({ message: "Missing 2FA token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "2fa") return res.status(401).json({ message: "Invalid 2FA token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const method = user.twoFactor?.method || "email";
    const { otp } = req.body;
    const now = new Date();

    if (method === "authenticator") {
      const ok = verifyTotp({ token: otp, secret: user.twoFactor?.authenticatorSecret });
      if (!ok) return res.status(400).json({ message: "Invalid authenticator code" });
    } else {
      const challenge = user.twoFactor?.loginChallenge;
      if (!challenge?.code || challenge.code !== otp || challenge.expiresAt < now) {
        user.twoFactor = {
          ...(user.twoFactor || {}),
          loginChallenge: {
            ...(challenge || {}),
            attempts: (challenge?.attempts || 0) + 1,
          },
        };
        await user.save();
        return res.status(400).json({ message: "Invalid or expired 2FA code" });
      }

      user.twoFactor = {
        ...(user.twoFactor || {}),
        loginChallenge: { code: null, expiresAt: null, attempts: 0 },
      };
      await user.save();
    }

    clear2FACookie(res);

    const payload = await issueSessionTokens(req, res, user);
    return res.json({ ...payload, message: "Login successful" });
  } catch (err) {
    next(err);
  }
};

const resend2FA = async (req, res, next) => {
  try {
    const token = req.cookies?.["2fa_token"];
    if (!token) return res.status(401).json({ message: "Missing 2FA token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "2fa") return res.status(401).json({ message: "Invalid 2FA token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (!user.twoFactor?.enabled || user.twoFactor?.method !== "email") {
      return res.status(400).json({ message: "Resend is available only for email 2FA" });
    }

    const { otpCode, otpExpiry } = createOtp(10);
    user.twoFactor = {
      ...(user.twoFactor || {}),
      loginChallenge: { code: otpCode, expiresAt: otpExpiry, attempts: 0 },
    };
    await user.save();

    try {
      await sendEmail(user.email, "Your New Login Code", "twoFactorOtp", {
        username: user.username,
        otpCode,
        expiresInMinutes: 10,
        title: "Two-Factor Authentication",
      });
    } catch (err) {
      logger.error("Email send failed", { error: err.message });
    }

    res.json({ message: "A new 2FA code has been sent" });
  } catch (err) {
    next(err);
  }
};

const get2FASettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("twoFactor email");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ twoFactor: getPublicTwoFactorConfig(user), email: user.email });
  } catch (err) {
    next(err);
  }
};

const enableEmail2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.twoFactor = {
      ...(user.twoFactor || {}),
      enabled: true,
      method: "email",
      pendingAuthenticatorSecret: "",
    };
    await user.save();

    res.json({ message: "Email 2FA enabled", twoFactor: getPublicTwoFactorConfig(user) });
  } catch (err) {
    next(err);
  }
};

const startAuthenticatorSetup = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = generateBase32Secret();
    const issuer = process.env.TOTP_ISSUER || "Ainchopaincho";
    const account = user.email || user.username;
    const otpauthUrl = buildOtpAuthUrl({ issuer, accountName: account, secret });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUrl)}`;

    user.twoFactor = {
      ...(user.twoFactor || {}),
      pendingAuthenticatorSecret: secret,
    };
    await user.save();

    res.json({
      message: "Scan QR code and verify with a 6-digit code to enable authenticator 2FA",
      otpauthUrl,
      qrCodeUrl,
      manualKey: secret,
    });
  } catch (err) {
    next(err);
  }
};

const verifyAuthenticatorSetup = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pendingSecret = user.twoFactor?.pendingAuthenticatorSecret;
    if (!pendingSecret) {
      return res.status(400).json({ message: "No authenticator setup in progress" });
    }

    const ok = verifyTotp({ token: otp, secret: pendingSecret });
    if (!ok) return res.status(400).json({ message: "Invalid authenticator code" });

    user.twoFactor = {
      ...(user.twoFactor || {}),
      enabled: true,
      method: "authenticator",
      authenticatorSecret: pendingSecret,
      pendingAuthenticatorSecret: "",
      loginChallenge: { code: null, expiresAt: null, attempts: 0 },
    };
    await user.save();

    res.json({ message: "Authenticator 2FA enabled", twoFactor: getPublicTwoFactorConfig(user) });
  } catch (err) {
    next(err);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.twoFactor = {
      ...(user.twoFactor || {}),
      enabled: false,
      method: "email",
      loginChallenge: { code: null, expiresAt: null, attempts: 0 },
      pendingAuthenticatorSecret: "",
    };
    await user.save();

    res.json({ message: "2FA disabled", twoFactor: getPublicTwoFactorConfig(user) });
  } catch (err) {
    next(err);
  }
};

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

    res.json({ accessToken: newAccessToken, token: newAccessToken });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.json({ message: "If that email exists, a reset mail has been sent." });

    const resetTokenPlain = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashToken(resetTokenPlain);

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // IMPORTANT: Build a correct URL (no HTML-escaped &amp;) and use Vite's default port when CLIENT_URL is missing.
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const url = new URL("/reset-password", clientUrl);
    url.searchParams.set("token", resetTokenPlain);
    url.searchParams.set("email", user.email);
    const resetLink = url.toString();

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

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    await Session.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "Password changed" } }
    );

    const payload = await issueSessionTokens(req, res, user);

    res.json({
      message: "Password updated successfully",
      accessToken: payload.accessToken,
      token: payload.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

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

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "username fullName email role profilePicture bio isEmailVerified kycStatus createdAt twoFactor"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const raw = user.toObject();
    raw.twoFactor = getPublicTwoFactorConfig(user);
    res.json(raw);
  } catch (err) {
    next(err);
  }
};

const listSessions = async (req, res, next) => {
  try {
    const currentSid = String(req.auth?.sid || "");
    const currentDeviceId = String(req.deviceId || "");

    const sessions = await Session.find({ user: req.user._id })
      .sort({ lastUsedAt: -1 })
      .select("-refreshTokenHash");

    const mapped = sessions.map((s) => {
      const sidMatch = currentSid && String(s._id) === currentSid;
      const deviceMatch = currentDeviceId && s.deviceId === currentDeviceId;
      return {
        ...s.toObject(),
        isCurrentSession: !!(sidMatch || deviceMatch),
      };
    });

    res.json({ sessions: mapped });
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

const revokeOtherSessions = async (req, res, next) => {
  try {
    const now = new Date();
    const currentDeviceId = req.deviceId || "";
    const currentSid = req.auth?.sid || "";

    await Session.updateMany(
      {
        user: req.user._id,
        revokedAt: null,
        ...(currentDeviceId ? { deviceId: { $ne: currentDeviceId } } : {}),
        ...(currentSid ? { _id: { $ne: currentSid } } : {}),
      },
      { $set: { revokedAt: now, revokeReason: "User revoked other sessions" } }
    );

    res.json({ message: "Other sessions revoked" });
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
  updatePassword,
  logoutUser,
  getProfile,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  revokeAllSessions,
};
