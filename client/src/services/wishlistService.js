import api from "./api";

/**
 * Wishlist service – thin wrappers around the existing Axios instance.
 * Always uses /api/wishlist routes protected by JWT (HTTP-only cookie).
 */

export const addToWishlist = (listingId) =>
  api.post(`/wishlist/${listingId}`);

export const removeFromWishlist = (listingId) =>
  api.delete(`/wishlist/${listingId}`);

export const getWishlist = () =>
  api.get("/wishlist");
