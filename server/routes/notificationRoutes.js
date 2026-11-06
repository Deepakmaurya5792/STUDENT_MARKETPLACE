
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// Get notifications and unread count
router.get("/", authMiddleware, getNotifications);

// Mark all notifications as read
router.patch("/read-all", authMiddleware, markAllNotificationsRead);

// Mark one notification as read
router.patch("/:notificationId/read", authMiddleware, markNotificationRead);

export default router;
