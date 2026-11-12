
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSingleListing } from "../services/listingService";
import { startConversation } from "../services/messageService";
import { useAuth } from "../context/AuthContext";

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  // ============================================
  // FETCH LISTING
  // ============================================

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getSingleListing(id);

        setListing(response.data);
        setSelectedImage(0);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch listing details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // ============================================
  // CHAT WITH SELLER
  // ============================================

  const handleChatWithSeller = async () => {
    try {
      setChatLoading(true);
      setChatError("");

      const response = await startConversation(listing._id);

      const conversation =
        response?.data || response?.conversation || response;

      const conversationId = conversation?._id;

      if (!conversationId) {
        throw new Error("Conversation ID was not returned.");
      }

      navigate(`/chat/${conversationId}`);
    } catch (err) {
      setChatError(
        err.response?.data?.message ||
          err.message ||
          "Failed to start conversation. Please try again."
      );
    } finally {
      setChatLoading(false);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-5 py-20">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-5 w-40 rounded bg-gray-200" />

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="h-[450px] rounded-2xl bg-gray-200" />
            <div className="space-y-5">
              <div className="h-8 w-2/3 rounded bg-gray-200" />
              <div className="h-12 w-1/3 rounded bg-gray-200" />
              <div className="h-32 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error || !listing) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
            !
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Listing unavailable
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error || "This product could not be found."}
          </p>

          <button
            onClick={() => navigate("/listings")}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // USER AND PRODUCT INFORMATION
  // ============================================

  const currentUserId = (
    user?._id || user?.id
  )?.toString();

  const sellerId = listing.seller?._id?.toString();

  const isSeller =
    currentUserId &&
    sellerId &&
    currentUserId === sellerId;

  const images = listing.images || [];

  const price =
    listing.listingType === "free"
      ? "Free"
      : listing.price == null
      ? "Price unavailable"
      : `₹${listing.price}`;

  const listingTypeLabels = {
    sale: "For Sale",
    rent: "For Rent",
    exchange: "Exchange",
    free: "Free",
  };

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10">

      <div className="mx-auto max-w-7xl">

        {/* BACK BUTTON */}

        <button
          onClick={() => navigate("/listings")}
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>

          Back to Marketplace
        </button>

        {/* MAIN PRODUCT CARD */}

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          <div className="grid grid-cols-1 gap-8 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:p-9">

            {/* ================================== */}
            {/* LEFT: PRODUCT GALLERY */}
            {/* ================================== */}

            <div>

              {/* MAIN IMAGE */}

              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gray-100">

                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]?.url}
                    alt={listing.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.4}
                      stroke="currentColor"
                      className="h-16 w-16"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 20.25h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v13.5a1.5 1.5 0 0 0 1.5 1.5Z"
                      />
                    </svg>

                    <p className="text-sm font-medium">
                      No Image Available
                    </p>
                  </div>
                )}

                <span className="absolute left-4 top-4 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                  {listingTypeLabels[listing.listingType] ||
                    listing.listingType}
                </span>
              </div>

              {/* IMAGE THUMBNAILS */}

              {images.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {images.map((image, index) => (
                    <button
                      key={image.publicId || index}
                      onClick={() => setSelectedImage(index)}
                      aria-label={`View image ${index + 1}`}
                      className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                        selectedImage === index
                          ? "border-blue-600 ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${listing.title} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <p className="mt-3 text-xs text-gray-400">
                  {images.length} product image
                  {images.length > 1 ? "s" : ""}
                </p>
              )}

            </div>

            {/* ================================== */}
            {/* RIGHT: PRODUCT INFORMATION */}
            {/* ================================== */}

            <div className="flex flex-col">

              {/* CATEGORY AND TITLE */}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-700">
                    {listing.category}
                  </span>

                  {listing.condition && (
                    <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold capitalize text-gray-600">
                      {listing.condition} condition
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  {listing.title}
                </h1>

                <p className="mt-3 text-sm leading-7 text-gray-500">
                  {listing.description}
                </p>
              </div>

              {/* PRICE CARD */}

              <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  {listing.listingType === "rent"
                    ? "Rental Price"
                    : "Asking Price"}
                </p>

                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                    {price}
                  </span>

                  {listing.listingType === "rent" &&
                    listing.rentPeriod && (
                      <span className="text-sm text-gray-500">
                        / {listing.rentPeriod}
                      </span>
                    )}
                </div>

                {listing.listingType === "exchange" && (
                  <p className="mt-3 text-sm text-gray-600">
                    <span className="font-semibold">
                      Looking for:
                    </span>{" "}
                    {listing.exchangeFor}
                  </p>
                )}
              </div>

              {/* PRODUCT DETAILS */}

              <div className="mt-7">
                <h2 className="text-lg font-bold text-gray-900">
                  Product Details
                </h2>

                <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 px-4">

                  <div className="flex items-center justify-between gap-4 py-4">
                    <span className="text-sm text-gray-500">
                      Condition
                    </span>

                    <span className="text-sm font-semibold capitalize text-gray-800">
                      {listing.condition || "Not specified"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <span className="text-sm text-gray-500">
                      Listing Type
                    </span>

                    <span className="text-sm font-semibold text-gray-800">
                      {listingTypeLabels[listing.listingType] ||
                        listing.listingType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <span className="text-sm text-gray-500">
                      College
                    </span>

                    <span className="max-w-[60%] text-right text-sm font-semibold text-gray-800">
                      {listing.college?.name || "Not available"}
                    </span>
                  </div>

                </div>
              </div>

              {/* SELLER INFORMATION */}

              <div className="mt-7">
                <h2 className="text-lg font-bold text-gray-900">
                  Seller Information
                </h2>

                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">

                  {listing.seller?.profileImage ? (
                    <img
                      src={listing.seller.profileImage}
                      alt={listing.seller.name}
                      className="h-14 w-14 rounded-full border border-gray-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                      {listing.seller?.name
                        ?.charAt(0)
                        ?.toUpperCase() || "S"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">
                      {listing.seller?.name || "Unknown Seller"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Student Seller
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-400">
                      {listing.college?.name || ""}
                    </p>
                  </div>

                  <div className="ml-auto shrink-0">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Seller
                    </span>
                  </div>

                </div>
              </div>

              {/* CHAT ACTION */}

              <div className="mt-6">

                {chatError && (
                  <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {chatError}
                  </p>
                )}

                {isSeller ? (
                  <div className="rounded-xl bg-gray-100 p-4 text-center text-sm font-medium text-gray-600">
                    This is your listing.
                  </div>
                ) : user ? (
                  <button
                    onClick={handleChatWithSeller}
                    disabled={chatLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {chatLoading ? (
                      "Opening Chat..."
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H15m-6.75 7.5h7.5a3.75 3.75 0 0 0 3.75-3.75v-6a3.75 3.75 0 0 0-3.75-3.75h-7.5A3.75 3.75 0 0 0 5.25 7.5v6a3.75 3.75 0 0 0 3 3.675v2.325l3-2.25Z"
                          />
                        </svg>

                        Chat with Seller
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    Login to Chat with Seller
                  </button>
                )}

                <p className="mt-3 text-center text-xs text-gray-400">
                  Connect directly with the student selling this product.
                </p>

              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM NOTE */}

        <p className="mt-6 text-center text-xs text-gray-400">
          Student Marketplace · Buy, sell and connect with fellow students.
        </p>

      </div>
    </div>
  );
};

export default ListingDetails;
