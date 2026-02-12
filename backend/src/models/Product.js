const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },

    price: { type: Number, default: 0, min: 0 },
    borrowPrice: { type: Number, required: true, min: 0 },

    productAge: { type: String, default: "" }, // e.g. "6 months"
    location: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "", trim: true },

    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    uploadedBy: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      username: { type: String, required: true },
    },

    status: { type: String, enum: ["available", "borrowed", "inactive"], default: "available", index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);