const mongoose = require("mongoose");

const productRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true }, // "Need DSLR Camera"
    category: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true, index: true },

    maxBorrowPrice: { type: Number, default: 0, min: 0 }, // optional budget
    neededFrom: { type: Date, default: null },
    neededTo: { type: Date, default: null },

    description: { type: String, default: "", trim: true },

    createdBy: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      username: { type: String, required: true },
    },

    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductRequest", productRequestSchema);