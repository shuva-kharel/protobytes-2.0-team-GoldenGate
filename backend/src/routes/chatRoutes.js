const express = require("express");
const router = express.Router();

const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/authMiddleware");
const {
  getConversations,
  getOrCreateConversationWithUser,
  getConversationMessages,
  sendMessage,
} = require("../controllers/chatController");

router.get("/conversations", asyncHandler(protect), asyncHandler(getConversations));
router.post("/conversations/with/:userId", asyncHandler(protect), asyncHandler(getOrCreateConversationWithUser));
router.get("/conversations/:conversationId/messages", asyncHandler(protect), asyncHandler(getConversationMessages));
router.post("/conversations/:conversationId/messages", asyncHandler(protect), asyncHandler(sendMessage));

module.exports = router;
