import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";

export const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      listingType,
      price,
      rentPeriod,
      exchangeFor,
    } = req.body;

    if (!title || !description || !category || !condition || !listingType) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const files = req.files || [];

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 images are allowed",
      });
    }

    const uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer))
    );

    const listing = await Listing.create({
      title,
      description,
      category,
      condition,
      listingType,
      price,
      rentPeriod,
      exchangeFor,
      images: uploadedImages,
      seller: req.user._id,
      college: req.user.college,
    });

    return res.status(201).json({
      success: true,
      message: "Listing created successfully",
      data: listing,
    });
  } catch (error) {
    console.error("Create listing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create listing",
    });
  }
};



export const getAllListings = async (req, res) => {
  try {
    const {
      college,
      category,
      listingType,
      search,
    } = req.query;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      status: "active",
    };

    if (college) {
      filter.college = college;
    }

    if (category) {
      filter.category = category.toLowerCase();
    }

    if (listingType) {
      filter.listingType = listingType;
    }

    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // Fetch listings and total count
    const [listings, totalListings] = await Promise.all([
      Listing.find(filter)
        .populate("seller", "name profileImage")
        .populate("college", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Listing.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalListings / limit);

    return res.status(200).json({
      success: true,
      pagination: {
        currentPage: page,
        limit,
        totalListings,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: listings,
    });

  } catch (error) {
    console.error("Get listings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
    });
  }
};



export const getSingleListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const listing = await Listing.findOne({
      _id: id,
      status: "active",
    })
      .populate("seller", "name profileImage")
      .populate("college", "name slug");

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error("Get single listing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch listing",
    });
  }
};



export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    // Find listing owned by the logged-in user
    const listing = await Listing.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found or you are not the owner",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "condition",
      "listingType",
      "price",
      "rentPeriod",
      "exchangeFor",
    ];

    // Update only permitted fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: listing,
    });

  } catch (error) {
    console.error("Update listing error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update listing",
    });
  }
};



export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const listing = await Listing.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Delete images from Cloudinary
    await Promise.all(
      listing.images.map((image) =>
        image.publicId
          ? deleteFromCloudinary(image.publicId)
          : Promise.resolve()
      )
    );

    // Delete listing from MongoDB
    await Listing.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Listing and its images deleted successfully",
    });
  } catch (error) {
    console.error("Delete listing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete listing",
    });
  }
};