import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

// Get user's wishlist
router.get("/", authMiddleware, getWishlist);

// Add listing to wishlist
router.post("/:listingId", authMiddleware, addToWishlist);

// Remove listing from wishlist
router.delete("/:listingId", authMiddleware, removeFromWishlist);

export default router;
