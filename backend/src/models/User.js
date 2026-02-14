const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const otpSchema = new mongoose.Schema({
  code: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
});

const twoFactorSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    method: {
      type: String,
      enum: ["email", "authenticator"],
      default: "email",
    },
    authenticatorSecret: { type: String, default: "" },
    pendingAuthenticatorSecret: { type: String, default: "" },
    loginChallenge: { type: otpSchema, default: () => ({}) },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, default: "", trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    // Email verification
    isEmailVerified: { type: Boolean, default: false, index: true },
    emailVerifiedAt: { type: Date, default: null },

    // Roles
    role: { type: String, enum: ["admin", "user"], default: "user", index: true },

    // 2FA for login
    twoFactor: { type: twoFactorSchema, default: () => ({}) },

    // Account verification OTP (register flow)
    otp: { type: otpSchema, default: () => ({}) },

    // Password reset
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },

    // About
    profilePicture: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    bio: { type: String, default: "" },

    // 🔔 Notification preferences
    notifications: {
      newMessageEmail: { type: Boolean, default: true },
      loginAlertEmail: { type: Boolean, default: true },
      twoFactorEmail: { type: Boolean, default: true },
      securityEmail: { type: Boolean, default: true }, // password/session alerts
    },
  },
  { timestamps: true }
);

// Hash password on change
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);