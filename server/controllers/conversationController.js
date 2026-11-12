
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Listing from "../models/Listing.js";
import Message from "../models/Message.js";

// Start or retrieve a conversation
export const startConversation = async (req, res) => {
  try {
    const { listingId } = req.body;
    const buyerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const listing = await Listing.findOne({
      _id: listingId,
      status: "active",
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found or unavailable",
      });
    }

    if (listing.seller.toString() === buyerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot contact yourself",
      });
    }

    let conversation = await Conversation.findOne({
      listing: listingId,
      buyer: buyerId,
    });

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          listing: listingId,
          buyer: buyerId,
          seller: listing.seller,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;

        conversation = await Conversation.findOne({
          listing: listingId,
          buyer: buyerId,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Conversation ready",
      data: conversation,
    });

  } catch (error) {
    console.error("Start conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start conversation",
    });
  }
};


// Get all conversations of logged-in user
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      $or: [
        { buyer: userId },
        { seller: userId },
      ],
    })
      .populate("listing", "title images price listingType")
      .populate("buyer", "name profileImage")
      .populate("seller", "name profileImage")
      .sort({ updatedAt: -1 });

    const conversationIds = conversations.map(
      (conversation) => conversation._id
    );

    // Get unread message counts for all conversations
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          sender: { $ne: userId },
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$conversation",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert unread counts into a lookup object
    const unreadCountMap = {};

    unreadCounts.forEach((item) => {
      unreadCountMap[item._id.toString()] = item.count;
    });

    // Attach latest message and unread count
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({
          conversation: conversation._id,
        })
          .sort({ createdAt: -1, _id: -1 })
          .select("text sender createdAt isRead");

        return {
          ...conversation.toObject(),
          lastMessage,
          unreadCount:
            unreadCountMap[conversation._id.toString()] || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: conversationsWithDetails.length,
      data: conversationsWithDetails,
    });

  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};
