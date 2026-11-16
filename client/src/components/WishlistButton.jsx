import { useState, useEffect, useRef } from "react";
import api from "../services/api";

/**
 * WishlistButton – heart icon that toggles a listing in/out of the user's wishlist.
 * Uses only the packages already installed in the project (no extra deps).
 */
export default function WishlistButton({
  listingId,
  initialInWishlist = false,
  onToggle,
}) {
  const [inWishlist, setInWishlist]   = useState(initialInWishlist);
  const [loading,    setLoading]      = useState(false);
  const [flashMsg,   setFlashMsg]     = useState(""); // brief inline feedback
  const isMounted = useRef(true);

  // Cleanup flag on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Keep state in sync when parent changes the prop
  useEffect(() => {
    setInWishlist(initialInWishlist);
  }, [initialInWishlist]);

  // Show a brief inline message then clear it
  const showFlash = (msg) => {
    setFlashMsg(msg);
    setTimeout(() => {
      if (isMounted.current) setFlashMsg("");
    }, 2500);
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      if (inWishlist) {
        const res = await api.delete(`/wishlist/${listingId}`);
        if (res?.data?.success) {
          if (isMounted.current) setInWishlist(false);
          if (onToggle) onToggle(false, listingId);
          showFlash("Removed from wishlist");
        } else {
          throw new Error(res?.data?.message || "Failed to remove from wishlist");
        }
      } else {
        const res = await api.post(`/wishlist/${listingId}`);
        if (res?.data?.success) {
          if (isMounted.current) setInWishlist(true);
          if (onToggle) onToggle(true, listingId);
          showFlash("Saved to wishlist!");
        } else {
          throw new Error(res?.data?.message || "Failed to add to wishlist");
        }
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      showFlash(err.message || "Failed to update wishlist");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        className={`p-2 rounded-full transition-colors duration-200 flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          inWishlist
            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
            : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 hover:text-red-500"
        }`}
      >
        {/* Heart icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform duration-150 ${loading ? "scale-90 opacity-60" : ""} ${inWishlist ? "fill-current text-red-500" : "fill-none stroke-current"}`}
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

      {/* Inline flash message */}
      {flashMsg && (
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-0.5 text-[10px] text-white shadow z-20">
          {flashMsg}
        </span>
      )}
    </div>
  );
}
