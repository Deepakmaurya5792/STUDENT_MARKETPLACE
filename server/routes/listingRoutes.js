
import express from "express";
import upload from "../middleware/uploadMiddleware.js";

import {
  createListing,
  getAllListings,
  getSingleListing,
  updateListing,
  deleteListing,
  removeListingImage,
  getMyListings,
  updateListingStatus,
} from "../controllers/listingController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllListings);

// Protected route - must be before /:id
router.get("/my-listings", authMiddleware, getMyListings);

// Public single listing route
router.get("/:id", getSingleListing);

// Protected routes
router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  createListing
);

router.patch(
  "/:id",
  authMiddleware,
  upload.array("images", 5),
  updateListing
);

router.delete("/:id", authMiddleware, deleteListing);

router.delete(
  "/:id/images",
  authMiddleware,
  removeListingImage
);

router.patch(
  "/:id/status",
  authMiddleware,
  updateListingStatus
);

export default router;
