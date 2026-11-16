import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getLostFoundItems,
  getLostFoundById,
  createLostFoundItem,
  updateLostFoundStatus,
  claimLostFoundItem,
  deleteLostFoundItem,
  getFreecycleListings,
} from "../controllers/lostFoundController.js";

const router = express.Router();

// Publicly readable within campus
router.get("/", getLostFoundItems);
router.get("/freecycle", getFreecycleListings);
router.get("/:id", getLostFoundById);

// Protected actions
router.post("/", authMiddleware, upload.array("images", 3), createLostFoundItem);
router.patch("/:id/status", authMiddleware, updateLostFoundStatus);
router.post("/:id/claim", authMiddleware, claimLostFoundItem);
router.delete("/:id", authMiddleware, deleteLostFoundItem);

export default router;
