
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllListings } from "../services/listingService";
import { getColleges } from "../services/collegeService";

const Listings = () => {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    listingType: "",
    college: "",
  });

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const collegesData = await getColleges();
        setColleges(collegesData || []);
      } catch (err) {
        console.error("Failed to fetch colleges:", err);
      }
    };

    fetchColleges();
  }, []);

  const fetchListings = async (appliedFilters = {}) => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllListings(appliedFilters);
      setListings(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch listings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const appliedFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value.trim() !== "")
    );

    fetchListings(appliedFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      search: "",
      category: "",
      listingType: "",
      college: "",
    };

    setFilters(emptyFilters);
    fetchListings();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-3xl font-bold">
          Student Marketplace
        </h1>

        <p className="mb-8 text-gray-600">
          Discover products listed by students from different colleges.
        </p>

        <form
          onSubmit={handleSearch}
          className="mb-8 grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow sm:grid-cols-2 lg:grid-cols-5"
        >
          <input
            type="text"
            name="search"
            placeholder="Search products..."
            value={filters.search}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={filters.category}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />

          <select
            name="listingType"
            value={filters.listingType}
            onChange={handleChange}
            className="rounded-lg border p-3"
          >
            <option value="">All Listing Types</option>
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
            <option value="exchange">Exchange</option>
            <option value="free">Free</option>
          </select>

          <select
            name="college"
            value={filters.college}
            onChange={handleChange}
            className="rounded-lg border p-3"
          >
            <option value="">All Colleges</option>

            {colleges.map((college) => (
              <option key={college._id} value={college._id}>
                {college.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg bg-gray-200 px-4 py-3 hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </form>

        {loading ? (
          <p className="py-10 text-center">Loading listings...</p>
        ) : error ? (
          <p className="py-10 text-center text-red-600">{error}</p>
        ) : listings.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold">No listings found</h2>
            <p className="mt-2 text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <div
                key={listing._id}
                onClick={() => navigate(`/listings/${listing._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/listings/${listing._id}`);
                  }
                }}
                className="cursor-pointer overflow-hidden rounded-xl bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
              >
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
                  <h2 className="truncate text-lg font-semibold">
                    {listing.title}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {listing.category}
                  </p>

                  <p className="mt-3 text-xl font-bold text-blue-600">
                    {listing.listingType === "free"
                      ? "Free"
                      : `₹${listing.price}`}
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    {listing.college?.name}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Seller: {listing.seller?.name}
                  </p>

                  <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">
                    {listing.listingType}
                  </span>

                  <p className="mt-3 text-sm font-medium text-blue-600">
                    View Details →
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Listings;
