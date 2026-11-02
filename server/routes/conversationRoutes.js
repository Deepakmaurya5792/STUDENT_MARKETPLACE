import express from "express";

import {
  startConversation,
  getMyConversations,
} from "../controllers/conversationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMyConversations);

router.post("/", authMiddleware, startConversation);

export default router;
