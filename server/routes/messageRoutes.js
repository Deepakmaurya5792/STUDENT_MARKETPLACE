
import express from "express";
import {
  sendMessage,
  getMessages,
  markConversationRead,
} from "../controllers/messageController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, sendMessage);

router.get("/:conversationId", authMiddleware, getMessages);

router.patch("/:conversationId/read", authMiddleware, markConversationRead);

export default router;
