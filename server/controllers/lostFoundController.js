import LostFound from "../models/LostFound.js";
import Listing from "../models/Listing.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import College from "../models/College.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// ============================================
// GET LOST & FOUND ITEMS
// ============================================

export const getLostFoundItems = async (req, res) => {
  try {
    const {
      type,
      category,
      status,
      college,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (type && ["lost", "found"].includes(type)) {
      query.type = type;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (status) {
      query.status = status;
    } else {
      // Default to open unless resolved is requested
      query.status = "open";
    }

    if (college) {
      query.college = college;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [items, totalCount] = await Promise.all([
      LostFound.find(query)
        .populate("user", "name email profileImage branch academicYear")
        .populate("college", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LostFound.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: items.length,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: items,
    });
  } catch (error) {
    console.error("Get Lost & Found error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Lost & Found items",
    });
  }
};

// ============================================
// GET SINGLE LOST & FOUND ITEM
// ============================================

export const getLostFoundById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await LostFound.findById(id)
      .populate("user", "name email profileImage branch academicYear")
      .populate("college", "name slug")
      .populate("claimedBy", "name email profileImage");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get single Lost & Found item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch item details",
    });
  }
};

// ============================================
// CREATE LOST & FOUND ITEM
// ============================================

export const createLostFoundItem = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      category,
      location,
      date,
      securityQuestion,
      contactInfo,
    } = req.body;

    if (!type || !title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: "Type, title, description, category, and location are required",
      });
    }

    if (!["lost", "found"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'lost' or 'found'",
      });
    }

    const files = req.files || [];
    if (files.length > 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 images allowed",
      });
    }

    const uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, file.mimetype))
    );

    const item = await LostFound.create({
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      date: date ? new Date(date) : new Date(),
      securityQuestion: securityQuestion?.trim() || "",
      contactInfo: contactInfo?.trim() || "",
      images: uploadedImages,
      user: req.user._id,
      college: req.user.college,
    });

    const populatedItem = await LostFound.findById(item._id)
      .populate("user", "name email profileImage branch academicYear")
      .populate("college", "name slug");

    return res.status(201).json({
      success: true,
      message: `${type === "lost" ? "Lost item reported" : "Found item posted"} successfully`,
      data: populatedItem,
    });
  } catch (error) {
    console.error("Create Lost & Found error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit report",
    });
  }
};

// ============================================
// UPDATE STATUS (RESOLVED / OPEN)
// ============================================

export const updateLostFoundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["open", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'open' or 'resolved'",
      });
    }

    const item = await LostFound.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Only owner or admin can update status
    if (
      item.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this item",
      });
    }

    item.status = status;
    await item.save();

    return res.status(200).json({
      success: true,
      message: `Item marked as ${status}`,
      data: item,
    });
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update item status",
    });
  }
};

// ============================================
// CLAIM ITEM / NOTIFY POSTER
// ============================================

export const claimLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, answer } = req.body;

    const item = await LostFound.findById(id).populate("user", "name email");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot claim your own item",
      });
    }

    // Create notification for item creator
    await Notification.create({
      recipient: item.user._id,
      sender: req.user._id,
      type: "transaction_update",
      title: item.type === "found" ? "Claim request for found item" : "Someone may have found your item!",
      message: `${req.user.name} sent a message regarding: "${item.title}". Note: ${message || answer || "Contact me on campus"}`,
    });

    return res.status(200).json({
      success: true,
      message: "Claim message sent to the poster successfully",
    });
  } catch (error) {
    console.error("Claim item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit claim",
    });
  }
};

// ============================================
// DELETE ITEM
// ============================================

export const deleteLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await LostFound.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (
      item.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this item",
      });
    }

    await LostFound.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Delete item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
    });
  }
};

// ============================================
// GET ZERO-RUPEE FREECYCLE LISTINGS
// ============================================

export const getFreecycleListings = async (req, res) => {
  try {
    const { college, category, search, page = 1, limit = 20 } = req.query;

    const query = {
      listingType: "free",
      status: "active",
    };

    if (college) {
      query.college = college;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [listings, totalCount] = await Promise.all([
      Listing.find(query)
        .populate("seller", "name email profileImage branch academicYear")
        .populate("college", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Listing.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: listings.length,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: listings,
    });
  } catch (error) {
    console.error("Get Freecycle listings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Freecycle items",
    });
  }
};
