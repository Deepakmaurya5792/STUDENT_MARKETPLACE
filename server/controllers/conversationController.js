import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Listing from "../models/Listing.js";

export const startConversation = async (req, res) => {
  try {
    const { listingId } = req.body;
    const buyerId = req.user._id;

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    // Find active listing
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

    // Prevent seller from contacting themselves
    if (listing.seller.toString() === buyerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot contact yourself",
      });
    }

    // Check whether conversation already exists
    let conversation = await Conversation.findOne({
      listing: listingId,
      buyer: buyerId,
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      try {
        conversation = await Conversation.create({
          listing: listingId,
          buyer: buyerId,
          seller: listing.seller,
        });
      } catch (error) {
        // Handle simultaneous requests for the same conversation
        if (error.code !== 11000) {
          throw error;
        }

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
