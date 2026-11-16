import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getLostFoundItems,
  createLostFoundItem,
  updateLostFoundStatus,
  claimLostFoundItem,
  deleteLostFoundItem,
  getFreecycleListings,
} from "../services/lostFoundService";
import { getColleges } from "../services/collegeService";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "electronics", label: "📱 Electronics" },
  { id: "cards-ids", label: "🪪 Cards & IDs" },
  { id: "keys", label: "🔑 Keys" },
  { id: "books-notes", label: "📚 Books & Notes" },
  { id: "clothing", label: "👕 Clothing" },
  { id: "accessories", label: "🎒 Accessories" },
  { id: "other", label: "📦 Other" },
];

export default function CampusHub() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Main Tab: 'lostfound' or 'freecycle'
  const [activeTab, setActiveTab] = useState("lostfound");

  // Lost & Found filters
  const [lfType, setLfType] = useState("all"); // 'all', 'lost', 'found'
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [colleges, setColleges] = useState([]);

  // Data states
  const [items, setItems] = useState([]);
  const [freecycleItems, setFreecycleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Report Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [reportForm, setReportForm] = useState({
    type: "lost",
    title: "",
    category: "electronics",
    location: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    securityQuestion: "",
    contactInfo: "",
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Claim Modal state
  const [claimModalItem, setClaimModalItem] = useState(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState("");

  // Load Colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const data = await getColleges();
        setColleges(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Colleges fetch error:", err);
      }
    };
    fetchColleges();
  }, []);

  // Set default college to user's college if available
  useEffect(() => {
    if (user?.college && !selectedCollege) {
      setSelectedCollege(user.college);
    }
  }, [user]);

  // Fetch Items based on Active Tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        if (activeTab === "lostfound") {
          const params = {};
          if (lfType !== "all") params.type = lfType;
          if (category !== "all") params.category = category;
          if (selectedCollege) params.college = selectedCollege;
          if (search.trim()) params.search = search.trim();

          const res = await getLostFoundItems(params);
          setItems(res.data || []);
        } else {
          const params = {};
          if (category !== "all") params.category = category;
          if (selectedCollege) params.college = selectedCollege;
          if (search.trim()) params.search = search.trim();

          const res = await getFreecycleListings(params);
          setFreecycleItems(res.data || []);
        }
      } catch (err) {
        console.error("Data fetch error:", err);
        setError("Failed to load campus items. Please make sure the backend server is running.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchData();
    }, 250);

    return () => clearTimeout(timer);
  }, [activeTab, lfType, category, selectedCollege, search]);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 3) {
      setFormError("Maximum 3 images allowed");
      return;
    }
    const updated = [...selectedImages, ...files];
    setSelectedImages(updated);
    setImagePreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    const updatedFiles = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedFiles);
    setImagePreviews(updatedFiles.map((f) => URL.createObjectURL(f)));
  };

  // Submit Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const formData = new FormData();
      Object.entries(reportForm).forEach(([key, val]) => {
        formData.append(key, val);
      });
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      const res = await createLostFoundItem(formData);
      setFormSuccess(res.message || "Submitted successfully!");

      // Refresh list
      setItems((prev) => [res.data, ...prev]);

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess("");
        setReportForm({
          type: "lost",
          title: "",
          category: "electronics",
          location: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          securityQuestion: "",
          contactInfo: "",
        });
        setSelectedImages([]);
        setImagePreviews([]);
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Resolved Status
  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === "open" ? "resolved" : "open";
    try {
      await updateLostFoundStatus(id, newStatus);
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Delete Item
  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await deleteLostFoundItem(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  // Submit Claim
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setClaimLoading(true);
      await claimLostFoundItem(claimModalItem._id, { message: claimMessage });
      setClaimFeedback("Notification sent! The poster has been notified.");
      setTimeout(() => {
        setClaimModalItem(null);
        setClaimMessage("");
        setClaimFeedback("");
      }, 1500);
    } catch (err) {
      setClaimFeedback(err.response?.data?.message || "Failed to send claim notification.");
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ==================================================== */}
      {/* HERO SECTION - MATCHING MARKETPLACE THEME */}
      {/* ==================================================== */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-50">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              CAMPUS COMMUNITY & CIRCULAR HUB
            </span>

            <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Lost & Found.
              <br />
              <span className="text-blue-200">
                Zero-Rupee Freecycle.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-blue-100 sm:text-lg">
              Reunite lost campus items with their rightful owners, or give away textbooks, lab gear, and dorm essentials for free to fellow students.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  if (!user) navigate("/login");
                  else setIsModalOpen(true);
                }}
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 active:scale-95"
              >
                + Report Lost / Found Item
              </button>

              <Link
                to="/create-listing"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-white/20 active:scale-95"
              >
                + Give Away Item (₹0 Free)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* MAIN CONTAINER */}
      {/* ==================================================== */}
      <main className="mx-auto max-w-7xl px-5 py-10">

        {/* ==================================================== */}
        {/* TABS & CAMPUS SELECTOR */}
        {/* ==================================================== */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Clean White/Blue Pill Tabs */}
          <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
            <button
              onClick={() => setActiveTab("lostfound")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "lostfound"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
              }`}
            >
              <span>🔍</span>
              Lost & Found Board
              <span
                className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === "lostfound"
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("freecycle")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "freecycle"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
              }`}
            >
              <span>🎁</span>
              Zero-Rupee Freecycle Hub
              <span
                className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === "freecycle"
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {freecycleItems.length}
              </span>
            </button>
          </div>

          {/* College Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Campus:
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">All Campuses</option>
              {colleges.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ==================================================== */}
        {/* SEARCH AND FILTERS CARD */}
        {/* ==================================================== */}
        <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Search Input */}
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
                placeholder={
                  activeTab === "lostfound"
                    ? "Search by item name or campus location (e.g. Library, Canteen, Audi)..."
                    : "Search free textbooks, lab coats, drafters, essentials..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Sub-Filters for Lost & Found */}
            {activeTab === "lostfound" && (
              <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setLfType("all")}
                  className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                    lfType === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All ({items.length})
                </button>

                <button
                  type="button"
                  onClick={() => setLfType("lost")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                    lfType === "lost"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Lost
                </button>

                <button
                  type="button"
                  onClick={() => setLfType("found")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                    lfType === "found"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Found
                </button>
              </div>
            )}
          </div>

          {/* Category Pills */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto border-t border-gray-100 pt-4 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  category === cat.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================== */}
        {/* LISTINGS / ITEMS GRID */}
        {/* ==================================================== */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
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
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-600">
              !
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
        ) : activeTab === "lostfound" ? (
          // ========================
          // LOST & FOUND GRID
          // ========================
          items.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                🔍
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900">
                No items reported
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                No matching lost or found reports found. Be the first to report an item!
              </p>
              <button
                onClick={() => {
                  if (!user) navigate("/login");
                  else setIsModalOpen(true);
                }}
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Report Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => {
                const isOwner = user?._id && item.user?._id && user._id === item.user._id;
                const isLost = item.type === "lost";

                return (
                  <article
                    key={item._id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                  >
                    <div>
                      {/* Image / Category Visual */}
                      <div className="relative h-52 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0].url}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-4xl text-gray-300">
                            {item.category === "electronics"
                              ? "📱"
                              : item.category === "cards-ids"
                              ? "🪪"
                              : item.category === "keys"
                              ? "🔑"
                              : item.category === "books-notes"
                              ? "📚"
                              : item.category === "clothing"
                              ? "👕"
                              : "📦"}
                            <span className="mt-2 text-xs font-medium text-gray-400 capitalize">
                              {item.category.replace("-", " ")}
                            </span>
                          </div>
                        )}

                        {/* Type Badge on Top-Left */}
                        <span
                          className={`absolute left-3 top-3 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur ${
                            isLost
                              ? "bg-red-50 text-red-600 border border-red-200/80"
                              : "bg-blue-50 text-blue-700 border border-blue-200/80"
                          }`}
                        >
                          {item.type}
                        </span>

                        {/* Resolved Badge on Top-Right */}
                        {item.status === "resolved" && (
                          <span className="absolute right-3 top-3 rounded-lg bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-green-400 backdrop-blur">
                            ✓ Reunited
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-semibold uppercase tracking-wider text-blue-600">
                            {item.category.replace("-", " ")}
                          </span>
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>

                        <h3 className="mt-2 text-base font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
                          {item.title}
                        </h3>

                        <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">📍</span>
                            <span className="font-medium text-gray-700 truncate">
                              {item.location}
                            </span>
                          </div>

                          {item.college?.name && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <span>🏛️</span>
                              <span className="truncate">{item.college.name}</span>
                            </div>
                          )}

                          {item.securityQuestion && (
                            <div className="mt-2 rounded-lg bg-blue-50/70 p-2 text-blue-800">
                              <span className="font-semibold">🔒 Proof required to claim</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-3.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {item.user?.name?.charAt(0) || "U"}
                        </div>
                        <span className="truncate text-xs font-medium text-gray-700">
                          {item.user?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(item._id, item.status)}
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                              {item.status === "open" ? "Mark Resolved" : "Re-open"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item._id)}
                              className="text-gray-400 hover:text-red-600 transition"
                              title="Delete Report"
                            >
                              🗑️
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!user) navigate("/login");
                              else setClaimModalItem(item);
                            }}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 ${
                              isLost ? "bg-blue-600" : "bg-blue-600"
                            }`}
                          >
                            {isLost ? "I Found This!" : "This is Mine!"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          // ========================
          // FREECYCLE ZERO-RUPEE HUB
          // ========================
          freecycleItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                🎁
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900">
                No Freecycle items available
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Have books, drafters, or notes you no longer need? Give them away to support fellow students!
              </p>
              <Link
                to="/create-listing"
                className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Give Away an Item (₹0)
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {freecycleItems.map((item) => (
                <article
                  key={item._id}
                  onClick={() => navigate(`/listings/${item._id}`)}
                  className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >
                  <div>
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].url}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-5xl text-blue-300">🎁</div>
                      )}

                      {/* ₹0 FREE Badge */}
                      <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm backdrop-blur">
                        ₹0 Free
                      </span>

                      {/* Condition badge */}
                      <span className="absolute right-3 top-3 rounded-lg bg-gray-900/80 px-2.5 py-1 text-xs font-semibold capitalize text-white backdrop-blur">
                        {item.condition}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        {item.category}
                      </span>

                      <h3 className="mt-2 text-base font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
                        {item.title}
                      </h3>

                      <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
                        Campus:{" "}
                        <span className="font-medium text-gray-700">
                          {item.college?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-3.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {item.seller?.name?.charAt(0) || "U"}
                      </div>
                      <span className="truncate text-xs font-medium text-gray-700">
                        {item.seller?.name}
                      </span>
                    </div>

                    <span className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                      Claim Item →
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {/* ==================================================== */}
        {/* REPORT MODAL */}
        {/* ==================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-2xl my-8">

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Report Campus Item
              </h2>
              <p className="mt-1 text-sm text-gray-500 mb-6">
                Fill in the details to help reunite this item with its student owner.
              </p>

              {formError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleReportSubmit} className="space-y-4">

                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Report Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReportForm({ ...reportForm, type: "lost" })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition ${
                        reportForm.type === "lost"
                          ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      I Lost Something
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportForm({ ...reportForm, type: "found" })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition ${
                        reportForm.type === "found"
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      I Found Something
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Item Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Casio fx-991EX Calculator or Blue Student ID Card"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={reportForm.category}
                      onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="electronics">📱 Electronics</option>
                      <option value="cards-ids">🪪 Cards & IDs</option>
                      <option value="keys">🔑 Keys</option>
                      <option value="books-notes">📚 Books & Notes</option>
                      <option value="clothing">👕 Clothing</option>
                      <option value="accessories">🎒 Accessories</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date {reportForm.type === "lost" ? "Lost" : "Found"} *
                    </label>
                    <input
                      type="date"
                      required
                      value={reportForm.date}
                      onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Location On Campus *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Library 2nd floor, or Main Canteen"
                    value={reportForm.location}
                    onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe distinguishing marks, stickers, color, or condition..."
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Security Question (Only for Found items) */}
                {reportForm.type === "found" && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                    <label className="block text-xs font-bold text-blue-900 mb-1">
                      🔒 Ownership Proof Question (Recommended)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., What sticker is on the back? / What name is written inside?"
                      value={reportForm.securityQuestion}
                      onChange={(e) => setReportForm({ ...reportForm, securityQuestion: e.target.value })}
                      className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs outline-none focus:border-blue-500"
                    />
                    <p className="mt-1 text-[11px] text-blue-700">
                      The claimant must answer this question to prove the item is theirs.
                    </p>
                  </div>
                )}

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Upload Photos (Max 3, Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {imagePreviews.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative h-14 w-14 rounded-xl overflow-hidden border border-gray-200">
                          <img src={src} alt="preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-0 right-0 bg-gray-900/80 text-white rounded-bl px-1.5 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* CLAIM / CONTACT MODAL */}
        {/* ==================================================== */}
        {claimModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-2xl">
              <button
                onClick={() => setClaimModalItem(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                {claimModalItem.type === "lost" ? "Report Found Item" : "Claim This Item"}
              </h2>
              <p className="mt-1 text-xs text-gray-500 mb-4">
                Regarding: <span className="font-semibold text-gray-800">{claimModalItem.title}</span>
              </p>

              {claimModalItem.securityQuestion && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 mb-4">
                  <span className="block text-xs font-bold text-blue-950 mb-1">
                    🔒 Proof Question from Finder:
                  </span>
                  <span className="text-xs text-blue-900">
                    {claimModalItem.securityQuestion}
                  </span>
                </div>
              )}

              {claimFeedback && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                  {claimFeedback}
                </div>
              )}

              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Message / Answer *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide your answer to verify ownership (or details on where you found it) and arrange a safe campus handover."
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setClaimModalItem(null)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {claimLoading ? "Sending..." : "Send to Poster"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
