const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");
const Product = require("../models/Product");
const User = require("../models/User");

function toObjectId(id) {
  return new mongoose.Types.ObjectId(String(id));
}

function makeParticipantKey(a, b) {
  return [String(a), String(b)].sort().join(":");
}

function isConversationMember(conversation, userId) {
  const me = String(userId);
  return conversation.participants.some((p) => String(p) === me);
}

async function findOrCreateConversation(currentUserId, targetUserId) {
  const participantKey = makeParticipantKey(currentUserId, targetUserId);

  let conversation = await Conversation.findOne({ participantKey });
  if (conversation) return conversation;

  conversation = await Conversation.create({
    participants: [toObjectId(currentUserId), toObjectId(targetUserId)],
    participantKey,
  });

  return conversation;
}

function mapConversation(conversation, currentUserId) {
  const me = String(currentUserId);
  const other = (conversation.participants || []).find((p) => String(p._id || p) !== me);
  return {
    _id: conversation._id,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
    lastMessage: conversation.lastMessage || null,
    otherUser: other
      ? {
          _id: other._id,
          username: other.username,
          fullName: other.fullName,
          profilePicture: other.profilePicture,
        }
      : null,
  };
}

async function seedProductMessage({ conversation, senderId, productId, io }) {
  const product = await Product.findById(productId).lean();
  if (!product) {
    throw Object.assign(new Error("Product not found"), { statusCode: 404 });
  }

  const ownerId = String(product?.uploadedBy?.user || "");
  const isParticipantOwner = conversation.participants.some((p) => String(p) === ownerId);
  if (!isParticipantOwner) {
    throw Object.assign(new Error("Product owner is not part of this chat"), { statusCode: 400 });
  }

  const existingProductMessage = await ChatMessage.findOne({
    conversation: conversation._id,
    type: "product",
    "product.productId": product._id,
  }).lean();

  if (existingProductMessage) return null;

  const message = await ChatMessage.create({
    conversation: conversation._id,
    sender: senderId,
    type: "product",
    text: `Interested in borrowing: ${product.name}`,
    product: {
      productId: product._id,
      name: product.name,
      category: product.category,
      location: product.location,
      borrowPrice: Number(product.borrowPrice || 0),
      imageUrl: product?.image?.url || "",
      ownerId: product?.uploadedBy?.user || null,
      ownerUsername: product?.uploadedBy?.username || "",
    },
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: {
      lastMessage: {
        text: message.text,
        type: message.type,
        sender: message.sender,
        createdAt: message.createdAt,
      },
      updatedAt: new Date(),
    },
  });

  const populated = await ChatMessage.findById(message._id)
    .populate("sender", "username fullName profilePicture")
    .lean();

  if (io) {
    io.to(`conversation:${conversation._id}`).emit("chat:message:new", populated);
    conversation.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("chat:conversation:updated", {
        conversationId: String(conversation._id),
      });
    });
  }

  return populated;
}

const getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate("participants", "username fullName profilePicture")
    .sort({ updatedAt: -1 });

  res.json({
    items: conversations.map((c) => mapConversation(c, req.user._id)),
  });
};

const getOrCreateConversationWithUser = async (req, res) => {
  const targetUserId = String(req.params.userId || "");
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (String(req.user._id) === targetUserId) {
    return res.status(400).json({ message: "Cannot chat with yourself" });
  }

  const targetUser = await User.findById(targetUserId).select("_id").lean();
  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const conversation = await findOrCreateConversation(req.user._id, targetUserId);

  const io = req.app.locals.io;
  const productId = req.body?.productId || req.query?.productId;
  if (productId) {
    try {
      await seedProductMessage({
        conversation,
        senderId: req.user._id,
        productId,
        io,
      });
    } catch (err) {
      return res.status(err.statusCode || 400).json({ message: err.message || "Invalid product context" });
    }
  }

  const fullConversation = await Conversation.findById(conversation._id)
    .populate("participants", "username fullName profilePicture")
    .lean();

  res.json({
    conversation: mapConversation(fullConversation, req.user._id),
  });
};

const getConversationMessages = async (req, res) => {
  const conversationId = req.params.conversationId;
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation id" });
  }

  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation || !isConversationMember(conversation, req.user._id)) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before ? new Date(req.query.before) : null;

  const query = { conversation: conversation._id };
  if (before && !Number.isNaN(before.getTime())) {
    query.createdAt = { $lt: before };
  }

  const rows = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username fullName profilePicture")
    .lean();

  rows.reverse();

  res.json({
    items: rows,
    hasMore: rows.length === limit,
  });
};

const sendMessage = async (req, res) => {
  const conversationId = req.params.conversationId;
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation id" });
  }

  const text = String(req.body?.text || "").trim();
  if (!text) {
    return res.status(400).json({ message: "Message text is required" });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !isConversationMember(conversation, req.user._id)) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const message = await ChatMessage.create({
    conversation: conversation._id,
    sender: req.user._id,
    type: "text",
    text,
  });

  conversation.lastMessage = {
    text: message.text,
    type: message.type,
    sender: message.sender,
    createdAt: message.createdAt,
  };
  conversation.updatedAt = new Date();
  await conversation.save();

  const populated = await ChatMessage.findById(message._id)
    .populate("sender", "username fullName profilePicture")
    .lean();

  const io = req.app.locals.io;
  if (io) {
    io.to(`conversation:${conversation._id}`).emit("chat:message:new", populated);
    conversation.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("chat:conversation:updated", {
        conversationId: String(conversation._id),
      });
    });
  }

  res.status(201).json({ message: populated });
};

module.exports = {
  getConversations,
  getOrCreateConversationWithUser,
  getConversationMessages,
  sendMessage,
};
