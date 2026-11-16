import React, { useState, useEffect } from "react";
import api from "../services/api";

/**
 * WishlistButton renders a heart or button to toggle a listing in the user's wishlist.
 */
export default function WishlistButton({ listingId, initialInWishlist = false, onToggle }) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInWishlist(initialInWishlist);
  }, [initialInWishlist]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      if (inWishlist) {
        const res = await api.delete(`/wishlist/${listingId}`);
        if (res.data.success) {
          setInWishlist(false);
          if (onToggle) onToggle(false, listingId);
        }
      } else {
        const res = await api.post(`/wishlist/${listingId}`);
        if (res.data.success) {
          setInWishlist(true);
          if (onToggle) onToggle(true, listingId);
        }
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-colors duration-200 flex items-center justify-center shadow-sm ${
        inWishlist
          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
          : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 hover:text-red-500"
      }`}
      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 ${inWishlist ? "fill-current text-red-500" : "fill-none stroke-current"}`}
        viewBox="0 0 24 24"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
