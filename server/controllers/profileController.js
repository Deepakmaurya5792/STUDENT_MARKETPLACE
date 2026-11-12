
import mongoose from "mongoose";
import User from "../models/User.js";

import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";

// ============================================
// GET MY PROFILE
// ============================================

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select(
        "name email college branch academicYear role profileImage bio createdAt"
      )
      .populate("college", "name slug");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};


// ============================================
// UPDATE MY PROFILE
// ============================================

export const updateMyProfile = async (req, res) => {
  try {
    const { name, branch, academicYear, bio } = req.body;

    const updates = {};

    // Validate and update name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      updates.name = name.trim();
    }

    // Validate and update branch
    if (branch !== undefined) {
      if (typeof branch !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid branch",
        });
      }

      updates.branch = branch.trim();
    }

    // Validate and update academic year
    if (academicYear !== undefined) {
      const year = Number(academicYear);

      if (
        !Number.isInteger(year) ||
        year < 1 ||
        year > 6
      ) {
        return res.status(400).json({
          success: false,
          message: "Academic year must be between 1 and 6",
        });
      }

      updates.academicYear = year;
    }

    // Validate and update bio
    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 300) {
        return res.status(400).json({
          success: false,
          message: "Bio must be a string of at most 300 characters",
        });
      }

      updates.bio = bio.trim();
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        "name email college branch academicYear role profileImage bio createdAt"
      )
      .populate("college", "name slug");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });

  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};





// ============================================
// UPLOAD / REPLACE PROFILE IMAGE
// ============================================

export const uploadProfileImage = async (req, res) => {
  let uploadedImage = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Upload new image first
    uploadedImage = await uploadToCloudinary(req.file.buffer);

    // Save new image information
    const oldPublicId = user.profileImagePublicId;

    user.profileImage = uploadedImage.url;
    user.profileImagePublicId = uploadedImage.publicId;

    await user.save();

    // Delete previous image after successful database update
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId);
      } catch (error) {
        console.error(
          "Old profile image deletion failed:",
          error
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        profileImage: user.profileImage,
        profileImagePublicId: user.profileImagePublicId,
      },
    });

  } catch (error) {
    console.error("Profile image upload error:", error);

    // Clean up newly uploaded image if database update fails
    if (uploadedImage?.publicId) {
      try {
        await deleteFromCloudinary(uploadedImage.publicId);
      } catch (deleteError) {
        console.error("Cloudinary cleanup failed:", deleteError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload profile image",
    });
  }
};


// ============================================
// REMOVE PROFILE IMAGE
// ============================================

export const removeProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.profileImagePublicId) {
      return res.status(400).json({
        success: false,
        message: "No profile image to remove",
      });
    }

    const oldPublicId = user.profileImagePublicId;

    // Remove image information from database
    user.profileImage = "";
    user.profileImagePublicId = "";

    await user.save();

    // Delete image from Cloudinary
    try {
      await deleteFromCloudinary(oldPublicId);
    } catch (error) {
      console.error("Cloudinary image deletion failed:", error);

      return res.status(500).json({
        success: false,
        message: "Profile image removed from profile, but Cloudinary deletion failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile image removed successfully",
    });

  } catch (error) {
    console.error("Profile image removal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove profile image",
    });
  }
};
