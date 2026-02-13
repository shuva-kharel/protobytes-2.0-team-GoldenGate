const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["text", "product"], default: "text", index: true },
    text: { type: String, default: "" },
    product: {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
      name: { type: String, default: "" },
      category: { type: String, default: "" },
      location: { type: String, default: "" },
      borrowPrice: { type: Number, default: 0 },
      imageUrl: { type: String, default: "" },
      ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      ownerUsername: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
