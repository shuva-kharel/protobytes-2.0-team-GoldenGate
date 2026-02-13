const mongoose = require("mongoose");

const lastMessageSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    type: { type: String, enum: ["text", "product"], default: "text" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: null },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    participantKey: { type: String, required: true, unique: true, index: true },
    lastMessage: { type: lastMessageSchema, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
