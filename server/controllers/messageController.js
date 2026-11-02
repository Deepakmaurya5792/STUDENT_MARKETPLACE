
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// Send a message
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

    // Emit real-time message to recipient
    const io = req.app.get("io");

    io.to(recipientId).emit("new-message", {
      conversationId: conversationId.toString(),
      message: populatedMessage,
    });

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


// Get messages with cursor-based pagination
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

    // Get pagination parameters
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

    // If cursor exists, find the cursor message
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

      // Fetch messages older than the cursor message
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

    // Keep only the requested number
    const pageMessages = fetchedMessages.slice(0, limit);

    const messageIds = pageMessages.map((message) => message._id);

    // Mark only the fetched incoming messages as read
    if (messageIds.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          conversation: conversationId,
          sender: { $ne: userId },
          isRead: false,
        },
        {
          $set: { isRead: true },
        }
      );
    }

    // Fetch complete messages after updating read status
    const messages = await Message.find({
      _id: { $in: messageIds },
    })
      .populate("sender", "name profileImage")
      .sort({ createdAt: -1, _id: -1 });

    // Reverse to show oldest first
    messages.reverse();

    // The oldest message in this page becomes the next cursor
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



// Mark all incoming messages in a conversation as read

export const markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

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

    const result = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    // Notify the other participant that their messages were read
    if (result.modifiedCount > 0) {
      const otherUserId =
        conversation.buyer.toString() === userId.toString()
          ? conversation.seller.toString()
          : conversation.buyer.toString();

      const io = req.app.get("io");

      io.to(otherUserId).emit("messages-read", {
        conversationId: conversationId.toString(),
        readBy: userId.toString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });

  } catch (error) {
    console.error("Mark messages read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
    });
  }
};
