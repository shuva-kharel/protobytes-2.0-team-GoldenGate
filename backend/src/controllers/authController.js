// controllers/authController.js
const User = require("../models/User");
const { signAccessToken, signRefreshToken } = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");

// helper to create OTP
function createOtp(minutes = 10) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + minutes * 60 * 1000);
  return { otpCode, otpExpiry };
}

// ------------------------ REGISTER ------------------------
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const { otpCode, otpExpiry } = createOtp(10);

    const user = await User.create({
      username,
      email,
      password,
      otp: { code: otpCode, expiresAt: otpExpiry, attempts: 0 },
      isEmailVerified: false,
      emailVerifiedAt: null,
      twoFactorEnabled: false,
    });

    await sendEmail(user.email, "Verify Your Email", "verifyEmail", {
      username: user.username,
      otpCode,
      expiresInMinutes: 10,
      title: "Verify your email",
    });

    const accessToken = signAccessToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: accessToken,
      message: "User registered. Check your email for the OTP to verify your account.",
      isEmailVerified: user.isEmailVerified,
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------ RESEND OTP ------------------------
const resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isEmailVerified) return res.json({ message: "Email already verified" });

    const { otpCode, otpExpiry } = createOtp(10);
    user.otp = { code: otpCode, expiresAt: otpExpiry, attempts: 0 };
    await user.save();

    await sendEmail(user.email, "Your New Verification Code", "verifyEmail", {
      username: user.username,
      otpCode,
      expiresInMinutes: 10,
      title: "Verify your email",
    });

    res.json({ message: "Verification code resent" });
  } catch (error) {
    next(error);
  }
};

// ------------------------ VERIFY EMAIL ------------------------
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
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

    res.json({ message: "Email verified successfully", isEmailVerified: true });
  } catch (error) {
    next(error);
  }
};

// ------------------------ LOGIN ------------------------
const loginUser = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isEmailVerified) {
      return res.status(401).json({ message: "Please verify your email before logging in" });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) return res.status(401).json({ message: "Invalid email or password" });

    const accessToken = signAccessToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: accessToken,
      message: "Login successful",
      isEmailVerified: user.isEmailVerified,
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------ REFRESH ACCESS TOKEN ------------------------
const refreshToken = async (req, res, next) => {
  try {
    const jwt = require("jsonwebtoken");
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Invalid refresh token" });

    const newAccessToken = signAccessToken({ id: user._id });

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 1000 * 60 * 15,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });

    res.json({ token: newAccessToken });
  } catch (error) {
    next(error);
  }
};

// ------------------------ LOGOUT ------------------------
const logoutUser = async (req, res, next) => {
  try {
    clearAuthCookies(res);
    res.json({ message: "Logout successful. Client should also clear any localStorage token if used." });
  } catch (error) {
    next(error);
  }
};

// ------------------------ GET PROFILE ------------------------
const getProfile = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  resendVerificationOtp,
  verifyEmail,
  loginUser,
  refreshToken,
  logoutUser,
  getProfile,
};