
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSingleListing } from "../services/listingService";

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getSingleListing(id);
        setListing(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch listing details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return <p className="py-20 text-center">Loading listing details...</p>;
  }

  if (error || !listing) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600">
          {error || "Listing not found."}
        </p>
        <button
          onClick={() => navigate("/listings")}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => navigate("/listings")}
          className="mb-6 text-blue-600 hover:underline"
        >
          ← Back to Marketplace
        </button>

        <div className="grid grid-cols-1 gap-8 rounded-xl bg-white p-6 shadow-lg md:grid-cols-2">

          {/* Images */}
          <div>
            {listing.images?.length > 0 ? (
              <>
                <img
                  src={listing.images[selectedImage]?.url}
                  alt={listing.title}
                  className="h-96 w-full rounded-xl object-cover"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  {listing.images.map((image, index) => (
                    <button
                      key={image.publicId || index}
                      onClick={() => setSelectedImage(index)}
                      className={`overflow-hidden rounded-lg border-2 ${
                        selectedImage === index
                          ? "border-blue-600"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${listing.title} ${index + 1}`}
                        className="h-20 w-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-xl bg-gray-200 text-gray-500">
                No Image Available
              </div>
            )}
          </div>

          {/* Listing Information */}
          <div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm capitalize text-blue-700">
              {listing.listingType}
            </span>

            <h1 className="mt-4 text-3xl font-bold">
              {listing.title}
            </h1>

            <p className="mt-2 text-gray-500">
              {listing.category}
            </p>

            <p className="mt-5 text-3xl font-bold text-blue-600">
              {listing.listingType === "free"
                ? "Free"
                : `₹${listing.price}`}
              {listing.listingType === "rent" && (
                <span className="text-base font-normal text-gray-500">
                  {" "}/ {listing.rentPeriod}
                </span>
              )}
            </p>

            <div className="my-6 border-t" />

            <h2 className="text-xl font-semibold">
              Description
            </h2>

            <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-600">
              {listing.description}
            </p>

            <div className="my-6 border-t" />

            <div className="space-y-3">
              <p>
                <span className="font-semibold">Condition: </span>
                <span className="capitalize">{listing.condition}</span>
              </p>

              <p>
                <span className="font-semibold">Listing Type: </span>
                <span className="capitalize">{listing.listingType}</span>
              </p>

              {listing.listingType === "exchange" && (
                <p>
                  <span className="font-semibold">Looking for: </span>
                  {listing.exchangeFor}
                </p>
              )}

              <p>
                <span className="font-semibold">College: </span>
                {listing.college?.name || "Not available"}
              </p>
            </div>

            <div className="my-6 border-t" />

            {/* Seller Information */}
            <h2 className="text-xl font-semibold">
              Seller Information
            </h2>

            <div className="mt-3 flex items-center gap-4">
              {listing.seller?.profileImage ? (
                <img
                  src={listing.seller.profileImage}
                  alt={listing.seller.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-xl font-bold">
                  {listing.seller?.name?.charAt(0) || "S"}
                </div>
              )}

              <div>
                <p className="font-semibold">
                  {listing.seller?.name || "Unknown Seller"}
                </p>
                <p className="text-sm text-gray-500">
                  Student Seller
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;