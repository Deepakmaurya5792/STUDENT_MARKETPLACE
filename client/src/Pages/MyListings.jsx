
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

  // ============================================
  // FETCH MY LISTINGS
  // ============================================

  const fetchMyListings = async (
    page = 1,
    selectedStatus = status
  ) => {
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

  // ============================================
  // STATUS FILTER
  // ============================================

  const handleStatusChange = (e) => {
    const selectedStatus = e.target.value;

    setStatus(selectedStatus);
    setSuccess("");

    fetchMyListings(1, selectedStatus);
  };

  // ============================================
  // PAGINATION
  // ============================================

  const handlePageChange = (page) => {
    fetchMyListings(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================
  // DELETE LISTING
  // ============================================

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

  // ============================================
  // UPDATE LISTING STATUS
  // ============================================

  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      setUpdatingStatusId(listingId);
      setError("");
      setSuccess("");

      await updateListingStatus(listingId, newStatus);

      // Refresh current filter so the listing moves
      // to the correct status category.
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

  // ============================================
  // STATUS COLORS
  // ============================================

  const getStatusStyle = (listingStatus) => {
    switch (listingStatus) {
      case "active":
        return "bg-green-100 text-green-700";

      case "reserved":
        return "bg-yellow-100 text-yellow-700";

      case "completed":
        return "bg-blue-100 text-blue-700";

      case "inactive":
        return "bg-gray-200 text-gray-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // ============================================
  // STATUS MANAGEMENT BUTTONS
  // ============================================

  const renderStatusActions = (listing) => {
    const isUpdating = updatingStatusId === listing._id;

    return (
      <div className="mt-3 space-y-2">

        {listing.status === "active" && (
          <>
            <button
              disabled={isUpdating}
              onClick={() =>
                handleUpdateStatus(listing._id, "reserved")
              }
              className="w-full rounded-lg bg-yellow-500 py-2 text-sm text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Mark as Reserved
            </button>

            <button
              disabled={isUpdating}
              onClick={() =>
                handleUpdateStatus(listing._id, "completed")
              }
              className="w-full rounded-lg bg-green-600 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              Mark as Completed
            </button>

            <button
              disabled={isUpdating}
              onClick={() =>
                handleUpdateStatus(listing._id, "inactive")
              }
              className="w-full rounded-lg bg-gray-600 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Deactivate Listing
            </button>
          </>
        )}

        {listing.status === "reserved" && (
          <>
            <button
              disabled={isUpdating}
              onClick={() =>
                handleUpdateStatus(listing._id, "active")
              }
              className="w-full rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Make Active
            </button>

            <button
              disabled={isUpdating}
              onClick={() =>
                handleUpdateStatus(listing._id, "completed")
              }
              className="w-full rounded-lg bg-green-600 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              Mark as Completed
            </button>

            <button
              disabled={isUpdating}
              onClick={() =>
                handleUpdateStatus(listing._id, "inactive")
              }
              className="w-full rounded-lg bg-gray-600 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Deactivate Listing
            </button>
          </>
        )}

        {listing.status === "inactive" && (
          <button
            disabled={isUpdating}
            onClick={() =>
              handleUpdateStatus(listing._id, "active")
            }
            className="w-full rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Reactivate Listing
          </button>
        )}

        {isUpdating && (
          <p className="text-center text-xs text-gray-500">
            Updating status...
          </p>
        )}

      </div>
    );
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">
          Loading your listings...
        </p>
      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              My Listings
            </h1>

            <p className="mt-2 text-gray-600">
              Manage all the products you have listed.
            </p>
          </div>

          <button
            onClick={() => navigate("/create-listing")}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            + Create Listing
          </button>
        </div>

        {/* STATUS FILTER AND TOTAL */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow">

          <div>
            <p className="text-sm text-gray-500">
              Total Listings
            </p>

            <p className="text-2xl font-bold text-gray-800">
              {pagination.totalListings}
            </p>
          </div>

          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">All Listings</option>
            <option value="active">Active</option>
            <option value="reserved">Reserved</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
          </select>

        </div>

        {/* STATUS MESSAGES */}

        {error && (
          <p className="mb-5 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-5 rounded-lg bg-green-100 p-3 text-green-700">
            {success}
          </p>
        )}

        {/* EMPTY STATE */}

        {listings.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold text-gray-800">
              No listings found
            </h2>

            <p className="mt-2 text-gray-500">
              You haven't created any listings with this status.
            </p>

            <button
              onClick={() => navigate("/create-listing")}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              Create Your First Listing
            </button>
          </div>
        ) : (
          <>
            {/* LISTING CARDS */}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {listings.map((listing) => (
                <div
                  key={listing._id}
                  className="overflow-hidden rounded-xl bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* IMAGE */}

                  {listing.images?.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-gray-200 text-gray-500">
                      No Image Available
                    </div>
                  )}

                  <div className="p-4">

                    {/* TITLE */}

                    <h2 className="truncate text-lg font-semibold">
                      {listing.title}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {listing.category}
                    </p>

                    {/* PRICE */}

                    <p className="mt-3 text-xl font-bold text-blue-600">
                      {listing.listingType === "free"
                        ? "Free"
                        : `₹${listing.price}`}
                    </p>

                    {listing.listingType === "rent" && (
                      <p className="mt-1 text-sm text-gray-500">
                        Per {listing.rentPeriod}
                      </p>
                    )}

                    {/* LISTING TYPE */}

                    <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">
                      {listing.listingType}
                    </span>

                    {/* STATUS */}

                    <div className="mt-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(
                          listing.status
                        )}`}
                      >
                        {listing.status}
                      </span>
                    </div>

                    {/* COLLEGE */}

                    <p className="mt-4 text-sm text-gray-600">
                      {listing.college?.name}
                    </p>

                    {/* ACTION BUTTONS */}

                    <div className="mt-4 space-y-2">

                      {listing.status === "active" && (
                        <>
                          <button
                            onClick={() =>
                              navigate(`/listings/${listing._id}`)
                            }
                            className="w-full rounded-lg border border-blue-600 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                          >
                            View Details
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/edit-listing/${listing._id}`)
                            }
                            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            Edit Listing
                          </button>
                        </>
                      )}

                      {/* DELETE */}

                      <button
                        onClick={() => handleDelete(listing._id)}
                        disabled={
                          deletingId === listing._id ||
                          updatingStatusId === listing._id
                        }
                        className="w-full rounded-lg border border-red-500 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === listing._id
                          ? "Deleting..."
                          : "Delete Listing"}
                      </button>

                      {/* STATUS MANAGEMENT */}

                      {renderStatusActions(listing)}

                    </div>

                  </div>
                </div>
              ))}

            </div>

            {/* PAGINATION */}

            {pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">

                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() =>
                    handlePageChange(
                      pagination.currentPage - 1
                    )
                  }
                  className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm font-medium text-gray-700">
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
                  className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
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
