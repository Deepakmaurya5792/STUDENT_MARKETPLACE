
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

  // ============================================
  // FETCH COLLEGES
  // ============================================

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

  // ============================================
  // FETCH LISTINGS
  // ============================================

  const fetchListings = async (appliedFilters = {}) => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllListings(appliedFilters);
      setListings(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch listings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // ============================================
  // HANDLE FILTER CHANGES
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================
  // SEARCH
  // ============================================

  const handleSearch = (e) => {
    e.preventDefault();

    const appliedFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value.trim() !== ""
      )
    );

    fetchListings(appliedFilters);
  };

  // ============================================
  // RESET FILTERS
  // ============================================

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

  // ============================================
  // FORMAT PRICE
  // ============================================

  const formatPrice = (listing) => {
    if (listing.listingType === "free") {
      return "Free";
    }

    if (listing.price == null) {
      return "Price unavailable";
    }

    return `₹${listing.price}`;
  };

  // ============================================
  // LOADING SKELETON
  // ============================================

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
        >
          <div className="h-52 animate-pulse bg-gray-200" />

          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HERO SECTION */}

      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-7xl">

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-50">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              YOUR CAMPUS MARKETPLACE
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Find what you need.
              <br />
              <span className="text-blue-200">
                Sell what you don't.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100 sm:text-lg">
              Discover great deals, buy and sell products,
              and connect with students across colleges.
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("marketplace-products")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-8 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Explore Marketplace →
            </button>
          </div>

        </div>
      </section>

      {/* MAIN CONTENT */}

      <main
        id="marketplace-products"
        className="mx-auto max-w-7xl px-5 py-12"
      >

        {/* SECTION HEADING */}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Explore products
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Marketplace
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Find something useful from fellow students.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
            <span className="font-bold text-gray-900">
              {listings.length}
            </span>{" "}
            products found
          </div>
        </div>

        {/* SEARCH AND FILTERS */}

        <form
          onSubmit={handleSearch}
          className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >

          {/* SEARCH BAR */}

          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Search products
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="relative flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.34-4.34m0 0A7.5 7.5 0 1 0 6.05 6.05a7.5 7.5 0 0 0 10.61 10.61Z"
                />
              </svg>

              <input
                type="text"
                name="search"
                placeholder="What are you looking for?"
                value={filters.search}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Search Products
            </button>

          </div>

          {/* FILTERS */}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Category
              </label>

              <input
                type="text"
                name="category"
                placeholder="Enter category"
                value={filters.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Listing Type
              </label>

              <select
                name="listingType"
                value={filters.listingType}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">All Types</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="exchange">Exchange</option>
                <option value="free">Free</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                College
              </label>

              <select
                name="college"
                value={filters.college}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">All Colleges</option>

                {colleges.map((college) => (
                  <option key={college._id} value={college._id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Reset Filters
              </button>
            </div>

          </div>
        </form>

        {/* LISTINGS */}

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
              !
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() => fetchListings()}
              className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              🔍
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No products found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Try another keyword or change your filters.
            </p>

            <button
              onClick={handleReset}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Clear Filters
            </button>

          </div>
        ) : (

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {listings.map((listing) => (

              <article
                key={listing._id}
                onClick={() =>
                  navigate(`/listings/${listing._id}`)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/listings/${listing._id}`);
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={`View ${listing.title}`}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >

                {/* PRODUCT IMAGE */}

                <div className="relative h-56 overflow-hidden bg-gray-100">

                  {listing.images?.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      No Image Available
                    </div>
                  )}

                  {/* LISTING TYPE */}

                  <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold capitalize text-gray-700 shadow-sm backdrop-blur">
                    {listing.listingType === "sale"
                      ? "For Sale"
                      : listing.listingType === "rent"
                      ? "For Rent"
                      : listing.listingType}
                  </span>

                  {/* CONDITION */}

                  {listing.condition && (
                    <span className="absolute right-3 top-3 rounded-lg bg-gray-900/75 px-3 py-1.5 text-xs font-medium capitalize text-white backdrop-blur">
                      {listing.condition}
                    </span>
                  )}

                </div>

                {/* PRODUCT DETAILS */}

                <div className="p-4">

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate text-base font-bold text-gray-900 transition group-hover:text-blue-600">
                      {listing.title}
                    </h3>
                  </div>

                  <p className="mt-1 truncate text-xs font-medium uppercase tracking-wide text-gray-400">
                    {listing.category}
                  </p>

                  {/* PRICE */}

                  <div className="mt-4">
                    <p className="text-2xl font-extrabold tracking-tight text-gray-900">
                      {formatPrice(listing)}
                    </p>

                    {listing.listingType === "rent" && listing.rentPeriod && (
                      <p className="mt-1 text-xs text-gray-500">
                        Per {listing.rentPeriod}
                      </p>
                    )}
                  </div>

                  {/* COLLEGE */}

                  <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.7}
                      stroke="currentColor"
                      className="h-4 w-4 shrink-0 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 21h18M5 21V7l8-4v18m6 0V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01"
                      />
                    </svg>

                    <p className="truncate text-xs text-gray-500">
                      {listing.college?.name || "College not available"}
                    </p>

                  </div>

                  {/* SELLER AND ACTION */}

                  <div className="mt-3 flex items-center justify-between gap-2">

                    <div className="flex min-w-0 items-center gap-2">

                      {listing.seller?.profileImage ? (
                        <img
                          src={listing.seller.profileImage}
                          alt={listing.seller.name}
                          className="h-7 w-7 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {listing.seller?.name?.charAt(0) || "S"}
                        </div>
                      )}

                      <span className="truncate text-xs font-medium text-gray-600">
                        {listing.seller?.name || "Student Seller"}
                      </span>

                    </div>

                    <span className="shrink-0 text-xs font-bold text-blue-600 transition group-hover:translate-x-1">
                      View Details →
                    </span>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </main>

      {/* FOOTER */}

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <p className="text-sm text-gray-500">
            Student Marketplace — Buy, Sell and Connect with Students.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Listings;
