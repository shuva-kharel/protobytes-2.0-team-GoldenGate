const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // device recognition
    deviceId: { type: String, required: true, index: true },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // store hashed refresh token so we can revoke/rotate securely
    refreshTokenHash: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },

    revokedAt: { type: Date, default: null },
    revokeReason: { type: String, default: "" },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, deviceId: 1 });

module.exports = mongoose.model("Session", sessionSchema);