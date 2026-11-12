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


export const getMyListings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {
      seller: req.user._id,
    };

    // Optional status filter
    const allowedStatuses = [
      "active",
      "reserved",
      "completed",
      "inactive",
    ];

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid listing status",
        });
      }

      filter.status = req.query.status;
    }

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
    console.error("Get my listings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your listings",
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
  let newlyUploadedImages = [];

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

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    // Check total image limit
    const newFiles = req.files || [];
    const existingImageCount = listing.images.length;

    if (existingImageCount + newFiles.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 images are allowed per listing",
      });
    }

    // Upload new images one by one
    for (const file of newFiles) {
      const uploadedImage = await uploadToCloudinary(file.buffer);
      newlyUploadedImages.push(uploadedImage);
    }

    // Add new images without removing existing ones
    listing.images.push(...newlyUploadedImages);

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: listing,
    });

  } catch (error) {
    console.error("Update listing error:", error);

    // Clean up newly uploaded images if update fails
    await Promise.allSettled(
      newlyUploadedImages.map((image) =>
        deleteFromCloudinary(image.publicId)
      )
    );

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


export const removeListingImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { publicId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Image publicId is required",
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

    // Check whether this image belongs to the listing
    const imageExists = listing.images.some(
      (image) => image.publicId === publicId
    );

    if (!imageExists) {
      return res.status(404).json({
        success: false,
        message: "Image not found in this listing",
      });
    }

    // Delete image from Cloudinary
    await deleteFromCloudinary(publicId);

    // Remove image reference from MongoDB
    listing.images = listing.images.filter(
      (image) => image.publicId !== publicId
    );

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Image removed successfully",
      data: listing,
    });

  } catch (error) {
    console.error("Remove listing image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove image",
    });
  }
};


export const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate listing ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    // Allowed statuses
    const allowedStatuses = [
      "active",
      "reserved",
      "completed",
      "inactive",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing status",
      });
    }

    // Find listing belonging to logged-in user
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

    // Update status
    listing.status = status;

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing status updated successfully",
      data: listing,
    });

  } catch (error) {
    console.error("Update listing status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update listing status",
    });
  }
};
