
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  removeProfileImage,
} from "../controllers/profileController.js";

const router = express.Router();

// Get logged-in user's profile
router.get("/me", authMiddleware, getMyProfile);

// Update profile information
router.patch("/me", authMiddleware, updateMyProfile);

// Upload or replace profile image
router.patch(
  "/me/image",
  authMiddleware,
  upload.single("image"),
  uploadProfileImage
);

// Remove profile image
router.delete(
  "/me/image",
  authMiddleware,
  removeProfileImage
);

export default router;
