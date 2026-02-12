// models/Kyc.js
const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    fullName: { type: String, required: true },
    dob: { type: Date, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },

    category: { type: String, required: true },
    governmentIdNumber: { type: String, required: true },

    governmentIdImage: {
      url: { type: String, required: true },
      publicId: { type: String, required: true }
    },
    selfieImage: {
      url: { type: String, required: true },
      publicId: { type: String, required: true }
    },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Kyc", kycSchema);