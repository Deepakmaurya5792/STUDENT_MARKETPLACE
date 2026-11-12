
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyListings,
  deleteListing,
  updateListingStatus,
} from "../services/listingService";

const MyListings = () => {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalListings: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // FETCH MY LISTINGS
  const fetchMyListings = async (page = 1, selectedStatus = status) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 8,
      };

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const response = await getMyListings(params);

      setListings(response.data || []);
      setPagination(response.pagination);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch your listings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings(1, "");
  }, []);

  // STATUS FILTER
  const handleStatusChange = (e) => {
    const selectedStatus = e.target.value;

    setStatus(selectedStatus);
    setSuccess("");

    fetchMyListings(1, selectedStatus);
  };

  // PAGINATION
  const handlePageChange = (page) => {
    fetchMyListings(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE LISTING
  const handleDelete = async (listingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(listingId);
      setError("");
      setSuccess("");

      await deleteListing(listingId);

      const nextPage =
        listings.length === 1 && pagination.currentPage > 1
          ? pagination.currentPage - 1
          : pagination.currentPage;

      await fetchMyListings(nextPage);

      setSuccess("Listing deleted successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete listing"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // UPDATE LISTING STATUS
  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      setUpdatingStatusId(listingId);
      setError("");
      setSuccess("");

      await updateListingStatus(listingId, newStatus);

      await fetchMyListings(1, status);

      setSuccess(
        `Listing marked as ${newStatus} successfully!`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update listing status"
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // STATUS COLORS
  const getStatusStyle = (listingStatus) => {
    switch (listingStatus) {
      case "active":
        return "bg-green-50 text-green-700";

      case "reserved":
        return "bg-yellow-50 text-yellow-700";

      case "completed":
        return "bg-blue-50 text-blue-700";

      case "inactive":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // STATUS OPTIONS
  const getStatusOptions = (listing) => {
    switch (listing.status) {
      case "active":
        return [
          { value: "reserved", label: "Mark as Reserved" },
          { value: "completed", label: "Mark as Completed" },
          { value: "inactive", label: "Deactivate Listing" },
        ];

      case "reserved":
        return [
          { value: "active", label: "Make Active" },
          { value: "completed", label: "Mark as Completed" },
          { value: "inactive", label: "Deactivate Listing" },
        ];

      case "inactive":
        return [
          { value: "active", label: "Reactivate Listing" },
        ];

      default:
        return [];
    }
  };

  // PRICE
  const getPrice = (listing) => {
    if (listing.listingType === "free") {
      return "Free";
    }

    return `₹${listing.price}`;
  };

  // LOADING
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your listings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              My Listings
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage all the products you have listed.
            </p>
          </div>

          <button
            onClick={() => navigate("/create-listing")}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Create Listing
          </button>
        </div>

        {/* FILTER AND TOTAL */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div>
            <p className="text-xs font-medium text-gray-500">
              Total Listings
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {pagination.totalListings}
            </p>
          </div>

          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500"
          >
            <option value="">All Listings</option>
            <option value="active">Active</option>
            <option value="reserved">Reserved</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* ERROR */}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* SUCCESS */}
        {success && (
          <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

        {/* EMPTY STATE */}
        {listings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">
              No listings found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              You haven't created any listings with this status.
            </p>

            <button
              onClick={() => navigate("/create-listing")}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Your First Listing
            </button>
          </div>
        ) : (
          <>
            {/* LISTING GRID */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {listings.map((listing) => {
                const isDeleting = deletingId === listing._id;
                const isUpdating =
                  updatingStatusId === listing._id;

                const statusOptions = getStatusOptions(listing);

                return (
                  <div
                    key={listing._id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* IMAGE */}
                    <div className="relative">
                      {listing.images?.length > 0 ? (
                        <img
                          src={listing.images[0].url}
                          alt={listing.title}
                          className="h-40 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-400">
                          No Image Available
                        </div>
                      )}

                      {/* STATUS BADGE */}
                      <span
                        className={`absolute left-3 top-3 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize shadow-sm ${getStatusStyle(
                          listing.status
                        )}`}
                      >
                        {listing.status}
                      </span>
                    </div>

                    {/* CARD CONTENT */}
                    <div className="p-3">

                      {/* CATEGORY */}
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {listing.category}
                      </p>

                      {/* TITLE */}
                      <h2 className="truncate text-base font-bold text-gray-900">
                        {listing.title}
                      </h2>

                      {/* TAGS */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs capitalize text-gray-600">
                          {listing.listingType === "sale"
                            ? "For Sale"
                            : listing.listingType}
                        </span>

                        {listing.condition && (
                          <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs capitalize text-gray-600">
                            {listing.condition.replace("-", " ")}
                          </span>
                        )}
                      </div>

                      {/* PRICE */}
                      <p className="mt-3 text-xl font-bold text-gray-900">
                        {getPrice(listing)}
                      </p>

                      {listing.listingType === "rent" && (
                        <p className="text-xs text-gray-500">
                          Per {listing.rentPeriod}
                        </p>
                      )}

                      {/* COLLEGE */}
                      <div className="mt-3 flex items-start gap-2 border-t border-gray-100 pt-3">
                        <span className="text-gray-400">♧</span>

                        <p className="line-clamp-1 text-xs text-gray-500">
                          {listing.college?.name ||
                            "College not available"}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-4 space-y-2">

                        {/* VIEW AND EDIT */}
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`/listings/${listing._id}`)
                            }
                            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                          >
                            View
                          </button>

                          {listing.status === "active" ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/edit-listing/${listing._id}`
                                )
                              }
                              className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex-1 cursor-not-allowed rounded-xl bg-gray-100 py-2 text-sm font-medium text-gray-400"
                            >
                              Editing unavailable
                            </button>
                          )}
                        </div>

                        {/* STATUS DROPDOWN */}
                        {statusOptions.length > 0 && (
                          <select
                            value=""
                            disabled={isUpdating || isDeleting}
                            onChange={(e) => {
                              const newStatus = e.target.value;

                              if (newStatus) {
                                handleUpdateStatus(
                                  listing._id,
                                  newStatus
                                );
                              }
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="">
                              {isUpdating
                                ? "Updating status..."
                                : "Change Status"}
                            </option>

                            {statusOptions.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* DELETE */}
                        <button
                          onClick={() => handleDelete(listing._id)}
                          disabled={isDeleting || isUpdating}
                          className="w-full rounded-xl border border-red-100 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {isDeleting
                            ? "Deleting..."
                            : "Delete Listing"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">

                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() =>
                    handlePageChange(
                      pagination.currentPage - 1
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm font-medium text-gray-600">
                  Page {pagination.currentPage} of{" "}
                  {pagination.totalPages}
                </span>

                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() =>
                    handlePageChange(
                      pagination.currentPage + 1
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyListings;
