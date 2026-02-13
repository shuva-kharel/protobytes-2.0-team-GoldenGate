const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");

function parseCookies(rawCookie = "") {
  return rawCookie.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
}

function getTokenFromHandshake(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const authHeader = socket.handshake.headers?.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);

  const cookies = parseCookies(socket.handshake.headers?.cookie || "");
  return cookies.access_token || null;
}

function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

function isMember(conversation, userId) {
  const me = String(userId);
  return (conversation.participants || []).some((p) => String(p) === me);
}

function registerChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) return next(new Error("Not authorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id username fullName profilePicture role").lean();
      if (!user) return next(new Error("Not authorized"));

      socket.user = user;
      return next();
    } catch {
      return next(new Error("Not authorized"));
    }
  });

  io.on("connection", (socket) => {
    const me = String(socket.user._id);
    socket.join(`user:${me}`);

    socket.on("chat:join", async (payload = {}, ack) => {
      try {
        const conversationId = String(payload.conversationId || "");
        if (!isObjectId(conversationId)) throw new Error("Invalid conversation");

        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || !isMember(conversation, me)) throw new Error("Conversation not found");

        socket.join(`conversation:${conversationId}`);
        if (typeof ack === "function") ack({ ok: true });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message || "Join failed" });
      }
    });

    socket.on("chat:leave", (payload = {}, ack) => {
      const conversationId = String(payload.conversationId || "");
      if (conversationId) socket.leave(`conversation:${conversationId}`);
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("chat:message:send", async (payload = {}, ack) => {
      try {
        const conversationId = String(payload.conversationId || "");
        const text = String(payload.text || "").trim();

        if (!isObjectId(conversationId)) throw new Error("Invalid conversation");
        if (!text) throw new Error("Message text is required");

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !isMember(conversation, me)) throw new Error("Conversation not found");

        const message = await ChatMessage.create({
          conversation: conversation._id,
          sender: me,
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

        io.to(`conversation:${conversation._id}`).emit("chat:message:new", populated);
        conversation.participants.forEach((participantId) => {
          io.to(`user:${participantId}`).emit("chat:conversation:updated", {
            conversationId: String(conversation._id),
          });
        });

        if (typeof ack === "function") ack({ ok: true, message: populated });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message || "Message send failed" });
      }
    });
  });
}

module.exports = { registerChatSocket };
