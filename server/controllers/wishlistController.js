// wishlistController.js – Updated with improved validation, error handling, status codes, and response consistency
import mongoose from "mongoose";
import User from "../models/User.js";
import Listing from "../models/Listing.js";

// Helper: ensure authenticated user
const ensureUser = (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return false;
  }
  return true;
};

// ============================================
// ADD TO WISHLIST
// ============================================
export const addToWishlist = async (req, res) => {
  try {
    if (!ensureUser(req, res)) return;
    const { listingId } = req.params;
    if (!listingId) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ success: false, message: "Invalid listing ID format" });
    }

    // Verify listing exists and is active (exclude soft‑deleted listings if such a flag exists)
    const listing = await Listing.findOne({ _id: listingId, status: "active", deleted: { $ne: true } });
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found or is no longer active" });
    }

    // Add to user's savedListings using $addToSet to prevent duplicates
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedListings: listing._id } },
      { new: true }
    ).populate({
      path: "savedListings",
      match: { status: "active", deleted: { $ne: true } },
      populate: [
        { path: "seller", select: "name profileImage college" },
        { path: "college", select: "name" },
      ],
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Retrieve the newly added listing (if it was not already present)
    const addedListing = updatedUser.savedListings.find(l => l && l._id.equals(listing._id));
    if (!addedListing) {
      // Duplicate case – the listing was already in the wishlist
      return res.status(200).json({
        success: true,
        message: "Listing already in wishlist",
        data: updatedUser.savedListings,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Listing added to wishlist successfully",
      data: addedListing,
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({ success: false, message: "Failed to add listing to wishlist" });
  }
};

// ============================================
// REMOVE FROM WISHLIST
// ============================================
export const removeFromWishlist = async (req, res) => {
  try {
    if (!ensureUser(req, res)) return;
    const { listingId } = req.params;
    if (!listingId) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ success: false, message: "Invalid listing ID format" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedListings: new mongoose.Types.ObjectId(listingId) } },
      { new: true }
    ).populate({
      path: "savedListings",
      match: { status: "active", deleted: { $ne: true } },
      populate: [
        { path: "seller", select: "name profileImage college" },
        { path: "college", select: "name" },
      ],
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Listing removed from wishlist successfully",
      data: updatedUser.savedListings,
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove listing from wishlist" });
  }
};

// ============================================
// GET WISHLIST
// ============================================
export const getWishlist = async (req, res) => {
  try {
    if (!ensureUser(req, res)) return;
    const { page = 1, limit = 20 } = req.query; // optional pagination
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
      .populate({
        path: "savedListings",
        match: { status: "active", deleted: { $ne: true } },
        populate: [
          { path: "seller", select: "name profileImage college" },
          { path: "college", select: "name" },
        ],
        options: { sort: { createdAt: -1 }, skip, limit: parseInt(limit, 10) },
      })
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const activeSavedListings = (user.savedListings || []).filter(l => l);

    return res.status(200).json({
      success: true,
      message: "Wishlist retrieved successfully",
      count: activeSavedListings.length,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      data: activeSavedListings,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
  }
};
