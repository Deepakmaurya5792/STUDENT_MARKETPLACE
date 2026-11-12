
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";


// ============================================
// SEND MESSAGE
// ============================================

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const senderId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    if (text.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters",
      });
    }

    // Verify conversation participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [
        { buyer: senderId },
        { seller: senderId },
      ],
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied",
      });
    }

    // Save message
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text: text.trim(),
    });

    // Update conversation activity time
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender information
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name profileImage");

    // Identify recipient
    const recipientId =
      conversation.buyer.toString() === senderId.toString()
        ? conversation.seller.toString()
        : conversation.buyer.toString();

    // Get Socket.IO instance
    const io = req.app.get("io");

    // ============================================
    // CREATE NOTIFICATION
    // ============================================

    try {
      const senderName =
        populatedMessage.sender?.name || "A student";

      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: "new_message",
        title: `New message from ${senderName}`,
        message: text.trim().length > 100
          ? `${text.trim().substring(0, 100)}...`
          : text.trim(),
        relatedConversation: conversationId,
        relatedListing: conversation.listing || null,
      });

      // Populate notification sender
      const populatedNotification = await Notification.findById(
        notification._id
      ).populate("sender", "name profileImage");

      // Emit real-time notification
      if (io) {
        io.to(recipientId).emit(
          "new-notification",
          populatedNotification
        );
      }

    } catch (notificationError) {
      // Notification failure should not fail message delivery
      console.error(
        "Notification creation error:",
        notificationError
      );
    }

    // ============================================
    // EMIT REAL-TIME MESSAGE
    // ============================================

    if (io) {
      io.to(recipientId).emit("new-message", {
        conversationId: conversationId.toString(),
        message: populatedMessage,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });

  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};


// ============================================
// GET MESSAGES WITH CURSOR PAGINATION
// ============================================

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    // Pagination parameters
    const { before } = req.query;

    let limit = Number.parseInt(req.query.limit, 10);

    if (!Number.isInteger(limit) || limit < 1) {
      limit = 20;
    }

    // Prevent excessively large requests
    limit = Math.min(limit, 50);

    // Verify conversation participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [
        { buyer: userId },
        { seller: userId },
      ],
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied",
      });
    }

    // Base query
    const query = {
      conversation: conversationId,
    };

    // Cursor-based pagination
    if (before) {
      if (!mongoose.Types.ObjectId.isValid(before)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message cursor",
        });
      }

      const cursorMessage = await Message.findOne({
        _id: before,
        conversation: conversationId,
      }).select("createdAt");

      if (!cursorMessage) {
        return res.status(400).json({
          success: false,
          message: "Message cursor not found",
        });
      }

      // Fetch messages older than cursor
      query.$or = [
        {
          createdAt: { $lt: cursorMessage.createdAt },
        },
        {
          createdAt: cursorMessage.createdAt,
          _id: { $lt: before },
        },
      ];
    }

    // Fetch newest messages first
    const fetchedMessages = await Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .select("_id");

    // Check whether older messages exist
    const hasMore = fetchedMessages.length > limit;

    // Keep requested number of messages
    const pageMessages = fetchedMessages.slice(0, limit);

    const messageIds = pageMessages.map(
      (message) => message._id
    );

    // Fetch complete messages WITHOUT changing read status
    const messages = await Message.find({
      _id: { $in: messageIds },
    })
      .populate("sender", "name profileImage")
      .sort({ createdAt: -1, _id: -1 });

    // Reverse to show oldest first
    messages.reverse();

    // Oldest message becomes the next cursor
    const nextCursor =
      messages.length > 0
        ? messages[0]._id.toString()
        : null;

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: {
        messages,
        hasMore,
        nextCursor: hasMore ? nextCursor : null,
      },
    });

  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};


// ============================================
// MARK CONVERSATION MESSAGES AS READ
// ============================================


export const markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    // Verify conversation participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [
        { buyer: userId },
        { seller: userId },
      ],
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied",
      });
    }

    // Mark incoming messages as read
    const messageResult = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    // Mark related notifications as read
    const notificationResult = await Notification.updateMany(
      {
        recipient: userId,
        relatedConversation: conversationId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    // Calculate updated unread notification count
    const unreadNotificationCount =
      await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });

    const io = req.app.get("io");

    // Notify the other participant about message read receipts
    if (messageResult.modifiedCount > 0 && io) {
      const otherUserId =
        conversation.buyer.toString() === userId.toString()
          ? conversation.seller.toString()
          : conversation.buyer.toString();

      io.to(otherUserId).emit("messages-read", {
        conversationId: conversationId.toString(),
        readBy: userId.toString(),
      });
    }

    // Synchronize notification state with the user's other clients
    if (notificationResult.modifiedCount > 0 && io) {
      io.to(userId.toString()).emit("notifications-read", {
        conversationId: conversationId.toString(),
        unreadCount: unreadNotificationCount,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Messages and related notifications marked as read",
      modifiedMessages: messageResult.modifiedCount,
      modifiedNotifications: notificationResult.modifiedCount,
      unreadNotificationCount,
    });

  } catch (error) {
    console.error("Mark messages read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages and notifications as read",
    });
  }
};
