import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import WishlistButton from "../components/WishlistButton";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get("/wishlist");
      if (res.data.success) {
        setWishlist(res.data.data || []);
      } else {
        setError("Failed to load wishlist");
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = (isInWishlist, listingId) => {
    if (!isInWishlist) {
      setWishlist((prev) => prev.filter((item) => item._id !== listingId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-red-500 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          My Wishlist
        </h1>
        <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
          {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {wishlist.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
          <div className="text-gray-400 mb-4 flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 stroke-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">Your wishlist is empty</h2>
          <p className="text-gray-500 text-sm mb-6">
            Browse marketplace listings and click the heart icon to save items for later.
          </p>
          <Link
            to="/listings"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Explore Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((listing) => (
            <div
              key={listing._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col relative group"
            >
              <Link to={`/listings/${listing._id}`} className="block relative aspect-w-4 aspect-h-3 bg-gray-100">
                <img
                  src={
                    listing.images && listing.images.length > 0
                      ? listing.images[0].url
                      : "https://via.placeholder.com/400x300?text=No+Image"
                  }
                  alt={listing.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 z-10">
                  <WishlistButton
                    listingId={listing._id}
                    initialInWishlist={true}
                    onToggle={handleRemove}
                  />
                </div>
                {listing.condition && (
                  <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                    {listing.condition}
                  </span>
                )}
              </Link>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {listing.category || "General"}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      \${listing.price}
                    </span>
                  </div>
                  <Link to={`/listings/${listing._id}`}>
                    <h3 className="font-semibold text-gray-900 text-base line-clamp-1 hover:text-indigo-600 transition-colors">
                      {listing.title}
                    </h3>
                  </Link>
                  <p className="text-gray-500 text-xs line-clamp-2 mt-1 mb-3">
                    {listing.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={
                        listing.seller?.profileImage ||
                        "https://via.placeholder.com/150?text=User"
                      }
                      alt={listing.seller?.name || "Seller"}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="truncate max-w-[100px]">
                      {listing.seller?.name || "Student"}
                    </span>
                  </div>
                  <span>
                    {listing.college?.name || "Campus"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
