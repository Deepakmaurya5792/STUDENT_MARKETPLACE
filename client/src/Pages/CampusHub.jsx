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
        setError("Failed to load campus items. Please ensure backend is running.");
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ==================================================== */}
        {/* HERO BANNER & STATS */}
        {/* ==================================================== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-8 sm:p-12 text-white shadow-xl mb-10">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200 backdrop-blur mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              CAMPUS REUSE & RECOVERY HUB
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Lost & Found & <span className="text-emerald-400">Zero-Rupee</span> Freecycle
            </h1>
            <p className="text-base sm:text-lg text-slate-200 mb-8 leading-relaxed">
              Reunite lost campus items with their rightful owners, or give away textbooks, lab gear, and dorm essentials for ₹0 to fellow students.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  if (!user) navigate("/login");
                  else setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 hover:shadow-emerald-500/40 active:scale-95"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Report Lost / Found Item
              </button>

              <Link
                to="/create-listing"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25 active:scale-95"
              >
                <span>🎁</span>
                Give Away Item (₹0 Free)
              </Link>
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute right-10 bottom-0 h-64 w-64 rounded-full bg-emerald-500/15 blur-2xl" />
        </div>

        {/* ==================================================== */}
        {/* TABS: LOST & FOUND vs FREECYCLE */}
        {/* ==================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 backdrop-blur">
            <button
              onClick={() => setActiveTab("lostfound")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "lostfound"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🔍</span>
              Lost & Found Board
              <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("freecycle")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "freecycle"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🎁</span>
              Zero-Rupee Freecycle Hub
              <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                {freecycleItems.length}
              </span>
            </button>
          </div>

          {/* College Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus:</span>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
        {/* SUB-FILTERS & SEARCH BAR */}
        {/* ==================================================== */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">

            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={
                  activeTab === "lostfound"
                    ? "Search lost or found items by name, location (e.g. library, canteen)..."
                    : "Search free books, drafters, essentials..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Sub-Filters for Lost & Found (Lost vs Found) */}
            {activeTab === "lostfound" && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setLfType("all")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    lfType === "all"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  onClick={() => setLfType("lost")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    lfType === "lost"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-rose-600 hover:bg-rose-50"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Lost
                </button>
                <button
                  onClick={() => setLfType("found")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    lfType === "found"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Found
                </button>
              </div>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-slate-100 mt-4 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  category === cat.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================== */}
        {/* LISTINGS GRID */}
        {/* ==================================================== */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-white p-5 shadow-sm animate-pulse border border-slate-200">
                <div className="h-40 bg-slate-200 rounded-xl mb-4" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        ) : activeTab === "lostfound" ? (
          // ========================
          // LOST & FOUND GRID
          // ========================
          items.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl mb-4">
                🔍
              </div>
              <h3 className="text-lg font-bold text-slate-800">No items found</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                No matching lost or found reports for the selected filters. Be the first to report an item!
              </p>
              <button
                onClick={() => {
                  if (!user) navigate("/login");
                  else setIsModalOpen(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                + Report Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const isOwner = user?._id && item.user?._id && user._id === item.user._id;
                const isLost = item.type === "lost";

                return (
                  <div
                    key={item._id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-slate-300"
                  >
                    <div>
                      {/* Image or Category Placeholder */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0].url}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="text-4xl text-slate-300">
                            {item.category === "electronics"
                              ? "📱"
                              : item.category === "cards-ids"
                              ? "🪪"
                              : item.category === "keys"
                              ? "🔑"
                              : item.category === "books-notes"
                              ? "📚"
                              : "📦"}
                          </div>
                        )}

                        {/* Lost / Found Badge */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur ${
                              isLost
                                ? "bg-rose-500/90 text-white"
                                : "bg-emerald-600/90 text-white"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            {item.type}
                          </span>
                        </div>

                        {/* Resolved Badge */}
                        {item.status === "resolved" && (
                          <div className="absolute top-3 right-3">
                            <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur">
                              ✓ Reunited / Resolved
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span className="font-semibold uppercase tracking-wider text-blue-600">
                            {item.category.replace("-", " ")}
                          </span>
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-2">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex flex-col gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5">
                            <span>📍</span>
                            <span className="font-medium text-slate-700 truncate">
                              {item.location}
                            </span>
                          </div>

                          {item.college?.name && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span>🏛️</span>
                              <span className="truncate">{item.college.name}</span>
                            </div>
                          )}

                          {item.securityQuestion && (
                            <div className="flex items-center gap-1 text-amber-700 bg-amber-50 rounded-lg p-2 mt-1">
                              <span>🔒</span>
                              <span className="truncate font-medium">
                                Proof question set by finder
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {item.user?.name?.charAt(0) || "U"}
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {item.user?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isOwner ? (
                          <>
                            <button
                              onClick={() => handleStatusToggle(item._id, item.status)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            >
                              {item.status === "open" ? "Mark Resolved" : "Re-open"}
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                              title="Delete Report"
                            >
                              🗑️
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              if (!user) navigate("/login");
                              else setClaimModalItem(item);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg text-white shadow-sm transition active:scale-95 ${
                              isLost
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {isLost ? "I Found This!" : "This is Mine!"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // ========================
          // FREECYCLE ZERO-RUPEE HUB
          // ========================
          freecycleItems.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl mb-4">
                🎁
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Freecycle items yet</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                Got old textbooks, lab coats, drafters, or notes you no longer need? Give them away to support fellow students!
              </p>
              <Link
                to="/create-listing"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                + Give Away an Item (₹0)
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freecycleItems.map((item) => (
                <div
                  key={item._id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-emerald-300"
                >
                  <div>
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].url}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-5xl text-emerald-300">🎁</div>
                      )}

                      {/* ₹0 FREE Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-md">
                          ₹0 FREE
                        </span>
                      </div>

                      {/* Condition badge */}
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-semibold text-white capitalize backdrop-blur">
                          {item.condition}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                        {item.category}
                      </span>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-1 mt-1 mb-2">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {item.description}
                      </p>

                      <div className="text-xs text-slate-400">
                        Campus: <span className="text-slate-600 font-medium">{item.college?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {item.seller?.name?.charAt(0) || "U"}
                      </div>
                      <span className="text-xs font-medium text-slate-700 truncate">
                        {item.seller?.name}
                      </span>
                    </div>

                    <Link
                      to={`/listings/${item._id}`}
                      className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                    >
                      Claim Item →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ==================================================== */}
        {/* REPORT MODAL */}
        {/* ==================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl my-8">

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Report Campus Item
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Post details to help reunite this item with its student owner.
              </p>

              {formError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleReportSubmit} className="space-y-4">

                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Report Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReportForm({ ...reportForm, type: "lost" })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition ${
                        reportForm.type === "lost"
                          ? "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>🔴</span> I Lost Something
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportForm({ ...reportForm, type: "found" })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition ${
                        reportForm.type === "found"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>🟢</span> I Found Something
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Boat Airdopes Case (Black) or College ID Card"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={reportForm.category}
                      onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date {reportForm.type === "lost" ? "Lost" : "Found"} *
                    </label>
                    <input
                      type="date"
                      required
                      value={reportForm.date}
                      onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location On Campus *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Library 2nd floor silent study room, or Main Canteen"
                    value={reportForm.location}
                    onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe distinguishing marks, scratches, color, stickers..."
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Security Question (Only for Found items) */}
                {reportForm.type === "found" && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      🔒 Ownership Verification Question (Recommended)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., What sticker is on the back? / What's the brand written inside?"
                      value={reportForm.securityQuestion}
                      onChange={(e) => setReportForm({ ...reportForm, securityQuestion: e.target.value })}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500"
                    />
                    <p className="text-[11px] text-amber-700 mt-1">
                      Prevents strangers from falsely claiming valuable items.
                    </p>
                  </div>
                )}

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Upload Photos (Max 3, Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreviews.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-slate-200">
                          <img src={src} alt="preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-0 right-0 bg-slate-900/70 text-white rounded-bl px-1 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
              <button
                onClick={() => setClaimModalItem(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {claimModalItem.type === "lost" ? "Report Found Item" : "Claim This Item"}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Regarding: <span className="font-semibold text-slate-800">{claimModalItem.title}</span>
              </p>

              {claimModalItem.securityQuestion && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4">
                  <span className="block text-xs font-bold text-amber-900">
                    🔒 Proof Question:
                  </span>
                  <span className="text-xs text-amber-800">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Message / Answer *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Explain how to verify it's yours (or where you found it) and how you can meet on campus to hand it over."
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setClaimModalItem(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    {claimLoading ? "Sending..." : "Send to Poster"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
